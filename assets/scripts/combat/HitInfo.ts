import { Node, Vec3 } from 'cc';
import { DamageInfo } from './DamageInfo';
import { AttackPhase } from '../core/types/AttackTypes';

export class HitInfo {
    public attackerNode: Node;
    public targetNode: Node;
    public hitWorldPos: Vec3;
    public attackDamage: DamageInfo;
    public phase: AttackPhase;

    constructor(params: {
        attackerNode: Node;
        targetNode: Node;
        hitWorldPos: Vec3;
        attackDamage: DamageInfo;
        phase: AttackPhase;
    }) {
        this.attackerNode = params.attackerNode;
        this.targetNode = params.targetNode;
        this.hitWorldPos = params.hitWorldPos;
        this.attackDamage = params.attackDamage;
        this.phase = params.phase;
    }
}
