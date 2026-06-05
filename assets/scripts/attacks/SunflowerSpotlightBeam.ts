import {
    _decorator,
    Color,
    Graphics,
    Node,
    Tween,
    UIOpacity,
    UITransform,
    Vec3,
    tween,
} from 'cc';
import { BeamRuntimeConfigReceiver, BeamTargetProviderReceiver } from './BeamAttackContract';
import { AttackBase } from './base/AttackBase';
import { AttackContext } from './base/AttackContext';
import { EnemyRegistry } from '../combat/EnemyRegistry';
import { DamageInfo } from '../combat/DamageInfo';
import { DamageResolver } from '../combat/DamageResolver';
import { HitInfo } from '../combat/HitInfo';
import { sampleBeamHits } from '../combat/BeamHitSampler';
import { WeaponBeamConfig } from '../config/WeaponConfigTable';
import { ITargetProvider } from '../core/interfaces/ITargetProvider';
import { AttackPhase } from '../core/types/AttackTypes';
import { DamageChannel } from '../core/types/DamageChannel';

const { ccclass, property } = _decorator;

const MAIN_BEAM_LAYER_NAME = 'MainBeamLayer';
const CORE_BEAM_LAYER_NAME = 'CoreBeamLayer';
const MUZZLE_CORONA_LAYER_NAME = 'MuzzleCoronaLayer';
const IMPACT_HOTSPOT_LAYER_NAME = 'ImpactHotspotLayer';

@ccclass('SunflowerSpotlightBeam')
export class SunflowerSpotlightBeam extends AttackBase implements BeamRuntimeConfigReceiver, BeamTargetProviderReceiver {
    @property
    durationSeconds: number = 3;

    @property
    tickIntervalSeconds: number = 0.25;

    @property
    beamWidth: number = 52;

    @property
    beamRange: number = 920;

    @property
    followTarget: boolean = true;

    private targetProvider: ITargetProvider | null = null;
    private currentTargetNode: Node | null = null;
    private elapsedSeconds: number = 0;
    private tickElapsedSeconds: number = 0;
    private beamEndWorldPos: Vec3 = new Vec3();
    private beamImpactWorldPos: Vec3 = new Vec3();

    private mainBeamGraphics: Graphics | null = null;
    private coreBeamGraphics: Graphics | null = null;
    private muzzleCoronaGraphics: Graphics | null = null;
    private impactHotspotGraphics: Graphics | null = null;

    private mainBeamOpacity: UIOpacity | null = null;
    private coreBeamOpacity: UIOpacity | null = null;
    private muzzleCoronaOpacity: UIOpacity | null = null;
    private impactHotspotOpacity: UIOpacity | null = null;
    private lastImpactSparkSpawnSecond: number = -1;

    public setBeamConfig(beamConfig: WeaponBeamConfig): void {
        if (beamConfig.durationSeconds !== undefined) {
            this.durationSeconds = beamConfig.durationSeconds;
        }

        if (beamConfig.tickIntervalSeconds !== undefined) {
            this.tickIntervalSeconds = beamConfig.tickIntervalSeconds;
        }

        if (beamConfig.beamWidth !== undefined) {
            this.beamWidth = beamConfig.beamWidth;
        }

        if (beamConfig.beamRange !== undefined) {
            this.beamRange = beamConfig.beamRange;
        }

        if (beamConfig.followTarget !== undefined) {
            this.followTarget = beamConfig.followTarget;
        }
    }

    public setBeamTargetProvider(targetProvider: ITargetProvider | null): void {
        this.targetProvider = targetProvider;
    }

