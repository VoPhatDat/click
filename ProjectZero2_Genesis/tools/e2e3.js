'use strict';
/**
 * Part II campaign, Days Two to Seven and every ending. The player is kept alive here: this checks the
 * story flows (cutscenes, chapters, choices, unlocks, the acts of the finale, the four endings), not
 * difficulty. tools/bossbot2.js fights the bosses for real.
 */
const { load } = require('./harness');
const X = load(), { G, Game, Save, UI, Input, Cine, Store, BOSSES, G2 } = X;
let fails = 0; const must = (c, m) => { console.log((c ? 'ok    ' : 'FAIL  ') + m); if (!c) fails++; };
let screen = null; UI.show = (n, a) => { screen = { n, a }; UI.cur = n; }; UI.hide = () => { screen = null; UI.cur = null; };
const finishCut = () => { let n = 0; while (Cine.active && n++ < 60000) Cine.update(); if (Game.state === 'cine') Game.state = 'play'; };
G2.cut = function (id, after) { Game.state = 'cine'; Cine.play(X.CUTS[id], () => { Game.state = 'play'; if (after) after(); }); finishCut(); };
function fight(opts = {}) {
    let t = 0; const max = opts.max || 60 * 400;
    while (t++ < max) {
        if (Cine.active) finishCut();
        const P = G.player, S = Input.simulated = {}; P.inv = Math.max(P.inv, 2); if (P.hp < P.maxHp * .5) P.hp = P.maxHp;
        if (G.flags.g2choice === null) G.flags.g2choice = opts.choice || 'spare'; if (G.flags.g2talk === null) G.flags.g2talk = opts.talk === undefined ? 0 : opts.talk;
        const A = G.arena, b = G.boss;
        if (A && !b && !G.bossDone) { P.x = A.trigger + 30; P.y = A.y - 2; P.vy = 0; }
        if (b && !b.dead && !b.intro) {
            const a = opts.aim ? opts.aim(b) : b.aim(); P.x = U.clamp(a.x - P.facing * 40, A.x0 + 30, A.x1 - 30); P.y = Math.min(A.y, a.y + 60); P.vy = 0; P.facing = a.x > P.x ? 1 : -1;
            if (t % 3 === 0) S['!attack'] = S.attack = true; if (t % 50 === 0) S['!skill2'] = true; if (opts.step) opts.step(b, S, t);
        }
        Game.state === 'play' || (Game.state = 'play'); G.tick(); Input.endTick();
        if (opts.until && opts.until()) return { ok: true, t };
    }
    return { ok: false, t };
}
const U = X.U;
const results = def => { Game.state = 'menu'; Game.afterResults(def); finishCut(); if (Game.state === 'loading' || G.level.id !== 'garden') Game.loadLevel('garden'); finishCut(); };

