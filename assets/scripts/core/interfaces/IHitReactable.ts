import { HitInfo } from '../../combat/HitInfo';

export interface IHitReactable {
    onHit(info: HitInfo): void;
}
