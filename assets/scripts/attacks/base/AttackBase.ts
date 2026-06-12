import { _decorator, Component, Node } from 'cc';
import { AttackContext } from './AttackContext';

const { ccclass } = _decorator;

type AttackNodeReleaseHandler = (node: Node) => void;

@ccclass('AttackBase')
export abstract class AttackBase extends Component {
    protected attackContext: AttackContext | null = null;
    protected isAttackActive: boolean = false;

    private attackNodeReleaseHandler: AttackNodeReleaseHandler | null = null;

    public abstract startAttack(attackContext: AttackContext): void;
    public abstract stopAttack(): void;

    public setAttackNodeReleaseHandler(handler: AttackNodeReleaseHandler | null): void {
        this.attackNodeReleaseHandler = handler;
    }

    protected releaseAttackNode(): void {
        if (!this.node || !this.node.isValid) {
            return;
        }

        const releaseHandler = this.attackNodeReleaseHandler;
        this.attackNodeReleaseHandler = null;

        if (releaseHandler) {
            releaseHandler(this.node);
            return;
        }

        this.node.destroy();
    }
}
