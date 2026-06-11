import { _decorator, Component, Node, instantiate, Vec3 } from 'cc';
import { WeaponConfigData, WeaponConfigTable, WeaponAttackType } from '../config/WeaponConfigTable';
import { PrefabRegistry } from '../registry/PrefabRegistry';
import { NearestTargetProvider } from '../targeting/NearestTargetProvider';
import { AttackBase } from '../attacks/base/AttackBase';
import { AttackContext } from '../attacks/base/AttackContext';
import { isAreaImpactRadiusReceiver, isProjectileDestinationReceiver } from '../attacks/base/ProjectileAttackContract';
import { DamageInfo } from '../combat/DamageInfo';
import { DamageSourceType } from '../core/types/DamageTypes';
import { resolveWeaponAttackBinding } from './WeaponAttackBinding';
import {
    createWeaponAttackExecutorDeps,
} from './WeaponAttackExecutor';
import { assembleWeaponAttack, getAssembledWeaponAttack } from './WeaponAttackAssembler';
import { getWeaponAttackExecutor } from './WeaponAttackExecutorRegistry';
import { fireWeaponWithCooldown } from './WeaponFireCoordinator';

const { ccclass, property } = _decorator;

/**
 * One unified weapon entry point.
 *
 * Button/UI should call WeaponSystem.fireCurrentWeapon() instead of binding to a specific weapon script.
 * Adding a weapon that reuses an existing attack type should only require:
 * 1. new config in WeaponConfigTable
 * 2. prefab asset under resources/prefabs/weapons
 */
@ccclass('WeaponSystem')
export class WeaponSystem extends Component {
    @property
    currentWeaponId: string = 'arc_boomerang';

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

    @property
    attackPoolLimitPerPrefabKey: number = 24;

    private nextFireTimeByWeaponId: Record<string, number> = {};
    private readonly inactiveAttackNodesByPrefabKey = new Map<string, Node[]>();
    private readonly prefabKeyByAttackNode = new Map<Node, string>();

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

