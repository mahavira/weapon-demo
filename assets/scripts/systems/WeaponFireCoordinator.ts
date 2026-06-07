import type { WeaponConfigData } from '../config/WeaponConfigTable.ts';

export function canFireWeapon(
    config: WeaponConfigData,
    nextFireTimeByWeaponId: Readonly<Record<string, number>>,
    nowSeconds: number
): boolean {
    const cooldown = config.cooldown ?? 0;
    if (cooldown <= 0) {
        return true;
    }

    const nextFireTime = nextFireTimeByWeaponId[config.id] ?? 0;
    return nowSeconds >= nextFireTime;
}

export function markWeaponCooldown(
    config: WeaponConfigData,
    nextFireTimeByWeaponId: Record<string, number>,
    nowSeconds: number
): void {
    const cooldown = config.cooldown ?? 0;
    if (cooldown <= 0) {
        return;
    }

    nextFireTimeByWeaponId[config.id] = nowSeconds + cooldown;
}

export function fireWeaponWithCooldown(params: {
    config: WeaponConfigData | null | undefined;
    nextFireTimeByWeaponId: Record<string, number>;
    nowSeconds: number;
    fireByConfig: (config: WeaponConfigData) => boolean;
}): boolean {
    const { config, nextFireTimeByWeaponId, nowSeconds, fireByConfig } = params;
    if (!config) {
        return false;
    }

    if (!canFireWeapon(config, nextFireTimeByWeaponId, nowSeconds)) {
        return false;
    }

    const didFire = fireByConfig(config);
    if (!didFire) {
        return false;
    }

    markWeaponCooldown(config, nextFireTimeByWeaponId, nowSeconds);
    return true;
}
