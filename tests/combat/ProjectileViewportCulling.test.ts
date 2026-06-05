import test from 'node:test';
import assert from 'node:assert/strict';
import { isRectFullyOutsideVisibleArea } from '../../assets/scripts/attacks/projectile/ProjectileViewportCulling.ts';

test('rect remains alive while any part still overlaps the visible area', () => {
    const projectileBounds = {
        x: 710,
        y: 600,
        width: 20,
        height: 20,
    };
    const visibleArea = {
        x: 0,
        y: 0,
        width: 720,
        height: 1280,
    };

    assert.equal(isRectFullyOutsideVisibleArea(projectileBounds, visibleArea), false);
});

test('rect is culled once it is fully outside the visible area', () => {
    const projectileBounds = {
        x: 721,
        y: 600,
        width: 20,
        height: 20,
    };
    const visibleArea = {
        x: 0,
        y: 0,
        width: 720,
        height: 1280,
    };

    assert.equal(isRectFullyOutsideVisibleArea(projectileBounds, visibleArea), true);
});
