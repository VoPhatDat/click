'use strict';
/**
 * MUSIC: an original score, synthesised live. Every track is its own genre with its own
 * arranger, metre and instruments, so no two regions share a formula.
 *   cathedral  plainchant over pipe organ and bells      (menu, the Book of Zero)
 *   city       noir jazz: felt piano, walking bass, brushes
 *   forest     Celtic waltz in 3/4: harp, wooden flute, bodhran
 *   desert     maqam: oud riff, ney with slides, darbuka in maqsum
 *   ice        beatless glass and distant women's choir
 *   volcano    Dies Irae: choir, low brass, taiko, chugging strings
 *   boss       7/8 ostinato with choir stabs
 *   finalboss  organ toccata over double-time Dies Irae
 *   ending     chorale on the Canon progression
 *   train      quiet Rhodes and nylon guitar
 * Dies Irae is a 13th-century plainchant, in the public domain.
 *
 * Melody notation: one string per bar. 0-9 a-e are scale degrees (7 = octave), x y z go
 * below the root, '-' holds the note, '.' rests.
 */
const SPECTRA = {
    strings: [1, .72, .55, .44, .35, .28, .22, .18, .14, .11, .09, .07, .05],
    brass: [1, .95, .8, .66, .54, .42, .32, .24, .17, .12, .08],
    reed: [.7, .25, 1, .2, .6, .18, .36, .12, .2, .08],
    flute: [1, .3, .13, .06, .02],
    keys: [1, .42, .2, .16, .07, .05, .03],
    warm: [1, .5, .25, .12, .06, .03],
    piano: [1, .62, .38, .3, .18, .12, .09, .05, .03],
    organ: [1, .85, .25, .7, .1, .45, .04, .5, .02, .2, 0, .25],
    glass: [1, 0, .3, 0, .12, 0, .05]
};
const VOWELS = { a: [730, 1090, 2440], o: [570, 840, 2410], u: [320, 870, 2240], e: [530, 1840, 2480] };
const THEME = ['4-----5-4---2---', '3-----4-3---0---', '2---3---5---4---', '6-------4-------'];

