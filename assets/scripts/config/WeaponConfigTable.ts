export enum WeaponAttackType {
    Boomerang = 'boomerang',
    Projectile = 'projectile',
    Beam = 'beam',
}

export interface WeaponBoomerangConfig {
    returnDamageScale?: number;
    forwardDistance?: number;
}

export interface WeaponProjectileVolleyConfig {
    count?: number;
    spacingX?: number;
    targetSpreadX?: number;
    shotDelay?: number;
}

export interface WeaponProjectileFlightConfig {
    travelDistance?: number;
    endAtTarget?: boolean;
    visualScale?: number;
}

export interface WeaponProjectileImpactConfig {
    aoeRadius?: number;
}

export interface WeaponBeamConfig {
    durationSeconds?: number;
    tickIntervalSeconds?: number;
    beamWidth?: number;
    beamRange?: number;
    followTarget?: boolean;
}

export interface WeaponConfigData {
    id: string;
    name: string;
    attackType: WeaponAttackType;
    projectilePrefabKey: string;
    damage: number;
    cooldown?: number;

    boomerang?: WeaponBoomerangConfig;
    volley?: WeaponProjectileVolleyConfig;
    flight?: WeaponProjectileFlightConfig;
    impact?: WeaponProjectileImpactConfig;
    beam?: WeaponBeamConfig;
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
        boomerang: {
            returnDamageScale: 1,
            forwardDistance: 360,
        },
    },

    strawberry_gun: {
        id: 'strawberry_gun',
        name: '草莓枪',
        attackType: WeaponAttackType.Projectile,
        projectilePrefabKey: 'strawberry_bullet_projectile',
        damage: 2,
        cooldown: 0.35,
        volley: {
            count: 3,
            spacingX: 0,
            targetSpreadX: 132,
            shotDelay: 0.00,
        },
        flight: {
            travelDistance: 1280,
        },
    },

    chili_bomb: {
        id: 'chili_bomb',
        name: '辣椒炸弹',
        attackType: WeaponAttackType.Projectile,
        projectilePrefabKey: 'chili_bomb_projectile',
        damage: 16,
        cooldown: 0.9,
        volley: {
            count: 1,
            spacingX: 0,
            targetSpreadX: 0,
            shotDelay: 0.00,
        },
        flight: {
            travelDistance: 960,
            endAtTarget: true,
            visualScale: 1,
        },
        impact: {
            aoeRadius: 80,
        },
    },

    sugarcane_machine_gun: {
        id: 'sugarcane_machine_gun',
        name: '甘蔗机枪',
        attackType: WeaponAttackType.Projectile,
        projectilePrefabKey: 'sugarcane_bullet_projectile',
        damage: 3,
        cooldown: 1,
        volley: {
            count: 3,
            spacingX: 0,
            targetSpreadX: 0,
            shotDelay: 0.08,
        },
        flight: {
            travelDistance: 1280,
        },
    },

    sunflower_spotlight_mirror: {
        id: 'sunflower_spotlight_mirror',
        name: '向日葵聚光镜',
        attackType: WeaponAttackType.Beam,
        projectilePrefabKey: 'sunflower_spotlight_mirror_beam',
        damage: 48,
        cooldown: 4,
        beam: {
            durationSeconds: 3,
            tickIntervalSeconds: 0.25,
            beamWidth: 18,
            beamRange: 1020,
            followTarget: true,
        },
    },
};
