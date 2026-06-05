import { _decorator, Component, UITransform } from 'cc';
import { EnemyHealth } from './EnemyHealth';
import { EnemyStatusController } from './EnemyStatusController';
import { EnemyVisual } from './EnemyVisual';
import { Hurtbox } from './Hurtbox';

const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    @property(EnemyHealth)
    health: EnemyHealth | null = null;

    @property(EnemyVisual)
    visual: EnemyVisual | null = null;

    private hurtbox: Hurtbox | null = null;

    protected onLoad(): void {
        this.ensureStatusController();

        const existingHurtbox = this.node.getComponent(Hurtbox);
        const hurtbox = existingHurtbox ?? this.node.addComponent(Hurtbox);

        if (!existingHurtbox) {
            hurtbox.hitRadius = this.resolveDefaultHitRadius();
        }

        hurtbox.ensureDefaultRadius();
        this.hurtbox = hurtbox;
    }

    private ensureStatusController(): void {
        if (this.node.getComponent(EnemyStatusController)) {
            return;
        }

        this.node.addComponent(EnemyStatusController);
    }

    private resolveDefaultHitRadius(): number {
        const visualTransform = this.visual?.getComponent(UITransform);
        if (visualTransform) {
            return Math.max(visualTransform.contentSize.width, visualTransform.contentSize.height) * 0.5;
        }

        const ownTransform = this.node.getComponent(UITransform);
        if (ownTransform) {
            return Math.max(ownTransform.contentSize.width, ownTransform.contentSize.height) * 0.5;
        }

        return 20;
    }
}
