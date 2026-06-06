export interface AcornSlingshotRuntimeConfig {
    maxHits: number;
    ricochetRange: number;
    allowBounceBackToPreviousTarget: boolean;
}

export function buildAcornSlingshotRuntimeConfig(
    params: Partial<AcornSlingshotRuntimeConfig>
): AcornSlingshotRuntimeConfig {
    return {
        maxHits: Math.max(1, Math.floor(params.maxHits ?? 4)),
        ricochetRange: Math.max(1, params.ricochetRange ?? 280),
        allowBounceBackToPreviousTarget: params.allowBounceBackToPreviousTarget ?? true,
    };
}
