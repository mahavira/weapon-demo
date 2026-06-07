import type { DamageInfo } from '../../combat/DamageInfo';

export function buildKnockbackCannonAreaDamage(
    baseDamageInfo: DamageInfo,
    centerDistance: number,
    impactRadius: number,
    targetHitRadius: number,
    edgeDamageScale: number
): DamageInfo {
    if (impactRadius <= 0) {
        return baseDamageInfo.cloneWithAmount(baseDamageInfo.amount);
    }

    const distanceToImpactSurface = Math.max(0, centerDistance - targetHitRadius);
    const distanceRatio = Math.min(1, distanceToImpactSurface / impactRadius);
    const damageScale = 1 - (1 - edgeDamageScale) * distanceRatio;
    return baseDamageInfo.cloneWithAmount(baseDamageInfo.amount * damageScale);
}

export function resolveKnockbackCannonDistance(
    baseDistance: number,
    edgeDistanceScale: number,
    distanceFromImpact: number,
    knockbackRadius: number
): number {
    if (knockbackRadius <= 0 || baseDistance <= 0) {
        return 0;
    }

    const distanceRatio = Math.min(1, Math.max(0, distanceFromImpact) / knockbackRadius);
    return baseDistance * (1 - (1 - edgeDistanceScale) * distanceRatio);
}
