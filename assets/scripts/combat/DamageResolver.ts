import type { HitInfo } from './HitInfo.ts';
import { EnemyHealth } from '../enemy/base/EnemyHealth';
import { EnemyVisual } from '../enemy/base/EnemyVisual';
import { EnemyStatusController } from '../enemy/base/EnemyStatusController';
import { forwardStatusApplyList } from './StatusApplyForwarding';

export class DamageResolver {
    public static applyDamage(hitInfo: HitInfo) {
        const enemyHealth = hitInfo.targetNode.getComponent(EnemyHealth);
        if (!enemyHealth) return;

        enemyHealth.takeDamage(hitInfo.attackDamage);

        const enemyVisual = hitInfo.targetNode.getComponentInChildren(EnemyVisual);
        enemyVisual?.playHitShake();
        enemyVisual?.playHitFlash();

        forwardStatusApplyList(hitInfo.targetNode, hitInfo.statusApplyList, EnemyStatusController);
    }
}
