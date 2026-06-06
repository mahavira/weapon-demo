import test from 'node:test';
import assert from 'node:assert/strict';
import { pickRicochetTarget } from '../../assets/scripts/attacks/AcornRicochetTargetPicker.ts';

test('pickRicochetTarget selects the nearest unvisited candidate within range', () => {
    const previousTarget = { id: 'previous' };
    const nearestTarget = { id: 'nearest' };
    const fartherTarget = { id: 'farther' };

    const target = pickRicochetTarget({
        currentWorldPos: { x: 0, y: 0, z: 0 },
        previousTarget,
        visitedTargets: new Set([previousTarget]),
        ricochetRange: 100,
        allowBounceBackToPreviousTarget: true,
        candidates: [
            { target: fartherTarget, worldPos: { x: 30, y: 40 } },
            { target: nearestTarget, worldPos: { x: 12, y: 16 } },
            { target: previousTarget, worldPos: { x: 10, y: 0 } },
        ],
    });

    assert.equal(target, nearestTarget);
});

test('pickRicochetTarget bounces back only to the previous target when no unvisited candidate remains', () => {
    const previousTarget = { id: 'previous' };
    const oldVisitedTarget = { id: 'old' };

    const target = pickRicochetTarget({
        currentWorldPos: { x: 0, y: 0, z: 0 },
        previousTarget,
        visitedTargets: new Set([previousTarget, oldVisitedTarget]),
        ricochetRange: 40,
        allowBounceBackToPreviousTarget: true,
        candidates: [
            { target: previousTarget, worldPos: { x: 10, y: 0 } },
            { target: oldVisitedTarget, worldPos: { x: 8, y: 0 } },
        ],
    });

    assert.equal(target, previousTarget);
});

test('pickRicochetTarget returns null when previous target is unavailable or out of range', () => {
    const previousTarget = { id: 'previous' };
    const oldVisitedTarget = { id: 'old' };

    const target = pickRicochetTarget({
        currentWorldPos: { x: 0, y: 0, z: 0 },
        previousTarget,
        visitedTargets: new Set([previousTarget, oldVisitedTarget]),
        ricochetRange: 20,
        allowBounceBackToPreviousTarget: true,
        candidates: [
            { target: oldVisitedTarget, worldPos: { x: 8, y: 0 } },
            { target: previousTarget, worldPos: { x: 30, y: 0 } },
        ],
    });

    assert.equal(target, null);
});

test('pickRicochetTarget returns null when bounce-back is disabled and only visited targets remain', () => {
    const previousTarget = { id: 'previous' };

    const target = pickRicochetTarget({
        currentWorldPos: { x: 0, y: 0, z: 0 },
        previousTarget,
        visitedTargets: new Set([previousTarget]),
        ricochetRange: 40,
        allowBounceBackToPreviousTarget: false,
        candidates: [
            { target: previousTarget, worldPos: { x: 10, y: 0 } },
        ],
    });

    assert.equal(target, null);
});
