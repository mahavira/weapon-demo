import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildWeaponPrefabAssetName,
    buildWeaponPrefabResourcePath,
    DEFAULT_WEAPON_PREFAB_RESOURCE_DIR,
} from '../../assets/scripts/registry/PrefabRegistryPath.ts';

test('buildWeaponPrefabAssetName converts weapon prefab key to prefab asset name', () => {
    assert.equal(buildWeaponPrefabAssetName('arc_boomerang'), 'ArcBoomerang');
    assert.equal(buildWeaponPrefabAssetName('chain_lightning'), 'ChainLightning');
    assert.equal(buildWeaponPrefabAssetName('piercing_beam'), 'PiercingBeam');
});

test('buildWeaponPrefabResourcePath uses default weapon prefab resources directory', () => {
    assert.equal(
        buildWeaponPrefabResourcePath('ricochet_bullet'),
        `${DEFAULT_WEAPON_PREFAB_RESOURCE_DIR}/RicochetBullet`
    );
});

test('buildWeaponPrefabResourcePath supports custom resource directory', () => {
    assert.equal(
        buildWeaponPrefabResourcePath('blast_bomb', 'prefabs/custom'),
        'prefabs/custom/BlastBomb'
    );
});
