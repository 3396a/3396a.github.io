import { raycastRect, Rect, segmentOverlapsRect } from '../lib/collision.js';
import { Color } from '../lib/color.js';
import { rot2, vec2, Vec2 } from '../lib/vec2.js';
import { Pawn } from './pawn.js';
import { Wall } from './wall.js';
import { Bullet, MeleeAttack, Swipe } from './weapon.js';

// ==============================
// Base classes
//

export class Enemy extends Pawn {
    /**
     * @param {Vec2} pos
     * @param {number} radius
     * @param {number} maxHealth
     * @param {Number} mass
     * @param {Number} deathAnimDuration
     */
    constructor(pos, radius, maxHealth, mass, deathAnimDuration) {
        super(pos, radius, maxHealth, mass);

        this.timeSinceDeath = 0;
        this.deathAnimDuration = deathAnimDuration;

        /** @type {Bullet[]} */
        this.bullets = [];
        /** @type {MeleeAttack[]} */
        this.meleeAttacks = [];
    }

    /**
     * @param {number} dt
     * @param {Pawn} player
     * @param {Wall[]} walls
     */
    update(dt, player, walls) {}

    /** @param {number} dt */
    updateDead(dt) {
        this.timeSinceDeath += dt;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    drawDead(ctx) {}
}

/**
 * @param {Pawn} pawn1
 * @param {Pawn} pawn2
 * @param {Wall[]} walls
 */
function canSee(pawn1, pawn2, walls) {
    for (const wall of walls) {
        if (segmentOverlapsRect(pawn1.pos, pawn2.pos, wall.collider)) return false;
    }
    return true;
}

//

//

// ==============================
// Actual enemy definitions
//

export class SmallSwipe extends Swipe {
    static lifetime = 0.5;
    static ext = vec2(0.5, 1);
    static pushback = 3;
    static damage = 5;

    /**
     * @param {Vec2} pos
     * @param {Vec2} rot
     */
    constructor(pos, rot) {
        super(pos, rot);
        this.lifetime = SmallSwipe.lifetime;
        this.totalLifetime = SmallSwipe.lifetime;
        this.collider.ext.Copy(SmallSwipe.ext);
        this.pushback = SmallSwipe.pushback;
        this.damage = SmallSwipe.damage;
        this.color1 = 'hsl(200 5 85 / 0)';
        this.color2 = 'hsl(200 20 75 / 1)';
    }
}

export class Grunt extends Enemy {
    static radius = 0.8;
    static health = 80;
    static mass = 1;
    static deathAnimDuration = 1;

    /** @param {Vec2} pos */
    constructor(pos) {
        super(pos, Grunt.radius, Grunt.health, Grunt.mass, Grunt.deathAnimDuration);
        this.speed = 4;
        this.seesPlayer = false;
        this.wanderCooldown = 1;
        this.timeSinceWander = this.wanderCooldown;
        this.attackCooldown = 1.5;
        this.initialAttackDelay = 0.2;
        this.timeSinceAttack = this.attackCooldown - this.initialAttackDelay;
    }

    /**
     * @param {number} dt
     * @param {Pawn} player
     * @param {Wall[]} walls
     */
    update(dt, player, walls) {
        this.alive &&= this.health > 0;
        this.seesPlayer = canSee(this, player, walls);
        this.timeSinceWander += dt;

        if (this.collider.dist(player.pos) < 1.2) {
            this.timeSinceAttack += dt;
            this.tryAttack();
        } else {
            this.timeSinceAttack = this.attackCooldown - this.initialAttackDelay;
        }

        if (this.seesPlayer) {
            this.look.Copy(player.pos).Sub(this.pos).Normalize();
        } else {
            if (this.timeSinceWander > this.wanderCooldown) {
                this.timeSinceWander = 0;
                this.look.CMul(rot2(PI * random(-1, 1) ** 3));
            }
        }
        this.vel.Damp(this.look, 10, dt);
        this.pos.AddScaled(this.vel, this.speed * dt);
    }

    tryAttack() {
        if (this.timeSinceAttack < this.attackCooldown) return;
        this.timeSinceAttack = 0;
        this.meleeAttacks.push(new SmallSwipe(this.pos.addScaled(this.look, 1), this.look));
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.lineWidth = 0.1;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        ctx.fillStyle = 'rgb(0 0 0 / 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'hsl(0 0 60)';
        ctx.stroke();
    }

