'use strict';
/**
 * ENEMIES: a shared state machine (idle, patrol, alert, chase, attack, dodge,
 * stagger, retreat, dead) driven by data. Role behaviour comes from `ai`:
 * melee, fast, ranged, heavy, flyer, support, elite, static, burrow.
 */
const A = {
    bite: { kind: 'melee', range: 62, s: 20, a: 6, r: 22, dmg: 1, box: [0, -46, 60, 44], lunge: 5, sfx: 'swing_l' },
    swipe: { kind: 'melee', range: 70, s: 24, a: 6, r: 26, dmg: 1, box: [0, -60, 70, 58], lunge: 4, sfx: 'swing_m' },
    pounce: { kind: 'pounce', range: 240, min: 90, s: 26, a: 30, r: 30, dmg: 1.1, cd: 110, sfx: 'growl' },
    shot: { kind: 'shot', proj: 'bolt', range: 520, s: 32, r: 34, dmg: .8, spd: 8, cd: 70, col: '#ffb040', sfx: 'gun' },
    lob: { kind: 'lob', proj: 'orb', range: 520, s: 36, r: 36, dmg: 1, cd: 90, col: '#9dff40', sfx: 'squish' },
    slam: { kind: 'slam', range: 104, s: 40, a: 6, r: 40, dmg: 1.5, rad: 130, cd: 110, sfx: 'slam' },
    charge: { kind: 'charge', range: 360, min: 110, s: 34, a: 46, r: 40, dmg: 1.3, spd: 9, cd: 170, sfx: 'mech' },
    burst: { kind: 'shot', proj: 'bolt', range: 480, s: 26, r: 30, dmg: .55, n: 3, gap: 8, spd: 11, cd: 80, col: '#ff5040', sfx: 'gun' },
    missile: { kind: 'shot', proj: 'missile', range: 620, s: 36, r: 40, dmg: 1, spd: 5, homing: .03, cd: 150, sfx: 'missile' },
    heal: { kind: 'heal', range: 460, s: 44, r: 30, cd: 220, sfx: 'checkpoint' },
    summon: { kind: 'summon', range: 500, s: 50, r: 34, cd: 340, sfx: 'roar' },
    ring: { kind: 'ring', range: 300, s: 40, r: 40, dmg: .8, n: 10, spd: 5, cd: 180, col: '#7fd8ff', sfx: 'frost' }
};
const mkA = (base, o) => Object.assign({}, base, o);

