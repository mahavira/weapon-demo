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
    chainRange: number = 340;

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
    private readonly segmentVisualNodes: Node[] = [];
    private activeScheduledHits: number = 0;

    public configureChain(params: {
        maxTargets?: number;
        chainRange?: number;
        segmentDurationSeconds?: number;
        initialHitRadius?: number;
        bounceDamageScale?: number;
        hitDelaySeconds?: number;
        lateralAmplitudeScale?: number;
        keepPreviousSegmentsVisible?: boolean;
    }): void {
        this.maxTargets = Math.max(1, Math.floor(params.maxTargets ?? this.maxTargets));
        this.chainRange = Math.max(1, params.chainRange ?? this.chainRange);
        this.segmentDurationSeconds = Math.max(0.02, params.segmentDurationSeconds ?? this.segmentDurationSeconds);
        this.initialHitRadius = Math.max(1, params.initialHitRadius ?? this.initialHitRadius);
        this.bounceDamageScale = Math.max(0, params.bounceDamageScale ?? this.bounceDamageScale);
        this.hitDelaySeconds = Math.max(0, params.hitDelaySeconds ?? this.hitDelaySeconds);
        this.lateralAmplitudeScale = Math.max(0.1, params.lateralAmplitudeScale ?? this.lateralAmplitudeScale);
        this.keepPreviousSegmentsVisible = params.keepPreviousSegmentsVisible ?? this.keepPreviousSegmentsVisible;
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
        this.activeScheduledHits = 0;

        this.scheduleChainHit(
            attackContext.spawnWorldPos.clone(),
            initialTarget,
            1,
            0,
            null
        );
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

    private scheduleChainHit(
        fromWorldPos: Vec3,
        target: Node,
        alphaScale: number,
        chainIndex: number,
        fromTarget: Node | null
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

            if (!this.isTargetNodeValid(target) || this.visitedTargets.has(target)) {
                this.tryFinishAttack();
                return;
            }

            const targetWorldPos = this.getTargetWorldCenter(target);
            this.drawChainSegment(fromWorldPos, targetWorldPos, alphaScale, chainIndex);
            this.applyDamageToTarget(target, targetWorldPos);
            this.visitedTargets.add(target);

            if (this.visitedTargets.size >= this.maxTargets) {
                this.tryFinishAttack();
                return;
            }

            const nextTarget = this.pickRandomNextTarget(target);
            if (!nextTarget) {
                this.tryFinishAttack();
                return;
            }

            const nextAlphaScale = Math.max(0.55, alphaScale * 0.92);
            this.scheduleChainHit(
                targetWorldPos.clone(),
                nextTarget,
                nextAlphaScale,
                chainIndex + 1,
                fromTarget ?? target
            );

            this.tryFinishAttack();
        }, chainIndex * this.hitDelaySeconds);
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

    private drawChainSegment(fromWorldPos: Vec3, toWorldPos: Vec3, alphaScale: number, chainIndex: number): void {
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
        this.renderLightningStroke(graphics, distance, segmentHeight, alphaScale, chainIndex);
        this.spawnImpactPulse(fromWorldPos, alphaScale * 0.85, true);
        this.spawnImpactPulse(toWorldPos, alphaScale, false);
        this.spawnOrbitalSparks(segmentNode, distance, segmentHeight, alphaScale);

        this.segmentVisualNodes.push(segmentNode);
        const redrawCount = Math.max(2, Math.ceil(this.segmentDurationSeconds / 0.02));
        const redrawTween = tween(graphics);
        const redrawStep = tween()
            .delay(this.segmentDurationSeconds / redrawCount)
            .call(() => {
                if (!graphics.isValid || !segmentNode.isValid) return;
                this.renderLightningStroke(graphics, distance, segmentHeight, alphaScale, chainIndex);
            });

        if (this.keepPreviousSegmentsVisible) {
            redrawTween.repeatForever(redrawStep).start();
        } else {
            redrawTween.repeat(redrawCount, redrawStep).start();
        }

        if (this.keepPreviousSegmentsVisible) {
            tween(opacity)
                .delay(this.segmentDurationSeconds)
                .to(0.16, { opacity: Math.round(92 * Math.max(0.2, alphaScale)) })
                .start();
            return;
        }

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

    private renderLightningStroke(
        graphics: Graphics,
        distance: number,
        segmentHeight: number,
        alphaScale: number,
        chainIndex: number
    ): void {
        graphics.clear();

        const coreColor = new Color(255, 250, 220, Math.round(255 * Math.max(0.25, alphaScale)));
        const glowColor = new Color(108, 214, 255, Math.round(190 * Math.max(0.25, alphaScale)));
        const branchGlowColor = new Color(120, 236, 255, Math.round(128 * Math.max(0.2, alphaScale)));
        const haloColor = new Color(62, 144, 255, Math.round(90 * Math.max(0.18, alphaScale)));
        const pointCount = Math.max(4, Math.floor(distance / 32));
        const halfHeight = segmentHeight * 0.5;
        const baseAmplitude = Math.max(4, Math.min(12, distance * 0.04)) * this.lateralAmplitudeScale * 2;

        const buildPoints = (amplitudeScale: number) => {
            const points: Vec3[] = [];
            for (let index = 0; index <= pointCount; index++) {
                const ratio = index / pointCount;
                const x = ratio * distance;

                let y = 0;
                if (index > 0 && index < pointCount) {
                    const direction = index % 2 === 0 ? 1 : -1;
                    const chainPulse = 0.9 + Math.sin(chainIndex * 0.7 + ratio * Math.PI * 2) * 0.12;
                    y = direction * baseAmplitude * amplitudeScale * chainPulse * (0.4 + Math.random() * 0.6);
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

        const glowPoints = buildPoints(1.5);
        const corePoints = buildPoints(1);
        drawPolyline(buildPoints(2.1), haloColor, 11);
        drawPolyline(glowPoints, glowColor, 6.8);
        drawPolyline(corePoints, coreColor, 2.4);
        this.drawLightningBranches(graphics, corePoints, branchGlowColor, coreColor, baseAmplitude, halfHeight);
        this.drawEnergyFlowStreaks(graphics, distance, corePoints, alphaScale);

        graphics.fillColor = coreColor;
        graphics.circle(0, 0, 4);
        graphics.circle(distance, 0, 4);
        graphics.fill();
    }

    private drawLightningBranches(
        graphics: Graphics,
        mainPoints: readonly Vec3[],
        glowColor: Color,
        coreColor: Color,
        baseAmplitude: number,
        halfHeight: number
    ): void {
        if (mainPoints.length < 4) {
            return;
        }

        const branchCount = Math.max(1, Math.min(3, Math.floor(mainPoints.length / 3)));
        for (let branchIndex = 0; branchIndex < branchCount; branchIndex++) {
            const anchorIndex = 1 + Math.floor(Math.random() * (mainPoints.length - 2));
            const anchorPoint = mainPoints[anchorIndex];
            if (!anchorPoint) {
                continue;
            }

            const branchLength = (18 + Math.random() * 26) * (0.7 + branchIndex * 0.08);
            const branchDirection = Math.random() > 0.5 ? 1 : -1;
            const branchTip = new Vec3(
                anchorPoint.x + branchLength * (0.45 + Math.random() * 0.4),
                Math.max(
                    -halfHeight,
                    Math.min(
                        halfHeight,
                        anchorPoint.y + branchDirection * baseAmplitude * (0.9 + Math.random() * 0.6)
                    )
                ),
                0
            );

            graphics.strokeColor = glowColor;
            graphics.lineWidth = 3.6;
            graphics.moveTo(anchorPoint.x, anchorPoint.y);
            graphics.lineTo(branchTip.x, branchTip.y);
            graphics.stroke();

            graphics.strokeColor = coreColor;
            graphics.lineWidth = 1.2;
            graphics.moveTo(anchorPoint.x, anchorPoint.y);
            graphics.lineTo(branchTip.x, branchTip.y);
            graphics.stroke();
        }
    }

    private drawEnergyFlowStreaks(
        graphics: Graphics,
        distance: number,
        mainPoints: readonly Vec3[],
        alphaScale: number
    ): void {
        if (mainPoints.length < 3) {
            return;
        }

        graphics.strokeColor = new Color(255, 255, 255, Math.round(120 * Math.max(0.2, alphaScale)));
        graphics.lineWidth = 1.1;
        for (let index = 0; index < 3; index++) {
            const startRatio = 0.12 + index * 0.24 + Math.random() * 0.06;
            const endRatio = Math.min(0.96, startRatio + 0.12 + Math.random() * 0.08);
            const startX = distance * startRatio;
            const endX = distance * endRatio;
            const startPoint = this.samplePointAlongPath(mainPoints, startX);
            const endPoint = this.samplePointAlongPath(mainPoints, endX);

            graphics.moveTo(startPoint.x, startPoint.y);
            graphics.lineTo(endPoint.x, endPoint.y);
            graphics.stroke();
        }
    }

    private samplePointAlongPath(points: readonly Vec3[], targetX: number): Vec3 {
        if (points.length === 0) {
            return new Vec3();
        }

        for (let index = 1; index < points.length; index++) {
            const previousPoint = points[index - 1];
            const nextPoint = points[index];
            if (targetX <= nextPoint.x) {
                const span = Math.max(0.0001, nextPoint.x - previousPoint.x);
                const ratio = (targetX - previousPoint.x) / span;
                return new Vec3(
                    previousPoint.x + (nextPoint.x - previousPoint.x) * ratio,
                    previousPoint.y + (nextPoint.y - previousPoint.y) * ratio,
                    0
                );
            }
        }

        return points[points.length - 1].clone();
    }

    private spawnImpactPulse(worldPos: Vec3, alphaScale: number, isSourcePulse: boolean): void {
        if (!this.node.isValid) {
            return;
        }

        const pulseNode = new Node(isSourcePulse ? 'LightningSourcePulse' : 'LightningImpactPulse');
        this.node.addChild(pulseNode);
        pulseNode.setWorldPosition(worldPos);

        const transform = pulseNode.addComponent(UITransform);
        const opacity = pulseNode.addComponent(UIOpacity);
        const graphics = pulseNode.addComponent(Graphics);
        const pulseState = {
            coreRadius: isSourcePulse ? 7 : 5,
            ringRadius: isSourcePulse ? 12 : 9,
        };

        transform.setContentSize(pulseState.ringRadius * 4, pulseState.ringRadius * 4);
        opacity.opacity = Math.round(255 * Math.max(0.18, alphaScale));

        const redraw = () => {
            if (!graphics.isValid) return;

            graphics.clear();
            graphics.fillColor = new Color(255, 252, 232, Math.round(220 * Math.max(0.2, alphaScale)));
            graphics.circle(0, 0, pulseState.coreRadius);
            graphics.fill();

            graphics.strokeColor = new Color(94, 220, 255, Math.round(190 * Math.max(0.2, alphaScale)));
            graphics.lineWidth = isSourcePulse ? 3 : 2.2;
            graphics.circle(0, 0, pulseState.ringRadius);
            graphics.stroke();

            graphics.strokeColor = new Color(170, 246, 255, Math.round(120 * Math.max(0.2, alphaScale)));
            graphics.lineWidth = 1.4;
            for (let index = 0; index < 4; index++) {
                const radians = index / 4 * Math.PI * 2 + Math.PI * 0.25;
                const innerRadius = pulseState.coreRadius + 1;
                const outerRadius = pulseState.ringRadius + (isSourcePulse ? 6 : 4);
                graphics.moveTo(Math.cos(radians) * innerRadius, Math.sin(radians) * innerRadius);
                graphics.lineTo(Math.cos(radians) * outerRadius, Math.sin(radians) * outerRadius);
                graphics.stroke();
            }
        };

        redraw();

        tween(pulseState)
            .to(this.segmentDurationSeconds, {
                coreRadius: pulseState.coreRadius + (isSourcePulse ? 4 : 3),
                ringRadius: pulseState.ringRadius + (isSourcePulse ? 12 : 8),
            }, {
                onUpdate: () => redraw(),
            })
            .start();

        tween(opacity)
            .to(this.segmentDurationSeconds, { opacity: 0 })
            .call(() => {
                if (pulseNode.isValid) {
                    pulseNode.destroy();
                }
            })
            .start();
    }

    private spawnOrbitalSparks(parentNode: Node, distance: number, segmentHeight: number, alphaScale: number): void {
        const sparkCount = Math.max(2, Math.min(4, Math.floor(distance / 90)));
        for (let index = 0; index < sparkCount; index++) {
            const sparkNode = new Node('LightningSpark');
            parentNode.addChild(sparkNode);

            const transform = sparkNode.addComponent(UITransform);
            const opacity = sparkNode.addComponent(UIOpacity);
            const graphics = sparkNode.addComponent(Graphics);

            transform.setContentSize(36, 36);
            opacity.opacity = Math.round(180 * Math.max(0.2, alphaScale));

            const startX = distance * (0.18 + index * 0.2 + Math.random() * 0.08);
            const startY = (Math.random() - 0.5) * segmentHeight * 0.35;
            sparkNode.setPosition(startX, startY, 0);

            graphics.fillColor = new Color(255, 252, 232, Math.round(220 * Math.max(0.2, alphaScale)));
            graphics.circle(0, 0, 2.6 + Math.random() * 1.8);
            graphics.fill();

            tween(sparkNode)
                .to(this.segmentDurationSeconds, {
                    position: new Vec3(
                        startX + 20 + Math.random() * 18,
                        startY + (Math.random() - 0.5) * segmentHeight * 0.26,
                        0
                    ),
                })
                .call(() => {
                    if (sparkNode.isValid) {
                        sparkNode.destroy();
                    }
                })
                .start();

            tween(opacity)
                .to(this.segmentDurationSeconds, { opacity: 0 })
                .start();
        }
    }

    private tryFinishAttack(): void {
        if (!this.isAttackActive || this.activeScheduledHits > 0) {
            return;
        }

        const cleanupDelay = this.segmentDurationSeconds + 0.04;
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
        Tween.stopAllByTarget(this.node);

        while (this.segmentVisualNodes.length > 0) {
            const segmentNode = this.segmentVisualNodes.pop();
            if (segmentNode?.isValid) {
                Tween.stopAllByTarget(segmentNode);
                const segmentGraphics = segmentNode.getComponent(Graphics);
                if (segmentGraphics) {
                    Tween.stopAllByTarget(segmentGraphics);
                }
                const opacity = segmentNode.getComponent(UIOpacity);
                if (opacity) {
                    Tween.stopAllByTarget(opacity);
                }
                segmentNode.destroy();
            }
        }
    }
}
