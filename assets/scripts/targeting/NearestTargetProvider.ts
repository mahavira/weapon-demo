import { _decorator, Component, Node } from 'cc';
import { ITargetProvider } from '../core/interfaces/ITargetProvider';
import { EnemyRegistry } from '../combat/EnemyRegistry';
import { findNearestTarget, findTargetsWithinRange, TargetSelectionCandidate } from './TargetSelection';

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
        return EnemyRegistry.getTargetableTargets()
            .map((hurtbox) => {
                const targetNode = hurtbox.node;
                if (!targetNode || !targetNode.isValid) {
                    return null;
                }

                return {
                    target: targetNode,
                    worldPos: targetNode.worldPosition,
                };
            })
            .filter((candidate): candidate is TargetSelectionCandidate<Node> => candidate !== null);
    }

    private buildAreaSelectionCandidates(): TargetSelectionCandidate<Node>[] {
        return EnemyRegistry.getTargetableTargets()
            .map((hurtbox) => {
                const targetNode = hurtbox.node;
                if (!targetNode || !targetNode.isValid) {
                    return null;
                }

                return {
                    target: targetNode,
                    worldPos: hurtbox.getWorldCenter(),
                };
            })
            .filter((candidate): candidate is TargetSelectionCandidate<Node> => candidate !== null);
    }
}
