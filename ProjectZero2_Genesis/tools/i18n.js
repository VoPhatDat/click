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
for (const f of ['story.js', 'levels.js', 'boss.js', 'game.js', 'player.js', 'combat.js', 'chars.js', 'enemy.js', 'g2_chars.js', 'g2_bosses.js', 'g2_levels.js', 'g2_story.js', 'g2_ui.js', 'g2_enemies.js', 'g2_nyx.js', 'g2_music.js', 'g2_world.js', 'g2_ch2.js', 'g2_ch3.js', 'g2_ch4.js', 'g2_ch5.js', 'g2_ch6.js', 'g2_finale.js']) {
    const s = src(f);
    for (const m of s.matchAll(/\bsay\('([^']*)',\s*'((?:[^'\\]|\\.)*)'/g)) { add(unq(m[1])); add(unq(m[2])); }
    for (const m of s.matchAll(/\bb\.say\([^,]+,[^,]+,\s*'([^']*)',\s*'((?:[^'\\]|\\.)*)'/g)) { add(unq(m[1])); add(unq(m[2])); }
    for (const m of s.matchAll(/(?:toast|VFX\.text|bigText|banner)\((?:[^'`]*?)'((?:[^'\\]|\\.)*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/text: '([^']*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/sub: '([^']*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/\bsub: '([^']*)'/g)) add(unq(m[1]));
    for (const m of s.matchAll(/c\.title\('([^']*)'(?:, '([^']*)')?/g)) { add(m[1]); add(m[2]); }
    for (const m of s.matchAll(/ultName\(b, '([^']*)'/g)) add(m[1]);
    if (f.startsWith('g2_')) for (const m of s.matchAll(/\btr\('((?:[^'\\]|\\.)*)'\)/g)) add(unq(m[1]));
}
for (const m of src('game.js').matchAll(/^\s+\w+: '([A-Z][^']{8,})'[,]?/gm)) add(m[1]);
for (const m of src('ui.js').matchAll(/>([A-Z][A-Za-z ,.:'&-]{2,})</g)) add(m[1].trim());
const all = [...out];
let done = {};
try { const v = fs.readFileSync(path.join(ROOT, 'js/lang_vi.js'), 'utf8').replace(/^[\s\S]*?const VI = /, '').replace(/;\s*$/, ''); done = eval('(' + v + ')'); for (const gf of fs.readdirSync(path.join(ROOT, "js")).filter(f => f.startsWith("g2_"))) { const g2 = fs.readFileSync(path.join(ROOT, "js", gf), "utf8"); for (const m of g2.matchAll(/Object.assign\(VI, (\{[\s\S]*?\})\);\n/g)) { try { Object.assign(done, eval("(" + m[1] + ")")); } catch (e) { console.error(gf, e.message); } } } } catch (e) { console.error('lang file not parsed:', e.message); }
const miss = all.filter(s => !done[s]);
if (process.argv[2] === '--all') console.log(all.join('\n'));
else { console.log(`${all.length - miss.length}/${all.length} translated`); miss.forEach(s => console.log('  ' + s)); }
