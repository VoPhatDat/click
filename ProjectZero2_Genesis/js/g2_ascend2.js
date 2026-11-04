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
G2.lasers = [];
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
    pillar(b, tele, x, w = 110) { const A = b.A; x = U.clamp(x, A.x0 + w / 2, A.x1 - w / 2); Combat.warn({ shape: 'rect', x: x - w / 2, y: A.y - 620, w, h: 620, t: tele, dmg: b.D(16), src: b, col: '#ffe8a0', onFire: () => { VFX.burst(x, A.y - 10, '#fff4d0', 24, 9, 30, 8, 1); G.addShake(5); } }); },
    // eight blades of light rolling across the floor from the side away from the target
    wave(b, tele) { const A = b.A, P = b.tgt || G.player, dir = P.x > b.x ? -1 : 1, x0 = dir > 0 ? A.x0 : A.x1; b.dilate = 1; for (let i = 0; i < 8; i++) { const x = x0 + dir * i * (A.x1 - A.x0) / 8; Combat.warn({ shape: 'rect', x: Math.min(x, x + dir * 130), y: A.y - 420, w: 130, h: 420, t: tele + i * 6, dmg: b.D(17), src: b, col: '#ff8a4a' }); } },
    // the eye burns a line along the whole floor, end to end: jump it as it passes
    gaze(b, tele) {
        const A = b.A, dir = Math.random() < .5 ? 1 : -1, x0 = dir > 0 ? A.x0 + 20 : A.x1 - 20, x1 = dir > 0 ? A.x1 - 20 : A.x0 + 20, n = 16, run = 70; b.dilate = 1;
        Combat.warn({ shape: 'rect', x: A.x0, y: A.y - 90, w: A.x1 - A.x0, h: 90, t: tele, dmg: 0, src: b, col: '#ff6a3a' });
        for (let i = 0; i < n; i++) { const xa = U.lerp(x0, x1, i / n), xb = U.lerp(x0, x1, (i + 1) / n); Combat.warn({ shape: 'rect', x: Math.min(xa, xb), y: A.y - 80, w: Math.abs(xb - xa), h: 80, t: tele + Math.round(i / n * run), dmg: b.D(15), src: b, col: 'rgba(0,0,0,0)' }); }
        G2.beams.push({ kind: 'sweep', x0, x1, delay: tele, dur: run, life: tele + run + 12, w: 30, col: '#ff5a2a' });
    },
    // thin feathers of light falling at random, a little ahead of the fighters
    feathers(b, tele, n) { const A = b.A; for (let i = 0; i < n; i++) { const x = U.rand(A.x0 + 40, A.x1 - 40); Combat.warn({ shape: 'rect', x: x - 18, y: A.y - 620, w: 36, h: 620, t: tele + i * 3, dmg: b.D(11), src: b, col: '#e8dcff' }); } },
    // the Turning Crown: arms of laser from the eye, slowly turning, with gaps to stand in
    crown(b, n, spin) { G2.castSkill('TURNING CROWN', '#ff6a4a'); b.dilate = 1; G2.lasers.push({ n, a0: Math.random() * TAU, spin: spin * (Math.random() < .5 ? 1 : -1), warm: 70, act: 220, age: 0, len: 1600, dmg: b.D(14) }); Sound.sfx('charge'); },
    // the summoning: a column of each echo's colour opens first, the god calls, then they step out
    summon(b, n) {
        const pool = ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon'].filter(k => !(b.echoed || (b.echoed = {}))[k]), A = b.A, alive = G.enemies.filter(e => e.g2echo && !e.dead).length;
        if (!pool.length || alive >= 3) return; n = Math.min(n, 3 - alive, pool.length);
        G2.castSkill('ECHOES OF THE DAYS', '#d8c0ff'); G.say('THE ARCHITECT', U.pick(['RISE. EVERYONE SHE EVER FACED, RISE.', 'YOUR OLD ENEMIES REMEMBER YOU.', 'COME BACK. ALL OF YOU. FIGHT FOR ME.']), 130);
        for (let i = 0; i < n; i++) {
            const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0], x = U.clamp(b.x + (i % 2 ? 1 : -1) * U.rand(360, 660), A.x0 + 90, A.x1 - 90); b.echoed[k] = 1;
            G2.beams.push({ kind: 'ray', x, life: 60, w: 70, col: ECHO_COL[k] }); VFX.ring(x, A.y - 20, 200, ECHO_COL[k], 30, 10);
            G.delay(45, () => { if (!G.boss || G.boss.dying) return; G2.SK.echoes(b, 1, k, x); });
        }
    },
    // weaker echoes of earlier bosses, each with its own health bar
    echoes(b, n, only, at) {
        const pool = only ? [only] : ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon'].filter(k => !(b.echoed || (b.echoed = {}))[k]), A = b.A;
        for (let i = 0; i < n && pool.length; i++) {
            const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; b.echoed[k] = 1;
            const x = at !== undefined ? at : U.clamp(b.x + (i % 2 ? 1 : -1) * U.rand(320, 620), A.x0 + 80, A.x1 - 80), e = new Enemy('echo_' + k, x, A.y - 4, { summoned: true });
            e.g2echo = k; e.name = tr('Echo of') + ' ' + tr(BOSSES[k] ? BOSSES[k].name : k); e.spawnT = 30; if (e.w) e.w *= 1.4; if (e.h) e.h *= 1.4; G.enemies.push(e); G.addShake(10); Sound.sfx('roar', { v: .6 });
            VFX.ring(x, A.y - 40, 160, ECHO_COL[k], 26, 10); VFX.burst(x, A.y - 40, ECHO_COL[k], 30, 7, 40, 7, 1); G.toast(e.name, ECHO_COL[k]);
            // some of the party (not all) turn on the echo first
            for (const z of G2.team.alive()) if (Math.random() < .45) z.focusE = e;
        }
    }
};
const ECHO_COL = { seraphina: '#ffe8a0', mareva: '#7ad8ff', gardener: '#9aff8a', astraea: '#d8c0ff', lilith: '#ff8a5a', archon: '#ffb0d0' };
(function () {
    const base = { seraphina: 'dawnwarden', mareva: 'tidewarden', gardener: 'hollowstag', astraea: 'orrery', lilith: 'alpha', archon: 'inquisitor' };
    for (const [k, id] of Object.entries(base)) if (ENEMIES[id]) ENEMIES['echo_' + k] = Object.assign({}, ENEMIES[id], { atks: (ENEMIES[id].atks || []).filter(x => x.kind !== 'summon'), name: 'Echo', hp: 420, xp: 0, elite: true, col: Object.assign({}, ENEMIES[id].col, { g: ECHO_COL[k] }) });
    // echoes are a little see-through, glow in their boss's colour and always show their health
    const draw = Enemy.prototype.draw; Enemy.prototype.draw = function (ctx) {
        if (!this.g2echo) return draw.call(this, ctx);
        ctx.save(); ctx.globalAlpha = .86; Paint.glow(ctx, this.x, this.y - this.h / 2, 110, ECHO_COL[this.g2echo]); ctx.translate(this.x, this.y); ctx.scale(1.45, 1.45); ctx.translate(-this.x, -this.y); draw.call(this, ctx); ctx.restore();
        if (this.dead) return; const w = 140, px = this.x - w / 2, py = this.y - this.h - 34;
        ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillRect(px - 2, py - 2, w + 4, 11); ctx.fillStyle = ECHO_COL[this.g2echo]; ctx.fillRect(px, py, w * Math.max(0, this.hp / this.maxHp), 7);
        ctx.font = 'bold 14px "Palatino Linotype", serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,6,20,.9)'; ctx.strokeText(this.name, this.x, py - 6); ctx.fillStyle = '#f4ecff'; ctx.fillText(this.name, this.x, py - 6);
    };
})();

