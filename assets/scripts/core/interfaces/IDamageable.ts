import { DamageInfo } from '../../combat/DamageInfo';

export interface IDamageable {
    takeDamage(info: DamageInfo): void;
}
