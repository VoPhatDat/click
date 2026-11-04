'use strict';
/**
 * BOSSES: each attack is a generator, so patterns read like a script and are
 * interruptible by phase changes. Telegraphs always precede damage.
 */
class Boss {
    constructor(def, x, y) {
        this.def = def; this.boss = true; this.x = x; this.y = y; this.w = def.w; this.h = def.h; this.vx = 0; this.vy = 0;
        this.maxHp = this.hp = Math.round(def.hp * Game.diff.bossHp); this.dmgK = Game.diff.enemyDmg;
        this.facing = -1; this.phase = 0; this.flash = 0; this.anim = 0; this.name = def.name; this.title = def.title;
        this.dmgTakenMult = 1; this.script = null; this.pending = null; this.intro = true; this.bag = []; this.untargetable = true; this.hbar = 0; this.col = def.col;
        Object.assign(this, def.init ? def.init(this) : {});
    }
    box() { return this.def.box ? this.def.box(this) : { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    aim() { return this.def.aim ? this.def.aim(this) : { x: this.x, y: this.y - this.h * .6 }; }
    D(n) { return n * this.dmgK; }
    get P() { return G.player; }
    get A() { return G.arena; }
    stagger() { }
    start() { this.intro = false; this.untargetable = false; this.script = new Script(this.brain()); if (this.def.parts) this.def.parts(this).forEach(p => G.enemies.push(p)); }
    *brain() {
        for (; ;) {
            if (!this.bag.length) { this.bag = this.def.phases[this.phase].moves.slice().sort(() => Math.random() - .5); }
            const m = this.bag.pop();
            if (this.def.beforeMove) yield* this.def.beforeMove(this);
            yield* this.def.moves[m](this);
            yield Math.round((this.def.phases[this.phase].rest || 40) * Game.diff.aiDelay);
        }
    }
    hurt(dmg, o) {
        if (this.dead || this.untargetable) return 0;
        dmg = Math.max(1, Math.round(dmg * this.dmgTakenMult * (this.shred > 0 ? 1.15 : 1)));
        this.hp -= dmg; this.flash = 5;
        VFX.text(this.aim().x + U.rand(-30, 30), this.aim().y - 40, String(dmg), o.crit ? '#ffdd33' : '#ffffff', o.crit ? 24 : 17);
        Save.run.damageDealt += dmg;
        const next = this.def.phases[this.phase + 1];
        if (next && this.hp <= this.maxHp * next.at && !this.pending) { this.pending = this.phase + 1; this.hp = Math.max(this.hp, 1); }
        if (this.hp <= 0 && !this.def.phases[this.phase + 1]) { this.hp = 0; this.beginDeath(); }
        else if (this.hp <= 0) this.hp = 1;
        return dmg;
    }
    beginDeath() {
        if (this.dead) return;
        this.dead = true; this.untargetable = true; this.script = null; G.warns = []; G.projs = G.projs.filter(p => p.friendly);
        G.enemies.filter(e => !e.boss).forEach(e => { if (!e.dead) { e.hp = 0; e.die({ dir: 0 }); } });
        G.runScript(this.def.death ? this.def.death(this) : Boss.genericDeath(this));
    }
    static *genericDeath(b) {
        G.lockInput = true; G.slowmo = 60; Music.stop(1.5); G.cineCam = { x: b.aim().x, y: b.aim().y, zoom: 1.25 }; G.letterbox = 1;
        for (let i = 0; i < 20; i++) { const a = b.aim(); VFX.burst(a.x + U.rand(-b.w / 2, b.w / 2), a.y + U.rand(-b.h / 2, b.h / 2), b.col, 22, 8, 30, 8, 1); Sound.sfx('explode', { v: .7 }); G.addShake(8); yield 9; }
        G.flash = 1; Sound.sfx('bigboom'); b.gone = true; G.addShake(24); yield 50;
        G.cineCam = null; G.letterbox = 0; G.lockInput = false;
        Game.onBossDefeated(b.def);
    }
    update() {
        this.anim++; if (this.flash > 0) this.flash--; if (this.shred > 0) this.shred--; this.hbar = U.lerp(this.hbar, this.hp / this.maxHp, .08);
        if (this.dead) { if (this.def.tick) this.def.tick(this); return; }
        if (this.pending !== null && !this.transition) {
            const n = this.pending; this.pending = null; this.phase = n; this.bag = []; G.warns = [];
            G.projs = G.projs.filter(p => p.friendly); this.transition = true; this.untargetable = true;
            this.script = new Script(this.phaseChange(n));
            if (n === this.def.phases.length - 1) Music.setState('critical');
        }
        if (this.script) { this.script.step(); }
        if (this.def.tick) this.def.tick(this);
    }
    *phaseChange(n) {
        const ph = this.def.phases[n];
        if (ph.enter) yield* ph.enter(this);
        else {
            Sound.sfx('roar'); G.addShake(16); G.flash = .5; VFX.ring(this.aim().x, this.aim().y, 360, this.col, 30, 12);
            yield 60;
        }
        if (ph.say) G.say(ph.say[0], ph.say[1], 170);
        this.transition = false; this.untargetable = false;
        this.script = new Script(this.brain());
    }
    draw(ctx) { if (!this.gone) this.def.draw(ctx, this); }
    /* Shared attack helpers */
    *moveTo(x, y, frames, ease = U.easeInOut) {
        const sx = this.x, sy = this.y;
        for (let i = 1; i <= frames; i++) { const k = ease(i / frames); this.x = U.lerp(sx, x, k); this.y = U.lerp(sy, y, k); yield 1; }
    }
    /** Sustained beam: damage is resolved against the player's core box each tick. */
    beamHits(x, y, ang, len, w) {
        const p = this.P, dx = p.x - x, dy = p.y - 32 - y, cx = Math.cos(ang), sy = Math.sin(ang), along = dx * cx + dy * sy, off = Math.abs(-dx * sy + dy * cx);
        return along > 0 && along < len && off < w / 2 + 8;
    }
    fallRock(x, delay, dmg, kind = 'rock', r = 16) {
        const y = this.A.y;
        Combat.warn({ shape: 'rect', x: x - r * 1.6, y: y - 60, w: r * 3.2, h: 60, t: delay });
        G.delay(delay - 22, () => Combat.shoot(this, kind, x, y - 22 * 22, 0, 22, { absDmg: dmg, r, ghost: true, life: 22, col: this.col, onDie: pr => { VFX.dust(pr.x, y, 8, G.level.theme.dust); Sound.at('slam', pr.x, { v: .4 }); } }));
    }
}

/** Extra hit zone sharing the boss's health, so melee operators always have something to reach. */
class BossPart {
    constructor(b, get, w, h, mult) { this.b = b; this.get = get; this.w = w; this.h = h; this.mult = mult; this.boss = true; this.part = true; this.facing = 0; this.x = 0; this.y = 0; this.update(); }
    get dead() { return this.b.dead; }
    get gone() { return this.b.gone; }
    get untargetable() { return this.b.untargetable; }
    update() { const p = this.get(this.b); this.x = p.x; this.y = p.y; }
    box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    aim() { return { x: this.x, y: this.y - this.h / 2 }; }
    hurt(d, o) { return this.b.hurt(d * this.mult, o); }
    draw() { }
}

/* ============================ ATLAS-9 (MAP 1) ============================ */
const B_ATLAS = {
    id: 'atlas', name: 'ATLAS-9', title: 'THE LAST TRUMPET', hp: 4000, w: 150, h: 230, col: '#ffdd33',
    music: 'boss', reward: { xp: 500, relic: 'gyro', cells: 120 },
    init: () => ({ legA: 0, armUp: 0, cannon: 0, plating: 1 }),
    aim: b => ({ x: b.x, y: b.y - (b.phase === 2 ? 130 : 150) }),
    box: b => ({ x: b.x - 62, y: b.y - 215, w: 124, h: 215 }),
    phases: [
        { moves: ['stomp', 'missiles', 'sweep', 'stomp', 'charge'], rest: 50 },
        {
            at: .62, moves: ['stomp', 'missiles', 'sweep', 'drones', 'charge', 'debris'], rest: 36, say: ['ATLAS-9', 'EVACUATION WINDOW EXPIRED. CLEARING ALL REMAINING OBSTRUCTIONS.'],
            enter: function* (b) { Sound.sfx('mech'); G.addShake(14); VFX.burst(b.x, b.y - 150, '#ffdd33', 30, 9, 30, 8, 1); b.armUp = 1; yield 50; G.flash = .4; Sound.sfx('roar'); yield 30; }
        },
        {
            at: .26, moves: ['sweep2', 'stomp', 'missiles', 'charge', 'debris'], rest: 22, say: ['ATLAS-9', 'THIS CITY. IS. CLOSED.'],
            enter: function* (b) { for (let i = 0; i < 6; i++) { VFX.debris(b.x + U.rand(-60, 60), b.y - 150, 60, '#6b7686'); Sound.sfx('explode', { v: .6 }); G.addShake(8); yield 12; } b.plating = 0; b.dmgTakenMult = 1.3; yield 30; }
        }
    ],
    moves: {
        *stomp(b) {
            const tx = U.clamp(b.P.x, b.A.x0 + 110, b.A.x1 - 110), dir = U.sign(tx - b.x);
            b.facing = dir; const d = Math.abs(tx - b.x), n = Math.max(20, d / 3.4 | 0);
            for (let i = 0; i < n; i++) { b.x += dir * 3.4; b.legA += .12; if (i % 26 === 0) { Sound.at('slam', b.x, { v: .35 }); G.addShake(2); } yield 1; }
            b.armUp = 1;
            Combat.warn({ shape: 'circle', x: b.x + dir * 90, y: b.A.y - 20, r: 170, t: 42, dmg: b.D(26), src: b, kby: -9 }); yield 42;
            b.armUp = -1; Sound.sfx('slam'); G.addShake(10); VFX.groundWave(b.x + dir * 90, b.A.y, 240, '#ffdd33'); VFX.dust(b.x + dir * 90, b.A.y, 20, '#8a8070');
            [-1, 1].forEach(d2 => Combat.shoot(b, 'wave', b.x + dir * 90, b.A.y - 22, d2 * 7, 0, { absDmg: b.D(14), life: 50, r: 22, pierce: 9 }));
            yield 26; b.armUp = 0;
        },
        *missiles(b) {
            const n = b.phase === 0 ? 5 : 8; b.cannon = 1; Sound.sfx('warn');
            for (let i = 0; i < n; i++) {
                const x = i === 0 ? b.P.x : U.clamp(b.P.x + U.rand(-340, 340), b.A.x0 + 40, b.A.x1 - 40);
                Combat.warn({ shape: 'circle', x, y: b.A.y - 30, r: 70, t: 60, dmg: b.D(18), src: b, onFire: w => { VFX.burst(w.x, w.y, '#ff9040', 16, 6, 24, 7, 1); Sound.at('explode', w.x, { v: .6 }); VFX.groundWave(w.x, b.A.y, 70, '#ff9040'); } });
                G.delay(36, () => { Combat.shoot(b, 'missile', x, b.A.y - 620, 0, 24.6, { absDmg: 0, ghost: true, life: 24, r: 1 }); });
                Sound.sfx('missile', { v: .6 }); VFX.smoke(b.x + 40, b.y - 215, '#777', 3); yield 8;
            }
            yield 30; b.cannon = 0;
        },
        *sweep(b) {
            b.facing = U.sign(b.P.x - b.x); const low = U.chance(.5), y = low ? b.A.y - 46 : b.A.y - 110, dir = b.facing;
            b.cannon = 1; Combat.warn({ shape: 'rect', x: dir > 0 ? b.x : b.A.x0, y: y - 24, w: dir > 0 ? b.A.x1 - b.x : b.x - b.A.x0, h: 48, t: 50, dmg: b.D(24), src: b, onFire: () => { VFX.beam(b.x + dir * 70, y, dir > 0 ? 0 : Math.PI, 1600, 48, '#ffdd33', 18); Sound.sfx('laser'); G.addShake(6); } });
            yield 74; b.cannon = 0;
        },
        *sweep2(b) {
            for (let i = 0; i < 3; i++) { yield* B_ATLAS.moves.sweep(b); }
        },
        *charge(b) {
            const dir = U.sign(b.P.x - b.x) || 1; b.facing = dir; const target = dir > 0 ? b.A.x1 - 90 : b.A.x0 + 90;
            Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 170, w: target - b.x, h: 170, t: 46 }); Sound.sfx('mech'); yield 46;
            let hit = false;
            while (Math.abs(b.x - target) > 12) {
                b.x += dir * 15; b.legA += .3; if (G.time % 3 === 0) VFX.dust(b.x - dir * 50, b.A.y, 4, '#8a8070');
                if (!hit && U.overlap(b.box(), b.P.hurtBox)) { hit = true; b.P.hurt(b.D(28), { x: b.x, kb: 13, kby: -8 }); }
                yield 1;
            }
            Sound.sfx('slam'); G.addShake(12); yield 28;
        },
        *drones(b) {
            for (let i = 0; i < 2 + b.phase; i++) G.spawn('drone', b.x + U.rand(-200, 200), b.A.y - 340, { spawnIn: true, summoned: true, lock: true, hpMult: .7 });
            Sound.sfx('mech'); yield 50;
        },
        *debris(b) {
            G.say('', 'The overpass is coming down!', 70); G.addShake(8); Sound.sfx('distant_boom');
            for (let i = 0; i < 9; i++) { b.fallRock(U.rand(b.A.x0 + 60, b.A.x1 - 60), 56, b.D(18)); yield 7; }
            yield 40;
        }
    },
    draw(c, b) {
        const f = b.flash > 0, D = (x, y, w, h, col) => { c.fillStyle = f ? '#fff' : col; c.fillRect(x, y, w, h); };
        c.save(); c.translate(b.x, b.y); c.scale(b.facing, 1);
        const s = Math.sin(b.legA), H = -14 * Math.abs(s);
        const leg = (x, p) => { const k = p * s * 22, lift = Math.max(0, p * s) * 16; D(x - 16, -112 + H, 32, 50, '#2d323a'); D(x - 12 + k * .5, -66 - lift * .5, 24, 46, '#3a4048'); D(x - 24 + k, -22 - lift, 50, 22, '#23272e'); c.fillStyle = f ? '#fff' : '#ffdd33'; c.fillRect(x - 22 + k, -8 - lift, 46, 3); };
        leg(-34, -1);
        // Torso
        D(-74, -226 + H, 148, 118, '#3a4048');
        D(-74, -226 + H, 148, 12, '#6b7686');
        for (let i = 0; i < 7; i++) { c.fillStyle = f ? '#fff' : i % 2 ? '#ffdd33' : '#1a1a1a'; c.fillRect(-74 + i * 21, -124 + H, 21, 8); }
        if (b.plating) { D(-46, -200 + H, 92, 66, '#2a2f37'); c.fillStyle = '#ffdd33'; c.font = 'bold 22px "Courier New"'; c.textAlign = 'center'; c.fillText('HCD', 0, -158 + H); D(14, -196 + H, 26, 9, '#ff3322'); Paint.glow(c, 27, -192 + H, 26, '#ff3322'); }
        else {
            D(-46, -200 + H, 92, 66, '#0c0c10');
            const p = 26 + Math.sin(b.anim * .3) * 5; Paint.glow(c, 0, -166 + H, p * 2.4, '#ff5522'); Paint.disc(c, 0, -166 + H, p * .7, '#fff0d0');
            c.strokeStyle = '#ff5522'; c.lineWidth = 3; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-74 + i * 37, -226 + H); c.lineTo(-30 + i * 15, -198 + H); c.stroke(); }
        }
        leg(34, 1);
        // Head and evacuation beacon
        D(-26, -254 + H, 52, 30, '#2d323a'); D(-20, -246 + H, 46, 10, '#ffdd33'); Paint.glow(c, 10, -241 + H, 26, '#ffdd33');
        const on = (b.anim >> 4) & 1; D(-5, -266 + H, 10, 12, on ? '#ff3322' : '#551111'); if (on) Paint.glow(c, 0, -262 + H, 34, '#ff3322');
        // Arms
        const au = b.armUp, a = au > 0 ? -2.3 : au < 0 ? .5 : .15 + Math.sin(b.anim * .04) * .06;
        const hx = 86 + Math.sin(a) * 90, hy = -210 + H + Math.cos(a) * 90;
        Paint.limb(c, { x: 80, y: -210 + H }, { x: hx, y: hy }, 26, '#3a4048'); D(hx - 34, hy - 10, 66, 44, '#23272e'); D(hx - 34, hy + 24, 66, 8, '#ffdd33');
        Paint.limb(c, { x: -80, y: -210 + H }, { x: -88, y: -116 + H }, 24, '#2d323a');
        D(-108, -128 + H, 42, 60, '#23272e'); for (let i = 0; i < 3; i++) D(-104 + i * 13, -74 + H, 9, 10, '#14161a');
        D(36, -250 + H, 40, 30, '#23272e'); for (let i = 0; i < 3; i++) { Paint.disc(c, 46 + i * 11, -235 + H, 4, b.cannon ? '#ff9040' : '#14161a'); }
        c.restore();
    }
};

