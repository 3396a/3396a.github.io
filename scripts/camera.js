import { Canvas } from './canvas.js';
import { Vec2 } from './lib/vec2.js';

export class Camera {
    static movementDamp = 5;
    static scaleDamp = 10;
    static vfov = 25;

    /**
     * @param {Vec2} center
     * @param {number} scale
     */
    constructor(center, scale) {
        this.center = center.clone();
        this.scale = scale;
        this.targetCenter = center.clone();
        this.targetScale = scale;
    }

    /** @param {number} dt */
    update(dt) {
        this.center.Damp(this.targetCenter, Camera.movementDamp, dt);
        this.scale = damp(this.scale, this.targetScale, Camera.scaleDamp, dt);
    }

    /** @param {Canvas} canvas */
    transform(canvas) {
        let scale = canvas.elem.height / Canvas.baseScale / Camera.vfov;
        scale *= this.scale;
        canvas.ctx.scale(scale, scale);
        canvas.ctx.translate(-this.center.x, -this.center.y);
    }

    /**
     * @param {Vec2} p
     * @param {Canvas} canvas
     */
    ScreenToWorld(canvas, p) {
        return p.Div(canvas.scale).Sub(canvas.offset).Div(this.scale).Add(this.center);
    }
}
