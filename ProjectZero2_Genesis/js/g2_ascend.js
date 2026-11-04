'use strict';
/**
 * THE LAST CARD. At 12% the Architect swallows the Throne and ascends into a false god, and from then
 * on the music is a recorded track and everything is cut to it.
 *
 * Music: "GameChanger" boss theme by Photon Arts and Carameii, https://www.youtube.com/watch?v=K_9j1k3jH-Q
 * Their terms allow it in non-profit projects with this credit; not for commercial use.
 *
 * Measured with FFT tooling: 172.27 BPM, first beat 0.232 s, bars of 1.393 s. The player's own map of
 * the song, snapped to the bar lines the analysis found:
 *   0:00-0:46  the transformation (bars 0-32): the Throne swallowed, the eye opens (bar 7), wings on the
 *              build (8-15), the full god on the drop (16), the halo, the sky breaking (16-32)
 *   0:46-0:49  the name, held on the quiet bars (33-34)
 *   0:49       hard cut to the fight (bar 35)
 *   fight      four sections, each looped until the god's health reaches its mark:
 *              0:49-1:22 (bars 35-59, until 66%), 1:22-1:46 (59-76, until 40%),
 *              1:46-2:07 (76-91, until 15%), 2:07-2:31 (91-108, until 0)
 *   2:31-2:45  dying (bars 108-118): the face of Zero, Day and Night, the glass rain
 *   2:45       death; BOOM, BOOM on bars 120 and 121; silence on 122
 * If its health falls faster than the song, the song skips ahead on the next bar line.
 */
const SONG = { bpm: 172.27, first: .232, beat: 60 / 172.27 };
SONG.bar = SONG.beat * 4; SONG.t = b => SONG.first + b * SONG.bar;
const CUE = { eye: 7, build: 8, drop: 16, name: 33, fight: 35, dying: 108, die: 118, boom1: 120, boom2: 121, end: 122,
    seg: [{ a: 35, b: 59, thr: .66 }, { a: 59, b: 76, thr: .4 }, { a: 76, b: 91, thr: .15 }, { a: 91, b: 108, thr: 0 }] };

/* ------------------------------ THE TRACK ------------------------------ */
G2.song = {
    buf: null, src: null, gain: null, active: false, useAudio: false, last: 0, loop: null, jump: null, p: 0,
    load() {
        if (this.buf || this.loading || !Sound.ok || typeof fetch === 'undefined') return; this.loading = true;
        const url = typeof G2_BOSS_MP3 !== 'undefined' ? G2_BOSS_MP3 : 'assets/boss_final.mp3';
        fetch(url).then(r => r.arrayBuffer()).then(a => Sound.ctx.decodeAudioData(a)).then(b => { this.buf = b; }).catch(e => console.warn('final boss track unavailable', e));
    },
    now() { return this.useAudio ? Sound.ctx.currentTime : (G.time || 0) / 60; },
    start(at = 0) {
        this.stopSrc(); this.active = true; this.loop = null; this.loopKey = null; this.jump = null; this.p = at; Music.stop(.4);
        if (Sound.ok && this.buf) { const c = Sound.ctx; this.gain = c.createGain(); this.gain.gain.value = .5; this.gain.connect(Sound.buses.music); this.src = this.mk(); this.src.start(c.currentTime + .03, at); this.useAudio = true; this.last = c.currentTime + .03; }
        else { this.useAudio = false; this.last = this.now(); if (Sound.ok) Music.cut('g2act3', 'critical'); }
    },
    mk() { const s = Sound.ctx.createBufferSource(); s.buffer = this.buf; s.connect(this.gain); return s; },
    stopSrc() { if (this.src) { try { this.src.stop(); } catch (e) { } this.src = null; } },
    /** Loop a section [a, b) in bars, or null to let the song run on. */
    setLoop(seg) {
        const key = seg ? seg.a + ':' + seg.b : null; if (key === this.loopKey) return; this.loopKey = key; this.loop = seg ? { a: SONG.t(seg.a), b: SONG.t(seg.b) } : null;
        if (this.useAudio && this.src) { if (seg) { this.src.loopStart = this.loop.a; this.src.loopEnd = this.loop.b; } this.src.loop = !!seg; }
    },
    /** Continue from a bar, starting on the next bar line. */
    jumpTo(bar, force) {
        if (this.jump && !force) return; if (this.jump && force && this.useAudio && this.src) { try { this.src.stop(); } catch (e) { } this.src = null; } if (this.jump && force) { this.p = this.jump.to; this.last = this.now(); this.jump = null; }
        const pos = this.p, nb = Math.ceil((pos - SONG.first) / SONG.bar + .001), wait = Math.max(.02, SONG.t(nb) - pos), to = SONG.t(bar), T = this.now() + wait;
        this.setLoop(null); this.jump = { T, to };
        if (this.useAudio) { const old = this.src; if (old) old.stop(T); this.src = this.mk(); this.src.start(T, to); }
    },
    update() {
        if (!this.active) return; const n = this.now(), dt = Math.max(0, n - this.last); this.last = n;
        if (this.jump && n >= this.jump.T) { this.p = this.jump.to + (n - this.jump.T); this.jump = null; } else this.p += dt;
        if (this.loop && this.p >= this.loop.b) this.p -= this.loop.b - this.loop.a;
    },
    pos() { return this.p || 0; },
    bar() { return Math.floor((this.pos() - SONG.first) / SONG.bar); },
    beatN() { return Math.floor((this.pos() - SONG.first) / SONG.beat); },
    stop(fade = 1.5) { if (!this.active) return; this.active = false; this.loopKey = null; if (this.useAudio && this.gain) { const c = Sound.ctx, s = this.src; this.gain.gain.setTargetAtTime(0, c.currentTime, fade / 3); setTimeout(() => { try { s.stop(); } catch (e) { } }, fade * 1000 + 200); } this.src = null; }
};
(function () {
    const tick = G.tick.bind(G); G.tick = function () { G2.song.update(); return tick(); };
    const play = Music.play.bind(Music); Music.play = function (id, st) { if (G2.song.active && !Music.forceCut) return; return play(id, st); };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { if (G2.song.active) G2.song.stop(.5); G.g2fx = null; G.g2title = null; ll(id, cp); if (id === 'architect2') G2.song.load(); };
})();

