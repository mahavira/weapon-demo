import { Vec3 } from 'cc';
import type { WeaponConfigData } from '../../config/WeaponConfigTable';

export type ProjectileShotPlan = {
    delay: number;
    startOffsetX: number;
    aimWorldPos: Vec3;
};

export function buildProjectileShotPlans(
    config: WeaponConfigData,
    targetWorldPos: Vec3,
    defaults: {
        projectileVolleyCount: number;
        projectileSpacingX: number;
        projectileTargetSpreadX: number;
        projectileShotDelay: number;
    }
): ProjectileShotPlan[] {
    const projectileCount = Math.max(1, Math.floor(config.volley?.count ?? defaults.projectileVolleyCount));
    const projectileSpacingX = config.volley?.spacingX ?? defaults.projectileSpacingX;
    const projectileTargetSpreadX = config.volley?.targetSpreadX ?? defaults.projectileTargetSpreadX;
    const projectileShotDelay = config.volley?.shotDelay ?? defaults.projectileShotDelay;
    const centerIndex = (projectileCount - 1) / 2;

    return Array.from({ length: projectileCount }, (_unused, index) => {
        const offsetIndex = index - centerIndex;
        const aimWorldPos = targetWorldPos.clone();
        aimWorldPos.x += offsetIndex * projectileTargetSpreadX;

        return {
            delay: projectileShotDelay * index,
            startOffsetX: offsetIndex * projectileSpacingX,
            aimWorldPos,
        };
    });
}

export function resolveProjectileDestinationWorldPos(
    config: WeaponConfigData,
    spawnWorldPos: Vec3,
    aimWorldPos: Vec3,
    defaultTravelDistance: number
): Vec3 {
    if (config.flight?.endAtTarget) {
        return aimWorldPos.clone();
    }

    return buildExtendedProjectileDestinationWorldPos(
        spawnWorldPos,
        aimWorldPos,
        config.flight?.travelDistance ?? defaultTravelDistance
    );
}

function buildExtendedProjectileDestinationWorldPos(spawnWorldPos: Vec3, aimWorldPos: Vec3, travelDistance: number): Vec3 {
    const dx = aimWorldPos.x - spawnWorldPos.x;
    const dy = aimWorldPos.y - spawnWorldPos.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length <= 0) {
        return new Vec3(spawnWorldPos.x, spawnWorldPos.y + travelDistance, spawnWorldPos.z);
    }

    return new Vec3(
        spawnWorldPos.x + dx / length * travelDistance,
        spawnWorldPos.y + dy / length * travelDistance,
        spawnWorldPos.z
    );
}
