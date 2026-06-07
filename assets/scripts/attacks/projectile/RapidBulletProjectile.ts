import { _decorator, Node, Vec3 } from 'cc';
import { WeaponConfigTable } from '../../config/WeaponConfigTable';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { DamageChannel } from '../../core/types/DamageChannel';
import { MathUtils } from '../../core/utils/MathUtils';
import { EnemyMovement } from '../../enemy/base/EnemyMovement';
import { DirectHitProjectile } from './DirectHitProjectile';
import { AttackPhase } from '../../core/types/AttackTypes';

const { ccclass } = _decorator;

@ccclass('RapidBulletProjectile')
export class RapidBulletProjectile extends DirectHitProjectile {
    protected onFirstHit(target: Node, hitWorldPos: Vec3, phase: AttackPhase): void {
        this.applyDamageToTarget(target, hitWorldPos, phase);
        this.applyConfiguredKnockback(hitWorldPos);
        this.stopAttack();
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

            const distanceRatio = Math.min(1, Math.sqrt(distanceSq) / knockbackRadius);
            const appliedDistance = knockbackDistance * (1 - (1 - edgeDistanceScale) * distanceRatio);
            enemyMovement.applyKnockback(projectileDirectionWorldVec, appliedDistance);
        }
    }
}
