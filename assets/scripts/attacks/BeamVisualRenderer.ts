import {
    Color,
    Graphics,
    Node,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
    tween,
} from 'cc';

const MAIN_BEAM_LAYER_NAME = 'MainBeamLayer';
const CORE_BEAM_LAYER_NAME = 'CoreBeamLayer';
const MUZZLE_CORONA_LAYER_NAME = 'MuzzleCoronaLayer';
const STARTUP_FLASH_LAYER_NAME = 'StartupFlashLayer';

export interface BeamVisualFrameParams {
    sourceWorldPos: Vec3;
    beamEndWorldPos: Vec3;
    beamImpactWorldPos: Vec3;
    elapsedSeconds: number;
    beamWidth: number;
}

export class BeamVisualRenderer {
    private mainBeamGraphics: Graphics | null = null;
    private coreBeamGraphics: Graphics | null = null;
    private muzzleCoronaGraphics: Graphics | null = null;
    private startupFlashGraphics: Graphics | null = null;

    private mainBeamOpacity: UIOpacity | null = null;
    private coreBeamOpacity: UIOpacity | null = null;
    private muzzleCoronaOpacity: UIOpacity | null = null;
    private startupFlashOpacity: UIOpacity | null = null;
    private lastImpactSparkSpawnSecond: number = -1;

    public cacheVisualLayers(hostNode: Node): void {
        const mainBeamNode = this.findOrCreateLayerNode(hostNode, MAIN_BEAM_LAYER_NAME);
        const coreBeamNode = this.findOrCreateLayerNode(hostNode, CORE_BEAM_LAYER_NAME);
        const muzzleCoronaNode = this.findOrCreateLayerNode(hostNode, MUZZLE_CORONA_LAYER_NAME);
        const startupFlashNode = this.findOrCreateLayerNode(hostNode, STARTUP_FLASH_LAYER_NAME);

        this.mainBeamGraphics = this.ensureGraphics(mainBeamNode);
        this.coreBeamGraphics = this.ensureGraphics(coreBeamNode);
        this.muzzleCoronaGraphics = this.ensureGraphics(muzzleCoronaNode);
        this.startupFlashGraphics = this.ensureGraphics(startupFlashNode);

        this.mainBeamOpacity = this.ensureOpacity(mainBeamNode, 220);
        this.coreBeamOpacity = this.ensureOpacity(coreBeamNode, 255);
        this.muzzleCoronaOpacity = this.ensureOpacity(muzzleCoronaNode, 210);
        this.startupFlashOpacity = this.ensureOpacity(startupFlashNode, 0);
    }

    public draw(hostNode: Node, params: BeamVisualFrameParams): void {
        const dx = params.beamEndWorldPos.x - params.sourceWorldPos.x;
        const dy = params.beamEndWorldPos.y - params.sourceWorldPos.y;
        const beamLength = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const beamAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        const pulseRatio = 0.75 + Math.sin(params.elapsedSeconds * 18) * 0.18;
        const startupRatio = this.buildStartupRatio(params.elapsedSeconds);
        const startupBeamScale = 0.35 + startupRatio * 0.65;

        this.drawBeamLayer(
            hostNode.getChildByName(MAIN_BEAM_LAYER_NAME),
            this.mainBeamGraphics,
            this.mainBeamOpacity,
            params.sourceWorldPos,
            beamLength,
            beamAngle,
            Math.max(8, params.beamWidth * 1.05 * pulseRatio * startupBeamScale),
            new Color(255, 210, 70, 220),
            params.elapsedSeconds
        );
        this.drawBeamLayer(
            hostNode.getChildByName(CORE_BEAM_LAYER_NAME),
            this.coreBeamGraphics,
            this.coreBeamOpacity,
            params.sourceWorldPos,
            beamLength,
            beamAngle,
            Math.max(4, params.beamWidth * 0.42 * (pulseRatio + 0.08) * (0.2 + startupRatio * 0.8)),
            new Color(255, 248, 220, 255),
            params.elapsedSeconds
        );

        this.drawMuzzleCorona(hostNode, params.sourceWorldPos, params.beamWidth, pulseRatio, startupRatio, params.elapsedSeconds);
        this.drawStartupFlash(hostNode, params.sourceWorldPos, beamAngle, params.beamWidth, startupRatio, params.elapsedSeconds);
    }

