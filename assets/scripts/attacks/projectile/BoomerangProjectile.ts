import { _decorator, Vec3, tween, Tween, Node, UITransform, view } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackHitTracker } from '../base/AttackHitTracker';
import { AttackPhase } from '../../core/types/AttackTypes';
import { BoomerangPath } from '../../movement/paths/BoomerangPath';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageInfo } from '../../combat/DamageInfo';
import { HitSystem } from '../../combat/HitSystem';
import { PENETRATING_PER_PHASE_POLICY } from '../../combat/HitPolicy';
import { DamageChannel } from '../../core/types/DamageChannel';
import { getVisibleAreaRect, isNodeFullyOutsideVisibleArea } from './ProjectileViewportCulling';
import { BoomerangRuntimeConfig, buildBoomerangRuntimeConfig } from '../BoomerangRuntimeConfig';

const { ccclass, property } = _decorator;

@ccclass('BoomerangProjectile')
export class BoomerangProjectile extends AttackBase {
    @property
    forwardTravelDuration: number = 0.75;

    @property
    returnDuration: number = 0.65;

    @property
    sideOffset: number = 220;

    @property
    topOffset: number = 100;

    @property
    hitRadius: number = 60;

    @property
    rotateSpeed: number = 18;

    @property
    returnDamageScale: number = 1;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private hitTracker = new AttackHitTracker<Node>();
    private path: BoomerangPath | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    public configureBoomerang(params: Partial<BoomerangRuntimeConfig>): void {
        const runtimeConfig = buildBoomerangRuntimeConfig(params);
        this.forwardTravelDuration = runtimeConfig.forwardTravelDuration;
        this.returnDuration = runtimeConfig.returnDuration;
        this.sideOffset = runtimeConfig.sideOffset;
        this.topOffset = runtimeConfig.topOffset;
        this.hitRadius = runtimeConfig.hitRadius;
        this.rotateSpeed = runtimeConfig.rotateSpeed;
        this.returnDamageScale = runtimeConfig.returnDamageScale;
        this.destroyWhenExitVisibleArea = runtimeConfig.destroyWhenExitVisibleArea;
    }

    public startAttack(context: AttackContext): void {
        if (!context.destinationWorldPos) {
            this.releaseAttackNode();
            return;
        }

        this.attackContext = context;
        this.isAttackActive = true;
        this.hitTracker.clear();

        this.path = new BoomerangPath({
            startWorldPos: context.spawnWorldPos,
            targetWorldPos: context.destinationWorldPos,
            sideOffset: this.sideOffset,
            topOffset: this.topOffset,
        });

        this.node.setWorldPosition(context.spawnWorldPos);
        this.previousWorldPos = context.spawnWorldPos.clone();
        this.node.angle = 0;
        this.node.active = true;

        const totalDuration = this.forwardTravelDuration + this.returnDuration;
        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(totalDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAttackActive || !this.attackContext || !this.path) return;

                    const elapsed = ratio * totalDuration;
                    const phase = elapsed <= this.forwardTravelDuration ? AttackPhase.Forward : AttackPhase.Return;
                    const t = phase === AttackPhase.Forward
                        ? elapsed / this.forwardTravelDuration
                        : (elapsed - this.forwardTravelDuration) / this.returnDuration;

                    const currentWorldPos = this.path.getPosition(phase, t);
                    this.node.setWorldPosition(currentWorldPos);
                    this.node.angle -= this.rotateSpeed;

                    if (this.shouldCullOutsideVisibleArea()) {
                        this.stopAttack();
                        return;
                    }

                    this.checkHit(this.previousWorldPos, currentWorldPos, phase);
                    this.previousWorldPos = currentWorldPos.clone();
                },
            })
            .call(() => this.stopAttack())
            .start();
    }

    private checkHit(previousWorldPos: Vec3, currentWorldPos: Vec3, phase: AttackPhase) {
        if (!this.attackContext) return;

        const hits = HitSystem.sampleHits({
            attackId: this.node.uuid,
            attackerNode: this.attackContext.attackerNode,
            phase,
            previousWorldPos,
            currentWorldPos,
            sweepRadius: this.hitRadius,
            damageChannel: DamageChannel.Projectile,
            policy: PENETRATING_PER_PHASE_POLICY,
            hitTracker: this.hitTracker,
        });

        for (const hit of hits) {
            this.hitTracker.markHit(phase, hit.target);
            this.handleHit(hit.target, hit.hitWorldPos, phase);
        }
    }

    private handleHit(target: Node, hitWorldPos: Vec3, phase: AttackPhase) {
        if (!this.attackContext) return;

        const damageInfo = this.createPhaseDamageInfo(phase);
        const hitInfo = new HitInfo({
            attackerNode: this.attackContext.attackerNode,
            targetNode: target,
            hitWorldPos: hitWorldPos.clone(),
            attackDamage: damageInfo,
            phase,
        });

        DamageResolver.applyDamage(hitInfo);
    }

    private createPhaseDamageInfo(phase: AttackPhase): DamageInfo {
        if (!this.attackContext) {
            throw new Error('BoomerangProjectile missing context');
        }

        if (phase === AttackPhase.Return) {
            return this.attackContext.attackDamage.cloneWithAmount(
                Math.floor(this.attackContext.attackDamage.amount * this.returnDamageScale)
            );
        }

        return this.attackContext.attackDamage;
    }

    private shouldCullOutsideVisibleArea(): boolean {
        if (!this.destroyWhenExitVisibleArea) {
            return false;
        }

        const uiTransform = this.node.getComponent(UITransform);
        return isNodeFullyOutsideVisibleArea(uiTransform, getVisibleAreaRect(view));
    }

    public stopAttack(): void {
        this.cleanupRuntimeState();
        this.releaseAttackNode();
    }

    protected onDestroy() {
        this.cleanupRuntimeState();
    }

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        Tween.stopAllByTarget(this.node);
        this.attackContext = null;
        this.path = null;
        this.previousWorldPos = new Vec3();
        this.hitTracker.clear();
    }
}
