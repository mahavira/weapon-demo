import { _decorator, Vec3, tween, Tween, Node } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackHitTracker } from '../base/AttackHitTracker';
import { AttackPhase } from '../../core/types/AttackTypes';
import { BoomerangPath } from '../../movement/paths/BoomerangPath';
import { HitDetector } from '../../combat/HitDetector';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageInfo } from '../../combat/DamageInfo';

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

    private hitTracker = new AttackHitTracker();
    private path: BoomerangPath | null = null;

    public startAttack(context: AttackContext): void {
        if (!context.target || !context.target.isValid) {
            this.node.destroy();
            return;
        }

        this.context = context;
        this.isAlive = true;
        this.hitTracker.clear();

        this.path = new BoomerangPath({
            startWorldPos: context.startWorldPos,
            targetWorldPos: context.target.worldPosition.clone(),
            sideOffset: this.sideOffset,
            topOffset: this.topOffset,
        });

        this.node.setWorldPosition(context.startWorldPos);
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

                    this.checkHit(currentWorldPos, phase);
                },
            })
            .call(() => this.stopAttack())
            .start();
    }

    private checkHit(currentWorldPos: Vec3, phase: AttackPhase) {
        if (!this.context || !this.context.target || !this.context.target.isValid) return;

        const target = this.context.target;
        if (this.hitTracker.hasHit(phase, target)) return;

        if (!HitDetector.isCircleHit(currentWorldPos, target, this.hitRadius)) return;

        this.hitTracker.markHit(phase, target);
        this.handleHit(target, currentWorldPos, phase);
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
        this.hitTracker.clear();
        this.node.destroy();
    }

    protected onDestroy() {
        Tween.stopAllByTarget(this.node);
        this.context = null;
        this.path = null;
        this.hitTracker.clear();
    }
}
