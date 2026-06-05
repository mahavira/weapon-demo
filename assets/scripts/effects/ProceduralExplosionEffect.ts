import { Color, Graphics, Node, UIOpacity, UITransform, Vec3, tween } from 'cc';

export function spawnRadialExplosionBurst(parent: Node | null, worldPos: Vec3, aoeRadius: number): void {
    if (!parent || !parent.isValid) {
        return;
    }

    const effectNode = new Node('RadialExplosionBurst');
    parent.addChild(effectNode);
    effectNode.setWorldPosition(worldPos);

    const transform = effectNode.addComponent(UITransform);
    const diameter = Math.max(96, aoeRadius * 2.8);
    transform.setContentSize(diameter, diameter);

    const opacity = effectNode.addComponent(UIOpacity);
    const graphics = effectNode.addComponent(Graphics);
    const state = {
        coreRadius: Math.max(10, aoeRadius * 0.22),
        ringRadius: Math.max(24, aoeRadius * 0.55),
    };

    const redraw = () => {
        if (!graphics.isValid) return;

        graphics.clear();

        graphics.fillColor = new Color(255, 245, 180, 255);
        graphics.circle(0, 0, state.coreRadius);
        graphics.fill();

        graphics.fillColor = new Color(255, 128, 48, 180);
        graphics.circle(0, 0, state.coreRadius * 1.55);
        graphics.fill();

        graphics.lineWidth = Math.max(4, aoeRadius * 0.08);
        graphics.strokeColor = new Color(255, 72, 32, 255);
        graphics.circle(0, 0, state.ringRadius);
        graphics.stroke();
    };

    redraw();

    tween(state)
        .to(0.22, {
            coreRadius: Math.max(16, aoeRadius * 0.58),
            ringRadius: Math.max(48, aoeRadius * 1.18),
        }, {
            onUpdate: () => redraw(),
        })
        .start();

    tween(opacity)
        .delay(0.05)
        .to(0.18, { opacity: 0 })
        .call(() => {
            if (effectNode.isValid) {
                effectNode.destroy();
            }
        })
        .start();
}
