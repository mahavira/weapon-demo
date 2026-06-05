import { _decorator, Component, Node, instantiate, Vec3 } from 'cc';
import { WeaponConfigData, WeaponConfigTable, WeaponAttackType } from '../config/WeaponConfigTable';
import { PrefabRegistry } from '../registry/PrefabRegistry';
import { NearestTargetProvider } from '../targeting/NearestTargetProvider';
import { AttackBase } from '../attacks/base/AttackBase';
import { AttackContext } from '../attacks/base/AttackContext';
import { isAreaImpactRadiusReceiver, isProjectileDestinationReceiver } from '../attacks/base/ProjectileAttackContract';
import { BoomerangProjectile } from '../attacks/projectile/BoomerangProjectile';
import { DamageInfo } from '../combat/DamageInfo';
import { DamageSourceType } from '../core/types/DamageTypes';

const { ccclass, property } = _decorator;

type ProjectileShotPlan = {
    delay: number;
    startOffsetX: number;
    aimWorldPos: Vec3;
};

/**
 * One unified weapon entry point.
 *
 * Button/UI should call WeaponSystem.fireCurrentWeapon() instead of binding to a specific weapon script.
 * Adding a weapon that reuses an existing attack type should only require:
 * 1. new config in WeaponConfigTable
 * 2. prefab registration in PrefabRegistry
 */
@ccclass('WeaponSystem')
export class WeaponSystem extends Component {
    @property
    currentWeaponId: string = 'banana_boomerang';

    @property(Node)
    owner: Node | null = null;

    @property(Node)
    weaponPoint: Node | null = null;

    @property(Node)
    projectileRoot: Node | null = null;

    @property(PrefabRegistry)
    prefabRegistry: PrefabRegistry | null = null;

    @property(NearestTargetProvider)
    targetProvider: NearestTargetProvider | null = null;

    private nextFireTimeByWeaponId: Record<string, number> = {};

    private static readonly DEFAULT_PROJECTILE_VOLLEY_COUNT = 3;
    private static readonly DEFAULT_PROJECTILE_SPACING_X = 32;
    private static readonly DEFAULT_PROJECTILE_TARGET_SPREAD_X = 32;
    private static readonly DEFAULT_PROJECTILE_TRAVEL_DISTANCE = 1280;

    private static readonly DEFAULT_PROJECTILE_SHOT_DELAY = 0;

    public setCurrentWeapon(weaponId: string): void {
        if (!WeaponConfigTable[weaponId]) {
            console.error(`[WeaponSystem] Unknown weapon id: ${weaponId}`);
            return;
        }

        this.currentWeaponId = weaponId;
        console.log(`[WeaponSystem] Current weapon set to: ${weaponId}`);
    }

    public fireCurrentWeapon(): void {
        this.fireWeapon(this.currentWeaponId);
    }

    public fireWeapon(weaponId: string): void {
        const config = WeaponConfigTable[weaponId];

        if (!config) {
            console.error(`[WeaponSystem] Missing weapon config: ${weaponId}`);
            return;
        }

        if (!this.canFire(config)) return;

        if (this.fireByConfig(config)) {
            this.markCooldown(config);
        }
    }

    private fireByConfig(config: WeaponConfigData): boolean {
        if (!this.validateCommonRefs()) return false;

        switch (config.attackType) {
            case WeaponAttackType.Boomerang:
                return this.fireBoomerang(config);

            case WeaponAttackType.Projectile:
                return this.fireProjectileAttack(config);

            default:
                console.error(`[WeaponSystem] Unsupported attackType: ${config.attackType}`);
                return false;
        }
    }

    private validateCommonRefs(): boolean {
        if (!this.weaponPoint) {
            console.error('[WeaponSystem] Missing weaponPoint');
            return false;
        }

        if (!this.projectileRoot) {
            console.error('[WeaponSystem] Missing projectileRoot');
            return false;
        }

        if (!this.prefabRegistry) {
            console.error('[WeaponSystem] Missing prefabRegistry');
            return false;
        }

        if (!this.targetProvider) {
            console.error('[WeaponSystem] Missing targetProvider');
            return false;
        }

        return true;
    }