    /** @param {CanvasRenderingContext2D} ctx */
    drawDead(ctx) {
        let t = this.timeSinceDeath / this.deathAnimDuration;
        t = clamp(t) ** 0.2;
        ctx.lineWidth = lerp(0.1, 0, t);

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        const a = 1 - t;
        ctx.fillStyle = new Color(0, 0, 0, 0.05 * a).toString();
        ctx.fill();
        ctx.strokeStyle = 'hsl(0 0 60)';
        ctx.stroke();
    }
}

const gunnerBulletPath = new Path2D();
gunnerBulletPath.moveTo(0, 0.1);
gunnerBulletPath.lineTo(0.1, 0);
gunnerBulletPath.lineTo(0, -0.1);
gunnerBulletPath.lineTo(-0.5, 0);
gunnerBulletPath.closePath();
class GunnerBullet extends Bullet {
    static radius = 0.15;
    static speed = 25;
    static damage = 10;

    /**
     * @param {Vec2} pos
     * @param {Vec2} rot
     */
    constructor(pos, rot) {
        super(GunnerBullet.radius, GunnerBullet.speed, GunnerBullet.damage, pos, rot);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        const path = transformPath(gunnerBulletPath, this.pos, this.vel.normalize());
        ctx.strokeStyle = 'hsl(260 50 65)';
        ctx.lineWidth = 0.2;
        ctx.stroke(path);
        ctx.fillStyle = 'hsl(240 70 90)';
        ctx.fill(path);
    }
}

const gunnerTopPath = new Path2D();
const gunnerTopPathClip = new Path2D();
{
    const a = 0.5;
    const r = 0.5;
    const y = r * sin(a);
    gunnerTopPath.arc(0, 0, r, a, -a);
    gunnerTopPath.lineTo(1, -y);
    gunnerTopPath.lineTo(1, y);
    gunnerTopPath.closePath();

    gunnerTopPathClip.rect(-1.5, -1.5, 3, 3);
    gunnerTopPathClip.addPath(gunnerTopPath);
}

export class Gunner extends Enemy {
    static radius = 1;
    static health = 120;
    static mass = 5;
    static deathAnimDuration = 1;

    /** @param {Vec2} pos */
    constructor(pos) {
        super(pos, Gunner.radius, Gunner.health, Gunner.mass, Gunner.deathAnimDuration);
        this.speed = 4;
        this.seesPlayer = false;
        this.wanderCooldown = 1;
        this.wanderDir = rot2();
        this.timeSinceWander = this.wanderCooldown;
        this.attackCooldown = 1;
        this.initialAttackDelay = 1.5;
        this.timeSinceAttack = this.attackCooldown - this.initialAttackDelay;
    }

    /**
     * @param {number} dt
     * @param {Pawn} player
     * @param {Wall[]} walls
     */
    update(dt, player, walls) {
        this.alive &&= this.health > 0;
        this.seesPlayer = canSee(this, player, walls);
        this.timeSinceWander += dt;
        this.timeSinceAttack += dt;

        if (this.seesPlayer) {
            // turn around
            this.wanderDir.Copy(player.pos).Sub(this.pos).Normalize();
            this.look.Damp(this.wanderDir, 30, dt).Normalize();

            // attack if possible
            if (this.pos.dist(player.pos) < 15) {
                this.tryAttack();
            } else this.timeSinceAttack = this.attackCooldown - this.initialAttackDelay;
        } else if (this.timeSinceWander > this.wanderCooldown) {
            // wander when not seeing
            this.timeSinceWander = 0;
            this.wanderDir.CMul(rot2(PI * random(-1, 1) ** 3));
        }

        // move unless too close
        if (!this.seesPlayer || this.pos.dist(player.pos) > 5) {
            this.look.Damp(this.wanderDir, 30, dt).Normalize();
            this.vel.Damp(this.look, 10, dt);
            this.pos.AddScaled(this.vel, this.speed * dt);
        }
    }