    public startAttack(attackContext: AttackContext): void {
        this.attackContext = attackContext;
        this.isAttackActive = true;
        this.elapsedSeconds = 0;
        this.tickElapsedSeconds = 0;
        this.currentTargetNode = attackContext.targetNode?.isValid ? attackContext.targetNode : null;

        this.cacheVisualLayers();

        if (!this.tryRefreshBeamState()) {
            this.stopAttack();
            return;
        }

        this.node.active = true;
        this.applyBeamDamageTick();
        this.drawBeamVisuals();
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

    protected update(deltaSeconds: number): void {
        if (!this.isAttackActive || !this.attackContext) {
            return;
        }

        this.elapsedSeconds += deltaSeconds;
        this.tickElapsedSeconds += deltaSeconds;

        if (this.elapsedSeconds >= Math.max(0.01, this.durationSeconds)) {
            this.stopAttack();
            return;
        }

        if (!this.tryRefreshBeamState()) {
            this.stopAttack();
            return;
        }

        const safeTickInterval = Math.max(0.01, this.tickIntervalSeconds);
        while (this.tickElapsedSeconds >= safeTickInterval) {
            this.tickElapsedSeconds -= safeTickInterval;
            this.applyBeamDamageTick();
        }

        this.drawBeamVisuals();
    }

    private tryRefreshBeamState(): boolean {
        if (!this.attackContext) {
            return false;
        }

        if ((!this.currentTargetNode || !this.currentTargetNode.isValid) && this.followTarget) {
            this.currentTargetNode = this.targetProvider?.getPrimaryTarget() ?? null;
        }

        if (!this.currentTargetNode || !this.currentTargetNode.isValid) {
            return false;
        }

        const sourceWorldPos = this.attackContext.spawnWorldPos;
        const targetWorldPos = this.currentTargetNode.worldPosition.clone();
        const directionX = targetWorldPos.x - sourceWorldPos.x;
        const directionY = targetWorldPos.y - sourceWorldPos.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);

        if (directionLength <= 0.001) {
            this.beamEndWorldPos.set(sourceWorldPos.x, sourceWorldPos.y + this.beamRange, sourceWorldPos.z);
            this.beamImpactWorldPos.set(sourceWorldPos);
            return true;
        }

        const normalizedX = directionX / directionLength;
        const normalizedY = directionY / directionLength;
        this.beamEndWorldPos.set(
            sourceWorldPos.x + normalizedX * this.beamRange,
            sourceWorldPos.y + normalizedY * this.beamRange,
            sourceWorldPos.z
        );
        this.beamImpactWorldPos.set(targetWorldPos);
        return true;
    }

    private applyBeamDamageTick(): void {
        if (!this.attackContext) {
            return;
        }

        const beamRadius = Math.max(1, this.beamWidth * 0.5);
        const beamHits = sampleBeamHits(
            this.attackContext.spawnWorldPos,
            this.beamEndWorldPos,
            beamRadius,
            EnemyRegistry.getDamageableTargets(DamageChannel.Beam)
                .map((hurtbox) => ({
                    target: hurtbox.node,
                    center: hurtbox.getWorldCenter(),
                    radius: hurtbox.getHitRadius(),
                }))
                .filter((beamTarget) => beamTarget.target?.isValid && beamTarget.target !== this.attackContext?.attackerNode)
        );

        for (const beamHit of beamHits) {
            const targetNode = beamHit.target;
            if (!targetNode || !targetNode.isValid) {
                continue;
            }

            const hitInfo = new HitInfo({
                attackerNode: this.attackContext.attackerNode,
                targetNode,
                hitWorldPos: new Vec3(beamHit.hitWorldPos.x, beamHit.hitWorldPos.y, this.attackContext.spawnWorldPos.z),
                attackDamage: this.buildTickDamageInfo(),
                phase: AttackPhase.Tick,
            });

            DamageResolver.applyDamage(hitInfo);
        }

        this.spawnImpactSparkShards();
    }

    private buildTickDamageInfo(): DamageInfo {
        if (!this.attackContext) {
            throw new Error('Beam damage requested without attackContext');
        }

        return this.attackContext.attackDamage.cloneWithAmount(this.attackContext.attackDamage.amount);
    }

    private drawBeamVisuals(): void {
        if (!this.attackContext) {
            return;
        }

        const sourceWorldPos = this.attackContext.spawnWorldPos;
        const dx = this.beamEndWorldPos.x - sourceWorldPos.x;
        const dy = this.beamEndWorldPos.y - sourceWorldPos.y;
        const beamLength = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const beamAngle = Math.atan2(dy, dx) * 180 / Math.PI;
        const pulseRatio = 0.75 + Math.sin(this.elapsedSeconds * 18) * 0.18;

        this.drawBeamLayer(
            this.node.getChildByName(MAIN_BEAM_LAYER_NAME),
            this.mainBeamGraphics,
            this.mainBeamOpacity,
            sourceWorldPos,
            beamLength,
            beamAngle,
            Math.max(8, this.beamWidth * 1.05 * pulseRatio),
            new Color(255, 210, 70, 220)
        );
        this.drawBeamLayer(
            this.node.getChildByName(CORE_BEAM_LAYER_NAME),
            this.coreBeamGraphics,
            this.coreBeamOpacity,
            sourceWorldPos,
            beamLength,
            beamAngle,
            Math.max(4, this.beamWidth * 0.42 * (pulseRatio + 0.08)),
            new Color(255, 248, 220, 255)
        );

        this.drawMuzzleCorona(sourceWorldPos, pulseRatio);
        this.drawImpactHotspot(this.beamImpactWorldPos, pulseRatio);
    }

