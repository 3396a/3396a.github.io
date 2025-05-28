import { rot2, vec2, Vec2 } from './vec2.js';

export class Collider {
    /** @param {Vec2} p */
    containsPoint(p) {
        unreachable();
    }
}

export class Ball extends Collider {
    /**
     * @param {Vec2} pos
     * @param {number} radius
     */
    constructor(pos, radius) {
        super();
        this.pos = pos;
        this.radius = radius;
    }

    /** @param {Vec2} p */
    containsPoint(p) {
        return p.dist2(this.pos) < this.radius ** 2;
    }

    /** @param {Vec2} p */
    dist(p) {
        return p.dist(this.pos) - this.radius;
    }
}

export class Rect extends Collider {
    /**
     * @param {Vec2} pos
     * @param {Vec2} ext
     * @param {Vec2} rot
     */
    constructor(pos, ext, rot = rot2()) {
        super();
        this.pos = pos;
        this.ext = ext;
        this.rot = rot;
    }

    /** @param {Vec2} p */
    containsPoint(p) {
        const p0 = p.sub(this.pos).CMulc(this.rot);
        return abs(p0.x) < this.ext.x && abs(p0.y) < this.ext.y;
    }
}

export class Collision {
    /**
     * @param {Vec2} normal
     * @param {number} dist
     */
    constructor(normal, dist) {
        this.normal = normal;
        this.dist = dist;
    }
}

//  Collision functions
//  By convention, the collision normal points from the first collider to the second collider.

/**
 * @param {Ball} ball1
 * @param {Ball} ball2
 */
export function collideBalls(ball1, ball2) {
    const diff = ball2.pos.sub(ball1.pos);
    const diffLen = diff.len();
    const dist = diffLen - ball1.radius - ball2.radius;
    if (dist > 0) {
        return null;
    }
    return new Collision(diff.Div(diffLen), -dist);
}

/**
 * @param {Ball} ball
 * @param {Rect} rect
 */
export function collideBallRect(ball, rect) {
    const center = ball.pos.sub(rect.pos).CMulc(rect.rot);
    const absCenter = center.map(abs);

    const projCenterOut = absCenter.map2(min, rect.ext);
    const shiftedCenter = absCenter.sub(rect.ext);
    const projCenterIn = shiftedCenter.x < shiftedCenter.y ? vec2(absCenter.x, rect.ext.y) : vec2(rect.ext.x, absCenter.y);
    const inside = shiftedCenter.x < 0 && shiftedCenter.y < 0;

    const projCenter = (inside ? projCenterIn : projCenterOut).Mul(center.map(sgn)).CMul(rect.rot).Add(rect.pos);
    const diff = projCenter
        .clone()
        .Sub(ball.pos)
        .Mul(inside ? -1 : 1);
    const dist = ball.radius + diff.len() * (inside ? 1 : -1);

    if (dist < 0) {
        assert(!inside);
        return null;
    }

    return new Collision(diff.Sign(), dist);
}

/**
 * @param {Ball} ball
 * @param {Ball | Rect} collider
 */
export function collideBallOther(ball, collider) {
    if (collider instanceof Ball) {
        return collideBalls(ball, collider);
    }
    if (collider instanceof Rect) {
        return collideBallRect(ball, collider);
    }
    return unreachable();
}

/**
 * @param {Vec2} a0
 * @param {Vec2} b0
 * @param {Vec2} a1
 * @param {Vec2} b1
 */
export function intersectSegments(a0, b0, a1, b1) {
    const d0 = b0.sub(a0);
    const d1 = b1.sub(a1);
    const da = a1.sub(a0);
    const denom = d0.cross(d1);
    return [da.cross(d1) / denom, da.cross(d0) / denom];
}

/**
 * Returns the parameter `t` such that `a1.lerp(b1, t)` is the intersection point between the two lines.
 *
 * @param {Vec2} a0
 * @param {Vec2} b0
 * @param {Vec2} a1
 * @param {Vec2} b1
 */
export function overlapSegments(a0, b0, a1, b1) {
    const [t0, t1] = intersectSegments(a0, b0, a1, b1);
    return 0 < t0 && t0 < 1 && 0 < t1 && t1 < 1;
}

/**
 * @param {Vec2} a
 * @param {Vec2} b
 * @param {Rect} rect
 */
export function segmentOverlapsRect(a, b, rect) {
    const a0 = a.sub(rect.pos).CMulc(rect.rot);
    const b0 = b.sub(rect.pos).CMulc(rect.rot);
    const v1 = rect.ext;
    const v2 = rect.ext.mul(vec2(-1, 1));
    const v3 = rect.ext.mul(vec2(-1, -1));
    const v4 = rect.ext.mul(vec2(1, -1));
    return overlapSegments(a0, b0, v1, v2) || overlapSegments(a0, b0, v2, v3) || overlapSegments(a0, b0, v3, v4) || overlapSegments(a0, b0, v4, v1);
}

/**
 * @param {Vec2} a
 * @param {Vec2} b
 * @param {Rect} rect
 */
export function raycastRect(a, b, rect) {
    const a0 = a.sub(rect.pos).CMulc(rect.rot);
    const b0 = b.sub(rect.pos).CMulc(rect.rot);
    const v1 = rect.ext;
    const v2 = rect.ext.mul(vec2(-1, 1));
    const v3 = rect.ext.mul(vec2(-1, -1));
    const v4 = rect.ext.mul(vec2(1, -1));
    const t1 = intersectSegments(a0, b0, v1, v2);
    const t2 = intersectSegments(a0, b0, v2, v3);
    const t3 = intersectSegments(a0, b0, v3, v4);
    const t4 = intersectSegments(a0, b0, v4, v1);
    return min(...[t1, t2, t3, t4].filter(t => Number.isFinite(t[0]) && t[0] > 0 && 0 <= t[1] && t[1] <= 1).map(t => t[0]));
}
