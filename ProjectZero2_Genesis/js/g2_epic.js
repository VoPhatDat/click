'use strict';
/**
 * G2 EPIC: one sound for the whole of Part II, at the player's request (they sent an epic boss-fight
 * reference: ~172 BPM, harmonic minor, bright hybrid orchestra, long builds, big hits).
 * Every region, mini-boss and boss track now runs on the same epic orchestral engine: string
 * ostinatos, horns and trombone "braams", choir, taiko and toms, cymbal swells, risers and impacts.
 * Each keeps its leitmotif melody and one colour of its own (Mareva's soprano, Lilith's guitars,
 * Astraea's clock and celesta, the Gardener's children, Archon's violin, the Architect's row).
 * Exploration tracks play the same orchestra quietly; the drums and ostinatos come in with combat
 * through Part I's stems. Intensity: 0 explore, 1 tension, 2 fight, 3 climax.
 */
Object.assign(Inst, {
    riser(o, t, d, vel = 1) {
        const c = Sound.ctx, src = c.createBufferSource(), b = c.createBiquadFilter(), g = c.createGain(); src.buffer = Sound.noiseW; src.loop = true; b.type = 'bandpass'; b.Q.value = 2;
        b.frequency.setValueAtTime(300, t); b.frequency.exponentialRampToValueAtTime(7000, t + d); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09 * vel, t + d); g.gain.linearRampToValueAtTime(0, t + d + .05);
        src.connect(b); b.connect(g); g.connect(o); src.start(t); src.stop(t + d + .1);
        this.voice(o, t, { type: 'sawtooth', f: 110, d, v: .012 * vel, a: d * .9, r: .05, lp: 2400, slide: .5 });
    },
    boom(o, t, vel = 1) { Sound.tone(o, t, { f: 70, f2: 28, sweep: .7, d: 1.4, v: .42 * vel }); Sound.burst(o, t, { ft: 'lowpass', f: 900, d: .5, v: .2 * vel }); Sound.burst(o, t, { ft: 'highpass', f: 3500, d: 1.2, v: .04 * vel }); },
    braam(o, t, f, d, vel = 1) { [1, .5, 1.498].forEach((k, i) => this.voice(o, t, { table: 'brass', f: f * k, d, v: [.08, .07, .04][i] * vel, a: .05, r: .5, lp: 2600, lp0: 300, lpT: d * .5, q: 1.4, det: (i - 1) * 6 })); Sound.burst(o, t, { ft: 'lowpass', f: 400, d: .3, v: .1 * vel }); },
    tom(o, t, vel = 1, f = 130) { Sound.tone(o, t, { f: f * 1.4, f2: f, sweep: .06, d: .35, v: .26 * vel }); Sound.burst(o, t, { ft: 'lowpass', f: 1800, d: .06, v: .07 * vel }); },
    strHi(o, t, f, d, vel = .7, pan = 0) { this.voice(o, t, { table: 'strings', f, d, v: .06 * vel, a: .005, r: .05, dec: d * .6, sus: .15, lp: 6500, lp0: 9000, pan }); this.voice(o, t, { table: 'strings', f: f * 1.002, d, v: .03 * vel, a: .005, r: .05, dec: d * .6, sus: .1, lp: 5000, pan: -pan }); },
    hornLead(o, t, f, d, vel = 1, pan = 0) { [-5, 5].forEach(det => this.voice(o, t, { table: 'brass', f, d, v: .06 * vel, a: .05, r: .3, lp: 3400, lp0: 900, lpT: .2, det, vib: 6, vibF: 5.2, pan })); },
    choirBig(o, t, f, d, vowel, vel = 1, pan = 0) { this.choir(o, t, f, d, vowel, vel, pan); this.choir(o, t, f * 2, d, vowel === 'a' ? 'o' : 'a', vel * .5, -pan); }
});

