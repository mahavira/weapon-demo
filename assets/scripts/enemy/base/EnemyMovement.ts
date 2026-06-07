import { _decorator, Canvas, Component, Tween, UITransform, Vec3, tween } from 'cc';

const { ccclass } = _decorator;

@ccclass('EnemyMovement')
export class EnemyMovement extends Component {
    private static readonly KNOCKBACK_DURATION_SECONDS = 0.18;

    public applyKnockback(directionWorldVec: Vec3, distance: number): void {
        const safeDistance = Math.max(0, distance);
        if (safeDistance <= 0) {
            return;
        }

        const startWorldPos = this.node.worldPosition.clone();
        const targetWorldPos = this.buildClampedKnockbackTargetWorldPos(directionWorldVec, startWorldPos, safeDistance);
        if (Vec3.equals(startWorldPos, targetWorldPos)) {
            return;
        }

        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(EnemyMovement.KNOCKBACK_DURATION_SECONDS, {}, {
                easing: 'quartOut',
                onUpdate: (_target, ratio: number) => {
                    const currentWorldPos = new Vec3(
                        startWorldPos.x + (targetWorldPos.x - startWorldPos.x) * ratio,
                        startWorldPos.y + (targetWorldPos.y - startWorldPos.y) * ratio,
                        startWorldPos.z + (targetWorldPos.z - startWorldPos.z) * ratio
                    );
                    this.node.setWorldPosition(currentWorldPos);
                },
            })
            .start();
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
    }

    private buildClampedKnockbackTargetWorldPos(directionWorldVec: Vec3, startWorldPos: Vec3, distance: number): Vec3 {
        const safeDirection = directionWorldVec.clone();
        safeDirection.z = 0;
        const directionLength = safeDirection.length();

        if (directionLength <= 0) {
            return this.clampWorldPosInsideVisibleArea(startWorldPos.clone());
        }

        safeDirection.multiplyScalar(1 / directionLength);

        return this.clampWorldPosInsideVisibleArea(new Vec3(
            startWorldPos.x + safeDirection.x * distance,
            startWorldPos.y + safeDirection.y * distance,
            startWorldPos.z
        ));
    }

    private clampWorldPosInsideVisibleArea(targetWorldPos: Vec3): Vec3 {
        const uiTransform = this.node.getComponent(UITransform);
        const halfWidth = (uiTransform?.contentSize.width ?? 0) * 0.5;
        const halfHeight = (uiTransform?.contentSize.height ?? 0) * 0.5;
        const battlefieldBounds = this.resolveBattlefieldBounds();

        return new Vec3(
            Math.max(
                battlefieldBounds.leftX + halfWidth,
                Math.min(targetWorldPos.x, battlefieldBounds.rightX - halfWidth)
            ),
            Math.max(
                battlefieldBounds.bottomY + halfHeight,
                Math.min(targetWorldPos.y, battlefieldBounds.topY - halfHeight)
            ),
            targetWorldPos.z
        );
    }

    private resolveBattlefieldBounds(): { leftX: number; rightX: number; bottomY: number; topY: number } {
        const canvasNode = this.findCanvasNode();
        const canvasTransform = canvasNode?.getComponent(UITransform);

        if (!canvasNode || !canvasTransform) {
            return {
                leftX: 0,
                rightX: 720,
                bottomY: 640,
                topY: 1280,
            };
        }

        const canvasWorldPos = canvasNode.worldPosition;
        const canvasWidth = canvasTransform.contentSize.width;
        const canvasHeight = canvasTransform.contentSize.height;
        const halfCanvasWidth = canvasWidth * 0.5;
        const halfCanvasHeight = canvasHeight * 0.5;

        return {
            leftX: canvasWorldPos.x - halfCanvasWidth,
            rightX: canvasWorldPos.x + halfCanvasWidth,
            bottomY: canvasWorldPos.y,
            topY: canvasWorldPos.y + halfCanvasHeight,
        };
    }

    private findCanvasNode(): Component['node'] | null {
        let currentNode = this.node.parent;

        while (currentNode) {
            if (currentNode.getComponent(Canvas)) {
                return currentNode;
            }

            currentNode = currentNode.parent;
        }

        return null;
    }
}
