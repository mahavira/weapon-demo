import test from 'node:test';
import assert from 'node:assert/strict';
import { StatusApplyInfo } from '../../assets/scripts/combat/StatusApplyInfo.ts';
import { forwardStatusApplyList } from '../../assets/scripts/combat/StatusApplyForwarding.ts';
import { StatusEffectType } from '../../assets/scripts/core/types/StatusEffectType.ts';

test('status forwarding ignores targets without an enemy status controller', () => {
    const fakeTargetNode = {
        getComponent() {
            return null;
        },
    };

    assert.doesNotThrow(() => {
        forwardStatusApplyList(fakeTargetNode, [
            new StatusApplyInfo({
                effectType: StatusEffectType.Burning,
                durationSeconds: 3,
                tickIntervalSeconds: 0.5,
                tickDamageRatio: 0.3,
                sourceWeaponId: 'blast_bomb',
            }),
        ]);
    });
});