    private drawBeamLayer(
        beamNode: Node | null,
        beamGraphics: Graphics | null,
        beamOpacity: UIOpacity | null,
        sourceWorldPos: Vec3,
        beamLength: number,
        beamAngle: number,
        lineWidth: number,
        strokeColor: Color
    ): void {
        if (!beamNode || !beamGraphics) {
            return;
        }

        beamNode.setWorldPosition(sourceWorldPos);
        beamNode.angle = beamAngle;

        const transform = beamNode.getComponent(UITransform) ?? beamNode.addComponent(UITransform);
        transform.setContentSize(beamLength, Math.max(lineWidth * 2, 32));

        beamGraphics.clear();
        this.drawBeamWavePath(beamGraphics, beamLength, lineWidth, strokeColor);

        this.drawBeamHalo(beamGraphics, beamLength, lineWidth, strokeColor);
        this.drawBeamEnergyStrands(beamGraphics, beamLength, lineWidth);
        this.drawBeamFlowStreaks(beamGraphics, beamLength, lineWidth, strokeColor);

        if (beamOpacity) {
            beamOpacity.opacity = strokeColor.a;
        }
    }

    private drawMuzzleCorona(sourceWorldPos: Vec3, pulseRatio: number): void {
        const muzzleCoronaNode = this.node.getChildByName(MUZZLE_CORONA_LAYER_NAME);
        if (!muzzleCoronaNode || !this.muzzleCoronaGraphics) {
            return;
        }

        muzzleCoronaNode.setWorldPosition(sourceWorldPos);
        const transform = muzzleCoronaNode.getComponent(UITransform) ?? muzzleCoronaNode.addComponent(UITransform);
        const coronaRadius = Math.max(18, this.beamWidth * 0.55 * pulseRatio);
        transform.setContentSize(coronaRadius * 4, coronaRadius * 4);

        const graphics = this.muzzleCoronaGraphics;
        graphics.clear();
        graphics.fillColor = new Color(255, 248, 220, 220);
        graphics.circle(0, 0, coronaRadius * 0.36);
        graphics.fill();

        graphics.fillColor = new Color(255, 188, 64, 110);
        graphics.circle(0, 0, coronaRadius * 0.82);
        graphics.fill();

        this.drawCoronaPetals(graphics, coronaRadius);
        this.drawCoronaSparkOrbit(graphics, coronaRadius);

        graphics.strokeColor = new Color(255, 214, 92, 230);
        graphics.lineWidth = Math.max(2, this.beamWidth * 0.07);
        graphics.circle(0, 0, coronaRadius * 1.08);
        graphics.stroke();

        graphics.fillColor = new Color(255, 122, 60, 140);
        for (let index = 0; index < 6; index++) {
            const radians = index / 6 * Math.PI * 2 + this.elapsedSeconds * 2;
            graphics.circle(
                Math.cos(radians) * coronaRadius * 1.18,
                Math.sin(radians) * coronaRadius * 1.18,
                Math.max(2, this.beamWidth * 0.06)
            );
        }
        graphics.fill();

        if (this.muzzleCoronaOpacity) {
            this.muzzleCoronaOpacity.opacity = 210;
        }
    }

    private drawImpactHotspot(impactWorldPos: Vec3, pulseRatio: number): void {
        const impactHotspotNode = this.node.getChildByName(IMPACT_HOTSPOT_LAYER_NAME);
        if (!impactHotspotNode || !this.impactHotspotGraphics) {
            return;
        }

        impactHotspotNode.setWorldPosition(impactWorldPos);
        const transform = impactHotspotNode.getComponent(UITransform) ?? impactHotspotNode.addComponent(UITransform);
        const hotspotRadius = Math.max(16, this.beamWidth * 0.38 * pulseRatio);
        transform.setContentSize(hotspotRadius * 4, hotspotRadius * 4);

        const graphics = this.impactHotspotGraphics;
        graphics.clear();
        graphics.fillColor = new Color(255, 248, 228, 220);
        graphics.circle(0, 0, hotspotRadius * 0.42);
        graphics.fill();

        graphics.fillColor = new Color(255, 172, 70, 135);
        graphics.circle(0, 0, hotspotRadius * 0.9);
        graphics.fill();

        this.drawImpactFlare(graphics, hotspotRadius, pulseRatio);
        this.drawImpactSparkBurst(graphics, hotspotRadius);

        graphics.strokeColor = new Color(255, 112, 42, 220);
        graphics.lineWidth = Math.max(2, this.beamWidth * 0.05);
        graphics.circle(0, 0, hotspotRadius * 1.22);
        graphics.stroke();

        if (this.impactHotspotOpacity) {
            this.impactHotspotOpacity.opacity = 220;
        }
    }

