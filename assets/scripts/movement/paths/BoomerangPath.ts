import { Vec3 } from 'cc';
import { BezierUtils } from '../../core/utils/BezierUtils';
import { AttackPhase } from '../../core/types/AttackTypes';

export class BoomerangPath {
    private startWorldPos: Vec3;
    private targetWorldPos: Vec3;
    private rightControl: Vec3;
    private leftControl: Vec3;

    constructor(params: {
        startWorldPos: Vec3;
        targetWorldPos: Vec3;
        sideOffset: number;
        topOffset: number;
    }) {
        this.startWorldPos = params.startWorldPos.clone();
        this.targetWorldPos = params.targetWorldPos.clone();

        this.rightControl = new Vec3(
            this.targetWorldPos.x + params.sideOffset,
            this.targetWorldPos.y + params.topOffset,
            this.targetWorldPos.z
        );

        this.leftControl = new Vec3(
            this.startWorldPos.x - params.sideOffset,
            this.startWorldPos.y + params.topOffset,
            this.startWorldPos.z
        );
    }

    public getPosition(phase: AttackPhase, t: number): Vec3 {
        if (phase === AttackPhase.Forward) {
            return BezierUtils.quadratic(this.startWorldPos, this.rightControl, this.targetWorldPos, t);
        }

        if (phase === AttackPhase.Return) {
            return BezierUtils.quadratic(this.targetWorldPos, this.leftControl, this.startWorldPos, t);
        }

        return this.startWorldPos.clone();
    }
}
