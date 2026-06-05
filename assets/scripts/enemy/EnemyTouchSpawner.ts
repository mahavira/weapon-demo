import { _decorator, Component, EventTouch, input, Input, instantiate, Node, UITransform, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EnemyTouchSpawner')
export class EnemyTouchSpawner extends Component {
    @property(Node)
    spawnCanvasNode: Node | null = null;

    @property(Node)
    spawnParentNode: Node | null = null;

    @property(Node)
    spawnTemplateNode: Node | null = null;

    @property
    enableUpperHalfTouchSpawn: boolean = true;

    private cachedSpawnTemplateNode: Node | null = null;

    protected onEnable(): void {
        this.cacheSpawnTemplateNode();

        if (this.enableUpperHalfTouchSpawn) {
            input.on(Input.EventType.TOUCH_END, this.spawnEnemyOnTouchEnd, this);
        }
    }

    protected onDisable(): void {
        input.off(Input.EventType.TOUCH_END, this.spawnEnemyOnTouchEnd, this);

        if (this.cachedSpawnTemplateNode && this.cachedSpawnTemplateNode.isValid) {
            this.cachedSpawnTemplateNode.destroy();
        }

        this.cachedSpawnTemplateNode = null;
    }

    private spawnEnemyOnTouchEnd(event: EventTouch): void {
        if (!this.enableUpperHalfTouchSpawn) {
            return;
        }

        const spawnLocalPos = this.tryBuildUpperHalfSpawnLocalPos(event);
        if (!spawnLocalPos) {
            return;
        }

        this.spawnEnemyAtLocalPos(spawnLocalPos);
    }

    private tryBuildUpperHalfSpawnLocalPos(event: EventTouch): Vec3 | null {
        if (!this.spawnCanvasNode) {
            return null;
        }

        const canvasTransform = this.spawnCanvasNode.getComponent(UITransform);
        if (!canvasTransform) {
            return null;
        }

        const uiLocation = event.getUILocation();
        const canvasSize = canvasTransform.contentSize;
        const spawnLocalPos = new Vec3(
            uiLocation.x - canvasSize.width * 0.5,
            uiLocation.y - canvasSize.height * 0.5,
            0
        );

        if (spawnLocalPos.y < 0) {
            return null;
        }

        return spawnLocalPos;
    }

    private spawnEnemyAtLocalPos(spawnLocalPos: Vec3): void {
        const templateNode = this.cachedSpawnTemplateNode ?? this.spawnTemplateNode;
        if (!this.spawnParentNode || !templateNode) {
            return;
        }

        const enemyNode = instantiate(templateNode);
        enemyNode.name = 'EnemySpawned';
        enemyNode.active = true;
        this.spawnParentNode.addChild(enemyNode);
        enemyNode.setPosition(spawnLocalPos);
    }

    private cacheSpawnTemplateNode(): void {
        if (this.cachedSpawnTemplateNode || !this.spawnTemplateNode) {
            return;
        }

        this.cachedSpawnTemplateNode = instantiate(this.spawnTemplateNode);
        this.cachedSpawnTemplateNode.active = false;
    }
}
