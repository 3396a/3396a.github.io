import { Color } from '../lib/color.js';
import { vec2, Vec2 } from '../lib/vec2.js';
import { DamageInfo, Pawn } from './pawn.js';
import { Dagger, Rifle, Shotgun, Weapon } from './weapon.js';

export class Player extends Pawn {
    static radius = 0.9;
    static health = 100;
    static mass = 10;

    /**
     * @param {Vec2} pos
     * @param {{ w: boolean; a: boolean; s: boolean; d: boolean }} keys
     * @param {Vec2} mouse
     */
    constructor(pos, keys, mouse) {
        super(pos, Player.radius, Player.health, Player.mass);
        this.meleePushback = 0;

        /** @type {Weapon[]} */
        this.weapons = [new Dagger(), new Rifle(), new Shotgun()];
        this.weaponIndex = 0;

        this.speed = 10;

        this.dashes = 3;
        this.dashesLeft = this.dashes;
        this.dashRechargeSpeed = 0.7;

        this.dashSpeed = 40;
        this.dashDuration = 0.15;
        this.dashImmunityTime = 0.2;
        this.dashCooldown = 0.5;
        this.timeSinceDash = this.dashCooldown;

        this.dashTrailCount = 5;
        this.dashTrail = [];
        this.dashTrailStart = vec2();

        this.keys = keys;
        this.mouse = mouse;

        this.visualHealth = this.health;
        this.visualDashesLeft = this.dashesLeft;
    }

    /** @param {number} dt */
    update(dt) {
        this.timeSinceDash += dt;

        // aim
        this.look.Copy(this.mouse).Sub(this.pos).Normalize();

        // update trail
        if (this.timeSinceDash < this.dashCooldown) {
            let n = floor(min(1, this.timeSinceDash / this.dashImmunityTime) * this.dashTrailCount);
            if (n > this.dashTrail.length) {
                this.dashTrail.push(this.pos.clone());
            }
        } else {
            this.dashTrail = [];
        }
        // movement
        if (this.timeSinceDash < this.dashDuration) {
            // dashing
        } else {
            this.dashesLeft += this.dashRechargeSpeed * dt;
            this.dashesLeft = min(this.dashes, this.dashesLeft);
            const inputDir = vec2(+this.keys.d - +this.keys.a, +this.keys.s - +this.keys.w)
                .Sign()
                .Mul(this.speed);
            this.vel.Damp(inputDir, 20, dt);
        }
        this.pos.AddScaled(this.vel, dt);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    draw(ctx) {
        ctx.lineWidth = 0.1;

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);

        const baseColor = new Color(0, 0, 0);
        const dashColor = new Color(100, 130, 250);
        let dashFactor = 1 - min(1, max(0, this.timeSinceDash - this.dashImmunityTime) / (this.dashCooldown - this.dashImmunityTime));
        dashFactor = dashFactor ** 0.2;

        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = baseColor.lerp(dashColor, dashFactor).toString();
        ctx.stroke();

        // draw trail
        for (let i = 0; i < this.dashTrail.length; i++) {
            dashColor.a = 1 - (this.dashTrail.length - i) / (1 + this.dashTrailCount);

            dashColor.a *= 1 - max(0, this.timeSinceDash - this.dashDuration) / (this.dashCooldown - this.dashDuration);
            ctx.strokeStyle = dashColor.toString();
            ctx.beginPath();
            ctx.arc(this.dashTrail[i].x, this.dashTrail[i].y, this.collider.radius - ctx.lineWidth / 2, 0, TAU);
            ctx.stroke();
        }
    }

    tryDash() {
        if (this.timeSinceDash < this.dashCooldown) return;
        if (this.dashesLeft < 1) return;
        this.timeSinceDash = 0;
        this.dashesLeft -= 1;
        this.vel.Normalize().Mul(this.dashSpeed);
        this.dashTrailStart.Copy(this.pos);
    }

    /** @param {DamageInfo} damage */
    takeDamage(damage) {
        if (this.timeSinceDash < this.dashImmunityTime) return;
        super.takeDamage(damage);
    }
}
