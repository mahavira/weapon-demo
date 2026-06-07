import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlastBombRuntimeConfig } from '../../assets/scripts/attacks/projectile/BlastBombRuntimeConfig.ts';

test('buildBlastBombRuntimeConfig normalizes blast bomb runtime values', () => {
    const runtimeConfig = buildBlastBombRuntimeConfig({
        travelSpeed: 0,
        arcHeight: -10,
        rotateSpeed: 22,
        autoFaceDirection: false,
        destroyWhenExitVisibleArea: false,
    });

    assert.equal(runtimeConfig.travelSpeed, 1);
    assert.equal(runtimeConfig.arcHeight, 0);
    assert.equal(runtimeConfig.rotateSpeed, 22);
    assert.equal(runtimeConfig.autoFaceDirection, false);
    assert.equal(runtimeConfig.destroyWhenExitVisibleArea, false);
});
