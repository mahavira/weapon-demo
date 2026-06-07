import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLinearProjectileRuntimeConfig } from '../../assets/scripts/attacks/projectile/LinearProjectileRuntimeConfig.ts';

test('buildLinearProjectileRuntimeConfig normalizes linear projectile runtime values', () => {
    const runtimeConfig = buildLinearProjectileRuntimeConfig({
        travelSpeed: 0,
        hitRadius: -4,
        rotateSpeed: 9,
        autoFaceDirection: false,
        faceAngleOffset: 45,
        destroyWhenExitVisibleArea: false,
    });

    assert.equal(runtimeConfig.travelSpeed, 1);
    assert.equal(runtimeConfig.hitRadius, 1);
    assert.equal(runtimeConfig.rotateSpeed, 9);
    assert.equal(runtimeConfig.autoFaceDirection, false);
    assert.equal(runtimeConfig.faceAngleOffset, 45);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, false);
});
