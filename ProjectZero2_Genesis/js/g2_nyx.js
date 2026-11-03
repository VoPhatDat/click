'use strict';
/**
 * G2 NYX: the protagonist. A child with no name, no shadow and no memory, who grows across the
 * seven days. Night is her power. At six (Day One) she cannot fight: she hides, climbs, makes
 * little nights, and points. Zero walks with her, driven by AI, and takes her orders:
 * Follow, Attack, Hold. Built on the Part II Player and the Part I rig.
 */
const NYX_AGES = { 1: 6, 2: 8, 3: 10, 4: 13, 5: 14, 6: 15, 7: 17 };
const nyxStyle = age => {
    const k = U.clamp((age - 6) / 11, 0, 1), sc = .7 + k * .3;
    return {
        scale: sc, bone: { thigh: 12 + k * 3, shin: 12 + k * 3, upper: 10 + k * 2, fore: 10 + k * 2, torso: 16 + k * 5, head: 9 - k, limbW: 5, waist: 5, chest: 6 + k },
        col: { armor: '#e8eeff', armor2: '#bcc8ff', dark: '#6a6ea0', skin: '#f4e2d4', boot: '#2a2448', glow: '#b48cff', glove: '#f4e2d4' },
        weaponLen: 20, chainSeg: 6, gait: { stride: 30, knee: 50, arm: 18, armF: 16, armB: -16, elbow: 26, lean: 10, bounce: 3, off: 3 },
        idle: { aF: 12, fF: 26, aB: -10, fB: 22, lean: 2, lF: 6, lB: -6, head: -4 },
        paint: paintHumanoid,
        chainPaint(c, r) { paintChain(7, '#8a7ad8', '#d8ccff')(c, r); },
        skirt(c, J) { const h = J.hip; Paint.poly(c, [h.x - 7, h.y - 4, h.x + 7, h.y - 4, h.x + 12, h.y + 13, h.x - 12, h.y + 13], '#dfe6ff'); c.fillStyle = Paint.c('#b48cff'); c.fillRect(h.x - 11, h.y + 11, 22, 2); },
        headGear(c, J, S, r) {
            const h = J.head, B = S.bone.head;
            Paint.disc(c, h.x - 1.5, h.y - 1.5, B * .98, '#d8e0f8');
            Paint.poly(c, [h.x - B, h.y - 2, h.x - B * 1.25, h.y + B * 1.4, h.x - B * .3, h.y + B * .4], '#c8d2f0');
            Paint.poly(c, [h.x + 1, h.y - 3, h.x + B * 1.05, h.y - 2, h.x + B, h.y + 3, h.x + 1, h.y + 4], '#f4e2d4');
            c.fillStyle = Paint.c('#4a3a8a'); c.fillRect(h.x + B * .45, h.y - 1, 2, 2.2);
            Paint.glow(c, h.x - B * .5, h.y - B * 1.05, 9, '#b48cff'); Paint.disc(c, h.x - B * .5, h.y - B * 1.05, 2, '#f0e8ff');
        },
        weaponF: null
    };
};
CHARS.nyx = {
    id: 'nyx', name: 'NYX', role: 'THE CHILD WHO SLEEPS', title: 'Nyx',
    hp: 90, atk: 8, speed: 4.6, jump: 13, energy: 100,
    dodge: { spd: 12, frames: 16, inv: 14, cd: 40, air: false, clip: 'roll' },
    bars: { POWER: 1, DURABILITY: 2, MOBILITY: 4, RANGE: 3 },
    bio: 'A little girl who appeared on the first day of the new world. No name, no shadow, no memory. In a city where nobody can sleep, she is the only one who sleeps soundly, and the only one with darkness under her feet.',
    line: '"Is it night yet?"', weakness: 'Six years old. She cannot fight; Zero fights for her.',
    passive: { name: 'Night', desc: 'The only darkness in a world without evening. Foes cannot see you inside your own shade, and light cannot reach through it.' },
    noAttack: true, style: nyxStyle(6),
    skills: {
        s1: { name: 'Little Night', desc: 'Pull a small night around you for 4 seconds. Inside it no one can see you, light cannot touch you, and a shadowless foe loses his shield.', cost: 25, cd: 360, col: '#b48cff', *run(p) { p.pose({ aF: 150, fF: 20, aB: 150, fB: 20, head: -16 }, 8); G.fields.push({ kind: 'g2shade', x: p.x, y: p.y - 30, r: 96, t: 0, life: 240, owner: p, col: '#2a1a5a' }); Sound.sfx('blink', { v: .6 }); VFX.ring(p.x, p.y - 30, 100, '#b48cff', 18, 6); yield 10; } },
        s2: { name: 'Call Zero', desc: 'Call out. Zero comes to your side at once and strikes whatever is closest to you.', cost: 15, cd: 240, col: '#00ffff', *run(p) { p.pose({ aF: 160, fF: 10, head: -12 }, 6); G.say('NYX', U.pick(['Uncle!', 'Zero!', 'Over here!']), 60); if (G.ally) G.ally.aiCall = 30; yield 10; } },
        s3: { name: 'Hum', desc: 'Hum the lullaby Zero sings to you. Lesser foes nearby grow drowsy and slow for 4 seconds.', cost: 30, cd: 600, col: '#e0d0ff', *run(p) { p.pose({ head: -10, aF: 30, fF: 60 }, 6); Sound.sfx('toll', { v: .3 }); VFX.ring(p.x, p.y - 30, 170, '#e0d0ff', 26, 6); for (const t of Combat.targetsNear(p.x, p.y - 30, 170)) if (!t.boss) { t.slowT = 240; t.stun = Math.max(t.stun || 0, 40); VFX.text(t.x, t.y - t.h - 10, 'z z z', '#e0d0ff', 14, 50); } yield 14; } }
    },
    ult: { name: 'A NIGHT FOR EVERYONE', col: '#b48cff', *run(p) { Combat.banner(p, 'A NIGHT FOR EVERYONE', '#b48cff', 30); p.inv = 90; G.darken = .6; yield 20; for (const t of Combat.targetsNear(p.x, p.y - 30, 700)) if (!t.boss) { t.stun = 300; VFX.text(t.x, t.y - t.h - 10, 'z z z', '#e0d0ff', 16, 80); } else t.shade = Math.max(t.shade || 0, 240); yield 40; G.darken = 0; } },
    upgrades: [
        { id: 'n_hp', name: 'Growing Up', desc: '+15% max HP.', cost: 1, mod: { hp: .15 }, branch: 'Faith' },
        { id: 'n_en', name: 'Deep Breath', desc: '+30 max energy.', cost: 1, mod: { energy: 30 }, branch: 'Grace' },
        { id: 'n_s1', name: 'Little Night: Longer Dark', desc: 'Variant: your night lasts 6 seconds.', cost: 2, branch: 'Grace' },
        { id: 'n_s3', name: 'Hum: Second Verse', desc: 'Variant: the hum reaches 40% further.', cost: 2, branch: 'Faith' },
        { id: 'n_dodge', name: 'Small and Quick', desc: 'Dodge cooldown is 30% shorter.', cost: 2, mod: { dodgeCd: .3 }, branch: 'Grace' },
        { id: 'n_dr', name: 'Held Tight', desc: 'Take 10% less damage.', cost: 3, mod: { dr: .1 }, branch: 'Faith' }
    ],
    weapons: [{ id: 'hands', name: 'Bare Hands', desc: 'Six years old. Nothing to hold yet.', gear: null, len: 10 }]
};
CHARS.nyx.skills.s1.run = function* (p) { p.pose({ aF: 150, fF: 20, aB: 150, fB: 20, head: -16 }, 8); G.fields.push({ kind: 'g2shade', x: p.x, y: p.y - 30, r: 96, t: 0, life: p.up('n_s1') ? 360 : 240, owner: p, col: '#2a1a5a' }); Sound.sfx('blink', { v: .6 }); VFX.ring(p.x, p.y - 30, 100, '#b48cff', 18, 6); yield 10; };
if (!CHAR_ORDER.includes('nyx')) CHAR_ORDER.unshift('nyx');
WEAPONS2.nyx = CHARS.nyx.weapons;

