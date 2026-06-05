import { _decorator, Component, Prefab } from 'cc';
import { WeaponConfigTable } from '../config/WeaponConfigTable';

const { ccclass, property } = _decorator;

/**
 * Minimal prefab registry.
 * Keep prefabKeys and registeredPrefabs aligned by index in the Inspector.
 *
 * Example:
 * prefabKeys[0] = banana_boomerang_projectile
 * registeredPrefabs[0] = BananaBoomerangProjectile.prefab
 */
@ccclass('PrefabRegistry')
export class PrefabRegistry extends Component {
    @property([String])
    prefabKeys: string[] = [];

    @property([Prefab])
    registeredPrefabs: Prefab[] = [];

    protected onLoad(): void {
        this.validateRegistryEntries();
    }

    public validateRegistryEntries(): boolean {
        let isValid = true;

        if (this.prefabKeys.length !== this.registeredPrefabs.length) {
            console.error(`[PrefabRegistry] prefabKeys/registeredPrefabs length mismatch: ${this.prefabKeys.length}/${this.registeredPrefabs.length}`);
            isValid = false;
        }

        const seenKeys = new Set<string>();

        for (let i = 0; i < this.prefabKeys.length; i++) {
            const key = this.prefabKeys[i];

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

            if (!this.registeredPrefabs[i]) {
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

    public getPrefabByKey(key: string): Prefab | null {
        const index = this.findPrefabIndexByKey(key);

        if (index < 0) {
            console.error(`[PrefabRegistry] Missing prefab key: ${key}`);
            return null;
        }

        const prefab = this.registeredPrefabs[index];

        if (!prefab) {
            console.error(`[PrefabRegistry] Empty prefab for key: ${key}`);
            return null;
        }

        return prefab;
    }

    private findPrefabIndexByKey(key: string): number {
        return this.prefabKeys.indexOf(key);
    }
}
