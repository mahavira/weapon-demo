import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildWeaponPrefabAssetName,
    buildWeaponPrefabResourcePath,
    DEFAULT_WEAPON_PREFAB_RESOURCE_DIR,
} from '../../assets/scripts/registry/PrefabRegistryPath.ts';

test('buildWeaponPrefabAssetName converts projectile prefab key to prefab asset name', () => {
    assert.equal(buildWeaponPrefabAssetName('banana_boomerang_projectile'), 'BananaBoomerangProjectile');
    assert.equal(buildWeaponPrefabAssetName('electric_corn_chain_attack'), 'ElectricCornChainAttack');
    assert.equal(buildWeaponPrefabAssetName('sunflower_spotlight_mirror_beam'), 'SunflowerSpotlightMirrorBeam');
});

test('buildWeaponPrefabResourcePath uses default weapon prefab resources directory', () => {
    assert.equal(
        buildWeaponPrefabResourcePath('acorn_slingshot_projectile'),
        `${DEFAULT_WEAPON_PREFAB_RESOURCE_DIR}/AcornSlingshotProjectile`
    );
});

test('buildWeaponPrefabResourcePath supports custom resource directory', () => {
    assert.equal(
        buildWeaponPrefabResourcePath('chili_bomb_projectile', 'prefabs/custom'),
        'prefabs/custom/ChiliBombProjectile'
    );
});
