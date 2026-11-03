'use strict';
/**
 * FINALE: the last battle of the game, built on top of the Endbringer in boss.js.
 *   I   THE FALSE SERAPH    the Beast wears the Throne's shape from the opening
 *   II  THE LAKE OF FIRE    the floor falls; echoes of all five seal-bearers return
 *   III THE TRUE VOID       reality collapses; the Scales, Seven Trumpets and the Eyes
 *   IV  THE WRATH OF ZERO   the Beast is revealed as Zero's mirror, in a duel on white
 *   LAST LIGHT              a beam struggle the player wins with the Riders at their side
 */
const WRATH_STYLE = Object.assign({}, CHARS.zero.style, {
    scale: 1.22, col: { armor: '#1a0608', armor2: '#6a0c10', dark: '#0c0204', skin: '#0c0204', boot: '#ff1100', glow: '#ff1100', glove: '#0c0204' },
    chainPaint(c, r) { paintChain(17, '#0a0204', '#ff1100')(c, r); },
    emblem(c, T, w) { c.fillStyle = Paint.c('#ff1100'); c.fillRect(-w * .1, -T * .8, 2.4, T * .4); c.fillRect(-w * .5, -T * .62, w * 1.1, 1.5); Paint.glow(c, 1, -T * .62, 12, '#ff1100'); },
    torsoGear(c, J) { c.fillStyle = Paint.c('#ff1100'); c.fillRect(J.hip.x - 7, J.hip.y - 1.5, 14, 2.6); },
    pauldron(c, J) { const s = J.sh; Paint.poly(c, [s.x - 9, s.y + 2, s.x - 7, s.y - 5, s.x - 2, s.y - 16, s.x + 3, s.y - 6, s.x + 9, s.y - 3, s.x + 8, s.y + 4, s.x, s.y + 5], '#2a0a0c'); c.fillStyle = Paint.c('#ff1100'); c.fillRect(s.x - 4, s.y - 1, 9, 1.4); },
    headGear(c, J) {
        Looks.head(c, J, x => {
            Paint.poly(x, [-9, 6, -9, -5, -3, -11, 5, -10, 9, -4, 9, 3, 4, 7], '#1a0608'); Paint.poly(x, [0, -5, 10, -4, 9, 1, 0, 1], '#050102');
            x.fillStyle = Paint.c('#ff1100'); x.fillRect(1.5, -3.2, 8.5, 2.8); Paint.glow(x, 6, -2, 13, '#ff1100');
            Paint.poly(x, [-7, -8, -18, -22, -3, -11], '#0c0204'); Paint.poly(x, [3, -10, 8, -24, 7, -9], '#0c0204');
        });
    }
});
const FINAL_RIDERS = { rook: ['ROOK', 'Doors stay open. Get up.'], sable: ['SABLE', 'Eleven minutes, remember? Move.'], mirae: ['MIRAE', 'Hold still. This will burn, then it will not.'], ysolde: ['YSOLDE', 'Stand behind me. That is the entire plan.'], zero: ['ZERO', 'I am here. Finish it.'] };

