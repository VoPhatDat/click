'use strict';
// ===== Audio: synthesized instruments, adaptive layered music, leitmotifs, SFX, voice =====
(function (PZ) {
  const A = PZ.Audio = { ctx: null, ready: false, track: null, nextBar: 0, bar: 0, intensity: 0, layerGains: [], muted: false, cache: new Map(), voiceOn: false };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  A.mtof = mtof;
  // note names → midi
  const NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const N = s => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); return 12 * (+m[3] + 1) + NN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  A.N = N;

  // ---------------- leitmotifs (shared by menu, cutscenes, battles) ----------------
  // [note, beats]
  A.THEME_AOCALYST = [['D4', 2], ['A4', 2], ['G4', 1], ['F4', 1], ['E4', 1], ['F4', 1], ['D4', 3], ['A3', 1], ['Bb3', 2], ['C4', 1], ['D4', 1], ['F4', 2], ['E4', 1], ['D4', 1], ['C4', 2], ['A3', 2], ['Bb3', 1], ['A3', 1], ['G3', 1], ['A3', 1], ['D4', 4]];
  A.THEME_GENESIS = [['F4', 2], ['E4', 1], ['F4', 1], ['Bb4', 2], ['A4', 1], ['G4', 1], ['A4', 4], ['D5', 2], ['C5', 1], ['Bb4', 1], ['A4', 2], ['C5', 2], ['G4', 2], ['E4', 2], ['G4', 1], ['Bb4', 1], ['A4', 1], ['C#5', 1], ['D5', 4]];
  A.CHORDS_THEME = [['D3', 'F3', 'A3'], ['G2', 'Bb2', 'D3'], ['D3', 'F3', 'A3'], ['Bb2', 'D3', 'F3'], ['F2', 'A2', 'C3'], ['A2', 'C3', 'E3'], ['G2', 'Bb2', 'D3', 'A2', 'C#3', 'E3'], ['D3', 'F3', 'A3']];
  A.MOTIF = { zero: ['D4', 'A4', 'G4', 'F4'], vesper: ['A4', 'Bb4', 'A4', 'F4', 'E4'], nyx: ['D6', 'F6', 'A6', 'C7'], seraphina: ['A4', 'F#4', 'G#4', 'E4', 'D4'] };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    A.ctx = new AC({ latencyHint: 'interactive' });
    A.build(A.ctx);
    A.ready = true;
    A.loop = setInterval(A.schedule, 50);
  };
  A.build = function (ctx) {
    const o = {};
    o.master = ctx.createGain(); o.master.gain.value = .9;
    o.comp = ctx.createDynamicsCompressor(); o.comp.threshold.value = -14; o.comp.ratio.value = 4; o.comp.attack.value = .005; o.comp.release.value = .2;
    o.lp = ctx.createBiquadFilter(); o.lp.type = 'lowpass'; o.lp.frequency.value = 20000;
    o.master.connect(o.lp); o.lp.connect(o.comp); o.comp.connect(ctx.destination);
    o.music = ctx.createGain(); o.music.gain.value = PZ.Settings.music;
    o.duckG = ctx.createGain(); o.music.connect(o.duckG); o.duckG.connect(o.master);
    o.sfx = ctx.createGain(); o.sfx.gain.value = PZ.Settings.sfx; o.sfx.connect(o.master);
    o.voice = ctx.createGain(); o.voice.gain.value = PZ.Settings.voice; o.voice.connect(o.master);
    // convolution reverb (generated impulse)
    o.rev = ctx.createConvolver(); o.rev.buffer = A.impulse(ctx, 3.2, 2.6); o.revOut = ctx.createGain(); o.revOut.gain.value = .55; o.rev.connect(o.revOut); o.revOut.connect(o.master);
    o.revSend = ctx.createGain(); o.revSend.gain.value = 1; o.revSend.connect(o.rev);
    // layer gains for adaptive music (explore, near, combat, danger)
    o.layers = [0, 1, 2, 3].map(i => { const g = ctx.createGain(); g.gain.value = i === 0 ? 1 : 0; g.connect(o.music); const s = ctx.createGain(); s.gain.value = .35; g.connect(s); s.connect(o.revSend); return g; });
    o.sfxRev = ctx.createGain(); o.sfxRev.gain.value = .25; o.sfx.connect(o.sfxRev); o.sfxRev.connect(o.revSend);
    o.noise = A.noiseBuf(ctx, 2);
    Object.assign(A, o);
  };
  A.impulse = function (ctx, sec, decay) {
    const L = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, L, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < L; i++) { const t = i / L; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < 400 ? i / 400 : 1); } }
    return b;
  };
  A.noiseBuf = function (ctx, sec) { const L = ctx.sampleRate * sec, b = ctx.createBuffer(1, L, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < L; i++) d[i] = Math.random() * 2 - 1; return b; };
  A.setVolumes = function () { if (!A.ctx) return; A.music.gain.value = PZ.Settings.music; A.sfx.gain.value = PZ.Settings.sfx; A.voice.gain.value = PZ.Settings.voice; };

  // ---------------- instruments ----------------
  const env = (g, t, a, peak, d, sus, rel, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * sus, t + a, d); g.gain.setTargetAtTime(0.0001, t + dur, rel); };
  const out = (node, dest, pan) => { if (pan != null && A.ctx.createStereoPanner) { const p = A.ctx.createStereoPanner(); p.pan.value = PZ.clamp(pan, -1, 1); node.connect(p); p.connect(dest); } else node.connect(dest); };
  const osc = (type, f, t, stop, det) => { const o = A.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (det) o.detune.value = det; o.start(t); o.stop(stop); return o; };
  A.I = {
    // Karplus–Strong plucked string (harp/guitar/dulcimer)
    pluck(dest, m, t, dur, vol, o) {
      o = o || {}; const ctx = A.ctx, key = m + ':' + (o.bright || .5) + ':' + ctx.sampleRate;
      let buf = A.cache.get(key);
      if (!buf) {
        const sr = ctx.sampleRate, L = Math.floor(sr * 2.2), b = ctx.createBuffer(1, L, sr), d = b.getChannelData(0), P = Math.max(2, Math.round(sr / mtof(m)));
        const damp = .5 + (o.bright || .5) * .49;
        for (let i = 0; i < P; i++) d[i] = Math.random() * 2 - 1;
        for (let i = P; i < L; i++) d[i] = (d[i - P] * damp + d[i - P + 1] * (1 - damp)) * .996;
        buf = b; A.cache.set(key, b);
      }
      const s = ctx.createBufferSource(); s.buffer = buf; const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.setTargetAtTime(0.0001, t + dur, .3);
      s.connect(g); out(g, dest, o.pan); s.start(t); s.stop(t + dur + 1.5);
    },
    bell(dest, m, t, dur, vol, o) {
      o = o || {}; const f = mtof(m), ctx = A.ctx;
      const car = osc('sine', f, t, t + dur + 3), mod = osc('sine', f * (o.ratio || 3.5), t, t + dur + 3), mg = ctx.createGain();
      mg.gain.setValueAtTime(f * (o.index || 2.2), t); mg.gain.exponentialRampToValueAtTime(f * .05, t + (o.decay || 2.5)); mod.connect(mg); mg.connect(car.frequency);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (o.decay || 2.5) + .5); car.connect(g); out(g, dest, o.pan);
    },
    organ(dest, m, t, dur, vol, o) {
      const f = mtof(m), ctx = A.ctx, g = ctx.createGain(); env(g, t, .06, vol, .2, .85, .25, dur);
      [[1, 1], [2, .6], [3, .35], [4, .3], [6, .15], [8, .12], [.5, .5]].forEach(([h, a]) => { const x = osc('sine', f * h, t, t + dur + 1.2); const xg = ctx.createGain(); xg.gain.value = a * .22; x.connect(xg); xg.connect(g); });
      out(g, dest, o && o.pan);
    },
    strings(dest, m, t, dur, vol, o) {
      o = o || {}; const f = mtof(m), ctx = A.ctx, g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.bright ? 3600 : 2200; lp.Q.value = .5;
      env(g, t, o.att || .25, vol, .3, .9, o.rel || .35, dur);
      const vib = osc('sine', 5.2, t, t + dur + 2), vg = ctx.createGain(); vg.gain.value = f * .006; vib.connect(vg);
      for (const d of [-9, 0, 8]) { const x = osc('sawtooth', f, t, t + dur + 2, d); vg.connect(x.frequency); x.connect(lp); }
      const sc = ctx.createGain(); sc.gain.value = .12; lp.connect(sc); sc.connect(g); out(g, dest, o.pan);
    },
    brass(dest, m, t, dur, vol, o) {
      const f = mtof(m), ctx = A.ctx, g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
      lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(2800, t + .09); lp.frequency.setTargetAtTime(1400, t + .1, .3);
      env(g, t, .05, vol, .2, .8, .15, dur);
      for (const d of [-6, 5]) { const x = osc('sawtooth', f, t, t + dur + 1, d); x.connect(lp); }
      const sc = ctx.createGain(); sc.gain.value = .16; lp.connect(sc); sc.connect(g); out(g, dest, o && o.pan);
    },
    choir(dest, m, t, dur, vol, o) {
      o = o || {}; const f = mtof(m), ctx = A.ctx, g = ctx.createGain(); env(g, t, o.att || .35, vol, .4, .9, .5, dur);
      const F = { a: [800, 1150, 2900], o: [450, 800, 2830], u: [325, 700, 2530], e: [400, 1700, 2600], i: [300, 2200, 3000] }[o.vowel || 'a'];
      const src = ctx.createGain(); src.gain.value = .5;
      const vib = osc('sine', 4.8 + Math.random(), t, t + dur + 2), vg = ctx.createGain(); vg.gain.value = f * .012; vib.connect(vg);
      for (const d of (o.solo ? [0] : [-12, 0, 11])) { const x = osc('sawtooth', f, t, t + dur + 2, d); vg.connect(x.frequency); x.connect(src); }
      F.forEach((ff, i) => { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff * (o.female ? 1.15 : 1); bp.Q.value = 9; const bg = ctx.createGain(); bg.gain.value = [1, .55, .25][i] * 1.4; src.connect(bp); bp.connect(bg); bg.connect(g); });
      out(g, dest, o.pan);
    },
    piano(dest, m, t, dur, vol, o) {
      const f = mtof(m), ctx = A.ctx, g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(vol * .3, t + .4); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(.5, dur) + 1.6);
      [[1, 1], [2.003, .45], [3.01, .2], [4.02, .12], [5.04, .06]].forEach(([h, a]) => { const x = osc(h === 1 ? 'triangle' : 'sine', f * h, t, t + dur + 2); const xg = ctx.createGain(); xg.gain.value = a * .5; x.connect(xg); xg.connect(g); });
      out(g, dest, o && o.pan);
    },
    celesta(dest, m, t, dur, vol, o) { A.I.bell(dest, m, t, dur, vol, Object.assign({ ratio: 4, index: .6, decay: 1.2 }, o)); },
    musicbox(dest, m, t, dur, vol, o) { A.I.bell(dest, m + (o && o.detune || 0), t, dur, vol, { ratio: 5.1, index: .8, decay: .9, pan: o && o.pan }); },
    flute(dest, m, t, dur, vol, o) {
      const f = mtof(m), ctx = A.ctx, g = ctx.createGain(); env(g, t, .08, vol, .2, .9, .15, dur);
      const x = osc('sine', f, t, t + dur + 1); const vib = osc('sine', 5, t, t + dur + 1), vg = ctx.createGain(); vg.gain.value = f * .008; vib.connect(vg); vg.connect(x.frequency); x.connect(g);
      const n = ctx.createBufferSource(); n.buffer = A.noise; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3; const ng = ctx.createGain(); ng.gain.value = .05; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t); n.stop(t + dur + .5);
      out(g, dest, o && o.pan);
    },
    pad(dest, m, t, dur, vol, o) {
      const f = mtof(m), ctx = A.ctx, g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = (o && o.cut) || 900;
      env(g, t, (o && o.att) || 1.2, vol, .5, .95, 1.2, dur);
      for (const d of [-14, -5, 6, 13]) { const x = osc('sawtooth', f, t, t + dur + 4, d); x.connect(lp); }
      const sc = ctx.createGain(); sc.gain.value = .1; lp.connect(sc); sc.connect(g); out(g, dest, o && o.pan);
    },
    bass(dest, m, t, dur, vol, o) { const f = mtof(m), ctx = A.ctx, g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = (o && o.cut) || 400; env(g, t, .01, vol, .2, .7, .1, dur); const x = osc((o && o.wave) || 'sawtooth', f, t, t + dur + 1); x.connect(lp); lp.connect(g); if (o && o.dist) { const ws = ctx.createWaveShaper(); ws.curve = A.distCurve(); g.disconnect(); lp.disconnect(); lp.connect(ws); ws.connect(g); } out(g, dest); },
    // percussion
    kick(dest, t, vol) { const ctx = A.ctx, x = osc('sine', 120, t, t + .5), g = ctx.createGain(); x.frequency.exponentialRampToValueAtTime(40, t + .15); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .45); x.connect(g); g.connect(dest); },
    taiko(dest, t, vol, o) { const ctx = A.ctx, x = osc('sine', (o && o.f) || 70, t, t + 1.2), g = ctx.createGain(); x.frequency.exponentialRampToValueAtTime(42, t + .4); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1); x.connect(g); g.connect(dest); A.I.noiseHit(dest, t, vol * .5, 300, .25); },
    snare(dest, t, vol) { A.I.noiseHit(dest, t, vol, 1800, .16, 'bandpass'); const x = osc('triangle', 190, t, t + .1), g = A.ctx.createGain(); g.gain.setValueAtTime(vol * .5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .1); x.connect(g); g.connect(dest); },
    hat(dest, t, vol) { A.I.noiseHit(dest, t, vol, 8000, .05, 'highpass'); },
    tick(dest, t, vol, o) { const x = osc('square', (o && o.f) || 2400, t, t + .03), g = A.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + .03); x.connect(g); out(g, dest, o && o.pan); },
    noiseHit(dest, t, vol, freq, dec, type, pan) { const ctx = A.ctx, n = ctx.createBufferSource(); n.buffer = A.noise; n.playbackRate.value = .8 + Math.random() * .4; const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec); n.connect(f); f.connect(g); out(g, dest, pan); n.start(t, Math.random()); n.stop(t + dec + .05); }
  };
  A.distCurve = function () { if (A._dc) return A._dc; const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; c[i] = Math.tanh(x * 3); } return (A._dc = c); };

  // play a melody array from a start time
  A.melody = function (dest, inst, notes, t0, beat, vol, o, transpose) {
    let t = t0; for (const [n, b] of notes) { if (n !== 'r') A.I[inst](dest, N(n) + (transpose || 0), t, b * beat * .95, vol, o); t += b * beat; } return t;
  };

  // ---------------- tracks ----------------
  // Each track: bpm, beats per bar, bars, and bar(L, bar, t, beat) which schedules notes into layer gains L[0..3]
  const deg = (root, scale, d, oct) => { const n = scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return root + scale[i] + 12 * (o + (oct || 0)); };
  const LYD = [0, 2, 4, 6, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], MAJ = [0, 2, 4, 5, 7, 9, 11], DOR = [0, 2, 3, 5, 7, 9, 10], PHR = [0, 1, 3, 5, 7, 8, 10];
  A.TRACKS = {
    title: {
      name: { vi: 'Chủ đề Aocalyst', en: 'Aocalyst Theme' }, bpm: 58, bpb: 4, bars: 8,
      bar(L, b, t, q) {
        const ch = A.CHORDS_THEME[b % 8];
        for (const n of ch.slice(0, 3)) A.I.organ(L[0], N(n), t, q * 4, .09);
        A.I.organ(L[0], N(ch[0]) - 12, t, q * 4, .08);
        if (b % 16 >= 8 || this.loops > 0) { for (const n of ch.slice(0, 3)) A.I.choir(L[0], N(n) + 12, t, q * 4, .05, { vowel: 'o' }); }
        // melody for this bar
        let acc = 0, idx = 0; const mel = A.THEME_AOCALYST; const barStart = (b % 8) * 4;
        for (const [n, d] of mel) { if (acc >= barStart && acc < barStart + 4) A.I.strings(L[0], N(n), t + (acc - barStart) * q, d * q * .98, .16, { bright: true }); acc += d; idx++; }
        if (b % 8 === 7) this.loops = (this.loops || 0) + 1;
      }
    },
    prologue: {
      name: { vi: 'Kính Màu', en: 'Stained Glass' }, bpm: 66, bpb: 4, bars: 8,
      bar(L, b, t, q) {
        const ch = A.CHORDS_THEME[b % 8];
        A.I.pad(L[0], N(ch[0]) - 12, t, q * 4, .12, { cut: 600 });
        for (let i = 0; i < 8; i++) A.I.pluck(L[0], N(ch[i % 3]) + 12 + (i >= 4 ? 12 : 0), t + i * q / 2, q, .13, { bright: .6, pan: Math.sin(i) * .4 });
        if (b >= 4) { let acc = 0; const bs = (b % 8) * 4; for (const [n, d] of A.THEME_AOCALYST) { if (acc >= bs && acc < bs + 4) A.I.choir(L[0], N(n) + 12, t + (acc - bs) * q, d * q, .07, { vowel: 'a', solo: true, female: true }); acc += d; } }
      }
    },
    hub: {
      name: { vi: 'Vườn Sáng Thế', en: 'Garden of Genesis' }, bpm: 84, bpb: 4, bars: 8,
      bar(L, b, t, q) {
        const prog = [[7, 11, 14], [0, 4, 7], [4, 7, 11], [2, 6, 9]]; const root = N('G3'); const c = prog[b % 4];
        const night = PZ.R && PZ.R.nightK;
        for (let i = 0; i < 8; i++) A.I.pluck(L[0], root + c[[0, 1, 2, 1, 0, 2, 1, 2][i]] + (i % 4 === 2 ? 12 : 0), t + i * q / 2, q, .12, { bright: .45, pan: -.3 });
        A.I.bass(L[0], root - 12 + c[0] % 12, t, q * 3.5, .12, { wave: 'triangle', cut: 500 });
        A.I.strings(L[0], root + c[1], t, q * 4, .05);
        const mel = [[14, 2], [12, 1], [11, 1], [9, 2], [7, 2], [11, 1], [12, 1], [14, 1], [16, 1], [14, 4], [12, 2], [11, 2], [9, 1], [11, 1], [7, 2], [7, 4]];
        if (b % 8 >= 4) { let acc = 0; const bs = (b % 4) * 4; for (const [s, d] of mel) { if (acc >= bs && acc < bs + 4) A.I[night ? 'celesta' : 'flute'](L[0], root + 12 + s - (night ? 0 : 0), t + (acc - bs) * q, d * q, night ? .08 : .09); acc += d; } }
        if (night && b % 2 === 0) A.melody(L[0], 'celesta', A.MOTIF.nyx.map(n => [n, .5]), t + q * 2, q, .04);
      }
    },
    ch1: {
      name: { vi: 'Thành Phố Bình Minh Vĩnh Cửu', en: 'City of Eternal Dawn' }, bpm: 72, bpb: 6, bars: 8, sub: 2, // 6/8: 6 eighths per bar, q = eighth
      bar(L, b, t, q) {
        const root = N('D4'); const chords = [0, 4, 1, 4, 0, 3, 1, 4];
        const c = chords[b % 8];
        // explore: harp arpeggios + bells + female chant (Gregorian-like, lydian G#)
        for (let i = 0; i < 6; i++) A.I.pluck(L[0], deg(root, LYD, c + [0, 2, 4, 7, 4, 2][i], -1), t + i * q, q * 2, .1, { bright: .7, pan: (i - 2.5) * .15 });
        if (b % 2 === 0) A.I.bell(L[0], deg(root, LYD, c + 7), t, q * 6, .035, { pan: .4 });
        A.I.pad(L[0], deg(root, LYD, c, -2), t, q * 6, .07, { cut: 700 });
        const chant = [[0, 3], [1, 1], [2, 2], [3, 3], [2, 3], [4, 2], [3, 1], [2, 3], [1, 3], [0, 6]];
        if (b % 8 >= 2) { let acc = 0; const bs = ((b - 2) % 6) * 6; for (const [d, len] of chant) { if (acc >= bs && acc < bs + 6) A.I.choir(L[0], deg(root, LYD, d), t + (acc - bs) * q, len * q, .06, { vowel: 'a', solo: true, female: true }); acc += len; } }
        // near: soft frame drum + low strings
        A.I.taiko(L[1], t, .18, { f: 90 }); A.I.taiko(L[1], t + q * 3, .1, { f: 110 });
        A.I.strings(L[1], deg(root, LYD, c, -1), t, q * 6, .06);
        // combat: strings ostinato + choir chords + drums
        for (let i = 0; i < 6; i++) A.I.strings(L[2], deg(root, LYD, c + [0, 4, 2, 4, 0, 4][i], 0), t + i * q, q * .9, .05, { att: .02, rel: .08, bright: true });
        A.I.choir(L[2], deg(root, LYD, c, 0), t, q * 6, .04, { vowel: 'o' }); A.I.choir(L[2], deg(root, LYD, c + 2, 0), t, q * 6, .035, { vowel: 'o' });
        A.I.taiko(L[2], t, .3); A.I.taiko(L[2], t + q * 2, .14); A.I.taiko(L[2], t + q * 3, .25); A.I.snare(L[2], t + q * 5, .08);
        // danger: brass stabs on Zero motif
        if (b % 2 === 0) A.melody(L[3], 'brass', A.MOTIF.zero.map(n => [n, 1.5]), t, q, .07);
      }
    },
    knight: {
      name: { vi: 'Kẻ Gác Cổng Bình Minh', en: 'Warden of the Dawn Gate' }, bpm: 104, bpb: 6, bars: 4, sub: 2,
      bar(L, b, t, q) {
        const root = N('D3'); const c = [0, 0, 3, 4][b % 4];
        for (let i = 0; i < 6; i++) A.I.strings(L[0], deg(root, LYD, c + [0, 0, 4, 0, 5, 4][i], 1), t + i * q, q * .85, .07, { att: .01, rel: .06, bright: true });
        A.I.bass(L[0], deg(root, LYD, c, -1), t, q * 6, .14, { cut: 600 });
        A.I.taiko(L[0], t, .34); A.I.taiko(L[0], t + q * 1.5, .18); A.I.taiko(L[0], t + q * 3, .3); A.I.snare(L[0], t + q * 4.5, .14); A.I.snare(L[0], t + q * 5, .1);
        A.I.brass(L[0], deg(root, LYD, c + 4, 1), t, q * 2.8, .08); A.I.brass(L[0], deg(root, LYD, c + 7, 1), t + q * 3, q * 2.8, .08);
        if (b % 4 === 3) A.I.bell(L[0], deg(root, LYD, c + 7, 1), t + q * 3, q * 3, .06);
        A.I.hat(L[0], t + q * 2, .05); A.I.hat(L[0], t + q * 5, .05);
      }
    },
    seraphina: {
      name: { vi: 'Requiem cho Ngày Thứ Nhất', en: 'Requiem for the First Day' }, bpm: 76, bpb: 4, bars: 8,
      bar(L, b, t, q) {
        // L0 = phase1 (choir + organ), L1 = phase2 adds tremolo strings + brass, L2 = phase3 near-silence drone, L3 = sting
        const root = N('D3'); const prog = [0, 5, 3, 4, 0, 5, 1, 4]; const c = prog[b % 8];
        const sc = b % 16 < 8 ? MIN : LYD;
        A.I.organ(L[0], deg(root, sc, c, -1), t, q * 4, .08);
        for (const d of [0, 2, 4]) A.I.choir(L[0], deg(root, sc, c + d, 1), t, q * 4, .045, { vowel: b % 2 ? 'a' : 'o', female: true });
        const mel = A.MOTIF.seraphina; A.I.choir(L[0], N(mel[b % mel.length]) + 12, t + q * 2, q * 2, .05, { vowel: 'a', solo: true, female: true });
        A.I.taiko(L[0], t, .26, { f: 60 }); A.I.taiko(L[0], t + q * 2.5, .12, { f: 60 });
        for (let i = 0; i < 16; i++) A.I.strings(L[1], deg(root, sc, c + (i % 4 < 2 ? 4 : 2), 1), t + i * q / 4, q / 4 * .9, .03, { att: .01, rel: .04, bright: true });
        A.I.brass(L[1], deg(root, sc, c, 0), t, q * 2, .08); A.I.brass(L[1], deg(root, sc, c + 4, 0), t + q * 2, q * 2, .07);
        A.I.snare(L[1], t + q, .05); A.I.snare(L[1], t + q * 3, .05);
        A.I.pad(L[2], root - 12, t, q * 4, .06, { cut: 250, att: 2 });
        if (b % 2 === 0) A.I.choir(L[2], root + 12, t, q * 4, .015, { vowel: 'u', solo: true, female: true });
      }
    },
    lullaby: {
      name: { vi: 'Giấc Ngủ Đầu Tiên', en: 'The First Sleep' }, bpm: 60, bpb: 3, bars: 8,
      bar(L, b, t, q) {
        const root = N('D5'); const mel = [[0, 2], [2, 1], [4, 3], [3, 2], [2, 1], [0, 3], [1, 2], [2, 1], [3, 3], [2, 2], [1, 1], [0, 3]];
        let acc = 0; const bs = (b % 4) * 3; for (const [d, len] of mel) { if (acc >= bs && acc < bs + 3) A.I.celesta(L[0], deg(root, MAJ, d, 0), t + (acc - bs) * q, len * q, .07); acc += len; }
        A.I.pluck(L[0], deg(N('D3'), MAJ, [0, 3, 4, 0][b % 4]), t, q * 3, .1, { bright: .3 });
        A.I.strings(L[0], deg(N('D4'), MAJ, [2, 5, 6, 2][b % 4]), t, q * 3, .04);
      }
    },
    death: {
      name: { vi: 'Tro', en: 'Ash' }, bpm: 50, bpb: 4, bars: 2,
      bar(L, b, t, q) { A.I.organ(L[0], N(b % 2 ? 'C3' : 'D3'), t, q * 4, .07); A.I.choir(L[0], N(b % 2 ? 'E4' : 'F4'), t, q * 4, .04, { vowel: 'u' }); }
    }
  };
  A.TRACK_ORDER = ['title', 'prologue', 'hub', 'ch1', 'knight', 'seraphina', 'lullaby', 'death'];

  // ---------------- scheduler (bar-quantized transitions) ----------------
  A.play = function (id, o) {
    o = o || {};
    if (!A.ctx) { A.pending = id; return; }
    if (A.track && A.track.id === id) return;
    const tr = A.TRACKS[id]; if (!tr) return;
    const now = A.ctx.currentTime;
    // quantize: switch on next bar boundary of the current track (or now)
    const at = A.track && !o.now ? Math.max(now + .05, A.nextBar) : now + .1;
    if (A.track) for (const g of A.layers) { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, at + .6); }
    A.newLayers(at);
    A.track = Object.assign({ id }, tr, { loops: 0 }); A.bar = 0; A.nextBar = at;
    if (PZ.Store) { const s = PZ.Store.get('pz2_music') || {}; s[id] = 1; PZ.Store.set('pz2_music', s); }
  };
  A.newLayers = function (at) {
    // fresh layer gains so old notes keep their old (fading) gains
    const ctx = A.ctx;
    const old = A.layers;
    A.layers = [0, 1, 2, 3].map(i => { const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(i <= A.intensity ? 1 : 0, at + .4); g.connect(A.music); const s = ctx.createGain(); s.gain.value = .35; g.connect(s); s.connect(A.revSend); return g; });
    setTimeout(() => old.forEach(g => { try { g.disconnect(); } catch (e) { } }), 8000);
  };
  A.stop = function () { if (!A.ctx || !A.track) return; const now = A.ctx.currentTime; for (const g of A.layers) { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 1.2); } A.track = null; };
  // layered intensity: 0 explore, 1 enemies near, 2 combat, 3 danger
  A.setIntensity = function (n, exact) {
    if (!A.ctx || n === A.intensity) return; A.intensity = n;
    const now = A.ctx.currentTime;
    A.layers.forEach((g, i) => { const on = exact ? i === n || (exact === 'plus0' && i === 0) : i <= n; g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(on ? 1 : 0, Math.max(now + .3, A.nextBar)); });
  };
  A.setLayers = function (arr) { if (!A.ctx) return; const now = A.ctx.currentTime; A.layers.forEach((g, i) => { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(arr[i] || 0, Math.max(now + .3, A.nextBar)); }); A.intensity = -1; };
  A.schedule = function () {
    if (!A.ctx || !A.track) return;
    const tr = A.track, ctx = A.ctx;
    while (A.nextBar < ctx.currentTime + .4) {
      const q = 60 / tr.bpm / (tr.sub || 1);
      try { tr.bar.call(tr, A.layers, A.bar, A.nextBar, q); } catch (e) { console.warn(e); }
      A.nextBar += q * tr.bpb; A.bar++;
    }
  };
  A.duckTo = function (v) { if (!A.ctx || !A.duckG) return; const now = A.ctx.currentTime, d = A.duckG.gain; d.cancelScheduledValues(now); d.setValueAtTime(d.value, now); d.linearRampToValueAtTime(v, now + .25); };
  // low HP filter + slowmo filter
  A.setFilter = function (lowHp, slow) { if (!A.ctx) return; const f = slow ? 900 : lowHp ? 1600 : 20000; if (Math.abs(A.lp.frequency.value - f) > 10) A.lp.frequency.setTargetAtTime(f, A.ctx.currentTime, .15); };

  // ---------------- SFX ----------------
  A.sfxPlay = function (id, pan, o) {
    if (!A.ctx || !A.ready) return;
    o = o || {}; const t = A.ctx.currentTime + .005, D = A.sfx, I = A.I;
    pan = PZ.clamp(pan || 0, -1, 1);
    const sweep = (f0, f1, dur, vol, q) => { const n = A.ctx.createBufferSource(); n.buffer = A.noise; const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || 2; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(bp); bp.connect(g); out(g, D, pan); n.start(t, Math.random()); n.stop(t + dur + .05); };
    const tone = (type, f0, f1, dur, vol) => { const x = osc(type, f0, t, t + dur + .05); x.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); const g = A.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); x.connect(g); out(g, D, pan); };
    const metal = (f, vol, dec) => { [1, 2.76, 5.4, 8.93].forEach((h, i) => { const x = osc('sine', f * h, t, t + dec); const g = A.ctx.createGain(); g.gain.setValueAtTime(vol / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dec / (i * .5 + 1)); x.connect(g); out(g, D, pan); }); };
    const base = id.replace(/_hit$/, '');
    if (id.endsWith('_hit')) {
      switch (base) {
        case 'sword': sweep(3000, 1500, .08, .25, 1); metal(900 + Math.random() * 200, .05, .25); tone('sine', 180, 60, .1, .25); break;
        case 'heavy': tone('sine', 120, 40, .25, .5); I.noiseHit(D, t, .35, 900, .2, 'lowpass', pan); metal(400, .06, .4); break;
        case 'chain': I.noiseHit(D, t, .2, 5000, .1, 'highpass', pan); metal(1800, .04, .2); break;
        case 'shield': tone('sine', 140, 50, .2, .45); metal(620, .08, .5); break;
        case 'spear': sweep(2400, 900, .07, .2); tone('sine', 200, 70, .12, .3); break;
        case 'dagger': case 'claw': sweep(5000, 2500, .05, .2, 1.5); tone('sine', 260, 90, .06, .18); break;
        case 'scythe': sweep(1800, 500, .12, .25); tone('sine', 160, 50, .15, .25); break;
        case 'bow': tone('sine', 300, 100, .08, .2); I.noiseHit(D, t, .15, 2000, .06, 'bandpass', pan); break;
        case 'magic': case 'glass': I.bell(D, 84 + Math.random() * 5, t, .2, .05, { ratio: 2.4, index: 1, decay: .4, pan }); I.noiseHit(D, t, .12, 3000, .1, 'bandpass', pan); break;
        case 'whip': I.noiseHit(D, t, .3, 6000, .04, 'highpass', pan); tone('sine', 220, 80, .08, .2); break;
        default: tone('sine', 180, 60, .1, .3); I.noiseHit(D, t, .2, 1200, .1, 'lowpass', pan);
      }
      return;
    }
    switch (id) {
      case 'sword': sweep(900 + (o.idx || 0) * 200, 4000, .14, .12, 1.2); break;
      case 'heavy': sweep(300, 1500, .28, .16, 1); break;
      case 'chain': for (let i = 0; i < 4; i++) I.noiseHit(D, t + i * .03, .08, 6000, .04, 'highpass', pan); sweep(600, 2400, .2, .08); break;
      case 'shield': sweep(400, 1200, .18, .12); break;
      case 'spear': sweep(1500, 3000, .12, .12); break;
      case 'dagger': case 'claw': sweep(2000, 6000, .07, .08, 1.5); break;
      case 'scythe': sweep(400, 2200, .3, .14); break;
      case 'bow': I.pluck(D, 50, t, .2, .2, { bright: .9, pan }); break;
      case 'magic': I.bell(D, 88, t, .3, .04, { ratio: 3, index: 1.5, decay: .5, pan }); sweep(800, 3000, .25, .05, 4); break;
      case 'glass': sweep(1200, 600, .15, .08); break;
      case 'whip': sweep(800, 5000, .12, .1, 2); break;
      case 'jump': tone('sine', 180, 320, .08, .06); sweep(400, 1200, .1, .04); break;
      case 'jump2': tone('sine', 300, 600, .1, .06); I.bell(D, 86, t, .1, .02, { pan }); break;
      case 'dash': sweep(500, 3500, .2, .12, 1); break;
      case 'hurt': tone('sine', 160, 50, .2, .4); I.noiseHit(D, t, .25, 800, .15, 'lowpass', pan); break;
      case 'block': case 'clang': metal(700 + Math.random() * 100, .1, .6); I.noiseHit(D, t, .2, 3000, .05, 'highpass', pan); break;
      case 'parry': I.bell(D, 91, t, 1, .12, { ratio: 2.01, index: 1.2, decay: 1.8, pan }); I.bell(D, 98, t, 1, .06, { ratio: 3, index: .5, decay: 1.4, pan }); metal(1200, .08, .8); break;
      case 'kill': I.bell(D, 81 + Math.floor(Math.random() * 3) * 2, t, .4, .05, { ratio: 3.5, index: 1, decay: .8, pan }); I.noiseHit(D, t, .15, 2000, .3, 'bandpass', pan); break;
      case 'swipe': sweep(500, 1800, .15, .1); break;
      case 'charge': sweep(300, 2000, .4, .1, 3); break;
      case 'explode': tone('sine', 90, 30, .5, .6); I.noiseHit(D, t, .5, 1500, .5, 'lowpass', pan); break;
      case 'fuse': for (let i = 0; i < 6; i++) I.tick(D, t + i * .12, .04, { f: 1800 + i * 200, pan }); break;
      case 'hymn': I.choir(D, 79, t, .5, .04, { vowel: 'a', solo: true, female: true, pan }); break;
      case 'tele': tone('sawtooth', 220, 440, .3, .04); break;
      case 'slam': tone('sine', 70, 30, .6, .7); I.noiseHit(D, t, .5, 600, .6, 'lowpass', pan); break;
      case 'blink': sweep(4000, 400, .2, .1, 6); break;
      case 'bossdown': I.taiko(D, t, .6); I.bell(D, 62, t, 3, .1, { decay: 4, pan }); I.choir(D, 74, t, 2.5, .05, { vowel: 'a' }); break;
      case 'radiance_charge': I.choir(D, 74, t, 2.2, .05, { vowel: 'a', female: true, att: 1.8 }); I.choir(D, 81, t, 2.2, .04, { vowel: 'a', female: true, att: 2 }); sweep(200, 6000, 2.3, .06, 1); break;
      case 'radiance': I.noiseHit(D, t, .5, 9000, 1, 'highpass', 0); I.bell(D, 86, t, 2, .1, { ratio: 1.5, index: 3, decay: 2.5 }); tone('sine', 80, 40, .8, .4); break;
      case 'feathers': for (let i = 0; i < 3; i++) sweep(2500, 5000, .1, .05, 3); break;
      case 'sweep': sweep(300, 2500, .5, .2, 1); break;
      // Seraphina phase 3: spatial audio cues — the core mechanic
      case 'bell': I.bell(D, 74, t, 1.5, .28, { ratio: 2.4, index: 2.5, decay: 2.5, pan: pan > 0 ? 1 : -1 }); I.bell(D, 62, t, 1.5, .12, { ratio: 2, index: 1, decay: 2, pan: pan > 0 ? 1 : -1 }); break;
      case 'bellhigh': I.bell(D, 93, t, 1, .2, { ratio: 3.1, index: 1.5, decay: 1.5, pan }); I.bell(D, 98, t + .15, 1, .12, { ratio: 3, index: 1, decay: 1.2, pan }); break;
      case 'rush': sweep(200, 3000, .6, .25, 1); break;
      case 'hum': { const x = osc('sine', 220, t, t + .5), g = A.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.08, t + .1); g.gain.exponentialRampToValueAtTime(0.0001, t + .5); x.connect(g); out(g, D, pan); break; }
      case 'whisper': sweep(1500, 3000, .6, .1, 5); break;
      case 'skyfall': tone('sine', 400, 60, .5, .4); I.noiseHit(D, t, .4, 5000, .5, 'highpass', pan); break;
      case 'seed': I.bell(D, 96 + Math.floor(Math.random() * 4), t, .1, .03, { ratio: 4, index: .3, decay: .3, pan }); break;
      case 'orb': I.bell(D, 84, t, .2, .05, { decay: .5, pan }); break;
      case 'page': for (let i = 0; i < 4; i++) I.celesta(D, N(['D6', 'F6', 'A6', 'D7'][i]), t + i * .08, .3, .05); break;
      case 'shard': A.melody(D, 'celesta', A.MOTIF.nyx.map(n => [n, .25]), t, .5, .07); I.choir(D, 86, t, 1.5, .03, { vowel: 'a' }); break;
      case 'ui': I.tick(D, t, .05, { f: 1400 }); break;
      case 'uiok': I.bell(D, 88, t, .2, .05, { decay: .4 }); break;
      case 'swap': metal(1500, .04, .2); break;
      case 'form_light': I.bell(D, 86, t, .5, .08, { ratio: 2, index: 1, decay: 1 }); sweep(1000, 6000, .3, .06, 2); break;
      case 'form_wrath': tone('sawtooth', 110, 55, .4, .12); I.noiseHit(D, t, .3, 400, .4, 'lowpass', pan); break;
      case 'nyxheal': A.melody(D, 'celesta', [['A6', .25], ['D7', .5]], t, .3, .04); break;
      case 'pdeath': tone('sine', 200, 40, 1.5, .4); I.choir(D, 62, t, 2, .06, { vowel: 'u' }); break;
      case 'rebirth': I.choir(D, 74, t, 1.5, .08, { vowel: 'a' }); sweep(200, 5000, 1, .1); break;
      case 'burst': I.noiseHit(D, t, .3, 1500, .25, 'lowpass', pan); break;
      case 'heartbeat': tone('sine', 60, 40, .12, .35); { const x = osc('sine', 55, t + .18, t + .32), g = A.ctx.createGain(); g.gain.setValueAtTime(.25, t + .18); g.gain.exponentialRampToValueAtTime(0.0001, t + .32); x.connect(g); g.connect(D); } break;
      case 'step_stone': I.noiseHit(D, t, .05, 1800, .04, 'bandpass', pan); break;
      case 'step_grass': I.noiseHit(D, t, .04, 3500, .05, 'highpass', pan); break;
      case 'alert': tone('sine', 600, 900, .08, .04); break;
      default:
        if (id.startsWith('skill_')) { const k = id.slice(6); if (['firstday', 'lastbattle', 'verdict', 'plague', 'greatfamine', 'secondheaven'].includes(k)) { I.choir(D, 74, t, 1.6, .08, { vowel: 'a' }); I.choir(D, 81, t, 1.6, .06, { vowel: 'a' }); I.taiko(D, t, .5); I.bell(D, 86, t, 2, .08, { decay: 3 }); } else { I.bell(D, 80 + (k.length % 7), t, .3, .05, { ratio: 2.5, index: 1, decay: .6, pan }); sweep(600, 3000, .25, .07, 2); } }
    }
  };

  // ---------------- Voice: Web Speech + angelic/dark underlay + text-driven lip sync ----------------
  A.voices = null;
  A.pickVoice = function (lang) {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices(); if (!vs.length) return null;
    const pref = lang === 'vi' ? ['vi-VN', 'vi'] : ['en-GB', 'en-US', 'en'];
    for (const p of pref) { const v = vs.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase())); if (v) return v; }
    return null;
  };
  A.speak = function (who, text, onEnd) {
    const sp = PZ.SPEAKERS[who] || PZ.SPEAKERS.narrator, cfg = sp.voice;
    const est = Math.max(1.2, text.length * (PZ.lang === 'vi' ? .065 : .06) / cfg.rate);
    A.lip = { text, t0: performance.now(), dur: est * 1000, who };
    A.duckTo(.4);
    // underlay processing that WebAudio can do (TTS output itself cannot be routed into WebAudio)
    if (A.ctx && cfg.fx === 'angel') { const t = A.ctx.currentTime; A.I.choir(A.voice, 74, t, est, .02, { vowel: 'a', female: true, att: .4 }); A.I.choir(A.voice, 81, t, est, .015, { vowel: 'a', female: true, att: .6 }); }
    if (A.ctx && cfg.fx === 'dark') { const t = A.ctx.currentTime; A.I.pad(A.voice, 38, t, est, .08, { cut: 200, att: .3 }); }
    if (A.ctx && cfg.fx === 'whisper') { const t = A.ctx.currentTime; A.I.bell(A.voice, 93, t, est, .02, { decay: est }); }
    let used = false;
    if (PZ.Settings.voice > 0 && 'speechSynthesis' in window) {
      const v = A.pickVoice(PZ.lang);
      if (v || PZ.lang === 'en') {
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text); if (v) u.voice = v; u.lang = PZ.lang === 'vi' ? 'vi-VN' : 'en-GB';
          u.pitch = PZ.clamp(cfg.pitch, 0, 2); u.rate = cfg.rate; u.volume = PZ.Settings.voice;
          u.onboundary = e => { if (A.lip) A.lip.charIdx = e.charIndex; };
          u.onend = () => { A.lip = null; A.duckTo(1); onEnd && onEnd(); };
          speechSynthesis.speak(u); used = true; A.voiceOn = true;
        } catch (e) { used = false; }
      }
    }
    if (!used) { // fallback: synthesized formant babble so mouths still move with a voice
      if (A.ctx && PZ.Settings.voice > 0) A.babble(text, cfg, est);
      setTimeout(() => { A.lip = null; A.duckTo(1); onEnd && onEnd(); }, est * 1000);
    }
    return est;
  };
  A.stopVoice = function () { try { speechSynthesis.cancel(); } catch (e) { } A.lip = null; A.duckTo(1); };
  A.babble = function (text, cfg, est) {
    const ctx = A.ctx, t0 = ctx.currentTime, syl = text.split(/\s+/).filter(Boolean);
    const per = est / Math.max(1, syl.length);
    const base = 140 * cfg.pitch * (cfg.fx === 'dark' ? .6 : 1);
    syl.forEach((w, i) => {
      const t = t0 + i * per, v = (w.match(/[aăâeêioôơuưy]/i) || ['a'])[0].toLowerCase();
      const vow = 'aăâ'.includes(v) ? 'a' : 'eê'.includes(v) ? 'e' : 'iy'.includes(v) ? 'i' : 'oôơ'.includes(v) ? 'o' : 'u';
      A.I.choir(A.voice, 12 * Math.log2(base * (1 + .08 * Math.sin(i * 1.7)) / 440) + 69, t, per * .8, .05, { vowel: vow, solo: true, att: .03 });
    });
  };
  // mouth openness + shape from the text being spoken (time or boundary driven)
  A.mouth = function () {
    const L = A.lip; if (!L) return { open: 0, round: 0 };
    const k = Math.min(1, (performance.now() - L.t0) / L.dur);
    const idx = L.charIdx != null ? L.charIdx + Math.floor(((performance.now() - L.t0) % 200) / 60) : Math.floor(k * L.text.length);
    const ch = (L.text[idx] || ' ').toLowerCase();
    const vow = 'aăâáàảãạeêéèẻẽẹiíìỉĩịoôơóòỏõọuưúùủũụyýỳ'.indexOf(ch) >= 0;
    const round = /[oôơóòỏõọuưúùủũụ]/.test(ch) ? 1 : 0, flat = /[eêéèiíìy]/.test(ch) ? 1 : 0;
    const open = vow ? .55 + .45 * Math.abs(Math.sin(performance.now() / 70)) : ch === ' ' || /[.,…!?]/.test(ch) ? .05 : .2;
    return { open: k >= 1 ? 0 : open, round, flat };
  };
})(globalThis.PZ);