    private fireBoomerang(config: WeaponConfigData): boolean {
        if (!this.weaponPoint || !this.projectileRoot || !this.prefabRegistry || !this.targetProvider) return false;

        const spawnedAttack = this.createAttackInstance(config);
        if (!spawnedAttack) {
            return false;
        }

        const { node, attack } = spawnedAttack;

        const boomerangAttack = node.getComponent(BoomerangProjectile);
        if (boomerangAttack && config.boomerang?.returnDamageScale !== undefined) {
            boomerangAttack.returnDamageScale = config.boomerang.returnDamageScale;
        }

        const context = this.buildAttackContext(
            config,
            this.weaponPoint.worldPosition.clone(),
            this.getBoomerangForwardDestinationWorldPos(config),
            null
        );

        attack.startAttack(context);
        return true;
    }

    private fireProjectileAttack(config: WeaponConfigData): boolean {
        if (!this.weaponPoint || !this.targetProvider) return false;

        const primaryTarget = this.targetProvider.getPrimaryTarget();
        if (!primaryTarget) {
            console.warn('[WeaponSystem] Projectile attack has no target');
            return false;
        }

        for (const shot of this.buildProjectileShotPlans(config, primaryTarget.worldPosition.clone())) {
            this.scheduleOnce(() => {
                if (!this.weaponPoint || !this.weaponPoint.isValid) return;

                const spawnWorldPos = this.weaponPoint.worldPosition.clone();
                spawnWorldPos.x += shot.startOffsetX;
                const destinationWorldPos = this.resolveProjectileDestinationWorldPos(config, spawnWorldPos, shot.aimWorldPos);

                this.spawnProjectileShot(config, spawnWorldPos, destinationWorldPos, primaryTarget);
            }, shot.delay);
        }

        return true;
    }

