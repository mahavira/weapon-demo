import { Color, Graphics, Node, Tween, tween, UITransform } from 'cc';

export class EnemyHealthBarRenderer {
    private rootNode: Node | null = null;
    private trackGraphics: Graphics | null = null;
    private damageLagGraphics: Graphics | null = null;
    private fillGraphics: Graphics | null = null;
    private readonly damageLagState = {
        healthRatio: 1,
        damageLagRatio: 1,
    };

    constructor(
        private readonly hostNode: Node,
        private readonly barWidth: number = 48,
        private readonly barHeight: number = 7,
    ) {}

    public ensure(visualHeight: number): void {
        if (this.rootNode && this.rootNode.isValid) {
            this.rootNode.setPosition(0, visualHeight * 0.62 + 16, 0);
            return;
        }

        this.rootNode = new Node('HealthBarLayer');
        const transform = this.rootNode.addComponent(UITransform);
        transform.setContentSize(this.barWidth, 16);
        this.rootNode.setPosition(0, visualHeight * 0.62 + 16, 0);

        const trackNode = new Node('HealthBarTrackLayer');
        const damageLagNode = new Node('HealthBarDamageLagLayer');
        const fillNode = new Node('HealthBarFillLayer');

        for (const barNode of [trackNode, damageLagNode, fillNode]) {
            this.rootNode.addChild(barNode);
            const barTransform = barNode.addComponent(UITransform);
            barTransform.setContentSize(this.barWidth, this.barHeight);
        }

        this.trackGraphics = trackNode.addComponent(Graphics);
        this.damageLagGraphics = damageLagNode.addComponent(Graphics);
        this.fillGraphics = fillNode.addComponent(Graphics);
        this.hostNode.addChild(this.rootNode);
        this.redraw();
    }

    public syncHealth(previousHp: number, currentHp: number, maxHp: number): void {
        this.ensure(64);
        const safeMaxHp = Math.max(1, maxHp);
        const healthRatio = this.clamp01(currentHp / safeMaxHp);
        const previousHealthRatio = this.clamp01(previousHp / safeMaxHp);

        this.damageLagState.healthRatio = healthRatio;
        this.damageLagState.damageLagRatio = Math.max(this.damageLagState.damageLagRatio, previousHealthRatio);
        this.redraw();

        Tween.stopAllByTarget(this.damageLagState);
        tween(this.damageLagState)
            .delay(0.04)
            .to(0.32, { damageLagRatio: healthRatio }, {
                onUpdate: () => this.redraw(),
            })
            .start();
    }

    public stopTweens(): void {
        Tween.stopAllByTarget(this.damageLagState);
    }

    private redraw(): void {
        if (!this.trackGraphics || !this.damageLagGraphics || !this.fillGraphics) {
            return;
        }

        const left = -this.barWidth * 0.5;
        const top = -this.barHeight * 0.5;
        const healthWidth = this.barWidth * this.damageLagState.healthRatio;
        const damageLagWidth = this.barWidth * this.damageLagState.damageLagRatio;

        this.trackGraphics.clear();
        this.trackGraphics.fillColor = new Color(14, 20, 28, 220);
        this.trackGraphics.roundRect(left, top, this.barWidth, this.barHeight, 3);
        this.trackGraphics.fill();

        this.damageLagGraphics.clear();
        this.damageLagGraphics.fillColor = new Color(255, 255, 255, 220);
        this.damageLagGraphics.roundRect(left, top, damageLagWidth, this.barHeight, 3);
        this.damageLagGraphics.fill();

        this.fillGraphics.clear();
        this.fillGraphics.fillColor = new Color(92, 235, 120, 255);
        this.fillGraphics.roundRect(left, top, healthWidth, this.barHeight, 3);
        this.fillGraphics.fill();
    }

    private clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }
}
