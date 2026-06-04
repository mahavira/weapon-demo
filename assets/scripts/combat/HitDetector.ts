import { Node, Vec3 } from 'cc';
import { MathUtils } from '../core/utils/MathUtils';

export class HitDetector {
    public static isCircleHit(currentWorldPos: Vec3, target: Node, radius: number): boolean {
        if (!target || !target.isValid) return false;
        return MathUtils.distanceSq2D(currentWorldPos, target.worldPosition) <= radius * radius;
    }
}
