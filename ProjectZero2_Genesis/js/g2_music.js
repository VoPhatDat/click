'use strict';
/**
 * G2 MUSIC: Part II arrangers in the Part I format (Arr + TRACKS + Inst). None of them reuses a
 * Part I arranger or chord progression; the Part I THEME appears only as a deliberate quotation.
 * Each track declares meta { genre, meter, key, lead, tempo } and tools/music_check.js verifies that
 * every pair of tracks differs in at least three of the five.
 *   Leitmotif of Part II: ZERO'S LULLABY, 8 bars of 3/4 in D major, the song Zero hums to Nyx.
 */
const LULLABY = ['4---4-5-4---', '2-------0---', '1---1-2-3---', '4-----------', '5---4-2-0---', '1-----2-----', '3---2-1-x---', '0-----------'];
const THEME_GENESIS = ['6-----7-6---4---', '5-----6-5---2---', '4---5---7---6---', '8-------6-------'];
const MOTIF = { seraphina: ['0---4---3-2-4---', '7-------5-------'], knight: '0-0-4---0-5-4---' };
const phaseOf = id => (G.boss && G.boss.def && G.boss.def.id === id ? G.boss.phase : 0);

/* New voices the Part I synth did not have: music box, celesta, cello, solo woman's voice, horn, clock. */
Object.assign(Inst, {
    musicbox(o, t, f, vel = .7, pan = 0) { this.voice(o, t, { type: 'sine', f, d: .9, v: .09 * vel, a: .002, r: .5, dec: .25, sus: .05, pan }); this.voice(o, t, { type: 'sine', f: f * 4.2, d: .2, v: .02 * vel, a: .001, r: .1, pan }); },
    celesta(o, t, f, vel = .7, pan = 0) { this.voice(o, t, { type: 'sine', f, d: 1.4, v: .08 * vel, a: .003, r: .6, dec: .4, sus: .1, pan }); this.voice(o, t, { type: 'triangle', f: f * 2, d: .4, v: .02 * vel, a: .002, r: .2, pan }); },
    cello(o, t, f, d, vel = 1, pan = -.2) { this.voice(o, t, { table: 'strings', f, d, v: .085 * vel, a: Math.min(.35, d * .3), r: .4, lp: 1800, vib: 10, vibF: 5.2, pan }); },
    solo(o, t, f, d, vowel = 'a', vel = 1, pan = 0) { this.choir(o, t, f, d, vowel, vel * .8, pan); this.voice(o, t, { type: 'sine', f, d, v: .03 * vel, a: .08, r: .2, vib: 14, vibF: 5.6, pan }); },
    horn(o, t, f, d, vel = 1, pan = 0) { this.voice(o, t, { table: 'brass', f, d, v: .07 * vel, a: .06, r: .2, lp: 1400, lp0: 600, pan }); },
    clock(o, t, vel = 1, pan = 0) { Sound.tone(o, t, { type: 'square', f: 3200, d: .015, v: .02 * vel, lp: 6000 }); }
});

