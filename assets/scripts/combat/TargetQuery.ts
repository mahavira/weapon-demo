import { DamageChannel } from '../core/types/DamageChannel.ts';

export interface TargetQueryFilter {
    requireTargetable?: boolean;
    damageChannel?: DamageChannel;
}

export interface CombatQueryable {
    canBeTargeted(): boolean;
    canBeHitBy(channel: DamageChannel): boolean;
}

export function matchesTargetQuery(target: CombatQueryable, filter: TargetQueryFilter = {}): boolean {
    if (filter.requireTargetable && !target.canBeTargeted()) {
        return false;
    }

    if (filter.damageChannel && !target.canBeHitBy(filter.damageChannel)) {
        return false;
    }

    return true;
}
