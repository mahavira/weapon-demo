import test from 'node:test';
import assert from 'node:assert/strict';
import { StatusApplyInfo } from '../../assets/scripts/combat/StatusApplyInfo.ts';
import { StatusEffectType } from '../../assets/scripts/core/types/StatusEffectType.ts';
import { BurningStatusRuntime } from '../../assets/scripts/enemy/base/BurningStatusRuntime.ts';

function createBurningStatusApplyInfo(): StatusApplyInfo {
    return new StatusApplyInfo({
        effectType: StatusEffectType.Burning,
        durationSeconds: 3,
        tickIntervalSeconds: 0.5,
        tickDamageRatio: 0.3,
        sourceWeaponId: 'chili_bomb',
    });
}

test('burning status lasts 3 seconds and ticks every 0.5 seconds', () => {
    const runtime = new BurningStatusRuntime();
    runtime.applyStatus(createBurningStatusApplyInfo(), 16);

    const tickDamages: number[] = [];
    for (let index = 0; index < 6; index++) {
        const advanceResult = runtime.advance(0.5);
        tickDamages.push(...advanceResult.tickResults.map((tickResult) => tickResult.damageAmount));
    }

    assert.equal(runtime.hasStatus(), false);
    assert.deepEqual(tickDamages, [2.4, 2.4, 2.4, 2.4, 2.4, 2.4]);
});

test('reapplying burning refreshes duration without creating a second runtime instance', () => {
    const runtime = new BurningStatusRuntime();
    runtime.applyStatus(createBurningStatusApplyInfo(), 16);

    runtime.advance(2.5);
    assert.equal(runtime.hasStatus(), true);
    assert.equal(runtime.getRemainingSeconds(), 0.5);

    const didStart = runtime.applyStatus(createBurningStatusApplyInfo(), 16);
    assert.equal(didStart, false);
    assert.equal(runtime.getRemainingSeconds(), 3);
});

test('burning tick preserves source weapon id and dot damage amount', () => {
    const runtime = new BurningStatusRuntime();
    runtime.applyStatus(createBurningStatusApplyInfo(), 16);

    const advanceResult = runtime.advance(0.5);
    assert.equal(advanceResult.tickResults.length, 1);
    assert.equal(advanceResult.tickResults[0].damageAmount, 2.4);
    assert.equal(advanceResult.tickResults[0].sourceWeaponId, 'chili_bomb');
});

test('clearing burning stops future ticks, matching enemy destruction cleanup', () => {
    const runtime = new BurningStatusRuntime();
    runtime.applyStatus(createBurningStatusApplyInfo(), 16);

    runtime.advance(1);
    runtime.clear();
    const advanceResult = runtime.advance(5);

    assert.equal(runtime.hasStatus(), false);
    assert.deepEqual(advanceResult.tickResults, []);
});
