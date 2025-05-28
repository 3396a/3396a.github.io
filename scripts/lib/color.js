export class Color {
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    /**
     * @param {Color} other
     * @param {number} t
     */
    Lerp(other, t) {
        this.r = lerp(this.r, other.r, t);
        this.g = lerp(this.g, other.g, t);
        this.b = lerp(this.b, other.b, t);
        this.a = lerp(this.a, other.a, t);
        return this;
    }

    /**
     * @param {Color} other
     * @param {number} t
     */
    lerp(other, t) {
        return this.clone().Lerp(other, t);
    }

    toString() {
        return `rgb(${round(this.r)} ${round(this.g)} ${round(this.b)} / ${this.a})`;
    }
}
