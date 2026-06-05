import { HitInfo } from './HitInfo';
import { EnemyHealth } from '../enemy/base/EnemyHealth';
import { EnemyVisual } from '../enemy/base/EnemyVisual';

export class DamageResolver {
    public static applyDamage(hitInfo: HitInfo) {
        const enemyHealth = hitInfo.targetNode.getComponent(EnemyHealth);
        if (!enemyHealth) return;

        enemyHealth.takeDamage(hitInfo.attackDamage);

        const enemyVisual = hitInfo.targetNode.getComponentInChildren(EnemyVisual);
        enemyVisual?.playHitFlash();
    }
}
