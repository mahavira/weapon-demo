import { _decorator, Component, Prefab } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Minimal prefab registry.
 * Keep keys and prefabs aligned by index in the Inspector.
 *
 * Example:
 * keys[0] = banana_boomerang_projectile
 * prefabs[0] = BananaBoomerangProjectile.prefab
 */
@ccclass('PrefabRegistry')
export class PrefabRegistry extends Component {
    @property([String])
    keys: string[] = [];

    @property([Prefab])
    prefabs: Prefab[] = [];

    public getPrefab(key: string): Prefab | null {
        const index = this.keys.indexOf(key);

        if (index < 0) {
            console.error(`[PrefabRegistry] Missing prefab key: ${key}`);
            return null;
        }

        const prefab = this.prefabs[index];

        if (!prefab) {
            console.error(`[PrefabRegistry] Empty prefab for key: ${key}`);
            return null;
        }

        return prefab;
    }
}
