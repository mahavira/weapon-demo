import { _decorator, Component } from 'cc';
import { AttackContext } from './AttackContext';

const { ccclass } = _decorator;

@ccclass('AttackBase')
export abstract class AttackBase extends Component {
    protected context: AttackContext | null = null;
    protected isAlive: boolean = false;

    public abstract startAttack(context: AttackContext): void;
    public abstract stopAttack(): void;
}