const Arr = {
    /* Plainchant over organ: slow, huge, with a tolling bell. */
    cathedral(m) {
        const { S, t, pos, bar, sd } = m, chant = ['0---1---2-----1-', '0-----------x---', '0---2---4---5---', '4-------------..', '7---6---5---4---', '5-----4-2-------', '3---2---1---x---', '0---------------'];
        if (pos === 0 && bar % 2 === 0) {
            m.chord().forEach((n, i) => Inst.organ(S.pad, t, midiHz(n), sd * 32, (i - 1.5) * .3, .8));
            Inst.organ(S.bass, t, midiHz(m.midi(m.root, -2)), sd * 32, 0, 1);
            Inst.strings(S.str, t, midiHz(m.midi(m.root + 4, 1)), sd * 32, .2, .035);
        }
        if (pos === 0 && bar % 4 === 0) Inst.bell(S.metal, t, midiHz(m.midi(0, 0)), 1);
        m.line(chant[bar % 8], (hz, d, v) => { Inst.choir(S.mel, t, hz, d, 'o', v * .9, -.15); Inst.choir(S.mel, t, hz * 2, d, 'o', v * .35, .15); }, 0);
        if (pos % 8 === 0) Inst.timpani(S.taiko, t, midiHz(m.midi(0, -1)), pos === 0 ? 1 : .55);
        if (pos % 2 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(m.root)), sd * 1.2, pos % 8 === 0 ? 1 : .6);
    },
    /* Noir: rootless sevenths, walking bass, a lonely piano line. */
    city(m) {
        const { S, t, pos, bar, sd, root } = m, walk = [0, 2, 4, 5];
        if (pos === 0) m.seventh().forEach((n, i) => Inst.piano(S.pad, t, midiHz(n), sd * 12, .42, (i - 1.5) * .25));
        if (pos === 10) m.seventh().slice(1).forEach((n, i) => Inst.piano(S.pad, t, midiHz(n), sd * 5, .28, (i - 1) * .25));
        if (pos % 4 === 0) Inst.pluck(S.bass, t, midiHz(m.midi(root + walk[pos / 4], -2)), 'pizz', pos === 0 ? 1 : .75, 0);
        Inst.brush(S.hat, t, pos, m.groove('x..x.x..x..x.x..'));
        if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .45);
        if (pos === 0 || pos === 7) Inst.kick(S.kick, t, .8);
        if (pos % 2 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(root, 0)), sd, pos % 8 === 0 ? .9 : .5);
        if (pos === 3 && bar % 2) Inst.metal(S.metal, t);
        m.melody(T2 => (hz, d, v) => Inst.piano(S.mel, t, hz, d, v * .95, .1));
        m.melodyBrass(S.brass);
    },
    /* 3/4: harp in sixes, flute above, bodhran below. */
    forest(m) {
        const { S, t, pos, sd, root } = m, ar = [0, 7, 9, 7, 11, 9];
        if (pos === 0) m.chord().forEach((n, i) => Inst.strings(S.pad, t, midiHz(n), sd * 12, (i - 1) * .4, .03));
        if (pos % 2 === 0) { const n = ar[pos / 2]; Inst.pluck(S.arp, t, midiHz(m.midi(root) + [0, 12, 16, 12, 19, 16][pos / 2] - (m.minorThird() ? [0, 0, 1, 0, 0, 1][pos / 2] : 0)), 'harp', pos === 0 ? .9 : .6, (pos - 5) * .08); }
        if (pos === 0) Inst.pluck(S.bass, t, midiHz(m.midi(root, -1)), 'nylon', 1, 0);
        if (pos === 0) Inst.frame(S.taiko, t, 1); if (pos === 6 || pos === 8) Inst.frame(S.taiko, t, .55); if (pos % 2) Inst.shaker(S.hat, t, .4);
        if (pos % 2 === 0) Inst.frame(S.snare, t + .002, .3, 240);
        m.melody(() => (hz, d, v) => Inst.flute(S.mel, t, hz, d, v));
        if (pos % 2 === 0) Inst.fiddle(S.ost, t, midiHz(m.midi(root + [0, 2, 4, 2, 4, 7][pos / 2], 1)), sd * 2, .8);
    },
    /* Maqam: a drone, an oud riff that never changes, ornamented ney on top. */
    desert(m) {
        const { S, t, pos, bar, sd } = m, riff = '0.0x0.2.1.0.x.z.', beat = 'D...T.....T.D...', beat2 = 'T.T...T.T.T.....';
        if (pos === 0 && bar % 2 === 0) { Inst.drone(S.pad, t, midiHz(m.midi(0, -1)), sd * 32); Inst.drone(S.pad, t, midiHz(m.midi(4, -1)), sd * 32); }
        const r = riff[pos]; if (r !== '.') { const d = r === 'x' ? -1 : r === 'z' ? -3 : +r; Inst.pluck(S.arp, t, midiHz(m.midi(d)), 'oud', pos % 4 === 0 ? 1 : .7, -.2); }
        if (pos === 0 || pos === 6 || pos === 12) Inst.pluck(S.bass, t, midiHz(m.midi(0, -1)), 'oud', .9, 0);
        if (beat[pos] === 'D') Inst.darbuka(S.taiko, t, 'dum'); else if (beat[pos] === 'T') Inst.darbuka(S.taiko, t, 'tek');
        if (beat2[pos] === 'T') Inst.darbuka(S.hat, t, 'ka');
        if (pos === 4 || pos === 12) Inst.clap(S.snare, t);
        if (pos % 2 === 0) Inst.frame(S.kick, t, pos % 4 === 0 ? 1 : .6, 70);
        m.melody(() => (hz, d, v) => Inst.ney(S.mel, t, hz, d, v));
        if (pos % 2 === 0) Inst.reed(S.ost, t, midiHz(m.midi(riff[pos] === '.' ? 0 : (riff[pos] === 'x' ? -1 : riff[pos] === 'z' ? -3 : +riff[pos]), 1)), sd * 1.6, .55);
    },
    /* No beat: slow glass, a far choir, single notes falling into the reverb. */
    ice(m) {
        const { S, t, pos, bar, sd, root } = m, pent = [0, 2, 4, 7, 9, 11, 14];
        if (pos === 0 && bar % 2 === 0) { m.chord().forEach((n, i) => Inst.glass(S.pad, t, midiHz(n + 12), sd * 36, (i - 1) * .6)); Inst.choir(S.choir, t, midiHz(m.midi(root + 4, 1)), sd * 34, 'u', 1, -.4); Inst.choir(S.choir, t, midiHz(m.midi(root + 7, 1)), sd * 34, 'u', .8, .4); }
        if (pos % 4 === 0 && m.hash(bar * 16 + pos) > .42) { const d = pent[Math.floor(m.hash(bar * 7 + pos * 3) * 7)]; Inst.bell(S.arp, t, midiHz(m.midi(root + d, 2)), .5, m.hash(pos + bar) - .5); }
        if (pos === 0 && bar % 4 === 0) Inst.bass(S.bass, t, midiHz(m.midi(root, -1)), sd * 24, .7);
        m.melody(() => (hz, d, v) => Inst.bell(S.mel, t, hz, v * .8, .15));
        if (pos % 4 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(root, -1)), sd * 2, pos === 0 ? 1 : .6);
        if (pos === 0 || pos === 6) Inst.timpani(S.taiko, t, midiHz(m.midi(root, -1)), pos ? .55 : .9);
    },
    /* Dies Irae: the day of wrath. */
    volcano(m) {
        const { S, t, pos, bar, sd, root } = m, dies = ['2---1---2---0---', '1---x---0-------', '4---3---4---2---', '3---1---2-------', '2---1---2---0---', '1---x---0-------', '5---4---3---1---', '0---------------'];
        if (pos === 0) { m.chord().forEach((n, i) => { Inst.strings(S.pad, t, midiHz(n), sd * 16, (i - 1) * .4, .05); Inst.brass(S.brass, t, midiHz(n), sd * 7, .7, (i - 1) * .4); }); Inst.bass(S.bass, t, midiHz(m.midi(root, -1)), sd * 8, 1); }
        if (pos % 2 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(root, -1)), sd * .9, [1, .6, .8, .6, 1, .6, .9, .7][pos / 2]);
        m.line(dies[bar % 8], (hz, d, v) => { Inst.choir(S.mel, t, hz, d, 'a', v, -.2); Inst.choir(S.mel, t, hz * .5, d, 'a', v * .8, .2); Inst.choir(S.choir, t, hz * 2, d, 'e', v * .4, 0); }, 0);
        if ('x.....x.x.....x.'[pos] === 'x') Inst.taiko(S.taiko, t, 70);
        if ('x...x..xx...x...'[pos] === 'x') { Inst.kick(S.kick, t, 1); m.pump(t, sd * 3); }
        if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .9);
        if (pos % 2 === 0) Inst.hat(S.hat, t, .6);
        if (pos === 0 && bar % 4 === 0) { Inst.bell(S.metal, t, midiHz(m.midi(0, 0)), .9); Inst.cymbal(S.metal, t); }
    },
    /* 7/8: 4 + 4 + 6 sixteenths. */
    boss(m) {
        const { S, t, pos, sd, root } = m, acc = pos === 0 || pos === 4 || pos === 8;
        if (pos === 0) m.chord().forEach((n, i) => { Inst.strings(S.pad, t, midiHz(n), sd * 14, (i - 1) * .4, .05); });
        if (pos % 2 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(root + (pos === 10 ? 2 : pos === 12 ? 1 : 0), -1)), sd * 1.1, acc ? 1.1 : .65);
        if (acc) { m.chord().forEach((n, i) => { Inst.choir(S.choir, t, midiHz(n + 12), sd * 2.4, 'a', .9, (i - 1) * .4); Inst.brass(S.brass, t, midiHz(n), sd * 2.6, .9, (i - 1) * .3); }); Inst.bass(S.bass, t, midiHz(m.midi(root, -1)), sd * 3, 1); Inst.kick(S.kick, t, 1); Inst.taiko(S.taiko, t, 80); m.pump(t, sd * 3); }
        if (pos === 2 || pos === 6 || pos === 10 || pos === 12) Inst.snare(S.snare, t, pos === 12 ? 1 : .7);
        Inst.hat(S.hat, t, acc ? .9 : .4);
        m.melody(() => (hz, d, v) => Inst.brass(S.mel, t, hz, d, v * 1.1, 0));
        if (pos === 0 && m.bar % 4 === 0) Inst.cymbal(S.metal, t);
    },
    /* The last judgment: an organ toccata above the chant at double time. */
    finalboss(m) {
        const { S, t, pos, bar, sd, root } = m, toc = [7, 6, 7, 5, 7, 4, 7, 3, 7, 2, 7, 3, 7, 4, 7, 5], dies = ['2-1-2-0-1-x-0---', '4-3-4-2-3-1-2---', '2-1-2-0-1-x-0---', '5-4-3-1-0---x---'];
        if (pos === 0) { m.chord().forEach((n, i) => Inst.organ(S.pad, t, midiHz(n), sd * 16, (i - 1) * .5, .9)); Inst.organ(S.bass, t, midiHz(m.midi(root, -2)), sd * 16, 0, 1); }
        Inst.organLead(S.arp, t, midiHz(m.midi(root + toc[pos])), sd * 1.05, pos % 2 ? .55 : .8, (pos % 4 - 1.5) * .15);
        m.line(dies[bar % 4], (hz, d, v) => { Inst.choir(S.mel, t, hz, d, 'a', v * 1.1, -.2); Inst.choir(S.mel, t, hz * .5, d, 'o', v * .8, .2); Inst.choir(S.choir, t, hz * 2, d, 'e', v * .5, 0); Inst.brass(S.brass, t, hz, d, v, 0); }, 0);
        if (pos % 2 === 0) Inst.spiccato(S.ost, t, midiHz(m.midi(root, -1)), sd * .9, 1);
        if ('x.xx..x.x.xx..x.'[pos] === 'x') { Inst.kick(S.kick, t, 1); m.pump(t, sd * 2); }
        if (pos === 4 || pos === 12 || pos === 15) Inst.snare(S.snare, t, 1);
        if ('x..x..x...x.x...'[pos] === 'x') Inst.taiko(S.taiko, t, 75);
        Inst.hat(S.hat, t, pos % 2 ? .4 : .8);
        if (pos === 0) { if (bar % 2 === 0) Inst.bell(S.metal, t, midiHz(m.midi(0, 0)), 1); if (bar % 4 === 0) Inst.cymbal(S.metal, t); }
    },
    /* The duel: the main theme sung alone above war drums, grief instead of rage. */
    wrath(m) {
        const { S, t, pos, bar, sd, root } = m, tune = ['4-----5-4---2---', '3-----4-3---0---', '2---3---5---4---', '6-------4-------', '7-----8-7---5---', '4-----5-4---2---', '1---2---4---5---', '0---------------'];
        if (pos === 0) { m.chord().forEach((n, i) => Inst.strings(S.pad, t, midiHz(n), sd * 16, (i - 1) * .4, .06)); Inst.bass(S.bass, t, midiHz(m.midi(root, -1)), sd * 14, 1); }
        Inst.spiccato(S.ost, t, midiHz(m.midi(root + (pos % 8 === 6 ? 1 : 0), -1)), sd * .9, pos % 4 === 0 ? 1 : .6);
        m.line(tune[bar % 8], (hz, d, v) => { Inst.choir(S.mel, t, hz * 2, d, 'a', v * 1.1, 0); Inst.choir(S.choir, t, hz, d, 'o', v * .7, .2); }, 0);
        if ('x...x.....x.x...'[pos] === 'x') { Inst.taiko(S.taiko, t, 68); Inst.kick(S.kick, t, 1); m.pump(t, sd * 2); }
        if (pos === 8) Inst.snare(S.snare, t, 1); if (pos % 2 === 0) Inst.hat(S.hat, t, .5);
        if (pos === 0 && bar % 4 === 0) { Inst.bell(S.metal, t, midiHz(m.midi(0, 0)), 1); Inst.cymbal(S.metal, t); }
        if (pos === 0 && bar % 2) m.chord().forEach((n, i) => Inst.brass(S.brass, t, midiHz(n), sd * 7, .8, (i - 1) * .3));
    },
    /* Chorale on the Canon progression, the main theme finally resolved in major. */
    ending(m) {
        const { S, t, pos, bar, sd, root } = m, ar = [0, 4, 7, 9, 11, 9, 7, 4];
        if (pos === 0) { m.chord().forEach((n, i) => Inst.strings(S.str, t, midiHz(n + 12), sd * 16, (i - 1) * .4, .05)); Inst.choir(S.choir, t, midiHz(m.chord()[1] + 12), sd * 15, 'a', .55, 0); Inst.bass(S.bass, t, midiHz(m.midi(root, -1)), sd * 14, .7); }
        if (pos % 2 === 0) Inst.piano(S.arp, t, midiHz(m.midi(root + [0, 2, 4, 7, 4, 7, 9, 7][pos / 2])), sd * 4, .4 + (pos % 8 === 0 ? .15 : 0), (pos / 2 - 3.5) * .1);
        m.melody(() => (hz, d, v) => (bar % 16 < 8 ? Inst.piano(S.mel, t, hz, d, v) : Inst.choir(S.mel, t, hz, d, 'a', v, 0)));
    },
    train(m) {
        const { S, t, pos, sd, root } = m;
        if (pos === 0 || pos === 7) m.seventh().forEach((n, i) => Inst.keys(S.pad, t, midiHz(n), sd * 6, .55, (i - 1.5) * .25));
        if (pos === 0 || pos === 10) Inst.pluck(S.bass, t, midiHz(m.midi(root, -1)), 'pizz', 1, 0);
        if (pos % 2 === 0) Inst.pluck(S.arp, t, midiHz(m.midi(root + [0, 4, 7, 9, 7, 4, 2, 4][pos / 2])), 'nylon', .45, .3);
        if (pos === 0 || pos === 6) Inst.kick(S.kick, t, .6); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .3); if (pos % 2 === 0) Inst.hat(S.hat, t, .4);
        m.melody(() => (hz, d, v) => Inst.pluck(S.mel, t, hz, 'nylon', v * .8, -.1));
    }
};

