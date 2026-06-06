import {
    _decorator,
    Color,
    Graphics,
    Node,
    tween,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';
import { AttackBase } from './base/AttackBase';
import { AttackContext } from './base/AttackContext';
import { AttackPhase } from '../core/types/AttackTypes';
import { pickRandomChainTarget } from './ChainTargetPicker';
import { EnemyRegistry } from '../combat/EnemyRegistry';
import { Hurtbox } from '../enemy/base/Hurtbox';
import { HitInfo } from '../combat/HitInfo';
import { DamageResolver } from '../combat/DamageResolver';
import { DamageChannel } from '../core/types/DamageChannel';

const { ccclass, property } = _decorator;

@ccclass('ElectricCornChainAttack')
export class ElectricCornChainAttack extends AttackBase {
    @property
    maxTargets: number = 5;

    @property
    chainRange: number = 240;

    @property
    segmentDurationSeconds: number = 0.08;

    @property
    initialHitRadius: number = 48;

    @property
    bounceDamageScale: number = 1;

    private readonly visitedTargets = new Set<Node>();
    private readonly segmentVisualNodes: Node[] = [];

    public configureChain(params: {
        maxTargets?: number;
        chainRange?: number;
        segmentDurationSeconds?: number;
        initialHitRadius?: number;
        bounceDamageScale?: number;
    }): void {
        this.maxTargets = Math.max(1, Math.floor(params.maxTargets ?? this.maxTargets));
        this.chainRange = Math.max(1, params.chainRange ?? this.chainRange);
        this.segmentDurationSeconds = Math.max(0.02, params.segmentDurationSeconds ?? this.segmentDurationSeconds);
        this.initialHitRadius = Math.max(1, params.initialHitRadius ?? this.initialHitRadius);
        this.bounceDamageScale = Math.max(0, params.bounceDamageScale ?? this.bounceDamageScale);
    }

    public startAttack(attackContext: AttackContext): void {
        const initialTarget = this.resolveInitialTarget(attackContext);
        if (!initialTarget) {
            this.node.destroy();
            return;
        }

        this.attackContext = attackContext;
        this.isAttackActive = true;
        this.visitedTargets.clear();

        const sourceWorldPos = attackContext.spawnWorldPos.clone();
        const initialTargetWorldPos = this.getTargetWorldCenter(initialTarget);

        this.drawChainSegment(sourceWorldPos, initialTargetWorldPos, 1);
        this.applyDamageToTarget(initialTarget, initialTargetWorldPos);
        this.visitedTargets.add(initialTarget);

        let currentTarget = initialTarget;
        let currentSourceWorldPos = initialTargetWorldPos;

        while (this.visitedTargets.size < this.maxTargets) {
            const nextTarget = this.pickRandomNextTarget(currentTarget);
            if (!nextTarget) {
                break;
            }

            const nextTargetWorldPos = this.getTargetWorldCenter(nextTarget);
            this.drawChainSegment(currentSourceWorldPos, nextTargetWorldPos, 0.85);
            this.applyDamageToTarget(nextTarget, nextTargetWorldPos);
            this.visitedTargets.add(nextTarget);

            currentTarget = nextTarget;
            currentSourceWorldPos = nextTargetWorldPos;
        }

        this.scheduleOnce(() => this.stopAttack(), this.segmentDurationSeconds + 0.02);
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

    private resolveInitialTarget(attackContext: AttackContext): Node | null {
        const targetNode = attackContext.targetNode;
        if (this.isTargetNodeValid(targetNode)) {
            return targetNode;
        }

        const fallbackTargets = EnemyRegistry.getDamageableTargets(DamageChannel.Projectile);
        let fallbackTarget: Node | null = null;
        let nearestDistanceSq = this.initialHitRadius * this.initialHitRadius;

        for (const hurtbox of fallbackTargets) {
            const targetNodeCandidate = hurtbox.node;
            if (!this.isTargetNodeValid(targetNodeCandidate)) {
                continue;
            }

            const targetWorldPos = hurtbox.getWorldCenter();
            const dx = targetWorldPos.x - attackContext.spawnWorldPos.x;
            const dy = targetWorldPos.y - attackContext.spawnWorldPos.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= nearestDistanceSq) {
                nearestDistanceSq = distanceSq;
                fallbackTarget = targetNodeCandidate;
            }
        }

        return fallbackTarget;
    }

    private pickRandomNextTarget(fromTarget: Node): Node | null {
        const currentWorldPos = this.getTargetWorldCenter(fromTarget);
        const rangeSq = this.chainRange * this.chainRange;
        const candidates: Node[] = [];

        for (const hurtbox of EnemyRegistry.getDamageableTargets(DamageChannel.Projectile)) {
            const candidateNode = hurtbox.node;
            if (!this.isTargetNodeValid(candidateNode) || this.visitedTargets.has(candidateNode)) {
                continue;
            }

            const candidateWorldPos = hurtbox.getWorldCenter();
            const dx = candidateWorldPos.x - currentWorldPos.x;
            const dy = candidateWorldPos.y - currentWorldPos.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= rangeSq) {
                candidates.push(candidateNode);
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        return pickRandomChainTarget(candidates);
    }

    private applyDamageToTarget(target: Node, hitWorldPos: Vec3): void {
        if (!this.attackContext) {
            return;
        }

        const attackDamage = this.attackContext.attackDamage.cloneWithAmount(
            this.attackContext.attackDamage.amount * this.bounceDamageScale
        );

        const hitInfo = new HitInfo({
            attackerNode: this.attackContext.attackerNode,
            targetNode: target,
            hitWorldPos: hitWorldPos.clone(),
            attackDamage,
            phase: AttackPhase.Impact,
        });

        DamageResolver.applyDamage(hitInfo);
    }

    private getTargetWorldCenter(target: Node): Vec3 {
        const hurtbox = target.getComponent(Hurtbox);
        return hurtbox?.getWorldCenter() ?? target.worldPosition.clone();
    }

    private isTargetNodeValid(target: Node | null): target is Node {
        if (!target || !target.isValid) {
            return false;
        }

        const hurtbox = target.getComponent(Hurtbox);
        return !!hurtbox && hurtbox.canBeTargeted() && hurtbox.canBeHitBy(DamageChannel.Projectile);
    }

    private drawChainSegment(fromWorldPos: Vec3, toWorldPos: Vec3, alphaScale: number): void {
        if (!this.node.isValid) {
            return;
        }

        const segmentNode = new Node('LightningSegment');
        this.node.addChild(segmentNode);
        segmentNode.setWorldPosition(fromWorldPos);

        const transform = segmentNode.addComponent(UITransform);
        const opacity = segmentNode.addComponent(UIOpacity);
        const graphics = segmentNode.addComponent(Graphics);

        const dx = toWorldPos.x - fromWorldPos.x;
        const dy = toWorldPos.y - fromWorldPos.y;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const segmentHeight = Math.max(48, Math.min(180, distance * 0.45));
        transform.setContentSize(distance, segmentHeight);
        segmentNode.angle = Math.atan2(dy, dx) * 180 / Math.PI;

        opacity.opacity = Math.round(255 * Math.max(0.2, alphaScale));
        this.renderLightningStroke(graphics, distance, segmentHeight, alphaScale);

        this.segmentVisualNodes.push(segmentNode);
        tween(opacity)
            .to(this.segmentDurationSeconds, { opacity: 0 })
            .call(() => {
                const segmentIndex = this.segmentVisualNodes.indexOf(segmentNode);
                if (segmentIndex >= 0) {
                    this.segmentVisualNodes.splice(segmentIndex, 1);
                }

                if (segmentNode.isValid) {
                    segmentNode.destroy();
                }
            })
            .start();
    }

    private renderLightningStroke(graphics: Graphics, distance: number, segmentHeight: number, alphaScale: number): void {
        graphics.clear();

        const coreColor = new Color(255, 250, 220, Math.round(255 * Math.max(0.25, alphaScale)));
        const glowColor = new Color(108, 214, 255, Math.round(190 * Math.max(0.25, alphaScale)));
        const pointCount = Math.max(4, Math.floor(distance / 32));
        const halfHeight = segmentHeight * 0.5;
        const baseAmplitude = Math.max(8, Math.min(24, distance * 0.08));

        const buildPoints = (amplitudeScale: number) => {
            const points: Vec3[] = [];
            for (let index = 0; index <= pointCount; index++) {
                const ratio = index / pointCount;
                const x = ratio * distance;

                let y = 0;
                if (index > 0 && index < pointCount) {
                    const direction = index % 2 === 0 ? 1 : -1;
                    y = direction * baseAmplitude * amplitudeScale * (0.4 + Math.random() * 0.6);
                }

                points.push(new Vec3(x, Math.max(-halfHeight, Math.min(halfHeight, y)), 0));
            }

            return points;
        };

        const drawPolyline = (points: Vec3[], color: Color, lineWidth: number) => {
            graphics.strokeColor = color;
            graphics.lineWidth = lineWidth;
            graphics.moveTo(points[0].x, points[0].y);
            for (let index = 1; index < points.length; index++) {
                graphics.lineTo(points[index].x, points[index].y);
            }
            graphics.stroke();
        };

        drawPolyline(buildPoints(1.5), glowColor, 6);
        drawPolyline(buildPoints(1), coreColor, 2.4);

        graphics.fillColor = coreColor;
        graphics.circle(0, 0, 4);
        graphics.circle(distance, 0, 4);
        graphics.fill();
    }

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        this.attackContext = null;
        this.visitedTargets.clear();
        Tween.stopAllByTarget(this.node);

        while (this.segmentVisualNodes.length > 0) {
            const segmentNode = this.segmentVisualNodes.pop();
            if (segmentNode?.isValid) {
                Tween.stopAllByTarget(segmentNode);
                const opacity = segmentNode.getComponent(UIOpacity);
                if (opacity) {
                    Tween.stopAllByTarget(opacity);
                }
                segmentNode.destroy();
            }
        }
    }
}
