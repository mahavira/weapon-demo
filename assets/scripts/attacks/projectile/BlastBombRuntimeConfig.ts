import type { WeaponBlastBombConfig } from '../../config/WeaponConfigTable';

export interface BlastBombRuntimeConfig {
    travelSpeed: number;
    arcHeight: number;
    rotateSpeed: number;
    autoFaceDirection: boolean;
    destroyWhenExitVisibleArea: boolean;
}

export function buildBlastBombRuntimeConfig(
    params: Partial<WeaponBlastBombConfig>
): BlastBombRuntimeConfig {
    return {
        travelSpeed: Math.max(1, params.travelSpeed ?? 640),
        arcHeight: Math.max(0, params.arcHeight ?? 280),
        rotateSpeed: params.rotateSpeed ?? 18,
        autoFaceDirection: params.autoFaceDirection ?? true,
        destroyWhenExitVisibleArea: params.destroyWhenExitVisibleArea ?? true,
    };
}