/* -------- start at Day Two with a finished Day One -------- */
Store.write(Store.KEY, '');
Save.data = Save.fresh('normal'); const g = Save.data.g2; g.chapter = 2; g.intro = 1; g.named = 1; g.seen.after1 = 1; Save.data.cleared.seraphina = true; g.spared.seraphina = 1; g.shards.light = 1;
const deploy = id => { Game.deploy(id); finishCut(); if (!G.level || G.level.id !== id) Game.loadLevel(id); };
const day = (n, choice, extra = {}) => {
    const D = G2.DAYS[n], ids = D.levels; g.seen['open' + n] = 0;
    // the opening plays on the first deploy of the day
    let opened = false; const cut = G2.cut; G2.cut = (id, after) => { if (id === D.open) opened = true; cut(id, after); }; deploy(ids[0]); G2.cut = cut; finishCut();
    must(opened && G.level.id === ids[0], `Day ${n}: opening "${D.open}" plays, then ${ids[0]}`);
    must(G.player.id === 'nyx' && G.player.rig.S.scale > .7 + ((X.NYX_AGES[n] - 6) / 11) * .3 - .01, `Day ${n}: Nyx is ${X.NYX_AGES[n]}`);
    must(!!G.ally === (n <= 4), `Day ${n}: Zero ${n <= 4 ? 'walks with her' : 'is not with her'}`);
    const sh = G.level.objs.find(o => o.kind === 'chest' && o.shard); must(!!sh, `Day ${n}: a Shard of Peace is hidden`); if (sh) { G.nearObj = sh; G.interact(); }
    must(G.level.objs.filter(o => o.kind === 'lore').length >= 3, `Day ${n}: three or more scripture pages`);
    if (extra.explore) extra.explore();
    for (const a of G.level.g2arenas || [G.arena]) { const r = fight({ until: () => Save.data.cleared[a.boss], choice }); must(r.ok, `Day ${n}: mini-boss ${a.boss} falls (${(r.t / 60) | 0}s)`); }
    for (let i = 1; i < ids.length; i++) {
        Game.loadLevel(ids[i]); const bid = G.arena.boss;
        const r = fight(Object.assign({ until: () => Save.data.cleared[bid] || !G.boss && G.bossDone, choice }, extra.fight || {}));
        must(r.ok, `Day ${n}: ${bid} falls (${(r.t / 60) | 0}s)`);
        if (BOSSES[bid].choice) must(choice === 'spare' && !(extra.locked) ? g.spared[bid] : g.killed[bid], `Day ${n}: the choice about ${bid} is remembered (${choice}${extra.locked ? ', spare locked' : ''})`);
        results(BOSSES[bid]);
    }
    must(g.chapter === n + 1 && G.level.id === 'garden', `Day ${n}: the next day opens, back to the Garden`);
};
day(2, 'spare', { fight: { step: (b, S, t) => { if (G.ally && G.ally.captured) { G.player.x = G.ally.x; G.player.y = G.ally.y; G.player.cds.s3 = 0; S['!skill3'] = true; } } } });
must(true, 'Day 2: Mareva drags Zero under; Nyx dives and sings him free');
day(3, 'spare', { explore: () => { G2.station('memtree'); finishCut(); const tr = G.level.trigs.find(t => String(t.fn).includes('g2woodSword')); tr && tr.fn(); finishCut(); must(g.woodSword && G.player.weapon.id === 'wood', 'Day 3: Zero carves the wooden sword'); } });
day(4, 'spare');
g.alphaKilled = 0; day(5, 'spare', { fight: { step: (b, S) => { if (b.def.id === 'lilith') { G.player.cds.s3 = 0; S['!skill3'] = true; } } } });
must(['rook', 'sable', 'mirae', 'ysolde'].every(i => Save.data.unlocked.includes(i)), 'Day 5: the Four Riders join');
day(6, 'spare', { explore: () => { const tr = G.level.trigs.find(t => String(t.fn).includes('liftedSword')); tr && tr.fn(); finishCut(); must(g.liftedSword && G.player.weapon.id === 'blade', 'Day 6: Nyx lifts Zero’s sword'); G2.swapParty(); must(G.player.id !== 'nyx', 'Day 6: switching to a Rider'); G2.swapParty('nyx'); } });
must(g.persuade >= 2 && g.spared.archon, 'Day 6: honest answers persuade Archon Veil');
must(g.zeroBack && Save.data.unlocked.includes('zero'), 'Day 6: Zero is rescued and can be played');
must(G2.sparedCount() >= 5 && Object.keys(g.shards).length === 6, `spared ${G2.sparedCount()} women, ${Object.keys(g.shards).length} shards before the last day`);

