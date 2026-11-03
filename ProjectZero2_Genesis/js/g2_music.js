'use strict';
/**
 * G2 MUSIC ENGINE: extends Part I's Music/Inst/Arr (music.js) instead of replacing it.
 *   - new voices: resonant piano, music box, celesta, dulcimer, cello, solo violin, solo woman,
 *     child voice, humming, horn, distorted guitar, analog synths, clock, machine hammer,
 *     heartbeat, wolf howl, wind, sea, film crackle, church bell
 *   - one reverb per place (hall, cathedral, underwater, forest, cave, void, room)
 *   - track and phase changes always land on a bar line
 *   - per-track gain so every track sits within a few dB of the others (tools/music_render.js)
 *   - Compose.seq: melodies developed from a leitmotif by sequence, with every strong beat
 *     snapped to a chord tone (tools/music_check.js measures it)
 * Leitmotifs are written in the Part I notation: one string per bar, digits are scale degrees.
 */
SCALES.lydian = SCALES.lydian || [0, 2, 4, 6, 7, 9, 11];
SCALES.mixolydian = SCALES.mixolydian || [0, 2, 4, 5, 7, 9, 10];
SCALES.chrom = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
SCALES.hminor = SCALES.harm;

/* ------------------------------ LEITMOTIFS ------------------------------ */
// ZERO'S LULLABY, the song Zero sings to Nyx: 8 bars of 3/4 in D major. Also Nyx's leitmotif.
const LULLABY = ['4-------2---', '3---5---4---', '2-------0---', '1-----2-1---', '5---4---2---', '3-------5---', '4---6---1---', '0-----------'];
const LULLABY_PROG = [0, 3, 0, 4, 5, 3, 4, 0];
// The Genesis theme: written as a counter-melody to the Part I theme over I V vi iii, so the two can sound together.
const THEME_GENESIS = ['7-----9-b---9---', '8-------a---7---', '7-----5-7---9---', '9-----b-9-------'];
const THEME_PROG = [0, 4, 5, 2];
const MOTIF = {
    zero: THEME,                                        // Zero carries the Part I theme
    vesper: ['0---2---3---7---', '6-------4-------'],    // a climb, then a sigh
    seraphina: ['0---4---3-2-4---', '7-------5-------'],
    knight: '0-0-4---0-5-4---',
    mareva: ['4---3-2-1---0---x---0---2-------'],        // 12/8 aria phrase
    gardener: ['4-4-5-4-2---2-3-'],                      // a nursery rhyme
    astraea: ['7-4-0-4-7-4-9---'],
    lilith: ['0---3-4-7-------'],
    archon: ['0-0-7---6-5-3---'],
    architect: [0, 11, 3, 4, 8, 7, 9, 5, 6, 1, 2, 10]   // a twelve-tone row, in semitones
};
const phaseOf = id => (G.boss && G.boss.def && G.boss.def.id === id ? G.boss.phase : (G.g2music && G.g2music.phase) || 0);