/* =========================== SYLVARIS (MAP 2) ============================ */
const B_SYLV = {
    id: 'sylvaris', name: 'SYLVARIS', title: 'THE ACCURSED TREE OF LIFE', hp: 5600, w: 200, h: 340, col: '#7fffb0',
    music: 'boss', reward: { xp: 800, relic: 'sporeheart', shard: 'g', cells: 180 },
    init: () => ({ eye: 0, sway: 0, arm: 0, open: 0 }),
    aim: b => ({ x: b.x - 10, y: b.y - 230 }),
    box: b => ({ x: b.x - 80, y: b.y - 310, w: 160, h: 310 }),
    phases: [
        { moves: ['rootline', 'vine', 'spores', 'seeds'], rest: 52 },
        { at: .64, moves: ['rootline', 'vine', 'spores', 'seeds', 'brood', 'walls'], rest: 38, say: ['SYLVARIS', '...you carry the ash of the ones who drowned me in light...'] },
        {
            at: .28, moves: ['rootline2', 'vine', 'seeds', 'pull', 'spores'], rest: 22, say: ['SYLVARIS', 'THEN GROW. GROW IN ME FOREVER.'],
            enter: function* (b) { b.open = 1; G.flash = .6; Sound.sfx('roar'); for (let i = 0; i < 40; i++) { VFX.add(b.x + U.rand(-120, 120), b.y - U.rand(0, 320), U.rand(-3, 3), U.rand(-3, 0), '#a0ffda', 36, 9, 1, 0); yield 2; } b.dmgTakenMult = 1.25; }
        }
    ],
    moves: {
        *rootline(b) {
            let x = b.P.x + (b.P.x > (b.A.x0 + b.A.x1) / 2 ? -320 : 320); const dir = U.sign(b.P.x - x);
            for (let i = 0; i < 9; i++) {
                Combat.warn({ shape: 'rect', x: x - 34, y: b.A.y - 150, w: 68, h: 150, t: 26, dmg: b.D(18), src: b, kby: -11, col: '#c8ff5a', onFire: w => { G.pillar(w.x + 34, b.A.y, 150, '#5a7a2c', '#c8ff5a'); Sound.at('crumble', w.x, { v: .6 }); } });
                x += dir * 78; if (x < b.A.x0 + 30 || x > b.A.x1 - 30) break; yield 8;
            }
            yield 34;
        },
        *rootline2(b) { for (let i = 0; i < 3; i++) { const px = b.P.x; for (let k = -1; k <= 1; k++) Combat.warn({ shape: 'rect', x: px + k * 120 - 40, y: b.A.y - 180, w: 80, h: 180, t: 30, dmg: b.D(20), src: b, kby: -12, col: '#c8ff5a', onFire: w => G.pillar(w.x + 40, b.A.y, 180, '#5a7a2c', '#c8ff5a') }); yield 36; } },
        *vine(b) {
            b.arm = 1; const high = U.chance(.3), y = high ? b.A.y - 124 : b.A.y - 52, h = high ? 80 : 54;
            Combat.warn({ shape: 'rect', x: b.A.x0, y, w: b.x - b.A.x0, h, t: 48, dmg: b.D(22), src: b, kb: 9, onFire: () => {
                Sound.sfx('swing_h'); G.addShake(6);
                VFX.effect(18, (c, k) => { c.strokeStyle = '#3e5a26'; c.lineWidth = h * .6 * (1 - k); c.lineCap = 'round'; c.beginPath(); c.moveTo(b.x - 40, y + h / 2); for (let x = b.x; x > b.A.x0; x -= 70) c.lineTo(x, y + h / 2 + Math.sin(x * .04 + k * 20) * 10); c.stroke(); });
            } });
            yield 72; b.arm = 0;
        },
        *spores(b) {
            b.eye = 1; Sound.sfx('squish');
            for (let i = 0; i < 4 + b.phase * 2; i++) {
                const x = U.rand(b.A.x0 + 60, b.x - 150), T = 46, sx = b.x - 40, sy = b.y - 280, vy = (b.A.y - 8 - sy) / T - .5 * .35 * T, vx = (x - sx) / T;
                Combat.shoot(b, 'orb', sx, sy, vx, vy, { absDmg: b.D(14), grav: .35, col: '#9dff40', r: 12, ghost: true, life: T, onDie: pr => { G.fields.push({ kind: 'lavapool', x: pr.x, y: b.A.y, r: 66, t: 0, life: 260, dmg: b.D(5), col: '#9dff40', poison: true }); VFX.ring(pr.x, b.A.y, 70, '#9dff40', 16); } });
                yield 12;
            }
            yield 30; b.eye = 0;
        },
        *seeds(b) {
            b.eye = 1; Combat.warn({ shape: 'circle', x: b.x - 10, y: b.y - 230, r: 62, t: 30, col: '#a0ffda' }); yield 30;
            for (let n = 0; n < 3; n++) {
                const base = Math.atan2(b.P.y - 34 - (b.y - 230), b.P.x - (b.x - 10));
                for (let i = -2; i <= 2; i++) Combat.eshoot(b, 'orb', b.x - 10, b.y - 230, base + i * .17, 7.5, b.D(12), { col: '#a0ffda', r: 8, life: 130, ghost: true });
                Sound.sfx('squish'); yield 22;
            }
            b.eye = 0; yield 20;
        },
        *brood(b) { for (let i = 0; i < 2; i++) G.spawn(U.pick(['thornling', 'stalker']), U.rand(b.A.x0 + 100, b.x - 220), b.A.y, { spawnIn: true, summoned: true, lock: true, hpMult: .7 }); Sound.sfx('roar', { v: .5 }); yield 44; },
        *walls(b) {
            G.say('', 'The roots are closing in. Stay light on your feet.', 80);
            for (let n = 0; n < 2; n++) { const safe = U.randi(0, 4); for (let i = 0; i < 5; i++) { if (i === safe) continue; const w = (b.x - 130 - b.A.x0) / 5, x = b.A.x0 + w * i; Combat.warn({ shape: 'rect', x, y: b.A.y - 210, w: w - 8, h: 210, t: 58, dmg: b.D(22), src: b, kby: -8, col: '#c8ff5a', onFire: wz => G.pillar(wz.x + wz.w / 2, b.A.y, 210, '#5a7a2c', '#c8ff5a', wz.w) }); } yield 86; }
        },
        *pull(b) {
            b.eye = 1; Sound.sfx('roar'); G.say('', 'She is drawing everything in!', 70);
            for (let i = 0; i < 130; i++) {
                if (b.P.state !== 'dodge') b.P.push(U.clamp(b.x - b.P.x, -2.6, 2.6));
                if (i % 2 === 0) { const y = b.A.y - U.rand(20, 300); VFX.add(b.x - 700, y, 9, (b.y - 230 - y) * .012, '#a0ffda', 70, 3, 2, 0); }
                if (i % 18 === 0) Combat.eshoot(b, 'orb', b.x - 10, b.y - 230, Math.PI + U.rand(-.6, .6), 6, b.D(12), { col: '#a0ffda', r: 8, life: 140, ghost: true });
                yield 1;
            }
            b.eye = 0;
        }
    },
    draw(c, b) {
        const f = b.flash > 0, sw = Math.sin(b.anim * .02) * 6, C = (x) => f ? '#fff' : x;
        c.save(); c.translate(b.x, b.y);
        c.fillStyle = C('#2a2016'); c.beginPath(); c.moveTo(-150, 0); c.bezierCurveTo(-80, -70, -100, -210, -80 + sw, -340); c.lineTo(100 + sw, -350); c.bezierCurveTo(120, -200, 110, -70, 190, 0); c.closePath(); c.fill();
        c.strokeStyle = C('#463622'); c.lineWidth = 6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-100 + i * 42, 0); c.bezierCurveTo(-70 + i * 30, -120, -70 + i * 32, -220, -60 + i * 32 + sw, -340); c.stroke(); }
        // Crown and canopy
        for (let i = 0; i < 8; i++) { const a = -Math.PI + i * Math.PI / 7, r = 130 + (i % 3) * 30; Paint.limb(c, { x: 10 + sw, y: -330 }, { x: 10 + sw + Math.cos(a) * r, y: -340 + Math.sin(a) * r * .75 }, 13, C('#2a2016')); c.fillStyle = C(i % 2 ? '#2c4a2a' : '#355c30'); c.beginPath(); c.ellipse(10 + sw + Math.cos(a) * r, -340 + Math.sin(a) * r * .75, 66, 42, a, 0, TAU); c.fill(); }
        // Face
        c.fillStyle = C('#150e08'); c.beginPath(); c.ellipse(-10, -230, 60, 84 + b.open * 30, 0, 0, TAU); c.fill();
        const eyeR = 22 + b.eye * 12 + b.open * 12; Paint.glow(c, -10, -230, eyeR * 3.2, b.open ? '#ff66cc' : '#7fffb0');
        c.fillStyle = C(b.open ? '#ffb0e0' : '#d8ffe8'); c.beginPath(); c.ellipse(-10, -230, eyeR * .7, eyeR, 0, 0, TAU); c.fill();
        const ang = Math.atan2(b.P.y - 30 - (b.y - 230), b.P.x - (b.x - 10)); Paint.disc(c, -10 + Math.cos(ang) * 8, -230 + Math.sin(ang) * 12, eyeR * .36, '#0a1a10');
        for (let i = 0; i < 4; i++) { const t = b.anim * .03 + i * 1.6; Paint.limb(c, { x: -80, y: -120 - i * 34 }, { x: -130 - Math.sin(t) * 22 - b.arm * 30, y: -80 - i * 44 + Math.cos(t) * 18 }, 9, C('#3e5a26')); Paint.disc(c, -130 - Math.sin(t) * 22 - b.arm * 30, -80 - i * 44 + Math.cos(t) * 18, 6, '#c8ff5a'); }
        c.restore();
    }
};

