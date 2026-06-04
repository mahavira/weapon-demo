import { Vec3 } from 'cc';

export class BezierUtils {
    public static quadratic(p0: Vec3, p1: Vec3, p2: Vec3, t: number): Vec3 {
        const oneMinusT = 1 - t;

        return new Vec3(
            oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
            oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
            oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z
        );
    }
}
