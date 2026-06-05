import { _decorator, Component } from 'cc';
import { AttackContext } from './AttackContext';

const { ccclass } = _decorator;

@ccclass('AttackBase')
export abstract class AttackBase extends Component {
    protected attackContext: AttackContext | null = null;
    protected isAttackActive: boolean = false;

    public abstract startAttack(attackContext: AttackContext): void;
    public abstract stopAttack(): void;
}
