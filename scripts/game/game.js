import { Camera } from '../camera.js';
import { canvas, ctx } from '../canvas.js';
import { collideBallRect, Rect } from '../lib/collision.js';
import { vec2 } from '../lib/vec2.js';
import { screens } from '../screens.js';
import { Enemy, Grunt, Gunner, Sentry } from './enemies.js';
import { Player } from './player.js';
import { drawBackground, drawNewWaveMessage, drawUI } from './rendering.js';
import { Wall } from './wall.js';
import { Bullet, MeleeAttack } from './weapon.js';

export class Game {
    constructor() {
        this.isTicking = true;
        this.lastFrameTimestamp = 0;
        this.gameOver = false;

        // input
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
        };
        this.rawMouse = vec2();
        this.mouse = vec2();
        this.lmbDown = false;

        /** @type {null | Enemy} */
        this.focus = null;

        this.camera = new Camera(vec2(12.5, 0), 1);

        this.player = new Player(vec2(12.5, 0), this.keys, this.mouse);

        /** @type {Wall[]} */
        this.walls = [];

        {
            const b = 5;
            const a = 25 + b;
            this.walls.push(
                new Wall(new Rect(vec2(-a, 0), vec2(b, a + b))),
                new Wall(new Rect(vec2(a, 0), vec2(b, a + b))),
                new Wall(new Rect(vec2(0, -a), vec2(a + b, b))),
                new Wall(new Rect(vec2(0, a), vec2(a + b, b))),

                new Wall(new Rect(vec2(0, 15), vec2(10, 1))),
                new Wall(new Rect(vec2(0, -15), vec2(10, 1))),
                new Wall(new Rect(vec2(0, 0), vec2(1, 10))),
            );
        }

        /** @type {Bullet[]} */
        this.playerBullets = [];
        /** @type {Bullet[]} */
        this.enemyBullets = [];

        /** @type {MeleeAttack[]} */
        this.playerMelee = [];
        /** @type {MeleeAttack[]} */
        this.enemyMelee = [];

        /** @type {Enemy[]} */
        this.enemies = [];
        /** @type {Enemy[]} */
        this.deadEnemies = [];