const ENEMIES = {
    /* THE FALLEN CITY */
    scav: { name: 'Urban Scavenger', ai: 'melee', body: 'human', hp: 60, dmg: 11, spd: 2.7, xp: 12, col: { a: '#5a4a3c', b: '#8a6d4c', g: '#ffb040', s: '#b5926d' }, gear: 'pipe', atks: [A.swipe] },
    gunner: { name: 'Scrap Gunner', ai: 'ranged', body: 'human', hp: 50, dmg: 10, spd: 2.4, xp: 14, col: { a: '#454a44', b: '#6d7468', g: '#ffb040', s: '#a88a72' }, gear: 'rifle', atks: [A.shot] },
    hound: { name: 'Mutant Hound', ai: 'fast', body: 'beast', hp: 44, dmg: 10, spd: 4.4, xp: 12, w: 46, h: 30, col: { a: '#4a2c2c', b: '#7b3f3f', g: '#ff3322' }, atks: [A.bite, A.pounce] },
    sentry: { name: 'Civic Sentinel', ai: 'heavy', body: 'mech', hp: 190, dmg: 15, spd: 1.6, xp: 40, w: 54, h: 74, poise: 60, col: { a: '#3a4048', b: '#6b7686', g: '#ffdd33' }, atks: [A.slam, mkA(A.burst, { col: '#ffdd33' })] },
    drone: { name: 'Survey Drone', ai: 'flyer', body: 'drone', hp: 40, dmg: 9, spd: 3, xp: 14, w: 32, h: 22, col: { a: '#3a4048', b: '#7d8896', g: '#ff3322' }, atks: [mkA(A.shot, { col: '#ff3322', cd: 90 })] },
    hunter: { name: 'Elite City Hunter', ai: 'elite', body: 'human', elite: true, hp: 300, dmg: 15, spd: 3.6, xp: 90, poise: 40, col: { a: '#23272e', b: '#b02a2a', g: '#ff3322', s: '#9a7a62' }, gear: 'blade', atks: [mkA(A.swipe, { s: 16 }), A.burst, mkA(A.charge, { spd: 12, s: 22 })] },
    /* THE WHISPERING FOREST */
    thornling: { name: 'Thornling', ai: 'melee', body: 'sprout', hp: 72, dmg: 12, spd: 2.6, xp: 15, col: { a: '#34502c', b: '#5f8a3e', g: '#c8ff5a' }, atks: [A.swipe] },
    spitter: { name: 'Spore Spitter', ai: 'static', body: 'bulb', hp: 70, dmg: 12, spd: 0, xp: 15, w: 40, h: 44, col: { a: '#4a3266', b: '#8a4fb0', g: '#9dff40' }, atks: [A.lob] },
    stalker: { name: 'Moss Stalker', ai: 'fast', body: 'beast', hp: 66, dmg: 13, spd: 4.8, xp: 18, w: 54, h: 30, col: { a: '#27402f', b: '#4c7a55', g: '#7fffb0' }, atks: [A.bite, A.pounce] },
    hulk: { name: 'Bramble Hulk', ai: 'heavy', body: 'golem', hp: 260, dmg: 18, spd: 1.8, xp: 46, w: 58, h: 78, poise: 70, col: { a: '#3a2c1c', b: '#6b5230', g: '#c8ff5a' }, atks: [A.slam, A.swipe] },
    mothling: { name: 'Lumen Moth', ai: 'flyer', body: 'moth', hp: 46, dmg: 10, spd: 3.2, xp: 16, w: 34, h: 26, col: { a: '#4c6a7a', b: '#a0ffda', g: '#a0ffda' }, atks: [mkA(A.shot, { proj: 'orb', col: '#a0ffda', spd: 6, cd: 100 })] },
    grove: { name: 'Grove Guardian', ai: 'support', body: 'golem', elite: true, hp: 380, dmg: 18, spd: 1.8, xp: 110, w: 56, h: 84, poise: 60, col: { a: '#2c3a28', b: '#6c8f5a', g: '#7fffb0' }, atks: [A.heal, A.slam, A.lob] },
    /* THE SCORCHED WASTELAND */
    scuttler: { name: 'Sand Scuttler', ai: 'fast', body: 'bug', hp: 66, dmg: 13, spd: 5, xp: 18, w: 44, h: 24, col: { a: '#6a5230', b: '#b08a4a', g: '#ffdd77' }, atks: [A.bite, mkA(A.pounce, { range: 200 })] },
    raider: { name: 'Dune Raider', ai: 'ranged', body: 'human', hp: 84, dmg: 15, spd: 2.8, xp: 20, col: { a: '#7a4e2a', b: '#c29a5c', g: '#ffb040', s: '#a87850' }, gear: 'rifle', atks: [mkA(A.shot, { range: 700, spd: 13, s: 42, dmg: 1 })] },
    burrower: { name: 'Dune Lurker', ai: 'burrow', body: 'worm', hp: 100, dmg: 16, spd: 3.2, xp: 22, w: 44, h: 56, col: { a: '#5c4426', b: '#a57e42', g: '#ff8840' }, atks: [mkA(A.swipe, { s: 16, range: 90 })] },
    obelisk: { name: 'Obelisk Sentinel', ai: 'heavy', body: 'obelisk', hp: 340, dmg: 20, spd: 1.5, xp: 56, w: 56, h: 88, poise: 80, armorFront: false, col: { a: '#4a4238', b: '#8a7a60', g: '#33ddff' }, atks: [A.slam, mkA(A.ring, { col: '#33ddff', n: 8 })] },
    scarab: { name: 'Bronze Scarab', ai: 'flyer', body: 'drone', hp: 62, dmg: 12, spd: 3.6, xp: 18, w: 34, h: 24, col: { a: '#5c4a20', b: '#b89a3a', g: '#33ddff' }, atks: [mkA(A.charge, { range: 260, spd: 10, s: 26, a: 34, cd: 130 })] },
    warlord: { name: 'Raider Warlord', ai: 'elite', body: 'human', elite: true, hp: 480, dmg: 22, spd: 3.5, xp: 140, poise: 50, col: { a: '#3a2418', b: '#c23a1e', g: '#ffb040', s: '#8a6848' }, gear: 'blade', scale: 1.15, atks: [mkA(A.swipe, { s: 16 }), mkA(A.summon, { what: 'raider' }), mkA(A.charge, { spd: 12, s: 24 })] },
    /* THE FROZEN ABYSS */
    wolf: { name: 'Rime Wolf', ai: 'fast', body: 'beast', hp: 96, dmg: 16, spd: 5, xp: 22, w: 56, h: 32, col: { a: '#7a90a8', b: '#cfe4f4', g: '#7fd8ff' }, atks: [A.bite, A.pounce] },
    thrall: { name: 'Frozen Thrall', ai: 'melee', body: 'human', hp: 136, dmg: 18, spd: 2.5, xp: 24, col: { a: '#4c6a84', b: '#9cc8e4', g: '#7fd8ff', s: '#7ea4bc' }, gear: 'claw', atks: [A.swipe, mkA(A.shot, { proj: 'ice', spd: 9, col: '#7fd8ff', cd: 160, range: 380 })] },
    shellback: { name: 'Shellback', ai: 'heavy', body: 'shell', hp: 320, dmg: 22, spd: 1.8, xp: 60, w: 70, h: 54, poise: 90, armorFront: true, col: { a: '#3e5266', b: '#8eb2cc', g: '#7fd8ff' }, atks: [A.charge, A.slam] },
    wisp: { name: 'Hoarfrost Wisp', ai: 'flyer', body: 'wisp', hp: 80, dmg: 14, spd: 2.8, xp: 22, w: 30, h: 30, col: { a: '#5ab0e0', b: '#d2f3ff', g: '#7fd8ff' }, atks: [mkA(A.shot, { proj: 'ice', col: '#7fd8ff', spd: 8, cd: 90 }), A.ring] },
    rimeg: { name: 'Rime Guardian', ai: 'elite', body: 'golem', elite: true, hp: 620, dmg: 26, spd: 2.2, xp: 180, w: 62, h: 92, poise: 90, col: { a: '#46647e', b: '#a8d8f0', g: '#7fd8ff' }, atks: [A.slam, A.ring, mkA(A.charge, { spd: 10 })] },
    /* THE VOLCANIC CORE */
    slug: { name: 'Magma Slug', ai: 'melee', body: 'blob', hp: 170, dmg: 20, spd: 1.8, xp: 28, w: 54, h: 34, trail: true, col: { a: '#3a1608', b: '#c2410c', g: '#ff7a18' }, atks: [mkA(A.bite, { range: 70, s: 26 })] },
    ashman: { name: 'Ashen Mutant', ai: 'melee', body: 'human', hp: 190, dmg: 22, spd: 3.1, xp: 30, col: { a: '#2a2422', b: '#6a5a50', g: '#ff5a18', s: '#4a3a32' }, gear: 'claw', atks: [mkA(A.swipe, { s: 16 }), A.pounce] },
    imp: { name: 'Cinder Imp', ai: 'flyer', body: 'imp', hp: 110, dmg: 18, spd: 3.6, xp: 26, w: 34, h: 30, col: { a: '#3a1608', b: '#ea580c', g: '#ffb040' }, atks: [mkA(A.shot, { proj: 'fire', col: '#ff7a18', spd: 7, cd: 80 }), mkA(A.charge, { range: 240, spd: 10, s: 26, a: 30, cd: 170 })] },
    lavag: { name: 'Lava Guardian', ai: 'heavy', body: 'golem', hp: 520, dmg: 28, spd: 1.8, xp: 70, w: 62, h: 90, poise: 100, col: { a: '#1e0f0a', b: '#4a2012', g: '#ff7a18' }, atks: [A.slam, mkA(A.lob, { proj: 'fire', col: '#ff7a18', split: 6 })] },
    obsidian: { name: 'Obsidian Construct', ai: 'heavy', body: 'obelisk', hp: 440, dmg: 26, spd: 1.9, xp: 66, w: 58, h: 82, poise: 90, armorFront: true, col: { a: '#14141e', b: '#34344c', g: '#d946ef' }, atks: [A.charge, mkA(A.ring, { col: '#d946ef', n: 10 })] },
    cantor: { name: 'Ember Cantor', ai: 'support', body: 'human', hp: 210, dmg: 18, spd: 2.2, xp: 40, col: { a: '#3a1a12', b: '#a13a18', g: '#ffcc00', s: '#5a3a2a' }, gear: 'staff', atks: [A.heal, mkA(A.shot, { proj: 'fire', col: '#ff7a18', spd: 7 })] },
    forge: { name: 'Forge Knight', ai: 'elite', body: 'human', elite: true, hp: 980, dmg: 32, spd: 3.5, xp: 240, poise: 110, scale: 1.25, col: { a: '#201a1a', b: '#7a2a12', g: '#ff7a18', s: '#2a2020' }, gear: 'blade', atks: [mkA(A.swipe, { s: 14 }), mkA(A.charge, { spd: 13, s: 20 }), mkA(A.ring, { col: '#ff7a18', n: 12 })] }
};

