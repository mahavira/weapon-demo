import { Node, Vec3 } from 'cc';
import { DamageInfo } from '../../combat/DamageInfo';

export class AttackContext {
    public attacker: Node;
    public target: Node | null;
    public startWorldPos: Vec3;
    public endWorldPos: Vec3 | null;
    public damageInfo: DamageInfo;
    public sourceWeaponId: string;

    constructor(params: {
        attacker: Node;
        target: Node | null;
        startWorldPos: Vec3;
        endWorldPos?: Vec3 | null;
        damageInfo: DamageInfo;
        sourceWeaponId: string;
    }) {
        this.attacker = params.attacker;
        this.target = params.target;
        this.startWorldPos = params.startWorldPos;
        this.endWorldPos = params.endWorldPos?.clone() ?? null;
        this.damageInfo = params.damageInfo;
        this.sourceWeaponId = params.sourceWeaponId;
    }
}
