import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlastBombBurningStatusApplyList } from '../../assets/scripts/attacks/projectile/BlastBombBurningStatus.ts';

test('buildBlastBombBurningStatusApplyList returns burning status when config is present', () => {
    const burningStatusApplyList = buildBlastBombBurningStatusApplyList({
        durationSeconds: 3,
        tickIntervalSeconds: 0.5,
        tickDamageRatio: 0.3,
    }, 'blast_bomb');

    assert.equal(burningStatusApplyList.length, 1);
    assert.equal(burningStatusApplyList[0].effectType, 'burning');
    assert.equal(burningStatusApplyList[0].durationSeconds, 3);
    assert.equal(burningStatusApplyList[0].tickIntervalSeconds, 0.5);
    assert.equal(burningStatusApplyList[0].tickDamageRatio, 0.3);
    assert.equal(burningStatusApplyList[0].sourceWeaponId, 'blast_bomb');
});

test('buildBlastBombBurningStatusApplyList returns no status when config is absent', () => {
    const burningStatusApplyList = buildBlastBombBurningStatusApplyList(null, 'blast_bomb');

    assert.deepEqual(burningStatusApplyList, []);
});
