import { _decorator } from 'cc';
import { DirectHitProjectile } from './DirectHitProjectile';

const { ccclass } = _decorator;

@ccclass('SugarcaneBulletProjectile')
export class SugarcaneBulletProjectile extends DirectHitProjectile {}
