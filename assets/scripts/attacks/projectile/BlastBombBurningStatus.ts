import type { WeaponBurningOnImpactConfig } from '../../config/WeaponConfigTable';
import type { StatusApplyInfo } from '../../combat/StatusApplyInfo';
import type { StatusEffectType } from '../../core/types/StatusEffectType';

export function buildBlastBombBurningStatusApplyList(
    burningOnImpactConfig: WeaponBurningOnImpactConfig | null,
    sourceWeaponId: string
): StatusApplyInfo[] {
    if (!burningOnImpactConfig) {
        return [];
    }

    return [
        {
            effectType: 'burning' as StatusEffectType,
            durationSeconds: burningOnImpactConfig.durationSeconds ?? 0,
            tickIntervalSeconds: burningOnImpactConfig.tickIntervalSeconds ?? 0,
            tickDamageRatio: burningOnImpactConfig.tickDamageRatio ?? 0,
            sourceWeaponId,
        },
    ];
}
