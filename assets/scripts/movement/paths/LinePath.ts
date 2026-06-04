import { Vec3 } from 'cc';
import { IPath } from './IPath';

export class LinePath implements IPath {
    private startWorldPos: Vec3;
    private endWorldPos: Vec3;

    constructor(startWorldPos: Vec3, endWorldPos: Vec3) {
        this.startWorldPos = startWorldPos.clone();
        this.endWorldPos = endWorldPos.clone();
    }

    public getPosition(t: number): Vec3 {
        const clampedT = Math.max(0, Math.min(1, t));

        return new Vec3(
            this.startWorldPos.x + (this.endWorldPos.x - this.startWorldPos.x) * clampedT,
            this.startWorldPos.y + (this.endWorldPos.y - this.startWorldPos.y) * clampedT,
            this.startWorldPos.z + (this.endWorldPos.z - this.startWorldPos.z) * clampedT
        );
    }
}
