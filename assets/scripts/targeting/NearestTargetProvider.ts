import { _decorator, Component, EventTouch, input, Input, instantiate, Node, UITransform, Vec3 } from 'cc';
import { ITargetProvider } from '../core/interfaces/ITargetProvider';
import { EnemyRegistry } from '../combat/EnemyRegistry';

const { ccclass, property } = _decorator;

@ccclass('NearestTargetProvider')
export class NearestTargetProvider extends Component implements ITargetProvider {
    @property([Node])
    enemies: Node[] = [];

    @property(Node)
    fromNode: Node | null = null;

    @property(Node)
    canvasNode: Node | null = null;

    @property(Node)
    enemyRoot: Node | null = null;

    @property(Node)
    enemyTemplate: Node | null = null;

    @property
    spawnOnUpperHalfTouch: boolean = true;

    private runtimeEnemyTemplate: Node | null = null;

    protected onEnable(): void {
        this.cacheRuntimeEnemyTemplate();

        if (this.spawnOnUpperHalfTouch) {
            input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        }
    }

    protected onDisable(): void {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        if (this.runtimeEnemyTemplate && this.runtimeEnemyTemplate.isValid) {
            this.runtimeEnemyTemplate.destroy();
        }

        this.runtimeEnemyTemplate = null;
    }

    public getTarget(): Node | null {
        this.pruneInvalidEnemies();
        if (!this.fromNode) return null;

        let best: Node | null = null;
        let bestDistSq = Number.MAX_VALUE;
        const fromPos = this.fromNode.worldPosition;

        for (const hurtbox of EnemyRegistry.getTargetableTargets()) {
            const enemy = hurtbox.node;
            if (!enemy || !enemy.isValid) continue;

            const p = enemy.worldPosition;
            const dx = p.x - fromPos.x;
            const dy = p.y - fromPos.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                best = enemy;
            }
        }

        return best;
    }

    public getTargetsInRange(center: Node, range: number): Node[] {
        this.pruneInvalidEnemies();

        const result: Node[] = [];
        const centerPos = center.worldPosition;
        const rangeSq = range * range;

        for (const hurtbox of EnemyRegistry.getTargetableTargets()) {
            const enemy = hurtbox.node;
            if (!enemy || !enemy.isValid) continue;

            const p = hurtbox.getWorldCenter();
            const dx = p.x - centerPos.x;
            const dy = p.y - centerPos.y;

            if (dx * dx + dy * dy <= rangeSq) {
                result.push(enemy);
            }
        }

        return result;
    }

    private onTouchEnd(event: EventTouch): void {
        const template = this.runtimeEnemyTemplate ?? this.enemyTemplate;
        if (!this.spawnOnUpperHalfTouch || !this.enemyRoot || !template || !this.canvasNode) return;

        const uiTransform = this.canvasNode.getComponent(UITransform);
        if (!uiTransform) return;

        const uiLocation = event.getUILocation();
        const canvasSize = uiTransform.contentSize;
        const localPos = new Vec3(
            uiLocation.x - canvasSize.width * 0.5,
            uiLocation.y - canvasSize.height * 0.5,
            0
        );

        if (localPos.y < 0) return;

        const enemy = instantiate(template);
        enemy.name = 'EnemySpawned';
        enemy.active = true;
        this.enemyRoot.addChild(enemy);
        enemy.setPosition(localPos);
        this.enemies.push(enemy);
    }

    private pruneInvalidEnemies(): void {
        const activeNodes = new Set(
            EnemyRegistry.getActiveTargets().map((hurtbox) => hurtbox.node)
        );

        this.enemies = this.enemies.filter((enemy) => enemy && enemy.isValid && activeNodes.has(enemy));
    }

    private cacheRuntimeEnemyTemplate(): void {
        if (this.runtimeEnemyTemplate || !this.enemyTemplate) return;

        this.runtimeEnemyTemplate = instantiate(this.enemyTemplate);
        this.runtimeEnemyTemplate.active = false;
    }
}
