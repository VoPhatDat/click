'use strict';
/**
 * DAY THREE, LAND AND TREE: THE FOREST OF MEMORY. Nyx is ten. Buried memories grow into trees; touch
 * one and you see the past. Nyx sees Zero's, runs, gets lost; Zero finds her and carves her a wooden
 * sword. Mini-boss: the Memory Scarecrow. Boss: THE GARDENER, MOTHER OF ROOTS: roots, then heart,
 * then mask. Heal or destroy the tree. From here on Zero coughs ash.
 */
Object.assign(THEMES, {
    memory: { step: 'grass', dust: '#6a7a4a', debris: '#4a3a20', music: 'g2forest', amb: 'forest', ambient: '#a8a8a0', tile: { base: '#2a2018', mid: '#3e3020', top: '#4a6a32', edge: '#9ac070', back: '#141812', backLine: '#20261a' } },
    roots: { step: 'grass', dust: '#6a5a3a', debris: '#4a3a20', music: 'g2gardener', amb: 'forest', ambient: '#a09888', tile: { base: '#241a12', mid: '#38281a', top: '#5a4a2a', edge: '#c8a060', back: '#120e0a', backLine: '#1e1610' } }
});
(function () {
    const B = {
        memory() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#1a2030'], ['#3a4a48', .5], ['#6a6a50', .8], ['#4a4a38', 1]]); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { x.fillStyle = 'rgba(255,240,190,.04)'; const px = 200 + R() * BG_W; x.beginPath(); x.moveTo(px, 0); x.lineTo(px + 40, 0); x.lineTo(px - 180, VH); x.lineTo(px - 260, VH); x.fill(); } });
            add(.12, (x, R) => { for (let px = 0; px < BG_W; px += 60 + R() * 80) { x.fillStyle = 'rgba(40,50,40,.55)'; x.fillRect(px, 0, 14 + R() * 20, VH); } });
            add(.3, (x, R) => { for (let px = 0; px < BG_W; px += 120 + R() * 140) { const w = 30 + R() * 30; x.fillStyle = '#1e241a'; x.fillRect(px, 0, w, VH); x.fillStyle = 'rgba(255,230,160,.5)'; for (let k = 0; k < 3; k++) Paint.disc(x, px + w / 2 + U.rand(-30, 30), 200 + R() * 260, 3 + R() * 3, 'rgba(255,220,150,.45)'); } });
            add(.55, (x, R) => { x.fillStyle = '#12160e'; for (let px = 0; px < BG_W; px += 200 + R() * 200) { x.beginPath(); x.ellipse(px, 0, 160, 120, 0, 0, Math.PI); x.fill(); x.fillRect(px - 20, 0, 40, VH); } });
            return L;
        },
        roots() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#0e0c0a'], ['#2a2016', .55], ['#1a140e', 1]]); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .4; x.drawImage(Glow.get('#c8a060'), 500, 100, 500, 500); x.globalAlpha = 1; });
            add(.2, (x, R) => { x.strokeStyle = '#2a1e12'; for (let i = 0; i < 40; i++) { x.lineWidth = 6 + R() * 18; x.beginPath(); const px = R() * BG_W; x.moveTo(px, 0); x.bezierCurveTo(px + U.rand(-200, 200), 200, px + U.rand(-200, 200), 400, px + U.rand(-300, 300), VH); x.stroke(); } });
            return L;
        }
    };
    const bb = Backdrop.build.bind(Backdrop); Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return bb(id); };
    const ab = Atmos.build.bind(Atmos), fg = {}; Atmos.build = function (id) { if (!B[id]) return ab(id); if (fg[id]) return fg[id]; const c = U.canvas(BG_W, VH), x = c.getContext('2d'), R = U.mulberry(id.length * 23); for (let px = 0; px < BG_W; px += 160 + R() * 240) { x.fillStyle = 'rgba(14,18,10,.65)'; x.beginPath(); x.ellipse(px, -10, 110, 50, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(14,18,10,.6)'; x.lineWidth = 3; x.beginPath(); x.moveTo(px, 20); x.quadraticCurveTo(px + 14, 80, px - 6, 130 + R() * 60); x.stroke(); } return fg[id] = c; };
    Atmos.fogCol.memory = '#9aa088';
})();

/* ------------------------------ ENEMIES ------------------------------ */
Object.assign(ENEMIES, {
    woodchild: { name: 'Wooden Child', ai: 'melee', body: 'sprout', hp: 70, dmg: 11, spd: 2.9, xp: 15, col: { a: '#6a4a2a', b: '#a07a4a', g: '#ffd88a' }, atks: [mkA(A.bite, { s: 18 })] },
    rootgrab: { name: 'Grasping Root', ai: 'burrow', body: 'worm', hp: 90, dmg: 9, spd: 2.4, xp: 16, w: 40, h: 50, roots: true, col: { a: '#4a3420', b: '#7a5a34', g: '#c8a060' }, atks: [mkA(A.bite, { s: 16, range: 70 })] },
    membutterfly: { name: 'Memory Butterfly', ai: 'support', body: 'moth', hp: 44, dmg: 6, spd: 3, xp: 14, w: 34, h: 26, flyer: true, col: { a: '#c8a8e0', b: '#fff0d8', g: '#ffe8a0' }, atks: [mkA(A.heal, { cd: 200 })] },
    hollowstag: { name: 'Hollow Stag', ai: 'elite', body: 'beast', elite: true, hp: 600, dmg: 20, spd: 4, xp: 160, poise: 60, w: 70, h: 56, col: { a: '#3a2a1a', b: '#7a6040', g: '#ffd88a' }, atks: [mkA(A.charge, { spd: 13, s: 26 }), mkA(A.bite, { s: 14 }), mkA(A.slam, { rad: 140 })] }
});
(function () { // grasping roots hold your feet
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (dmg, src) { const r = hurt.call(this, dmg, src); if (r && src && src.owner && src.owner.def && src.owner.def.roots) { this.slowT = 90; this.vx = 0; VFX.text(this.x, this.y - 70, tr('ROOTED'), '#c8a060', 13, 40); } return r; };
})();

/* ------------------------------ MINI-BOSS: THE MEMORY SCARECROW ------------------------------ */
const B_SCARECROW = {
    id: 'scarecrow', name: 'THE MEMORY SCARECROW', title: 'IT KEEPS WHAT THE CROWS TAKE', hp: 3200, w: 70, h: 170, col: '#c8a060', mini: true, music: 'g2scarecrow', reward: { xp: 600, relic: 'ember', cells: 130 },
    init: b => ({}),
    aim: b => ({ x: b.x, y: b.y - 110 }),
    phases: [{ moves: ['crows', 'scythe', 'hop', 'crows'], rest: 34 }, { at: .5, moves: ['crows', 'scythe', 'swap', 'hop'], rest: 24, say: ['THE MEMORY SCARECROW', 'I keep everything the crows take. Your guardian\'s fire is in my straw.'] }],
    moves: {
        *crows(b) { for (let i = 0; i < 5; i++) { const a = Math.atan2(b.P.y - 40 - (b.y - 150), b.P.x - b.x) + U.rand(-.25, .25); Combat.eshoot(b, 'knife', b.x, b.y - 150, a, 7.5, b.D(10), { r: 8, life: 120, col: '#1a1410' }); Sound.sfx('screech', { v: .4 }); yield 10; } yield 30; },
        *scythe(b) { b.facing = b.P.x > b.x ? 1 : -1; Combat.warn({ shape: 'rect', x: b.x - 170, y: b.A.y - 120, w: 340, h: 120, t: 34, dmg: b.D(18), src: b, kb: 10 }); yield 34; VFX.slash(b.x, b.A.y - 70, 170, b.facing, '#c8a060'); Sound.sfx('swing_h'); yield 26; },
        *hop(b) { const tx = U.clamp(b.P.x, b.A.x0 + 60, b.A.x1 - 60), sx = b.x; Combat.warn({ shape: 'circle', x: tx, y: b.A.y - 30, r: 120, t: 40, dmg: b.D(20), src: b }); for (let i = 1; i <= 40; i++) { const k = i / 40; b.x = U.lerp(sx, tx, k); b.y = b.A.y - Math.sin(k * Math.PI) * 220; yield 1; } b.y = b.A.y; G.addShake(10); Sound.sfx('slam'); yield 26; },
        *swap(b) { const P = b.P, px = P.x; VFX.burst(b.x, b.y - 80, '#c8a060', 20, 6, 24, 6, 1); Sound.sfx('blink'); P.x = b.x; b.x = px; G.toast('It took your place!', '#c8a060'); yield 40; }
    },
    draw(c, b) {
        const f = b.flash > 0, x = b.x, y = b.y, sw = Math.sin(b.anim * .05) * .06;
        c.save(); c.translate(x, y); c.rotate(sw);
        c.fillStyle = '#4a3420'; c.fillRect(-4, -170, 8, 170); c.fillRect(-70, -130, 140, 7);
        c.fillStyle = f ? '#fff' : '#a07a3a'; Paint.poly(c, [-26, -140, 26, -140, 34, -60, -34, -60], c.fillStyle); for (let i = 0; i < 8; i++) Paint.poly(c, [-34 + i * 9, -60, -30 + i * 9, -60, -32 + i * 9 + Math.sin(b.anim * .1 + i) * 3, -40], '#c8a060');
        for (const d of [-1, 1]) for (let i = 0; i < 4; i++) Paint.poly(c, [d * 70, -130 + i * 2, d * 82, -134 + i * 4, d * 80, -122 + i * 3], '#c8a060');
        Paint.disc(c, 0, -156, 18, f ? '#fff' : '#d8c8a0'); c.fillStyle = '#1a1410'; c.fillRect(-9, -160, 5, 5); c.fillRect(4, -160, 5, 5); c.fillRect(-7, -148, 14, 2);
        Paint.poly(c, [-24, -170, 24, -170, 0, -200], '#3a2a1a'); Paint.glow(c, 0, -110, 26, '#ffd88a');
        c.restore();
    }
};

/* ------------------------------ BOSS: THE GARDENER, MOTHER OF ROOTS ------------------------------ */
class GPart extends BossPart { constructor(b, get, w, h, key) { super(b, get, w, h, 1); this.key = key; } hurt(d, o) { const m = this.b.def.partMult(this.b, this.key); if (!m) { if (G.time % 20 === 0) VFX.text(this.x, this.y - this.h - 6, tr('IMMUNE'), '#c8a060', 12, 24); return 0; } this.b.flashPart = this.key; return this.b.hurt(d * m, o); } }
const B_GARDENER = {
    id: 'gardener', name: 'THE GARDENER', title: 'MOTHER OF ROOTS', hp: 10500, w: 220, h: 300, col: '#c8a060', female: true, choice: true, music: 'g2gardener', reward: { xp: 1300, relic: 'mirror', cells: 280 },
    init: b => ({ hold: 0 }),
    aim: b => B_GARDENER.aiTarget(b),
    box: b => ({ x: b.x - 4, y: b.y - 999, w: 1, h: 1 }),
    parts: b => [new GPart(b, b => ({ x: b.x - 150, y: b.A.y }), 70, 60, 'rootL'), new GPart(b, b => ({ x: b.x + 150, y: b.A.y }), 70, 60, 'rootR'), new GPart(b, b => ({ x: b.x, y: b.A.y - 130 }), 70, 70, 'heart'), new GPart(b, b => ({ x: b.x, y: b.A.y - 220 - (b.bow || 0) * 120 }), 60, 60, 'mask')],
    partMult: (b, k) => b.phase === 0 ? (k === 'rootL' || k === 'rootR' ? 1 : 0) : b.phase === 1 ? (k === 'heart' ? 1.4 : k.startsWith('root') ? .25 : 0) : (k === 'mask' ? (b.bow > .5 ? 1.8 : .4) : k === 'heart' ? .5 : 0),
    aiTarget: b => b.phase === 0 ? { x: b.x + (G.ally && G.ally.x > b.x ? 150 : -150), y: b.A.y - 30 } : b.phase === 1 ? { x: b.x, y: b.A.y - 165 } : { x: b.x, y: b.A.y - 250 - (b.bow || 0) * 120 + (b.bow > .5 ? 150 : 0) },
    tick(b) { if (b.bowT > 0) { b.bowT--; b.bow = U.lerp(b.bow || 0, 1, .1); } else b.bow = U.lerp(b.bow || 0, 0, .06); Light.add(b.x, b.A.y - 150, 300, '#c8a060', .6);
        if (b.hold > 0) { const P = G.player; b.hold--; P.x = U.lerp(P.x, b.x, .2); P.y = b.A.y - 120; P.vy = 0; if (Input.pressed('left') || Input.pressed('right') || Input.pressed('jump') || Input.pressed('attack')) b.struggle = (b.struggle || 0) + 1; if (b.struggle >= 8 || b.hold === 0 || (G.ally && G.ally.hitT > 0 && G.time % 30 === 0 && b.struggle >= 4)) { b.hold = 0; b.struggle = 0; P.vy = -8; P.vx = -P.facing * 6; P.inv = 60; G.say('NYX', U.pick(['Let me go!', 'I do not want to stay small!']), 100); } } },
    phases: [
        { moves: ['lash', 'children', 'bloom', 'lash'], rest: 34 },
        { at: .66, moves: ['lash', 'embrace', 'bloom', 'children'], rest: 30, enter: function* (b) { G.say('THE GARDENER', 'Stay. Stay with me, little one. Here you will never have to grow, and growing never has to hurt.', 230); Sound.sfx('roar', { v: .5 }); G.addShake(10); yield 70; G.toast('Her heart is open', '#c8a060'); } },
        { at: .33, moves: ['embrace', 'lash', 'bow', 'children'], rest: 26, enter: function* (b) { G.say('THE GARDENER', 'Every child I hold stays a child forever. Why would you want anything else?', 220); yield 60; G.toast('Strike the mask when she bows', '#c8a060'); } }
    ],
    moves: {
        *lash(b) { const P = b.P; for (let i = 0; i < 3; i++) { const x = U.clamp(P.x + U.rand(-60, 60), b.A.x0 + 40, b.A.x1 - 40); Combat.warn({ shape: 'rect', x: x - 40, y: b.A.y - 220, w: 80, h: 220, t: 36, dmg: b.D(16), src: b, kby: -9, col: '#c8a060' }); yield 14; } yield 40; },
        *children(b) { for (let i = 0; i < 2; i++) { const e = new Enemy('woodchild', b.x + (i ? 1 : -1) * 120, b.A.y - 40, { summoned: true }); G.enemies.push(e); } Sound.sfx('growl', { v: .5 }); yield 50; },
        *bloom(b) { Combat.warn({ shape: 'ring' in Combat ? 'circle' : 'circle', x: b.x, y: b.A.y - 60, r: 260, t: 50, dmg: b.D(14), src: b, col: '#ffd88a' }); for (let k = 0; k < 2; k++) for (let i = 0; i < 10; i++) { const a = -Math.PI + i / 9 * Math.PI; G.delay(50 + k * 20, () => Combat.eshoot(b, 'orb', b.x, b.A.y - 200, a, 4.5, b.D(9), { r: 9, life: 150, col: '#ffd88a' })); } yield 90; },
        *embrace(b) { G.say('THE GARDENER', U.pick(['Come here.', 'Hush. Stay.', 'Mother has you.']), 100); const P = b.P; Combat.warn({ shape: 'rect', x: b.x - 300, y: b.A.y - 160, w: 600, h: 160, t: 46, col: '#c8a060' }); yield 46;
            if (Math.abs(P.x - b.x) < 300 && P.y > b.A.y - 170 && !G2Night.nyxHidden() && P.inv <= 0) { b.hold = 150; b.struggle = 0; G.toast('Struggle! Press left and right', '#ffd88a'); } yield 60; },
        *bow(b) { b.bowT = 160; Sound.sfx('roar', { v: .4 }); yield 160; }
    },
    death: function* (b) { b.hold = 0; yield* G2.mercy(b, ['THE GARDENER', 'You would rather grow... even if it hurts?'], { ground: false }); },
    draw(c, b) {
        if (b.gone) return; const f = b.flash > 0, x = b.x, y = b.A.y, t = b.anim, bow = b.bow || 0;
        c.save(); c.translate(x, y);
        // roots spreading over the floor
        for (const d of [-1, 1]) { c.strokeStyle = f && b.flashPart === (d < 0 ? 'rootL' : 'rootR') ? '#fff' : '#4a3420'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(d * 40, -40); c.quadraticCurveTo(d * 110, -10 + Math.sin(t * .03) * 4, d * 170, -8); c.stroke(); c.lineWidth = 9; c.beginPath(); c.moveTo(d * 120, -12); c.lineTo(d * 210, -4); c.stroke(); }
        // trunk body, bowing in the last phase
        c.rotate(bow * .18); c.fillStyle = f && b.flashPart === 'heart' ? '#fff' : '#3a2a1a'; c.beginPath(); c.moveTo(-60, 0); c.quadraticCurveTo(-80, -160, -40, -250); c.lineTo(40, -250); c.quadraticCurveTo(80, -160, 60, 0); c.fill();
        c.strokeStyle = '#5a4428'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-40 + i * 16, -20); c.quadraticCurveTo(-36 + i * 15, -120, -30 + i * 12, -230); c.stroke(); }
        // the heart, open from phase two
        const open = b.phase >= 1 ? 1 : 0; Paint.glow(c, 0, -150, 30 + open * 30, '#ffd88a'); c.fillStyle = open ? '#ffd88a' : '#4a3420'; c.beginPath(); c.ellipse(0, -150, 16 + open * 6, 22 + open * 6, 0, 0, TAU); c.fill(); if (open) { c.fillStyle = '#c8603a'; c.beginPath(); c.ellipse(0, -150, 8, 11 + Math.sin(t * .2) * 2, 0, 0, TAU); c.fill(); }
        // arms holding wooden children
        for (const d of [-1, 1]) { c.strokeStyle = '#3a2a1a'; c.lineWidth = 16; c.beginPath(); c.moveTo(d * 40, -220); c.quadraticCurveTo(d * 120, -200, d * 90, -150); c.stroke(); c.save(); c.translate(d * 84, -160); Paint.disc(c, 0, -20, 9, '#a07a4a'); c.fillStyle = '#8a6a3a'; c.fillRect(-7, -12, 14, 22); c.fillStyle = '#1a1410'; c.fillRect(-4, -22, 2, 2); c.fillRect(2, -22, 2, 2); c.restore(); }
        // the mask
        c.save(); c.translate(0, -275 + bow * 30); Paint.poly(c, [-34, -30, 34, -30, 30, 26, 0, 40, -30, 26], f && b.flashPart === 'mask' ? '#fff' : '#e8dcc0'); c.fillStyle = '#1a1410'; c.beginPath(); c.ellipse(-12, -4, 6, 9, 0, 0, TAU); c.ellipse(12, -4, 6, 9, 0, 0, TAU); c.fill(); c.strokeStyle = '#7a5a34'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, 20); c.quadraticCurveTo(0, 26, 10, 20); c.stroke();
        for (let i = 0; i < 7; i++) { c.strokeStyle = '#3a4a22'; c.lineWidth = 4; c.beginPath(); c.moveTo(-30 + i * 10, -30); c.quadraticCurveTo(-40 + i * 14, -70, -60 + i * 20 + Math.sin(t * .03 + i) * 6, -90); c.stroke(); Paint.disc(c, -60 + i * 20 + Math.sin(t * .03 + i) * 6, -92, 6, i % 2 ? '#c8d8a0' : '#e8b0b8'); }
        c.restore();
        if (b.sleep) { c.fillStyle = `rgba(20,30,20,${b.sleep * .3})`; c.fillRect(-120, -340, 240, 340); }
        c.restore();
    }
};
(function () { // Zero aims where the Gardener can be hurt, not at her trunk
    const zb = G2.zeroBrain; G2.zeroBrain = function (z) { const b = G.boss; if (b && b.def.aiTarget && !b.dead && !b.intro) { const keep = b.aim; b.aim = () => b.def.aiTarget(b); try { return zb(z); } finally { b.aim = keep; } } return zb(z); };
})();
Object.assign(BOSSES, { scarecrow: B_SCARECROW, gardener: B_GARDENER });
Object.assign(BOSS_INTRO, {
    scarecrow: [['THE MEMORY SCARECROW', 'Caw. Caw. I know you, girl. You were never planted.'], ['ZERO', 'Behind me.']],
    gardener: [['THE GARDENER', 'Oh. Oh, look at you. So small, and already crying.'], ['THE GARDENER', 'I keep the children here. None of them ever grow, and none of them ever hurt.'], ['NYX', 'Uncle, she wants to keep me.'], ['ZERO', 'I know. Cut the roots first. I will hold her arms.']]
});

