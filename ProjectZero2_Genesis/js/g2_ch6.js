'use strict';
/**
 * DAY SIX, MANKIND: NEW MERIDIAN. Nyx is fifteen, then sixteen. A city of machines worships THE
 * ARCHITECT, a god built from shards of the old Throne. Nyx leads now, with the Four Riders: switch
 * between them on the fly. Mid-chapter she finally lifts Zero's sword, and it glows with night.
 * Mini-boss: the Preacher Engine. Boss: ARCHON VEIL, the Hierarch, who talks during the fight and can
 * be persuaded. Then THE ARCHITECT itself, with Zero locked inside its core.
 */
Object.assign(THEMES, {
    meridian: { step: 'metal', dust: '#7a7a80', debris: '#4a4a50', music: 'g2meridian', amb: 'city', ambient: '#a0a0b0', tile: { base: '#1c1e24', mid: '#2c2e36', top: '#5a5e6a', edge: '#ff4a3a', back: '#0e0f14', backLine: '#1c1d24' } },
    core6: { step: 'metal', dust: '#9a9ab0', debris: '#5a5a70', music: 'g2architect', amb: 'void', ambient: '#9a98b0', tile: { base: '#14141c', mid: '#22222e', top: '#4a4a60', edge: '#ffe8a0', back: '#08080c', backLine: '#14141a' } }
});
(function () {
    const B = {
        meridian() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#0a0a10'], ['#1e1a24', .5], ['#3a2420', .85], ['#5a2a1e', 1]]); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .3; x.drawImage(Glow.get('#ff6a3a'), 400, 360, 600, 300); x.globalAlpha = 1; });
            add(.12, (x, R) => { for (let px = 0; px < BG_W; px += 40 + R() * 60) { const h = 200 + R() * 260; x.fillStyle = 'rgba(30,30,40,.8)'; x.fillRect(px, 460 - h, 30 + R() * 30, h + 300); x.fillStyle = 'rgba(255,90,60,.5)'; for (let k = 0; k < 6; k++) x.fillRect(px + 6, 470 - h + k * 30, 3, 8); } });
            add(.3, (x, R) => { for (let px = 0; px < BG_W; px += 500) { x.fillStyle = '#14141c'; x.fillRect(px + 200, 80, 40, 400); x.fillRect(px + 140, 140, 160, 30); Paint.glow(x, px + 220, 100, 60, '#ffe8a0'); x.strokeStyle = '#3a3a48'; x.lineWidth = 6; x.beginPath(); x.arc(px + 220, 200, 90, 0, TAU); x.stroke(); } });
            add(.55, (x, R) => { x.fillStyle = '#0c0c12'; for (let px = 0; px < BG_W; px += 120 + R() * 140) { x.fillRect(px, 480, 80, 300); x.fillStyle = '#2a1a14'; x.fillRect(px + 10, 490, 60, 4); x.fillStyle = '#0c0c12'; } });
            return L;
        },
        core6() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#030306'], ['#0e0c1a', .5], ['#06060c', 1]]); x.strokeStyle = 'rgba(255,232,160,.12)'; x.lineWidth = 1; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(R() * BG_W, R() * VH, 40 + R() * 200, 0, TAU); x.stroke(); } for (let i = 0; i < 30; i++) { x.beginPath(); const px = R() * BG_W, py = R() * VH; x.moveTo(px, py); x.lineTo(px + U.rand(-200, 200), py + U.rand(-200, 200)); x.stroke(); } });
            return L;
        }
    };
    const bb = Backdrop.build.bind(Backdrop); Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return bb(id); };
    const ab = Atmos.build.bind(Atmos), fg = {}; Atmos.build = function (id) { if (!B[id]) return ab(id); if (fg[id]) return fg[id]; return fg[id] = U.canvas(BG_W, VH); };
    Atmos.fogCol.meridian = '#6a4a4a';
})();
Object.assign(ENEMIES, {
    preachbot: { name: 'Preaching Machine', ai: 'ranged', body: 'mech', hp: 120, dmg: 14, spd: 1.8, xp: 22, w: 46, h: 70, col: { a: '#2a2c34', b: '#6a6e7a', g: '#ff4a3a' }, atks: [mkA(A.burst, { col: '#ffe8a0' }), mkA(A.shot, { proj: 'bolt', col: '#ffe8a0', spd: 11, cd: 70 })] },
    crossdrone: { name: 'Holy Cross Drone', ai: 'flyer', body: 'drone', hp: 60, dmg: 12, spd: 3.6, xp: 16, w: 34, h: 30, col: { a: '#3a3a44', b: '#c8c8d0', g: '#ffe8a0' }, atks: [mkA(A.shot, { proj: 'bolt', col: '#ffe8a0', spd: 9, cd: 90 }), mkA(A.charge, { spd: 10, cd: 160 })] },
    armormonk: { name: 'Armoured Monk', ai: 'heavy', body: 'human', hp: 340, dmg: 21, spd: 1.7, xp: 56, poise: 80, armorFront: true, scale: 1.15, col: { a: '#3a3a44', b: '#8a8a96', g: '#ffe8a0', s: '#6a6a74' }, gear: 'blade', atks: [mkA(A.swipe, { s: 22 }), mkA(A.slam, { rad: 130 })] },
    inquisitor: { name: 'Meridian Inquisitor', ai: 'elite', body: 'human', elite: true, hp: 720, dmg: 22, spd: 3.8, xp: 200, poise: 70, scale: 1.25, col: { a: '#1a1a20', b: '#c8c8d0', g: '#ff4a3a', s: '#8a8a96' }, gear: 'blade', atks: [mkA(A.swipe, { s: 15 }), mkA(A.charge, { spd: 13 }), mkA(A.burst, { col: '#ff4a3a' })] }
});

