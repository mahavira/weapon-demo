import { _decorator } from 'cc';
import { DirectHitProjectile } from './DirectHitProjectile';

const { ccclass } = _decorator;

@ccclass('StrawberryBulletProjectile')
export class StrawberryBulletProjectile extends DirectHitProjectile {
  travelSpeed: number = 1280;
}
