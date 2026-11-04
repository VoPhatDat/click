'use strict';
/**
 * DAY TWO, WATER: THE SEA OF TEARS. Nyx is eight. An ocean made of the tears Zero never finished
 * crying. Nyx swims and dives; Zero fights on the boats. Mini-boss: the Lantern Whale, whom Nyx then
 * rides. Boss: MAREVA, the Drowned Siren, who drags Zero under; Nyx dives and sings his lullaby back.
 */
Object.assign(THEMES, {
    sea: { step: 'stone', dust: '#6a7a8a', debris: '#3a4a5a', music: 'g2sea', amb: 'ice', ambient: '#9aa8c0', tile: { base: '#1e2630', mid: '#2e3a48', top: '#5a6e80', edge: '#9ad8ff', back: '#10161e', backLine: '#1c2632' } },
    wreck: { step: 'stone', dust: '#6a7a8a', debris: '#3a4a5a', music: 'g2mareva', amb: 'ice', ambient: '#8a98b8', tile: { base: '#1a2028', mid: '#28323e', top: '#4a5a6a', edge: '#9ad8ff', back: '#0c1018', backLine: '#18202a' } }
});
/* ------------------------------ BACKDROPS ------------------------------ */
(function () {
    const B = {
        sea() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#0e1424'], ['#24304a', .45], ['#4a5a72', .62], ['#1a2a3e', .64], ['#0a1424', 1]]); x.fillStyle = 'rgba(220,230,255,.6)'; for (let i = 0; i < 90; i++) { x.globalAlpha = .15 + R() * .4; x.fillRect(R() * BG_W, R() * 300, 1.4, 1.4); } x.globalAlpha = 1; x.globalCompositeOperation = 'lighter'; x.globalAlpha = .35; x.drawImage(Glow.get('#9ab8e8'), 760, 160, 380, 380); x.globalAlpha = 1; });
            add(.08, (x, R) => { for (let i = 0; i < 20; i++) { x.fillStyle = 'rgba(160,180,210,.1)'; x.beginPath(); x.ellipse(R() * BG_W, 140 + R() * 160, 200 + R() * 240, 12, 0, 0, TAU); x.fill(); } });
            add(.18, (x, R) => { x.fillStyle = '#1a2436'; x.beginPath(); x.moveTo(0, VH); for (let px = 0; px <= BG_W; px += 30) x.lineTo(px, 400 - 40 * U.noise1(px / 300, 2)); x.lineTo(BG_W, VH); x.fill(); });
            add(.34, (x, R) => { for (let px = 0; px < BG_W; px += 140 + R() * 200) { x.fillStyle = '#121a28'; const h = 60 + R() * 120; x.fillRect(px, 420 - h, 8, h); x.fillRect(px - 20, 420 - h, 48, 6); x.fillStyle = 'rgba(255,210,140,.6)'; x.fillRect(px + 2, 410 - h, 4, 6); } x.fillStyle = 'rgba(140,180,220,.25)'; for (let i = 0; i < 40; i++) x.fillRect(R() * BG_W, 430 + R() * 20, 60 + R() * 80, 1.5); });
            add(.6, (x, R) => { x.fillStyle = '#0c1220'; for (let px = 0; px < BG_W; px += 300 + R() * 200) { x.beginPath(); x.moveTo(px, VH); x.lineTo(px + 30, 470); x.lineTo(px + 70, 500); x.lineTo(px + 110, 460); x.lineTo(px + 160, VH); x.fill(); } });
            return L;
        },
        wreck() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#06080e'], ['#121c2c', .5], ['#0a1a2a', 1]]); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(120,170,220,.05)'; x.beginPath(); const px = R() * BG_W; x.moveTo(px, 0); x.lineTo(px + 60, 0); x.lineTo(px + 240, VH); x.lineTo(px + 120, VH); x.fill(); } });
            add(.2, (x, R) => { for (let px = 0; px < BG_W; px += 420) { x.fillStyle = '#0e141e'; x.beginPath(); x.moveTo(px, VH); x.quadraticCurveTo(px + 200, 300, px + 400, VH); x.fill(); x.fillRect(px + 190, 160, 10, 260); x.fillRect(px + 120, 200, 150, 6); } });
            add(.45, (x, R) => { x.fillStyle = 'rgba(200,230,255,.5)'; for (let i = 0; i < 60; i++) Paint.disc(x, R() * BG_W, 300 + R() * 300, 1 + R() * 2.5, 'rgba(200,230,255,.35)'); });
            return L;
        }
    };
    const bb = Backdrop.build.bind(Backdrop); Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return bb(id); };
    const ab = Atmos.build.bind(Atmos), fg = {}; Atmos.build = function (id) { if (!B[id]) return ab(id); if (fg[id]) return fg[id]; const c = U.canvas(BG_W, VH), x = c.getContext('2d'), R = U.mulberry(id.length * 17); for (let px = 0; px < BG_W; px += 260 + R() * 300) { x.fillStyle = 'rgba(10,20,36,.6)'; x.beginPath(); x.ellipse(px, VH + 20, 120, 60, 0, 0, TAU); x.fill(); } return fg[id] = c; };
    Atmos.fogCol.sea = '#6a8ab0';
    // Boats and the whale's back are moving platforms with their own art.
    const dd = DynArt.draw.bind(DynArt), ART = {
        boat(c, d) { c.fillStyle = '#3a2a1e'; c.beginPath(); c.moveTo(d.x - 6, d.y); c.lineTo(d.x + d.w + 6, d.y); c.lineTo(d.x + d.w - 10, d.y + 22); c.lineTo(d.x + 10, d.y + 22); c.fill(); c.fillStyle = '#6a4a2a'; c.fillRect(d.x - 4, d.y, d.w + 8, 4); c.fillStyle = '#2a1e14'; c.fillRect(d.x + d.w / 2 - 2, d.y - 60, 4, 60); c.fillStyle = 'rgba(220,210,190,.7)'; c.beginPath(); c.moveTo(d.x + d.w / 2 + 2, d.y - 58); c.lineTo(d.x + d.w / 2 + 34, d.y - 20); c.lineTo(d.x + d.w / 2 + 2, d.y - 16); c.fill(); },
        whale(c, d) { const x = d.x + d.w / 2, y = d.y + 18, k = Math.sin(G.time * .05) * 4; c.fillStyle = '#2a3a52'; c.beginPath(); c.ellipse(x, y, d.w / 2 + 60, 34, 0, Math.PI, 0); c.fill(); c.fillStyle = '#4a5e7a'; c.beginPath(); c.ellipse(x, y - 6, d.w / 2 + 40, 20, 0, Math.PI, 0); c.fill(); c.fillStyle = '#2a3a52'; c.beginPath(); c.moveTo(x - d.w / 2 - 50, y - 6); c.lineTo(x - d.w / 2 - 110, y - 40 + k); c.lineTo(x - d.w / 2 - 100, y + 6 + k); c.fill(); Paint.glow(c, x + d.w / 2 + 20, y - 60, 40, '#ffcf5a'); c.strokeStyle = '#2a3a52'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + d.w / 2 + 10, y - 20); c.quadraticCurveTo(x + d.w / 2 + 30, y - 70, x + d.w / 2 + 20, y - 60); c.stroke(); Paint.disc(c, x + d.w / 2 + 20, y - 60, 7, '#fff0b0'); Paint.disc(c, x + d.w / 2 + 30, y - 8, 4, '#e8f0ff'); }
    };
    DynArt.draw = function (c, L, cam) { const keep = L.dyn; L.dyn = keep.filter(d => !ART[d.skin]); dd(c, L, cam); L.dyn = keep; for (const d of keep) if (ART[d.skin] && d.active !== false) ART[d.skin](c, d); };
    G2.DYN_ART = ART;
})();
Object.assign(SFX, {
    splash(o, t) { Sound.burst(o, t, { ft: 'lowpass', f: 1800, d: .35, v: .18 }); Sound.burst(o, t + .05, { ft: 'highpass', f: 3000, d: .2, v: .06 }); },
    swim(o, t) { Sound.burst(o, t, { ft: 'bandpass', f: 600, d: .18, v: .08, q: 1 }); },
    bubble(o, t) { Sound.tone(o, t, { type: 'sine', f: 500, f2: 1400, sweep: .06, d: .07, v: .06 }); }
});

