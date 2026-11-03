// Automated tests: smoke, e2e campaign, boss bots for every character, soak.
// Usage: node tools/test.js [smoke|e2e|boss|soak|all] [--soakMin=30]
const { load } = require('./harness');
const { makeBot } = require('./bot');
const PZ = load();
const arg = process.argv[2] || 'all';
const soakMin = +((process.argv.find(a => a.startsWith('--soakMin=')) || '=30').split('=')[1]);
let fails = 0; const log = (...a) => console.log(...a);
function ok(c, m) { if (c) log('  ✓ ' + m); else { fails++; log('  ✗ ' + m); } }

function runWorld(w, bot, maxSec, until) {
  const N = Math.round(maxSec * 60);
  for (let f = 0; f < N; f++) {
    if (w.scene) w.scene = null;           // cutscenes are skipped headless
    if (w.choice) PZ.resolveChoice(w, bot.spare !== false);
    if (w.over === 'dead') { w.deaths = (w.deaths || 0) + 1; if (w.boss && w.boss.boss) return { dead: true, f }; PZ.respawnPlayer(w, w.player); }
    w.update([bot(w)]);
    if (until && until(w)) return { ok: true, f };
  }
  return { timeout: true };
}

function smoke() {
  log('SMOKE');
  for (const id of Object.keys(PZ.LEVELS)) {
    let err = null;
    try { const w = PZ.loadLevel(id, PZ.newSave(), { diff: 1 }); for (let i = 0; i < 600; i++) { w.scene = null; w.update([PZ.makeIntent()]); } } catch (e) { err = e; }
    ok(!err, 'level ' + id + ' runs 10s' + (err ? ' — ' + err.stack : ''));
  }
  for (const cid of ['zero', 'rook', 'sable', 'mirae', 'ysolde', 'vesper']) {
    let err = null;
    try {
      const s = PZ.newSave(); s.char = cid; const w = PZ.loadLevel('ch1', s, { diff: 1 });
      for (let i = 0; i < 1200; i++) {
        const I = PZ.makeIntent(); const k = ['attackP', 's1P', 's2P', 's3P', 'ultP', 'dashP', 'jumpP', 'formP', 'weaponP'][i % 9]; I[k] = true; I[k.slice(0, -1)] = true; I.right = i % 200 < 120;
        if (i % 300 === 0) w.player.ult = 100;
        w.scene = null; w.update([I]); if (w.over) PZ.respawnPlayer(w, w.player);
      }
    } catch (e) { err = e; }
    ok(!err, 'all moves of ' + cid + (err ? ' — ' + err.stack : ''));
  }
  ok(Object.keys(PZ.WEAPONS).length >= 19, 'weapons: ' + Object.keys(PZ.WEAPONS).length);
}

function e2e() {
  log('E2E (hub → chapter 1 → knight → Seraphina → choice → hub)');
  for (const spare of [true, false]) {
    const save = PZ.newSave();
    let w = PZ.loadLevel('hub', save, { diff: 1 });
    ok(w.stations.length >= 6, 'hub has stations');
    const bot = makeBot(PZ); bot.spare = spare;
    w = PZ.loadLevel('ch1', save, { diff: 1 });
    let r = runWorld(w, bot, 900, w => w.exit === 'ch1_boss');
    ok(r.ok, `chapter 1 traversed (${r.ok ? (r.f / 60).toFixed(0) + 's' : 'stuck at x=' + w.player.x.toFixed(0)}) knight cleared=${!!save.cleared.knight} deaths=${w.deaths || 0}`);
    ok(save.cleared.knight, 'mini-boss defeated');
    w = PZ.loadLevel('ch1_boss', save, { diff: 1 });
    let tries = 0;
    do { tries++; r = runWorld(w, bot, 600, w => save.cleared.seraphina); if (!r.ok) w = PZ.loadLevel('ch1_boss', save, { diff: 1 }); } while (!r.ok && tries < 4);
    ok(r.ok, `Seraphina defeated (${spare ? 'spared' : 'killed'}) in ${tries} tr${tries > 1 ? 'ies' : 'y'}`);
    ok(spare ? save.spared.seraphina : save.killed.seraphina, 'choice recorded');
    ok(save.weapons.goldthread, 'boss weapon awarded');
    w = PZ.loadLevel('hub', save, { diff: 1 });
    ok(w.player.weapons.includes('goldthread'), 'boss weapon usable in hub');
    ok(Object.keys(save.pages).length >= 0, 'pages collected: ' + Object.keys(save.pages).length + ', shard: ' + !!save.shards.shard_1);
  }
}

