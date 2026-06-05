import { _decorator, Node, Tween, UITransform, Vec3, tween, view } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackPhase } from '../../core/types/AttackTypes';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageChannel } from '../../core/types/DamageChannel';
import { MathUtils } from '../../core/utils/MathUtils';
import { spawnRadialExplosionBurst } from '../../effects/ProceduralExplosionEffect';
import { ArcPath } from '../../movement/paths/ArcPath';
import { getVisibleAreaRect, isNodeFullyOutsideVisibleArea } from './ProjectileViewportCulling';
import { AreaImpactRadiusReceiver, ProjectileDestinationReceiver } from '../base/ProjectileAttackContract';
import { StatusApplyInfo } from '../../combat/StatusApplyInfo';
import { StatusEffectType } from '../../core/types/StatusEffectType';

const { ccclass, property } = _decorator;

@ccclass('ChiliBombProjectile')
export class ChiliBombProjectile extends AttackBase implements ProjectileDestinationReceiver, AreaImpactRadiusReceiver {
    @property
    travelSpeed: number = 640;

    @property
    arcHeight: number = 280;

    @property
    rotateSpeed: number = 18;

    @property
    autoFaceDirection: boolean = true;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private impactAoeRadius: number = 0;
    private landingWorldPos: Vec3 | null = null;
    private path: ArcPath | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    public setDestinationWorldPos(destinationWorldPos: Vec3): void {
        this.landingWorldPos = destinationWorldPos.clone();
    }

    public setAreaImpactRadius(radius: number): void {
        this.impactAoeRadius = Math.max(0, radius);
    }

    public startAttack(context: AttackContext): void {
        const finalLandingWorldPos = this.landingWorldPos
            ?? context.destinationWorldPos
            ?? context.targetNode?.worldPosition.clone()
            ?? null;

        if (!finalLandingWorldPos) {
            this.node.destroy();
            return;
        }

        this.attackContext = context;
        this.isAttackActive = true;
        this.path = new ArcPath(context.spawnWorldPos, finalLandingWorldPos, this.arcHeight);
        this.previousWorldPos = context.spawnWorldPos.clone();

        this.node.setWorldPosition(context.spawnWorldPos);
        this.node.active = true;

        const travelDuration = this.buildTravelDuration();
        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(travelDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAttackActive || !this.attackContext || !this.path) return;

                    const currentWorldPos = this.path.getPosition(ratio);
                    this.node.setWorldPosition(currentWorldPos);

                    if (this.autoFaceDirection) {
                        this.faceAlongTravel(this.previousWorldPos, currentWorldPos);
                    } else if (this.rotateSpeed !== 0) {
                        this.node.angle -= this.rotateSpeed;
                    }

                    if (this.shouldCullOutsideVisibleArea()) {
                        this.stopAttack();
                        return;
                    }

                    this.previousWorldPos = currentWorldPos.clone();
                },
            })
            .call(() => {
                if (!this.attackContext || !this.landingWorldPos) {
                    this.stopAttack();
                    return;
                }

                this.applyExplosionAtWorldPos(this.landingWorldPos, AttackPhase.Impact);
                this.stopAttack();
            })
            .start();
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) return;

        this.cleanupRuntimeState();
        this.node.destroy();
    }

    protected onDestroy(): void {
        this.cleanupRuntimeState();
    }

    private faceAlongTravel(previousWorldPos: Vec3, currentWorldPos: Vec3): void {
        const dx = currentWorldPos.x - previousWorldPos.x;
        const dy = currentWorldPos.y - previousWorldPos.y;

        if (dx === 0 && dy === 0) {
            return;
        }

        this.node.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    }

    private buildTravelDuration(): number {
        const estimatedDistance = this.estimateArcTravelDistance();
        const safeTravelSpeed = Math.max(1, this.travelSpeed);
        return Math.max(0.01, estimatedDistance / safeTravelSpeed);
    }

    private estimateArcTravelDistance(sampleCount: number = 16): number {
        if (!this.path) {
            return 0;
        }

        let distance = 0;
        let previousWorldPos = this.path.getPosition(0);

        for (let index = 1; index <= sampleCount; index++) {
            const currentWorldPos = this.path.getPosition(index / sampleCount);
            distance += Vec3.distance(previousWorldPos, currentWorldPos);
            previousWorldPos = currentWorldPos;
        }

        return distance;
    }

    private cleanupRuntimeState(): void {
        Tween.stopAllByTarget(this.node);
        this.impactAoeRadius = 0;
        this.landingWorldPos = null;
        this.path = null;
        this.previousWorldPos = new Vec3();
        this.attackContext = null;
        this.isAttackActive = false;
    }

    private applyExplosionAtWorldPos(hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.attackContext) return;

        this.spawnExplosionBurstVisual(hitWorldPos);
        this.applyExplosionDamageAtWorldPos(hitWorldPos, phase);
    }

    private applyExplosionDamageAtWorldPos(hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.attackContext) return;

        const targets = EnemyRegistry.getDamageableTargets(DamageChannel.Area);

        for (const hurtbox of targets) {
            const target = hurtbox.node;
            if (!target || !target.isValid || target === this.attackContext.attackerNode) continue;

            const center = hurtbox.getWorldCenter();
            const combinedRadius = this.impactAoeRadius + hurtbox.getHitRadius();
            if (MathUtils.distanceSq2D(hitWorldPos, center) > combinedRadius * combinedRadius) {
                continue;
            }

            const hitInfo = new HitInfo({
                attackerNode: this.attackContext.attackerNode,
                targetNode: target,
                hitWorldPos: hitWorldPos.clone(),
                attackDamage: this.attackContext.attackDamage,
                phase,
                statusApplyList: this.buildBurningStatusApplyList(),
            });

            DamageResolver.applyDamage(hitInfo);
        }
    }

    private shouldCullOutsideVisibleArea(): boolean {
        if (!this.destroyWhenExitVisibleArea) {
            return false;
        }

        const uiTransform = this.node.getComponent(UITransform);
        return isNodeFullyOutsideVisibleArea(uiTransform, getVisibleAreaRect(view));
    }

    private spawnExplosionBurstVisual(hitWorldPos: Vec3): void {
        spawnRadialExplosionBurst(this.node.parent, hitWorldPos, this.impactAoeRadius);
    }

    private buildBurningStatusApplyList(): StatusApplyInfo[] {
        if (!this.attackContext) {
            return [];
        }

        return [
            new StatusApplyInfo({
                effectType: StatusEffectType.Burning,
                durationSeconds: 3,
                tickIntervalSeconds: 0.5,
                tickDamageRatio: 0.3,
                sourceWeaponId: this.attackContext.attackDamage.sourceWeaponId,
            }),
        ];
    }
}
