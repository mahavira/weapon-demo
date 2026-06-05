import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleBeamHits } from '../../assets/scripts/combat/BeamHitSampler.ts';

test('sampleBeamHits returns every target intersected by the beam ordered by travel distance', () => {
    const hits = sampleBeamHits(
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        20,
        [
            {
                target: 'backline',
                center: { x: 140, y: 0 },
                radius: 10,
            },
            {
                target: 'frontline',
                center: { x: 60, y: 0 },
                radius: 12,
            },
            {
                target: 'offlane',
                center: { x: 80, y: 45 },
                radius: 8,
            },
        ]
    );

    assert.deepEqual(hits.map((hit) => hit.target), ['frontline', 'backline']);
    assert.equal(hits[0]?.travelT, 0.14);
    assert.equal(hits[1]?.travelT, 0.55);
});

test('sampleBeamHits returns an empty list when the beam misses every target', () => {
    const hits = sampleBeamHits(
        { x: 0, y: 0 },
        { x: 120, y: 0 },
        10,
        [
            {
                target: 'top',
                center: { x: 60, y: 30 },
                radius: 8,
            },
        ]
    );

    assert.deepEqual(hits, []);
});