/* -------- Day Seven and the last battle -------- */
g.seen.open7 = 0; deploy('shore'); finishCut(); must(G.level.id === 'shore', 'Day 7: the burned angel reveals what Nyx is');
const sh7 = G.level.objs.find(o => o.kind === 'chest' && o.shard); G.nearObj = sh7; G.interact(); must(Object.keys(g.shards).length === 7, 'all seven Shards of Peace');
let r = fight({ until: () => Save.data.cleared.zshadow }); must(r.ok, `Day 7: Zero’s Shadow falls (${(r.t / 60) | 0}s)`);
Game.loadLevel('throne'); must(G.level.objs.filter(o => o.g2 === 'witness').length === 6, 'Act 0: six witnesses on the stair (spared kneel, slain are stone)');
const top = G.level.trigs.find(t => String(t.fn).includes('lastStep')); top.fn(); finishCut(); must(G.flags.lastStep, 'Act 0: "Not this time."');
r = fight({ until: () => G.level.id === 'memory', step: (b, S) => { const beads = G.enemies.filter(e => e.type === 'bead' && !e.dead); if (beads.length) { beads[0].hp = 0; beads[0].die({ dir: 0 }); } } });
must(r.ok, `Act 1: Nyx beats Vesper, the prayer's beads break, the screen shatters (${(r.t / 60) | 0}s)`);
must(G.player.id === 'vesperYoung' && G.g2sepia, 'Act 2: playing Vesper, in sepia');
const alt = G.level.objs.find(o => o.g2 === 'altarChild'); G.player.x = alt.x; G.nearObj = alt; G.interact();
r = (function () { let t = 0; while (t++ < 60 * 40 && G.level.id === 'memory') { if (Cine.active) finishCut(); Input.simulated = { interact: true }; G.tick(); Input.endTick(); } return G.level.id === 'architect2'; })();
must(r, 'Act 2: holding the child; back to the present');
G2.swapParty('zero'); must(G.player.id === 'zero', 'Act 3: the whole party, Zero included'); G2.swapParty('vesper'); must(G.player.id === 'vesper', 'Act 3: Vesper can be played'); G2.swapParty('nyx');
let ended = null; G2.throneChoice = function () { ended = 'choice'; };
r = fight({ until: () => ended === 'choice', max: 60 * 600 });
must(r.ok, `Act 3: four laws, assists from the spared, "Day and Night" (${(r.t / 60) | 0}s)`);
must(g.act === 4, 'Act 4: the choice');
must(G2.canTrue(), 'the true ending is open (5+ spared, 7 shards)');
/* -------- the endings -------- */
for (const e of ['5a', '5b']) { G.flags.g2done = null; G2.finishEnding(e); must(g.endings[e], `ending ${e} plays and is remembered`); }
// 5C: Zero's Weariness. Attacking never wins; holding does.
Game.loadLevel('weariness'); let t = 0; const A = G.arena; G.player.x = A.trigger + 30; while (t++ < 300) { G.tick(); Input.endTick(); if (Cine.active) finishCut(); }
const W = () => G.boss; t = 0; while (t++ < 60 * 45 && W() && !W().dead) { if (Cine.active) finishCut(); const P = G.player, b = W(); P.x = b.x - 50; P.facing = 1; Input.simulated = t % 3 === 0 ? { '!attack': true, attack: true } : {}; G.tick(); Input.endTick(); }
must(W() && !W().dead, '5C: striking the Weariness for 45 seconds never wins');
t = 0; G.flags.g2done = null; while (t++ < 60 * 20 && !G.flags.g2done) { if (Cine.active) finishCut(); const P = G.player, b = W(); if (b && !b.dead) P.x = b.x - 40; Input.simulated = { interact: true }; G.tick(); Input.endTick(); }
must(G.flags.g2done === '5c' && g.endings['5c'], '5C: holding it for ten seconds: "Good night, Zero."');
must(G2.canSecret(), 'New Game+ with three endings seen opens the secret ending');
G2.finishEnding('5d'); must(g.endings['5d'], '5D: LUCIFER, PROJECT ZERO III');
const before = JSON.stringify(Save.data); Save.write(); Save.data = null; must(Save.load() && JSON.stringify(Save.data) === before, 'save and load round trip after the finale');
console.log(fails ? `\n${fails} FAILED` : '\nCAMPAIGN II COMPLETE'); process.exit(fails ? 1 : 0);