/* ------------------------------ ENEMIES ------------------------------ */
Object.assign(ENEMIES, {
    tearfish: { name: 'Teardrop Fish', ai: 'flyer', body: 'fish', hp: 36, dmg: 10, spd: 3.6, xp: 10, w: 28, h: 18, swarm: true, col: { a: '#6a9ac8', b: '#cfe8ff', g: '#ffffff' }, atks: [mkA(A.charge, { range: 260, spd: 10, s: 22, a: 20, cd: 90, sfx: 'swim' })] },
    jelly: { name: 'Lullaby Jellyfish', ai: 'flyer', body: 'jelly', hp: 54, dmg: 8, spd: 1.2, xp: 14, w: 34, h: 40, slows: true, col: { a: '#8a6ac8', b: '#e0d0ff', g: '#c8a8ff' }, atks: [mkA(A.ring, { col: '#c8a8ff', n: 6, range: 220, spd: 3.4, s: 50, cd: 220, sfx: 'bubble' })] },
    drowned: { name: 'Drowned Singer', ai: 'ranged', body: 'human', hp: 84, dmg: 12, spd: 1.4, xp: 18, col: { a: '#4a5a6a', b: '#9aaab8', g: '#9ad8ff', s: '#7a8a98' }, gear: 'staff', atks: [mkA(A.shot, { proj: 'orb', col: '#9ad8ff', spd: 5.5, cd: 120, sfx: 'bubble' }), mkA(A.ring, { col: '#9ad8ff', n: 8, range: 300, spd: 4, s: 46, cd: 240 })] },
    tidewarden: { name: 'Tide Warden', ai: 'elite', body: 'human', elite: true, hp: 560, dmg: 19, spd: 3, xp: 150, poise: 60, scale: 1.25, col: { a: '#2a3a4e', b: '#7a9ab8', g: '#9ad8ff', s: '#5a6a7a' }, gear: 'blade', atks: [mkA(A.swipe, { s: 16 }), mkA(A.slam, { rad: 150 }), mkA(A.ring, { col: '#9ad8ff', n: 12 })] }
});
Object.assign(Bodies, {
    fish(c, e, C) { const y = -e.h / 2, w = Math.sin(e.anim * .3) * 3; Paint.poly(c, [-14, y, 0, y - 9, 12, y, 0, y + 9], C.b); Paint.poly(c, [-12, y, -22, y - 8 + w, -22, y + 8 + w], C.a); Paint.disc(c, 6, y - 2, 2.4, '#0a1424'); Paint.glow(c, 0, y, 16, C.g); },
    jelly(c, e, C) { const y = -e.h / 2 - 6 + Math.sin(e.anim * .06) * 4; c.save(); c.globalAlpha = .8; c.fillStyle = Paint.c(C.b); c.beginPath(); c.arc(0, y, 15, Math.PI, 0); c.lineTo(15, y + 4); c.lineTo(-15, y + 4); c.fill(); c.strokeStyle = Paint.c(C.g); c.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 6, y + 4); c.quadraticCurveTo(i * 6 + Math.sin(e.anim * .1 + i) * 6, y + 18, i * 6, y + 30); c.stroke(); } c.restore(); Paint.glow(c, 0, y, 26, C.g); }
});
(function () { // jellyfish sting slows; drowned voices are sad, not angry
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (dmg, src) { const r = hurt.call(this, dmg, src); if (r && src && src.owner && src.owner.def && src.owner.def.slows) { this.slowT = 120; } return r; };
})();