/* ============================ QARETH (MAP 3) ============================= */
const B_QARETH = {
    id: 'qareth', name: 'QARETH', title: 'THE BEAST FROM THE SEA', hp: 6200, w: 130, h: 300, col: '#ffcc55',
    music: 'boss', reward: { xp: 1100, relic: 'scarab', shard: 'r', cells: 220 },
    init: b => ({ out: 1, seg: Array.from({ length: 12 }, () => ({ x: b.x, y: b.y })), colossus: 0, jaw: 0, ang: -Math.PI / 2, storm: false }),
    aim: b => ({ x: b.x, y: b.y }),
    box: b => ({ x: b.x - 72, y: b.y - 72, w: 144, h: 144 }),
    parts: b => [new BossPart(b, x => ({ x: x.seg[4].x, y: x.seg[4].y + 46 }), 96, 92, .65)],
    tick(b) {
        // Segments trail the head, giving a real body to read.
        let px = b.x, py = b.y;
        for (const s of b.seg) { const dx = s.x - px, dy = s.y - py, d = Math.hypot(dx, dy) || 1, gap = 44; s.x = px + dx / d * Math.min(d, gap); s.y = py + dy / d * Math.min(d, gap); px = s.x; py = s.y; }
        if (b.storm) { G.wind = 3.4; if (!b.P.sheltered && b.P.state !== 'dodge') b.P.push(1.5); }
    },
    phases: [
        { moves: ['breach', 'spit', 'breach', 'sweepD'], rest: 30 },
        {
            at: .66, moves: ['breach', 'spit', 'vortex', 'sweepD', 'spit'], rest: 18, say: ['QARETH', 'I WAS THE TIDE. YOU DRANK MY SEA.'],
            enter: function* (b) { b.storm = true; G.storm = 1; G.say('VESPER', 'Sandstorm! Get behind the pillars when the wind peaks.', 100); Ambience.setStorm(.4, 1300); yield 70; }
        },
        {
            at: .3, moves: ['fists', 'twin', 'vortex', 'spit'], rest: 22, say: ['QARETH', 'RISE, DROWNED ONES.'],
            enter: function* (b) { b.colossus = 1; G.flash = .7; Sound.sfx('bigboom'); G.addShake(20); yield 90; b.dmgTakenMult = 1.2; }
        }
    ],
    moves: {
        *under(b, x) { yield* b.moveTo(x, b.A.y + 200, 26); },
        *breach(b) {
            const x = U.clamp(b.P.x + b.P.vx * 18, b.A.x0 + 90, b.A.x1 - 90);
            b.untargetable = true; b.y = b.A.y + 260; b.x = x; yield 14;
            for (let i = 0; i < 12; i++) { if (i % 2 === 0) VFX.dust(x + U.rand(-50, 50), b.A.y, 4, '#d8b070'); Sound.sfx('crumble', { v: .2, gap: .1 }); yield 3; }
            Combat.warn({ shape: 'rect', x: x - 78, y: b.A.y - 560, w: 156, h: 560, t: 34, dmg: b.D(30), src: b, kby: -12 }); yield 30;
            b.untargetable = false; Sound.sfx('roar'); G.addShake(12); VFX.dust(x, b.A.y, 26, '#d8b070'); b.jaw = 1;
            yield* b.moveTo(x, b.A.y - 230, 20, U.easeOut);
            const dir = x < (b.A.x0 + b.A.x1) / 2 ? 1 : -1; b.facing = dir; b.jaw = 0;
            // Exposed apex: the punish window after dodging the eruption.
            for (let i = 0; i < 72; i++) { b.y += Math.sin(i * .09) * .9; yield 1; }
            yield* b.moveTo(x + dir * 340, b.A.y + 240, 34, U.easeIn);
            VFX.dust(b.x, b.A.y, 20, '#d8b070'); Sound.sfx('slam'); G.addShake(8);
            b.untargetable = true; yield 20;
        },
        *spit(b) {
            b.untargetable = false; b.x = b.P.x < (b.A.x0 + b.A.x1) / 2 ? b.A.x1 - 170 : b.A.x0 + 170; b.y = b.A.y + 200;
            yield* b.moveTo(b.x, b.A.y - 130, 26, U.easeOut); b.jaw = 1;
            for (let n = 0; n < 3; n++) {
                const base = Math.atan2(b.P.y - 34 - b.y, b.P.x - b.x);
                Combat.warn({ shape: 'cone', x: b.x, y: b.y, ang: base, r: 760, spread: .6, t: 26 }); yield 26;
                for (let i = 0; i < 9; i++) Combat.eshoot(b, 'orb', b.x, b.y, base + U.rand(-.3, .3), U.rand(8, 13), b.D(11), { col: '#ffcc55', r: 7, life: 90, ghost: true });
                Sound.sfx('fire'); yield 20;
            }
            b.jaw = 0; yield* b.moveTo(b.x, b.A.y + 220, 26, U.easeIn); b.untargetable = true;
        },
        *sweepD(b) {
            const left = U.chance(.5), sx = left ? b.A.x0 - 80 : b.A.x1 + 80, ex = left ? b.A.x1 + 80 : b.A.x0 - 80;
            b.x = sx; b.y = b.A.y - 26; b.facing = left ? 1 : -1;
            Combat.warn({ shape: 'rect', x: b.A.x0, y: b.A.y - 92, w: b.A.x1 - b.A.x0, h: 92, t: 50 }); yield 50; b.untargetable = false;
            let hit = false; const n = 56;
            for (let i = 0; i <= n; i++) { b.x = U.lerp(sx, ex, i / n); b.y = b.A.y - 30 + Math.sin(i * .3) * 16; if (!hit && U.overlap(b.box(), b.P.hurtBox)) { hit = true; b.P.hurt(b.D(26), { x: b.x, kb: 12, kby: -9 }); } if (i % 2 === 0) VFX.dust(b.x, b.A.y, 3, '#d8b070'); yield 1; }
            b.y = b.A.y + 240; b.untargetable = true; yield 14;
        },
        *vortex(b) {
            const cx = (b.A.x0 + b.A.x1) / 2; G.say('', 'Quicksand! Move, or it will pull you under.', 80);
            Combat.warn({ shape: 'rect', x: cx - 230, y: b.A.y - 30, w: 460, h: 30, t: 40, col: '#ffcc55' }); yield 40;
            b.x = cx; b.y = b.A.y + 60; b.untargetable = false; b.jaw = 1;
            for (let i = 0; i < 170; i++) {
                if (b.P.grounded && Math.abs(b.P.x - cx) < 520) b.P.push(U.sign(cx - b.P.x) * 2.4);
                if (Math.abs(b.P.x - cx) < 100 && b.P.y > b.A.y - 26 && i % 20 === 0) b.P.hurt(b.D(10), { tick: true, unblockable: true });
                if (i % 2 === 0) { const a = U.rand(0, TAU), r = U.rand(100, 420); VFX.add(cx + Math.cos(a) * r, b.A.y - 4, -Math.cos(a) * 4, -.5, '#d8b070', 30, 3, 2, 0); }
                if (i % 28 === 0) { const ang = -Math.PI / 2 + U.rand(-.9, .9); Combat.shoot(b, 'rock', cx, b.A.y - 30, Math.cos(ang) * 9, Math.sin(ang) * 15, { absDmg: b.D(14), grav: .32, r: 13, life: 100, ghost: true, col: '#ffcc55' }); }
                b.y = b.A.y + 20 + Math.sin(i * .1) * 10; yield 1;
            }
            b.jaw = 0; yield* b.moveTo(cx, b.A.y + 240, 20, U.easeIn); b.untargetable = true;
        },
        *scarabs(b) { for (let i = 0; i < 3; i++) G.spawn('scarab', b.P.x + U.rand(-300, 300), b.A.y - 320, { spawnIn: true, summoned: true, lock: true, hpMult: .6 }); yield 44; },
        *fists(b) {
            b.x = (b.A.x0 + b.A.x1) / 2; b.y = b.A.y - 170; b.untargetable = false;
            for (let i = 0; i < 4; i++) {
                const x = b.P.x; Combat.warn({ shape: 'rect', x: x - 110, y: b.A.y - 300, w: 220, h: 300, t: 40, dmg: b.D(32), src: b, kby: -11, col: '#ffcc55', onFire: w => { Sound.sfx('slam'); G.addShake(12); VFX.dust(x, b.A.y, 26, '#d8b070'); VFX.groundWave(x, b.A.y, 230, '#ffcc55'); b.fist = { x, t: 22 }; [-1, 1].forEach(d => Combat.shoot(b, 'wave', x, b.A.y - 22, d * 8, 0, { absDmg: b.D(12), life: 40, r: 20, pierce: 9 })); } }); yield 52;
            }
            yield 40;
        },
        *twin(b) {
            b.y = b.A.y - 170; for (let i = 0; i < 3; i++) { const xs = [b.P.x - U.rand(40, 120), b.P.x + U.rand(100, 240)]; xs.forEach(x => Combat.warn({ shape: 'rect', x: x - 60, y: b.A.y - 560, w: 120, h: 560, t: 34, dmg: b.D(24), src: b, kby: -12, col: '#ffcc55', onFire: w => G.pillar(w.x + 60, b.A.y, 560, '#c49a50', '#ffe2a0', 90) })); yield 50; }
        }
    },
    draw(c, b) {
        const f = b.flash > 0, C = x => f ? '#fff' : x;
        if (b.colossus) {
            const cx = (b.A.x0 + b.A.x1) / 2, y = b.A.y;
            c.globalAlpha = .9; c.fillStyle = C('#8a6c3e'); c.beginPath(); c.moveTo(cx - 250, y); c.quadraticCurveTo(cx - 200, y - 240, cx - 90, y - 330); c.lineTo(cx + 90, y - 330); c.quadraticCurveTo(cx + 200, y - 240, cx + 250, y); c.closePath(); c.fill();
            c.fillStyle = C('#b08a4a'); c.beginPath(); c.arc(cx, y - 380, 72, 0, TAU); c.fill(); c.fillStyle = '#1a1208'; c.fillRect(cx - 40, y - 396, 80, 14); Paint.glow(c, cx, y - 390, 60, '#ffcc55'); c.globalAlpha = 1;
            if (b.fist && b.fist.t-- > 0) { c.fillStyle = C('#b08a4a'); c.fillRect(b.fist.x - 100, y - 120, 200, 120); }
        }
        for (let i = b.seg.length - 1; i >= 0; i--) {
            const s = b.seg[i], r = 52 - i * 2.4;
            if (s.y - r > b.A.y + 10) continue;
            Paint.disc(c, s.x, s.y, r, C(i % 2 ? '#7a5c30' : '#a07a42'));
            c.fillStyle = C('#d8b070'); for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(s.x + k * r * .6 - 9, s.y - r * .85); c.lineTo(s.x + k * r * .6, s.y - r * 1.25); c.lineTo(s.x + k * r * .6 + 9, s.y - r * .85); c.fill(); }
        }
        c.save(); c.translate(b.x, b.y);
        const a = b.ang = U.lerp(b.ang, Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x), .08); c.rotate(a);
        c.fillStyle = C('#a07a42'); c.beginPath(); c.ellipse(0, 0, 76, 58, 0, 0, TAU); c.fill();
        const o = b.jaw ? 46 : 16 + Math.sin(b.anim * .1) * 4;
        c.fillStyle = C('#3a1208'); c.beginPath(); c.moveTo(14, 0); c.lineTo(84, -o); c.lineTo(84, o); c.closePath(); c.fill();
        c.fillStyle = C('#f0e0b8'); for (let i = 0; i < 6; i++) { const u = i / 5, x = 30 + u * 52, y = o * (x - 14) / 70; c.beginPath(); c.moveTo(x - 6, -y); c.lineTo(x, -y + 15); c.lineTo(x + 6, -y); c.fill(); c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x, y - 15); c.lineTo(x + 6, y); c.fill(); }
        Paint.disc(c, 6, -34, 8, '#33ddff'); Paint.disc(c, 6, 34, 8, '#33ddff'); Paint.glow(c, 6, -34, 20, '#33ddff'); Paint.glow(c, 6, 34, 20, '#33ddff');
        c.restore();
    }
};

