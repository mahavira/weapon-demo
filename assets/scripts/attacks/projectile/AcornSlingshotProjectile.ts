import { _decorator, Node, Tween, UITransform, Vec3, tween, view } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackPhase } from '../../core/types/AttackTypes';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageChannel } from '../../core/types/DamageChannel';
import { Hurtbox } from '../../enemy/base/Hurtbox';
import {
    AcornSlingshotRuntimeConfig,
    buildAcornSlingshotRuntimeConfig,
} from '../AcornSlingshotRuntimeConfig';
import { buildRicochetTargetCandidates, pickRicochetTarget } from '../AcornRicochetTargetPicker';
import { getVisibleAreaRect, isNodeFullyOutsideVisibleArea } from './ProjectileViewportCulling';

const { ccclass, property } = _decorator;

@ccclass('AcornSlingshotProjectile')
export class AcornSlingshotProjectile extends AttackBase {
    @property
    travelSpeed: number = 960;

    @property
    rotateSpeed: number = 12;

    @property
    autoFaceDirection: boolean = true;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private runtimeConfig: AcornSlingshotRuntimeConfig = buildAcornSlingshotRuntimeConfig({});
    private visitedTargets = new Set<Node>();
    private previousTargetNode: Node | null = null;
    private currentTargetNode: Node | null = null;
    private hitCount: number = 0;

    public configureRicochet(params: Partial<AcornSlingshotRuntimeConfig>): void {
        this.runtimeConfig = buildAcornSlingshotRuntimeConfig(params);
    }

    public startAttack(attackContext: AttackContext): void {
        const initialTargetNode = attackContext.targetNode;
        if (!this.isTargetNodeValid(initialTargetNode)) {
            this.node.destroy();
            return;
        }

        this.attackContext = attackContext;
        this.isAttackActive = true;
        this.visitedTargets.clear();
        this.previousTargetNode = null;
        this.currentTargetNode = initialTargetNode;
        this.hitCount = 0;

        this.node.setWorldPosition(attackContext.spawnWorldPos);
        this.node.active = true;
        this.flyToTarget(initialTargetNode);
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) {
            return;
        }

        this.cleanupRuntimeState();
        this.node.destroy();
    }

    protected onDestroy(): void {
        this.cleanupRuntimeState();
    }

    private flyToTarget(targetNode: Node): void {
        if (!this.attackContext || !this.isAttackActive || !this.isTargetNodeValid(targetNode)) {
            this.stopAttack();
            return;
        }

        this.currentTargetNode = targetNode;
        const startWorldPos = this.node.worldPosition.clone();
        const destinationWorldPos = this.getTargetWorldCenter(targetNode);

        if (this.autoFaceDirection) {
            this.faceTo(destinationWorldPos);
        }

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(this.buildTravelDuration(startWorldPos, destinationWorldPos), {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAttackActive || !this.node.isValid) {
                        return;
                    }

                    const currentWorldPos = new Vec3(
                        startWorldPos.x + (destinationWorldPos.x - startWorldPos.x) * ratio,
                        startWorldPos.y + (destinationWorldPos.y - startWorldPos.y) * ratio,
                        startWorldPos.z + (destinationWorldPos.z - startWorldPos.z) * ratio
                    );

                    this.node.setWorldPosition(currentWorldPos);

                    if (!this.autoFaceDirection && this.rotateSpeed !== 0) {
                        this.node.angle -= this.rotateSpeed;
                    }

                    if (this.shouldCullOutsideVisibleArea()) {
                        this.stopAttack();
                    }
                },
            })
            .call(() => this.handleTargetArrival(targetNode))
            .start();
    }

    private handleTargetArrival(targetNode: Node): void {
        if (!this.attackContext || !this.isAttackActive) {
            return;
        }

        if (!this.isTargetNodeValid(targetNode)) {
            this.stopAttack();
            return;
        }

        const hitWorldPos = this.getTargetWorldCenter(targetNode);
        this.node.setWorldPosition(hitWorldPos);
        this.applyDamageToTarget(targetNode, hitWorldPos);
        this.visitedTargets.add(targetNode);
        this.hitCount += 1;

        if (this.hitCount >= this.runtimeConfig.maxHits) {
            this.stopAttack();
            return;
        }

        const nextTargetNode = this.pickNextTarget(targetNode, hitWorldPos);
        this.previousTargetNode = targetNode;

        if (!nextTargetNode) {
            this.stopAttack();
            return;
        }

        this.flyToTarget(nextTargetNode);
    }

    private pickNextTarget(currentTargetNode: Node, currentWorldPos: Vec3): Node | null {
        const candidates = buildRicochetTargetCandidates(
            EnemyRegistry.getDamageableTargets(DamageChannel.Projectile)
                .map((hurtbox) => hurtbox.node)
                .filter((targetNode) => this.isTargetNodeValid(targetNode) && targetNode !== currentTargetNode),
            (targetNode) => this.getTargetWorldCenter(targetNode)
        );

        return pickRicochetTarget({
            currentWorldPos,
            previousTarget: this.previousTargetNode,
            visitedTargets: this.visitedTargets,
            ricochetRange: this.runtimeConfig.ricochetRange,
            candidates,
            allowBounceBackToPreviousTarget: this.runtimeConfig.allowBounceBackToPreviousTarget,
        });
    }

    private applyDamageToTarget(targetNode: Node, hitWorldPos: Vec3): void {
        if (!this.attackContext) {
            return;
        }

        DamageResolver.applyDamage(new HitInfo({
            attackerNode: this.attackContext.attackerNode,
            targetNode,
            hitWorldPos: hitWorldPos.clone(),
            attackDamage: this.attackContext.attackDamage,
            phase: AttackPhase.Impact,
        }));
    }

    private buildTravelDuration(startWorldPos: Vec3, destinationWorldPos: Vec3): number {
        const distance = Vec3.distance(startWorldPos, destinationWorldPos);
        const safeTravelSpeed = Math.max(1, this.travelSpeed);
        return Math.max(0.01, distance / safeTravelSpeed);
    }

    private faceTo(destinationWorldPos: Vec3): void {
        const currentWorldPos = this.node.worldPosition;
        const dx = destinationWorldPos.x - currentWorldPos.x;
        const dy = destinationWorldPos.y - currentWorldPos.y;
        this.node.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    }

    private getTargetWorldCenter(targetNode: Node): Vec3 {
        const hurtbox = targetNode.getComponent(Hurtbox);
        return hurtbox?.getWorldCenter() ?? targetNode.worldPosition.clone();
    }

    private isTargetNodeValid(targetNode: Node | null): targetNode is Node {
        if (!targetNode || !targetNode.isValid) {
            return false;
        }

        const hurtbox = targetNode.getComponent(Hurtbox);
        return !!hurtbox && hurtbox.canBeTargeted() && hurtbox.canBeHitBy(DamageChannel.Projectile);
    }

    private shouldCullOutsideVisibleArea(): boolean {
        if (!this.destroyWhenExitVisibleArea) {
            return false;
        }

        const uiTransform = this.node.getComponent(UITransform);
        return isNodeFullyOutsideVisibleArea(uiTransform, getVisibleAreaRect(view));
    }

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        Tween.stopAllByTarget(this.node);
        this.attackContext = null;
        this.visitedTargets.clear();
        this.previousTargetNode = null;
        this.currentTargetNode = null;
        this.hitCount = 0;
    }
}
