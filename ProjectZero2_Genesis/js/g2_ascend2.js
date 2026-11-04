'use strict';
/**
 * G2 ASCEND 2: the god's final form, second pass.
 *   - Its eye follows someone: the nearest of the party most of the time, now and then someone at random.
 *   - Named skills, announced under its health bar:
 *       Judgement Ray     a column of light called down on whoever the eye is on
 *       Dawn Scythe       a beam that sweeps one stretch of the floor, marked a beat ahead
 *       Echoes of the Days summons weaker echoes of the bosses of earlier days, each with a health bar
 *       Dawnline          one low or high beam across the arena, on the beat, never both at once
 *       Colonnade         columns of light in alternating gaps
 *   - The world behind it changes: a torn heaven with a great halo and the Throne's pieces rising.
 *   - The core, when it opens, shows Zero kneeling on the altar, not a symbol.
 *   - Melee fighters jump higher in this fight, just enough to reach the god's core.
 */
G2.beams = [];
G2.skillCap = null;
G2.castSkill = function (name, col = '#ffe8a0') { G2.skillCap = { name: tr(name), col, t: 0 }; Sound.sfx('charge', { v: .5 }); };

/* ------------------------------ WHO THE EYE IS ON ------------------------------ */
G2.pickTarget = function (b) {
    const L = [G.player, ...G2.team.alive()].filter(p => p && p.state !== 'dead');
    if (!L.length) return G.player;
    if (Math.random() < .35) return U.pick(L);
    return L.reduce((a, p) => (Math.abs(p.x - b.x) < Math.abs(a.x - b.x) ? p : a), L[0]);
};
G2.eyeTick = function (b) {
    if (!b.tgt || b.tgt.down || b.tgt.state === 'dead' || --b.tgtT <= 0) { b.tgt = G2.pickTarget(b); b.tgtT = 140 + Math.random() * 160; }
    const T = b.tgt || G.player; b.lookX = U.lerp(b.lookX === undefined ? T.x : b.lookX, T.x, .06); b.lookY = U.lerp(b.lookY === undefined ? T.y - 40 : b.lookY, T.y - 40, .06);
};

/* ------------------------------ BEAMS OF LIGHT ------------------------------ */
// { kind: 'ray', x, life } a column from the eye to the floor; { kind: 'sweep', x0, x1, start, dur } a beam whose foot moves.
G2.beamsTick = function () { for (const m of G2.beams) m.age = (m.age || 0) + 1; G2.beams = G2.beams.filter(m => m.age < m.life); };
G2.drawBeams = function (c, b) {
    const ex = b.x, ey = G2.cy(b), fy = b.A.y;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const m of G2.beams) {
        let fx, k; m.age = m.age || 0;
        if (m.kind === 'ray') { fx = m.x; k = 1 - m.age / m.life; }
        else { if (m.age < m.delay) continue; const u = U.clamp((m.age - m.delay) / m.dur, 0, 1); fx = U.lerp(m.x0, m.x1, u); k = m.age - m.delay > m.dur ? 1 - (m.age - m.delay - m.dur) / 12 : 1; if (k <= 0) continue; }
        const w = (m.w || 46) * (.6 + .4 * k), g = c.createLinearGradient(ex, ey, fx, fy); g.addColorStop(0, `rgba(255,255,255,${.9 * k})`); g.addColorStop(1, U.rgba(m.col || '#ffe8a0', .85 * k));
        c.fillStyle = g; c.beginPath(); c.moveTo(ex - 10, ey); c.lineTo(fx - w, fy); c.lineTo(fx + w, fy); c.lineTo(ex + 10, ey); c.fill();
        c.fillStyle = `rgba(255,255,255,${.8 * k})`; c.beginPath(); c.moveTo(ex - 3, ey); c.lineTo(fx - w * .3, fy); c.lineTo(fx + w * .3, fy); c.lineTo(ex + 3, ey); c.fill();
        c.globalAlpha = k; c.drawImage(Glow.get(m.col || '#ffe8a0'), fx - w * 3, fy - w * 2, w * 6, w * 3);
        if (G.time % 2 === 0) VFX.add(fx + U.rand(-w, w), fy - 4, U.rand(-2, 2), U.rand(-5, -1), '#fff4d0', 20, 4, 1, 0); c.globalAlpha = 1;
    }
    c.restore();
};

