import { _decorator, Component } from 'cc';
import { WeaponContext } from './WeaponContext';

const { ccclass, property } = _decorator;

/**
 * @deprecated Prefer WeaponSystem + WeaponConfigTable for new weapons.
 * This base class is kept for existing scene/script compatibility.
 */
@ccclass('WeaponBase')
export abstract class WeaponBase extends Component {
    @property
    weaponId: string = 'weapon';

    @property
    weaponName: string = 'Weapon';

    public abstract fire(context?: WeaponContext): void;
}
