import { _decorator, Vec3, tween, Tween, Node } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackHitTracker } from '../base/AttackHitTracker';
import { AttackPhase } from '../../core/types/AttackTypes';
import { LinePath } from '../../movement/paths/LinePath';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { FIRST_HIT_PER_PHASE_POLICY } from '../../combat/HitPolicy';
import { HitSystem } from '../../combat/HitSystem';
import { DamageChannel } from '../../core/types/DamageChannel';

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

    private hitTracker = new AttackHitTracker<Node>();
    private path: LinePath | null = null;
    private endWorldPos: Vec3 | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    /**
     * 草莓枪三连发时，每颗子弹可以指定不同终点。
     * 不指定时，默认飞向 context.target.worldPosition。
     */
    public setEndWorldPos(endWorldPos: Vec3): void {
        this.endWorldPos = endWorldPos.clone();
    }

    public startAttack(context: AttackContext): void {
        const finalEndWorldPos = this.endWorldPos ?? context.endWorldPos ?? context.target?.worldPosition.clone() ?? null;

        if (!finalEndWorldPos) {
            this.node.destroy();
            return;
        }

        this.context = context;
        this.isAlive = true;
        this.hitTracker.clear();

        this.path = new LinePath(context.startWorldPos, finalEndWorldPos);

        this.node.setWorldPosition(context.startWorldPos);
        this.previousWorldPos = context.startWorldPos.clone();
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

                    this.checkHit(this.previousWorldPos, currentWorldPos);
                    this.previousWorldPos = currentWorldPos.clone();
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

    private checkHit(previousWorldPos: Vec3, currentWorldPos: Vec3): void {
        if (!this.context) return;

        const phase = AttackPhase.Impact;
        const hits = HitSystem.sampleHits({
            attackId: this.node.uuid,
            attacker: this.context.attacker,
            phase,
            previousWorldPos,
            currentWorldPos,
            sweepRadius: this.hitRadius,
            damageChannel: DamageChannel.Projectile,
            policy: FIRST_HIT_PER_PHASE_POLICY,
            hitTracker: this.hitTracker,
        }, EnemyRegistry.getDamageableTargets(DamageChannel.Projectile));

        const [firstHit] = hits;
        if (!firstHit) return;

        this.hitTracker.markHit(phase, firstHit.target);
        this.handleHit(firstHit.target, firstHit.hitWorldPos, phase);
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
        this.previousWorldPos = new Vec3();
        this.hitTracker.clear();
        this.node.destroy();
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
        this.context = null;
        this.path = null;
        this.endWorldPos = null;
        this.previousWorldPos = new Vec3();
        this.hitTracker.clear();
    }
}
