import { buildBoomerangRuntimeConfig } from '../attacks/BoomerangRuntimeConfig.ts';
import { buildChainLightningRuntimeConfig } from '../attacks/ChainLightningRuntimeConfig.ts';
import { buildRicochetBulletRuntimeConfig } from '../attacks/RicochetBulletRuntimeConfig.ts';
import { buildBlastBombRuntimeConfig } from '../attacks/projectile/BlastBombRuntimeConfig.ts';
import { buildLinearProjectileRuntimeConfig } from '../attacks/projectile/LinearProjectileRuntimeConfig.ts';
import type { WeaponConfigData } from '../config/WeaponConfigTable.ts';

export function resolveBoomerangRuntimeConfig(config: WeaponConfigData) {
    return buildBoomerangRuntimeConfig(config.boomerang ?? {});
}

export function resolveLinearProjectileRuntimeConfig(config: WeaponConfigData) {
    return buildLinearProjectileRuntimeConfig(config.projectile ?? {});
}

export function resolveBlastBombRuntimeConfig(config: WeaponConfigData) {
    return buildBlastBombRuntimeConfig(config.blastBomb ?? {});
}

export function resolveChainLightningRuntimeConfig(config: WeaponConfigData) {
    return buildChainLightningRuntimeConfig(config.chain ?? {});
}

export function resolveRicochetRuntimeConfig(config: WeaponConfigData) {
    return buildRicochetBulletRuntimeConfig(config.ricochet ?? {});
}
