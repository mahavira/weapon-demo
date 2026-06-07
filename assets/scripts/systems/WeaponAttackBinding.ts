import { WeaponAttackType } from '../config/WeaponConfigTable.ts';

export const WeaponAttackBinding = {
    arc_boomerang: 'boomerang',
    spread_bullet: 'spread',
    blast_bomb: 'blast_bomb',
    rapid_bullet: 'rapid_bullet',
    knockback_cannon: 'rapid_bullet',
    piercing_beam: 'piercing_beam',
    chain_lightning: 'chain_lightning',
    ricochet_bullet: 'ricochet_bullet',
} as const;

export type WeaponAttackBindingKey = typeof WeaponAttackBinding[keyof typeof WeaponAttackBinding];

export function resolveWeaponAttackBinding(weaponPrefabKey: string, attackType: WeaponAttackType): WeaponAttackBindingKey {
    const binding = WeaponAttackBinding[weaponPrefabKey as keyof typeof WeaponAttackBinding];
    if (binding) {
        return binding;
    }

    switch (attackType) {
        case WeaponAttackType.Boomerang:
            return 'boomerang';
        case WeaponAttackType.Beam:
            return 'piercing_beam';
        case WeaponAttackType.Chain:
            return 'chain_lightning';
        case WeaponAttackType.Ricochet:
            return 'ricochet_bullet';
        case WeaponAttackType.Projectile:
        default:
            return 'spread';
    }
}
