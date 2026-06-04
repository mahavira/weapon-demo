import test from 'node:test';
import assert from 'node:assert/strict';
import { AttackPhase } from '../../assets/scripts/core/types/AttackTypes.ts';
import { AttackHitTracker } from '../../assets/scripts/attacks/base/AttackHitTracker.ts';
import {
    FIRST_HIT_PER_PHASE_POLICY,
    HitDedupeMode,
    HitStopMode,
    PENETRATING_PER_PHASE_POLICY,
} from '../../assets/scripts/combat/HitPolicy.ts';
import type { HitPolicy } from '../../assets/scripts/combat/HitPolicy.ts';

test('per-phase policy blocks duplicate hits within the same phase only', () => {
    const tracker = new AttackHitTracker<object>();
    const target = {};

    tracker.markHit(AttackPhase.Forward, target);

    assert.equal(tracker.hasHit(AttackPhase.Forward, target, PENETRATING_PER_PHASE_POLICY), true);
    assert.equal(tracker.hasHit(AttackPhase.Return, target, PENETRATING_PER_PHASE_POLICY), false);
});

test('per-phase policy can disable rehit on phase change', () => {
    const tracker = new AttackHitTracker<object>();
    const target = {};

    tracker.markHit(AttackPhase.Forward, target);

    assert.equal(tracker.hasHit(AttackPhase.Return, target, FIRST_HIT_PER_PHASE_POLICY), true);
});

test('lifetime policy blocks the target across all phases', () => {
    const tracker = new AttackHitTracker<object>();
    const target = {};
    const policy: HitPolicy = {
        stopMode: HitStopMode.Penetrate,
        maxTargetsPerFrame: 4,
        dedupeMode: HitDedupeMode.Lifetime,
        allowRehitOnPhaseChange: true,
    };

    tracker.markHit(AttackPhase.Forward, target);

    assert.equal(tracker.hasHit(AttackPhase.Return, target, policy), true);
});

test('none dedupe mode never filters hits', () => {
    const tracker = new AttackHitTracker<object>();
    const target = {};
    const policy: HitPolicy = {
        stopMode: HitStopMode.FirstHit,
        maxTargetsPerFrame: 1,
        dedupeMode: HitDedupeMode.None,
        allowRehitOnPhaseChange: false,
    };

    tracker.markHit(AttackPhase.Impact, target);

    assert.equal(tracker.hasHit(AttackPhase.Impact, target, policy), false);
});
