import type { Node, Vec3 } from 'cc';
import type { AttackHitTracker } from '../attacks/base/AttackHitTracker';
import { AttackPhase } from '../core/types/AttackTypes';
import { DamageChannel } from '../core/types/DamageChannel';
import type { HitPolicy } from './HitPolicy';

export interface HitSample {
    attackId: string;
    attacker: Node;
    phase: AttackPhase;
    previousWorldPos: Vec3;
    currentWorldPos: Vec3;
    sweepRadius: number;
    damageChannel: DamageChannel;
    policy: HitPolicy;
    hitTracker: AttackHitTracker<Node>;
}
