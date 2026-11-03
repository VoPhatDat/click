'use strict';
/* Loads every Part II level and fights every boss for a while with an invulnerable bot, to catch errors. */
const { load } = require('./harness');
const X = load(), { G, Game, Save, Input, BOSSES } = X;
let fails = 0; const must = (c, m) => { console.log((c ? 'ok    ' : 'FAIL  ') + m); if (!c) fails++; };
const LV = [[1, 'dawn'], [1, 'cathedral'], [2, 'sea'], [2, 'mareva'], [3, 'forest2'], [3, 'roots'], [4, 'observ'], [4, 'astraea'], [5, 'desert2'], [5, 'lilith'], [6, 'meridian'], [6, 'archon'], [6, 'architect'], [7, 'shore'], [7, 'throne'], [7, 'memory'], [7, 'architect2'], [7, 'weariness'], [1, 'garden']];
for (const [ch, id] of LV) {
    try {
        Save.data = Save.fresh('normal'); const g = Save.data.g2; g.chapter = ch; g.named = 1; g.woodSword = 1; g.liftedSword = 1; g.zeroBack = ch >= 7 ? 1 : 0; for (let k = 1; k <= 7; k++) g.seen['open' + k] = 1; g.seen.memtree = 1; g.seen.zeroWeak = 1;
        if (ch >= 6) ['rook', 'sable', 'mirae', 'ysolde', 'zero', 'vesper'].forEach(i => Save.data.unlocked.includes(i) || Save.data.unlocked.push(i));
        Game.loadLevel(id); Game.state = 'play'; const P = () => G.player; let t = 0, bossSeen = null;
        while (t++ < 60 * 70) {
            const p = P(); p.inv = 99; const S = Input.simulated = {}; const A = G.arena;
            if (A && !G.boss && !G.bossDone) { p.x = A.trigger + 30; p.y = A.y - 2; p.vy = 0; }
            if (G.boss) { bossSeen = G.boss.def.id; const a = G.boss.aim(); S.right = a.x > p.x + 60; S.left = a.x < p.x - 60; if (t % 4 === 0) S['!attack'] = S.attack = true; if (t % 90 === 0) S['!skill1'] = true; if (t % 130 === 0) S['!skill2'] = true; if (t % 170 === 0) S['!skill3'] = true; if (t % 20 === 0) S['!jump'] = true; }
            else { S.right = true; if (t % 40 === 0) S['!jump'] = S.jump = true; }
            if (G.flags.g2choice === null) G.flags.g2choice = 'spare'; if (G.flags.g2talk === null) G.flags.g2talk = 0;
            G.tick(); Input.endTick(); if (Game.state !== 'play') Game.state = 'play';
            if (G.boss && G.boss.def.id === 'weariness' && t > 600) { Input.simulated = { interact: true }; }
        }
        must(true, `${id.padEnd(11)} ch${ch} ran 70s, boss ${bossSeen || '-'}${G.boss ? ' at ' + Math.round(100 * G.boss.hp / G.boss.maxHp) + '%' : bossSeen ? ' done' : ''}`);
    } catch (e) { must(false, `${id}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
}
console.log(fails ? fails + ' FAILED' : 'TOUR OK'); process.exit(fails ? 1 : 0);
