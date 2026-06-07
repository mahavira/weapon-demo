import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildKnockbackCannonAreaDamage,
    resolveKnockbackCannonDistance,
} from '../../assets/scripts/attacks/projectile/KnockbackCannonImpact.ts';

test('buildKnockbackCannonAreaDamage keeps full damage at the center and falls off toward the edge', () => {
    const baseDamageInfo = {
        amount: 24,
        sourceType: 'Projectile',
        sourceWeaponId: 'knockback_cannon',
        cloneWithAmount(amount: number) {
            return {
                ...this,
                amount,
            };
        },
    };

    const centerDamageInfo = buildKnockbackCannonAreaDamage(baseDamageInfo, 0, 80, 0, 0.35);
    const edgeDamageInfo = buildKnockbackCannonAreaDamage(baseDamageInfo, 80, 80, 0, 0.35);

    assert.equal(centerDamageInfo.amount, 24);
    assert.equal(edgeDamageInfo.amount, 24 * 0.35);
});

test('resolveKnockbackCannonDistance reduces knockback with distance from the impact center', () => {
    assert.equal(resolveKnockbackCannonDistance(40, 0.35, 0, 80), 40);
    assert.equal(resolveKnockbackCannonDistance(40, 0.35, 80, 80), 14);
    assert.equal(resolveKnockbackCannonDistance(40, 0.35, 120, 80), 14);
});
