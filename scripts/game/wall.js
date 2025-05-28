import { Rect } from '../lib/collision.js';

export class Wall {
    /** @param {Rect} rect */
    constructor(rect) {
        this.collider = rect;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        const { pos, ext, rot } = this.collider;

        ctx.lineWidth = 0.1;
        const t = ctx.lineWidth / 2;
        const basePath = new Path2D();
        basePath.moveTo(ext.x - t, ext.y - t);
        basePath.lineTo(t - ext.x, ext.y - t);
        basePath.lineTo(t - ext.x, t - ext.y);
        basePath.lineTo(ext.x - t, t - ext.y);
        basePath.closePath();
        const path = transformPath(basePath, pos, rot);

        ctx.strokeStyle = 'hsl(255 80 25)';
        ctx.stroke(path);
        ctx.fillStyle = 'hsl(240 90 20 / 0.3)';
        ctx.fill(path);
    }
}
