import { EventTarget } from 'cc';

export const CombatEventBus = new EventTarget();

export enum CombatEventName {
    Hit = 'combat-hit',
    Damage = 'combat-damage',
    Kill = 'combat-kill',
}
