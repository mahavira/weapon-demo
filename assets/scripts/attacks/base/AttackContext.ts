import { Node, Vec3 } from 'cc';
import { DamageInfo } from '../../combat/DamageInfo';

export class AttackContext {
    public attackerNode: Node;
    public targetNode: Node | null;
    public spawnWorldPos: Vec3;
    public destinationWorldPos: Vec3 | null;
    public attackDamage: DamageInfo;
    public sourceWeaponId: string;

    constructor(params: {
        attackerNode: Node;
        targetNode: Node | null;
        spawnWorldPos: Vec3;
        destinationWorldPos?: Vec3 | null;
        attackDamage: DamageInfo;
        sourceWeaponId: string;
    }) {
        this.attackerNode = params.attackerNode;
        this.targetNode = params.targetNode;
        this.spawnWorldPos = params.spawnWorldPos.clone();
        this.destinationWorldPos = params.destinationWorldPos?.clone() ?? null;
        this.attackDamage = params.attackDamage;
        this.sourceWeaponId = params.sourceWeaponId;
    }
}