/* ------------------------------ SKILLS ------------------------------ */
G2.SK = {
    // a thin mark on the target, then a column of light from the eye
    ray(b, tele, tgt) {
        const A = b.A, T = tgt || b.tgt || G.player, x = U.clamp(T.x, A.x0 + 50, A.x1 - 50), w = 104; b.dilate = 1;
        Combat.warn({ shape: 'rect', x: x - w / 2, y: A.y - 900, w, h: 900, t: tele, dmg: b.D(18), src: b, col: '#fff4c0', onFire: () => { G2.beams.push({ kind: 'ray', x, life: 26, w: 56 }); G.addShake(9); VFX.ring(x, A.y - 10, 160, '#fff4d0', 16, 8); Sound.sfx('bigboom', { v: .5 }); } });
    },
    // a stretch of the floor is marked, then the beam's foot runs across it
    scythe(b, tele) {
        const A = b.A, P = b.tgt || G.player, span = 720, dir = Math.random() < .5 ? 1 : -1, c0 = U.clamp(P.x, A.x0 + span / 2, A.x1 - span / 2), x0 = c0 - dir * span / 2, x1 = c0 + dir * span / 2, n = 12, run = 30;
        Combat.warn({ shape: 'rect', x: Math.min(x0, x1), y: A.y - 120, w: span, h: 120, t: tele, dmg: 0, src: b, col: '#ffb070' });
        for (let i = 0; i < n; i++) { const xa = U.lerp(x0, x1, i / n), xb = U.lerp(x0, x1, (i + 1) / n); Combat.warn({ shape: 'rect', x: Math.min(xa, xb), y: A.y - 110, w: Math.abs(xb - xa), h: 110, t: tele + Math.round(i / n * run), dmg: b.D(14), src: b, col: 'rgba(0,0,0,0)' }); }
        G2.beams.push({ kind: 'sweep', x0, x1, delay: tele, dur: run, life: tele + run + 12, w: 40, col: '#ffb070' });
    },
    // one beam across the arena: low (jump it) or high (stay down)
    line(b, tele, high) {
        const A = b.A, P = G.player;
        Combat.warn({ shape: 'rect', x: A.x0, y: high ? A.y - 210 : A.y - 76, w: A.x1 - A.x0, h: high ? 100 : 76, t: tele + 10, dmg: b.D(15), src: b, col: high ? '#c8b0ff' : '#ffe8a0', onFire: () => { VFX.slash(b.x, high ? A.y - 160 : A.y - 40, 900, P.x > b.x ? 1 : -1, high ? '#e8dcff' : '#fff0c8'); G.addShake(8); } });
    },
    // eight columns, every other one; the next bar, the other set
    colonnade(b, tele, odd) {
        const A = b.A, w = (A.x1 - A.x0) / 8;
        for (let i = 0; i < 8; i++) if ((i % 2 === 1) === !!odd) Combat.warn({ shape: 'rect', x: A.x0 + i * w + 6, y: A.y - 700, w: w - 12, h: 700, t: tele, dmg: b.D(15), src: b, col: '#ffe8a0', onFire: () => { VFX.burst(A.x0 + i * w + w / 2, A.y - 10, '#fff4d0', 12, 8, 26, 7, 1); } });
    },
    volley(b, n, sp = .14) { const P = b.tgt || G.player, cy = G2.cy(b); b.dilate = 1; for (let i = 0; i < n; i++) { const a = Math.atan2(P.y - 36 - cy, P.x - b.x) + (i - (n - 1) / 2) * sp; Combat.eshoot(b, 'bolt', b.x, cy + 40, a, 11, b.D(10), { r: 7, life: 150, col: '#ffd0a0', len: 30 }); } },
    ring(b, n, bar) { const cy = G2.cy(b); for (let i = 0; i < n; i++) Combat.eshoot(b, 'orb', b.x, cy, i / n * TAU + bar * .2, 4.6, b.D(9), { r: 10, life: 220, col: '#ffe8a0' }); },
    // weaker echoes of earlier bosses, each with its own health bar
    echoes(b, n) {
        const pool = ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon'].filter(k => !(b.echoed || (b.echoed = {}))[k]), A = b.A;
        if (G.enemies.filter(e => e.g2echo && !e.dead).length >= 2) return;
        for (let i = 0; i < n && pool.length; i++) {
            const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; b.echoed[k] = 1;
            const x = U.clamp(b.x + (i % 2 ? 1 : -1) * U.rand(320, 620), A.x0 + 80, A.x1 - 80), e = new Enemy('echo_' + k, x, A.y - 4, { summoned: true });
            e.g2echo = k; e.name = tr('Echo of') + ' ' + tr(BOSSES[k] ? BOSSES[k].name : k); e.spawnT = 30; G.enemies.push(e);
            VFX.ring(x, A.y - 40, 160, ECHO_COL[k], 26, 10); VFX.burst(x, A.y - 40, ECHO_COL[k], 30, 7, 40, 7, 1); G.toast(e.name, ECHO_COL[k]);
            // some of the party (not all) turn on the echo first
            for (const z of G2.team.alive()) if (Math.random() < .45) z.focusE = e;
        }
    }
};
const ECHO_COL = { seraphina: '#ffe8a0', mareva: '#7ad8ff', gardener: '#9aff8a', astraea: '#d8c0ff', lilith: '#ff8a5a', archon: '#ffb0d0' };
(function () {
    const base = { seraphina: 'dawnwarden', mareva: 'tidewarden', gardener: 'hollowstag', astraea: 'orrery', lilith: 'alpha', archon: 'inquisitor' };
    for (const [k, id] of Object.entries(base)) if (ENEMIES[id]) ENEMIES['echo_' + k] = Object.assign({}, ENEMIES[id], { name: 'Echo', hp: 300, xp: 0, elite: true, col: Object.assign({}, ENEMIES[id].col, { g: ECHO_COL[k] }) });
    // echoes are a little see-through, glow in their boss's colour and always show their health
    const draw = Enemy.prototype.draw; Enemy.prototype.draw = function (ctx) {
        if (!this.g2echo) return draw.call(this, ctx);
        ctx.save(); ctx.globalAlpha = .82; Paint.glow(ctx, this.x, this.y - this.h / 2, 70, ECHO_COL[this.g2echo]); draw.call(this, ctx); ctx.restore();
        if (this.dead) return; const w = 96, px = this.x - w / 2, py = this.y - this.h - 26;
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(px - 1, py - 1, w + 2, 7); ctx.fillStyle = ECHO_COL[this.g2echo]; ctx.fillRect(px, py, w * Math.max(0, this.hp / this.maxHp), 5);
        ctx.font = '11px "Palatino Linotype", serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f4ecff'; ctx.fillText(this.name, this.x, py - 4);
    };
})();

