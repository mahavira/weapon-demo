import { _decorator, Color, Graphics, Node, Tween, UIOpacity, UITransform, Vec3, tween, view } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackPhase } from '../../core/types/AttackTypes';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageChannel } from '../../core/types/DamageChannel';
import { MathUtils } from '../../core/utils/MathUtils';
import { ArcPath } from '../../movement/paths/ArcPath';
import { isRectFullyOutsideVisibleArea } from './ProjectileViewportCulling';

const { ccclass, property } = _decorator;

@ccclass('ChiliBombProjectile')
export class ChiliBombProjectile extends AttackBase {
    @property
    flyDuration: number = 1.5;

    @property
    arcHeight: number = 280;

    @property
    rotateSpeed: number = 18;

    @property
    autoFaceDirection: boolean = true;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private impactAoeRadius: number = 0;
    private endWorldPos: Vec3 | null = null;
    private path: ArcPath | null = null;
    private previousWorldPos: Vec3 = new Vec3();

    public setEndWorldPos(endWorldPos: Vec3): void {
        this.endWorldPos = endWorldPos.clone();
    }

    public setImpactAoeRadius(radius: number): void {
        this.impactAoeRadius = Math.max(0, radius);
    }

    public startAttack(context: AttackContext): void {
        const finalEndWorldPos = this.endWorldPos ?? context.endWorldPos ?? context.target?.worldPosition.clone() ?? null;

        if (!finalEndWorldPos) {
            this.node.destroy();
            return;
        }

        this.context = context;
        this.isAlive = true;
        this.path = new ArcPath(context.startWorldPos, finalEndWorldPos, this.arcHeight);
        this.previousWorldPos = context.startWorldPos.clone();

        this.node.setWorldPosition(context.startWorldPos);
        this.node.active = true;

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(this.flyDuration, {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAlive || !this.context || !this.path) return;

                    const currentWorldPos = this.path.getPosition(ratio);
                    this.node.setWorldPosition(currentWorldPos);

                    if (this.autoFaceDirection) {
                        this.faceAlongTravel(this.previousWorldPos, currentWorldPos);
                    } else if (this.rotateSpeed !== 0) {
                        this.node.angle -= this.rotateSpeed;
                    }

                    if (this.shouldDestroyForVisibleArea()) {
                        this.stopAttack();
                        return;
                    }

                    this.previousWorldPos = currentWorldPos.clone();
                },
            })
            .call(() => {
                if (!this.context || !this.endWorldPos) {
                    this.stopAttack();
                    return;
                }

                this.applyAreaDamage(this.endWorldPos, AttackPhase.Impact);
                this.stopAttack();
            })
            .start();
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) return;

        this.isAlive = false;
        Tween.stopAllByTarget(this.node);
        this.resetState();
        this.node.destroy();
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.node);
        this.resetState();
    }

    private faceAlongTravel(previousWorldPos: Vec3, currentWorldPos: Vec3): void {
        const dx = currentWorldPos.x - previousWorldPos.x;
        const dy = currentWorldPos.y - previousWorldPos.y;

        if (dx === 0 && dy === 0) {
            return;
        }

        this.node.angle = Math.atan2(dy, dx) * 180 / Math.PI;
    }

    private resetState(): void {
        this.impactAoeRadius = 0;
        this.endWorldPos = null;
        this.path = null;
        this.previousWorldPos = new Vec3();
        this.context = null;
        this.isAlive = false;
    }

    private applyAreaDamage(hitWorldPos: Vec3, phase: AttackPhase): void {
        if (!this.context) return;

        this.spawnImpactBurst(hitWorldPos);

        const targets = EnemyRegistry.getDamageableTargets(DamageChannel.Area);

        for (const hurtbox of targets) {
            const target = hurtbox.node;
            if (!target || !target.isValid || target === this.context.attacker) continue;

            const center = hurtbox.getWorldCenter();
            const combinedRadius = this.impactAoeRadius + hurtbox.getHitRadius();
            if (MathUtils.distanceSq2D(hitWorldPos, center) > combinedRadius * combinedRadius) {
                continue;
            }

            const hitInfo = new HitInfo({
                attacker: this.context.attacker,
                target,
                hitWorldPos: hitWorldPos.clone(),
                damageInfo: this.context.damageInfo,
                phase,
            });

            DamageResolver.applyDamage(hitInfo);
        }
    }

    private shouldDestroyForVisibleArea(): boolean {
        if (!this.destroyWhenExitVisibleArea) {
            return false;
        }

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            return false;
        }

        const visibleOrigin = view.getVisibleOrigin();
        const visibleSize = view.getVisibleSize();

        return isRectFullyOutsideVisibleArea(uiTransform.getBoundingBoxToWorld(), {
            x: visibleOrigin.x,
            y: visibleOrigin.y,
            width: visibleSize.width,
            height: visibleSize.height,
        });
    }

    private spawnImpactBurst(hitWorldPos: Vec3): void {
        const parent = this.node.parent;
        if (!parent || !parent.isValid) {
            return;
        }

        const effectNode = new Node('ChiliExplosionBurst');
        parent.addChild(effectNode);
        effectNode.setWorldPosition(hitWorldPos);

        const transform = effectNode.addComponent(UITransform);
        const diameter = Math.max(96, this.impactAoeRadius * 2.8);
        transform.setContentSize(diameter, diameter);

        const opacity = effectNode.addComponent(UIOpacity);
        const graphics = effectNode.addComponent(Graphics);
        const state = {
            coreRadius: Math.max(10, this.impactAoeRadius * 0.22),
            ringRadius: Math.max(24, this.impactAoeRadius * 0.55),
        };

        const redraw = () => {
            if (!graphics.isValid) return;

            graphics.clear();

            graphics.fillColor = new Color(255, 245, 180, 255);
            graphics.circle(0, 0, state.coreRadius);
            graphics.fill();

            graphics.fillColor = new Color(255, 128, 48, 180);
            graphics.circle(0, 0, state.coreRadius * 1.55);
            graphics.fill();

            graphics.lineWidth = Math.max(4, this.impactAoeRadius * 0.08);
            graphics.strokeColor = new Color(255, 72, 32, 255);
            graphics.circle(0, 0, state.ringRadius);
            graphics.stroke();
        };

        redraw();

        tween(state)
            .to(0.22, {
                coreRadius: Math.max(16, this.impactAoeRadius * 0.58),
                ringRadius: Math.max(48, this.impactAoeRadius * 1.18),
            }, {
                onUpdate: () => redraw(),
            })
            .start();

        tween(opacity)
            .delay(0.05)
            .to(0.18, { opacity: 0 })
            .call(() => {
                if (effectNode.isValid) {
                    effectNode.destroy();
                }
            })
            .start();
    }
}
