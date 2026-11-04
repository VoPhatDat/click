'use strict';
/* ZERO WATCH: bossbot2 plus a watch on AI Zero in every fight: hits he lands, the longest gap without one, stuck, outside the arena, fallen, errors. */
/**
 * Fights every Part II boss for real (no invulnerability) with the kit the story gives at that point:
 * Nyx and AI Zero on Days 2 to 4, Nyx alone on Day 5, Nyx and the Riders on Day 6 and 7.
 * The bot reads telegraphs and gets out of them, hides in its own night, uses towers, beads, songs.
 */
const { load } = require('./harness');
const X = load(), { G, Game, Save, Input, Cine, U, G2, Shadow } = X;
const finishCut = () => { let n = 0; while (Cine.active && n++ < 60000) Cine.update(); if (Game.state === 'cine') Game.state = 'play'; };
let fails = 0;
// Zero watch: hits Zero lands, longest gap without one, stuck, out of the arena, fallen, errors
const ZW = { hits: 0, last: 0, gap: 0, stuck: 0, out: 0, fell: 0, err: 0, errs: new Set(), notes: new Set(), lx: 0, sameT: 0, vy: 0 };
const BH = X.Boss.prototype.hurt; X.Boss.prototype.hurt = function (d, o) { const r = BH.call(this, d, o); const s = o && (o.src || o.owner); if (r > 0 && s && s === G.ally) ZW.hits++; return r; };

