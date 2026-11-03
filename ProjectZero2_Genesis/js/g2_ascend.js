'use strict';
/**
 * THE LAST CARD. When the Architect is about to die it swallows the Throne and ascends into a false god.
 * From that moment the music is a recorded track, and everything is cut to it: the transformation plays
 * on the intro and build, the fight starts on the drop, attacks land on the beat, the main section loops
 * for as long as the fight lasts, and the death plays on the final climax, with the last two hits.
 *
 * Music: "GameChanger" boss theme by Photon Arts and Carameii
 *   https://www.youtube.com/watch?v=K_9j1k3jH-Q
 * Their terms allow it in non-profit projects with this credit. Not for commercial use.
 *
 * The track was measured with FFT tooling (tools in the devlog): 172.27 BPM, first beat at 0.232 s,
 * bars of 1.393 s. Section map, in bars: 0-6 intro, 7 first hit, 8-15 build, 16 DROP, 16-31 climax A,
 * 32-33 breakdown, 34-59 section B, 60-101 main section (the loop), 102-119 final climax, 120 and 121 the
 * last two hits, 122 silence.
 */
const SONG = { bpm: 172.27, first: .232, beat: 60 / 172.27 };
SONG.bar = SONG.beat * 4; SONG.t = b => SONG.first + b * SONG.bar;
const CUE = { eye: 7, build: 8, name: 12, drop: 16, breakdown: 32, secB: 34, loopA: 60, loopB: 102, finale: 102, dayNight: 104, boom1: 120, boom2: 121, end: 122 };

G2.song = {
    buf: null, src: null, gain: null, active: false, useAudio: false, t0: 0, p: 0, looping: false, jump: null, lastBar: -1,
    load() {
        if (this.buf || this.loading || !Sound.ok || typeof fetch === 'undefined') return; this.loading = true;
        const url = typeof G2_BOSS_MP3 !== 'undefined' ? G2_BOSS_MP3 : 'assets/boss_final.mp3';
        fetch(url).then(r => r.arrayBuffer()).then(a => Sound.ctx.decodeAudioData(a)).then(b => { this.buf = b; }).catch(e => { console.warn('final boss track unavailable, using the synthesised one', e); });
    },
    start(at = 0) {
        this.active = true; this.looping = true; this.jump = null; this.p = at; this.lastBar = -1; Music.stop(.4);
        if (Sound.ok && this.buf) {
            const c = Sound.ctx; this.gain = c.createGain(); this.gain.gain.value = .5; this.gain.connect(Sound.buses.music);
            this.src = this.mk(true); const T = c.currentTime + .05; this.src.start(T, at); this.t0 = T - at; this.useAudio = true;
        } else { this.useAudio = false; if (Sound.ok) Music.cut('g2act3', 'critical'); }
    },
    mk(loop) { const s = Sound.ctx.createBufferSource(); s.buffer = this.buf; s.loop = loop; if (loop) { s.loopStart = SONG.t(CUE.loopA); s.loopEnd = SONG.t(CUE.loopB); } s.connect(this.gain); return s; },
    raw() { return this.useAudio ? Sound.ctx.currentTime - this.t0 : this.p; },
    pos() { const r = this.raw(), A = SONG.t(CUE.loopA), B = SONG.t(CUE.loopB); return this.looping && r > B ? A + (r - A) % (B - A) : r; },
    bar() { return Math.floor((this.pos() - SONG.first) / SONG.bar); },
    beatN() { return Math.floor((this.pos() - SONG.first) / SONG.beat); },
    /** Leave the loop and continue from a bar, starting on the next bar line. */
    jumpTo(bar) {
        const pos = this.pos(), nb = Math.ceil((pos - SONG.first) / SONG.bar + .001), wait = SONG.t(nb) - pos, to = SONG.t(bar);
        if (this.useAudio) { const c = Sound.ctx, T = c.currentTime + Math.max(.02, wait), old = this.src; old.stop(T); this.src = this.mk(false); this.src.start(T, to); this.t0 = T - to; this.looping = false; }
        else this.jump = { at: this.p + wait, to };
    },
    tick() { if (!this.active || this.useAudio) return; this.p += 1 / 60; if (this.jump && this.p >= this.jump.at) { this.p = this.jump.to; this.jump = null; this.looping = false; } const A = SONG.t(CUE.loopA), B = SONG.t(CUE.loopB); if (this.looping && this.p > B) this.p -= B - A; },
    stop(fade = 1.5) { if (!this.active) return; this.active = false; if (this.useAudio && this.gain) { const c = Sound.ctx; this.gain.gain.setTargetAtTime(0, c.currentTime, fade / 3); const s = this.src; setTimeout(() => { try { s.stop(); } catch (e) { } }, fade * 1000 + 200); } }
};
(function () {
    const tick = G.tick.bind(G); G.tick = function () { G2.song.tick(); return tick(); };
    // While the recorded track plays, nothing else may start music, except a deliberate cut.
    const play = Music.play.bind(Music); Music.play = function (id, st) { if (G2.song.active && !Music.forceCut) return; return play(id, st); };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { if (G2.song.active) G2.song.stop(.5); ll(id, cp); if (id === 'architect2') G2.song.load(); };
})();

