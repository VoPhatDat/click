'use strict';
/* Boots every level with every operator, runs and renders it headless, plays every cutscene. */
const { load } = require('./harness');
const X = load(), { G, Game, Save, Scene, Cine, CUTS, Input, CHAR_ORDER, LEVEL_ORDER } = X;
let fails = 0;
const check = (name, fn) => { try { fn(); console.log('ok   ', name); } catch (e) { fails++; console.log('FAIL ', name, '\n     ', e.stack.split('\n').slice(0, 4).join('\n      ')); } };
const fresh = () => { Save.data = Save.fresh('normal'); Save.data.unlocked.push('zero'); Save.data.shards = { r: true, g: true, b: true }; Game.diff = X.Game.diff; };

for (const lvl of LEVEL_ORDER) for (const ch of CHAR_ORDER) check(`${lvl} / ${ch}`, () => {
    fresh(); Save.data.activeChar = ch; Game.loadLevel(lvl);
    const P = G.player; Input.simulated = {};
    for (let i = 0; i < 400; i++) {
        const S = Input.simulated; S.right = i % 200 < 150; S.left = !S.right; S.attack = i % 3 === 0; S['!attack'] = i % 9 === 0;
        if (i % 37 === 0) S['!jump'] = S.jump = true; else S.jump = false;
        if (i % 90 === 40) S['!dodge'] = true; if (i % 120 === 50) { S['!skill1'] = true; S.heavy = false; } if (i % 120 === 110) S['!skill2'] = true;
        if (i % 150 === 75) { P.ult = 100; S['!ult'] = true; } if (i % 170 === 60) { S['!heavy'] = true; S.heavy = true; }
        G.tick(); Input.endTick();
        if (i % 25 === 0) Scene.draw(Game.ctx, Game.canvas);
        if (Number.isNaN(P.x) || Number.isNaN(P.y)) throw new Error('player position became NaN at tick ' + i);
    }
    Input.simulated = null;
});
for (const id of Object.keys(CUTS)) check('cutscene ' + id, () => {
    fresh(); G.player = null; Game.state = 'cine'; let done = false; Cine.play(CUTS[id], () => { done = true; }, false); let n = 0;
    Game.loadLevel('city'); Game.state = 'cine';
    while (!done && n < 12000) { Cine.update(); if (n % 30 === 0) Cine.render(Game.ctx); n++; }
    if (!done) throw new Error('never finished');
    console.log('      ', id, (n / 60).toFixed(0) + 's');
});
console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
