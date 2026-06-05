import { _decorator, Node, Vec3 } from 'cc';
import { BeamRuntimeConfigReceiver } from './BeamAttackContract';
import { BeamVisualRenderer } from './BeamVisualRenderer';
import { AttackBase } from './base/AttackBase';
import { AttackContext } from './base/AttackContext';
import { EnemyRegistry } from '../combat/EnemyRegistry';
import { DamageInfo } from '../combat/DamageInfo';
import { DamageResolver } from '../combat/DamageResolver';
import { HitInfo } from '../combat/HitInfo';
import { EnemyVisual } from '../enemy/base/EnemyVisual';
import { sampleBeamHits } from '../combat/BeamHitSampler';
import { WeaponBeamConfig } from '../config/WeaponConfigTable';
import { AttackPhase } from '../core/types/AttackTypes';
import { DamageChannel } from '../core/types/DamageChannel';

const { ccclass, property } = _decorator;

@ccclass('SunflowerSpotlightBeam')
export class SunflowerSpotlightBeam extends AttackBase implements BeamRuntimeConfigReceiver {
    @property
    durationSeconds: number = 3;

    @property
    tickIntervalSeconds: number = 0.25;

    @property
    beamWidth: number = 18;

    @property
    beamWidthMultiplier: number = 1;

    @property
    beamRange: number = 1020;

    private currentTargetNode: Node | null = null;
    private elapsedSeconds: number = 0;
    private tickElapsedSeconds: number = 0;
    private beamEndWorldPos: Vec3 = new Vec3();
    private beamImpactWorldPos: Vec3 = new Vec3();
    private readonly visualRenderer = new BeamVisualRenderer();

    public setBeamConfig(beamConfig: WeaponBeamConfig): void {
        if (beamConfig.durationSeconds !== undefined) {
            this.durationSeconds = beamConfig.durationSeconds;
        }

        if (beamConfig.tickIntervalSeconds !== undefined) {
            this.tickIntervalSeconds = beamConfig.tickIntervalSeconds;
        }

        if (beamConfig.beamWidth !== undefined) {
            this.beamWidth = beamConfig.beamWidth;
        }

        if (beamConfig.beamWidthMultiplier !== undefined) {
            this.beamWidthMultiplier = beamConfig.beamWidthMultiplier;
        }

        if (beamConfig.beamRange !== undefined) {
            this.beamRange = beamConfig.beamRange;
        }
    }

    public startAttack(attackContext: AttackContext): void {
        this.attackContext = attackContext;
        this.isAttackActive = true;
        this.elapsedSeconds = 0;
        this.tickElapsedSeconds = 0;
        this.currentTargetNode = attackContext.targetNode?.isValid ? attackContext.targetNode : null;
        this.visualRenderer.cacheVisualLayers(this.node);

        if (!this.tryRefreshLockedBeamPath()) {
            this.stopAttack();
            return;
        }

        this.node.active = true;
        this.applyBeamDamageTick();
        this.drawBeamVisuals();
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) {
            return;
        }