/* ============================= NADIR (MAP 4) ============================= */
const B_NADIR = {
    id: 'nadir', name: 'NADIR', title: 'THE BEAST BELOW THE ICE', hp: 8200, w: 150, h: 320, col: '#7fd8ff',
    music: 'boss', reward: { xp: 1400, relic: 'fang', shard: 'b', cells: 260 },
    init: b => ({ hx: b.x, hy: b.y - 300, ox: 0, oy: 0, jaw: 0, under: 0, bx: b.x, by: b.y }),
    aim: b => ({ x: b.hx, y: b.hy }),
    box: b => ({ x: b.hx - 70, y: b.hy - 56, w: 140, h: 112 }),
    plates: b => G.level.dyn.filter(d => d.tag === 'plate'),
    parts: b => [new BossPart(b, x => ({ x: x.x, y: x.A.y }), 150, 170, .7)],
    phases: [
        { moves: ['breath', 'icicles', 'bite', 'crack'], rest: 46 },
        {
            at: .64, moves: ['breath', 'icicles', 'bite', 'crack', 'wisps', 'tail'], rest: 34, say: ['NADIR', 'SO... COLD... THE LIGHT... MAKES IT... STOP...'],
            enter: function* (b) { G.storm = 1; G.say('VESPER', 'Blizzard incoming. Visibility is going to zero.', 100); Ambience.setStorm(.45, 1800); Sound.sfx('roar'); yield 80; }
        },
        {
            at: .28, moves: ['breath2', 'bite', 'tail', 'spikes', 'crack'], rest: 20, say: ['MIRAE', 'It\'s not attacking. It\'s trying to get warm. Oh no. Oh no.'],
            enter: function* (b) { G.flash = .7; Sound.sfx('bigboom'); G.addShake(20); b.cracked = 1; yield 60; b.dmgTakenMult = 1.25; }
        }
    ],
    moves: {
        *head(b, x, y, n = 30) { const sx = b.hx, sy = b.hy; for (let i = 1; i <= n; i++) { const k = U.easeInOut(i / n); b.hx = U.lerp(sx, x, k); b.hy = U.lerp(sy, y, k); yield 1; } },
        *breath(b) {
            const side = b.P.x > b.x ? 1 : -1; yield* B_NADIR.moves.head(b, b.x + side * 60, b.A.y - 420);
            const a0 = side > 0 ? .1 : Math.PI - .1, a1 = side > 0 ? 1.45 : Math.PI - 1.45;
            Combat.warn({ shape: 'cone', x: b.hx, y: b.hy, ang: (a0 + a1) / 2, r: 900, spread: Math.abs(a1 - a0) + .2, t: 44, col: '#7fd8ff' }); b.jaw = 1; Sound.sfx('warn'); yield 44;
            Sound.sfx('frost', { v: 1 }); Sound.sfx('roar', { v: .4 });
            let t = 0;
            for (let i = 0; i < 62; i++) {
                const a = U.lerp(a0, a1, i / 61); t = i;
                for (let k = 0; k < 3; k++) VFX.add(b.hx, b.hy, Math.cos(a + U.rand(-.08, .08)) * U.rand(10, 20), Math.sin(a + U.rand(-.08, .08)) * U.rand(10, 20), '#bfeeff', 40, 12, 1, 0);
                if (i % 4 === 0 && b.beamHits(b.hx, b.hy, a, 900, 76)) b.P.hurt(b.D(9), { tick: true, unblockable: true, x: b.hx });
                yield 1;
            }
            b.jaw = 0; yield 16;
        },
        *breath2(b) { yield* B_NADIR.moves.breath(b); yield* B_NADIR.moves.breath(b); },
        *icicles(b) {
            yield* B_NADIR.moves.head(b, b.x, b.A.y - 480, 22); Sound.sfx('roar', { v: .6 }); G.addShake(10);
            for (let i = 0; i < 12 + b.phase * 4; i++) { b.fallRock(i < 4 ? b.P.x + U.rand(-90, 90) : U.rand(b.A.x0 + 40, b.A.x1 - 40), 52, b.D(17), 'ice', 12); yield 7; }
            yield 40;
        },
        *bite(b) {
            const tx = U.clamp(b.P.x, b.A.x0 + 60, b.A.x1 - 60), ty = b.A.y - 60;
            yield* B_NADIR.moves.head(b, b.x + (tx - b.x) * .4, b.A.y - 440, 24);
            Combat.warn({ shape: 'circle', x: tx, y: ty, r: 120, t: 40, dmg: b.D(30), src: b, kby: -11, col: '#7fd8ff' }); b.jaw = 1; yield 28;
            yield* B_NADIR.moves.head(b, tx, ty, 12); b.jaw = 0; Sound.sfx('slam'); G.addShake(14); VFX.burst(tx, b.A.y, '#d2f3ff', 30, 8, 26, 6, 4);
            yield 52; // Head is on the ice: the main damage window.
            yield* B_NADIR.moves.head(b, b.x, b.A.y - 360, 30);
        },
        *crack(b) {
            const P = B_NADIR.plates(b).filter(p => p.active && p.state === 0), n = Math.ceil(P.length * (b.phase ? .5 : .35)), shuffled = P.sort(() => Math.random() - .5).slice(0, n);
            yield* B_NADIR.moves.head(b, b.x, b.A.y - 520, 18); Sound.sfx('roar');
            yield* B_NADIR.moves.head(b, b.x, b.A.y - 180, 12); G.addShake(14); Sound.sfx('ice_crack'); Sound.sfx('slam');
            shuffled.forEach(p => { p.warned = 70; G.delay(70, () => p.trigger(true)); });
            G.say('', 'The ice is giving way!', 60);
            yield* B_NADIR.moves.head(b, b.x, b.A.y - 340, 40); yield 34;
        },
        *wisps(b) { for (let i = 0; i < 2; i++) G.spawn('wisp', b.x + (i ? 320 : -320), b.A.y - 300, { spawnIn: true, summoned: true, lock: true, hpMult: .55 }); yield 44; },
        *tail(b) {
            const left = U.chance(.5), x0 = left ? b.A.x0 - 100 : b.A.x1 + 100, x1 = left ? b.A.x1 + 100 : b.A.x0 - 100;
            Combat.warn({ shape: 'rect', x: b.A.x0, y: b.A.y - 70, w: b.A.x1 - b.A.x0, h: 70, t: 48, col: '#7fd8ff' }); yield 48;
            Sound.sfx('swing_h'); let hit = false, tx = x0;
            for (let i = 0; i < 30; i++) { tx = U.lerp(x0, x1, i / 29); if (!hit && Math.abs(b.P.x - tx) < 70 && b.P.y > b.A.y - 70) { hit = true; b.P.hurt(b.D(26), { x: tx, kb: 12, kby: -9 }); } b.tailX = tx; yield 1; }
            b.tailX = null; yield 26;
        },
        *spikes(b) {
            for (let n = 0; n < 4; n++) {
                for (let i = 0; i < 14; i++) Combat.eshoot(b, 'ice', b.hx, b.hy, TAU / 14 * i + n * .22, 6.5, b.D(14), { r: 8, life: 150, ghost: true });
                Sound.sfx('frost'); yield 34;
            }
        }
    },
    tick(b) { b.hy += Math.sin(b.anim * .03) * .4; if (b.phase === 0 || !G.storm) return; },
    draw(c, b) {
        const f = b.flash > 0, C = x => f ? '#fff' : x, bx = b.x, by = b.A.y + 40;
        // Neck is a bezier of plated discs from under the ice to the head.
        const n = 16, cpx = bx + (b.hx - bx) * .2, cpy = by - 280;
        for (let i = 0; i <= n; i++) {
            const u = i / n, v = 1 - u, x = v * v * bx + 2 * v * u * cpx + u * u * b.hx, y = v * v * by + 2 * v * u * cpy + u * u * b.hy, r = 66 - u * 26;
            Paint.disc(c, x, y, r, C(i % 2 ? '#46647e' : '#5a7c98'));
            c.fillStyle = C('#d2f3ff'); c.beginPath(); c.moveTo(x - 10, y - r + 2); c.lineTo(x, y - r - 20); c.lineTo(x + 10, y - r + 2); c.fill();
        }
        c.save(); c.translate(b.hx, b.hy); const ang = Math.atan2(b.P.y - 30 - b.hy, b.P.x - b.hx), flip = Math.cos(ang) < 0 ? -1 : 1; c.scale(flip, 1); c.rotate(flip > 0 ? ang * .4 : (Math.PI - ang) * -.4);
        c.fillStyle = C('#5a7c98'); c.beginPath(); c.moveTo(-70, -46); c.lineTo(36, -56); c.lineTo(112, -18); c.lineTo(36, 0); c.lineTo(-70, 26); c.closePath(); c.fill();
        const o = b.jaw ? 56 : 12; c.fillStyle = C('#3a5468'); c.beginPath(); c.moveTo(-60, 26); c.lineTo(30, o * .3); c.lineTo(100, o + 6); c.lineTo(30, o + 28); c.closePath(); c.fill();
        c.fillStyle = C('#0a1a26'); c.beginPath(); c.moveTo(-30, 8); c.lineTo(104, -14); c.lineTo(96, o + 2); c.closePath(); c.fill();
        c.fillStyle = C('#e8f8ff'); for (let i = 0; i < 7; i++) { const x = -6 + i * 15; c.beginPath(); c.moveTo(x, -8); c.lineTo(x + 5, 12); c.lineTo(x + 10, -10); c.fill(); }
        if (b.cracked) { c.strokeStyle = '#ff3322'; c.lineWidth = 3; c.beginPath(); c.moveTo(-40, -30); c.lineTo(-10, -8); c.lineTo(-30, 12); c.stroke(); }
        Paint.disc(c, 24, -30, 11, b.cracked ? '#ff5544' : '#7fd8ff'); Paint.glow(c, 24, -30, 30, b.cracked ? '#ff5544' : '#7fd8ff');
        for (let i = 0; i < 4; i++) Paint.poly(c, [-64 + i * 24, -46, -86 + i * 22, -92 + i * 6, -44 + i * 24, -48], C('#d2f3ff'));
        c.restore();
        if (b.tailX !== null && b.tailX !== undefined) { c.fillStyle = C('#5a7c98'); c.beginPath(); c.ellipse(b.tailX, b.A.y - 26, 80, 34, 0, 0, TAU); c.fill(); }
        for (const p of G.level.dyn) if (p.tag === 'plate' && p.warned > 0) { p.warned--; c.strokeStyle = '#ff5544'; c.lineWidth = 3; c.strokeRect(p.x + 2, p.y + 2, p.w - 4, 6); }
    }
};

