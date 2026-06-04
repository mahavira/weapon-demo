import { _decorator, Component } from 'cc';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';

const { ccclass } = _decorator;

@ccclass('EnemyHitReceiver')
export class EnemyHitReceiver extends Component {
    public receiveHit(hitInfo: HitInfo) {
        DamageResolver.applyDamage(hitInfo);
    }
}
