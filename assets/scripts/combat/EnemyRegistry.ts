import { Node } from 'cc';
import { Hurtbox } from '../enemy/base/Hurtbox';

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
        const activeTargets: Hurtbox[] = [];

        for (const [node, hurtbox] of this.hurtboxes) {
            if (!node.isValid || !hurtbox.isValid) {
                this.hurtboxes.delete(node);
                continue;
            }

            activeTargets.push(hurtbox);
        }

        return activeTargets;
    }
}