(function finale() {
    const E = B_END, M = E.moves, baseDraw = E.draw, baseAim = E.aim, baseBox = E.box, baseTick = E.tick, baseInit = E.init;
    const seal = (n, t) => { G.bigText = { text: n, sub: t, col: '#ffd9a0', t: 90 }; Sound.sfx('trumpet'); G.addShake(8); };
    const ghost = (id, x, y, life, set) => { const g = new Boss(BOSSES[id], x, y); Object.assign(g, set); G.ghosts = G.ghosts || []; G.ghosts.push({ g, t: 0, life }); return g; };

    E.init = b => Object.assign(baseInit(b), { form: 'seraph', asked: {}, wrathShield: 0 });
    E.aim = b => b.form === 'wrath' ? { x: b.x, y: b.y - 44 } : baseAim(b);
    E.box = b => b.form === 'wrath' ? { x: b.x - 20, y: b.y - 78, w: 40, h: 78 } : baseBox(b);

    E.tick = b => {
        baseTick(b);
        const L = G.level; if (!L.bgMode) L.bgMode = 'seraph';
        if (b.form === 'wrath') {
            const R = b.rig; R.ground = b.y >= b.A.y - 1; R.gaitAmt = 1; R.phase += Math.abs(b.vx) / 11;
            if (b.pose) { /* a held attack pose set by the move */ } else if (Math.abs(b.vx) > .5) R.play('run', 4); else R.play('idle', 6);
            R.tick(); if (b.aimArm !== undefined) { const rel = b.facing > 0 ? b.aimArm : Math.PI - b.aimArm; R.out[PI.aF] = 90 - rel * 180 / Math.PI - R.out[PI.lean]; R.out[PI.fF] = 2; }
            R.updateChain(b.x, b.y, b.facing, -b.vx * .3); b.vx *= .8;
            if (b.wrathShield > 0) b.wrathShield--;
            if (G.time % 3 === 0) VFX.add(b.x + U.rand(-16, 16), b.y - U.rand(0, 80), U.rand(-.6, .6), -U.rand(.5, 2), '#ff1100', 22, 4, 1, 0);
        }
        if (G.ghosts) { G.ghosts.forEach(g => { g.t++; g.g.anim++; if (g.update) g.update(g); }); G.ghosts = G.ghosts.filter(g => g.t < g.life); }
        if (G.assist && ++G.assist.t > G.assist.life) G.assist = null;
        if (G.assist) { const a = G.assist; a.rig.tick(); a.rig.updateChain(a.x, a.y, a.facing); }
        // The Riders answer once per phase when the player is about to fall.
        const P = b.P;
        if (!b.dead && !b.transition && !b.intro && P.state !== 'dead' && P.hp < P.maxHp * .3 && !b.asked[b.phase]) {
            b.asked[b.phase] = 1; const id = ['ysolde', 'mirae', 'rook', 'sable'].concat('zero').filter(k => k !== P.id)[b.phase % 4], rl = FINAL_RIDERS[id], r = new Rig(CHARS[id].style);
            r.owner = { element: 0, charge: 0, cannonAmmo: 0 }; r.play('idle', 0); const f = b.x > P.x ? 1 : -1;
            G.assist = { rig: r, id, x: P.x - f * 50, y: P.y, facing: f, t: 0, life: 170 }; G.say(rl[0], rl[1], 150); Sound.sfx('trumpet', { v: .6 }); VFX.ring(P.x, P.y - 40, 220, CHARS[id].style.col.glow, 26, 12);
            if (id === 'ysolde') G.fields.push({ kind: 'bastion', x: P.x, y: P.y - 30, r: 200, t: 0, life: 300, owner: P, col: '#ffd86b' });
            else if (id === 'mirae') P.heal(P.maxHp * .5);
            else if (id === 'rook') { G.projs = G.projs.filter(p => p.friendly); G.warns = []; G.flash = .3; P.heal(P.maxHp * .25); Sound.sfx('slam'); }
            else if (id === 'sable') { P.heal(P.maxHp * .3); for (let i = 0; i < 8; i++) G.delay(i * 7 + 20, () => { if (!b.dead && !b.untargetable) { Combat.hit(P, b, { dmg: 3, hit: 'hit_l', ult: true, col: '#c084fc' }); } }); }
            else { P.heal(P.maxHp * .35); P.ult = 100; }
        }
    };

    /* The Beast keeps to the player's side of the arena, so the fight stays framed. */
    E.beforeMove = function* (b) { if (b.form !== 'wrath' && (b.enraged || Math.abs(b.x - b.P.x) > 560)) yield* M.home(b, 24); };

    /* ---- Forms ---- */
    const wings = (c, b) => {
        const R = b.radius, flap = Math.sin(b.t2 * .9) * .1, burn = b.phase >= 1;
        c.save(); c.translate(b.x, b.y);
        for (const d of [-1, 1]) for (let w = 0; w < 3; w++) {
            const base = (-1.05 + w * .8) + flap * (w + 1) * d * d;
            for (let f = 0; f < 12; f++) {
                const u = f / 11, ang = base + u * .62, L2 = (R * 1.5 + (1 - Math.abs(u - .5) * 2) * R * 1.05) * (1 + Math.sin(b.t2 + f) * .03);
                c.save(); c.scale(d, 1); c.rotate(ang);
                c.fillStyle = b.flash > 0 ? '#fff' : U.mix('#1e1014', burn ? '#7a2410' : '#6a5a4a', u * .75 + w * .1); c.beginPath(); c.moveTo(R * .4, -9); c.quadraticCurveTo(L2 * .6, -24, L2, 0); c.quadraticCurveTo(L2 * .6, 16, R * .4, 9); c.fill();
                c.strokeStyle = burn ? '#ff5a10' : '#c9a050'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(R * .55, 0); c.lineTo(L2 - 6, 0); c.stroke();
                c.restore();
                if (burn && Settings.quality && G.time % 9 === (f + w) % 9) { const a = d > 0 ? ang : Math.PI - ang; VFX.add(b.x + Math.cos(a) * L2, b.y + Math.sin(a) * L2, U.rand(-.5, .5), -U.rand(.6, 2), '#ff7a18', 30, 4, 1, 0); }
            }
        }
        // Wheels within wheels, as on the Throne, with the eyes burned out.
        for (let k = 0; k < 2; k++) {
            const r = R * (1.28 + k * .34), n = 14 + k * 6, sp = (k ? -.12 : .16) * b.t2;
            c.strokeStyle = U.rgba(burn ? '#ff5a10' : '#ffd9a0', .7); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
            for (let i = 0; i < n; i++) { const a = i / n * TAU + sp, x = Math.cos(a) * r, y = Math.sin(a) * r; c.fillStyle = '#120608'; c.beginPath(); c.ellipse(x, y, 8, 4, a, 0, TAU); c.fill(); Paint.disc(c, x, y, 2, burn ? '#ff3a10' : '#ffd9a0'); }
        }
        // Three broken chains: the marks of the seals it wants back.
        [['#ff2a00', -.5], ['#00ff55', 0], ['#0088ff', .5]].forEach(([col, o]) => { c.strokeStyle = '#3a3440'; c.lineWidth = 3; c.setLineDash([7, 4]); const ex = o * 170 + Math.sin(b.t2 + o * 3) * 14, ey = R * 1.7; c.beginPath(); c.moveTo(o * 60, R * .5); c.quadraticCurveTo(o * 120, R * 1.2, ex, ey); c.stroke(); c.setLineDash([]); Paint.disc(c, ex, ey, 7, col); Paint.glow(c, ex, ey, 20, col); });
        c.restore();
    };
    const voidCrown = (c, b) => {
        c.save(); c.translate(b.x, b.y); const R = b.radius;
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + Math.sin(b.t2 * .3) * .1, x = Math.cos(a) * R * .96, y = Math.sin(a) * R * .96; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); Paint.poly(c, [-11, 4, 0, -46 - (i % 2) * 24, 11, 4], '#1a0002'); c.restore(); }
        for (const ten of b.tent) { const a = ten.base + Math.sin(ten.ph) * .5, len = ten.len + Math.sin(ten.ph * 2) * 50, x = Math.cos(a) * len, y = Math.sin(a) * len; Paint.disc(c, x, y, 8, '#220000'); Paint.disc(c, x + Math.cos(a) * 2, y + Math.sin(a) * 2, 3.6, '#ffffff'); Paint.disc(c, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 1.6, '#000'); }
        c.restore();
    };
    E.draw = (c, b) => {
        if (b.form === 'wrath') {
            if (b.deathK) { c.save(); c.translate(b.x, b.y - 44); c.globalCompositeOperation = 'lighter'; c.rotate(G.time * .012); const k = b.deathK; for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.fillStyle = `rgba(255,255,255,${Math.min(1, k * 1.5)})`; c.fillRect(0, -3, 1500 * k, 6); } c.restore(); }
            b.rig.flash = b.flash > 0 ? 2 : 0; b.rig.draw(c, b.x, b.y, b.facing, b.deathK ? Math.max(0, 1 - b.deathK * 1.3) : 1);
            if (b.wrathShield > 0) { c.strokeStyle = '#ff1100'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 6; i++) { const a = TAU / 6 * i + G.time * .06; c.lineTo(b.x + Math.cos(a) * 60, b.y - 44 + Math.sin(a) * 60); } c.closePath(); c.stroke(); c.fillStyle = 'rgba(255,17,0,.18)'; c.fill(); }
            return;
        }
        if (!b.enraged && !b.deathK) wings(c, b);
        baseDraw(c, b);
        if (b.enraged && !b.deathK) voidCrown(c, b);
    };

    /* ---- Phase I additions: the wheel turns ---- */
    M.wheel = function* (b) {
        yield* M.home(b, 30); G.bigText = { text: 'THE WHEELS TURN', col: '#ffd9a0', t: 60 }; Sound.sfx('toll');
        for (let n = 0; n < 5; n++) { for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + n * .19 + b.t2 * .2; Combat.eshoot(b, 'orb', b.x + Math.cos(a) * 120, b.y + Math.sin(a) * 120, a, 3.6 + n * .5, b.D(12), { col: '#ffd9a0', r: 7, life: 240, ghost: true }); } yield 26; }
    };
    /* The lunge lands next to the player and lingers, which is melee's opening over the lava. */
    M.lunge = function* (b) {
        const dx = b.P.x - b.x, dy = b.P.y - 40 - b.y, dist = Math.hypot(dx, dy) || 1, L2 = Math.min(dist - 70, 900), a = Math.atan2(dy, dx), ex = b.x + Math.cos(a) * L2, ey = Math.min(b.y + Math.sin(a) * L2, b.A.y - 110);
        Combat.warn({ shape: 'circle', x: ex, y: ey, r: 130, t: 44, dmg: b.D(26), src: b }); yield 40;
        yield* b.moveTo(ex, ey, 8, U.easeIn); VFX.beam(ex, ey, a + Math.PI, L2, 80, b.c2, 18); G.addShake(12); Sound.sfx('slam');
        for (let i = 0; i < 12; i++) Combat.eshoot(b, 'orb', b.x, b.y, TAU / 12 * i, 5, b.D(12), { col: '#fff', r: 7, life: 90, ghost: true });
        yield 90;
    };
    /* ---- Phase II: echoes of the five seals ---- */
    M.eTrumpet = function* (b) {
        seal('THE FIRST SEAL', 'ATLAS-9'); ghost('atlas', b.A.x0 + 180, b.A.y, 240, { armUp: 1, cannon: 1 });
        for (let n = 0; n < 3; n++) {
            const y = U.chance(.5) ? b.A.y - 46 : b.A.y - 180;
            Combat.warn({ shape: 'rect', x: b.A.x0, y: y - 24, w: b.A.x1 - b.A.x0, h: 48, t: 42, dmg: b.D(20), src: b, onFire: () => { VFX.beam(b.A.x0 + 150, y, 0, 2400, 48, '#ffdd33', 18); Sound.sfx('laser'); G.addShake(6); } }); yield 54;
        }
    };
    M.eRoots = function* (b) {
        seal('THE SECOND SEAL', 'SYLVARIS'); ghost('sylvaris', b.A.x1 - 130, b.A.y + 120, 230, { eye: 1 });
        for (let n = 0; n < 2; n++) {
            const safe = U.randi(0, 5), w = (b.A.x1 - b.A.x0) / 6;
            for (let i = 0; i < 6; i++) if (i !== safe) Combat.warn({ shape: 'rect', x: b.A.x0 + i * w, y: b.A.y - 460, w: w - 6, h: 490, t: 62, dmg: b.D(24), src: b, kby: -8, col: '#c8ff5a', onFire: wz => G.pillar(wz.x + wz.w / 2, b.A.y + 30, 480, '#5a7a2c', '#c8ff5a', wz.w) });
            yield 90;
        }
    };
    M.eSerpent = function* (b) {
        seal('THE THIRD SEAL', 'QARETH');
        for (let n = 0; n < 3; n++) {
            const left = n % 2 === 0, y = U.clamp(b.P.y - 40, b.A.y - 420, b.A.y - 40), sx = left ? b.A.x0 - 200 : b.A.x1 + 200, ex = left ? b.A.x1 + 200 : b.A.x0 - 200;
            Combat.warn({ shape: 'rect', x: b.A.x0, y: y - 66, w: b.A.x1 - b.A.x0, h: 132, t: 40, col: '#ffcc55' }); yield 40;
            const g = ghost('qareth', sx, y, 60, { facing: left ? 1 : -1, ang: left ? 0 : Math.PI }); g.seg.forEach(s => { s.x = sx; s.y = y; }); let hit = false;
            for (let i = 0; i <= 40; i++) { g.x = U.lerp(sx, ex, i / 40); g.y = y + Math.sin(i * .3) * 24; g.def.tick(g); if (!hit && Math.abs(g.x - b.P.x) < 90 && Math.abs(g.y - (b.P.y - 30)) < 86) { hit = true; b.P.hurt(b.D(24), { x: g.x, kb: 12, kby: -8, unblockable: true }); } yield 1; }
        }
    };
    M.eIce = function* (b) {
        seal('THE FOURTH SEAL', 'NADIR'); const g = ghost('nadir', (b.A.x0 + b.A.x1) / 2, b.A.y, 200, { hx: (b.A.x0 + b.A.x1) / 2, hy: b.A.y - 520, jaw: 1 }); g.def.draw;
        for (let i = 0; i < 20; i++) { b.fallRock(i % 4 === 0 ? b.P.x : U.rand(b.A.x0 + 40, b.A.x1 - 40), 46, b.D(16), 'ice', 13); yield 7; }
        yield 34;
    };
    M.eCherub = function* (b) {
        seal('THE FIFTH SEAL', 'VULKARIS'); ghost('vulkaris', b.A.x0 + 150, b.A.y, 210, { arm: 1 });
        const dir = b.P.x < (b.A.x0 + b.A.x1) / 2 ? 1 : -1; let x = dir > 0 ? b.A.x0 + 60 : b.A.x1 - 60;
        while (x > b.A.x0 && x < b.A.x1) { const px = x; Combat.warn({ shape: 'rect', x: px - 62, y: b.A.y - 620, w: 124, h: 650, t: 34, dmg: b.D(24), src: b, kby: -12, onFire: () => { G.pillar(px, b.A.y + 30, 650, '#ff7a18', '#fff0a0', 106, true); Sound.at('lava_burst', px); } }); x += dir * 190; yield 16; }
        yield 40;
    };
    /* ---- Phase III: the Scales, the Trumpets, the Eyes ---- */
    M.scales = function* (b) {
        G.bigText = { text: 'THE SCALES', sub: 'WEIGHED AND FOUND WANTING', col: '#ffd9a0', t: 90 }; Sound.sfx('toll'); const cx = (b.A.x0 + b.A.x1) / 2;
        for (let n = 0; n < 4; n++) {
            const left = U.chance(.5), T2 = 66 - n * 8, x0 = left ? b.A.x0 : cx, w = (b.A.x1 - b.A.x0) / 2;
            VFX.effect(T2 + 10, (c, k) => {
                const tilt = (left ? -1 : 1) * .16 * Math.min(1, k * 2.2), ty = b.A.y - 560; c.save(); c.translate(cx, ty); c.strokeStyle = '#ffd9a0'; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -46); c.lineTo(0, 44); c.stroke(); c.rotate(tilt); c.lineWidth = 10; c.beginPath(); c.moveTo(-420, 0); c.lineTo(420, 0); c.stroke();
                [-1, 1].forEach(d => { c.lineWidth = 2; c.beginPath(); c.moveTo(d * 420, 0); c.lineTo(d * 350, 120); c.moveTo(d * 420, 0); c.lineTo(d * 490, 120); c.stroke(); c.fillStyle = d === (left ? -1 : 1) ? '#ff2200' : '#ffd9a0'; c.beginPath(); c.ellipse(d * 420, 122, 74, 15, 0, 0, TAU); c.fill(); }); c.restore();
            });
            Sound.sfx('warn'); Combat.warn({ shape: 'rect', x: x0, y: b.A.y - 720, w, h: 750, t: T2, dmg: b.D(34), src: b, kby: -12, unblockable: true, onFire: wz => { VFX.beam(wz.x + wz.w / 2, wz.y, Math.PI / 2, 760, wz.w, '#ff2200', 20); Sound.sfx('bigboom', { v: .6 }); G.addShake(16); } });
            yield T2 + 24;
        }
    };
    M.trumpets = function* (b) {
        G.bigText = { text: 'THE SEVEN TRUMPETS', col: '#ff5533', t: 80 }; const blow = i => { Sound.sfx('trumpet'); G.addShake(6); G.toast((i + 1) + ' / 7', '#ffd9a0'); };
        blow(0); for (let i = 0; i < 12; i++) { b.fallRock(U.rand(b.A.x0 + 40, b.A.x1 - 40), 34, b.D(11), 'ice', 11); yield 4; } yield 26;
        blow(1); const mx = b.P.x; Combat.warn({ shape: 'circle', x: mx, y: b.A.y - 90, r: 200, t: 44, dmg: b.D(26), src: b, kby: -10, onFire: () => { VFX.burst(mx, b.A.y - 60, '#ff7a18', 36, 12, 34, 10, 1); Sound.sfx('explode'); } }); yield 56;
        blow(2); for (let i = 0; i < 6; i++) { Combat.eshoot(b, 'orb', b.x, b.y, U.rand(0, TAU), 4.6, b.D(11), { col: '#c0ff90', r: 9, life: 170, ghost: true, homing: .03 }); yield 7; } yield 20;
        blow(3); G.darken = .82; yield 16; for (let i = 0; i < 10; i++) { const x = U.rand(b.A.x0, b.A.x1); Combat.warn({ shape: 'rect', x: x - 26, y: b.A.y - 760, w: 52, h: 790, t: 38, dmg: b.D(16), src: b, col: '#ffffff', onFire: w => VFX.beam(w.x + 26, w.y, Math.PI / 2, 790, 52, '#ffffff', 14) }); yield 5; } yield 40; G.darken = 0;
        blow(4); const left = U.chance(.5); for (let i = 0; i < 26; i++) { const y = b.A.y - U.rand(10, 420); Combat.eshoot(b, 'orb', left ? b.A.x0 : b.A.x1, y, left ? U.rand(-.1, .1) : Math.PI + U.rand(-.1, .1), U.rand(8, 11), b.D(10), { col: '#d8b040', r: 6, life: 220, ghost: true }); yield 3; } yield 16;
        blow(5); for (let n = 0; n < 4; n++) { const y = b.A.y - 30 - n * 80, h = 60, d = n % 2 ? 1 : -1; Combat.warn({ shape: 'rect', x: b.A.x0, y: y - h / 2, w: b.A.x1 - b.A.x0, h, t: 30 + n * 16, dmg: b.D(16), src: b, onFire: () => VFX.beam(d > 0 ? b.A.x0 : b.A.x1, y, d > 0 ? 0 : Math.PI, 2400, h, '#ff5533', 12) }); } yield 90;
        blow(6); Combat.warn({ shape: 'circle', x: b.x, y: b.y, r: 300, t: 40, col: '#ffffff' }); yield 40; for (let i = 0; i < 40; i++) Combat.eshoot(b, 'orb', b.x, b.y, TAU / 40 * i, 7, b.D(14), { col: '#ffffff', r: 9, life: 150, ghost: true }); G.flash = .5; Sound.sfx('bigboom'); yield 30;
    };
    M.eyes = function* (b) {
        G.bigText = { text: 'THE EYES OPEN', col: '#ff2200', t: 60 };
        for (let i = 0; i < 9; i++) {
            const left = i % 2 === 0, ox = left ? b.A.x0 + U.rand(0, 120) : b.A.x1 - U.rand(0, 120), oy = b.A.y - U.rand(320, 640), ang = Math.atan2(b.P.y - 30 - oy, b.P.x - ox);
            VFX.effect(34, (c, k) => { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ox, oy, 46, 22 * Math.sin(k * Math.PI), 0, 0, TAU); c.fill(); Paint.disc(c, ox, oy, 15 * Math.sin(k * Math.PI), '#ff0000'); c.strokeStyle = 'rgba(255,0,0,.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.cos(ang) * 1800, oy + Math.sin(ang) * 1800); c.stroke(); });
            G.delay(30, () => { VFX.beam(ox, oy, ang, 1800, 44, '#ff0000', 14); Sound.sfx('laser', { v: .4 }); if (b.beamHits(ox, oy, ang, 1800, 40)) b.P.hurt(b.D(18), { x: ox, unblockable: true }); }); yield 15;
        }
        yield 30;
    };
    M.book = function* (b) {
        yield* M.home(b, 24); G.bigText = { text: 'THE BOOK IS OPENED', col: '#ffd9a0', t: 60 }; Sound.sfx('toll');
        for (let i = 0; i < 80; i++) { const a = i * .42 + b.t2, a2 = -i * .42; Combat.eshoot(b, 'knife', b.x, b.y, a, 5.5, b.D(10), { r: 7, life: 170, ghost: true }); Combat.eshoot(b, 'knife', b.x, b.y, a2, 5.5, b.D(10), { r: 7, life: 170, ghost: true }); yield 3; }
    };
    /* ---- Phase IV: the Wrath of Zero, a fast duel ---- */
    const aimAt = b => { b.facing = b.P.x >= b.x ? 1 : -1; b.aimArm = Math.atan2(b.P.y - 40 - (b.y - 46), b.P.x - b.x); };
    M.wDash = function* (b) {
        for (let n = 0; n < 3; n++) {
            b.facing = b.P.x >= b.x ? 1 : -1; const dir = b.facing, tx = U.clamp(b.P.x + dir * 200, b.A.x0 + 60, b.A.x1 - 60);
            Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 74, w: tx - b.x, h: 74, t: 22 - n * 3, col: '#ff1100' }); yield 22 - n * 3;
            Sound.sfx('dash'); G.addShake(5); let hit = false; const sx = b.x, N = 9;
            for (let i = 1; i <= N; i++) { b.x = U.lerp(sx, tx, i / N); b.vx = dir * 26; VFX.add(b.x, b.y - 40, 0, 0, '#ff1100', 16, 18, 1, 0); if (!hit && U.overlap(b.box(), b.P.hurtBox)) { hit = true; b.P.hurt(b.D(26), { x: b.x, kb: 11, kby: -7 }); } yield 1; }
            yield 6;
        }
        b.aimArm = undefined; yield 18; // punish window
    };
    M.wCannon = function* (b) {
        for (let i = 0; i < 22; i++) { aimAt(b); const a = b.aimArm + U.rand(-.05, .05), s = 5 + i * .35; Combat.eshoot(b, 'bolt', b.x + Math.cos(a) * 34, b.y - 46 + Math.sin(a) * 34, a, 12 + i * .25, b.D(9 + i * .5), { col: i > 14 ? '#ff0000' : '#ff5500', r: s, len: 20 + i, life: 80 }); Sound.sfx('cannon', { v: .4, p: 1 + i * .02 }); b.vx = -b.facing * (1 + i * .1); G.addShake(1 + i * .1); yield 5; }
        b.aimArm = undefined; yield 22;
    };
    M.wSlam = function* (b) {
        const sy = b.y, tx = U.clamp(b.P.x, b.A.x0 + 70, b.A.x1 - 70), sx = b.x; b.facing = tx >= sx ? 1 : -1;
        Combat.warn({ shape: 'circle', x: tx, y: b.A.y - 40, r: 150, t: 34, dmg: b.D(28), src: b, kby: -10 });
        for (let i = 1; i <= 34; i++) { const k = i / 34; b.x = U.lerp(sx, tx, U.smooth(k)); b.y = sy - Math.sin(k * Math.PI) * 300; yield 1; }
        b.y = b.A.y; Sound.sfx('slam'); G.addShake(14); VFX.groundWave(tx, b.A.y, 220, '#ff1100'); [-1, 1].forEach(d => Combat.shoot(b, 'wave', tx, b.A.y - 22, d * 10, 0, { absDmg: b.D(16), life: 50, r: 22, pierce: 9, col: '#ff1100' })); yield 24;
    };
    M.wAegis = function* (b) {
        b.wrathShield = 170; b.dmgTakenMult = .15; Sound.sfx('parry'); G.toast('AEGIS', '#ff5533'); yield 40;
        for (let n = 0; n < 3; n++) { aimAt(b); for (let i = -2; i <= 2; i++) Combat.eshoot(b, 'bolt', b.x, b.y - 46, b.aimArm + i * .16, 11, b.D(11), { col: '#ff2200', r: 6, len: 20, life: 90 }); Sound.sfx('gun'); yield 36; }
        yield 22; b.dmgTakenMult = 1; b.aimArm = undefined; VFX.ring(b.x, b.y - 44, 180, '#ff1100'); yield 16;
    };
    M.wTrinity = function* (b) {
        aimAt(b); const base = b.aimArm, offs = [-.28, 0, .28]; G.bigText = { text: 'TRINITY OBLITERATION', col: '#ff0000', t: 60 }; Sound.sfx('charge');
        offs.forEach(o => { const a = base + o; for (let d = 100; d < 1500; d += 170) Combat.warn({ shape: 'circle', x: b.x + Math.cos(a) * d, y: b.y - 46 + Math.sin(a) * d, r: 30, t: 52, col: '#ff1100' }); });
        yield 52; G.addShake(16); G.flash = .3; Sound.sfx('laser'); Sound.sfx('explode');
        offs.forEach(o => { const a = base + o; VFX.beam(b.x, b.y - 46, a, 1700, 74, '#ff0000', 24); if (b.beamHits(b.x, b.y - 46, a, 1700, 58)) b.P.hurt(b.D(34), { x: b.x, unblockable: true }); });
        b.aimArm = undefined; yield 42;
    };
    M.wClones = function* (b) {
        Sound.sfx('blink'); const pts = [-1, 1].map(d => U.clamp(b.P.x + d * 320, b.A.x0 + 40, b.A.x1 - 40)).concat(U.clamp(b.P.x + 150, b.A.x0 + 40, b.A.x1 - 40));
        pts.forEach((x, i) => { const f = x < b.P.x ? 1 : -1; VFX.effect(40, (c, k) => { c.globalAlpha = .75; b.rig.draw(c, x, b.A.y, f, .7); }); G.delay(26 + i * 4, () => { const a = Math.atan2(b.P.y - 40 - (b.A.y - 46), b.P.x - x); Combat.eshoot(b, 'bolt', x, b.A.y - 46, a, 15, b.D(16), { col: '#ff2200', r: 7, len: 30, life: 80 }); Sound.sfx('gun'); }); });
        yield 56;
    };

    /* ---- Phases ---- */
    const [P1, P2, P3] = E.phases, enter3 = P3.enter, enter2 = P2.enter;
    P1.moves = P1.moves.concat('wheel'); P1.rest = 40;
    P2.moves = ['eTrumpet', 'cone', 'gaze', 'lunge', 'eRoots', 'gapRing', 'hellfire', 'eSerpent', 'lunge', 'fracture', 'eIce', 'splitters', 'cleave', 'eCherub', 'matrix', 'eruption'];
    P2.enter = function* (b) { G.level.bgMode = 'lake'; b.name = 'THE LAKE OF FIRE'; yield* enter2(b); Music.setState('critical'); b.name = 'THE ENDBRINGER'; };
    // The bag is not reshuffled here: echoes come back in the order of the game.
    P3.moves = ['scales', 'v16', 'trumpets', 'v17', 'eyes', 'gaze', 'book', 'v18', 'scales', 'hellfire', 'v19', 'eyes', 'cleave', 'trumpets'];
    P3.enter = function* (b) { yield* enter3(b); G.level.bgMode = 'void'; b.form = 'void'; };
    E.phases.push({
        at: .015, moves: ['wDash', 'wCannon', 'wSlam', 'wAegis', 'wDash', 'wTrinity', 'wClones', 'wSlam'], rest: 12, say: ['THE WRATH OF ZERO', 'YOU LEFT ME DOWN HERE WITH ALL OF IT.'],
        enter: function* (b) {
            G.lockInput = true; G.letterbox = 1; G.projs = G.projs.filter(p => p.friendly); G.warns = []; Music.stop(.3); G.cineCam = { x: b.x, y: b.y, zoom: 1.5 }; Sound.sfx('roar', { p: .6 });
            for (let i = 0; i < 110; i++) { b.aura = 2; if (i % 3 === 0) G.addShake(4 + i * .08); if (i % 6 === 0) VFX.lightning(b.x + U.rand(-200, 200), b.y + U.rand(-200, 200), b.x, b.y, '#ffffff'); G.darken = Math.min(.8, i / 80); yield 1; }
            Sound.sfx('bigboom'); G.flash = 1.4; G.darken = 0; G.level.bgMode = 'white'; G.level.bgVoid = true;
            G.level.dyn.filter(d => d.tag === 'coreplate').forEach(d => { d.tint = '#1a1416'; });
            b.form = 'wrath'; b.name = 'THE WRATH OF ZERO'; b.enraged = false; b.rig = new Rig(WRATH_STYLE); b.rig.owner = { cannonAmmo: 1 }; b.rig.play('kneel', 0); b.w = 40; b.h = 78; b.dmgTakenMult = 1;
            b.x = (b.A.x0 + b.A.x1) / 2 + 300; b.y = b.A.y; b.facing = -1; G.player.x = (b.A.x0 + b.A.x1) / 2 - 300; G.player.y = b.A.y; G.player.vy = 0; G.player.facing = 1;
            G.cineCam = { x: (G.player.x + b.x) / 2, y: b.A.y - 150, zoom: 1.1 }; yield 70; Music.play('wrath', 'boss');
            G.say('ZERO', 'So this is what was left of me.', 120); yield 124;
            b.rig.play('idle', 34); yield 44; G.say('THE WRATH OF ZERO', 'I REMEMBER EVERY HOUR ON THAT ALTAR. YOU GOT TO FORGET.', 150); yield 156;
            G.say('ZERO', 'Then let me carry it.', 110); yield 112;
            b.maxHp = Math.round(5600 * Game.diff.bossHp); b.hp = b.maxHp; b.hbar = 1;
            G.cineCam = null; G.letterbox = 0; G.lockInput = false; G.player.inv = 60; G.addShake(8);
        }
    });

    /* ---- LAST LIGHT: the finishing beam struggle ---- */
    E.death = function* (b) {
        const P = G.player, A = b.A, cx = (A.x0 + A.x1) / 2; G.lockInput = true; G.letterbox = 1; G.warns = []; G.projs = []; G.assist = null;
        if (b.form !== 'wrath') { b.form = 'wrath'; b.rig = new Rig(WRATH_STYLE); b.rig.owner = { cannonAmmo: 1 }; G.level.bgMode = 'white'; }
        P.state = 'move'; P.vx = 0; P.x = cx - 340; P.y = A.y; P.vy = 0; P.facing = 1; b.x = cx + 340; b.y = A.y; b.facing = -1; b.aimArm = 0; b.vx = 0;
        G.cineCam = { x: cx, y: A.y - 150, zoom: 1.05 }; Music.play('wrath', 'critical'); yield 40;
        G.say('THE WRATH OF ZERO', 'THEN JUDGE ME. I DARE YOU.', 110); yield 116;
        const C = G.clash = { k: .5, t: 0, n: 0, shake: 0 }, riders = [['rook', .6, 'War stands with you!', '#ffaa33'], ['sable', .72, 'Death stands with you!', '#c084fc'], ['mirae', .84, 'Plague has burned out. I stand with you!', '#7fffd4'], ['ysolde', .93, 'Doors stay open!', '#ffd86b']].filter(r => r[0] !== P.id);
        const shards = ['#ff2a00', '#00ff55', '#0088ff'], allies = [];
        Sound.sfx('laser'); Sound.sfx('bigboom');
        while (C.k < 1) {
            C.t++; const pressed = Input.pressed('attack') || Input.pressed('jump');
            if (pressed) { C.k += .024; C.n++; Sound.sfx('gun', { v: .5, gap: .02 }); G.addShake(3); }
            C.k -= C.k < .35 ? .0006 : .0024; if (C.t > 420) C.k += .0036; C.k = U.clamp(C.k, .12, 1);
            const meet = U.lerp(P.x + 40, b.x - 40, C.k), y = A.y - 46, shardN = Math.floor(C.k * 4);
            VFX.effect(2, c => {
                c.globalCompositeOperation = 'lighter'; const w = 30 + Math.sin(C.t * .5) * 8 + C.k * 40;
                allies.forEach((a, i) => { c.fillStyle = a.col; c.globalAlpha = .55; c.fillRect(a.x, y - 70 + i * 22, meet - a.x, 10); });
                shards.forEach((col, i) => { if (i < shardN) { c.fillStyle = col; c.globalAlpha = .65; c.fillRect(P.x + 30, y - w * (.9 - i * .25) - 6, meet - P.x - 30, 12); } });
                c.globalAlpha = .85; c.fillStyle = '#00ffff'; c.fillRect(P.x + 30, y - w / 2, meet - P.x - 30, w); c.fillStyle = '#ffffff'; c.fillRect(P.x + 30, y - w / 5, meet - P.x - 30, w / 2.5);
                c.fillStyle = '#ff1100'; c.fillRect(meet, y - w * .62, b.x - 30 - meet, w * 1.24); c.fillStyle = '#ffe0d0'; c.fillRect(meet, y - w / 6, b.x - 30 - meet, w / 3);
                c.globalAlpha = 1; const s = 110 + Math.sin(C.t * .7) * 26; c.drawImage(Glow.get('#ffffff'), meet - s, y - s, s * 2, s * 2);
            });
            if (C.t % 2 === 0) { const a = U.rand(0, TAU); VFX.add(meet, y, Math.cos(a) * U.rand(4, 13), Math.sin(a) * U.rand(4, 13), U.chance(.5) ? '#ff5533' : '#00ffff', 22, 3, 2, .08); }
            for (const r of riders) if (!r.done && C.k >= r[1]) {
                r.done = true; const st = CHARS[r[0]].style, rg = new Rig(st); rg.owner = { element: 0, charge: 0, cannonAmmo: 0 }; rg.play('idle', 0); const x = P.x - 90 - allies.length * 58;
                allies.push({ rig: rg, x, col: r[3], id: r[0] }); G.say(FINAL_RIDERS[r[0]][0], r[2], 110); Sound.sfx('trumpet'); VFX.ring(x, A.y - 40, 130, r[3], 22, 10); G.addShake(8);
            }
            allies.forEach(a => { a.rig.tick(); a.rig.updateChain(a.x, A.y, 1); }); G.clashAllies = allies;
            P.firing = 14; P.aimLast = 0; G.addShake(2 + C.k * 4);
            yield 1;
        }
        G.clash = null; Sound.sfx('bigboom'); Sound.sfx('trumpet'); G.flash = 1; G.addShake(24); Music.stop(.6);
        VFX.beam(P.x + 30, A.y - 46, 0, 1500, 240, '#ffffff', 40); G.cineCam = { x: b.x, y: A.y - 60, zoom: 1.6 }; yield 44;
        for (let i = 0; i < 170; i++) { b.deathK = i / 170; if (i % 4 === 0) G.addShake(3 + i * .05); if (i % 24 === 0) Sound.sfx('explode', { v: .6 }); yield 1; }
        Sound.sfx('bigboom'); G.flash = 1.4; b.gone = true; G.clashAllies = null; G.addShake(30); yield 60;
        G.cineCam = null; G.letterbox = 0;
        Game.onFinalBossDefeated();
    };
})();