const G2Night = {
    shadeAt(x, y) { return G.fields.some(f => f.kind === 'g2shade' && Math.hypot(f.x - x, f.y - y) < f.r); },
    nyxHidden() { const P = G.player; return P && P.id === 'nyx' && this.shadeAt(P.x, P.y - 30); }
};

/* ------------------------------ Zero, driven by AI ------------------------------ */
G2.ZERO_MODES = ['follow', 'attack', 'hold'];
G2.spawnAlly = function () {
    G.ally = null;
    const P = G.player; if (!P || P.id !== 'nyx' || (Save.data.g2.chapter || 1) >= 5 || G.level.noAlly) return;
    const z = new Player('zero'); z.isAlly = true; z.x = P.x - 60; z.y = P.y; z.safe = { x: z.x, y: z.y }; z.grounded = true; z.facing = 1;
    z.aiMode = Save.data.g2.zeroMode || 'follow'; z.holdX = z.x; G.ally = z;
};
G2.commandZero = function () {
    const z = G.ally; if (!z) return; z.aiMode = G2.ZERO_MODES[(G2.ZERO_MODES.indexOf(z.aiMode) + 1) % 3]; z.holdX = z.x; Save.data.g2.zeroMode = z.aiMode;
    G.toast('Zero: ' + tr({ follow: 'Follow', attack: 'Attack', hold: 'Hold' }[z.aiMode]), '#00ffff'); Sound.sfx('ui_move');
};
G2.zeroBrain = function (z) {
    const N = G.player, S = {}, L = G.level, go = d => { if (d < 0) S.left = true; else if (d > 0) S.right = true; };
    const jump = () => { S.jump = true; if (z.grounded || z.jumps < 2) S['!jump'] = true; };
    if (z.state === 'dead') return S;
    // Find something to fight: the boss when it can be hurt, else whatever is hunting Nyx.
    let tgt = null; const b = G.boss;
    if (b && !b.untargetable && !b.hide && !b.intro && !b.dead) tgt = b;
    if (!tgt) { let bd = z.aiMode === 'attack' ? 720 : 360; for (const e of G.enemies) { if (e.dead || e.untargetable || e.boss || e.g2charm || e.type === 'dummy' || (e.flyer && e.y < z.y - 170 && !(z.aiReach > 0))) continue; const d = Math.min(Math.abs(e.x - N.x), z.aiMode === 'attack' ? Math.abs(e.x - z.x) : 1e9); if (d < bd && Math.abs(e.y - N.y) < 300) { bd = d; tgt = e; } } }
    if (z.aiCall > 0) { z.aiCall--; if (Math.hypot(z.x - N.x, z.y - N.y) > 140) { G.afterimage(z, '#00ffff'); z.x = N.x - N.facing * 46; z.y = N.y; z.vy = 0; VFX.burst(z.x, z.y - 30, '#00ffff', 14, 4, 22, 6, 1); Sound.sfx('blink', { v: .5 }); } }
    const far = Math.abs(z.x - N.x) > 860 || Math.abs(z.y - N.y) > 380;
    if (far && !tgt) { G.afterimage(z, '#00ffff'); z.x = N.x - N.facing * 60; z.y = N.y; z.vy = 0; z.vx = 0; return S; }
    if (tgt && !(z.aiMode === 'hold' && Math.abs(tgt.x - z.holdX) > 240)) {
        const a = tgt.aim ? tgt.aim() : { x: tgt.x, y: tgt.y - tgt.h / 2 }, dx = a.x - z.x, reach = 56;
        if (Math.abs(dx) > reach) go(dx); else z.facing = U.sign(dx);
        if (Math.abs(dx) < reach + 30) { if (G.time % 4 === 0) { S['!attack'] = true; S.attack = true; } }
        if (a.y < z.y - 120 && Math.abs(dx) < 120 && z.grounded) jump();
        if (G.time % 150 === 0 && Math.abs(dx) < 200) S['!skill1'] = true;
        if (G.time % 211 === 0 && Math.abs(dx) > 220) { S['!skill3'] = true; S[dx > 0 ? 'right' : 'left'] = true; }
        if (z.ult >= 100 && tgt.boss) S['!ult'] = true;
    } else {
        const want = z.aiMode === 'hold' ? z.holdX : N.x - N.facing * 64, dx = want - z.x;
        if (Math.abs(dx) > 34) go(dx);
        if (N.y < z.y - 70 && Math.abs(N.x - z.x) < 200) jump();
    }
    const dir = S.right ? 1 : S.left ? -1 : 0;
    if (dir && z.grounded && (z.onWall || L.surfaceBelow(z.x + dir * 40, z.y - 10, 120) === null)) jump();
    if (!z.grounded && z.vy > 2 && z.jumps < 2 && L.surfaceBelow(z.x, z.y, 200) === null) jump();
    const wantWrath = tgt && tgt.armorFront && z.balance < 70;
    if (z.form === 'light' && (z.balance < 20 || wantWrath)) S['!form'] = true; else if (z.form === 'wrath' && (z.balance > 80 || (!wantWrath && z.balance > 60))) S['!form'] = true;
    return S;
};
(function () {
    const P2 = Player, base = P2.prototype;
    const upd = base.update, hurt = base.hurt, draw = base.draw, tc = base.tryCombat, fo = base.fallOut, rts = base.returnToSafe;
    base.update = function () {
        if (this.isAlly) {
            const keep = Input.simulated, lock = G.lockInput; Input.simulated = G.lockInput ? {} : G2.zeroBrain(this);
            try { upd.call(this); } finally { Input.simulated = keep; }
            Light.add(this.x, this.y - 30, 200, '#00ffff', .5); return;
        }
        upd.call(this);
        // A child heals quickly once the danger passes; Zero keeps her safe in the meantime.
        if (this.id === 'nyx' && this.state !== 'dead' && this.lastHurt > 150 && this.hp < this.maxHp && G.time % 8 === 0) this.heal(1, true);
        if (this === G.player && G.ally) G.ally.update();
    };
    base.hurt = function (dmg, src) { if (this.isAlly) return false; if (this.id === 'nyx') dmg *= (NYX_AGES[Save.data.g2.chapter || 1] || 6) < 10 ? .45 : .75; const r = hurt.call(this, dmg, src); if (r && this.id === 'nyx') { this.inv = Math.max(this.inv, src && src.tick ? 16 : 75); if (G.ally) G.ally.aiCall = Math.max(G.ally.aiCall || 0, 1); } return r; };
    base.fallOut = function () { if (this.isAlly) { const N = G.player; this.x = N.x - 50; this.y = N.y; this.vy = 0; return; } return fo.call(this); };
    base.returnToSafe = function () { if (this.isAlly) { const N = G.player; this.x = N.x - 50; this.y = N.y; this.vx = this.vy = 0; this.state = 'move'; this.script = null; this.noGrav = false; return; } return rts.call(this); };
    base.tryCombat = function (In) {
        if (this.def.noAttack) {
            if (In.pressed('nyx')) G2.commandZero();
            if (In.pressed('attack') && G.ally) { G.ally.aiCall = Math.max(G.ally.aiCall || 0, 1); this.rig.custom([[0, { aF: 100, fF: 0, head: -6 }], [1, { aF: 100, fF: 0, head: -6 }]], 14, 3); }
            this.atkBuf = 0;
        }
        return tc.call(this, In);
    };
    base.draw = function (ctx) {
        if (this === G.player && G.ally) { const z = G.ally; Scene.shadow(ctx, z.x, z.grounded ? z.y : -999, 22); z.draw(ctx); }
        if (this.id === 'nyx') { // the only shadow in the city lies under her
            ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = '#1a1030'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 26, 6, 0, 0, TAU); ctx.fill(); ctx.restore();
            if (G2Night.nyxHidden()) { ctx.globalAlpha = .5; }
        }
        draw.call(this, ctx); ctx.globalAlpha = 1;
    };
    // Little nights hide Nyx and stop the light; the shadowless lose their shields inside them.
    const sees = Enemy.prototype.sees; Enemy.prototype.sees = function (d, dx, dy) { if (G2Night.nyxHidden()) return false; return sees.call(this, d, dx, dy); };
    const eu = Enemy.prototype.update;
    Enemy.prototype.update = function () { if (this.state === 'chase' && G2Night.nyxHidden() && !this.lock && Math.abs(this.x - G.player.x) > 60) { this.state = 'idle'; this.t = 60; VFX.text(this.x, this.y - this.h - 12, '?', '#b48cff', 20, 30); } eu.call(this); };
    const cov = Shadow.covered.bind(Shadow); Shadow.covered = (lx, ly, x, y) => cov(lx, ly, x, y) || G2Night.shadeAt(x, y);
    const tf = Combat.tickFields, df = Combat.drawFields;
    Combat.drawFields = function (c) {
        df.call(Combat, c);
        for (const f of G.fields) if (f.kind === 'g2shade') { const a = Math.min(1, f.t / 10, (f.life - f.t) / 30); c.save(); c.globalAlpha = .7 * a; const g = c.createRadialGradient(f.x, f.y, 10, f.x, f.y, f.r); g.addColorStop(0, 'rgba(20,10,50,.9)'); g.addColorStop(1, 'rgba(20,10,50,0)'); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); for (let i = 0; i < 6; i++) Paint.disc(c, f.x + Math.cos(i * 1.1 + f.t * .01) * f.r * .6, f.y + Math.sin(i * 1.7) * f.r * .4, 1.6, '#e8e0ff'); c.restore(); }
    };
    // Nyx is born of night: in the blind phase she sees farther than anyone.
    const ll = Game.loadLevel.bind(Game);
    Game.loadLevel = function (id, cp) {
        const D = Save.data; if (D && !D.unlocked.includes(D.activeChar)) D.activeChar = 'nyx';
        ll(id, cp);
        if (G.player.id === 'nyx') { const age = NYX_AGES[D.g2.chapter || 1] || 6; G.player.rig.S = nyxStyle(age); }
        G2.spawnAlly();
    };
})();
