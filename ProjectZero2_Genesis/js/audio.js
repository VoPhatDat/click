'use strict';
/**
 * AUDIO: everything is synthesised at runtime with WebAudio, so all music and
 * sound effects are original and need no licensed files.
 * Buses: master > music / sfx / ambient. Music lives in music.js.
 */
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
    phryg: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], hijaz: [0, 1, 4, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11]
};
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);

const Sound = {
    ctx: null, ok: false, buses: {}, noiseW: null, noiseB: null, last: {}, voices: 0,

    init() {
        if (this.ctx || HEADLESS) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try {
            const c = this.ctx = new AC();
            const comp = c.createDynamicsCompressor();
            comp.threshold.value = -14; comp.ratio.value = 6; comp.attack.value = .004; comp.release.value = .22;
            comp.connect(c.destination);
            const mk = () => { const g = c.createGain(); return g; };
            const B = this.buses;
            B.master = mk(); B.master.connect(comp);
            ['music', 'sfx', 'ambient'].forEach(n => { B[n] = mk(); B[n].connect(B.master); });
            // Reverb from a generated impulse response, so nothing is loaded from disk.
            const ir = c.createBuffer(2, c.sampleRate * 2.6, c.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const d = ir.getChannelData(ch);
                for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
            }
            const rev = this.reverb = c.createConvolver(); rev.buffer = ir;
            const rg = c.createGain(); rg.gain.value = .9; rev.connect(rg); rg.connect(B.master);
            const size = c.sampleRate * 2;
            this.noiseW = c.createBuffer(1, size, c.sampleRate);
            this.noiseB = c.createBuffer(1, size, c.sampleRate);
            const w = this.noiseW.getChannelData(0), b = this.noiseB.getChannelData(0);
            let last = 0;
            for (let i = 0; i < size; i++) {
                const r = Math.random() * 2 - 1; w[i] = r;
                last = (last + .02 * r) / 1.02; b[i] = last * 3.5;
            }
            this.ok = true;
            this.applyVolumes();
            Ambience.build();
        } catch (e) { console.warn('Audio is unavailable; continuing silently.', e); this.ok = false; }
    },
    resume() {
        const first = !this.ok; this.init();
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        // Browsers block audio until a first input: start whatever was requested before that.
        if (first && this.ok && Music.trackId) { const id = Music.trackId; Music.trackId = null; Music.play(id); Ambience.set(Ambience.cur); }
    },
    applyVolumes() {
        if (!this.ok) return;
        const t = this.ctx.currentTime, B = this.buses;
        B.master.gain.setTargetAtTime(Settings.master, t, .02);
        B.music.gain.setTargetAtTime(Settings.music * 1.4, t, .02);
        B.sfx.gain.setTargetAtTime(Settings.sfx, t, .02);
        B.ambient.gain.setTargetAtTime(Settings.ambient, t, .02);
    },
    noiseSrc(brown) { const s = this.ctx.createBufferSource(); s.buffer = brown ? this.noiseB : this.noiseW; s.loop = true; s.loopStart = Math.random(); return s; },
    env(g, t, a, peak, d, sus = 0, rel = .05) {
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a);
        g.gain.exponentialRampToValueAtTime(Math.max(.0002, sus), t + a + d);
        if (sus > 0) g.gain.setTargetAtTime(.0001, t + a + d, rel);
    },
    /** One-shot oscillator helper. */
    tone(dest, t, o) {
        const c = this.ctx, s = c.createOscillator(), g = c.createGain();
        s.type = o.type || 'sine'; s.frequency.setValueAtTime(o.f, t);
        if (o.f2) s.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + (o.sweep || o.d));
        if (o.detune) s.detune.value = o.detune;
        this.env(g, t, o.a || .003, o.v || .3, o.d);
        let out = s;
        if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || .7; s.connect(f); out = f; }
        out.connect(g); g.connect(dest);
        s.start(t); s.stop(t + (o.a || .003) + o.d + .05);
    },
    burst(dest, t, o) {
        const c = this.ctx, s = this.noiseSrc(o.brown), g = c.createGain(), f = c.createBiquadFilter();
        f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q || 1;
        if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + o.d);
        this.env(g, t, o.a || .002, o.v || .3, o.d);
        s.connect(f); f.connect(g); g.connect(dest);
        s.start(t, Math.random()); s.stop(t + (o.a || .002) + o.d + .05);
    },
    /** Play a named effect. Pitch and level jitter stop repeats from sounding machine-gunned. */
    sfx(name, opt = {}) {
        if (!this.ok || this.ctx.state !== 'running') return;
        const fn = SFX[name]; if (!fn) { console.warn('Missing sfx', name); return; }
        const now = this.ctx.currentTime;
        if (this.last[name] && now - this.last[name] < (opt.gap || .035)) return;
        if (this.voices > 40) return;
        this.last[name] = now; this.voices++; setTimeout(() => this.voices--, 400);
        const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const g = this.ctx.createGain();
        g.gain.value = (opt.v === undefined ? 1 : opt.v) * U.rand(.86, 1);
        if (pan) { pan.pan.value = U.clamp(opt.pan || 0, -1, 1); g.connect(pan); pan.connect(this.buses.sfx); } else g.connect(this.buses.sfx);
        // Every effect sits in the same room as the score, instead of playing bone dry.
        { const w = this.ctx.createGain(); w.gain.value = opt.wet === undefined ? (name === 'toll' || name === 'trumpet' ? .8 : .09) : opt.wet; g.connect(w); w.connect(this.reverb); }
        fn(g, now, (opt.p || 1) * U.rand(.94, 1.06));
    },
    /** Positional variant: pans and attenuates relative to the camera centre. */
    at(name, x, opt = {}) {
        const dx = (x - (G.cam.x + VW / 2)) / (VW * .7);
        Sound.sfx(name, Object.assign({}, opt, { pan: U.clamp(dx, -.8, .8), v: (opt.v === undefined ? 1 : opt.v) * U.clamp(1.25 - Math.abs(dx) * .7, .15, 1) }));
    }
};

