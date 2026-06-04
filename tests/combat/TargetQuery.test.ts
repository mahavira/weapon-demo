import test from 'node:test';
import assert from 'node:assert/strict';
import { DamageChannel } from '../../assets/scripts/core/types/DamageChannel.ts';
import { matchesTargetQuery } from '../../assets/scripts/combat/TargetQuery.ts';
import { TargetabilityState } from '../../assets/scripts/combat/TargetabilityState.ts';

test('area-only combat profile is not targetable and rejects projectile hits', () => {
    const state = new TargetabilityState();
    state.applyAreaOnlyCombatProfile();

    assert.equal(state.canBeTargeted(), false);
    assert.equal(state.canBeHitBy(DamageChannel.Projectile), false);
    assert.equal(state.canBeHitBy(DamageChannel.SingleTarget), false);
    assert.equal(state.canBeHitBy(DamageChannel.Area), true);
});

test('normal combat profile restores targetability and all damage channels', () => {
    const state = new TargetabilityState();
    state.applyAreaOnlyCombatProfile();
    state.applyNormalCombatProfile();

    assert.equal(state.canBeTargeted(), true);
    assert.equal(state.canBeHitBy(DamageChannel.Projectile), true);
    assert.equal(state.canBeHitBy(DamageChannel.SingleTarget), true);
    assert.equal(state.canBeHitBy(DamageChannel.Area), true);
});

test('target query can separately filter targetability and damage channels', () => {
    const state = new TargetabilityState();
    state.applyAreaOnlyCombatProfile();

    assert.equal(matchesTargetQuery(state, { requireTargetable: true }), false);
    assert.equal(matchesTargetQuery(state, { damageChannel: DamageChannel.Projectile }), false);
    assert.equal(matchesTargetQuery(state, { damageChannel: DamageChannel.Area }), true);
});