/* Backgrounds that change with the phase of the last battle. */
const FinalBG = {
    draw(c, cam, t, L) {
        const m = L.bgMode, P = G.player;
        if (m === 'seraph' || m === 'lake') {
            const lake = m === 'lake';
            c.save(); c.translate(VW / 2, 300); c.globalCompositeOperation = 'lighter';
            c.drawImage(Glow.get(lake ? '#ff3a10' : '#c98a2c'), -520, -520, 1040, 1040);
            for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + t * .0012, w = i % 2 ? .012 : .028; c.fillStyle = lake ? 'rgba(255,90,16,.07)' : 'rgba(255,214,140,.07)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - w) * 1100, Math.sin(a - w) * 1100); c.lineTo(Math.cos(a + w) * 1100, Math.sin(a + w) * 1100); c.fill(); }
            [[190, .0016], [290, -.0012], [400, .0009]].forEach(([r, sp], k) => { c.strokeStyle = lake ? 'rgba(255,90,16,.3)' : 'rgba(255,220,160,.28)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); for (let i = 0; i < 12 + k * 6; i++) { const a = i / (12 + k * 6) * TAU + t * sp; c.fillStyle = c.strokeStyle; c.beginPath(); c.ellipse(Math.cos(a) * r, Math.sin(a) * r, 8, 3, a, 0, TAU); c.fill(); } });
            c.restore();
        } else if (m === 'void') {
            c.fillStyle = '#0a0002'; c.fillRect(0, 0, VW, VH);
            // The whole sky is one eye, and it is watching you.
            const blink = Math.min(1, Math.abs(((t % 560) / 560) * 2 - 1) * 9), ox = VW / 2, oy = 290, h = 240 * blink;
            const g = c.createRadialGradient(ox, oy, 40, ox, oy, 620); g.addColorStop(0, '#6a0008'); g.addColorStop(1, '#0a0002'); c.fillStyle = g;
            c.beginPath(); c.moveTo(ox - 660, oy); c.quadraticCurveTo(ox, oy - h * 1.4, ox + 660, oy); c.quadraticCurveTo(ox, oy + h * 1.4, ox - 660, oy); c.fill();
            c.save(); c.beginPath(); c.moveTo(ox - 660, oy); c.quadraticCurveTo(ox, oy - h * 1.4, ox + 660, oy); c.quadraticCurveTo(ox, oy + h * 1.4, ox - 660, oy); c.clip();
            const dx = U.clamp((P.x - cam.x) * cam.zoom - ox, -500, 500) * .18, dy = U.clamp((P.y - cam.y) * cam.zoom - oy, -300, 300) * .12;
            Paint.disc(c, ox + dx, oy + dy, 190, '#a00010'); c.strokeStyle = '#ff2200'; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + t * .002; c.beginPath(); c.moveTo(ox + dx + Math.cos(a) * 60, oy + dy + Math.sin(a) * 60); c.lineTo(ox + dx + Math.cos(a) * 186, oy + dy + Math.sin(a) * 186); c.stroke(); }
            Paint.disc(c, ox + dx, oy + dy, 70, '#000'); c.restore();
            c.strokeStyle = 'rgba(255,0,0,.5)'; c.lineWidth = 1.6; for (let i = 0; i < 40; i++) { const u = ((t * 1.3 + i * 73) % 800) / 800, x = (i * 151) % VW, y = u * 800 - 40; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y - 36); c.stroke(); }
        } else if (m === 'white') {
            const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#fff8ea'); g.addColorStop(.7, '#f0dcc0'); g.addColorStop(1, '#c8a880'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
            c.strokeStyle = 'rgba(150,20,10,.35)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(VW / 2, 300, 180 + i * 120, t * .001 * (i % 2 ? -1 : 1), t * .001 * (i % 2 ? -1 : 1) + 5.2); c.stroke(); }
            c.fillStyle = 'rgba(40,20,20,.6)'; for (let i = 0; i < 80; i++) { const x = ((i * 89 - t * (.5 + (i % 3) * .3)) % VW + VW) % VW, y = (i * 61 + t * .6) % VH; c.fillRect(x, y, 2.4, 2.4); }
        }
    },
    ghosts(c) {
        if (!G.ghosts) return;
        for (const g of G.ghosts) { c.save(); c.globalAlpha = .55 * Math.min(1, Math.min(g.t, g.life - g.t) / 20); g.g.def.draw(c, g.g); c.restore(); }
    }
};
