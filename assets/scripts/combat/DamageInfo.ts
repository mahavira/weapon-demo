import { DamageSourceType } from '../core/types/DamageTypes';

export class DamageInfo {
    public amount: number;
    public sourceType: DamageSourceType;
    public sourceWeaponId: string;
    public isCritical: boolean;

    constructor(params: {
        amount: number;
        sourceType: DamageSourceType;
        sourceWeaponId: string;
        isCritical?: boolean;
    }) {
        this.amount = params.amount;
        this.sourceType = params.sourceType;
        this.sourceWeaponId = params.sourceWeaponId;
        this.isCritical = params.isCritical ?? false;
    }

    public cloneWithAmount(amount: number): DamageInfo {
        return new DamageInfo({
            amount,
            sourceType: this.sourceType,
            sourceWeaponId: this.sourceWeaponId,
            isCritical: this.isCritical,
        });
    }
}
