'use strict';
/**
 * DAY FOUR, THE STARS: THE BROKEN OBSERVATORY. Nyx is thirteen. Stars have fallen to the ground, each
 * holding a future already written. Mini-boss: the Meteor Clock. Boss: ASTRAEA, the Blind Prophet,
 * who reads the last ten seconds of what you did and is never caught by the same thing twice;
 * in her last phase gravity turns over. She tells Nyx her guardian will vanish. Nyx fights angry.
 */
Object.assign(THEMES, {
    observ: { step: 'metal', dust: '#7a7a9a', debris: '#4a4a6a', music: 'g2observ', amb: 'void', ambient: '#9a98c0', tile: { base: '#1c1a2a', mid: '#2a283e', top: '#5a5880', edge: '#c8b0ff', back: '#0e0c18', backLine: '#1a1828' } }
});
(function () {
    const B = {
        observ() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#05040c'], ['#141030', .5], ['#24183a', 1]]); for (let i = 0; i < 260; i++) { x.fillStyle = R() < .1 ? '#c8b0ff' : '#e8e8ff'; x.globalAlpha = .2 + R() * .7; const s = R() < .05 ? 2.4 : 1.2; x.fillRect(R() * BG_W, R() * VH * .8, s, s); } x.globalAlpha = 1; x.globalCompositeOperation = 'lighter'; x.globalAlpha = .25; x.drawImage(Glow.get('#8a6ad8'), 300, 60, 700, 400); x.globalAlpha = 1; });
            add(.1, (x, R) => { x.strokeStyle = 'rgba(200,180,255,.25)'; x.lineWidth = 1; for (let i = 0; i < 14; i++) { const cx = R() * BG_W, cy = 80 + R() * 200; x.beginPath(); for (let k = 0; k < 5; k++) x.lineTo(cx + U.rand(-90, 90), cy + U.rand(-60, 60)); x.stroke(); } });
            add(.3, (x, R) => { for (let px = 0; px < BG_W; px += 400 + R() * 300) { x.fillStyle = '#100e1c'; x.beginPath(); x.arc(px + 150, 430, 150, Math.PI, 0); x.fill(); x.fillRect(px, 430, 300, 300); x.strokeStyle = '#3a3460'; x.lineWidth = 3; x.beginPath(); x.arc(px + 150, 430, 150, Math.PI * 1.1, Math.PI * 1.6); x.stroke(); x.fillStyle = '#2a2448'; x.save(); x.translate(px + 150, 330); x.rotate(-.6); x.fillRect(-10, -100, 20, 140); x.restore(); } });
            add(.6, (x, R) => { for (let i = 0; i < 12; i++) { const px = R() * BG_W; x.fillStyle = '#0a0812'; x.beginPath(); x.ellipse(px, VH - 40, 70, 40, 0, 0, TAU); x.fill(); Paint.glow(x, px, VH - 60, 30, '#c8b0ff'); } });
            return L;
        }
    };
    const bb = Backdrop.build.bind(Backdrop); Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return bb(id); };
    const ab = Atmos.build.bind(Atmos), fg = {}; Atmos.build = function (id) { if (!B[id]) return ab(id); if (fg[id]) return fg[id]; return fg[id] = U.canvas(BG_W, VH); };
    Atmos.fogCol.observ = '#6a5a9a';
})();
Object.assign(ENEMIES, {
    starshard: { name: 'Fallen Star Shard', ai: 'flyer', body: 'wisp', hp: 50, dmg: 13, spd: 3, xp: 16, w: 26, h: 26, col: { a: '#8a7ad8', b: '#f0e8ff', g: '#c8b0ff' }, atks: [mkA(A.charge, { range: 300, spd: 12, s: 26, a: 22, cd: 120, sfx: 'blink' })] },
    faceless: { name: 'Faceless Astrologer', ai: 'ranged', body: 'human', hp: 96, dmg: 13, spd: 1.8, xp: 20, col: { a: '#2a2440', b: '#5a5080', g: '#c8b0ff', s: '#3a3458' }, gear: 'staff', atks: [mkA(A.shot, { proj: 'orb', col: '#c8b0ff', spd: 6.5, cd: 100 }), mkA(A.ring, { col: '#c8b0ff', n: 10, range: 320, spd: 4.5, s: 46, cd: 220 })] },
    starguard: { name: 'Fixed-Star Sentinel', ai: 'heavy', body: 'obelisk', hp: 300, dmg: 19, spd: 1.4, xp: 50, w: 54, h: 88, poise: 50, col: { a: '#2a2848', b: '#6a64a0', g: '#e8e0ff' }, atks: [mkA(A.slam, { rad: 130 }), mkA(A.shot, { proj: 'bolt', col: '#e8e0ff', spd: 10, cd: 80 })] },
    orrery: { name: 'Living Orrery', ai: 'elite', body: 'golem', elite: true, hp: 640, dmg: 20, spd: 2.6, xp: 170, poise: 70, w: 64, h: 90, col: { a: '#3a3058', b: '#8a80c0', g: '#ffe8a0' }, atks: [mkA(A.ring, { col: '#ffe8a0', n: 12 }), mkA(A.slam, { rad: 150 }), mkA(A.charge, { spd: 11 })] }
});

