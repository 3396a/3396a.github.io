import { Ball, collideBallOther, Collision, Rect } from '../lib/collision.js';
import { rot2, Vec2, vec2 } from '../lib/vec2.js';
import { DamageInfo, Pawn } from './pawn.js';
import { Wall } from './wall.js';

// ==============================
// Base classes
//

export class Bullet {
    /**
     * @param {number} radius
     * @param {number} speed
     * @param {number} damage
     * @param {Vec2} pos
     * @param {Vec2} rot
     */
    constructor(radius, speed, damage, pos, rot) {
        this.collider = new Ball(pos, radius);
        this.pos = this.collider.pos;
        this.vel = rot.mul(speed);
        this.speed = speed;
        this.damage = damage;
        this.lifetime = 20;
        this.alive = true;
    }

    rot() {
        return this.vel.Normalize();
    }

    /** @param {number} dt */
    update(dt) {
        this.pos.AddScaled(this.vel, dt);
        this.lifetime -= dt;
        if (this.lifetime < 0) this.alive = false;
    }

    /** @param {Wall} wall */
    collideWall(wall) {
        this.alive &&= !wall.collider.containsPoint(this.pos);
    }

    /** @param {Pawn} pawn */
    collidePawn(pawn) {
        if (!this.alive || !pawn.alive) return;
        let coll = collideBallOther(pawn.collider, this.collider);
        if (!coll) return;
        this.alive = false;
        // TODO
        pawn.takeDamage(new DamageInfo(this.damage));
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {}
}

/** @template {Ball | Rect} Collider */
export class MeleeAttack {
    /**
     * @param {number} lifetime
     * @param {Collider} collider
     * @param {number} damage
     * @param {number} pushback
     */
    constructor(lifetime, collider, damage, pushback) {
        this.alive = true;
        this.totalLifetime = lifetime;
        this.lifetime = lifetime;
        this.collider = collider;
        this.damage = damage;
        this.pushback = pushback;
        /** @type {Pawn[]} */
        this.damagedList = [];
    }

    /** @param {number} dt */
    update(dt) {
        this.lifetime -= dt;
        if (this.lifetime < 0) this.alive = false;
    }

    /** @param {Pawn} pawn */
    collidePawn(pawn) {
        if (this.damagedList.includes(pawn)) return;
        const coll = collideBallOther(pawn.collider, this.collider);
        if (!coll) return;
        this.damagedList.push(pawn);
        this.pushBackPawn(pawn, coll);
        pawn.takeDamage(new DamageInfo(this.damage));
    }

    /**
     * @param {Pawn} pawn
     * @param {Collision} coll
     */
    pushBackPawn(pawn, coll) {
        // const { pos, ext, rot } = this.collider;
        const shift = coll.normal;
        // const shift = pawn.pos.sub(pos).addScaled(rot, ext.y);
        pawn.vel.AddScaled(shift.Normalize(), -coll.dist * this.pushback * pawn.meleePushback);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {}
}

export class Weapon {
    /** @param {number} cooldown */
    constructor(cooldown) {
        this.cooldown = cooldown;
        this.timeSinceUse = cooldown;
        this.continuousFire = true;
    }

    /** @param {number} dt */
    update(dt) {
        this.timeSinceUse += dt;
    }

    canAttack() {
        return this.timeSinceUse > this.cooldown;
    }

    /**
     * @param {Vec2} spawnPos
     * @param {Vec2} lookDir
     * @returns {Bullet[]}
     */
    getBullets(spawnPos, lookDir) {
        return [];
    }

    /**
     * @param {Vec2} spawnPos
     * @param {Vec2} lookDir
     * @returns {MeleeAttack[]}
     */
    getMelee(spawnPos, lookDir) {
        return [];
    }
}

//

//

//  ==============================
//  Actual weapon definitions
//

const rifleBulletPath = new Path2D();
rifleBulletPath.moveTo(0, 0.1);
rifleBulletPath.lineTo(0.1, 0);
rifleBulletPath.lineTo(0, -0.1);
rifleBulletPath.lineTo(-0.5, 0);
rifleBulletPath.closePath();

class RifleBullet extends Bullet {
    static radius = 0.15;
    static speed = 25;
    static damage = 20;

    /**
     * @param {Vec2} pos
     * @param {Vec2} rot
     */
    constructor(pos, rot) {
        super(RifleBullet.radius, RifleBullet.speed, RifleBullet.damage, pos, rot);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        const path = transformPath(rifleBulletPath, this.pos, this.vel.normalize());
        ctx.strokeStyle = 'hsl(20 100 65)';
        ctx.lineWidth = 0.2;
        ctx.stroke(path);
        ctx.fillStyle = 'hsl(40 100 80)';
        ctx.fill(path);
    }
}

const a = 1;
const riflePath = new Path2D();
riflePath.arc(0, 0, 0.2, -a, a);

export class Rifle extends Weapon {
    static spread = 0.02;
    static cooldown = 0.25;