    private cacheVisualLayers(): void {
        const mainBeamNode = this.findOrCreateLayerNode(MAIN_BEAM_LAYER_NAME);
        const coreBeamNode = this.findOrCreateLayerNode(CORE_BEAM_LAYER_NAME);
        const muzzleCoronaNode = this.findOrCreateLayerNode(MUZZLE_CORONA_LAYER_NAME);
        const impactHotspotNode = this.findOrCreateLayerNode(IMPACT_HOTSPOT_LAYER_NAME);

        this.mainBeamGraphics = this.ensureGraphics(mainBeamNode);
        this.coreBeamGraphics = this.ensureGraphics(coreBeamNode);
        this.muzzleCoronaGraphics = this.ensureGraphics(muzzleCoronaNode);
        this.impactHotspotGraphics = this.ensureGraphics(impactHotspotNode);

        this.mainBeamOpacity = this.ensureOpacity(mainBeamNode, 220);
        this.coreBeamOpacity = this.ensureOpacity(coreBeamNode, 255);
        this.muzzleCoronaOpacity = this.ensureOpacity(muzzleCoronaNode, 210);
        this.impactHotspotOpacity = this.ensureOpacity(impactHotspotNode, 220);
    }

    private findOrCreateLayerNode(layerName: string): Node {
        let layerNode = this.node.getChildByName(layerName);
        if (!layerNode) {
            layerNode = new Node(layerName);
            this.node.addChild(layerNode);
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

    private drawBeamHalo(graphics: Graphics, beamLength: number, lineWidth: number, strokeColor: Color): void {
        this.strokeBeamWavePath(
            graphics,
            beamLength,
            lineWidth * 1.75,
            new Color(strokeColor.r, strokeColor.g, strokeColor.b, Math.max(40, strokeColor.a * 0.28)),
            lineWidth * 0.16,
            0.8
        );
    }

    private drawBeamEnergyStrands(graphics: Graphics, beamLength: number, lineWidth: number): void {
        const strandAmplitude = Math.max(2, lineWidth * 0.16);
        const strandStep = Math.max(28, beamLength / 14);
        const strandPhase = this.elapsedSeconds * 6.5;

        for (const strandOffset of [-lineWidth * 0.14, lineWidth * 0.14]) {
            this.strokeBeamWavePath(
                graphics,
                beamLength,
                Math.max(1.5, lineWidth * 0.14),
                new Color(255, 236, 176, 125),
                strandAmplitude,
                1.9,
                strandOffset,
                strandPhase,
                strandStep
            );
        }
    }

    private drawBeamFlowStreaks(graphics: Graphics, beamLength: number, lineWidth: number, strokeColor: Color): void {
        const streakCount = Math.max(5, Math.floor(beamLength / 120));
        const travelPhase = (this.elapsedSeconds * 420) % Math.max(1, beamLength);

        for (let index = 0; index < streakCount; index++) {
            const baseX = (index / streakCount) * beamLength;
            const streakCenterX = (baseX + travelPhase) % Math.max(1, beamLength);
            const streakLength = Math.max(18, lineWidth * 1.2);
            const streakHalfWidth = Math.max(3, lineWidth * 0.2);
            const streakYOffset = Math.sin(index * 1.7 + this.elapsedSeconds * 5) * lineWidth * 0.14;

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

    private drawCoronaPetals(graphics: Graphics, coronaRadius: number): void {
        const petalCount = 8;
        const petalLength = coronaRadius * 0.86;
        const petalWidth = coronaRadius * 0.3;
        const rotationOffset = this.elapsedSeconds * 0.9;

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

    private drawCoronaSparkOrbit(graphics: Graphics, coronaRadius: number): void {
        graphics.fillColor = new Color(255, 244, 190, 190);
        for (let index = 0; index < 10; index++) {
            const radians = index / 10 * Math.PI * 2 - this.elapsedSeconds * 2.8;
            const orbitRadius = coronaRadius * (0.7 + (index % 3) * 0.16);
            graphics.circle(
                Math.cos(radians) * orbitRadius,
                Math.sin(radians) * orbitRadius,
                Math.max(1.5, this.beamWidth * 0.035)
            );
        }
        graphics.fill();
    }

    private drawImpactFlare(graphics: Graphics, hotspotRadius: number, pulseRatio: number): void {
        const flareLength = hotspotRadius * (2.1 + pulseRatio * 0.35);
        const flareWidth = hotspotRadius * 0.22;

        graphics.fillColor = new Color(255, 243, 210, 165);
        graphics.moveTo(-flareLength, 0);
        graphics.lineTo(0, flareWidth);
        graphics.lineTo(flareLength, 0);
        graphics.lineTo(0, -flareWidth);
        graphics.close();
        graphics.fill();

        graphics.moveTo(0, -flareLength * 0.6);
        graphics.lineTo(flareWidth * 0.72, 0);
        graphics.lineTo(0, flareLength * 0.6);
        graphics.lineTo(-flareWidth * 0.72, 0);
        graphics.close();
        graphics.fill();
    }

    private drawImpactSparkBurst(graphics: Graphics, hotspotRadius: number): void {
        const sparkCount = 7;
        const sparkPhase = this.elapsedSeconds * 12;

        graphics.strokeColor = new Color(255, 170, 70, 190);
        graphics.lineWidth = Math.max(1.2, this.beamWidth * 0.04);

        for (let index = 0; index < sparkCount; index++) {
            const radians = index / sparkCount * Math.PI * 2 + sparkPhase * 0.08;
            const startRadius = hotspotRadius * 0.7;
            const endRadius = hotspotRadius * (1.2 + (index % 2) * 0.28);

            graphics.moveTo(
                Math.cos(radians) * startRadius,
                Math.sin(radians) * startRadius
            );
            graphics.lineTo(
                Math.cos(radians) * endRadius,
                Math.sin(radians) * endRadius
            );
            graphics.stroke();
        }
    }

    private drawBeamWavePath(graphics: Graphics, beamLength: number, lineWidth: number, strokeColor: Color): void {
        this.strokeBeamWavePath(
            graphics,
            beamLength,
            lineWidth,
            strokeColor,
            Math.max(1.2, lineWidth * 0.11),
            1.25
        );
    }

    private strokeBeamWavePath(
        graphics: Graphics,
        beamLength: number,
        lineWidth: number,
        strokeColor: Color,
        amplitude: number,
        frequency: number,
        baseYOffset: number = 0,
        phaseOffset: number = 0,
        stepOverride?: number
    ): void {
        const segmentStep = stepOverride ?? Math.max(16, beamLength / 24);
        const travelPhase = this.elapsedSeconds * 8 + phaseOffset;

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

    private spawnImpactSparkShards(): void {
        const sparkGate = Math.floor(this.elapsedSeconds / Math.max(0.08, this.tickIntervalSeconds * 0.6));
        if (sparkGate === this.lastImpactSparkSpawnSecond) {
            return;
        }

        this.lastImpactSparkSpawnSecond = sparkGate;

        for (let index = 0; index < 7; index++) {
            this.spawnSingleImpactSpark(index);
        }
    }

    private spawnSingleImpactSpark(index: number): void {
        if (!this.node || !this.node.isValid) {
            return;
        }

        const sparkNode = new Node(`ImpactSpark_${index}`);
        this.node.addChild(sparkNode);
        sparkNode.setWorldPosition(this.beamImpactWorldPos);

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

        const radians = index / 7 * Math.PI * 2 + this.elapsedSeconds * 4 + Math.random() * 0.4;
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

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        Tween.stopAllByTarget(this.node);
        this.attackContext = null;
        this.targetProvider = null;
        this.currentTargetNode = null;
        this.elapsedSeconds = 0;
        this.tickElapsedSeconds = 0;
        this.lastImpactSparkSpawnSecond = -1;
        this.beamEndWorldPos = new Vec3();
        this.beamImpactWorldPos = new Vec3();

        for (const graphics of [
            this.mainBeamGraphics,
            this.coreBeamGraphics,
            this.muzzleCoronaGraphics,
            this.impactHotspotGraphics,
        ]) {
            graphics?.clear();
        }
    }
}
