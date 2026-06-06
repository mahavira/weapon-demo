import { _decorator, Component } from 'cc';
import { DamageInfo } from '../../combat/DamageInfo';
import { IDamageable } from '../../core/interfaces/IDamageable';
import { EnemyVisual } from './EnemyVisual';

const { ccclass, property } = _decorator;

@ccclass('EnemyHealth')
export class EnemyHealth extends Component implements IDamageable {
    @property
    maxHp: number = 100;

    private _hp: number = 100;

    start() {
        this._hp = this.maxHp;
        console.log(`Enemy HP: ${this._hp}/${this.maxHp}`);
    }

    public takeDamage(info: DamageInfo) {
        if (this._hp <= 0) return;

        const previousHp = this._hp;
        this._hp = Math.max(0, this._hp - info.amount);
        console.log(`Enemy take damage: ${info.amount}, source: ${info.sourceWeaponId}, HP: ${this._hp}/${this.maxHp}`);

        const enemyVisual = this.node.getComponentInChildren(EnemyVisual);
        enemyVisual?.playDamageFeedback(previousHp, this._hp, this.maxHp);

        if (this._hp <= 0) {
            this.die();
        }
    }

    public getHp(): number {
        return this._hp;
    }

    private die() {
        console.log('Enemy dead');
        this.node.destroy();
    }
}
