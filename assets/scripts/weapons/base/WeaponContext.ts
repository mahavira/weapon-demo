import { Node } from 'cc';

export class WeaponContext {
    public owner: Node;
    public firePoint: Node;
    public target: Node | null;

    constructor(params: { owner: Node; firePoint: Node; target: Node | null }) {
        this.owner = params.owner;
        this.firePoint = params.firePoint;
        this.target = params.target;
    }
}
