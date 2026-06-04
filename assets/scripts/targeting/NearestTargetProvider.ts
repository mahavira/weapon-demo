import { _decorator, Component, Node } from 'cc';
import { ITargetProvider } from '../core/interfaces/ITargetProvider';

const { ccclass, property } = _decorator;

@ccclass('NearestTargetProvider')
export class NearestTargetProvider extends Component implements ITargetProvider {
    @property([Node])
    enemies: Node[] = [];

    @property(Node)
    fromNode: Node | null = null;

    public getTarget(): Node | null {
        if (!this.fromNode || this.enemies.length === 0) return null;

        let best: Node | null = null;
        let bestDistSq = Number.MAX_VALUE;
        const fromPos = this.fromNode.worldPosition;

        for (const enemy of this.enemies) {
            if (!enemy || !enemy.isValid) continue;

            const p = enemy.worldPosition;
            const dx = p.x - fromPos.x;
            const dy = p.y - fromPos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                best = enemy;
            }
        }

        return best;
    }

    public getTargetsInRange(center: Node, range: number): Node[] {
        const result: Node[] = [];
        const centerPos = center.worldPosition;
        const rangeSq = range * range;

        for (const enemy of this.enemies) {
            if (!enemy || !enemy.isValid) continue;

            const p = enemy.worldPosition;
            const dx = p.x - centerPos.x;
            const dy = p.y - centerPos.y;

            if (dx * dx + dy * dy <= rangeSq) {
                result.push(enemy);
            }
        }

        return result;
    }
}
