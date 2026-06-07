import { _decorator, Component, Node } from 'cc';
import { ITargetProvider } from '../core/interfaces/ITargetProvider';
import { EnemyRegistry } from '../combat/EnemyRegistry';
import { findNearestTarget, findTargetsWithinRange } from './TargetSelection';
import type { TargetSelectionCandidate } from './TargetSelection';

const { ccclass, property } = _decorator;

@ccclass('NearestTargetProvider')
export class NearestTargetProvider extends Component implements ITargetProvider {
    @property(Node)
    targetingOriginNode: Node | null = null;

    public getPrimaryTarget(): Node | null {
        if (!this.targetingOriginNode) {
            return null;
        }

        return findNearestTarget(
            this.targetingOriginNode.worldPosition,
            this.buildTargetSelectionCandidates()
        );
    }

    public getTargetsWithinRange(center: Node, range: number): Node[] {
        return findTargetsWithinRange(
            center.worldPosition,
            range,
            this.buildAreaSelectionCandidates()
        );
    }

    private buildTargetSelectionCandidates(): TargetSelectionCandidate<Node>[] {
        const candidates: TargetSelectionCandidate<Node>[] = [];

        for (const hurtbox of EnemyRegistry.getTargetableTargets()) {
            const targetNode = hurtbox.node;
            if (!targetNode || !targetNode.isValid) {
                continue;
            }

            candidates.push({
                target: targetNode,
                worldPos: targetNode.worldPosition,
            });
        }

        return candidates;
    }

    private buildAreaSelectionCandidates(): TargetSelectionCandidate<Node>[] {
        const candidates: TargetSelectionCandidate<Node>[] = [];

        for (const hurtbox of EnemyRegistry.getTargetableTargets()) {
            const targetNode = hurtbox.node;
            if (!targetNode || !targetNode.isValid) {
                continue;
            }

            candidates.push({
                target: targetNode,
                worldPos: hurtbox.getWorldCenter(),
            });
        }

        return candidates;
    }
}
