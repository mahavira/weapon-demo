export interface Point2Like {
    x: number;
    y: number;
}

export interface SweepCircleHit {
    travelT: number;
    hitPoint: Point2Like;
}

const EPSILON = 1e-6;

export class HitMath {
    public static distanceSq2D(a: Point2Like, b: Point2Like): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    public static sweepCircleAgainstCircle(
        start: Point2Like,
        end: Point2Like,
        sweepRadius: number,
        targetCenter: Point2Like,
        targetRadius: number
    ): SweepCircleHit | null {
        const combinedRadius = Math.max(0, sweepRadius) + Math.max(0, targetRadius);
        const startInside = this.distanceSq2D(start, targetCenter) <= combinedRadius * combinedRadius;

        if (startInside) {
            return {
                travelT: 0,
                hitPoint: { x: start.x, y: start.y },
            };
        }

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const a = dx * dx + dy * dy;

        if (a <= EPSILON) {
            return null;
        }

        const fx = start.x - targetCenter.x;
        const fy = start.y - targetCenter.y;
        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - combinedRadius * combinedRadius;
        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            return null;
        }

        const sqrtDiscriminant = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDiscriminant) / (2 * a);
        const t2 = (-b + sqrtDiscriminant) / (2 * a);
        const candidates = [t1, t2].filter((value) => value >= 0 && value <= 1);

        if (candidates.length === 0) {
            return null;
        }

        const travelT = Math.min(...candidates);

        return {
            travelT,
            hitPoint: {
                x: start.x + dx * travelT,
                y: start.y + dy * travelT,
            },
        };
    }
}
