import { _decorator, Component, Button } from 'cc';
import { WeaponSystem } from '../systems/WeaponSystem';

const { ccclass, property } = _decorator;

/**
 * Optional debug helper.
 * Attach this to a button to switch WeaponSystem.currentWeaponId.
 */
@ccclass('DebugWeaponSwitchButton')
export class DebugWeaponSwitchButton extends Component {
    @property(Button)
    button: Button | null = null;

    @property(WeaponSystem)
    weaponSystem: WeaponSystem | null = null;

    @property
    weaponId: string = 'strawberry_gun';

    start(): void {
        if (!this.button || !this.weaponSystem) return;
        this.button.node.on(Button.EventType.CLICK, this.onClickSwitch, this);
    }

    protected onDestroy(): void {
        if (this.button && this.button.node && this.button.node.isValid) {
            this.button.node.off(Button.EventType.CLICK, this.onClickSwitch, this);
        }
    }

    private onClickSwitch(): void {
        this.weaponSystem?.setCurrentWeapon(this.weaponId);
    }
}
