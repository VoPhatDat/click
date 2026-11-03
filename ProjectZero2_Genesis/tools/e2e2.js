'use strict';
/* Part II campaign end to end (M1): opening, Garden, Day One, the Shadowless Knight, Seraphina with both
   choices, the aftermath, save/load. Then a bot fights both bosses with every operator for real
   (no invulnerability), dodging telegraphs: pillar shadows, sweeps, bells. */
const { load } = require('./harness');
const X = load(), { G, Game, Save, UI, Input, Cine, Store, CHAR_ORDER, Shadow, U, G2, BOSSES, G2Night } = X;
const log = (...a) => console.log(...a); let fails = 0; const must = (c, m) => { if (c) log('ok   ', m); else { fails++; log('FAIL ', m); } };
let screen = null; UI.show = (n, a) => { screen = { n, a }; UI.cur = n; }; UI.hide = () => { screen = null; UI.cur = null; };
Game.deploy = (id, cp) => { if (id === 'dawn' && Save.data && !Save.data.g2.seen.dawn) { Save.data.g2.seen.dawn = 1; } Game.loadLevel(id, cp); };
function finishCutNoop() { }
const finishCut = () => { let n = 0; while (Cine.active && n++ < 40000) Cine.update(); if (Game.state === 'cine') Game.state = 'play'; };

/* ------------------------------ bot ------------------------------ */
function botStep(t) {
    const P = G.player, b = G.boss, S = Input.simulated = {}, A = G.arena; let dodge = false;
    const go = d => { S.right = d > 0; S.left = d < 0; };
    for (const w of G.warns) {
        if (!w.dmg) continue;
        if (w.shape === 'light') {
            let best = null, bd = 1e9; for (const p of A.pillars) { const [a, c] = Shadow.span(w.lx, w.ly, p, A.y); const x = U.clamp(P.x, a + 16, c - 16); if (Math.abs(x - P.x) < bd && c - a > 40) { bd = Math.abs(x - P.x); best = x; } }
            if (best !== null && !Shadow.covered(w.lx, w.ly, P.x, P.y - 34)) { go(best - P.x); if (bd > 200 && P.dodgeCd <= 0) S['!dodge'] = true; } dodge = true;
        } else if (w.shape === 'rect' && U.overlap(P.hurtBox, { x: w.x - 20, y: w.y, w: w.w + 40, h: w.h })) {
            if (w.h <= 160 && w.w > 300) { if (w.t < 16 && P.grounded) { S['!jump'] = S.jump = true; } else if (w.t >= 16) S.jump = true; }
            else go(P.x < w.x + w.w / 2 ? -1 : 1);
            dodge = true;
        } else if (w.shape === 'circle' && Math.hypot(P.x - w.x, P.y - 30 - w.y) < w.r + 30) { go(P.x < w.x ? -1 : 1); if (w.t < 14 && P.dodgeCd <= 0) S['!dodge'] = true; dodge = true; }
    }
    if (!dodge && b && b.def.id === 'seraphina' && !(b.shade > 0) && !b.intro) { const tw = G.level.objs.filter(o => o.g2 === 'tower' && !(o.cd > G.time)).sort((x, y) => Math.abs(x.x - P.x) - Math.abs(y.x - P.x))[0]; if (tw && Math.abs(tw.x - P.x) < 500) { if (Math.abs(tw.x - P.x) > 30) go(tw.x - P.x); else { G.nearObj = tw; S['!interact'] = true; } dodge = true; } }
    if (!dodge && b && !b.untargetable && !b.hide) {
        const aim = b.aim(), dx = aim.x - P.x, ranged = P.def.ranged, want = ranged ? 260 : 60;
        if (Math.abs(dx) > want) go(dx); else if (ranged && Math.abs(dx) < 120) go(-dx); else P.facing = U.sign(dx);
        if (!ranged && aim.y < P.y - 150 && P.grounded && t % 40 === 0) S['!jump'] = S.jump = true;
        if (t % 4 === 0) { S['!attack'] = true; S.attack = true; } else S.attack = ranged;
        if (t % 97 === 0) S['!skill1'] = true; if (t % 131 === 0) S['!skill2'] = true; if (t % 173 === 0 && P.id !== 'ysolde') S['!skill3'] = true;
        if (P.ult >= 100) S['!ult'] = true;
        if (P.form && P.balance < 20 && t % 30 === 0) S['!form'] = true; if (P.form === 'wrath' && P.balance > 78) S['!form'] = true;
    }
}
function fightReal(maxT = 60 * 420) {
    const A = G.arena, P = G.player; P.x = A.trigger + 60; P.y = A.y; P.vy = 0; P.grounded = true; G.enemies = G.enemies.filter(e => !e.def || e.def.ai !== 'flyer');
    G.startBoss(); let t = 0; while (G.boss && G.boss.intro && t++ < 2000) { G.tick(); Input.endTick(); }
    t = 0; let def = G.boss && G.boss.def;
    while (t++ < maxT && Game.state === 'play') {
        if (G.flags.g2choice === null) G.flags.g2choice = fightReal.choice || 'spare';
        if (P.state === 'dead') return { dead: true, t, hp: G.boss ? G.boss.hp / G.boss.maxHp : 0 };
        botStep(t); G.tick(); Input.endTick();
        if (!G.boss || G.boss.dead && G.boss.gone) { if (def.mini && !G.boss) break; }
        if (Save.data.cleared[def.id]) break;
    }
    Input.simulated = null; return { win: !!Save.data.cleared[def.id], t, hp: P.hp / P.maxHp };
}

