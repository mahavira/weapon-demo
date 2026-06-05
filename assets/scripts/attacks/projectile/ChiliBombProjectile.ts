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

const { ccclass, property } = _decorator;

@ccclass('ChiliBombProjectile')
export class ChiliBombProjectile extends AttackBase {
    @property
    flyDuration: number = 1.5;

    @property
    arcHeight: number = 280;

    @property
    rotateSpeed: number = 18;

    @property
    autoFaceDirection: boolean = true;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private impactAoeRadius: number = 0;
    private endWorldPos: Vec3 | null = null;
    private path: ArcPath | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    public setEndWorldPos(endWorldPos: Vec3): void {
        this.endWorldPos = endWorldPos.clone();
    }

    public setImpactAoeRadius(radius: number): void {
        this.impactAoeRadius = Math.max(0, radius);
    }

    public startAttack(context: AttackContext): void {
        const finalEndWorldPos = this.endWorldPos ?? context.endWorldPos ?? context.target?.worldPosition.clone() ?? null;

        if (!finalEndWorldPos) {
            this.node.destroy();
            return;
        }

        this.context = context;
        this.isAlive = true;
        this.path = new ArcPath(context.startWorldPos, finalEndWorldPos, this.arcHeight);
        this.previousWorldPos = context.startWorldPos.clone();

        this.node.setWorldPosition(context.startWorldPos);
        this.node.active = true;

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(this.flyDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAlive || !this.context || !this.path) return;

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
                if (!this.context || !this.endWorldPos) {
                    this.stopAttack();
                    return;
                }

                this.applyExplosionAtWorldPos(this.endWorldPos, AttackPhase.Impact);
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

    private cleanupRuntimeState(): void {
        Tween.stopAllByTarget(this.node);
        this.impactAoeRadius = 0;
        this.endWorldPos = null;
        this.path = null;
        this.previousWorldPos = new Vec3();
        this.context = null;
        this.isAlive = false;
    }

    private applyExplosionAtWorldPos(hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.context) return;

        this.spawnExplosionBurstVisual(hitWorldPos);
        this.applyExplosionDamageAtWorldPos(hitWorldPos, phase);
    }

    private applyExplosionDamageAtWorldPos(hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.context) return;

        const targets = EnemyRegistry.getDamageableTargets(DamageChannel.Area);

        for (const hurtbox of targets) {
            const target = hurtbox.node;
            if (!target || !target.isValid || target === this.context.attacker) continue;

            const center = hurtbox.getWorldCenter();
            const combinedRadius = this.impactAoeRadius + hurtbox.getHitRadius();
            if (MathUtils.distanceSq2D(hitWorldPos, center) > combinedRadius * combinedRadius) {
                continue;
            }

            const hitInfo = new HitInfo({
                attacker: this.context.attacker,
                target,
                hitWorldPos: hitWorldPos.clone(),
                damageInfo: this.context.damageInfo,
                phase,
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
}
