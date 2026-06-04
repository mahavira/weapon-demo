import { _decorator, Component, Button } from 'cc';
import { WeaponSystem } from '../systems/WeaponSystem';

const { ccclass, property } = _decorator;

/**
 * New recommended button binder.
 * It binds UI to WeaponSystem, not to a concrete weapon.
 */
@ccclass('WeaponSystemButtonBinder')
export class WeaponSystemButtonBinder extends Component {
    @property(Button)
    button: Button | null = null;

    @property(WeaponSystem)
    weaponSystem: WeaponSystem | null = null;

    start(): void {
        if (!this.button) {
            console.error('[WeaponSystemButtonBinder] Missing button');
            return;
        }

        if (!this.weaponSystem) {
            console.error('[WeaponSystemButtonBinder] Missing weaponSystem');
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
        this.weaponSystem?.fireCurrentWeapon();
    }
}