    constructor() {
        super(Rifle.cooldown);
    }

    /**
     * @param {Vec2} pos
     * @param {Vec2} lookDir
     * @returns {Bullet[]}
     */
    getBullets(pos, lookDir) {
        this.timeSinceUse = 0;

        const deviation = Rifle.spread * random(-1, 1);
        let dir = lookDir.cmul(rot2(deviation));
        let spawnPos = pos.addScaled(lookDir, 0.5);
        const bullet = new RifleBullet(spawnPos, dir);
        return [bullet];
    }
}

export class ShotgunBullet extends Bullet {
    static radius = 0.075;
    static speed = 10;
    static damage = 10;

    /**
     * @param {Vec2} pos
     * @param {Vec2} rot
     */
    constructor(pos, rot) {
        super(ShotgunBullet.radius, ShotgunBullet.speed, ShotgunBullet.damage, pos, rot);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.beginPath();
        const head = vec2(this.pos.x, this.pos.y);
        const tail = head.addScaled(this.vel, -2 / this.speed);
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(tail.x, tail.y);
        const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
        gradient.addColorStop(0, 'hsl(10 100 70)');
        gradient.addColorStop(0.2, 'hsl(20 80 60 / 0.5)');
        gradient.addColorStop(1, 'hsl(20 80 60 / 0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.1;
        ctx.stroke();
    }
}

export class Shotgun extends Weapon {
    static cooldown = 1;
    static spread = 0.4;
    static bulletCount = 15;

    constructor() {
        super(Shotgun.cooldown);
    }

    /**
     * @param {Vec2} pos
     * @param {Vec2} lookDir
     * @returns {Bullet[]}
     */
    getBullets(pos, lookDir) {
        this.timeSinceUse = 0;

        const bullets = [];

        const spawnPosOffset = lookDir.cmul(rot2(ETA));
        for (let i = 0; i < Shotgun.bulletCount; i++) {
            const deviation = Shotgun.spread * random(-1, 1);
            const verticalOffset = 0.5 * random(-1, 1);
            const dir = lookDir.cmul(rot2(deviation));
            const spawnPos = pos.addScaled(lookDir, 0.5 + verticalOffset).addScaled(spawnPosOffset, deviation);
            const bullet = new ShotgunBullet(spawnPos, dir);
            bullets.push(bullet);
        }
        return bullets;
    }
}

export class Swipe extends MeleeAttack {
    static lifetime = 0.2;
    static ext = vec2(4, 3);
    static pushback = 3;
    static damage = 15;

    /**
     * @param {Vec2} pos
     * @param {Vec2} rot
     */
    constructor(pos, rot) {
        super(Swipe.lifetime, new Rect(pos.clone(), Swipe.ext.clone(), rot.clone()), Swipe.damage, Swipe.pushback);
        this.color1 = 'hsl(200 30 90 / 0)';
        this.color2 = 'hsl(200 50 80 / 1)';
        this.continuousFire = false;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        assert(this.collider instanceof Rect);
        const { pos, ext, rot } = this.collider;

        let t = clamp(this.lifetime / this.totalLifetime);
        t = 1 - t ** 5;
        const a = pos.addScaled(rot, -ext.x);
        const b = pos.addScaled(rot, ext.x);
        ctx.fillStyle = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        ctx.fillStyle.addColorStop(0, this.color1);
        ctx.fillStyle.addColorStop(t * 0.9, this.color2);
        ctx.fillStyle.addColorStop(t, this.color1);
        ctx.fillStyle.addColorStop(1, this.color1);

        const basePath = new Path2D();
        basePath.moveTo(ext.x, ext.y);
        basePath.lineTo(-ext.x, ext.y);
        basePath.lineTo(-ext.x, -ext.y);
        basePath.lineTo(ext.x, -ext.y);
        basePath.closePath();
        const path = transformPath(basePath, pos, rot);

        // ctx.fillStyle = 'rgb(255 0 0 / 0.1)';
        ctx.globalCompositeOperation = 'multiply';
        ctx.fill(path);
        ctx.globalCompositeOperation = 'source-over';
        // ctx.lineWidth = 0.02;
        // ctx.strokeStyle = 'red';
        // ctx.stroke(path);
    }
}

export class Dagger extends Weapon {
    static cooldown = Swipe.lifetime;

    constructor() {
        super(Dagger.cooldown);
        this.continuousFire = false;
    }

    /**
     * @param {Vec2} pos
     * @param {Vec2} lookDir
     */
    getMelee(pos, lookDir) {
        this.timeSinceUse = 0;
        return [new Swipe(pos.addScaled(lookDir, 0.8), lookDir)];
    }
}

// export class SmallExplosion extends MeleeAttack {
//     static lifetime = 0.5;
//     static radius = 0.5;
//     static damage = 35;

//     constructor(pos) {
//         super(SmallExplosion.lifetime, new Ball(pos, SmallExplosion.radius), SmallExplosion.pushback, SmallExplosion.damage);
//     }
// }
