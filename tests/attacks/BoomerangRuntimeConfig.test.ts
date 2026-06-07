import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBoomerangRuntimeConfig } from '../../assets/scripts/attacks/BoomerangRuntimeConfig.ts';

test('buildBoomerangRuntimeConfig normalizes boomerang runtime values', () => {
    const runtimeConfig = buildBoomerangRuntimeConfig({
        forwardTravelDuration: -1,
        returnDuration: 0,
        sideOffset: 180,
        topOffset: 72,
        hitRadius: -5,
        rotateSpeed: 24,
        returnDamageScale: -2,
        destroyWhenExitVisibleArea: false,
    });

    assert.equal(runtimeConfig.forwardTravelDuration, 0.01);
    assert.equal(runtimeConfig.returnDuration, 0.01);
    assert.equal(runtimeConfig.sideOffset, 180);
    assert.equal(runtimeConfig.topOffset, 72);
    assert.equal(runtimeConfig.hitRadius, 1);
    assert.equal(runtimeConfig.rotateSpeed, 24);
    assert.equal(runtimeConfig.returnDamageScale, 0);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, false);
});
