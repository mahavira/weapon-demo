import { Node, Vec3 } from 'cc';
import { WeaponConfigData } from '../config/WeaponConfigTable';
import { AttackBase } from '../attacks/base/AttackBase';
import { AttackContext } from '../attacks/base/AttackContext';
import {
    buildProjectileShotPlans,
    ProjectileShotPlan,
    resolveProjectileDestinationWorldPos,
} from '../attacks/projectile/ProjectileShotPlanner';

export type WeaponAttackExecutorDeps = {
    weaponPointNode: Node;
    targetProvider: {
        getPrimaryTarget(): Node | null;
    };
    createAttackInstance(config: WeaponConfigData): { node: Node; attack: AttackBase } | null;
    buildAttackContext(
        config: WeaponConfigData,
        spawnWorldPos: Vec3,
        destinationWorldPos: Vec3 | null,
        target: Node | null
    ): AttackContext;
    spawnProjectileShot(
        config: WeaponConfigData,
        spawnWorldPos: Vec3,
        destinationWorldPos: Vec3,
        target: Node | null
    ): void;
    scheduleShot(callback: () => void, delaySeconds: number): void;
    getBoomerangForwardDestinationWorldPos(config: WeaponConfigData): Vec3;
    buildProjectileShotPlans(config: WeaponConfigData, targetWorldPos: Vec3): ProjectileShotPlan[];
    resolveProjectileDestinationWorldPos(config: WeaponConfigData, spawnWorldPos: Vec3, aimWorldPos: Vec3): Vec3;
};

export function createWeaponAttackExecutorDeps(base: {
    weaponPointNode: Node;
    targetProvider: {
        getPrimaryTarget(): Node | null;
    };
    createAttackInstance(config: WeaponConfigData): { node: Node; attack: AttackBase } | null;
    buildAttackContext(
        config: WeaponConfigData,
        spawnWorldPos: Vec3,
        destinationWorldPos: Vec3 | null,
        target: Node | null
    ): AttackContext;
    spawnProjectileShot(
        config: WeaponConfigData,
        spawnWorldPos: Vec3,
        destinationWorldPos: Vec3,
        target: Node | null
    ): void;
    scheduleShot(callback: () => void, delaySeconds: number): void;
    getBoomerangForwardDestinationWorldPos(config: WeaponConfigData): Vec3;
    projectileShotDefaults: {
        projectileVolleyCount: number;
        projectileSpacingX: number;
        projectileTargetSpreadX: number;
        projectileShotDelay: number;
        projectileTravelDistance: number;
    };
}): WeaponAttackExecutorDeps {
    return {
        weaponPointNode: base.weaponPointNode,
        targetProvider: base.targetProvider,
        createAttackInstance: base.createAttackInstance,
        buildAttackContext: base.buildAttackContext,
        spawnProjectileShot: base.spawnProjectileShot,
        scheduleShot: base.scheduleShot,
        getBoomerangForwardDestinationWorldPos: base.getBoomerangForwardDestinationWorldPos,
        buildProjectileShotPlans(config, targetWorldPos) {
            return buildProjectileShotPlans(config, targetWorldPos, {
                projectileVolleyCount: base.projectileShotDefaults.projectileVolleyCount,
                projectileSpacingX: base.projectileShotDefaults.projectileSpacingX,
                projectileTargetSpreadX: base.projectileShotDefaults.projectileTargetSpreadX,
                projectileShotDelay: base.projectileShotDefaults.projectileShotDelay,
            });
        },
        resolveProjectileDestinationWorldPos(config, spawnWorldPos, aimWorldPos) {
            return resolveProjectileDestinationWorldPos(
                config,
                spawnWorldPos,
                aimWorldPos,
                base.projectileShotDefaults.projectileTravelDistance
            );
        },
    };
}

export function fireBoomerangAttack(config: WeaponConfigData, deps: WeaponAttackExecutorDeps): boolean {
    const spawnedAttack = deps.createAttackInstance(config);
    if (!spawnedAttack) {
        return false;
    }

    const context = deps.buildAttackContext(
        config,
        deps.weaponPointNode.worldPosition.clone(),
        deps.getBoomerangForwardDestinationWorldPos(config),
        null
    );

    spawnedAttack.attack.startAttack(context);
    return true;
}

export function fireProjectileAttack(config: WeaponConfigData, deps: WeaponAttackExecutorDeps): boolean {
    const primaryTarget = deps.targetProvider.getPrimaryTarget();
    if (!primaryTarget) {
        console.warn('[WeaponSystem] Projectile attack has no target');
        return false;
    }

    for (const shot of deps.buildProjectileShotPlans(config, primaryTarget.worldPosition.clone())) {
        deps.scheduleShot(() => {
            if (!deps.weaponPointNode.isValid) return;

            const spawnWorldPos = deps.weaponPointNode.worldPosition.clone();
            spawnWorldPos.x += shot.startOffsetX;
            const destinationWorldPos = deps.resolveProjectileDestinationWorldPos(config, spawnWorldPos, shot.aimWorldPos);

            deps.spawnProjectileShot(config, spawnWorldPos, destinationWorldPos, primaryTarget);
        }, shot.delay);
    }

    return true;
}

export function fireBeamAttack(config: WeaponConfigData, deps: WeaponAttackExecutorDeps): boolean {
    const primaryTarget = deps.targetProvider.getPrimaryTarget();
    if (!primaryTarget) {
        console.warn('[WeaponSystem] Beam attack has no target');
        return false;
    }

    const spawnedAttack = deps.createAttackInstance(config);
    if (!spawnedAttack) {
        return false;
    }

    spawnedAttack.attack.startAttack(
        deps.buildAttackContext(
            config,
            deps.weaponPointNode.worldPosition.clone(),
            primaryTarget.worldPosition.clone(),
            primaryTarget
        )
    );
    return true;
}

export function fireChainAttack(config: WeaponConfigData, deps: WeaponAttackExecutorDeps): boolean {
    const primaryTarget = deps.targetProvider.getPrimaryTarget();
    if (!primaryTarget) {
        console.warn('[WeaponSystem] Chain attack has no target');
        return false;
    }

    const spawnedAttack = deps.createAttackInstance(config);
    if (!spawnedAttack) {
        return false;
    }

    spawnedAttack.attack.startAttack(
        deps.buildAttackContext(
            config,
            deps.weaponPointNode.worldPosition.clone(),
            primaryTarget.worldPosition.clone(),
            primaryTarget
        )
    );
    return true;
}

export function fireRicochetAttack(config: WeaponConfigData, deps: WeaponAttackExecutorDeps): boolean {
    const primaryTarget = deps.targetProvider.getPrimaryTarget();
    if (!primaryTarget) {
        console.warn('[WeaponSystem] Ricochet attack has no target');
        return false;
    }

    const spawnedAttack = deps.createAttackInstance(config);
    if (!spawnedAttack) {
        return false;
    }

    spawnedAttack.attack.startAttack(
        deps.buildAttackContext(
            config,
            deps.weaponPointNode.worldPosition.clone(),
            primaryTarget.worldPosition.clone(),
            primaryTarget
        )
    );
    return true;
}
