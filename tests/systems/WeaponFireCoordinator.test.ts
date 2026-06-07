import test from 'node:test';
import assert from 'node:assert/strict';
import { WeaponConfigTable } from '../../assets/scripts/config/WeaponConfigTable.ts';
import {
    canFireWeapon,
    fireWeaponWithCooldown,
    markWeaponCooldown,
} from '../../assets/scripts/systems/WeaponFireCoordinator.ts';

test('fireWeaponWithCooldown writes cooldown only after a successful fire', () => {
    const nextFireTimeByWeaponId: Record<string, number> = {};
    let fireCount = 0;

    const didFire = fireWeaponWithCooldown({
        config: WeaponConfigTable.rapid_bullet,
        nextFireTimeByWeaponId,
        nowSeconds: 10,
        fireByConfig: () => {
            fireCount += 1;
            return true;
        },
    });

    assert.equal(didFire, true);
    assert.equal(fireCount, 1);
    assert.equal(nextFireTimeByWeaponId.rapid_bullet, 10.2);
});

test('fireWeaponWithCooldown does not write cooldown when firing fails', () => {
    const nextFireTimeByWeaponId: Record<string, number> = {};
    let fireCount = 0;

    const didFire = fireWeaponWithCooldown({
        config: WeaponConfigTable.rapid_bullet,
        nextFireTimeByWeaponId,
        nowSeconds: 10,
        fireByConfig: () => {
            fireCount += 1;
            return false;
        },
    });

    assert.equal(didFire, false);
    assert.equal(fireCount, 1);
    assert.equal(nextFireTimeByWeaponId.rapid_bullet, undefined);
});

test('fireWeaponWithCooldown does not execute while the weapon is still cooling down', () => {
    const nextFireTimeByWeaponId: Record<string, number> = {
        rapid_bullet: 10.2,
    };
    let fireCount = 0;

    const didFire = fireWeaponWithCooldown({
        config: WeaponConfigTable.rapid_bullet,
        nextFireTimeByWeaponId,
        nowSeconds: 10.1,
        fireByConfig: () => {
            fireCount += 1;
            return true;
        },
    });

    assert.equal(didFire, false);
    assert.equal(fireCount, 0);
    assert.equal(nextFireTimeByWeaponId.rapid_bullet, 10.2);
});

test('canFireWeapon and markWeaponCooldown coordinate correctly for zero cooldown weapons', () => {
    const config = {
        ...WeaponConfigTable.rapid_bullet,
        id: 'test_weapon_without_cooldown',
        cooldown: 0,
    };
    const nextFireTimeByWeaponId: Record<string, number> = {};

    assert.equal(canFireWeapon(config, nextFireTimeByWeaponId, 10), true);
    markWeaponCooldown(config, nextFireTimeByWeaponId, 10);
    assert.equal(nextFireTimeByWeaponId.test_weapon_without_cooldown, undefined);
});
