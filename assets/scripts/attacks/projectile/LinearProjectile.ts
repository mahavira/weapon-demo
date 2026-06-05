import { _decorator, Node, Tween, UITransform, Vec3, tween, view } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackHitTracker } from '../base/AttackHitTracker';
import { ProjectileDestinationReceiver } from '../base/ProjectileAttackContract';
import { AttackPhase } from '../../core/types/AttackTypes';
import { LinePath } from '../../movement/paths/LinePath';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { FIRST_HIT_PER_PHASE_POLICY } from '../../combat/HitPolicy';
import { HitSystem } from '../../combat/HitSystem';
import { DamageChannel } from '../../core/types/DamageChannel';
import { getVisibleAreaRect, isNodeFullyOutsideVisibleArea } from './ProjectileViewportCulling';

const { ccclass, property } = _decorator;

@ccclass('LinearProjectile')
export abstract class LinearProjectile extends AttackBase implements ProjectileDestinationReceiver {
    @property
    flyDuration: number = 0.32;

    @property
    hitRadius: number = 42;

    @property
    rotateSpeed: number = 0;

    @property
    autoFaceDirection: boolean = true;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private hitTracker = new AttackHitTracker<Node>();
    private path: LinePath | null = null;
    private destinationWorldPos: Vec3 | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    public setDestinationWorldPos(destinationWorldPos: Vec3): void {
        this.destinationWorldPos = destinationWorldPos.clone();
    }

    public startAttack(context: AttackContext): void {
        const finalDestinationWorldPos = this.destinationWorldPos
            ?? context.destinationWorldPos
            ?? context.targetNode?.worldPosition.clone()
            ?? null;

        if (!finalDestinationWorldPos) {
            this.node.destroy();
            return;
        }

        this.attackContext = context;
        this.isAttackActive = true;
        this.hitTracker.clear();

        this.path = new LinePath(context.spawnWorldPos, finalDestinationWorldPos);

        this.node.setWorldPosition(context.spawnWorldPos);
        this.previousWorldPos = context.spawnWorldPos.clone();
        this.node.active = true;

        if (this.autoFaceDirection) {
            this.faceTo(finalDestinationWorldPos);
        }

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(this.flyDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAttackActive || !this.attackContext || !this.path) return;

                    const currentWorldPos = this.path.getPosition(ratio);
                    this.node.setWorldPosition(currentWorldPos);

                    if (this.rotateSpeed !== 0) {
                        this.node.angle -= this.rotateSpeed;
                    }

                    if (this.shouldCullOutsideVisibleArea()) {
                        this.stopAttack();
                        return;
                    }

                    this.checkHit(this.previousWorldPos, currentWorldPos);
                    this.previousWorldPos = currentWorldPos.clone();
                },
            })
            .call(() => this.stopAttack())
            .start();
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) return;

        this.cleanupRuntimeState();
        this.node.destroy();
    }

    protected onDestroy(): void {
        this.cleanupRuntimeState();
    }

    protected applyDamageToTarget(target: Node, hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.attackContext) return;

        const hitInfo = new HitInfo({
            attackerNode: this.attackContext.attackerNode,
            targetNode: target,
            hitWorldPos: hitWorldPos.clone(),
            attackDamage: this.attackContext.attackDamage,
            phase,
        });

        DamageResolver.applyDamage(hitInfo);
    }

    protected abstract onFirstHit(target: Node, hitWorldPos: Vec3, phase: AttackPhase): void;

    private faceTo(destinationWorldPos: Vec3): void {
        const current = this.node.worldPosition;
        const dx = destinationWorldPos.x - current.x;
        const dy = destinationWorldPos.y - current.y;
        const radians = Math.atan2(dy, dx);
        this.node.angle = radians * 180 / Math.PI;
    }

    private checkHit(previousWorldPos: Vec3, currentWorldPos: Vec3): void {
        if (!this.attackContext) return;

        const phase = AttackPhase.Impact;
        const hits = HitSystem.sampleHits({
            attackId: this.node.uuid,
            attackerNode: this.attackContext.attackerNode,
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
        this.onFirstHit(firstHit.target, firstHit.hitWorldPos, phase);
    }

    private shouldCullOutsideVisibleArea(): boolean {
        if (!this.destroyWhenExitVisibleArea) {
            return false;
        }

        const uiTransform = this.node.getComponent(UITransform);
        return isNodeFullyOutsideVisibleArea(uiTransform, getVisibleAreaRect(view));
    }

    private cleanupRuntimeState(): void {
        this.isAttackActive = false;
        Tween.stopAllByTarget(this.node);
        this.attackContext = null;
        this.path = null;
        this.destinationWorldPos = null;
        this.previousWorldPos = new Vec3();
        this.hitTracker.clear();
    }
}