/* ------------------------------ THE WORLD BREAKS OPEN ------------------------------ */
// Thousands of motes of white energy; the sky turns gold and violet; shafts of light; cracks in the sky.
G2.fx = {
    N: 1400, init() { const N = this.N; this.x = new Float32Array(N); this.y = new Float32Array(N); this.vx = new Float32Array(N); this.vy = new Float32Array(N); this.s = new Float32Array(N); this.ph = new Float32Array(N); for (let i = 0; i < N; i++) this.reset(i, true); this.ok = true; },
    reset(i, any) { this.x[i] = Math.random() * VW; this.y[i] = any ? Math.random() * VH : VH + 10; this.vx[i] = 0; this.vy[i] = 0; this.s[i] = .6 + Math.random() * 1.8; this.ph[i] = Math.random() * TAU; },
    step(F, cx, cy, from, to) {
        if (!this.ok) this.init(); const pull = F.mode === 'pull', t = G.time;
        for (let i = from; i < to; i++) {
            const dx = cx - this.x[i], dy = cy - this.y[i], d = Math.hypot(dx, dy) + 1;
            if (pull) { this.vx[i] += dx / d * .32 - dy / d * .22; this.vy[i] += dy / d * .32 + dx / d * .22; if (d < 40) this.reset(i, true); }
            else { this.vx[i] += Math.sin(t * .01 + this.ph[i]) * .04 - dy / d * .03; this.vy[i] += -.05 + dx / d * .03; if (this.y[i] < -20) this.reset(i, false); }
            this.vx[i] *= .96; this.vy[i] *= .96; this.x[i] += this.vx[i]; this.y[i] += this.vy[i]; if (this.x[i] < -20) this.x[i] = VW + 10; if (this.x[i] > VW + 20) this.x[i] = -10;
        }
    },
    draw(c, F, front) {
        const b = G.boss; if (!b) return; const cam = G.cam, cx = (b.x - cam.x) * cam.zoom, cy = (b.y - 380 - cam.y) * cam.zoom;
        if (!front) {
            const k = U.clamp(F.sky, 0, 1); if (k > 0) { const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, `rgba(60,20,110,${.55 * k})`); g.addColorStop(.55, `rgba(160,90,40,${.35 * k})`); g.addColorStop(1, `rgba(255,210,140,${.25 * k})`); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
                c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,230,170,${.12 * k})`; c.lineWidth = 3; for (let r = 0; r < 4; r++) { c.beginPath(); c.ellipse(cx, cy, 300 + r * 160, (300 + r * 160) * .32, Math.sin(G.time * .002 + r) * .3, 0, TAU); c.stroke(); }
                for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + G.time * .0015; c.fillStyle = `rgba(255,236,190,${.035 * k})`; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a - .04) * 1600, cy + Math.sin(a - .04) * 1600); c.lineTo(cx + Math.cos(a + .04) * 1600, cy + Math.sin(a + .04) * 1600); c.fill(); }
                c.restore(); }
            if (F.cracks > 0) { c.save(); c.strokeStyle = `rgba(255,255,255,${.5 * F.cracks})`; c.lineWidth = 1.6; const R = U.mulberry(41); for (let i = 0; i < 22 * F.cracks; i++) { let x = R() * VW, y = R() * VH * .5; c.beginPath(); c.moveTo(x, y); for (let k2 = 0; k2 < 6; k2++) { x += (R() - .5) * 120; y += R() * 50; c.lineTo(x, y); } c.stroke(); } c.restore(); }
        }
        const N = Math.floor(this.N * U.clamp(F.motes, 0, 1)), from = front ? 0 : 220, to = front ? Math.min(220, N) : N; this.step(F, cx, cy, from, to);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = from; i < to; i++) { const s = this.s[i] * (front ? 1.8 : 1), a = .35 + .3 * Math.sin(G.time * .1 + this.ph[i]); c.fillStyle = `rgba(255,250,235,${a})`; c.fillRect(this.x[i], this.y[i], s, s); if (s > 1.6 && Math.abs(this.vx[i]) + Math.abs(this.vy[i]) > 2) { c.strokeStyle = `rgba(255,240,200,${a * .5})`; c.lineWidth = s * .6; c.beginPath(); c.moveTo(this.x[i], this.y[i]); c.lineTo(this.x[i] - this.vx[i] * 4, this.y[i] - this.vy[i] * 4); c.stroke(); } }
        c.restore();
    }
};
(function () { const bd = Backdrop.draw.bind(Backdrop); Backdrop.draw = function (ctx, id, cam, t, level) { bd(ctx, id, cam, t, level); if (G.g2fx && level && G.level && level === G.level && G.boss) G2.fx.draw(ctx, G.g2fx, false); }; })();

/* ------------------------------ THE GOD ------------------------------ */
// The eye: sclera with veins, a striated iris that follows the player, a slit pupil that widens before it
// strikes, lids that blink, lashes of light, two highlights.
G2.drawEye = function (c, x, y, R, b) {
    const P = G.player, open = U.clamp(b.eye || 0, 0, 1) * (1 - (b.blink || 0)), t = b.anim;
    if (open <= .03) { c.strokeStyle = '#ffe8a0'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - R, y); c.quadraticCurveTo(x, y + R * .2, x + R, y); c.stroke(); return; }
    const look = P ? U.clamp((P.x - b.x) / 600, -1, 1) : 0, lookY = P ? U.clamp((P.y - 40 - (b.y - 380)) / 600, -1, 1) : 0, H = R * .62 * open;
    c.save(); c.beginPath(); c.moveTo(x - R, y); c.bezierCurveTo(x - R * .5, y - H * 1.25, x + R * .5, y - H * 1.25, x + R, y); c.bezierCurveTo(x + R * .5, y + H * 1.25, x - R * .5, y + H * 1.25, x - R, y); c.closePath();
    c.save(); c.clip();
    const sg = c.createRadialGradient(x, y, R * .1, x, y, R); sg.addColorStop(0, '#fffaf0'); sg.addColorStop(.7, '#f0dccc'); sg.addColorStop(1, '#b08070'); c.fillStyle = sg; c.fillRect(x - R, y - R, R * 2, R * 2);
    c.strokeStyle = 'rgba(190,40,40,.55)'; c.lineWidth = 1.4; const Rr = U.mulberry(9); for (let i = 0; i < 14; i++) { const a = Rr() * TAU; let px = x + Math.cos(a) * R, py = y + Math.sin(a) * R * .6; c.beginPath(); c.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (x - px) * .22 + (Rr() - .5) * 10; py += (y - py) * .22 + (Rr() - .5) * 8; c.lineTo(px, py); } c.stroke(); }
    const ix = x + look * R * .35, iy = y + lookY * H * .3, IR = R * .46;
    const ig = c.createRadialGradient(ix, iy, IR * .15, ix, iy, IR); ig.addColorStop(0, '#fff3a0'); ig.addColorStop(.35, '#ffb020'); ig.addColorStop(.75, '#c8401a'); ig.addColorStop(1, '#3a0a04'); c.fillStyle = ig; c.beginPath(); c.arc(ix, iy, IR, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(90,20,0,.6)'; c.lineWidth = 1; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + Math.sin(t * .01) * .05; c.beginPath(); c.moveTo(ix + Math.cos(a) * IR * .32, iy + Math.sin(a) * IR * .32); c.lineTo(ix + Math.cos(a) * IR * .95, iy + Math.sin(a) * IR * .95); c.stroke(); }
    c.strokeStyle = '#1a0402'; c.lineWidth = 3; c.beginPath(); c.arc(ix, iy, IR, 0, TAU); c.stroke();
    const dil = .2 + (b.dilate || 0) * .5; c.fillStyle = '#080102'; c.beginPath(); c.ellipse(ix, iy, IR * dil * .45, IR * .78, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(ix - IR * .35, iy - IR * .38, IR * .16, IR * .1, -.5, 0, TAU); c.fill(); c.beginPath(); c.arc(ix + IR * .3, iy + IR * .25, IR * .06, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = '#2a1408'; c.lineWidth = 5; c.stroke(); c.lineWidth = 2;
    for (let i = 0; i < 13; i++) { const u = (i + .5) / 13, px = x - R + u * 2 * R, py = y - Math.sin(u * Math.PI) * H * .95, a = -Math.PI / 2 + (u - .5) * 1.6, L = 26 + Math.sin(u * Math.PI) * 30 + Math.sin(t * .05 + i) * 4; c.strokeStyle = `rgba(255,232,170,${.8 * open})`; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); c.stroke(); }
    c.restore();
    Paint.glow(c, x + look * R * .35, y, R * .9, '#ff7a20');
};
// Wings with a body: each is a chain of points that trails behind the god as it moves and sways in a slow
// wind, flapping on the bar; feathers are tapered blades along it, drawn softer near the player.
G2.wings = {
    make(b) { b.wingS = []; for (const [side, tier] of [[-1, 0], [1, 0], [-1, 1], [1, 1], [-1, 2], [1, 2]]) { const pts = []; for (let i = 0; i < 7; i++) pts.push({ x: 0, y: 0, ox: 0, oy: 0 }); b.wingS.push({ side, tier, L: [380, 310, 240][tier], n: 7, ang: -(.22 + tier * .42), pts, init: false, k: 0 }); } },
    step(b, cx, cy, grow) {
        if (!b.wingS) this.make(b); const flapT = G2.song.active ? (G2.song.pos() / SONG.bar) * TAU : G.time * .03, vx = b.x - (b.lastX === undefined ? b.x : b.lastX); b.lastX = b.x;
        for (const W of b.wingS) {
            const k = U.clamp(grow - W.tier * 2 - (W.side > 0 ? .5 : 0), 0, 1), L = W.L * (.15 + .85 * k), seg = L / (W.n - 1), flap = Math.sin(flapT + W.tier * .7) * (.14 + W.tier * .03), base = W.ang + flap, ax = cx + W.side * 50, ay = cy - 20 + W.tier * 26;
            for (let i = 0; i < W.n; i++) { const p = W.pts[i], u = i / (W.n - 1), a = base - u * .25 * (1 - W.tier * .2), rx = ax + W.side * Math.cos(a) * seg * i, ry = ay + Math.sin(a) * seg * i + u * u * 20;
                if (!W.init || i === 0) { p.x = rx; p.y = ry; if (!W.init) { p.ox = rx; p.oy = ry; } continue; }
                const nx = p.x + (p.x - p.ox) * .9 - vx * u * .6 + Math.sin(G.time * .02 + i + W.tier) * .35 * u, ny = p.y + (p.y - p.oy) * .9 + .15 * u; p.ox = p.x; p.oy = p.y;
                p.x = U.lerp(nx, rx, .12 + (1 - u) * .2); p.y = U.lerp(ny, ry, .12 + (1 - u) * .2); }
            for (let it = 0; it < 2; it++) for (let i = 1; i < W.n; i++) { const A = W.pts[i - 1], B = W.pts[i], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, f = (d - seg) / d; if (i > 1) { A.x += dx * f * .5; A.y += dy * f * .5; } B.x -= dx * f * .5; B.y -= dy * f * .5; }
            W.init = true; W.k = k;
        }
    },
    draw(c, b, near) {
        if (!b.wingS) return; c.save(); c.lineJoin = 'round';
        for (const W of b.wingS.slice().reverse()) { if (!W.k) continue; const P = W.pts, alpha = (near ? .4 : .8) * W.k;
            for (let row = 2; row >= 0; row--) for (let i = 1; i < W.n; i++) { const A = P[i - 1], B = P[i], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d * W.side, ny = dx / d * W.side, u = i / (W.n - 1);
                for (let f = 0; f < 3; f++) { const m = f / 3, px = A.x + dx * m, py = A.y + dy * m, len = (40 + u * 130 + row * 30) * (1 - row * .22) * W.k, tilt = .35 + u * .45 + row * .1, ex = px + (nx * Math.cos(tilt) + dx / d * Math.sin(tilt)) * len, ey = py + (ny * Math.cos(tilt) + dy / d * Math.sin(tilt)) * len + len * .35, w2 = 7 - row * 1.5;
                    c.globalAlpha = alpha * (row === 0 ? 1 : .8); c.fillStyle = row === 0 ? '#fff8e4' : row === 1 ? '#ecdeff' : '#ffe0aa';
                    c.beginPath(); c.moveTo(px - nx * w2, py - ny * w2); c.quadraticCurveTo((px + ex) / 2 + dx / d * w2 * 2, (py + ey) / 2 + dy / d * w2 * 2, ex, ey); c.quadraticCurveTo((px + ex) / 2 - dx / d * w2, (py + ey) / 2 - dy / d * w2, px + nx * w2, py + ny * w2); c.fill();
                    c.globalAlpha = alpha * .6; c.strokeStyle = row === 0 ? '#c8a050' : '#8a6ad8'; c.lineWidth = 1; c.stroke(); } }
            c.globalAlpha = alpha; c.strokeStyle = '#fff4d0'; c.lineWidth = 6; c.beginPath(); c.moveTo(P[0].x, P[0].y); for (const p of P) c.lineTo(p.x, p.y); c.stroke();
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * .4; c.lineWidth = 18; c.strokeStyle = '#ffd890'; c.stroke(); c.globalCompositeOperation = 'source-over'; }
        c.restore();
    }
};
G2.drawAscended = function (c, b) {
    if (b.gone) return; const x = b.x, y = b.y - 380, t = b.anim, ab = b.absorb || 0, P = G.player, near = P && Math.abs(P.x - x) < 560 && P.y > y - 200;
    G2.wings.step(b, x, y, b.wings || 0);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .9; c.drawImage(Glow.get('#ffe8a0'), x - 380, y - 380, 760, 760); c.restore();
    // the robe of light reaching down to the floor, where it can be struck; faint, so the player shows through
    const rg = c.createLinearGradient(0, y, 0, b.A.y); rg.addColorStop(0, 'rgba(255,240,200,.5)'); rg.addColorStop(1, 'rgba(200,170,255,.05)'); c.fillStyle = rg; c.beginPath(); c.moveTo(x - 50, y + 40); c.quadraticCurveTo(x - 140 - Math.sin(t * .03) * 20, b.A.y - 100, x - 170, b.A.y); c.lineTo(x + 170, b.A.y); c.quadraticCurveTo(x + 140 + Math.sin(t * .03) * 20, b.A.y - 100, x + 50, y + 40); c.fill();
    G2.wings.draw(c, b, near);
    for (let r = 0; r < 4; r++) { c.save(); c.translate(x, y); c.rotate((b.rings ? b.rings[r % 3] : 0) * (1 + r * .3) + t * .004 * (r % 2 ? -1 : 1)); c.scale(1, .28 + r * .16); const R = (230 - r * 26) * (1 - ab * .5 + (b.eye ? .55 : 0));
        c.strokeStyle = r % 2 ? 'rgba(200,176,255,.85)' : 'rgba(255,216,107,.9)'; c.lineWidth = 7 - r; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, ex = Math.cos(a) * R, ey = Math.sin(a) * R; Paint.disc(c, ex, ey, 7, '#f0e8d0'); Paint.disc(c, ex + Math.cos(a) * 1.5, ey, 3.5, b.eye ? '#ff4a1a' : '#3a2a10'); } c.restore(); }
    c.save(); c.translate(x, y); c.rotate(t * .005); for (let i = 0; i < 28; i++) { c.rotate(TAU / 28); c.fillStyle = i % 2 ? 'rgba(255,232,160,.75)' : 'rgba(200,176,255,.55)'; c.beginPath(); c.moveTo(-6, -170); c.lineTo(0, -260 - (i % 3) * 26); c.lineTo(6, -170); c.fill(); } c.restore();
    Paint.glow(c, x, y, 190, '#ffffff'); const cg = c.createRadialGradient(x, y, 20, x, y, 120); cg.addColorStop(0, '#fffdf4'); cg.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = cg; c.beginPath(); c.arc(x, y, 120, 0, TAU); c.fill();
    if (!b.open) G2.drawEye(c, x, y, 92, b);
    else { c.fillStyle = '#1a1a24'; c.beginPath(); c.arc(x, y, 64, 0, TAU); c.fill(); c.fillStyle = '#00ffff'; c.fillRect(x - 4, y - 32, 8, 50); Paint.disc(c, x, y - 40, 10, '#1a1a24'); c.fillStyle = 'rgba(200,240,255,.9)'; c.fillRect(x + 5, y - 38 + (t % 20) * .7, 2, 5); }
    if (b.crack) { c.strokeStyle = `rgba(255,255,255,${b.crack})`; c.lineWidth = 2.4; const R = U.mulberry(3); for (let i = 0; i < 22 * b.crack; i++) { c.beginPath(); let px = x, py = y; c.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (R() - .5) * 220; py += (R() - .5) * 200; c.lineTo(px, py); } c.stroke(); } }
    if (b.slashGold) { c.strokeStyle = '#ffd86b'; c.lineWidth = 12; c.beginPath(); c.moveTo(x - 420, y - 340); c.lineTo(x + 420, y + 340); c.stroke(); }
    if (b.slashNight) { c.strokeStyle = '#8a5aff'; c.lineWidth = 12; c.beginPath(); c.moveTo(x + 420, y - 340); c.lineTo(x - 420, y + 340); c.stroke(); }
    if (P && near) { c.strokeStyle = 'rgba(180,140,255,.9)'; c.lineWidth = 2; c.beginPath(); c.ellipse(P.x, P.y, 26, 7, 0, 0, TAU); c.stroke(); }
};

/* ------------------------------ THE TRANSFORMATION, 0:00-0:49 ------------------------------ */
const waitBar = function* (bar) { while (G2.song.pos() < SONG.t(bar) - .008) yield 1; };
G2.ascendIntro = function* (b) {
    const S = G2.song, P = G.player; G.warns = []; G.projs = G.projs.filter(p => p.friendly); G.g2night = 0; G.g2xf = null; G.g2grav = 1; G.level.forceNyx = false; b.spin = 0; b.rot = 0;
    for (const e of G.enemies) if (!e.boss && !e.dead) { e.hp = 0; e.die({ dir: 0 }); }
    G.lockInput = true; G.letterbox = 1; const cx = (b.A.x0 + b.A.x1) / 2; G.cineCam = { x: cx, y: b.A.y - 300, zoom: .9 };
    G.say('THE ARCHITECT', 'THEN I WILL PLAY MY LAST CARD.', 150);
    S.start(0); b.ascended = 1; b.wings = 0; b.eye = 0; b.absorb = 0; b.open = 0; b.wingS = null; b.lb = -1; G.g2fx = { sky: 0, motes: 0, cracks: 0, mode: 'pull' };
    yield* b.moveTo(cx, b.A.y + 40, 60);
    // 0:00-0:10 it swallows the Throne: the rings fall in, the light is drawn towards it
    while (S.pos() < SONG.t(CUE.eye)) { const k = S.pos() / SONG.t(CUE.eye); b.absorb = k; G.g2fx.motes = .2 + k * .5; G.g2fx.sky = k * .3; G.cineCam.zoom = .9 + k * .35; G.cineCam.y = b.A.y - 300 - k * 80; if (S.bar() !== b.lb) { b.lb = S.bar(); G.flash = .1; G.addShake(2 + k * 5); } yield 1; }
    // 0:10 the eye opens
    G.flash = 1; G.addShake(24); b.eye = 1; b.dilate = 1; G.g2fx.cracks = .2; VFX.ring(b.x, b.y - 380, 600, '#ffffff', 30, 14); G.say('NYX', 'It is opening its eye...', 100); G.cineCam.zoom = 1.6; G.cineCam.y = b.y - 380;
    yield* waitBar(CUE.build);
    // 0:11-0:22 the build: wings unfold, the sky gives way
    while (S.pos() < SONG.t(CUE.drop) - .02) { const k = (S.pos() - SONG.t(CUE.build)) / (SONG.t(CUE.drop) - SONG.t(CUE.build)); b.wings = k * 6; b.dilate = .5; G.g2fx.sky = .3 + k * .4; G.g2fx.motes = .7 + k * .3; G.cineCam.zoom = U.lerp(1.6, .85, k); G.cineCam.y = b.y - 380;
        if (S.bar() !== b.lb) { b.lb = S.bar(); G.addShake(3 + k * 8); G.flash = .15; if (b.lb === 10) G.say('ZERO', 'This is its last card.', 100); if (b.lb === 13) G.say('NYX', 'Then this is ours. Together, Uncle!', 110); } yield 1; }
    // 0:22 the drop: the god in full, the sky breaking
    b.wings = 6; G.flash = 1; G.addShake(34); G.g2fx.mode = 'swirl'; G.g2fx.sky = 1; G.g2fx.cracks = .6; G.g2fx.motes = 1; for (let i = 0; i < 4; i++) VFX.ring(b.x, b.y - 380, 400 + i * 260, i % 2 ? '#c8b0ff' : '#ffe8a0', 30 + i * 8, 16); G.cineCam.zoom = .75;
    // 0:22-0:46 the reveal: the camera circles the god, the party draws, it looks at Nyx
    while (S.pos() < SONG.t(CUE.name) - .02) { const bar = S.bar(), k = (S.pos() - SONG.t(CUE.drop)) / (SONG.t(CUE.name) - SONG.t(CUE.drop));
        G.cineCam.x = cx + Math.sin(k * Math.PI * 2) * 220; G.cineCam.y = b.y - 380 + Math.cos(k * Math.PI * 2) * 60; G.cineCam.zoom = .75 + Math.sin(k * Math.PI) * .45; G.g2fx.cracks = .6 + k * .4;
        if (bar !== b.lb) { b.lb = bar; G.addShake(bar % 4 === 0 ? 10 : 4); if (bar % 4 === 0) { G.flash = .35; VFX.ring(b.x, b.y - 380, 700, '#ffe8a0', 26, 10); } b.dilate = bar % 2;
            if (bar === 18) G.say('VESPER', 'It is not a god. It is every hurt he never let heal.', 150); if (bar === 22) G.say('ROOK', 'Then we hurt it back. Shields up!', 110); if (bar === 26) G.say('ZERO', 'Nyx. Lead.', 100); if (bar === 29) G.say('NYX', 'Everyone. Together!', 120); }
        yield 1; }
    // 0:46 the name, held on the quiet bars
    G.lines = []; G.sayQ = []; G.sayCur = null; G.g2title = { name: tr('THE ARCHITECT, ASCENDED'), sub: tr('THE GOD THAT WAS NEVER ASKED FOR'), t: 0 }; G.cineCam = { x: b.x, y: b.y - 380, zoom: 1.25 };
    yield* waitBar(CUE.fight);
    // 0:49 hard cut to the fight, with a fresh health bar
    G.g2title = null; G.flash = .9; G.addShake(26); G.letterbox = 0; G.cineCam = null; G.lockInput = false; P.inv = Math.max(P.inv, 60);
    b.maxHp = b.hp = Math.round(4800 * Game.diff.bossHp); b.hbar = 1; b.dilate = 0;
};

/* ------------------------------ THE FIGHT, CUT TO THE SONG ------------------------------ */
G2.ascendSeg = b => { const f = b.hp / b.maxHp; let k = 0; while (k < CUE.seg.length - 1 && f <= CUE.seg[k].thr) k++; return k; };
G2.ascendBeat = function (b, bar, bi) {
    const A = b.A, P = G.player, tele = Math.round(SONG.beat * 60 * 2), seg = CUE.seg.findIndex(s => bar >= s.a && bar < s.b), cy = b.y - 380;
    if (bi === 0) { G.addShake(2); if (bar % 4 === 0) VFX.ring(b.x, cy, 300, '#ffe8a0', 18, 6); }
    // every attack leaves a way out: a gap, a jump, or a dodge through
    const pillar = (x, w = 110) => { x = U.clamp(x, A.x0 + w / 2, A.x1 - w / 2); Combat.warn({ shape: 'rect', x: x - w / 2, y: A.y - 620, w, h: 620, t: tele, dmg: b.D(16), src: b, col: '#ffe8a0', onFire: () => { VFX.burst(x, A.y - 10, '#fff4d0', 24, 9, 30, 8, 1); VFX.ring(x, A.y - 20, 120, '#ffe8a0', 14, 6); G.addShake(5); } }); };
    const sweep = high => Combat.warn({ shape: 'rect', x: A.x0, y: high ? A.y - 200 : A.y - 76, w: A.x1 - A.x0, h: high ? 100 : 76, t: tele + 10, dmg: b.D(15), src: b, col: high ? '#c8b0ff' : '#ffe8a0', onFire: () => { VFX.slash(b.x, high ? A.y - 150 : A.y - 40, 900, P.x > b.x ? 1 : -1, high ? '#e8dcff' : '#fff0c8'); G.addShake(8); } });
    const volley = (n, sp = .14) => { b.dilate = 1; for (let i = 0; i < n; i++) { const a = Math.atan2(P.y - 36 - cy, P.x - b.x) + (i - (n - 1) / 2) * sp; Combat.eshoot(b, 'bolt', b.x, cy + 40, a, 11, b.D(10), { r: 7, life: 150, col: '#ffd0a0', len: 30 }); } };
    const ring = n => { for (let i = 0; i < n; i++) Combat.eshoot(b, 'orb', b.x, cy, i / n * TAU + bar * .2, 4.6, b.D(9), { r: 10, life: 220, col: '#ffe8a0' }); };
    const feathers = n => { for (let i = 0; i < n; i++) { const x = U.rand(A.x0 + 40, A.x1 - 40); Combat.warn({ shape: 'rect', x: x - 18, y: A.y - 520, w: 36, h: 520, t: tele + i * 3, dmg: b.D(11), src: b, col: '#e8dcff' }); } };
    if (seg === 0) { if (bi === 0) { const gap = U.pick([-1, 1]); pillar(P.x); pillar(P.x + gap * 300); } if (bi === 2) volley(5); if (bi === 0 && bar % 4 === 3) ring(14); }
    else if (seg === 1) { if (bi === 0) sweep(false); if (bi === 2) sweep(true); if (bi === 1) feathers(5); if (bi === 3 && bar % 2) volley(3, .25); }
    else if (seg === 2) { if (bi === 0 && bar % 2 === 0) { const dir = P.x > b.x ? -1 : 1, x0 = dir > 0 ? A.x0 : A.x1; b.dilate = 1; for (let k = 0; k < 8; k++) { const x = x0 + dir * k * (A.x1 - A.x0) / 8; Combat.warn({ shape: 'rect', x: Math.min(x, x + dir * 130), y: A.y - 420, w: 130, h: 420, t: tele + k * 6, dmg: b.D(17), src: b, col: '#ff8a4a' }); } } if (bi === 2) pillar(P.x, 90); if (bi === 3) volley(4, .2); }
    else if (seg === 3) { const k = bar % 4; if (bi === 0 && k === 0) { const w = (A.x1 - A.x0) / 8, odd = (bar >> 2) % 2; for (let i = 0; i < 8; i++) if ((i % 2 === 1) === !!odd) Combat.warn({ shape: 'rect', x: A.x0 + i * w, y: A.y - 620, w, h: 620, t: tele * 2, dmg: b.D(16), src: b, col: '#ffe8a0' }); } if (bi === 0 && k === 2) sweep(bar % 8 < 4); if (bi === 2) volley(5, .12); if (bi === 0 && k === 1) ring(18); if (bi === 2 && k === 3) feathers(6); }
};
const ASCEND_MOVES = { *conduct(b) { let last = -1; for (; ;) { const n = G2.song.beatN(); if (n !== last && !b.dead && !b.dying) { last = n; G2.ascendBeat(b, Math.floor(n / 4), ((n % 4) + 4) % 4); } if (b.dilate > 0) b.dilate = Math.max(0, b.dilate - .02); yield 1; } } };
// The song follows the health bar: loop the section until the mark is reached, skip ahead if it falls faster.
G2.ascendMusic = function (b) {
    const S = G2.song; if (!S.active || b.dying || b.dead || b.hp <= 0 || b.transition || !b.ascended || S.jump) return;
    const pos = S.pos(), cur = CUE.seg.findIndex(s => pos >= SONG.t(s.a) && pos < SONG.t(s.b)); if (cur < 0) return;
    const want = G2.ascendSeg(b), f = b.hp / b.maxHp;
    if (want > cur && pos > SONG.t(CUE.seg[cur].a) + SONG.bar * 4 && pos < SONG.t(CUE.seg[cur].b) - SONG.bar) { S.jumpTo(CUE.seg[want].a); return; }
    S.setLoop(f > CUE.seg[cur].thr ? CUE.seg[cur] : null);
};

/* ------------------------------ DYING, 2:31-2:45, AND DEATH ------------------------------ */
G2.ascendDeath = function* (b) {
    const S = G2.song; b.dying = 1; G.lockInput = true; G.warns = []; G.projs = G.projs.filter(p => p.friendly); G.letterbox = 1; G.cineCam = { x: b.x, y: b.y - 380, zoom: 1.15 };
    S.setLoop(null); if (S.pos() < SONG.t(CUE.dying) - .05 || S.jump) S.jumpTo(CUE.dying, true); yield 2; yield* waitBar(CUE.dying);
    b.blink = 1; b.open = 1; G.flash = .6; G.addShake(12); if (G.g2fx) G.g2fx.mode = 'pull';
    G.say('ZERO, AS HE WAS ON THE ALTAR', 'I am what he forgave... and never healed.', Math.round(SONG.bar * 60 * 3));
    yield* waitBar(CUE.dying + 4);
    G.say('NYX', 'Then let us heal you. Uncle, now!', Math.round(SONG.bar * 60 * 1.5));
    yield* waitBar(CUE.dying + 6);
    Sound.sfx('swing_h'); G.flash = .7; G.addShake(16); b.slashGold = 1; VFX.slash(b.x, b.y - 380, 400, 1, '#ffd86b');
    while (S.pos() < SONG.t(CUE.dying + 6) + SONG.beat * 2) yield 1;
    Sound.sfx('swing_h'); G.flash = .7; G.addShake(16); b.slashNight = 1; VFX.slash(b.x, b.y - 380, 400, -1, '#8a5aff'); G.g2title = { name: tr('DAY AND NIGHT'), sub: '', t: 0 };
    let lb = -1; while (S.pos() < SONG.t(CUE.die) - .01) { const n = S.beatN(); if (n !== lb) { lb = n; b.crack = Math.min(1, (b.crack || 0) + .04); for (let i = 0; i < 14; i++) VFX.add(b.x + U.rand(-600, 600), b.y - 760 + U.rand(-100, 60), U.rand(-1, 1), U.rand(3, 7), i % 2 ? '#ffe8a0' : '#cfe8ff', 90, 3, 1, 0); if (n % 4 === 0) G.addShake(5); } G.cineCam.zoom = Math.max(.8, G.cineCam.zoom - .0007); if (S.bar() >= CUE.dying + 8) G.g2title = null; yield 1; }
    // 2:45 death, then the two last hits
    G.flash = 1; G.addShake(20); b.wings = 0; G.say('', tr('The false god shattered into a million pieces of glass, falling like shooting stars.'), Math.round(SONG.bar * 60 * 2));
    for (const hit of [CUE.boom1, CUE.boom2]) { yield* waitBar(hit); G.flash = 1; G.addShake(36); Sound.sfx('bigboom'); for (let i = 0; i < 5; i++) VFX.ring(b.x, b.y - 380, 300 + i * 240, i % 2 ? '#8a5aff' : '#ffe8a0', 30 + i * 6, 16); VFX.burst(b.x, b.y - 380, '#ffffff', 90, 15, 60, 12, 1); if (hit === CUE.boom2) { b.gone = true; if (G.g2fx) { G.g2fx.sky = 0; G.g2fx.cracks = 0; } } }
    yield* waitBar(CUE.end); G.flash = 1; S.stop(3); yield 90;
    G.g2fx = null; G.cineCam = null; G.letterbox = 0; G.lockInput = false; G2.F.setAct(4); G2.cut('g2choiceScene', () => G2.throneChoice());
};

/* ------------------------------ WIRING ------------------------------ */
(function () {
    const B = BOSSES.architect2, draw = B.draw, tick = B.tick, death = B.death;
    B.phases.push({ at: .12, moves: ['conduct'], rest: 0, enter: G2.ascendIntro });
    Object.assign(B.moves, ASCEND_MOVES);
    B.draw = (c, b) => (b.ascended ? G2.drawAscended(c, b) : draw(c, b));
    B.tick = b => {
        tick(b); if (!b.ascended) return;
        if (!b.dying) b.open = 0; b.dmgTakenMult = b.transition ? 0 : 1; G.g2xf = null; G.g2night = 0;
        if (!b.transition && !b.dying) { b.y = b.A.y + 40 + Math.sin(b.anim * .02) * 14; b.x = (b.A.x0 + b.A.x1) / 2 + Math.sin(b.anim * .006) * 160; }
        if (b.blink > 0 && !b.dying) b.blink = Math.max(0, b.blink - .1); else if (!b.dying && Math.random() < .004) b.blink = 1;
        Light.add(b.x, b.y - 380, 600, '#ffe8a0', 1); G2.ascendMusic(b);
    };
    B.aim = b => (b.ascended ? { x: b.x, y: b.y - 260 } : { x: b.x, y: b.y - 200 });
    B.box = b => (b.ascended ? { x: b.x - 120, y: b.y - 470, w: 240, h: 470 } : { x: b.x - 110, y: b.y - 320, w: 220, h: 240 });
    B.death = b => (b.ascended ? G2.ascendDeath(b) : death(b));
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) {
        if (G.g2fx && G.boss) G2.fx.draw(c, G.g2fx, true);
        hd(c); const T = G.g2title; if (!T) return; T.t++; const a = Math.min(1, T.t / 8);
        c.save(); c.globalAlpha = a; c.fillStyle = 'rgba(6,4,12,.72)'; c.fillRect(0, VH / 2 - 78, VW, 130); c.fillStyle = 'rgba(255,216,107,.9)'; c.fillRect(0, VH / 2 - 78, VW, 2); c.fillRect(0, VH / 2 + 50, VW, 2);
        c.textAlign = 'center'; c.font = 'bold 64px "Palatino Linotype", "Times New Roman", serif'; c.lineWidth = 6; c.strokeStyle = 'rgba(40,10,0,.9)'; c.strokeText(T.name, VW / 2, VH / 2); c.fillStyle = '#fff6d8'; c.shadowColor = '#ffb040'; c.shadowBlur = 24; c.fillText(T.name, VW / 2, VH / 2); c.shadowBlur = 0;
        if (T.sub) { c.fillStyle = '#d8c8ff'; c.font = 'italic 22px "Palatino Linotype", serif'; c.fillText(T.sub, VW / 2, VH / 2 + 36); } c.restore();
    };
})();
// The last card is a checkpoint: whoever falls hands over to the next of the party; if everyone falls,
// the fight goes back to the start of its current section.
(function () {
    const hurt = Player.prototype.hurt;
    Player.prototype.hurt = function (dmg, src) {
        const b = G.boss; if (this === G.player && b && b.ascended && !b.dying && !b.dead && !b.transition && this.hp - dmg * (Game.diff.dmgTaken || 1) <= 0 && this.inv <= 0) {
            G.partyDown = G.partyDown || {}; G.partyDown[this.id] = 1; const next = G2.party().find(id => !G.partyDown[id]);
            if (next) { G.flash = .5; G.say(CHARS[this.id].name, tr('I am down... keep going!'), 100); G2.swapParty(next); G.player.hp = G.player.maxHp; G.player.inv = 90; return false; }
            G.partyDown = {}; G.flash = 1; G.toast('Everyone fell. Again, from the start of this section.', '#ffe8a0'); const k = G2.ascendSeg(b); b.hp = Math.round(b.maxHp * (k ? CUE.seg[k - 1].thr : 1)); G.warns = []; G.projs = G.projs.filter(p => p.friendly); this.hp = this.maxHp; this.inv = 180; G2.song.start(SONG.t(CUE.seg[k].a)); return false;
        }
        return hurt.call(this, dmg, src);
    };
})();
Object.assign(VI, {
    'THEN I WILL PLAY MY LAST CARD.': 'VẬY TA SẼ TUNG CON BÀI CUỐI CÙNG.', 'It is opening its eye...': 'Nó đang mở mắt...', 'This is its last card.': 'Đây là con bài cuối cùng của nó.', 'Then this is ours. Together, Uncle!': 'Vậy đây cũng là của mình. Cùng nhau, chú ơi!',
    'It is not a god. It is every hurt he never let heal.': 'Nó không phải thần. Nó là mọi vết thương hắn chưa từng để lành.', 'Then we hurt it back. Shields up!': 'Vậy thì đánh trả. Giơ khiên lên!', 'Nyx. Lead.': 'Nyx. Dẫn đường.', 'Everyone. Together!': 'Mọi người. Cùng nhau!',
    'THE ARCHITECT, ASCENDED': 'THE ARCHITECT HÓA THẦN', 'THE GOD THAT WAS NEVER ASKED FOR': 'Vị thần không ai cầu xin', 'Then let us heal you. Uncle, now!': 'Vậy để bọn em chữa lành cho. Chú ơi, ngay bây giờ!',
    'The false god shattered into a million pieces of glass, falling like shooting stars.': 'Vị thần giả vỡ thành hàng triệu mảnh kính, rơi như mưa sao băng.',
    'Final boss theme': 'Nhạc boss cuối', 'I am down... keep going!': 'Tôi gục rồi... đánh tiếp đi!', 'Everyone fell. Again, from the start of this section.': 'Cả đội đã gục. Làm lại từ đầu đoạn này.'
});
