import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponAttackType, WeaponConfigTable } from '../../assets/scripts/config/WeaponConfigTable.ts';

test('chili bomb is configured as a single exploding projectile', () => {
    const config = WeaponConfigTable.chili_bomb;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.MultiBullet);
    assert.equal(config.volley?.count, 1);
    assert.equal(config.damage, 16);
    assert.equal(config.impact?.aoeRadius, 80);
    assert.equal(config.projectilePrefabKey, 'chili_bomb_projectile');
    assert.equal(config.flight?.endAtTarget, true);
});