/* ------------------------------ THE ASCENSION ------------------------------ */
const waitBar = function* (bar) { while (G2.song.pos() < SONG.t(bar) - .008) yield 1; };
G2.ascendIntro = function* (b) {
    const S = G2.song; G.warns = []; G.projs = G.projs.filter(p => p.friendly); G.g2night = 0; G.g2xf = null; G.g2grav = 1; G.level.forceNyx = false; b.spin = 0; b.rot = 0;
    for (const e of G.enemies) if (!e.boss && !e.dead) { e.hp = 0; e.die({ dir: 0 }); }
    G.lockInput = true; G.letterbox = 1; G.cineCam = { x: b.x, y: b.y - 220, zoom: 1 };
    G.say('THE ARCHITECT', 'THEN I WILL PLAY MY LAST CARD.', 150);
    S.start(0); b.ascended = 1; b.wings = 0; b.eye = 0; b.absorb = 0; b.open = 0;
    // Intro: it swallows the Throne; the rings fall inward, one pulse a bar.
    while (S.pos() < SONG.t(CUE.eye)) { b.absorb = U.clamp(S.pos() / SONG.t(CUE.eye), 0, 1); G.cineCam.zoom = 1 + b.absorb * .35; if (S.bar() !== S.lastBar) { S.lastBar = S.bar(); G.flash = .12; G.addShake(2 + b.absorb * 4); VFX.ring(b.x, b.y - 220, 400 - b.absorb * 300, '#ffe8a0', 20, 6); } yield 1; }
    // First hit: the eye opens.
    G.flash = 1; G.addShake(22); b.eye = 1; VFX.ring(b.x, b.y - 220, 520, '#ffffff', 30, 14); G.say('NYX', 'It is opening its eye...', 90);
    yield* waitBar(CUE.build);
    // Build: a pair of wings unfolds on every bar; its true name on bar 12.
    while (S.pos() < SONG.t(CUE.drop) - .02) {
        const bar = S.bar(), fr = (S.pos() - SONG.t(bar)) / SONG.bar; b.wings = U.clamp(bar - CUE.build + Math.min(1, fr * 2), 0, 8);
        if (bar !== S.lastBar) { S.lastBar = bar; G.addShake(4 + (bar - 8)); G.flash = .2; VFX.burst(b.x, b.y - 220, '#ffe8a0', 18, 9, 30, 8, 1); G.cineCam.zoom = 1.35 - (bar - 8) * .05;
            if (bar === 9) G.say('ZERO', 'This is its last card.', 100); if (bar === 11) G.say('NYX', 'Then this is ours. Together, Uncle!', 110);
            if (bar === CUE.name) G.g2title = { name: tr('THE ARCHITECT, ASCENDED'), sub: tr('THE GOD THAT WAS NEVER ASKED FOR'), t: 0 };
        }
        yield 1;
    }
    // The drop.
    G.g2title = null; b.wings = 8; G.flash = 1; G.addShake(30); VFX.ring(b.x, b.y - 220, 900, '#ffffff', 40, 18); G.letterbox = 0; G.cineCam = null; G.lockInput = false; G.player.inv = Math.max(G.player.inv, 40);
};
// Every attack lands on the beat: warnings appear two beats ahead, sections follow the song.
G2.ascendBeat = function (b, bar, bi) {
    const A = b.A, P = G.player, tele = Math.round(SONG.beat * 60 * 2), cx = (A.x0 + A.x1) / 2;
    if (bi === 0) { G.addShake(1.6); if (bar % 4 === 0) VFX.ring(b.x, b.y - 220, 260, '#ffe8a0', 16, 5); }
    const spear = x => Combat.warn({ shape: 'rect', x: U.clamp(x, A.x0, A.x1 - 90) - 45, y: A.y - 480, w: 90, h: 480, t: tele, dmg: b.D(15), src: b, col: '#ffe8a0' });
    const sweep = high => Combat.warn({ shape: 'rect', x: A.x0, y: high ? A.y - 190 : A.y - 70, w: A.x1 - A.x0, h: high ? 90 : 70, t: tele + 8, dmg: b.D(14), src: b, col: high ? '#c8b0ff' : '#ffe8a0' });
    const volley = n => { for (let i = 0; i < n; i++) { const a = Math.atan2(P.y - 36 - (b.y - 220), P.x - b.x) + (i - (n - 1) / 2) * .16; Combat.eshoot(b, 'bolt', b.x, b.y - 220, a, 10, b.D(10), { r: 6, life: 140, col: '#fff0c8', len: 22 }); } };
    if (bar >= CUE.drop && bar < CUE.breakdown) { // climax A: spears on the downbeat, the eye fires on beat three, a ring every fourth bar
        if (bi === 0) { spear(P.x); spear(P.x + U.pick([-260, 260])); } if (bi === 2) volley(5);
        if (bi === 0 && bar % 4 === 3) for (let i = 0; i < 14; i++) Combat.eshoot(b, 'orb', b.x, b.y - 220, i / 14 * TAU, 4.4, b.D(9), { r: 9, life: 200, col: '#ffe8a0' });
    } else if (bar >= CUE.breakdown && bar < CUE.secB) { // breakdown: it gathers itself; a cross of light two bars long
        if (bar === CUE.breakdown && bi === 0) { Combat.warn({ shape: 'rect', x: P.x - 60, y: A.y - 520, w: 120, h: 520, t: Math.round(SONG.bar * 60 * 2), dmg: b.D(24), src: b, col: '#ffffff' }); Combat.warn({ shape: 'rect', x: A.x0, y: P.y - 100, w: A.x1 - A.x0, h: 70, t: Math.round(SONG.bar * 60 * 2), dmg: b.D(20), src: b, col: '#ffffff' }); G.say('THE ARCHITECT', 'KNEEL.', 80); }
    } else if (bar >= CUE.secB && bar < CUE.loopA) { // section B: wing sweeps on one and three, triangles on two and four
        if (bi === 0 || bi === 2) sweep((bar + bi) % 3 === 0); else volley(3);
    } else { // the main section, looped as long as the fight lasts
        const k = bar % 8;
        if (k === 7 && bi === 0) { const w = (A.x1 - A.x0) / 8, odd = bar % 16 === 7; for (let i = 0; i < 8; i++) if ((i % 2 === 1) === odd) Combat.warn({ shape: 'rect', x: A.x0 + i * w, y: A.y - 500, w, h: 500, t: tele * 2, dmg: b.D(16), src: b, col: '#ffe8a0' }); }
        else if (bi === 0) spear(P.x); else if (bi === 2) sweep(k % 2 === 1); else if (bi === 3 && k % 2 === 0) volley(4);
    }
};
const ASCEND_MOVES = {
    *conduct(b) { let last = -1; for (; ;) { const S = G2.song, n = S.beatN(); if (n !== last && !b.dead) { last = n; G2.ascendBeat(b, Math.floor(n / 4), ((n % 4) + 4) % 4); } yield 1; } }
};
// The death, cut to the final climax: the face of Zero, Day and Night on the downbeat, glass rain, two last hits.
G2.ascendDeath = function* (b) {
    const S = G2.song; G.lockInput = true; G.warns = []; G.projs = G.projs.filter(p => p.friendly); G.letterbox = 1; G.cineCam = { x: b.x, y: b.y - 220, zoom: 1.2 }; b.dying = 1;
    S.jumpTo(CUE.finale); yield 2; yield* waitBar(CUE.finale);
    b.open = 1; b.eye = 0; G.flash = .6; G.addShake(10);
    G.say('ZERO, AS HE WAS ON THE ALTAR', 'I am what he forgave... and never healed.', Math.round(SONG.bar * 60 * 2) - 4);
    yield* waitBar(CUE.dayNight);
    Sound.sfx('swing_h'); G.flash = .7; G.addShake(16); b.slashGold = 1; VFX.slash(b.x, b.y - 220, 340, 1, '#ffd86b');
    while (S.pos() < SONG.t(CUE.dayNight) + SONG.beat * 2) yield 1;
    Sound.sfx('swing_h'); G.flash = .7; G.addShake(16); b.slashNight = 1; VFX.slash(b.x, b.y - 220, 340, -1, '#8a5aff');
    G.say('', tr('DAY AND NIGHT'), Math.round(SONG.bar * 60 * 2));
    // the glass rain, one shower a beat, the camera pulling away
    let lb = -1; while (S.pos() < SONG.t(CUE.boom1) - .01) { const n = S.beatN(); if (n !== lb) { lb = n; b.crack = Math.min(1, (b.crack || 0) + .02); for (let i = 0; i < 10; i++) VFX.add(b.x + U.rand(-500, 500), b.y - 600 + U.rand(-100, 50), U.rand(-1, 1), U.rand(3, 7), i % 2 ? '#ffe8a0' : '#cfe8ff', 90, 3, 1, 0); if (n % 4 === 0) G.addShake(4); } G.cineCam.zoom = Math.max(.85, G.cineCam.zoom - .0006);
        if (S.bar() === 110 && !b.saidRest) { b.saidRest = 1; G.say('NYX', 'You can rest too. Everyone can.', 140); } yield 1; }
    // BOOM. BOOM.
    for (const hit of [CUE.boom1, CUE.boom2]) { yield* waitBar(hit); G.flash = 1; G.addShake(34); Sound.sfx('bigboom'); for (let i = 0; i < 4; i++) VFX.ring(b.x, b.y - 220, 300 + i * 220, i % 2 ? '#8a5aff' : '#ffe8a0', 30 + i * 6, 14); VFX.burst(b.x, b.y - 220, '#ffffff', 80, 14, 60, 12, 1); b.boom = (b.boom || 0) + 1; if (hit === CUE.boom2) b.gone = true; }
    yield* waitBar(CUE.end); G.flash = 1; S.stop(3); yield 90;
    G.cineCam = null; G.letterbox = 0; G.lockInput = false; G2.F.setAct(4); G2.cut('g2choiceScene', () => G2.throneChoice());
};
G2.drawAscended = function (c, b) {
    if (b.gone) return; const x = b.x, y = b.y - 220, t = b.anim, ab = b.absorb || 0, f = b.flash > 0;
    c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#ffe8a0'), x - 420, y - 420, 840, 840); c.restore();
    // wings of light, unfolding pair by pair
    const W = b.wings || 0;
    for (let i = 0; i < 8; i++) { const k = U.clamp(W - i, 0, 1); if (k <= 0) continue; const side = i % 2 ? 1 : -1, tier = i >> 1, flap = Math.sin(t * .04 + tier) * .06, L = (230 + tier * 30) * k, th = -(.15 + tier * .38) + flap;
        c.save(); c.globalAlpha = k * .95; c.lineCap = 'round';
        for (let j = 0; j < 12; j++) { const a = th + (j - 6) * .045, Lj = L * (1 - Math.abs(j - 6) * .045), ex = x + side * Math.cos(a) * Lj, ey = y + Math.sin(a) * Lj, mx = x + side * Math.cos(a - .25) * Lj * .55, my = y + Math.sin(a - .25) * Lj * .55 - 20;
            c.strokeStyle = j % 3 === 0 ? 'rgba(200,180,255,.85)' : 'rgba(255,244,214,.9)'; c.lineWidth = 8 - Math.abs(j - 6) * .8; c.beginPath(); c.moveTo(x + side * 40, y - 10); c.quadraticCurveTo(mx, my, ex, ey); c.stroke(); }
        c.restore(); }
    // rings: falling inward while it swallows the Throne, then wide and slow
    for (let r = 0; r < 4; r++) { c.save(); c.translate(x, y); c.rotate((b.rings ? b.rings[r % 3] : 0) * (1 + r * .3) + t * .004 * (r % 2 ? -1 : 1)); c.scale(1, .3 + r * .18); const R = (220 - r * 30) * (1 - ab * .5 + (b.eye ? .5 : 0));
        c.strokeStyle = f ? '#fff' : r % 2 ? '#c8b0ff' : '#ffd86b'; c.lineWidth = 6 - r; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; Paint.disc(c, Math.cos(a) * R, Math.sin(a) * R, 6, '#f0e8d0'); Paint.disc(c, Math.cos(a) * R, Math.sin(a) * R, 3, b.eye ? '#ff3a1a' : '#3a2a10'); } c.restore(); }
    // halo of spikes
    c.save(); c.translate(x, y); c.rotate(t * .006); for (let i = 0; i < 24; i++) { c.rotate(TAU / 24); c.fillStyle = i % 2 ? 'rgba(255,232,160,.8)' : 'rgba(200,176,255,.6)'; c.beginPath(); c.moveTo(-5, -150); c.lineTo(0, -230 - (i % 3) * 20); c.lineTo(5, -150); c.fill(); } c.restore();
    // the core and its eye
    Paint.glow(c, x, y, 160, '#ffffff'); c.fillStyle = f ? '#fff' : '#fff6d8'; c.beginPath(); c.arc(x, y, 70, 0, TAU); c.fill();
    if (b.eye && !b.open) { c.fillStyle = '#1a0a04'; c.beginPath(); c.ellipse(x, y, 54, 26 * b.eye, 0, 0, TAU); c.fill(); Paint.disc(c, x, y, 20, '#ff3a1a'); Paint.disc(c, x, y, 8, '#1a0a04'); Paint.glow(c, x, y, 40, '#ff3a1a'); }
    if (b.open) { c.fillStyle = '#1a1a24'; c.beginPath(); c.arc(x, y, 50, 0, TAU); c.fill(); c.fillStyle = '#00ffff'; c.fillRect(x - 3, y - 26, 6, 40); Paint.disc(c, x, y - 32, 8, '#1a1a24'); c.fillStyle = 'rgba(200,240,255,.9)'; c.fillRect(x + 4, y - 30 + (t % 20) * .6, 1.5, 4); }
    if (b.crack) { c.strokeStyle = `rgba(255,255,255,${b.crack})`; c.lineWidth = 2; const R = U.mulberry(3); for (let i = 0; i < 18 * b.crack; i++) { c.beginPath(); let px = x, py = y; c.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (R() - .5) * 160; py += (R() - .5) * 160; c.lineTo(px, py); } c.stroke(); } }
    if (b.slashGold) { c.strokeStyle = '#ffd86b'; c.lineWidth = 10; c.beginPath(); c.moveTo(x - 360, y - 300); c.lineTo(x + 360, y + 300); c.stroke(); }
    if (b.slashNight) { c.strokeStyle = '#8a5aff'; c.lineWidth = 10; c.beginPath(); c.moveTo(x + 360, y - 300); c.lineTo(x - 360, y + 300); c.stroke(); }
};
(function () {
    const B = BOSSES.architect2, draw = B.draw, tick = B.tick, death = B.death;
    B.phases.push({ at: .12, moves: ['conduct'], rest: 0, enter: G2.ascendIntro });
    Object.assign(B.moves, ASCEND_MOVES);
    B.draw = (c, b) => (b.ascended ? G2.drawAscended(c, b) : draw(c, b));
    B.tick = b => { tick(b); if (b.ascended) { if (!b.dying) b.open = 0; b.dmgTakenMult = b.transition ? 0 : .36; b.y = b.A.y - 60 + Math.sin(b.anim * .02) * 16; G.g2xf = null; G.g2night = 0; Light.add(b.x, b.y - 220, 520, '#ffe8a0', 1); } };
    B.box = b => (b.ascended ? { x: b.x - 90, y: b.y - 320, w: 180, h: 200 } : { x: b.x - 110, y: b.y - 320, w: 220, h: 240 });
    B.death = b => (b.ascended ? G2.ascendDeath(b) : death(b));
    // The name of the god, over everything, while it is being born.
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) { hd(c); const T = G.g2title; if (!T) return; T.t++; const a = Math.min(1, T.t / 30); c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.fillStyle = '#fff6d8'; c.font = 'bold 54px "Palatino Linotype", "Times New Roman", serif'; c.shadowColor = '#ffd86b'; c.shadowBlur = 30; c.fillText(T.name, VW / 2, VH / 2 - 10); c.shadowBlur = 0; c.fillStyle = '#c8b0ff'; c.font = '20px "Palatino Linotype", serif'; c.fillText(T.sub, VW / 2, VH / 2 + 30); c.restore(); };
})();
Object.assign(VI, {
    'THEN I WILL PLAY MY LAST CARD.': 'VẬY TA SẼ TUNG CON BÀI CUỐI CÙNG.', 'It is opening its eye...': 'Nó đang mở mắt...', 'This is its last card.': 'Đây là con bài cuối cùng của nó.', 'Then this is ours. Together, Uncle!': 'Vậy đây cũng là của mình. Cùng nhau, chú ơi!',
    'THE ARCHITECT, ASCENDED': 'THE ARCHITECT HÓA THẦN', 'THE GOD THAT WAS NEVER ASKED FOR': 'VỊ THẦN KHÔNG AI CẦU XIN', 'KNEEL.': 'QUỲ XUỐNG.', 'You can rest too. Everyone can.': 'Ngươi cũng được nghỉ ngơi. Ai cũng được.',
    'Final boss theme': 'Nhạc boss cuối', '"GameChanger" boss theme by Photon Arts and Carameii, used with their permission for non-profit projects': 'Nhạc boss "GameChanger" của Photon Arts và Carameii, dùng theo điều khoản cho phép dự án phi lợi nhuận'
});

