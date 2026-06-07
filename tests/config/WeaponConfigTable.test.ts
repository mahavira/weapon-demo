import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponAttackType, WeaponConfigTable } from '../../assets/scripts/config/WeaponConfigTable.ts';

test('blast bomb is configured as a single exploding projectile', () => {
    const config = WeaponConfigTable.blast_bomb;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Projectile);
    assert.equal(config.volley?.count, 1);
    assert.equal(config.damage, 16);
    assert.equal(config.impact?.aoeRadius, 80);
    assert.equal(config.weaponPrefabKey, 'blast_bomb');
    assert.equal(config.flight?.endAtTarget, true);
});

test('piercing beam is configured as a beam weapon', () => {
    const config = WeaponConfigTable.piercing_beam;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Beam);
    assert.equal(config.damage, 48);
    assert.equal(config.cooldown, 2);
    assert.equal(config.weaponPrefabKey, 'piercing_beam');
    assert.equal(config.beam?.durationSeconds, 2);
    assert.equal(config.beam?.tickIntervalSeconds, 0.25);
    assert.equal(config.beam?.beamWidth, 18);
    assert.equal(config.beam?.beamWidthMultiplier, 1);
    assert.equal(config.beam?.beamRange, 1020);
});

test('chain lightning is configured as a chain weapon', () => {
    const config = WeaponConfigTable.chain_lightning;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Chain);
    assert.equal(config.damage, 8);
    assert.equal(config.cooldown, 1);
    assert.equal(config.weaponPrefabKey, 'chain_lightning');
    assert.equal(config.chain?.maxTargets, 5);
    assert.equal(config.chain?.chainRange, 340);
    assert.equal(config.chain?.segmentDurationSeconds, 0.38);
    assert.equal(config.chain?.initialHitRadius, 48);
    assert.equal(config.chain?.bounceDamageScale, 1);
    assert.equal(config.chain?.hitDelaySeconds, 0.02);
    assert.equal(config.chain?.lateralAmplitudeScale, 0.5);
    assert.equal(config.chain?.keepPreviousSegmentsVisible, true);
});

test('ricochet bullet is configured as a ricochet weapon', () => {
    const config = WeaponConfigTable.ricochet_bullet;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Ricochet);
    assert.equal(config.damage, 7);
    assert.equal(config.weaponPrefabKey, 'ricochet_bullet');
    assert.equal(config.ricochet?.maxHits, 4);
    assert.equal(config.ricochet?.ricochetRange, 280);
    assert.equal(config.ricochet?.allowBounceBackToPreviousTarget, true);
});

test('knockback cannon is configured as a single projectile with knockback', () => {
    const config = WeaponConfigTable.knockback_cannon;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Projectile);
    assert.equal(config.damage, 24);
    assert.equal(config.volley?.count, 1);
    assert.equal(config.weaponPrefabKey, 'knockback_cannon');
    assert.equal(config.knockback?.radius, 80);
    assert.equal(config.knockback?.distance, 40);
    assert.equal(config.knockback?.edgeDistanceScale, 0.35);
});