const SFX = {
    ui_move(o, t) { Sound.tone(o, t, { type: 'triangle', f: 660, f2: 880, d: .05, v: .12 }); },
    ui_ok(o, t) { Sound.tone(o, t, { type: 'square', f: 440, d: .06, v: .08, lp: 2400 }); Sound.tone(o, t + .06, { type: 'square', f: 880, d: .1, v: .08, lp: 2400 }); },
    ui_back(o, t) { Sound.tone(o, t, { type: 'triangle', f: 500, f2: 240, d: .1, v: .13 }); },
    ui_select(o, t) { Sound.tone(o, t, { type: 'sawtooth', f: 220, f2: 880, d: .22, v: .1, lp: 3000 }); Sound.burst(o, t, { f: 3000, d: .2, v: .06 }); },
    ui_deny(o, t) { Sound.tone(o, t, { type: 'square', f: 150, d: .12, v: .1, lp: 900 }); },
    blip(o, t, p) { Sound.tone(o, t, { type: 'square', f: 520 * p, d: .025, v: .025, lp: 1800 }); },
    step_stone(o, t, p) { Sound.burst(o, t, { f: 260 * p, d: .05, v: .1, q: 1.2 }); Sound.tone(o, t, { f: 90 * p, f2: 60, d: .05, v: .1 }); },
    step_grass(o, t, p) { Sound.burst(o, t, { f: 2200 * p, d: .06, v: .05, q: .8 }); Sound.burst(o, t, { f: 600, d: .05, v: .05, brown: true }); },
    step_sand(o, t, p) { Sound.burst(o, t, { f: 3400 * p, f2: 1800, d: .09, v: .05, q: .6 }); },
    step_snow(o, t, p) { Sound.burst(o, t, { f: 1800 * p, f2: 900, d: .1, v: .08, q: 2 }); },
    step_metal(o, t, p) { Sound.tone(o, t, { type: 'square', f: 300 * p, d: .03, v: .05, lp: 1800 }); Sound.burst(o, t, { f: 1800, d: .04, v: .05 }); },
    jump(o, t, p) { Sound.burst(o, t, { f: 900 * p, f2: 2000, d: .1, v: .1 }); Sound.tone(o, t, { type: 'triangle', f: 200 * p, f2: 420, d: .09, v: .1 }); },
    land(o, t, p) { Sound.burst(o, t, { f: 300 * p, d: .09, v: .16, brown: true, ft: 'lowpass' }); Sound.tone(o, t, { f: 110, f2: 50, d: .1, v: .2 }); },
    dash(o, t, p) { Sound.burst(o, t, { f: 3000 * p, f2: 500, d: .2, v: .2, q: .7 }); },
    swing_l(o, t, p) { Sound.burst(o, t, { f: 2600 * p, f2: 900, d: .1, v: .14, q: 1.4 }); },
    swing_m(o, t, p) { Sound.burst(o, t, { f: 1800 * p, f2: 500, d: .14, v: .18, q: 1.2 }); },
    swing_h(o, t, p) { Sound.burst(o, t, { f: 900 * p, f2: 200, d: .24, v: .25, q: 1 }); Sound.tone(o, t, { f: 160, f2: 70, d: .2, v: .14 }); },
    hit_l(o, t, p) { Sound.burst(o, t, { f: 1700 * p, d: .05, v: .22, q: 1.4 }); Sound.tone(o, t, { type: 'square', f: 240 * p, f2: 90, d: .05, v: .1, lp: 1500 }); },
    hit_h(o, t, p) { Sound.burst(o, t, { f: 700 * p, d: .13, v: .3, q: .9 }); Sound.tone(o, t, { f: 160 * p, f2: 42, d: .2, v: .4 }); },
    hit_metal(o, t, p) { [980, 1460, 2310].forEach(f => Sound.tone(o, t, { type: 'square', f: f * p, d: .09, v: .05, lp: 5000 })); Sound.burst(o, t, { f: 3000, d: .05, v: .16 }); },
    crit(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 1200 * p, f2: 300, d: .16, v: .14, lp: 3800 }); Sound.burst(o, t, { f: 4200, d: .08, v: .2 }); },
    hurt(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 240 * p, f2: 90, d: .17, v: .17, lp: 1000 }); Sound.burst(o, t, { f: 500, d: .1, v: .2 }); },
    parry(o, t, p) { [1320, 1980, 2640].forEach(f => Sound.tone(o, t, { f: f * p, d: .3, v: .1 })); Sound.burst(o, t, { f: 5000, d: .05, v: .2 }); },
    block(o, t, p) { Sound.tone(o, t, { type: 'square', f: 210 * p, d: .07, v: .13, lp: 1400 }); Sound.burst(o, t, { f: 1300, d: .06, v: .18 }); },
    gun(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 880 * p, f2: 180, d: .08, v: .13, lp: 3500 }); Sound.burst(o, t, { f: 2500, d: .04, v: .1 }); },
    cannon(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 340 * p, f2: 60, d: .17, v: .28, lp: 2000 }); Sound.burst(o, t, { f: 800, d: .12, v: .24 }); },
    charge(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 110 * p, f2: 880, d: .7, v: .07, lp: 2200 }); },
    fire(o, t, p) { Sound.burst(o, t, { f: 900 * p, f2: 300, d: .22, v: .22, q: .6 }); },
    frost(o, t, p) { [2093, 3136].forEach(f => Sound.tone(o, t, { f: f * p, d: .22, v: .06 })); Sound.burst(o, t, { f: 6000, d: .12, v: .08 }); },
    volt(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 1400 * p, f2: 180, d: .1, v: .1, lp: 5000 }); Sound.burst(o, t, { f: 3800, d: .1, v: .12, q: 3 }); },
    blink(o, t, p) { Sound.tone(o, t, { f: 1800 * p, f2: 300, d: .16, v: .13 }); },
    knife(o, t, p) { Sound.burst(o, t, { f: 5000 * p, f2: 2200, d: .09, v: .1, q: 3 }); },
    explode(o, t, p) { Sound.burst(o, t, { ft: 'lowpass', f: 1800 * p, f2: 90, d: .6, v: .5, brown: true }); Sound.tone(o, t, { f: 120 * p, f2: 30, d: .55, v: .5 }); },
    bigboom(o, t, p) { Sound.burst(o, t, { ft: 'lowpass', f: 2500 * p, f2: 40, d: 1.5, v: .8, brown: true }); Sound.tone(o, t, { f: 90, f2: 22, d: 1.3, v: .7 }); Sound.burst(o, t, { f: 900, f2: 200, d: .6, v: .3 }); },
    slam(o, t, p) { Sound.tone(o, t, { f: 110 * p, f2: 34, d: .35, v: .6 }); Sound.burst(o, t, { ft: 'lowpass', f: 900, f2: 120, d: .3, v: .35, brown: true }); },
    ult(o, t, p) { [55, 82.5, 110, 165].forEach((f, i) => Sound.tone(o, t + i * .05, { type: 'sawtooth', f: f * p, f2: f * 4, d: .9, v: .1, lp: 2600 })); },
    warn(o, t) { Sound.tone(o, t, { type: 'square', f: 880, d: .07, v: .05, lp: 1800 }); Sound.tone(o, t + .1, { type: 'square', f: 660, d: .07, v: .05, lp: 1800 }); },
    roar(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 95 * p, f2: 48, d: .9, v: .32, lp: 900, q: 4 }); Sound.burst(o, t, { f: 420, f2: 170, d: .9, v: .3, q: 2 }); },
    screech(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 1100 * p, f2: 500, d: .25, v: .1, lp: 3500 }); },
    growl(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 120 * p, f2: 80, d: .3, v: .12, lp: 800, q: 5 }); },
    mech(o, t, p) { Sound.tone(o, t, { type: 'square', f: 90 * p, f2: 130, d: .18, v: .1, lp: 1000 }); Sound.burst(o, t, { f: 2000, d: .05, v: .07 }); },
    squish(o, t, p) { Sound.burst(o, t, { f: 500 * p, f2: 200, d: .13, v: .16, q: 4 }); },
    edeath(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 300 * p, f2: 50, d: .3, v: .14, lp: 1400 }); Sound.burst(o, t, { f: 900, d: .2, v: .13 }); },
    pickup(o, t, p) { [660, 990].forEach((f, i) => Sound.tone(o, t + i * .06, { type: 'triangle', f: f * p, d: .13, v: .13 })); },
    levelup(o, t) { [523, 659, 784, 1047].forEach((f, i) => Sound.tone(o, t + i * .09, { type: 'triangle', f, d: .3, v: .15 })); },
    checkpoint(o, t) { [392, 587, 784].forEach((f, i) => Sound.tone(o, t + i * .13, { f, d: .7, v: .14 })); },
    lever(o, t) { Sound.tone(o, t, { type: 'square', f: 120, d: .06, v: .13, lp: 1200 }); Sound.burst(o, t + .05, { f: 1400, d: .07, v: .14 }); },
    door(o, t) { Sound.burst(o, t, { ft: 'lowpass', f: 500, d: .8, v: .28, brown: true }); Sound.tone(o, t, { f: 60, f2: 44, d: .8, v: .24 }); },
    crumble(o, t, p) { for (let i = 0; i < 4; i++) Sound.burst(o, t + i * .05, { f: 500 * p, d: .09, v: .12, q: 2 }); },
    ice_crack(o, t, p) { [3000, 1700, 2500].forEach((f, i) => Sound.tone(o, t + i * .03, { type: 'square', f: f * p, d: .03, v: .04, lp: 6000 })); },
    lava_burst(o, t, p) { Sound.burst(o, t, { ft: 'lowpass', f: 700 * p, f2: 200, d: .5, v: .36, brown: true }); Sound.burst(o, t, { f: 1800, d: .4, v: .09 }); },
    laser(o, t, p) { Sound.tone(o, t, { type: 'sawtooth', f: 180 * p, d: .55, v: .15, lp: 2600 }); Sound.tone(o, t, { type: 'square', f: 1760 * p, f2: 880, d: .5, v: .03 }); },
    missile(o, t, p) { Sound.burst(o, t, { f: 1400 * p, f2: 2600, d: .35, v: .14, q: 2 }); },
    bird(o, t, p) { for (let i = 0; i < 3; i++) Sound.tone(o, t + i * .13, { f: 2600 * p, f2: 3300 * p, d: .08, v: .04 }); },
    cricket(o, t, p) { for (let i = 0; i < 5; i++) Sound.tone(o, t + i * .05, { type: 'square', f: 4200 * p, d: .018, v: .012 }); },
    drip(o, t, p) { Sound.tone(o, t, { f: 1500 * p, f2: 700, d: .07, v: .07 }); },
    distant_boom(o, t, p) { Sound.burst(o, t, { ft: 'lowpass', f: 240 * p, f2: 60, d: 1.8, v: .32, brown: true }); },
    trumpet(o, t) { [233, 349, 466].forEach((f, i) => { Sound.tone(o, t, { type: 'sawtooth', f, d: 1.3, v: .13, lp: 2200, a: .05 }); Sound.tone(o, t + .02, { type: 'square', f: f * 1.005, d: 1.25, v: .04, lp: 1600, a: .06 }); }); },
    toll(o, t, p) { [[.5, .24, 4], [1, .3, 3], [1.19, .14, 2.4], [1.5, .1, 2], [2, .1, 1.5], [2.74, .05, 1], [4.1, .03, .6]].forEach(([m, v, d]) => Sound.tone(o, t, { f: 196 * m * p, d, v, a: .004 })); },
    victory(o, t) { [[262, 330, 392], [294, 370, 440], [330, 415, 494], [392, 494, 587, 784]].forEach((ch, i) => ch.forEach(f => Sound.tone(o, t + i * .22, { type: 'sawtooth', f, d: i === 3 ? 1.6 : .22, v: .07, lp: 2200 }))); }
};