/* ------------------------------ THE FIGHT, BY SECTION ------------------------------ */
// Every bar has at most one attack that covers the floor; the rest are aimed, so there is always a way out.
G2.ascendBeat = function (b, bar, bi) {
    const A = b.A, P = G.player, tele = Math.round(SONG.beat * 60 * 2), seg = CUE.seg.findIndex(s => bar >= s.a && bar < s.b), SK = G2.SK;
    if (bi === 0) { G.addShake(2); if (bar % 4 === 0) VFX.ring(b.x, G2.cy(b), 300, '#ffe8a0', 18, 6); }
    const segStart = seg >= 0 && bar === CUE.seg[seg].a && bi === 0;
    if (segStart && seg >= 1) { G2.castSkill('ECHOES OF THE DAYS', '#d8c0ff'); SK.echoes(b, seg === 3 ? 2 : 1); return; }
    const pillar = (x, w = 110) => { x = U.clamp(x, A.x0 + w / 2, A.x1 - w / 2); Combat.warn({ shape: 'rect', x: x - w / 2, y: A.y - 620, w, h: 620, t: tele, dmg: b.D(16), src: b, col: '#ffe8a0', onFire: () => { VFX.burst(x, A.y - 10, '#fff4d0', 24, 9, 30, 8, 1); G.addShake(5); } }); };
    if (seg === 0) {
        const k = bar % 4;
        if (bi === 0 && k === 1) { G2.castSkill('JUDGEMENT RAY'); SK.ray(b, tele); }
        else if (bi === 0 && k !== 1) { const gap = U.pick([-1, 1]); pillar(P.x); pillar(P.x + gap * 320); }
        if (bi === 2) SK.volley(b, 5);
        if (bi === 0 && k === 3) SK.ring(b, 14, bar);
    } else if (seg === 1) {
        // one beam on the beat, low then high, and columns that alternate in between
        const k = bar % 4;
        if (k === 3) { if (bi === 0) { G2.castSkill('DAWN SCYTHE', '#ffb070'); SK.scythe(b, tele); } if (bi === 2) SK.volley(b, 3, .25); return; }
        if (bi === 0) { if (k === 0) G2.castSkill('DAWNLINE'); SK.line(b, tele, bar % 2 === 1); }
        if (bi === 2) { if (k === 1) G2.castSkill('COLONNADE'); SK.colonnade(b, tele, bar % 2 === 0); }
    } else if (seg === 2) {
        const k = bar % 4;
        if (bi === 0 && k === 0) { G2.castSkill('DAWN SCYTHE', '#ffb070'); SK.scythe(b, tele); }
        if (bi === 0 && k === 2) { const dir = P.x > b.x ? -1 : 1, x0 = dir > 0 ? A.x0 : A.x1; b.dilate = 1; for (let i = 0; i < 8; i++) { const x = x0 + dir * i * (A.x1 - A.x0) / 8; Combat.warn({ shape: 'rect', x: Math.min(x, x + dir * 130), y: A.y - 420, w: 130, h: 420, t: tele + i * 6, dmg: b.D(17), src: b, col: '#ff8a4a' }); } }
        if (bi === 2 && k % 2 === 1) { G2.castSkill('JUDGEMENT RAY'); SK.ray(b, tele); }
        if (bi === 3) SK.volley(b, 4, .2);
    } else if (seg === 3) {
        const k = bar % 4;
        if (bi === 0 && k === 0) { G2.castSkill('COLONNADE'); SK.colonnade(b, tele * 2, (bar >> 2) % 2); }
        if (bi === 0 && k === 2) SK.line(b, tele, bar % 8 < 4);
        if (bi === 2 && k === 1) { G2.castSkill('JUDGEMENT RAY'); SK.ray(b, tele); const o = G2.team.alive()[0]; if (o) SK.ray(b, tele + 6, o); }
        if (bi === 2 && k === 3) { G2.castSkill('DAWN SCYTHE', '#ffb070'); SK.scythe(b, tele); }
        if (bi === 3) SK.volley(b, 5, .12);
        if (bi === 0 && k === 1) SK.ring(b, 18, bar);
    }
};

