'use strict';
/* Lists every player-facing string not yet in js/lang_vi.js. Run with --all to list them all. */
const fs = require('fs'), path = require('path');
const { load, ROOT } = require('./harness');
const X = load(); const out = new Set(), add = s => { if (typeof s === 'string' && /[A-Za-z]{2}/.test(s)) out.add(s); };
const src = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
for (const l of Object.values(X.LORE)) { add(l.title); add(l.text); }
for (const n of Object.values(X.NPCS)) { add(n.name); n.lines.forEach(l => { add(l[0]); add(l[1]); }); }
for (const c of Object.values(X.CHARS)) {
    [c.role, c.title, c.bio, c.line, c.weakness, c.passive.name, c.passive.desc, c.ult.name].forEach(add);
    for (const s of Object.values(c.skills)) { add(s.name); add(s.desc); }
    for (const u of c.upgrades) { add(u.name); add(u.desc); }
}
for (const r of Object.values(X.RELICS)) { add(r.name); add(r.desc); }
for (const a of Object.values(X.ACHIEVEMENTS)) { add(a.name); add(a.desc); }
for (const r of X.REGIONS) { add(r.name); add(r.desc); }
for (const b of Object.values(X.BOSSES)) add(b.title);
for (const e of Object.values(X.ENEMIES)) add(e.name);
const unq = t => t.replace(/\\'/g, "'");
for (const f of ['story.js', 'levels.js', 'boss.js', 'game.js', 'player.js', 'combat.js', 'chars.js', 'enemy.js']) {
    const s = src(f);
    for (const m of s.matchAll(/\bsay\('([^']*)',\s*'((?:[^'\\]|\\.)*)'/g)) { add(unq(m[1])); add(unq(m[2])); }
    for (const m of s.matchAll(/\bb\.say\([^,]+,[^,]+,\s*'([^']*)',\s*'((?:[^'\\]|\\.)*)'/g)) { add(unq(m[1])); add(unq(m[2])); }
    for (const m of s.matchAll(/(?:toast|VFX\.text|bigText|banner)\((?:[^'`]*?)'((?:[^'\\]|\\.)*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/text: '([^']*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/sub: '([^']*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/\bsub: '([^']*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/c\.title\('([^']*)'(?:, '([^']*)')?/g)) { add(m[1]); add(m[2]); }
    for (const m of s.matchAll(/ultName\(b, '([^']*)'/g)) add(m[1]);
}
for (const m of src('game.js').matchAll(/^\s+\w+: '([A-Z][^']{8,})'[,]?/gm)) add(m[1]);
for (const m of src('ui.js').matchAll(/>([A-Z][A-Za-z ,.:'&-]{2,})</g)) add(m[1].trim());
const all = [...out];
let done = {};
try { const v = fs.readFileSync(path.join(ROOT, 'js/lang_vi.js'), 'utf8').replace(/^[\s\S]*?const VI = /, '').replace(/;\s*$/, ''); done = eval('(' + v + ')'); } catch (e) { console.error('lang file not parsed:', e.message); }
const miss = all.filter(s => !done[s]);
if (process.argv[2] === '--all') console.log(all.join('\n'));
else { console.log(`${all.length - miss.length}/${all.length} translated`); miss.forEach(s => console.log('  ' + s)); }
