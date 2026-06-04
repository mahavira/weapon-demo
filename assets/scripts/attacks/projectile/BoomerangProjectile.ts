import { _decorator, Vec3, tween, Tween, Node } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackHitTracker } from '../base/AttackHitTracker';
import { AttackPhase } from '../../core/types/AttackTypes';
import { BoomerangPath } from '../../movement/paths/BoomerangPath';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageInfo } from '../../combat/DamageInfo';
import { HitSystem } from '../../combat/HitSystem';
import { PENETRATING_PER_PHASE_POLICY } from '../../combat/HitPolicy';
import { DamageChannel } from '../../core/types/DamageChannel';

const { ccclass, property } = _decorator;

@ccclass('BoomerangProjectile')
export class BoomerangProjectile extends AttackBase {
    @property
    flyDuration: number = 0.75;

    @property
    returnDuration: number = 0.65;

    @property
    sideOffset: number = 220;

    @property
    topOffset: number = 100;

    @property
    hitRadius: number = 60;

    @property
    rotateSpeed: number = 36;

    @property
    returnDamageScale: number = 1;

    private hitTracker = new AttackHitTracker<Node>();
    private path: BoomerangPath | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    public startAttack(context: AttackContext): void {
        if (!context.endWorldPos) {
            this.node.destroy();
            return;
        }

        this.context = context;
        this.isAlive = true;
        this.hitTracker.clear();

        this.path = new BoomerangPath({
            startWorldPos: context.startWorldPos,
            targetWorldPos: context.endWorldPos,
            sideOffset: this.sideOffset,
            topOffset: this.topOffset,
        });

        this.node.setWorldPosition(context.startWorldPos);
        this.previousWorldPos = context.startWorldPos.clone();
        this.node.angle = 0;
        this.node.active = true;

        const totalDuration = this.flyDuration + this.returnDuration;
        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(totalDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAlive || !this.context || !this.path) return;

                    const elapsed = ratio * totalDuration;
                    const phase = elapsed <= this.flyDuration ? AttackPhase.Forward : AttackPhase.Return;
                    const t = phase === AttackPhase.Forward
                        ? elapsed / this.flyDuration
                        : (elapsed - this.flyDuration) / this.returnDuration;

                    const currentWorldPos = this.path.getPosition(phase, t);
                    this.node.setWorldPosition(currentWorldPos);
                    this.node.angle -= this.rotateSpeed;

                    this.checkHit(this.previousWorldPos, currentWorldPos, phase);
                    this.previousWorldPos = currentWorldPos.clone();
                },
            })
            .call(() => this.stopAttack())
            .start();
    }

    private checkHit(previousWorldPos: Vec3, currentWorldPos: Vec3, phase: AttackPhase) {
        if (!this.context) return;

        const hits = HitSystem.sampleHits({
            attackId: this.node.uuid,
            attacker: this.context.attacker,
            phase,
            previousWorldPos,
            currentWorldPos,
            sweepRadius: this.hitRadius,
            damageChannel: DamageChannel.Projectile,
            policy: PENETRATING_PER_PHASE_POLICY,
            hitTracker: this.hitTracker,
        }, EnemyRegistry.getDamageableTargets(DamageChannel.Projectile));

        for (const hit of hits) {
            this.hitTracker.markHit(phase, hit.target);
            this.handleHit(hit.target, hit.hitWorldPos, phase);
        }
    }

    private handleHit(target: Node, hitWorldPos: Vec3, phase: AttackPhase) {
        if (!this.context) return;

        const damageInfo = this.createPhaseDamageInfo(phase);
        const hitInfo = new HitInfo({
            attacker: this.context.attacker,
            target,
            hitWorldPos: hitWorldPos.clone(),
            damageInfo,
            phase,
        });

        DamageResolver.applyDamage(hitInfo);
    }

    private createPhaseDamageInfo(phase: AttackPhase): DamageInfo {
        if (!this.context) {
            throw new Error('BoomerangProjectile missing context');
        }

        if (phase === AttackPhase.Return) {
            return this.context.damageInfo.cloneWithAmount(
                Math.floor(this.context.damageInfo.amount * this.returnDamageScale)
            );
        }

        return this.context.damageInfo;
    }

    public stopAttack(): void {
        this.isAlive = false;
        Tween.stopAllByTarget(this.node);
        this.context = null;
        this.path = null;
        this.previousWorldPos = new Vec3();
        this.hitTracker.clear();
        this.node.destroy();
    }

    protected onDestroy() {
        Tween.stopAllByTarget(this.node);
        this.context = null;
        this.path = null;
        this.previousWorldPos = new Vec3();
        this.hitTracker.clear();
    }
}