/* ------------------------------ THE CORE, OPENED ------------------------------ */
// When it is dying the eye gives way, and inside is what it was made from: Zero, kneeling, as on the altar.
G2.drawCoreFace = function (c, x, y, b) {
    const t = b.anim, R = 74;
    if (!b.coreRig) { b.coreRig = new Rig(CHARS.zero.style); b.coreRig.owner = { element: 0, charge: 0 }; b.coreRig.play('kneel', 0); }
    const r = b.coreRig; r.ground = true; r.gaitAmt = .2; r.tick(); r.updateChain(x, y + 44, 1, 0);
    c.save(); const g = c.createRadialGradient(x, y, 10, x, y, R); g.addColorStop(0, '#2a2440'); g.addColorStop(.8, '#120e1c'); g.addColorStop(1, '#3a2a50'); c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
    c.clip(); c.globalAlpha = .55 + .2 * Math.sin(t * .05); c.drawImage(Glow.get('#7ad8ff'), x - 60, y - 70, 120, 120); c.globalAlpha = 1;
    c.translate(x, y + 44); c.scale(1.5, 1.5); c.translate(-x, -(y + 44)); r.draw(c, x, y + 44, 1, .95); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,240,210,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(200,230,255,.5)'; c.beginPath(); c.arc(x, y, R + 8 + Math.sin(t * .08) * 3, 0, TAU); c.stroke(); c.restore();
};

