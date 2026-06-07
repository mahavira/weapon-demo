import { _decorator, Node, Vec3 } from 'cc';
import { DamageResolver } from '../../combat/DamageResolver';
import { WeaponConfigTable } from '../../config/WeaponConfigTable';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { DamageChannel } from '../../core/types/DamageChannel';
import { HitInfo } from '../../combat/HitInfo';
import { MathUtils } from '../../core/utils/MathUtils';
import { EnemyMovement } from '../../enemy/base/EnemyMovement';
import { spawnRadialExplosionBurst } from '../../effects/ProceduralExplosionEffect';
import { DirectHitProjectile } from './DirectHitProjectile';
import { AttackPhase } from '../../core/types/AttackTypes';
import {
    buildKnockbackCannonAreaDamage,
    resolveKnockbackCannonDistance,
} from './KnockbackCannonImpact';

const { ccclass } = _decorator;

@ccclass('KnockbackCannonProjectile')
export class KnockbackCannonProjectile extends DirectHitProjectile {
    protected onFirstHit(_target: Node, hitWorldPos: Vec3, phase: AttackPhase): void {
        this.applyConfiguredAreaDamage(hitWorldPos, phase);
        this.applyConfiguredKnockback(hitWorldPos);
        this.stopAttack();
    }

    private applyConfiguredAreaDamage(hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.attackContext) {
            return;
        }

        const impactConfig = WeaponConfigTable[this.attackContext.sourceWeaponId]?.impact;
        const impactRadius = Math.max(0, impactConfig?.aoeRadius ?? 0);
        const edgeDamageScale = Math.max(0, Math.min(1, impactConfig?.edgeDamageScale ?? 0));
        if (impactRadius <= 0) {
            return;
        }

        this.spawnImpactBurstVisual(hitWorldPos, impactRadius);

        for (const hurtbox of EnemyRegistry.getDamageableTargets(DamageChannel.Area)) {
            const targetNode = hurtbox.node;
            if (!targetNode || !targetNode.isValid || targetNode === this.attackContext.attackerNode) {
                continue;
            }

            const targetCenterWorldPos = hurtbox.getWorldCenter();
            const targetHitRadius = Math.max(0, hurtbox.getHitRadius());
            const combinedRadius = impactRadius + targetHitRadius;
            const centerDistanceSq = MathUtils.distanceSq2D(hitWorldPos, targetCenterWorldPos);
            if (centerDistanceSq > combinedRadius * combinedRadius) {
                continue;
            }

            const damageInfo = buildKnockbackCannonAreaDamage(
                this.attackContext.attackDamage,
                Math.sqrt(centerDistanceSq),
                impactRadius,
                targetHitRadius,
                edgeDamageScale
            );
            if (damageInfo.amount <= 0) {
                continue;
            }

            const hitInfo = new HitInfo({
                attackerNode: this.attackContext.attackerNode,
                targetNode,
                hitWorldPos: hitWorldPos.clone(),
                attackDamage: damageInfo,
                phase,
            });
            DamageResolver.applyDamage(hitInfo);
        }
    }

    private applyConfiguredKnockback(hitWorldPos: Vec3): void {
        const sourceWeaponId = this.attackContext?.sourceWeaponId;
        const spawnWorldPos = this.attackContext?.spawnWorldPos.clone();
        const destinationWorldPos = this.attackContext?.destinationWorldPos?.clone();
        if (!sourceWeaponId || !spawnWorldPos || !destinationWorldPos) {
            return;
        }

        const projectileDirectionWorldVec = destinationWorldPos.subtract(spawnWorldPos);
        const knockbackConfig = WeaponConfigTable[sourceWeaponId]?.knockback;
        if (!knockbackConfig) {
            return;
        }

        const knockbackRadius = Math.max(0, knockbackConfig.radius ?? 0);
        const knockbackDistance = Math.max(0, knockbackConfig.distance ?? 0);
        const edgeDistanceScale = Math.max(0, Math.min(1, knockbackConfig.edgeDistanceScale ?? 0));
        if (knockbackRadius <= 0 || knockbackDistance <= 0) {
            return;
        }

        const radiusSq = knockbackRadius * knockbackRadius;
        for (const hurtbox of EnemyRegistry.getDamageableTargets(DamageChannel.Projectile)) {
            const targetNode = hurtbox.node;
            if (!targetNode || !targetNode.isValid) {
                continue;
            }

            const targetCenterWorldPos = hurtbox.getWorldCenter();
            const distanceSq = MathUtils.distanceSq2D(hitWorldPos, targetCenterWorldPos);
            if (distanceSq > radiusSq) {
                continue;
            }

            const enemyMovement = targetNode.getComponent(EnemyMovement);
            if (!enemyMovement) {
                continue;
            }

            const appliedDistance = resolveKnockbackCannonDistance(
                knockbackDistance,
                edgeDistanceScale,
                Math.sqrt(distanceSq),
                knockbackRadius
            );
            enemyMovement.applyKnockback(projectileDirectionWorldVec, appliedDistance);
        }
    }

    private spawnImpactBurstVisual(hitWorldPos: Vec3, impactRadius: number): void {
        spawnRadialExplosionBurst(this.node.parent, hitWorldPos, impactRadius);
    }
}