const TRACKS = {
    cathedral: { arr: 'cathedral', bpm: 48, key: 'D', oct: 2, scale: 'minor', prog: [0, 0, 5, 5, 3, 3, 4, 4], keep: { pad: .9, mel: 1, bass: .75, metal: .9, str: .55 } },
    menu: { arr: 'cathedral', bpm: 48, key: 'D', oct: 2, scale: 'minor', prog: [0, 0, 5, 5, 3, 3, 4, 4], keep: { pad: .9, mel: 1, bass: .75, metal: .9, str: .55 } },
    city: { arr: 'city', bpm: 74, key: 'C', oct: 3, scale: 'minor', swing: .16, prog: [0, 5, 3, 4, 2, 5, 1, 4], lead: 1, keep: { hat: .6, bass: .9, mel: 1, pad: 1 }, mel: ['7---5-4-2---0---', '3-----2-0-------', '2-4-5---7---9---', '8-------6-------', '9---7-5-4---2---', '5-----4-2-------', '1-2-4---5---7---', '6---------------'] },
    forest: { arr: 'forest', steps: 12, bpm: 92, key: 'E', oct: 3, scale: 'dorian', prog: [0, 3, 0, 6, 2, 6, 3, 4], lead: 1, keep: { arp: .9, taiko: .55, hat: .35, snare: .2, mel: 1, bass: .7, pad: .6 }, mel: ['4---5-7---9-', '7-----5-----', '4---2-0---2-', '4-----------', '7---9-a---9-', '7---5-4---2-', '3---4-5---7-', '4-----------'] },
    desert: { arr: 'desert', bpm: 108, key: 'A', oct: 3, scale: 'hijaz', prog: [0, 0, 0, 0], lead: 1, keep: { taiko: .8, arp: .85, hat: .45, pad: .55, mel: 1, bass: .7 }, mel: ['................', '4-----5-4-2-1---', '0-------........', '................', '7---8-7-5-4-5---', '4---2---1---0---', '1-2-1-0---x-0---', '0---------......'] },
    ice: { arr: 'ice', bpm: 50, key: 'B', oct: 3, scale: 'minor', prog: [0, 0, 5, 5, 3, 3, 4, 4], lead: 1, keep: { pad: 1, choir: .8, arp: .75, mel: .8 }, mel: ['7---------------', '................', '9-------7-------', '................', 'a-------9-------', '7---------------', '................', '................'] },
    volcano: { arr: 'volcano', bpm: 96, key: 'D', oct: 2, scale: 'minor', prog: [0, 0, 5, 6, 0, 0, 3, 4], keep: { ost: .7, taiko: .8, mel: .8, bass: .9, pad: .6 } },
    boss: { arr: 'boss', steps: 14, bpm: 152, key: 'C', oct: 2, scale: 'harm', prog: [0, 0, 5, 4], lead: 2, heavy: true, mel: ['0-3-4-3-0-3-5-', '7---6---5-----', '5-5-7-5-3-2-3-', '6-----4-------'] },
    finalboss: { arr: 'finalboss', bpm: 164, key: 'D', oct: 2, scale: 'minor', prog: [0, 0, 5, 6, 3, 3, 4, 4], heavy: true, keep: { arp: .9, mel: 1 } },
    wrath: { arr: 'wrath', bpm: 132, key: 'D', oct: 2, scale: 'harm', prog: [0, 5, 3, 4, 0, 5, 1, 4], heavy: true, keep: { mel: 1, choir: .8, ost: .9, taiko: .9, bass: .9 } },
    ending: { arr: 'ending', bpm: 62, key: 'F', oct: 3, scale: 'major', prog: [0, 4, 5, 2, 3, 0, 3, 4], lead: 1, keep: { arp: .9, str: .8, choir: .5, mel: 1, bass: .6 }, mel: THEME.concat(['4-----5-4---2---', '1-----2-1---x---', '0---2---4---5---', '3-------2-------', '7-----9-8-7-5---', '5---4---3---2---', '4---5---7---9---', '8-------7-------', '9---8---7---5---', '6---5---4---3---', '4---5---6---7---', '7---------------']) },
    train: { arr: 'train', bpm: 80, key: 'G', oct: 3, scale: 'dorian', prog: [0, 3, 0, 4], lead: 1, keep: { pad: .9, bass: .7, arp: .7, mel: .7, kick: .45, hat: .3, snare: .3 }, drop: ['ost', 'taiko', 'metal', 'brass'], mel: ['0---2---4-----..', '3---2---0-------', '4---5---7---5---', '4---------------'] }
};
const STEM_MIX = {
    calm: { pad: .75, str: .25, choir: .3, mel: .8, arp: .55, bass: .55, kick: 0, snare: 0, hat: 0, metal: .15, taiko: 0, ost: 0, brass: 0 },
    combat: { pad: .6, str: .5, choir: .3, mel: .75, arp: .5, bass: .85, kick: .8, snare: .6, hat: .45, metal: .4, taiko: .6, ost: .6, brass: .2 },
    elite: { pad: .5, str: .65, choir: .55, mel: .8, arp: .5, bass: .95, kick: 1, snare: .8, hat: .5, metal: .55, taiko: .85, ost: .85, brass: .55 },
    boss: { pad: .5, str: .8, choir: .6, mel: .9, arp: .55, bass: 1, kick: 1, snare: .9, hat: .55, metal: .65, taiko: .95, ost: 1, brass: .85 },
    critical: { pad: .6, str: 1, choir: 1, mel: 1, arp: .7, bass: 1, kick: 1.05, snare: 1, hat: .65, metal: .85, taiko: 1.1, ost: 1, brass: 1 }
};
const DRY_STEMS = { bass: 1, kick: 1 };

