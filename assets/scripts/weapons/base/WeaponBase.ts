import { _decorator, Component } from 'cc';
import { WeaponContext } from './WeaponContext';

const { ccclass, property } = _decorator;

@ccclass('WeaponBase')
export abstract class WeaponBase extends Component {
    @property
    weaponId: string = 'weapon';

    @property
    weaponName: string = 'Weapon';

    public abstract fire(context?: WeaponContext): void;
}
