'use strict';
/**
 * G2 BOSSES, Day One. Written as generator scripts like boss.js.
 *   THE SHADOWLESS KNIGHT (mini-boss): shield front, charge, slam, combo; phase 2 blinks.
 *   SERAPHINA, THE BLIND GODDESS OF LIGHT: stand in a pillar's shadow; false lights;
 *   then a blind phase fought by ear (bells panned left or right).
 */

/* A telegraph that hits everyone who is NOT in a pillar's shadow from the light at (lx, ly). */
const Shadow = {
    segRect(x0, y0, x1, y1, r) {
        let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0, p = [-dx, dx, -dy, dy], q = [x0 - r.x0, r.x1 - x0, y0 - r.y0, r.y1 - y0];
        for (let i = 0; i < 4; i++) { if (p[i] === 0) { if (q[i] < 0) return false; } else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } } }
        return true;
    },
    covered(lx, ly, x, y) { const A = G.arena; if (!A || !A.pillars) return false; return A.pillars.some(p => this.segRect(lx, ly, x, y, { x0: p.x - 22, x1: p.x + 22, y0: p.top, y1: A.y })); },
    /** Ground interval in shadow behind a pillar, used by the bot and the renderer. */
    span(lx, ly, p, G0) { const e = [p.x - 22, p.x + 22], pr = x => p.top <= ly ? (x < lx ? -1e4 : 1e4) : lx + (x - lx) * (G0 - ly) / (p.top - ly), xs = e.concat(e.map(pr)); return [Math.min(...xs), Math.max(...xs)]; }
};
(function () {
    const wh = Combat.warnHits.bind(Combat);
    Combat.warnHits = function (w) { if (w.shape === 'light') { const P = G.player; return !Shadow.covered(w.lx, w.ly, P.x, P.y - 34); } return wh(w); };
    const dw = Combat.drawWarns.bind(Combat);
    Combat.drawWarns = function (c) {
        const lights = G.warns.filter(w => w.shape === 'light'); G.warns = G.warns.filter(w => w.shape !== 'light'); dw(c); G.warns = G.warns.concat(lights);
        const A = G.arena;
        for (const w of lights) {
            const k = 1 - w.t / w.max, srcs = [{ x: w.lx, y: w.ly, real: true }].concat((w.decoys || []).map(d => ({ x: d.x, y: d.y, real: false })));
            c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,245,210,${k * .14})`; c.fillRect(A.x0 - 200, A.y - 900, A.x1 - A.x0 + 400, 1000); c.restore();
            for (const s of srcs) {
                const fl = s.real ? 1 : .5 + .5 * Math.sin(G.time * .9 + s.x);
                c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#fff4c8'), s.x - 40 - 90 * k, s.y - 40 - 90 * k, 80 + 180 * k, 80 + 180 * k); c.restore();
                c.strokeStyle = s.real ? `rgba(255,215,90,${.5 + .5 * k})` : `rgba(255,90,90,${.7 * fl})`; c.lineWidth = s.real ? 4 : 2; c.beginPath(); c.arc(s.x, s.y, 22 + Math.sin(G.time * .2) * 4, 0, TAU); c.stroke();
                c.save(); c.globalAlpha = (s.real ? .45 : .22 * fl) + .3 * k; c.fillStyle = '#1a1030';
                for (const p of A.pillars) { const pj = x => p.top <= s.y ? (x < s.x ? -9999 : 9999) : s.x + (x - s.x) * (A.y - s.y) / (p.top - s.y); c.beginPath(); c.moveTo(p.x - 22, p.top); c.lineTo(p.x + 22, p.top); c.lineTo(pj(p.x + 22), A.y); c.lineTo(pj(p.x - 22), A.y); c.closePath(); c.fill(); }
                c.restore();
            }
        }
    };
})();

const B_KNIGHT = {
    id: 'knight', name: 'THE SHADOWLESS KNIGHT', title: 'WARDEN OF THE DAWN GATE', hp: 2800, w: 60, h: 150, col: '#ffe7a0', mini: true,
    music: 'g2knight', reward: { xp: 400, relic: 'bell', cells: 90 },
    init: b => { const r = new Rig(Object.assign({}, enemyStyle(ENEMIES.dawnwarden), { scale: 1.75 })); r.owner = b; r.play('idle', 0); Object.defineProperty(b, 'P', { get: () => (G.ally && G2Night.nyxHidden() ? G.ally : G.player) }); return { rig: r, armorFront: true, pose: null }; },
    aim: b => ({ x: b.x, y: b.y - 90 }),
    box: b => ({ x: b.x - 30, y: b.y - 150, w: 60, h: 150 }),
    tick(b) { if (!b._g2k) { b._g2k = true; if (G.player && G.player.id !== 'nyx') { b.dmgK *= .7; b.maxHp = b.hp = Math.round(b.hp * .8); } } if (G2Night.shadeAt(b.x, b.y - 60)) { if (b.armorFront) VFX.text(b.x, b.y - 170, 'A SHADOW', '#b48cff', 14, 30); b.armorFront = false; } const R = b.rig; R.ground = true; R.gaitAmt = 1; R.phase += Math.abs(b.vx) / 11; if (!b.pose) R.play(Math.abs(b.vx) > .5 ? 'run' : 'idle', 6); R.tick(); R.updateChain(b.x, b.y, b.facing); b.vx *= .8; },
    phases: [
        { moves: ['charge', 'combo', 'slam', 'combo'], rest: 40 },
        { at: .5, moves: ['charge', 'blink', 'combo', 'slam', 'blink'], rest: 26, say: ['THE SHADOWLESS KNIGHT', 'The sun took my shadow. I will take yours.'], enter: function* (b) { G.flash = .5; Sound.sfx('roar'); G.addShake(12); yield 50; b.dmgK *= 1.15; } }
    ],
    moves: {
        *face(b) { b.facing = b.P.x >= b.x ? 1 : -1; },
        *charge(b) {
            yield* B_KNIGHT.moves.face(b); const dir = b.facing, tx = U.clamp(b.P.x + dir * 160, b.A.x0 + 50, b.A.x1 - 50);
            b.armorFront = true; Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 130, w: tx - b.x, h: 130, t: 40, dmg: b.D(21), src: b, kb: 12 }); Sound.sfx('mech'); yield 40;
            while (Math.abs(b.x - tx) > 14) { b.x += dir * 15; b.vx = dir * 6; if (G.time % 3 === 0) VFX.dust(b.x - dir * 30, b.A.y, 3, '#c8b088'); yield 1; }
            Sound.sfx('slam'); G.addShake(8); b.armorFront = false; yield 40;
        },
        *combo(b) {
            for (let i = 0; i < 3; i++) {
                yield* B_KNIGHT.moves.face(b); const step = U.clamp(b.P.x - b.facing * 70, b.A.x0 + 40, b.A.x1 - 40); for (let k = 0; k < 10; k++) { b.x = U.lerp(b.x, step, .2); yield 1; }
                b.pose = true; b.armorFront = false; b.rig.custom([[0, { aF: 160, fF: 20, lean: -10 }], [1, { aF: 160, fF: 20, lean: -10 }]], 20, 4);
                Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 150, w: b.facing * 120, h: 150, t: 22, dmg: b.D(14), src: b, onFire: () => { b.rig.custom([[0, { aF: 30, fF: 4, lean: 24 }], [1, { aF: 30, fF: 4, lean: 24 }]], 12, 2); VFX.slash(b.x + b.facing * 60, b.A.y - 80, 80, b.facing, '#ffe7a0'); Sound.sfx('swing_h'); } }); yield 30;
            }
            b.pose = null; yield 36;
        },
        *slam(b) {
            const sx = b.x, tx = U.clamp(b.P.x, b.A.x0 + 60, b.A.x1 - 60);
            Combat.warn({ shape: 'circle', x: tx, y: b.A.y - 30, r: 130, t: 44, dmg: b.D(22), src: b, kby: -10 });
            for (let i = 1; i <= 44; i++) { const k = i / 44; b.x = U.lerp(sx, tx, U.smooth(k)); b.y = b.A.y - Math.sin(k * Math.PI) * 260; yield 1; }
            b.y = b.A.y; Sound.sfx('slam'); G.addShake(14); VFX.groundWave(tx, b.A.y, 220, '#ffe7a0');
            [-1, 1].forEach(d => Combat.shoot(b, 'wave', tx, b.A.y - 22, d * 8, 0, { absDmg: b.D(11), life: 60, r: 22, pierce: 9, col: '#ffe7a0' }));
            b.armorFront = false; yield 44;
        },
        *blink(b) {
            b.untargetable = true; VFX.burst(b.x, b.y - 80, '#ffe7a0', 22, 6, 26, 8, 1); Sound.sfx('blink'); b.hide = true; yield 24;
            b.x = U.clamp(b.P.x - b.P.facing * 90, b.A.x0 + 40, b.A.x1 - 40); b.facing = b.P.x >= b.x ? 1 : -1; b.hide = false; b.untargetable = false; VFX.burst(b.x, b.y - 80, '#ffe7a0', 22, 6, 26, 8, 1);
            Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 150, w: b.facing * 130, h: 150, t: 20, dmg: b.D(17), src: b, onFire: () => { VFX.slash(b.x + b.facing * 60, b.A.y - 80, 80, b.facing, '#ffffff'); Sound.sfx('swing_h'); } }); yield 46;
        }
    },
    draw(c, b) {
        if (b.hide) return;
        b.rig.flash = b.flash > 0 ? 2 : 0; b.rig.draw(c, b.x, b.y, b.facing);
        // The shield: always facing forward, which is why you go around it.
        c.save(); c.translate(b.x + b.facing * 34, b.y - 100); c.scale(b.facing, 1);
        Paint.poly(c, [-12, -42, 16, -40, 18, 28, 2, 52, -12, 28], b.flash > 0 ? '#ffffff' : '#e8e0c8'); c.strokeStyle = '#c9a227'; c.lineWidth = 3; c.stroke();
        Paint.disc(c, 3, 0, 9, '#ffd86b'); if (b.armorFront) Paint.glow(c, 3, 0, 40, '#ffd86b'); c.restore();
        c.fillStyle = '#c83a2a'; c.beginPath(); c.ellipse(b.x - b.facing * 4, b.y - 178, 6, 18, -b.facing * .6, 0, TAU); c.fill();
    }
};

const B_SERA = {
    id: 'seraphina', name: 'SERAPHINA', title: 'THE BLIND GODDESS OF LIGHT', hp: 7600, w: 90, h: 190, col: '#fff4c8', female: true, choice: true,
    music: 'g2sera', reward: { xp: 900, relic: 'mirror', cells: 200 },
    init: b => ({ hover: 1, tired: 0, arms: 0, kneel: 0 }),
    aim: b => ({ x: b.x, y: b.y - 110 }),
    box: b => ({ x: b.x - 44, y: b.y - 190, w: 88, h: 190 }),
    tick(b) {
        if (b.tired > 0) b.tired--;
        // Nyx's towers throw shadow over the goddess's stitched eyes: she falls, and Zero can reach her.
        if (b.shade > 0 && !b.dead) {
            b.shade--; if (b.script) b.script.wait = Math.max(b.script.wait, 2); b.hide = false; b.untargetable = false;
            b.y = U.lerp(b.y, b.A.y, .12); b.arms = 0; if (G.time % 6 === 0) VFX.add(b.x + U.rand(-40, 40), b.y - U.rand(60, 180), 0, -1, '#2a1a5a', 30, 10, 1, 0);
            if (b.shade === 0) G.say('SERAPHINA', U.pick(['Who put out my sun?', 'Light. Give me back my light.', 'It is cold. Why is it so cold?']), 120);
        }
        b.dmgTakenMult = b.shade > 0 ? 3.2 : b.tired > 0 ? 1.3 : G.player && G.player.id !== 'nyx' ? .8 : .45;
        if (b.phase >= 2 && !b.dead) G.g2blind = U.lerp(G.g2blind || 0, .95, .03);
    },
    phases: [
        { moves: ['feathers', 'radiance', 'sweep', 'radiance'], rest: 36 },
        { at: .66, moves: ['feathers2', 'radiance2', 'sweep', 'radiance2', 'feathers2'], rest: 30, say: ['SERAPHINA', 'I sewed my eyes shut so I would never see what you hide in the shadows.'], enter: function* (b) { yield* B_SERA.moves.rise(b); G.flash = .6; Sound.sfx('toll'); yield 40; } },
        { at: .33, moves: ['bell', 'skyfall', 'bell', 'whisper', 'skyfall', 'bell'], rest: 30, say: ['SERAPHINA', 'Then be blind with me. Listen, Zero. Listen to the light fall.'], enter: function* (b) { yield* B_SERA.moves.rise(b); G.say('ZERO', 'She has gone dark, Nyx. You can see in the night. Listen for the bells: left, right, or above you.', 220); yield 80; } }
    ],
    moves: {
        *rise(b) { b.tired = 0; yield* b.moveTo((b.A.x0 + b.A.x1) / 2, b.A.y - 300, 30); },
        *rest(b, x) { yield* b.moveTo(U.clamp(x, b.A.x0 + 60, b.A.x1 - 60), b.A.y, 24, U.easeIn); b.tired = 150; Sound.sfx('land'); G.addShake(4); yield 150; },
        *feathers(b, cross) {
            yield* b.moveTo(U.clamp(b.P.x + U.rand(-200, 200), b.A.x0 + 80, b.A.x1 - 80), b.A.y - 300, 24);
            for (let n = 0; n < 3; n++) {
                const srcs = cross ? [[b.A.x0 + 10, b.A.y - 280], [b.A.x1 - 10, b.A.y - 280]] : [[b.x, b.y - 150]];
                for (const [sx, sy] of srcs) { const a0 = Math.atan2(b.P.y - 34 - sy, b.P.x - sx); Combat.warn({ shape: 'cone', x: sx, y: sy, ang: a0, r: 700, spread: .8, t: 22, col: '#fff4c8' }); G.delay(22, () => { for (let i = -3; i <= 3; i++) Combat.eshoot(b, 'knife', sx, sy, a0 + i * .12, 7, b.D(11), { r: 7, life: 140, ghost: true, col: '#fff4c8' }); Sound.sfx('knife'); }); }
                yield 40;
            }
        },
        *feathers2(b) { yield* B_SERA.moves.feathers(b, true); },
        *radiance(b, decoy) {
            const xs = [b.A.pillars[0].x - 140, (b.A.x0 + b.A.x1) / 2, b.A.pillars[2].x + 140], lx = U.pick(xs), ly = b.A.y - 440;
            yield* b.moveTo(lx, ly + 150, 26); b.arms = 1;
            const decoys = decoy ? xs.filter(x => x !== lx).map(x => ({ x, y: ly })) : [];
            G.toast(decoy ? 'Only one light is true: its rim does not flicker' : 'Stand in a pillar\'s shadow', '#fff4c8');
            Sound.sfx('charge'); Combat.warn({ shape: 'light', lx, ly, decoys, t: decoy ? 130 : 150, dmg: b.D(42), src: b, unblockable: true, kb: 6, onFire: () => { G.flash = .9; Sound.sfx('bigboom'); G.addShake(10); } });
            yield decoy ? 134 : 154; b.arms = 0;
            yield* B_SERA.moves.rest(b, lx);
        },
        *radiance2(b) { yield* B_SERA.moves.radiance(b, true); },
        *sweep(b) {
            const left = b.P.x > (b.A.x0 + b.A.x1) / 2, sx = left ? b.A.x0 + 30 : b.A.x1 - 30, ex = left ? b.A.x1 - 30 : b.A.x0 + 30;
            yield* b.moveTo(sx, b.A.y, 26); b.facing = left ? 1 : -1;
            Combat.warn({ shape: 'rect', x: b.A.x0, y: b.A.y - 64, w: b.A.x1 - b.A.x0, h: 64, t: 54, dmg: b.D(24), src: b, kb: 10, col: '#fff4c8' }); Sound.sfx('warn'); yield 54;
            Sound.sfx('swing_h'); for (let i = 1; i <= 26; i++) { b.x = U.lerp(sx, ex, i / 26); if (i % 2) VFX.add(b.x, b.A.y - 30, -b.facing * 4, U.rand(-2, 0), '#fff4c8', 20, 8, 1, 0); yield 1; }
            yield* B_SERA.moves.rest(b, ex);
        },
        /* Phase 3: blind. Only sound (and optional visual hints) tells you where she comes from. */
        *bell(b) {
            const side = U.chance(.5) ? -1 : 1, x0 = side < 0 ? b.A.x0 : b.A.x1, w = (b.A.x1 - b.A.x0) * .62;
            b.untargetable = true; b.hide = true; b.x = side < 0 ? b.A.x0 - 120 : b.A.x1 + 120; b.y = b.A.y;
            Sound.sfx('toll', { pan: side, v: 1.2 }); G.g2cue = { side, t: 0 };
            Combat.warn({ shape: 'rect', x: side < 0 ? b.A.x0 : b.A.x1 - w, y: b.A.y - 150, w, h: 150, t: 78, dmg: b.D(26), src: b, kb: 12 }); yield 78;
            Sound.sfx('swing_h', { pan: side }); b.hide = false; b.untargetable = false; b.x = side < 0 ? b.A.x0 + w : b.A.x1 - w;
            b.tired = 110; for (let i = 0; i < 110; i++) { if (i % 30 === 0) Sound.at('blip', b.x, { v: .8 }); yield 1; }
        },
        *skyfall(b) {
            const x = b.P.x; Sound.sfx('trumpet', { pan: U.clamp((x - (b.A.x0 + b.A.x1) / 2) / 500, -1, 1), v: .6 }); G.g2cue = { x, t: 0 };
            Combat.warn({ shape: 'rect', x: x - 50, y: b.A.y - 600, w: 100, h: 620, t: 66, dmg: b.D(28), src: b, onFire: w => { VFX.beam(x, b.A.y - 600, Math.PI / 2, 620, 90, '#fff4c8', 16); Sound.sfx('laser'); } });
            yield 70; b.hide = false; b.untargetable = false; b.x = U.clamp(x + (U.chance(.5) ? 120 : -120), b.A.x0 + 60, b.A.x1 - 60); b.y = b.A.y; b.tired = 100; yield 100;
        },
        *whisper(b) {
            b.untargetable = true; b.hide = true;
            for (let n = 0; n < 4; n++) { const left = n % 2 === 0, sx = left ? b.A.x0 : b.A.x1, sy = b.A.y - 140, a = Math.atan2(b.P.y - 34 - sy, b.P.x - sx); Sound.sfx('screech', { pan: left ? -1 : 1, v: .5 }); G.g2cue = { side: left ? -1 : 1, t: 0 }; for (let i = -1; i <= 1; i++) Combat.eshoot(b, 'knife', sx, sy, a + i * .1, 6, b.D(10), { r: 7, life: 170, ghost: true, col: '#fff4c8' }); yield 34; }
            b.hide = false; b.untargetable = false;
        }
    },
    death: function* (b) {
        G.lockInput = true; G.warns = []; G.letterbox = 1; Music.stop(1.2); G.slowmo = 40; G.g2blind = 0;
        b.kneel = 1; yield* b.moveTo(b.x, b.A.y, 30); G.cineCam = { x: b.x, y: b.A.y - 120, zoom: 1.3 };
        G.say('SERAPHINA', 'I only wanted them never to be afraid of the dark...', 200); yield 210;
        G.flags.g2choice = null; if (!HEADLESS) UI.show('g2choice', { boss: 'seraphina' });
        yield () => G.flags.g2choice;
        UI.hide(); const spare = G.flags.g2choice === 'spare';
        Save.data.g2[spare ? 'spared' : 'killed'].seraphina = 1;
        if (spare) { Sound.sfx('checkpoint'); VFX.ring(b.x, b.y - 100, 260, '#fff4c8', 30, 12); for (let i = 0; i < 40; i++) { b.sleep = i / 40; yield 1; } }
        else { Sound.sfx('swing_h'); G.flash = 1; G.addShake(16); Sound.sfx('bigboom'); b.gone = true; yield 40; }
        G.cineCam = null; G.letterbox = 0; G.lockInput = false;
        Game.onBossDefeated(b.def);
    },
    draw(c, b) {
        if (b.hide || b.gone) return;
        const f = b.flash > 0, low = b.tired > 0 || b.kneel, flap = low ? -.5 : Math.sin(b.anim * .05) * .45, x = b.x, y = b.y, s = 1.55;
        c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#fff0c0'), x - 220, y - 340, 440, 440); c.restore();
        c.save(); c.translate(x, y - 150); c.scale(s, s);
        for (const d of [-1, 1]) for (let w = 0; w < 3; w++) {
            c.save(); c.scale(d, 1); c.rotate(-1.05 + w * .5 + flap * (w + 1) * .3 - (low ? .5 : 0));
            for (let k = 0; k < 9; k++) { c.fillStyle = f ? '#fff' : U.mix('#fffaf0', '#d8b878', k / 12); c.beginPath(); c.ellipse(18 + k * 9, 4 + k * 2, 6, 15 + k * 1.6, .3, 0, TAU); c.fill(); }
            c.restore();
        }
        c.restore();
        c.save(); c.translate(x, y); c.scale(s, s);
        const sw = Math.sin(b.anim * .03) * 4;
        Paint.poly(c, [-10, -112, 10, -112, 24, -50, 30 + sw, 0, -30 + sw, 0, -24, -50], f ? '#fff' : '#fffaf0');
        c.strokeStyle = '#d8b060'; c.lineWidth = 1.5; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-22 + i * 11 + sw * .5, -4); c.lineTo(-14 + i * 7, -70); c.stroke(); }
        const arm = b.arms ? -2.6 : low ? .5 : -.3; c.strokeStyle = '#f0e0cc'; c.lineWidth = 4; c.lineCap = 'round';
        for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 9, -104); c.lineTo(d * (9 + Math.sin(-arm) * 24), -104 + Math.cos(arm) * 24 * (arm < -1 ? -1 : 1)); c.stroke(); }
        c.strokeStyle = '#fff2d0'; c.lineWidth = 2.5; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-8 + i * 2.2, -124); c.quadraticCurveTo(-12 + i * 3 + Math.sin(b.anim * .04 + i) * 4, -96, -14 + i * 4 + Math.sin(b.anim * .03 + i) * 6, -66); c.stroke(); }
        Paint.disc(c, 0, -122, 9, '#f6e6d2');
        c.strokeStyle = '#d8a020'; c.lineWidth = 1.2; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 2, -123); c.lineTo(d * 7, -123); c.stroke(); for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(d * (2.5 + k * 1.8), -125); c.lineTo(d * (3.5 + k * 1.8), -121); c.stroke(); } }
        if (low) { c.fillStyle = 'rgba(255,220,120,.9)'; c.beginPath(); c.arc(-4, -120 + (b.anim % 24) * .5, 1.2, 0, TAU); c.fill(); }
        c.strokeStyle = '#ffe07a'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, -140, 15, 4, 0, 0, TAU); c.stroke();
        if (b.sleep) { c.fillStyle = `rgba(20,20,60,${b.sleep * .4})`; c.fillRect(-60, -180, 120, 180); }
        c.restore();
    }
};
Object.assign(BOSSES, { knight: B_KNIGHT, seraphina: B_SERA });
Object.assign(BOSS_INTRO, {
    knight: [['THE SHADOWLESS KNIGHT', 'Halt. Behind me is Her cathedral. Nothing that casts a shadow may pass.'], ['ZERO', 'Where is your shadow, knight?'], ['THE SHADOWLESS KNIGHT', 'It left me long ago. I stood in the sun too long.'], ['NYX', 'He has no shadow... I can give him one!']],
    seraphina: [['SERAPHINA', 'A child that sleeps. A child with darkness under her feet. Give her to me.'], ['ZERO', 'No.'], ['SERAPHINA', 'I am the first day. I sewed my eyes with golden thread so I would never see night.'], ['ZERO', 'Nyx. The four towers. Cover her eyes. I will hold her here.']]
});
G2.raiseTower = function (o) {
    const b = G.boss; if (!b || b.def.id !== 'seraphina' || b.intro || b.dead) { G.toast('The tower is cold. Nothing to cover yet.', '#b8a888'); return; }
    if (o.cd > G.time) { G.toast('This tower needs time to darken again', '#b8a888'); return; }
    o.cd = G.time + 900; b.shade = 420; G.warns = G.warns.filter(w => w.shape !== 'light'); G.projs = G.projs.filter(p => p.friendly);
    Sound.sfx('toll', { v: .6 }); G.flash = .2; VFX.ring(o.x, o.y - 120, 160, '#b48cff', 24, 10); G.addShake(6);
    G.say('NYX', U.pick(['Close your eyes, lady.', 'There! A little night!', 'Uncle, now!']), 90);
};

/* Mini-bosses do not end the stage: the way on simply opens. */
(function () {
    const obd = Game.onBossDefeated.bind(Game);
    Game.onBossDefeated = function (def) {
        if (!def.mini) { Save.data.cleared[def.id] = true; return obd(def); }
        const D = Save.data, R = def.reward; G.boss = null; G.bossDone = true; G.arena = null;
        Save.addXP(R.xp); D.cells += R.cells; if (R.relic && !D.relics.includes(R.relic)) { D.relics.push(R.relic); G.toast(tr('Relic') + ': ' + tr(RELICS[R.relic].name), '#ffdd33'); }
        D.cleared[def.id] = true; Sound.sfx('victory'); Music.play(G.level.theme.music, 'calm');
        G.setGates(['arena_l', 'arena_r'], true); G.level.objs.forEach(o => { if (o.kind === 'exit') o.hidden = false; }); Save.write();
        G.say('THE SHADOWLESS KNIGHT', 'At last... some shade.', 160);
    };
    const ar = Game.afterResults.bind(Game);
    Game.afterResults = function (def) {
        if (def.id === 'seraphina') { const sp = Save.data.g2.spared.seraphina; Save.data.g2.chapter = Math.max(Save.data.g2.chapter, 2); Save.write(); this.playCut(sp ? 'g2SeraSpared' : 'g2SeraKilled', () => this.toHub()); return; }
        ar(def);
    };
    // The blind phase: everything outside a small circle of light around Zero goes dark, under the HUD.
    const hd = HUD.draw.bind(HUD);
    HUD.draw = function (c) {
        if (G.g2blind > .02 && G.player) {
            const P = G.player, cam = G.cam, px = (P.x - cam.x) * cam.zoom, py = (P.y - 34 - cam.y) * cam.zoom;
            const g = c.createRadialGradient(px, py, 40, px, py, 170); g.addColorStop(0, 'rgba(2,2,6,0)'); g.addColorStop(1, `rgba(2,2,6,${G.g2blind})`);
            c.fillStyle = g; c.fillRect(0, 0, VW, VH);
            const b = G.boss; if (b && b.tired > 0 && !b.hide) { const bx = (b.x - cam.x) * cam.zoom, by = (b.y - 110 - cam.y) * cam.zoom; c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#fff4c8'), bx - 70, by - 70, 140, 140); c.restore(); }
            if (Settings.soundHints && G.g2cue && G.g2cue.t++ < 70) { const q = G.g2cue, a = 1 - q.t / 70; c.fillStyle = `rgba(255,233,160,${a})`; if (q.side) { const x = q.side > 0 ? VW - 40 : 40; c.beginPath(); c.moveTo(x, VH / 2 - 40); c.lineTo(x - q.side * 26, VH / 2); c.lineTo(x, VH / 2 + 40); c.fill(); } else if (q.x !== undefined) c.fillRect((q.x - cam.x) * cam.zoom - 2, 70, 4, 60); }
        }
        hd(c);
    };
})();
