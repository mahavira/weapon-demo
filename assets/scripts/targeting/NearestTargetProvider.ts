import { _decorator, Component, Node } from 'cc';
import { ITargetProvider } from '../core/interfaces/ITargetProvider';
import { EnemyRegistry } from '../combat/EnemyRegistry';

const { ccclass, property } = _decorator;

@ccclass('NearestTargetProvider')
export class NearestTargetProvider extends Component implements ITargetProvider {
    @property(Node)
    targetingOriginNode: Node | null = null;

    public getPrimaryTarget(): Node | null {
        if (!this.targetingOriginNode) {
            return null;
        }

        const originWorldPos = this.targetingOriginNode.worldPosition;
        let nearestTargetNode: Node | null = null;
        let nearestDistanceSq = Number.MAX_VALUE;

        EnemyRegistry.forEachTargetableTarget((hurtbox) => {
            const targetNode = hurtbox.node;
            if (!targetNode || !targetNode.isValid) {
                return;
            }

            const targetWorldPos = targetNode.worldPosition;
            const dx = targetWorldPos.x - originWorldPos.x;
            const dy = targetWorldPos.y - originWorldPos.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < nearestDistanceSq) {
                nearestDistanceSq = distanceSq;
                nearestTargetNode = targetNode;
            }
        });

        return nearestTargetNode;
    }

    public getTargetsWithinRange(center: Node, range: number): Node[] {
        const centerWorldPos = center.worldPosition;
        const rangeSq = range * range;
        const targets: Node[] = [];

        EnemyRegistry.forEachTargetableTarget((hurtbox) => {
            const targetNode = hurtbox.node;
            if (!targetNode || !targetNode.isValid) {
                return;
            }

            const targetWorldPos = hurtbox.getWorldCenter();
            const dx = targetWorldPos.x - centerWorldPos.x;
            const dy = targetWorldPos.y - centerWorldPos.y;

            if (dx * dx + dy * dy <= rangeSq) {
                targets.push(targetNode);
            }
        });

        return targets;
    }
}