/* ------------------------------ COMPOSER ------------------------------ */
const Compose = {
    DIG: '0123456789abcde',
    parse(bar) { const ev = []; for (let i = 0; i < bar.length; i++) { const ch = bar[i]; if (ch === '-' || ch === '.') continue; let len = 1; while (bar[i + len] === '-') len++; ev.push({ pos: i, len, deg: ch === 'x' ? -1 : ch === 'y' ? -2 : ch === 'z' ? -3 : this.DIG.indexOf(ch) }); } return ev; },
    write(ev, steps) { const a = new Array(steps).fill('.'); for (const e of ev) { let d = e.deg; while (d > 14) d -= 7; while (d < -3) d += 7; a[e.pos] = d < 0 ? 'xyz'[-d - 1] : this.DIG[d]; for (let k = 1; k < e.len && e.pos + k < steps; k++) a[e.pos + k] = '-'; } return a.join(''); },
    isTone(d, r, sev) { const k = (((d - r) % 7) + 7) % 7; return k === 0 || k === 2 || k === 4 || (sev && k === 6); },
    snap(d, r, sev) { for (let k = 0; k < 4; k++) { if (this.isTone(d - k, r, sev)) return d - k; if (this.isTone(d + k, r, sev)) return d + k; } return d; },
    strong(steps) { return { 12: [0, 6], 14: [0, 4, 8], 16: [0, 8], 20: [0, 12], 24: [0, 12], 28: [0, 8, 16] }[steps] || [0]; },
    /** Develop a one-bar motif across a progression: sequence it to each chord, vary the second half, cadence. */
    seq(motif, prog, steps, o = {}) {
        const src = this.parse(motif), lo = o.lo === undefined ? 0 : o.lo, hi = o.hi === undefined ? 11 : o.hi, strong = this.strong(steps), out = [];
        let prev = o.start === undefined ? 4 : o.start;
        prog.forEach((r, i) => {
            const last = i === prog.length - 1, half = i % 8 >= 4, cad = (i % 4 === 3) && !o.noCadence;
            let ev = src.map(e => ({ ...e }));
            if (half && o.invert !== false) { const d0 = ev[0].deg; ev.forEach(e => { e.deg = d0 - (e.deg - d0); }); }
            if (cad || last) { const t = this.snap(prev, last ? r + 7 : r, false); ev = [{ pos: 0, len: Math.round(steps * .5), deg: t }, { pos: Math.round(steps * .5), len: steps - Math.round(steps * .5), deg: last ? this.snap(t, r, false) : this.snap(t + (o.rise ? 1 : -1), r, false) }]; }
            else { const tgt = this.snap(prev, r, false), sh = tgt - ev[0].deg; ev.forEach(e => { e.deg += sh; }); }
            for (const e of ev) { if (strong.includes(e.pos)) e.deg = this.snap(e.deg, r, !!o.sevenths); while (e.deg > hi) e.deg -= 7; while (e.deg < lo) e.deg += 7; }
            prev = ev[ev.length - 1].deg; out.push(this.write(ev, steps));
        });
        return out;
    }
};

