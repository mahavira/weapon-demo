import { _decorator } from 'cc';
import { DirectHitProjectile } from './DirectHitProjectile';

const { ccclass } = _decorator;

@ccclass('RapidBulletProjectile')
export class RapidBulletProjectile extends DirectHitProjectile {}
