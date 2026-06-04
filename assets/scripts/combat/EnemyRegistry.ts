import { Node } from 'cc';
import { Hurtbox } from '../enemy/base/Hurtbox';
import { DamageChannel } from '../core/types/DamageChannel';
import { matchesTargetQuery, TargetQueryFilter } from './TargetQuery';

export class EnemyRegistry {
    private static hurtboxes: Map<Node, Hurtbox> = new Map();

    public static register(node: Node, hurtbox: Hurtbox): void {
        if (!node || !node.isValid || !hurtbox || !hurtbox.isValid) return;
        this.hurtboxes.set(node, hurtbox);
    }

    public static unregister(node: Node, hurtbox?: Hurtbox): void {
        const current = this.hurtboxes.get(node);
        if (!current) return;
        if (hurtbox && current !== hurtbox) return;
        this.hurtboxes.delete(node);
    }

    public static getActiveTargets(): readonly Hurtbox[] {
        return this.queryTargets();
    }

    public static getTargetableTargets(): readonly Hurtbox[] {
        return this.queryTargets({ requireTargetable: true });
    }

    public static getDamageableTargets(channel: DamageChannel): readonly Hurtbox[] {
        return this.queryTargets({ damageChannel: channel });
    }

    public static queryTargets(filter: TargetQueryFilter = {}): readonly Hurtbox[] {
        const activeTargets: Hurtbox[] = [];

        for (const [node, hurtbox] of this.hurtboxes) {
            if (!node.isValid || !hurtbox.isValid) {
                this.hurtboxes.delete(node);
                continue;
            }

            if (!matchesTargetQuery(hurtbox, filter)) {
                continue;
            }

            activeTargets.push(hurtbox);
        }

        return activeTargets;
    }
}