function enemyStyle(d) {
    const C = d.col, g = d.gear;
    return Looks.dress(d, {
        scale: d.scale || 1, bone: { thigh: 14, shin: 14, upper: 12, fore: 12, torso: 20, head: 8, limbW: 6, waist: 5, chest: 7 },
        col: { armor: C.a, armor2: C.b, dark: U.mix(C.a, '#000000', .4), skin: C.s || C.b, boot: U.mix(C.a, '#000000', .6), glow: C.g },
        weaponLen: 26, gait: { stride: 34, knee: 50, arm: 22, armF: 20, armB: -6, elbow: 30, lean: 12, bounce: 2, off: 3 },
        idle: { lean: 8, aF: g === 'rifle' ? 76 : 24, fF: g === 'rifle' ? 10 : 30, aB: -8, fB: 20 },
        paint: paintHumanoid,
        weaponF(c) {
            if (g === 'rifle') { c.fillStyle = Paint.c('#22242a'); c.fillRect(-2.5, -4, 5, 28); c.fillStyle = Paint.c(C.g); c.fillRect(-1.5, 22, 3, 3); }
            else if (g === 'blade') { Paint.poly(c, [-2.5, 2, 2.5, 2, 3, 34, 0, 42, -3, 30], C.g); }
            else if (g === 'staff') { c.fillStyle = Paint.c('#3a2a1a'); c.fillRect(-1.5, -18, 3, 52); Paint.disc(c, 0, -20, 5, C.g); Paint.glow(c, 0, -20, 12, C.g); }
            else if (g === 'claw') { for (let i = -1; i <= 1; i++) Paint.poly(c, [i * 3 - 1, 0, i * 3 + 1, 0, i * 6, 13], C.g); }
            else { c.fillStyle = Paint.c('#5a5a60'); c.fillRect(-2, 0, 4, 26); }
        },
        headGear(c, J) {
            const h = J.head;
            if (C.s) { Paint.poly(c, [h.x - 9, h.y - 9, h.x + 8, h.y - 8, h.x + 8, h.y - 2, h.x - 9, h.y + 1], C.a); }
            c.fillStyle = Paint.c(C.g); c.fillRect(h.x + 3, h.y - 1, 4, 2);
        }
    });
}

