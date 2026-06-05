import { HitMath } from './HitMath.ts';

export interface BeamHitTarget<T> {
    target: T;
    center: {
        x: number;
        y: number;
    };
    radius: number;
}

export interface BeamHitSample<T> {
    target: T;
    travelT: number;
    hitWorldPos: {
        x: number;
        y: number;
    };
}

export function sampleBeamHits<T>(
    sourceWorldPos: { x: number; y: number },
    destinationWorldPos: { x: number; y: number },
    beamRadius: number,
    targets: readonly BeamHitTarget<T>[]
): BeamHitSample<T>[] {
    const hits: BeamHitSample<T>[] = [];

    for (const target of targets) {
        const hit = HitMath.sweepCircleAgainstCircle(
            sourceWorldPos,
            destinationWorldPos,
            beamRadius,
            target.center,
            target.radius
        );

        if (!hit) {
            continue;
        }

        hits.push({
            target: target.target,
            travelT: hit.travelT,
            hitWorldPos: hit.hitPoint,
        });
    }

    hits.sort((left, right) => left.travelT - right.travelT);
    return hits;
}