/* =========================== VULKARIS (MAP 5-2) ========================== */
const B_VULK = {
    id: 'vulkaris', name: 'VULKARIS', title: 'CHERUB OF THE FLAMING GATE', hp: 9500, w: 110, h: 190, col: '#ff7a18',
    music: 'boss', reward: { xp: 1600, relic: 'cinder', cells: 300 },
    init: () => ({ arm: 0, step: 0, lavaLevel: 0 }),
    aim: b => ({ x: b.x, y: b.y - 110 }),
    box: b => ({ x: b.x - 52, y: b.y - 186, w: 104, h: 186 }),
    phases: [
        { moves: ['slam', 'dash', 'pillars', 'slam'], rest: 42 },
        {
            at: .6, moves: ['slam', 'dash', 'pillars', 'furnace', 'adds'], rest: 30, say: ['VULKARIS', 'THE FURNACE STILL BURNS FOR THE ONE BELOW. OPEN THE VENTS!'],
            enter: function* (b) { G.say('VESPER', 'Lava is rising! Take the high platforms.', 100); G.level.flagsLava = 1; Sound.sfx('roar'); G.addShake(16); yield 60; }
        },
        {
            at: .25, moves: ['slam2', 'dash', 'pillars', 'furnace'], rest: 18, say: ['VULKARIS', 'I SWORE AN OATH TO THE FLAME. WHAT DID YOU SWEAR TO?'],
            enter: function* (b) { G.flash = .7; Sound.sfx('bigboom'); b.enraged = 1; b.dmgK *= 1.15; yield 70; }
        }
    ],
    moves: {
        *walk(b, tx) { const dir = U.sign(tx - b.x); b.facing = dir; while (Math.abs(b.x - tx) > 8) { b.x += dir * (b.enraged ? 6 : 4.2); b.step += .12; yield 1; } },
        *slam(b) {
            yield* B_VULK.moves.walk(b, U.clamp(b.P.x - U.sign(b.P.x - b.x) * 120, b.A.x0 + 70, b.A.x1 - 70));
            const dir = U.sign(b.P.x - b.x) || 1, tx = b.x + dir * 110; b.facing = dir; b.arm = 1;
            Combat.warn({ shape: 'circle', x: tx, y: b.y - 40, r: 170, t: b.enraged ? 26 : 38, dmg: b.D(32), src: b, kby: -10 }); yield b.enraged ? 26 : 38;
            b.arm = -1; Sound.sfx('slam'); G.addShake(14); VFX.groundWave(tx, b.y, 260, '#ff7a18'); VFX.burst(tx, b.y, '#ff7a18', 24, 9, 24, 8, 1);
            [-1, 1].forEach(d => Combat.shoot(b, 'wave', tx, b.y - 22, d * 8, 0, { absDmg: b.D(18), life: 60, r: 22, pierce: 9 }));
            yield 30; b.arm = 0;
        },
        *slam2(b) { yield* B_VULK.moves.slam(b); yield* B_VULK.moves.slam(b); },
        *dash(b) {
            const dir = U.sign(b.P.x - b.x) || 1, tx = dir > 0 ? b.A.x1 - 70 : b.A.x0 + 70; b.facing = dir;
            Combat.warn({ shape: 'rect', x: b.x, y: b.y - 150, w: tx - b.x, h: 150, t: 34 }); yield 34;
            let hit = false, i = 0;
            while (Math.abs(b.x - tx) > 14) { b.x += dir * 17; b.step += .3; if (i++ % 6 === 0) G.fields.push({ kind: 'lavapool', x: b.x, y: b.y, r: 34, t: 0, life: 170, dmg: b.D(6), col: '#ff7a18' }); if (!hit && U.overlap(b.box(), b.P.hurtBox)) { hit = true; b.P.hurt(b.D(30), { x: b.x, kb: 13, kby: -9 }); } yield 1; }
            Sound.sfx('slam'); G.addShake(9); yield 24;
        },
        *pillars(b) {
            const n = b.phase + 3;
            for (let k = 0; k < n; k++) { const x = k === 0 ? b.P.x : U.rand(b.A.x0 + 60, b.A.x1 - 60); Combat.warn({ shape: 'rect', x: x - 54, y: b.y - 640, w: 108, h: 640, t: 44, dmg: b.D(26), src: b, kby: -12, onFire: w => { G.pillar(x, b.y, 640, '#ff7a18', '#fff0a0', 96, true); Sound.at('lava_burst', x); } }); yield 14; }
            yield 44;
        },
        *furnace(b) {
            yield* B_VULK.moves.walk(b, (b.A.x0 + b.A.x1) / 2); b.arm = 1; Sound.sfx('roar', { v: .6 });
            Combat.warn({ shape: 'circle', x: b.x, y: b.y - 110, r: 90, t: 30, col: '#ff7a18' }); yield 30;
            for (let n = 0; n < 5; n++) { for (let i = 0; i < 12; i++) Combat.eshoot(b, 'fire', b.x, b.y - 110, TAU / 12 * i + n * .26, 6, b.D(15), { col: '#ff7a18', r: 8, life: 130, ghost: true }); Sound.sfx('fire'); yield 24; }
            b.arm = 0; yield 20;
        },
        *adds(b) { for (let i = 0; i < 2; i++) G.spawn(i ? 'imp' : 'ashman', U.rand(b.A.x0 + 80, b.A.x1 - 80), i ? b.y - 300 : b.y, { spawnIn: true, summoned: true, lock: true, hpMult: .6 }); yield 40; }
    },
    draw(c, b) {
        const f = b.flash > 0, C = x => f ? '#fff' : x, s = Math.sin(b.step), g = b.enraged ? '#ffe070' : '#ff7a18';
        c.save(); c.translate(b.x, b.y); c.scale(b.facing, 1);
        const leg = (x, p) => { Paint.limb(c, { x, y: -92 }, { x: x + p * s * 18, y: -50 }, 26, C('#201412')); Paint.limb(c, { x: x + p * s * 18, y: -50 }, { x: x + p * s * 26, y: -8 }, 22, C('#2c1c18')); c.fillStyle = C('#14100e'); c.fillRect(x + p * s * 26 - 18, -12, 40, 12); };
        leg(-20, -1); leg(20, 1);
        Paint.poly(c, [-44, -86, 44, -86, 62, -168, 34, -188, -34, -188, -62, -168], C('#2c1c18'));
        c.strokeStyle = C(g); c.lineWidth = 3; c.beginPath(); c.moveTo(-30, -92); c.lineTo(-8, -130); c.lineTo(-22, -160); c.moveTo(30, -92); c.lineTo(10, -120); c.lineTo(26, -166); c.stroke();
        Paint.glow(c, 0, -130, 52, g); Paint.disc(c, 0, -130, 17, C('#fff0c0'));
        Paint.poly(c, [-22, -186, 22, -186, 18, -218, 0, -234, -18, -218], C('#201412')); c.fillStyle = C(g); c.fillRect(-12, -208, 26, 6); Paint.glow(c, 2, -205, 26, g);
        for (let i = -1; i <= 1; i++) Paint.poly(c, [i * 18 - 6, -218, i * 24, -256 + Math.abs(i) * 12, i * 18 + 6, -218], C('#14100e'));
        const a = b.arm > 0 ? -2.5 : b.arm < 0 ? 1 : .3 + Math.sin(b.anim * .05) * .05, hx = 56 + Math.sin(a) * 66, hy = -160 + Math.cos(a) * 66;
        Paint.limb(c, { x: 52, y: -162 }, { x: hx, y: hy }, 24, C('#2c1c18'));
        c.save(); c.translate(hx, hy); c.rotate(-a + .4); c.fillStyle = C('#3a2a22'); c.fillRect(-6, -10, 12, 110); c.fillStyle = C('#14100e'); c.fillRect(-48, 84, 96, 50); c.fillStyle = C(g); c.fillRect(-46, 104, 92, 6); Paint.glow(c, 0, 108, 52, g); c.restore();
        Paint.limb(c, { x: -54, y: -162 }, { x: -64, y: -96 + s * 6 }, 24, C('#201412'));
        c.restore();
    }
};

