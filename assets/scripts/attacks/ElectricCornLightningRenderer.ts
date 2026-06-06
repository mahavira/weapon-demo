import {
    Color,
    Graphics,
    Node,
    tween,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

export interface ElectricCornLightningVisualParams {
    fromWorldPos: Vec3;
    toWorldPos: Vec3;
    alphaScale: number;
    chainIndex: number;
    segmentDurationSeconds: number;
    lateralAmplitudeScale: number;
    keepPreviousSegmentsVisible: boolean;
}

export class ElectricCornLightningRenderer {
    private readonly segmentNodes: Node[] = [];

    public spawnSegment(hostNode: Node, params: ElectricCornLightningVisualParams): void {
        if (!hostNode.isValid) {
            return;
        }

        const segmentNode = new Node('LightningSegment');
        hostNode.addChild(segmentNode);
        segmentNode.setWorldPosition(params.fromWorldPos);

        const transform = segmentNode.addComponent(UITransform);
        const opacity = segmentNode.addComponent(UIOpacity);
        const graphics = segmentNode.addComponent(Graphics);

        const dx = params.toWorldPos.x - params.fromWorldPos.x;
        const dy = params.toWorldPos.y - params.fromWorldPos.y;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const segmentHeight = Math.max(48, Math.min(180, distance * 0.45));
        transform.setContentSize(distance, segmentHeight);
        segmentNode.angle = Math.atan2(dy, dx) * 180 / Math.PI;
        opacity.opacity = Math.round(255 * Math.max(0.2, params.alphaScale));

        this.renderLightningStroke(graphics, distance, segmentHeight, params);
        this.spawnImpactPulse(hostNode, params.fromWorldPos, params.alphaScale * 0.85, true, params.segmentDurationSeconds);
        this.spawnImpactPulse(hostNode, params.toWorldPos, params.alphaScale, false, params.segmentDurationSeconds);
        this.spawnOrbitalSparks(segmentNode, distance, segmentHeight, params.alphaScale, params.segmentDurationSeconds);

        this.segmentNodes.push(segmentNode);
        const redrawCount = Math.max(2, Math.ceil(params.segmentDurationSeconds / 0.02));
        const redrawTween = tween(graphics);
        const redrawStep = tween()
            .delay(params.segmentDurationSeconds / redrawCount)
            .call(() => {
                if (!graphics.isValid || !segmentNode.isValid) return;
                this.renderLightningStroke(graphics, distance, segmentHeight, params);
            });

        if (params.keepPreviousSegmentsVisible) {
            redrawTween.repeatForever(redrawStep).start();
            tween(opacity)
                .delay(params.segmentDurationSeconds)
                .to(0.16, { opacity: Math.round(92 * Math.max(0.2, params.alphaScale)) })
                .start();
            return;
        }

        redrawTween.repeat(redrawCount, redrawStep).start();
        tween(opacity)
            .to(params.segmentDurationSeconds, { opacity: 0 })
            .call(() => this.destroySegmentNode(segmentNode))
            .start();
    }

    public cleanup(): void {
        while (this.segmentNodes.length > 0) {
            const segmentNode = this.segmentNodes.pop();
            if (!segmentNode?.isValid) {
                continue;
            }

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

    private renderLightningStroke(
        graphics: Graphics,
        distance: number,
        segmentHeight: number,
        params: ElectricCornLightningVisualParams
    ): void {
        graphics.clear();

        const coreColor = new Color(255, 250, 220, Math.round(255 * Math.max(0.25, params.alphaScale)));
        const glowColor = new Color(108, 214, 255, Math.round(190 * Math.max(0.25, params.alphaScale)));
        const branchGlowColor = new Color(120, 236, 255, Math.round(128 * Math.max(0.2, params.alphaScale)));
        const haloColor = new Color(62, 144, 255, Math.round(90 * Math.max(0.18, params.alphaScale)));
        const pointCount = Math.max(4, Math.floor(distance / 32));
        const halfHeight = segmentHeight * 0.5;
        const baseAmplitude = Math.max(4, Math.min(12, distance * 0.04)) * params.lateralAmplitudeScale * 2;

        const buildPoints = (amplitudeScale: number) => {
            const points: Vec3[] = [];
            for (let index = 0; index <= pointCount; index++) {
                const ratio = index / pointCount;
                const x = ratio * distance;

                let y = 0;
                if (index > 0 && index < pointCount) {
                    const direction = index % 2 === 0 ? 1 : -1;
                    const chainPulse = 0.9 + Math.sin(params.chainIndex * 0.7 + ratio * Math.PI * 2) * 0.12;
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
        this.drawEnergyFlowStreaks(graphics, distance, corePoints, params.alphaScale);

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

    private spawnImpactPulse(
        hostNode: Node,
        worldPos: Vec3,
        alphaScale: number,
        isSourcePulse: boolean,
        segmentDurationSeconds: number
    ): void {
        if (!hostNode.isValid) {
            return;
        }

        const pulseNode = new Node(isSourcePulse ? 'LightningSourcePulse' : 'LightningImpactPulse');
        hostNode.addChild(pulseNode);
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
            .to(segmentDurationSeconds, {
                coreRadius: pulseState.coreRadius + (isSourcePulse ? 4 : 3),
                ringRadius: pulseState.ringRadius + (isSourcePulse ? 12 : 8),
            }, {
                onUpdate: () => redraw(),
            })
            .start();

        tween(opacity)
            .to(segmentDurationSeconds, { opacity: 0 })
            .call(() => {
                if (pulseNode.isValid) {
                    pulseNode.destroy();
                }
            })
            .start();
    }

    private spawnOrbitalSparks(
        parentNode: Node,
        distance: number,
        segmentHeight: number,
        alphaScale: number,
        segmentDurationSeconds: number
    ): void {
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
                .to(segmentDurationSeconds, {
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
                .to(segmentDurationSeconds, { opacity: 0 })
                .start();
        }
    }

    private destroySegmentNode(segmentNode: Node): void {
        const segmentIndex = this.segmentNodes.indexOf(segmentNode);
        if (segmentIndex >= 0) {
            this.segmentNodes.splice(segmentIndex, 1);
        }

        if (segmentNode.isValid) {
            segmentNode.destroy();
        }
    }
}
