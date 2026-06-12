import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponAttackType, WeaponConfigData, WeaponConfigTable } from '../../assets/scripts/config/WeaponConfigTable.ts';
import { resolveWeaponAttackBinding } from '../../assets/scripts/systems/WeaponAttackBinding.ts';

const weaponEntries = Object.entries(WeaponConfigTable);

function assertHasPositiveNumber(value: unknown, message: string): void {
    assert.equal(typeof value, 'number', message);
    assert.ok((value as number) > 0, message);
}

function assertProjectileConfigIsValid(config: WeaponConfigData): void {
    assert.ok(config.flight || config.boomerang || config.ricochet, `${config.id} should define projectile flight behavior`);
}

function assertAttackSpecificConfigIsValid(config: WeaponConfigData): void {
    switch (config.attackType) {
        case WeaponAttackType.Boomerang:
            assert.ok(config.boomerang, `${config.id} should define boomerang config`);
            break;
        case WeaponAttackType.Projectile:
            assertProjectileConfigIsValid(config);
            break;
        case WeaponAttackType.Beam:
            assert.ok(config.beam, `${config.id} should define beam config`);
            break;
        case WeaponAttackType.Chain:
            assert.ok(config.chain, `${config.id} should define chain config`);
            break;
        case WeaponAttackType.Ricochet:
            assert.ok(config.ricochet, `${config.id} should define ricochet config`);
            break;
        default:
            assert.fail(`${config.id} uses unsupported attack type: ${config.attackType}`);
    }
}

test('weapon config keys match weapon ids and use unique prefab keys', () => {
    const prefabKeys = new Set<string>();

    for (const [weaponId, config] of weaponEntries) {
        assert.equal(config.id, weaponId, `${weaponId} config.id should match table key`);
        assert.ok(config.weaponPrefabKey, `${weaponId} should define weaponPrefabKey`);
        assert.ok(!prefabKeys.has(config.weaponPrefabKey), `${weaponId} reuses prefab key: ${config.weaponPrefabKey}`);
        prefabKeys.add(config.weaponPrefabKey);
    }
});

test('weapon configs define required attack-specific config groups', () => {
    for (const [, config] of weaponEntries) {
        assertHasPositiveNumber(config.damage, `${config.id} should define positive damage`);
        assertAttackSpecificConfigIsValid(config);
    }
});

test('weapon configs resolve to stable attack bindings', () => {
    for (const [, config] of weaponEntries) {
        const binding = resolveWeaponAttackBinding(config.weaponPrefabKey, config.attackType);
        assert.ok(binding, `${config.id} should resolve an attack binding`);
    }
});
