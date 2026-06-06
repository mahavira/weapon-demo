import { Color, Graphics, Node, Tween, tween, UIOpacity, UITransform, Vec3 } from 'cc';

export class EnemyStatusVisualRenderer {
    private burningFlameNode: Node | null = null;
    private burningSmokeNode: Node | null = null;
    private beamScorchNode: Node | null = null;
    private burningFlameGraphics: Graphics | null = null;
    private beamScorchGraphics: Graphics | null = null;
    private isBurningSmokeScheduled = false;
    private readonly beamScorchState = {
        innerRadius: 0,
        outerRadius: 0,
    };

    constructor(
        private readonly hostNode: Node,
        private readonly schedule: (callback: () => void, interval: number) => void,
        private readonly unschedule: (callback: () => void) => void,
        private readonly burningSmokeSpawnTask: () => void,
        private readonly getPrimaryVisualHeight: () => number,
        private readonly getBurningIntensity: () => number,
        private readonly getBurningPulseTime: () => number,
    ) {}

    public playBurningStart(): void {
        this.ensureBurningLayerNodes();
        this.scheduleSmokeSpawn();
    }

    public playBurningLoop(): void {
        this.ensureBurningLayerNodes();
        this.scheduleSmokeSpawn();
    }

    public playBurningStop(): void {
        this.unschedule(this.burningSmokeSpawnTask);
        this.isBurningSmokeScheduled = false;
        this.fadeOutBurningLayer(this.burningFlameNode, () => {
            this.burningFlameGraphics?.clear();
            this.burningFlameNode = null;
            this.burningFlameGraphics = null;
        });
        this.fadeOutBurningLayer(this.burningSmokeNode, () => {
            this.burningSmokeNode = null;
        });
    }

    public playBeamScorch(beamWidth: number): void {
        this.ensureBeamScorchNode();
        if (!this.beamScorchNode || !this.beamScorchGraphics) {
            return;
        }

        const scorchRadius = Math.max(10, beamWidth * 0.22);
        const transform = this.beamScorchNode.getComponent(UITransform) ?? this.beamScorchNode.addComponent(UITransform);
        transform.setContentSize(scorchRadius * 4, scorchRadius * 4);
        this.beamScorchNode.setPosition(this.getBeamScorchLocalPos(scorchRadius));

        this.beamScorchState.innerRadius = scorchRadius * 0.45;
        this.beamScorchState.outerRadius = scorchRadius;
        this.redrawBeamScorchLayer();

        const opacity = this.beamScorchNode.getComponent(UIOpacity) ?? this.beamScorchNode.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        Tween.stopAllByTarget(this.beamScorchState);
        opacity.opacity = 180;

        tween(this.beamScorchState)
            .to(0.18, {
                innerRadius: scorchRadius * 0.18,
                outerRadius: scorchRadius * 1.45,
            }, {
                onUpdate: () => this.redrawBeamScorchLayer(),
            })
            .start();

        tween(opacity)
            .to(0.18, { opacity: 0 })
            .call(() => this.clearBeamScorch())
            .start();
    }

    public redrawBurningFlameLayer(): void {
        if (!this.burningFlameGraphics) {
            return;
        }

        const burningIntensity = this.getBurningIntensity();
        const pulseFactor = 0.92 + Math.sin(this.getBurningPulseTime() * 12) * 0.08;
        const flameHeight = 18 + burningIntensity * 18 * pulseFactor;
        const flameSpread = 8 + burningIntensity * 9;
        const flameGraphics = this.burningFlameGraphics;

        flameGraphics.clear();
        flameGraphics.fillColor = new Color(255, 90, 18, 180);
        flameGraphics.circle(-flameSpread, -4, 7 + burningIntensity * 5);
        flameGraphics.circle(0, flameHeight * 0.35, 9 + burningIntensity * 6);
        flameGraphics.circle(flameSpread, 2, 8 + burningIntensity * 5);
        flameGraphics.fill();

        flameGraphics.fillColor = new Color(255, 192, 72, 170);
        flameGraphics.circle(-flameSpread * 0.4, flameHeight * 0.2, 5 + burningIntensity * 4);
        flameGraphics.circle(flameSpread * 0.5, flameHeight * 0.12, 4 + burningIntensity * 3);
        flameGraphics.fill();
    }

    public spawnSmokePuff(): void {
        if (!this.burningSmokeNode || !this.burningSmokeNode.isValid || this.getBurningIntensity() <= 0.01) {
            return;
        }

        const smokeNode = new Node('BurningSmokePuff');
        const smokeTransform = smokeNode.addComponent(UITransform);
        smokeTransform.setContentSize(24, 24);
        const smokeOpacity = smokeNode.addComponent(UIOpacity);
        smokeOpacity.opacity = 120;
        const smokeGraphics = smokeNode.addComponent(Graphics);
        smokeGraphics.fillColor = new Color(84, 84, 84, 140);
        smokeGraphics.circle(0, 0, 8 + Math.random() * 3);
        smokeGraphics.fill();

        smokeNode.setPosition((Math.random() - 0.5) * 24, 10 + Math.random() * 10, 0);
        smokeNode.setScale(0.7 + Math.random() * 0.25, 0.7 + Math.random() * 0.25, 1);
        this.burningSmokeNode.addChild(smokeNode);

        tween(smokeNode)
            .to(0.65, {
                position: new Vec3(smokeNode.position.x + (Math.random() - 0.5) * 18, smokeNode.position.y + 34, 0),
                scale: new Vec3(1.2, 1.2, 1),
            })
            .call(() => {
                if (smokeNode.isValid) {
                    smokeNode.destroy();
                }
            })
            .start();

        tween(smokeOpacity)
            .to(0.65, { opacity: 0 })
            .start();
    }

