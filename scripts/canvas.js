import { vec2 } from './lib/vec2.js';

export class Canvas {
    static baseScale = 50;
    static vfov = 20;

    /** @param {string} s Selector */
    constructor(s) {
        /** @type {HTMLCanvasElement} */
        this.elem = selector(s);
        this.ctx = unwrap(this.elem.getContext('2d'));
        this.offset = vec2();
        this.scale = 0;
        this.resize(window.innerWidth, window.innerHeight);
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        const dpr = window.devicePixelRatio;
        this.elem.width = width * dpr;
        this.elem.height = height * dpr;
        this.scale = Canvas.baseScale / dpr;
        this.offset.Set(width, height).Div(2 * this.scale);
    }

    /** Update the `ctx` transform */
    transform() {
        this.ctx.resetTransform();
        this.ctx.scale(Canvas.baseScale, Canvas.baseScale);
        this.ctx.translate(this.offset.x, this.offset.y);
    }

    /** Clear the canvas and reset transforms */
    clear() {
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.elem.width, this.elem.height);
    }
}

export const canvas = new Canvas('canvas');
export const ctx = canvas.ctx;

window.addEventListener('resize', () => canvas.resize(window.innerWidth, window.innerHeight));
