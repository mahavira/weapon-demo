import type { WeaponBoomerangConfig } from '../config/WeaponConfigTable';

export interface BoomerangRuntimeConfig {
    forwardTravelDuration: number;
    returnDuration: number;
    sideOffset: number;
    topOffset: number;
    hitRadius: number;
    rotateSpeed: number;
    returnDamageScale: number;
    destroyWhenExitVisibleArea: boolean;
}

export function buildBoomerangRuntimeConfig(
    params: Partial<WeaponBoomerangConfig>
): BoomerangRuntimeConfig {
    return {
        forwardTravelDuration: Math.max(0.01, params.forwardTravelDuration ?? 0.75),
        returnDuration: Math.max(0.01, params.returnDuration ?? 0.65),
        sideOffset: params.sideOffset ?? 220,
        topOffset: params.topOffset ?? 100,
        hitRadius: Math.max(1, params.hitRadius ?? 60),
        rotateSpeed: params.rotateSpeed ?? 18,
        returnDamageScale: Math.max(0, params.returnDamageScale ?? 1),
        destroyWhenExitVisibleArea: params.destroyWhenExitVisibleArea ?? true,
    };
}
