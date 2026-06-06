import { _decorator, Component } from 'cc';
import { DamageInfo } from '../../combat/DamageInfo';
import { IDamageable } from '../../core/interfaces/IDamageable';

const { ccclass, property } = _decorator;

export interface EnemyDamageResult {
    previousHp: number;
    currentHp: number;
    maxHp: number;
    didDie: boolean;
}

@ccclass('EnemyHealth')
export class EnemyHealth extends Component implements IDamageable {
    @property
    maxHp: number = 100;

    private _hp: number = 100;

    start() {
        this._hp = this.maxHp;
        console.log(`Enemy HP: ${this._hp}/${this.maxHp}`);
    }

    public takeDamage(info: DamageInfo): EnemyDamageResult | null {
        if (this._hp <= 0) return null;

        const previousHp = this._hp;
        this._hp = Math.max(0, this._hp - info.amount);
        console.log(`Enemy take damage: ${info.amount}, source: ${info.sourceWeaponId}, HP: ${this._hp}/${this.maxHp}`);

        const damageResult: EnemyDamageResult = {
            previousHp,
            currentHp: this._hp,
            maxHp: this.maxHp,
            didDie: this._hp <= 0,
        };

        if (damageResult.didDie) {
            this.die();
        }

        return damageResult;
    }

    public getHp(): number {
        return this._hp;
    }

    private die() {
        console.log('Enemy dead');
        this.node.destroy();
    }
}
