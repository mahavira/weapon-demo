import { Node } from 'cc';
import { AttackPhase } from '../../core/types/AttackTypes';

export class AttackHitTracker {
    private hitMap: Map<AttackPhase, Set<Node>> = new Map();

    public hasHit(phase: AttackPhase, target: Node): boolean {
        const set = this.hitMap.get(phase);
        return set ? set.has(target) : false;
    }

    public markHit(phase: AttackPhase, target: Node) {
        let set = this.hitMap.get(phase);

        if (!set) {
            set = new Set<Node>();
            this.hitMap.set(phase, set);
        }

        set.add(target);
    }

    public clear() {
        this.hitMap.clear();
    }
}
