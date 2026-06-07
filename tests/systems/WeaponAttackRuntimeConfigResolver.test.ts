import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponConfigTable } from '../../assets/scripts/config/WeaponConfigTable.ts';
import {
    resolveBlastBombRuntimeConfig,
    resolveBoomerangRuntimeConfig,
    resolveLinearProjectileRuntimeConfig,
    resolveRicochetRuntimeConfig,
} from '../../assets/scripts/systems/WeaponAttackRuntimeConfigResolver.ts';

test('weapon attack runtime config resolver reads boomerang config from the table', () => {
    const runtimeConfig = resolveBoomerangRuntimeConfig(WeaponConfigTable.arc_boomerang);

    assert.equal(runtimeConfig.forwardTravelDuration, 0.75);
    assert.equal(runtimeConfig.returnDuration, 0.65);
    assert.equal(runtimeConfig.sideOffset, 220);
    assert.equal(runtimeConfig.topOffset, 100);
    assert.equal(runtimeConfig.hitRadius, 60);
    assert.equal(runtimeConfig.rotateSpeed, 18);
    assert.equal(runtimeConfig.returnDamageScale, 1);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, true);
});

test('weapon attack runtime config resolver reads projectile config from the table', () => {
    const runtimeConfig = resolveLinearProjectileRuntimeConfig(WeaponConfigTable.spread_bullet);

    assert.equal(runtimeConfig.travelSpeed, 1280);
    assert.equal(runtimeConfig.hitRadius, 42);
    assert.equal(runtimeConfig.rotateSpeed, 0);
    assert.equal(runtimeConfig.autoFaceDirection, true);
    assert.equal(runtimeConfig.faceAngleOffset, 0);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, true);
});

test('weapon attack runtime config resolver reads blast bomb config from the table', () => {
    const runtimeConfig = resolveBlastBombRuntimeConfig(WeaponConfigTable.blast_bomb);

    assert.equal(runtimeConfig.travelSpeed, 640);
    assert.equal(runtimeConfig.arcHeight, 280);
    assert.equal(runtimeConfig.rotateSpeed, 18);
    assert.equal(runtimeConfig.autoFaceDirection, true);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, true);
});

test('weapon attack runtime config resolver reads ricochet config from the table', () => {
    const runtimeConfig = resolveRicochetRuntimeConfig(WeaponConfigTable.ricochet_bullet);

    assert.equal(runtimeConfig.maxHits, 4);
    assert.equal(runtimeConfig.ricochetRange, 280);
    assert.equal(runtimeConfig.allowBounceBackToPreviousTarget, true);
    assert.equal(runtimeConfig.travelSpeed, 960);
    assert.equal(runtimeConfig.rotateSpeed, 12);
    assert.equal(runtimeConfig.autoFaceDirection, true);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, true);
});
