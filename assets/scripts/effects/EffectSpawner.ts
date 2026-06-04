import { _decorator, Component, Node, Prefab, Vec3, instantiate } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('EffectSpawner')
export class EffectSpawner extends Component {
    @property(Node)
    effectRoot: Node | null = null;

    public spawn(prefab: Prefab, worldPos: Vec3, duration: number = 0.5) {
        if (!this.effectRoot) return;

        const node = instantiate(prefab);
        this.effectRoot.addChild(node);
        node.setWorldPosition(worldPos);

        this.scheduleOnce(() => {
            if (node.isValid) node.destroy();
        }, duration);
    }
}