/* ------------------------------ MINI-BOSS: THE PREACHER ENGINE ------------------------------ */
const B_PREACHER = {
    id: 'preacher', name: 'THE PREACHER ENGINE', title: 'IT HAS ONE SERMON AND NO EARS', hp: 4200, w: 160, h: 220, col: '#ff4a3a', mini: true, music: 'g2preacher', reward: { xp: 900, relic: 'bell', cells: 180 },
    init: b => ({}), aim: b => ({ x: b.x, y: b.y - 160 }),
    tick(b) { Light.add(b.x, b.y - 180, 240, '#ff4a3a', .6); },
    phases: [{ moves: ['sermon', 'stamp', 'choir'], rest: 34 }, { at: .5, moves: ['sermon', 'stamp', 'choir', 'pipes'], rest: 22, say: ['THE PREACHER ENGINE', 'KNEEL. THE ARCHITECT LOVES YOU. KNEEL.'] }],
    moves: {
        *sermon(b) { for (let i = 0; i < 4; i++) { const a = Math.atan2(b.P.y - 40 - (b.y - 180), b.P.x - b.x); for (let k = -1; k <= 1; k++) Combat.eshoot(b, 'bolt', b.x, b.y - 180, a + k * .15, 9, b.D(11), { r: 6, life: 120, col: '#ffe8a0' }); Sound.sfx('gun', { v: .4 }); yield 14; } yield 30; },
        *stamp(b) { Combat.warn({ shape: 'rect', x: b.x - 220, y: b.A.y - 60, w: 440, h: 60, t: 40, dmg: b.D(18), src: b, kby: -8 }); yield 40; Inst && G.addShake(12); Sound.sfx('slam'); yield 26; },
        *choir(b) { for (let i = 0; i < 2; i++) G.enemies.push(new Enemy('crossdrone', b.x + (i ? 100 : -100), b.y - 240, { summoned: true })); Sound.sfx('toll', { v: .4 }); yield 50; },
        *pipes(b) { for (let i = 0; i < 5; i++) { const x = b.A.x0 + 60 + i * (b.A.x1 - b.A.x0 - 120) / 4; Combat.warn({ shape: 'rect', x: x - 36, y: b.A.y - 420, w: 72, h: 420, t: 30 + i * 8, dmg: b.D(14), src: b, col: '#ff4a3a' }); } yield 80; }
    },
    draw(c, b) {
        const f = b.flash > 0, x = b.x, y = b.y; c.fillStyle = f ? '#fff' : '#2a2c34'; c.fillRect(x - 80, y - 140, 160, 140); c.fillStyle = f ? '#fff' : '#3a3c46'; c.fillRect(x - 60, y - 220, 120, 80);
        for (let i = 0; i < 6; i++) { c.fillStyle = '#5a5e6a'; c.fillRect(x - 70 + i * 26, y - 300 + (i % 2) * 20, 16, 160); } Paint.glow(c, x, y - 180, 40, '#ff4a3a'); Paint.disc(c, x, y - 180, 14, '#ff4a3a'); Paint.disc(c, x, y - 180, 6, '#fff0e0');
        c.fillStyle = '#ffe8a0'; c.fillRect(x - 4, y - 132, 8, 40); c.fillRect(x - 18, y - 120, 36, 8);
    }
};

