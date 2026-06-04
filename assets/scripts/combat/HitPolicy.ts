export enum HitStopMode {
    FirstHit = 'first_hit',
    Penetrate = 'penetrate',
}

export enum HitDedupeMode {
    None = 'none',
    PerPhase = 'per_phase',
    Lifetime = 'lifetime',
}

export interface HitPolicy {
    stopMode: HitStopMode;
    maxTargetsPerFrame: number;
    dedupeMode: HitDedupeMode;
    allowRehitOnPhaseChange: boolean;
}

export const FIRST_HIT_PER_PHASE_POLICY: Readonly<HitPolicy> = Object.freeze({
    stopMode: HitStopMode.FirstHit,
    maxTargetsPerFrame: 1,
    dedupeMode: HitDedupeMode.PerPhase,
    allowRehitOnPhaseChange: false,
});

export const PENETRATING_PER_PHASE_POLICY: Readonly<HitPolicy> = Object.freeze({
    stopMode: HitStopMode.Penetrate,
    maxTargetsPerFrame: Number.MAX_SAFE_INTEGER,
    dedupeMode: HitDedupeMode.PerPhase,
    allowRehitOnPhaseChange: true,
});
