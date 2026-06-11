import { _decorator, Node, Tween, Vec3 } from 'cc';
import { AttackBase } from './base/AttackBase';
import { AttackContext } from './base/AttackContext';
import { AttackPhase } from '../core/types/AttackTypes';
import { pickRandomChainTarget } from './ChainTargetPicker';
import {
    buildChainLightningRuntimeConfig,
    ChainLightningRuntimeConfig,
} from './ChainLightningRuntimeConfig';
import {
    ChainLightningRenderer,
    ChainLightningVisualParams,
} from './ChainLightningRenderer';
import { EnemyRegistry } from '../combat/EnemyRegistry';
import { Hurtbox } from '../enemy/base/Hurtbox';
import { HitInfo } from '../combat/HitInfo';
import { DamageResolver } from '../combat/DamageResolver';
import { DamageChannel } from '../core/types/DamageChannel';

const { ccclass, property } = _decorator;

@ccclass('ChainLightningAttack')
export class ChainLightningAttack extends AttackBase {
    @property
    maxTargets: number = 5;

    @property
    chainRange: number = 240;

    @property
    segmentDurationSeconds: number = 0.38;

    @property
    initialHitRadius: number = 48;

    @property
    bounceDamageScale: number = 1;

    @property
    hitDelaySeconds: number = 0.02;

    @property
    lateralAmplitudeScale: number = 0.5;

    @property
    keepPreviousSegmentsVisible: boolean = true;

    private readonly visitedTargets = new Set<Node>();
    private readonly lightningRenderer = new ChainLightningRenderer();
    private activeScheduledHits: number = 0;
    private runtimeConfig: ChainLightningRuntimeConfig = buildChainLightningRuntimeConfig({});

    public configureChain(params: Partial<ChainLightningRuntimeConfig>): void {
        this.runtimeConfig = buildChainLightningRuntimeConfig({
            maxTargets: params.maxTargets ?? this.maxTargets,
            chainRange: params.chainRange ?? this.chainRange,
            segmentDurationSeconds: params.segmentDurationSeconds ?? this.segmentDurationSeconds,
            initialHitRadius: params.initialHitRadius ?? this.initialHitRadius,
            bounceDamageScale: params.bounceDamageScale ?? this.bounceDamageScale,
            hitDelaySeconds: params.hitDelaySeconds ?? this.hitDelaySeconds,
            lateralAmplitudeScale: params.lateralAmplitudeScale ?? this.lateralAmplitudeScale,
            keepPreviousSegmentsVisible: params.keepPreviousSegmentsVisible ?? this.keepPreviousSegmentsVisible,
        });

        this.maxTargets = this.runtimeConfig.maxTargets;
        this.chainRange = this.runtimeConfig.chainRange;
        this.segmentDurationSeconds = this.runtimeConfig.segmentDurationSeconds;
        this.initialHitRadius = this.runtimeConfig.initialHitRadius;
        this.bounceDamageScale = this.runtimeConfig.bounceDamageScale;
        this.hitDelaySeconds = this.runtimeConfig.hitDelaySeconds;
        this.lateralAmplitudeScale = this.runtimeConfig.lateralAmplitudeScale;
        this.keepPreviousSegmentsVisible = this.runtimeConfig.keepPreviousSegmentsVisible;
    }

    public startAttack(attackContext: AttackContext): void {
        const initialTarget = this.resolveInitialTarget(attackContext);
        if (!initialTarget) {
            this.releaseAttackNode();
            return;
        }

        this.attackContext = attackContext;
        this.isAttackActive = true;
        this.visitedTargets.clear();
        this.activeScheduledHits = 0;

        this.scheduleChainHit(attackContext.spawnWorldPos.clone(), initialTarget, 1, 0);
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) {
            return;
        }