    public spawnImpactSparkShards(hostNode: Node, beamImpactWorldPos: Vec3, elapsedSeconds: number): void {
        const sparkGate = Math.floor(elapsedSeconds / 0.15);
        if (sparkGate === this.lastImpactSparkSpawnSecond) {
            return;
        }

        this.lastImpactSparkSpawnSecond = sparkGate;
        for (let index = 0; index < 7; index++) {
            this.spawnSingleImpactSpark(hostNode, beamImpactWorldPos, elapsedSeconds, index);
        }
    }

    public cleanup(hostNode: Node): void {
        this.lastImpactSparkSpawnSecond = -1;
        Tween.stopAllByTarget(hostNode);

        for (const graphics of [
            this.mainBeamGraphics,
            this.coreBeamGraphics,
            this.muzzleCoronaGraphics,
            this.startupFlashGraphics,
        ]) {
            graphics?.clear();
        }
    }

    private findOrCreateLayerNode(hostNode: Node, layerName: string): Node {
        let layerNode = hostNode.getChildByName(layerName);
        if (!layerNode) {
            layerNode = new Node(layerName);
            hostNode.addChild(layerNode);
        }

        if (!layerNode.getComponent(UITransform)) {
            layerNode.addComponent(UITransform);
        }

        return layerNode;
    }

    private ensureGraphics(targetNode: Node | null): Graphics | null {
        if (!targetNode) {
            return null;
        }

        return targetNode.getComponent(Graphics) ?? targetNode.addComponent(Graphics);
    }

    private ensureOpacity(targetNode: Node | null, defaultOpacity: number): UIOpacity | null {
        if (!targetNode) {
            return null;
        }

        const opacity = targetNode.getComponent(UIOpacity) ?? targetNode.addComponent(UIOpacity);
        opacity.opacity = defaultOpacity;
        return opacity;
    }

    private drawBeamLayer(
        beamNode: Node | null,
        beamGraphics: Graphics | null,
        beamOpacity: UIOpacity | null,
        sourceWorldPos: Vec3,
        beamLength: number,
        beamAngle: number,
        lineWidth: number,
        strokeColor: Color,
        elapsedSeconds: number
    ): void {
        if (!beamNode || !beamGraphics) {
            return;
        }

        beamNode.setWorldPosition(sourceWorldPos);
        beamNode.angle = beamAngle;

        const transform = beamNode.getComponent(UITransform) ?? beamNode.addComponent(UITransform);
        transform.setContentSize(beamLength, Math.max(lineWidth * 2, 32));

        beamGraphics.clear();
        this.drawBeamWavePath(beamGraphics, beamLength, lineWidth, strokeColor, elapsedSeconds);
        this.drawBeamHalo(beamGraphics, beamLength, lineWidth, strokeColor, elapsedSeconds);
        this.drawBeamEnergyStrands(beamGraphics, beamLength, lineWidth, elapsedSeconds);
        this.drawBeamFlowStreaks(beamGraphics, beamLength, lineWidth, strokeColor, elapsedSeconds);

        if (beamOpacity) {
            beamOpacity.opacity = strokeColor.a;
        }
    }

