import { Node, Vec3 } from 'cc';
import { MathUtils } from '../core/utils/MathUtils';
import { HitMath } from './HitMath';

export interface SweepCircleHitResult {
    travelT: number;
    hitWorldPos: {
        x: number;
        y: number;
    };
}

export class HitDetector {
    public static isCircleHit(currentWorldPos: Vec3, target: Node, radius: number): boolean {
        if (!target || !target.isValid) return false;
        return MathUtils.distanceSq2D(currentWorldPos, target.worldPosition) <= radius * radius;
    }

    public static sweepCircleAgainstTarget(
        previousWorldPos: Vec3,
        currentWorldPos: Vec3,
        sweepRadius: number,
        targetCenter: Vec3,
        targetRadius: number
    ): SweepCircleHitResult | null {
        const result = HitMath.sweepCircleAgainstCircle(
            previousWorldPos,
            currentWorldPos,
            sweepRadius,
            targetCenter,
            targetRadius
        );

        if (!result) {
            return null;
        }

        return {
            travelT: result.travelT,
            hitWorldPos: result.hitPoint,
        };
    }
}
