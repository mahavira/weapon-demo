import type { Node } from 'cc';
import { AttackPhase } from '../../core/types/AttackTypes.ts';
import { HitDedupeMode } from '../../combat/HitPolicy.ts';
import type { HitPolicy } from '../../combat/HitPolicy.ts';

export class AttackHitTracker<TTarget extends object = Node> {
    private hitMap: Map<AttackPhase, Set<TTarget>> = new Map();
    private lifetimeHits: Set<TTarget> = new Set();

    public hasHit(phase: AttackPhase, target: TTarget, policy?: HitPolicy): boolean {
        if (!policy || policy.dedupeMode === HitDedupeMode.None) {
            return false;
        }

        if (policy.dedupeMode === HitDedupeMode.Lifetime) {
            return this.lifetimeHits.has(target);
        }

        const currentPhaseHits = this.hitMap.get(phase);
        if (currentPhaseHits?.has(target)) {
            return true;
        }

        if (!policy.allowRehitOnPhaseChange) {
            return this.lifetimeHits.has(target);
        }

        return false;
    }

    public markHit(phase: AttackPhase, target: TTarget) {
        let set = this.hitMap.get(phase);

        if (!set) {
            set = new Set<TTarget>();
            this.hitMap.set(phase, set);
        }

        set.add(target);
        this.lifetimeHits.add(target);
    }

    public clear() {
        this.hitMap.clear();
        this.lifetimeHits.clear();
    }
}
