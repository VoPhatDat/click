/* Browser-only soak on the real canvas and audio graph. Run via ?debug, read window.__soak. */
window.runSoak = async () => {
    const { G, Game, Save, Input, Sound, Music } = PZ, errs = [], R = window.__soak = { done: false, frames: 0, worst: 0, errs, stage: '' };
    const tickle = () => new Promise(r => setTimeout(r, 0)), draw = () => { Game.state = 'pause'; Game.render(); };
    Sound.resume(); await new Promise(r => setTimeout(r, 300));
    for (const n of window.__sfxNames) { try { Sound.last = {}; Sound.voices = 0; Sound.sfx(n); } catch (e) { errs.push('sfx ' + n + ': ' + e.message); } }
    for (const id of ['menu', 'city', 'forest', 'desert', 'ice', 'volcano', 'boss', 'finalboss', 'ending', 'train']) {
        try { Music.trackId = null; Music.track = null; Music.play(id, 'critical'); for (let s = 0; s < 64; s++) Music.playStep(s, Sound.ctx.currentTime + .05 + s * .01, .1); } catch (e) { errs.push('music ' + id + ': ' + e.message); }
    }
    Music.stop(.05); R.audio = 'ok';
    Save.data = Save.fresh('normal'); Save.data.unlocked.push('zero'); Save.data.shards = { r: true, g: true, b: true };
    const chars = ['rook', 'sable', 'mirae', 'ysolde', 'zero'], levels = ['city', 'forest', 'desert', 'ice', 'volcano1', 'volcano2', 'volcano3'];
    Input.simulated = {};
    for (let li = 0; li < levels.length; li++) {
        R.stage = levels[li]; Save.data.activeChar = chars[li % 5];
        try { Game.loadLevel(levels[li]); } catch (e) { errs.push('load ' + levels[li] + ': ' + e.message); continue; }
        const P = G.player, A = G.arena; P.inv = 1e9;
        for (const cp of G.level.cps) {
            P.x = cp.x; P.y = cp.y; P.safe = { x: P.x, y: P.y };
            for (let i = 0; i < 26; i++) {
                const S = Input.simulated; S.right = true; S.attack = true; S['!attack'] = true; if (i % 13 === 0) S['!jump'] = S.jump = true; if (i % 17 === 0) S['!skill1'] = true; if (i % 23 === 0) S['!skill2'] = true; if (i === 15) { P.ult = 100; S['!ult'] = true; }
                try { G.tick(); Input.endTick(); G.hitstop = 0; const t0 = performance.now(); draw(); R.worst = Math.max(R.worst, performance.now() - t0); R.frames++; } catch (e) { errs.push(levels[li] + ': ' + e.message + ' @' + (e.stack || '').split('\n')[1]); break; }
            }
            await tickle();
        }
        if (A) {
            G.enemies = []; P.x = A.trigger + 60; P.y = A.y - 2; P.vy = 0; G.startBoss(); const b = G.boss;
            for (let i = 0; i < 300 && b.intro; i++) { G.tick(); Input.endTick(); }
            for (let n = 0; n < b.def.phases.length; n++) {
                if (n > 0) b.pending = n;
                R.stage = levels[li] + ' phase ' + n;
                for (let i = 0; i < 170; i++) {
                    try { for (let k = 0; k < 4; k++) { const S = Input.simulated; S.right = i % 40 < 20; S.left = !S.right; S.attack = true; G.tick(); Input.endTick(); G.hitstop = 0; } draw(); R.frames++; } catch (e) { errs.push(b.name + ' p' + n + ': ' + e.message + ' @' + (e.stack || '').split('\n')[1]); break; }
                    if (i % 30 === 0) await tickle();
                }
            }
            b.hp = 1; b.beginDeath();
            for (let i = 0; i < 280; i++) { try { G.tick(); if (i % 9 === 0) draw(); if (Game.state !== 'pause' && Game.state !== 'play') break; Game.state = 'play'; } catch (e) { errs.push('death ' + e.message); break; } }
        }
        await tickle();
    }
    Input.simulated = null; R.done = true; R.stage = 'finished';
};
