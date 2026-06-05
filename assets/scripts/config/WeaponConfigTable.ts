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
    boomerangForwardDistance?: number;

    /** Multi-bullet only. */
    bulletCount?: number;
    bulletSpacingX?: number;
    bulletTargetSpreadX?: number;
    bulletTravelDistance?: number;
    shotDelay?: number;
    projectileEndAtTarget?: boolean;

    /** Optional on-hit area damage for linear projectiles. */
    impactAoeRadius?: number;
    projectileScale?: number;
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
        boomerangForwardDistance: 360,
    },

    strawberry_gun: {
        id: 'strawberry_gun',
        name: '草莓枪',
        attackType: WeaponAttackType.MultiBullet,
        projectilePrefabKey: 'strawberry_bullet_projectile',
        damage: 2,
        cooldown: 0.35,
        bulletCount: 3,
        bulletSpacingX: 0,
        bulletTargetSpreadX: 132,
        bulletTravelDistance: 1280,
        shotDelay: 0.00,
    },

    chili_bomb: {
        id: 'chili_bomb',
        name: '辣椒炸弹',
        attackType: WeaponAttackType.MultiBullet,
        projectilePrefabKey: 'chili_bomb_projectile',
        damage: 16,
        cooldown: 0.9,
        bulletCount: 1,
        bulletSpacingX: 0,
        bulletTargetSpreadX: 0,
        bulletTravelDistance: 960,
        shotDelay: 0.00,
        projectileEndAtTarget: true,
        impactAoeRadius: 80,
        projectileScale: 1,
    },

    sugarcane_machine_gun: {
        id: 'sugarcane_machine_gun',
        name: '甘蔗机枪',
        attackType: WeaponAttackType.MultiBullet,
        projectilePrefabKey: 'sugarcane_bullet_projectile',
        damage: 3,
        cooldown: 1,
        bulletCount: 3,
        bulletSpacingX: 0,
        bulletTargetSpreadX: 0,
        bulletTravelDistance: 1280,
        shotDelay: 0.08,
    },
};