/* Nyx's bot: she runs, climbs, hides in her own night, raises towers, and lets Zero fight. */
function nyxStep(t) {
    const P = G.player, S = Input.simulated = {}, A = G.arena, b = G.boss, L = G.level; const go = d => { S.right = d > 0; S.left = d < 0; };
    let busy = false;
    for (const w of G.warns) {
        if (!w.dmg) continue;
        if (w.shape === 'light') { busy = true; if (!Shadow.covered(w.lx, w.ly, P.x, P.y - 34)) { if (P.cds.s1 <= 0 && P.energy >= 25) S['!skill1'] = true; else { let best = null, bd = 1e9; for (const p of A.pillars) { const [a, c] = Shadow.span(w.lx, w.ly, p, A.y); const x = U.clamp(P.x, a + 16, c - 16); if (Math.abs(x - P.x) < bd && c - a > 40) { bd = Math.abs(x - P.x); best = x; } } if (best !== null) go(best - P.x); } } }
        else if (w.shape === 'rect' && U.overlap(P.hurtBox, { x: w.x - 20, y: w.y, w: w.w + 40, h: w.h })) { busy = true; if (w.h <= 160 && w.w > 300) { if (w.t < 16 && P.grounded) S['!jump'] = S.jump = true; else if (w.t >= 16) S.jump = true; } else go(P.x < w.x + w.w / 2 ? -1 : 1); }
        else if (w.shape === 'circle' && Math.hypot(P.x - w.x, P.y - 30 - w.y) < w.r + 30) { busy = true; go(P.x < w.x ? -1 : 1); if (w.t < 12 && P.dodgeCd <= 0) S['!dodge'] = true; }
        if (busy && w.t < 10 && P.dodgeCd <= 0 && w.shape === 'rect' && w.h > 160) S['!dodge'] = true;
    }
    if (busy) return;
    if (b && b.def.id === 'seraphina' && !b.intro) {
        const tw = L.objs.filter(o => o.g2 === 'tower' && !(o.cd > G.time)).sort((x, y) => Math.abs(x.x - P.x) - Math.abs(y.x - P.x))[0];
        if (tw && !(b.shade > 0)) { if (Math.abs(tw.x - P.x) > 30) go(tw.x - P.x); else { G.nearObj = tw; S['!interact'] = true; } }
        return;
    }
    if (b && b.def.id === 'knight') { const d = b.x - P.x; if (P.cds.s1 <= 0 && Math.abs(d) < 260) S['!skill1'] = true; if (G2Night.nyxHidden()) return; if (Math.abs(d) < 160) { go(-d); if (P.x < A.x0 + 80 || P.x > A.x1 - 80) { S['!dodge'] = true; go(d); } } else if (Math.abs(d) > 320) go(d); return; }
    const near = G.enemies.some(e => !e.dead && !e.boss && e.type !== 'dummy' && Math.abs(e.x - P.x) < 140 && Math.abs(e.y - P.y) < 120);
    if (near) { if (P.cds.s1 <= 0) S['!skill1'] = true; else if (P.cds.s3 <= 0) S['!skill3'] = true; return; }
    const z = G.ally; if (z && Math.abs(z.x - P.x) > 300 && G.enemies.some(e => !e.dead && Math.abs(e.x - P.x) < 400)) return;
    go(1);
    const ah = L.surfaceBelow(P.x + 40, P.y - 10, 120);
    if (P.grounded && (P.onWall || ah === null || ah < P.y - 12)) { S['!jump'] = true; S.jump = true; nyxStep.hold = 18; }
    if (nyxStep.hold > 0) { nyxStep.hold--; S.jump = true; }
    if (!P.grounded && P.vy > 1 && P.jumps < 2 && L.surfaceBelow(P.x + 20, P.y, 300) === null) { S['!jump'] = true; S.jump = true; }
    if (Math.abs(P.x - (nyxStep.lx || 0)) < .5) nyxStep.stuck = (nyxStep.stuck || 0) + 1; else nyxStep.stuck = 0; nyxStep.lx = P.x;
    if (nyxStep.stuck > 50) { S['!jump'] = true; S.jump = true; nyxStep.hold = 22; if (nyxStep.stuck > 120) { go(-1); if (nyxStep.stuck > 150) nyxStep.stuck = 0; } }
}
function runNyx(until, maxT = 60 * 900) {
    let t = 0; const P = () => G.player; runNyx.log = [];
    if (!G.player._hk) { const h = G.player.hurt.bind(G.player); G.player.hurt = (d, src) => { const r = h(d, src); if (r) { runNyx.log.push([t, Math.round(G.player.x), src && src.owner ? (src.owner.type || (src.owner.def && src.owner.def.id)) : src && src.tick ? 'hazard' : 'warn']); if (runNyx.log.length > 8) runNyx.log.shift(); } return r; }; G.player._hk = 1; }
    while (t++ < maxT) {
        if (Cine.active) { finishCut(); continue; }
        if (G.flags.g2choice === null) G.flags.g2choice = runNyx.choice || 'spare';
        if (P().state === 'dead') { console.log('      last hits:', JSON.stringify(runNyx.log)); return { dead: true, t, x: P().x }; }
        if (G.dialog) { G.dialog = null; G.lockInput = false; }
        if (Game.state !== 'play') { if (until()) return { ok: true, t }; Game.state = 'play'; }
        nyxStep(t); G.tick(); Input.endTick();
        if (until()) return { ok: true, t };
    }
    return { timeout: true, t, x: P().x };
}

