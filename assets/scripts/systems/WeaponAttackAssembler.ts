import { Node } from 'cc';
import { AttackBase } from '../attacks/base/AttackBase';
import { ChainLightningAttack } from '../attacks/ChainLightningAttack';
import { PiercingBeam } from '../attacks/PiercingBeam';
import { BlastBombProjectile } from '../attacks/projectile/BlastBombProjectile';
import { BoomerangProjectile } from '../attacks/projectile/BoomerangProjectile';
import { DirectHitProjectile } from '../attacks/projectile/DirectHitProjectile';
import { KnockbackCannonProjectile } from '../attacks/projectile/KnockbackCannonProjectile';
import { LinearProjectile } from '../attacks/projectile/LinearProjectile';
import { RapidBulletProjectile } from '../attacks/projectile/RapidBulletProjectile';
import { RicochetBulletProjectile } from '../attacks/projectile/RicochetBulletProjectile';
import { SpreadBulletProjectile } from '../attacks/projectile/SpreadBulletProjectile';
import { WeaponConfigData } from '../config/WeaponConfigTable';
import { WeaponAttackBindingKey } from './WeaponAttackBinding';
import {
    resolveBlastBombRuntimeConfig,
    resolveBoomerangRuntimeConfig,
    resolveChainLightningRuntimeConfig,
    resolveLinearProjectileRuntimeConfig,
    resolveRicochetRuntimeConfig,
} from './WeaponAttackRuntimeConfigResolver';

type WeaponAttackAssemblerEntry = {
    ensureAttached(node: Node): void;
    getAttackComponent(node: Node): AttackBase | null;
    applyRuntimeConfig?(attack: AttackBase, config: WeaponConfigData): void;
};

const WeaponAttackAssemblerRegistry: Record<WeaponAttackBindingKey, WeaponAttackAssemblerEntry> = {
    boomerang: {
        ensureAttached(node) {
            if (!node.getComponent(BoomerangProjectile)) {
                node.addComponent(BoomerangProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(BoomerangProjectile);
        },
        applyRuntimeConfig(attack, config) {
            if (attack instanceof BoomerangProjectile) {
                attack.configureBoomerang(resolveBoomerangRuntimeConfig(config));
            }
        },
    },
    spread: {
        ensureAttached(node) {
            if (!node.getComponent(SpreadBulletProjectile)) {
                node.addComponent(SpreadBulletProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(SpreadBulletProjectile);
        },
        applyRuntimeConfig: applyLinearProjectileRuntimeConfig,
    },
    blast_bomb: {
        ensureAttached(node) {
            if (!node.getComponent(BlastBombProjectile)) {
                node.addComponent(BlastBombProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(BlastBombProjectile);
        },
        applyRuntimeConfig(attack, config) {
            if (attack instanceof BlastBombProjectile) {
                attack.configureBlastBomb(resolveBlastBombRuntimeConfig(config));
                attack.configureBurningOnImpact(config.burningOnImpact ?? null);
            }
        },
    },
    rapid_bullet: {
        ensureAttached(node) {
            if (!node.getComponent(RapidBulletProjectile)) {
                node.addComponent(RapidBulletProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(RapidBulletProjectile);
        },
        applyRuntimeConfig: applyLinearProjectileRuntimeConfig,
    },
    knockback_cannon: {
        ensureAttached(node) {
            if (!node.getComponent(KnockbackCannonProjectile)) {
                node.addComponent(KnockbackCannonProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(KnockbackCannonProjectile);
        },
        applyRuntimeConfig: applyLinearProjectileRuntimeConfig,
    },
    piercing_beam: {
        ensureAttached(node) {
            if (!node.getComponent(PiercingBeam)) {
                node.addComponent(PiercingBeam);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(PiercingBeam);
        },
        applyRuntimeConfig(attack, config) {
            if (attack instanceof PiercingBeam) {
                attack.setBeamConfig(config.beam ?? {});
            }
        },
    },
    chain_lightning: {
        ensureAttached(node) {
            if (!node.getComponent(ChainLightningAttack)) {
                node.addComponent(ChainLightningAttack);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(ChainLightningAttack);
        },
        applyRuntimeConfig(attack, config) {
            if (attack instanceof ChainLightningAttack) {
                attack.configureChain(resolveChainLightningRuntimeConfig(config));
            }
        },
    },
    ricochet_bullet: {
        ensureAttached(node) {
            if (!node.getComponent(RicochetBulletProjectile)) {
                node.addComponent(RicochetBulletProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(RicochetBulletProjectile);
        },
        applyRuntimeConfig(attack, config) {
            if (attack instanceof RicochetBulletProjectile) {
                attack.configureRicochet(resolveRicochetRuntimeConfig(config));
            }
        },
    },
    direct_hit_projectile: {
        ensureAttached(node) {
            if (!node.getComponent(DirectHitProjectile)) {
                node.addComponent(DirectHitProjectile);
            }
        },
        getAttackComponent(node) {
            return node.getComponent(DirectHitProjectile);
        },
        applyRuntimeConfig: applyLinearProjectileRuntimeConfig,
    },
};

export function assembleWeaponAttack(node: Node, attackBinding: WeaponAttackBindingKey, config: WeaponConfigData): void {
    const registryEntry = WeaponAttackAssemblerRegistry[attackBinding];
    registryEntry.ensureAttached(node);

    const attack = registryEntry.getAttackComponent(node);
    if (attack) {
        registryEntry.applyRuntimeConfig?.(attack, config);
    }
}

export function getAssembledWeaponAttack(node: Node, attackBinding: WeaponAttackBindingKey): AttackBase | null {
    return WeaponAttackAssemblerRegistry[attackBinding].getAttackComponent(node);
}

function applyLinearProjectileRuntimeConfig(attack: AttackBase, config: WeaponConfigData): void {
    if (attack instanceof LinearProjectile) {
        attack.configureProjectile(resolveLinearProjectileRuntimeConfig(config));
    }
}
