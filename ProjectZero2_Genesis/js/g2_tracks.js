'use strict';
/**
 * G2 TRACKS: every region, mini-boss, boss and finale act has its own arranger, metre, key, lead
 * and tempo (tools/music_check.js holds them to it). Boss tracks have one section per phase,
 * chosen at the bar line. Zero's Lullaby has a version for each chapter (family 'lullaby').
 */
Compose.remeter = (bar, steps) => { const ev = Compose.parse(bar), k = steps / bar.length; return Compose.write(ev.map(e => ({ pos: Math.min(steps - 1, Math.round(e.pos * k)), len: Math.max(1, Math.round(e.len * k)), deg: e.deg })), steps); };
Compose.retro = bar => { const ev = Compose.parse(bar), n = bar.length; return Compose.write(ev.map(e => ({ pos: Math.max(0, n - e.pos - e.len), len: e.len, deg: e.deg })), n); };
const LUL12 = LULLABY, LUL16 = LULLABY.map(b => Compose.remeter(b, 16)), THEME12 = THEME.map(b => Compose.remeter(b, 12)), GEN12 = THEME_GENESIS.map(b => Compose.remeter(b, 12));
const VESPER28 = MOTIF.vesper.map(b => Compose.remeter(b, 28));

/* A dynamic progression or key, read at each bar (playStep hook). */
(function () {
    const ps = Music.playStep.bind(Music);
    Music.playStep = function (s, t, sd) { const T = this.track, st = T.steps || 16, bar = Math.floor(s / st); if (T.progFn) T.prog = [T.progFn(bar, T)]; if (T.keyFn) T.key = T.keyFn(bar, T); if (T.scaleFn) T.scale = T.scaleFn(bar, T); return ps(s, t, sd); };
})();

const pad = (m, X, fn, o = 0) => { if (m.pos === 0) X.ch(o).forEach((hz, i) => fn(hz, i)); };
const secOf = (T, bar) => (T.sections ? T.sections(bar) : 0);