const Music = {
    track: null, trackId: null, state: 'calm', stems: {}, step: 0, nextT: 0, timer: null, waves: {}, lastV: null, duck: null, delay: null, samples: {},
    ensureStems() {
        if (!Sound.ok || this.stems.pad) return;
        const c = Sound.ctx;
        const shaper = c.createWaveShaper(), curve = new Float32Array(1024);
        for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 1.4) / Math.tanh(1.4); }
        shaper.curve = curve; shaper.oversample = '2x';
        const shelf = c.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 7000; shelf.gain.value = -4;
        shaper.connect(shelf); shelf.connect(Sound.buses.music);
        this.duck = c.createGain(); this.duck.connect(shaper);
        const dl = c.createDelay(1.5), dr = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter(), pl = c.createStereoPanner(), pr = c.createStereoPanner();
        dl.delayTime.value = .36; dr.delayTime.value = .54; fb.gain.value = .34; lp.type = 'lowpass'; lp.frequency.value = 2600; pl.pan.value = -.7; pr.pan.value = .7;
        dl.connect(lp); lp.connect(fb); fb.connect(dr); dr.connect(pr); dl.connect(pl); pl.connect(shaper); pr.connect(shaper); dr.connect(dl);
        this.delay = dl;
        Object.keys(STEM_MIX.calm).forEach(n => {
            const g = c.createGain(); g.gain.value = 0;
            g.connect(['pad', 'str', 'choir', 'arp', 'ost'].includes(n) ? this.duck : shaper); this.stems[n] = g;
            if (!DRY_STEMS[n]) { const s = c.createGain(); s.gain.value = ({ mel: .42, choir: .55, str: .4, pad: .4, metal: .6, taiko: .3 })[n] || .18; g.connect(s); s.connect(Sound.reverb); }
            if (n === 'mel' || n === 'arp') { const e = c.createGain(); e.gain.value = n === 'mel' ? .2 : .1; g.connect(e); e.connect(dl); }
        });
        this.samples = { nylon: this.karplus(110, 2.2, .9965, .55), harp: this.karplus(110, 3, .9978, .35), oud: this.karplus(110, 1.4, .9925, .85), pizz: this.karplus(55, 1.6, .9945, .3) };
    },
    /** Karplus-Strong: a real plucked-string model rendered once, then repitched. */
    karplus(f, dur, damp, bright) {
        const c = Sound.ctx, sr = c.sampleRate, N = Math.floor(sr / f), buf = c.createBuffer(1, Math.floor(dur * sr), sr), d = buf.getChannelData(0), ring = new Float32Array(N);
        let prev = 0; for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = prev + bright * (r - prev); ring[i] = prev; }
        let p = 0; for (let i = 0; i < d.length; i++) { const nx = (p + 1) % N, v = ring[p]; d[i] = v; ring[p] = damp * .5 * (v + ring[nx]); p = nx; }
        return buf;
    },
    wave(name) {
        if (this.waves[name]) return this.waves[name];
        const S = SPECTRA[name], re = new Float32Array(S.length + 1), im = new Float32Array(S.length + 1);
        S.forEach((a, i) => { im[i + 1] = a; });
        return this.waves[name] = Sound.ctx.createPeriodicWave(re, im);
    },
    play(id, state) {
        if (state) this.state = state;
        if (!Sound.ok) { this.trackId = id; return; }
        this.ensureStems();
        if (id === this.trackId && this.timer) { this.applyMix(1.2); return; }
        this.trackId = id; this.track = TRACKS[id]; this.step = 0; this.lastV = null;
        this.delay.delayTime.setTargetAtTime(60 / this.track.bpm * .75, Sound.ctx.currentTime, .05);
        this.nextT = Sound.ctx.currentTime + .1; this.applyMix(.7);
        if (!this.timer) this.timer = setInterval(() => this.tick(), 60);
    },
    stop(fade = 1) {
        if (!Sound.ok) return;
        for (const k in this.stems) this.stems[k].gain.setTargetAtTime(0, Sound.ctx.currentTime, fade / 3);
        clearInterval(this.timer); this.timer = null; this.trackId = null;
    },
    setState(s) { if (s !== this.state) { this.state = s; this.applyMix(s === 'calm' ? 2.6 : .9); } },
    applyMix(fade) {
        if (!Sound.ok || !this.track) return;
        const mix = STEM_MIX[this.state] || STEM_MIX.calm, T = this.track, t = Sound.ctx.currentTime;
        for (const k in this.stems) {
            let v = Math.max(mix[k] || 0, (T.keep && T.keep[k]) || 0);
            if (T.drop && T.drop.includes(k)) v = 0;
            this.stems[k].gain.setTargetAtTime(v, t, fade / 3);
        }
    },
    midi(deg, octUp = 0) {
        const T = this.track, sc = SCALES[T.scale], n = sc.length, o = Math.floor(deg / n), i = ((deg % n) + n) % n;
        return (T.oct + 2 + o + octUp) * 12 + NOTE[T.key] + sc[i];
    },
    voiced(root, degs) {
        const base = degs.map(d => this.midi(root + d)), target = this.lastV ? this.lastV.reduce((a, b) => a + b) / this.lastV.length : (this.track.oct + 3) * 12 + 2;
        let best = base, bd = Infinity;
        for (let inv = 0; inv < base.length; inv++) for (const sh of [-12, 0]) {
            const w = base.map((m, i) => (i < inv ? m + 12 : m) + sh).sort((a, b) => a - b), d = Math.abs(w.reduce((a, b) => a + b) / w.length - target);
            if (d < bd) { bd = d; best = w; }
        }
        return best;
    },
    tick() {
        if (!Sound.ok || !this.track || Sound.ctx.state !== 'running') return;
        const T = this.track, c = Sound.ctx, sd = 60 / T.bpm / 4;
        if (this.nextT < c.currentTime - .4) this.nextT = c.currentTime + .05;
        const ahead = typeof document !== 'undefined' && document.hidden ? 1.4 : .28;
        while (this.nextT < c.currentTime + ahead) {
            const sw = this.step % 2 ? sd * (T.swing || .04) : 0;
            this.playStep(this.step, this.nextT + sw + Math.random() * .004, sd);
            this.nextT += sd; this.step++;
        }
    },
    playStep(s, t, sd) {
        const T = this.track, steps = T.steps || 16, pos = s % steps, bar = Math.floor(s / steps), root = T.prog[bar % T.prog.length], self = this;
        const m = {
            S: this.stems, T, t, sd, pos, bar, root, midi: (d, o) => self.midi(d, o),
            hash: n => { const v = Math.sin(n * 91.7) * 43758.5; return v - Math.floor(v); },
            minorThird: () => { const sc = SCALES[T.scale], n = sc.length, r = ((root % n) + n) % n; return ((sc[(r + 2) % n] - sc[r] + 12) % 12) === 3; },
            chord: () => (pos === 0 ? (self.lastV = self.voiced(root, [0, 2, 4])) : self.lastV || self.voiced(root, [0, 2, 4])),
            seventh: () => (pos === 0 ? (self.lastV = self.voiced(root, [0, 2, 4, 6])) : self.lastV || self.voiced(root, [0, 2, 4, 6])),
            groove: p => p[pos] === 'x',
            pump: (at, d) => { if (self.state === 'calm') return; const g = self.duck.gain; g.cancelScheduledValues(at); g.setValueAtTime(.62, at); g.linearRampToValueAtTime(1, at + d); },
            /** Plays one bar of notation, calling fn(hz, seconds, velocity) on note starts. */
            line(barMel, fn, octUp = 1) {
                const slot = barMel && barMel[pos]; if (!slot || slot === '-' || slot === '.') return;
                let len = 1; for (let i = pos + 1; i < barMel.length && barMel[i] === '-'; i++) len++;
                const d = slot === 'x' ? -1 : slot === 'y' ? -2 : slot === 'z' ? -3 : '0123456789abcde'.indexOf(slot);
                fn(midiHz(self.midi(d, octUp)), len * sd * .98, .82 + (pos % 4 === 0 ? .16 : 0) + Math.random() * .05);
            },
            melody(mk) { if (T.mel) m.line(T.mel[bar % T.mel.length], mk(), T.lead === undefined ? 1 : T.lead); },
            melodyBrass(stem) { if (T.mel) m.line(T.mel[bar % T.mel.length], (hz, d, v) => Inst.brass(stem, t, hz, d, v * .6, 0), T.lead === undefined ? 1 : T.lead); }
        };
        Arr[T.arr](m);
    }
};

