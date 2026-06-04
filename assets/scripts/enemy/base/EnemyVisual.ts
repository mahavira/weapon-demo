import { _decorator, Component, Vec3, tween, Tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnemyVisual')
export class EnemyVisual extends Component {
    @property
    shakeOffset: number = 12;

    @property
    shakeDuration: number = 0.04;

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

    public playDeath() {
        // TODO: add death animation.
    }

    protected onDestroy() {
        Tween.stopAllByTarget(this.node);
    }
}