/* ------------------------------ MINI-BOSS: THE LANTERN WHALE ------------------------------ */
const B_WHALE = {
    id: 'whale', name: 'THE LANTERN WHALE', title: 'A WHALE WITH A LIGHT IT CANNOT PUT OUT', hp: 3000, w: 260, h: 110, col: '#ffcf5a', mini: true, music: 'g2whale', reward: { xp: 500, relic: 'ember', cells: 110 },
    init: b => ({ beached: 0, dive: 0 }),
    aim: b => ({ x: b.x + b.facing * 110, y: b.y - 120 }),
    box: b => b.dive > 0 ? { x: b.x, y: b.y + 999, w: 1, h: 1 } : { x: b.x - 130, y: b.y - 110, w: 260, h: 110 },
    tick(b) { b.dmgTakenMult = b.beached > 0 ? 2.2 : 1; if (b.beached > 0) b.beached--; Light.add(b.x + b.facing * 110, b.y - 120, 220, '#ffcf5a', .8); },
    phases: [{ moves: ['breach', 'tail', 'spawn', 'beach'], rest: 40 }, { at: .5, moves: ['breach', 'breach2', 'tail', 'beach', 'spawn'], rest: 26, say: ['ZERO', 'The light on its head. That is what hurts it.'] }],
    moves: {
        *breach(b, twice) {
            const n = twice ? 2 : 1; for (let k = 0; k < n; k++) {
                b.dive = 1; b.untargetable = true; yield 30; const tx = U.clamp(b.P.x, b.A.x0 + 140, b.A.x1 - 140); b.x = tx; b.facing = b.P.x < (b.A.x0 + b.A.x1) / 2 ? 1 : -1;
                Combat.warn({ shape: 'circle', x: tx, y: b.A.y - 40, r: 160, t: 46, dmg: b.D(24), src: b, kby: -10 }); yield 46;
                b.dive = 0; b.untargetable = false; Sound.sfx('splash'); G.addShake(14); VFX.burst(tx, b.A.y, '#9ad8ff', 40, 9, 40, 9, 1); yield 30;
            }
        },
        *breach2(b) { yield* B_WHALE.moves.breach(b, true); },
        *tail(b) { const d = b.P.x > b.x ? 1 : -1; Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 90, w: d * 340, h: 90, t: 36, dmg: b.D(18), src: b, kb: 12 }); yield 36; Sound.sfx('slam'); G.addShake(10); yield 30; },
        *spawn(b) { Sound.sfx('roar', { v: .6 }); for (let i = 0; i < 3; i++) { const e = new Enemy('lantern', b.x + b.facing * 100, b.y - 150 - i * 30, { summoned: true }); G.enemies.push(e); yield 14; } yield 30; },
        *beach(b) { Sound.sfx('slam'); G.addShake(8); b.beached = 240; G.toast('It is stranded! Zero, now!', '#ffcf5a'); yield 240; }
    },
    draw(c, b) {
        if (b.dive > 0 && !b.dead) { c.fillStyle = 'rgba(200,230,255,.5)'; c.beginPath(); c.ellipse(b.x, b.A.y - 4, 120, 8, 0, 0, TAU); c.fill(); return; }
        const f = b.flash > 0, x = b.x, y = b.y, d = b.facing, k = Math.sin(b.anim * .05) * 4;
        c.save(); c.translate(x, y); c.scale(d, 1);
        c.fillStyle = f ? '#fff' : '#2a3a52'; c.beginPath(); c.ellipse(0, -55, 130, 56, 0, 0, TAU); c.fill(); c.fillStyle = f ? '#fff' : '#6a7e98'; c.beginPath(); c.ellipse(10, -30, 110, 26, 0, 0, Math.PI); c.fill();
        c.strokeStyle = '#1a2436'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-60 + i * 22, -14); c.lineTo(-50 + i * 22, -40); c.stroke(); }
        c.fillStyle = '#2a3a52'; c.beginPath(); c.moveTo(-120, -60); c.lineTo(-200, -110 + k); c.lineTo(-190, -20 + k); c.fill();
        Paint.disc(c, 92, -66, 7, '#e8f0ff'); Paint.disc(c, 94, -66, 3, '#0a1020');
        c.strokeStyle = '#2a3a52'; c.lineWidth = 5; c.beginPath(); c.moveTo(70, -104); c.quadraticCurveTo(110, -170, 112, -120); c.stroke();
        Paint.glow(c, 112, -120, b.beached > 0 ? 70 : 50, '#ffcf5a'); Paint.disc(c, 112, -120, 11, '#fff0b0');
        c.restore();
    }
};