/* ------------------------------ BOSS: ARCHON VEIL ------------------------------ */
const ARCHON_TALK = [
    { q: '"Zero left you. He never really cared. Come with me: I will give you a father who does not leave."', a: [{ t: '"He left so I would not have to sit on the Throne. I know that now."', good: 1 }, { t: '"You do not get to talk about him."', good: 0 }] },
    { q: '"The Architect will finish this world. No more tears, no more falling stars. Is that so wrong?"', a: [{ t: '"Finished things cannot grow. You know that. Your father did too."', good: 1 }, { t: '"Your god is a machine. It is wrong."', good: 0 }] },
    { q: '"Why are you not afraid of me?"', a: [{ t: '"Because you are afraid too."', good: 1 }, { t: '"Because I am stronger."', good: 0 }] }
];
G2.talk = function* (b, i) {
    const T = ARCHON_TALK[i]; if (!T) return; b.untargetable = true; G.warns = []; G.flags.g2talk = null; G.g2talkI = i;
    if (!HEADLESS) UI.show('g2talk', { i }); else G.flags.g2talk = 0;
    yield () => G.flags.g2talk !== null; UI.hide(); Game.state = 'play';
    const good = T.a[G.flags.g2talk] && T.a[G.flags.g2talk].good; if (good) { Save.data.g2.persuade = (Save.data.g2.persuade || 0) + 1; b.hesitate = 300; G.say('ARCHON VEIL', ['...That is what he said. My father. Before he left.', '...', 'Afraid. Yes.'][i], 180); } else G.say('ARCHON VEIL', 'Then there is nothing more to say.', 140);
    b.untargetable = false;
};
Object.assign(UI.screens, { g2talk(a) { const T = ARCHON_TALK[a.i]; return `<div class="panel small"><h2>ARCHON VEIL</h2><p>${tr(T.q)}</p><nav>${T.a.map((o, k) => `<button data-do="g2talk" data-arg="${k}" ${k ? '' : 'autofocus'}>${tr(o.t)}</button>`).join('')}</nav></div>`; } });
(function () { const act = UI.act.bind(UI); UI.act = function (w, arg, el) { if (w === 'g2talk') { G.flags.g2talk = +arg; UI.hide(); Game.state = 'play'; return; } return act(w, arg, el); }; })();
const B_ARCHON = {
    id: 'archon', name: 'ARCHON VEIL', title: 'HIERARCH OF MERIDIAN', hp: 9000, w: 60, h: 150, col: '#ffe8a0', female: true, choice: true, music: 'g2archon', reward: { xp: 1900, relic: 'mirror', cells: 340 },
    init: b => ({ hesitate: 0 }),
    aim: b => ({ x: b.x, y: b.y - 90 }), box: b => ({ x: b.x - 30, y: b.y - 150, w: 60, h: 150 }),
    tick(b) { if (b.hesitate > 0) { b.hesitate--; if (b.script) b.script.wait = 2; b.dmgTakenMult = 1.3; } else b.dmgTakenMult = 1; Light.add(b.x, b.y - 90, 200, '#ffe8a0', .6); },
    phases: [
        { moves: ['dash', 'gun', 'cross', 'dash'], rest: 28 },
        { at: .7, moves: ['dash', 'gun', 'troops', 'cross', 'air'], rest: 22, enter: function* (b) { yield* G2.talk(b, 0); } },
        { at: .45, moves: ['dash', 'air', 'gun', 'troops'], rest: 22, enter: function* (b) { yield* G2.talk(b, 1); } },
        { at: .2, moves: ['dash', 'cross', 'air', 'gun', 'troops'], rest: 16, enter: function* (b) { yield* G2.talk(b, 2); Sound.sfx('roar', { v: .4 }); } }
    ],
    moves: {
        *dash(b) { b.facing = b.P.x > b.x ? 1 : -1; const tx = U.clamp(b.P.x + b.facing * 80, b.A.x0 + 40, b.A.x1 - 40); Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 110, w: tx - b.x, h: 110, t: 24, dmg: b.D(17), src: b, kb: 9 }); yield 24; VFX.burst(b.x, b.y - 80, '#ffe8a0', 10, 4, 18, 4, 1); b.x = tx; VFX.slash(tx, b.A.y - 70, 90, b.facing, '#ffe8a0'); Sound.sfx('swing_h'); yield 26; },
        *gun(b) { for (let i = 0; i < 6; i++) { const a = Math.atan2(b.P.y - 36 - (b.y - 100), b.P.x - b.x); Combat.eshoot(b, 'bolt', b.x, b.y - 100, a + U.rand(-.06, .06), 13, b.D(9), { r: 5, life: 90, col: '#ffe8a0', len: 18 }); Sound.sfx('gun', { v: .4 }); yield 8; } yield 26; },
        *cross(b) { const P = b.P; Combat.warn({ shape: 'rect', x: P.x - 50, y: b.A.y - 400, w: 100, h: 400, t: 36, dmg: b.D(16), src: b, col: '#ffe8a0' }); Combat.warn({ shape: 'rect', x: b.A.x0, y: P.y - 70, w: b.A.x1 - b.A.x0, h: 60, t: 50, dmg: b.D(14), src: b, col: '#ffe8a0' }); yield 60; },
        *troops(b) { for (let i = 0; i < 2; i++) G.enemies.push(new Enemy(i ? 'preachbot' : 'crossdrone', U.clamp(b.x + (i ? 160 : -160), b.A.x0 + 40, b.A.x1 - 40), b.A.y - (i ? 80 : 220), { summoned: true })); G.say('ARCHON VEIL', 'Machines. Take her alive.', 90); yield 40; },
        *air(b) { const sy = b.y; for (let i = 0; i < 20; i++) { b.y = U.lerp(sy, b.A.y - 260, i / 20); yield 1; } for (let i = 0; i < 3; i++) { yield* B_ARCHON.moves.gun(b); } for (let i = 0; i < 16; i++) { b.y = U.lerp(b.A.y - 260, b.A.y, i / 16); yield 1; } Combat.warn({ shape: 'circle', x: b.x, y: b.A.y - 30, r: 120, t: 10, dmg: b.D(16), src: b }); G.addShake(8); yield 20; }
    },
    death: function* (b) { yield* G2.mercy(b, ['ARCHON VEIL', 'He really did leave so you would not have to... didn\'t he.']); },
    draw(c, b) {
        if (b.gone) return; const f = b.flash > 0, x = b.x, y = b.y, d = b.facing, low = b.hesitate > 0 || b.kneel;
        c.save(); c.translate(x, y); c.scale(d * 1.3, 1.3);
        c.fillStyle = f ? '#fff' : '#e8e8f0'; c.beginPath(); c.moveTo(-12, -96); c.lineTo(12, -96); c.lineTo(22, 0); c.lineTo(-22, 0); c.fill(); c.fillStyle = '#c8a040'; c.fillRect(-14, -60, 28, 4); c.fillRect(-2, -96, 4, 96);
        c.strokeStyle = f ? '#fff' : '#d8d8e0'; c.lineWidth = 4; c.lineCap = 'round'; const a = low ? .9 : -.4; c.beginPath(); c.moveTo(8, -88); c.lineTo(8 + Math.cos(a) * 22, -88 + Math.sin(a) * 22); c.stroke();
        c.save(); c.translate(8 + Math.cos(a) * 22, -88 + Math.sin(a) * 22); c.rotate(a + (low ? .8 : -1.2)); c.fillStyle = '#ffe8a0'; c.fillRect(-2, 0, 4, 40); Paint.glow(c, 0, 20, 14, '#ffe8a0'); c.restore();
        Paint.disc(c, 0, -108, 9, '#e8dcd0'); c.fillStyle = '#1a1a20'; c.beginPath(); c.moveTo(-10, -112); c.quadraticCurveTo(0, -128, 10, -112); c.lineTo(12, -100); c.lineTo(-12, -100); c.fill(); c.fillStyle = '#c8a040'; c.fillRect(-10, -114, 20, 3);
        c.fillStyle = 'rgba(232,232,240,.6)'; c.beginPath(); c.moveTo(-10, -96); c.lineTo(-30, -20); c.lineTo(-14, -10); c.fill();
        if (b.sleep) { c.fillStyle = `rgba(20,20,60,${b.sleep * .4})`; c.fillRect(-40, -140, 80, 140); }
        c.restore();
    }
};

