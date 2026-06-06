import type { HitInfo } from './HitInfo.ts';
import { EnemyDamageResult, EnemyHealth } from '../enemy/base/EnemyHealth';
import { EnemyVisual } from '../enemy/base/EnemyVisual';
import { EnemyStatusController } from '../enemy/base/EnemyStatusController';
import { forwardStatusApplyList } from './StatusApplyForwarding';

export class DamageResolver {
    public static applyDamage(hitInfo: HitInfo) {
        const enemyHealth = hitInfo.targetNode.getComponent(EnemyHealth);
        if (!enemyHealth) return;

        const damageResult = enemyHealth.takeDamage(hitInfo.attackDamage);
        if (!damageResult) {
            return;
        }

        const enemyVisual = hitInfo.targetNode.getComponentInChildren(EnemyVisual);
        this.applyVisualFeedback(enemyVisual, damageResult);

        forwardStatusApplyList(hitInfo.targetNode, hitInfo.statusApplyList, EnemyStatusController);
    }

    private static applyVisualFeedback(enemyVisual: EnemyVisual | null, damageResult: EnemyDamageResult): void {
        if (!enemyVisual) {
            return;
        }

        enemyVisual.playDamageFeedback(damageResult.previousHp, damageResult.currentHp, damageResult.maxHp);
        enemyVisual.playHitFlash();
    }
}