Object.assign(Arr, {
    /* Menu and opening: the Genesis theme set in counterpoint against the Part I theme (a quotation). */
    g2title(m) {
        const { S, t, pos, bar, sd, root } = m;
        if (pos === 0) { m.chord().forEach((n, i) => Inst.organ(S.pad, t, midiHz(n), sd * 16, (i - 1) * .3, .6)); Inst.cello(S.bass, t, midiHz(m.midi(root, -1)), sd * 15, .9); }
        if (pos === 0 && bar % 4 === 0) Inst.bell(S.metal, t, midiHz(m.midi(0, 0)), .7);
        m.line(THEME[bar % 4], (hz, d, v) => Inst.solo(S.mel, t, hz, d, 'o', v * .8, -.2), 0);
        if (bar >= 4) m.line(THEME_GENESIS[bar % 4], (hz, d, v) => Inst.strings(S.str, t, hz, d, .25, .05 * v), 1);
        if (pos % 4 === 2) Inst.celesta(S.arp, t, midiHz(m.chord()[(pos / 4 | 0) % 3] + 24), .4, (pos / 4 - 1.5) * .2);
    },
    /* The Garden: pastoral, guitar and flute, never more than a breeze of percussion. */
    g2garden(m) {
        const { S, t, pos, sd, root } = m, ar = [0, 2, 4, 7, 4, 2, 4, 7];
        if (pos === 0) m.chord().forEach((n, i) => Inst.strings(S.pad, t, midiHz(n), sd * 15, (i - 1) * .3, .035));
        if (pos % 2 === 0) Inst.pluck(S.arp, t, midiHz(m.midi(root + ar[pos / 2])), 'nylon', pos === 0 ? .8 : .5, -.2);
        if (pos === 0 || pos === 8) Inst.pluck(S.bass, t, midiHz(m.midi(root, -1)), 'nylon', .8, 0);
        if (pos % 4 === 2) Inst.shaker(S.hat, t, .3);
        m.melody(() => (hz, d, v) => Inst.flute(S.mel, t, hz, d, v * .9));
    },
    /* Day One: plainchant colour in D Lydian, 6/8, harp in sixes, a solo woman's voice, bells. */
    g2dawn(m) {
        const { S, t, pos, bar, sd, root } = m, six = [0, 2, 4, 7, 4, 2];
        if (pos === 0) { m.chord().forEach((n, i) => Inst.strings(S.pad, t, midiHz(n), sd * 12, (i - 1) * .4, .03)); Inst.drone(S.bass, t, midiHz(m.midi(root, -2)), sd * 12); }
        if (pos % 2 === 0) Inst.pluck(S.arp, t, midiHz(m.midi(root + six[pos / 2])), 'harp', pos === 0 ? .9 : .55, (pos - 5) * .08);
        if (pos === 0 && bar % 2 === 0) Inst.bell(S.metal, t, midiHz(m.midi(root + 7, 0)), .5, .4);
        m.melody(() => (hz, d, v) => Inst.solo(S.mel, t, hz, d, 'a', v * .9, 0));
        if (pos === 0) Inst.frame(S.taiko, t, 1); if (pos === 6) Inst.frame(S.taiko, t, .6);
        if (pos % 2 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(root + (pos === 6 ? 4 : 0))), sd * 1.2, pos === 0 ? 1 : .6);
    },
    /* The Shadowless Knight: a march for horns over his own four-note call. */
    g2knight(m) {
        const { S, t, pos, sd, root } = m;
        if (pos === 0) m.chord().forEach((n, i) => Inst.strings(S.pad, t, midiHz(n), sd * 12, (i - 1) * .4, .05));
        Inst.spiccato(S.ost, t, midiHz(m.midi(root + [0, 0, 4, 0, 5, 4][pos % 6], 0)), sd * .9, pos % 6 === 0 ? 1.1 : .7);
        if (pos % 6 === 0) { Inst.taiko(S.taiko, t, 80); Inst.kick(S.kick, t, 1); m.pump(t, sd * 3); m.chord().forEach((n, i) => Inst.horn(S.brass, t, midiHz(n), sd * 2.6, .9, (i - 1) * .3)); }
        if (pos % 6 === 3) Inst.snare(S.snare, t, .8); Inst.hat(S.hat, t, pos % 2 ? .4 : .7);
        m.line(MOTIF.knight.slice(0, 12), (hz, d, v) => Inst.horn(S.mel, t, hz, d, v, 0));
    },
    /* Seraphina: three sections, one per phase.
       I   Requiem: women's choir and organ on her motif.
       II  The false lights: tremolo strings answer the choir in canon, horns enter.
       III Blind: almost nothing, a low drone and a far voice, so her bells can be heard. */
    g2sera(m) {
        const { S, t, pos, bar, sd, root } = m; if (pos === 0 || m.T._sec === undefined) m.T._sec = phaseOf('seraphina'); const ph = m.T._sec; // sections change on the bar line
        if (ph >= 2) {
            if (pos === 0) { Inst.drone(S.pad, t, midiHz(m.midi(root, -2)), sd * 16); if (bar % 2 === 0) Inst.solo(S.choir, t, midiHz(m.midi(root + 4, 1)), sd * 15, 'u', .35, 0); }
            return;
        }
        if (pos === 0) { m.chord().forEach((n, i) => { Inst.organ(S.pad, t, midiHz(n), sd * 16, (i - 1) * .4, .8); Inst.choir(S.choir, t, midiHz(n + 12), sd * 15, bar % 2 ? 'a' : 'o', .6, (i - 1) * .4); }); Inst.organ(S.bass, t, midiHz(m.midi(root, -2)), sd * 16, 0, 1); }
        m.line(MOTIF.seraphina[bar % 2], (hz, d, v) => Inst.solo(S.mel, t, hz, d, 'a', v * 1.1, 0));
        if (pos === 0 || pos === 10) Inst.timpani(S.taiko, t, midiHz(m.midi(0, -1)), pos === 0 ? 1 : .6);
        if (ph === 1) {
            for (let k = 0; k < 2; k++) Inst.spiccato(S.ost, t + k * sd / 2, midiHz(m.midi(root + [4, 2][k], 0)), sd * .45, .7);
            if (pos === 4) m.line(MOTIF.seraphina[(bar + 1) % 2], (hz, d, v) => Inst.strings(S.str, t, hz * 2, d, .3, .05), 0);
            if (pos === 8) m.chord().forEach((n, i) => Inst.horn(S.brass, t, midiHz(n), sd * 6, .7, (i - 1) * .3));
        }
    },
    /* Zero's Lullaby, Day One: hummed, wordless, far away. */
    g2hum(m) {
        const { S, t, pos, bar, sd, root } = m;
        if (pos === 0) { m.chord().forEach((n, i) => Inst.strings(S.pad, t, midiHz(n), sd * 12, (i - 1) * .3, .025)); Inst.cello(S.bass, t, midiHz(m.midi(root, -1)), sd * 11, .5); }
        m.line(LULLABY[bar % 8], (hz, d, v) => Inst.solo(S.mel, t, hz, d, 'u', v * .7, -.1), 0);
        if (pos % 4 === 0 && bar % 2) Inst.musicbox(S.arp, t, midiHz(m.chord()[(pos / 4) % 3] + 24), .35, .3);
    },
    /* A dirge in 5/4 for the cello: the price of the blade. */
    g2ash(m) {
        const { S, t, pos, bar, sd, root } = m;
        if (pos === 0) { Inst.cello(S.pad, t, midiHz(m.midi(root, -1)), sd * 19, .9); m.chord().forEach((n, i) => Inst.strings(S.str, t, midiHz(n), sd * 19, (i - 1) * .3, .025)); }
        if (pos === 0 || pos === 12) Inst.timpani(S.taiko, t, midiHz(m.midi(0, -1)), .4);
        m.melody(() => (hz, d, v) => Inst.cello(S.mel, t, hz, d, v * .9, .1));
    }
});
const G2_PROG_OK = true;
Object.assign(TRACKS, {
    g2title: { arr: 'g2title', bpm: 54, key: 'D', oct: 2, scale: 'minor', prog: [0, 5, 3, 4, 0, 5, 6, 4], keep: { pad: .8, mel: 1, bass: .7, str: .8, arp: .6, metal: .7 }, drop: ['kick', 'snare', 'hat', 'taiko'], meta: { genre: 'counterpoint chorale', meter: '4/4', key: 'D minor', lead: 'organ and solo voice', tempo: 54 } },
    g2garden: { arr: 'g2garden', bpm: 84, key: 'G', oct: 3, scale: 'major', prog: [0, 4, 5, 3], lead: 1, keep: { arp: .8, mel: .9, pad: .6, bass: .6, hat: .3 }, drop: ['kick', 'snare', 'taiko', 'brass'], mel: ['4---2---0---2---', '4-------4-------', '5---4---2---4---', '7-------........'], meta: { genre: 'pastoral folk', meter: '4/4', key: 'G major', lead: 'nylon guitar and flute', tempo: 84 } },
    g2dawn: { arr: 'g2dawn', steps: 12, bpm: 72, key: 'D', oct: 3, scale: 'lydian', prog: [0, 1, 0, 4, 0, 1, 3, 4], lead: 1, keep: { arp: .9, mel: .9, pad: .6, metal: .6, bass: .6 }, mel: ['0-----1-2---', '3-----2-----', '2---3-4---3-', '2-----------', '4-----5-4---', '3---2-1-----', '2---1-0-----', '0-----------'], meta: { genre: 'plainchant ambient', meter: '6/8', key: 'D lydian', lead: 'harp and solo voice', tempo: 72 } },
    g2knight: { arr: 'g2knight', steps: 12, bpm: 112, key: 'A', oct: 2, scale: 'mixolydian', prog: [0, 0, 6, 4], lead: 1, heavy: true, meta: { genre: 'martial march', meter: '6/8', key: 'A mixolydian', lead: 'horns', tempo: 112 } },
    g2sera: { arr: 'g2sera', bpm: 66, key: 'F#', oct: 2, scale: 'minor', prog: [0, 6, 3, 5, 0, 6, 4, 4], lead: 1, heavy: true, keep: { choir: .9, pad: .8, mel: 1 }, meta: { genre: 'requiem', meter: '4/4', key: 'F# minor', lead: 'women’s choir', tempo: 66, sections: 3 } },
    g2hum: { arr: 'g2hum', steps: 12, bpm: 60, key: 'D', oct: 3, scale: 'major', prog: [0, 3, 4, 0, 5, 3, 4, 0], lead: 0, keep: { mel: .9, pad: .6, bass: .5, arp: .5 }, drop: ['kick', 'snare', 'hat', 'taiko', 'brass', 'ost'], meta: { genre: 'lullaby', meter: '3/4', key: 'D major', lead: 'hummed voice', tempo: 60 } },
    g2ash: { arr: 'g2ash', steps: 20, bpm: 46, key: 'B', oct: 2, scale: 'minor', prog: [0, 2, 5, 4], lead: 1, keep: { pad: .8, mel: .9, str: .6 }, drop: ['kick', 'snare', 'hat', 'brass', 'ost', 'arp'], mel: ['4-------3---2-------', '0-------------------', '2---3---4---5-------', '4-------------------'], meta: { genre: 'dirge', meter: '5/4', key: 'B minor', lead: 'cello', tempo: 46 } }
});
if (!SCALES.lydian) SCALES.lydian = [0, 2, 4, 6, 7, 9, 11];
if (!SCALES.mixolydian) SCALES.mixolydian = [0, 2, 4, 5, 7, 9, 10];
// Boss music comes from Part II tracks only.
B_KNIGHT.music = 'g2knight'; B_SERA.music = 'g2sera';
