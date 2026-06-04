import { _decorator, Component, Vec3, tween, Tween, Color, Sprite } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnemyVisual')
export class EnemyVisual extends Component {
    @property
    shakeOffset: number = 12;

    @property
    shakeDuration: number = 0.04;

    private sprite: Sprite | null = null;
    private originColor = Color.TRANSPARENT.clone();

    onLoad() {
        this.sprite = this.getComponent(Sprite);
        if (this.sprite) {
            this.originColor = this.sprite.color.clone();
        }
    }
    public playHitShake() {
        Tween.stopAllByTarget(this.node);

        const p = this.node.position.clone();

        tween(this.node)
            .to(this.shakeDuration, { position: new Vec3(p.x + this.shakeOffset, p.y, p.z) })
            .to(this.shakeDuration, { position: new Vec3(p.x - this.shakeOffset, p.y, p.z) })
            .to(this.shakeDuration, { position: new Vec3(p.x + this.shakeOffset * 0.5, p.y, p.z) })
            .to(this.shakeDuration, { position: p })
            .start();
    }

    public playHitFlash() {
        if (!this.sprite) return;

        tween(this.sprite)
        .stop()
        .set({ color: new Color(255, 80, 80, 255) })
        .to(0.08, { color: this.originColor })
        .start();
    }

    public playDeath() {
        // TODO: add death animation.
    }

    protected onDestroy() {
        Tween.stopAllByTarget(this.node);
    }
}
