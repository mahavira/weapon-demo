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
    assert.equal(config.blastBomb?.travelSpeed, 640);
    assert.equal(config.blastBomb?.arcHeight, 280);
    assert.equal(config.blastBomb?.rotateSpeed, 18);
    assert.equal(config.blastBomb?.autoFaceDirection, true);
    assert.equal(config.blastBomb?.destroyWhenExitVisibleArea, true);
    assert.equal(config.burningOnImpact?.durationSeconds, 3);
    assert.equal(config.burningOnImpact?.tickIntervalSeconds, 0.5);
    assert.equal(config.burningOnImpact?.tickDamageRatio, 0.3);
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
    assert.equal(config.ricochet?.travelSpeed, 960);
    assert.equal(config.ricochet?.rotateSpeed, 12);
    assert.equal(config.ricochet?.autoFaceDirection, true);
    assert.equal(config.ricochet?.destroyWhenExitVisibleArea, true);
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
    assert.equal(config.projectile?.travelSpeed, 1000);
    assert.equal(config.projectile?.hitRadius, 42);
    assert.equal(config.projectile?.rotateSpeed, 0);
    assert.equal(config.projectile?.autoFaceDirection, true);
    assert.equal(config.projectile?.faceAngleOffset, -90);
    assert.equal(config.projectile?.destroyWhenExitVisibleArea, true);
});

test('arc boomerang is configured as a boomerang weapon with runtime parameters in the table', () => {
    const config = WeaponConfigTable.arc_boomerang;

    assert.ok(config);
    assert.equal(config.attackType, WeaponAttackType.Boomerang);
    assert.equal(config.weaponPrefabKey, 'arc_boomerang');
    assert.equal(config.boomerang?.forwardTravelDuration, 0.75);
    assert.equal(config.boomerang?.returnDuration, 0.65);
    assert.equal(config.boomerang?.sideOffset, 220);
    assert.equal(config.boomerang?.topOffset, 100);
    assert.equal(config.boomerang?.hitRadius, 60);
    assert.equal(config.boomerang?.rotateSpeed, 18);
    assert.equal(config.boomerang?.returnDamageScale, 1);
    assert.equal(config.boomerang?.forwardDistance, 360);
    assert.equal(config.boomerang?.destroyWhenExitVisibleArea, true);
});

test('spread and rapid projectile weapons keep their motion config in the table', () => {
    const spreadBulletConfig = WeaponConfigTable.spread_bullet;
    const rapidBulletConfig = WeaponConfigTable.rapid_bullet;

    assert.equal(spreadBulletConfig.projectile?.travelSpeed, 1280);
    assert.equal(spreadBulletConfig.projectile?.hitRadius, 42);
    assert.equal(spreadBulletConfig.projectile?.rotateSpeed, 0);
    assert.equal(spreadBulletConfig.projectile?.autoFaceDirection, true);
    assert.equal(spreadBulletConfig.projectile?.faceAngleOffset, 0);
    assert.equal(spreadBulletConfig.projectile?.destroyWhenExitVisibleArea, true);

    assert.equal(rapidBulletConfig.projectile?.travelSpeed, 4000);
    assert.equal(rapidBulletConfig.projectile?.hitRadius, 42);
    assert.equal(rapidBulletConfig.projectile?.rotateSpeed, 0);
    assert.equal(rapidBulletConfig.projectile?.autoFaceDirection, true);
    assert.equal(rapidBulletConfig.projectile?.faceAngleOffset, 0);
    assert.equal(rapidBulletConfig.projectile?.destroyWhenExitVisibleArea, true);
    assert.equal(rapidBulletConfig.impact, undefined);
    assert.equal(rapidBulletConfig.knockback, undefined);
});
