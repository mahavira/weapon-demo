import { Vec3 } from 'cc';
import { Hurtbox } from '../enemy/base/Hurtbox';
import { HitSample } from './HitSample';
import { HitResult } from './HitResult';
import { HitStopMode } from './HitPolicy';
import { HitDetector } from './HitDetector';
import { EnemyRegistry } from './EnemyRegistry';

export class HitSystem {
    public static sampleHits(sample: HitSample, targets?: readonly Hurtbox[]): HitResult[] {
        const results: HitResult[] = [];
        const queryTargets = targets ?? EnemyRegistry.getDamageableTargets(sample.damageChannel);

        for (const hurtbox of queryTargets) {
            const target = hurtbox.node;
            if (!target || !target.isValid || target === sample.attackerNode) continue;
            if (sample.hitTracker.hasHit(sample.phase, target, sample.policy)) continue;

            const hit = HitDetector.sweepCircleAgainstTarget(
                sample.previousWorldPos,
                sample.currentWorldPos,
                sample.sweepRadius,
                hurtbox.getWorldCenter(),
                hurtbox.getHitRadius()
            );

            if (!hit) continue;

            results.push({
                target,
                hurtbox,
                hitWorldPos: new Vec3(hit.hitWorldPos.x, hit.hitWorldPos.y, sample.currentWorldPos.z),
                travelT: hit.travelT,
                phase: sample.phase,
            });
        }

        results.sort((a, b) => a.travelT - b.travelT);

        const frameCap = sample.policy.stopMode === HitStopMode.FirstHit
            ? 1
            : Math.max(1, Math.floor(sample.policy.maxTargetsPerFrame));

        return results.slice(0, frameCap);
    }
}
