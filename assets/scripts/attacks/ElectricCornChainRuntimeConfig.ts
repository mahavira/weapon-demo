export interface ElectricCornChainRuntimeConfig {
    maxTargets: number;
    chainRange: number;
    segmentDurationSeconds: number;
    initialHitRadius: number;
    bounceDamageScale: number;
    hitDelaySeconds: number;
    lateralAmplitudeScale: number;
    keepPreviousSegmentsVisible: boolean;
}

export function buildElectricCornChainRuntimeConfig(params: Partial<ElectricCornChainRuntimeConfig>): ElectricCornChainRuntimeConfig {
    return {
        maxTargets: Math.max(1, Math.floor(params.maxTargets ?? 5)),
        chainRange: Math.max(1, params.chainRange ?? 240),
        segmentDurationSeconds: Math.max(0.02, params.segmentDurationSeconds ?? 0.38),
        initialHitRadius: Math.max(1, params.initialHitRadius ?? 48),
        bounceDamageScale: Math.max(0, params.bounceDamageScale ?? 1),
        hitDelaySeconds: Math.max(0, params.hitDelaySeconds ?? 0.02),
        lateralAmplitudeScale: Math.max(0.1, params.lateralAmplitudeScale ?? 0.5),
        keepPreviousSegmentsVisible: params.keepPreviousSegmentsVisible ?? true,
    };
}
