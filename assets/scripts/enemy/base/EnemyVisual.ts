import {
    _decorator,
    Color,
    Component,
    Sprite,
    Tween,
    tween,
    UITransform,
    Vec3,
} from 'cc';
import { EnemyHealthBarRenderer } from './EnemyHealthBarRenderer';
import { EnemyStatusVisualRenderer } from './EnemyStatusVisualRenderer';

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
    private readonly hitFlashState = { flashBlendRatio: 0, flashScale: 1 };
    private statusVisualRenderer: EnemyStatusVisualRenderer | null = null;
    private healthBarRenderer: EnemyHealthBarRenderer | null = null;

    protected onLoad(): void {
        this.sprite = this.getComponent(Sprite);
        if (this.sprite) {
            this.baseColor = this.sprite.color.clone();
        }

        this.statusVisualRenderer = new EnemyStatusVisualRenderer(
            this.node,
            (callback, intervalSeconds) => this.schedule(callback, intervalSeconds),
            (callback) => this.unschedule(callback),
            () => this.handleBurningSmokeSpawn(),
            () => this.getPrimaryVisualHeight(),
            () => this.burningTargetIntensity,
            () => this.burningPulseTime,
        );
        this.healthBarRenderer = new EnemyHealthBarRenderer(this.node);
        this.healthBarRenderer.ensure(this.getPrimaryVisualHeight());
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
            this.statusVisualRenderer?.redrawBurningFlameLayer();
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
            .set({ flashBlendRatio: 1, flashScale: 1.08 })
            .to(0.04, { flashBlendRatio: 0.55, flashScale: 1.02 }, {
                onUpdate: () => this.updateSpriteColor(),
            })
            .to(0.08, { flashBlendRatio: 0, flashScale: 1 }, {
                onUpdate: () => this.updateSpriteColor(),
            })
            .start();
    }

    public playDamageFeedback(previousHp: number, currentHp: number, maxHp: number): void {
        this.healthBarRenderer?.syncHealth(previousHp, currentHp, maxHp);
    }

    public playBurningStart(): void {
        this.burningTargetIntensity = 1;
        this.statusVisualRenderer?.playBurningStart();
        this.updateSpriteColor();
    }

    public playBurningLoop(intensity: number = 1): void {
        this.burningTargetIntensity = this.clamp01(intensity);
        this.statusVisualRenderer?.playBurningLoop();
        this.updateSpriteColor();
    }

    public playBurningStop(): void {
        this.burningTargetIntensity = 0;
        this.statusVisualRenderer?.playBurningStop();
        this.updateSpriteColor();
    }

    public playDeath(): void {
        this.statusVisualRenderer?.cleanup();
        // TODO: add death animation.
    }

    public playBeamScorch(beamWidth: number): void {
        this.statusVisualRenderer?.playBeamScorch(beamWidth);
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
        Tween.stopAllByTarget(this.hitFlashState);
        this.healthBarRenderer?.stopTweens();
        this.statusVisualRenderer?.cleanup();
    }

    private updateSpriteColor(): void {
        if (!this.sprite) {
            return;
        }

        const pulseFactor = this.burningIntensity > 0
            ? 0.88 + Math.sin(this.burningPulseTime * 10) * 0.12
            : 1;
        const burnColor = this.mixColor(this.baseColor, this.burningTargetColor, this.clamp01(this.burningIntensity * pulseFactor));
        const finalColor = this.mixColor(burnColor, this.hitFlashColor, this.clamp01(this.hitFlashState.flashBlendRatio));
        this.sprite.color = finalColor;
        this.sprite.node.setScale(this.hitFlashState.flashScale, this.hitFlashState.flashScale, 1);
    }

    private getPrimaryVisualHeight(): number {
        const ownTransform = this.getComponent(UITransform);
        if (ownTransform && ownTransform.contentSize.height > 0) {
            return ownTransform.contentSize.height;
        }

        const spriteTransform = this.sprite?.getComponent(UITransform);
        if (spriteTransform && spriteTransform.contentSize.height > 0) {
            return spriteTransform.contentSize.height;
        }

        const firstChild = this.node.children[0];
        const childTransform = firstChild?.getComponent(UITransform);
        if (childTransform && childTransform.contentSize.height > 0) {
            return childTransform.contentSize.height;
        }

        return 64;
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

    private handleBurningSmokeSpawn(): void {
        this.statusVisualRenderer?.spawnSmokePuff();
    }
}