const Inst = {
    voice(dest, t, o) {
        const c = Sound.ctx, s = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), p = c.createStereoPanner();
        if (o.table) s.setPeriodicWave(Music.wave(o.table)); else s.type = o.type || 'sine';
        s.frequency.value = o.f; if (o.det) s.detune.value = o.det;
        if (o.slide) { s.frequency.setValueAtTime(o.f * o.slide, t); s.frequency.exponentialRampToValueAtTime(o.f, t + .09); }
        const a = o.a || .01, r = o.r || .08, end = t + o.d + r, v = o.v;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
        if (o.dec) g.gain.setTargetAtTime(o.sus === undefined ? 0 : v * o.sus, t + a, o.dec);
        g.gain.setValueAtTime(o.dec ? Math.max(.0001, v * (o.sus || .02)) : v, Math.max(t + a, t + o.d));
        g.gain.linearRampToValueAtTime(0, end);
        f.type = 'lowpass'; f.Q.value = o.q || .5; f.frequency.setValueAtTime(o.lp0 || o.lp || 9000, t);
        if (o.lp0) f.frequency.exponentialRampToValueAtTime(o.lp, t + (o.lpT || a + .05));
        p.pan.value = o.pan || 0;
        s.connect(f); f.connect(g); g.connect(p); p.connect(dest);
        if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vibF || 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib, t + Math.min(.6, o.d * .5)); l.connect(lg); lg.connect(s.detune); l.start(t); l.stop(end + .02); }
        s.start(t); s.stop(end + .02);
    },
    /** Repitched Karplus-Strong string with a touch of body resonance. */
    pluck(o, t, f, kind, vel = .7, pan = 0) {
        const c = Sound.ctx, src = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner(), b = c.createBiquadFilter();
        src.buffer = Music.samples[kind]; src.playbackRate.value = f / (kind === 'pizz' ? 55 : 110);
        b.type = 'peaking'; b.frequency.value = kind === 'oud' ? 520 : 300; b.Q.value = 1; b.gain.value = kind === 'oud' ? 7 : 3;
        g.gain.value = .34 * vel; p.pan.value = pan; src.connect(b); b.connect(g); g.connect(p); p.connect(o); src.start(t); src.stop(t + 3.5);
    },
    /** Formant choir: three detuned voices through a vowel filter bank. */
    choir(o, t, f, d, vowel = 'a', vel = 1, pan = 0) {
        const c = Sound.ctx, g = c.createGain(), p = c.createStereoPanner(), A = Math.min(.5, d * .22), R = Math.min(.6, d * .25) + .08; p.pan.value = pan;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.3 * vel, t + A); g.gain.setValueAtTime(.3 * vel, t + Math.max(A, d - R)); g.gain.linearRampToValueAtTime(0, t + d + .1);
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 4.8 + Math.random(); lg.gain.value = 9; lfo.connect(lg);
        const bank = (VOWELS[vowel] || VOWELS.a).map((fr, i) => { const b = c.createBiquadFilter(), bg = c.createGain(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = 8 + i * 2; bg.gain.value = [1, .6, .3][i]; b.connect(bg); bg.connect(g); return b; });
        [-9, 0, 9].forEach(det => { const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = f; s.detune.value = det; lg.connect(s.detune); bank.forEach(b => s.connect(b)); s.start(t); s.stop(t + d + .15); });
        lfo.start(t); lfo.stop(t + d + .15); g.connect(p); p.connect(o);
    },
    organ(o, t, f, d, pan = 0, vel = 1) { this.voice(o, t, { table: 'organ', f, d, v: .075 * vel, a: .04, r: .14, pan, lp: 5000 }); this.voice(o, t, { table: 'organ', f: f * 2, d, v: .03 * vel, a: .05, r: .14, pan: -pan, lp: 6000, det: 3 }); },
    organLead(o, t, f, d, vel, pan) { this.voice(o, t, { table: 'organ', f, d, v: .1 * vel, a: .004, r: .03, pan, lp: 5200 }); },
    strings(o, t, f, d, pan, v = .05) { [-6, 5].forEach((det, i) => this.voice(o, t, { table: 'strings', f, d, v, a: Math.min(.7, d * .22), r: Math.min(1.2, d * .35), lp: 3200, det, pan: pan + (i ? .15 : -.15), vib: 9, vibF: 5 + i * .4 })); },
    spiccato(o, t, f, d, vel) { this.voice(o, t, { table: 'strings', f, d, v: .09 * vel, a: .006, r: .05, dec: d * .5, sus: .1, lp: 2800, lp0: 5000, pan: -.25 }); this.voice(o, t, { table: 'strings', f: f * 2, d, v: .04 * vel, a: .006, r: .05, dec: d * .5, sus: .1, lp: 3400, pan: .25 }); },
    fiddle(o, t, f, d, vel) { this.voice(o, t, { table: 'strings', f, d, v: .06 * vel, a: .015, r: .05, lp: 4200, vib: 12, vibF: 6, pan: .3 }); },
    bass(o, t, f, d, vel) { this.voice(o, t, { type: 'sine', f, d, v: .22 * vel, a: .008, r: .1 }); this.voice(o, t, { table: 'warm', f, d: d * .8, v: .1 * vel, a: .006, r: .06, lp: 620, lp0: 1300 }); },
    brass(o, t, f, d, vel = 1, pan = 0) {
        this.voice(o, t, { table: 'brass', f, d, v: .085 * vel, a: .04, r: .14, lp: 2300, lp0: 420, lpT: .1, q: 1, pan, vib: 6 });
        this.voice(o, t, { table: 'brass', f: f * .5, d, v: .055 * vel, a: .045, r: .14, lp: 1300, lp0: 260, lpT: .11, pan: -pan, det: 4 });
    },
    piano(o, t, f, d, vel = 1, pan = 0) {
        const L = Math.max(d, 1.2), k = f < 400 ? 1.2 : f < 800 ? .9 : .6;
        [-1.5, 1.5].forEach(det => this.voice(o, t, { table: 'piano', f, d: L, v: .085 * vel, a: .003, r: .3, dec: .42 * k, sus: .04, lp: 3000, lp0: 7000, lpT: .35, pan, det }));
        Sound.burst(o, t, { f: Math.min(2600, f * 3), d: .02, v: .022 * vel, q: 2 });
    },
    keys(o, t, f, d, vel = .6, pan = 0) { this.voice(o, t, { table: 'keys', f, d: Math.min(d, 1.2), v: .1 * vel, a: .004, r: .14, dec: .3, sus: .08, lp: 2000, lp0: 3600, pan }); this.voice(o, t, { type: 'sine', f: f * 3.01, d: .12, v: .012 * vel, a: .002, r: .05, pan }); },
    flute(o, t, f, d, vel = 1) { this.voice(o, t, { table: 'flute', f, d, v: .14 * vel, a: .05, r: .1, lp: 5000, vib: 14, vibF: 5.4, slide: .985 }); Sound.burst(o, t, { f: f * 2, d: .09, v: .018 * vel, q: 4 }); },
    ney(o, t, f, d, vel = 1) { this.voice(o, t, { table: 'flute', f, d, v: .13 * vel, a: .09, r: .16, lp: 3600, vib: 24, vibF: 5, slide: .94 }); Sound.burst(o, t, { f: f * 1.5, d: Math.min(.3, d), v: .03 * vel, q: 3 }); },
    reed(o, t, f, d, vel = 1) { this.voice(o, t, { table: 'reed', f, d, v: .085 * vel, a: .02, r: .06, lp: 3000, q: 1.2, vib: 16, vibF: 6 }); },
    drone(o, t, f, d) { this.voice(o, t, { table: 'reed', f, d, v: .05, a: d * .2, r: d * .2, lp: 1200, pan: -.2, vib: 5 }); this.voice(o, t, { table: 'warm', f: f * 2.003, d, v: .03, a: d * .25, r: d * .2, pan: .2 }); },
    glass(o, t, f, d, pan) { this.voice(o, t, { table: 'glass', f, d, v: .06, a: d * .35, r: d * .4, pan, vib: 4, vibF: .4 }); },
    bell(o, t, f, vel = .8, pan = 0) { [[.5, .05, 2.8], [1, .09, 2.2], [1.19, .04, 1.6], [2, .035, 1.1], [2.74, .022, .8], [4.1, .012, .5]].forEach(([m, v, L]) => this.voice(o, t, { type: 'sine', f: f * m, d: L, v: v * vel, a: .003, r: .3, dec: L * .35, sus: .01, pan })); },
    kick(o, t, vel = 1) { Sound.tone(o, t, { f: 140, f2: 42, sweep: .09, d: .22, v: .42 * vel }); Sound.burst(o, t, { f: 3000, d: .012, v: .05 * vel, q: 1 }); },
    snare(o, t, vel) { Sound.tone(o, t, { type: 'triangle', f: 230, f2: 150, sweep: .06, d: .1, v: .1 * vel }); Sound.burst(o, t, { ft: 'highpass', f: 1600, d: .16, v: .1 * vel }); },
    hat(o, t, v, open) { Sound.burst(o, t, { ft: 'highpass', f: 8200, d: open ? .2 : .03, v: .032 * v }); },
    brush(o, t, pos, on) { if (on) Sound.burst(o, t, { ft: 'bandpass', f: 5200, d: .09, v: .03, q: .6 }); else if (pos % 4 === 2) Sound.burst(o, t, { f: 4000, d: .05, v: .012, q: .6 }); },
    shaker(o, t, v) { Sound.burst(o, t, { ft: 'highpass', f: 6500, d: .05, v: .03 * v }); },
    metal(o, t) { [320, 757, 1293, 2011].forEach(f => Sound.tone(o, t, { type: 'square', f, d: .16, v: .012, lp: 4500 })); Sound.burst(o, t, { f: 2600, d: .1, v: .018, q: 6 }); },
    taiko(o, t, f = 90) { Sound.tone(o, t, { f: f * 1.5, f2: f * .75, sweep: .08, d: .46, v: .34 }); Sound.burst(o, t, { ft: 'lowpass', f: 800, f2: 200, d: .08, v: .12 }); },
    timpani(o, t, f, vel = 1) { Sound.tone(o, t, { f: f * 1.04, f2: f, sweep: .05, d: .9, v: .26 * vel }); Sound.tone(o, t, { f: f * 1.5, d: .3, v: .06 * vel }); Sound.burst(o, t, { ft: 'lowpass', f: 600, d: .05, v: .06 * vel }); },
    frame(o, t, vel = 1, f = 95) { Sound.tone(o, t, { f: f * 1.3, f2: f, sweep: .05, d: .22, v: .22 * vel }); Sound.burst(o, t, { ft: 'lowpass', f: 1200, d: .03, v: .05 * vel }); },
    darbuka(o, t, k) {
        if (k === 'dum') { Sound.tone(o, t, { f: 190, f2: 118, sweep: .06, d: .2, v: .3 }); Sound.burst(o, t, { f: 400, d: .03, v: .05 }); }
        else if (k === 'tek') { Sound.tone(o, t, { f: 760, f2: 620, sweep: .02, d: .05, v: .16 }); Sound.burst(o, t, { ft: 'highpass', f: 2400, d: .03, v: .08 }); }
        else { Sound.tone(o, t, { f: 620, d: .03, v: .07 }); Sound.burst(o, t, { ft: 'highpass', f: 3000, d: .02, v: .05 }); }
    },
    clap(o, t) { for (let i = 0; i < 3; i++) Sound.burst(o, t + i * .012, { f: 1500, d: .05, v: .06, q: .8 }); },
    cymbal(o, t) { Sound.burst(o, t, { ft: 'highpass', f: 4800, d: 1.5, v: .075 }); }
};
