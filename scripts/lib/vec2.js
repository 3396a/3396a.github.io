/** Two-component vector class. Methods with capitalized names are mutating, and lowercase methods return a copy. */
export class Vec2 {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    Set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /** @param {Vec2} v */
    Copy(v) {
        return this.Set(v.x, v.y);
    }

    /** @param {Vec2} v */
    Add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    /** @param {Vec2} v */
    add(v) {
        return this.clone().Add(v);
    }

    /** @param {Vec2} v */
    Sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    /** @param {Vec2} v */
    sub(v) {
        return this.clone().Sub(v);
    }

    /** @param {Vec2 | number} v */
    Mul(v) {
        if (typeof v === 'number') {
            this.x *= v;
            this.y *= v;
            return this;
        }
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    /** @param {Vec2 | number} v */
    mul(v) {
        return this.clone().Mul(v);
    }

    /** @param {Vec2 | number} v */
    Div(v) {
        if (typeof v === 'number') {
            this.x /= v;
            this.y /= v;
            return this;
        }
        this.x /= v.x;
        this.y /= v.y;
        return this;
    }

    /** @param {Vec2 | number} v */
    div(v) {
        return this.clone().Div(v);
    }

    /**
     * @param {Vec2} v
     * @param {number} a
     */
    AddScaled(v, a) {
        this.x += a * v.x;
        this.y += a * v.y;
        return this;
    }

    /**
     * @param {Vec2} v
     * @param {number} a
     */
    addScaled(v, a) {
        return this.clone().AddScaled(v, a);
    }

    /** @param {Vec2} v */
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    /** @param {Vec2} v */
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    len2() {
        return this.x * this.x + this.y * this.y;
    }

    len() {
        return sqrt(this.len2());
    }

    /** @param {Vec2} p */
    dist2(p) {
        return this.clone().Sub(p).len2();
    }

    /** @param {Vec2} p */
    dist(p) {
        return sqrt(this.dist2(p));
    }

    Normalize() {
        this.Div(this.len());
        if (this.isFinite()) return this;
        return this.Set(1, 0);
    }

    normalize() {
        return this.clone().Normalize();
    }

    Sign() {
        const len = this.len();
        if (len === 0) {
            return this.Set(0, 0);
        }
        return this.Div(len);
    }

    sign() {
        return this.clone().Sign();
    }

    arg() {
        return atan2(this.y, this.x);
    }

    Conj() {
        this.y = -this.y;
        return this;
    }

    conj() {
        return this.clone().Conj();
    }

    /** @param {Vec2} z */
    CMul(z) {
        return this.Set(this.x * z.x - this.y * z.y, this.x * z.y + this.y * z.x);
    }

    /** @param {Vec2} z */
    cmul(z) {
        return this.clone().CMul(z);
    }

    /**
     * Shorthand for `this.CMul(z.conj())`.
     *
     * @param {Vec2} z
     */
    CMulc(z) {
        return this.Set(this.x * z.x + this.y * z.y, this.y * z.x - this.x * z.y);
    }

    /** @param {Vec2} z */
    cmulc(z) {
        return this.clone().CMulc(z);
    }

    /** @param {Vec2} n */
    Reflect(n) {
        return this.Sub(n.clone().Mul((2 * this.dot(n)) / n.len2()));
    }

    /** @param {Vec2} n */
    Project(n) {
        return this.Sub(n.mul(n.dot(this)));
    }

    /** @param {(x: number) => number} f */
    Map(f) {
        this.x = f(this.x);
        this.y = f(this.y);
        return this;
    }
    /** @param {(x: number) => number} f */
    map(f) {
        return this.clone().Map(f);
    }

    /**
     * @param {(x: number, y: number) => number} f
     * @param {Vec2} b
     */
    Map2(f, b) {
        this.x = f(this.x, b.x);
        this.y = f(this.y, b.y);
        return this;
    }

    /**
     * @param {(x: number, y: number) => number} f
     * @param {Vec2} b
     */
    map2(f, b) {
        return this.clone().Map2(f, b);
    }

    /**
     * @param {Vec2} b
     * @param {number} t
     */
    Lerp(b, t) {
        return this.Set(lerp(this.x, b.x, t), lerp(this.y, b.y, t));
    }

    /**
     * @param {Vec2} b
     * @param {number} t
     */
    lerp(b, t) {
        return this.clone().Lerp(b, t);
    }

    /**
     * Frame rate independent lerp smoothing
     *
     * @param {Vec2} b
     * @param {number} lambda
     * @param {number} dt
     */
    Damp(b, lambda, dt) {
        return this.Lerp(b, 1 - exp(-lambda * dt));
    }

    isFinite() {
        return Number.isFinite(this.x) && Number.isFinite(this.y);
    }

    /** Assert that components are numbers */
    check() {
        assert(typeof this.x === 'number' && typeof this.y === 'number', 'Found invalid Vec2', this);
    }
}
/**
 * @overload
 * @param {number} x
 * @param {number} y
 * @returns {Vec2}
 */
/**
 * @overload
 * @param {number} a
 * @returns {Vec2}
 */
/**
 * @overload
 * @param {Vec2} v
 * @returns {Vec2}
 */
/**
 * @overload
 * @returns {Vec2}
 */

// @ts-ignore
export function vec2(x, y) {
    if (y === undefined) {
        if (x === undefined) {
            return new Vec2(0, 0);
        }
        if (x instanceof Vec2) {
            return x.clone();
        }
        assert(typeof x === 'number', 'Cannot create vector from single argument: ', x);
        return new Vec2(x, x);
    }
    assert(typeof x === 'number' && typeof y === 'number', 'Cannot create vector from two components:', x, y);
    return new Vec2(x, y);
}

/**
 * @param {number} [a]
 * @returns {Vec2}
 */
export function rot2(a = 0) {
    assert(typeof a === 'number', 'Cannot create rotation from argument: ', a);
    return new Vec2(cos(a), sin(a));
}