    tryAttack() {
        if (this.timeSinceAttack < this.attackCooldown) return;
        this.timeSinceAttack = 0;
        this.bullets.push(new GunnerBullet(this.pos.addScaled(this.look, 1), this.look));
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.lineWidth = 0.1;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        ctx.fillStyle = 'hsl(330 50 30 / 0.1)';
        ctx.save();
        ctx.clip(transformPath(gunnerTopPathClip, this.pos, this.look), 'evenodd');
        ctx.fill();
        ctx.strokeStyle = 'hsl(330 20 60)';
        ctx.stroke();
        ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx */
    drawTop(ctx) {
        const path = transformPath(gunnerTopPath, this.pos, this.look);
        ctx.fillStyle = 'white';
        ctx.fill(path);
        ctx.strokeStyle = 'hsl(330 50 30)';
        ctx.lineJoin = 'round';
        ctx.stroke(path);
        ctx.lineJoin = 'miter';
    }

    /** @param {CanvasRenderingContext2D} ctx */
    drawDead(ctx) {
        let t = this.timeSinceDeath / this.deathAnimDuration;
        t = clamp(t) ** 0.2;
        ctx.lineWidth = lerp(0.1, 0, t);
        const a = 1 - t;
        ctx.fillStyle = `hsl(330 50 30 / ${0.05 * a})`;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        ctx.save();
        ctx.clip(transformPath(gunnerTopPathClip, this.pos, this.look), 'evenodd');
        ctx.fill();
        ctx.strokeStyle = 'hsl(320 20 60)';
        ctx.stroke();
        ctx.restore();
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'hsl(320 50 30)';
        ctx.stroke(transformPath(gunnerTopPath, this.pos, this.look));
        ctx.lineJoin = 'miter';
    }
}

class SentryShot extends MeleeAttack {
    static lifetime = 0.5;
    static speed = 25;
    static damage = 30;
    static pushback = 0;

    /**
     * @param {Vec2} pos
     * @param {Vec2} target
     */
    constructor(pos, target) {
        const collider = new Rect(pos.lerp(target, 0.5), vec2(pos.dist(target) / 2, 0), target.sub(pos).Normalize());
        super(SentryShot.lifetime, collider, SentryShot.damage, SentryShot.pushback);
    }

    collidePawn(pawn) {
        // bullets are updated before they are added so this will run once
        if (this.lifetime != this.totalLifetime) return;
        super.collidePawn(pawn);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        assert(this.collider instanceof Rect);
        const { pos, ext, rot } = this.collider;

        const basePath = new Path2D();
        basePath.moveTo(ext.x, ext.y);
        basePath.lineTo(-ext.x, ext.y);
        basePath.lineTo(-ext.x, -ext.y);
        basePath.lineTo(ext.x, -ext.y);
        basePath.closePath();
        const path = transformPath(basePath, pos, rot);

        ctx.fillStyle = 'rgb(255 0 0 / 0.1)';
        ctx.fill(path);
        const t = this.lifetime / this.totalLifetime;
        const th = (sqrt(t) * t) / 0.25;
        ctx.lineWidth = 0.1 * th;
        ctx.strokeStyle = 'red';
        ctx.stroke(path);
    }
}

const sentryTopPath = new Path2D();
const sentryTopPathClip = new Path2D();
{
    const x0 = -0.6;
    const x1 = 0.36;
    const x2 = 0.6;
    const x3 = 1.8;
    const y0 = 0.48;
    const y1 = 0.18;
    sentryTopPath.moveTo(x0, -y0);
    sentryTopPath.lineTo(x1, -y0);
    sentryTopPath.lineTo(x2, -y1);
    sentryTopPath.lineTo(x3, -y1);
    sentryTopPath.lineTo(x3, y1);
    sentryTopPath.lineTo(x2, y1);
    sentryTopPath.lineTo(x1, y0);
    sentryTopPath.lineTo(x0, y0);
    sentryTopPath.closePath();

    sentryTopPathClip.rect(-1.5, -1.5, 3, 3);
    sentryTopPathClip.addPath(sentryTopPath);
}

export class Sentry extends Enemy {
    static radius = 1;
    static health = 160;
    static mass = 5;
    static deathAnimDuration = 1;

    /** @param {Vec2} pos */
    constructor(pos) {
        super(pos, Sentry.radius, Sentry.health, Sentry.mass, Sentry.deathAnimDuration);
        this.speed = 5;
        this.wanderCooldown = 1;
        this.wanderDir = rot2();
        this.timeSinceWander = this.wanderCooldown;

        this.seesPlayer = false;
        this.extraWalkingTime = 0.7;
        this.timeSinceSawPlayer = this.extraWalkingTime;

        this.locked = false;
        this.aboutToShootTime = 2.7;
        this.lockTime = 3;
        this.lockTarget = vec2();
        this.attackCooldown = 1;
        this.timeSinceLocked = 0;
        this.timeSinceAttack = 0;

        this.visualLocked = 0;
    }

