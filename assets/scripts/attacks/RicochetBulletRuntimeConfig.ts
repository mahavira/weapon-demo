export interface RicochetBulletRuntimeConfig {
    maxHits: number;
    ricochetRange: number;
    allowBounceBackToPreviousTarget: boolean;
    travelSpeed: number;
    rotateSpeed: number;
    autoFaceDirection: boolean;
    destroyWhenExitVisibleArea: boolean;
}

export function buildRicochetBulletRuntimeConfig(
    params: Partial<RicochetBulletRuntimeConfig>
): RicochetBulletRuntimeConfig {
    return {
        maxHits: Math.max(1, Math.floor(params.maxHits ?? 4)),
        ricochetRange: Math.max(1, params.ricochetRange ?? 280),
        allowBounceBackToPreviousTarget: params.allowBounceBackToPreviousTarget ?? true,
        travelSpeed: Math.max(1, params.travelSpeed ?? 960),
        rotateSpeed: params.rotateSpeed ?? 12,
        autoFaceDirection: params.autoFaceDirection ?? true,
        destroyWhenExitVisibleArea: params.destroyWhenExitVisibleArea ?? true,
    };
}
