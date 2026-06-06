export interface RicochetBulletRuntimeConfig {
    maxHits: number;
    ricochetRange: number;
    allowBounceBackToPreviousTarget: boolean;
}

export function buildRicochetBulletRuntimeConfig(
    params: Partial<RicochetBulletRuntimeConfig>
): RicochetBulletRuntimeConfig {
    return {
        maxHits: Math.max(1, Math.floor(params.maxHits ?? 4)),
        ricochetRange: Math.max(1, params.ricochetRange ?? 280),
        allowBounceBackToPreviousTarget: params.allowBounceBackToPreviousTarget ?? true,
    };
}