/* ------------------------------ THE FIGHT, BY SECTION ------------------------------ */
// At each mark on the health bar the god learns more, and everything it already knew stays in the pool:
//   100-66%  Pillars, Judgement Ray, Volley, Halo of Orbs, and the first Echo
//   66-40%   + Dawnline, Colonnade, Dawn Scythe, Feather Rain
//   40-15%   + Twin Ray, Searing Gaze, Wave of Light, Turning Crown (rotating lasers)
//   15-0%    + Final Verdict (a ray on every fighter), a faster Crown with more arms, denser fire
// One attack that covers the floor per bar at most, nothing on the floor while the Crown turns.
const FLOOR_POOL = [['pillars'], ['pillars', 'line', 'colonnade', 'scythe'], ['line', 'colonnade', 'scythe', 'wave', 'gaze', 'pillars'], ['line', 'colonnade', 'scythe', 'wave', 'gaze', 'pillars']];
const AIM_POOL = [['volley', 'ray'], ['volley', 'ray', 'feathers'], ['volley', 'twin', 'feathers', 'ray'], ['volley', 'twin', 'verdict', 'feathers']];
const SKILL_NAME = { ray: 'JUDGEMENT RAY', twin: 'TWIN RAY', verdict: 'FINAL VERDICT', line: 'DAWNLINE', colonnade: 'COLONNADE', scythe: 'DAWN SCYTHE', wave: 'WAVE OF LIGHT', gaze: 'SEARING GAZE', feathers: 'FEATHER RAIN', crown: 'TURNING CROWN', pillars: 'PILLARS OF DAWN' };
G2.ascendBeat = function (b, bar, bi) {
    const A = b.A, P = G.player, tele = Math.round(SONG.beat * 60 * 2), seg = CUE.seg.findIndex(s => bar >= s.a && bar < s.b), SK = G2.SK, k = bar % 4;
    if (seg < 0) return; b.rageT = seg;
    if (bi === 0) { G.addShake(2 + seg); if (bar % 4 === 0) VFX.ring(b.x, G2.cy(b), 300, seg >= 2 ? '#ff8a5a' : '#ffe8a0', 18, 6); }
    // the echoes: once early so it is seen, then at every new section, and once more near the end
    const segStart = bar === CUE.seg[seg].a, summon = bar === CUE.seg[0].a + 4 ? 1 : segStart && seg >= 1 ? (seg >= 2 ? 2 : 1) : bar === CUE.seg[3].a + 8 ? 1 : 0;
    if (summon && bi === 0) { SK.summon(b, summon); return; }
    if (summon && bi < 3) return;
    // the Turning Crown: every 8 bars from the third section, nothing else on the floor while it turns
    if (seg >= 2 && bi === 0 && (bar - CUE.seg[seg].a) % 8 === 2) { SK.crown(b, seg === 3 ? 5 : 3, seg === 3 ? .009 : .006); return; }
    const crownOn = G2.lasers.length > 0, pick = (L, salt) => L[Math.abs(bar * 7 + salt * 3 + (b.pickSeed || 0)) % L.length];
    if (bi === 0 && !crownOn) {
        const f = pick(FLOOR_POOL[seg], 1); G2.castSkill(SKILL_NAME[f], f === 'scythe' || f === 'gaze' ? '#ffb070' : '#ffe8a0');
        if (f === 'pillars') { const gap = U.pick([-1, 1]); SK.pillar(b, tele, P.x); SK.pillar(b, tele, P.x + gap * 330); }
        else if (f === 'line') SK.line(b, tele, bar % 2 === 1);
        else if (f === 'colonnade') SK.colonnade(b, tele, bar % 2 === 0);
        else if (f === 'scythe') SK.scythe(b, tele);
        else if (f === 'wave') SK.wave(b, tele);
        else if (f === 'gaze') SK.gaze(b, tele);
    }
    if (bi === 2) {
        const a = pick(AIM_POOL[seg], 2); if (a !== 'volley' && a !== 'feathers' || bar % 4 === 1) G2.castSkill(SKILL_NAME[a] || 'JUDGEMENT RAY', a === 'verdict' ? '#ff8a5a' : '#ffe8a0');
        if (a === 'volley') SK.volley(b, 5 + seg, .14 - seg * .01);
        else if (a === 'ray') SK.ray(b, tele);
        else if (a === 'twin') { SK.ray(b, tele); SK.ray(b, tele + 8, U.pick([G.player, ...G2.team.alive()])); }
        else if (a === 'verdict') [G.player, ...G2.team.alive()].forEach((z, i) => SK.ray(b, tele + i * 4, z));
        else if (a === 'feathers') SK.feathers(b, tele, 4 + seg * 2);
    }
    if (bi === 0 && k === 3) SK.ring(b, 12 + seg * 3, bar);
    if (seg >= 2 && bi === 3) SK.volley(b, 3 + seg, .22);
    if (seg === 3 && bi === 1 && bar % 2) SK.ring(b, 10, bar + .5);
};

