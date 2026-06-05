import { _decorator, Component } from 'cc';
import { CombatEventBus, CombatEventName } from '../../combat/CombatEventBus';
import { DamageInfo } from '../../combat/DamageInfo';
import { StatusApplyInfo } from '../../combat/StatusApplyInfo';
import { WeaponConfigTable } from '../../config/WeaponConfigTable';
import { DamageSourceType } from '../../core/types/DamageTypes';
import { StatusEffectType } from '../../core/types/StatusEffectType';
import { EnemyVisual } from './EnemyVisual';
import { EnemyHealth } from './EnemyHealth';
import { BurningAdvanceResult, BurningStatusRuntime } from './BurningStatusRuntime';

const { ccclass } = _decorator;

@ccclass('EnemyStatusController')
export class EnemyStatusController extends Component {
    private readonly burningRuntime = new BurningStatusRuntime();
    private enemyHealth: EnemyHealth | null = null;
    private enemyVisual: EnemyVisual | null = null;

    protected onLoad(): void {
        this.enemyHealth = this.getComponent(EnemyHealth);
        this.enemyVisual = this.getComponentInChildren(EnemyVisual);
    }

    protected update(deltaTime: number): void {
        if (!this.burningRuntime.hasStatus()) {
            return;
        }

        const burningAdvanceResult = this.burningRuntime.advance(deltaTime);
        this.applyBurningTickResult(burningAdvanceResult);

        if (this.burningRuntime.hasStatus()) {
            this.enemyVisual?.playBurningLoop(this.burningRuntime.getIntensity());
            return;
        }

        if (burningAdvanceResult.didExpire) {
            this.enemyVisual?.playBurningStop();
            CombatEventBus.emit(CombatEventName.StatusRemoved, {
                targetNode: this.node,
                effectType: StatusEffectType.Burning,
                sourceWeaponId: burningAdvanceResult.expiredSourceWeaponId ?? '',
            });
        }
    }

    public applyStatus(statusApplyInfo: StatusApplyInfo): void {
        if (statusApplyInfo.effectType !== StatusEffectType.Burning) {
            return;
        }

        if ((this.enemyHealth?.getHp() ?? 0) <= 0) {
            return;
        }

        const weaponConfig = WeaponConfigTable[statusApplyInfo.sourceWeaponId];
        if (!weaponConfig) {
            return;
        }

        const didStart = this.burningRuntime.applyStatus(statusApplyInfo, weaponConfig.damage);
        if (didStart) {
            this.enemyVisual?.playBurningStart();
        }

        this.enemyVisual?.playBurningLoop(this.burningRuntime.getIntensity());
        CombatEventBus.emit(CombatEventName.StatusApplied, {
            targetNode: this.node,
            effectType: statusApplyInfo.effectType,
            sourceWeaponId: statusApplyInfo.sourceWeaponId,
        });
    }

    public hasStatus(effectType: StatusEffectType): boolean {
        if (effectType !== StatusEffectType.Burning) {
            return false;
        }

        return this.burningRuntime.hasStatus();
    }

    public removeStatus(effectType: StatusEffectType): void {
        if (effectType !== StatusEffectType.Burning || !this.burningRuntime.hasStatus()) {
            return;
        }

        const sourceWeaponId = this.burningRuntime.getSourceWeaponId();
        this.burningRuntime.clear();
        this.enemyVisual?.playBurningStop();
        CombatEventBus.emit(CombatEventName.StatusRemoved, {
            targetNode: this.node,
            effectType,
            sourceWeaponId,
        });
    }

    protected onDestroy(): void {
        this.burningRuntime.clear();
    }

    private applyBurningTickResult(burningAdvanceResult: BurningAdvanceResult): void {
        if (!this.enemyHealth) {
            return;
        }

        for (const tickResult of burningAdvanceResult.tickResults) {
            this.enemyHealth.takeDamage(new DamageInfo({
                amount: tickResult.damageAmount,
                sourceType: DamageSourceType.Dot,
                sourceWeaponId: tickResult.sourceWeaponId,
            }));

            CombatEventBus.emit(CombatEventName.StatusTick, {
                targetNode: this.node,
                effectType: StatusEffectType.Burning,
                sourceWeaponId: tickResult.sourceWeaponId,
                damageAmount: tickResult.damageAmount,
            });
        }
    }
}