/** The shared engine. cfg: lead, color(m, X, lv), drums ('epic' | 'tribal' | 'march' | 'none'), base intensity. */
function epic(m, cfg) {
    const X = g2x(m), { S, t, pos, bar, sd } = m, T = m.T, st = X.steps, comp = st === 12 || st === 24, beat = comp ? 6 : st === 14 ? 0 : 4;
    // intensity: per boss phase, per track, with builds and breakdowns on a sixteen-bar cycle
    const sec = X.sec(); let lv = cfg.level !== undefined ? cfg.level : (T.meta && T.meta.boss ? Math.min(3, 2 + (sec >= 1 ? 1 : 0)) : 0);
    if (cfg.levels) lv = cfg.levels[Math.min(sec, cfg.levels.length - 1)];
    if (cfg.level === 0 && X.hot()) lv = Music.state === 'critical' || Music.state === 'boss' ? 3 : 2; // exploration tracks turn epic when the fighting starts
    if (T._lastSec !== sec && pos === 0) { T._lastSec = sec; T._buildFrom = bar; }
    const since = bar - (T._buildFrom || 0), cyc = since % 16, building = lv >= 2 && since < 2, breakdown = lv >= 2 && (cyc === 12 || cyc === 13), rebuild = lv >= 2 && (cyc === 14 || cyc === 15);
    const L = building || breakdown ? 1 : lv, bt = p => (beat ? p % beat === 0 : [0, 4, 8].includes(p)), last = pos === st - 1;
    // harmony bed: strings always, horns from tension, choir in the fight
    if (pos === 0) {
        X.ch(0).forEach((hz, i) => Inst.strings(S.pad, t, hz, sd * st, (i - 1) * .4, .028 + L * .006));
        Inst.cello(S.bass, t, X.rootHz(-1), sd * st * .95, .55 + L * .1);
        if (L >= 1) X.ch(-1).forEach((hz, i) => Inst.horn(S.brass, t, hz, sd * st * .9, .35 + L * .12, (i - 1) * .3));
        if (L >= 2) X.ch(0).forEach((hz, i) => Inst.choirBig(S.choir, t, hz, sd * st * .95, ['a', 'o', 'a'][i], .3 + L * .06, (i - 1) * .5));
        if (lv >= 3 && !breakdown && !building && bar % 2 === 0) Inst.braam(S.brass, t, X.rootHz(-1), sd * st * 1.4, 1);
        if (since === 2 && lv >= 2 || (cyc === 0 && since > 0 && lv >= 2)) { Inst.boom(S.taiko, t, 1); Inst.cymbal(S.metal, t); }
    }
    // the build: riser, snare roll, timpani roll into the drop
    if ((building && since === 1 || rebuild && cyc === 15) && pos === 0) Inst.riser(S.metal, t, sd * st, 1);
    if (building || rebuild) { const k = pos / st; if (pos % (k > .5 ? 1 : 2) === 0) Inst.snare(S.snare, t, .25 + k * .6); if (pos % 2 === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), .2 + k * .5); }
    // ostinatos: low strings in eighths from tension, high strings in sixteenths in the fight, piano in the climax
    if (L >= 1 && pos % 2 === 0) Inst.spiccato(S.ost, t, X.hz(m.root + [0, 0, 2, 0, 4, 0, 2, 0][(pos / 2) % 8], -1), sd * 1.6, bt(pos) ? .75 : .45);
    if (L >= 2) Inst.strHi(S.str, t, X.hz(m.root + [0, 2, 4, 2, 7, 4, 2, 4][pos % 8], 1), sd * .9, pos % 4 === 0 ? .8 : .5, ((pos % 4) - 1.5) * .2);
    if (L >= 3 && pos % 2 === 1) Inst.piano2(S.arp, t, X.hz(m.root + [4, 7, 9, 7][(pos >> 1) % 4], 1), sd * 1.5, .3, .3);
    // drums
    const D = cfg.drums || 'epic';
    if (L >= 1 && D !== 'none' && !building && !rebuild) {
        if (D === 'tribal') { if (X.is(st === 16 ? 'x..x..x.x.x..x..' : 'x.x.x.x.x.x.x.x.x.x.x.x.x.x.')) Inst.taiko(S.taiko, t, pos === 0 ? 70 : 100); if (pos % 4 === 2) Inst.frame(S.snare, t, .5); }
        else if (D === 'march') { if (bt(pos)) Inst.taiko(S.taiko, t, pos === 0 ? 72 : 96); if (pos % (beat || 4) === (beat || 4) / 2) Inst.snare(S.snare, t, .55); }
        else { // epic: taiko and low toms, a half-time snare, kick on the beat in the fight
            if (bt(pos)) Inst.taiko(S.taiko, t, pos === 0 ? 68 : 92); if (L >= 2 && bt(pos)) Inst.kick(S.kick, t, pos === 0 ? 1 : .7);
            if (pos === Math.floor(st / 2)) Inst.snare(S.snare, t, .8); if (L >= 2 && pos % 2 === 1) Inst.hat(S.hat, t, .3);
            if (L >= 3 && pos % 4 === 2) Inst.tom(S.taiko, t, .5, 150);
            if (bar % 4 === 3 && pos >= st - 4) Inst.tom(S.taiko, t, .7, [170, 150, 130, 110][pos - (st - 4)] || 120);
        }
        if (L >= 2 && pos === 0) m.pump(t, sd * 2);
    }
    // the melody: the track's own leitmotif, doubled by choir in the climax
    if (T.mel) {
        const lead = cfg.lead || (L >= 2 ? 'horn' : 'strings'), o = cfg.octave !== undefined ? cfg.octave : (T.lead === undefined ? 1 : T.lead);
        X.mel((hz, d, v) => {
            if (lead === 'horn') Inst.hornLead(S.mel, t, hz, d, v * (.7 + L * .1), 0); else if (lead === 'strings') Inst.violin(S.mel, t, hz, d, v * .8, .1);
            else if (lead === 'soprano') Inst.sing(S.mel, t, hz, d, ['a', 'o', 'a', 'e'][bar % 4], v * .8, 0); else if (lead === 'children') Inst.sing(S.mel, t, hz, d, 'u', v * .6, 0, true);
            else if (lead === 'guitar') Inst.eguitar(S.mel, t, hz, d, v * .6, .2, false); else if (lead === 'celesta') Inst.celesta(S.mel, t, hz, v * .9, 0); else if (lead === 'piano') Inst.piano2(S.mel, t, hz, d, v * .75, 0);
            else if (lead === 'flute') Inst.flute(S.mel, t, hz, d, v * .65); else if (lead === 'voice') Inst.sing(S.mel, t, hz, d, 'a', v * .55, 0); else if (lead === 'organ') Inst.organLead(S.mel, t, hz, d, v * .7, 0); else Inst.violin(S.mel, t, hz, d, v * .8, 0);
            if (L >= 3 && !breakdown) Inst.choir(S.choir, t, hz, d, 'a', v * .35, 0);
        }, o);
    }
    if (cfg.color) cfg.color(m, X, L, { building, breakdown, since, cyc, sec });
}

