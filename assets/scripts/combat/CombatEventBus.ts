import { EventTarget, Node } from 'cc';
import { StatusEffectType } from '../core/types/StatusEffectType';

export const CombatEventBus = new EventTarget();

export enum CombatEventName {
    Hit = 'combat-hit',
    Damage = 'combat-damage',
    Kill = 'combat-kill',
    StatusApplied = 'combat-status-applied',
    StatusRemoved = 'combat-status-removed',
    StatusTick = 'combat-status-tick',
}

export interface CombatStatusEventPayload {
    targetNode: Node;
    effectType: StatusEffectType;
    sourceWeaponId: string;
    damageAmount?: number;
}