/* ------------------------------ BOSS: MAREVA ------------------------------ */
const B_MAREVA = {
    id: 'mareva', name: 'MAREVA', title: 'THE DROWNED SIREN', hp: 9000, w: 80, h: 160, col: '#9ad8ff', female: true, choice: true, music: 'g2mareva', reward: { xp: 1100, relic: 'bell', cells: 240 },
    init: b => ({ song: 0, sub: 0 }),
    aim: b => ({ x: b.x, y: b.y - 90 }),
    box: b => b.sub > 0 ? { x: b.x, y: b.y + 999, w: 1, h: 1 } : { x: b.x - 40, y: b.y - 160, w: 80, h: 160 },
    tick(b) {
        const surf = b.A.y - 190 - (G.g2tide || 0); if (!b.dead && !b.kneel && b.sub <= 0) b.y = U.lerp(b.y, surf + 60, .08);
        if (b.stun > 0) { b.stun--; b.dmgTakenMult = 2.4; if (b.script) b.script.wait = 2; } else b.dmgTakenMult = G.ally && G.ally.captured ? 0 : 1;
        if (G.ally && G.ally.captured) { b.untargetable = true; const z = G.ally; z.x = ((b.A.x0 + b.A.x1) / 2); z.y = b.A.y - 10; z.vx = z.vy = 0; } else if (!b.transition && !b.intro && !b.dead) b.untargetable = b.sub > 0;
        if (b.siren > 0 && G.player && !G2Night.nyxHidden()) { b.siren--; G.player.vx += U.sign(b.x - G.player.x) * .55; }
        Light.add(b.x, b.y - 100, 240, '#9ad8ff', .7);
    },
    phases: [
        { moves: ['wave', 'tears', 'siren', 'dive', 'tears'], rest: 36 },
        { at: .62, moves: ['tears', 'wave', 'siren'], rest: 60, enter: function* (b) {
            Music.setState('boss'); G.say('MAREVA', 'Sink with me, tired man. You have so many tears left.', 200); Sound.sfx('roar', { v: .5 });
            for (let i = 0; i < 60; i++) { G.g2tide = i * 2; yield 1; }
            if (G.ally) { G.ally.captured = true; VFX.burst(G.ally.x, G.ally.y - 30, '#9ad8ff', 30, 6, 30, 7, 1); Sound.sfx('splash'); }
            G.say('ZERO', 'Nyx... the song. Sing it.', 200); yield 40; G.toast('Dive to Zero and Hum his lullaby', '#e0d0ff');
        } },
        { at: .3, moves: ['beat'], rest: 0, enter: function* (b) { G.g2tide = 60; G.say('MAREVA', 'Then dance to my song, little one. Every beat, the sea comes back.', 200); yield 60; } }
    ],
    moves: {
        *wave(b) { const fromL = b.P.x > ((b.A.x0 + b.A.x1) / 2), sx = fromL ? b.A.x0 : b.A.x1, d = fromL ? 1 : -1, wy = b.A.y - 190 - (G.g2tide || 0) - 70;
            Combat.warn({ shape: 'rect', x: sx, y: wy, w: d * (b.A.x1 - b.A.x0), h: 110, t: 50, dmg: b.D(16), src: b, kb: 8 }); Sound.sfx('splash', { v: .5 }); yield 60; },
        *tears(b) { for (let i = 0; i < 6; i++) { const x = U.rand(b.A.x0 + 60, b.A.x1 - 60); b.fallRock(x, 40, b.D(12), 'orb', 14); yield 8; } yield 40; },
        *siren(b) { G.say('MAREVA', U.pick(['Come closer. Come down.', 'Listen. It is so quiet below.', 'Rest. Just rest.']), 120); b.siren = 130; yield 120;
            Combat.warn({ shape: 'circle', x: b.x, y: b.y - 80, r: 120, t: 30, dmg: b.D(18), src: b }); yield 40; },
        *dive(b) { b.sub = 1; Sound.sfx('splash'); yield 50; b.x = U.clamp(b.P.x + U.rand(-160, 160), b.A.x0 + 80, b.A.x1 - 80); Combat.warn({ shape: 'rect', x: b.x - 70, y: b.A.y - 420, w: 140, h: 420, t: 34, dmg: b.D(20), src: b, kby: -8 }); yield 34; b.sub = 0; VFX.burst(b.x, b.y - 60, '#9ad8ff', 36, 8, 30, 8, 1); yield 30; },
        // The last phase follows her song: a column falls on every beat, the tide swells every bar.
        *beat(b) {
            const bt = Music.beatTicks('g2mareva') * 1.5, cols = 6, w = (b.A.x1 - b.A.x0) / cols;
            for (let k = 0; k < 8; k++) {
                const pc = U.clamp(Math.floor((b.P.x - b.A.x0) / w), 0, cols - 1), xs = [b.A.x0 + pc * w]; let o = U.randi(0, cols - 1); if (o === pc) o = (o + 3) % cols; xs.push(b.A.x0 + o * w);
                for (const x of xs) Combat.warn({ shape: 'rect', x, y: b.A.y - 460, w, h: 460, t: Math.round(bt), dmg: b.D(14), src: b, col: '#9ad8ff' });
                if (k % 4 === 3) { G.g2tide = 140; G.delay(Math.round(bt), () => { G.g2tide = 60; }); }
                yield Math.round(bt);
            }
        }
    },
    death: function* (b) { G.ally && (G.ally.captured = false); yield* G2.mercy(b, ['MAREVA', 'The song is over... is it?']); },
    draw(c, b) {
        if (b.gone) return; if (b.sub > 0) { c.fillStyle = 'rgba(200,230,255,.4)'; c.beginPath(); c.ellipse(b.x, b.y - 20, 50, 6, 0, 0, TAU); c.fill(); return; }
        const f = b.flash > 0, x = b.x, y = b.y, t = b.anim, low = b.kneel || b.stun > 0;
        c.save(); c.translate(x, y); c.scale(1.4, 1.4);
        // tail
        c.fillStyle = f ? '#fff' : '#3a6a8a'; c.beginPath(); c.moveTo(-14, -60); c.quadraticCurveTo(-24 + Math.sin(t * .05) * 8, -10, 6 + Math.sin(t * .05) * 10, 10); c.lineTo(18 + Math.sin(t * .05) * 10, 0); c.quadraticCurveTo(10, -30, 14, -60); c.fill();
        c.fillStyle = f ? '#fff' : '#6aa8c8'; Paint.poly(c, [6 + Math.sin(t * .05) * 10, 6, -8 + Math.sin(t * .05) * 14, 26, 30 + Math.sin(t * .05) * 10, 22], c.fillStyle);
        // torso
        c.fillStyle = f ? '#fff' : '#c8d8e0'; c.beginPath(); c.ellipse(0, -76, 13, 22, 0, 0, TAU); c.fill();
        // arms
        c.strokeStyle = '#b8c8d0'; c.lineWidth = 4; c.lineCap = 'round'; const a = low ? .6 : Math.sin(t * .04) * .5 - .9; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 9, -92); c.lineTo(d * (14 + Math.cos(a) * 14), -92 + Math.sin(a) * 18); c.lineTo(d * (16 + Math.cos(a) * 24), -92 + Math.sin(a) * 30); c.stroke(); }
        // head and floating hair
        Paint.disc(c, 0, -106, 10, '#d8e4ea'); c.strokeStyle = f ? '#fff' : '#2a4a6a'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-8 + i * 2, -112); c.bezierCurveTo(-14 + i * 3 + Math.sin(t * .04 + i) * 10, -130, -20 + i * 5 + Math.sin(t * .03 + i) * 16, -96, -30 + i * 7 + Math.sin(t * .05 + i) * 12, -72); c.stroke(); }
        c.strokeStyle = '#2a3a4a'; c.lineWidth = 1.2; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 2, -106); c.lineTo(d * 6, -106); c.stroke(); }
        c.fillStyle = 'rgba(200,240,255,.9)'; c.fillRect(-4, -103 + (t % 30) * .4, 1.4, 3); c.fillRect(4, -101 + (t % 26) * .4, 1.4, 3);
        if (!low) { c.strokeStyle = 'rgba(200,240,255,.5)'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -98, 18 + i * 10 + (t * .6 % 10), -2.4, -.7); c.stroke(); } }
        if (b.sleep) { c.fillStyle = `rgba(20,20,60,${b.sleep * .4})`; c.fillRect(-40, -140, 80, 170); }
        c.restore();
    }
};
// Zero held under the sea: drawn bound in bubbles, and freed only by the lullaby.
G2.freeZero = function () {
    const z = G.ally; if (!z || !z.captured) return; z.captured = false; z.vy = -6; Sound.sfx('checkpoint'); VFX.ring(z.x, z.y - 30, 200, '#e0d0ff', 30, 10);
    const b = G.boss; if (b && !b.dead) { b.stun = 420; b.untargetable = false; G.say('MAREVA', 'That song... who taught you that song?', 180); Music.setState('critical'); }
    G.say('NYX', 'Uncle! I sang it! I sang it like you do!', 160); Save.ach && Save.ach('g2_sing');
};
(function () {
    const zb = G2.zeroBrain; G2.zeroBrain = function (z) { if (z.captured) return {}; return zb(z); };
    const run = NYX_SKILLS.hum.run; NYX_SKILLS.hum.run = function* (p) { const z = G.ally; if (z && z.captured && Math.hypot(z.x - p.x, z.y - p.y) < 160) G2.freeZero(); yield* run(p); };
    const dr = Player.prototype.draw; Player.prototype.draw = function (ctx) { dr.call(this, ctx); if (this.isAlly && this.captured) { ctx.save(); ctx.strokeStyle = 'rgba(160,210,255,.8)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(this.x, this.y - 34, 30 + i * 6 + Math.sin(G.time * .1 + i) * 3, 0, TAU); ctx.stroke(); } ctx.restore(); if (G.time % 20 === 0) VFX.add(this.x + U.rand(-10, 10), this.y - 50, 0, -1.2, '#cfeaff', 40, 3, 1, 0); } };
})();
Object.assign(BOSSES, { whale: B_WHALE, mareva: B_MAREVA });
Object.assign(BOSS_INTRO, {
    whale: [['ZERO', 'There is a light on its head. It cannot put it out, so it cannot sleep.'], ['NYX', 'Poor whale... Uncle, do not hurt it too much.']],
    mareva: [['MAREVA', 'A child who sleeps. And the man who never cried all his tears.'], ['MAREVA', 'This sea is his. Every wave. I only sing what it remembers.'], ['ZERO', 'Stay on the planks, Nyx. Whatever she sings.'], ['NYX', 'Uncle... why is this sea so sad?']]
});

/* ------------------------------ LEVELS ------------------------------ */
Object.assign(LEVELS, {
    sea() {
        const b = new LB('sea', 330, 60, { name: 'THE SEA OF TEARS', sub: 'The Second Day: the water that would not stop', region: 'ice', theme: THEMES.sea, bg: 'sea', next: 'mareva', spawn: { x: 5, y: 30 }, weather: 'rain' });
        const W = [], water = (x0, x1, y) => W.push({ x0: x0 * TILE, x1: x1 * TILE, y: y * TILE });
        b.at(0, 30).flat(24).beacon(5, 30); b.obj('npc', 16, 30, { id: 'fisher' });
        b.say(6, 30, 'ZERO', 'The water is salt. Every drop of it. Stay close to the surface, Nyx: jump to swim up, and come up for air.', 260);
        b.say(18, 30, 'NYX', 'Uncle, why is this sea so sad?', 160);
        // First cove: swim across, fish and jellyfish.
        let x = b.cx; b.step(8).flat(22); water(x, x + 22, 30); b.es([['tearfish', x + 6, 33], ['tearfish', x + 9, 34], ['jelly', x + 15, 32]]); b.step(-8).flat(12); b.obj('lore', b.cx - 6, b.cy, { id: 'g2p5' });
        b.es([['drowned', b.cx - 3, b.cy - 2]]); b.flat(8).beacon(b.cx - 4, b.cy);
        // The boats: Zero fights on deck, Nyx keeps her head above water.
        x = b.cx; b.step(12).flat(44); water(x, x + 44, 30); b.mover(x + 3, 29, 5, x + 15, 29, 320, { skin: 'boat' }); b.mover(x + 20, 29, 5, x + 32, 29, 300, { skin: 'boat' }); b.plat(x + 36, 28, 5);
        b.es([['drowned', x + 37, 26], ['jelly', x + 10, 34], ['tearfish', x + 22, 36], ['tearfish', x + 26, 38], ['tidewarden', x + 38, 26]]);
        b.say(x + 2, 30, 'ZERO', 'Onto the boat. I will clear the deck.', 160);
        b.step(-12).flat(10).beacon(b.cx - 5, b.cy);
        // The drowned cave: dive under the rock, a shard lies on the bottom.
        x = b.cx; b.step(10).flat(30); water(x, x + 30, 30); b.fill(x + 8, 22, x + 20, 32); b.obj('chest', x + 14, 40, { id: 'g2shard2', cells: 50, shard: 'water' }); b.obj('lore', x + 24, 40, { id: 'g2p6' });
        b.es([['jelly', x + 5, 36], ['tearfish', x + 22, 37]]); b.say(x + 1, 30, 'NYX', 'There is something shining down there. I can hold my breath! I can!', 180);
        b.step(-10).flat(14); b.obj('lore', b.cx - 4, b.cy, { id: 'g2p7' });
        // The shore at night: Nyx sees Zero cry for the first time.
        b.trig(b.cx - 8, b.cy - 12, 2, 13, () => { if (!Save.data.g2.seen.zeroWeak) { Save.data.g2.seen.zeroWeak = 1; G2.cut('g2zeroWeak'); } });
        b.flat(12).beacon(b.cx - 6, b.cy);
        b.say(b.cx - 2, b.cy, 'NYX', 'Uncle... when you bow your head, the sea comes up.', 170); b.say(b.cx + 3, b.cy, 'ZERO', '...Let us keep moving.', 120);
        // The Lantern Whale's lagoon.
        const ar = b.cx, y = b.cy; b.flat(46); b.fill(ar + 42, 0, ar + 45, 59);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 42, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('whale', ar + 3, ar + 42, y, ar + 30, y, { trigger: ar + 7 });
        b.obj('exit', ar + 38, y, { hidden: true, label: 'Ride the whale' }); b.obj('lore', ar + 34, y, { id: 'g2p8' });
        b.flat(6); const d = b.done(); d.g2water = W; return d;
    },
    mareva() {
        const b = new LB('mareva', 210, 46, { name: 'THE DROWNED CHAPEL', sub: 'The Second Day: Mareva', region: 'ice', theme: THEMES.wreck, bg: 'wreck', spawn: { x: 4, y: 26 }, weather: 'rain' });
        const W = [];
        // Riding the whale across the open sea.
        b.at(0, 26).flat(14).beacon(4, 26); b.step(14).flat(110); W.push({ x0: 14 * TILE, x1: 124 * TILE, y: 27 * TILE });
        b.mover(15, 26, 6, 116, 26, 2400, { skin: 'whale' });
        b.es([['tearfish', 40, 22], ['tearfish', 44, 20], ['jelly', 60, 21], ['tearfish', 78, 22], ['tearfish', 82, 19], ['jelly', 96, 22], ['tearfish', 104, 21]]);
        b.say(15, 26, 'NYX', 'It is carrying us! Thank you, whale!', 160); b.say(70, 26, 'ZERO', 'Keep low. Something is singing ahead.', 160);
        b.step(-14).flat(10).beacon(b.cx - 4, b.cy);
        // The chapel: planks over a rising tide.
        const x0 = b.cx, y = 34; b.at(x0, y).flat(64); b.fill(x0 + 62, 0, x0 + 66, 45); W.push({ x0: x0 * TILE, x1: (x0 + 62) * TILE, y: 28 * TILE });
        [[4, 27, 6], [14, 25, 5], [24, 27, 6], [34, 23, 5], [44, 27, 6], [54, 25, 5], [9, 21, 4], [29, 19, 4], [49, 21, 4]].forEach(([px, py, l]) => b.plat(x0 + px, py, l));
        b.bossArena('mareva', x0 + 1, x0 + 61, y, x0 + 40, y, { trigger: x0 + 4 });
        const d = b.done(); d.g2water = W; return d;
    }
});
Object.assign(LORE, {
    g2p5: { title: 'The Second Book, 2:1', region: 'sea', text: 'On the second day the Lamb made the waters, and the waters were salt. For it had not finished weeping, and what it did not weep it poured into the world.' },
    g2p6: { title: 'A Fisherman’s Log', region: 'sea', text: 'Nets come up full of light that will not keep. The tide comes in when he is sad. I do not know who he is. I only know the tide.' },
    g2p7: { title: 'On Mareva', region: 'sea', text: 'She sang to sailors so they would not be alone when they drowned. Then she drowned too, and kept singing, and no one was left to be kept company but her.' },
    g2p8: { title: 'Meridian Survey, Day Two', region: 'sea', text: 'Subject continues to sleep normally. Guardian unit shows grief response under salt exposure. Recommend we wait. The tide will make him tired. Tired things give in.' }
});
Object.assign(NPCS, { fisher: { name: 'OLD FISHERMAN', look: '#6a7a8a', lines: [['OLD FISHERMAN', 'Careful in the water, girl. It remembers things.'], ['NYX', 'What does it remember?'], ['OLD FISHERMAN', 'Whatever the tall one is sorry for.']] } });
Object.assign(CUTS, {
    *g2ch2open(c) {
        Music.cut('g2sea', 'calm'); c.lb = 1; c.shot(Stage.seaShore); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(8); yield 40;
        yield* c.say('', 'Two years passed on the first day. The girl grew. The city slept a little, once a night.', 240);
        yield* c.say('NYX', 'Uncle! The sea! It tastes like crying.', 170);
        yield* c.say('ZERO', '...', 80);
        yield* c.say('NYX', 'Why is it so sad?', 120);
        yield* c.say('', 'Zero did not answer.', 140);
        c.clearActors(); c.title('THE SECOND DAY', 'WATER: THE SEA OF TEARS', 200, '#9ad8ff'); c.fade(0, 20); yield 210;
    },
    *g2zeroWeak(c) {
        Music.cut('g2lul2', 'calm'); c.lb = 1; c.shot(Stage.seaNight); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 700, 560, -1, 'kneel', { scale: 2 })); yield 60;
        yield* c.say('', 'That night Nyx woke and found Zero alone at the edge of the water.', 230);
        c.tide = 0; for (let i = 0; i < 90; i++) { c.tide = i / 90; yield 1; }
        yield* c.say('', 'Each time he bowed his head, the sea rose a little higher.', 220);
        yield* c.say('', 'It was the first time she saw that he could be weak.', 220);
        const g = c.actor('nyx', 420, 560, 1, 'run', { scale: 2 }); g.rig.S = nyxStyle(8); g.vx = 2; yield 90; g.vx = 0; g.rig.play('idle');
        yield* c.say('NYX', 'Uncle? I can sing it too. The one you sing.', 160);
        yield* c.say('ZERO', 'Go back to sleep, Nyx.', 140);
        c.fade(1, 50); yield 56;
    },
    *g2MarevaAfter(c) {
        const sp = Save.data.g2.spared.mareva; Music.cut(sp ? 'g2lul2' : 'g2vesper', 'calm'); c.lb = 1; c.shot(Stage.seaNight); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(8); yield 40;
        if (sp) {
            yield* c.say('MAREVA', 'Little one. Where did you learn that song?', 170);
            yield* c.say('NYX', 'He sings it every night.', 140);
            yield* c.say('MAREVA', 'So he knows how to sing a lullaby... for someone else.', 230);
            yield* c.say('', 'Mareva sank back into the sea, singing. The tide went out, and stayed out.', 220);
        } else yield* c.say('', 'The song stopped. The sea lay flat and silent, and very cold.', 220);
        yield* c.say('ZERO', 'Nyx.', 80);
        yield* c.say('ZERO', 'Thank you.', 160);
        yield* c.say('', 'It was the first time he had said it to her.', 200);
        c.fade(1, 50); yield 56;
    }
});
Stage.seaShore = (c, t) => { Backdrop.draw(c, 'sea', { x: 300 + t * .2, y: 0, zoom: 1 }, t); c.fillStyle = '#1e2630'; c.fillRect(0, 560, VW, 200); c.fillStyle = 'rgba(160,200,240,.3)'; for (let i = 0; i < 8; i++) c.fillRect(0, 590 + i * 14 + Math.sin(t * .03 + i) * 3, VW, 2); };
Stage.seaNight = (c, t, C) => { Backdrop.draw(c, 'sea', { x: 600, y: 0, zoom: 1 }, t); c.fillStyle = 'rgba(8,10,30,.45)'; c.fillRect(0, 0, VW, VH); const wl = 600 - (C.tide || 0) * 40; c.fillStyle = '#1a222c'; c.fillRect(0, 560, VW, 200); c.fillStyle = 'rgba(40,80,130,.6)'; c.fillRect(0, wl, VW, VH - wl); c.strokeStyle = 'rgba(200,230,255,.6)'; c.beginPath(); for (let x = 0; x <= VW; x += 20) c.lineTo(x, wl + Math.sin(x * .02 + t * .05) * 4); c.stroke(); };
REGIONS[1].level = 'sea';
LEVEL_ORDER.push('sea', 'mareva');
Object.assign(OBJECTIVES, { sea: 'Cross the Sea of Tears', mareva: 'Bring the Second Day its quiet' });
G2.DAYS[2].open = 'g2ch2open';

