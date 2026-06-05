import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponAttackType, WeaponConfigTable } from '../../assets/scripts/config/WeaponConfigTable.ts';

test('chili bomb is configured as a single exploding projectile', () => {
    const config = WeaponConfigTable.chili_bomb;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Projectile);
    assert.equal(config.volley?.count, 1);
    assert.equal(config.damage, 16);
    assert.equal(config.impact?.aoeRadius, 80);
    assert.equal(config.projectilePrefabKey, 'chili_bomb_projectile');
    assert.equal(config.flight?.endAtTarget, true);
});

test('sunflower spotlight mirror is configured as a beam weapon', () => {
    const config = WeaponConfigTable.sunflower_spotlight_mirror;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Beam);
    assert.equal(config.damage, 48);
    assert.equal(config.cooldown, 4);
    assert.equal(config.projectilePrefabKey, 'sunflower_spotlight_mirror_beam');
    assert.equal(config.beam?.durationSeconds, 3);
    assert.equal(config.beam?.tickIntervalSeconds, 0.25);
    assert.equal(config.beam?.beamWidth, 18);
    assert.equal(config.beam?.beamWidthMultiplier, 1);
    assert.equal(config.beam?.beamRange, 1020);
});
