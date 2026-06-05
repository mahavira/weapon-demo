import type { WeaponBeamConfig } from '../config/WeaponConfigTable';

export interface BeamRuntimeConfigReceiver {
    setBeamConfig(beamConfig: WeaponBeamConfig): void;
}

export function isBeamRuntimeConfigReceiver(value: unknown): value is BeamRuntimeConfigReceiver {
    return typeof (value as { setBeamConfig?: unknown })?.setBeamConfig === 'function';
}
