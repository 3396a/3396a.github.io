//
//  A bunch of useful global definitions. Imported by `main.js`.
//

// Debugging

/** Throw an error */
globalThis.unreachable = () => {
    throw new Error();
};

/**
 * @param {boolean} condition
 * @param {...any} message
 * @returns {asserts condition}
 */
globalThis.assert = (condition, ...message) => {
    if (!condition) {
        console.error(...message);
        throw new Error();
    }
};

/**
 * Asserts that the input is non-null and returns it.
 *
 * @template T
 * @param {T} x
 * @param {string} msg
 * @returns {NonNullable<T>}
 */
globalThis.unwrap = (x, msg = 'Tried to unwrap undefined or null') => {
    if (x == null) {
        throw new Error(msg);
    }
    return x;
};

// Selectors

/** @type {<E extends Element>(s: string) => E[]} */
globalThis.selectorAll = s => Array.from(document.querySelectorAll(s));

/** @type {<E extends Element>(s: string) => E} */
globalThis.selector = s => unwrap(document.querySelector(s), `Couldn't find element with selector "${s}"`);

//
//  Custom math functions and constants
//

/**
 * @param {number} value
 * @param {number} lower
 * @param {number} upper
 */
globalThis.clamp = (value, lower = 0, upper = 1) => Math.max(lower, Math.min(upper, value));

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
globalThis.lerp = (a, b, t) => a * (1 - t) + b * t;

/**
 * Same as `Math.sign`, except for `sgn(0) = 1`.
 *
 * @param {number} x
 * @returns {number}
 */
globalThis.sgn = x => (x < 0 ? -1 : 1);

globalThis.ETA = Math.PI / 2;
globalThis.TAU = Math.PI * 2;

/**
 * @param {number} x
 * @param {number} y
 */
globalThis.mod = (x, y) => x - floor(x / y) * y;

/**
 * Framerate independent lerp smoothing
 *
 * @param {number} a
 * @param {number} b
 * @param {number} lambda
 * @param {number} dt
 */
globalThis.damp = (a, b, lambda, dt) => lerp(a, b, 1 - exp(-lambda * dt));

/**
 * @template T
 * @param {...T[]} arrs
 */
globalThis.join = function* (...arrs) {
    for (const arr of arrs) {
        for (const x of arr) {
            yield x;
        }
    }
};

globalThis.random = (lower = 0, upper = 1) => lerp(lower, upper, Math.random());

//
//  Make useful `Math` properties global
//

globalThis.E = Math.E;
globalThis.PI = Math.PI;
globalThis.abs = Math.abs;
globalThis.acos = Math.acos;
globalThis.acosh = Math.acosh;
globalThis.asin = Math.asin;
globalThis.asinh = Math.asinh;
globalThis.atan = Math.atan;
globalThis.atan2 = Math.atan2;
globalThis.atanh = Math.atanh;
globalThis.cbrt = Math.cbrt;
globalThis.ceil = Math.ceil;
globalThis.cos = Math.cos;
globalThis.cosh = Math.cosh;
globalThis.exp = Math.exp;
globalThis.floor = Math.floor;
globalThis.log = Math.log;
globalThis.log10 = Math.log10;
globalThis.log2 = Math.log2;
globalThis.max = Math.max;
globalThis.min = Math.min;
globalThis.pow = Math.pow;
globalThis.round = Math.round;
globalThis.sign = Math.sign;
globalThis.sin = Math.sin;
globalThis.sinh = Math.sinh;
globalThis.sqrt = Math.sqrt;
globalThis.tan = Math.tan;
globalThis.tanh = Math.tanh;
globalThis.trunc = Math.trunc;

// rendering

globalThis.transformPath = (staticPath, pos, rot) => {
    const path = new Path2D();
    let transform = new DOMMatrix([rot.x, rot.y, -rot.y, rot.x, pos.x, pos.y]);
    path.addPath(staticPath, transform);
    return path;
};

// collision

/**
 * @template T
 * @param {T[]} arr
 */
globalThis.pairs = function* (arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < i; j++) {
            yield [arr[i], arr[j]];
        }
    }
};
