export const DEFAULT_WEAPON_PREFAB_RESOURCE_DIR = 'prefabs/weapons';

export function buildWeaponPrefabAssetName(prefabKey: string): string {
    return prefabKey
        .split('_')
        .filter(Boolean)
        .map((segment) => segment[0].toUpperCase() + segment.slice(1))
        .join('');
}

export function buildWeaponPrefabResourcePath(
    prefabKey: string,
    prefabResourceDir: string = DEFAULT_WEAPON_PREFAB_RESOURCE_DIR
): string {
    return `${prefabResourceDir}/${buildWeaponPrefabAssetName(prefabKey)}`;
}
