import type { WeaponConfigData, WeaponAttackType } from '../config/WeaponConfigTable.ts';
import {
    fireBeamAttack,
    fireBoomerangAttack,
    fireChainAttack,
    fireProjectileAttack,
    fireRicochetAttack,
    type WeaponAttackExecutorDeps,
} from './WeaponAttackExecutor.ts';

export type WeaponAttackExecutor = (config: WeaponConfigData, deps: WeaponAttackExecutorDeps) => boolean;

const WeaponAttackExecutorRegistry: Record<WeaponAttackType, WeaponAttackExecutor> = {
    boomerang: fireBoomerangAttack,
    projectile: fireProjectileAttack,
    beam: fireBeamAttack,
    chain: fireChainAttack,
    ricochet: fireRicochetAttack,
};

export function getWeaponAttackExecutor(attackType: WeaponAttackType): WeaponAttackExecutor {
    return WeaponAttackExecutorRegistry[attackType];
}
