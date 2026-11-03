'use strict';
/**
 * Plays every boss fight through the real game loop with a simple bot, then reports
 * time to kill, damage the bot took, deaths and whether every phase was seen.
 * Levels scale with progress as they would in a normal playthrough.
 */
const { load } = require('./harness');
const X = load(), { G, Game, Save, Input, CHARS, BOSSES, LEVELS, Enemy, DIFFS } = X;
const ONLY = process.argv[4]; const FIGHTS = [['city', 'atlas', 5], ['forest', 'sylvaris', 8], ['desert', 'qareth', 11], ['ice', 'nadir', 14], ['volcano2', 'vulkaris', 17], ['volcano3', 'endbringer', 19]].filter(f => !ONLY || f[1] === ONLY);
const chars = (process.argv[2] || 'rook,sable,mirae,ysolde,zero').split(','), god = process.argv[3] !== 'mortal';

function run(lvl, boss, level, ch) {
    Save.data = Save.fresh('normal'); Save.data.activeChar = ch; Save.data.unlocked.push('zero'); Save.data.shards = { r: lvl !== 'city', g: lvl !== 'city', b: lvl.startsWith('volcano') };
    Save.charData(ch).level = level;
    Game.loadLevel(lvl);
    const A = G.arena, P = G.player; G.enemies = []; P.x = A.trigger + 60; P.y = A.y - 2; P.vy = 0; P.grounded = true; P.safe = { x: P.x, y: P.y };
    Input.simulated = {};
    G.startBoss();
    const seen = new Set(); let taken = 0, deaths = 0, t = 0, doneT = 0, errs = 0; const hp0 = P.maxHp;
    let done = false; const oFinal = Game.onFinalBossDefeated, oBoss = Game.onBossDefeated;
    Game.onFinalBossDefeated = () => { done = true; }; Game.onBossDefeated = () => { done = true; };
    while (!done && t < 60 * 60 * 6) {
        t++;
        const S = Input.simulated, b = G.boss;
        for (const k in S) if (k[0] !== '!') S[k] = false;
        if (G.clash) { if (t % 4 === 0) S['!attack'] = true; } else if (b && !b.intro) {
            seen.add(b.phase);
            const c = b.aim(), dx = c.x - P.x, adist = Math.abs(dx), d = CHARS[ch], rng = d.ranged ? 340 : 54;
            const danger = G.warns.some(w => w.t < 16 && X.Combat.warnHits(w)) || G.projs.some(p => !p.friendly && Math.hypot(p.x - P.x, p.y - P.y + 30) < 80);
            if (danger && t % 2 === 0) S['!dodge'] = true;
            if (adist > rng + 30) S[dx > 0 ? 'right' : 'left'] = true; else if (adist < rng - 40 && d.ranged) S[dx > 0 ? 'left' : 'right'] = true;
            S.attack = true; if (t % 12 === 0) S['!attack'] = true;
            if (P.y > c.y + 90 && adist < 170 && !d.ranged && t % 16 === 0) { S['!jump'] = S.jump = true; }
            if (t % 70 === 0) S['!skill1'] = true; if (t % 110 === 40) S['!skill2'] = true; if (P.ult >= 100) S['!ult'] = true;
            if (P.y > A.y + 4 && P.grounded) { S['!jump'] = S.jump = true; }
        }
        const before = P.hp;
        G.tick(); Input.endTick(); if (t % 40 === 0) X.Scene.draw(Game.ctx, Game.canvas);
        if (P.hp < before) taken += before - P.hp;
        if (P.state === 'dead' || P.hp <= 0) {
            deaths++;
            if (!god) break;
            P.state = 'move'; P.hp = P.maxHp; P.rig.ground = true; P.deathT = 0; P.rig.play('idle', 0); P.inv = 60; P.safe = { x: A.x0 + 200, y: A.y }; G.slowmo = 0; Save.data.stats.deaths = 0;
        }
        if (P.y > G.level.ph) { P.y = A.y - 2; }
    }
    Game.onFinalBossDefeated = oFinal; Game.onBossDefeated = oBoss; Input.simulated = null;
    const phases = BOSSES[boss].phases.length;
    return { ok: done && seen.size === phases, secs: Math.round(t / 60), taken: Math.round(taken), hp: hp0, deaths, phases: seen.size + '/' + phases };
}
let bad = 0;
for (const [lvl, boss, level] of FIGHTS) for (const ch of chars) {
    try {
        const r = run(lvl, boss, level, ch);
        console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${boss.padEnd(11)} ${ch.padEnd(7)} L${String(level).padEnd(3)} phases ${r.phases}  ${String(r.secs).padStart(4)}s  dmg taken ${String(r.taken).padStart(5)} / ${r.hp} hp  bot deaths ${r.deaths}`);
        if (!r.ok) bad++;
    } catch (e) { bad++; console.log('FAIL', boss, ch, e.stack.split('\n').slice(0, 4).join(' | ')); }
}
process.exit(bad ? 1 : 0);