function bossBots() {
  log('BOSS BOTS (every character × every boss, difficulty Normal)');
  const res = {};
  for (const cid of ['zero', 'rook', 'sable', 'mirae', 'ysolde', 'vesper']) {
    for (const boss of ['knight', 'seraphina']) {
      let wins = 0, times = [], hpLeft = [];
      const N = 3;
      for (let k = 0; k < N; k++) {
        const save = PZ.newSave(); save.char = cid;
        let w;
        if (boss === 'seraphina') w = PZ.loadLevel('ch1_boss', save, { diff: 1, seed: 7 + k });
        else { w = PZ.loadLevel('ch1_boss', save, { diff: 1, noBoss: true, seed: 7 + k }); w.terrain.pillars = []; PZ.spawnKnight(w, 760); }
        const bot = makeBot(PZ);
        const r = runWorld(w, bot, 420, w => (boss === 'seraphina' ? save.cleared.seraphina : save.cleared.knight));
        if (r.ok) { wins++; times.push(r.f / 60); hpLeft.push(w.player.hp / w.player.maxHp); }
      }
      const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
      res[cid + '/' + boss] = { wins, N, t: avg(times), hp: avg(hpLeft) };
      ok(wins >= 1, `${cid.padEnd(7)} vs ${boss.padEnd(10)} wins ${wins}/${N}  avg ${avg(times).toFixed(0)}s  hp left ${(avg(hpLeft) * 100).toFixed(0)}%`);
    }
  }
  return res;
}

function soak() {
  log(`SOAK (${soakMin} simulated minutes, random + bot input, all levels)`);
  const ids = Object.keys(PZ.LEVELS); let frames = 0, err = null; const t0 = Date.now();
  try {
    const save = PZ.newSave(); let li = 0; let w = PZ.loadLevel(ids[0], save, { diff: 1 }); const bot = makeBot(PZ);
    const total = soakMin * 60 * 60;
    for (let f = 0; f < total; f++) {
      if (f % (60 * 90) === 0 && f) { li = (li + 1) % ids.length; save.char = ['zero', 'rook', 'sable', 'mirae', 'ysolde'][li % 5]; w = PZ.loadLevel(ids[li], save, { diff: 1 }); }
      if (w.scene) w.scene = null; if (w.choice) PZ.resolveChoice(w, Math.random() < .5);
      if (w.over) PZ.respawnPlayer(w, w.player);
      let I = bot(w); if (Math.random() < .3) { I = PZ.makeIntent(); for (const a of PZ.ACTIONS) if (a !== 'pause' && Math.random() < .08) { I[a] = true; I[a + 'P'] = true; } }
      w.update([I]); frames++;
      if (w.ents.length > 400 || w.projs.length > 2000) throw new Error('entity leak: ents=' + w.ents.length + ' projs=' + w.projs.length);
      for (const e of w.ents) if (!isFinite(e.x) || !isFinite(e.y)) throw new Error('NaN position on ' + e.type);
      if (!isFinite(w.player.hp)) throw new Error('NaN hp');
    }
  } catch (e) { err = e; }
  ok(!err, `soak ${frames} frames (${(frames / 3600).toFixed(1)} min) in ${((Date.now() - t0) / 1000).toFixed(1)}s` + (err ? ' — ' + err.stack : ''));
}

if (arg === 'smoke' || arg === 'all') smoke();
if (arg === 'e2e' || arg === 'all') e2e();
if (arg === 'boss' || arg === 'all') bossBots();
if (arg === 'soak' || arg === 'all') soak();
log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
