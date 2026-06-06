import { _decorator } from 'cc';
import { DirectHitProjectile } from './DirectHitProjectile';

const { ccclass } = _decorator;

@ccclass('SpreadBulletProjectile')
export class SpreadBulletProjectile extends DirectHitProjectile {
  travelSpeed: number = 1280;
}
