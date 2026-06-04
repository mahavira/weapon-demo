import { _decorator, Component, Button } from 'cc';
import { WeaponBase } from '../weapons/base/WeaponBase';

const { ccclass, property } = _decorator;

/**
 * @deprecated Prefer WeaponIdButtonBinder or WeaponSystemButtonBinder.
 * This binder is kept for existing WeaponBase bindings.
 */
@ccclass('FireButtonBinder')
export class FireButtonBinder extends Component {
    @property(Button)
    button: Button | null = null;

    @property(WeaponBase)
    weapon: WeaponBase | null = null;

    start() {
        if (!this.button) {
            console.error('FireButtonBinder missing button');
            return;
        }

        if (!this.weapon) {
            console.error('FireButtonBinder missing weapon');
            return;
        }

        this.button.node.on(Button.EventType.CLICK, this.onClickFire, this);
    }

    protected onDestroy() {
        if (this.button && this.button.node && this.button.node.isValid) {
            this.button.node.off(Button.EventType.CLICK, this.onClickFire, this);
        }
    }

    private onClickFire() {
        this.weapon?.fire();
    }
}
