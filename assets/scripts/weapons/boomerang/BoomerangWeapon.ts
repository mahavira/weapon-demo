import { _decorator, Node, Prefab, instantiate } from 'cc';
import { WeaponBase } from '../base/WeaponBase';
import { WeaponContext } from '../base/WeaponContext';
import { AttackContext } from '../../attacks/base/AttackContext';
import { BoomerangProjectile } from '../../attacks/projectile/BoomerangProjectile';
import { DamageInfo } from '../../combat/DamageInfo';
import { DamageSourceType } from '../../core/types/DamageTypes';
import { NearestTargetProvider } from '../../targeting/NearestTargetProvider';

const { ccclass, property } = _decorator;

@ccclass('BoomerangWeapon')
export class BoomerangWeapon extends WeaponBase {
    @property(Node)
    weaponPoint: Node | null = null;

    @property(Node)
    projectileRoot: Node | null = null;

    @property(Prefab)
    boomerangPrefab: Prefab | null = null;

    @property(NearestTargetProvider)
    targetProvider: NearestTargetProvider | null = null;

    @property
    damage: number = 10;

    public fire(context?: WeaponContext): void {
        const firePoint = context?.firePoint ?? this.weaponPoint;
        const target = context?.target ?? this.targetProvider?.getTarget() ?? null;
        const attacker = context?.owner ?? this.node;

        if (!firePoint) {
            console.error('BoomerangWeapon missing firePoint');
            return;
        }

        if (!target) {
            console.warn('BoomerangWeapon has no target');
            return;
        }

        if (!this.projectileRoot) {
            console.error('BoomerangWeapon missing projectileRoot');
            return;
        }

        if (!this.boomerangPrefab) {
            console.error('BoomerangWeapon missing boomerangPrefab');
            return;
        }

        const node = instantiate(this.boomerangPrefab);
        this.projectileRoot.addChild(node);

        const attack = node.getComponent(BoomerangProjectile);
        if (!attack) {
            console.error('Boomerang prefab missing BoomerangProjectile');
            node.destroy();
            return;
        }

        const attackContext = new AttackContext({
            attacker,
            target,
            startWorldPos: firePoint.worldPosition.clone(),
            sourceWeaponId: this.weaponId,
            damageInfo: new DamageInfo({
                amount: this.damage,
                sourceType: DamageSourceType.Projectile,
                sourceWeaponId: this.weaponId,
            }),
        });

        attack.startAttack(attackContext);
    }
}