/* --------------------------- campaign --------------------------- */
Store.write(Store.KEY, '');
Game.newGame('normal'); finishCut();
must(G.level && G.level.id === 'dawn' && G.player.id === 'nyx', 'opening leads into Day One with Nyx as the player');
must(G.ally && G.ally.id === 'zero' && G.ally.isAlly, 'Zero walks with Nyx, driven by AI');
G2.commandZero(); must(G.ally.aiMode === 'attack', 'Nyx can command Zero (Attack)'); G2.commandZero(); G2.commandZero(); must(G.ally.aiMode === 'follow', 'commands cycle back to Follow');
must(G.level.objs.filter(o => o.kind === 'lore').length === 4, 'four scripture pages on Day One');
let r = runNyx(() => !!Save.data.cleared.knight);
must(r.ok, `Nyx reaches the Dawn Gate and Zero defeats the Shadowless Knight (${(r.t / 60) | 0}s${r.x ? ', stuck at x=' + (r.x | 0) : ''}${r.dead ? ', Nyx fell' : ''})`);
must(Save.data.g2.named, 'Zero names her Nyx on the way');
const ex = G.level.objs.find(o => o.kind === 'exit' && !o.g2); must(ex && !ex.hidden, 'the way to the Cathedral opens');
G.nearObj = ex; G.interact(); must(G.level.id === 'cathedral', 'Dawn Gate leads to the Cathedral');
for (const choice of ['spare', 'kill']) {
    Save.data.cleared.seraphina = false; Save.data.g2.spared = {}; Save.data.g2.killed = {}; Game.loadLevel('cathedral'); runNyx.choice = choice;
    const A = G.arena; G.player.x = A.trigger + 40; G.player.y = A.y; G.startBoss(); finishCutNoop();
    r = runNyx(() => !!Save.data.cleared.seraphina, 60 * 600);
    must(r.ok, `Seraphina falls to Nyx's towers and Zero's blade (${choice}) in ${(r.t / 60) | 0}s${r.dead ? ' (Nyx fell)' : ''}${r.timeout ? ' (timeout, boss hp ' + ((G.boss ? G.boss.hp / G.boss.maxHp : 0) * 100 | 0) + '%)' : ''}`);
    must(choice === 'spare' ? Save.data.g2.spared.seraphina : Save.data.g2.killed.seraphina, 'choice recorded: ' + choice);
    Game.state = 'menu'; Game.afterResults(BOSSES.seraphina); finishCut(); must(G.level.id === 'garden', 'aftermath returns to the Garden');
    finishCut();
}
must(Save.data.g2.intro && Save.data.g2.seen.after1, 'the Garden scene and Vesper\u2019s message play');
for (const st of ['tree', 'forge', 'archive', 'portal']) { G2.station(st); must(screen && screen.n === ({ tree: 'skills', forge: 'g2forge', archive: 'archive', portal: 'hub' })[st], 'station ' + st + ' opens its screen'); UI.act('g2close'); }
{ // Zero still has the Part I arm cannon; the AI ally always carries the blade.
    const ul = Save.data.unlocked.slice(); Save.data.unlocked.push('zero'); Save.data.activeChar = 'zero'; Game.loadLevel('garden'); const P = G.player, i = P.def.weapons.findIndex(w => w.id === 'cannon');
    must(i >= 0, 'Zero keeps the Line 3 arm cannon'); P.wIdx = i; P.applyWeapon(); const n0 = X.Proj ? G.projs.length : 0; P.shotCd = 0; P.fireBasic();
    must(P.def.ranged && G.projs.length > n0, 'the cannon fires bolts'); P.wIdx = 0; P.applyWeapon(); Save.data.g2.wIdx.zero = i;
    Save.data.activeChar = 'nyx'; Game.loadLevel('dawn'); must(G.ally && G.ally.weapon.id === 'aocalyst', 'Zero the ally fights with the blade'); Save.data.g2.wIdx.zero = 0; Save.data.unlocked = ul; }
