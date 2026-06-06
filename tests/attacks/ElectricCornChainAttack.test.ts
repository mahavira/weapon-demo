import test from 'node:test';
import assert from 'node:assert/strict';
import { pickRandomChainTarget } from '../../assets/scripts/attacks/ChainTargetPicker.ts';

test('pickRandomChainTarget returns null when there are no candidates', () => {
    assert.equal(pickRandomChainTarget([], 0.5), null);
});

test('pickRandomChainTarget selects candidates by random ratio instead of nearest ordering', () => {
    const candidates = ['A', 'B', 'C', 'D'];

    assert.equal(pickRandomChainTarget(candidates, 0), 'A');
    assert.equal(pickRandomChainTarget(candidates, 0.26), 'B');
    assert.equal(pickRandomChainTarget(candidates, 0.74), 'C');
    assert.equal(pickRandomChainTarget(candidates, 0.99), 'D');
});
