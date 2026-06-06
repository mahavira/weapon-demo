export enum WeaponAttackType {
    Boomerang = 'boomerang',
    Projectile = 'projectile',
    Beam = 'beam',
    Chain = 'chain',
    Ricochet = 'ricochet',
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
    beamWidthMultiplier?: number;
    beamRange?: number;
}

export interface WeaponChainConfig {
    maxTargets?: number;
    chainRange?: number;
    segmentDurationSeconds?: number;
    initialHitRadius?: number;
    bounceDamageScale?: number;
    hitDelaySeconds?: number;
    lateralAmplitudeScale?: number;
    keepPreviousSegmentsVisible?: boolean;
}

export interface WeaponRicochetConfig {
    maxHits?: number;
    ricochetRange?: number;
    allowBounceBackToPreviousTarget?: boolean;
}

export interface WeaponConfigData {
    id: string;
    name: string;
    attackType: WeaponAttackType;
    weaponPrefabKey: string;
    damage: number;
    cooldown?: number;

    boomerang?: WeaponBoomerangConfig;
    volley?: WeaponProjectileVolleyConfig;
    flight?: WeaponProjectileFlightConfig;
    impact?: WeaponProjectileImpactConfig;
    beam?: WeaponBeamConfig;
    chain?: WeaponChainConfig;
    ricochet?: WeaponRicochetConfig;
}

/**
 * Early-stage TypeScript config table.
 * Later you can replace this with JSON/Excel import without changing WeaponSystem's public API.
 */
export const WeaponConfigTable: Record<string, WeaponConfigData> = {
    arc_boomerang: {
        id: 'arc_boomerang',
        name: '弧回旋镖',
        attackType: WeaponAttackType.Boomerang,
        weaponPrefabKey: 'arc_boomerang',
        damage: 10,
        cooldown: 0.2,
        boomerang: {
            returnDamageScale: 1,
            forwardDistance: 360,
        },
    },

    spread_bullet: {
        id: 'spread_bullet',
        name: '散射弹',
        attackType: WeaponAttackType.Projectile,
        weaponPrefabKey: 'spread_bullet',
        damage: 2,
        cooldown: 0.2,
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

    blast_bomb: {
        id: 'blast_bomb',
        name: '爆裂炸弹',
        attackType: WeaponAttackType.Projectile,
        weaponPrefabKey: 'blast_bomb',
        damage: 16,
        cooldown: 0.2,
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

    rapid_bullet: {
        id: 'rapid_bullet',
        name: '速射弹',
        attackType: WeaponAttackType.Projectile,
        weaponPrefabKey: 'rapid_bullet',
        damage: 3,
        cooldown: 0.2,
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

    piercing_beam: {
        id: 'piercing_beam',
        name: '穿透光束',
        attackType: WeaponAttackType.Beam,
        weaponPrefabKey: 'piercing_beam',
        damage: 48,
        cooldown: 2,
        beam: {
            durationSeconds: 2,
            tickIntervalSeconds: 0.25,
            beamWidth: 18,
            beamWidthMultiplier: 1,
            beamRange: 1020,
        },
    },

    chain_lightning: {
        id: 'chain_lightning',
        name: '连锁闪电',
        attackType: WeaponAttackType.Chain,
        weaponPrefabKey: 'chain_lightning',
        damage: 8,
        cooldown: 1,
        chain: {
            maxTargets: 5,
            chainRange: 340,
            segmentDurationSeconds: 0.38,
            initialHitRadius: 48,
            bounceDamageScale: 1,
            hitDelaySeconds: 0.02,
            lateralAmplitudeScale: 0.5,
            keepPreviousSegmentsVisible: true,
        },
    },

    ricochet_bullet: {
        id: 'ricochet_bullet',
        name: '弹射弹',
        attackType: WeaponAttackType.Ricochet,
        weaponPrefabKey: 'ricochet_bullet',
        damage: 7,
        cooldown: 0.8,
        ricochet: {
            maxHits: 4,
            ricochetRange: 280,
            allowBounceBackToPreviousTarget: true,
        },
    },
};
