import { _decorator, Node, Tween, UITransform, Vec2, Rect, Size, Sprite, SpriteFrame, Vec3, tween, view } from 'cc';
import { AttackBase } from '../base/AttackBase';
import { AttackContext } from '../base/AttackContext';
import { AttackPhase } from '../../core/types/AttackTypes';
import { EnemyRegistry } from '../../combat/EnemyRegistry';
import { HitInfo } from '../../combat/HitInfo';
import { DamageResolver } from '../../combat/DamageResolver';
import { DamageChannel } from '../../core/types/DamageChannel';
import { Hurtbox } from '../../enemy/base/Hurtbox';
import {
    RicochetBulletRuntimeConfig,
    buildRicochetBulletRuntimeConfig,
} from '../RicochetBulletRuntimeConfig';
import { buildRicochetTargetCandidates, pickRicochetTarget } from '../RicochetBulletTargetPicker';
import { getVisibleAreaRect, isNodeFullyOutsideVisibleArea } from './ProjectileViewportCulling';

const { ccclass, property } = _decorator;

@ccclass('RicochetBulletProjectile')
export class RicochetBulletProjectile extends AttackBase {
    private static readonly DEFAULT_HEAD_UP_ANGLE_OFFSET = 90;
    private static readonly VISUAL_FRAME_WIDTH = 65;
    private static readonly VISUAL_FRAME_HEIGHT = 182;
    private static readonly VISUAL_FRAME_COUNT = 8;
    private static readonly VISUAL_FRAME_DURATION = 1 / 16;

    @property
    travelSpeed: number = 960;

    @property
    rotateSpeed: number = 12;

    @property
    autoFaceDirection: boolean = true;

    @property
    destroyWhenExitVisibleArea: boolean = true;

    private runtimeConfig: RicochetBulletRuntimeConfig = buildRicochetBulletRuntimeConfig({});
    private visitedTargets = new Set<Node>();
    private previousTargetNode: Node | null = null;
    private currentTargetNode: Node | null = null;
    private hitCount: number = 0;
    private visualSprite: Sprite | null = null;
    private visualSpriteFrames: SpriteFrame[] = [];
    private frameElapsedSeconds: number = 0;
    private currentFrameIndex: number = 0;

    protected onLoad(): void {
        this.visualSprite = this.node.getChildByName('Visual')?.getComponent(Sprite) ?? null;
        this.initializeVisualAnimation();
    }

    public configureRicochet(params: Partial<RicochetBulletRuntimeConfig>): void {
        this.runtimeConfig = buildRicochetBulletRuntimeConfig(params);
        this.travelSpeed = this.runtimeConfig.travelSpeed;
        this.rotateSpeed = this.runtimeConfig.rotateSpeed;
        this.autoFaceDirection = this.runtimeConfig.autoFaceDirection;
        this.destroyWhenExitVisibleArea = this.runtimeConfig.destroyWhenExitVisibleArea;
    }

    public startAttack(attackContext: AttackContext): void {
        const initialTargetNode = attackContext.targetNode;
        if (!this.isTargetNodeValid(initialTargetNode)) {
            this.node.destroy();
            return;
        }

        this.attackContext = attackContext;
        this.isAttackActive = true;
        this.visitedTargets.clear();
        this.resetRicochetState(initialTargetNode);

        this.node.setWorldPosition(attackContext.spawnWorldPos);
        this.node.active = true;
        this.applyVisualFrame(0);
        this.flyToTarget(initialTargetNode);
    }

    public stopAttack(): void {
        if (!this.node || !this.node.isValid) {
            return;
        }

        this.cleanupRuntimeState();
        this.node.destroy();
    }

    protected onDestroy(): void {
        this.cleanupRuntimeState();
    }

    protected update(dt: number): void {
        if (!this.isAttackActive || this.visualSpriteFrames.length === 0) {
            return;
        }

        this.frameElapsedSeconds += dt;
        const nextFrameIndex = this.getLoopedVisualFrameIndex();

        if (nextFrameIndex !== this.currentFrameIndex) {
            this.applyVisualFrame(nextFrameIndex);
        }
    }