/* ------------------------------ VOICES ------------------------------ */
const VOWELS_F = { a: [850, 1220, 2810], o: [600, 900, 2800], u: [380, 950, 2700], e: [600, 2100, 2900], i: [330, 2600, 3300], m: [260, 1400, 2600] };
Object.assign(Inst, {
    _curve: null,
    drive() { if (this._curve) return this._curve; const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n * 2 - 1; c[i] = Math.tanh(x * 6) * .9; } return this._curve = c; },
    /** Piano: inharmonic partials with their own decay, two strings per key, a felt hammer. */
    piano2(o, t, f, d, vel = .8, pan = 0) {
        const c = Sound.ctx, B = .00035, T60 = U.clamp(4.5 * Math.sqrt(220 / f), .7, 7), out = c.createGain(), p = c.createStereoPanner(); p.pan.value = pan; out.connect(p); p.connect(o);
        const end = t + Math.min(d + .35, T60) + .3; out.gain.setValueAtTime(1, t); out.gain.setValueAtTime(1, end - .3); out.gain.linearRampToValueAtTime(0, end);
        const bright = .5 + vel * .6;
        for (let n = 1; n <= 7; n++) {
            const fn = f * n * Math.sqrt(1 + B * n * n); if (fn > 9000) break;
            const a = .11 * vel * Math.pow(n, -1.25) * Math.pow(bright, n - 1), td = T60 / Math.pow(n, .75);
            for (const det of n <= 2 ? [-1.2, 1.2] : [0]) {
                const s = c.createOscillator(), g = c.createGain(); s.frequency.value = fn; s.detune.value = det;
                g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a / (n <= 2 ? 1.6 : 1), t + .003); g.gain.setTargetAtTime(0, t + .003, td / 4.6);
                s.connect(g); g.connect(out); s.start(t); s.stop(end + .02);
            }
        }
        Sound.burst(out, t, { ft: 'bandpass', f: Math.min(3200, f * 4), d: .018, v: .03 * vel, q: 1.4 });
    },
    musicbox(o, t, f, vel = .7, pan = 0, detune = 0) { this.voice(o, t, { type: 'sine', f, d: .9, v: .085 * vel, a: .002, r: .5, dec: .3, sus: .04, pan, det: detune }); this.voice(o, t, { type: 'sine', f: f * 4.2, d: .16, v: .018 * vel, a: .001, r: .08, pan, det: detune }); this.voice(o, t, { type: 'sine', f: f * 2.98, d: .3, v: .012 * vel, a: .001, r: .1, pan }); },
    celesta(o, t, f, vel = .7, pan = 0) { this.voice(o, t, { type: 'sine', f, d: 1.4, v: .08 * vel, a: .003, r: .6, dec: .45, sus: .08, pan }); this.voice(o, t, { type: 'triangle', f: f * 2, d: .35, v: .018 * vel, a: .002, r: .2, pan }); this.voice(o, t, { type: 'sine', f: f * 4, d: .12, v: .008 * vel, a: .001, r: .05, pan }); },
    dulcimer(o, t, f, vel = .7, pan = 0) { this.pluck(o, t, f, 'dulc', vel * .8, pan); this.pluck(o, t + .004, f * 1.003, 'dulc', vel * .5, -pan); },
    harp(o, t, f, vel = .7, pan = 0) { this.pluck(o, t, f, 'harp', vel, pan); },
    guitar(o, t, f, vel = .7, pan = 0) { this.pluck(o, t, f, 'nylon', vel, pan); },
    cello(o, t, f, d, vel = 1, pan = -.2) {
        this.voice(o, t, { table: 'strings', f, d, v: .085 * vel, a: Math.min(.28, d * .3), r: .35, lp: 1700, vib: 11, vibF: 5.3, pan, q: .8 });
        this.voice(o, t, { type: 'sine', f: f / 2, d, v: .03 * vel, a: Math.min(.3, d * .3), r: .3, pan });
        Sound.burst(o, t, { ft: 'bandpass', f: f * 3, d: Math.min(.15, d), v: .008 * vel, q: 2 });
    },
    violin(o, t, f, d, vel = 1, pan = .25) { this.voice(o, t, { table: 'strings', f, d, v: .07 * vel, a: Math.min(.12, d * .3), r: .25, lp: 5200, vib: 17, vibF: 5.9, pan }); this.voice(o, t, { table: 'strings', f: f * 1.001, d, v: .03 * vel, a: Math.min(.15, d * .3), r: .25, lp: 3800, vib: 13, vibF: 5.4, pan: -pan * .4 }); },
    /** One voice through female formants with vibrato and breath. vowel 'm' hums. */
    sing(o, t, f, d, vowel = 'a', vel = 1, pan = 0, child = false) {
        const c = Sound.ctx, g = c.createGain(), p = c.createStereoPanner(), A = Math.min(.12, d * .3), end = t + d + .25; p.pan.value = pan;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.42 * vel, t + A); g.gain.setValueAtTime(.42 * vel, t + Math.max(A, d - .05)); g.gain.linearRampToValueAtTime(0, end);
        const F = (VOWELS_F[vowel] || VOWELS_F.a).map(x => child ? x * 1.18 : x);
        const bank = F.map((fr, i) => { const b = c.createBiquadFilter(), bg = c.createGain(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = [6, 9, 12][i]; bg.gain.value = vowel === 'm' ? [1.2, .12, .04][i] : [1, .5, .22][i]; b.connect(bg); bg.connect(g); return b; });
        const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f;
        const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = child ? 6.2 : 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(child ? 10 : 22, t + Math.min(.5, d * .6)); l.connect(lg); lg.connect(s.detune);
        s.frequency.setValueAtTime(f * .985, t); s.frequency.exponentialRampToValueAtTime(f, t + .07);
        bank.forEach(b => s.connect(b)); s.start(t); s.stop(end + .02); l.start(t); l.stop(end + .02);
        if (vowel !== 'm') Sound.burst(g, t, { ft: 'bandpass', f: F[1], d: Math.min(.2, d), v: .02 * vel, q: 1 });
        g.connect(p); p.connect(o);
    },
    hum(o, t, f, d, vel = 1, pan = 0) { this.voice(o, t, { type: 'sine', f, d, v: .06 * vel, a: Math.min(.25, d * .3), r: .3, lp: 900, vib: 8, vibF: 5, pan }); this.voice(o, t, { type: 'triangle', f: f * 2, d, v: .012 * vel, a: Math.min(.3, d * .3), r: .3, lp: 1200, pan }); },
    horn(o, t, f, d, vel = 1, pan = 0) { this.voice(o, t, { table: 'brass', f, d, v: .07 * vel, a: .07, r: .25, lp: 1300, lp0: 500, lpT: .15, pan, vib: 4 }); this.voice(o, t, { type: 'sine', f, d, v: .03 * vel, a: .08, r: .25, pan }); },
    /** Power chord through a hard clipper and a speaker cabinet. */
    eguitar(o, t, f, d, vel = 1, pan = 0, chord = true) {
        const c = Sound.ctx, sh = c.createWaveShaper(), lp = c.createBiquadFilter(), pk = c.createBiquadFilter(), g = c.createGain(), pre = c.createGain(), p = c.createStereoPanner();
        sh.curve = this.drive(); lp.type = 'lowpass'; lp.frequency.value = 3200; pk.type = 'peaking'; pk.frequency.value = 900; pk.gain.value = 5; pk.Q.value = .8; p.pan.value = pan;
        pre.gain.value = .55; const end = t + d + .06; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09 * vel, t + .004); g.gain.setTargetAtTime(.06 * vel, t + .01, .2); g.gain.setValueAtTime(.06 * vel, end - .05); g.gain.linearRampToValueAtTime(0, end);
        (chord ? [1, 1.4983, 2] : [1]).forEach((k, i) => { const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f * k; s.detune.value = (i - 1) * 6; s.connect(pre); s.start(t); s.stop(end + .02); });
        pre.connect(sh); sh.connect(pk); pk.connect(lp); lp.connect(g); g.connect(p); p.connect(o);
    },
    synArp(o, t, f, d, vel = .7, pan = 0) { this.voice(o, t, { type: 'sawtooth', f, d: Math.min(d, .3), v: .04 * vel, a: .003, r: .08, lp: 900, lp0: 4200, lpT: .12, q: 4, pan }); this.voice(o, t, { type: 'square', f: f * 2, d: Math.min(d, .2), v: .012 * vel, a: .003, r: .06, lp: 2500, pan: -pan }); },
    synLead(o, t, f, d, vel = .8, pan = 0) { [-7, 7].forEach(det => this.voice(o, t, { type: 'sawtooth', f, d, v: .035 * vel, a: .01, r: .15, lp: 2600, lp0: 5000, lpT: .2, q: 2, det, vib: 10, vibF: 5.5, pan })); },
    synPad(o, t, f, d, vel = .6, pan = 0) { [-9, 0, 9].forEach((det, i) => this.voice(o, t, { type: 'sawtooth', f, d, v: .016 * vel, a: Math.min(1.2, d * .35), r: Math.min(1.5, d * .4), lp: 1100, det, pan: pan + (i - 1) * .4 })); },
    synBass(o, t, f, d, vel = 1, dirty = false) {
        const c = Sound.ctx; if (!dirty) { this.voice(o, t, { type: 'sawtooth', f, d, v: .07 * vel, a: .005, r: .06, lp: 420, lp0: 1400, lpT: .08, q: 3 }); this.voice(o, t, { type: 'sine', f, d, v: .12 * vel, a: .005, r: .06 }); return; }
        const sh = c.createWaveShaper(), lp = c.createBiquadFilter(), g = c.createGain(), end = t + d + .05; sh.curve = this.drive(); lp.type = 'lowpass'; lp.frequency.value = 900;
        g.gain.setValueAtTime(.06 * vel, t); g.gain.setValueAtTime(.06 * vel, end - .04); g.gain.linearRampToValueAtTime(0, end);
        const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.connect(sh); sh.connect(lp); lp.connect(g); g.connect(o); s.start(t); s.stop(end + .02);
        this.voice(o, t, { type: 'sine', f, d, v: .1 * vel, a: .004, r: .05 });
    },
    clock(o, t, vel = 1, hi = true) { Sound.burst(o, t, { ft: 'highpass', f: hi ? 5200 : 2600, d: .012, v: .05 * vel }); Sound.tone(o, t, { type: 'square', f: hi ? 2800 : 1900, d: .01, v: .012 * vel, lp: 6000 }); },
    hammer(o, t, vel = 1) { [187, 411, 733, 1162].forEach((f, i) => Sound.tone(o, t, { type: 'triangle', f, d: .3 - i * .05, v: .03 * vel, lp: 5000 })); Sound.burst(o, t, { ft: 'lowpass', f: 2200, d: .06, v: .14 * vel }); Sound.tone(o, t, { f: 90, f2: 45, sweep: .08, d: .2, v: .3 * vel }); },
    logdrum(o, t, vel = 1, f = 220) { Sound.tone(o, t, { f: f * 1.2, f2: f, sweep: .02, d: .16, v: .16 * vel }); Sound.burst(o, t, { ft: 'bandpass', f: f * 4, d: .015, v: .03 * vel, q: 3 }); },
    heart(o, t, vel = 1) { Sound.tone(o, t, { f: 70, f2: 42, sweep: .08, d: .16, v: .34 * vel }); Sound.tone(o, t + .17, { f: 62, f2: 40, sweep: .08, d: .14, v: .24 * vel }); },
    howl(o, t, f, d, vel = 1, pan = 0) { this.voice(o, t, { type: 'triangle', f, d, v: .05 * vel, a: d * .3, r: d * .3, lp: 1600, vib: 30, vibF: 4.2, slide: .7, pan }); this.voice(o, t, { type: 'sine', f: f * 2, d: d * .8, v: .015 * vel, a: d * .3, r: d * .3, pan }); },
    wind(o, t, d, vel = 1) { const c = Sound.ctx, src = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain(); src.buffer = Sound.noiseB; src.loop = true; b.type = 'bandpass'; b.Q.value = 1.2; b.frequency.setValueAtTime(300, t); b.frequency.linearRampToValueAtTime(900, t + d * .5); b.frequency.linearRampToValueAtTime(350, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.1 * vel, t + d * .4); g.gain.linearRampToValueAtTime(0, t + d); src.connect(b); b.connect(g); g.connect(o); src.start(t); src.stop(t + d + .05); },
    sea(o, t, d, vel = 1) { const c = Sound.ctx, src = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain(); src.buffer = Sound.noiseW; src.loop = true; b.type = 'lowpass'; b.frequency.setValueAtTime(400, t); b.frequency.linearRampToValueAtTime(1400, t + d * .45); b.frequency.linearRampToValueAtTime(300, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 * vel, t + d * .45); g.gain.linearRampToValueAtTime(0, t + d); src.connect(b); b.connect(g); g.connect(o); src.start(t); src.stop(t + d + .05); },
    crackle(o, t, n = 6) { for (let i = 0; i < n; i++) Sound.burst(o, t + Math.random() * .25, { ft: 'highpass', f: 3000 + Math.random() * 4000, d: .003, v: .03 + Math.random() * .05 }); },
    churchBell(o, t, f, vel = 1) { [[.5, .09, 6], [1, .1, 5], [1.183, .05, 4], [1.5, .04, 3], [2, .045, 2.6], [2.52, .025, 2], [3.01, .02, 1.5]].forEach(([k, v, d]) => this.voice(o, t, { type: 'sine', f: f * k, d: .01, v: v * vel, a: .002, r: d })); },
    /** Reverse envelope: swells in and stops dead, for music that runs backwards. */
    rev(o, t, f, d, vel = .7, pan = 0, table = 'piano') { this.voice(o, t, { table, f, d, v: .07 * vel, a: d * .95, r: .02, lp: 3000, pan }); }
});