Object.assign(VI, {
    'THE SEA OF TEARS': 'BIỂN LỆ', 'The Second Day: the water that would not stop': 'Ngày Thứ Hai: dòng nước không ngừng chảy', 'THE DROWNED CHAPEL': 'NHÀ NGUYỆN CHÌM', 'The Second Day: Mareva': 'Ngày Thứ Hai: Mareva',
    'Teardrop Fish': 'Cá Nước Mắt', 'Lullaby Jellyfish': 'Thủy Mẫu Ru Ngủ', 'Drowned Singer': 'Người Chết Đuối Hát', 'Tide Warden': 'Vệ Binh Thủy Triều',
    'THE LANTERN WHALE': 'CÁ VOI ĐÈN LỒNG', 'A WHALE WITH A LIGHT IT CANNOT PUT OUT': 'CON CÁ VOI KHÔNG TẮT ĐƯỢC ÁNH ĐÈN', 'MAREVA': 'MAREVA', 'THE DROWNED SIREN': 'NÀNG TIÊN CÁ CHẾT ĐUỐI',
    'It is stranded! Zero, now!': 'Nó mắc cạn rồi! Chú Zero, ngay bây giờ!', 'The light on its head. That is what hurts it.': 'Ngọn đèn trên đầu nó. Đó là thứ làm nó đau.',
    'Sink with me, tired man. You have so many tears left.': 'Chìm xuống cùng ta đi, kẻ mệt mỏi. Ngươi còn biết bao nhiêu nước mắt.', 'Nyx... the song. Sing it.': 'Nyx... bài hát. Hát đi.', 'Dive to Zero and Hum his lullaby': 'Lặn xuống chỗ Zero và ngân nga bài ru của chú',
    'Then dance to my song, little one. Every beat, the sea comes back.': 'Vậy thì nhảy theo bài hát của ta đi, nhóc. Mỗi nhịp, biển lại về.', 'Come closer. Come down.': 'Lại gần đây. Xuống đây.', 'Listen. It is so quiet below.': 'Nghe xem. Dưới này yên lắm.', 'Rest. Just rest.': 'Nghỉ đi. Chỉ nghỉ thôi.',
    'The song is over... is it?': 'Bài hát hết rồi... phải không?', 'That song... who taught you that song?': 'Bài hát đó... ai dạy nhóc bài hát đó?', 'Uncle! I sang it! I sang it like you do!': 'Chú ơi! Em hát được rồi! Em hát giống chú!',
    'There is a light on its head. It cannot put it out, so it cannot sleep.': 'Trên đầu nó có một ngọn đèn. Nó không tắt được, nên nó không ngủ được.', 'Poor whale... Uncle, do not hurt it too much.': 'Tội nghiệp cá voi... Chú ơi, đừng làm nó đau quá.',
    'A child who sleeps. And the man who never cried all his tears.': 'Một đứa trẻ biết ngủ. Và kẻ chưa bao giờ khóc hết nước mắt.', 'This sea is his. Every wave. I only sing what it remembers.': 'Biển này là của hắn. Từng con sóng. Ta chỉ hát những gì nó nhớ.', 'Stay on the planks, Nyx. Whatever she sings.': 'Đứng trên ván, Nyx. Dù cô ta hát gì.', 'Uncle... why is this sea so sad?': 'Chú ơi... sao biển này buồn vậy?',
    'The water is salt. Every drop of it. Stay close to the surface, Nyx: jump to swim up, and come up for air.': 'Nước mặn. Từng giọt một. Ở gần mặt nước, Nyx: nhảy để bơi lên, và nhớ ngoi lên thở.', 'Uncle, why is this sea so sad?': 'Chú ơi, sao biển này buồn vậy?',
    'Onto the boat. I will clear the deck.': 'Lên thuyền. Ta dọn boong.', 'There is something shining down there. I can hold my breath! I can!': 'Dưới kia có gì lấp lánh. Em nín thở được! Em làm được!', 'Uncle... when you bow your head, the sea comes up.': 'Chú ơi... mỗi lần chú cúi đầu, biển lại dâng lên.', '...Let us keep moving.': '...Đi tiếp thôi.',
    'Ride the whale': 'Cưỡi cá voi', 'It is carrying us! Thank you, whale!': 'Nó chở mình đi! Cảm ơn cá voi!', 'Keep low. Something is singing ahead.': 'Cúi thấp xuống. Phía trước có tiếng hát.',
    'The Second Book, 2:1': 'Sách Thứ Hai, 2:1', 'On the second day the Lamb made the waters, and the waters were salt. For it had not finished weeping, and what it did not weep it poured into the world.': 'Ngày thứ hai, Con Chiên tạo ra nước, và nước thì mặn. Vì nó chưa khóc xong, và những gì nó chưa khóc, nó đổ cả vào thế giới.',
    'A Fisherman’s Log': 'Nhật Ký Người Đánh Cá', 'Nets come up full of light that will not keep. The tide comes in when he is sad. I do not know who he is. I only know the tide.': 'Lưới kéo lên đầy ánh sáng không giữ được lâu. Thủy triều lên khi người ấy buồn. Tôi không biết người ấy là ai. Tôi chỉ biết thủy triều.',
    'On Mareva': 'Về Mareva', 'She sang to sailors so they would not be alone when they drowned. Then she drowned too, and kept singing, and no one was left to be kept company but her.': 'Cô hát cho thủy thủ nghe để họ không cô đơn khi chết đuối. Rồi cô cũng chết đuối, và vẫn hát, và chẳng còn ai cần bầu bạn ngoài chính cô.',
    'Meridian Survey, Day Two': 'Báo Cáo Khảo Sát Meridian, Ngày Thứ Hai', 'Subject continues to sleep normally. Guardian unit shows grief response under salt exposure. Recommend we wait. The tide will make him tired. Tired things give in.': 'Đối tượng vẫn ngủ bình thường. Đơn vị giám hộ có phản ứng đau buồn khi tiếp xúc nước mặn. Đề nghị chờ. Thủy triều sẽ làm hắn mệt. Thứ gì mệt rồi cũng sẽ khuất phục.',
    'OLD FISHERMAN': 'ÔNG LÃO ĐÁNH CÁ', 'Careful in the water, girl. It remembers things.': 'Cẩn thận dưới nước, cháu. Nó nhớ nhiều thứ lắm.', 'What does it remember?': 'Nó nhớ gì ạ?', 'Whatever the tall one is sorry for.': 'Những gì cái người cao lớn kia còn ân hận.',
    'Two years passed on the first day. The girl grew. The city slept a little, once a night.': 'Hai năm trôi qua trên ngày thứ nhất. Cô bé lớn lên. Thành phố ngủ được một chút, mỗi đêm một lần.', 'Uncle! The sea! It tastes like crying.': 'Chú ơi! Biển kìa! Nó có vị như nước mắt.', '...': '...', 'Why is it so sad?': 'Sao nó buồn vậy?', 'Zero did not answer.': 'Zero không trả lời.',
    'THE SECOND DAY': 'NGÀY THỨ HAI', 'WATER: THE SEA OF TEARS': 'NƯỚC: BIỂN LỆ',
    'That night Nyx woke and found Zero alone at the edge of the water.': 'Đêm đó Nyx thức dậy và thấy Zero ngồi một mình bên mép nước.', 'Each time he bowed his head, the sea rose a little higher.': 'Mỗi lần chú cúi đầu, nước biển lại dâng cao thêm một chút.', 'It was the first time she saw that he could be weak.': 'Đó là lần đầu tiên cô thấy chú cũng có lúc yếu đuối.',
    'Uncle? I can sing it too. The one you sing.': 'Chú ơi? Em cũng hát được. Bài chú hay hát ấy.', 'Go back to sleep, Nyx.': 'Ngủ tiếp đi, Nyx.',
    'Little one. Where did you learn that song?': 'Nhóc biết hát bài đó ở đâu?', 'He sings it every night.': 'Chú ấy hát mỗi tối.', 'So he knows how to sing a lullaby... for someone else.': 'Vậy ra hắn biết hát ru... cho người khác.',
    'Mareva sank back into the sea, singing. The tide went out, and stayed out.': 'Mareva chìm lại xuống biển, vừa đi vừa hát. Thủy triều rút, và không lên lại nữa.', 'The song stopped. The sea lay flat and silent, and very cold.': 'Bài hát tắt. Biển nằm phẳng lặng, im phăng phắc, và rất lạnh.', 'Nyx.': 'Nyx.', 'Thank you.': 'Cảm ơn em.', 'It was the first time he had said it to her.': 'Đó là lần đầu tiên chú nói câu đó với cô.',
    '"Will she drown us again?"': '"Cô ấy có dìm mình nữa không?"', 'Mareva floats, her song broken. The tide waits for an answer.': 'Mareva nổi lềnh bềnh, bài hát vỡ vụn. Thủy triều chờ câu trả lời.', '"Let her go back to the sea, and sing."': '"Để cô ấy về với biển, và hát."', '"End the song."': '"Kết thúc bài hát đi."',
    'Cross the Sea of Tears': 'Vượt Biển Lệ', 'Bring the Second Day its quiet': 'Mang sự yên lặng về cho Ngày Thứ Hai', 'Breath': 'Hơi thở'
});