/* ------------------------------ BOSS: THE ARCHITECT ------------------------------ */
const B_ARCHITECT = {
    id: 'architect', name: 'THE ARCHITECT', title: 'A GOD MADE OF SHARDS', hp: 12500, w: 260, h: 260, col: '#ffe8a0', music: 'g2architect', reward: { xp: 2400, cells: 400 },
    init: b => ({ rings: [0, 0, 0], open: 0 }),
    aim: b => ({ x: b.x, y: b.y - 200 }), box: b => ({ x: b.x - 110, y: b.y - 320, w: 220, h: 240 }),
    tick(b) { b.rings = b.rings.map((r, i) => r + (.01 + i * .006) * (1 + b.phase * .5)); b.y = b.A.y - 40 + Math.sin(b.anim * .02) * 20; Light.add(b.x, b.y - 200, 340, '#ffe8a0', .8);
        if (b.phase === 1) G.g2grav = .5; else if (b.phase === 2) { G.g2grav = 1; G.g2xf = { rot: Math.sin(b.anim * .01) * .5 }; } else if (b.phase === 3) { b.open = Math.min(1, b.open + .01); G.g2xf = null; } },
    phases: [
        { moves: ['triangles', 'grid', 'eyes'], rest: 30 },
        { at: .72, moves: ['triangles', 'grid', 'eyes', 'rain'], rest: 26, enter: function* (b) { G.say('THE ARCHITECT', 'GRAVITY IS A SUGGESTION. I WITHDRAW IT.', 160); Sound.sfx('bigboom', { v: .5 }); yield 60; } },
        { at: .48, moves: ['triangles', 'grid', 'eyes', 'rain'], rest: 22, enter: function* (b) { G.say('THE ARCHITECT', 'THE WORLD TURNS ON MY WORD.', 160); yield 60; } },
        { at: .22, moves: ['grid', 'eyes', 'rain', 'triangles'], rest: 18, enter: function* (b) { G.say('THE ARCHITECT', 'LOOK, CHILD. HE GAVE HIMSELF TO ME, SO THAT YOU WOULD NOT HAVE TO.', 220); yield 60; G.say('NYX', 'Uncle! UNCLE!', 120); G.toast('Zero is inside the core', '#ffe8a0'); yield 40; } }
    ],
    moves: {
        *triangles(b) { for (let k = 0; k < 3; k++) { for (let i = 0; i < 3; i++) { const a = Math.atan2(b.P.y - 36 - (b.y - 200), b.P.x - b.x) + (i - 1) * .4; Combat.eshoot(b, 'knife', b.x, b.y - 200, a, 6.5, b.D(11), { r: 10, life: 160, col: '#ffe8a0' }); } Sound.sfx('volt', { v: .4 }); yield 22; } yield 30; },
        *grid(b) { const w = (b.A.x1 - b.A.x0) / 8, odd = U.chance(.5); for (let i = 0; i < 8; i++) if ((i % 2 === 1) === odd) Combat.warn({ shape: 'rect', x: b.A.x0 + i * w, y: b.A.y - 460, w, h: 460, t: 44, dmg: b.D(15), src: b, col: '#ffe8a0' }); yield 56; for (let j = 0; j < 2; j++) Combat.warn({ shape: 'rect', x: b.A.x0, y: b.A.y - 60 - j * 160, w: b.A.x1 - b.A.x0, h: 50, t: 40 + j * 20, dmg: b.D(13), src: b, col: '#ffe8a0' }); yield 70; },
        *eyes(b) { for (let i = 0; i < 6; i++) { const a = b.rings[i % 3] + i; const ex = b.x + Math.cos(a) * 120, ey = b.y - 200 + Math.sin(a) * 120, t = Math.atan2(b.P.y - 36 - ey, b.P.x - ex); Combat.warn({ shape: 'cone', x: ex, y: ey, ang: t, r: 700, spread: .12, t: 30, col: '#fff0c8' }); G.delay(30, () => Combat.eshoot(b, 'bolt', ex, ey, t, 16, b.D(12), { r: 6, life: 70, col: '#fff0c8', len: 26 })); yield 10; } yield 40; },
        *rain(b) { for (let i = 0; i < 10; i++) { b.fallRock(U.rand(b.A.x0 + 40, b.A.x1 - 40), 34, b.D(11), 'knife', 12); yield 6; } yield 30; }
    },
    death: function* (b) {
        G.lockInput = true; G.warns = []; G.letterbox = 1; Music.stop(1.2); G.slowmo = 60; G.g2xf = null; G.g2grav = 1; G.cineCam = { x: b.x, y: b.y - 200, zoom: 1.2 };
        for (let i = 0; i < 16; i++) { VFX.burst(b.x + U.rand(-120, 120), b.y - 200 + U.rand(-120, 120), '#ffe8a0', 20, 8, 30, 8, 1); Sound.sfx('explode', { v: .6 }); G.addShake(8); yield 8; }
        G.flash = 1; Sound.sfx('bigboom'); b.gone = true; yield 50; G.cineCam = null; G.letterbox = 0; G.lockInput = false; Game.onBossDefeated(b.def);
    },
    draw(c, b) {
        if (b.gone) return; const f = b.flash > 0, x = b.x, y = b.y - 200;
        for (let r = 0; r < 3; r++) { c.save(); c.translate(x, y); c.rotate(b.rings[r]); c.scale(1, .35 + r * .25); c.strokeStyle = f ? '#fff' : '#c8a850'; c.lineWidth = 10 - r * 2; c.beginPath(); c.arc(0, 0, 150 - r * 22, 0, TAU); c.stroke();
            for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, ex = Math.cos(a) * (150 - r * 22), ey = Math.sin(a) * (150 - r * 22); Paint.disc(c, ex, ey, 8, '#f0e8d0'); Paint.disc(c, ex, ey, 4, '#3a2a10'); } c.restore(); }
        Paint.glow(c, x, y, 120, '#ffe8a0'); c.fillStyle = f ? '#fff' : '#fff6d8'; c.beginPath(); c.arc(x, y, 60, 0, TAU); c.fill();
        if (b.open > 0) { c.save(); c.globalAlpha = b.open; c.fillStyle = '#1a1a24'; c.beginPath(); c.arc(x, y, 44, 0, TAU); c.fill(); c.globalAlpha = b.open * .9; c.fillStyle = '#00ffff'; c.fillRect(x - 3, y - 26, 6, 40); Paint.disc(c, x, y - 32, 8, '#1a1a24'); c.fillStyle = '#00ffff'; c.fillRect(x, y - 34, 6, 2); c.restore(); }
    }
};
Object.assign(BOSSES, { preacher: B_PREACHER, archon: B_ARCHON, architect: B_ARCHITECT });
Object.assign(BOSS_INTRO, {
    preacher: [['THE PREACHER ENGINE', 'ALL WHO SLEEP ARE SINNERS. ALL WHO SLEEP WILL KNEEL.'], ['ROOK', 'Loud thing. Let me at it.'], ['NYX', 'Together. Rook, front. Sable, behind it.']],
    archon: [['ARCHON VEIL', 'So you are the day he never finished.'], ['ARCHON VEIL', 'Zero left you. He never really cared. Come with me: I will give you a father who does not leave.'], ['NYX', 'Where is he?']],
    architect: [['THE ARCHITECT', 'I AM WHAT MERIDIAN BUILT FROM THE THRONE YOU CLOSED.'], ['THE ARCHITECT', 'I WILL FINISH THE WORLD. NO ONE WILL EVER HAVE TO BE TIRED AGAIN. NO ONE WILL EVER HAVE TO BE ANYTHING AGAIN.'], ['NYX', 'Give him back.']]
});
Object.assign(LEVELS, {
    meridian() {
        const b = new LB('meridian', 330, 56, { name: 'NEW MERIDIAN', sub: 'The Sixth Day: mankind wanted to be God', region: 'city', theme: THEMES.meridian, bg: 'meridian', next: 'archon', spawn: { x: 5, y: 36 }, weather: 'ash', noAlly: true });
        b.at(0, 36).flat(24).beacon(5, 36); b.obj('npc', 16, 36, { id: 'deserter' });
        b.say(6, 36, 'ROOK', 'Switch with us when you need to, Nyx. We follow, you lead.', 220);
        b.flat(12).es([['preachbot', b.cx - 4, b.cy - 3], ['crossdrone', b.cx - 6, b.cy - 8]]); b.obj('lore', b.cx - 10, b.cy, { id: 'g2p21' });
        b.up(3).flat(12).es([['armormonk', b.cx - 5, b.cy - 3]]).down(3).flat(8).beacon(b.cx - 4, b.cy);
        b.say(b.cx - 8, b.cy, 'SABLE', 'The monks are shielded in front. Go behind them. That is what I do.', 200);
        // The square: Nyx lifts Zero's sword in the middle of a fight.
        const lx = b.cx; b.flat(24); b.es([['preachbot', lx + 10, b.cy - 3], ['armormonk', lx + 14, b.cy - 3], ['crossdrone', lx + 8, b.cy - 9], ['crossdrone', lx + 16, b.cy - 9]]);
        b.trig(lx + 18, b.cy - 12, 2, 13, () => { if (!Save.data.g2.liftedSword) G2.cut('g2liftSword', () => { Save.data.g2.liftedSword = 1; Save.write(); G2.nyxKit(6); if (G.player.id === 'nyx') { const P = G.player, N = new Player('nyx'); N.x = P.x; N.y = P.y; N.facing = P.facing; N.rig.S = nyxStyle(15); G.player = N; } G.toast(tr('Zero’s Sword'), '#b48cff'); }); });
        b.flat(10).beacon(b.cx - 4, b.cy); b.obj('lore', b.cx - 2, b.cy, { id: 'g2p22' });
        b.flat(14).es([['inquisitor', b.cx - 6, b.cy - 3], ['preachbot', b.cx - 3, b.cy - 3]]);
        b.say(b.cx - 12, b.cy, 'MIRAE', 'The same poison can heal, you know. Switch to me when you are hurt.', 200);
        // Hidden shard in the cathedral of gears.
        const sx = b.cx; b.flat(18); b.mover(sx + 2, b.cy - 4, 3, sx + 2, b.cy - 13, 240); b.plat(sx + 6, b.cy - 14, 4); b.obj('chest', sx + 8, b.cy - 14, { id: 'g2shard6', cells: 90, shard: 'mankind' });
        b.es([['crossdrone', sx + 9, b.cy - 9], ['armormonk', sx + 14, b.cy - 3]]); b.obj('lore', sx + 15, b.cy, { id: 'g2p23' });
        b.up(2).flat(14).beacon(b.cx - 4, b.cy).es([['preachbot', b.cx - 3, b.cy - 3], ['preachbot', b.cx - 8, b.cy - 3]]);
        b.say(b.cx - 2, b.cy, 'YSOLDE', 'I am hungry, little leader. Point me at something.', 160);
        const ar = b.cx, y = b.cy; b.flat(44); b.fill(ar + 40, 0, ar + 43, 55);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 40, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('preacher', ar + 3, ar + 40, y, ar + 26, y, { trigger: ar + 7 });
        b.obj('exit', ar + 37, y, { hidden: true, label: 'The Hierarch’s hall' }); b.obj('lore', ar + 33, y, { id: 'g2p24' });
        b.flat(6); return b.done();
    },
    archon() {
        const b = new LB('archon', 72, 36, { name: 'THE HALL OF THE HIERARCH', sub: 'The Sixth Day: Archon Veil', region: 'city', theme: THEMES.meridian, bg: 'meridian', spawn: { x: 4, y: 28 }, weather: 'ash', indoors: true, noAlly: true });
        b.at(0, 28).flat(72); b.fill(0, 0, 1, 35); b.fill(70, 0, 71, 35); b.beacon(3, 28); b.gate(8, 18, 10, 'arena_l'); b.plat(20, 23, 5).plat(46, 23, 5);
        b.bossArena('archon', 9, 69, 28, 44, 28, { trigger: 12 }); return b.done();
    },
    architect() {
        const b = new LB('architect', 76, 38, { name: 'THE CORE', sub: 'The Sixth Day: the Architect', region: 'city', theme: THEMES.core6, bg: 'core6', spawn: { x: 4, y: 30 }, weather: 'motes', indoors: true, noAlly: true });
        b.at(0, 30).flat(76); b.fill(0, 0, 1, 37); b.fill(74, 0, 75, 37); b.beacon(3, 30); b.gate(8, 20, 10, 'arena_l'); b.plat(18, 25, 5).plat(52, 25, 5).plat(35, 21, 5);
        b.bossArena('architect', 9, 73, 30, 42, 30, { trigger: 12 }); return b.done();
    }
});
// Before Nyx lifts it, the sword of Zero is dragged; after, it is hers.
(function () { const k = G2.nyxKit; G2.nyxKit = function (ch) { const age = k(ch); const N = CHARS.nyx; if (ch >= 6 && !Save.data.g2.liftedSword) { N.weapons = [NYX_WEAPONS.wood, NYX_WEAPONS.lantern]; WEAPONS2.nyx = N.weapons; N.dragging = true; } else if (ch >= 6) N.dragging = false; return age; }; })();
Object.assign(LORE, {
    g2p21: { title: 'The Second Book, 6:1', region: 'meridian', text: 'On the sixth day the Lamb made mankind, and mankind looked at the Lamb, and saw that it was tired. And they said: we could do this better.' },
    g2p22: { title: 'Catechism of the Architect', region: 'meridian', text: 'Q. What is a finished world? A. A world where nothing more can happen. Q. Is that good? A. It is safe.' },
    g2p23: { title: 'On Archon Veil', region: 'meridian', text: 'Her father was the high priest who lit the altar on the Day of Judgment. He walked away from Meridian the next morning and never came back. She has been trying to finish his work ever since.' },
    g2p24: { title: 'The Architect’s Bargain', region: 'meridian', text: 'HE OFFERED HIMSELF. HE SAID: TAKE WHAT IS LEFT OF ME AND FINISH IT, SO THE GIRL NEVER HAS TO. I SAID YES. I SAY YES TO EVERYTHING THAT MAKES ME WHOLE.' }
});
Object.assign(NPCS, { deserter: { name: 'MERIDIAN DESERTER', look: '#8a8a96', lines: [['MERIDIAN DESERTER', 'They say the Architect has a heart now. A real one. They say it is still beating, and it is not happy about it.'], ['NYX', 'Whose heart?'], ['MERIDIAN DESERTER', 'Nobody will say the name.']] } });
Object.assign(CUTS, {
    *g2ch6open(c) {
        Music.cut('g2lul6', 'calm'); c.lb = 1; c.shot(Stage.meridianSky); c.fade(0, 60);
        const g = c.actor('nyx', 520, 560, 1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(15); const r = ['rook', 'sable', 'mirae', 'ysolde'].map((id, i) => c.actor(id, 640 + i * 70, 560, -1, 'idle', { scale: 2 })); yield 40;
        yield* c.say('', 'At fifteen Nyx walked in front, and four of the dead walked behind her.', 220);
        yield* c.say('NYX', 'He is in there. I know he is.', 150);
        yield* c.say('ROOK', 'Then we go in.', 120);
        c.clearActors(); c.title('THE SIXTH DAY', 'MANKIND: NEW MERIDIAN', 200, '#c0c8d8'); c.fade(0, 20); yield 210;
    },
    *g2liftSword(c) {
        Music.cut('g2lul6', 'calm'); c.lb = 1; c.shot(Stage.meridianSky); c.fade(0, 30);
        const g = c.actor('nyx', 600, 560, 1, 'kneel', { scale: 2 }); g.rig.S = nyxStyle(15); yield 40;
        yield* c.say('', 'In the middle of the fight, she stopped dragging it.', 180);
        g.rig.play('idle', 10); yield 30; c.flashA = 1; Sound.sfx('parry'); G.addShake(8);
        yield* c.say('', 'She lifted Zero’s sword. It lit up, as it always had for him.', 200);
        yield* c.say('', 'But not with his gold. With the blue-violet of night.', 220);
        yield* c.say('NYX', 'I can carry it now, Uncle. I am coming.', 160);
        c.fade(1, 30); yield 34;
    },
    *g2ArchonAfter(c) {
        const sp = Save.data.g2.spared.archon; Music.cut('g2vesper', 'calm'); c.lb = 1; c.shot(Stage.meridianSky); c.fade(0, 60); yield 30;
        if (sp) { yield* c.say('ARCHON VEIL', 'The core is beneath this hall. I will open it, and shut down every machine I can.', 220); yield* c.say('ARCHON VEIL', 'Go and get him. Someone in this city should get their father back.', 220); }
        else yield* c.say('', 'The Hierarch fell, and the machines kept praying without her.', 200);
        c.fade(1, 40); yield 44;
    },
    *g2ArchitectAfter(c) {
        Music.cut('g2lul6', 'calm'); c.lb = 1; c.shot(Stage.meridianSky); c.fade(0, 60);
        yield* c.say('', 'The core broke open. Zero fell out of the light, and Nyx caught him.', 230);
        const g = c.actor('nyx', 640, 560, -1, 'kneel', { scale: 2 }); g.rig.S = nyxStyle(16); const z = G2.bladeZero(c.actor('zero', 600, 570, 1, 'kneel', { scale: 2 })); yield 40;
        yield* c.say('', 'Now she was the one carrying him. The first day, turned around.', 220);
        yield* c.say('ZERO', 'You grew up...', 160);
        yield* c.say('NYX', 'You told me to.', 160);
        c.fade(1, 60); yield 66;
    }
});
Stage.meridianSky = (c, t) => { Backdrop.draw(c, 'meridian', { x: 300 + t * .2, y: 0, zoom: 1 }, t); c.fillStyle = '#1c1e24'; c.fillRect(0, 560, VW, 200); c.fillStyle = '#ff4a3a'; c.fillRect(0, 560, VW, 2); };
REGIONS[5].level = 'meridian';
LEVEL_ORDER.push('meridian', 'archon', 'architect');
Object.assign(OBJECTIVES, { meridian: 'Lead the Riders through New Meridian', archon: 'Face the Hierarch', architect: 'Break the Architect’s core' });
G2.DAYS[6].open = 'g2ch6open';
G2.DAYS[6].after = () => { const D = Save.data; D.g2.zeroBack = 1; if (!D.unlocked.includes('zero')) D.unlocked.push('zero'); Save.write(); };

Object.assign(VI, {
    'NEW MERIDIAN': 'THỦ ĐÔ MERIDIAN MỚI', 'The Sixth Day: mankind wanted to be God': 'Ngày Thứ Sáu: con người muốn làm Chúa', 'THE HALL OF THE HIERARCH': 'ĐẠI SẢNH GIÁO CHỦ', 'The Sixth Day: Archon Veil': 'Ngày Thứ Sáu: Archon Veil', 'THE CORE': 'LÕI', 'The Sixth Day: the Architect': 'Ngày Thứ Sáu: The Architect',
    'Preaching Machine': 'Lính Máy Rao Giảng', 'Holy Cross Drone': 'Drone Thánh Giá', 'Armoured Monk': 'Tu Sĩ Bọc Thép', 'Meridian Inquisitor': 'Pháp Quan Meridian',
    'THE PREACHER ENGINE': 'CỖ MÁY RAO GIẢNG', 'IT HAS ONE SERMON AND NO EARS': 'NÓ CÓ MỘT BÀI GIẢNG VÀ KHÔNG CÓ TAI', 'KNEEL. THE ARCHITECT LOVES YOU. KNEEL.': 'QUỲ XUỐNG. THE ARCHITECT YÊU NGƯƠI. QUỲ XUỐNG.',
    'ARCHON VEIL': 'ARCHON VEIL', 'HIERARCH OF MERIDIAN': 'GIÁO CHỦ MERIDIAN', 'Machines. Take her alive.': 'Lũ máy. Bắt sống nó.', 'Then there is nothing more to say.': 'Vậy thì không còn gì để nói nữa.', '...That is what he said. My father. Before he left.': '...Đó là điều ông ấy đã nói. Cha ta. Trước khi đi.', 'Afraid. Yes.': 'Sợ. Phải.',
    '"Zero left you. He never really cared. Come with me: I will give you a father who does not leave."': '"Zero bỏ con lại. Hắn chưa bao giờ thật sự quan tâm. Theo ta đi, ta sẽ cho con một người cha không bỏ đi."', '"He left so I would not have to sit on the Throne. I know that now."': '"Chú ấy đi để em không phải ngồi lên Ngai. Giờ em biết rồi."', '"You do not get to talk about him."': '"Bà không có quyền nói về chú ấy."',
    '"The Architect will finish this world. No more tears, no more falling stars. Is that so wrong?"': '"The Architect sẽ hoàn tất thế giới này. Không còn nước mắt, không còn sao rơi. Như vậy sai sao?"', '"Finished things cannot grow. You know that. Your father did too."': '"Những thứ đã hoàn tất thì không lớn lên được nữa. Bà biết mà. Cha bà cũng biết."', '"Your god is a machine. It is wrong."': '"Chúa của bà là một cỗ máy. Như vậy là sai."',
    '"Why are you not afraid of me?"': '"Sao con không sợ ta?"', '"Because you are afraid too."': '"Vì bà cũng đang sợ."', '"Because I am stronger."': '"Vì em mạnh hơn."', 'He really did leave so you would not have to... didn\'t he.': 'Hắn thật sự đã đi để con không phải... đúng không.',
    'THE ARCHITECT': 'THE ARCHITECT', 'A GOD MADE OF SHARDS': 'VỊ CHÚA GHÉP TỪ MẢNH VỠ', 'GRAVITY IS A SUGGESTION. I WITHDRAW IT.': 'TRỌNG LỰC CHỈ LÀ MỘT ĐỀ NGHỊ. TA RÚT LẠI NÓ.', 'THE WORLD TURNS ON MY WORD.': 'THẾ GIỚI XOAY THEO LỜI TA.', 'LOOK, CHILD. HE GAVE HIMSELF TO ME, SO THAT YOU WOULD NOT HAVE TO.': 'NHÌN ĐI, ĐỨA TRẺ. HẮN TỰ NỘP MÌNH CHO TA, ĐỂ NGƯƠI KHÔNG PHẢI LÀM THẾ.', 'Uncle! UNCLE!': 'Chú ơi! CHÚ ƠI!', 'Zero is inside the core': 'Zero ở bên trong lõi',
    'ALL WHO SLEEP ARE SINNERS. ALL WHO SLEEP WILL KNEEL.': 'KẺ NÀO NGỦ LÀ KẺ CÓ TỘI. KẺ NÀO NGỦ PHẢI QUỲ.', 'Loud thing. Let me at it.': 'Cái thứ ồn ào. Để ta.', 'Together. Rook, front. Sable, behind it.': 'Cùng nhau. Rook, phía trước. Sable, đằng sau nó.',
    'So you are the day he never finished.': 'Vậy ra con là ngày hắn chưa bao giờ làm xong.', 'Where is he?': 'Chú ấy ở đâu?', 'I AM WHAT MERIDIAN BUILT FROM THE THRONE YOU CLOSED.': 'TA LÀ THỨ MERIDIAN DỰNG LÊN TỪ CÁI NGAI NGƯƠI ĐÃ KHÉP.',
    'I WILL FINISH THE WORLD. NO ONE WILL EVER HAVE TO BE TIRED AGAIN. NO ONE WILL EVER HAVE TO BE ANYTHING AGAIN.': 'TA SẼ HOÀN TẤT THẾ GIỚI. SẼ KHÔNG AI PHẢI MỆT MỎI NỮA. SẼ KHÔNG AI PHẢI LÀ GÌ CẢ NỮA.', 'Give him back.': 'Trả chú ấy lại đây.',
    'Switch with us when you need to, Nyx. We follow, you lead.': 'Đổi sang bọn ta khi cần, Nyx. Bọn ta theo, em dẫn đường.', 'The monks are shielded in front. Go behind them. That is what I do.': 'Lũ tu sĩ có khiên phía trước. Vòng ra sau chúng. Ta vẫn làm vậy.', 'The same poison can heal, you know. Switch to me when you are hurt.': 'Cùng một thứ độc cũng chữa được bệnh đấy. Bị thương thì đổi sang ta.', 'I am hungry, little leader. Point me at something.': 'Ta đói rồi, thủ lĩnh nhỏ. Chỉ cho ta thứ gì đó đi.', 'The Hierarch’s hall': 'Đại sảnh Giáo Chủ',
    'The Second Book, 6:1': 'Sách Thứ Hai, 6:1', 'On the sixth day the Lamb made mankind, and mankind looked at the Lamb, and saw that it was tired. And they said: we could do this better.': 'Ngày thứ sáu, Con Chiên tạo ra con người, và con người nhìn Con Chiên, và thấy nó đã mệt. Rồi họ nói: chúng ta có thể làm tốt hơn.',
    'Catechism of the Architect': 'Giáo Lý Của The Architect', 'Q. What is a finished world? A. A world where nothing more can happen. Q. Is that good? A. It is safe.': 'H. Một thế giới hoàn tất là gì? Đ. Một thế giới nơi không còn gì có thể xảy ra nữa. H. Như vậy có tốt không? Đ. Như vậy là an toàn.',
    'On Archon Veil': 'Về Archon Veil', 'Her father was the high priest who lit the altar on the Day of Judgment. He walked away from Meridian the next morning and never came back. She has been trying to finish his work ever since.': 'Cha cô là vị đại tư tế đã châm lửa bàn thờ vào Ngày Phán Xét. Sáng hôm sau ông rời Meridian và không bao giờ trở lại. Từ đó cô luôn cố hoàn thành công việc dang dở của ông.',
    'The Architect’s Bargain': 'Giao Kèo Của The Architect', 'HE OFFERED HIMSELF. HE SAID: TAKE WHAT IS LEFT OF ME AND FINISH IT, SO THE GIRL NEVER HAS TO. I SAID YES. I SAY YES TO EVERYTHING THAT MAKES ME WHOLE.': 'HẮN TỰ DÂNG MÌNH. HẮN NÓI: HÃY LẤY NHỮNG GÌ CÒN LẠI CỦA TA MÀ HOÀN TẤT NÓ, ĐỂ CÔ BÉ KHÔNG BAO GIỜ PHẢI LÀM THẾ. TA NÓI CÓ. TA NÓI CÓ VỚI MỌI THỨ LÀM TA TRỌN VẸN.',
    'MERIDIAN DESERTER': 'KẺ ĐÀO NGŨ MERIDIAN', 'They say the Architect has a heart now. A real one. They say it is still beating, and it is not happy about it.': 'Người ta nói The Architect giờ có tim rồi. Tim thật. Người ta nói nó vẫn còn đập, và nó không vui gì chuyện đó.', 'Whose heart?': 'Tim của ai?', 'Nobody will say the name.': 'Chẳng ai dám nói tên.',
    'At fifteen Nyx walked in front, and four of the dead walked behind her.': 'Mười lăm tuổi, Nyx đi trước, và bốn người đã chết đi sau lưng cô.', 'He is in there. I know he is.': 'Chú ấy ở trong đó. Em biết mà.', 'Then we go in.': 'Vậy thì vào.', 'THE SIXTH DAY': 'NGÀY THỨ SÁU', 'MANKIND: NEW MERIDIAN': 'CON NGƯỜI: THỦ ĐÔ MERIDIAN MỚI',
    'In the middle of the fight, she stopped dragging it.': 'Giữa trận đánh, cô thôi không kéo lê nó nữa.', 'She lifted Zero’s sword. It lit up, as it always had for him.': 'Cô nhấc thanh kiếm của Zero lên. Nó phát sáng, như vẫn luôn sáng khi chú cầm.', 'But not with his gold. With the blue-violet of night.': 'Nhưng không phải ánh vàng của chú. Mà là ánh xanh tím của đêm.', 'I can carry it now, Uncle. I am coming.': 'Giờ em cầm được rồi, chú ơi. Em đến đây.', 'Zero’s Sword': 'Kiếm Của Zero',
    'The core is beneath this hall. I will open it, and shut down every machine I can.': 'Lõi ở bên dưới đại sảnh này. Ta sẽ mở nó, và tắt mọi cỗ máy ta tắt được.', 'Go and get him. Someone in this city should get their father back.': 'Đi đón hắn về đi. Trong thành phố này, ít ra cũng nên có một người được đón cha mình về.', 'The Hierarch fell, and the machines kept praying without her.': 'Giáo Chủ ngã xuống, và lũ máy vẫn tiếp tục cầu nguyện mà không có cô.',
    'The core broke open. Zero fell out of the light, and Nyx caught him.': 'Lõi vỡ toang. Zero rơi ra khỏi ánh sáng, và Nyx đỡ lấy chú.', 'Now she was the one carrying him. The first day, turned around.': 'Giờ cô là người bế chú. Ngày đầu tiên, đảo ngược.', 'You grew up...': 'Em lớn rồi...', 'You told me to.': 'Chú bảo em lớn lên mà.',
    'Lead the Riders through New Meridian': 'Dẫn Tứ Kỵ Sĩ qua Thủ Đô Meridian Mới', 'Face the Hierarch': 'Đối mặt Giáo Chủ', 'Break the Architect’s core': 'Phá lõi của The Architect', 'Persuade her to turn on the Architect': 'Thuyết phục cô quay lưng với The Architect', 'Defeat her': 'Đánh bại cô', 'She will not listen yet. Answer her honestly during the fight.': 'Cô ấy chưa chịu nghe. Hãy trả lời thật lòng trong lúc đánh.',
    'The Hierarch drops her blade. For a moment she looks like someone who once had a father who left.': 'Giáo Chủ buông kiếm. Trong một thoáng, cô trông như một người từng có người cha bỏ đi.', 'SABLE': 'SABLE', 'MIRAE': 'MIRAE', 'YSOLDE': 'YSOLDE'
});