/* ------------------------------ MINI-BOSS: THE METEOR CLOCK ------------------------------ */
const B_CLOCK = {
    id: 'clock', name: 'THE METEOR CLOCK', title: 'IT ONLY EVER SHOWS ONE HOUR', hp: 3400, w: 160, h: 160, col: '#ffe8a0', mini: true, music: 'g2clock', reward: { xp: 700, relic: 'bell', cells: 150 },
    init: b => ({ hand: -Math.PI / 2, spin: .01 }),
    aim: b => ({ x: b.x, y: b.y - 200 }),
    box: b => ({ x: b.x - 80, y: b.y - 280, w: 160, h: 160 }),
    tick(b) { b.hand += b.spin; Light.add(b.x, b.y - 200, 260, '#ffe8a0', .7); },
    phases: [{ moves: ['sweep', 'meteors', 'chime'], rest: 30 }, { at: .5, moves: ['sweep', 'meteors', 'chime', 'reverse'], rest: 20, say: ['THE METEOR CLOCK', 'TICK. TOCK. It is always the hour of your loss.'] }],
    moves: {
        *sweep(b) { const dir = U.pick([-1, 1]); for (let k = 0; k < 2; k++) { const x = dir > 0 ? b.A.x0 : b.A.x1 - 160; Combat.warn({ shape: 'rect', x: k ? b.A.x0 : x, y: b.A.y - (k ? 200 : 70), w: k ? b.A.x1 - b.A.x0 : 160 * dir * 6, h: k ? 50 : 70, t: 40, dmg: b.D(17), src: b }); yield 50; } },
        *meteors(b) { for (let i = 0; i < 7; i++) { b.fallRock(U.rand(b.A.x0 + 40, b.A.x1 - 40), 40, b.D(14), 'orb', 16); yield 9; } yield 40; },
        *chime(b) { for (let n = 0; n < 3; n++) { Sound.sfx('toll', { v: .5 }); for (let i = 0; i < 12; i++) Combat.eshoot(b, 'orb', b.x, b.y - 200, i / 12 * TAU + n * .26, 4.2, b.D(9), { r: 8, life: 160, col: '#ffe8a0' }); yield 30; } yield 30; },
        *reverse(b) { b.spin = -.05; G.toast('The hands run backwards', '#ffe8a0'); yield 90; b.spin = .01; }
    },
    draw(c, b) {
        const f = b.flash > 0, x = b.x, y = b.y - 200;
        c.fillStyle = '#2a2448'; c.fillRect(x - 12, y, 24, 200); c.fillStyle = f ? '#fff' : '#3a3460'; c.beginPath(); c.arc(x, y, 84, 0, TAU); c.fill(); c.fillStyle = '#e8e0c8'; c.beginPath(); c.arc(x, y, 72, 0, TAU); c.fill();
        c.fillStyle = '#2a2448'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillRect(x + Math.cos(a) * 60 - 2, y + Math.sin(a) * 60 - 2, 4, 4); }
        c.strokeStyle = '#2a2448'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b.hand) * 56, y + Math.sin(b.hand) * 56); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b.hand * 12) * 66, y + Math.sin(b.hand * 12) * 66); c.stroke();
        Paint.glow(c, x, y, 30, '#ffe8a0'); for (let i = 0; i < 3; i++) Paint.disc(c, x + Math.cos(b.anim * .03 + i * 2) * 110, y + Math.sin(b.anim * .03 + i * 2) * 40, 6, '#ffe8a0');
    }
};