    private flyToTarget(targetNode: Node): void {
        if (!this.attackContext || !this.isAttackActive || !this.isTargetNodeValid(targetNode)) {
            this.stopAttack();
            return;
        }

        this.currentTargetNode = targetNode;
        const startWorldPos = this.node.worldPosition.clone();
        const destinationWorldPos = this.getTargetWorldCenter(targetNode);

        if (this.autoFaceDirection) {
            this.faceTo(destinationWorldPos);
        }

        Tween.stopAllByTarget(this.node);

        tween(this.node)
            .to(this.buildTravelDuration(startWorldPos, destinationWorldPos), {}, {
                onUpdate: (_target, ratio: number) => {
                    if (!this.isAttackActive || !this.node.isValid) {
                        return;
                    }

                    const currentWorldPos = new Vec3(
                        startWorldPos.x + (destinationWorldPos.x - startWorldPos.x) * ratio,
                        startWorldPos.y + (destinationWorldPos.y - startWorldPos.y) * ratio,
                        startWorldPos.z + (destinationWorldPos.z - startWorldPos.z) * ratio
                    );

                    this.node.setWorldPosition(currentWorldPos);

                    if (!this.autoFaceDirection && this.rotateSpeed !== 0) {
                        this.node.angle -= this.rotateSpeed;
                    }

                    if (this.shouldCullOutsideVisibleArea()) {
                        this.stopAttack();
                    }
                },
            })
            .call(() => this.handleTargetArrival(targetNode))
            .start();
    }

    private handleTargetArrival(targetNode: Node): void {
        if (!this.attackContext || !this.isAttackActive) {
            return;
        }

        if (!this.isTargetNodeValid(targetNode)) {
            this.stopAttack();
            return;
        }

        const hitWorldPos = this.getTargetWorldCenter(targetNode);
        this.node.setWorldPosition(hitWorldPos);
        this.applyDamageToTarget(targetNode, hitWorldPos);
        this.visitedTargets.add(targetNode);
        this.hitCount += 1;

        if (this.hitCount >= this.runtimeConfig.maxHits) {
            this.stopAttack();
            return;
        }

        const nextTargetNode = this.pickNextTarget(targetNode, hitWorldPos);
        this.previousTargetNode = targetNode;

        if (!nextTargetNode) {
            this.stopAttack();
            return;
        }

        this.flyToTarget(nextTargetNode);
    }

    private pickNextTarget(currentTargetNode: Node, currentWorldPos: Vec3): Node | null {
        const candidates = buildRicochetTargetCandidates(
            EnemyRegistry.getDamageableTargets(DamageChannel.Projectile)
                .map((hurtbox) => hurtbox.node)
                .filter((targetNode) => this.isTargetNodeValid(targetNode) && targetNode !== currentTargetNode),
            (targetNode) => this.getTargetWorldCenter(targetNode)
        );

        return pickRicochetTarget({
            currentWorldPos,
            previousTarget: this.previousTargetNode,
            visitedTargets: this.visitedTargets,
            ricochetRange: this.runtimeConfig.ricochetRange,
            candidates,
            allowBounceBackToPreviousTarget: this.runtimeConfig.allowBounceBackToPreviousTarget,
        });
    }

    private applyDamageToTarget(targetNode: Node, hitWorldPos: Vec3): void {
        if (!this.attackContext) {
            return;
        }

        DamageResolver.applyDamage(new HitInfo({
            attackerNode: this.attackContext.attackerNode,
            targetNode,
            hitWorldPos: hitWorldPos.clone(),
            attackDamage: this.attackContext.attackDamage,
            phase: AttackPhase.Impact,
        }));
    }

