import { _decorator, Node, Vec3 } from 'cc';
import { AttackPhase } from '../../core/types/AttackTypes';
import { LinearProjectile } from './LinearProjectile';

const { ccclass } = _decorator;

@ccclass('DirectHitProjectile')
export class DirectHitProjectile extends LinearProjectile {
    protected onFirstHit(target: Node, hitWorldPos: Vec3, phase: AttackPhase): void {
        this.applyDamageToTarget(target, hitWorldPos, phase);
        this.stopAttack();
    }
}