/* ------------------------------ THE TORN HEAVEN ------------------------------ */
// What lies behind the god once it rises: a deep violet sky, a halo the size of the world, the Throne's
// broken pieces drifting up, auroras of gold. It fades in with the transformation.
G2.heaven = function (c, k) {
    if (k <= 0) return; const t = G.time, b = G.boss, cam = G.cam, hx = b ? (b.x - cam.x) * cam.zoom * .35 + VW * .32 : VW / 2, hy = VH * .34;
    c.save(); c.globalAlpha = k;
    const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#07041a'); g.addColorStop(.45, '#2a1250'); g.addColorStop(.8, '#6a3050'); g.addColorStop(1, '#c87a48'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    const R = U.mulberry(77); for (let i = 0; i < 160; i++) { const sx = R() * VW, sy = R() * VH * .7, tw = .4 + .6 * Math.abs(Math.sin(t * .02 + i)); c.fillStyle = `rgba(255,255,255,${.5 * tw})`; c.fillRect(sx, sy, R() < .1 ? 2 : 1, R() < .1 ? 2 : 1); }
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { c.beginPath(); for (let x = 0; x <= VW; x += 20) { const y = VH * (.22 + i * .08) + Math.sin(x * .004 + t * .006 + i * 2) * 40 + Math.sin(x * .011 - t * .004) * 14; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.strokeStyle = i % 2 ? 'rgba(200,170,255,.14)' : 'rgba(255,210,140,.14)'; c.lineWidth = 34 - i * 8; c.stroke(); }
    for (let r = 0; r < 3; r++) { c.strokeStyle = `rgba(255,224,160,${.22 - r * .05})`; c.lineWidth = 6 - r * 1.5; c.beginPath(); c.ellipse(hx, hy, 520 + r * 70, 150 + r * 22, Math.sin(t * .001) * .05, 0, TAU); c.stroke(); }
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU + t * .0008; c.fillStyle = 'rgba(255,240,200,.5)'; c.fillRect(hx + Math.cos(a) * 520 - 1, hy + Math.sin(a) * 150 - 1, 3, 3); }
    c.globalCompositeOperation = 'source-over';
    const P = U.mulberry(5); for (let i = 0; i < 16; i++) { const px = P() * VW, sp = .2 + P() * .5, py = VH + 60 - ((t * sp + P() * 900) % (VH + 160)), w = 20 + P() * 60, h = 10 + P() * 40, rot = t * .002 * (P() - .5) + P() * 6; c.save(); c.translate(px, py); c.rotate(rot); c.fillStyle = 'rgba(30,18,40,.85)'; c.fillRect(-w / 2, -h / 2, w, h); c.strokeStyle = 'rgba(255,210,140,.35)'; c.lineWidth = 1; c.strokeRect(-w / 2, -h / 2, w, h); c.restore(); }
    c.restore();
};

