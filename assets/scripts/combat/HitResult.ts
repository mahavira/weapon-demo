import { Node, Vec3 } from 'cc';
import { Hurtbox } from '../enemy/base/Hurtbox';
import { AttackPhase } from '../core/types/AttackTypes';

export interface HitResult {
    target: Node;
    hurtbox: Hurtbox;
    hitWorldPos: Vec3;
    travelT: number;
    phase: AttackPhase;
}