    private buildTravelDuration(startWorldPos: Vec3, destinationWorldPos: Vec3): number {
        const distance = Vec3.distance(startWorldPos, destinationWorldPos);
        const safeTravelSpeed = Math.max(1, this.travelSpeed);
        return Math.max(0.01, distance / safeTravelSpeed);
    }

    private faceTo(destinationWorldPos: Vec3): void {
        const currentWorldPos = this.node.worldPosition;
        const dx = destinationWorldPos.x - currentWorldPos.x;
        const dy = destinationWorldPos.y - currentWorldPos.y;
        this.node.angle = Math.atan2(dy, dx) * 180 / Math.PI
            - RicochetBulletProjectile.DEFAULT_HEAD_UP_ANGLE_OFFSET;
    }

    private initializeVisualAnimation(): void {
        const sourceSpriteFrame = this.visualSprite?.spriteFrame;
        const sourceTexture = sourceSpriteFrame?.texture;
        if (!this.visualSprite || !sourceSpriteFrame || !sourceTexture) {
            return;
        }

        this.visualSpriteFrames = Array.from(
            { length: RicochetBulletProjectile.VISUAL_FRAME_COUNT },
            (_unused, frameIndex) => this.buildVisualSpriteFrame(sourceTexture, frameIndex)
        );

        this.visualSprite.spriteFrame = this.visualSpriteFrames[0] ?? null;
    }

    private applyVisualFrame(frameIndex: number): void {
        const nextSpriteFrame = this.visualSpriteFrames[frameIndex];
        if (!this.visualSprite || !nextSpriteFrame) {
            return;
        }

        this.currentFrameIndex = frameIndex;
        this.visualSprite.spriteFrame = nextSpriteFrame;
    }

    private buildVisualSpriteFrame(texture: SpriteFrame['texture'], frameIndex: number): SpriteFrame {
        const spriteFrame = new SpriteFrame();
        spriteFrame.reset({
            texture,
            rect: this.buildVisualFrameRect(frameIndex),
            originalSize: this.buildVisualFrameSize(),
            offset: new Vec2(0, 0),
        }, true);
        return spriteFrame;
    }

    private buildVisualFrameRect(frameIndex: number): Rect {
        return new Rect(
            frameIndex * RicochetBulletProjectile.VISUAL_FRAME_WIDTH,
            0,
            RicochetBulletProjectile.VISUAL_FRAME_WIDTH,
            RicochetBulletProjectile.VISUAL_FRAME_HEIGHT
        );
    }

    private buildVisualFrameSize(): Size {
        return new Size(
            RicochetBulletProjectile.VISUAL_FRAME_WIDTH,
            RicochetBulletProjectile.VISUAL_FRAME_HEIGHT
        );
    }

    private getLoopedVisualFrameIndex(): number {
        return Math.floor(
            this.frameElapsedSeconds / RicochetBulletProjectile.VISUAL_FRAME_DURATION
        ) % RicochetBulletProjectile.VISUAL_FRAME_COUNT;
    }

    private resetRicochetState(initialTargetNode: Node): void {
        this.previousTargetNode = null;
        this.currentTargetNode = initialTargetNode;
        this.hitCount = 0;
        this.frameElapsedSeconds = 0;
        this.currentFrameIndex = 0;
    }

    private getTargetWorldCenter(targetNode: Node): Vec3 {
        const hurtbox = targetNode.getComponent(Hurtbox);
        return hurtbox?.getWorldCenter() ?? targetNode.worldPosition.clone();
    }

    private isTargetNodeValid(targetNode: Node | null): targetNode is Node {
        if (!targetNode || !targetNode.isValid) {
            return false;
        }

        const hurtbox = targetNode.getComponent(Hurtbox);
        return !!hurtbox && hurtbox.canBeTargeted() && hurtbox.canBeHitBy(DamageChannel.Projectile);
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
        this.visitedTargets.clear();
        this.previousTargetNode = null;
        this.currentTargetNode = null;
        this.hitCount = 0;
        this.frameElapsedSeconds = 0;
        this.currentFrameIndex = 0;
    }
}
