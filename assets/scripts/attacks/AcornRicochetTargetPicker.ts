import { findNearestTarget } from '../targeting/TargetSelection.ts';
import type { TargetSelectionCandidate, WorldPointLike } from '../targeting/TargetSelection.ts';

export interface RicochetTargetCandidate<TTarget> extends TargetSelectionCandidate<TTarget> {}

export interface PickRicochetTargetParams<TTarget> {
    currentWorldPos: WorldPointLike;
    previousTarget: TTarget | null;
    visitedTargets: ReadonlySet<TTarget>;
    ricochetRange: number;
    candidates: readonly RicochetTargetCandidate<TTarget>[];
    allowBounceBackToPreviousTarget: boolean;
}

export function pickRicochetTarget<TTarget>(
    params: PickRicochetTargetParams<TTarget>
): TTarget | null {
    const candidateTargetsWithinRange = params.candidates.filter((candidate) => {
        const dx = candidate.worldPos.x - params.currentWorldPos.x;
        const dy = candidate.worldPos.y - params.currentWorldPos.y;
        return dx * dx + dy * dy <= params.ricochetRange * params.ricochetRange;
    });

    const nearestUnvisitedTarget = findNearestTarget(
        params.currentWorldPos,
        candidateTargetsWithinRange.filter((candidate) => !params.visitedTargets.has(candidate.target))
    );

    if (nearestUnvisitedTarget) {
        return nearestUnvisitedTarget;
    }

    if (!params.allowBounceBackToPreviousTarget || !params.previousTarget) {
        return null;
    }

    const previousTargetCandidate = candidateTargetsWithinRange.find(
        (candidate) => candidate.target === params.previousTarget
    );

    return previousTargetCandidate?.target ?? null;
}

export function buildRicochetTargetCandidates<TTarget>(
    targets: readonly TTarget[],
    getWorldPos: (target: TTarget) => WorldPointLike
): RicochetTargetCandidate<TTarget>[] {
    return targets.map((target) => ({
        target,
        worldPos: getWorldPos(target),
    }));
}