    private drawMuzzleCorona(
        hostNode: Node,
        sourceWorldPos: Vec3,
        beamWidth: number,
        pulseRatio: number,
        startupRatio: number,
        elapsedSeconds: number
    ): void {
        const muzzleCoronaNode = hostNode.getChildByName(MUZZLE_CORONA_LAYER_NAME);
        if (!muzzleCoronaNode || !this.muzzleCoronaGraphics) {
            return;
        }

        muzzleCoronaNode.setWorldPosition(sourceWorldPos);
        const transform = muzzleCoronaNode.getComponent(UITransform) ?? muzzleCoronaNode.addComponent(UITransform);
        const startupFlareScale = 0.65 + startupRatio * 0.7;
        const coronaRadius = Math.max(18, beamWidth * 0.55 * pulseRatio * startupFlareScale);
        transform.setContentSize(coronaRadius * 4, coronaRadius * 4);

        const graphics = this.muzzleCoronaGraphics;
        graphics.clear();
        graphics.fillColor = new Color(255, 248, 220, 220);
        graphics.circle(0, 0, coronaRadius * 0.36);
        graphics.fill();

        graphics.fillColor = new Color(255, 188, 64, 110);
        graphics.circle(0, 0, coronaRadius * 0.82);
        graphics.fill();

        this.drawCoronaPetals(graphics, coronaRadius, elapsedSeconds);
        this.drawCoronaSparkOrbit(graphics, coronaRadius, beamWidth, elapsedSeconds);

        graphics.strokeColor = new Color(255, 214, 92, 230);
        graphics.lineWidth = Math.max(2, beamWidth * 0.07);
        graphics.circle(0, 0, coronaRadius * 1.08);
        graphics.stroke();

        graphics.fillColor = new Color(255, 122, 60, 140);
        for (let index = 0; index < 6; index++) {
            const radians = index / 6 * Math.PI * 2 + elapsedSeconds * 2;
            graphics.circle(
                Math.cos(radians) * coronaRadius * 1.18,
                Math.sin(radians) * coronaRadius * 1.18,
                Math.max(2, beamWidth * 0.06)
            );
        }
        graphics.fill();

        if (this.muzzleCoronaOpacity) {
            this.muzzleCoronaOpacity.opacity = Math.min(255, 190 + startupRatio * 55);
        }
    }

    private drawStartupFlash(
        hostNode: Node,
        sourceWorldPos: Vec3,
        beamAngle: number,
        beamWidth: number,
        startupRatio: number,
        elapsedSeconds: number
    ): void {
        const startupFlashNode = hostNode.getChildByName(STARTUP_FLASH_LAYER_NAME);
        if (!startupFlashNode || !this.startupFlashGraphics || !this.startupFlashOpacity) {
            return;
        }

        const startupFlashWindow = 0.08;
        const flashProgress = Math.min(1, elapsedSeconds / startupFlashWindow);
        const flashIntensity = Math.max(0, 1 - flashProgress);

        startupFlashNode.setWorldPosition(sourceWorldPos);
        startupFlashNode.angle = beamAngle;

        const transform = startupFlashNode.getComponent(UITransform) ?? startupFlashNode.addComponent(UITransform);
        const flashLength = Math.max(72, beamWidth * (2.4 + startupRatio * 1.8));
        const flashWidth = Math.max(20, beamWidth * (1.2 + startupRatio * 0.7));
        transform.setContentSize(flashLength * 2, flashWidth * 2.5);

        const graphics = this.startupFlashGraphics;
        graphics.clear();

        if (flashIntensity <= 0.001) {
            this.startupFlashOpacity.opacity = 0;
            return;
        }

        const flareLength = flashLength * (0.65 + flashIntensity * 0.6);
        const flareWidth = flashWidth * (0.5 + flashIntensity * 0.35);

        graphics.fillColor = new Color(255, 252, 236, 220);
        graphics.moveTo(-flareLength, 0);
        graphics.lineTo(0, flareWidth);
        graphics.lineTo(flareLength, 0);
        graphics.lineTo(0, -flareWidth);
        graphics.close();
        graphics.fill();

        graphics.fillColor = new Color(255, 204, 88, 160);
        graphics.moveTo(0, -flareLength * 0.55);
        graphics.lineTo(flareWidth * 0.65, 0);
        graphics.lineTo(0, flareLength * 0.55);
        graphics.lineTo(-flareWidth * 0.65, 0);
        graphics.close();
        graphics.fill();

        this.startupFlashOpacity.opacity = Math.floor(255 * flashIntensity);
    }

    private drawBeamHalo(graphics: Graphics, beamLength: number, lineWidth: number, strokeColor: Color, elapsedSeconds: number): void {
        this.strokeBeamWavePath(
            graphics,
            beamLength,
            lineWidth * 1.75,
            new Color(strokeColor.r, strokeColor.g, strokeColor.b, Math.max(40, strokeColor.a * 0.28)),
            lineWidth * 0.16,
            0.8,
            elapsedSeconds
        );
    }

