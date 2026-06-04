import test from 'node:test';
import assert from 'node:assert/strict';
import { HitMath } from '../../assets/scripts/combat/HitMath.ts';

test('sweepCircleAgainstCircle hits when the path crosses the target between frames', () => {
    const hit = HitMath.sweepCircleAgainstCircle(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        5,
        { x: 60, y: 0 },
        10
    );

    assert.ok(hit);
    assert.equal(hit.travelT, 0.45);
    assert.deepEqual(hit.hitPoint, { x: 45, y: 0 });
});

test('sweepCircleAgainstCircle hits on exact tangency', () => {
    const hit = HitMath.sweepCircleAgainstCircle(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        5,
        { x: 50, y: 15 },
        10
    );

    assert.ok(hit);
    assert.equal(hit.travelT, 0.5);
    assert.deepEqual(hit.hitPoint, { x: 50, y: 0 });
});

test('sweepCircleAgainstCircle misses when the path never reaches the target radius', () => {
    const hit = HitMath.sweepCircleAgainstCircle(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        5,
        { x: 50, y: 25 },
        10
    );

    assert.equal(hit, null);
});

test('sweepCircleAgainstCircle reports immediate hit when the projectile starts inside range', () => {
    const hit = HitMath.sweepCircleAgainstCircle(
        { x: 10, y: 0 },
        { x: 30, y: 0 },
        5,
        { x: 20, y: 0 },
        10
    );

    assert.ok(hit);
    assert.equal(hit.travelT, 0);
    assert.deepEqual(hit.hitPoint, { x: 10, y: 0 });
});
