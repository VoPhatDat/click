'use strict';
/** G2 ENEMIES: the First Day. Same data format and shared state machine as enemy.js. */
Object.assign(ENEMIES, {
    sleepless: { name: 'Sleepless Angel', ai: 'flyer', body: 'angel', hp: 70, dmg: 13, spd: 3.2, xp: 18, w: 30, h: 44, col: { a: '#d8c8a0', b: '#fff4d8', g: '#ff3a2a' }, atks: [mkA(A.charge, { range: 320, spd: 11, s: 30, a: 30, cd: 140, sfx: 'screech' })] },
    lantern: { name: 'Living Lantern', ai: 'flyer', body: 'lantern', hp: 40, dmg: 22, spd: 2.6, xp: 12, w: 26, h: 30, kamikaze: true, col: { a: '#6a4a24', b: '#ffcf5a', g: '#ffcf5a' }, atks: [] },
    forbidden: { name: 'Forbidden Shadow', ai: 'melee', body: 'human', hp: 110, dmg: 15, spd: 2.8, xp: 22, lightOnly: true, col: { a: '#0c0a12', b: '#1a1624', g: '#ffffff', s: '#0c0a12' }, gear: 'claw', atks: [mkA(A.swipe, { s: 22, range: 76 })] },
    choir: { name: 'Eyeless Chorister', ai: 'ranged', body: 'human', hp: 80, dmg: 12, spd: 1.6, xp: 18, col: { a: '#bba888', b: '#efe2c4', g: '#fff0b0', s: '#e8d8c0' }, gear: 'staff', atks: [mkA(A.ring, { col: '#fff0b0', n: 8, range: 360, spd: 4.6, s: 44, cd: 200, sfx: 'toll' }), mkA(A.shot, { proj: 'orb', col: '#fff0b0', spd: 6, cd: 110 })] },
    dawnwarden: { name: 'Warden of the Unsetting Sun', ai: 'elite', body: 'human', elite: true, hp: 520, dmg: 20, spd: 3.3, xp: 140, poise: 60, scale: 1.2, col: { a: '#a08a5a', b: '#fff0c8', g: '#ffd86b', s: '#e8d0b0' }, gear: 'blade', atks: [mkA(A.swipe, { s: 16 }), mkA(A.charge, { spd: 12, s: 22 }), mkA(A.ring, { col: '#ffd86b', n: 10 })] },
    dummy: { name: 'Training Dummy', ai: 'static', body: 'dummy', hp: 999999, dmg: 0, spd: 0, xp: 0, w: 30, h: 64, col: { a: '#8a6a3a', b: '#d8b878', g: '#d8b878' }, atks: [] }
});

Object.assign(Bodies, {
    angel(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .12) * 3, f = Math.sin(e.anim * .5), tel = e.telegraphing();
        for (const d of [-1, 1]) { c.save(); c.translate(-4, y - 6); c.scale(d, 1); c.rotate(-.6 - f * .5); for (let k = 0; k < 5; k++) Paint.poly(c, [0, 0, 8 + k * 6, -24 - k * 2, 14 + k * 6, -20 - k * 2], k % 2 ? C.b : '#f0e6c8'); c.restore(); }
        Paint.poly(c, [-7, y - 8, 7, y - 8, 12, y + 20, -12, y + 20], C.b);
        Paint.disc(c, 1, y - 15, 7, '#f0dcc0'); Paint.disc(c, 4, y - 16, 3.2, '#ffffff'); Paint.disc(c, 4.5, y - 16, 1.5, tel ? '#ff0000' : C.g);
        c.strokeStyle = Paint.c('#ffd772'); c.lineWidth = 2; c.beginPath(); c.ellipse(0, y - 27, 8, 2.4, 0, 0, TAU); c.stroke();
        if (tel) Paint.glow(c, 0, y, 30, '#ff3a2a');
    },
    lantern(c, e, C) {
        const fuse = e.g2fuse > 0, fk = .8 + Math.sin(e.anim * (fuse ? .9 : .2)) * .2, y = -e.h / 2;
        c.strokeStyle = Paint.c('#5a4020'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, y - 14); c.lineTo(0, y - 40); c.stroke();
        Paint.glow(c, 0, y, 36 * fk + (fuse ? 30 : 0), fuse ? '#ffffff' : C.g);
        c.fillStyle = Paint.c(C.a); c.fillRect(-9, y - 15, 18, 4); c.fillRect(-9, y + 12, 18, 4);
        Paint.disc(c, 0, y, 9 * fk, fuse ? '#ffffff' : C.b);
        c.strokeStyle = Paint.c(C.a); for (const dx of [-8, 0, 8]) { c.beginPath(); c.moveTo(dx, y - 12); c.lineTo(dx * .8, y + 12); c.stroke(); }
        c.fillStyle = Paint.c('#2a1a10'); c.fillRect(-4, y - 3, 2, 2); c.fillRect(2, y - 3, 2, 2);
    },
    dummy(c, e, C) {
        const wob = e.flash > 0 ? Math.sin(e.anim * 2) * .15 : 0; c.save(); c.rotate(wob);
        c.fillStyle = Paint.c('#6a4a2a'); c.fillRect(-3, -64, 6, 64); c.fillRect(-24, -48, 48, 5);
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(0, -40, 13, 20, 0, 0, TAU); c.fill(); Paint.disc(c, 0, -66, 10, C.b); c.restore();
    }
});

/* Lanterns drift at you, light a fuse you can see, and burst. Dummies heal instantly. */
(function () {
    const chase = Enemy.prototype.chase;
    Enemy.prototype.chase = function (spd, dist, dx, dy) {
        if (this.def.kamikaze) {
            if (this.g2fuse > 0) { this.vx *= .85; this.vy *= .85; return; }
            const P = G.player, a = Math.atan2(P.y - 34 - this.y, P.x - this.x);
            this.vx += Math.cos(a) * .12 * spd; this.vy += Math.sin(a) * .12 * spd; this.facing = U.sign(dx);
            if (dist < 80) {
                this.g2fuse = 44; Sound.at('charge', this.x, { v: .5 });
                Combat.warn({ shape: 'circle', x: this.x, y: this.y - this.h / 2, r: 92, t: 44, dmg: this.dmg, src: this, col: '#ffcf5a', onFire: () => { if (this.dead) return; G.flash = .35; Sound.at('explode', this.x); VFX.ring(this.x, this.y - this.h / 2, 100, '#fff0a0', 18, 8); this.hp = 0; this.die({ dir: 0 }); } });
            }
            return;
        }
        return chase.call(this, spd, dist, dx, dy);
    };
    const upd = Enemy.prototype.update;
    Enemy.prototype.update = function () { if (this.g2fuse > 0) this.g2fuse--; if (this.type === 'dummy') { this.hp = this.maxHp; this.vx = 0; this.anim++; if (this.flash > 0) this.flash--; return; } upd.call(this); };
    const draw = Enemy.prototype.draw;
    Enemy.prototype.draw = function (ctx) {
        if (this.def.lightOnly && !this.dead) { Paint.glow(ctx, this.x, this.y - this.h / 2, 40, '#000000'); }
        draw.call(this, ctx);
        if (this.marks) for (let i = 0; i < this.marks; i++) { ctx.fillStyle = '#c084fc'; ctx.fillRect(this.x - 12 + i * 6, this.y - this.h - 22, 4, 7); }
        if (this.g2charm > 0) Paint.glow(ctx, this.x, this.y - this.h - 12, 12, '#b8ff60');
    };
})();