class Enemy {
    constructor(type, x, y, opt = {}) {
        const d = this.def = ENEMIES[type];
        this.type = type; this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.w = d.w || 26; this.h = d.h || 58;
        this.facing = opt.facing || (U.chance(.5) ? 1 : -1);
        this.tier = 1;
        this.maxHp = this.hp = Math.round(d.hp * Game.diff.enemyHp * (opt.hpMult || 1)); this.dmg = d.dmg * Game.diff.enemyDmg;
        this.state = 'idle'; this.t = 0; this.cd = U.randi(20, 70); this.atk = null; this.atkT = 0; this.stun = 0; this.poise = d.poise || 0; this.poiseLeft = this.poise;
        this.grounded = false; this.riding = null; this.onWall = 0; this.armorFront = d.armorFront; this.patrolDir = this.facing; this.homeX = x; this.homeY = y;
        this.anim = Math.random() * 100; this.flash = 0; this.phase = 0; this.deadT = 0; this.alertT = 0; this.flyer = d.ai === 'flyer'; this.slowT = 0; this.spawnT = opt.spawnIn ? 30 : 0; this.lock = opt.lock;
        this.buried = d.ai === 'burrow'; this.untargetable = this.buried; this.summoned = opt.summoned;
        if (d.body === 'human') { this.rig = new Rig(enemyStyle(d)); this.rig.owner = this; }
    }
    box() { return { x: this.x - this.w / 2, y: this.y - this.h, w: this.w, h: this.h }; }
    aim() { return { x: this.x, y: this.y - this.h * .55 }; }
    stagger(n) { this.state = 'stagger'; this.t = n; this.atk = null; }
    hurt(dmg, o) {
        if (this.dead) return 0;
        if (this.shred > 0) dmg *= 1.3;
        dmg = Math.max(1, Math.round(dmg));
        this.hp -= dmg; this.flash = 6; if (this.rig) this.rig.flash = 6;
        VFX.text(this.x, this.y - this.h - 4, String(dmg), o.crit ? '#ffdd33' : '#ffffff', o.crit ? 22 : 16);
        Save.run.damageDealt += dmg;
        if (this.state === 'idle' || this.state === 'patrol') { this.state = 'chase'; this.facing = U.sign(G.player.x - this.x); G.alertNear(this); }
        if (this.hp <= 0) { this.die(o); return dmg; }
        this.poiseLeft -= o.stag;
        if (this.poiseLeft <= 0) {
            this.poiseLeft = this.poise; this.stagger(Math.min(40, 10 + o.stag * .5));
            if (!this.flyer) { this.vx = o.dir * (o.kb || 0); this.vy = o.kby || 0; } else { this.vx = o.dir * (o.kb || 0) * .6; this.vy = (o.kby || 0) * .5; }
        } else if (this.poise === 0) { this.vx = o.dir * (o.kb || 0) * .7; }
        return dmg;
    }
    die(o) {
        this.dead = true; this.state = 'dead'; this.deadT = 0; this.vx = (o && o.dir || 0) * 3; this.vy = -4;
        G.onKill(this);
        Sound.at(this.def.body === 'mech' || this.def.body === 'obelisk' ? 'explode' : 'edeath', this.x, { v: .7 });
        VFX.burst(this.x, this.y - this.h / 2, this.def.col.g, 14, 6, 30, 5, 1); VFX.smoke(this.x, this.y - this.h / 2, '#222', 4);
        if (this.rig) { this.rig.ground = false; this.rig.play('death', 4, 1.6); }
    }
    update() {
        this.anim++; if (this.flash > 0) this.flash--; if (this.cd > 0) this.cd--; if (this.shred > 0) this.shred--; if (this.slowT > 0) this.slowT--;
        if (this.spawnT > 0) { this.spawnT--; if (this.spawnT % 3 === 0) VFX.add(this.x + U.rand(-20, 20), this.y, 0, -3, this.def.col.g, 20, 7, 1, 0); return; }
        const S = this.status;
        if (S) {
            if (S.fire > 0) { S.fire--; if (G.time % 30 === 0 && !this.dead) this.hurt(G.player.power * .25, { dir: 0, stag: 0 }); if (G.time % 5 === 0) VFX.add(this.x + U.rand(-10, 10), this.y - U.rand(0, this.h), 0, -1.6, '#ff6a2a', 16, 6, 1, 0); }
            if (S.frost > 0) { S.frost--; this.slowT = Math.max(this.slowT, 2); if (G.time % 8 === 0) VFX.add(this.x + U.rand(-10, 10), this.y - U.rand(0, this.h), 0, .5, '#7fd8ff', 16, 4, 1, 0); }
            if (S.volt > 0) { S.volt--; if (G.time % 60 === 0 && !this.dead) { VFX.lightning(this.x - 14, this.y - this.h, this.x + 14, this.y); this.hurt(G.player.power * .2, { dir: 0, stag: 6 }); } }
        }
        if (this.dead) { this.deadTick(); return; }
        if (this.stun > 0) {
            this.stun--; if (G.time % 8 === 0) VFX.add(this.x + U.rand(-12, 12), this.y - this.h - 6, 0, -.4, '#ffee88', 12, 3, 0, 0);
            this.vx *= .8; if (!this.flyer) this.vy = Math.min(this.vy + GRAV, 14); Phys.move(this); if (this.rig) { this.rig.play('hit', 3); this.tickRig(); } return;
        }
        const P = G.player, dx = P.x - this.x, dy = (P.y - 30) - (this.y - this.h / 2), dist = Math.hypot(dx, dy);
        const asleep = Math.abs(this.x - (G.cam.x + VW / 2)) > VW * .95 && this.state !== 'chase' && !this.lock;
        if (asleep) return; // Efficient AI: far-off enemies do not think at all.
        this.ai = this.def.ai;
        const spd = this.def.spd * (this.slowT > 0 ? .55 : 1);
        switch (this.state) {
            case 'idle': case 'patrol': this.wander(spd, dist, dx, dy); break;
            case 'alert': this.vx *= .8; this.facing = U.sign(dx); if (--this.alertT <= 0) this.state = 'chase'; break;
            case 'chase': this.chase(spd, dist, dx, dy); break;
            case 'attack': this.attackTick(dx, dy); break;
            case 'dodge': if (--this.t <= 0) this.state = 'chase'; if (this.grounded) this.vx *= .95; break;
            case 'retreat': this.vx = -U.sign(dx) * spd * 1.2; this.facing = U.sign(dx); if (--this.t <= 0 || this.ledgeAhead(U.sign(this.vx))) this.state = 'chase'; break;
            case 'stagger': this.vx *= .85; if (--this.t <= 0) this.state = 'chase'; break;
        }
        if (this.flyer) { this.vx *= .95; this.vy *= .92; this.x += this.vx; this.y += this.vy; this.clipFlyer(); }
        else if (this.ai !== 'static' || !this.grounded) {
            this.vy = Math.min(this.vy + GRAV, 15); Phys.move(this);
            if (this.y > G.level.ph + 60) { this.hp = 0; this.die({ dir: 0 }); }
        }
        if (this.def.trail && G.time % 40 === 0 && this.grounded && Math.abs(this.vx) > .2) G.fields.push({ kind: 'lavapool', x: this.x, y: this.y, r: 26, t: 0, life: 160, dmg: this.dmg * .3, col: '#ff7a18' });
        if (this.hazardCheck) this.hazardCheck();
        this.tickRig();
    }
    tickRig() {
        const R = this.rig; if (!R) return;
        R.ground = this.grounded; R.gaitAmt = U.clamp(Math.abs(this.vx) / Math.max(1, this.def.spd), .2, 1.1); R.phase += Math.abs(this.vx) / 11;
        if (this.state === 'attack') { /* attack pose set in startAttack */ }
        else if (this.state === 'stagger') R.play('hit', 3);
        else if (Math.abs(this.vx) > .4) R.play('run', 6); else R.play('idle', 8);
        R.tick(); R.solve();
    }
    deadTick() {
        this.deadT++; this.vy = Math.min(this.vy + GRAV, 14); this.vx *= .95;
        if (this.flyer) { this.y += this.vy; this.x += this.vx; } else Phys.move(this);
        if (this.rig) { this.rig.tick(); this.rig.solve(); }
        if (this.deadT > 80) this.gone = true;
    }
    clipFlyer() {
        const L = G.level;
        if (L.solidAt(this.x, this.y - this.h / 2)) { this.x -= this.vx * 2; this.y -= this.vy * 2 + 1; this.vx = 0; this.vy = -1; }
        this.x = U.clamp(this.x, 20, L.pw - 20); this.y = Math.max(30, this.y);
    }
    ledgeAhead(dir) {
        if (!this.grounded) return false;
        const L = G.level, px = this.x + dir * (this.w / 2 + 8);
        const s = L.surfaceBelow(px, this.y - 10, 90);
        if (s === null) return true;
        for (const h of L.hazards) if ((h.kind === 'lava' || h.kind === 'spikes' || h.kind === 'thorns') && px > h.x && px < h.x + h.w && s + 16 > h.y && this.y < h.y + h.h) return true;
        return false;
    }
    wallAhead(dir) { const L = G.level, px = this.x + dir * (this.w / 2 + 6); return L.solidAt(px, this.y - 40) || L.solidAt(px, this.y - 12) && L.solidAt(px, this.y - 44); }
    sees(dist, dx, dy) {
        const P = G.player;
        if (P.state === 'dead' || G.lockInput) return false;
        const R = this.def.elite ? 640 : 480, facingP = U.sign(dx) === this.facing || dist < 150;
        return dist < R && Math.abs(dy) < 260 && facingP && G.level.los(this.x, this.y - this.h * .7, P.x, P.y - 40);
    }
    wander(spd, dist, dx, dy) {
        if (this.sees(dist, dx, dy)) { this.state = 'alert'; this.alertT = this.def.elite ? 8 : 16; VFX.text(this.x, this.y - this.h - 14, '!', '#ff4433', 22, 26); Sound.at(this.def.body === 'mech' ? 'mech' : 'growl', this.x, { v: .5, gap: .3 }); G.alertNear(this); return; }
        if (this.lock) { this.state = 'chase'; return; }
        if (this.def.ai === 'static' || this.def.ai === 'burrow') { if (dist < 240 && this.def.ai === 'burrow') this.state = 'chase'; return; }
        if (this.flyer) { this.vx += Math.cos(this.anim * .02) * .08; this.vy += Math.sin(this.anim * .05) * .08; this.facing = U.sign(this.vx); return; }
        this.t--;
        if (this.state === 'idle') { this.vx *= .8; if (this.t <= 0) { this.state = 'patrol'; this.t = U.randi(80, 180); } }
        else {
            this.vx = this.patrolDir * spd * .5; this.facing = this.patrolDir;
            if (this.t <= 0 || this.ledgeAhead(this.patrolDir) || this.wallAhead(this.patrolDir) || Math.abs(this.x - this.homeX) > 240) { this.patrolDir = this.x > this.homeX ? -1 : this.ledgeAhead(this.patrolDir) ? -this.patrolDir : U.chance(.5) ? 1 : -1; this.state = 'idle'; this.t = U.randi(30, 90); }
        }
    }
    pickAttack(dist) {
        const opts = this.def.atks.filter(a => dist <= a.range * (a.kind === 'melee' || a.kind === 'slam' ? 1 : 1.05) && dist >= (a.min || 0) && !(a.cd && (this.atkCd && this.atkCd[a.kind + (a.proj || '')] > G.time)));
        return opts.length ? U.pick(opts) : null;
    }
    chase(spd, dist, dx, dy) {
        const dir = U.sign(dx), P = G.player;
        this.facing = this.ai === 'static' ? dir : dir;
        if (P.state === 'dead') { this.state = 'idle'; return; }
        if (this.ai !== 'static' && dist > 900 && !this.lock) { this.state = 'idle'; return; }
        // Dodge a committed player swing rather than trading blows all day.
        if ((this.ai === 'elite' || this.ai === 'fast') && P.state === 'attack' && dist < 100 && U.chance(.03) && this.grounded) {
            this.state = 'dodge'; this.t = 22; this.vx = -dir * 7; this.vy = -6; VFX.dust(this.x, this.y, 4); return;
        }
        if (this.cd <= 0) {
            const a = this.pickAttack(dist);
            if (a && (a.kind !== 'heal' || G.needHeal(this)) && (Math.abs(dy) < 150 || a.kind === 'shot' || a.kind === 'lob' || this.flyer)) { this.startAttack(a); return; }
        }
        switch (this.ai) {
            case 'ranged': case 'support': {
                const want = 340;
                if (dist < want - 80 && !this.ledgeAhead(-dir)) this.vx = -dir * spd;
                else if (dist > want + 80 && !this.ledgeAhead(dir)) this.vx = dir * spd;
                else this.vx *= .8;
                break;
            }
            case 'flyer': {
                const hx = P.x - dir * 190 + Math.sin(this.anim * .03) * 50, hy = P.y - 170 + Math.sin(this.anim * .05) * 34;
                this.vx += U.clamp((hx - this.x) * .01, -.5, .5) * spd * .4; this.vy += U.clamp((hy - this.y) * .012, -.5, .5) * spd * .4;
                break;
            }
            case 'static': break;
            case 'burrow': this.burrowTick(spd, dist, dir); break;
            default:
                if (dist < 40 && Math.abs(dy) < 40) { this.vx *= .7; }
                else if (this.ledgeAhead(dir)) {
                    // Jump short gaps while chasing, otherwise hold the edge instead of suiciding.
                    const ok = this.grounded && G.level.surfaceBelow(this.x + dir * 140, this.y - 60, 170) !== null;
                    if (ok && this.ai !== 'heavy') { this.vy = -11; this.vx = dir * Math.max(spd, 4.8); } else this.vx *= .6;
                } else {
                    this.vx = dir * spd;
                    if (this.wallAhead(dir) && this.grounded && this.ai !== 'heavy') this.vy = -11;
                }
        }
        // Wounded fast enemies peel off, which keeps fights moving.
        if (this.ai === 'fast' && this.hp < this.maxHp * .3 && dist < 120 && U.chance(.02)) { this.state = 'retreat'; this.t = 40; }
    }
    burrowTick(spd, dist, dir) {
        if (this.buried) {
            this.vx = dir * spd; this.untargetable = true;
            if (G.time % 6 === 0) VFX.dust(this.x, this.y, 2, G.level.theme.dust);
            if (dist < 70 || this.ledgeAhead(dir)) { this.buried = false; this.untargetable = false; this.vx = 0; this.cd = 12; Sound.at('crumble', this.x); VFX.dust(this.x, this.y, 14, G.level.theme.dust); }
        } else { this.vx *= .7; if (this.cd > 40 && dist > 240) { this.buried = true; } }
    }
    startAttack(a) {
        this.state = 'attack'; this.atk = a; this.atkT = 0; this.hitDone = false; this.shots = 0;
        this.atkCd = this.atkCd || {}; if (a.cd) this.atkCd[a.kind + (a.proj || '')] = G.time + a.cd;
        this.vx *= .2;
        Sound.at(a.sfx === 'gun' || a.sfx === 'slam' ? 'warn' : a.sfx, this.x, { v: .35, gap: .2 });
        if (this.rig) {
            const tot = a.s + (a.a || 6) + a.r, isShot = a.kind === 'shot' || a.kind === 'lob';
            const wind = isShot ? { aF: 80, fF: 6, lean: -4 } : { aF: 150, fF: 26, lean: -10, by: 3 }, str = isShot ? { aF: 82, fF: 4, lean: 2 } : { aF: 40, fF: 6, lean: 22, lF: 28, sF: 24, lB: -26, sB: 12 };
            this.rig.custom([[0, wind], [a.s / tot, wind], [(a.s + 4) / tot, str, 'snap'], [1, {}]], tot, 8);
        }
    }
    attackTick(dx, dy) {
        const a = this.atk, t = ++this.atkT, P = G.player;
        if (this.grounded) this.vx *= .84;
        if (t < a.s && a.kind !== 'charge') this.facing = U.sign(dx);
        if (t === a.s - 16 && this.def.elite) VFX.text(this.x, this.y - this.h - 14, '!!', '#ffcc00', 18, 18);
        const dirF = this.facing;
        switch (a.kind) {
            case 'melee':
                if (t === a.s) { this.vx = dirF * (a.lunge || 0) * (this.flyer ? .4 : 1); Sound.at(a.sfx, this.x, { v: .7 }); VFX.slash(this.x + dirF * 30, this.y - this.h * .55, 46, dirF, this.def.col.g, -1, 1, 9); }
                if (t >= a.s && t < a.s + a.a && !this.hitDone) {
                    const b = a.box, R = { x: dirF > 0 ? this.x + b[0] : this.x - b[0] - b[2], y: this.y + b[1], w: b[2], h: b[3] };
                    if (U.overlap(R, P.hurtBox)) { this.hitDone = true; P.hurt(this.dmg * a.dmg, { x: this.x, owner: this }); }
                }
                break;
            case 'pounce':
                if (t === a.s) { const T = 32, dist = Math.abs(dx); this.vx = dirF * U.clamp(dist / T, 3, 11); this.vy = -9.5; Sound.at('growl', this.x); }
                if (t > a.s && !this.hitDone && U.overlap(this.box(), P.hurtBox)) { this.hitDone = true; P.hurt(this.dmg * a.dmg, { x: this.x, owner: this }); }
                if (t > a.s + 4 && this.grounded && t < a.s + a.a) this.atkT = a.s + a.a - 1;
                break;
            case 'shot': if (t >= a.s && this.shots < (a.n || 1) && (t - a.s) % (a.gap || 1) === 0) {
                this.shots++;
                const mx = this.x + dirF * 22, my = this.y - this.h * .68, ang = Math.atan2(P.y - 34 - my, P.x - mx) + (a.n ? U.rand(-.06, .06) : 0);
                Combat.eshoot(this, a.proj, mx, my, ang, a.spd, this.dmg * a.dmg, { col: a.col, r: a.proj === 'missile' ? 7 : 5, len: 14, life: 110, homing: a.homing, ghost: a.proj === 'missile' });
                Sound.at(a.sfx, this.x, { v: .5 });
            } break;
            case 'lob': if (t === a.s) {
                const mx = this.x + dirF * 12, my = this.y - this.h * .9, T = 42, vx = (P.x - mx) / T, vy = (P.y - 30 - my) / T - .5 * .3 * T;
                Combat.shoot(this, a.proj, mx, my, vx, vy, { absDmg: this.dmg * a.dmg, grav: .3, col: a.col, r: 9, life: 120, explode: 50, split: a.split });
                Sound.at(a.sfx, this.x, { v: .6 });
            } break;
            case 'slam':
                if (t === 1) Combat.warn({ shape: 'circle', x: this.x + dirF * 40, y: this.y - 20, r: a.rad, t: a.s, dmg: this.dmg * a.dmg, src: this, kby: -8 });
                if (t === a.s) { Sound.at('slam', this.x); G.addShake(6); VFX.groundWave(this.x + dirF * 40, this.y, a.rad, this.def.col.g); VFX.dust(this.x + dirF * 40, this.y, 10, G.level.theme.dust); }
                break;
            case 'charge':
                if (t === 1 && !this.flyer) { const len = a.spd * a.a * dirF, h = 60; Combat.warn({ shape: 'rect', x: this.x, y: this.y - h, w: len, h, t: a.s }); }
                if (t === 1 && this.flyer) this.chargeAng = Math.atan2(P.y - 40 - this.y, P.x - this.x);
                if (t >= a.s && t < a.s + a.a) {
                    if (this.flyer) { this.vx = Math.cos(this.chargeAng) * a.spd; this.vy = Math.sin(this.chargeAng) * a.spd; }
                    else { this.vx = dirF * a.spd; if (this.ledgeAhead(dirF) || this.wallAhead(dirF)) { this.vx = 0; this.atkT = a.s + a.a; } }
                    if (!this.hitDone && U.overlap(this.box(), P.hurtBox)) { this.hitDone = true; P.hurt(this.dmg * a.dmg, { x: this.x, kb: 11, kby: -6, owner: this }); }
                    if (t % 3 === 0) VFX.dust(this.x - dirF * 20, this.y, 2, G.level.theme.dust);
                }
                break;
            case 'ring': if (t === a.s) {
                for (let i = 0; i < a.n; i++) Combat.eshoot(this, 'orb', this.x, this.y - this.h * .6, TAU / a.n * i + .1, a.spd, this.dmg * a.dmg, { col: a.col, r: 6, life: 80, ghost: true });
                Sound.at(a.sfx, this.x); VFX.ring(this.x, this.y - this.h * .6, 70, a.col);
            } break;
            case 'heal': if (t === a.s) {
                VFX.ring(this.x, this.y - 40, 240, '#7fffb0', 26);
                for (const e of G.enemies) if (!e.dead && !e.boss && Math.hypot(e.x - this.x, e.y - this.y) < 300 && e !== this) { const n = e.maxHp * .28; e.hp = Math.min(e.maxHp, e.hp + n); VFX.text(e.x, e.y - e.h - 8, '+' + Math.round(n), '#7fffb0', 15); VFX.burst(e.x, e.y - e.h / 2, '#7fffb0', 8, 3, 20, 5, 1); }
                Sound.at('checkpoint', this.x, { v: .5 });
            } break;
            case 'summon': if (t === a.s) {
                for (const d of [-1, 1]) { const x = this.x + d * 90, s = G.level.surfaceBelow(x, this.y - 40, 200); if (s !== null) G.spawn(a.what, x, s, { spawnIn: true, summoned: true, lock: true, hpMult: .6 }); }
                VFX.ring(this.x, this.y - 40, 140, this.def.col.g); Sound.at('roar', this.x, { v: .7 });
            } break;
        }
        if (this.atkT >= a.s + (a.a || 6) + a.r) { this.state = 'chase'; this.cd = U.randi(26, 54) + (a.cd ? 16 : 0); this.cd = Math.round(this.cd * Game.diff.aiDelay); this.atk = null; if (this.ai === 'ranged' && U.chance(.3)) { this.state = 'retreat'; this.t = 34; } }
    }
    telegraphing() { return this.state === 'attack' && this.atkT < this.atk.s; }
    draw(ctx) {
        const k = this.dead ? 1 - this.deadT / 80 : 1;
        if (this.buried) { ctx.fillStyle = U.rgba(this.def.col.b, .7); for (let i = -2; i <= 2; i++) ctx.fillRect(this.x + i * 10 - 4, this.y - 4 - Math.abs(Math.sin(this.anim * .3 + i)) * 7, 8, 5); return; }
        if (this.spawnT > 0) ctx.globalAlpha = 1 - this.spawnT / 30;
        ctx.globalAlpha *= k;
        if (this.telegraphing()) Paint.glow(ctx, this.x, this.y - this.h * .55, this.w + 10, this.def.col.g);
        Paint.flash = this.flash > 0;
        if (this.rig) this.rig.draw(ctx, this.x, this.y, this.facing, ctx.globalAlpha);
        else { ctx.save(); ctx.translate(this.x, this.y); ctx.scale(this.facing, 1); Bodies[this.def.body](ctx, this, this.def.col); ctx.restore(); }
        Paint.flash = false; ctx.globalAlpha = 1;
        if (!this.dead && this.hp < this.maxHp) {
            const w = Math.max(36, this.w), px = this.x - w / 2, py = this.y - this.h - 12;
            ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(px - 1, py - 1, w + 2, 6);
            ctx.fillStyle = this.def.elite ? '#ffcc00' : '#ff4433'; ctx.fillRect(px, py, w * this.hp / this.maxHp, 4);
        }
    }
}

