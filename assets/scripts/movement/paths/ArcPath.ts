import { Vec3 } from 'cc';
import { BezierUtils } from '../../core/utils/BezierUtils';
import { IPath } from './IPath';

export class ArcPath implements IPath {
    private startWorldPos: Vec3;
    private controlWorldPos: Vec3;
    private endWorldPos: Vec3;

    constructor(startWorldPos: Vec3, endWorldPos: Vec3, arcHeight: number) {
        this.startWorldPos = startWorldPos.clone();
        this.endWorldPos = endWorldPos.clone();

        this.controlWorldPos = new Vec3(
            (this.startWorldPos.x + this.endWorldPos.x) * 0.5,
            Math.max(this.startWorldPos.y, this.endWorldPos.y) + arcHeight,
            (this.startWorldPos.z + this.endWorldPos.z) * 0.5
        );
    }

    public getPosition(t: number): Vec3 {
        const clampedT = Math.max(0, Math.min(1, t));
        return BezierUtils.quadratic(this.startWorldPos, this.controlWorldPos, this.endWorldPos, clampedT);
    }
}