/* ------------------------------ LEVELS ------------------------------ */
Object.assign(LEVELS, {
    forest2() {
        const b = new LB('forest2', 320, 56, { name: 'THE FOREST OF MEMORY', sub: 'The Third Day: what was buried grew', region: 'forest', theme: THEMES.memory, bg: 'memory', next: 'roots', spawn: { x: 5, y: 34 }, weather: 'leaves' });
        b.at(0, 34).flat(20).beacon(5, 34); b.obj('npc', 14, 34, { id: 'woodcutter' });
        b.say(6, 34, 'ZERO', 'Every tree here is something someone tried to forget. Do not touch them, Nyx.', 220);
        b.flat(14).es([['woodchild', b.cx - 6, b.cy - 2], ['membutterfly', b.cx - 3, b.cy - 5]]); b.obj('lore', b.cx - 10, b.cy, { id: 'g2p9' });
        b.upS(2).flat(10).es([['rootgrab', b.cx - 5, b.cy - 2]]).downS(2).flat(8).beacon(b.cx - 4, b.cy);
        // The memory tree: Nyx touches it.
        const mx = b.cx + 4; b.flat(14); b.obj('exit', mx, b.cy, { g2: 'memtree', label: 'Touch the tree' });
        b.say(mx - 3, b.cy, 'NYX', 'This one is warm. It is humming, Uncle. Like you.', 170);
        // Lost: Zero is gone for a while. Nyx alone with a dark path.
        b.trig(mx + 6, b.cy - 12, 2, 13, () => { if (Save.data.g2.seen.memtree && !Save.data.g2.woodSword) { G.ally = null; G.say('NYX', 'Uncle? ...Uncle!', 140); } });
        b.flat(10).es([['woodchild', b.cx - 4, b.cy - 2]]); b.upS(3).flat(8).downS(3).flat(10); b.obj('lore', b.cx - 6, b.cy, { id: 'g2p10' });
        b.es([['rootgrab', b.cx - 3, b.cy - 2], ['membutterfly', b.cx - 8, b.cy - 6]]);
        // Found: the wooden sword.
        b.trig(b.cx, b.cy - 12, 2, 13, () => { if (!Save.data.g2.woodSword) { Save.data.g2.woodSword = 1; Save.write(); G2.cut('g2woodSword', () => { G2.nyxKit(3); const P = G.player, N = new Player('nyx'); N.x = P.x; N.y = P.y; N.facing = P.facing; N.rig.S = nyxStyle(10); G.player = N; G2.spawnAlly(); G.toast(tr('Wooden Sword') + ': ' + tr('ATTACK') + ' [' + HUD.keyName(Settings.binds.attack) + ']', '#e8d0a0'); }); } });
        b.flat(12).beacon(b.cx - 6, b.cy);
        b.say(b.cx, b.cy, 'NYX', 'It is light. I can swing it! Uncle, watch!', 140);
        b.flat(16).es([['woodchild', b.cx - 10, b.cy - 2], ['woodchild', b.cx - 6, b.cy - 2], ['membutterfly', b.cx - 8, b.cy - 6]]);
        // Hidden shard: high in the old oak.
        const sx = b.cx; b.flat(18); b.plat(sx + 3, b.cy - 4, 3).plat(sx + 7, b.cy - 8, 3).plat(sx + 11, b.cy - 12, 3); b.obj('chest', sx + 12, b.cy - 12, { id: 'g2shard3', cells: 60, shard: 'earth' }); b.obj('lore', sx + 16, b.cy, { id: 'g2p11' });
        b.es([['hollowstag', sx + 14, b.cy - 2]]);
        b.say(sx + 2, b.cy, 'ZERO', 'Together, Nyx. You on the left.', 140);
        b.upS(2).flat(12).beacon(b.cx - 4, b.cy).es([['rootgrab', b.cx - 6, b.cy - 2]]);
        b.say(b.cx - 8, b.cy, 'NYX', 'Uncle... you are coughing. It is ash.', 150); b.say(b.cx - 3, b.cy, 'ZERO', 'It is nothing.', 100);
        // The scarecrow's field.
        const ar = b.cx, y = b.cy; b.flat(44); b.fill(ar + 40, 0, ar + 43, 55);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 40, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('scarecrow', ar + 3, ar + 40, y, ar + 30, y, { trigger: ar + 7 });
        b.obj('exit', ar + 37, y, { hidden: true, label: 'Into the roots' }); b.obj('lore', ar + 33, y, { id: 'g2p12' });
        b.flat(6); return b.done();
    },
    roots() {
        const b = new LB('roots', 76, 34, { name: 'THE CRADLE OF ROOTS', sub: 'The Third Day: the Mother of Roots', region: 'forest', theme: THEMES.roots, bg: 'roots', spawn: { x: 4, y: 26 }, weather: 'leaves', indoors: true });
        b.at(0, 26).flat(76); b.fill(0, 0, 1, 33); b.fill(74, 0, 75, 33); b.beacon(3, 26); b.gate(8, 16, 10, 'arena_l');
        b.plat(16, 21, 5).plat(55, 21, 5).plat(30, 18, 4).plat(42, 18, 4);
        b.bossArena('gardener', 9, 73, 26, 41, 26, { trigger: 12 });
        return b.done();
    }
});
// The memory tree shows Zero's past; then the path takes her away from him.
G2.stationExt = G2.stationExt || {}; G2.stationExt.memtree = () => { Game.state = 'play'; if (!Save.data.g2.seen.memtree) { Save.data.g2.seen.memtree = 1; G2.cut('g2memory'); } else G.toast('The tree is quiet now.', '#c8a060'); };
Object.assign(LORE, {
    g2p9: { title: 'The Second Book, 3:1', region: 'forest2', text: 'On the third day the Lamb made the land and the tree. It buried what it could not bear under the land, and the tree grew up out of it.' },
    g2p10: { title: 'The Woodcutter’s Rule', region: 'forest2', text: 'Never cut a tree you have not touched. Never touch a tree you are not ready to remember.' },
    g2p11: { title: 'On the Gardener', region: 'forest2', text: 'She was the first to see that children grow and leave and hurt. So she asked the roots to hold them still. The roots, being roots, did.' },
    g2p12: { title: 'Meridian Survey, Day Three', region: 'forest2', text: 'Guardian unit coughing particulate. Composition matches the Day of Judgment ash. Degradation is real. Inform the Architect: we will not need to take him. He is giving himself away a little each day.' }
});
Object.assign(NPCS, { woodcutter: { name: 'BLIND WOODCUTTER', look: '#7a6a4a', lines: [['BLIND WOODCUTTER', 'I put my own eyes in a tree, child. Now I cannot see the bad things. I cannot see the good ones either.'], ['NYX', 'Do you want them back?'], ['BLIND WOODCUTTER', 'Every day.']] } });
Object.assign(CUTS, {
    *g2ch3open(c) {
        Music.cut('g2lul3', 'calm'); c.lb = 1; c.shot(Stage.memForest); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(10); yield 40;
        yield* c.say('', 'Nyx was ten when they came to the forest where the buried things grow.', 220);
        yield* c.say('NYX', 'Uncle, the trees are breathing.', 140);
        yield* c.say('ZERO', 'They are remembering. Stay on the path.', 160);
        c.clearActors(); c.title('THE THIRD DAY', 'LAND AND TREE: THE FOREST OF MEMORY', 200, '#9ac070'); c.fade(0, 20); yield 210;
    },
    *g2memory(c) {
        Music.cut('g2vesper', 'calm'); c.lb = 1; c.shot(Stage.memoryFire); c.fade(0, 30); yield 30;
        yield* c.say('', 'The bark opened like an eye. Nyx saw an altar, and fire, and a nameless child.', 230);
        c.tear = 0; for (let i = 0; i < 60; i++) { c.tear = i / 60; yield 1; } Sound.sfx('bigboom', { v: .6 }); G.addShake(12); c.flashA = 1;
        yield* c.say('', 'She saw him torn in two.', 200);
        yield* c.say('NYX', 'No... no, no, no...', 120);
        yield* c.say('', 'Nyx ran. She did not look where she was going.', 180);
        c.fade(1, 40); yield 44;
    },
    *g2woodSword(c) {
        Music.cut('g2lul3', 'calm'); c.lb = 1; c.shot(Stage.memForest); c.fade(0, 60);
        const g = c.actor('nyx', 640, 560, -1, 'kneel', { scale: 2 }); g.rig.S = nyxStyle(10); yield 40;
        const z = G2.bladeZero(c.actor('zero', -60, 560, 1, 'run', { scale: 2 })); z.vx = 8; yield 60; z.vx = 0; z.rig.play('kneel', 10); yield 30;
        yield* c.say('ZERO', 'There you are.', 110);
        yield* c.say('NYX', 'I saw it. The fire. They hurt you.', 160);
        yield* c.say('ZERO', 'A long time ago, before this world, I did not have a name either.', 220);
        yield* c.say('ZERO', 'They put me on an altar. They tore me in half. I was angry for thirty years. Then I forgave it, and closed the Throne.', 260);
        yield* c.say('NYX', 'Does it still hurt?', 120);
        yield* c.say('ZERO', 'Only when I stop.', 140);
        yield* c.say('', 'Zero picked up a branch and began to carve.', 180);
        Sound.sfx('swing_l', { v: .4 }); yield 40; Sound.sfx('swing_l', { v: .4 }); yield 40;
        yield* c.say('ZERO', 'Here. It is not for fighting.', 150);
        yield* c.say('ZERO', 'It is so you know that you can.', 200);
        c.fade(1, 50); yield 56;
    },
    *g2GardenerAfter(c) {
        const sp = Save.data.g2.spared.gardener; Music.cut('g2lul3', 'calm'); c.lb = 1; c.shot(Stage.memForest); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(10); yield 40;
        yield* c.say('THE GARDENER', 'Stay, and you will never be hurt again.', 170);
        yield* c.say('NYX', 'I want to grow up.', 130);
        yield* c.say('NYX', 'Even if it hurts.', 170);
        yield* c.say('', 'It was the first grown-up thing she ever chose.', 200);
        yield* c.say('', sp ? 'The roots let go of the wooden children. One by one, they began to grow.' : 'The great tree fell. The wooden children were only wood again.', 220);
        Sound.sfx('hurt', { v: .3 }); yield 20; yield* c.say('', 'Zero coughed, and ash came out.', 170);
        yield* c.say('NYX', 'Uncle...?', 90); yield* c.say('ZERO', 'It is nothing. Come on.', 130);
        c.fade(1, 50); yield 56;
    }
});
Stage.memForest = (c, t) => { Backdrop.draw(c, 'memory', { x: 200 + t * .2, y: 0, zoom: 1 }, t); c.fillStyle = '#2a2018'; c.fillRect(0, 560, VW, 200); c.fillStyle = '#4a6a32'; c.fillRect(0, 560, VW, 5); };
Stage.memoryFire = (c, t, C) => { c.fillStyle = '#0a0604'; c.fillRect(0, 0, VW, VH); const k = C.tear || 0; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .7; c.drawImage(Glow.get('#ff6a20'), 340, 200, 600, 600); c.restore(); c.fillStyle = '#2a1a10'; c.fillRect(440, 520, 400, 40); c.fillStyle = '#140c08'; c.save(); c.translate(640 - k * 30, 500); c.rotate(-k * .3); c.fillRect(-20, -60, 20, 60); c.restore(); c.save(); c.translate(660 + k * 30, 500); c.rotate(k * .3); c.fillRect(0, -60, 20, 60); c.restore(); for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(255,${120 + i * 3},40,.6)`; c.fillRect((i * 97 + t * 3) % VW, VH - ((i * 53 + t * 4) % VH), 3, 6); } };
REGIONS[2].level = 'forest2';
LEVEL_ORDER.push('forest2', 'roots');
Object.assign(OBJECTIVES, { forest2: 'Find the way through the Forest of Memory', roots: 'Free the children of the roots' });
G2.DAYS[3].open = 'g2ch3open';
// Day Three gives the sword only after Zero carves it.
(function () { const k = G2.nyxKit; G2.nyxKit = function (ch) { const age = k(ch); if (ch === 3 && !Save.data.g2.woodSword) { CHARS.nyx.weapons = [NYX_WEAPONS.hands]; WEAPONS2.nyx = CHARS.nyx.weapons; CHARS.nyx.noAttack = true; } return age; }; })();

Object.assign(VI, {
    'THE FOREST OF MEMORY': 'RỪNG KÝ ỨC', 'The Third Day: what was buried grew': 'Ngày Thứ Ba: những gì bị chôn vùi đã mọc lên', 'THE CRADLE OF ROOTS': 'NÔI RỄ', 'The Third Day: the Mother of Roots': 'Ngày Thứ Ba: Mẹ Của Rễ',
    'Wooden Child': 'Trẻ Gỗ', 'Grasping Root': 'Rễ Nắm Chân', 'Memory Butterfly': 'Bướm Ký Ức', 'Hollow Stag': 'Hươu Rỗng', 'ROOTED': 'BỊ RỄ GIỮ',
    'THE MEMORY SCARECROW': 'BÙ NHÌN KÝ ỨC', 'IT KEEPS WHAT THE CROWS TAKE': 'NÓ GIỮ NHỮNG GÌ LŨ QUẠ MANG ĐI', 'It took your place!': 'Nó cướp chỗ của em!', 'I keep everything the crows take. Your guardian\'s fire is in my straw.': 'Ta giữ mọi thứ lũ quạ mang đi. Ngọn lửa của người giám hộ ngươi nằm trong rơm của ta.',
    'THE GARDENER': 'MẸ CỦA RỄ', 'MOTHER OF ROOTS': 'NGƯỜI LÀM VƯỜN', 'IMMUNE': 'MIỄN NHIỄM', 'Her heart is open': 'Trái tim bà đã mở', 'Strike the mask when she bows': 'Đánh vào mặt nạ khi bà cúi xuống', 'Struggle! Press left and right': 'Vùng ra! Bấm trái và phải',
    'Stay. Stay with me, little one. Here you will never have to grow, and growing never has to hurt.': 'Ở lại. Ở lại với ta, con bé. Ở đây con sẽ không bao giờ phải lớn, và lớn lên sẽ không bao giờ phải đau.', 'Every child I hold stays a child forever. Why would you want anything else?': 'Đứa trẻ nào ta ôm cũng mãi là trẻ con. Sao con lại muốn điều gì khác?',
    'Come here.': 'Lại đây.', 'Hush. Stay.': 'Suỵt. Ở lại.', 'Mother has you.': 'Mẹ ôm con rồi.', 'Let me go!': 'Thả con ra!', 'I do not want to stay small!': 'Con không muốn bé mãi!', 'You would rather grow... even if it hurts?': 'Con thà lớn lên... kể cả khi đau sao?',
    'Caw. Caw. I know you, girl. You were never planted.': 'Quạ. Quạ. Ta biết ngươi, con bé. Ngươi chưa bao giờ được gieo xuống.', 'Behind me.': 'Đứng sau ta.',
    'Oh. Oh, look at you. So small, and already crying.': 'Ôi. Ôi, nhìn con kìa. Bé thế này mà đã khóc rồi.', 'I keep the children here. None of them ever grow, and none of them ever hurt.': 'Ta giữ lũ trẻ ở đây. Không đứa nào lớn lên, và không đứa nào phải đau.', 'Uncle, she wants to keep me.': 'Chú ơi, bà ấy muốn giữ em lại.', 'I know. Cut the roots first. I will hold her arms.': 'Ta biết. Chặt rễ trước. Ta sẽ giữ tay bà ấy.',
    'Every tree here is something someone tried to forget. Do not touch them, Nyx.': 'Mỗi cái cây ở đây là thứ ai đó đã cố quên. Đừng chạm vào, Nyx.', 'Touch the tree': 'Chạm vào cái cây', 'This one is warm. It is humming, Uncle. Like you.': 'Cây này ấm. Nó đang ngân nga, chú ơi. Giống chú.', 'Uncle? ...Uncle!': 'Chú ơi? ...Chú ơi!',
    'It is light. I can swing it! Uncle, watch!': 'Nó nhẹ lắm. Em vung được! Chú ơi, nhìn này!', 'Together, Nyx. You on the left.': 'Cùng nhau, Nyx. Em bên trái.', 'Uncle... you are coughing. It is ash.': 'Chú ơi... chú ho. Ra tro kìa.', 'It is nothing.': 'Không sao đâu.', 'Into the roots': 'Vào trong rễ', 'The tree is quiet now.': 'Cái cây giờ đã im lặng.',
    'The Second Book, 3:1': 'Sách Thứ Hai, 3:1', 'On the third day the Lamb made the land and the tree. It buried what it could not bear under the land, and the tree grew up out of it.': 'Ngày thứ ba, Con Chiên tạo ra đất và cây. Nó chôn dưới đất những gì nó không chịu nổi, và cây mọc lên từ đó.',
    'The Woodcutter’s Rule': 'Luật Của Tiều Phu', 'Never cut a tree you have not touched. Never touch a tree you are not ready to remember.': 'Đừng bao giờ chặt cái cây mình chưa chạm vào. Đừng bao giờ chạm vào cái cây mình chưa sẵn sàng nhớ lại.',
    'On the Gardener': 'Về Mẹ Của Rễ', 'She was the first to see that children grow and leave and hurt. So she asked the roots to hold them still. The roots, being roots, did.': 'Bà là người đầu tiên thấy lũ trẻ lớn lên, rời đi và đau đớn. Nên bà xin rễ cây giữ chúng đứng yên. Rễ cây, vốn là rễ cây, đã làm theo.',
    'Meridian Survey, Day Three': 'Báo Cáo Khảo Sát Meridian, Ngày Thứ Ba', 'Guardian unit coughing particulate. Composition matches the Day of Judgment ash. Degradation is real. Inform the Architect: we will not need to take him. He is giving himself away a little each day.': 'Đơn vị giám hộ ho ra hạt bụi. Thành phần trùng khớp với tro Ngày Phán Xét. Sự suy thoái là có thật. Báo cho The Architect: chúng ta không cần bắt hắn. Mỗi ngày hắn tự đem mình cho đi một chút.',
    'BLIND WOODCUTTER': 'TIỀU PHU MÙ', 'I put my own eyes in a tree, child. Now I cannot see the bad things. I cannot see the good ones either.': 'Ta đã đặt đôi mắt mình vào một cái cây, cháu ạ. Giờ ta không thấy điều xấu nữa. Điều tốt cũng không thấy luôn.', 'Do you want them back?': 'Ông có muốn lấy lại không?', 'Every day.': 'Ngày nào cũng muốn.',
    'Nyx was ten when they came to the forest where the buried things grow.': 'Nyx mười tuổi khi họ đến khu rừng nơi những thứ bị chôn vùi mọc lên.', 'Uncle, the trees are breathing.': 'Chú ơi, cây đang thở kìa.', 'They are remembering. Stay on the path.': 'Chúng đang nhớ lại. Đi đúng đường nhé.',
    'THE THIRD DAY': 'NGÀY THỨ BA', 'LAND AND TREE: THE FOREST OF MEMORY': 'ĐẤT VÀ CÂY: RỪNG KÝ ỨC',
    'The bark opened like an eye. Nyx saw an altar, and fire, and a nameless child.': 'Vỏ cây mở ra như một con mắt. Nyx thấy một bàn thờ, ngọn lửa, và một đứa trẻ không tên.', 'She saw him torn in two.': 'Cô thấy người ấy bị xé làm đôi.', 'No... no, no, no...': 'Không... không, không, không...', 'Nyx ran. She did not look where she was going.': 'Nyx bỏ chạy. Cô không nhìn mình đang chạy đi đâu.',
    'There you are.': 'Em đây rồi.', 'I saw it. The fire. They hurt you.': 'Em thấy rồi. Ngọn lửa. Họ làm chú đau.', 'A long time ago, before this world, I did not have a name either.': 'Lâu lắm rồi, trước cả thế giới này, ta cũng không có tên.',
    'They put me on an altar. They tore me in half. I was angry for thirty years. Then I forgave it, and closed the Throne.': 'Họ đặt ta lên bàn thờ. Họ xé ta làm đôi. Ta đã giận suốt ba mươi năm. Rồi ta tha thứ, và khép cái Ngai lại.', 'Does it still hurt?': 'Bây giờ còn đau không?',
    'Zero picked up a branch and began to carve.': 'Zero nhặt một cành cây và bắt đầu gọt.', 'Here. It is not for fighting.': 'Đây. Không phải để đánh nhau.', 'It is so you know that you can.': 'Để em biết là em có thể.',
    'Stay, and you will never be hurt again.': 'Ở lại, và con sẽ không bao giờ phải đau nữa.', 'I want to grow up.': 'Con muốn lớn.', 'Even if it hurts.': 'Kể cả nếu phải đau.', 'It was the first grown-up thing she ever chose.': 'Đó là quyết định trưởng thành đầu tiên của cô.',
    'The roots let go of the wooden children. One by one, they began to grow.': 'Rễ cây buông lũ trẻ gỗ ra. Từng đứa một, chúng bắt đầu lớn lên.', 'The great tree fell. The wooden children were only wood again.': 'Cái cây lớn đổ xuống. Lũ trẻ gỗ lại chỉ còn là gỗ.', 'Zero coughed, and ash came out.': 'Zero ho, và ra tro.', 'Uncle...?': 'Chú ơi...?', 'It is nothing. Come on.': 'Không sao. Đi thôi.',
    'Find the way through the Forest of Memory': 'Tìm đường qua Rừng Ký Ức', 'Free the children of the roots': 'Giải thoát lũ trẻ của rễ cây', 'Heal the tree': 'Chữa lành cái cây', 'Destroy the tree': 'Phá hủy cái cây', 'The Mother of Roots': 'Mẹ Của Rễ',
    'The great tree bends over Nyx, its wooden children silent. Its heart is open.': 'Cái cây lớn cúi xuống bên Nyx, lũ trẻ gỗ im lặng. Trái tim nó đang mở.', 'Wooden Sword': 'Kiếm Gỗ', 'Zero carved it for you. "Not for fighting. So you know that you can."': 'Zero gọt cho em. "Không phải để đánh nhau. Để em biết là em có thể."'
});
