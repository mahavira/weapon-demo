import { _decorator, Vec3, tween, Tween, Node } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackHitTracker } from '../base/AttackHitTracker';
import { AttackPhase } from '../../core/types/AttackTypes';
import { LinePath } from '../../movement/paths/LinePath';
import { HitDetector } from '../../combat/HitDetector';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';

const { ccclass, property } = _decorator;

@ccclass('StrawberryBulletProjectile')
export class StrawberryBulletProjectile extends AttackBase {
    @property
    flyDuration: number = 0.32;

    @property
    hitRadius: number = 42;

    @property
    rotateSpeed: number = 0;

    @property
    autoFaceDirection: boolean = true;

    private hitTracker = new AttackHitTracker();
    private path: LinePath | null = null;
    private endWorldPos: Vec3 | null = null;

    /**
     * 草莓枪三连发时，每颗子弹可以指定不同终点。
     * 不指定时，默认飞向 context.target.worldPosition。
     */
    public setEndWorldPos(endWorldPos: Vec3): void {
        this.endWorldPos = endWorldPos.clone();
    }

    public startAttack(context: AttackContext): void {
        if (!context.target || !context.target.isValid) {
            this.node.destroy();
            return;
        }

        this.context = context;
        this.isAlive = true;
        this.hitTracker.clear();

        const finalEndWorldPos = this.endWorldPos ?? context.target.worldPosition.clone();
        this.path = new LinePath(context.startWorldPos, finalEndWorldPos);

        this.node.setWorldPosition(context.startWorldPos);
        this.node.active = true;

        if (this.autoFaceDirection) {
            this.faceTo(finalEndWorldPos);
        }

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(this.flyDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAlive || !this.context || !this.path) return;

                    const currentWorldPos = this.path.getPosition(ratio);
                    this.node.setWorldPosition(currentWorldPos);

                    if (this.rotateSpeed !== 0) {
                        this.node.angle -= this.rotateSpeed;
                    }

                    this.checkHit(currentWorldPos);
                },
            })
            .call(() => this.stopAttack())
            .start();
    }

    private faceTo(endWorldPos: Vec3): void {
        const current = this.node.worldPosition;
        const dx = endWorldPos.x - current.x;
        const dy = endWorldPos.y - current.y;
        const radians = Math.atan2(dy, dx);

        /**
         * Cocos UI 中 Sprite 默认朝右时可直接使用这个角度。
         * 如果你的草莓子弹素材默认朝上，把这里改成：angle - 90。
         */
        this.node.angle = radians * 180 / Math.PI;
    }

    private checkHit(currentWorldPos: Vec3): void {
        if (!this.context || !this.context.target || !this.context.target.isValid) return;

        const target = this.context.target;
        const phase = AttackPhase.Impact;

        if (this.hitTracker.hasHit(phase, target)) return;
        if (!HitDetector.isCircleHit(currentWorldPos, target, this.hitRadius)) return;

        this.hitTracker.markHit(phase, target);
        this.handleHit(target, currentWorldPos, phase);
    }

    private handleHit(target: Node, hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.context) return;

        const hitInfo = new HitInfo({
            attacker: this.context.attacker,
            target,
            hitWorldPos: hitWorldPos.clone(),
            damageInfo: this.context.damageInfo,
            phase,
        });

        DamageResolver.applyDamage(hitInfo);
        this.stopAttack();
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) return;

        this.isAlive = false;
        Tween.stopAllByTarget(this.node);
        this.context = null;
        this.path = null;
        this.endWorldPos = null;
        this.hitTracker.clear();
        this.node.destroy();
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
        this.context = null;
        this.path = null;
        this.endWorldPos = null;
        this.hitTracker.clear();
    }
}
