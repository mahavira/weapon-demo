import { Node } from 'cc';
import { AttackBase } from '../attacks/base/AttackBase';
import { ChainLightningAttack } from '../attacks/ChainLightningAttack';
import { PiercingBeam } from '../attacks/PiercingBeam';
import { BlastBombProjectile } from '../attacks/projectile/BlastBombProjectile';
import { BoomerangProjectile } from '../attacks/projectile/BoomerangProjectile';
import { DirectHitProjectile } from '../attacks/projectile/DirectHitProjectile';
import { KnockbackCannonProjectile } from '../attacks/projectile/KnockbackCannonProjectile';
import { RapidBulletProjectile } from '../attacks/projectile/RapidBulletProjectile';
import { RicochetBulletProjectile } from '../attacks/projectile/RicochetBulletProjectile';
import { SpreadBulletProjectile } from '../attacks/projectile/SpreadBulletProjectile';
import { WeaponAttackBindingKey } from './WeaponAttackBinding';

type WeaponAttackAssemblerEntry = {
    ensureAttached(node: Node): void;
    getAttackComponent(node: Node): AttackBase | null;
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
    },
};

export function assembleWeaponAttack(node: Node, attackBinding: WeaponAttackBindingKey): void {
    WeaponAttackAssemblerRegistry[attackBinding].ensureAttached(node);
}

export function getAssembledWeaponAttack(node: Node, attackBinding: WeaponAttackBindingKey): AttackBase | null {
    return WeaponAttackAssemblerRegistry[attackBinding].getAttackComponent(node);
}