/* While Mareva holds Zero under the water, say plainly what to do, every frame: a marker over him and
   the key to press, brighter once Nyx is close enough to sing. (The toast alone was easy to miss, and
   Zero sitting still in his bubble looked like a bug.) */
(function () {
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) {
        hd(c); const z = G.ally, N = G.player; if (!z || !z.captured || !N || Game.state !== 'play' || G.letterbox) return;
        const cam = G.cam, sx = (z.x - cam.x) * cam.zoom, sy = (z.y - 90 - cam.y) * cam.zoom, near = Math.hypot(z.x - N.x, z.y - N.y) < 160, key = this.keyName(Settings.binds.skill3), pulse = .6 + .4 * Math.sin(G.time * .15);
        const x = U.clamp(sx, 60, VW - 60), y = U.clamp(sy, 120, VH - 140);
        c.save(); c.textAlign = 'center'; c.globalAlpha = pulse; c.fillStyle = near ? '#ffffff' : '#e0d0ff';
        c.beginPath(); c.moveTo(x - 14, y - 22); c.lineTo(x + 14, y - 22); c.lineTo(x, y); c.closePath(); c.fill();
        c.globalAlpha = 1; c.font = 'bold 16px "Palatino Linotype", "Times New Roman", serif'; c.lineWidth = 4; c.strokeStyle = 'rgba(5,10,25,.9)';
        const t = near ? tr('Press') + ' [' + key + '] ' + tr('to hum his lullaby!') : tr('Zero is trapped. Dive down to him, then press') + ' [' + key + ']';
        c.strokeText(t, x, y - 32); c.fillText(t, x, y - 32); c.restore();
    };
})();
Object.assign(VI, { 'Press': 'Bấm', 'to hum his lullaby!': 'để hát ru cho chú!', 'Zero is trapped. Dive down to him, then press': 'Zero bị nhốt. Lặn xuống cạnh chú rồi bấm', 'Bare Hands': 'Tay Không', 'Nothing to hold yet.': 'Chưa cầm được gì.', 'Dive to Zero and Hum his lullaby': 'Lặn xuống chỗ Zero và Ngân Nga bài hát ru của chú' });
