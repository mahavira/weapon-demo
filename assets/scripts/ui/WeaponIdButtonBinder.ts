import { _decorator, Component, Button } from 'cc';
import { WeaponSystem } from '../systems/WeaponSystem';

const { ccclass, property } = _decorator;

/**
 * One button fires one weapon.
 *
 * Usage:
 * - FireBoomerangButton.weaponId = 'arc_boomerang'
 * - FireSpreadButton.weaponId = 'spread_bullet'
 *
 * This does not change WeaponSystem.currentWeaponId. It directly calls fireWeapon(weaponId).
 */
@ccclass('WeaponIdButtonBinder')
export class WeaponIdButtonBinder extends Component {
    @property(Button)
    button: Button | null = null;

    @property(WeaponSystem)
    weaponSystem: WeaponSystem | null = null;

    @property
    weaponId: string = 'arc_boomerang';

    start(): void {
        if (!this.button) {
            console.error('[WeaponIdButtonBinder] Missing button');
            return;
        }

        if (!this.weaponSystem) {
            console.error('[WeaponIdButtonBinder] Missing weaponSystem');
            return;
        }

        this.button.node.on(Button.EventType.CLICK, this.onClickFire, this);
    }

    protected onDestroy(): void {
        if (this.button && this.button.node && this.button.node.isValid) {
            this.button.node.off(Button.EventType.CLICK, this.onClickFire, this);
        }
    }

    private onClickFire(): void {
        if (!this.weaponSystem) return;
        this.weaponSystem.fireWeapon(this.weaponId);
    }
}