/* ------------------------------ BOSS: ASTRAEA ------------------------------ */
const B_ASTRAEA = {
    id: 'astraea', name: 'ASTRAEA', title: 'THE PROPHET BLIND TO STARS', hp: 9800, w: 70, h: 170, col: '#c8b0ff', female: true, choice: true, music: 'g2astraea', reward: { xp: 1500, relic: 'mirror', cells: 300 },
    init: b => ({ foresee: 0, seen: {} }),
    aim: b => ({ x: b.x, y: b.y - 100 }),
    box: b => ({ x: b.x - 35, y: b.y - 170, w: 70, h: 170 }),
    tick(b) { if (b.foresee > 0) b.foresee--; Light.add(b.x, b.y - 110, 240, '#c8b0ff', .6); if (!b.dead && b.phase >= 2) { G.g2xf = { flip: Math.min(1, (G.g2xf && G.g2xf.flip || 0) + .02) }; G.g2grav = .45; } },
    phases: [
        { moves: ['constellation', 'prophecy', 'starfall', 'blinkcut'], rest: 34 },
        { at: .62, moves: ['constellation', 'prophecy', 'starfall', 'blinkcut', 'mirror'], rest: 26, enter: function* (b) { G.say('ASTRAEA', 'I have read this fight already. I know how it ends. Do you?', 200); Sound.sfx('toll'); yield 60; } },
        { at: .3, moves: ['starfall', 'prophecy', 'blinkcut', 'constellation'], rest: 22, enter: function* (b) { G.say('ASTRAEA', 'Then let the sky fall upward.', 160); Sound.sfx('bigboom', { v: .5 }); G.flash = .6; yield 70; G.toast('Gravity has turned over', '#c8b0ff'); } }
    ],
    moves: {
        *constellation(b) { const P = b.P, pts = []; for (let i = 0; i < 5; i++) pts.push({ x: U.clamp(P.x + U.rand(-320, 320), b.A.x0 + 40, b.A.x1 - 40), y: b.A.y - U.rand(40, 260) }); for (const p of pts) Combat.warn({ shape: 'circle', x: p.x, y: p.y, r: 70, t: 46, dmg: b.D(14), src: b, col: '#c8b0ff' }); yield 50; for (let i = 0; i < pts.length - 1; i++) VFX.line && VFX.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, '#c8b0ff'); yield 26; },
        *prophecy(b) { const P = b.P, px = P.x + P.vx * 30; G.say('ASTRAEA', U.pick(['You will step there.', 'You always go left when you are afraid.', 'There. Just there.']), 90); Combat.warn({ shape: 'rect', x: px - 70, y: b.A.y - 400, w: 140, h: 400, t: 40, dmg: b.D(19), src: b, col: '#e8e0ff' }); yield 56; },
        *starfall(b) { for (let i = 0; i < 9; i++) { b.fallRock(U.rand(b.A.x0 + 30, b.A.x1 - 30), 36, b.D(12), 'orb', 13); yield 7; } yield 36; },
        *blinkcut(b) { VFX.burst(b.x, b.y - 90, '#c8b0ff', 18, 5, 24, 6, 1); b.hide = true; b.untargetable = true; Sound.sfx('blink'); yield 20; b.x = U.clamp(b.P.x - b.P.facing * 110, b.A.x0 + 40, b.A.x1 - 40); b.facing = b.P.x > b.x ? 1 : -1; b.hide = false; b.untargetable = false;
            Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 140, w: b.facing * 160, h: 140, t: 24, dmg: b.D(18), src: b, kb: 9 }); yield 44; },
        *mirror(b) { const H = G2.habit(); if (H.kind) { b.seen[H.kind] = 1; G.say('ASTRAEA', tr('I have seen your') + ' ' + tr(G2.ACT_NAME[H.kind] || H.kind) + '. ' + tr('Show me something else.'), 160); } yield 70; }
    },
    death: function* (b) { G.g2xf = null; G.g2grav = 1; yield* G2.mercy(b, ['ASTRAEA', 'You beat me. You did not beat the stars.']); },
    draw(c, b) {
        if (b.hide || b.gone) return; const f = b.flash > 0, x = b.x, y = b.y, t = b.anim;
        c.save(); c.translate(x, y); c.scale(1.35, 1.35);
        c.fillStyle = f ? '#fff' : '#2a2448'; c.beginPath(); c.moveTo(-10, -110); c.lineTo(10, -110); c.lineTo(30, 0); c.lineTo(-30, 0); c.fill();
        for (let i = 0; i < 16; i++) Paint.disc(c, -20 + (i * 37 % 40), -10 - (i * 53 % 95), 1.2, '#e8e0ff');
        c.fillStyle = '#c8b0ff'; c.fillRect(-12, -112, 24, 4);
        c.strokeStyle = '#e0d8f0'; c.lineWidth = 3.5; c.lineCap = 'round'; const a = b.foresee > 0 ? -2.4 : Math.sin(t * .04) * .3 - .4; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 8, -104); c.lineTo(d * (10 + Math.cos(a) * 20), -104 + Math.sin(a) * 26); c.stroke(); }
        Paint.disc(c, 0, -122, 9, '#e8e0f0'); c.fillStyle = '#1a1430'; c.fillRect(-9, -125, 18, 4); c.fillStyle = '#c8b0ff'; c.fillRect(-9, -125, 18, 1);
        c.strokeStyle = '#c8b0ff'; c.lineWidth = 1.4; for (let i = 0; i < 7; i++) { const aa = t * .02 + i * .9; c.beginPath(); c.arc(0, -122, 22 + i * 3, aa, aa + .4); c.stroke(); }
        if (b.foresee > 0) { c.fillStyle = 'rgba(232,224,255,.9)'; c.font = 'bold 9px "Palatino Linotype", serif'; c.textAlign = 'center'; c.fillText(tr('FORESEEN'), 0, -150); }
        if (b.sleep) { c.fillStyle = `rgba(20,20,60,${b.sleep * .4})`; c.fillRect(-40, -150, 80, 150); }
        c.restore();
    }
};
G2.ACT_NAME = { attack: 'sword', ranged: 'lantern', heavy: 'heavy strike', skill1: 'Little Night', skill2: 'second skill', skill3: 'third skill', dodge: 'dodge', ult: 'night call' };
// She has already read whatever you do most: those hits she sidesteps and answers.
(function () {
    const hurt = Boss.prototype.hurt;
    Boss.prototype.hurt = function (dmg, o) {
        if (this.def.id === 'astraea' && !this.dead && !this.untargetable) {
            const H = G2.habit(), P = G.player, kind = P && P.lastAct, mine = Combat._att === P || (Combat._att && Combat._att.owner === P);
            if (mine && kind && H.kind === kind && H.share >= .45 && H.n >= 6 && this.foresee <= 0) {
                this.foresee = 70; VFX.text(this.x, this.y - 190, tr('FORESEEN'), '#e8e0ff', 18, 50); Sound.sfx('parry', { v: .5 });
                const d = P.x > this.x ? -1 : 1; this.x = U.clamp(P.x + d * 120, this.A.x0 + 40, this.A.x1 - 40);
                Combat.warn({ shape: 'circle', x: P.x, y: P.y - 34, r: 70, t: 18, dmg: this.D(10), src: this }); return 0;
            }
        }
        return hurt.call(this, dmg, o);
    };
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) { hd(c); const b = G.boss; if (b && b.def.id === 'astraea' && !b.dead) { const H = G2.habit(); if (H.kind && H.share >= .45 && H.n >= 6) { c.font = '13px "Palatino Linotype", serif'; c.textAlign = 'center'; c.fillStyle = '#e8e0ff'; c.fillText(tr('Astraea has read your') + ' ' + tr(G2.ACT_NAME[H.kind] || H.kind) + ' (' + Math.round(H.share * 100) + '%)', VW / 2, 118); } } };
})();
Object.assign(BOSSES, { clock: B_CLOCK, astraea: B_ASTRAEA });
Object.assign(BOSS_INTRO, {
    clock: [['THE METEOR CLOCK', 'TICK.'], ['NYX', 'It is a clock... made of falling stars.'], ['ZERO', 'Break the face. Keep moving.']],
    astraea: [['ASTRAEA', 'Child of the night. I have been waiting. The stars told me your name before he gave it to you.'], ['ASTRAEA', 'Your guardian will vanish before you are grown. I have seen it. You cannot change it.'], ['NYX', 'That is not true!'], ['NYX', 'You do not know anything! Uncle, stay back. This one is mine.'], ['ZERO', '...Nyx.']]
});
Object.assign(LEVELS, {
    observ() {
        const b = new LB('observ', 320, 60, { name: 'THE BROKEN OBSERVATORY', sub: 'The Fourth Day: the stars that fell', region: 'city', theme: THEMES.observ, bg: 'observ', next: 'astraea', spawn: { x: 5, y: 40 }, weather: 'motes' });
        b.at(0, 40).flat(22).beacon(5, 40); b.obj('npc', 15, 40, { id: 'stargazer' });
        b.say(6, 40, 'ZERO', 'Each fallen star is a future someone wrote down. Do not read them.', 200);
        b.flat(10).es([['starshard', b.cx - 4, 34], ['faceless', b.cx - 2, b.cy - 2]]); b.obj('lore', b.cx - 6, b.cy, { id: 'g2p13' });
        // A broken stair of floating platforms between the domes.
        let x = b.cx; b.gap(4); b.flat(4); b.gap(4); b.plat(x, b.cy - 1, 4).plat(x + 8, b.cy - 1, 4).plat(x + 5, b.cy - 5, 3); b.flat(6).up(4).flat(12).es([['starguard', b.cx - 5, b.cy - 3]]);
        b.say(b.cx - 10, b.cy, 'NYX', 'This one says I will be alone. Uncle, it says I will be alone.', 180); b.say(b.cx - 4, b.cy, 'ZERO', 'Then do not read it.', 120);
        b.flat(10).beacon(b.cx - 4, b.cy); b.down(4).flat(12).es([['starshard', b.cx - 8, b.cy - 6], ['starshard', b.cx - 5, b.cy - 7], ['faceless', b.cx - 2, b.cy - 2]]);
        b.obj('lore', b.cx - 3, b.cy, { id: 'g2p14' });
        // The great lens: a hidden shard above it.
        const sx = b.cx; b.flat(18); b.mover(sx + 2, b.cy - 4, 3, sx + 2, b.cy - 13, 260, { skin: 'plat' }); b.plat(sx + 7, b.cy - 14, 4); b.obj('chest', sx + 9, b.cy - 14, { id: 'g2shard4', cells: 70, shard: 'stars' });
        b.es([['orrery', sx + 14, b.cy - 3]]); b.say(sx + 1, b.cy, 'ZERO', 'Together, Nyx. Your lantern, my sword.', 130);
        b.flat(10).beacon(b.cx - 4, b.cy); b.obj('lore', b.cx - 2, b.cy, { id: 'g2p15' });
        b.say(b.cx + 2, b.cy, 'NYX', 'You coughed again.', 100); b.say(b.cx + 6, b.cy, 'ZERO', 'Stars are dusty.', 100);
        b.flat(10).es([['faceless', b.cx - 6, b.cy - 2], ['starguard', b.cx - 3, b.cy - 3]]);
        // The clock court.
        const ar = b.cx, y = b.cy; b.flat(44); b.fill(ar + 40, 0, ar + 43, 59);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 40, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('clock', ar + 3, ar + 40, y, ar + 26, y, { trigger: ar + 7 });
        b.obj('exit', ar + 37, y, { hidden: true, label: 'Climb to the prophet' }); b.obj('lore', ar + 33, y, { id: 'g2p16' });
        b.flat(6); return b.done();
    },
    astraea() {
        const b = new LB('astraea', 72, 36, { name: 'THE DOME OF FIXED STARS', sub: 'The Fourth Day: Astraea', region: 'city', theme: THEMES.observ, bg: 'observ', spawn: { x: 4, y: 28 }, weather: 'motes', indoors: true });
        b.at(0, 28).flat(72); b.fill(0, 0, 1, 35); b.fill(70, 0, 71, 35); b.beacon(3, 28); b.gate(8, 18, 10, 'arena_l');
        b.plat(18, 23, 5).plat(48, 23, 5).plat(33, 19, 5);
        b.bossArena('astraea', 9, 69, 28, 40, 28, { trigger: 12 });
        return b.done();
    }
});
Object.assign(LORE, {
    g2p13: { title: 'The Second Book, 4:1', region: 'observ', text: 'On the fourth day the Lamb set the stars in the sky. But it was afraid of what was coming, so it wrote each one down before it happened. The stars grew heavy with it, and fell.' },
    g2p14: { title: 'Astrologer’s Note', region: 'observ', text: 'A future that has been written can be read. A future that has been read is half-lived already. We have nothing left to live, only to check.' },
    g2p15: { title: 'On Astraea', region: 'observ', text: 'She put out her own eyes so the stars would speak more clearly. They did. She has not heard anything else since.' },
    g2p16: { title: 'Meridian Survey, Day Four', region: 'observ', text: 'Subject has begun to resist the guardian. Typical at this age. The guardian is weakening faster than projected. The Architect asks only that he come to it before the girl is old enough to stop him.' }
});
Object.assign(NPCS, { stargazer: { name: 'STARGAZER', look: '#6a64a0', lines: [['STARGAZER', 'I read my own star once. Now I already know every day of my life.'], ['NYX', 'Is that good?'], ['STARGAZER', 'It is very boring, child.']] } });
Object.assign(CUTS, {
    *g2ch4open(c) {
        Music.cut('g2lul4', 'calm'); c.lb = 1; c.shot(Stage.starfall); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(13); yield 40;
        yield* c.say('', 'At thirteen Nyx carried the Night Lantern, and walked beside him rather than behind.', 230);
        yield* c.say('NYX', 'The stars are falling, Uncle. They look like they are crying too.', 170);
        yield* c.say('ZERO', 'Everything in this world cries a little. That is my fault.', 190);
        yield* c.say('NYX', 'It is not your fault!', 120);
        c.clearActors(); c.title('THE FOURTH DAY', 'STARS: THE BROKEN OBSERVATORY', 200, '#c8b0ff'); c.fade(0, 20); yield 210;
    },
    *g2AstraeaAfter(c) {
        const sp = Save.data.g2.spared.astraea; Music.cut('g2lul4', 'calm'); c.lb = 1; c.shot(Stage.starfall); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(13); yield 40;
        yield* c.say('ASTRAEA', 'You beat me. You did not beat the stars.', 180);
        if (sp) yield* c.say('', 'Astraea smiled, and for the first time in years, she opened her eyes.', 200);
        yield* c.say('', 'That night, by the fire.', 120);
        yield* c.say('NYX', 'Uncle. You will not go anywhere, will you?', 160);
        yield* c.say('', 'Zero was silent for a very long time.', 200);
        yield* c.say('', 'Then he put his hand on her head.', 160);
        yield* c.say('ZERO', 'Go to sleep, Nyx.', 160);
        yield* c.say('', 'Nyx had always been the only one who slept soundly. That night, for the first time, she could not sleep.', 260);
        c.fade(1, 60); yield 66;
    }
});
Stage.starfall = (c, t) => { Backdrop.draw(c, 'observ', { x: 300 + t * .1, y: 0, zoom: 1 }, t); c.fillStyle = '#1c1a2a'; c.fillRect(0, 560, VW, 200); for (let i = 0; i < 6; i++) { const k = ((t * 2 + i * 220) % 900), x = 200 + i * 160 + k * .4, y = -40 + k; c.strokeStyle = 'rgba(232,224,255,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 40, y - 60); c.stroke(); Paint.disc(c, x, y, 3, '#ffffff'); } };
REGIONS[3].level = 'observ';
LEVEL_ORDER.push('observ', 'astraea');
Object.assign(OBJECTIVES, { observ: 'Cross the Broken Observatory', astraea: 'Prove the stars wrong' });
G2.DAYS[4].open = 'g2ch4open';

Object.assign(VI, {
    'THE BROKEN OBSERVATORY': 'ĐÀI THIÊN VĂN VỠ', 'The Fourth Day: the stars that fell': 'Ngày Thứ Tư: những vì sao đã rơi', 'THE DOME OF FIXED STARS': 'MÁI VÒM ĐỊNH TINH', 'The Fourth Day: Astraea': 'Ngày Thứ Tư: Astraea',
    'Fallen Star Shard': 'Mảnh Sao Rơi', 'Faceless Astrologer': 'Nhà Chiêm Tinh Không Mặt', 'Fixed-Star Sentinel': 'Vệ Binh Hằng Tinh', 'Living Orrery': 'Mô Hình Thiên Thể Sống',
    'THE METEOR CLOCK': 'ĐỒNG HỒ SAO BĂNG', 'IT ONLY EVER SHOWS ONE HOUR': 'NÓ CHỈ MÃI MỘT GIỜ', 'The hands run backwards': 'Kim đồng hồ chạy ngược', 'TICK. TOCK. It is always the hour of your loss.': 'TÍCH. TẮC. Lúc nào cũng là giờ ngươi mất mát.',
    'ASTRAEA': 'ASTRAEA', 'THE PROPHET BLIND TO STARS': 'NỮ TIÊN TRI MÙ SAO', 'FORESEEN': 'ĐÃ ĐOÁN TRƯỚC', 'Gravity has turned over': 'Trọng lực đã đảo ngược',
    'I have read this fight already. I know how it ends. Do you?': 'Ta đã đọc trận này rồi. Ta biết nó kết thúc thế nào. Còn con?', 'Then let the sky fall upward.': 'Vậy thì để bầu trời rơi ngược lên.',
    'You will step there.': 'Con sẽ bước tới đó.', 'You always go left when you are afraid.': 'Mỗi khi sợ, con luôn đi sang trái.', 'There. Just there.': 'Đó. Ngay đó.', 'I have seen your': 'Ta đã thấy', 'Show me something else.': 'Cho ta xem thứ khác đi.', 'Astraea has read your': 'Astraea đã đọc được', 'You beat me. You did not beat the stars.': 'Con thắng ta. Nhưng không thắng được những vì sao.',
    'sword': 'đòn kiếm', 'lantern': 'đèn lồng', 'heavy strike': 'đòn nặng', 'second skill': 'kỹ năng thứ hai', 'third skill': 'kỹ năng thứ ba', 'dodge': 'cú né', 'night call': 'tiếng gọi đêm',
    'TICK.': 'TÍCH.', 'It is a clock... made of falling stars.': 'Là một cái đồng hồ... làm từ sao rơi.', 'Break the face. Keep moving.': 'Đập vỡ mặt nó. Đừng đứng yên.',
    'Child of the night. I have been waiting. The stars told me your name before he gave it to you.': 'Đứa con của đêm. Ta đã chờ. Những vì sao nói tên con cho ta trước cả khi hắn đặt cho con.', 'Your guardian will vanish before you are grown. I have seen it. You cannot change it.': 'Người bảo vệ con sẽ biến mất trước khi con trưởng thành. Ta đã thấy. Con không thể thay đổi nó.',
    'That is not true!': 'Không phải thế!', 'You do not know anything! Uncle, stay back. This one is mine.': 'Bà không biết gì cả! Chú ơi, lùi lại. Trận này để em.', '...Nyx.': '...Nyx.',
    'Each fallen star is a future someone wrote down. Do not read them.': 'Mỗi ngôi sao rơi là một tương lai ai đó đã viết sẵn. Đừng đọc chúng.', 'This one says I will be alone. Uncle, it says I will be alone.': 'Ngôi sao này nói em sẽ ở một mình. Chú ơi, nó nói em sẽ ở một mình.', 'Then do not read it.': 'Vậy thì đừng đọc nó.',
    'Together, Nyx. Your lantern, my sword.': 'Cùng nhau, Nyx. Đèn lồng của em, kiếm của ta.', 'You coughed again.': 'Chú lại ho rồi.', 'Stars are dusty.': 'Sao nhiều bụi lắm.', 'Climb to the prophet': 'Leo lên chỗ nhà tiên tri',
    'The Second Book, 4:1': 'Sách Thứ Hai, 4:1', 'On the fourth day the Lamb set the stars in the sky. But it was afraid of what was coming, so it wrote each one down before it happened. The stars grew heavy with it, and fell.': 'Ngày thứ tư, Con Chiên đặt các vì sao lên trời. Nhưng nó sợ những gì sắp tới, nên nó viết sẵn từng điều trước khi chúng xảy ra. Các vì sao nặng trĩu vì thế, và rơi xuống.',
    'Astrologer’s Note': 'Ghi Chép Của Nhà Chiêm Tinh', 'A future that has been written can be read. A future that has been read is half-lived already. We have nothing left to live, only to check.': 'Một tương lai đã viết thì đọc được. Một tương lai đã đọc thì như đã sống một nửa. Chúng tôi chẳng còn gì để sống, chỉ còn để kiểm tra.',
    'On Astraea': 'Về Astraea', 'She put out her own eyes so the stars would speak more clearly. They did. She has not heard anything else since.': 'Cô tự làm mù mắt mình để các vì sao nói rõ hơn. Chúng đã nói. Từ đó cô chẳng nghe được gì khác nữa.',
    'Meridian Survey, Day Four': 'Báo Cáo Khảo Sát Meridian, Ngày Thứ Tư', 'Subject has begun to resist the guardian. Typical at this age. The guardian is weakening faster than projected. The Architect asks only that he come to it before the girl is old enough to stop him.': 'Đối tượng bắt đầu chống đối người giám hộ. Điển hình ở độ tuổi này. Người giám hộ suy yếu nhanh hơn dự kiến. The Architect chỉ yêu cầu hắn tự tìm đến trước khi cô bé đủ lớn để ngăn hắn lại.',
    'STARGAZER': 'NGƯỜI NGẮM SAO', 'I read my own star once. Now I already know every day of my life.': 'Ta từng đọc ngôi sao của chính mình. Giờ ta biết trước mọi ngày trong đời ta.', 'Is that good?': 'Vậy có tốt không ạ?', 'It is very boring, child.': 'Chán lắm, cháu ạ.',
    'At thirteen Nyx carried the Night Lantern, and walked beside him rather than behind.': 'Mười ba tuổi, Nyx cầm Đèn Lồng Bóng Đêm, và đi bên cạnh chú chứ không còn đi phía sau.', 'The stars are falling, Uncle. They look like they are crying too.': 'Sao đang rơi kìa chú. Trông chúng cũng như đang khóc.', 'Everything in this world cries a little. That is my fault.': 'Mọi thứ trong thế giới này đều khóc một chút. Đó là lỗi của ta.', 'It is not your fault!': 'Không phải lỗi của chú!',
    'THE FOURTH DAY': 'NGÀY THỨ TƯ', 'STARS: THE BROKEN OBSERVATORY': 'TINH TÚ: ĐÀI THIÊN VĂN VỠ',
    'Astraea smiled, and for the first time in years, she opened her eyes.': 'Astraea mỉm cười, và lần đầu tiên sau bao năm, cô mở mắt ra.', 'That night, by the fire.': 'Đêm đó, bên đống lửa.', 'Uncle. You will not go anywhere, will you?': 'Chú sẽ không đi đâu, phải không?', 'Zero was silent for a very long time.': 'Zero im lặng rất lâu.', 'Then he put his hand on her head.': 'Rồi chú xoa đầu cô.', 'Go to sleep, Nyx.': 'Ngủ đi, Nyx.',
    'Nyx had always been the only one who slept soundly. That night, for the first time, she could not sleep.': 'Nyx vốn là người duy nhất ngủ yên giấc. Đêm đó, lần đầu tiên, cô không ngủ được.',
    'Cross the Broken Observatory': 'Vượt qua Đài Thiên Văn Vỡ', 'Prove the stars wrong': 'Chứng minh các vì sao đã sai', 'The blind prophet': 'Nhà tiên tri mù', 'Astraea smiles at nothing. "You beat me. You did not beat the stars."': 'Astraea mỉm cười với khoảng không. "Con thắng ta. Nhưng không thắng được những vì sao."',
    '"Then watch them with me, with your own eyes."': '"Vậy thì ngắm chúng cùng em, bằng chính đôi mắt của cô."', '"I will break every star you read."': '"Em sẽ đập vỡ mọi ngôi sao cô đã đọc."', 'Night Lantern': 'Đèn Lồng Bóng Đêm', 'A lantern that gives off darkness. Its shot puts lesser foes to sleep for a moment.': 'Một chiếc đèn lồng tỏa ra bóng tối. Phát bắn của nó khiến quái yếu ngủ thiếp một lúc.'
});