/* ----------------------------- AMBIENCE ------------------------------- */
const AMB_PROFILE = {
    none: {},
    city: { wind: .16, windF: 420, rumble: .08, shots: [['distant_boom', 9], ['drip', 4]] },
    forest: { wind: .08, windF: 900, water: .05, shots: [['bird', 4], ['cricket', 2.5], ['drip', 7]] },
    cave: { rumble: .1, wind: .03, windF: 260, shots: [['drip', 2.5]] },
    desert: { wind: .24, windF: 650, shots: [['distant_boom', 18]] },
    ice: { wind: .26, windF: 1100, shots: [['ice_crack', 8]] },
    lava: { rumble: .24, lava: .2, wind: .08, windF: 320, shots: [['distant_boom', 6], ['lava_burst', 8]] },
    void: { rumble: .28, lava: .05, wind: .1, windF: 200 },
    train: { rumble: .2, wind: .12, windF: 500 }
};
const Ambience = {
    nodes: {}, cur: 'none', storm: 0, nextShot: {},
    build() {
        const c = Sound.ctx, mk = (brown, type, f, q) => {
            const s = Sound.noiseSrc(brown), fl = c.createBiquadFilter(), g = c.createGain();
            fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = 0;
            s.connect(fl); fl.connect(g); g.connect(Sound.buses.ambient); s.start();
            return { g, fl };
        };
        this.nodes.wind = mk(false, 'bandpass', 500, .7);
        this.nodes.rumble = mk(true, 'lowpass', 90, .5);
        this.nodes.lava = mk(true, 'bandpass', 240, 1.6);
        this.nodes.water = mk(false, 'highpass', 2600, .4);
        this.nodes.storm = mk(false, 'bandpass', 1400, .5);
    },
    set(id) {
        this.cur = id; if (!Sound.ok) return;
        const p = AMB_PROFILE[id] || {}, t = Sound.ctx.currentTime, N = this.nodes;
        N.wind.g.gain.setTargetAtTime(p.wind || 0, t, 1);
        if (p.windF) N.wind.fl.frequency.setTargetAtTime(p.windF, t, 1);
        N.rumble.g.gain.setTargetAtTime(p.rumble || 0, t, 1);
        N.lava.g.gain.setTargetAtTime(p.lava || 0, t, 1);
        N.water.g.gain.setTargetAtTime(p.water || 0, t, 1);
        this.nextShot = {};
    },
    setStorm(v, freq) {
        if (!Sound.ok) return;
        const t = Sound.ctx.currentTime;
        this.nodes.storm.g.gain.setTargetAtTime(v, t, .8);
        if (freq) this.nodes.storm.fl.frequency.setTargetAtTime(freq, t, .8);
    },
    setProximity(lava) { if (Sound.ok && this.cur === 'lava') this.nodes.lava.g.gain.setTargetAtTime(.1 + lava * .35, Sound.ctx.currentTime, .3); },
    /** Random one-shots so the bed is never a plain loop. Called once per second. */
    update() {
        const p = AMB_PROFILE[this.cur]; if (!p || !p.shots) return;
        p.shots.forEach(([n, every]) => {
            if (this.nextShot[n] === undefined) this.nextShot[n] = U.rand(1, every);
            if (--this.nextShot[n] <= 0) { this.nextShot[n] = U.rand(every * .6, every * 1.5); Sound.sfx(n, { v: U.rand(.3, .8), pan: U.rand(-.7, .7), wet: .4, gap: .5 }); }
        });
    }
};