        this.wave = 0;
        this.startingNewWave = false;
        this.timeSinceNewWave = 0;
        this.newWaveDelay = 5;
    }

    startTick() {
        requestAnimationFrame(timestamp => {
            this.lastFrameTimestamp = timestamp;
            requestAnimationFrame(timestamp => {
                this.ticking = true;
                this.tick(timestamp);
            });
        });
    }

    stopTick() {
        this.ticking = false;
    }

    /** @param {number} timestamp */
    tick(timestamp) {
        const dt = (timestamp - this.lastFrameTimestamp) / 1000;
        // const dt = 1 / 500;
        this.lastFrameTimestamp = timestamp;

        const substepCount = 4;
        for (let i = 0; i < substepCount; i++) {
            this.update(dt / substepCount);
        }

        this.render(dt);

        if (this.isTicking) {
            requestAnimationFrame(timestamp => this.tick(timestamp));
        }
    }

    /** @param {number} dt */
    update(dt) {
        if (this.player.health < 0) {
            if (!this.gameOver) {
                selector('#wave').textContent = `${this.wave}`;
                setTimeout(() => {
                    screens.setActive(screens.gameover);
                }, 1000);
            }
            this.gameOver = true;
        }

        if (this.gameOver) return;
        if (this.enemies.length === 0) {
            if (!this.startingNewWave) {
                this.startingNewWave = true;
                this.timeSinceNewWave = 0;
                this.player.health = this.player.maxHealth;
            }
            this.timeSinceNewWave += dt;
            if (this.timeSinceNewWave > this.newWaveDelay) {
                this.startNewWave();
            }
        }

        // camera
        this.camera.targetCenter.Copy(this.player.pos);
        const shift = this.player.pos.sub(this.focus ? this.focus.pos : this.mouse);
        if (!this.focus) shift.Div(10);
        let length = shift.len();
        shift.Sign().Mul(tanh(length / 4) * 4);
        this.camera.targetCenter.Sub(shift);
        this.camera.update(dt);

        // mouse
        this.mouse.Copy(this.rawMouse);
        this.camera.ScreenToWorld(canvas, this.mouse);

        // focus
        this.updateFocus();

        // weapons
        for (const weapon of this.player.weapons) weapon.update(dt);
        if (this.lmbDown) this.tryUseWeapon(false);

        // bullets
        for (const bullet of this.playerBullets) bullet.update(dt);
        for (const bullet of this.enemyBullets) bullet.update(dt);
        for (const melee of this.playerMelee) melee.update(dt);
        for (const melee of this.enemyMelee) melee.update(dt);

        // pawns
        this.player.update(dt);
        for (const enemy of this.enemies) {
            enemy.update(dt, this.player, this.walls);
            this.enemyBullets.push(...enemy.bullets);
            this.enemyMelee.push(...enemy.meleeAttacks);
            enemy.bullets = [];
            enemy.meleeAttacks = [];
        }

        // collision
        for (const wall of this.walls) {
            this.player.collideWall(wall);

            for (const enemy of this.enemies) enemy.collideWall(wall);

            for (const bullet of this.playerBullets) bullet.collideWall(wall);
            for (const bullet of this.enemyBullets) bullet.collideWall(wall);
        }

        for (const [pawn1, pawn2] of pairs([this.player, ...this.enemies])) {
            pawn1.collidePawn(pawn2);
        }

        // bullets damage

        for (const enemy of this.enemies) {
            for (const bullet of this.playerBullets) bullet.collidePawn(enemy);
            for (const melee of this.playerMelee) melee.collidePawn(enemy);

            enemy.damageInfos = [];
        }

        for (const bullet of this.enemyBullets) bullet.collidePawn(this.player);
        for (const melee of this.enemyMelee) melee.collidePawn(this.player);
        this.player.damageInfos = [];

        this.playerBullets = this.playerBullets.filter(bullet => bullet.alive);
        this.enemyBullets = this.enemyBullets.filter(bullet => bullet.alive);
        this.playerMelee = this.playerMelee.filter(melee => melee.alive);
        this.enemyMelee = this.enemyMelee.filter(melee => melee.alive);

        this.enemyBullets = this.enemyBullets.filter(bullet => this.playerMelee.every(melee => null == collideBallRect(bullet.collider, melee.collider)));

        this.deadEnemies.push(...this.enemies.filter(enemy => !enemy.alive));
        this.enemies = this.enemies.filter(enemy => enemy.alive);
    }

    startNewWave() {
        this.startingNewWave = false;
        let enemyCount = 8 + 3 * this.wave;

        while (this.enemies.length < enemyCount) {
            let pos = vec2(random(-25, 25), random(-25, 25));
            /** @type {Grunt | Gunner | Sentry} */
            let enemy = new Grunt(pos);

            if (2 * random() < 1 - 1 / (this.wave + 1)) {
                enemy = new Gunner(pos);
            }
            const minSentry = 2;
            if (5 * random() < max(0, 1 / minSentry - 1 / (this.wave + 1))) {
                enemy = new Sentry(pos);
            }

            if (enemy.collider.dist(this.player.pos) < 8) continue;
            if (this.walls.some(wall => null != collideBallRect(enemy.collider, wall.collider))) continue;

            this.enemies.push(enemy);
        }

        this.wave += 1;
    }

    updateFocus() {
        const defocusDist = 5;
        let focusDist = 0.5;

        if (this.focus && !this.focus.alive) {
            this.focus = null;
            focusDist = defocusDist;
        }

        if (this.focus && this.focus.collider.dist(this.mouse) > defocusDist) this.focus = null;

        let minDist = Infinity;
        for (const enemy of this.enemies) {
            const dist = enemy.collider.dist(this.mouse);
            if (dist < minDist && dist < focusDist) {
                minDist = dist;
                this.focus = enemy;
            }
        }
    }

    /** @param {number} dt */
    render(dt) {
        canvas.clear();
        canvas.transform();
        this.camera.transform(canvas);

        this.player.visualDashesLeft = damp(this.player.visualDashesLeft, this.player.dashesLeft, 30, dt);
        this.player.visualHealth = damp(this.player.visualHealth, this.player.health, 10, dt);

        // if (this.focus) {
        //     ctx.fillStyle = 'blue';
        //     ctx.fillRect(this.focus.pos.x, this.focus.pos.y, 0.1, 0.1);
        // }

        // draw background

        drawBackground(ctx, this.camera, canvas);

        // draw world

        for (const enemy of this.deadEnemies) enemy.updateDead(dt);
        this.deadEnemies = this.deadEnemies.filter(enemy => enemy.timeSinceDeath < enemy.deathAnimDuration);
        for (const enemy of this.deadEnemies) enemy.drawDead(ctx);
        for (const enemy of this.enemies) enemy.draw(ctx);

        for (const bullet of this.playerBullets) bullet.draw(ctx);
        for (const melee of this.playerMelee) melee.draw(ctx);
        this.player.draw(ctx);

        for (const bullet of this.enemyBullets) bullet.draw(ctx);
        for (const melee of this.enemyMelee) melee.draw(ctx);

        for (const wall of this.walls) {
            wall.draw(ctx);
        }

        for (const enemy of this.enemies) enemy.drawTop(ctx);

        // draw overlay

        drawUI(ctx, canvas, this.player);
        if (this.startingNewWave) {
            const t = this.timeSinceNewWave;
            let alpha = clamp((t - 1) * (4 - t));
            drawNewWaveMessage(ctx, `Vague ${this.wave + 1}`, alpha);
        }
    }

    /** @param {boolean} isInitial */
    tryUseWeapon(isInitial) {
        const weapon = this.player.weapons[this.player.weaponIndex];
        if (!isInitial && !weapon.continuousFire) return;
        if (!weapon.canAttack()) return;
        const spawnPos = this.player.pos.addScaled(this.player.look, this.player.collider.radius);
        this.playerBullets.push(...weapon.getBullets(spawnPos, this.player.look));
        this.playerMelee.push(...weapon.getMelee(spawnPos, this.player.look));
    }

    /** @param {KeyboardEvent} e */
    handleKeydown(e) {
        if (e.repeat) return;
        if (e.code === 'KeyW') this.keys.w = true;
        if (e.code === 'KeyA') this.keys.a = true;
        if (e.code === 'KeyS') this.keys.s = true;
        if (e.code === 'KeyD') this.keys.d = true;

        if (e.code === 'Digit1') this.player.weaponIndex = 0;
        if (e.code === 'Digit2') this.player.weaponIndex = 1;
        if (e.code === 'Digit3') this.player.weaponIndex = 2;

        if (e.code === 'Space') this.player.tryDash();
    }

    /** @param {KeyboardEvent} e */
    handleKeyup(e) {
        if (e.code === 'KeyW') this.keys.w = false;
        if (e.code === 'KeyA') this.keys.a = false;
        if (e.code === 'KeyS') this.keys.s = false;
        if (e.code === 'KeyD') this.keys.d = false;
    }

    /** @param {MouseEvent} e */
    handleMousemove(e) {
        this.rawMouse.Set(e.clientX, e.clientY);
    }

    /** @param {MouseEvent} e */
    handleMousedown(e) {
        this.handleMousemove(e);
        this.lmbDown = true;
        this.tryUseWeapon(true);
    }

    /** @param {MouseEvent} e */
    handleMouseup(e) {
        this.lmbDown = false;
    }
}
