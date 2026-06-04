import { Node, Vec3 } from 'cc';
import { DamageInfo } from './DamageInfo';
import { AttackPhase } from '../core/types/AttackTypes';

export class HitInfo {
    public attacker: Node;
    public target: Node;
    public hitWorldPos: Vec3;
    public damageInfo: DamageInfo;
    public phase: AttackPhase;

    constructor(params: {
        attacker: Node;
        target: Node;
        hitWorldPos: Vec3;
        damageInfo: DamageInfo;
        phase: AttackPhase;
    }) {
        this.attacker = params.attacker;
        this.target = params.target;
        this.hitWorldPos = params.hitWorldPos;
        this.damageInfo = params.damageInfo;
        this.phase = params.phase;
    }
}