    private drawBeamEnergyStrands(graphics: Graphics, beamLength: number, lineWidth: number, elapsedSeconds: number): void {
        const strandAmplitude = Math.max(2, lineWidth * 0.16);
        const strandStep = Math.max(28, beamLength / 14);
        const strandPhase = elapsedSeconds * 6.5;

        for (const strandOffset of [-lineWidth * 0.14, lineWidth * 0.14]) {
            this.strokeBeamWavePath(
                graphics,
                beamLength,
                Math.max(1.5, lineWidth * 0.14),
                new Color(255, 236, 176, 125),
                strandAmplitude,
                1.9,
                elapsedSeconds,
                strandOffset,
                strandPhase,
                strandStep
            );
        }
    }

    private drawBeamFlowStreaks(
        graphics: Graphics,
        beamLength: number,
        lineWidth: number,
        strokeColor: Color,
        elapsedSeconds: number
    ): void {
        const streakCount = Math.max(5, Math.floor(beamLength / 120));
        const travelPhase = (elapsedSeconds * 420) % Math.max(1, beamLength);

        for (let index = 0; index < streakCount; index++) {
            const baseX = (index / streakCount) * beamLength;
            const streakCenterX = (baseX + travelPhase) % Math.max(1, beamLength);
            const streakLength = Math.max(18, lineWidth * 1.2);
            const streakHalfWidth = Math.max(3, lineWidth * 0.2);
            const streakYOffset = Math.sin(index * 1.7 + elapsedSeconds * 5) * lineWidth * 0.14;

            graphics.fillColor = new Color(255, 249, 228, 150);
            graphics.moveTo(streakCenterX - streakLength, streakYOffset);
            graphics.lineTo(streakCenterX, streakYOffset + streakHalfWidth);
            graphics.lineTo(streakCenterX + streakLength, streakYOffset);
            graphics.lineTo(streakCenterX, streakYOffset - streakHalfWidth);
            graphics.close();
            graphics.fill();

            graphics.strokeColor = new Color(strokeColor.r, strokeColor.g, strokeColor.b, 70);
            graphics.lineWidth = 1;
            graphics.moveTo(streakCenterX - streakLength, streakYOffset);
            graphics.lineTo(streakCenterX + streakLength, streakYOffset);
            graphics.stroke();
        }
    }

    private drawCoronaPetals(graphics: Graphics, coronaRadius: number, elapsedSeconds: number): void {
        const petalCount = 8;
        const petalLength = coronaRadius * 0.86;
        const petalWidth = coronaRadius * 0.3;
        const rotationOffset = elapsedSeconds * 0.9;

        graphics.fillColor = new Color(255, 206, 70, 165);
        for (let index = 0; index < petalCount; index++) {
            const radians = index / petalCount * Math.PI * 2 + rotationOffset;
            const innerX = Math.cos(radians) * coronaRadius * 0.52;
            const innerY = Math.sin(radians) * coronaRadius * 0.52;
            const outerX = Math.cos(radians) * (coronaRadius + petalLength * 0.32);
            const outerY = Math.sin(radians) * (coronaRadius + petalLength * 0.32);
            const normalX = -Math.sin(radians) * petalWidth;
            const normalY = Math.cos(radians) * petalWidth;

            graphics.moveTo(innerX + normalX * 0.55, innerY + normalY * 0.55);
            graphics.lineTo(outerX, outerY);
            graphics.lineTo(innerX - normalX * 0.55, innerY - normalY * 0.55);
            graphics.lineTo(innerX, innerY);
            graphics.close();
            graphics.fill();
        }
    }

    private drawCoronaSparkOrbit(graphics: Graphics, coronaRadius: number, beamWidth: number, elapsedSeconds: number): void {
        graphics.fillColor = new Color(255, 244, 190, 190);
        for (let index = 0; index < 10; index++) {
            const radians = index / 10 * Math.PI * 2 - elapsedSeconds * 2.8;
            const orbitRadius = coronaRadius * (0.7 + (index % 3) * 0.16);
            graphics.circle(
                Math.cos(radians) * orbitRadius,
                Math.sin(radians) * orbitRadius,
                Math.max(1.5, beamWidth * 0.035)
            );
        }
        graphics.fill();
    }

