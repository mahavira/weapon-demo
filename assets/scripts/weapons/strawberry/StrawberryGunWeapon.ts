import { _decorator, Node, Prefab, instantiate, Vec3 } from 'cc';
import { WeaponBase } from '../base/WeaponBase';
import { WeaponContext } from '../base/WeaponContext';
import { AttackContext } from '../../attacks/base/AttackContext';
import { StrawberryBulletProjectile } from '../../attacks/projectile/StrawberryBulletProjectile';
import { DamageInfo } from '../../combat/DamageInfo';
import { DamageSourceType } from '../../core/types/DamageTypes';
import { NearestTargetProvider } from '../../targeting/NearestTargetProvider';

const { ccclass, property } = _decorator;

@ccclass('StrawberryGunWeapon')
export class StrawberryGunWeapon extends WeaponBase {
    @property(Node)
    weaponPoint: Node | null = null;

    @property(Node)
    projectileRoot: Node | null = null;

    @property(Prefab)
    strawberryBulletPrefab: Prefab | null = null;

    @property(NearestTargetProvider)
    targetProvider: NearestTargetProvider | null = null;

    @property
    damagePerBullet: number = 2;

    @property
    bulletCount: number = 3;

    @property
    bulletSpacingX: number = 232;

    @property
    bulletTargetSpreadX: number = 132;

    @property
    shotDelay: number = 0;

    public fire(context?: WeaponContext): void {
        const firePoint = context?.firePoint ?? this.weaponPoint;
        const target = context?.target ?? this.targetProvider?.getTarget() ?? null;
        const attacker = context?.owner ?? this.node;

        if (!firePoint) {
            console.error('StrawberryGunWeapon missing firePoint');
            return;
        }

        if (!target) {
            console.warn('StrawberryGunWeapon has no target');
            return;
        }

        if (!this.projectileRoot) {
            console.error('StrawberryGunWeapon missing projectileRoot');
            return;
        }

        if (!this.strawberryBulletPrefab) {
            console.error('StrawberryGunWeapon missing strawberryBulletPrefab');
            return;
        }

        const count = Math.max(1, Math.floor(this.bulletCount));
        const centerIndex = (count - 1) / 2;

        for (let i = 0; i < count; i++) {
            const offsetIndex = i - centerIndex;
            const delay = this.shotDelay * i;

            this.scheduleOnce(() => {
                if (!target.isValid || !firePoint.isValid) return;

                const startWorldPos = firePoint.worldPosition.clone();
                startWorldPos.x += offsetIndex * this.bulletSpacingX;

                const endWorldPos = target.worldPosition.clone();
                endWorldPos.x += offsetIndex * this.bulletTargetSpreadX;

                this.spawnBullet(attacker, target, startWorldPos, endWorldPos);
            }, delay);
        }
    }

    private spawnBullet(attacker: Node, target: Node, startWorldPos: Vec3, endWorldPos: Vec3): void {
        if (!this.projectileRoot || !this.strawberryBulletPrefab) return;

        const node = instantiate(this.strawberryBulletPrefab);
        this.projectileRoot.addChild(node);

        const attack = node.getComponent(StrawberryBulletProjectile);
        if (!attack) {
            console.error('Strawberry bullet prefab missing StrawberryBulletProjectile');
            node.destroy();
            return;
        }

        attack.setEndWorldPos(endWorldPos);

        const attackContext = new AttackContext({
            attacker,
            target,
            startWorldPos,
            sourceWeaponId: this.weaponId,
            damageInfo: new DamageInfo({
                amount: this.damagePerBullet,
                sourceType: DamageSourceType.Projectile,
                sourceWeaponId: this.weaponId,
            }),
        });

        attack.startAttack(attackContext);
    }
}
