import { Ball, collideBallRect, collideBalls } from '../lib/collision.js';
import { rot2, Vec2, vec2 } from '../lib/vec2.js';
import { Wall } from './wall.js';

export class DamageInfo {
    constructor(damage) {
        this.damage = damage;
    }
}

export class Pawn {
    /**
     * @param {Vec2} pos
     * @param {number} radius
     * @param {number} maxHealth
     * @param {number} mass
     */
    constructor(pos, radius, maxHealth, mass) {
        this.alive = true;
        this.meleePushback = 1;

        this.collider = new Ball(pos, radius);
        this.pos = this.collider.pos;
        this.vel = vec2();
        this.look = rot2();
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.mass = mass;
        /** @type {DamageInfo[]} */
        this.damageInfos = [];
    }

    /** @param {Wall} wall */
    collideWall(wall) {
        const coll = collideBallRect(this.collider, wall.collider);
        if (!coll) return;
        this.pos.AddScaled(coll.normal, -coll.dist);
    }

    /** @param {Pawn} pawn */
    collidePawn(pawn) {
        const ball1 = this.collider;
        const ball2 = pawn.collider;
        const coll = collideBalls(ball1, ball2);
        if (!coll) return;
        const [m1, m2] = [this.mass, pawn.mass];
        const mtotal = m1 + m2;
        ball1.pos.Sub(coll.normal.mul((coll.dist * m2) / mtotal));
        ball2.pos.Add(coll.normal.mul((coll.dist * m1) / mtotal));
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {}

    /** @param {CanvasRenderingContext2D} ctx */
    drawTop(ctx) {}

    /** @param {DamageInfo} damage */
    takeDamage(damage) {
        this.health -= damage.damage;
        this.alive &&= this.health > 0;

        this.damageInfos.push(damage);
    }
}
