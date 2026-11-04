'use strict';
/**
 * G2 ENDING: "Seven Days, and Then Rest", the ending theme. Piano and orchestra, slow (66 BPM, B-flat major).
 *   bars 0-7    piano alone: broken chords in the left hand, the lullaby in the right
 *   bars 8-15   the strings come in under it; a cello answers with Zero's theme
 *   bars 16-23  everything: violins take the Genesis theme, horns, harp, a soft choir, timpani swells
 *   bars 24-31  it falls back to the piano and a held string chord; the last lullaby phrase
 * Plays under the endings and the credits.
 */
const END_PROG = [0, 4, 5, 3, 0, 4, 3, 4, 5, 3, 0, 4, 5, 2, 3, 4, 0, 4, 5, 3, 1, 4, 3, 4, 5, 3, 0, 4, 3, 4, 0, 0];
Object.assign(Arr, {
    g2ending(m) {
        const X = g2x(m), { S, t, pos, bar, sd } = m, b = bar % 32, sec = b >> 3, L = sd * 16;
        // left hand: a broken chord in eighths, one octave lower in the big section
        const ch = X.ch(sec === 2 ? -1 : 0), arp = [0, 1, 2, 1, 0, 2, 1, 2];
        if (pos % 2 === 0) Inst.piano2(S.arp, t, ch[arp[(pos >> 1) % 8]], sd * 3, sec === 2 ? .2 : .26, -.15);
        if (pos === 0) Inst.piano2(S.bass, t, X.rootHz(-1), L * .9, sec === 3 && b === 31 ? .5 : .38, 0);
        // right hand: the lullaby (0, 3) or Zero's theme on piano (1)
        if (sec === 0 || sec === 3) X.line(LUL16, (hz, d, v) => Inst.piano2(S.mel, t, hz, d * 1.4, v * .62, .15), 1);
        if (sec === 1) { X.line(LUL16, (hz, d, v) => Inst.piano2(S.mel, t, hz, d * 1.4, v * .5, .15), 1); X.line(THEME, (hz, d, v) => Inst.cello(S.brass, t, hz, d, v * .75, -.25), 0); }
        // strings: enter in section 1, swell in 2, one held chord in 3
        if (sec >= 1 && pos === 0) X.ch(0).forEach((hz, i) => Inst.strings(S.pad, t, hz, L * (sec === 3 ? 1.6 : 1), (i - 1) * .4, sec === 2 ? .05 : .035));
        if (sec === 2) {
            X.line(THEME_GENESIS, (hz, d, v) => Inst.violin(S.str, t, hz, d, v * .85, .2), 1);
            X.line(THEME, (hz, d, v) => Inst.horn(S.brass, t, hz, d, v * .45, -.2), 0);
            if (pos % 4 === 2) Inst.harp(S.ost, t, X.ch(1)[(pos >> 2) % 3], .3, .3);
            if (pos === 0) { X.ch(1).forEach((hz, i) => Inst.choir(S.choir, t, hz, L * .95, 'a', .26, (i - 1) * .4)); if (b % 4 === 0) Inst.timpani(S.taiko, t, X.rootHz(-1), b === 16 ? .75 : .45); if (b === 16) Inst.cymbal(S.metal, t); }
        }
        if (sec === 3 && b >= 28 && pos === 0) Inst.celesta(S.ost, t, X.ch(2)[b % 3], .35, .2);
    }
});
TRACKS.g2ending = MK({ arr: 'g2ending', steps: 16, bpm: 66, key: 'A#', oct: 3, scale: 'major', prog: END_PROG, keep: { pad: .9, mel: 1, arp: .9, bass: .8, str: .9, brass: .8, choir: .7, ost: .7, taiko: .6, metal: .4 }, drop: ['kick', 'snare', 'hat'], reverb: 'hall' },
    { genre: 'piano and orchestra elegy', meter: '4/4', key: 'B-flat major', lead: 'piano', tempo: 66, sections: 4, quote: 'Part I theme' });
(function () {
    // the endings and the credits use it
    const cut = Music.cut.bind(Music);
    Music.cut = function (id, st) { if (id === 'g2credits' || (id === 'g2end5a' && G.g2ending === '5a')) id = 'g2ending'; return cut(id, st); };
    const pe = G2.playEnding; G2.playEnding = function (id) { G.g2ending = id; return pe(id); };
})();
Object.assign(VI, { 'Seven Days, and Then Rest': 'Bảy Ngày, Rồi Nghỉ Ngơi' });
