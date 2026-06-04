import { _decorator, Component, Prefab } from 'cc';
import { WeaponConfigTable } from '../config/WeaponConfigTable';

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

    protected onLoad(): void {
        this.validate();
    }

    public validate(): boolean {
        let isValid = true;

        if (this.keys.length !== this.prefabs.length) {
            console.error(`[PrefabRegistry] keys/prefabs length mismatch: ${this.keys.length}/${this.prefabs.length}`);
            isValid = false;
        }

        const seenKeys = new Set<string>();

        for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[i];

            if (!key) {
                console.error(`[PrefabRegistry] Empty key at index ${i}`);
                isValid = false;
                continue;
            }

            if (seenKeys.has(key)) {
                console.error(`[PrefabRegistry] Duplicate prefab key: ${key}`);
                isValid = false;
            }

            seenKeys.add(key);

            if (!this.prefabs[i]) {
                console.error(`[PrefabRegistry] Empty prefab for key: ${key}`);
                isValid = false;
            }
        }

        for (const weaponId in WeaponConfigTable) {
            const prefabKey = WeaponConfigTable[weaponId].projectilePrefabKey;

            if (!seenKeys.has(prefabKey)) {
                console.error(`[PrefabRegistry] Weapon ${weaponId} references unregistered prefab key: ${prefabKey}`);
                isValid = false;
            }
        }

        return isValid;
    }

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