/* Track by track: same orchestra, own melody, own colour. */
const EPIC = {
    g2title: { level: 1, lead: 'strings', octave: 0, color(m, X) { if (m.pos % 4 === 0) Inst.harp(m.S.arp, m.t, X.ch(1)[(m.pos / 4) % 3], .35, .2); } },
    g2garden: { level: 0, lead: 'flute', drums: 'none', color(m, X) { const p = [0, -1, 2, -1, 1, -1, 2, -1, 1, -1, 2, -1]; if (p[m.pos] >= 0 && m.pos) Inst.guitar(m.S.arp, m.t, X.ch(0)[p[m.pos]], .3, .2); } },
    g2dawn: { level: 0, lead: 'voice', color(m, X) { if (m.pos % 2 === 0) Inst.harp(m.S.arp, m.t, X.hz(m.root + [0, 2, 4, 7, 4, 2][m.pos / 2], 0), .35, .1); if (m.pos === 0 && m.bar % 2 === 0) Inst.bell(m.S.metal, m.t, X.hz(4, 1), .3, .4); } },
    g2knight: { level: 2, lead: 'horn', drums: 'march', color(m, X) { if (m.pos % 6 === 0) Inst.bell(m.S.metal, m.t, X.hz(4, 1), .25, .3); } },
    g2sera: { levels: [2, 3, 1], lead: 'soprano', color(m, X, L, s) { if (m.pos === 0) X.ch(0).forEach((hz, i) => Inst.organ(m.S.pad, m.t, hz, m.sd * 16, (i - 1) * .4, .35)); if (s.sec >= 2 && m.pos === 0) Inst.drone(m.S.bass, m.t, X.hz(0, -2), m.sd * 16); } },
    g2sea: { level: 0, lead: 'strings', octave: 0, color(m, X) { if (m.pos === 4 || m.pos === 8) X.ch(0).forEach((hz, i) => Inst.piano2(m.S.arp, m.t, hz, m.sd * 3.5, .2, (i - 1) * .3)); if (m.pos === 0 && m.bar % 2 === 0) Inst.sea(m.S.metal, m.t, m.sd * 24, .8); } },
    g2whale: { level: 2, lead: 'horn', octave: 0, color(m, X) { if (m.pos === 0 && m.bar % 2) Inst.howl(m.S.choir, m.t, X.hz(0, -1), m.sd * 10, .5, -.3); } },
    g2mareva: { levels: [2, 3, 3], lead: 'soprano', color(m, X, L, s) { if (m.pos % 2 === 0) Inst.harp(m.S.arp, m.t, X.ch(1)[[0, 1, 2, 1, 2, 1][(m.pos / 2) % 6]], .28, .2); if (s.sec >= 2 && m.pos === 0) Inst.sea(m.S.metal, m.t, m.sd * 24, 1.2); } },
    g2forest: { level: 0, lead: 'flute', color(m, X) { if (m.pos % 2 === 0) Inst.dulcimer(m.S.arp, m.t, X.ch(1)[[0, 1, 2, 1, 2, 0, 2, 1, 2, 1][m.pos / 2]], .25, .1); if (m.pos % 4 === 0) Inst.musicbox(m.S.metal, m.t, X.ch(2)[(m.pos / 4) % 3], .25, .3, (m.hash(m.bar * 9 + m.pos) - .5) * 40); } },
    g2scarecrow: { level: 2, lead: 'violin', drums: 'tribal', color(m, X) { if (m.pos % 4 === 0) Inst.logdrum(m.S.snare, m.t, .6, 260); } },
    g2gardener: { levels: [2, 3, 3], lead: 'violin', drums: 'tribal', color(m, X, L, s) { if (m.bar % 2 === 0 || s.sec >= 2) X.line(MOTIF.gardener.map(b => Compose.remeter(b, 12)), (hz, d, v) => Inst.sing(m.S.choir, m.t, hz * (s.sec >= 2 ? Math.pow(2, -(.3 + .4 * m.hash(m.bar)) / 12) : 1), d, 'u', v * .45, -.2, true), 1); } },
    g2observ: { level: 0, lead: 'celesta', color(m, X) { if (m.pos % 2 === 0) Inst.piano2(m.S.arp, m.t, X.ch7(1)[[0, 2, 1, 0, 2, 1, 3][m.pos / 2]], m.sd * 2, .22, .2); } },
    g2clock: { level: 2, lead: 'horn', color(m, X) { if (m.pos % 2 === 0) Inst.clock(m.S.metal, m.t, m.pos === 0 ? 1.2 : .7, m.pos % 4 === 0); } },
    g2astraea: { levels: [2, 3, 3], lead: 'horn', color(m, X, L, s) { if (m.pos % 4 === 0) Inst.clock(m.S.metal, m.t, 1, m.pos % 8 === 0); if (m.pos % 2 === 0) Inst.celesta(m.S.arp, m.t, X.ch(2)[(m.pos / 2) % 3], .3, .3); if (s.sec >= 2 && m.pos === 0) X.ch(0).forEach((hz, i) => Inst.rev(m.S.pad, m.t, hz, m.sd * 15, .9, (i - 1) * .5, 'strings')); } },
    g2desert: { level: 0, lead: 'horn', octave: 0, drums: 'tribal', color(m, X) { const db = 'd.t.k.t.d.dt.kt.'; if (db[m.pos] !== '.') Inst.darbuka(m.S.snare, m.t, { d: 'dum', t: 'tek', k: 'ka' }[db[m.pos]]); if (m.bar % 4 === 3 && m.pos === 8) Inst.howl(m.S.choir, m.t, X.hz(4, 1), m.sd * 8, .5, .5); } },
    g2antelope: { level: 2, lead: 'horn', octave: 0, drums: 'tribal' },
    g2lilith: { levels: [2, 3, 3], lead: 'guitar', octave: 0, drums: 'tribal', color(m, X, L, s) { if (m.pos % 2 === 0) Inst.eguitar(m.S.ost, m.t, X.rootHz(0), m.sd * .7, .45, 0, false); if (m.pos === 0) Inst.eguitar(m.S.brass, m.t, X.rootHz(0), m.sd * 3, .5, 0, true); if (m.pos === 0 && (m.bar % 4 === 3 || s.sec >= 2)) [0, 2, 4].forEach((k, i) => Inst.howl(m.S.choir, m.t, X.hz(m.root + k, 1), m.sd * 12, .45, (i - 1) * .6)); } },
    g2meridian: { level: 0, lead: 'organ', color(m, X) { if (m.pos % 8 === 0) Inst.hammer(m.S.metal, m.t, .45); if (m.pos === 0) X.ch(0).forEach((hz, i) => Inst.organ(m.S.pad, m.t, hz, m.sd * 16, (i - 1) * .4, .3)); } },
    g2preacher: { level: 2, lead: 'organ', color(m, X) { if (m.pos % 4 === 0) Inst.hammer(m.S.metal, m.t, .5); } },
    g2archon: { levels: [2, 3, 1, 3], lead: 'horn', color(m, X, L, s) { if (G.boss && G.boss.hesitate > 0 || s.sec === 2) X.mel((hz, d, v) => Inst.violin(m.S.choir, m.t, hz, d, v * .9, 0), 1); } },
    g2architect: { levels: [2, 3, 3, 3], lead: 'horn', octave: 0, color(m, X, L, s) { const row = MOTIF.architect, k = Math.floor((m.bar * 16 + m.pos) / 3) % 12; if (m.pos % 3 === 0) Inst.piano2(m.S.metal, m.t, midiHz(m.midi(0, 1) + row[k] + [0, 6, 1, 4][s.sec] ), m.sd * 2, .35, (k % 3 - 1) * .5); if (m.pos === 0) Inst.glass(m.S.pad, m.t, midiHz(m.midi(0, 2) + row[m.bar % 12]), m.sd * 16, .3); } },
    g2throne: { level: 0, lead: 'piano', color(m, X) { if (m.bar % 8 >= 4) X.line(THEME, (hz, d, v) => Inst.cello(m.S.choir, m.t, hz, d, v * .5, -.2), 0); } },
    g2zshadow: { level: 3, lead: 'strings', octave: 0, drums: 'march' },
    // The last battle: everything at once.
    g2act1: { levels: [2, 3, 3], lead: 'horn', octave: 0, color(m, X, L, s) { X.line(EPIC_LUL28, (hz, d, v) => Inst.strHi(m.S.str, m.t, hz, Math.min(d, m.sd * 3), .6 + s.sec * .1, .2), 1); if (s.sec === 2 && (m.pos === 10 || m.pos === 24)) Inst.cymbal(m.S.metal, m.t); } },
    g2act3: { levels: [3, 3, 3, 1, 3], lead: 'horn', octave: 0, color(m, X, L, s) {
        if (s.sec === 1 && m.pos === 0) X.ch(0).forEach((hz, i) => Inst.rev(m.S.pad, m.t, hz, m.sd * 15, 1.2, (i - 1) * .4, 'strings'));
        if (s.sec === 3) { if (m.pos === 0) Inst.heart(m.S.kick, m.t, 2); X.line(EPIC_LUL16, (hz, d, v) => Inst.musicbox(m.S.arp, m.t, hz, v * 2.2, 0), 1); }
        if (s.sec !== 3 && (s.sec >= 2 || m.bar % 2)) X.line(EPIC_VES16, (hz, d, v) => Inst.strings(m.S.str, m.t, hz, d, .2, .05), 1);
        if (s.sec === 4) X.line(EPIC_LUL16, (hz, d, v) => Inst.sing(m.S.choir, m.t, hz, d, 'a', v * .7, 0), 1);
    } }
};
for (const id in EPIC) { const T = TRACKS[id]; if (!T) continue; T.arr = 'epic_' + id; Arr['epic_' + id] = m => epic(m, EPIC[id]); T.drop = (T.drop || []).filter(n => !['ost', 'brass', 'taiko', 'kick', 'snare', 'hat'].includes(n) || EPIC[id].drums === 'none'); }
// Faster and in harmonic minor where the reference was: the final acts, and the bosses a little faster too.
// Counter-melodies built from the lullaby and Vesper's theme over each act's own chords, so the three can stack.
const EPIC_LUL28 = Compose.seq(Compose.remeter(LUL12[0], 28), [0, 3, 5, 6], 28, { start: 4, lo: 2, hi: 11 }), EPIC_LUL16 = Compose.seq(Compose.remeter(LUL12[0], 16), [0, 5, 2, 6], 16, { start: 4, lo: 2, hi: 11 }), EPIC_VES16 = Compose.seq(MOTIF.vesper[0], [0, 5, 2, 6], 16, { start: 2, lo: 0, hi: 9 });
Object.assign(TRACKS.g2act1, { bpm: 164, scale: 'minor', prog: [0, 3, 5, 6], mel: Compose.seq(VESPER28[0], [0, 3, 5, 6], 28, { start: 4, lo: 0, hi: 9 }) });
Object.assign(TRACKS.g2act3, { bpm: 172, key: 'A', scale: 'minor', prog: [0, 5, 2, 6], keyFn: (bar) => ['A', 'A', 'B', 'A', 'A'][phaseOf('architect2')] || 'A', mel: Compose.seq(THEME[0], [0, 5, 2, 6, 0, 5, 2, 6], 16, { start: 7, lo: 4, hi: 11 }) });
Object.assign(TRACKS.g2act1.meta, { genre: 'epic orchestral', tempo: 164, key: 'D minor', lead: 'horns, strings and choir (Vesper and the lullaby)' });
Object.assign(TRACKS.g2act3.meta, { genre: 'epic orchestral', tempo: 172, key: 'A minor, B minor', lead: 'full orchestra and Latin choir (all three themes)' });
for (const [id, bpm] of Object.entries({ g2sera: 132, g2mareva: 126, g2gardener: 138, g2astraea: 150, g2lilith: 160, g2archon: 156, g2architect: 144, g2knight: 128, g2whale: 120, g2scarecrow: 150, g2clock: 152, g2antelope: 168, g2preacher: 140, g2zshadow: 136 })) if (TRACKS[id]) { TRACKS[id].bpm = bpm; TRACKS[id].meta.tempo = bpm; }
for (const id in EPIC) if (TRACKS[id] && TRACKS[id].meta) { const M = TRACKS[id].meta; M.style = M.genre; M.genre = 'epic orchestral'; }