    private buildStartupRatio(elapsedSeconds: number): number {
        return Math.min(1, elapsedSeconds / 0.08);
    }

    private drawBeamWavePath(
        graphics: Graphics,
        beamLength: number,
        lineWidth: number,
        strokeColor: Color,
        elapsedSeconds: number
    ): void {
        this.strokeBeamWavePath(
            graphics,
            beamLength,
            lineWidth,
            strokeColor,
            Math.max(1.2, lineWidth * 0.11),
            1.25,
            elapsedSeconds
        );
    }

    private strokeBeamWavePath(
        graphics: Graphics,
        beamLength: number,
        lineWidth: number,
        strokeColor: Color,
        amplitude: number,
        frequency: number,
        elapsedSeconds: number,
        baseYOffset: number = 0,
        phaseOffset: number = 0,
        stepOverride?: number
    ): void {
        const segmentStep = stepOverride ?? Math.max(16, beamLength / 24);
        const travelPhase = elapsedSeconds * 8 + phaseOffset;

        graphics.lineCap = 2;
        graphics.lineJoin = 2;
        graphics.lineWidth = lineWidth;
        graphics.strokeColor = strokeColor;
        graphics.moveTo(0, baseYOffset + Math.sin(travelPhase) * amplitude);

        for (let x = segmentStep; x <= beamLength; x += segmentStep) {
            const ratio = x / Math.max(1, beamLength);
            const y = baseYOffset + Math.sin(ratio * Math.PI * 2 * frequency + travelPhase) * amplitude;
            graphics.lineTo(x, y);
        }

        if (beamLength % segmentStep !== 0) {
            graphics.lineTo(
                beamLength,
                baseYOffset + Math.sin(Math.PI * 2 * frequency + travelPhase) * amplitude
            );
        }

        graphics.stroke();
    }

    private spawnSingleImpactSpark(hostNode: Node, beamImpactWorldPos: Vec3, elapsedSeconds: number, index: number): void {
        const sparkNode = new Node(`ImpactSpark_${index}`);
        hostNode.addChild(sparkNode);
        sparkNode.setWorldPosition(beamImpactWorldPos);

        const transform = sparkNode.addComponent(UITransform);
        transform.setContentSize(48, 18);

        const opacity = sparkNode.addComponent(UIOpacity);
        opacity.opacity = 210;

        const graphics = sparkNode.addComponent(Graphics);
        const sparkState = {
            length: 10 + Math.random() * 12,
            width: 2 + Math.random() * 2,
        };

        const drawSpark = () => {
            if (!graphics.isValid) {
                return;
            }

            graphics.clear();
            graphics.fillColor = new Color(255, 246, 214, 180);
            graphics.moveTo(-sparkState.length * 0.45, 0);
            graphics.lineTo(0, sparkState.width);
            graphics.lineTo(sparkState.length * 0.55, 0);
            graphics.lineTo(0, -sparkState.width);
            graphics.close();
            graphics.fill();
        };

        drawSpark();

        const radians = index / 7 * Math.PI * 2 + elapsedSeconds * 4 + Math.random() * 0.4;
        const travelDistance = 26 + Math.random() * 30;
        const targetLocalPos = new Vec3(
            Math.cos(radians) * travelDistance,
            Math.sin(radians) * travelDistance,
            0
        );

        sparkNode.angle = radians * 180 / Math.PI;

        tween(sparkNode)
            .to(0.16 + Math.random() * 0.06, { position: targetLocalPos, scale: new Vec3(0.55, 0.55, 1) })
            .call(() => {
                if (sparkNode.isValid) {
                    sparkNode.destroy();
                }
            })
            .start();

        tween(opacity)
            .to(0.16 + Math.random() * 0.06, { opacity: 0 })
            .start();

        tween(sparkState)
            .to(0.16 + Math.random() * 0.06, { length: 4, width: 1 }, {
                onUpdate: () => drawSpark(),
            })
            .start();
    }
}
