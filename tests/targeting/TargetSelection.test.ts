import test from 'node:test';
import assert from 'node:assert/strict';
import { findNearestTarget, findTargetsWithinRange } from '../../assets/scripts/targeting/TargetSelection.ts';

test('findNearestTarget returns the closest candidate by world position', () => {
    const targetA = { id: 'A' };
    const targetB = { id: 'B' };
    const targetC = { id: 'C' };

    const nearestTarget = findNearestTarget(
        { x: 10, y: 10 },
        [
            { target: targetA, worldPos: { x: 100, y: 100 } },
            { target: targetB, worldPos: { x: 18, y: 14 } },
            { target: targetC, worldPos: { x: 30, y: 30 } },
        ]
    );

    assert.equal(nearestTarget, targetB);
});

test('findNearestTarget returns null when there are no candidates', () => {
    const nearestTarget = findNearestTarget({ x: 0, y: 0 }, []);

    assert.equal(nearestTarget, null);
});

test('findTargetsWithinRange returns only candidates inside the radius', () => {
    const targetA = { id: 'A' };
    const targetB = { id: 'B' };
    const targetC = { id: 'C' };

    const targets = findTargetsWithinRange(
        { x: 0, y: 0 },
        10,
        [
            { target: targetA, worldPos: { x: 6, y: 8 } },
            { target: targetB, worldPos: { x: 7, y: 7 } },
            { target: targetC, worldPos: { x: 12, y: 0 } },
        ]
    );

    assert.deepEqual(targets, [targetA, targetB]);
});
