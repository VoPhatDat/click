'use strict';
/* Walks every Part II exploration level from the start to the boss gate with a simple bot (kept alive),
   to check the map can be crossed on foot: jumps, slopes, swimming, moving platforms. */
const { load } = require('./harness');
const X = load(), { G, Game, Save, Input, Cine } = X;
const finishCut = () => { let n = 0; while (Cine.active && n++ < 60000) Cine.update(); if (Game.state === 'cine') Game.state = 'play'; };
let fails = 0;
for (const [ch, id] of [[1, 'dawn'], [2, 'sea'], [2, 'mareva'], [3, 'forest2'], [4, 'observ'], [5, 'desert2'], [6, 'meridian'], [7, 'shore'], [7, 'throne'], [7, 'memory']]) {
    Save.data = Save.fresh('normal'); const g = Save.data.g2; g.chapter = ch; g.named = 1; g.woodSword = 1; g.liftedSword = 1; g.seen.memtree = 1; g.seen.zeroWeak = 1; for (let k = 1; k <= 7; k++) g.seen['open' + k] = 1;
    finishCut(); Game.loadLevel(id); Game.state = 'play'; const goal = G.arena ? G.arena.trigger : (G.level.objs.find(o => o.g2 === 'altarChild') || { x: G.level.pw - 200 }).x;
    let t = 0, hold = 0, stuck = 0, lx = 0, best = 0, cleared = 0;
    while (t++ < 60 * 300) {
        if (Cine.active) finishCut(); if (Game.state !== 'play') Game.state = 'play'; if (G.dialog) { G.dialog = null; G.lockInput = false; }
        const P = G.player, L = G.level, S = Input.simulated = {}; P.inv = 9; P.hp = P.maxHp;
        if (G.boss && !G.boss.dead) { G.boss.hp = 0; G.boss.beginDeath(); cleared++; } if (G.flags.g2choice === null) G.flags.g2choice = 'spare';
        for (const e of G.enemies) if (!e.boss && !e.dead && Math.abs(e.x - P.x) < 200) { e.hp = 0; e.die({ dir: 1 }); }
        S.right = true; const ah = L.surfaceBelow(P.x + 40, P.y - 10, 140);
        if (P.g2swim) { const wall = L.tileAt(P.x + 30, P.y - 40) && L.tileAt(P.x + 30, P.y - 40) !== X.T.E; if (wall) { S.down = true; } else if (t % 14 === 0) S['!jump'] = S.jump = true; }
        else if (P.grounded && (P.onWall || ah === null || ah < P.y - 12)) { S['!jump'] = S.jump = true; hold = 18; }
        if (hold > 0) { hold--; S.jump = true; }
        if (!P.grounded && P.vy > 1 && P.jumps < 2 && L.surfaceBelow(P.x + 20, P.y, 300) === null) S['!jump'] = S.jump = true;
        if (Math.abs(P.x - lx) < .5) stuck++; else stuck = 0; lx = P.x; if (stuck > 60) { S['!jump'] = S.jump = true; hold = 24; if (stuck > 150) { S.right = false; S.left = true; if (stuck > 190) stuck = 0; } }
        G.tick(); Input.endTick(); best = Math.max(best, P.x);
        if (P.x >= goal || G.level.id !== id) break;
    }
    const ok = best >= goal || G.level.id !== id; if (!ok) fails++;
    console.log(`${ok ? 'ok   ' : 'FAIL '} ${id.padEnd(9)} ${ok ? 'reached the gate in ' + ((t / 60) | 0) + 's' : 'stuck at x=' + (best | 0) + ' of ' + (goal | 0) + ' (tile ' + ((best / 32) | 0) + ')'}`);
}
console.log(fails ? fails + ' FAILED' : 'ALL LEVELS CROSSED'); process.exit(fails ? 1 : 0);
