/* TRAILER DIRECTOR. Runs inside the built game page and renders the Part II teaser one frame at a time.
 * Every shot is made from the game itself: its cut-scene stages and characters, or live fights with a
 * hand-driven camera. All frames go through one cinematic finish: 2.39:1 frame, teal-and-amber grade,
 * vignette, film grain, flashes on the music's hits, trailer type.
 * The music (Epic Action Cinematic Teaser, no copyright) is 120 BPM: a bar every 2 s from 0.62 s.
 * TR.render(frame) draws frame `frame` (30 fps) of the 70.6 s trailer. */
(function () {
'use strict';
const FPS = 30, W = VW, H = VH, BAR = h => .62 + 2 * h;
const HITS_BIG = [.62, 8.62, 16.6, 24.66, 32.72, 40.7, 52.66, 60.76, 64.62], HITS = [1.28, 10.6, 12.64, 18.36, 20.62, 22.6, 26.64, 28.66, 30.1, 30.54, 31.76, 34.92, 36.38, 38.7, 42.72, 44.24, 44.72, 45.24, 45.74, 46.74, 53.74, 54.76, 55.74, 56.74, 57.76, 58.74, 59.76];
const ease = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------ the world, driven by hand ------------------------------ */
const R = {
    quiet() { R.inputFn = null; Sound.ok = false; HUD.draw = () => {}; Combat.drawWarns = () => {}; VFX.text = () => {}; if (G.level) for (const d of G.level.dyn) if (d.kind === 'gate') d.ghosted = true; G2.term.godMode = true; Settings.quality = 2; G.toasts = []; },
    T(n) { for (let i = 0; i < n; i++) { if (UI.cur) { if (UI.cur === 'g2teamup') { UI.act('g2team', '1'); } UI.hide(); Game.state = 'play'; } if (Cine.active) Cine.finish(); G.tick(); Input.endTick(); G.toasts = []; G.sayQ = []; G.sayCur = null; } },
    // a boss of an earlier day, already fighting, the player swinging at it
    boss(id, warm = 150) {
        G2.term.toBoss(id); R.quiet(); let k = 0; while (G.boss && G.boss.intro && k++ < 3000) R.T(1);
        R.bot = true; R.T(warm);
    },
    // the final form at a given second of its song; seg: force a health section first
    final(pos, opt = {}) {
        G2.term.toBoss('architect2'); R.quiet(); G2.team.want = opt.team !== false; let k = 0;
        while (G.boss && G.boss.intro && k++ < 3000) R.T(1);
        const B = G.boss; B.phase = 4; B.bag = []; B.hp = Math.round(B.maxHp * .12) + 1; B.untargetable = false; B.dmgTakenMult = 1; B.hurt(10, {});
        k = 0; while (!(G2.song.active && G2.song.pos() >= pos) && k++ < 60 * 200) { R.T(1); if (opt.hp !== undefined && G.boss.ascended && G2.song.pos() > 50) G.boss.hp = Math.round(G.boss.maxHp * opt.hp); }
        if (opt.seg !== undefined) { k = 0; while (k++ < 60 * 120) { const p = G2.song.pos(), cur = CUE.seg.findIndex(s => p >= SONG.t(s.a) && p < SONG.t(s.b)); if (cur >= opt.seg) break; G.boss.hp = Math.min(G.boss.hp, Math.round(G.boss.maxHp * (CUE.seg[Math.max(0, opt.seg - 1)].thr - .01))); R.T(1); } G.boss.rage = G.boss.rageT = opt.seg; }
        R.bot = !!opt.bot;
    },
    // the god's death, up to a moment before Day and Night
    death(beforeBeats) { R.final(54, { team: true }); const B = G.boss; B.hp = 1; B.hurt(99999, {}); const T0 = SONG.t(CUE.dying + 6); let k = 0; while (G2.song.pos() < T0 - beforeBeats * SONG.beat && k++ < 60 * 60) R.T(1); },
    level(id, x) { Game.loadLevel(id); Game.state = 'play'; R.quiet(); if (x !== undefined) { G.player.x = x; } R.T(30); },
    // the player's hands while a shot runs: towards the boss, swinging
    botInput() { if (R.inputFn) { Input.simulated = R.inputFn(); return; } const P = G.player, b = G.boss; const S = Input.simulated = {}; if (!R.bot || !b || b.dead) return; const a = b.aim(), dx = a.x - P.x; if (Math.abs(dx) > 70) S[dx > 0 ? 'right' : 'left'] = true; else P.facing = Math.sign(dx) || 1; if (G.time % 4 === 0) S['!attack'] = S.attack = true; if (a.y < P.y - 150 && P.grounded && G.time % 26 === 0) S['!jump'] = S.jump = true; if (G.time % 90 === 0) S['!skill1'] = true; },
    cam(cx, cy, z) { const c = G.cam; c.zoom = c.tz = z; c.x = cx - W / 2 / z; c.y = cy - H / 2 / z; },
    acc: 0,
    // advance the world by `speed` ticks (60 a second, so 2 per frame is real time) and draw it
    world(speed, camFn) { R.acc += speed; while (R.acc >= 1) { R.botInput(); G.tick(); Input.endTick(); G.toasts = []; R.acc -= 1; } if (camFn) camFn(); Game.render(); }
};

/* ------------------------------ cut-scene stages, posed by hand ------------------------------ */
const actor = (id, x, y, facing, clip, o = {}) => { const r = new Rig(CHARS[id].style); if (o.age) r.S = nyxStyle(o.age); r.owner = { element: 0, charge: 0 }; r.play(clip || 'idle', 0); const a = Object.assign({ id, x, y, facing, rig: r, vx: 0, scale: 2 }, o); if (id === 'zero' && o.blade) G2.bladeZero(a); return a; };
const stageDraw = (c, fn, st, C, actors, z, px, py) => {
    c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2 + (px || 0), -H / 2 + (py || 0));
    fn(c, st, C);
    for (const a of actors) { a.x += a.vx; a.rig.ground = true; a.rig.gaitAmt = a.vx ? 1 : .2; a.rig.phase += Math.abs(a.vx) / 11; a.rig.tick(); a.rig.updateChain(a.x, a.y, a.facing, -a.vx * .3);
        c.save(); if (a.glow) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a.glowA || .5; c.drawImage(Glow.get(a.glow), a.x - 70 * a.scale / 2, a.y - 110 * a.scale / 2, 140 * a.scale / 2, 130 * a.scale / 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
        c.translate(a.x, a.y); c.scale(a.scale, a.scale); c.translate(-a.x, -a.y); a.rig.draw(c, a.x, a.y, a.facing, a.alpha === undefined ? 1 : a.alpha); c.restore(); }
    c.restore();
};

/* ------------------------------ type ------------------------------ */
const type = (c, text, o) => {
    const { y = H / 2, size = 40, sp = 12, alpha = 1, col = '#f4ecdc', glow = '#ffb060', scale = 1, font = '"Palatino Linotype", "Book Antiqua", "Times New Roman", serif', weight = '', italic = false } = o;
    if (alpha <= 0) return; c.save(); c.globalAlpha = alpha; c.translate(W / 2, y); c.scale(scale, scale);
    c.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`; c.textBaseline = 'middle'; const chars = [...text], ws = chars.map(ch => c.measureText(ch).width + sp), tot = ws.reduce((a, b) => a + b, 0) - sp; let x = -tot / 2;
    c.textAlign = 'left'; for (let i = 0; i < chars.length; i++) { c.shadowColor = glow; c.shadowBlur = 18; c.fillStyle = col; c.fillText(chars[i], x, 0); x += ws[i]; }
    c.restore();
};
// a line in, held, out; letters drift apart slowly as in trailer cards
const card = (c, lt, dur, text, o = {}) => { const a = Math.min(1, lt / .35, (dur - lt) / .4); type(c, text, Object.assign({ alpha: a, sp: (o.sp || 12) + lt * 2.2, scale: 1 + lt * .012 }, o)); };
const sub = (c, who, text, a) => { if (a <= 0) return; c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = 'bold 13px "Palatino Linotype", serif'; c.fillStyle = '#ffb060'; c.fillText(who, W / 2, H - 132); c.font = 'italic 22px "Palatino Linotype", serif'; c.fillStyle = '#f4ecdc'; c.shadowColor = '#000'; c.shadowBlur = 8; c.fillText(text, W / 2, H - 108); c.restore(); };

/* ------------------------------ the finish on every frame ------------------------------ */
let grain = null;
const post = (c, T, shot) => {
    c.save();
    // grade: cool shadows, warm light
    c.globalCompositeOperation = 'soft-light'; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shot.cool || '#1a3a5a'); g.addColorStop(.5, 'rgba(128,128,128,0)'); g.addColorStop(1, shot.warm || '#ff9a40'); c.globalAlpha = shot.grade === undefined ? .55 : shot.grade; c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const v = c.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .72); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.62)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    // a light leak drifting across on the big shots
    if (shot.leak) { const lx = (T * 90) % (W * 1.6) - W * .3; c.globalCompositeOperation = 'lighter'; c.globalAlpha = .18; c.drawImage(Glow.get('#ff8a3a'), lx - 400, -200, 800, 700); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    // anamorphic streak on a bright point
    if (shot.flare) { const [fx, fy, fa] = shot.flare(T); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 * (fa === undefined ? 1 : fa); c.drawImage(Glow.get('#9ad8ff'), fx - 700, fy - 10, 1400, 20); c.drawImage(Glow.get('#ffffff'), fx - 260, fy - 4, 520, 8); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    // flashes on the hits
    let fl = 0; for (const h of HITS_BIG) if (T >= h && T < h + .5) fl = Math.max(fl, (1 - (T - h) / .5) * .85); for (const h of HITS) if (T >= h && T < h + .25) fl = Math.max(fl, (1 - (T - h) / .25) * .35);
    if (shot.noFlash) fl = 0; if (fl > 0) { c.fillStyle = `rgba(255,248,236,${fl})`; c.fillRect(0, 0, W, H); }
    // grain
    if (!grain) { grain = U.canvas(256, 256); const x = grain.getContext('2d'), im = x.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const n = 128 + (Math.random() - .5) * 130; im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); }
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = .08; const ox = -((T * 977) % 256), oy = -((T * 613) % 256); for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) c.drawImage(grain, x, y);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // fade from or to black
    const fa = shot.fade ? shot.fade(T - shot.t0, shot.t1 - shot.t0) : 0; if (fa > 0) { c.fillStyle = `rgba(0,0,0,${fa})`; c.fillRect(0, 0, W, H); }
    // the frame: 2.39:1
    const bar = Math.round((H - W / 2.39) / 2); c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    c.restore();
};
const fadeIO = (fin, fout) => (lt, d) => Math.max(fin ? clamp(1 - lt / fin, 0, 1) : 0, fout ? clamp(1 - (d - lt) / fout, 0, 1) : 0);

/* ------------------------------ the shots ------------------------------ */
// stage shots keep their actors and their own clock
const stageShot = (t0, t1, fn, cast, o = {}) => ({ t0, t1, kind: 'stage', setup() { this.st = o.st0 || 0; this.C = Object.assign({}, o.C || {}); this.actors = cast(); },
    draw(c, lt, u) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); this.st += o.speed || 1; o.each && o.each(this, lt, u); const z = lerp(o.z0 || 1, o.z1 || 1.08, ease(u)); stageDraw(c, fn, this.st, this.C, this.actors, z, lerp(o.px0 || 0, o.px1 || 0, ease(u)), lerp(o.py0 || 0, o.py1 || 0, ease(u))); o.over && o.over(c, lt, u, this); },
    cool: o.cool, warm: o.warm, grade: o.grade, leak: o.leak, fade: o.fade });
const liveShot = (t0, t1, setup, o = {}) => ({ t0, t1, kind: 'live', setup() { R.acc = 0; setup(); this.base = o.base ? o.base() : null; },
    draw(c, lt, u) { R.world(o.speed === undefined ? 2 : (typeof o.speed === 'function' ? o.speed(lt, u) : o.speed), () => { const k = o.cam(lt, u, this.base); if (k) R.cam(k[0], k[1], k[2]); }); c.setTransform(Game.scale, 0, 0, Game.scale, 0, 0); o.over && o.over(c, lt, u); },
    cool: o.cool, warm: o.warm, grade: o.grade, leak: o.leak, fade: o.fade, flare: o.flare, noFlash: o.noFlash });
const cardShot = (t0, t1, lines, o = {}) => ({ t0, t1, kind: 'card', setup() {}, draw(c, lt, u) {
        const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * .7); g.addColorStop(0, o.bg0 || '#1a1028'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // embers drifting up through the card
        const Rr = U.mulberry(7); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 90; i++) { const x = Rr() * W, sp = 20 + Rr() * 60, y = H + 20 - ((lt * sp + Rr() * H) % (H + 40)), s = 1 + Rr() * 2.5; c.globalAlpha = .25 + Rr() * .5; c.fillStyle = Rr() < .5 ? '#ffb060' : '#c8b0ff'; c.fillRect(x + Math.sin(lt + i) * 6, y, s, s); } c.restore();
        for (const L of lines) { const lt2 = lt - (L.at || 0); if (lt2 < 0) continue; card(c, lt2, (L.until || (t1 - t0)) - (L.at || 0), L.text, L); }
    }, grade: .25, cool: '#10203a', warm: '#ff8a3a' });

const P = () => G.player, B = () => G.boss, A = () => G.arena;
const bossCam = (zoom, dy = 0, follow = .5) => (lt, u, base) => { const b = B(), p = P(); if (!b) return null; const a = b.aim(); return [lerp(p.x, a.x, follow), lerp(p.y - 80, a.y, .5) + dy, zoom * (1 + u * .06)]; };

const SHOTS = [
    // ---- I. the world without night ----
    { t0: 0, t1: .62, kind: 'black', setup() {}, draw(c) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }, grade: 0, noFlash: true },
    stageShot(.62, 7.4, Stage.restless, () => [], { z0: 1.0, z1: 1.16, px0: 40, px1: -40, leak: true, warm: '#ffb060', fade: fadeIO(0, 1.0),
        over: (c, lt) => { card(c, lt - .66, 5.6, 'TRONG MỘT THẾ GIỚI', { y: H / 2 - 30, size: 34, sp: 14 }); card(c, lt - 2.0, 4.2, 'KHÔNG CÒN BÓNG ĐÊM', { y: H / 2 + 22, size: 46, sp: 16, col: '#fff6d8' }); } }),
    { t0: 7.4, t1: 8.62, kind: 'black', setup() {}, draw(c) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }, grade: 0, noFlash: true },
    stageShot(8.62, 12.64, Stage.plaza, () => { const g = actor('nyx', 640, 560, 1, 'kneel', { age: 6, scale: 2.2 }); g.rig.custom([[0, { by: 22, lean: 80, lF: 90, sF: 120, lB: 70, sB: 120, aF: 40, aB: 30, head: 30 }], [1, { by: 22, lean: 82, lF: 90, sF: 120, lB: 70, sB: 120, aF: 42, aB: 32, head: 32 }]], 90, 0, '_sleep'); return [g]; },
        { z0: 1.35, z1: 1.6, py0: -40, py1: -60, cool: '#24305a', over: (c, lt) => card(c, lt - 1.98, 2.0, 'CHỈ MỘT ĐỨA TRẺ CÒN NGỦ ĐƯỢC', { y: 168, size: 26, sp: 10 }) }),
    stageShot(12.64, 16.6, Stage.garden, () => { const z = actor('zero', 560, 560, 1, 'kneel', { scale: 2.2, blade: true, glow: '#7ad8ff', glowA: .4 }), n = actor('nyx', 660, 560, -1, 'idle', { age: 6, scale: 2.0 }); return [z, n]; },
        { z0: 1.1, z1: 1.32, px0: 30, px1: 0, fade: fadeIO(0, .7), over: (c, lt) => { sub(c, 'ZERO', 'Vậy chú gọi con là Nyx nhé. Nghĩa là Đêm.', Math.min(1, lt / .3, (2.0 - lt) / .3)); card(c, lt - 1.4, 2.4, 'VÀ MỘT NGƯỜI CHƯA TỪNG ĐƯỢC NGHỈ', { y: 168, size: 26, sp: 10 }); } }),
    // ---- II. the seven days ----
    liveShot(16.6, 18.36, () => R.boss('whale', 120), { cam: (lt, u) => { const b = B(); return [b.x - 60, b.y - 60, 1.25 + u * .1]; }, leak: true }),
    liveShot(18.36, 20.62, () => R.boss('mareva', 200), { cam: (lt, u) => { const b = B(); return [b.x, b.y - 160, 1.1 + u * .15]; }, speed: 1.4, cool: '#0a3a6a' }),
    cardShot(20.62, 22.6, [{ text: 'BẢY NGÀY', size: 64, sp: 26, y: H / 2 - 10 }, { text: 'BẢY VẾT THƯƠNG CỦA THẾ GIỚI', size: 18, sp: 10, y: H / 2 + 44, at: .5, col: '#c8b0ff' }]),
    liveShot(22.6, 24.66, () => R.boss('gardener', 160), { cam: (lt, u) => { const b = B(), p = P(); return [lerp(p.x, b.x, .6), b.y - 140, 1.35 - u * .12]; }, speed: 1.6, warm: '#ffb060' }),
    liveShot(24.66, 26.64, () => R.boss('astraea', 240), { cam: (lt, u) => { const b = B(); return [b.x, b.y - 150, 1.2 + u * .12]; }, cool: '#2a1a5a', leak: true }),
    cardShot(26.64, 28.66, [{ text: 'MỘT CÔ BÉ', size: 30, sp: 16, y: H / 2 - 24 }, { text: 'LỚN LÊN GIỮA NHỮNG VỊ THẦN', size: 30, sp: 12, y: H / 2 + 22, at: .45 }]),
    liveShot(28.66, 30.1, () => R.boss('lilith', 220), { cam: (lt, u) => { const b = B(), p = P(); return [lerp(p.x, b.x, .55), b.y - 70, 1.45 + u * .1]; }, speed: 1.4, warm: '#ff7a3a' }),
    stageShot(30.1, 30.54, Stage.dunes, () => [], { C: { note: true }, z0: 2.3, z1: 2.5, px0: -170, px1: -185, py0: -150, py1: -158 }),
    stageShot(30.54, 31.76, Stage.dunes, () => { const g = actor('nyx', 600, 560, 1, 'kneel', { age: 14, scale: 2.3 }); return [g]; }, { z0: 1.7, z1: 1.85, px0: 40, px1: 40, py0: -150, py1: -158, over: (c, lt) => sub(c, 'NYX', 'CHÚ ƠI!', Math.min(1, lt / .1)) }),
    stageShot(31.76, 32.72, Stage.dunes, () => ['rook', 'sable', 'mirae', 'ysolde'].map((id, i) => Object.assign(actor(id, 260 - i * 90, 560, 1, 'run', { scale: 2.2 }), { vx: 7 })), { z0: 1.35, z1: 1.45, px0: 120, px1: 60, py0: -110, py1: -120 }),
    liveShot(32.72, 34.92, () => { R.boss('archon', 90); const p = P(); p.rig.play('victory', 0); R.bot = false; }, { cam: (lt, u) => { const p = P(); return [p.x, p.y - 70, 2.0 - u * .5]; }, speed: (lt) => lt < .6 ? .5 : 1.2,
        over: (c, lt) => { if (lt < 1.4) { const p = P(), cam = G.cam, x = (p.x - cam.x) * cam.zoom, y = (p.y - 60 - cam.y) * cam.zoom; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .8 * (1 - lt / 1.4); c.drawImage(Glow.get('#8a5aff'), x - 260, y - 260, 520, 520); c.restore(); } }, cool: '#2a1a6a', warm: '#8a5aff' }),
    liveShot(34.92, 36.38, () => R.boss('archon', 300), { cam: (lt, u) => { const b = B(), p = P(); return [lerp(p.x, b.x, .5), b.y - 110, 1.35]; }, speed: 1.6 }),
    liveShot(36.38, 38.7, () => R.boss('vesper', 200), { cam: (lt, u) => { const b = B(); return [b.x, b.y - 120, 1.3 - u * .25]; }, speed: 1.2, warm: '#ffb060', leak: true, over: (c, lt) => card(c, lt - .3, 2.0, 'NGÀY THỨ BẢY', { y: 172, size: 30, sp: 18 }) }),
    liveShot(38.7, 40.7, () => { R.level('memory'); P().x += 600; R.T(20); R.inputFn = () => { const p = G.player, S = { right: true }; if (p.grounded && (G.level.solidAt(p.x + 30, p.y - 20) || G.level.hazards.some(h => p.x + 90 > h.x && p.x < h.x + h.w)) && G.time % 2 === 0) { S['!jump'] = S.jump = true; } if (G.time % 50 === 0) S['!skill2'] = true; return S; }; }, { cam: (lt, u) => { const p = P(); return [p.x + 120, p.y - 90, 1.25]; }, speed: 1.2, grade: .35 }),
    cardShot(40.7, 42.72, [{ text: 'THẾ GIỚI ĐÒI MỘT NGÀY NGHỈ', size: 34, sp: 14, y: H / 2 - 20 }, { text: 'VÀ CÔ CHÍNH LÀ NGÀY ĐÓ', size: 22, sp: 12, y: H / 2 + 28, at: .6, col: '#ffcf90' }]),
    liveShot(42.72, 44.72, () => { R.boss('architect2', 400); }, { cam: (lt, u) => { const b = B(), p = P(); return [lerp(p.x, b.x, .5), b.y - 170, 1.05 + u * .1]; }, speed: 1.6, cool: '#1a1a4a' }),
    ...[['rook', 44.72], ['sable', 45.24], ['mirae', 45.74], ['ysolde', 46.24]].map(([id, t0]) => liveShot(t0, t0 + .5, () => { R.boss('architect2', 300); G2.swapParty(id); R.T(10); }, { cam: (lt, u) => { const p = P(); return [p.x, p.y - 60, 1.9]; }, speed: 1.6 })),
    // ---- the god rises ----
    liveShot(46.74, 49.0, () => R.final(2.5, { team: true }), { cam: (lt, u) => { const b = B(); return [b.x, G2.cy(b) + 100, .75 - u * .1]; }, speed: 2,
        over: (c, lt) => sub(c, 'THE ARCHITECT', 'VẬY THÌ HÃY CHIÊM NGƯỠNG HÌNH THÁI TỐI THƯỢNG CỦA TA.', Math.min(1, lt / .2)), fade: (lt, d) => lt > d - .12 ? 1 : 0 }),
    // ---- III. the silence: only the eye ----
    liveShot(49.0, 52.66, () => R.final(10.25, { team: true }), { cam: (lt, u) => { const b = B(); b.eye = ease(clamp((lt - .45) / 2.4, 0, 1)); b.blink = 0; b.lookX = b.x; b.lookY = G2.cy(b); b.tgt = null; b.dilate = 1 - ease(u) * .75; return [b.x, G2.cy(b), 1.8 + u * .6]; }, speed: .55, grade: .2, noFlash: true,
        over: (c, lt) => { const sp = c.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 420); sp.addColorStop(0, 'rgba(0,0,0,.15)'); sp.addColorStop(.45, 'rgba(0,0,0,.8)'); sp.addColorStop(1, 'rgba(0,0,0,.97)'); c.fillStyle = sp; c.fillRect(0, 0, W, H); sub(c, 'ZERO', 'Nyx. Lần này, ở cạnh chú nhé.', Math.min(1, (lt - .6) / .3, (2.3 - lt) / .3)); sub(c, 'NYX', 'Luôn luôn.', Math.min(1, (lt - 2.5) / .3, (3.6 - lt) / .2)); }, fade: fadeIO(.6, 0) }),
    // ---- IV. the drop ----
    liveShot(52.66, 53.74, () => R.final(24, { team: true }), { cam: (lt, u) => { const b = B(); return [b.x, b.A.y - 500, .52 + u * .05]; }, speed: 1.4, leak: true, flare: () => { const b = B(), cam = G.cam; return [(b.x - cam.x) * cam.zoom, (G2.cy(b) - cam.y) * cam.zoom]; },
        over: (c, lt) => { G2.drawFinalCard(c, { at: 0, t: 0 }); } }),
    liveShot(53.74, 54.76, () => { R.final(52, { team: true, seg: 3 }); G2.SK.thunder(B(), 18, [P().x + 160, P().x - 260, P().x + 520]); }, { cam: (lt, u) => { const p = P(); return [p.x, p.y - 250, .7]; }, speed: 2, cool: '#203a6a' }),
    liveShot(54.76, 55.74, () => { R.final(52, { team: true, seg: 2 }); G2.SK.crown(B(), 5, .01); G2.lasers[0].age = 60; }, { cam: (lt, u) => { const b = B(); return [b.x, G2.cy(b) + 160, .62]; }, speed: 2 }),
    liveShot(55.74, 56.74, () => { R.final(52, { team: true, bot: true }); }, { cam: (lt, u) => { const b = B(); return [b.x, G2.cy(b) + 120, .9]; }, speed: 1.2 }),
    liveShot(56.74, 57.76, () => { R.final(52, { team: true }); G2.SK.summon(B(), 3); }, { cam: (lt, u) => { const b = B(); return [b.x, b.A.y - 300, .62]; }, speed: 2 }),
    liveShot(57.76, 58.74, () => { R.final(52, { team: true, seg: 3 }); G2.SK.ray(B(), 14, P()); }, { cam: (lt, u) => { const p = P(); return [p.x, p.y - 200, .8 - u * .1]; }, speed: 1.5, warm: '#ff5a2a' }),
    // ---- Day and Night ----
    liveShot(58.74, 61.0, () => R.death(1.6), { cam: (lt, u) => { const b = B(); return [b.x, b.A.y - 470, .6]; }, speed: (lt) => lt < 1.0 ? 1.3 : .9, flare: () => { const b = B(), cam = G.cam; return [(b.x - cam.x) * cam.zoom, (G2.cy(b) - cam.y) * cam.zoom, .7]; } }),
    liveShot(61.0, 64.62, () => { R.death(-7); }, { cam: (lt, u) => { const b = B(); return [b.x, b.A.y - 470, .6 - u * .06]; }, speed: 1.7, fade: fadeIO(0, .5), noFlash: true }),
    // ---- V. the title ----
    { t0: 64.62, t1: 70.66, kind: 'title', setup() {}, draw(c, lt) {
        const g = c.createRadialGradient(W / 2, H * .42, 10, W / 2, H / 2, W * .7); g.addColorStop(0, '#2a1438'); g.addColorStop(.6, '#0a0614'); g.addColorStop(1, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        const Rr = U.mulberry(3); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${(.2 + Rr() * .6) * Math.min(1, lt)})`; c.fillRect(Rr() * W, Rr() * H, 1.4, 1.4); }
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .45 * Math.min(1, lt / .8); c.drawImage(Glow.get('#ffb060'), W / 2 - 520, H / 2 - 160, 1040, 260); c.restore();
        const k = Math.min(1, lt / .7), sweep = clamp((lt - .5) / 1.2, 0, 1);
        type(c, 'PROJECT ZERO II', { y: H / 2 - 18, size: 64, sp: 18 + (1 - k) * 30, alpha: k, col: '#fff2cc', glow: '#ff9a40', weight: 'bold', scale: 1.04 - k * .04 });
        if (sweep > 0 && sweep < 1) { const x = W / 2 - 380 + sweep * 760; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.sin(sweep * Math.PI) * .7; c.drawImage(Glow.get('#ffffff'), x - 80, H / 2 - 70, 160, 100); c.restore(); }
        c.fillStyle = `rgba(255,216,107,${.85 * clamp((lt - .6) / .6, 0, 1)})`; const lw = 360 * clamp((lt - .6) / .8, 0, 1); c.fillRect(W / 2 - lw, H / 2 + 18, lw * 2, 1.5);
        type(c, 'G E N E S I S', { y: H / 2 + 44, size: 24, sp: 8, alpha: clamp((lt - .9) / .6, 0, 1), col: '#e8dcff', glow: '#b48cff' });
        type(c, 'MỌI NGÀY ĐỀU CẦN MỘT ĐÊM', { y: H / 2 + 86, size: 15, sp: 9, alpha: clamp((lt - 1.9) / .6, 0, 1) * clamp((6.0 - lt) / .5, 0, 1), col: '#ffcf90', glow: '#ff8a3a', italic: true });
        const cr = clamp((lt - 3.2) / .6, 0, 1) * clamp((6.0 - lt) / .5, 0, 1); c.save(); c.globalAlpha = cr; c.textAlign = 'center'; c.font = '12px "Palatino Linotype", serif'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('VoPhatDat + Claude', W / 2, H - 120); c.font = '10px "Palatino Linotype", serif'; c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText('Nhạc: Epic Action Cinematic Teaser Trailer Music (No Copyright)', W / 2, H - 104); c.restore();
        if (lt > 5.4) { c.fillStyle = `rgba(0,0,0,${clamp((lt - 5.4) / .6, 0, 1)})`; c.fillRect(0, 0, W, H); }
    }, grade: .2, noFlash: false }
];

/* ------------------------------ the frame ------------------------------ */
let cur = null;
window.TR = {
    FPS, frames: Math.ceil(70.66 * FPS), SHOTS,
    prep() { Game.frame = () => {}; R.quiet(); },
    render(f) {
        const T = f / FPS, shot = SHOTS.find(s => T >= s.t0 && T < s.t1) || SHOTS[SHOTS.length - 1];
        if (shot !== cur) { cur = shot; try { shot.setup(); } catch (e) { console.warn('setup', e); } }
        const c = Game.ctx, s = Game.scale || 1; c.setTransform(s, 0, 0, s, 0, 0);
        const lt = T - shot.t0, u = clamp(lt / (shot.t1 - shot.t0), 0, 1);
        try { shot.draw(c, lt, u); } catch (e) { console.warn('draw', e); c.setTransform(s, 0, 0, s, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); }
        c.setTransform(s, 0, 0, s, 0, 0); post(c, T, shot);
    }
};
})();
