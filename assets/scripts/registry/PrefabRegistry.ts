import { _decorator, Component, Prefab, resources } from 'cc';
import { WeaponConfigTable } from '../config/WeaponConfigTable';
import { buildWeaponPrefabResourcePath, DEFAULT_WEAPON_PREFAB_RESOURCE_DIR } from './PrefabRegistryPath';

const { ccclass, property } = _decorator;

/**
 * Weapon prefab registry that auto-loads prefabs from resources by weapon config key.
 */
@ccclass('PrefabRegistry')
export class PrefabRegistry extends Component {
    @property
    prefabResourceDir: string = DEFAULT_WEAPON_PREFAB_RESOURCE_DIR;

    private readonly prefabByKey = new Map<string, Prefab>();
    private isLoadCompleted: boolean = false;
    private isLoading: boolean = false;

    protected onLoad(): void {
        this.preloadConfiguredPrefabs();
    }

    public isReady(): boolean {
        return this.isLoadCompleted;
    }

    public validateRegistryEntries(): boolean {
        let isValid = true;

        for (const weaponId in WeaponConfigTable) {
            const prefabKey = WeaponConfigTable[weaponId].projectilePrefabKey;
            const prefab = this.prefabByKey.get(prefabKey);

            if (!prefab) {
                console.error(`[PrefabRegistry] Weapon ${weaponId} references unloaded prefab key: ${prefabKey}`);
                isValid = false;
            }
        }

        return isValid;
    }

    public getPrefabByKey(key: string): Prefab | null {
        const prefab = this.prefabByKey.get(key);

        if (!prefab) {
            const reason = this.isLoadCompleted ? 'Missing' : 'Not ready';
            console.error(`[PrefabRegistry] ${reason} prefab key: ${key}`);
            return null;
        }

        return prefab;
    }

    private preloadConfiguredPrefabs(): void {
        if (this.isLoading || this.isLoadCompleted) {
            return;
        }

        const prefabKeys = [...new Set(
            Object.values(WeaponConfigTable).map((config) => config.projectilePrefabKey)
        )];

        if (prefabKeys.length === 0) {
            this.isLoadCompleted = true;
            return;
        }

        this.isLoading = true;
        let pendingLoadCount = prefabKeys.length;

        for (const prefabKey of prefabKeys) {
            resources.load(
                buildWeaponPrefabResourcePath(prefabKey, this.prefabResourceDir),
                Prefab,
                (error, prefab) => {
                    if (error || !prefab) {
                        console.error(
                            `[PrefabRegistry] Failed to load prefab for key ${prefabKey}: ${error?.message ?? 'empty prefab'}`
                        );
                    } else if (this.prefabByKey.has(prefabKey)) {
                        console.error(`[PrefabRegistry] Duplicate loaded prefab key: ${prefabKey}`);
                    } else {
                        this.prefabByKey.set(prefabKey, prefab);
                    }

                    pendingLoadCount -= 1;
                    if (pendingLoadCount === 0) {
                        this.isLoading = false;
                        this.isLoadCompleted = this.validateRegistryEntries();
                    }
                }
            );
        }
    }
}
