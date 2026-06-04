import { Vec3 } from 'cc';

export class MathUtils {
    public static distanceSq2D(a: Vec3, b: Vec3): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    }
}
