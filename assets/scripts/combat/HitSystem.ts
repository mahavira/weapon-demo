import { Vec3 } from 'cc';
import { Hurtbox } from '../enemy/base/Hurtbox';
import { HitSample } from './HitSample';
import { HitResult } from './HitResult';
import { HitStopMode } from './HitPolicy';
import { HitDetector } from './HitDetector';
import { EnemyRegistry } from './EnemyRegistry';

export class HitSystem {
    public static sampleHits(sample: HitSample, targets?: readonly Hurtbox[]): HitResult[] {
        if (sample.policy.stopMode === HitStopMode.FirstHit) {
            const firstHit = this.sampleFirstHit(sample, targets);
            return firstHit ? [firstHit] : [];
        }

        return this.samplePenetratingHits(sample, targets);
    }

    private static sampleFirstHit(sample: HitSample, targets?: readonly Hurtbox[]): HitResult | null {
        let nearestHit: HitResult | null = null;

        this.forEachCandidateTarget(sample, targets, (hurtbox) => {
            const hit = this.sampleHitAgainstTarget(sample, hurtbox);
            if (!hit) return;

            if (!nearestHit || hit.travelT < nearestHit.travelT) {
                nearestHit = hit;
            }
        });

        return nearestHit;
    }

    private static samplePenetratingHits(sample: HitSample, targets?: readonly Hurtbox[]): HitResult[] {
        const results: HitResult[] = [];

        this.forEachCandidateTarget(sample, targets, (hurtbox) => {
            const hit = this.sampleHitAgainstTarget(sample, hurtbox);
            if (hit) {
                results.push(hit);
            }
        });

        results.sort((a, b) => a.travelT - b.travelT);

        const frameCap = Math.max(1, Math.floor(sample.policy.maxTargetsPerFrame));
        return results.slice(0, frameCap);
    }

    private static forEachCandidateTarget(
        sample: HitSample,
        targets: readonly Hurtbox[] | undefined,
        visitor: (hurtbox: Hurtbox) => void
    ): void {
        if (targets) {
            for (const hurtbox of targets) {
                visitor(hurtbox);
            }
            return;
        }

        EnemyRegistry.forEachDamageableTarget(sample.damageChannel, visitor);
    }

    private static sampleHitAgainstTarget(sample: HitSample, hurtbox: Hurtbox): HitResult | null {
        const target = hurtbox.node;
        if (!target || !target.isValid || target === sample.attackerNode) return null;
        if (sample.hitTracker.hasHit(sample.phase, target, sample.policy)) return null;

        const hit = HitDetector.sweepCircleAgainstTarget(
            sample.previousWorldPos,
            sample.currentWorldPos,
            sample.sweepRadius,
            hurtbox.getWorldCenter(),
            hurtbox.getHitRadius()
        );

        if (!hit) return null;

        return {
            target,
            hurtbox,
            hitWorldPos: new Vec3(hit.hitWorldPos.x, hit.hitWorldPos.y, sample.currentWorldPos.z),
            travelT: hit.travelT,
            phase: sample.phase,
        };
    }
}