/* ------------------------------ THE TURNING CROWN ------------------------------ */
// Arms of laser from the eye. Thin and dashed while they warm up, then burning; they turn slowly, so the
// way out is to keep to the gap between two arms (or dodge through one).
G2.lasersTick = function (b) {
    const ex = b.x, ey = G2.cy(b);
    for (const L of G2.lasers) {
        L.age++; if (L.age < L.warm || L.age > L.warm + L.act) continue;
        for (const z of [G.player, ...G2.team.alive()]) { if (!z || z.inv > 0 || z.state === 'dead') continue; const px = z.x - ex, py = z.y - 34 - ey;
            for (let i = 0; i < L.n; i++) { const a = L.a0 + i * TAU / L.n + L.spin * L.age, ux = Math.cos(a), uy = Math.sin(a), along = px * ux + py * uy, perp = Math.abs(px * uy - py * ux);
                if (along > 0 && along < L.len && perp < 20) { z.hurt(L.dmg, { x: ex, kb: 6, unblockable: true, owner: b }); break; } } }
    }
    G2.lasers = G2.lasers.filter(L => L.age <= L.warm + L.act + 12);
};
G2.drawLasers = function (c, b) {
    const ex = b.x, ey = G2.cy(b);
    for (const L of G2.lasers) {
        const warm = L.age < L.warm, fade = L.age > L.warm + L.act ? 1 - (L.age - L.warm - L.act) / 12 : 1;
        for (let i = 0; i < L.n; i++) { const a = L.a0 + i * TAU / L.n + L.spin * L.age, x2 = ex + Math.cos(a) * L.len, y2 = ey + Math.sin(a) * L.len;
            c.save();
            if (warm) { c.globalAlpha = .35 + .35 * Math.abs(Math.sin(L.age * .3)); c.strokeStyle = '#ff6a4a'; c.lineWidth = 2; c.setLineDash([14, 10]); c.beginPath(); c.moveTo(ex, ey); c.lineTo(x2, y2); c.stroke(); }
            else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 * fade; c.strokeStyle = '#ff5a2a'; c.lineWidth = 34; c.beginPath(); c.moveTo(ex, ey); c.lineTo(x2, y2); c.stroke(); c.globalAlpha = .95 * fade; c.strokeStyle = '#fff2d8'; c.lineWidth = 9; c.stroke(); }
            c.restore(); }
    }
};