Object.assign(Arr, {
    /* MENU AND OPENING: the Genesis theme for violin over harp and strings; the choir joins on the second half. */
    g2title(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, L = sd * 16;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, L * .98, (i - 1) * .35, .03));
        if (pos === 0) { Inst.cello(S.bass, t, X.rootHz(-1), L * .95, .7); if (bar % 8 === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), .5); if (bar % 4 === 0) Inst.churchBell(S.metal, t, X.hz(0, 1), .25); }
        if (pos % 4 === 0) Inst.harp(S.arp, t, X.ch(1)[(pos / 4) % 3], .4, (pos / 4 - 1.5) * .25);
        X.mel((hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .85, .15), 0);
        if (bar % 8 >= 4) X.mel((hz, d, v) => Inst.sing(S.choir, t, hz / 2, d, 'o', v * .45, -.2), 0);
    },
    /* THE GARDEN: fingerpicked guitar in 6/8; flute by day, guitar by evening, music box at night. */
    g2garden(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, h = (G.g2music && G.g2music.tod !== undefined) ? G.g2music.tod : new Date().getHours(), night = h >= 21 || h < 6, eve = !night && h >= 17;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 12, (i - 1) * .3, night ? .016 : .022));
        if (pos === 0) Inst.guitar(S.bass, t, X.rootHz(-1), .65, -.15); if (pos === 6) Inst.guitar(S.bass, t, X.hz(m.root + 4, -1), .45, -.15);
        const pick = [0, -1, 2, -1, 1, -1, 2, -1, 1, -1, 2, -1]; if (pick[pos] >= 0 && pos) Inst.guitar(S.arp, t, X.ch(0)[pick[pos]], .32, .2);
        if (night) X.line(LUL12, (hz, d, v) => Inst.musicbox(S.mel, t, hz, v * .8, .1), 1);
        else X.mel((hz, d, v) => (eve ? Inst.guitar(S.mel, t, hz, v * .6, .25) : Inst.flute(S.mel, t, hz, d, v * .6)));
        if (!night && pos % 6 === 3) Inst.shaker(S.hat, t, .2);
    },
    /* DAY ONE, THE CITY OF ETERNAL DAWN: chant for one voice in D Lydian, harp in sixes, bells. */
    g2dawn(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 12, (i - 1) * .4, .02));
        if (pos === 0) { Inst.drone(S.bass, t, X.hz(0, -2), sd * 12); if (bar % 2 === 0) Inst.bell(S.metal, t, X.hz(4, 1), .3, .4); }
        if (pos % 2 === 0) Inst.harp(S.arp, t, X.hz(m.root + [0, 2, 4, 7, 4, 2][pos / 2], 0), pos === 0 ? .6 : .35, (pos - 5) * .08);
        X.mel((hz, d, v) => Inst.sing(S.mel, t, hz, d, 'a', v * .55, 0));
        if (X.hot()) { if (pos === 0 || pos === 6) Inst.frame(S.taiko, t, pos ? .5 : .9); if (pos % 2 === 0) Inst.spiccato(S.ost, t, X.rootHz(0), sd * 1.2, pos === 0 ? .8 : .45); }
    },
    /* Mini-boss, Day One: the Shadowless Knight's march for horns, built on the dawn chant. */
    g2knight(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 12, (i - 1) * .4, .03));
        Inst.spiccato(S.ost, t, X.hz(m.root + [0, 0, 4, 0, 2, 4][pos % 6], 0), sd * .9, pos % 6 === 0 ? 1 : .55);
        if (pos % 6 === 0) { Inst.timpani(S.taiko, t, X.rootHz(-1), pos ? .6 : .9); Inst.kick(S.kick, t, .8); m.pump(t, sd * 3); X.ch(0).forEach((hz, i) => Inst.horn(S.brass, t, hz, sd * 2.4, .7, (i - 1) * .3)); }
        if (pos % 6 === 3) Inst.snare(S.snare, t, .6); if (pos % 2 === 0) Inst.hat(S.hat, t, pos % 6 === 0 ? .5 : .3);
        X.mel((hz, d, v) => Inst.horn(S.mel, t, hz, d, v, 0));
    },
    /* Seraphina: a requiem. I women's choir and organ; II the false lights, strings in canon and horns;
       III blind: almost nothing, a low drone and a far voice, so her bells can be heard. */
    g2sera(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        if (ph >= 2) { if (pos === 0) { Inst.drone(S.pad, t, X.hz(0, -2), sd * 16); if (bar % 2 === 0) Inst.sing(S.choir, t, X.hz(4, 0), sd * 15, 'u', .25, 0); } return; }
        if (pos === 0) { X.ch(0).forEach((hz, i) => { Inst.organ(S.pad, t, hz, sd * 16, (i - 1) * .4, .6); Inst.choir(S.choir, t, hz * 2, sd * 15, bar % 2 ? 'a' : 'o', .45, (i - 1) * .4); }); Inst.organ(S.bass, t, X.hz(m.root, -2), sd * 16, 0, .8); }
        X.mel((hz, d, v) => Inst.sing(S.mel, t, hz, d, 'a', v * .7, 0));
        if (pos === 0 || pos === 10) Inst.timpani(S.taiko, t, X.hz(0, -1), pos === 0 ? .8 : .5);
        if (ph === 1) { if (pos % 2 === 0) Inst.spiccato(S.ost, t, X.hz(m.root + [4, 2][pos / 2 % 2], 0), sd * .9, .6); if (pos === 4) X.line(MOTIF.seraphina, (hz, d, v) => Inst.strings(S.str, t, hz * 2, d, .3, .04), 0); if (pos === 8) X.ch(0).forEach((hz, i) => Inst.horn(S.brass, t, hz, sd * 6, .6, (i - 1) * .3)); }
    },
    /* DAY TWO, THE SEA OF TEARS: a slow waltz for piano and cello that sounds through water. */
    g2sea(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        if (pos === 0) { Inst.piano2(S.bass, t, X.rootHz(-1), sd * 11, .5, -.1); if (bar % 2 === 0) Inst.sea(S.pad, t, sd * 24, 1); X.ch(0).forEach((hz, i) => Inst.strings(S.str, t, hz, sd * 12, (i - 1) * .3, .015)); }
        if (pos === 4 || pos === 8) X.ch(0).forEach((hz, i) => Inst.piano2(S.arp, t, hz, sd * 3.5, .24, (i - 1) * .3));
        X.mel((hz, d, v) => Inst.cello(S.mel, t, hz, d, v * .85, .1), 0);
        if (bar % 4 === 3 && pos === 8) Inst.celesta(S.metal, t, X.hz(4, 2), .25, .4);
        if (X.hot()) { if (pos === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), .45); if (pos % 2 === 0) Inst.spiccato(S.ost, t, X.hz(m.root, 0), sd * 1.5, .45); }
    },
    /* Mini-boss, Day Two: the Lantern Whale. Low brass and organ pedal, the whale's call. */
    g2whale(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        if (pos === 0) { Inst.organ(S.bass, t, X.hz(m.root, -2), sd * 12, 0, .9); X.ch(-1).forEach((hz, i) => Inst.brass(S.brass, t, hz, sd * 5, .7, (i - 1) * .3)); Inst.taiko(S.taiko, t, 70); if (bar % 2) Inst.howl(S.choir, t, X.hz(0, -1), sd * 10, .6, -.3); }
        if (pos === 4 || pos === 8) { Inst.taiko(S.taiko, t, 95); Inst.spiccato(S.ost, t, X.hz(m.root + 2, 0), sd * 2, .6); }
        if (pos % 2 === 1) Inst.hat(S.hat, t, .25);
        X.mel((hz, d, v) => Inst.horn(S.mel, t, hz, d, v, 0), 0);
    },
    /* Mareva: a tragic aria in 12/8. I her song; II the tide, timpani on every dotted beat;
       III drowned, everything muffled and the beat laid bare so her attacks can be read. */
    g2mareva(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        if (ph < 2) {
            pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 24, (i - 1) * .4, ph ? .03 : .022));
            if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), sd * 22, .55, 0);
            if (pos % 2 === 0) Inst.harp(S.arp, t, X.ch(1)[[0, 1, 2, 1, 2, 1][(pos / 2) % 6]], pos % 6 === 0 ? .45 : .28, ((pos / 2) % 6 - 2.5) * .12);
            X.mel((hz, d, v) => Inst.sing(S.mel, t, hz, d, ['a', 'o', 'a', 'e'][m.bar % 4], v * .8, 0));
            if (ph === 1) { if (pos % 6 === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), pos === 0 ? .9 : .6); if (pos % 2 === 0) Inst.spiccato(S.ost, t, X.ch(0)[(pos / 2) % 3], sd * 1.2, .5); if (pos === 0) X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz, sd * 23, 'o', .4, (i - 1) * .4)); }
        } else {
            if (pos === 0) { Inst.drone(S.pad, t, X.hz(0, -2), sd * 24); Inst.sea(S.str, t, sd * 24, 1.4); }
            if (pos % 6 === 0) { Inst.kick(S.kick, t, pos === 0 ? 1 : .7); Inst.timpani(S.taiko, t, X.rootHz(-1), .7); }
            X.mel((hz, d, v) => Inst.voice(S.mel, t, { table: 'flute', f: hz, d, v: .07 * v, a: d * .6, r: .1, lp: 700, vib: 40, vibF: 2.2 }));
        }
    },
    /* DAY THREE, THE FOREST OF MEMORY: a fairy tale slightly out of tune. 5/4, A Dorian, a music box
       that cannot hold its pitch, a wooden flute, a dulcimer in 3 + 2. */
    g2forest(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 20, (i - 1) * .3, .018));
        if (pos === 0) Inst.cello(S.bass, t, X.rootHz(-1), sd * 11, .45); if (pos === 12) Inst.cello(S.bass, t, X.hz(m.root + 4, -1), sd * 7, .35);
        if (pos % 2 === 0) { const k = pos / 2; Inst.dulcimer(S.arp, t, X.ch(1)[[0, 1, 2, 1, 2, 0, 2, 1, 2, 1][k]], k === 0 || k === 6 ? .45 : .25, (k - 5) * .08); }
        X.mel((hz, d, v) => Inst.musicbox(S.mel, t, hz, v * .85, -.1, (m.hash(bar * 31 + pos) - .5) * 46));
        if (bar % 2 === 1 && (pos === 0 || pos === 12)) Inst.flute(S.str, t, X.ch(1)[1], sd * (pos ? 8 : 12), .45);
        if (X.hot()) { if (pos === 0 || pos === 12) Inst.logdrum(S.taiko, t, 1, 150); if (pos % 4 === 2) Inst.logdrum(S.snare, t, .5, 300); }
    },
    /* Mini-boss, Day Three: the Memory Scarecrow. A dark folk dance for fiddle at double speed. */
    g2scarecrow(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        if (pos === 0 || pos === 12) { Inst.kick(S.kick, t, 1); Inst.cello(S.bass, t, X.rootHz(-1), sd * (pos ? 7 : 11), .7); }
        if (pos === 6 || pos === 16) Inst.logdrum(S.snare, t, .8, 260); if (pos % 2 === 0) Inst.dulcimer(S.arp, t, X.ch(0)[(pos / 2) % 3], .35, .2);
        if (pos % 4 === 0) Inst.clap(S.hat, t);
        X.mel((hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .9, .2), 1);
    },
    /* The Gardener, Mother of Roots: dark folk. I fiddle and wooden drums; II the roots, a cello
       ostinato and stamping; III the mask, the children's rhyme sung further and further out of tune. */
    g2gardener(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 12, (i - 1) * .3, .024));
        if (pos === 0 || pos === 6) Inst.logdrum(S.taiko, t, pos ? .7 : 1, 140); if (pos === 9) Inst.logdrum(S.snare, t, .5, 280);
        X.mel((hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .8, .25), 0);
        if (bar % 2 === 0 || ph === 2) X.line(MOTIF.gardener.map(b => Compose.remeter(b, 12)), (hz, d, v) => Inst.sing(S.choir, t, hz * (ph === 2 ? Math.pow(2, -(.3 + .4 * m.hash(bar)) / 12) : 1), d, 'u', v * .45, -.2, true), 1);
        if (ph >= 1) { Inst.cello(S.bass, t, X.hz(m.root + [0, 0, 4, 0, 2, 0][pos % 6], -1), sd * .9, pos % 6 === 0 ? .8 : .5); if (pos % 3 === 0) Inst.kick(S.kick, t, .6); }
        if (ph === 2 && pos === 0) [0, 1, 6].forEach(k => Inst.drone(S.ost, t, X.hz(m.root + k, -1), sd * 12));
    },
    /* DAY FOUR, THE BROKEN OBSERVATORY: minimalism in 7/8, an arpeggio that never stops, celesta, long pads. */
    g2observ(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        if (pos === 0 && bar % 2 === 0) X.ch(0).forEach((hz, i) => Inst.synPad(S.pad, t, hz, sd * 28, .7, (i - 1) * .5));
        if (pos === 0) Inst.synBass(S.bass, t, X.rootHz(-1), sd * 13, .6);
        if (pos % 2 === 0) { const k = pos / 2; Inst.synArp(S.arp, t, X.ch7(1)[[0, 2, 1, 0, 2, 1, 3][k]], sd * 2, k === 0 ? .8 : .5, (k - 3) * .15); }
        if (bar % 4 >= 2 && pos % 2 === 1) { const k = (pos - 1) / 2; Inst.synArp(S.ost, t, X.ch(2)[k % 3], sd, .25, .4); }
        X.mel((hz, d, v) => Inst.celesta(S.mel, t, hz, v * .75, .2));
        if (X.hot()) { if (pos === 0 || pos === 6 || pos === 10) Inst.kick(S.kick, t, .6); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .45); if (pos % 2 === 0) Inst.hat(S.hat, t, .3); }
    },
    /* Mini-boss, Day Four: the Meteor Clock. Clockwork electronica at full speed. */
    g2clock(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        if (pos % 2 === 0) Inst.clock(S.metal, t, pos === 0 ? 1.2 : .7, pos % 4 === 0);
        if (pos === 0 || pos === 6 || pos === 10) Inst.kick(S.kick, t, .9); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .7);
        Inst.synBass(S.bass, t, X.rootHz(-1) * (pos % 4 === 2 ? 2 : 1), sd * .8, .5);
        if (pos % 2 === 1) Inst.synArp(S.arp, t, X.ch(1)[(pos >> 1) % 3], sd, .4, .3);
        X.mel((hz, d, v) => Inst.voice(S.mel, t, { type: 'square', f: hz, d, v: .03 * v, a: .004, r: .05, lp: 3000 }), 1);
    },
    /* Astraea: synthwave counting down. The clock is the beat. I countdown; II prophecy, arpeggios in
       sixteenths; III gravity turns: the music runs backwards (retrograde, reversed envelopes). */
    g2astraea(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        if (pos % 4 === 0) Inst.clock(S.metal, t, 1, pos % 8 === 0);
        if (ph < 2) {
            if (pos === 0) X.ch(0).forEach((hz, i) => Inst.synPad(S.pad, t, hz, sd * 15, .8, (i - 1) * .5));
            if (pos % 2 === 0) Inst.synBass(S.bass, t, X.rootHz(-1) * (pos % 4 === 2 ? 2 : 1), sd * 1.6, .6);
            if (pos === 0 || pos === 8) Inst.kick(S.kick, t, .9); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .8);
            X.mel((hz, d, v) => Inst.synLead(S.mel, t, hz, d, v * .85, 0), 1);
            if (ph === 1) Inst.synArp(S.arp, t, X.ch(1)[[0, 1, 2, 1][pos % 4]], sd, .45, (pos % 4 - 1.5) * .3);
        } else {
            if (pos === 0) X.ch(0).forEach((hz, i) => Inst.rev(S.pad, t, hz, sd * 15, .5, (i - 1) * .5, 'strings'));
            if (pos % 2 === 0) Inst.rev(S.bass, t, X.rootHz(-1), sd * 1.8, .7, 0, 'warm');
            if (pos === 15) Inst.kick(S.kick, t, .9); if (pos === 3 || pos === 11) Inst.snare(S.snare, t, .6);
            X.line(T_RETRO(m.T), (hz, d, v) => Inst.rev(S.mel, t, hz, d, v * .8, 0, 'brass'), 1);
        }
    },
    /* DAY FIVE, THE DESERT OF THE PACK: a hunt. Taiko and darbuka, a hunting horn, wolves far away. */
    g2desert(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        if (X.is('x..x..x.x.x..x..')) Inst.taiko(S.taiko, t, pos === 0 ? 80 : 104);
        const db = 'd.t.k.t.d.dt.kt.'; if (db[pos] !== '.') Inst.darbuka(S.snare, t, { d: 'dum', t: 'tek', k: 'ka' }[db[pos]]);
        if (pos === 0) Inst.drone(S.pad, t, X.rootHz(-1), sd * 16); if (pos % 4 === 0) Inst.bass(S.bass, t, X.rootHz(-1), sd * 2, pos === 0 ? .8 : .5);
        X.mel((hz, d, v) => Inst.horn(S.mel, t, hz, d, v * .85, 0), 0);
        if (bar % 4 === 3 && pos === 8) Inst.howl(S.choir, t, X.hz(4, 1), sd * 8, .5, .5);
        if (X.hot() && pos % 2 === 0) Inst.spiccato(S.ost, t, X.hz(m.root + (pos % 8 === 6 ? 1 : 0), 0), sd * .9, .5);
    },
    /* Mini-boss, Day Five: the Fire-Horned Antelope. War drums. */
    g2antelope(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        if (pos % 2 === 0) Inst.taiko(S.taiko, t, pos % 8 === 0 ? 70 : 110); if (pos % 4 === 2) Inst.frame(S.snare, t, .8);
        if (pos === 0 || pos === 6 || pos === 10) Inst.kick(S.kick, t, 1); if (pos === 0) X.ch(-1).forEach((hz, i) => Inst.horn(S.brass, t, hz, sd * 3, .9, (i - 1) * .3));
        if (pos % 2 === 0) Inst.bass(S.bass, t, X.rootHz(-1), sd * 1.5, .7);
        X.mel((hz, d, v) => Inst.brass(S.mel, t, hz, d, v * .8, 0), 0);
    },
    /* Lilith-Varga: tribal metal. I drums, a palm-muted riff, howls; II the great wolf, power chords and
       double kick; III frenzy, blast beat and a howling chord. */
    g2lilith(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        if (X.is('x..x..x.x.x..x..')) Inst.taiko(S.taiko, t, 76);
        if (ph === 0) { if (pos % 2 === 0) Inst.eguitar(S.ost, t, X.rootHz(-1), sd * .7, .6, 0, false); if (pos === 0 || pos === 8) Inst.kick(S.kick, t, 1); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .9); }
        else { if (ph === 1 || pos % 2 === 0) Inst.kick(S.kick, t, .8); if (pos % 4 === 0) Inst.eguitar(S.brass, t, X.rootHz(-1), sd * (pos === 0 ? 3.5 : 1.6), .8, 0, true); if (ph === 1 ? pos === 4 || pos === 12 : pos % 2 === 0) Inst.snare(S.snare, t, ph === 2 ? .6 : .9); Inst.hat(S.hat, t, .3); }
        if (pos === 0) Inst.bass(S.bass, t, X.rootHz(-1), sd * 14, .9);
        X.mel((hz, d, v) => Inst.eguitar(S.mel, t, hz, d, v * .7, .2, false), 0);
        if (pos === 0 && (bar % 4 === 3 || ph === 2)) [0, 2, 4].slice(0, ph === 2 ? 3 : 1).forEach((k, i) => Inst.howl(S.choir, t, X.hz(m.root + k, 1), sd * 12, .5, (i - 1) * .6));
    },
    /* DAY SIX, NEW MERIDIAN: industrial liturgy. Organ, machine hammers, a dirty synth bass. */
    g2meridian(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        pad(m, X, (hz, i) => Inst.organ(S.pad, t, hz, sd * 16, (i - 1) * .4, .45));
        if (pos % 8 === 0) Inst.hammer(S.metal, t, pos === 0 ? .8 : .55);
        if (pos % 2 === 0) Inst.synBass(S.bass, t, X.rootHz(-1) * (pos % 8 === 6 ? 2 : 1), sd * 1.6, .6, true);
        X.mel((hz, d, v) => Inst.organLead(S.mel, t, hz, d, v * .7, 0), 1);
        if (X.hot()) { if (pos % 4 === 0) Inst.kick(S.kick, t, .8); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .6); if (pos % 2) Inst.hat(S.hat, t, .35); Inst.organLead(S.ost, t, X.ch(1)[pos % 3], sd * .9, .3, (pos % 3 - 1) * .3); }
    },
    /* Mini-boss, Day Six: the Preacher Engine. A machine that sings its sermon. */
    g2preacher(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        if (pos % 4 === 0) { Inst.kick(S.kick, t, 1); Inst.hammer(S.metal, t, .6); } if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .8);
        Inst.synBass(S.bass, t, X.rootHz(-1) * (pos % 4 === 3 ? 2 : 1), sd * .8, .6, true);
        if (pos === 0) X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz, sd * 15, 'o', .45, (i - 1) * .4));
        X.mel((hz, d, v) => Inst.synLead(S.mel, t, hz, d, v * .8, 0), 1);
    },
    /* Archon Veil: film action. I battle, brass over running strings; II the machines join; III she
       hesitates: a solo violin and almost nothing else; IV her last stand. */
    g2archon(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec(), hes = G.boss && G.boss.hesitate > 0;
        if (hes || ph === 2) { pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 16, (i - 1) * .4, .025)); if (pos === 0) Inst.heart(S.kick, t, .6); X.mel((hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .9, 0), 1); return; }
        if (pos === 0) { X.ch(0).forEach((hz, i) => Inst.brass(S.brass, t, hz, sd * 6, .75, (i - 1) * .3)); Inst.timpani(S.taiko, t, X.rootHz(-1), .9); }
        Inst.spiccato(S.ost, t, X.hz(m.root + [0, 2, 4, 2][pos % 4], 0), sd * .9, pos % 4 === 0 ? .8 : .45);
        if (pos % 8 === 4) Inst.snare(S.snare, t, .7); if (pos % 4 === 0) Inst.kick(S.kick, t, .7); if (pos % 2 === 0) Inst.bass(S.bass, t, X.rootHz(-1), sd * 1.6, .7);
        X.mel((hz, d, v) => Inst.brass(S.mel, t, hz, d, v * .85, 0), 0);
        if (ph >= 1 && pos % 4 === 2) { Inst.hammer(S.metal, t, .4); Inst.synArp(S.arp, t, X.ch(1)[pos % 3], sd, .4, .3); }
        if (ph === 3 && pos === 0) X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz * 2, sd * 15, 'a', .45, (i - 1) * .4));
    },
    /* The Architect: avant-garde on a twelve-tone row. Each phase has its own grouping and its own pitch. */
    g2architect(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec(), grp = [5, 7, 3, 4][ph] || 5, row = MOTIF.architect, base = m.midi(0, -1) + [0, 6, 1, 4][ph];
        const k = Math.floor((bar * 16 + pos) / grp) % 12, onset = (bar * 16 + pos) % grp === 0;
        if (onset) { Inst.piano2(S.mel, t, midiHz(base + 12 + row[k]), sd * grp, .6, (k % 3 - 1) * .5); Sound.burst(S.metal, t, { ft: 'bandpass', f: 2400 + row[k] * 200, d: .03, v: .04, q: 6 }); Inst.kick(S.kick, t, .5); }
        if (pos === 0) { [0, 1, 6].forEach(i => Inst.glass(S.pad, t, midiHz(base + row[(bar + i) % 12] + 24), sd * 16, (i - 1) * .5)); Inst.drone(S.bass, t, midiHz(base - 12), sd * 16); }
        if (ph >= 1 && pos % 2 === 0) Inst.synArp(S.arp, t, midiHz(base + 24 + row[(k + pos) % 12]), sd, .3, .3);
        if (ph >= 2 && pos % grp === grp - 1) Inst.snare(S.snare, t, .5);
    },
    /* THE EMPTY THRONE: the Part I theme set again for piano and strings, then the Genesis theme over it. */
    g2throne(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 16, (i - 1) * .4, .026));
        if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), sd * 14, .45, -.1);
        if (pos % 2 === 0) Inst.piano2(S.arp, t, X.ch(1)[[0, 1, 2, 1, 0, 1, 2, 1][pos / 2]], sd * 3, .2, .2);
        if (bar % 8 < 4) X.line(THEME, (hz, d, v) => Inst.piano2(S.mel, t, hz, d, v * .7, 0), 1);
        else { X.line(THEME_GENESIS, (hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .75, .2), 0); X.line(THEME, (hz, d, v) => Inst.cello(S.str, t, hz, d, v * .55, -.2), 0); }
    },
    /* Mini-boss, Day Seven: Zero's Shadow. The Part I theme in the minor, for low strings and brass. */
    g2zshadow(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        Inst.spiccato(S.ost, t, X.hz(m.root + [0, 0, 2, 0, 4, 0, 2, 0][pos % 8], -1), sd * .9, pos % 4 === 0 ? .8 : .45);
        if (pos === 0) { X.ch(-1).forEach((hz, i) => Inst.brass(S.brass, t, hz, sd * 8, .8, (i - 1) * .3)); Inst.timpani(S.taiko, t, X.rootHz(-1), 1); }
        if (pos === 8) Inst.timpani(S.taiko, t, X.hz(m.root + 4, -1), .6); if (pos % 4 === 0) Inst.kick(S.kick, t, .7); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .6);
        X.line(THEME, (hz, d, v) => Inst.cello(S.mel, t, hz, d, v, 0), 0);
    },
    /* Vesper's leitmotif scenes: a dirge in 5/4 for cello. */
    g2vesper(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        if (pos === 0) { Inst.cello(S.pad, t, X.rootHz(-1), sd * 19, .8); X.ch(0).forEach((hz, i) => Inst.strings(S.str, t, hz, sd * 19, (i - 1) * .3, .02)); }
        if (pos === 0 || pos === 12) Inst.timpani(S.taiko, t, X.hz(0, -1), .35);
        X.mel((hz, d, v) => Inst.cello(S.mel, t, hz, d, v * .85, .1));
    },

    /* ---------------- ZERO'S LULLABY, one version per chapter (family 'lullaby') ---------------- */
    g2lul(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, v = m.T.ver, L = sd * 12, mel = (fn, o) => X.line(m.T.lulMel || LUL12, fn, o);
        if (v === 1) { pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, L, (i - 1) * .3, .016)); mel((hz, d, w) => Inst.hum(S.mel, t, hz, d, w * .9, -.1), 0); }
        else if (v === 2) { if (pos === 0) Inst.musicbox(S.bass, t, X.rootHz(0), .5, -.2); if (pos === 4 || pos === 8) X.ch(1).forEach((hz, i) => Inst.musicbox(S.arp, t, hz, .22, (i - 1) * .3)); mel((hz, d, w) => Inst.musicbox(S.mel, t, hz, w * .8, .1), 1); if (bar >= 8) mel((hz, d, w) => Inst.sing(S.choir, t, hz, d, 'a', w * .5, 0, true), 1); }
        else if (v === 3) { pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, L, (i - 1) * .3, .018)); if (pos % 4 === 0) Inst.guitar(S.arp, t, pos ? X.ch(0)[pos / 4] : X.rootHz(-1), .4, .2); mel((hz, d, w) => Inst.flute(S.mel, t, hz, d, w * .65), 1); }
        else if (v === 4) { if (pos === 0) X.ch(0).forEach((hz, i) => Inst.synPad(S.pad, t, hz, L, .5, (i - 1) * .4)); if (pos % 4 === 0) Inst.celesta(S.arp, t, X.ch(1)[(pos / 4 + bar) % 3], .25, .3); mel((hz, d, w) => Inst.celesta(S.mel, t, hz, w * .8, 0), 1); if (pos === 0 && bar % 2) Inst.heart(S.kick, t, .3); }
        else if (v === 5) { if (pos === 0) Inst.wind(S.pad, t, L * 2, 1); if (pos === 0 && bar % 3 === 2) Inst.piano2(S.mel, t, X.hz([4, 2, 0, 1][(bar / 3 | 0) % 4], 1), L, .35, 0); }
        else if (v === 6) { pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, L, (i - 1) * .4, .03)); Inst.spiccato(S.ost, t, X.ch(0)[pos % 3], sd * .9, pos % 4 === 0 ? .7 : .4); if (pos === 0) { Inst.timpani(S.taiko, t, X.rootHz(-1), .8); X.ch(-1).forEach((hz, i) => Inst.horn(S.brass, t, hz, L * .9, .5, (i - 1) * .3)); } if (pos % 4 === 0) Inst.bass(S.bass, t, X.rootHz(-1), sd * 3, .6); mel((hz, d, w) => Inst.violin(S.mel, t, hz, d, w, 0), 1); mel((hz, d, w) => Inst.cello(S.str, t, hz, d, w * .6, -.2), 0); }
        else if (v === 7) {
            const lay = bar % 32 >> 3; pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, L, (i - 1) * .4, .02 + lay * .004));
            mel((hz, d, w) => Inst.musicbox(S.arp, t, hz * 2, w * .5, .3), 1); if (lay >= 1) mel((hz, d, w) => Inst.flute(S.mel, t, hz, d, w * .55), 1);
            if (lay >= 2) mel((hz, d, w) => Inst.cello(S.str, t, hz, d, w * .6, -.2), 0); if (lay >= 3) mel((hz, d, w) => Inst.sing(S.choir, t, hz, d, 'a', w * .45, 0), 1);
            if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), L, .4, 0);
        }
        else if (v === 'a0') { // Finale, Act 0: the music box, then the organ with the Part I theme, wind beneath
            const s2 = bar % 16 >= 8; if (pos === 0 && bar % 2 === 0) Inst.wind(S.pad, t, L * 2, .6);
            if (!s2) mel((hz, d, w) => Inst.musicbox(S.mel, t, hz, w * .8, 0), 1);
            else { if (pos === 0) X.ch(0).forEach((hz, i) => Inst.organ(S.str, t, hz, L, (i - 1) * .4, .5)); X.line(THEME12, (hz, d, w) => Inst.organLead(S.mel, t, hz, d, w * .55, 0), 0); if (pos % 4 === 0) Inst.musicbox(S.arp, t, X.ch(2)[pos / 4 % 3], .2, .3); }
        }
        else if (v === '5a') { const fade = Math.max(0, 1 - Math.max(0, bar - 8) / 8); if (pos === 0 && bar >= 6) Inst.wind(S.pad, t, L * 2, 1 - fade * .6); mel((hz, d, w) => Inst.sing(S.mel, t, hz, d, 'a', w * .7 * fade, 0), 1); }
        else if (v === '5c') { const k = (G.g2detune || 0); if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), L, .4, 0); let n = 0; mel((hz, d, w) => { n++; const off = n + bar * 3 <= k * 2 ? Math.pow(2, ((m.hash(bar * 7 + pos) > .5 ? 1 : -1) * (.6 + m.hash(pos) * .8)) / 12) : 1; Inst.piano2(S.mel, t, hz * off, d, w * .7, 0); }, 1); }
        else if (v === '5d') { if (pos === 0) Inst.drone(S.pad, t, X.hz(0, -2), L); X.line(LUL12.map(Compose.retro).reverse(), (hz, d, w) => Inst.rev(S.mel, t, hz / 2, d, w * .8, 0, 'piano'), 0); if (pos === 0 && bar % 8 === 7) Inst.churchBell(S.metal, t, X.hz(0, -1), .8); }
    },

    /* ---------------- THE SEVENTH DAY ---------------- */
    /* Act 1, Nyx against Vesper: 7/4, orchestra and four-part choir. Vesper's theme on brass, the
       lullaby running in the strings, chasing each other. Each wave is stronger. */
    g2act1(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec(), acc = [0, 4, 8, 14, 18, 22];
        if (pos === 0) { X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz, sd * 13, ['a', 'o', 'e'][i], .4 + ph * .08, (i - 1) * .4)); Inst.bass(S.bass, t, X.rootHz(-1), sd * 13, .8); }
        if (pos === 14) { X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz, sd * 13, 'a', .4, (i - 1) * .4)); Inst.bass(S.bass, t, X.hz(m.root + 4, -1), sd * 13, .7); }
        if (acc.includes(pos)) { Inst.taiko(S.taiko, t, pos % 14 === 0 ? 70 : 100); if (ph >= 1) Inst.kick(S.kick, t, .8); }
        if (ph >= 1 && pos % 2 === 1) Inst.hat(S.hat, t, .3); if (ph === 2 && (pos === 10 || pos === 24)) Inst.cymbal(S.metal, t);
        X.line(VESPER28, (hz, d, v) => Inst.brass(S.mel, t, hz, d, v * .9, -.1), 0);
        const lul = Compose.parse(LUL12[bar % 8]).map(e => e.deg); if (pos % 2 === 0) Inst.spiccato(S.ost, t, X.hz(lul[(pos / 2) % lul.length], 1), sd * 1.4, .55 + ph * .1);
    },
    /* Act 2, Vesper's memory: an old film. Piano and cello, Vesper's theme in the major. Then the fire. */
    g2act2(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        if (pos % 4 === 0) Inst.crackle(S.metal, t, 4);
        if (ph === 0) {
            if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), sd * 14, .45, -.1); if (pos % 4 === 2) X.ch(0).forEach((hz, i) => Inst.piano2(S.arp, t, hz, sd * 2, .18, (i - 1) * .3));
            X.mel((hz, d, v) => Inst.cello(S.mel, t, hz, d, v * .8, .1), 0);
        } else {
            if (pos === 0) X.ch(1).forEach((hz, i) => Inst.choir(S.choir, t, hz * (1 + bar % 4 * .06), sd * 15, 'a', .3 + (bar % 4) * .12, (i - 1) * .4));
            if (pos % 2 === 0) Inst.spiccato(S.ost, t, X.ch(0)[(pos / 2) % 3], sd, .4 + (bar % 4) * .1); if (pos % 4 === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), .5);
        }
    },
    /* Act 3, the Architect rises: Zero's theme, Vesper's theme and the lullaby together, taiko,
       running strings, a choir on Latin vowels. Each law of physics changes key and grouping; time
       reversed runs backwards; absolute night leaves only the lullaby and a heartbeat. */
    g2act3(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, ph = X.sec();
        if (ph === 3) { if (pos === 0) Inst.heart(S.kick, t, .8); if (pos === 8) Inst.heart(S.kick, t, .5); X.line(LUL16, (hz, d, v) => Inst.musicbox(S.mel, t, hz, v * .9, 0), 1); return; }
        if (ph === 1) { if (pos === 0) X.ch(0).forEach((hz, i) => Inst.rev(S.pad, t, hz, sd * 15, .5, (i - 1) * .4, 'strings')); if (pos % 2 === 0) Inst.rev(S.ost, t, X.ch(1)[(7 - pos / 2) % 3], sd * 1.8, .5, .2, 'strings'); X.line(THEME.map(Compose.retro), (hz, d, v) => Inst.rev(S.mel, t, hz, d, v, 0, 'brass'), 0); if (pos === 15) Inst.taiko(S.taiko, t, 70); return; }
        if (pos === 0) { X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz, sd * 7, ['a', 'e', 'o', 'u'][(bar + i) % 4], .45, (i - 1) * .4)); Inst.bass(S.bass, t, X.rootHz(-1), sd * 7, .9); }
        if (pos === 8) { X.ch(0).forEach((hz, i) => Inst.choir(S.choir, t, hz, sd * 7, ['o', 'u', 'a', 'e'][(bar + i) % 4], .45, (i - 1) * .4)); Inst.bass(S.bass, t, X.rootHz(-1), sd * 7, .8); }
        if (X.is(ph === 2 ? 'x..x..x..x..x.x.' : 'x..x..x.x.x..x..')) Inst.taiko(S.taiko, t, pos === 0 ? 70 : 100); if (pos % 4 === 0) Inst.kick(S.kick, t, .7); if (pos === 4 || pos === 12) Inst.snare(S.snare, t, .7);
        Inst.spiccato(S.ost, t, X.ch(1)[pos % 3], sd * .8, pos % 4 === 0 ? .6 : .35);
        X.line(THEME, (hz, d, v) => Inst.brass(S.brass, t, hz, d, v * .8, -.2), 0);
        if (ph >= 2 || bar % 2) X.line(MOTIF.vesper, (hz, d, v) => Inst.strings(S.str, t, hz * 2, d, .2, .05), 0);
        if (ph === 4) X.line(LUL16, (hz, d, v) => Inst.sing(S.mel, t, hz, d, 'a', v * .6, 0), 1);
    },
    /* Act 4, the choice: one held string note, a heartbeat, the wind. */
    g2act4(m) { const X = g2x(m), { S, t, pos, bar, sd } = m; if (pos === 0) { Inst.strings(S.pad, t, X.hz(0, 0), sd * 16, 0, .03); Inst.heart(S.kick, t, .5); if (bar % 2 === 0) Inst.wind(S.str, t, sd * 32, .7); } },
    /* 5B, the Guardian: Zero's theme on brass as a funeral march. */
    g2end5b(m) {
        const X = g2x(m), { S, t, pos, sd } = m;
        if (pos === 0) { X.ch(-1).forEach((hz, i) => Inst.horn(S.pad, t, hz, sd * 15, .5, (i - 1) * .3)); Inst.timpani(S.taiko, t, X.rootHz(-1), .6); }
        if (pos === 12 || pos === 14) Inst.snare(S.snare, t, .35);
        X.line(THEME, (hz, d, v) => Inst.brass(S.mel, t, hz, d, v * .8, 0), 0);
    },
    /* 5C, Good Night: everything at once. The lullaby for orchestra and choir, then the Part I theme
       and the Genesis theme together, then the lullaby again. */
    g2end5c(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, b = bar % 24, mid = b >= 8 && b < 16, L = sd * 12;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, L, (i - 1) * .4, .03));
        if (pos === 0) { X.ch(1).forEach((hz, i) => Inst.choir(S.choir, t, hz, L * .95, 'a', .38, (i - 1) * .4)); Inst.bass(S.bass, t, X.rootHz(-1), L * .9, .7); if (b % 8 === 0) { Inst.timpani(S.taiko, t, X.rootHz(-1), .8); Inst.cymbal(S.metal, t); } }
        if (pos % 4 === 0) Inst.harp(S.arp, t, X.ch(1)[(pos / 4) % 3], .35, .3);
        if (!mid) { X.line(LUL12, (hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .9, 0), 1); X.line(LUL12, (hz, d, v) => Inst.horn(S.brass, t, hz, d, v * .5, -.2), 0); }
        else { X.line(THEME12, (hz, d, v) => Inst.horn(S.brass, t, hz, d, v * .7, -.2), 0); X.line(GEN12, (hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .9, .2), 0); }
    },
    /* Credits: the Genesis theme, the lullaby, Vesper's theme in the major, and the Part I theme. */
    g2credits(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, part = (bar >> 3) % 4;
        pad(m, X, (hz, i) => Inst.strings(S.pad, t, hz, sd * 16, (i - 1) * .4, .025));
        if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), sd * 14, .45, 0); if (pos % 4 === 2) X.ch(1).forEach((hz, i) => Inst.piano2(S.arp, t, hz, sd * 2, .16, (i - 1) * .3));
        const src = [THEME_GENESIS, LUL16, MOTIF.vesper, THEME][part], o = [0, 1, 1, 1][part], inst = [(hz, d, v) => Inst.violin(S.mel, t, hz, d, v * .8, .1), (hz, d, v) => Inst.flute(S.mel, t, hz, d, v * .6), (hz, d, v) => Inst.cello(S.mel, t, hz, d, v * .8, 0), (hz, d, v) => Inst.piano2(S.mel, t, hz, d, v * .7, 0)][part];
        X.line(src, inst, o); if (pos === 0 && bar % 8 === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), .5);
    }
});
const T_RETRO = T => (T._retro = T._retro || T.mel.map(Compose.retro));