/* ------------------------------ ENGINE ------------------------------ */
(function () {
    // Reverb per place: each kind is a generated impulse response, swapped in when a track asks for it.
    const IR = { hall: [2.6, 3.2, 1], cathedral: [5.5, 2.4, 1], water: [3.2, 2.2, .25], forest: [1.6, 3.8, .8], cave: [3.4, 1.8, .6], void: [8, 1.6, .9], room: [.8, 4, 1] };
    Music.irBuf = function (kind) {
        this._ir = this._ir || {}; if (this._ir[kind]) return this._ir[kind];
        const c = Sound.ctx, [len, curve, tone] = IR[kind] || IR.hall, b = c.createBuffer(2, Math.floor(c.sampleRate * len), c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < d.length; i++) { const r = Math.random() * 2 - 1; lp += tone * (r - lp); const k = i / d.length; d[i] = lp * Math.pow(1 - k, curve) * (kind === 'forest' && i < c.sampleRate * .08 && i % 900 < 40 ? 2.5 : 1); } }
        return this._ir[kind] = b;
    };
    const ens = Music.ensureStems.bind(Music);
    Music.ensureStems = function () {
        if (!Sound.ok || this.stems.pad) return;
        const c = Sound.ctx, keep = Sound.reverb;
        this.revIn = c.createGain(); this.revOut = c.createGain(); this.revOut.gain.value = .9; this.revOut.connect(Sound.buses.music);
        Sound.reverb = this.revIn; ens(); Sound.reverb = keep;
        this.samples.dulc = this.karplus(220, 1.6, .9952, .9);
        this.trackGain = 1; this.setReverb('hall');
        // Master EQ for Part II music: less low-mid mud, more presence and air, a little more sub.
        const B = Sound.buses, eq = (type, f, g, q) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.gain.value = g; if (q) n.Q.value = q; return n; };
        const lo = eq('lowshelf', 70, 3), mud = eq('peaking', 330, -4, .8), pres = eq('peaking', 3800, 4, .7), air = eq('highshelf', 8500, 5);
        try { B.music.disconnect(); } catch (e) { } B.music.connect(lo); lo.connect(mud); mud.connect(pres); pres.connect(air); air.connect(B.master);
    };
    Music.setReverb = function (kind) {
        if (!Sound.ok || !this.revIn || this.revKind === kind) return; this.revKind = kind;
        const c = Sound.ctx, conv = c.createConvolver(); conv.buffer = this.irBuf(kind); conv.connect(this.revOut);
        if (this.conv) { const old = this.conv; try { this.revIn.disconnect(old); } catch (e) { } setTimeout(() => { try { old.disconnect(); } catch (e) { } }, 6000); }
        this.revIn.connect(conv); this.conv = conv;
    };
    // Mix: Part I stems times the track's own gain (measured by tools/music_render.js).
    const am = Music.applyMix.bind(Music);
    Music.applyMix = function (fade) {
        if (!Sound.ok || !this.track) return;
        const mix = STEM_MIX[this.state] || STEM_MIX.calm, T = this.track, t = Sound.ctx.currentTime, k = (T.gain || 1) * (T.meta ? 1 : 1);
        for (const n in this.stems) { let v = Math.max(mix[n] || 0, (T.keep && T.keep[n]) || 0); if (T.drop && T.drop.includes(n)) v = 0; if (T.only && !T.only.includes(n)) v = 0; this.stems[n].gain.setTargetAtTime(v * k, t, fade / 3); }
    };
    // Track changes wait for the next bar line, so nothing is cut off mid-phrase.
    const play = Music.play.bind(Music);
    Music.play = function (id, state) {
        if (Save.data && Save.data.g2 && TRACKS[id] && TRACKS[id].meta) { Save.data.g2.heard = Save.data.g2.heard || {}; Save.data.g2.heard[id] = 1; }
        if (Sound.ok && this.timer && this.track && id !== this.trackId && TRACKS[id] && !this.forceCut) { if (state) this.state = state; this.pendingId = id; return; }
        this.pendingId = null; play(id, state); if (Sound.ok && this.track) { this.setReverb(this.track.reverb || 'hall'); this.applyMix(.7); }
    };
    Music.cut = function (id, state) { this.forceCut = true; this.pendingId = null; this.trackId = null; this.play(id, state); this.forceCut = false; };
    const stop = Music.stop.bind(Music);
    Music.stop = function (fade) { this.pendingId = null; return stop(fade); };
    Music.tick = function () {
        if (!Sound.ok || !this.track || Sound.ctx.state !== 'running') return;
        const c = Sound.ctx; if (this.nextT < c.currentTime - .4) this.nextT = c.currentTime + .05;
        const ahead = typeof document !== 'undefined' && document.hidden ? 1.4 : .28;
        while (this.nextT < c.currentTime + ahead) {
            let T = this.track;
            if (this.pendingId && this.step % (T.steps || 16) === 0) {
                const id = this.pendingId; this.pendingId = null; this.trackId = id; this.track = T = TRACKS[id]; this.step = 0; this.lastV = null;
                this.delay.delayTime.setTargetAtTime(60 / T.bpm * .75, c.currentTime, .05); this.setReverb(T.reverb || 'hall'); this.applyMix(.6);
            }
            const sd = 60 / T.bpm / 4, sw = this.step % 2 ? sd * (T.swing || .04) : 0;
            this.playStep(this.step, this.nextT + sw + Math.random() * .003, sd);
            this.nextT += sd; this.step++;
        }
    };
    /** Beat clock for bosses that attack in time with their song (game ticks, so it also works headless). */
    Music.beatTicks = function (id) { const T = TRACKS[id]; return T ? 3600 / T.bpm : 40; };
})();

/** Helpers every Part II arranger uses: pitch, chord, patterns and the current section. */
function g2x(m) {
    const T = m.T, steps = T.steps || 16;
    return {
        steps, hz: (d, o = 0) => midiHz(m.midi(d, o)), rootHz: (o = -1) => midiHz(m.midi(m.root, o)),
        ch: (o = 0) => m.chord().map(n => midiHz(n + o * 12)), ch7: (o = 0) => m.seventh().map(n => midiHz(n + o * 12)),
        at: p => p[m.pos % p.length], is: (p, c = 'x') => p[m.pos % p.length] === c,
        mel: (fn, o, src) => m.line((src || T.mel)[m.bar % (src || T.mel).length], fn, o === undefined ? (T.lead === undefined ? 1 : T.lead) : o),
        line: (src, fn, o = 1) => m.line(src[m.bar % src.length], fn, o),
        sec: () => { if (m.pos === 0 || T._sec === undefined) T._sec = T.meta && T.meta.boss ? phaseOf(T.meta.boss) : (G.g2music && G.g2music.phase) || 0; return T._sec; },
        hot: () => Music.state !== 'calm'
    };
}
