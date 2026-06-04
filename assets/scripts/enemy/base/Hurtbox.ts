import { _decorator, Component, UITransform, Vec3 } from 'cc';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { TargetabilityState } from '../../combat/TargetabilityState';
import { DamageChannel } from '../../core/types/DamageChannel';

const { ccclass, property } = _decorator;

@ccclass('Hurtbox')
export class Hurtbox extends Component {
    @property
    hitRadius: number = 0;

    @property(Vec3)
    centerOffset: Vec3 = new Vec3();

    private readonly targetabilityState = new TargetabilityState();

    protected onEnable(): void {
        EnemyRegistry.register(this.node, this);
    }

    protected onDisable(): void {
        EnemyRegistry.unregister(this.node, this);
    }

    protected onDestroy(): void {
        EnemyRegistry.unregister(this.node, this);
    }

    public ensureDefaultRadius(): void {
        if (this.hitRadius > 0) return;

        const uiTransform = this.getPrimaryTransform();
        if (!uiTransform) {
            this.hitRadius = 20;
            return;
        }

        this.hitRadius = Math.max(uiTransform.contentSize.width, uiTransform.contentSize.height) * 0.5;
    }

    public getWorldCenter(): Vec3 {
        const worldPos = this.node.worldPosition;
        return new Vec3(
            worldPos.x + this.centerOffset.x,
            worldPos.y + this.centerOffset.y,
            worldPos.z + this.centerOffset.z
        );
    }

    public getHitRadius(): number {
        return this.hitRadius;
    }

    public canBeTargeted(): boolean {
        return this.targetabilityState.canBeTargeted();
    }

    public setTargetable(isTargetable: boolean): void {
        this.targetabilityState.setTargetable(isTargetable);
    }

    public canBeHitBy(channel: DamageChannel): boolean {
        return this.targetabilityState.canBeHitBy(channel);
    }

    public setDamageChannelAllowed(channel: DamageChannel, isAllowed: boolean): void {
        this.targetabilityState.setDamageChannelAllowed(channel, isAllowed);
    }

    public applyNormalCombatProfile(): void {
        this.targetabilityState.applyNormalCombatProfile();
    }

    public applyAreaOnlyCombatProfile(): void {
        this.targetabilityState.applyAreaOnlyCombatProfile();
    }

    private getPrimaryTransform(): UITransform | null {
        const ownTransform = this.node.getComponent(UITransform);
        if (ownTransform && ownTransform.contentSize.width > 0 && ownTransform.contentSize.height > 0) {
            return ownTransform;
        }

        const firstChild = this.node.children[0];
        return firstChild?.getComponent(UITransform) ?? null;
    }
}