/* ========================= THE ENDBRINGER (FINAL) ======================== */
/* Attack set adapted from game_backup.html: skills 0-9 and 15-19, ultimates 10-14. */
const B_END = {
    id: 'endbringer', name: 'THE ENDBRINGER', title: 'THE BEAST OF THE LAST DAY', hp: 13000, w: 180, h: 180, col: '#ff1100', finalBoss: true,
    music: 'finalboss', reward: { xp: 0, relic: null, cells: 0 },
    init: b => ({ radius: 150, aura: 0, locked: null, enraged: false, t2: 0, tent: Array.from({ length: 16 }, (_, i) => ({ base: TAU / 16 * i, len: U.rand(130, 300), spd: U.rand(.02, .05), ph: U.rand(0, TAU) })), c1: '#9900ff', c2: '#ff1100' }),
    aim: b => ({ x: b.x, y: b.y }),
    box: b => ({ x: b.x - 100, y: b.y - 100, w: 200, h: 200 }),
    tick(b) {
        const k = b.enraged ? .15 : .05; b.t2 += k; b.tent.forEach(t => t.ph += t.spd);
        if (b.floating !== false) b.y += Math.sin(b.t2) * .6;
        if (!b.dead && G.time % 90 === 0 && b.phase > 0) Sound.sfx('distant_boom', { v: .5 });
    },
    phases: [
        { moves: ['cone', 'cross', 'gapRing', 'bouncers', 'splitters', 'gravity', 'drops', 'homers', 'lunge'], rest: 46 },
        {
            at: .55, moves: ['cone', 'lunge', 'gapRing', 'splitters', 'gaze', 'lunge', 'hellfire', 'fracture', 'lunge', 'cleave', 'matrix', 'homers', 'eruption'], rest: 32,
            say: ['THE ENDBRINGER', 'YOU CARRIED THE SHARDS ALL THE WAY HERE. THANK YOU. I COULD NOT HAVE WALKED THIS FAR.'],
            enter: function* (b) {
                G.lockInput = true; G.letterbox = 1; Sound.sfx('roar'); G.addShake(20);
                G.cineCam = { x: (b.A.x0 + b.A.x1) / 2, y: b.A.y - 220, zoom: .9 };
                G.bigText = { text: 'THE CORE GIVES WAY', col: '#ff5500', t: 120 };
                const P = G.level.dyn.filter(d => d.tag === 'coreplate');
                for (const p of P) { G.delay(U.randi(0, 70), () => { p.trigger(true); VFX.burst(p.x + p.w / 2, p.y, '#ff7a18', 14, 8, 26, 8, 1); }); }
                yield 80; G.level.dyn.filter(d => d.tag === 'corelift').forEach(d => { d.active = true; d.ghosted = false; });
                Sound.sfx('lava_burst'); G.addShake(16); yield 70;
                G.cineCam = null; G.letterbox = 0; G.lockInput = false; G.player.inv = 60;
                // Keep the player above the new lava.
                if (G.player.y > b.A.y - 8) G.player.returnToSafe();
            }
        },
        {
            at: .1, moves: ['v15', 'v16', 'v17', 'v18', 'v19', 'gaze', 'hellfire', 'cleave'], rest: 16, final: true,
            say: ['THE TRUE VOID', 'THERE IS NO ME WITHOUT YOU. COME HOME, ZERO.'],
            enter: function* (b) {
                G.lockInput = true; G.letterbox = 1; G.cineCam = { x: b.x, y: b.y, zoom: 1.7 }; G.projs = G.projs.filter(p => p.friendly); G.fields = G.fields.filter(f => f.kind !== 'lavapool');
                Music.stop(.4); yield 40; Sound.sfx('roar'); Sound.sfx('bigboom');
                G.bigText = { text: 'REALITY COLLAPSE', sub: 'NO ESCAPE NO ESCAPE NO ESCAPE', col: '#ff0000', t: 200 };
                for (let i = 0; i < 200; i++) {
                    b.aura = U.lerp(b.aura, 2, .1); G.darken = Math.min(.9, i / 50); if (i % 3 === 0) G.addShake(7);
                    if (i % 2 === 0) { const a = U.rand(0, TAU), r = U.rand(240, 500); VFX.add(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, -Math.cos(a) * r / 22, -Math.sin(a) * r / 22, '#ff1100', 22, 8, 1, 0); }
                    if (i === 100) { b.enraged = true; G.flash = 1; }
                    b.maxHp = Math.round(8500 * Game.diff.bossHp); b.hp = Math.min(b.maxHp, b.maxHp * (i / 200)); yield 1;
                }
                b.hp = b.maxHp; b.name = 'THE TRUE VOID'; b.c1 = '#ff0000'; G.flash = 1; G.darken = 0;
                // The void rebuilds the floor: one final flat stage, floating in red nothing.
                G.level.dyn.filter(d => d.tag === 'coreplate').forEach(d => { d.dead = false; d.kind = 'block'; d.active = true; d.state = 0; d.y = d.y0; d.tint = '#2a0008'; });
                G.level.dyn.filter(d => d.tag === 'corelift').forEach(d => { d.active = false; });
                G.level.lavaHidden = true; G.level.bgVoid = true;
                G.cineCam = null; G.letterbox = 0; G.lockInput = false; G.player.inv = 90; G.player.y = b.A.y; G.player.vy = 0;
                Music.play('finalboss', 'critical');
            }
        }
    ],
    /** The True Void sinks into reach between attacks, so melee operators get their windows. */
    beforeMove: function* (b) { if (b.enraged) yield* B_END.moves.home(b, 22); },
    moves: {
        *home(b, n = 40) { const tx = U.clamp(b.P.x + (b.P.x < b.x ? 330 : -330), b.A.x0 + 120, b.A.x1 - 120), ty = U.clamp(b.P.y - 130, b.A.y - 340, b.A.y - 125); yield* b.moveTo(tx, ty, n); },
        *lock(b, n = 42) { b.locked = Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x); b.aura = 1; yield n; },
        *cone(b) {
            yield* B_END.moves.home(b); Combat.warn({ shape: 'cone', x: b.x, y: b.y, ang: Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x), spread: Math.PI / 3, r: 900, t: 50 }); yield* B_END.moves.lock(b, 50);
            for (let i = 0; i < 12; i++) { const a = b.locked + Math.sin(i * .9) * .5; Combat.eshoot(b, 'orb', b.x, b.y, a, 9.5, b.D(14), { col: b.c1, r: 8, life: 110, ghost: true }); yield 5; }
            b.locked = null; b.aura = 0;
        },
        *cross(b) {
            const x = b.x, y = b.y; Combat.warn({ shape: 'rect', x: x - 26, y: y - 700, w: 52, h: 1400, t: 50, dmg: b.D(24), src: b }); Combat.warn({ shape: 'rect', x: x - 900, y: y - 26, w: 1800, h: 52, t: 50, dmg: b.D(24), src: b, onFire: () => { [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(a => VFX.beam(x, y, a, 1500, 60, b.c2, 20)); Sound.sfx('laser'); G.addShake(10); } });
            yield 76;
        },
        *gapRing(b) { Combat.warn({ shape: 'circle', x: b.x, y: b.y, r: 110, t: 36 }); yield 36; for (let n = 0; n < 3; n++) { const gap = U.rand(0, TAU); for (let i = 0; i < 22; i++) { const a = TAU / 22 * i; if (Math.abs(U.normAngle(a - gap)) > .42) Combat.eshoot(b, 'orb', b.x, b.y, a, 5.2, b.D(13), { col: '#ffaa00', r: 9, life: 190, ghost: true }); } Sound.sfx('fire'); yield 26; } },
        *bouncers(b) { yield 20; for (let i = 0; i < 4; i++) Combat.shoot(b, 'orb', b.x, b.y, U.rand(-8, 8), U.rand(-8, -2), { absDmg: b.D(16), col: '#ff00ff', r: 12, life: 280, grav: .13, bounce: 5 }); Sound.sfx('volt'); yield 44; },
        *splitters(b) {
            const a0 = Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x); Combat.warn({ shape: 'cone', x: b.x, y: b.y, ang: a0, spread: Math.PI / 2, r: 700, t: 42 }); yield 42;
            for (let i = -1; i <= 1; i++) Combat.eshoot(b, 'orb', b.x, b.y, a0 + i * Math.PI / 4, 7, b.D(18), { col: b.c2, r: 15, life: 62, split: 8, ghost: true });
            Sound.sfx('fire'); yield 40;
        },
        *gravity(b) {
            Combat.warn({ shape: 'circle', x: b.x, y: b.y, r: 340, t: 40, col: '#cc00ff' }); yield 40; Sound.sfx('roar', { v: .5 });
            for (let i = 0; i < 90; i++) { if (b.P.state !== 'dodge') { b.P.push(U.clamp((b.x - b.P.x) * .03, -3.6, 3.6)); b.P.vy += U.clamp((b.y - b.P.y) * .004, -.6, .4); } if (i % 12 === 0) Combat.eshoot(b, 'orb', b.x, b.y, b.t2 * 3, 5.5, b.D(12), { col: '#ffffff', r: 7, life: 120, ghost: true }); yield 1; }
        },
        *drops(b) { for (let i = 0; i < 7; i++) { b.fallRock(i < 2 ? b.P.x : U.rand(b.A.x0 + 40, b.A.x1 - 40), 50, b.D(18), 'rock', 18); yield 9; } yield 40; },
        *homers(b) { for (let i = 0; i < 8; i++) { Combat.eshoot(b, 'orb', b.x, b.y, U.rand(0, TAU), 4.6, b.D(11), { col: '#ff2200', r: 9, life: 170, ghost: true, homing: .03 }); yield 10; } yield 26; },
        *lunge(b) {
            const a = Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x), L = 420, ex = b.x + Math.cos(a) * L, ey = Math.min(b.y + Math.sin(a) * L, b.A.y - 110);
            Combat.warn({ shape: 'circle', x: ex, y: ey, r: 130, t: 44, dmg: b.D(26), src: b }); yield 40;
            yield* b.moveTo(ex, ey, 8, U.easeIn); VFX.beam(ex, ey, a + Math.PI, L, 80, b.c2, 18); G.addShake(12); Sound.sfx('slam');
            for (let i = 0; i < 12; i++) Combat.eshoot(b, 'orb', b.x, b.y, TAU / 12 * i, 5, b.D(12), { col: '#fff', r: 7, life: 90, ghost: true }); yield 40;
        },
        *ultName(b, name) { Sound.sfx('warn'); G.bigText = { text: name, col: '#ff2222', t: 80 }; b.aura = 1.5; G.darken = .45; yield 46; G.darken = 0; },
        *gaze(b) {
            yield* B_END.moves.ultName(b, 'ABYSSAL GAZE'); const a0 = Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x), dir = U.chance(.5) ? 1 : -1, s = a0 - dir * .9, e = a0 + dir * .9;
            Combat.warn({ shape: 'cone', x: b.x, y: b.y, ang: a0, spread: 1.9, r: 1100, t: 40 }); yield 40;
            Sound.sfx('laser');
            for (let i = 0; i < 70; i++) {
                const a = U.lerp(s, e, i / 69), w = 130 * Math.sin(i / 69 * Math.PI);
                VFX.effect(2, (c) => { c.translate(b.x, b.y); c.rotate(a); c.globalCompositeOperation = 'lighter'; c.fillStyle = b.c2; c.fillRect(0, -w / 2, 1500, w); c.fillStyle = '#fff'; c.fillRect(0, -w / 5, 1500, w / 2.5); });
                if (i % 5 === 0 && b.beamHits(b.x, b.y, a, 1500, w * .75)) b.P.hurt(b.D(13), { tick: true, unblockable: true, x: b.x }); yield 1;
            }
        },
        *hellfire(b) {
            yield* B_END.moves.ultName(b, 'HELLFIRE RAIN');
            const safeList = G.level.dyn.filter(d => d.active && (d.tag === 'corelift' || d.kind === 'block')); const pick = safeList.length ? U.pick(safeList) : null;
            const sx = pick ? pick.x + pick.w / 2 : U.rand(b.A.x0 + 140, b.A.x1 - 140), sy = pick ? pick.y - 40 : b.A.y - 60;
            Combat.warn({ shape: 'safe', x: sx, y: sy, r: 170, t: 100, dmg: b.D(36), src: b, unblockable: true, onFire: () => { VFX.ring(b.x, b.y, 1100, b.c1, 40, 40); G.addShake(18); Sound.sfx('bigboom'); G.flash = .6; } });
            yield 120;
        },
        *fracture(b) {
            yield* B_END.moves.ultName(b, 'REALITY FRACTURE'); const off = U.rand(0, 1);
            for (let n = 0; n < 2; n++) {
                const beams = []; for (let i = 0; i < 8; i++) beams.push(TAU / 8 * i + off + n * .39);
                beams.forEach(a => { for (let d = 80; d < 1200; d += 180) Combat.warn({ shape: 'circle', x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d, r: 34, t: 42, col: '#cc00ff' }); });
                yield 42; Sound.sfx('laser'); G.addShake(12);
                beams.forEach(a => { VFX.beam(b.x, b.y, a, 1500, 90, b.c2, 26); if (b.beamHits(b.x, b.y, a, 1500, 56)) b.P.hurt(b.D(30), { unblockable: true, x: b.x }); });
                yield 34;
            }
        },
        *cleave(b) {
            yield* B_END.moves.ultName(b, 'WORLD CLEAVE');
            for (let i = 0; i < 18; i++) { const x = U.rand(b.A.x0, b.A.x1); Combat.warn({ shape: 'rect', x: x - 22, y: b.A.y - 760, w: 44, h: 760, t: 40 + U.randi(0, 30), dmg: b.D(20), src: b, onFire: w => { VFX.beam(w.x + 22, w.y, Math.PI / 2, 760, 44, '#ff0000', 14); Sound.at('volt', w.x, { v: .4 }); } }); yield 3; }
            yield 60;
        },
        *matrix(b) {
            yield* B_END.moves.ultName(b, 'VOID MATRIX'); const cx = b.P.x, cy = b.P.y - 30;
            [[-220, -220, 440, 26], [-220, 200, 440, 26], [-220, -220, 26, 440], [200, -220, 26, 440]].forEach(r => Combat.warn({ shape: 'rect', x: cx + r[0], y: cy + r[1], w: r[2], h: r[3], t: 48, dmg: b.D(22), src: b, onFire: () => Sound.sfx('volt', { v: .4 }) }));
            yield 56;
            for (let n = 0; n < 5; n++) { for (let i = 0; i < 10; i++) { const a = TAU / 10 * i + n * .3; Combat.eshoot(b, 'orb', cx + Math.cos(a) * 460, cy + Math.sin(a) * 460, a + Math.PI, 7, b.D(12), { col: '#00ff66', r: 7, life: 62, ghost: true }); } yield 22; }
        },
        *eruption(b) {
            G.say('', 'The Core is erupting beneath you!', 70); Sound.sfx('lava_burst');
            for (let i = 0; i < 6; i++) { const x = i % 2 ? b.P.x : U.rand(b.A.x0 + 60, b.A.x1 - 60); Combat.warn({ shape: 'rect', x: x - 50, y: b.A.y - 620, w: 100, h: 660, t: 40, dmg: b.D(24), src: b, kby: -12, onFire: () => { G.pillar(x, b.A.y + 30, 660, '#ff7a18', '#fff0a0', 90, true); Sound.at('lava_burst', x); } }); yield 16; }
            yield 40;
        },
        *v15(b) { // Slowing nova
            Combat.warn({ shape: 'circle', x: b.x, y: b.y, r: 560, t: 34, col: '#0088ff', dmg: b.D(14), src: b }); yield 34;
            VFX.ring(b.x, b.y, 800, '#0088ff', 26, 30); if (Math.hypot(b.P.x - b.x, b.P.y - b.y) < 560) b.P.slow = 90; yield 30;
        },
        *v16(b) { // Root lance
            const a = Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x); VFX.beam(b.x, b.y, a, 1500, 8, '#ff00ff', 34); yield 34;
            VFX.beam(b.x, b.y, a, 1500, 56, '#ff00ff', 15); Sound.sfx('laser');
            if (b.beamHits(b.x, b.y, a, 1500, 44)) { b.P.hurt(b.D(24), { unblockable: true, x: b.x }); b.P.slow = 70; } yield 26;
        },
        *v17(b) { // Ground burst at the player's position, now positional instead of unavoidable.
            const x = b.P.x; Combat.warn({ shape: 'circle', x, y: b.A.y - 30, r: 210, t: 36, dmg: b.D(30), src: b, kby: -11, onFire: () => { VFX.groundWave(x, b.A.y, 240, '#ff1100'); Sound.sfx('slam'); G.addShake(12); } }); yield 46;
        },
        *v18(b) { // Sky slashes, also positional now.
            const px = b.P.x; for (let i = 0; i < 5; i++) { const x = px + U.rand(-220, 220); Combat.warn({ shape: 'rect', x: x - 24, y: b.A.y - 760, w: 48, h: 760, t: 34, dmg: b.D(22), src: b, col: '#ff00ff', onFire: w => VFX.beam(w.x + 24, w.y, Math.PI / 2, 760, 48, '#ff00ff', 14) }); yield 5; } yield 30;
        },
        *v19(b) { Combat.warn({ shape: 'circle', x: b.x, y: b.y, r: 120, t: 24 }); yield 24; for (let n = 0; n < 2; n++) { for (let i = 0; i < 24; i++) Combat.eshoot(b, 'orb', b.x, b.y, TAU / 24 * i + n * .13, 7.5, b.D(14), { col: '#ffaa00', r: 8, life: 150, ghost: true }); Sound.sfx('fire'); yield 22; } }
    },
    /* Death sequence: original pierce, implode and whiteout, then the story ending. */
    death: function* (b) {
        G.lockInput = true; Music.stop(.6); G.letterbox = 1; G.cineCam = { x: b.x, y: b.y, zoom: 1.6 }; Sound.sfx('roar', { p: .7 });
        for (let i = 0; i < 200; i++) {
            const k = i / 200; G.darken = Math.min(.92, k * 3); b.deathK = k;
            if (i % 4 === 0) G.addShake(4 + k * 10);
            if (i % 20 === 0) Sound.sfx('explode', { v: .5 + k * .5 });
            yield 1;
        }
        Sound.sfx('bigboom'); G.flash = 1.4; b.gone = true; G.addShake(30); G.darken = 0; yield 60;
        G.cineCam = null; G.letterbox = 0;
        Game.onFinalBossDefeated();
    },
    draw(c, b) {
        c.save(); c.translate(b.x, b.y); const t = b.t2, f = b.flash > 0, C = x => f ? '#fff' : x;
        if (b.deathK) {
            const k = b.deathK; c.save(); c.globalCompositeOperation = 'lighter'; c.rotate(G.time * .01);
            for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.fillStyle = `rgba(255,255,255,${Math.min(1, k * 1.6)})`; c.fillRect(0, -4, 1400 * k, 8); }
            c.restore(); c.globalAlpha = Math.max(0, 1 - k * 1.2);
        }
        if (b.enraged) {
            c.lineCap = 'round';
            for (const ten of b.tent) {
                const a = ten.base + Math.sin(ten.ph) * .5, len = ten.len + Math.sin(ten.ph * 2) * 50, ex = Math.cos(a) * len, ey = Math.sin(a) * len, cx = Math.cos(a + .8) * len * .5 * Math.sin(ten.ph), cy = Math.sin(a + .8) * len * .5 * Math.cos(ten.ph);
                c.lineWidth = 8; c.strokeStyle = '#050105'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(cx, cy, ex, ey); c.stroke();
                c.lineWidth = 3; c.strokeStyle = '#ff0000'; c.stroke();
            }
            c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#ff0000'; c.lineWidth = 9;
            for (let i = 0; i < 6; i++) { const a = TAU / 6 * i + Math.sin(t * 5) * .1; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * b.radius * 1.5, Math.sin(a) * b.radius * 1.5); c.stroke(); }
            c.globalCompositeOperation = 'source-over';
            Paint.glow(c, 0, 0, b.radius * 2 + b.aura * 50, '#ff0000');
            Paint.disc(c, 0, 0, b.radius * .95, C('#220000'));
            for (let i = 0; i < 8; i++) { const a = t * .5 + TAU / 8 * i; Paint.disc(c, Math.cos(a) * b.radius * .7, Math.sin(a) * b.radius * .7, 6 + Math.sin(t * 5 + i) * 3, '#ff1100'); }
        } else {
            c.globalCompositeOperation = 'lighter'; c.lineWidth = 5; c.setLineDash([25, 15, 8, 15]);
            for (let i = 0; i < 3; i++) { c.save(); c.rotate(t * (i % 2 ? -1 : 1) + i); c.scale(1, .3 + Math.sin(t * .5 + i) * .2); c.strokeStyle = [b.c1, b.c2, '#ff5500'][i]; c.beginPath(); c.arc(0, 0, b.radius + 30 + i * 25, 0, TAU); c.stroke(); c.restore(); }
            c.setLineDash([]); c.globalCompositeOperation = 'source-over';
            for (let i = 0; i < 5; i++) { c.save(); c.rotate(t * .5 + TAU / 5 * i); c.translate(b.radius * .85, 0); c.rotate(t * 2); c.fillStyle = C('#111'); c.strokeStyle = '#00ffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -20); c.lineTo(15, 20); c.lineTo(-15, 20); c.closePath(); c.fill(); c.stroke(); c.restore(); }
            Paint.glow(c, 0, 0, b.radius * 1.4 + b.aura * 40, b.c1);
            Paint.disc(c, 0, 0, b.radius * .62, C('#050105'));
        }
        const view = b.locked !== null ? b.locked : Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x); c.rotate(view);
        const open = (b.enraged ? 42 + Math.sin(t * 5) * 10 : 25 + Math.sin(t * 2) * 10) + b.aura * 20;
        if (b.enraged) { c.fillStyle = '#000'; for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(25, 10); c.lineTo(40, 0); c.lineTo(25, -10); c.fill(); } }
        c.fillStyle = C(b.enraged ? '#ff0000' : b.c1); c.beginPath(); c.ellipse(15, 0, b.enraged ? 45 : 35, open, 0, 0, TAU); c.fill();
        c.fillStyle = b.enraged ? '#fff' : '#00ffff'; c.beginPath(); c.ellipse(25, 0, b.enraged ? 15 : 10, open * .8, 0, 0, TAU); c.fill();
        if (b.enraged) Paint.disc(c, 25, 0, 5, '#000');
        c.restore(); c.globalAlpha = 1;
    }
};
const BOSSES = { atlas: B_ATLAS, sylvaris: B_SYLV, qareth: B_QARETH, nadir: B_NADIR, vulkaris: B_VULK, endbringer: B_END };