// The last card is a checkpoint: whoever falls hands over to the next of the party; if everyone falls,
// the fight goes back to the drop, with the god at the strength it had when it ascended.
(function () {
    const hurt = Player.prototype.hurt;
    Player.prototype.hurt = function (dmg, src) {
        const b = G.boss; if (this === G.player && b && b.ascended && !b.dying && !b.dead && this.hp - dmg * (Game.diff.dmgTaken || 1) <= 0 && this.inv <= 0) {
            G.partyDown = G.partyDown || {}; G.partyDown[this.id] = 1; const next = G2.party().find(id => !G.partyDown[id]);
            if (next) { G.flash = .5; G.say(CHARS[this.id].name, tr('I am down... keep going!'), 100); G2.swapParty(next); G.player.hp = G.player.maxHp; G.player.inv = 90; return false; }
            G.partyDown = {}; G.flash = 1; G.toast('Everyone fell. Again, from the drop.', '#ffe8a0'); b.hp = Math.round(b.maxHp * .12); G.warns = []; G.projs = G.projs.filter(p => p.friendly); this.hp = this.maxHp; this.inv = 180; G2.song.start(SONG.t(CUE.drop - 2)); return false;
        }
        return hurt.call(this, dmg, src);
    };
})();
Object.assign(VI, { 'I am down... keep going!': 'Tôi gục rồi... đánh tiếp đi!', 'Everyone fell. Again, from the drop.': 'Cả đội đã gục. Làm lại từ đoạn drop.' });
