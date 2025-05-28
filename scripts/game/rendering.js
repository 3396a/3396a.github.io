import { Camera } from '../camera.js';
import { Canvas } from '../canvas.js';
import { vec2 } from '../lib/vec2.js';
import { Player } from './player.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Camera} camera
 * @param {Canvas} canvas
 */
export function drawBackground(ctx, camera, canvas) {
    const size = canvas.scale * camera.scale * window.devicePixelRatio;
    const patternCanvas = new OffscreenCanvas(size, size);
    const patternCtx = unwrap(patternCanvas.getContext('2d'));
    patternCtx.lineWidth = 3;
    patternCtx.strokeStyle = 'rgb(235 235 245)';
    patternCtx.strokeRect(0, 0, 10000, 10000);

    ctx.fillStyle = unwrap(ctx.createPattern(patternCanvas, 'repeat'));
    const bgScale = 1 / (window.devicePixelRatio * canvas.scale * camera.scale);
    ctx.fillStyle.setTransform(new DOMMatrix([bgScale, 0, 0, bgScale, 0, 0]));
    ctx.fillRect(-5000, -5000, 10000, 10000);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Canvas} canvas
 * @param {Player} player
 */
export function drawUI(ctx, canvas, player) {
    // setup
    const ext = vec2();
    {
        const height = Camera.vfov;
        const width = (canvas.elem.width / canvas.elem.height) * height;
        ext.Set(width / 2, height / 2);
        ctx.resetTransform();
        const scale = canvas.elem.height / height;
        ctx.scale(scale, scale);
        ctx.translate(ext.x, ext.y);
    }

    const offset = vec2(2.5, 1.5);
    const cornerRadius = 0.3;
    const space = 0.25;

    // health and dash bars
    {
        const size = vec2(10, 1);
        const pos = ext.sub(offset).Mul(vec2(-1, 1));

        // health
        {
            const t = clamp(player.visualHealth / player.maxHealth);
            const filledClipPath = new Path2D();
            filledClipPath.rect(pos.x, 0, t * size.x, ext.y);
            const emptyClipPath = new Path2D();
            emptyClipPath.rect(pos.x + t * size.x, 0, (1 - t) * size.x, ext.y);
            ctx.beginPath();
            ctx.roundRect(pos.x, pos.y - 2 * size.y - space, size.x, size.y, cornerRadius);
            ctx.save();
            ctx.fillStyle = ctx.createLinearGradient(pos.x, 0, pos.x + size.x, 0);
            ctx.fillStyle.addColorStop(0, 'hsl(10 80 60 / 0.9)');
            ctx.fillStyle.addColorStop(1, 'hsl(0 90 55 / 0.9)');
            ctx.clip(filledClipPath);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.fillStyle = 'hsl(240 70 20 / 0.3)';
            ctx.clip(emptyClipPath);
            ctx.fill();
            ctx.restore();
        }

        // dash
        {
            const gapWidth = 0.15;
            const clipPath = new Path2D();
            const segmentWidth = (size.x - (player.dashes - 1) * gapWidth) / player.dashes;
            for (let i = 0; i < player.dashes; i++) {
                clipPath.roundRect(pos.x + (segmentWidth + gapWidth) * i, pos.y - size.y, segmentWidth, size.y, cornerRadius / 4);
            }
            ctx.save();
            ctx.clip(clipPath);

            const t = clamp(player.visualDashesLeft / player.dashes);
            const filledClipPath = new Path2D();
            filledClipPath.rect(pos.x, 0, t * size.x, ext.y);
            const emptyClipPath = new Path2D();
            emptyClipPath.rect(pos.x + t * size.x, 0, (1 - t) * size.x, ext.y);
            ctx.beginPath();
            ctx.roundRect(pos.x, pos.y - size.y, size.x, size.y, cornerRadius);
            ctx.save();
            ctx.fillStyle = ctx.createLinearGradient(pos.x, 0, pos.x + size.x, 0);
            ctx.fillStyle.addColorStop(0, 'hsl(210 40 60 / 0.9)');
            ctx.fillStyle.addColorStop(1, 'hsl(220 45 55 / 0.9)');
            ctx.clip(filledClipPath);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.fillStyle = 'hsl(240 70 20 / 0.3)';
            ctx.clip(emptyClipPath);
            ctx.fill();
            ctx.restore();

            ctx.restore();
        }

        // text overlay
        const textOffset = vec2(0.5, 0.055);
        ctx.font = `500 0.7px 'Inter'`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(`${round(clamp(player.health, 0, 100))}`, pos.x + textOffset.x, pos.y - 1.5 * size.y - space + textOffset.y);
        ctx.fillText(`${floor(player.dashesLeft)}`, pos.x + textOffset.x, pos.y - 0.5 * size.y + textOffset.y);
    }

    // weapon selection
    {
        const size = vec2(2, 1.5);
        const space = 0.3;
        const pos = ext.sub(offset).sub(size);
        pos.x -= (size.x + space) * (player.weapons.length - 1);

        for (let i = 0; i < player.weapons.length; i++) {
            ctx.beginPath();
            ctx.roundRect(pos.x + i * (size.x + space), pos.y, size.x, size.y, cornerRadius);
            let a = 0.3;
            let weight = 300;
            if (i == player.weaponIndex) {
                a = 0.6;
                weight = 500;
            }
            ctx.fillStyle = `hsl(240 90 20 / ${a})`;
            ctx.fill();

            ctx.font = `${weight} 0.8px Inter`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`${1 + i}`, pos.x + i * (size.x + space) + size.x / 2, pos.y + size.y * 0.55);
        }
    }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} msg
 * @param {number} alpha
 */
export function drawNewWaveMessage(ctx, msg, alpha) {
    ctx.font = '2px Inter';
    ctx.fillStyle = `rgb(0 0 0 / ${alpha})`;
    ctx.fillText(msg, 0, -5);
}
