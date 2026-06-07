import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponAttackType } from '../../assets/scripts/config/WeaponConfigTable.ts';
import { resolveWeaponAttackBinding } from '../../assets/scripts/systems/WeaponAttackBinding.ts';

test('resolveWeaponAttackBinding maps each weapon prefab to the runtime attack component binding', () => {
    assert.equal(resolveWeaponAttackBinding('arc_boomerang', WeaponAttackType.Boomerang), 'boomerang');
    assert.equal(resolveWeaponAttackBinding('spread_bullet', WeaponAttackType.Projectile), 'spread');
    assert.equal(resolveWeaponAttackBinding('blast_bomb', WeaponAttackType.Projectile), 'blast_bomb');
    assert.equal(resolveWeaponAttackBinding('rapid_bullet', WeaponAttackType.Projectile), 'rapid_bullet');
    assert.equal(resolveWeaponAttackBinding('knockback_cannon', WeaponAttackType.Projectile), 'knockback_cannon');
    assert.equal(resolveWeaponAttackBinding('piercing_beam', WeaponAttackType.Beam), 'piercing_beam');
    assert.equal(resolveWeaponAttackBinding('chain_lightning', WeaponAttackType.Chain), 'chain_lightning');
    assert.equal(resolveWeaponAttackBinding('ricochet_bullet', WeaponAttackType.Ricochet), 'ricochet_bullet');
});

test('resolveWeaponAttackBinding falls back by attack type for unknown prefab keys', () => {
    assert.equal(resolveWeaponAttackBinding('unknown_boomerang', WeaponAttackType.Boomerang), 'boomerang');
    assert.equal(resolveWeaponAttackBinding('unknown_projectile', WeaponAttackType.Projectile), 'direct_hit_projectile');
    assert.equal(resolveWeaponAttackBinding('unknown_beam', WeaponAttackType.Beam), 'piercing_beam');
    assert.equal(resolveWeaponAttackBinding('unknown_chain', WeaponAttackType.Chain), 'chain_lightning');
    assert.equal(resolveWeaponAttackBinding('unknown_ricochet', WeaponAttackType.Ricochet), 'ricochet_bullet');
});
