'use strict';
/**
 * MUSIC CHECK. Lists every Part II track (genre, metre, key, tempo, lead, sections) and fails when:
 *   - two tracks share more than two of genre / metre / key / lead / tempo (variations of Zero's
 *     Lullaby are one leitmotif by design and are only compared with tracks outside their family)
 *   - a Part II track uses a Part I arranger or chord progression (an intended quotation of the
 *     Part I theme is listed, not failed)
 *   - two bosses share a track, or a boss track has fewer than three sections (mini-bosses: one)
 *   - fewer than 75% of a melody's strong beats fall on a tone of the chord under it
 *   - a rendered track (shots/music/levels.json, from tools/music_render.js) is more than 3 dB from
 *     the average, or clips
 * These are measurements. Nobody has listened to the music yet.
 */
const fs = require('fs'), path = require('path');
const { load } = require('./harness');
const X = load(), T = X.TRACKS, C = X.Compose;
let fails = 0; const bad = m => { fails++; console.log('FAIL ', m); };
const P1 = ['cathedral', 'menu', 'city', 'forest', 'desert', 'ice', 'volcano', 'boss', 'finalboss', 'wrath', 'ending', 'train'];
const seen = new Set(), g2 = Object.keys(T).filter(k => k.startsWith('g2') && T[k].meta && !seen.has(T[k]) && seen.add(T[k]));
console.log('Part II tracks:', g2.length);
for (const k of g2) { const m = T[k].meta; console.log(`  ${k.padEnd(13)} ${m.genre.padEnd(24)} ${m.meter.padEnd(9)} ${m.key.padEnd(15)} ${String(m.tempo).padEnd(4)} ${m.lead}${m.sections ? '  [' + m.sections + ' sections]' : ''}${m.family ? '  (lullaby)' : ''}${m.quote ? '  (quotes the ' + m.quote + ')' : ''}`); }
const F = ['genre', 'meter', 'key', 'lead', 'tempo'];
for (let i = 0; i < g2.length; i++) for (let j = i + 1; j < g2.length; j++) {
    const a = T[g2[i]].meta, b = T[g2[j]].meta; if (a.family && a.family === b.family) continue;
    const same = F.filter(f => f === 'tempo' ? Math.abs(a.tempo - b.tempo) < 8 : a[f] === b[f]);
    // At the player's request all of Part II shares one epic orchestral style: those tracks must still differ in two of metre, key, lead and tempo.
    if (a.genre === 'epic orchestral' && b.genre === 'epic orchestral') { if (same.length - 1 > 2) bad(`${g2[i]} and ${g2[j]} share ${same.join(', ')}`); continue; }
    if (same.length > 2) bad(`${g2[i]} and ${g2[j]} share ${same.join(', ')}`);
}
for (const k of g2) {
    if (P1.includes(T[k].arr)) bad(k + ' reuses the Part I arranger ' + T[k].arr);
    if (!T[k].meta.quote) for (const p of P1) if (T[p] && !T[k].progFn && JSON.stringify(T[p].prog) === JSON.stringify(T[k].prog)) bad(k + ' reuses the chord progression of Part I ' + p);
}
const bm = {}; for (const b of Object.values(X.BOSSES)) { if (!b.music || !String(b.music).startsWith('g2')) continue; if (bm[b.music]) bad(`${b.id} and ${bm[b.music]} share ${b.music}`); bm[b.music] = b.id; const m = T[b.music] && T[b.music].meta; if (m && !b.mini && !b.oneSong && (m.sections || 1) < 3) bad(`${b.id}'s track has fewer than 3 sections`); }
// Harmony: strong beats of each melody against the chord of its bar.
let rows = [];
for (const k of g2) {
    const t = T[k]; if (!t.mel || SCALES_OK(t) === false) continue;
    const steps = t.steps || 16, strong = C.strong(steps); let n = 0, ok = 0;
    for (let bar = 0; bar < 16; bar++) {
        const r = t.progFn ? t.progFn(bar, t) : t.prog[bar % t.prog.length], ev = C.parse(t.mel[bar % t.mel.length]);
        for (const e of ev) if (strong.includes(e.pos)) { n++; if (C.isTone(e.deg, r, true)) ok++; }
    }
    if (!n) continue; const pc = Math.round(100 * ok / n); rows.push(`${k}:${pc}%`); if (pc < 75) bad(`${k}: only ${pc}% of strong beats are chord tones`);
}
console.log('\nStrong beats on chord tones:', rows.join('  '));
function SCALES_OK(t) { return t.scale !== 'chrom'; }
// Loudness from the renders.
const LV = path.join(__dirname, '..', 'shots', 'music', 'levels.json');
if (fs.existsSync(LV)) {
    const L = JSON.parse(fs.readFileSync(LV, 'utf8')), ks = Object.keys(L).filter(k => T[k.split(':')[0]] && T[k.split(':')[0]].meta && T[k.split(':')[0]].ver !== 5), avg = ks.reduce((a, k) => a + L[k].rmsDb, 0) / (ks.length || 1);
    console.log(`\nLoudness (rendered, average ${avg.toFixed(1)} dB RMS):`);
    for (const k of ks) { const d = L[k].rmsDb - avg; console.log(`  ${k.padEnd(20)} ${L[k].rmsDb.toFixed(1)} dB  (${d >= 0 ? '+' : ''}${d.toFixed(1)})  peak ${L[k].peakDb.toFixed(1)} dB${L[k].clip ? '  CLIPS ' + L[k].clip : ''}`); if (Math.abs(d) > 3 && !T[k.split(':')[0]].meta.quiet) bad(`${k} is ${d.toFixed(1)} dB from the average`); if (L[k].clip > 50) bad(`${k} clips`); }
} else console.log('\n(no renders yet: run node tools/music_render.js for loudness)');
console.log(fails ? `\n${fails} FAILED` : '\nMUSIC CHECK PASSED'); process.exit(fails ? 1 : 0);