        this.cleanupRuntimeState();
        this.releaseAttackNode();
    }

    protected onDestroy(): void {
        this.cleanupRuntimeState();
    }

    private resolveInitialTarget(attackContext: AttackContext): Node | null {
        const targetNode = attackContext.targetNode;
        if (this.isTargetNodeValid(targetNode)) {
            return targetNode;
        }

        let fallbackTarget: Node | null = null;
        let nearestDistanceSq = this.runtimeConfig.initialHitRadius * this.runtimeConfig.initialHitRadius;

        EnemyRegistry.forEachDamageableTarget(DamageChannel.Projectile, (hurtbox) => {
            const targetNodeCandidate = hurtbox.node;
            if (!this.isTargetNodeValid(targetNodeCandidate)) {
                return;
            }

            const targetWorldPos = hurtbox.getWorldCenter();
            const dx = targetWorldPos.x - attackContext.spawnWorldPos.x;
            const dy = targetWorldPos.y - attackContext.spawnWorldPos.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= nearestDistanceSq) {
                nearestDistanceSq = distanceSq;
                fallbackTarget = targetNodeCandidate;
            }
        });

        return fallbackTarget;
    }

    private scheduleChainHit(
        fromWorldPos: Vec3,
        targetNode: Node,
        alphaScale: number,
        chainIndex: number
    ): void {
        if (!this.node.isValid) {
            return;
        }

        this.activeScheduledHits += 1;
        this.scheduleOnce(() => {
            this.activeScheduledHits = Math.max(0, this.activeScheduledHits - 1);
            if (!this.isAttackActive || !this.attackContext || !this.node.isValid) {
                this.tryFinishAttack();
                return;
            }

            if (!this.isTargetNodeValid(targetNode) || this.visitedTargets.has(targetNode)) {
                this.tryFinishAttack();
                return;
            }

            const targetWorldPos = this.getTargetWorldCenter(targetNode);
            this.lightningRenderer.spawnSegment(this.node, this.buildLightningVisualParams(
                fromWorldPos,
                targetWorldPos,
                alphaScale,
                chainIndex
            ));

            this.applyDamageToTarget(targetNode, targetWorldPos);
            this.visitedTargets.add(targetNode);

            if (this.visitedTargets.size >= this.runtimeConfig.maxTargets) {
                this.tryFinishAttack();
                return;
            }

            const nextTargetNode = this.pickRandomNextTarget(targetNode);
            if (!nextTargetNode) {
                this.tryFinishAttack();
                return;
            }

            const nextAlphaScale = Math.max(0.55, alphaScale * 0.92);
            this.scheduleChainHit(targetWorldPos.clone(), nextTargetNode, nextAlphaScale, chainIndex + 1);
            this.tryFinishAttack();
        }, chainIndex * this.runtimeConfig.hitDelaySeconds);
    }

    private buildLightningVisualParams(
        fromWorldPos: Vec3,
        toWorldPos: Vec3,
        alphaScale: number,
        chainIndex: number
    ): ChainLightningVisualParams {
        return {
            fromWorldPos,
            toWorldPos,
            alphaScale,
            chainIndex,
            segmentDurationSeconds: this.runtimeConfig.segmentDurationSeconds,
            lateralAmplitudeScale: this.runtimeConfig.lateralAmplitudeScale,
            keepPreviousSegmentsVisible: this.runtimeConfig.keepPreviousSegmentsVisible,
        };
    }

    private pickRandomNextTarget(fromTargetNode: Node): Node | null {
        const currentWorldPos = this.getTargetWorldCenter(fromTargetNode);
        const rangeSq = this.runtimeConfig.chainRange * this.runtimeConfig.chainRange;
        const candidateTargets: Node[] = [];

        EnemyRegistry.forEachDamageableTarget(DamageChannel.Projectile, (hurtbox) => {
            const candidateTargetNode = hurtbox.node;
            if (!this.isTargetNodeValid(candidateTargetNode) || this.visitedTargets.has(candidateTargetNode)) {
                return;
            }

            const candidateWorldPos = hurtbox.getWorldCenter();
            const dx = candidateWorldPos.x - currentWorldPos.x;
            const dy = candidateWorldPos.y - currentWorldPos.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= rangeSq) {
                candidateTargets.push(candidateTargetNode);
            }
        });

        if (candidateTargets.length === 0) {
            return null;
        }

        return pickRandomChainTarget(candidateTargets);
    }

    private applyDamageToTarget(targetNode: Node, hitWorldPos: Vec3): void {
        if (!this.attackContext) {
            return;
        }

        const attackDamage = this.attackContext.attackDamage.cloneWithAmount(
            this.attackContext.attackDamage.amount * this.runtimeConfig.bounceDamageScale
        );

        DamageResolver.applyDamage(new HitInfo({
            attackerNode: this.attackContext.attackerNode,
            targetNode,
            hitWorldPos: hitWorldPos.clone(),
            attackDamage,
            phase: AttackPhase.Impact,
        }));
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

    private tryFinishAttack(): void {
        if (!this.isAttackActive || this.activeScheduledHits > 0) {
            return;
        }

        const cleanupDelay = this.runtimeConfig.segmentDurationSeconds + 0.04;
        this.scheduleOnce(() => {
            if (this.isAttackActive) {
                this.stopAttack();
            }
        }, cleanupDelay);
    }

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        this.attackContext = null;
        this.visitedTargets.clear();
        this.activeScheduledHits = 0;
        this.unscheduleAllCallbacks();
        Tween.stopAllByTarget(this.node);
        this.lightningRenderer.cleanup();
    }
}