    /**
     * @param {number} dt
     * @param {Pawn} player
     * @param {Wall[]} walls
     */
    update(dt, player, walls) {
        this.alive &&= this.health > 0;
        const wasntSeeingPlayerBefore = !this.seesPlayer;
        this.seesPlayer = canSee(this, player, walls);
        this.timeSinceWander += dt;
        this.timeSinceAttack += dt;

        if (this.seesPlayer && wasntSeeingPlayerBefore) {
            this.timeSinceSawPlayer = 0;
        }
        this.timeSinceSawPlayer += dt;

        if (this.timeSinceSawPlayer < this.extraWalkingTime) {
            if (this.pos.dist(player.pos) < 5) {
                this.timeSinceSawPlayer = this.extraWalkingTime;
            }
            this.look.Damp(this.lockTarget.sub(this.pos), 50, dt).Normalize();
            this.vel.Damp(this.look, 20, dt);
            // TODO : find out why this is faster
            this.pos.AddScaled(this.vel, (this.speed * dt) / 3);
        }

        if (this.seesPlayer && this.timeSinceSawPlayer > this.extraWalkingTime) {
            // look at player unless shooting
            if (!(this.locked && (this.timeSinceLocked > this.aboutToShootTime || this.timeSinceAttack < this.attackCooldown))) {
                this.look.Damp(this.lockTarget.sub(this.pos), 30, dt).Normalize();
            }

            // lock
            if (this.timeSinceAttack > this.attackCooldown) {
                if (!this.locked) {
                    this.timeSinceLocked = 0;
                    this.locked = true;
                    this.mass = 1e50;
                }
                if (this.locked) {
                    this.vel.Set(0, 0);
                    this.timeSinceLocked += dt;
                    if (this.timeSinceLocked > this.lockTime) {
                        this.tryAttack(player, walls);
                    }
                }
            }
        } else {
            this.locked = false;
            this.mass = Sentry.mass;
            if (this.timeSinceWander > this.wanderCooldown) {
                this.timeSinceWander = 0;
                this.wanderDir.CMul(rot2(PI * random(-1, 1) ** 3));
            }
            this.look.Damp(this.wanderDir, 20, dt).Normalize();

            this.vel.Damp(this.look, 20, dt);
            this.pos.AddScaled(this.vel, this.speed * dt);
        }

        this.lockTarget.Damp(player.pos, 40, dt);
        this.visualLocked = damp(this.visualLocked, +this.locked, 50, dt);
    }

    /**
     * @param {Pawn} player
     * @param {Wall[]} walls
     */
    tryAttack(player, walls) {
        if (this.timeSinceAttack < this.attackCooldown) return;
        if (this.timeSinceLocked < this.lockTime) return;
        this.timeSinceAttack = 0;
        this.timeSinceLocked = 0;

        const t = this.getLineOfSightEndpoint(1000, walls);
        this.meleeAttacks.push(new SentryShot(this.pos, this.pos.addScaled(this.look, t)));
    }

    /**
     * @param {number} tMin
     * @param {Wall[]} walls
     */
    getLineOfSightEndpoint(tMin, walls) {
        const target = this.pos.add(this.look);
        for (const wall of walls) {
            tMin = min(tMin, raycastRect(this.pos, target, wall.collider));
        }
        return tMin;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.lineWidth = 0.1;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        ctx.save();
        ctx.clip(transformPath(sentryTopPathClip, this.pos, this.look), 'evenodd');
        ctx.fillStyle = 'hsl(60 50 30 / 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'hsl(60 20 60)';
        ctx.stroke();
        ctx.restore();

        if (!this.locked) return;
        if (this.timeSinceLocked > this.aboutToShootTime || this.timeSinceAttack < this.attackCooldown) return;
        const a = 0.5;
        const t = this.timeSinceLocked;
        if (mod(t, a / t) < a / (2 * t)) return;

        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.lockTarget.x, this.lockTarget.y);
        ctx.strokeStyle = 'hsl(240 20 30 / 0.2)';
        ctx.stroke();
    }

    /** @param {CanvasRenderingContext2D} ctx */
    drawTop(ctx) {
        const path = transformPath(sentryTopPath, this.pos, this.look);
        ctx.fillStyle = 'white';
        ctx.fill(path);
        ctx.strokeStyle = 'hsl(240 20 30)';
        ctx.lineJoin = 'round';
        ctx.stroke(path);
        ctx.lineJoin = 'miter';
    }

    /** @param {CanvasRenderingContext2D} ctx */
    drawDead(ctx) {
        let t = this.timeSinceDeath / this.deathAnimDuration;
        t = clamp(t) ** 0.2;
        ctx.lineWidth = lerp(0.1, 0, t);

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        const a = 1 - t;
        ctx.fillStyle = `hsl(60 50 30 / ${0.05 * a})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
        ctx.save();
        ctx.clip(transformPath(sentryTopPathClip, this.pos, this.look), 'evenodd');
        ctx.fill();
        ctx.strokeStyle = 'hsl(60 20 60)';
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = 'hsl(240 20 30)';
        ctx.lineJoin = 'round';
        ctx.stroke(transformPath(sentryTopPath, this.pos, this.look));
        ctx.lineJoin = 'miter';
    }
}
