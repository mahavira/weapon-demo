import type { StatusEffectType } from '../core/types/StatusEffectType.ts';

export class StatusApplyInfo {
    public effectType: StatusEffectType;
    public durationSeconds: number;
    public tickIntervalSeconds: number;
    public tickDamageRatio: number;
    public sourceWeaponId: string;

    constructor(params: {
        effectType: StatusEffectType;
        durationSeconds: number;
        tickIntervalSeconds: number;
        tickDamageRatio: number;
        sourceWeaponId: string;
    }) {
        this.effectType = params.effectType;
        this.durationSeconds = params.durationSeconds;
        this.tickIntervalSeconds = params.tickIntervalSeconds;
        this.tickDamageRatio = params.tickDamageRatio;
        this.sourceWeaponId = params.sourceWeaponId;
    }
}
