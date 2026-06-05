import { Vec3 } from 'cc';

export interface ProjectileDestinationReceiver {
    setDestinationWorldPos(destinationWorldPos: Vec3): void;
}

export interface AreaImpactRadiusReceiver {
    setAreaImpactRadius(radius: number): void;
}

export function isProjectileDestinationReceiver(value: unknown): value is ProjectileDestinationReceiver {
    return typeof (value as { setDestinationWorldPos?: unknown })?.setDestinationWorldPos === 'function';
}

export function isAreaImpactRadiusReceiver(value: unknown): value is AreaImpactRadiusReceiver {
    return typeof (value as { setAreaImpactRadius?: unknown })?.setAreaImpactRadius === 'function';
}