const CASES = process.argv[2] ? JSON.parse(process.argv[2]) : [
    [2, 'sea', 'whale'], [2, 'mareva', 'mareva'], [3, 'forest2', 'scarecrow'], [3, 'roots', 'gardener'], [4, 'observ', 'clock'], [4, 'astraea', 'astraea'],
    [5, 'desert2', 'behemoth'], [5, 'desert2', 'antelope'], [5, 'lilith', 'lilith'], [6, 'meridian', 'preacher'], [6, 'archon', 'archon'], [6, 'architect', 'architect'],
    [7, 'shore', 'zshadow'], [7, 'throne', 'vesper'], [7, 'architect2', 'architect2']
];
function step(t) {
    const P = G.player, b = G.boss, A = G.arena, S = Input.simulated = {}; let busy = false; const go = d => { S.right = d > 0; S.left = d < 0; };
    for (const w of G.warns) {
        if (!w.dmg && !w.lightSpear) continue;
        const hb = P.hurtBox || { x: P.x - 12, y: P.y - 60, w: 24, h: 60 };
        if (w.shape === 'light') { if (!Shadow.covered(w.lx, w.ly, P.x, P.y - 34)) { if (P.cds.s1 <= 0 && P.id === 'nyx') S['!skill1'] = true; let best = null, bd = 1e9; for (const p of A.pillars) { const [a, c] = Shadow.span(w.lx, w.ly, p, A.y); const x = U.clamp(P.x, a + 16, c - 16); if (Math.abs(x - P.x) < bd) { bd = Math.abs(x - P.x); best = x; } } if (best !== null) go(best - P.x); busy = true; } }
        else if (w.shape === 'rect') { const x0 = Math.min(w.x, w.x + w.w), x1 = Math.max(w.x, w.x + w.w); if (hb.x + hb.w > x0 - 16 && hb.x < x1 + 16 && hb.y + hb.h > w.y && hb.y < w.y + w.h) { busy = true; if (w.lightSpear && P.id === 'nyx' && P.cds.s1 <= 0) S['!skill1'] = true; if (x1 - x0 > 500 && w.h < 160) { if (P.grounded && w.t < 16) S['!jump'] = S.jump = true; } else go(P.x < (x0 + x1) / 2 ? -1 : 1); if (w.t < 10 && P.dodgeCd <= 0) S['!dodge'] = true; } }
        else if (w.shape === 'circle' && Math.hypot(P.x - w.x, P.y - 30 - w.y) < w.r + 30) { busy = true; go(P.x < w.x ? -1 : 1); if (w.t < 12 && P.dodgeCd <= 0) S['!dodge'] = true; }
        else if (w.shape === 'cone') { if (w.t < 14 && P.dodgeCd <= 0) S['!dodge'] = true; }
    }
    if (G.flags.g2choice === null) G.flags.g2choice = 'spare'; if (G.flags.g2talk === null) G.flags.g2talk = 0;
    if (!b || b.dead || b.intro) return;
    if (busy) return;
    // special duties
    if (G.ally && G.ally.captured) { go(G.ally.x - P.x); S.down = true; if (Math.hypot(G.ally.x - P.x, G.ally.y - P.y) < 140) { S['!skill3'] = true; } return; }
    const beads = G.enemies.filter(e => e.type === 'bead' && !e.dead); if (beads.length) { const e = beads[0]; go(e.x - P.x); if (e.y < P.y - 80 && P.grounded) S['!jump'] = S.jump = true; if (Math.abs(e.x - P.x) < 70) { S['!attack'] = S.attack = true; } return; }
    if (b.def.id === 'gardener' && b.hold > 0) { S[t % 2 ? '!left' : '!right'] = true; S[t % 2 ? 'left' : 'right'] = true; return; }
    if ((b.def.id === 'lilith' || b.def.id === 'behemoth') && P.cds.s3 <= 0 && P.energy >= 40) S['!skill3'] = true;
    if (b.def.id === 'vesper' && P.x < A.x0 + 200) { go(1); if (P.dodgeCd <= 0) S['!dodge'] = true; return; }
    const noAtk = P.def.noAttack;
    if (noAtk) { // little Nyx keeps away and hides; Zero does the fighting
        const d = b.x - P.x; if (Math.abs(d) < 260) go(-d); if (P.cds.s1 <= 0 && Math.abs(d) < 320) S['!skill1'] = true; if (P.x < A.x0 + 60 || P.x > A.x1 - 60) go(d); return;
    }
    const a = b.aim(), dx = a.x - P.x, ranged = P.def.ranged, want = ranged ? 260 : 64;
    if (Math.abs(dx) > want) go(dx); else if (ranged && Math.abs(dx) < 140) go(-dx); else P.facing = U.sign(dx);
    if (!ranged && a.y < P.y - 150 && P.grounded && t % 30 === 0) S['!jump'] = S.jump = true;
    // vary what you do, so a prophet cannot read you
    const k = b.def.id === 'astraea' ? (t >> 6) % 4 : 0;
    if (k === 0 || k === 2) { if (t % 4 === 0) S['!attack'] = S.attack = true; } else if (k === 1) { if (t % 14 === 0) S['!heavy'] = S.heavy = true; } else if (t % 8 === 0) { if (P.weapons && 0) 0; S['!weapon'] = t % 200 === 0; S['!attack'] = S.attack = true; }
    if (t % 97 === 0) S['!skill1'] = true; if (t % 131 === 0 && P.id !== 'nyx') S['!skill2'] = true; if (t % 173 === 0 && P.id !== 'ysolde') S['!skill3'] = true;
    if (P.ult >= 100) S['!ult'] = true; if (P.form && P.balance < 20 && t % 30 === 0) S['!form'] = true;
    if (P.hp < P.maxHp * .35 && G2.party().length > 1 && t % 120 === 0) G2.swapParty();
}
for (const [ch, lvl, boss] of CASES) {
    let wins = 0, res = [];
    for (let run = 0; run < 2; run++) {
        Save.data = Save.fresh('normal'); const g = Save.data.g2; g.chapter = ch; g.named = 1; g.woodSword = 1; g.liftedSword = 1; g.seen.memtree = 1; for (let k = 1; k <= 7; k++) g.seen['open' + k] = 1; if (ch >= 7) g.zeroBack = 1;
        if (ch >= 6) ['rook', 'sable', 'mirae', 'ysolde'].forEach(i => Save.data.unlocked.push(i)); if (ch >= 7) ['zero', 'vesper'].forEach(i => Save.data.unlocked.push(i));
        if (boss === 'antelope') Save.data.cleared.behemoth = true; g.spared = ch >= 7 ? { seraphina: 1, mareva: 1, gardener: 1, astraea: 1, lilith: 1, archon: 1 } : {};
        finishCut(); Game.loadLevel(lvl); Game.state = 'play'; G.lines = []; G.flags.g2done = null; const A = G.arena; G.player.x = A.trigger + 40; G.player.y = A.y - 2; if (G.ally) { G.ally.x = G.player.x - 40; G.ally.y = G.player.y; }
        let t = 0, out = 'timeout'; const max = 60 * 600; Object.assign(ZW, { hits: 0, last: 0, gap: 0, stuck: 0, out: 0, fell: 0, err: 0, lx: 0, sameT: 0 }); ZW.errs = new Set(); ZW.notes = new Set(); let hitsPrev = 0;
        while (t++ < max) {
            if (Cine.active) finishCut(); if (Game.state !== 'play') Game.state = 'play'; if (G.dialog) { G.dialog = null; G.lockInput = false; }
            step(t); try { G.tick(); } catch (e) { ZW.err++; ZW.errs.add(String(e.message).slice(0, 90)); } Input.endTick();
            { const z = G.ally, b = G.boss, A = G.arena; if (z && b && !b.intro && !b.dead && !G.lockInput && !Cine.active) {
                if (ZW.hits !== hitsPrev) { hitsPrev = ZW.hits; ZW.last = t; } else if (!b.untargetable && !b.transition) ZW.gap = Math.max(ZW.gap, t - ZW.last);
                if (A && (z.x < A.x0 - 60 || z.x > A.x1 + 60)) { ZW.out++; ZW.notes.add('outside arena x=' + (z.x | 0)); }
                if (z.y > G.level.ph - 20) ZW.fell++;
                if (Math.abs(z.x - ZW.lx) < 1 && Math.abs(b.x - z.x) > 300) { ZW.sameT++; if (ZW.sameT > 600) { ZW.stuck++; ZW.notes.add('stuck at ' + (z.x | 0) + ',' + (z.y | 0) + ' state ' + z.state + (z.captured ? ' captured' : '')); ZW.sameT = 0; } } else ZW.sameT = 0; ZW.lx = z.x;
            } else ZW.last = t; }
            if (Save.data.cleared[boss] || (G.boss === null && G.bossDone) || G.level.id !== lvl || Save.data.g2.act === 4 || G.flags.g2done) { out = 'win'; break; }
            if (G.player.state === 'dead') { out = 'died, boss at ' + (G.boss ? Math.round(100 * G.boss.hp / G.boss.maxHp) : 0) + '%'; break; }
        }
        console.log(`      Zero: ${ZW.hits} hits, longest gap ${(ZW.gap / 60).toFixed(1)}s, stuck ${ZW.stuck}, outside ${ZW.out}, fell ${ZW.fell}, errors ${ZW.err} ${[...ZW.errs].join(' | ')} ${[...ZW.notes].slice(0, 3).join('; ')}`);
        if (out === 'timeout') out += ' (boss ' + (G.boss ? Math.round(100 * G.boss.hp / G.boss.maxHp) + '%, phase ' + G.boss.phase : '-') + ')'; if (out === 'win') wins++; res.push(out === 'win' ? `${(t / 60) | 0}s` : out);
    }
    const ok = wins >= 1; if (!ok) fails++;
    console.log(`${ok ? 'ok   ' : 'FAIL '} Day ${ch} ${boss.padEnd(11)} ${wins}/2  ${res.join(', ')}`);
}
console.log(fails ? `${fails} FAILED` : 'ALL BOSSES BEATEN'); process.exit(fails ? 1 : 0);
