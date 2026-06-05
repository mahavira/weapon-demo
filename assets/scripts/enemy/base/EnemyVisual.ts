import {
    _decorator,
    Color,
    Component,
    Graphics,
    Node,
    Sprite,
    Tween,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnemyVisual')
export class EnemyVisual extends Component {
    @property
    shakeOffset: number = 12;

    @property
    shakeDuration: number = 0.04;

    private sprite: Sprite | null = null;
    private baseColor = Color.TRANSPARENT.clone();
    private burningTargetColor = new Color(255, 120, 48, 255);
    private hitFlashColor = new Color(255, 220, 180, 255);
    private burningIntensity = 0;
    private burningTargetIntensity = 0;
    private burningPulseTime = 0;
    private burningFlameNode: Node | null = null;
    private burningSmokeNode: Node | null = null;
    private burningFlameGraphics: Graphics | null = null;
    private isBurningSmokeScheduled = false;
    private readonly hitFlashState = { mix: 0 };
    private readonly burningSmokeSpawnTask = () => this.spawnSmokePuff();

    protected onLoad(): void {
        this.sprite = this.getComponent(Sprite);
        if (this.sprite) {
            this.baseColor = this.sprite.color.clone();
        }

        this.updateSpriteColor();
    }

    protected update(deltaTime: number): void {
        const previousIntensity = this.burningIntensity;
        const intensityDelta = this.burningTargetIntensity - this.burningIntensity;
        if (Math.abs(intensityDelta) > 0.001) {
            const step = Math.min(Math.abs(intensityDelta), deltaTime * 6);
            this.burningIntensity += Math.sign(intensityDelta) * step;
        } else {
            this.burningIntensity = this.burningTargetIntensity;
        }

        if (this.burningIntensity > 0.001) {
            this.burningPulseTime += deltaTime;
            this.redrawBurningFlameLayer();
        } else if (previousIntensity > 0.001 && this.burningFlameGraphics) {
            this.burningFlameGraphics.clear();
        }

        if (Math.abs(previousIntensity - this.burningIntensity) > 0.001) {
            this.updateSpriteColor();
        }
    }

    public playHitShake(): void {
        Tween.stopAllByTarget(this.node);

        const p = this.node.position.clone();

        tween(this.node)
            .to(this.shakeDuration, { position: new Vec3(p.x + this.shakeOffset, p.y, p.z) })
            .to(this.shakeDuration, { position: new Vec3(p.x - this.shakeOffset, p.y, p.z) })
            .to(this.shakeDuration, { position: new Vec3(p.x + this.shakeOffset * 0.5, p.y, p.z) })
            .to(this.shakeDuration, { position: p })
            .start();
    }

    public playHitFlash(): void {
        if (!this.sprite) return;

        Tween.stopAllByTarget(this.hitFlashState);
        tween(this.hitFlashState)
            .set({ mix: 1 })
            .to(0.08, { mix: 0 }, {
                onUpdate: () => this.updateSpriteColor(),
            })
            .start();
    }

    public playBurningStart(): void {
        this.ensureBurningLayerNodes();
        this.burningTargetIntensity = 1;
        this.scheduleSmokeSpawn();
        this.updateSpriteColor();
    }

    public playBurningLoop(intensity: number = 1): void {
        this.ensureBurningLayerNodes();
        this.burningTargetIntensity = this.clamp01(intensity);
        this.scheduleSmokeSpawn();
        this.updateSpriteColor();
    }

    public playBurningStop(): void {
        this.burningTargetIntensity = 0;
        this.unschedule(this.burningSmokeSpawnTask);
        this.isBurningSmokeScheduled = false;
        this.fadeOutBurningLayer(this.burningFlameNode);
        this.fadeOutBurningLayer(this.burningSmokeNode);
        this.updateSpriteColor();
    }

    public playDeath(): void {
        // TODO: add death animation.
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
        Tween.stopAllByTarget(this.hitFlashState);
        this.unschedule(this.burningSmokeSpawnTask);
        this.isBurningSmokeScheduled = false;
    }

    private updateSpriteColor(): void {
        if (!this.sprite) {
            return;
        }

        const pulseFactor = this.burningIntensity > 0
            ? 0.88 + Math.sin(this.burningPulseTime * 10) * 0.12
            : 1;
        const burnColor = this.mixColor(this.baseColor, this.burningTargetColor, this.clamp01(this.burningIntensity * pulseFactor));
        const finalColor = this.mixColor(burnColor, this.hitFlashColor, this.clamp01(this.hitFlashState.mix));
        this.sprite.color = finalColor;
    }

    private ensureBurningLayerNodes(): void {
        if (!this.burningFlameNode || !this.burningFlameNode.isValid) {
            this.burningFlameNode = new Node('BurningFlameLayer');
            const flameTransform = this.burningFlameNode.addComponent(UITransform);
            flameTransform.setContentSize(72, 72);
            this.burningFlameGraphics = this.burningFlameNode.addComponent(Graphics);
            this.burningFlameNode.addComponent(UIOpacity).opacity = 220;
            this.node.addChild(this.burningFlameNode);
        } else {
            const flameOpacity = this.burningFlameNode.getComponent(UIOpacity) ?? this.burningFlameNode.addComponent(UIOpacity);
            Tween.stopAllByTarget(flameOpacity);
            flameOpacity.opacity = 220;
        }

        if (!this.burningSmokeNode || !this.burningSmokeNode.isValid) {
            this.burningSmokeNode = new Node('BurningSmokeLayer');
            const smokeTransform = this.burningSmokeNode.addComponent(UITransform);
            smokeTransform.setContentSize(84, 96);
            this.node.addChild(this.burningSmokeNode);
        } else {
            const smokeOpacity = this.burningSmokeNode.getComponent(UIOpacity);
            if (smokeOpacity) {
                Tween.stopAllByTarget(smokeOpacity);
                smokeOpacity.opacity = 255;
            }
        }
    }

    private redrawBurningFlameLayer(): void {
        if (!this.burningFlameGraphics) {
            return;
        }

        const pulseFactor = 0.92 + Math.sin(this.burningPulseTime * 12) * 0.08;
        const flameHeight = 18 + this.burningIntensity * 18 * pulseFactor;
        const flameSpread = 8 + this.burningIntensity * 9;
        const flameGraphics = this.burningFlameGraphics;

        flameGraphics.clear();
        flameGraphics.fillColor = new Color(255, 90, 18, 180);
        flameGraphics.circle(-flameSpread, -4, 7 + this.burningIntensity * 5);
        flameGraphics.circle(0, flameHeight * 0.35, 9 + this.burningIntensity * 6);
        flameGraphics.circle(flameSpread, 2, 8 + this.burningIntensity * 5);
        flameGraphics.fill();

        flameGraphics.fillColor = new Color(255, 192, 72, 170);
        flameGraphics.circle(-flameSpread * 0.4, flameHeight * 0.2, 5 + this.burningIntensity * 4);
        flameGraphics.circle(flameSpread * 0.5, flameHeight * 0.12, 4 + this.burningIntensity * 3);
        flameGraphics.fill();
    }

    private scheduleSmokeSpawn(): void {
        if (this.isBurningSmokeScheduled) {
            return;
        }

        this.schedule(this.burningSmokeSpawnTask, 0.28);
        this.isBurningSmokeScheduled = true;
    }

    private spawnSmokePuff(): void {
        if (!this.burningSmokeNode || !this.burningSmokeNode.isValid || this.burningTargetIntensity <= 0.01) {
            return;
        }

        const smokeNode = new Node('BurningSmokePuff');
        const smokeTransform = smokeNode.addComponent(UITransform);
        smokeTransform.setContentSize(24, 24);
        const smokeOpacity = smokeNode.addComponent(UIOpacity);
        smokeOpacity.opacity = 120;
        const smokeGraphics = smokeNode.addComponent(Graphics);
        smokeGraphics.fillColor = new Color(84, 84, 84, 140);
        smokeGraphics.circle(0, 0, 8 + Math.random() * 3);
        smokeGraphics.fill();

        smokeNode.setPosition((Math.random() - 0.5) * 24, 10 + Math.random() * 10, 0);
        smokeNode.setScale(0.7 + Math.random() * 0.25, 0.7 + Math.random() * 0.25, 1);
        this.burningSmokeNode.addChild(smokeNode);

        tween(smokeNode)
            .to(0.65, {
                position: new Vec3(smokeNode.position.x + (Math.random() - 0.5) * 18, smokeNode.position.y + 34, 0),
                scale: new Vec3(1.2, 1.2, 1),
            })
            .call(() => {
                if (smokeNode.isValid) {
                    smokeNode.destroy();
                }
            })
            .start();

        tween(smokeOpacity)
            .to(0.65, { opacity: 0 })
            .start();
    }

    private fadeOutBurningLayer(layerNode: Node | null): void {
        if (!layerNode || !layerNode.isValid) {
            return;
        }

        const opacity = layerNode.getComponent(UIOpacity) ?? layerNode.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        tween(opacity)
            .to(0.18, { opacity: 0 })
            .call(() => {
                if (layerNode === this.burningFlameNode) {
                    this.burningFlameGraphics?.clear();
                    this.burningFlameNode = null;
                    this.burningFlameGraphics = null;
                }

                if (layerNode === this.burningSmokeNode) {
                    this.burningSmokeNode = null;
                }

                if (layerNode.isValid) {
                    layerNode.destroy();
                }
            })
            .start();
    }

    private mixColor(from: Color, to: Color, ratio: number): Color {
        const clampedRatio = this.clamp01(ratio);
        const inverseRatio = 1 - clampedRatio;
        return new Color(
            Math.round(from.r * inverseRatio + to.r * clampedRatio),
            Math.round(from.g * inverseRatio + to.g * clampedRatio),
            Math.round(from.b * inverseRatio + to.b * clampedRatio),
            Math.round(from.a * inverseRatio + to.a * clampedRatio),
        );
    }

    private clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }
}