/* ------------------------------ WIRING ------------------------------ */
(function () {
    // the torn heaven goes behind everything else of the final form
    const fd = G2.fx.draw.bind(G2.fx); G2.fx.draw = function (c, F, front) { c.save(); try { if (!front) G2.heaven(c, U.clamp(F.sky, 0, 1)); fd(c, F, front); } catch (e) { console.warn(e); } finally { c.restore(); } };
    // the god: eye target and beams each tick
    const B = BOSSES.architect2, tick = B.tick, draw = B.draw;
    B.tick = b => { tick(b); if (b.ascended && !b.dying) G2.eyeTick(b); if (b.dying) { b.lookX = U.lerp(b.lookX || b.x, b.x, .05); for (const e of G.enemies) if (e.g2echo && !e.dead) { e.hp = 0; e.die({ dir: 0 }); } } G2.beamsTick(); };
    // drawing never leaves the canvas in a strange state, even if something inside fails
    B.draw = (c, b) => { c.save(); try { draw(c, b); if (b.ascended && !b.gone) G2.drawBeams(c, b); } catch (e) { console.warn(e); } finally { c.restore(); } };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { G2.beams = []; G2.skillCap = null; return ll(id, cp); };
    // the skill being cast, under the god's health bar
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) {
        hd(c); const S = G2.skillCap; if (!S || Game.state !== 'play' || G.letterbox) return; S.t++; if (S.t > 130) { G2.skillCap = null; return; }
        const a = Math.min(1, S.t / 10, (130 - S.t) / 20); c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = 'italic bold 20px "Palatino Linotype", "Times New Roman", serif'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,6,20,.85)'; c.strokeText('✦ ' + S.name + ' ✦', VW / 2, 104); c.fillStyle = S.col; c.fillText('✦ ' + S.name + ' ✦', VW / 2, 104); c.restore();
    };
    // melee fighters jump higher against the god, just enough to reach its core
    const dj = Player.prototype.doJump; Player.prototype.doJump = function (air) { dj.call(this, air); const b = G.boss; if (b && b.ascended && !b.dying && !this.def.ranged) this.vy *= 1.22; };
    // companions: some go for the echoes first, then back to the god
    const brain = G2.teamBrain; G2.teamBrain = function (z) {
        const e = z.focusE; if (e && (e.dead || e.hp <= 0)) z.focusE = null;
        if (!z.focusE || !G.boss || G.boss.dying) return brain(z);
        const S = {}, go = d => { if (d < 0) S.left = true; else if (d > 0) S.right = true; };
        for (const w of G.warns) if (w.dmg && w.t < 30 && w.shape === 'rect' && z.x > w.x - 14 && z.x < w.x + w.w + 14 && z.y > w.y && z.y - 60 < w.y + w.h) { go(z.x < w.x + w.w / 2 ? -1 : 1); if (w.t < 9 && z.dodgeCd <= 0) S['!dodge'] = true; return S; }
        const ranged = z.def.ranged, want = ranged ? 240 : 50, dx = e.x - z.x; z.facing = U.sign(dx) || 1;
        if (Math.abs(dx) > want) { go(dx); if (Math.abs(dx) > 420 && z.dodgeCd <= 0 && G.time % 40 === z.slot) S['!dodge'] = true; } else if (ranged && Math.abs(dx) < 150) go(-dx);
        if (Math.abs(dx) < want + 40 && (G.time + z.slot * 3) % (ranged ? 5 : 4) === 0) { S['!attack'] = S.attack = true; }
        if ((G.time + z.slot * 37) % 300 === 60) S['!skill1'] = true;
        return S;
    };
})();
Object.assign(VI, {
    'JUDGEMENT RAY': 'THÁNH QUANG PHÁN XÉT', 'DAWN SCYTHE': 'LƯỠI HÁI BÌNH MINH', 'ECHOES OF THE DAYS': 'TIẾNG VỌNG NHỮNG NGÀY XƯA', 'DAWNLINE': 'TIA RẠNG ĐÔNG', 'COLONNADE': 'HÀNG CỘT ÁNH SÁNG',
    'Echo of': 'Tiếng Vọng của', 'Echo': 'Tiếng Vọng'
});