/* Non-humanoid bodies. Drawn around feet at (0,0), facing +x. */
const Bodies = {
    /** Quadruped with stride tied to velocity, used for hounds, cats and wolves. */
    beast(c, e, C) {
        const s = Math.abs(e.vx) > .4 ? Math.sin(e.anim * .32) : 0, l = e.w * .42, h = e.h, leap = e.grounded ? 0 : -.35;
        const by = -h * .62 - Math.abs(s) * 2;
        const leg = (x, ph) => { const a = (ph ? s : -s) * .75 + leap; Paint.limb(c, { x, y: by + 4 }, { x: x + Math.sin(a) * 8, y: by + 12 }, 5, C.a); Paint.limb(c, { x: x + Math.sin(a) * 8, y: by + 12 }, { x: x + Math.sin(a) * 15, y: 0 }, 4, C.a); };
        leg(-l, 1); leg(l * .8, 0);
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(0, by, l + 7, h * .3, leap, 0, TAU); c.fill();
        leg(-l + 6, 0); leg(l * .8 - 6, 1);
        const tl = Math.sin(e.anim * .15) * 5;
        Paint.limb(c, { x: -l - 4, y: by - 2 }, { x: -l - 18, y: by - 10 + tl }, 4, C.b);
        for (let i = -2; i <= 2; i++) Paint.poly(c, [i * 8 - 4, by - h * .27, i * 8 + 4, by - h * .27, i * 8, by - h * .27 - 7], C.a);
        const open = e.telegraphing() ? 7 : 2;
        Paint.poly(c, [l + 2, by - 11, l + 24, by - 7, l + 26, by - 2 + open * .2, l + 4, by + 4], C.b);
        Paint.poly(c, [l + 6, by + 2, l + 26, by + 2, l + 22, by + 2 + open], C.a);
        c.fillStyle = Paint.c(C.g); c.fillRect(l + 12, by - 7, 5, 3);
    },
    bug(c, e, C) {
        const a = e.anim * .5;
        for (let i = 0; i < 3; i++) { const x = -14 + i * 14, f = Math.sin(a + i * 2) * 5; Paint.limb(c, { x, y: -11 }, { x: x - 8 + f, y: 0 }, 3, C.a); Paint.limb(c, { x, y: -11 }, { x: x + 8 - f, y: 0 }, 3, C.a); }
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(-4, -15, 21, 10, 0, 0, TAU); c.fill();
        c.fillStyle = Paint.c(C.a); for (let i = 0; i < 4; i++) c.fillRect(-20 + i * 11, -24, 3, 18);
        Paint.disc(c, 18, -14, 7, C.b); Paint.limb(c, { x: 22, y: -12 }, { x: 31, y: -18 + Math.sin(a) * 2 }, 3, C.g); Paint.limb(c, { x: 22, y: -9 }, { x: 31, y: -6 - Math.sin(a) * 2 }, 3, C.g);
    },
    sprout(c, e, C) {
        const s = Math.abs(e.vx) > .3 ? Math.sin(e.anim * .25) : 0, tel = e.telegraphing() ? 1 : 0;
        Paint.limb(c, { x: -5, y: -22 }, { x: -7 + s * 7, y: 0 }, 6, C.a); Paint.limb(c, { x: 5, y: -22 }, { x: 7 - s * 7, y: 0 }, 6, C.a);
        Paint.limb(c, { x: 0, y: -22 }, { x: 0, y: -44 }, 12, C.b);
        Paint.limb(c, { x: 3, y: -40 }, { x: 18 + tel * 6, y: -34 - tel * 22 }, 4, C.a); Paint.limb(c, { x: -3, y: -40 }, { x: -13, y: -24 }, 4, C.a);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.sin(e.anim * .05) * .15; Paint.poly(c, [0, -50, Math.cos(a - .3) * 11, -50 + Math.sin(a - .3) * 11, Math.cos(a) * 20, -50 + Math.sin(a) * 15, Math.cos(a + .3) * 11, -50 + Math.sin(a + .3) * 11], i % 2 ? C.a : C.b); }
        Paint.disc(c, 3, -50, 4.5, C.g);
    },
    bulb(c, e, C) {
        const p = 1 + Math.sin(e.anim * .08) * .05 + (e.telegraphing() ? .16 : 0);
        Paint.limb(c, { x: -14, y: 0 }, { x: -4, y: -12 }, 7, '#2c3a22'); Paint.limb(c, { x: 14, y: 0 }, { x: 4, y: -12 }, 7, '#2c3a22');
        c.fillStyle = Paint.c(C.a); c.beginPath(); c.ellipse(0, -24, 19 * p, 21 * p, 0, 0, TAU); c.fill();
        c.fillStyle = Paint.c(C.b); for (let i = -1; i <= 1; i++) { c.beginPath(); c.ellipse(i * 10, -24, 4, 17 * p, 0, 0, TAU); c.fill(); }
        Paint.disc(c, 10, -38, 7, '#120a18'); Paint.glow(c, 10, -38, 15, C.g);
    },
    golem(c, e, C) {
        const s = Math.abs(e.vx) > .2 ? Math.sin(e.anim * .15) : 0, tel = e.state === 'attack' && e.atk && e.atk.kind === 'slam' ? (e.atkT < e.atk.s ? 1 : -1) : 0, h = e.h;
        Paint.limb(c, { x: -12, y: -h * .36 }, { x: -13 + s * 10, y: -5 }, 13, C.a); Paint.limb(c, { x: 12, y: -h * .36 }, { x: 13 - s * 10, y: -5 }, 13, C.a);
        Paint.poly(c, [-20, -h * .32, 20, -h * .32, 27, -h * .78, 12, -h * .92, -12, -h * .92, -27, -h * .78], C.b);
        c.strokeStyle = Paint.c(C.g); c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -h * .35); c.lineTo(5, -h * .5); c.lineTo(-3, -h * .63); c.lineTo(6, -h * .82); c.stroke();
        Paint.glow(c, 2, -h * .6, 18, C.g);
        const ar = tel > 0 ? -2 : tel < 0 ? .3 : .25 + Math.sin(e.anim * .05) * .08;
        const hx = 26 + Math.sin(ar) * 34, hy = -h * .76 + Math.cos(ar) * 34;
        Paint.limb(c, { x: 23, y: -h * .76 }, { x: hx, y: hy }, 14, C.a); Paint.disc(c, hx, hy, 11, C.b);
        Paint.limb(c, { x: -23, y: -h * .76 }, { x: -29 - s * 7, y: -h * .36 }, 13, C.a);
        Paint.disc(c, 3, -h * .95, 11, C.b); c.fillStyle = Paint.c(C.g); c.fillRect(4, -h * .97, 8, 3);
    },
    mech(c, e, C) {
        const s = Math.abs(e.vx) > .2 ? Math.sin(e.anim * .16) : 0, h = e.h;
        Paint.limb(c, { x: -13, y: -h * .46 }, { x: -18 + s * 9, y: -h * .2 }, 7, C.a); Paint.limb(c, { x: -18 + s * 9, y: -h * .2 }, { x: -12 + s * 9, y: 0 }, 6, C.b);
        Paint.limb(c, { x: 13, y: -h * .46 }, { x: 18 - s * 9, y: -h * .2 }, 7, C.a); Paint.limb(c, { x: 18 - s * 9, y: -h * .2 }, { x: 12 - s * 9, y: 0 }, 6, C.b);
        c.fillStyle = Paint.c(C.a); c.fillRect(-23, -h * .95, 46, h * .54);
        c.fillStyle = Paint.c(C.b); c.fillRect(-19, -h * .91, 38, 8); c.fillRect(-24, -h * .6, 48, 5);
        c.fillStyle = Paint.c(C.g); c.fillRect(6, -h * .8, 15, 7); Paint.glow(c, 14, -h * .77, 15, C.g);
        c.fillStyle = Paint.c('#22242a'); c.fillRect(19, -h * .67, 26, 8);
    },
    obelisk(c, e, C) {
        const h = e.h, b = Math.sin(e.anim * .05) * 3;
        Paint.poly(c, [-24, 0, 24, 0, 18, -h * .22 + b, -18, -h * .22 + b], C.a);
        Paint.poly(c, [-17, -h * .25 + b, 17, -h * .25 + b, 11, -h + b, -11, -h + b], C.b);
        for (let i = 0; i < 4; i++) { c.fillStyle = Paint.c(C.g); c.globalAlpha *= .4 + Math.abs(Math.sin(e.anim * .06 + i)) * .6; c.fillRect(-7, -h * (.36 + i * .15) + b, 14, 3); c.globalAlpha = Math.min(1, c.globalAlpha / .6); }
        if (e.armorFront) Paint.poly(c, [18, -h * .95, 30, -h * .8, 30, -h * .1, 18, -h * .02], '#3a3a54');
        Paint.glow(c, 0, -h * .8 + b, 14, C.g);
    },
    shell(c, e, C) {
        const s = Math.abs(e.vx) > .2 ? Math.sin(e.anim * .28) : 0, h = e.h;
        for (let i = 0; i < 4; i++) { const x = -24 + i * 16; Paint.limb(c, { x, y: -12 }, { x: x + (i % 2 ? s : -s) * 8, y: 0 }, 6, C.a); }
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(-3, -h * .5, 33, h * .46, 0, Math.PI, TAU); c.closePath(); c.fill();
        c.fillStyle = Paint.c(C.a); c.fillRect(-36, -h * .52, 66, 12);
        c.strokeStyle = Paint.c(C.a); c.lineWidth = 3; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 12 - 2, -h * .54); c.lineTo(i * 8 - 2, -h * .94); c.stroke(); }
        Paint.poly(c, [28, -h * .55, 38, -h * .32, 28, -12, 26, -h * .3], '#b8d6ea');
        c.fillStyle = Paint.c(C.g); c.fillRect(30, -h * .38, 5, 4);
    },
    drone(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .1) * 2;
        c.fillStyle = Paint.c(C.a); c.fillRect(-15, y - 8, 30, 15);
        c.fillStyle = Paint.c(C.b); c.fillRect(-15, y - 8, 30, 4); c.fillRect(-21, y - 13, 42, 3);
        const w = Math.abs(Math.sin(e.anim * .8)) * 13; c.fillStyle = Paint.c(C.b); c.fillRect(-19 - w / 2, y - 16, w, 2); c.fillRect(19 - w / 2, y - 16, w, 2);
        Paint.disc(c, 7, y, 4.5, C.g); Paint.glow(c, 7, y, 13, C.g);
    },
    moth(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .08) * 4, f = .4 + Math.abs(Math.sin(e.anim * .3)) * .8;
        Paint.limb(c, { x: -8, y }, { x: 9, y }, 6, C.a);
        c.fillStyle = Paint.c(C.b); c.globalAlpha *= .85;
        c.beginPath(); c.ellipse(-2, y - 11 * f, 13, 13 * f, -.4, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(-2, y + 9 * f, 10, 9 * f, .4, 0, TAU); c.fill(); c.globalAlpha /= .85;
        Paint.glow(c, 0, y, 20, C.g);
    },
    wisp(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .07) * 5;
        Paint.glow(c, 0, y, 30, C.g);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + e.anim * .03; Paint.poly(c, [Math.cos(a) * 15, y + Math.sin(a) * 15, Math.cos(a + .5) * 6, y + Math.sin(a + .5) * 6, Math.cos(a - .5) * 6, y + Math.sin(a - .5) * 6], C.b); }
        Paint.disc(c, 0, y, 6, '#fff');
    },
    imp(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .1) * 3, f = Math.sin(e.anim * .4);
        Paint.poly(c, [-4, y - 2, -24, y - 14 - f * 9, -18, y + 2, -26, y + 8 - f * 5, -4, y + 5], C.a);
        Paint.poly(c, [4, y - 2, 22, y - 14 - f * 9, 17, y + 2, 24, y + 8 - f * 5, 4, y + 5], C.a);
        Paint.disc(c, 0, y, 9.5, C.b); Paint.poly(c, [-6, y - 7, -9, y - 16, -1, y - 8], C.a); Paint.poly(c, [6, y - 7, 9, y - 16, 1, y - 8], C.a);
        c.fillStyle = Paint.c('#ffee88'); c.fillRect(2, y - 3, 5, 3); Paint.glow(c, 0, y, 20, C.g);
    },
    blob(c, e, C) {
        const h = e.h, w = e.w, q = Math.sin(e.anim * .12) * 3;
        c.fillStyle = Paint.c(C.a); c.beginPath(); c.moveTo(-w / 2 - 4, 0); c.quadraticCurveTo(-w / 2 + q, -h, 4, -h + q); c.quadraticCurveTo(w / 2 + 6 - q, -h * .8, w / 2 + 6, 0); c.closePath(); c.fill();
        c.strokeStyle = Paint.c(C.g); c.lineWidth = 2.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-18 + i * 11, -3); c.lineTo(-13 + i * 10 + q, -h * .6); c.stroke(); }
        Paint.glow(c, 12, -h * .55, 18, C.g); c.fillStyle = Paint.c('#ffee88'); c.fillRect(13, -h * .68, 7, 4);
    },
    worm(c, e, C) {
        const h = e.h, tel = e.telegraphing() ? 1 : 0;
        for (let i = 0; i < 6; i++) { const u = i / 5, x = Math.sin(e.anim * .08 + i) * 3, r = 19 - u * 5; Paint.disc(c, x + u * 8, -u * h, r, i % 2 ? C.a : C.b); }
        for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6 - tel; Paint.poly(c, [8, -h, 8 + Math.cos(a) * 17, -h + Math.sin(a) * 17, 11, -h + 5], '#e8d8b0'); }
        Paint.glow(c, 8, -h, 15, C.g);
    }
};