const before = JSON.stringify(Save.data); Save.write(); Save.data = null; must(Save.load() && JSON.stringify(Save.data) === before, 'save and load round trip is lossless');

/* --------------- every operator against both bosses --------------- */
for (const ch of CHAR_ORDER.filter(c => c !== 'nyx')) for (const boss of ['knight', 'seraphina']) {
    let wins = 0, best = null, why = '';
    for (let k = 0; k < 2; k++) {
        Save.data = Save.fresh('normal'); Save.data.g2.intro = true; Save.data.unlocked = CHAR_ORDER.slice(); Save.data.activeChar = ch; Game.diff = X.Game.diff;
        Game.loadLevel(boss === 'knight' ? 'dawn' : 'cathedral'); fightReal.choice = 'spare';
        const q = fightReal(); if (q.win) { wins++; if (!best || q.t < best.t) best = q; } else why = q.dead ? `died, boss at ${(q.hp * 100) | 0}%` : 'timeout';
    }
    must(wins >= 1, `${ch.padEnd(7)} vs ${boss.padEnd(10)} ${wins}/2 wins${best ? `, ${(best.t / 60) | 0}s, hp left ${(best.hp * 100) | 0}%` : ''}${why ? ' (loss: ' + why + ')' : ''}`);
}
log(fails ? fails + ' FAILED' : '\nPART II M1 CAMPAIGN COMPLETED'); process.exit(fails ? 1 : 0);