/* ------------------------------ IT GETS WORSE AS IT DIES ------------------------------ */
// rage: 0 at full health, 3 in the last section. Red creeps into the eye and the aura, the halo turns
// faster, red cracks open on its body, the sky behind it reddens and flickers.
G2.drawRage = function (c, b, x, y) {
    const r = b.rage || 0; if (r <= .02) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(.5, r * .15); c.drawImage(Glow.get('#ff3a1a'), x - 520, y - 460, 1040, 920); c.restore();
    if (r > 1.2) { const k = Math.min(1, (r - 1.2) / 1.5), R = U.mulberry(19); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,90,40,${.75 * k})`; c.lineWidth = 3; c.shadowColor = '#ff3a1a'; c.shadowBlur = 12;
        for (let i = 0; i < 14; i++) { const a = R() * TAU; let px = x + Math.cos(a) * 110, py = y + Math.sin(a) * 110; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) { px += Math.cos(a) * 40 + (R() - .5) * 50; py += Math.sin(a) * 40 + (R() - .5) * 50; c.lineTo(px, py); } c.stroke(); } c.restore(); }
};

/* ------------------------------ THE CORE, OPENED ------------------------------ */
// When it is dying the eye gives way, and inside is what it was made from: Zero, kneeling, as on the altar.
G2.drawCoreFace = function (c, x, y, b) {
    // Zero as he was on the altar: kneeling on a stone slab, bound by two chains of light, lit from behind
    const t = b.anim, R = 104, fy = y + R * .62;
    if (!b.coreRig) { b.coreRig = new Rig(CHARS.zero.style); b.coreRig.owner = { element: 0, charge: 0 }; b.coreRig.play('kneel', 0); }
    const zx = x - 36, r = b.coreRig; r.ground = true; r.gaitAmt = .2; r.tick(); r.updateChain(zx, fy, 1, 0);
    c.save(); c.shadowColor = '#000'; c.shadowBlur = 30; const g = c.createRadialGradient(x, y - 10, 10, x, y, R); g.addColorStop(0, '#4a4a66'); g.addColorStop(.75, '#22203a'); g.addColorStop(1, '#141024'); c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill(); c.shadowBlur = 0;
    c.clip();
    c.globalAlpha = .7 + .15 * Math.sin(t * .05); c.drawImage(Glow.get('#9ad8ff'), x - 110, y - 120, 220, 200); c.globalAlpha = 1;
    // the altar
    c.fillStyle = '#5a5060'; c.fillRect(x - 90, fy, 180, 16); c.fillStyle = '#8a8090'; c.fillRect(x - 90, fy, 180, 3); c.fillStyle = '#2a2232'; c.fillRect(x - 80, fy + 16, 160, 40);
    // chains of light to his wrists
    c.strokeStyle = 'rgba(255,230,170,.75)'; c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(x - R, y - 40); c.lineTo(zx - 6, fy - 50); c.moveTo(x + R, y - 40); c.lineTo(zx + 30, fy - 50); c.stroke(); c.setLineDash([]);
    // the figure, big enough to read, with a pale rim of light around it
    c.save(); c.translate(zx, fy); c.scale(2.1, 2.1); c.translate(-zx, -fy); c.shadowColor = '#cfe8ff'; c.shadowBlur = 14; r.draw(c, zx, fy, 1, 1); c.restore();
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,240,210,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke(); c.lineWidth = 1.2; c.strokeStyle = 'rgba(200,230,255,.5)'; c.beginPath(); c.arc(x, y, R + 9 + Math.sin(t * .08) * 3, 0, TAU); c.stroke(); c.restore();
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
    const rg = b ? b.rage || 0 : 0; if (rg > .05) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = k * Math.min(.35, rg * .1) * (rg > 2.5 && Math.random() < .03 ? 2 : 1); c.fillStyle = '#ff3010'; c.fillRect(0, 0, VW, VH); }
    c.restore();
};

/* ------------------------------ WIRING ------------------------------ */
(function () {
    // the torn heaven goes behind everything else of the final form
    const fd = G2.fx.draw.bind(G2.fx); G2.fx.draw = function (c, F, front) { c.save(); try { if (!front) G2.heaven(c, U.clamp(F.sky, 0, 1)); fd(c, F, front); } catch (e) { console.warn(e); } finally { c.restore(); } };
    // the god: eye target and beams each tick
    const B = BOSSES.architect2, tick = B.tick, draw = B.draw;
    B.tick = b => { tick(b); if (b.ascended && !b.dying) { G2.eyeTick(b); G2.lasersTick(b); b.rage = U.lerp(b.rage || 0, b.rageT || 0, .01); if (b.rings) b.rings = b.rings.map(x => x + .006 * b.rage); } if (b.dying) { G2.lasers = []; b.lookX = U.lerp(b.lookX || b.x, b.x, .05); for (const e of G.enemies) if (e.g2echo && !e.dead) { e.hp = 0; e.die({ dir: 0 }); } } G2.beamsTick(); };
    // drawing never leaves the canvas in a strange state, even if something inside fails
    B.draw = (c, b) => { c.save(); try { draw(c, b); if (b.ascended && !b.gone) { G2.drawBeams(c, b); G2.drawLasers(c, b); } } catch (e) { console.warn(e); } finally { c.restore(); } };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { G2.beams = []; G2.lasers = []; G2.skillCap = null; return ll(id, cp); };
    // the skill being cast, under the god's health bar
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) {
        hd(c); const S = G2.skillCap; if (!S || Game.state !== 'play' || G.letterbox) return; S.t++; if (S.t > 130) { G2.skillCap = null; return; }
        const a = Math.min(1, S.t / 10, (130 - S.t) / 20); c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = 'italic bold 20px "Palatino Linotype", "Times New Roman", serif'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,6,20,.85)'; c.strokeText('✦ ' + S.name + ' ✦', VW / 2, 134); c.fillStyle = S.col; c.fillText('✦ ' + S.name + ' ✦', VW / 2, 134); c.restore();
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
    'JUDGEMENT RAY': 'THÁNH QUANG PHÁN XÉT', 'TWIN RAY': 'SONG QUANG PHÁN XÉT', 'FINAL VERDICT': 'PHÁN QUYẾT CUỐI CÙNG', 'WAVE OF LIGHT': 'SÓNG ÁNH SÁNG', 'SEARING GAZE': 'ÁNH NHÌN THIÊU ĐỐT', 'FEATHER RAIN': 'MƯA LÔNG VŨ', 'TURNING CROWN': 'VƯƠNG MIỆN XOAY', 'PILLARS OF DAWN': 'CỘT BÌNH MINH', 'RISE. EVERYONE SHE EVER FACED, RISE.': 'TRỖI DẬY. TẤT CẢ NHỮNG KẺ CON BÉ TỪNG ĐỐI MẶT, TRỖI DẬY.', 'YOUR OLD ENEMIES REMEMBER YOU.': 'KẺ THÙ CŨ CỦA NGƯƠI VẪN CÒN NHỚ NGƯƠI ĐẤY.', 'COME BACK. ALL OF YOU. FIGHT FOR ME.': 'QUAY VỀ ĐÂY. TẤT CẢ CÁC NGƯƠI. CHIẾN ĐẤU VÌ TA.', 'DAWN SCYTHE': 'LƯỠI HÁI BÌNH MINH', 'ECHOES OF THE DAYS': 'TIẾNG VỌNG NHỮNG NGÀY XƯA', 'DAWNLINE': 'TIA RẠNG ĐÔNG', 'COLONNADE': 'HÀNG CỘT ÁNH SÁNG',
    'Echo of': 'Tiếng Vọng của', 'Echo': 'Tiếng Vọng'
});

/* ------------------------------ THE FINAL BOSS'S HEALTH BAR ------------------------------ */
// Once it rises, the bar is the last one of the game and looks it: wider and taller, gold and violet frame
// with a slow light running along it, a white chip that trails damage, the marks of each section as
// diamonds, the name in large gold letters with "FINAL BOSS" over it, and a crack of red when it is low.
(function () {
    const bb = HUD.bossBar.bind(HUD);
    HUD.bossBar = function (c, b) {
        if (!b.ascended || b.dying || b.gone) return bb(c, b);
        const w = Math.min(980, VW - 220), x = VW / 2 - w / 2, y = 70, h = 24, f = U.clamp(b.hp / b.maxHp, 0, 1), t = G.time, rage = b.rage || 0;
        b.chip = b.chip === undefined ? f : (b.chip > f ? Math.max(f, b.chip - .0025) : f);
        c.save(); c.textAlign = 'center';
        c.font = 'bold 12px "Palatino Linotype", "Times New Roman", serif'; c.fillStyle = '#ff6a4a'; UIText.spaced(c, tr('FINAL BOSS'), VW / 2, y - 34, 6);
        c.font = 'bold 26px "Palatino Linotype", "Times New Roman", serif'; c.lineWidth = 4; c.strokeStyle = 'rgba(20,6,0,.9)'; const name = tr('THE ARCHITECT, ASCENDED'); c.strokeText(name, VW / 2, y - 9); const ng = c.createLinearGradient(0, y - 30, 0, y - 6); ng.addColorStop(0, '#fff6d8'); ng.addColorStop(1, '#ffb040'); c.fillStyle = ng; c.fillText(name, VW / 2, y - 9);
        // frame
        c.shadowColor = rage > 2 ? '#ff3a1a' : '#ffd86b'; c.shadowBlur = 16; c.fillStyle = 'rgba(8,4,14,.85)'; c.fillRect(x - 6, y - 4, w + 12, h + 8); c.shadowBlur = 0;
        const fg = c.createLinearGradient(x, 0, x + w, 0); fg.addColorStop(0, '#ffd86b'); fg.addColorStop(.5, '#c8b0ff'); fg.addColorStop(1, '#ffd86b'); c.strokeStyle = fg; c.lineWidth = 2; c.strokeRect(x - 6, y - 4, w + 12, h + 8); c.strokeStyle = 'rgba(255,240,200,.35)'; c.lineWidth = 1; c.strokeRect(x - 2, y, w + 4, h);
        // chip, then the health itself
        c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x, y + 2, w * b.chip, h - 4);
        const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#5a1aa8'); g.addColorStop(.45, '#c040ff'); g.addColorStop(.8, '#ff6a2a'); g.addColorStop(1, '#ffe08a'); c.fillStyle = g; c.fillRect(x, y + 2, w * f, h - 4);
        const gl = c.createLinearGradient(0, y + 2, 0, y + h - 2); gl.addColorStop(0, 'rgba(255,255,255,.35)'); gl.addColorStop(.5, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.fillRect(x, y + 2, w * f, h - 4);
        // a light running along the filled part
        const run = x + ((t * 6) % Math.max(1, w * f)); c.globalCompositeOperation = 'lighter'; const rg = c.createLinearGradient(run - 60, 0, run + 60, 0); rg.addColorStop(0, 'rgba(255,240,200,0)'); rg.addColorStop(.5, 'rgba(255,240,200,.5)'); rg.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = rg; c.fillRect(Math.max(x, run - 60), y + 2, Math.min(120, x + w * f - Math.max(x, run - 60)), h - 4); c.globalCompositeOperation = 'source-over';
        // the section marks, as diamonds
        for (const s of CUE.seg) { if (!s.thr) continue; const mx = x + w * s.thr, on = f > s.thr; c.fillStyle = on ? '#fff6d8' : '#5a4a6a'; c.beginPath(); c.moveTo(mx, y - 7); c.lineTo(mx + 6, y + h / 2); c.lineTo(mx, y + h + 7); c.lineTo(mx - 6, y + h / 2); c.closePath(); c.fill(); c.strokeStyle = '#2a1a10'; c.lineWidth = 1.5; c.stroke(); }
        if (rage > 2.2) { c.strokeStyle = `rgba(255,60,30,${.4 + .3 * Math.sin(t * .2)})`; c.lineWidth = 2; c.strokeRect(x - 9, y - 7, w + 18, h + 14); }
        c.font = 'bold 12px "Courier New", monospace'; c.fillStyle = '#fff6d8'; c.textAlign = 'right'; c.fillText(Math.ceil(f * 100) + '%', x + w + 2, y + h + 18);
        c.restore();
    };
})();


/* ------------------------------ THE HALL, TORN DOWN ------------------------------ */
// A colonnade of the Throne's hall stands behind the arena. When the god rises, the columns crack one by one
// (nearest first), break into drums, are lifted off the floor and spiral into its eye, and are gone.
G2.hall = {
    cols: null,
    build() { const A = G.arena; if (!A) return; this.cols = []; const step = 300; let i = 0; for (let x = A.x0 + 120; x < A.x1 - 60; x += step, i++) { const h = 820 + (i % 3) * 90; this.cols.push({ x, w: 74, h, segs: [0, 1, 2, 3].map(k => ({ k })), order: 0 }); } },
    reset() { this.cols = null; this.t0 = null; },
    draw(c) {
        const L = G.level, b = G.boss; if (!L || L.id !== 'architect2') return; if (!this.cols) this.build(); if (!this.cols) return;
        if (b && b.gone) return; const cam = G.cam, z = cam.zoom, A = G.arena, S = G2.song;
        const asc = b && b.ascended && S.active, pos = asc ? S.pos() : 0, cx = b ? b.x : (A.x0 + A.x1) / 2, cy = b ? G2.cy(b) : A.y - 500;
        if (asc && this.t0 === null) { this.t0 = pos; this.cols.slice().sort((p, q) => Math.abs(p.x - cx) - Math.abs(q.x - cx)).forEach((col, n) => { col.order = n; }); }
        const sx = wx => (wx - cam.x) * z, sy = wy => (wy - cam.y) * z;
        for (const col of this.cols) {
            const crackAt = 1.2 + col.order * .75, liftAt = crackAt + .9, tBase = asc ? pos - (this.t0 || 0) : -1;
            const segH = col.h / 4;
            for (const sg of col.segs) {
                let wx = col.x, wy = A.y - segH * (sg.k + .5), rot = 0, sc = 1, al = 1;
                if (tBase > liftAt) { const u = U.clamp((tBase - liftAt - sg.k * .12) / 2.4, 0, 1); if (u >= 1) continue; const e = u * u * (3 - 2 * u), sw = Math.sin(u * Math.PI) * (160 + sg.k * 40) * (col.x < cx ? -1 : 1);
                    wx = U.lerp(col.x, cx, e) + sw * .3; wy = U.lerp(wy, cy, e) - Math.sin(u * Math.PI) * 220; rot = e * (3 + sg.k) * (col.x < cx ? 1 : -1); sc = 1 - e * .8; al = 1 - Math.max(0, (u - .75) / .25);
                    if (G.time % 3 === 0) VFX.add(wx + U.rand(-20, 20), wy + U.rand(-20, 20), 0, 0, '#ffe8a0', 26, 4, 1, 0); }
                const X = sx(wx), Y = sy(wy), W = col.w * z * sc, H = segH * z * sc;
                c.save(); c.globalAlpha = al; c.translate(X, Y); c.rotate(rot);
                const g = c.createLinearGradient(-W / 2, 0, W / 2, 0); g.addColorStop(0, '#1c1828'); g.addColorStop(.5, '#4a4462'); g.addColorStop(1, '#1c1828'); c.fillStyle = g; c.fillRect(-W / 2, -H / 2, W, H + 1); c.fillStyle = 'rgba(255,216,107,.55)'; c.fillRect(-W / 2, -H / 2, 1.5 * z, H); c.fillRect(W / 2 - 1.5 * z, -H / 2, 1.5 * z, H);
                if (rot) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * .5; c.drawImage(Glow.get('#ffe8a0'), -W, -H, W * 2, H * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; }
                c.fillStyle = 'rgba(255,216,107,.45)'; c.fillRect(-W * .18, -H / 2, 1.5 * z, H); c.fillRect(W * .18, -H / 2, 1.5 * z, H);
                if (sg.k === 3) { c.fillStyle = '#3a3248'; c.fillRect(-W * .7, -H / 2 - 12 * z, W * 1.4, 14 * z); c.fillStyle = 'rgba(255,216,107,.6)'; c.fillRect(-W * .7, -H / 2 - 12 * z, W * 1.4, 2 * z); }
                if (sg.k === 0) { c.fillStyle = '#2a2438'; c.fillRect(-W * .6, H / 2 - 8 * z, W * 1.2, 10 * z); }
                if (tBase > crackAt) { const k = U.clamp((tBase - crackAt) / .9, 0, 1); c.strokeStyle = `rgba(255,232,170,${.8 * k})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-W / 2, H / 2 - 2); c.lineTo(-W * .1, H * .1); c.lineTo(W * .2, -H * .2); c.lineTo(W / 2, -H / 2 + 3); c.stroke(); }
                c.restore();
            }
            if (asc && tBase > crackAt && tBase < liftAt + .1 && !col.shook) { col.shook = true; G.addShake(6); Sound.sfx('crumble', { v: .5 }); VFX.burst(col.x, A.y - 10, '#9a90b0', 20, 6, 30, 7, 1); }
        }
    }
};
(function () {
    // behind the god and the arena, in front of the sky
    const fd = G2.fx.draw; G2.fx.draw = function (c, F, front) { const r = fd.call(this, c, F, front); if (!front) { c.save(); try { G2.hall.draw(c); } catch (e) { console.warn(e); } c.restore(); } return r; };
    // before it rises (no final-form sky yet) the colonnade still stands in the hall
    const bd = Backdrop.draw.bind(Backdrop); Backdrop.draw = function (ctx, id, cam, t, level) { bd(ctx, id, cam, t, level); if (level && G.level && level === G.level && G.level.id === 'architect2' && !G.g2fx) { ctx.save(); try { G2.hall.draw(ctx); } catch (e) { } ctx.restore(); } };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { G2.hall.reset(); return ll(id, cp); };
})();

