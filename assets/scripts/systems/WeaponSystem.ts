import { _decorator, Component, Node, instantiate, Vec3 } from 'cc';
import { WeaponConfigData, WeaponConfigTable, WeaponAttackType } from '../config/WeaponConfigTable';
import { PrefabRegistry } from '../registry/PrefabRegistry';
import { NearestTargetProvider } from '../targeting/NearestTargetProvider';
import { AttackBase } from '../attacks/base/AttackBase';
import { AttackContext } from '../attacks/base/AttackContext';
import { BoomerangProjectile } from '../attacks/projectile/BoomerangProjectile';
import { DamageInfo } from '../combat/DamageInfo';
import { DamageSourceType } from '../core/types/DamageTypes';

const { ccclass, property } = _decorator;

type EndpointAttack = AttackBase & {
    setEndWorldPos(endWorldPos: Vec3): void;
};

type AreaImpactAttack = AttackBase & {
    setImpactAoeRadius(radius: number): void;
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

            case WeaponAttackType.MultiBullet:
                return this.fireMultiBullet(config);

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

        const prefab = this.prefabRegistry.getPrefab(config.projectilePrefabKey);
        if (!prefab) return false;

        const node = instantiate(prefab);
        this.projectileRoot.addChild(node);

        const attack = this.getAttackComponent(node, config.projectilePrefabKey);
        if (!attack) {
            node.destroy();
            return false;
        }

        const boomerangAttack = node.getComponent(BoomerangProjectile);
        if (boomerangAttack && config.returnDamageScale !== undefined) {
            boomerangAttack.returnDamageScale = config.returnDamageScale;
        }

        const context = new AttackContext({
            attacker: this.owner ?? this.node,
            target: null,
            startWorldPos: this.weaponPoint.worldPosition.clone(),
            endWorldPos: this.getBoomerangEndWorldPos(config),
            sourceWeaponId: config.id,
            damageInfo: new DamageInfo({
                amount: config.damage,
                sourceType: DamageSourceType.Projectile,
                sourceWeaponId: config.id,
            }),
        });

        attack.startAttack(context);
        return true;
    }

    private fireMultiBullet(config: WeaponConfigData): boolean {
        if (!this.weaponPoint || !this.targetProvider) return false;

        const target = this.targetProvider.getTarget();
        if (!target) {
            console.warn('[WeaponSystem] MultiBullet has no target');
            return false;
        }

        const bulletCount = Math.max(1, Math.floor(config.bulletCount ?? 3));
        const bulletSpacingX = config.bulletSpacingX ?? 32;
        const bulletTargetSpreadX = config.bulletTargetSpreadX ?? 32;
        const bulletTravelDistance = config.bulletTravelDistance ?? 1280;
        const shotDelay = config.shotDelay ?? 0;
        const centerIndex = (bulletCount - 1) / 2;
        const targetWorldPos = target.worldPosition.clone();

        for (let i = 0; i < bulletCount; i++) {
            const offsetIndex = i - centerIndex;
            const delay = shotDelay * i;
            const aimWorldPos = targetWorldPos.clone();
            aimWorldPos.x += offsetIndex * bulletTargetSpreadX;

            this.scheduleOnce(() => {
                if (!this.weaponPoint || !this.weaponPoint.isValid) return;

                const startWorldPos = this.weaponPoint.worldPosition.clone();
                startWorldPos.x += offsetIndex * bulletSpacingX;
                const endWorldPos = config.projectileEndAtTarget
                    ? aimWorldPos.clone()
                    : this.getBulletEndWorldPos(startWorldPos, aimWorldPos, bulletTravelDistance);

                this.spawnBullet(config, startWorldPos, endWorldPos, target);
            }, delay);
        }

        return true;
    }

    private spawnBullet(config: WeaponConfigData, startWorldPos: Vec3, endWorldPos: Vec3, target: Node | null): void {
        if (!this.projectileRoot || !this.prefabRegistry) return;

        const prefab = this.prefabRegistry.getPrefab(config.projectilePrefabKey);
        if (!prefab) return;

        const node = instantiate(prefab);
        this.projectileRoot.addChild(node);
        this.applyProjectileVisualOverrides(node, config);

        const attack = this.getAttackComponent(node, config.projectilePrefabKey);
        if (!attack) {
            node.destroy();
            return;
        }

        if (!this.canSetEndWorldPos(attack)) {
            console.error(`[WeaponSystem] Prefab ${config.projectilePrefabKey} attack does not support setEndWorldPos`);
            node.destroy();
            return;
        }

        attack.setEndWorldPos(endWorldPos);

        if (this.canSetImpactAoeRadius(attack)) {
            attack.setImpactAoeRadius(config.impactAoeRadius ?? 0);
        }

        const context = new AttackContext({
            attacker: this.owner ?? this.node,
            target: target?.isValid ? target : null,
            startWorldPos,
            endWorldPos,
            sourceWeaponId: config.id,
            damageInfo: new DamageInfo({
                amount: config.damage,
                sourceType: DamageSourceType.Projectile,
                sourceWeaponId: config.id,
            }),
        });

        attack.startAttack(context);
    }

    private getBoomerangEndWorldPos(config: WeaponConfigData): Vec3 {
        const startWorldPos = this.weaponPoint?.worldPosition.clone() ?? new Vec3();
        startWorldPos.y += config.boomerangForwardDistance ?? 360;
        return startWorldPos;
    }

    private getBulletEndWorldPos(startWorldPos: Vec3, aimWorldPos: Vec3, travelDistance: number): Vec3 {
        const dx = aimWorldPos.x - startWorldPos.x;
        const dy = aimWorldPos.y - startWorldPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length <= 0) {
            return new Vec3(startWorldPos.x, startWorldPos.y + travelDistance, startWorldPos.z);
        }

        return new Vec3(
            startWorldPos.x + dx / length * travelDistance,
            startWorldPos.y + dy / length * travelDistance,
            startWorldPos.z
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

    private canSetEndWorldPos(attack: AttackBase): attack is EndpointAttack {
        return typeof (attack as { setEndWorldPos?: unknown }).setEndWorldPos === 'function';
    }

    private canSetImpactAoeRadius(attack: AttackBase): attack is AreaImpactAttack {
        return typeof (attack as { setImpactAoeRadius?: unknown }).setImpactAoeRadius === 'function';
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
        if (config.projectileScale !== undefined) {
            node.setScale(config.projectileScale, config.projectileScale, 1);
        }
    }
}