    public cleanup(): void {
        Tween.stopAllByTarget(this.beamScorchState);
        this.unschedule(this.burningSmokeSpawnTask);
        this.isBurningSmokeScheduled = false;
    }

    private ensureBurningLayerNodes(): void {
        if (!this.burningFlameNode || !this.burningFlameNode.isValid) {
            this.burningFlameNode = new Node('BurningFlameLayer');
            const flameTransform = this.burningFlameNode.addComponent(UITransform);
            flameTransform.setContentSize(72, 72);
            this.burningFlameGraphics = this.burningFlameNode.addComponent(Graphics);
            this.burningFlameNode.addComponent(UIOpacity).opacity = 220;
            this.hostNode.addChild(this.burningFlameNode);
        } else {
            const flameOpacity = this.burningFlameNode.getComponent(UIOpacity) ?? this.burningFlameNode.addComponent(UIOpacity);
            Tween.stopAllByTarget(flameOpacity);
            flameOpacity.opacity = 220;
        }

        if (!this.burningSmokeNode || !this.burningSmokeNode.isValid) {
            this.burningSmokeNode = new Node('BurningSmokeLayer');
            const smokeTransform = this.burningSmokeNode.addComponent(UITransform);
            smokeTransform.setContentSize(84, 96);
            this.hostNode.addChild(this.burningSmokeNode);
        } else {
            const smokeOpacity = this.burningSmokeNode.getComponent(UIOpacity);
            if (smokeOpacity) {
                Tween.stopAllByTarget(smokeOpacity);
                smokeOpacity.opacity = 255;
            }
        }
    }

    private ensureBeamScorchNode(): void {
        if (!this.beamScorchNode || !this.beamScorchNode.isValid) {
            this.beamScorchNode = new Node('BeamScorchStatusLayer');
            const scorchTransform = this.beamScorchNode.addComponent(UITransform);
            scorchTransform.setContentSize(64, 64);
            this.beamScorchGraphics = this.beamScorchNode.addComponent(Graphics);
            this.beamScorchNode.addComponent(UIOpacity).opacity = 0;
            this.hostNode.addChild(this.beamScorchNode);
            return;
        }

        const scorchOpacity = this.beamScorchNode.getComponent(UIOpacity) ?? this.beamScorchNode.addComponent(UIOpacity);
        Tween.stopAllByTarget(scorchOpacity);
        scorchOpacity.opacity = 180;
    }

    private redrawBeamScorchLayer(): void {
        if (!this.beamScorchGraphics) {
            return;
        }

        const scorchGraphics = this.beamScorchGraphics;
        scorchGraphics.clear();
        scorchGraphics.fillColor = new Color(255, 246, 214, 160);
        scorchGraphics.circle(0, 0, this.beamScorchState.innerRadius);
        scorchGraphics.fill();

        scorchGraphics.fillColor = new Color(255, 156, 62, 110);
        scorchGraphics.circle(0, 0, this.beamScorchState.outerRadius);
        scorchGraphics.fill();

        scorchGraphics.strokeColor = new Color(255, 106, 36, 180);
        scorchGraphics.lineWidth = 1.5;
        scorchGraphics.circle(0, 0, this.beamScorchState.outerRadius * 1.16);
        scorchGraphics.stroke();
    }

    private getBeamScorchLocalPos(scorchRadius: number): Vec3 {
        const visualHeight = this.getPrimaryVisualHeight();
        return new Vec3(0, Math.max(scorchRadius * 0.9, visualHeight * 0.18), 0);
    }

    private scheduleSmokeSpawn(): void {
        if (this.isBurningSmokeScheduled) {
            return;
        }

        this.schedule(this.burningSmokeSpawnTask, 0.28);
        this.isBurningSmokeScheduled = true;
    }

    private fadeOutBurningLayer(layerNode: Node | null, onComplete: () => void): void {
        if (!layerNode || !layerNode.isValid) {
            return;
        }

        const opacity = layerNode.getComponent(UIOpacity) ?? layerNode.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        tween(opacity)
            .to(0.18, { opacity: 0 })
            .call(() => {
                onComplete();
                if (layerNode.isValid) {
                    layerNode.destroy();
                }
            })
            .start();
    }

    private clearBeamScorch(): void {
        if (!this.beamScorchNode || !this.beamScorchNode.isValid) {
            this.beamScorchNode = null;
            this.beamScorchGraphics = null;
            return;
        }

        this.beamScorchGraphics?.clear();
        this.beamScorchNode.destroy();
        this.beamScorchNode = null;
        this.beamScorchGraphics = null;
    }
}