        fireWeaponWithCooldown({
            config,
            nextFireTimeByWeaponId: this.nextFireTimeByWeaponId,
            nowSeconds: Date.now() / 1000,
            fireByConfig: (currentConfig) => this.fireByConfig(currentConfig),
        });
    }

    protected onDestroy(): void {
        this.destroyAllPooledAttackNodes();
    }

    private fireByConfig(config: WeaponConfigData): boolean {
        if (!this.validateCommonRefs()) return false;
        const executorDeps = this.createAttackExecutorDeps();
        const attackExecutor = getWeaponAttackExecutor(config.attackType);
        if (!attackExecutor) {
            console.error(`[WeaponSystem] Unsupported attackType: ${config.attackType}`);
            return false;
        }

        return attackExecutor(config, executorDeps);
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

        if (!this.prefabRegistry.isReady()) {
            console.warn('[WeaponSystem] PrefabRegistry not ready');
            return false;
        }

        if (!this.targetProvider) {
            console.error('[WeaponSystem] Missing targetProvider');
            return false;
        }

        return true;
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
            console.error(`[WeaponSystem] Prefab ${config.weaponPrefabKey} attack does not support setDestinationWorldPos`);
            this.destroyAttackNode(node);
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

        const prefab = this.prefabRegistry.getPrefabByKey(config.weaponPrefabKey);
        if (!prefab) {
            return null;
        }

        const node = this.acquireAttackNode(config);
        this.projectileRoot.addChild(node);
        this.applyProjectileVisualOverrides(node, config);
        const attackBinding = resolveWeaponAttackBinding(config.weaponPrefabKey, config.attackType);
        assembleWeaponAttack(node, attackBinding, config);

        const attack = getAssembledWeaponAttack(node, attackBinding);
        if (!attack) {
            console.error(`[WeaponSystem] Prefab ${config.weaponPrefabKey} missing AttackBase component`);
            this.destroyAttackNode(node);
            return null;
        }

        attack.setAttackNodeReleaseHandler((attackNode) => this.releaseAttackNode(attackNode));
        return { node, attack };
    }

    private acquireAttackNode(config: WeaponConfigData): Node {
        const pooledNode = this.popPooledAttackNode(config.weaponPrefabKey);
        if (pooledNode) {
            pooledNode.active = true;
            return pooledNode;
        }

        const prefab = this.prefabRegistry?.getPrefabByKey(config.weaponPrefabKey);
        if (!prefab) {
            throw new Error(`[WeaponSystem] Missing prefab for key: ${config.weaponPrefabKey}`);
        }

        const node = instantiate(prefab);
        this.prefabKeyByAttackNode.set(node, config.weaponPrefabKey);
        return node;
    }

    private popPooledAttackNode(prefabKey: string): Node | null {
        const pool = this.inactiveAttackNodesByPrefabKey.get(prefabKey);
        if (!pool) {
            return null;
        }

        while (pool.length > 0) {
            const pooledNode = pool.pop();
            if (pooledNode?.isValid) {
                return pooledNode;
            }
        }

        return null;
    }

    private releaseAttackNode(node: Node): void {
        if (!node || !node.isValid) {
            return;
        }

        const prefabKey = this.prefabKeyByAttackNode.get(node);
        if (!prefabKey) {
            node.destroy();
            return;
        }

        const poolLimit = Math.max(0, Math.floor(this.attackPoolLimitPerPrefabKey));
        const pool = this.getAttackNodePool(prefabKey);
        if (pool.length >= poolLimit) {
            this.destroyAttackNode(node);
            return;
        }

        node.active = false;
        node.angle = 0;
        node.setScale(1, 1, 1);
        node.removeFromParent();
        pool.push(node);
    }

    private destroyAttackNode(node: Node): void {
        if (!node || !node.isValid) {
            return;
        }

        this.prefabKeyByAttackNode.delete(node);
        node.destroy();
    }

    private getAttackNodePool(prefabKey: string): Node[] {
        const pool = this.inactiveAttackNodesByPrefabKey.get(prefabKey);
        if (pool) {
            return pool;
        }

        const nextPool: Node[] = [];
        this.inactiveAttackNodesByPrefabKey.set(prefabKey, nextPool);
        return nextPool;
    }

    private destroyAllPooledAttackNodes(): void {
        for (const pool of this.inactiveAttackNodesByPrefabKey.values()) {
            for (const node of pool) {
                if (node.isValid) {
                    this.destroyAttackNode(node);
                }
            }
        }

        this.inactiveAttackNodesByPrefabKey.clear();
        this.prefabKeyByAttackNode.clear();
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
            attackDamage: this.buildAttackDamageInfo(config),
        });
    }

    private buildAttackDamageInfo(config: WeaponConfigData): DamageInfo {
        return new DamageInfo({
            amount: config.damage,
            sourceType: this.resolveDamageSourceType(config.attackType),
            sourceWeaponId: config.id,
        });
    }

    private resolveDamageSourceType(attackType: WeaponAttackType): DamageSourceType {
        switch (attackType) {
            case WeaponAttackType.Beam:
                return DamageSourceType.Beam;

            case WeaponAttackType.Chain:
                return DamageSourceType.Weapon;

            case WeaponAttackType.Boomerang:
            case WeaponAttackType.Projectile:
            default:
                return DamageSourceType.Projectile;
        }
    }

    private getBoomerangForwardDestinationWorldPos(config: WeaponConfigData): Vec3 {
        const destinationWorldPos = this.weaponPoint?.worldPosition.clone() ?? new Vec3();
        destinationWorldPos.y += config.boomerang?.forwardDistance ?? 360;
        return destinationWorldPos;
    }

    private createAttackExecutorDeps() {
        if (!this.weaponPoint || !this.targetProvider) {
            throw new Error('WeaponSystem attack executor requires validated refs');
        }

        return createWeaponAttackExecutorDeps({
            weaponPointNode: this.weaponPoint,
            targetProvider: this.targetProvider,
            createAttackInstance: (config) => this.createAttackInstance(config),
            buildAttackContext: (config, spawnWorldPos, destinationWorldPos, target) => (
                this.buildAttackContext(config, spawnWorldPos, destinationWorldPos, target)
            ),
            spawnProjectileShot: (config, spawnWorldPos, destinationWorldPos, target) => (
                this.spawnProjectileShot(config, spawnWorldPos, destinationWorldPos, target)
            ),
            scheduleShot: (callback, delaySeconds) => this.scheduleOnce(callback, delaySeconds),
            getBoomerangForwardDestinationWorldPos: (config) => this.getBoomerangForwardDestinationWorldPos(config),
            projectileShotDefaults: {
                projectileVolleyCount: WeaponSystem.DEFAULT_PROJECTILE_VOLLEY_COUNT,
                projectileSpacingX: WeaponSystem.DEFAULT_PROJECTILE_SPACING_X,
                projectileTargetSpreadX: WeaponSystem.DEFAULT_PROJECTILE_TARGET_SPREAD_X,
                projectileShotDelay: WeaponSystem.DEFAULT_PROJECTILE_SHOT_DELAY,
                projectileTravelDistance: WeaponSystem.DEFAULT_PROJECTILE_TRAVEL_DISTANCE,
            },
        });
    }

    private applyProjectileVisualOverrides(node: Node, config: WeaponConfigData): void {
        node.setScale(1, 1, 1);

        if (config.flight?.visualScale !== undefined) {
            node.setScale(config.flight.visualScale, config.flight.visualScale, 1);
        }
    }
}
