import { _decorator, Component } from 'cc';
import { EnemyHealth } from './EnemyHealth';
import { EnemyVisual } from './EnemyVisual';

const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    @property(EnemyHealth)
    health: EnemyHealth | null = null;

    @property(EnemyVisual)
    visual: EnemyVisual | null = null;
}
