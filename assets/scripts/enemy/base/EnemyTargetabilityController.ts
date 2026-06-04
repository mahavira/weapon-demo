import { _decorator, Component } from 'cc';
import { Hurtbox } from './Hurtbox';

const { ccclass, property } = _decorator;

@ccclass('EnemyTargetabilityController')
export class EnemyTargetabilityController extends Component {
    @property
    autoToggle: boolean = false;

    @property
    startUntargetable: boolean = false;

    @property
    targetableDuration: number = 1.5;

    @property
    untargetableDuration: number = 0.75;

    private hurtbox: Hurtbox | null = null;
    private isUntargetable: boolean = false;
    private elapsed: number = 0;

    protected onEnable(): void {
        this.hurtbox = this.getComponent(Hurtbox);
        this.elapsed = 0;
        this.setUntargetable(this.startUntargetable);
    }

    protected update(dt: number): void {
        if (!this.autoToggle || !this.hurtbox) return;

        const activeDuration = this.isUntargetable
            ? this.untargetableDuration
            : this.targetableDuration;

        if (activeDuration <= 0) return;

        this.elapsed += dt;
        if (this.elapsed < activeDuration) return;

        this.elapsed = 0;
        this.setUntargetable(!this.isUntargetable);
    }

    public setUntargetable(isUntargetable: boolean): void {
        this.isUntargetable = isUntargetable;
        this.elapsed = 0;

        if (!this.hurtbox) return;

        if (isUntargetable) {
            this.hurtbox.applyAreaOnlyCombatProfile();
            return;
        }

        this.hurtbox.applyNormalCombatProfile();
    }
}