/* ------------------------------ "FINAL BOSS" ------------------------------ */
// At 0:46, as the music gathers itself, the screen says it plainly, then the fight begins on the cut.
G2.drawFinalCard = function (c, F) {
    const S = G2.song, k = S.active ? (S.pos() - F.at) : F.t / 60, e = U.clamp(k / .35, 0, 1), sc = 1.5 - .5 * (1 - Math.pow(1 - e, 3)), y = VH * .46;
    c.save(); c.globalAlpha = Math.min(1, k / .15);
    c.fillStyle = 'rgba(10,2,4,.55)'; c.fillRect(0, y - 90, VW, 150);
    c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const yy = y - 70 + i * 32 + Math.sin(k * 6 + i) * 4, len = VW * U.clamp(k * 2 - i * .1, 0, 1); const g = c.createLinearGradient(VW / 2 - len / 2, 0, VW / 2 + len / 2, 0); g.addColorStop(0, 'rgba(255,60,30,0)'); g.addColorStop(.5, 'rgba(255,120,60,.55)'); g.addColorStop(1, 'rgba(255,60,30,0)'); c.fillStyle = g; c.fillRect(VW / 2 - len / 2, yy, len, 2); }
    c.globalCompositeOperation = 'source-over';
    c.translate(VW / 2, y); c.scale(sc, sc); c.textAlign = 'center'; c.font = 'bold 110px "Palatino Linotype", "Times New Roman", serif';
    c.lineWidth = 10; c.strokeStyle = 'rgba(30,4,0,.95)'; c.strokeText('FINAL BOSS', 0, 0);
    const g = c.createLinearGradient(0, -90, 0, 10); g.addColorStop(0, '#fff6d8'); g.addColorStop(.45, '#ffb040'); g.addColorStop(1, '#ff3a1a'); c.fillStyle = g; c.shadowColor = '#ff5a2a'; c.shadowBlur = 30; c.fillText('FINAL BOSS', 0, 0); c.shadowBlur = 0;
    c.font = 'italic 24px "Palatino Linotype", serif'; c.fillStyle = '#ffe8c8'; c.fillText(tr('THE ARCHITECT, ASCENDED'), 0, 44);
    c.restore();
};
(function () { const hd = HUD.draw.bind(HUD); HUD.draw = function (c) { hd(c); const F = G.g2final; if (!F) return; F.t = (F.t || 0) + 1; G2.drawFinalCard(c, F); }; })();