/* ------------------------------ THE TRACK LIST ------------------------------ */
const NO_DRUMS = ['kick', 'snare', 'hat', 'taiko'], QUIET = ['kick', 'snare', 'hat', 'taiko', 'brass', 'ost'];
const seq = (motif, prog, steps, o) => Compose.seq(motif, prog, steps, o);
const PROGS = {
    title: [0, 4, 5, 2, 3, 4, 0, 4], garden: [0, 3, 4, 0, 5, 3, 1, 4], dawn: [0, 1, 0, 4, 5, 1, 3, 0], sea: [0, 5, 3, 4, 0, 3, 1, 4], whale: [0, 5, 0, 4],
    mareva: [0, 3, 5, 4, 0, 3, 1, 4], forest: [0, 3, 0, 6, 0, 3, 4, 0], scare: [0, 6, 0, 3], gardener: [0, 5, 3, 4, 0, 5, 6, 0], observ: [0, 0, 5, 5, 3, 3, 6, 4],
    clock: [0, 3, 5, 6], astraea: [0, 5, 2, 6, 0, 5, 3, 4], desert: [0, 1, 0, 6, 0, 1, 3, 1], antelope: [0, 1, 6, 1], lilith: [0, 1, 0, 3, 0, 1, 5, 6],
    meridian: [0, 6, 5, 4, 0, 5, 3, 4], preacher: [0, 0, 6, 5], archon: [0, 6, 5, 6, 0, 3, 4, 4], architect: [0], throne: [0, 4, 5, 2, 0, 4, 5, 2], zshadow: [0, 5, 3, 4],
    vesper: [0, 2, 5, 4], act1: [0, 5, 6, 4], act2: [0, 3, 4, 0, 5, 3, 1, 4], act3: [0, 6, 5, 4], end5b: [0, 4, 5, 2], credits: [0, 4, 5, 2, 0, 3, 4, 0]
};
const MK = (o, meta) => Object.assign({ meta }, o);
Object.assign(TRACKS, {
    g2title: MK({ arr: 'g2title', bpm: 76, key: 'D', oct: 3, scale: 'major', prog: PROGS.title, mel: THEME_GENESIS.concat(seq(THEME_GENESIS[0], PROGS.title.slice(4), 16, { start: 9, lo: 5, hi: 12 })), keep: { pad: .8, mel: 1, bass: .7, arp: .7, choir: .6, metal: .6, taiko: .5 }, drop: ['kick', 'snare', 'hat'], reverb: 'hall' }, { genre: 'orchestral hymn', meter: '4/4', key: 'D major', lead: 'violin and choir', tempo: 76 }),
    g2garden: MK({ arr: 'g2garden', steps: 12, bpm: 96, key: 'G', oct: 3, scale: 'major', prog: PROGS.garden, mel: seq('4-----5-4-2-', PROGS.garden, 12, { start: 4, lo: 2, hi: 9 }), keep: { arp: .8, mel: .9, pad: .6, bass: .7, hat: .3 }, drop: ['kick', 'snare', 'taiko', 'brass'], reverb: 'forest' }, { genre: 'pastoral folk', meter: '6/8', key: 'G major', lead: 'nylon guitar and flute', tempo: 96 }),
    g2dawn: MK({ arr: 'g2dawn', steps: 12, bpm: 66, key: 'D', oct: 3, scale: 'lydian', prog: PROGS.dawn, lead: 1, mel: seq('4-----5-4---', PROGS.dawn, 12, { start: 4, lo: 0, hi: 9 }), keep: { arp: .9, mel: .9, pad: .6, metal: .6, bass: .6 }, reverb: 'cathedral' }, { genre: 'plainchant ambient', meter: '6/8', key: 'D lydian', lead: 'harp and solo voice', tempo: 66 }),
    g2knight: MK({ arr: 'g2knight', steps: 12, bpm: 116, key: 'D', oct: 2, scale: 'lydian', prog: [0, 0, 1, 4], lead: 1, heavy: true, mel: seq('0-0-4---5-4-', [0, 0, 1, 4], 12, { start: 7, lo: 4, hi: 11, invert: false }), reverb: 'hall' }, { genre: 'martial march', meter: '6/8', key: 'D lydian', lead: 'horns', tempo: 116, boss: 'knight', sections: 1 }),
    g2sera: MK({ arr: 'g2sera', bpm: 66, key: 'F#', oct: 2, scale: 'minor', prog: [0, 6, 3, 5, 0, 6, 4, 4], lead: 1, heavy: true, mel: seq(MOTIF.seraphina[0], [0, 6, 3, 5, 0, 6, 4, 4], 16, { start: 7, lo: 4, hi: 12 }), keep: { choir: .9, pad: .8, mel: 1 }, reverb: 'cathedral' }, { genre: 'requiem', meter: '4/4', key: 'F# minor', lead: 'women’s choir', tempo: 66, boss: 'seraphina', sections: 3 }),
    g2sea: MK({ arr: 'g2sea', steps: 12, bpm: 76, key: 'F', oct: 2, scale: 'harm', prog: PROGS.sea, mel: seq('4-------3-2-', PROGS.sea, 12, { start: 7, lo: 4, hi: 11 }), keep: { pad: .7, mel: 1, arp: .8, bass: .8, str: .6, metal: .5 }, reverb: 'water' }, { genre: 'underwater waltz', meter: '3/4', key: 'F minor', lead: 'piano and cello', tempo: 76 }),
    g2whale: MK({ arr: 'g2whale', steps: 12, bpm: 108, key: 'F', oct: 2, scale: 'harm', prog: PROGS.whale, mel: seq('0-------4-3-', PROGS.whale, 12, { start: 7, lo: 4, hi: 11 }), heavy: true, reverb: 'water' }, { genre: 'deep-sea drone march', meter: '3/4', key: 'F minor', lead: 'low brass and organ', tempo: 108, boss: 'whale', sections: 1 }),
    g2mareva: MK({ arr: 'g2mareva', steps: 24, bpm: 84, key: 'C', oct: 3, scale: 'harm', prog: PROGS.mareva, mel: seq(MOTIF.mareva[0], PROGS.mareva, 24, { start: 4, lo: 0, hi: 9 }), keep: { mel: 1, pad: .7, arp: .7 }, heavy: true, reverb: 'water' }, { genre: 'tragic opera', meter: '12/8', key: 'C minor', lead: 'soprano', tempo: 84, boss: 'mareva', sections: 3 }),
    g2forest: MK({ arr: 'g2forest', steps: 20, bpm: 100, key: 'A', oct: 3, scale: 'dorian', prog: PROGS.forest, mel: seq('4-2-0-2-4---5-4-2---', PROGS.forest, 20, { start: 4, lo: 2, hi: 11 }), keep: { mel: 1, arp: .8, pad: .6, bass: .6, str: .6 }, reverb: 'forest' }, { genre: 'off-key fairy tale', meter: '5/4', key: 'A dorian', lead: 'music box and wooden flute', tempo: 100 }),
    g2scarecrow: MK({ arr: 'g2scarecrow', steps: 20, bpm: 150, key: 'A', oct: 3, scale: 'dorian', prog: PROGS.scare, mel: seq('0-2-4-2-0-4-5-4-2-0-', PROGS.scare, 20, { start: 4, lo: 0, hi: 9 }), heavy: true, reverb: 'forest' }, { genre: 'dark folk dance', meter: '5/4', key: 'A dorian', lead: 'fiddle', tempo: 150, boss: 'scarecrow', sections: 1 }),
    g2gardener: MK({ arr: 'g2gardener', steps: 12, bpm: 92, key: 'B', oct: 3, scale: 'minor', prog: PROGS.gardener, mel: seq('4---3-2---0-', PROGS.gardener, 12, { start: 7, lo: 4, hi: 11 }), keep: { mel: 1, choir: .8, pad: .6 }, heavy: true, reverb: 'forest' }, { genre: 'dark folk', meter: '6/8', key: 'B minor', lead: 'fiddle and children’s voices', tempo: 92, boss: 'gardener', sections: 3 }),
    g2observ: MK({ arr: 'g2observ', steps: 14, bpm: 126, key: 'E', oct: 3, scale: 'minor', prog: PROGS.observ, mel: seq('7---4---2-----', PROGS.observ, 14, { start: 7, lo: 4, hi: 11 }), keep: { arp: .9, mel: .9, pad: .7, bass: .7, ost: .5 }, reverb: 'void' }, { genre: 'space minimalism', meter: '7/8', key: 'E minor', lead: 'celesta and synth arpeggio', tempo: 126 }),
    g2clock: MK({ arr: 'g2clock', steps: 14, bpm: 168, key: 'E', oct: 3, scale: 'minor', prog: PROGS.clock, mel: seq('0-2-4-7-4-2-4-', PROGS.clock, 14, { start: 4, lo: 0, hi: 9 }), heavy: true, reverb: 'room' }, { genre: 'clockwork electronica', meter: '7/8', key: 'E minor', lead: 'square lead and clock', tempo: 168, boss: 'clock', sections: 1 }),
    g2astraea: MK({ arr: 'g2astraea', bpm: 108, key: 'A', oct: 3, scale: 'minor', prog: PROGS.astraea, mel: seq(MOTIF.astraea[0], PROGS.astraea, 16, { start: 4, lo: 0, hi: 9 }), heavy: true, keep: { metal: .8 }, reverb: 'void' }, { genre: 'synthwave countdown', meter: '4/4', key: 'A minor', lead: 'analog synth', tempo: 108, boss: 'astraea', sections: 3 }),
    g2desert: MK({ arr: 'g2desert', bpm: 140, key: 'D', oct: 3, scale: 'phryg', prog: PROGS.desert, mel: seq('0---4---7-6-4---', PROGS.desert, 16, { start: 4, lo: 0, hi: 9 }), keep: { taiko: .8, snare: .5, mel: .9, pad: .5, bass: .7 }, reverb: 'cave' }, { genre: 'tribal hunt', meter: '4/4', key: 'D phrygian', lead: 'hunting horn and darbuka', tempo: 140 }),
    g2antelope: MK({ arr: 'g2antelope', bpm: 172, key: 'D', oct: 3, scale: 'phryg', prog: PROGS.antelope, mel: seq('0-0-1-0-4---3-1-', PROGS.antelope, 16, { start: 4, lo: 0, hi: 9 }), heavy: true, reverb: 'cave' }, { genre: 'war drums', meter: '4/4', key: 'D phrygian', lead: 'taiko ensemble', tempo: 172, boss: 'antelope', sections: 1 }),
    g2lilith: MK({ arr: 'g2lilith', bpm: 156, key: 'E', oct: 3, scale: 'phryg', prog: PROGS.lilith, mel: seq(MOTIF.lilith[0], PROGS.lilith, 16, { start: 4, lo: 0, hi: 9 }), heavy: true, reverb: 'cave' }, { genre: 'tribal metal', meter: '4/4', key: 'E phrygian', lead: 'distorted guitar', tempo: 156, boss: 'lilith', sections: 3 }),
    g2meridian: MK({ arr: 'g2meridian', bpm: 100, key: 'C', oct: 3, scale: 'harm', prog: PROGS.meridian, mel: seq('0---2-3-4---3-2-', PROGS.meridian, 16, { start: 4, lo: 0, hi: 9 }), keep: { pad: .7, mel: .9, bass: .8, metal: .7 }, reverb: 'cathedral' }, { genre: 'industrial organ', meter: '4/4', key: 'C minor', lead: 'church organ', tempo: 100 }),
    g2preacher: MK({ arr: 'g2preacher', bpm: 132, key: 'C', oct: 3, scale: 'harm', prog: PROGS.preacher, mel: seq('0-0-4---3-2-0---', PROGS.preacher, 16, { start: 4, lo: 0, hi: 9 }), heavy: true, reverb: 'cathedral' }, { genre: 'industrial liturgy', meter: '4/4', key: 'C minor', lead: 'distorted synth and choir', tempo: 132, boss: 'preacher', sections: 1 }),
    g2archon: MK({ arr: 'g2archon', bpm: 148, key: 'G', oct: 3, scale: 'harm', prog: PROGS.archon, mel: seq(MOTIF.archon[0], PROGS.archon, 16, { start: 4, lo: 0, hi: 9 }), heavy: true, reverb: 'hall' }, { genre: 'film action', meter: '4/4', key: 'G minor', lead: 'brass and solo violin', tempo: 148, boss: 'archon', sections: 4 }),
    g2architect: MK({ arr: 'g2architect', bpm: 96, key: 'C', oct: 3, scale: 'chrom', prog: PROGS.architect, heavy: true, reverb: 'void' }, { genre: 'avant-garde', meter: 'mixed 5, 7, 3, 4', key: 'atonal', lead: 'prepared piano and glass', tempo: 96, boss: 'architect', sections: 4 }),
    g2throne: MK({ arr: 'g2throne', bpm: 60, key: 'A', oct: 3, scale: 'major', prog: PROGS.throne, keep: { pad: .8, mel: 1, arp: .7, bass: .7, str: .7 }, drop: QUIET, reverb: 'cathedral' }, { genre: 'chamber elegy', meter: '4/4', key: 'A major', lead: 'piano and strings', tempo: 60, quote: 'Part I theme' }),
    g2zshadow: MK({ arr: 'g2zshadow', bpm: 132, key: 'A', oct: 3, scale: 'minor', prog: PROGS.zshadow, heavy: true, reverb: 'void' }, { genre: 'dark orchestral', meter: '4/4', key: 'A minor', lead: 'low strings and brass', tempo: 132, boss: 'zshadow', sections: 1, quote: 'Part I theme' }),
    g2vesper: MK({ arr: 'g2vesper', steps: 20, bpm: 46, key: 'B', oct: 2, scale: 'minor', prog: PROGS.vesper, lead: 1, mel: seq(Compose.remeter(MOTIF.vesper[0], 20), PROGS.vesper, 20, { start: 4, lo: 0, hi: 9 }), keep: { pad: .8, mel: .9, str: .6 }, drop: QUIET, reverb: 'void' }, { genre: 'dirge', meter: '5/4', key: 'B minor', lead: 'cello', tempo: 46 }),
    g2act1: MK({ arr: 'g2act1', steps: 28, bpm: 152, key: 'D', oct: 3, scale: 'harm', prog: PROGS.act1, heavy: true, reverb: 'void' }, { genre: 'symphonic battle', meter: '7/4', key: 'D minor', lead: 'brass and four-part choir', tempo: 152, boss: 'vesper', sections: 3 }),
    g2act2: MK({ arr: 'g2act2', bpm: 66, key: 'A#', oct: 2, scale: 'major', prog: PROGS.act2, mel: seq(MOTIF.vesper[0], PROGS.act2, 16, { start: 7, lo: 4, hi: 11 }), keep: { mel: 1, bass: .8, arp: .7, metal: .6, choir: .9, ost: .6, taiko: .6 }, reverb: 'room' }, { genre: 'old film elegy', meter: '4/4', key: 'Bb major', lead: 'piano and cello', tempo: 66, sections: 2 }),
    g2act3: MK({ arr: 'g2act3', bpm: 138, key: 'D', oct: 3, scale: 'harm', prog: PROGS.act3, keyFn: (bar, T) => ['D', 'D', 'E', 'D', 'D'][phaseOf('architect2')] || 'D', heavy: true, reverb: 'void' }, { genre: 'epic choral', meter: '4/4 (changes per law)', key: 'D minor, E minor', lead: 'full orchestra and Latin choir', tempo: 138, boss: 'architect2', sections: 5 }),
    g2act4: MK({ arr: 'g2act4', bpm: 40, key: 'D', oct: 3, scale: 'major', prog: [0], keep: { pad: 1, kick: .7, str: .6 }, reverb: 'void' }, { genre: 'drone', meter: 'free', key: 'D (one note)', lead: 'held strings', tempo: 40, quiet: true }),
    g2end5b: MK({ arr: 'g2end5b', bpm: 52, key: 'C', oct: 3, scale: 'minor', prog: PROGS.end5b, keep: { pad: .8, mel: 1, taiko: .6, snare: .4 }, reverb: 'cathedral' }, { genre: 'funeral march', meter: '4/4', key: 'C minor', lead: 'brass', tempo: 52, quote: 'Part I theme' }),
    g2end5c: MK({ arr: 'g2end5c', steps: 12, bpm: 84, key: 'D', oct: 3, scale: 'major', progFn: bar => { const b = bar % 24; return b >= 8 && b < 16 ? THEME_PROG[b % 4] : LULLABY_PROG[b % 8]; }, prog: [0], keep: { pad: .9, mel: 1, brass: .7, choir: .8, arp: .7, bass: .8, taiko: .6, metal: .5 }, reverb: 'hall' }, { genre: 'grand finale', meter: '3/4', key: 'D major', lead: 'orchestra and choir', tempo: 84, quote: 'Part I theme' }),
    g2credits: MK({ arr: 'g2credits', bpm: 84, key: 'F', oct: 3, scale: 'major', progFn: bar => [THEME_PROG[bar % 4], LULLABY_PROG[bar % 8], [0, 2, 5, 4][bar % 4], THEME_PROG[bar % 4]][(bar >> 3) % 4], prog: [0], keep: { pad: .8, mel: 1, arp: .7, bass: .7, taiko: .4 }, drop: ['kick', 'snare', 'hat'], reverb: 'hall' }, { genre: 'medley', meter: '4/4', key: 'F major', lead: 'piano and orchestra', tempo: 84, quote: 'Part I theme' })
});
// Zero's Lullaby, one version per chapter and for the finale. All are variations of one leitmotif.
const LUL = (id, ver, o, meta) => { TRACKS[id] = MK(Object.assign({ arr: 'g2lul', ver, steps: 12, key: 'D', oct: 3, scale: 'major', prog: LULLABY_PROG, mel: LUL12, reverb: 'hall', drop: QUIET }, o), Object.assign({ family: 'lullaby', meter: '3/4', key: 'D major' }, meta)); };
LUL('g2lul1', 1, { bpm: 60, oct: 2, keep: { pad: .6, mel: 1 }, reverb: 'cathedral' }, { genre: 'lullaby, hummed', lead: 'Zero humming', tempo: 60 });
LUL('g2lul2', 2, { bpm: 66, keep: { mel: 1, arp: .7, bass: .6, choir: .9 } }, { genre: 'lullaby, music box', lead: 'music box and Nyx', tempo: 66 });
LUL('g2lul3', 3, { bpm: 72, keep: { mel: 1, arp: .8, pad: .6 }, reverb: 'forest' }, { genre: 'lullaby, warm', lead: 'wooden flute', tempo: 72 });
LUL('g2lul4', 4, { bpm: 52, scale: 'minor', keep: { mel: 1, arp: .7, pad: .6, kick: .5 }, reverb: 'void' }, { genre: 'lullaby, anxious', lead: 'celesta', tempo: 52, key: 'D minor' });
LUL('g2lul5', 5, { bpm: 50, keep: { mel: 1, pad: .8 }, reverb: 'cave' }, { genre: 'silence', lead: 'wind and one piano note', tempo: 50, quiet: true });
LUL('g2lul6', 6, { bpm: 132, drop: [], heavy: true, keep: { mel: 1, str: .8, ost: .8, brass: .7, taiko: .8, bass: .8, pad: .8 } }, { genre: 'lullaby, heroic', lead: 'full strings', tempo: 132 });
LUL('g2lul7', 7, { bpm: 66, keep: { mel: 1, arp: .8, str: .8, choir: .8, pad: .7, bass: .6 } }, { genre: 'lullaby, all versions', lead: 'music box, flute, cello, voice', tempo: 66 });
LUL('g2act0', 'a0', { bpm: 58, progFn: bar => (bar % 16 >= 8 ? THEME_PROG[bar % 4] : LULLABY_PROG[bar % 8]), prog: [0], keep: { mel: 1, str: .8, arp: .6, pad: .7 }, reverb: 'cathedral' }, { genre: 'music box hymn', lead: 'music box then organ', tempo: 58, quote: 'Part I theme' });
LUL('g2end5a', '5a', { bpm: 58, keep: { mel: 1, pad: .8 }, reverb: 'hall' }, { genre: 'lullaby, one voice', lead: 'a woman’s voice', tempo: 58 });
LUL('g2end5cfight', '5c', { bpm: 60, keep: { mel: 1, bass: .7 }, reverb: 'room' }, { genre: 'lullaby, out of tune', lead: 'piano', tempo: 60 });
LUL('g2end5d', '5d', { bpm: 48, oct: 2, keep: { mel: 1, pad: .7, metal: .8 }, reverb: 'cathedral' }, { genre: 'lullaby, backwards', lead: 'reversed piano and bell', tempo: 48 });
// Day One's lullaby replaces the old hummed track; the dirge keeps its id for the old scenes.
TRACKS.g2hum = TRACKS.g2lul1; TRACKS.g2ash = TRACKS.g2vesper;
if (typeof B_KNIGHT !== 'undefined') B_KNIGHT.music = 'g2knight';
if (typeof B_SERA !== 'undefined') B_SERA.music = 'g2sera';
