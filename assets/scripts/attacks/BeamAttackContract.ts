import type { WeaponBeamConfig } from '../config/WeaponConfigTable';
import type { ITargetProvider } from '../core/interfaces/ITargetProvider';

export interface BeamRuntimeConfigReceiver {
    setBeamConfig(beamConfig: WeaponBeamConfig): void;
}

export interface BeamTargetProviderReceiver {
    setBeamTargetProvider(targetProvider: ITargetProvider | null): void;
}

export function isBeamRuntimeConfigReceiver(value: unknown): value is BeamRuntimeConfigReceiver {
    return typeof (value as { setBeamConfig?: unknown })?.setBeamConfig === 'function';
}

export function isBeamTargetProviderReceiver(value: unknown): value is BeamTargetProviderReceiver {
    return typeof (value as { setBeamTargetProvider?: unknown })?.setBeamTargetProvider === 'function';
}