        this.cleanupRuntimeState();
        this.node.destroy();
    }

    protected onDestroy(): void {
        this.cleanupRuntimeState();
    }

    protected update(deltaSeconds: number): void {
        if (!this.isAttackActive || !this.attackContext) {
            return;
        }

        this.elapsedSeconds += deltaSeconds;
        this.tickElapsedSeconds += deltaSeconds;

        if (this.elapsedSeconds >= Math.max(0.01, this.durationSeconds)) {
            this.stopAttack();
            return;
        }

        if (!this.tryRefreshLockedBeamPath()) {
            this.stopAttack();
            return;
        }

        const safeTickInterval = Math.max(0.01, this.tickIntervalSeconds);
        while (this.tickElapsedSeconds >= safeTickInterval) {
            this.tickElapsedSeconds -= safeTickInterval;
            this.applyBeamDamageTick();
        }

        this.drawBeamVisuals();
    }

    private tryRefreshLockedBeamPath(): boolean {
        if (!this.attackContext) {
            return false;
        }

        if (!this.currentTargetNode || !this.currentTargetNode.isValid) {
            return this.hasLockedBeamPath();
        }

        const sourceWorldPos = this.attackContext.spawnWorldPos;
        const targetWorldPos = this.currentTargetNode.worldPosition.clone();
        const directionX = targetWorldPos.x - sourceWorldPos.x;
        const directionY = targetWorldPos.y - sourceWorldPos.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);

        if (directionLength <= 0.001) {
            this.beamEndWorldPos.set(sourceWorldPos.x, sourceWorldPos.y + this.beamRange, sourceWorldPos.z);
            this.beamImpactWorldPos.set(sourceWorldPos);
            return true;
        }

        const normalizedX = directionX / directionLength;
        const normalizedY = directionY / directionLength;
        this.beamEndWorldPos.set(
            sourceWorldPos.x + normalizedX * this.beamRange,
            sourceWorldPos.y + normalizedY * this.beamRange,
            sourceWorldPos.z
        );
        this.beamImpactWorldPos.set(targetWorldPos);
        return true;
    }

    private applyBeamDamageTick(): void {
        if (!this.attackContext) {
            return;
        }

        const scaledBeamWidth = this.getScaledBeamWidth();
        const beamRadius = Math.max(1, scaledBeamWidth * 0.5);
        const beamHits = sampleBeamHits(
            this.attackContext.spawnWorldPos,
            this.beamEndWorldPos,
            beamRadius,
            EnemyRegistry.getDamageableTargets(DamageChannel.Beam)
                .map((hurtbox) => ({
                    target: hurtbox.node,
                    center: hurtbox.getWorldCenter(),
                    radius: hurtbox.getHitRadius(),
                }))
                .filter((beamTarget) => beamTarget.target?.isValid && beamTarget.target !== this.attackContext?.attackerNode)
        );

        for (const beamHit of beamHits) {
            const targetNode = beamHit.target;
            if (!targetNode || !targetNode.isValid) {
                continue;
            }

            const hitWorldPos = new Vec3(
                beamHit.hitWorldPos.x,
                beamHit.hitWorldPos.y,
                this.attackContext.spawnWorldPos.z
            );

            const hitInfo = new HitInfo({
                attackerNode: this.attackContext.attackerNode,
                targetNode,
                hitWorldPos,
                attackDamage: this.buildTickDamageInfo(),
                phase: AttackPhase.Tick,
            });

            DamageResolver.applyDamage(hitInfo);
            targetNode.getComponentInChildren(EnemyVisual)?.playBeamScorch(scaledBeamWidth);
        }

        this.visualRenderer.spawnImpactSparkShards(this.node, this.beamImpactWorldPos, this.elapsedSeconds);
    }

    private drawBeamVisuals(): void {
        if (!this.attackContext) {
            return;
        }

        this.visualRenderer.draw(this.node, {
            sourceWorldPos: this.attackContext.spawnWorldPos,
            beamEndWorldPos: this.beamEndWorldPos,
            beamImpactWorldPos: this.beamImpactWorldPos,
            elapsedSeconds: this.elapsedSeconds,
            beamWidth: this.getScaledBeamWidth(),
        });
    }

    private buildTickDamageInfo(): DamageInfo {
        if (!this.attackContext) {
            throw new Error('Beam damage requested without attackContext');
        }

        return this.attackContext.attackDamage.cloneWithAmount(this.attackContext.attackDamage.amount);
    }

    private getScaledBeamWidth(): number {
        return this.beamWidth * Math.max(0.01, this.beamWidthMultiplier);
    }

    private hasLockedBeamPath(): boolean {
        return this.beamEndWorldPos.x !== 0
            || this.beamEndWorldPos.y !== 0
            || this.beamEndWorldPos.z !== 0;
    }

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        this.attackContext = null;
        this.currentTargetNode = null;
        this.elapsedSeconds = 0;
        this.tickElapsedSeconds = 0;
        this.beamEndWorldPos = new Vec3();
        this.beamImpactWorldPos = new Vec3();
        this.visualRenderer.cleanup(this.node);
    }
}