    private buildProjectileShotPlans(config: WeaponConfigData, targetWorldPos: Vec3): ProjectileShotPlan[] {
        const projectileCount = Math.max(1, Math.floor(config.volley?.count ?? WeaponSystem.DEFAULT_PROJECTILE_VOLLEY_COUNT));
        const projectileSpacingX = config.volley?.spacingX ?? WeaponSystem.DEFAULT_PROJECTILE_SPACING_X;
        const projectileTargetSpreadX = config.volley?.targetSpreadX ?? WeaponSystem.DEFAULT_PROJECTILE_TARGET_SPREAD_X;
        const projectileShotDelay = config.volley?.shotDelay ?? WeaponSystem.DEFAULT_PROJECTILE_SHOT_DELAY;
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

    private resolveProjectileDestinationWorldPos(config: WeaponConfigData, spawnWorldPos: Vec3, aimWorldPos: Vec3): Vec3 {
        if (config.flight?.endAtTarget) {
            return aimWorldPos.clone();
        }

        return this.buildExtendedProjectileDestinationWorldPos(
            spawnWorldPos,
            aimWorldPos,
            config.flight?.travelDistance ?? WeaponSystem.DEFAULT_PROJECTILE_TRAVEL_DISTANCE
        );
    }

    private spawnProjectileShot(
        config: WeaponConfigData,
        spawnWorldPos: Vec3,
        destinationWorldPos: Vec3,
        target: Node | null
    ): void {
        const spawnedAttack = this.createConfiguredProjectileAttack(
            config,
            destinationWorldPos,
            config.impact?.aoeRadius ?? 0
        );
        if (!spawnedAttack) {
            return;
        }

        const { attack } = spawnedAttack;
        const context = this.buildAttackContext(config, spawnWorldPos, destinationWorldPos, target);

        attack.startAttack(context);
    }

    private createConfiguredProjectileAttack(
        config: WeaponConfigData,
        destinationWorldPos: Vec3,
        areaImpactRadius: number
    ): { node: Node; attack: AttackBase } | null {
        const spawnedAttack = this.createAttackInstance(config);
        if (!spawnedAttack) {
            return null;
        }

        const { node, attack } = spawnedAttack;
        if (!isProjectileDestinationReceiver(attack)) {
            console.error(`[WeaponSystem] Prefab ${config.projectilePrefabKey} attack does not support setDestinationWorldPos`);
            node.destroy();
            return null;
        }

        attack.setDestinationWorldPos(destinationWorldPos);

        if (isAreaImpactRadiusReceiver(attack)) {
            attack.setAreaImpactRadius(areaImpactRadius);
        }

        return spawnedAttack;
    }

    private createAttackInstance(config: WeaponConfigData): { node: Node; attack: AttackBase } | null {
        if (!this.projectileRoot || !this.prefabRegistry) {
            return null;
        }

        const prefab = this.prefabRegistry.getPrefabByKey(config.projectilePrefabKey);
        if (!prefab) {
            return null;
        }

        const node = instantiate(prefab);
        this.projectileRoot.addChild(node);
        this.applyProjectileVisualOverrides(node, config);

        const attack = this.getAttackComponent(node, config.projectilePrefabKey);
        if (!attack) {
            node.destroy();
            return null;
        }

        return { node, attack };
    }

    private buildAttackContext(
        config: WeaponConfigData,
        spawnWorldPos: Vec3,
        destinationWorldPos: Vec3 | null,
        target: Node | null
    ): AttackContext {
        return new AttackContext({
            attackerNode: this.owner ?? this.node,
            targetNode: target?.isValid ? target : null,
            spawnWorldPos,
            destinationWorldPos,
            sourceWeaponId: config.id,
            attackDamage: this.buildProjectileDamageInfo(config),
        });
    }

    private buildProjectileDamageInfo(config: WeaponConfigData): DamageInfo {
        return new DamageInfo({
            amount: config.damage,
            sourceType: DamageSourceType.Projectile,
            sourceWeaponId: config.id,
        });
    }

    private getBoomerangForwardDestinationWorldPos(config: WeaponConfigData): Vec3 {
        const destinationWorldPos = this.weaponPoint?.worldPosition.clone() ?? new Vec3();
        destinationWorldPos.y += config.boomerang?.forwardDistance ?? 360;
        return destinationWorldPos;
    }

    private buildExtendedProjectileDestinationWorldPos(spawnWorldPos: Vec3, aimWorldPos: Vec3, travelDistance: number): Vec3 {
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

    private canFire(config: WeaponConfigData): boolean {
        const cooldown = config.cooldown ?? 0;
        if (cooldown <= 0) return true;

        const now = Date.now() / 1000;
        const nextFireTime = this.nextFireTimeByWeaponId[config.id] ?? 0;

        if (now < nextFireTime) {
            return false;
        }

        return true;
    }

    private markCooldown(config: WeaponConfigData): void {
        const cooldown = config.cooldown ?? 0;
        if (cooldown <= 0) return;

        this.nextFireTimeByWeaponId[config.id] = Date.now() / 1000 + cooldown;
    }

    private getAttackComponent(node: Node, prefabKey: string): AttackBase | null {
        const attack = node.getComponents(Component).find((component) => this.isAttackBase(component));
        if (!attack) {
            console.error(`[WeaponSystem] Prefab ${prefabKey} missing AttackBase component`);
            return null;
        }

        return attack;
    }

    private isAttackBase(component: Component): component is AttackBase {
        const candidate = component as {
            startAttack?: unknown;
            stopAttack?: unknown;
        };

        return typeof candidate.startAttack === 'function'
            && typeof candidate.stopAttack === 'function';
    }

    private applyProjectileVisualOverrides(node: Node, config: WeaponConfigData): void {
        if (config.flight?.visualScale !== undefined) {
            node.setScale(config.flight.visualScale, config.flight.visualScale, 1);
        }
    }
}
