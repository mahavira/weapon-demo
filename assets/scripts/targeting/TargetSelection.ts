export type WorldPointLike = {
    x: number;
    y: number;
};

export type TargetSelectionCandidate<TTarget> = {
    target: TTarget;
    worldPos: WorldPointLike;
};

export function findNearestTarget<TTarget>(
    originWorldPos: WorldPointLike,
    candidates: readonly TargetSelectionCandidate<TTarget>[]
): TTarget | null {
    let nearestTarget: TTarget | null = null;
    let nearestDistanceSq = Number.MAX_VALUE;

    for (const candidate of candidates) {
        const dx = candidate.worldPos.x - originWorldPos.x;
        const dy = candidate.worldPos.y - originWorldPos.y;
        const distanceSq = dx * dx + dy * dy;

        if (distanceSq < nearestDistanceSq) {
            nearestDistanceSq = distanceSq;
            nearestTarget = candidate.target;
        }
    }

    return nearestTarget;
}

export function findTargetsWithinRange<TTarget>(
    originWorldPos: WorldPointLike,
    range: number,
    candidates: readonly TargetSelectionCandidate<TTarget>[]
): TTarget[] {
    const rangeSq = range * range;

    return candidates
        .filter((candidate) => {
            const dx = candidate.worldPos.x - originWorldPos.x;
            const dy = candidate.worldPos.y - originWorldPos.y;

            return dx * dx + dy * dy <= rangeSq;
        })
        .map((candidate) => candidate.target);
}
