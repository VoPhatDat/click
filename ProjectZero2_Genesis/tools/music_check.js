'use strict';
/* Lists every Part II track with genre, meter, key, lead and tempo. Fails if two tracks share more
   than two of those five, if a Part II track reuses a Part I arranger or chord progression, or if two
   bosses share music. Loudness is measured separately in the browser by tools/music_level.js. */
const { load } = require('./harness');
const X = load(); const { TRACKS, BOSSES } = X.__extra || {};
const T = X.TRACKS || TRACKS;
let fails = 0; const bad = m => { fails++; console.log('FAIL ', m); };
const P1 = ['cathedral', 'menu', 'city', 'forest', 'desert', 'ice', 'volcano', 'boss', 'finalboss', 'wrath', 'ending', 'train'];
const g2 = Object.keys(T).filter(k => k.startsWith('g2'));
console.log('Part II tracks:', g2.length);
for (const k of g2) { const m = T[k].meta; if (!m) { bad(k + ' has no meta'); continue; } console.log(`  ${k.padEnd(10)} ${m.genre.padEnd(22)} ${m.meter.padEnd(4)} ${m.key.padEnd(13)} ${String(m.tempo).padEnd(4)} ${m.lead}${m.sections ? '  [' + m.sections + ' sections]' : ''}`); }
const F = ['genre', 'meter', 'key', 'lead', 'tempo'];
for (let i = 0; i < g2.length; i++) for (let j = i + 1; j < g2.length; j++) {
    const a = T[g2[i]].meta, b = T[g2[j]].meta; if (!a || !b) continue;
    const same = F.filter(f => f === 'tempo' ? Math.abs(a.tempo - b.tempo) < 8 : a[f] === b[f]);
    if (same.length > 2) bad(`${g2[i]} and ${g2[j]} share ${same.join(', ')}`);
}
for (const k of g2) {
    if (P1.includes(T[k].arr)) bad(k + ' reuses the Part I arranger ' + T[k].arr);
    for (const p of P1) if (T[p] && JSON.stringify(T[p].prog) === JSON.stringify(T[k].prog)) bad(k + ' reuses the chord progression of Part I ' + p);
}
const bm = {}; for (const b of Object.values(X.BOSSES)) { if (!b.music || !b.music.startsWith('g2')) continue; if (bm[b.music]) bad(`${b.id} and ${bm[b.music]} share ${b.music}`); bm[b.music] = b.id; }
console.log(fails ? `\n${fails} FAILED` : '\nMUSIC CHECK PASSED'); process.exit(fails ? 1 : 0);
