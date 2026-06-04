import { HitInfo } from './HitInfo';
import { EnemyHealth } from '../enemy/base/EnemyHealth';
import { EnemyVisual } from '../enemy/base/EnemyVisual';

export class DamageResolver {
    public static applyDamage(hitInfo: HitInfo) {
        const enemyHealth = hitInfo.target.getComponent(EnemyHealth);
        if (!enemyHealth) return;

        enemyHealth.takeDamage(hitInfo.damageInfo);

        const enemyVisual = hitInfo.target.getComponentInChildren(EnemyVisual);
        enemyVisual?.playHitFlash();
    }
}
