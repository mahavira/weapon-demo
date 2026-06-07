import type { WeaponProjectileConfig } from '../../config/WeaponConfigTable';

export interface LinearProjectileRuntimeConfig {
    travelSpeed: number;
    hitRadius: number;
    rotateSpeed: number;
    autoFaceDirection: boolean;
    faceAngleOffset: number;
    destroyWhenExitVisibleArea: boolean;
}

export function buildLinearProjectileRuntimeConfig(
    params: Partial<WeaponProjectileConfig>
): LinearProjectileRuntimeConfig {
    return {
        travelSpeed: Math.max(1, params.travelSpeed ?? 4000),
        hitRadius: Math.max(1, params.hitRadius ?? 42),
        rotateSpeed: params.rotateSpeed ?? 0,
        autoFaceDirection: params.autoFaceDirection ?? true,
        faceAngleOffset: params.faceAngleOffset ?? 0,
        destroyWhenExitVisibleArea: params.destroyWhenExitVisibleArea ?? true,
    };
}
