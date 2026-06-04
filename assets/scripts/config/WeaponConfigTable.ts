export enum WeaponAttackType {
    Boomerang = 'boomerang',
    MultiBullet = 'multi_bullet',
}

export interface WeaponConfigData {
    id: string;
    name: string;
    attackType: WeaponAttackType;
    projectilePrefabKey: string;
    damage: number;
    cooldown?: number;

    /** Boomerang only. Return damage = damage * returnDamageScale. */
    returnDamageScale?: number;

    /** Multi-bullet only. */
    bulletCount?: number;
    bulletSpacingX?: number;
    bulletTargetSpreadX?: number;
    shotDelay?: number;
}

/**
 * Early-stage TypeScript config table.
 * Later you can replace this with JSON/Excel import without changing WeaponSystem's public API.
 */
export const WeaponConfigTable: Record<string, WeaponConfigData> = {
    banana_boomerang: {
        id: 'banana_boomerang',
        name: '香蕉回旋镖',
        attackType: WeaponAttackType.Boomerang,
        projectilePrefabKey: 'banana_boomerang_projectile',
        damage: 10,
        cooldown: 1.2,
        returnDamageScale: 1,
    },

    strawberry_gun: {
        id: 'strawberry_gun',
        name: '草莓枪',
        attackType: WeaponAttackType.MultiBullet,
        projectilePrefabKey: 'strawberry_bullet_projectile',
        damage: 2,
        cooldown: 0.35,
        bulletCount: 3,
        bulletSpacingX: 32,
        bulletTargetSpreadX: 32,
        shotDelay: 0.04,
    },
};
