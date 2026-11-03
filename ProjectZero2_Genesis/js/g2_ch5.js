'use strict';
/**
 * DAY FIVE, THE BEASTS: THE DESERT OF THE PACK. Nyx is fourteen, and alone. Zero is gone; his sword
 * stands in the sand with a note. The beasts here are what people are afraid of. Nyx drags the sword
 * she cannot lift. Mini-bosses: the Fire-Horned Antelope, and the Behemoth Calf, which she can lull and
 * ride. An alpha wolf she can spare. Boss: LILITH-VARGA, Queen of the Pack, who hunts with her wolves;
 * Nyx sings the whole pack to sleep. Then the Four Riders find her.
 */
Object.assign(THEMES, {
    pack: { step: 'sand', dust: '#c8a070', debris: '#8a6a40', music: 'g2desert', amb: 'desert', ambient: '#c8a890', tile: { base: '#5a3e26', mid: '#7a5634', top: '#c89a5a', edge: '#ffd890', back: '#2a1e12', backLine: '#3a2a18' } }
});
(function () {
    const B = {
        pack() {
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => { Backdrop.grad(x, [['#2a1830'], ['#7a3a3a', .4], ['#c8683a', .7], ['#e8a058', 1]]); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .6; x.drawImage(Glow.get('#ffb060'), 800, 280, 420, 420); x.globalAlpha = 1; });
            add(.1, (x, R) => { x.fillStyle = 'rgba(120,60,50,.5)'; x.beginPath(); x.moveTo(0, VH); for (let px = 0; px <= BG_W; px += 30) x.lineTo(px, 420 - 60 * U.noise1(px / 400, 5)); x.lineTo(BG_W, VH); x.fill(); });
            add(.25, (x, R) => { x.fillStyle = '#6a3a28'; x.beginPath(); x.moveTo(0, VH); for (let px = 0; px <= BG_W; px += 24) x.lineTo(px, 470 - 50 * U.noise1(px / 260, 8)); x.lineTo(BG_W, VH); x.fill(); for (let px = 0; px < BG_W; px += 300 + R() * 300) { x.fillStyle = '#4a2a1c'; x.fillRect(px, 380, 18, 100); x.fillRect(px - 30, 380, 78, 10); } });
            add(.5, (x, R) => { x.fillStyle = '#3a2016'; for (let px = 0; px < BG_W; px += 180 + R() * 200) { const h = 40 + R() * 80; x.beginPath(); x.moveTo(px, VH); x.lineTo(px + 20, 520 - h); x.lineTo(px + 40, 520 - h + 10); x.lineTo(px + 70, VH); x.fill(); } });
            return L;
        }
    };
    const bb = Backdrop.build.bind(Backdrop); Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return bb(id); };
    const ab = Atmos.build.bind(Atmos), fg = {}; Atmos.build = function (id) { if (!B[id]) return ab(id); if (fg[id]) return fg[id]; return fg[id] = U.canvas(BG_W, VH); };
    Atmos.fogCol.pack = '#c88a5a';
})();
Object.assign(SFX, { howl(o, t) { Sound.tone(o, t, { type: 'triangle', f: 380, f2: 620, sweep: .5, d: 1.1, v: .1, lp: 1800 }); } });
Object.assign(ENEMIES, {
    fearwolf: { name: 'Wolf of Fear', ai: 'fast', body: 'beast', hp: 70, dmg: 13, spd: 4.8, xp: 16, w: 50, h: 32, pack: true, col: { a: '#3a2a2a', b: '#6a4a40', g: '#ff3a2a' }, atks: [mkA(A.bite, { s: 16 }), mkA(A.pounce, { cd: 120 })] },
    eyeagle: { name: 'Many-Eyed Eagle', ai: 'flyer', body: 'moth', hp: 60, dmg: 14, spd: 3.8, xp: 18, w: 40, h: 28, col: { a: '#5a3a24', b: '#c8a070', g: '#ffe060' }, atks: [mkA(A.charge, { range: 340, spd: 12, s: 26, a: 24, cd: 130, sfx: 'screech' })] },
    redscorp: { name: 'Red Sand Scorpion', ai: 'melee', body: 'bug', hp: 110, dmg: 15, spd: 2.6, xp: 20, w: 52, h: 26, poison: true, col: { a: '#7a1a14', b: '#c83a2a', g: '#ffb040' }, atks: [mkA(A.bite, { s: 18, range: 74 }), mkA(A.shot, { proj: 'orb', col: '#c83a2a', spd: 7, cd: 120 })] },
    alpha: { name: 'Alpha of the Pack', ai: 'elite', body: 'beast', elite: true, hp: 620, dmg: 21, spd: 4.6, xp: 180, poise: 60, w: 72, h: 46, scale: 1.3, pack: true, col: { a: '#2a2020', b: '#8a7060', g: '#ffd060' }, atks: [mkA(A.pounce, { cd: 90 }), mkA(A.bite, { s: 14 }), mkA(A.summon, { cd: 400 })] }
});
(function () { // the alpha remembers whether you killed it; sleeping wolves are not prey
    const die = Enemy.prototype.die; Enemy.prototype.die = function (o) { if (this.type === 'alpha' && !this.dead && !this.passed) { Save.data.g2.alphaKilled = 1; } return die.call(this, o); };
    const upd = Enemy.prototype.update; Enemy.prototype.update = function () { if (this.type === 'alpha' && this.stun > 200 && !this.passed) { this.passed = true; G.toast('The alpha sleeps. You let it be.', '#ffd060'); Save.data.g2.alphaSpared = 1; } return upd.call(this); };
})();

/* ------------------------------ MINI-BOSSES ------------------------------ */
const B_ANTELOPE = {
    id: 'antelope', name: 'THE FIRE-HORNED ANTELOPE', title: 'IT RUNS FROM WHAT IT IS', hp: 2600, w: 120, h: 110, col: '#ff8a3a', mini: true, music: 'g2antelope', reward: { xp: 800, relic: 'ember', cells: 160 },
    init: b => ({}),
    aim: b => ({ x: b.x, y: b.y - 70 }),
    tick(b) { Light.add(b.x + b.facing * 40, b.y - 110, 200, '#ff8a3a', .8); },
    phases: [{ moves: ['charge', 'horns', 'leap'], rest: 36 }, { at: .5, moves: ['charge', 'charge', 'horns', 'leap', 'fire'], rest: 24, say: ['NYX', 'It is not attacking. It is running away from its own fire...'] }],
    moves: {
        *charge(b) { b.facing = b.P.x > b.x ? 1 : -1; const tx = b.facing > 0 ? b.A.x1 - 70 : b.A.x0 + 70; Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 100, w: tx - b.x, h: 100, t: 40, dmg: b.D(18), src: b, kb: 12 }); yield 40; while (Math.abs(b.x - tx) > 14) { b.x += b.facing * 16; if (G.time % 3 === 0) VFX.burst(b.x - b.facing * 50, b.A.y - 10, '#ff8a3a', 3, 3, 20, 4, 1); yield 1; } Sound.sfx('slam'); G.addShake(8); yield 30; },
        *horns(b) { for (let i = -2; i <= 2; i++) Combat.eshoot(b, 'fire', b.x + b.facing * 50, b.y - 110, -Math.PI / 2 + i * .35, 7, b.D(10), { r: 10, life: 90, grav: .2, col: '#ff8a3a' }); Sound.sfx('fire'); yield 50; },
        *leap(b) { const tx = U.clamp(b.P.x, b.A.x0 + 60, b.A.x1 - 60), sx = b.x; Combat.warn({ shape: 'circle', x: tx, y: b.A.y - 30, r: 130, t: 42, dmg: b.D(20), src: b }); for (let i = 1; i <= 42; i++) { const k = i / 42; b.x = U.lerp(sx, tx, k); b.y = b.A.y - Math.sin(k * Math.PI) * 240; yield 1; } b.y = b.A.y; G.addShake(10); yield 26; },
        *fire(b) { for (let i = 0; i < 6; i++) { const x = U.rand(b.A.x0 + 40, b.A.x1 - 40); Combat.warn({ shape: 'rect', x: x - 40, y: b.A.y - 140, w: 80, h: 140, t: 36, dmg: b.D(13), src: b, col: '#ff8a3a' }); yield 10; } yield 40; }
    },
    draw(c, b) {
        const f = b.flash > 0, x = b.x, y = b.y, d = b.facing, run = Math.sin(b.anim * .3);
        c.save(); c.translate(x, y); c.scale(d, 1);
        c.strokeStyle = f ? '#fff' : '#5a3420'; c.lineWidth = 8; c.lineCap = 'round'; for (const k of [-1, 1]) { c.beginPath(); c.moveTo(-34, -50); c.lineTo(-40 + run * 10 * k, 0); c.stroke(); c.beginPath(); c.moveTo(34, -50); c.lineTo(40 - run * 10 * k, 0); c.stroke(); }
        c.fillStyle = f ? '#fff' : '#8a5430'; c.beginPath(); c.ellipse(0, -62, 52, 24, 0, 0, TAU); c.fill(); c.fillStyle = f ? '#fff' : '#c8905a'; c.beginPath(); c.ellipse(0, -52, 42, 10, 0, 0, Math.PI); c.fill();
        c.fillStyle = f ? '#fff' : '#8a5430'; c.beginPath(); c.moveTo(40, -70); c.lineTo(70, -104); c.lineTo(86, -96); c.lineTo(58, -60); c.fill(); Paint.disc(c, 76, -100, 3, '#1a0a04');
        for (const k of [0, 1]) { c.strokeStyle = '#ff8a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(74 - k * 6, -108); c.quadraticCurveTo(60 - k * 6, -150, 84 - k * 10, -170); c.stroke(); Paint.glow(c, 84 - k * 10, -170, 22, '#ff8a3a'); }
        c.restore();
    }
};
const B_BEHEMOTH = {
    id: 'behemoth', name: 'THE BEHEMOTH CALF', title: 'TOO YOUNG TO KNOW ITS SIZE', hp: 2400, w: 150, h: 120, col: '#c8a070', mini: true, music: 'g2antelope', reward: { xp: 600, cells: 120 },
    init: b => ({}), aim: b => ({ x: b.x, y: b.y - 70 }),
    tick(b) { if (b.drowsy > 0 && !b.dead) { b.drowsy--; if (b.script) b.script.wait = 2; if (b.drowsy === 1) { b.hp = 1; b.beginDeath(); } } },
    phases: [{ moves: ['stomp', 'charge', 'roar'], rest: 50 }],
    moves: {
        *stomp(b) { Combat.warn({ shape: 'circle', x: b.x, y: b.A.y - 20, r: 170, t: 46, dmg: b.D(16), src: b }); yield 46; G.addShake(10); Sound.sfx('slam'); yield 30; },
        *charge(b) { b.facing = b.P.x > b.x ? 1 : -1; const tx = U.clamp(b.P.x + b.facing * 100, b.A.x0 + 80, b.A.x1 - 80); Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 110, w: tx - b.x, h: 110, t: 44, dmg: b.D(16), src: b, kb: 10 }); yield 44; while (Math.abs(b.x - tx) > 12) { b.x += b.facing * 11; yield 1; } yield 30; },
        *roar(b) { Sound.sfx('roar'); G.addShake(6); G.toast('It is scared. Sing to it.', '#c8a070'); yield 70; }
    },
    death: function* (b) { G.lockInput = true; G.letterbox = 1; Music.stop(1); G.say('NYX', b.drowsy !== undefined && b.drowsy <= 1 && b.hp <= 1 ? 'Shh... there. You can sleep now. Will you carry me?' : 'I am sorry... I did not want to hurt you.', 180); yield 190; if (b.hp <= 1) { Save.data.g2.mount = 'behemoth'; G.toast('The Behemoth Calf will carry you. Press the Dodge key to dismount... or just ride.', '#c8a070'); G.g2mount = 'behemoth'; } b.gone = true; G.letterbox = 0; G.lockInput = false; Game.onBossDefeated(b.def); },
    draw(c, b) { if (b.gone) return; G2.drawBehemoth(c, b.x, b.y, b.facing, b.flash > 0, b.anim, b.drowsy > 0); }
};
G2.drawBehemoth = function (c, x, y, d, f, t, sleepy) {
    c.save(); c.translate(x, y); c.scale(d, 1); const st = Math.sin(t * .2) * (sleepy ? 0 : 6);
    c.fillStyle = f ? '#fff' : '#6a5038'; for (const k of [-46, -20, 24, 48]) c.fillRect(k - 10, -36 + (k % 2 ? st : -st) * .3, 20, 36);
    c.fillStyle = f ? '#fff' : '#8a6a48'; c.beginPath(); c.ellipse(0, -66, 70, 40, 0, 0, TAU); c.fill(); c.fillStyle = f ? '#fff' : '#a88a60'; c.beginPath(); c.ellipse(-6, -50, 56, 16, 0, 0, Math.PI); c.fill();
    c.fillStyle = f ? '#fff' : '#7a5a3c'; c.beginPath(); c.ellipse(70, -70, 30, 24, 0, 0, TAU); c.fill(); c.fillStyle = '#e8d8b0'; c.beginPath(); c.moveTo(88, -84); c.quadraticCurveTo(110, -100, 104, -120); c.lineTo(96, -98); c.fill();
    Paint.disc(c, 80, -78, 3.5, sleepy ? '#7a5a3c' : '#1a1008'); if (sleepy) { c.fillStyle = '#e0d0ff'; c.font = '14px serif'; c.fillText('z', 96, -110 - (t % 40) * .4); }
    c.restore();
};
// Riding the calf: faster, harder to hurt, and a ram on the heavy key.
(function () {
    const upd = Player.prototype.update; Player.prototype.update = function () { const ride = this === G.player && this.id === 'nyx' && G.g2mount === 'behemoth' && !G.level.indoors && !G.boss; if (ride) { const s = this.def.speed, j = this.def.jump; this.def.speed = s * 1.55; this.def.jump = j * 1.1; upd.call(this); this.def.speed = s; this.def.jump = j; if (Input.pressed('dodge') && this.grounded && Input.down('down')) { G.g2mount = null; G.toast('You get down from the calf.', '#c8a070'); } return; } upd.call(this); };
    const dr = Player.prototype.draw; Player.prototype.draw = function (ctx) { const ride = this === G.player && this.id === 'nyx' && G.g2mount === 'behemoth' && !G.level.indoors && !G.boss; if (ride) { G2.drawBehemoth(ctx, this.x, this.y, this.facing, false, G.time, false); ctx.save(); ctx.translate(0, -58); dr.call(this, ctx); ctx.restore(); return; } dr.call(this, ctx); };
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (dmg, src) { if (this === G.player && G.g2mount === 'behemoth' && !G.boss) dmg *= .6; return hurt.call(this, dmg, src); };
    const lul = NYX_SKILLS.lullaby.run; NYX_SKILLS.lullaby.run = function* (p) { const b = G.boss; if (b && b.def.id === 'behemoth' && !b.dead && Math.abs(b.x - p.x) < 520) { b.drowsy = 150; G.say('NYX', 'Shh... shh...', 100); } yield* lul(p); };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { ll(id, cp); G.g2mount = Save.data.g2.mount && G2.dayOf(id) === 5 ? Save.data.g2.mount : null; };
})();

/* ------------------------------ BOSS: LILITH-VARGA ------------------------------ */
const B_LILITH = {
    id: 'lilith', name: 'LILITH-VARGA', title: 'QUEEN OF THE PACK', hp: 5600, w: 70, h: 160, col: '#ffd060', female: true, choice: true, music: 'g2lilith', reward: { xp: 1700, relic: 'ember', cells: 320 },
    init: b => ({ wolf: 0 }),
    aim: b => ({ x: b.x, y: b.y - (b.wolf ? 80 : 100) }),
    box: b => b.wolf ? { x: b.x - 110, y: b.y - 150, w: 220, h: 150 } : { x: b.x - 35, y: b.y - 160, w: 70, h: 160 },
    tick(b) { if (b.drowsy > 0) { b.drowsy--; b.dmgTakenMult = 1.8; if (b.script) b.script.wait = 2; } else b.dmgTakenMult = 1; },
    phases: [
        { moves: ['pack', 'lunge', 'howl', 'lunge'], rest: 32 },
        { at: .6, moves: ['maul', 'pounce', 'pack', 'tail'], rest: 26, enter: function* (b) { G.say('LILITH-VARGA', 'You run like prey. Then I will hunt like a wolf.', 180); Sound.sfx('roar'); G.flash = .5; G.addShake(16); for (let i = 0; i < 30; i++) { b.wolf = i / 30; yield 1; } b.wolf = 1; yield 30; } },
        { at: .28, moves: ['frenzy', 'pack', 'maul', 'pounce'], rest: 18, enter: function* (b) { G.say('LILITH-VARGA', 'ALL OF YOU. NOW.', 120); Sound.sfx('howl'); Sound.sfx('howl', { v: .6 }); yield 50; G.toast('Sing the whole pack to sleep', '#e0d0ff'); } }
    ],
    moves: {
        *pack(b) { const n = b.phase === 2 ? 4 : 3; for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1, e = new Enemy('fearwolf', U.clamp(b.P.x + side * U.rand(260, 380), b.A.x0 + 40, b.A.x1 - 40), b.A.y - 40, { summoned: true }); e.state = 'chase'; G.enemies.push(e); } Sound.sfx('howl', { v: .5 }); G.say('LILITH-VARGA', U.pick(['Surround her.', 'From both sides.', 'Do not let the cub run.']), 90); yield 60; },
        *lunge(b) { b.facing = b.P.x > b.x ? 1 : -1; const tx = U.clamp(b.P.x, b.A.x0 + 40, b.A.x1 - 40); Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 120, w: tx - b.x, h: 120, t: 32, dmg: b.D(17), src: b, kb: 10 }); yield 32; b.x = tx; VFX.slash(tx, b.A.y - 70, 90, b.facing, '#ffd060'); Sound.sfx('swing_h'); yield 30; },
        *howl(b) { Sound.sfx('howl'); for (let i = 0; i < 8; i++) Combat.eshoot(b, 'orb', b.x, b.y - 120, -Math.PI + i / 7 * Math.PI, 5, b.D(9), { r: 9, life: 120, col: '#ffd060' }); yield 50; },
        *maul(b) { for (let i = 0; i < 3; i++) { b.facing = b.P.x > b.x ? 1 : -1; Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 150, w: b.facing * 200, h: 150, t: 22, dmg: b.D(15), src: b, kb: 8 }); yield 24; b.x = U.clamp(b.x + b.facing * 80, b.A.x0 + 80, b.A.x1 - 80); Sound.sfx('swing_h'); } yield 30; },
        *pounce(b) { const tx = U.clamp(b.P.x, b.A.x0 + 100, b.A.x1 - 100), sx = b.x; Combat.warn({ shape: 'circle', x: tx, y: b.A.y - 40, r: 170, t: 40, dmg: b.D(22), src: b }); for (let i = 1; i <= 40; i++) { const k = i / 40; b.x = U.lerp(sx, tx, k); b.y = b.A.y - Math.sin(k * Math.PI) * 260; yield 1; } b.y = b.A.y; G.addShake(14); Sound.sfx('slam'); yield 30; },
        *tail(b) { Combat.warn({ shape: 'rect', x: b.x - 260, y: b.A.y - 60, w: 520, h: 60, t: 30, dmg: b.D(14), src: b }); yield 40; },
        *frenzy(b) { for (let i = 0; i < 4; i++) { yield* B_LILITH.moves.lunge(b); } }
    },
    death: function* (b) { b.wolf = 0; yield* G2.mercy(b, ['LILITH-VARGA', 'A cub left behind... can still become the head of the pack.']); },
    draw(c, b) {
        if (b.gone) return; const f = b.flash > 0, x = b.x, y = b.y, t = b.anim, d = b.facing, w = b.wolf || 0;
        if (w > .5) { // the great wolf
            c.save(); c.translate(x, y); c.scale(d * (1 + w * .4), 1 + w * .4); const run = Math.sin(t * .25) * 8;
            c.fillStyle = f ? '#fff' : '#2a2020'; for (const k of [-60, -30, 30, 60]) c.fillRect(k - 8, -50 + (k > 0 ? run : -run) * .2, 16, 50);
            c.beginPath(); c.ellipse(0, -76, 80, 34, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(70, -90); c.lineTo(120, -96); c.lineTo(132, -78); c.lineTo(80, -60); c.fill();
            Paint.poly(c, [84, -100, 92, -128, 100, -100], '#2a2020'); Paint.disc(c, 112, -86, 4, '#ffd060'); Paint.glow(c, 112, -86, 16, '#ffd060');
            c.strokeStyle = f ? '#fff' : '#4a3a32'; c.lineWidth = 2; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(-70 + i * 12, -104); c.lineTo(-74 + i * 12, -120 + Math.sin(t * .1 + i) * 4); c.stroke(); }
            c.fillStyle = '#2a2020'; c.beginPath(); c.moveTo(-76, -80); c.quadraticCurveTo(-130, -110 + run, -150, -70); c.lineTo(-80, -70); c.fill();
            c.restore(); return;
        }
        c.save(); c.translate(x, y); c.scale(d * 1.3, 1.3);
        c.fillStyle = f ? '#fff' : '#3a2a28'; c.beginPath(); c.moveTo(-12, -100); c.lineTo(12, -100); c.lineTo(20, -40); c.lineTo(-20, -40); c.fill();
        c.strokeStyle = f ? '#fff' : '#c8a080'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(-8, -40); c.lineTo(-12, 0); c.moveTo(8, -40); c.lineTo(14, 0); c.stroke(); c.beginPath(); c.moveTo(10, -92); c.lineTo(34, -70); c.stroke();
        c.fillStyle = '#5a4038'; for (let i = 0; i < 6; i++) Paint.poly(c, [-14 + i * 5, -98, -12 + i * 5, -60, -18 + i * 5, -64], '#6a5048');
        Paint.disc(c, 0, -112, 10, '#c8a080'); Paint.poly(c, [-10, -118, -6, -134, -2, -118], '#3a2a28'); Paint.poly(c, [2, -118, 6, -134, 10, -118], '#3a2a28');
        c.strokeStyle = '#2a1a18'; c.lineWidth = 3; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-6 + i * 1.5, -120); c.quadraticCurveTo(-16 - i * 2, -90, -20 - i * 3 + Math.sin(t * .05 + i) * 4, -60); c.stroke(); }
        Paint.disc(c, 4, -113, 2, '#ffd060'); Paint.glow(c, 4, -113, 10, '#ffd060');
        if (b.drowsy > 0) { c.fillStyle = '#e0d0ff'; c.font = '12px serif'; c.fillText('z z', 10, -140); }
        if (b.sleep) { c.fillStyle = `rgba(20,20,60,${b.sleep * .4})`; c.fillRect(-40, -150, 80, 150); }
        c.restore();
    }
};
(function () { // the whole pack falls asleep to the lullaby; the queen grows heavy
    const run = NYX_SKILLS.lullaby.run; NYX_SKILLS.lullaby.run = function* (p) { const b = G.boss; if (b && b.def.id === 'lilith' && !b.dead) { b.drowsy = 200; for (const e of G.enemies) if (!e.boss && e.def && e.def.pack) { e.stun = 360; VFX.text(e.x, e.y - e.h - 10, 'z z z', '#e0d0ff', 16, 80); } G.say('LILITH-VARGA', 'What... is that... song...', 100); } yield* run(p); };
})();
Object.assign(BOSSES, { antelope: B_ANTELOPE, behemoth: B_BEHEMOTH, lilith: B_LILITH });
Object.assign(BOSS_INTRO, {
    antelope: [['NYX', 'Its horns are burning... it is afraid of itself.'], ['NYX', 'I am alone. All right. All right. I can do this.']],
    behemoth: [['NYX', 'It is only a baby. It is scared of me.'], ['NYX', 'If I sing... maybe it will sleep.']],
    lilith: [['LILITH-VARGA', 'A cub. Alone in my sand. Where is your pack, little one?'], ['NYX', 'I do not have one.'], ['LILITH-VARGA', 'Then you are prey.'], ['NYX', 'I am not prey. I am the night.']]
});
Object.assign(LEVELS, {
    desert2() {
        const b = new LB('desert2', 330, 56, { name: 'THE DESERT OF THE PACK', sub: 'The Fifth Day: the beasts of fear', region: 'desert', theme: THEMES.pack, bg: 'pack', next: 'lilith', spawn: { x: 5, y: 36 }, weather: 'sand', noAlly: true });
        b.at(0, 36).flat(24).beacon(5, 36); b.obj('lore', 12, 36, { id: 'g2p17' });
        b.say(8, 36, 'NYX', 'His sword is too heavy. I will drag it. I will drag it all the way to him.', 220);
        b.flat(12).es([['fearwolf', b.cx - 4, b.cy - 2], ['fearwolf', b.cx - 2, b.cy - 2]]); b.upS(2).flat(10).es([['eyeagle', b.cx - 5, b.cy - 7]]).downS(2).flat(8).beacon(b.cx - 4, b.cy);
        b.say(b.cx - 2, b.cy, 'NYX', 'Hide. Sing. Do not fight what you cannot beat. Like he taught me.', 200);
        // The calf in the gully.
        let ar = b.cx, y = b.cy; b.flat(34); b.bossArena('behemoth', ar + 3, ar + 33, y, ar + 22, y, { trigger: ar + 6 }); const a1 = b.d.arena; b.flat(8);
        b.flat(12).es([['redscorp', b.cx - 6, b.cy - 2], ['eyeagle', b.cx - 3, b.cy - 7]]); b.obj('lore', b.cx - 8, b.cy, { id: 'g2p18' });
        // The alpha's den: sing it to sleep and walk past, or fight it.
        b.flat(20); b.es([['alpha', b.cx - 8, b.cy - 2], ['fearwolf', b.cx - 12, b.cy - 2], ['fearwolf', b.cx - 4, b.cy - 2]]);
        b.say(b.cx - 18, b.cy, 'NYX', 'The leader. If I hurt it, the whole pack will hate me. Maybe it can just sleep.', 200);
        b.flat(10).beacon(b.cx - 4, b.cy);
        // Hidden shard on a broken arch.
        const sx = b.cx; b.flat(18); b.plat(sx + 3, b.cy - 4, 3).plat(sx + 7, b.cy - 8, 3).plat(sx + 11, b.cy - 12, 3); b.obj('chest', sx + 12, b.cy - 12, { id: 'g2shard5', cells: 80, shard: 'beasts' }); b.obj('lore', sx + 15, b.cy, { id: 'g2p19' });
        b.es([['redscorp', sx + 10, b.cy - 2], ['eyeagle', sx + 6, b.cy - 9]]);
        b.upS(2).flat(14).beacon(b.cx - 4, b.cy).es([['fearwolf', b.cx - 4, b.cy - 2], ['fearwolf', b.cx - 6, b.cy - 2], ['redscorp', b.cx - 2, b.cy - 2]]);
        b.say(b.cx - 2, b.cy, 'NYX', 'Uncle, you said grow up. I am trying. I am really trying.', 180);
        // The antelope's flats.
        ar = b.cx; y = b.cy; b.flat(44); b.fill(ar + 40, 0, ar + 43, 55);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 40, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('antelope', ar + 3, ar + 40, y, ar + 28, y, { trigger: ar + 7 });
        b.obj('exit', ar + 37, y, { hidden: true, label: 'Follow the howling' }); b.obj('lore', ar + 33, y, { id: 'g2p20' });
        b.flat(6); const a2 = b.d.arena, d = b.done(); d.g2arenas = [a1, a2]; d.arena = a1; return d;
    },
    lilith() {
        const b = new LB('lilith', 78, 36, { name: 'THE HOLLOW OF THE PACK', sub: 'The Fifth Day: Lilith-Varga', region: 'desert', theme: THEMES.pack, bg: 'pack', spawn: { x: 4, y: 28 }, weather: 'sand', noAlly: true });
        b.at(0, 28).flat(78); b.fill(0, 0, 1, 35); b.fill(76, 0, 77, 35); b.beacon(3, 28); b.gate(8, 18, 10, 'arena_l');
        b.plat(22, 23, 5).plat(52, 23, 5);
        b.bossArena('lilith', 9, 75, 28, 50, 28, { trigger: 12 });
        return b.done();
    }
});
Object.assign(LORE, {
    g2p17: { title: 'A Note in the Sand', region: 'desert2', text: '"This world is dying because I have not finished it. I have to go. Do not look for me. Grow up. — Zero"' },
    g2p18: { title: 'The Second Book, 5:1', region: 'desert2', text: 'On the fifth day the Lamb made the beasts. It made them out of what people fear, because fear was the thing it knew best.' },
    g2p19: { title: 'On Lilith-Varga', region: 'desert2', text: 'They say she was a girl left behind in the sand, and the wolves raised her. They say she has never once let a cub be left behind since.' },
    g2p20: { title: 'Meridian Survey, Day Five', region: 'desert2', text: 'The guardian has come to the Architect of his own will. He asked for one thing: that the girl not be made to sit on the Throne. The Architect agreed. The Architect agrees to everything, for now.' }
});
Object.assign(CUTS, {
    *g2ch5open(c) {
        Music.cut('g2lul5', 'calm'); c.lb = 1; c.shot(Stage.dunes); c.fade(0, 80); yield 60;
        yield* c.say('', 'That morning Nyx woke up, and Zero was not there.', 220);
        yield* c.say('', 'Only his sword, standing in the sand. And a piece of paper.', 220);
        c.note = 1; yield* c.say('ZERO', 'This world is dying because I have not finished it. I have to go. Do not look for me. Grow up.', 300); c.note = 0;
        const g = c.actor('nyx', 600, 560, 1, 'kneel', { scale: 2 }); g.rig.S = nyxStyle(14); yield 60;
        yield* c.say('NYX', '...Uncle?', 120);
        yield* c.say('NYX', 'UNCLE!', 100);
        yield* c.say('', 'The lullaby was gone, with him. Only the wind was left.', 240);
        c.clearActors(); c.title('THE FIFTH DAY', 'BEASTS: THE DESERT OF THE PACK', 200, '#ffb050'); c.fade(0, 20); yield 210;
    },
    *g2LilithAfter(c) {
        const sp = Save.data.g2.spared.lilith; Music.cut('g2desert', 'calm'); c.lb = 1; c.shot(Stage.dunes); c.fade(0, 60);
        const g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(14); yield 40;
        yield* c.say('LILITH-VARGA', 'A cub left behind... can still become the head of the pack.', 220);
        if (sp) yield* c.say('', 'Lilith-Varga lowered her head. Her wolves lay down around Nyx, facing out, the way wolves guard their own.', 260);
        yield* c.say('', 'Four riders came over the dunes at dusk.', 180);
        const r = ['rook', 'sable', 'mirae', 'ysolde'].map((id, i) => c.actor(id, -80 - i * 70, 560, 1, 'run', { scale: 2 })); r.forEach(a => { a.vx = 5; }); yield 80; r.forEach(a => { a.vx = 0; a.rig.play('idle', 8); });
        yield* c.say('ROOK', 'We are looking for Zero. You... you are the girl he carried out of the City of Dawn.', 230);
        yield* c.say('NYX', 'He left. He told me not to look for him.', 170);
        yield* c.say('ROOK', 'He is gone, then...', 140);
        yield* c.say('ROOK', 'Then from now on, we follow you.', 200);
        yield* c.say('', 'War, Death, Plague and Famine knelt in the sand in front of a girl of fourteen.', 240);
        c.fade(1, 60); yield 66;
    }
});
Stage.dunes = (c, t, C) => { Backdrop.draw(c, 'pack', { x: 200 + t * .15, y: 0, zoom: 1 }, t); c.fillStyle = '#5a3e26'; c.fillRect(0, 560, VW, 200); c.fillStyle = 'rgba(255,220,160,.12)'; for (let i = 0; i < 20; i++) c.fillRect((i * 137 + t * 2) % VW, 540 + (i % 5) * 30, 60, 1.5);
    c.save(); c.translate(820, 560); c.rotate(.08); Gear.aocalyst(c, null, null, { owner: null }); c.restore(); if (C.note) { c.fillStyle = '#e8dcc0'; c.fillRect(780, 470, 70, 46); c.fillStyle = '#5a4a3a'; for (let i = 0; i < 5; i++) c.fillRect(786, 478 + i * 7, 56 - (i % 2) * 14, 2); } };
REGIONS[4].level = 'desert2';
LEVEL_ORDER.push('desert2', 'lilith');
Object.assign(OBJECTIVES, { desert2: 'Cross the Desert of the Pack, alone', lilith: 'Face the Queen of the Pack' });
G2.DAYS[5].open = 'g2ch5open';
G2.DAYS[5].after = () => { const D = Save.data; for (const id of ['rook', 'sable', 'mirae', 'ysolde']) if (!D.unlocked.includes(id)) D.unlocked.push(id); Save.write(); };

Object.assign(VI, {
    'THE DESERT OF THE PACK': 'HOANG MẠC BẦY ĐÀN', 'The Fifth Day: the beasts of fear': 'Ngày Thứ Năm: muông thú của nỗi sợ', 'THE HOLLOW OF THE PACK': 'HỐC CỦA BẦY SÓI', 'The Fifth Day: Lilith-Varga': 'Ngày Thứ Năm: Lilith-Varga',
    'Wolf of Fear': 'Sói Sợ Hãi', 'Many-Eyed Eagle': 'Đại Bàng Nhiều Mắt', 'Red Sand Scorpion': 'Bọ Cạp Cát Đỏ', 'Alpha of the Pack': 'Sói Đầu Đàn', 'The alpha sleeps. You let it be.': 'Con sói đầu đàn đã ngủ. Em để nó yên.',
    'THE FIRE-HORNED ANTELOPE': 'LINH DƯƠNG SỪNG LỬA', 'IT RUNS FROM WHAT IT IS': 'NÓ CHẠY TRỐN CHÍNH MÌNH', 'It is not attacking. It is running away from its own fire...': 'Nó không tấn công. Nó đang chạy trốn ngọn lửa của chính nó...',
    'THE BEHEMOTH CALF': 'BEHEMOTH CON', 'TOO YOUNG TO KNOW ITS SIZE': 'CÒN QUÁ NHỎ ĐỂ BIẾT MÌNH TO THẾ NÀO', 'It is scared. Sing to it.': 'Nó đang sợ. Hát cho nó nghe.', 'Shh... there. You can sleep now. Will you carry me?': 'Suỵt... rồi. Giờ em ngủ được rồi. Em chở chị nhé?', 'I am sorry... I did not want to hurt you.': 'Xin lỗi... chị không muốn làm em đau.',
    'The Behemoth Calf will carry you. Press the Dodge key to dismount... or just ride.': 'Behemoth Con sẽ chở em. Giữ Xuống và bấm Né để xuống... hoặc cứ cưỡi tiếp.', 'You get down from the calf.': 'Em trèo xuống khỏi Behemoth Con.', 'Shh... shh...': 'Suỵt... suỵt...',
    'LILITH-VARGA': 'LILITH-VARGA', 'QUEEN OF THE PACK': 'NỮ HOÀNG BẦY SÓI', 'You run like prey. Then I will hunt like a wolf.': 'Mày chạy như con mồi. Vậy ta sẽ săn như một con sói.', 'ALL OF YOU. NOW.': 'TẤT CẢ. NGAY.', 'Sing the whole pack to sleep': 'Hát ru cả bầy sói ngủ',
    'Surround her.': 'Vây nó lại.', 'From both sides.': 'Từ hai phía.', 'Do not let the cub run.': 'Đừng để con sói con chạy mất.', 'What... is that... song...': 'Bài hát... gì... vậy...', 'A cub left behind... can still become the head of the pack.': 'Một con sói con bị bỏ lại... vẫn có thể thành sói đầu đàn.',
    'Its horns are burning... it is afraid of itself.': 'Sừng nó đang cháy... nó sợ chính mình.', 'I am alone. All right. All right. I can do this.': 'Mình ở một mình. Được rồi. Được rồi. Mình làm được.', 'It is only a baby. It is scared of me.': 'Nó chỉ là một con non. Nó sợ mình.', 'If I sing... maybe it will sleep.': 'Nếu mình hát... có khi nó sẽ ngủ.',
    'A cub. Alone in my sand. Where is your pack, little one?': 'Một con sói con. Một mình trên cát của ta. Bầy của mày đâu, nhóc?', 'I do not have one.': 'Tôi không có.', 'Then you are prey.': 'Vậy mày là con mồi.', 'I am not prey. I am the night.': 'Tôi không phải con mồi. Tôi là đêm.',
    'His sword is too heavy. I will drag it. I will drag it all the way to him.': 'Kiếm của chú nặng quá. Em sẽ kéo nó. Em sẽ kéo nó tới tận chỗ chú.', 'Hide. Sing. Do not fight what you cannot beat. Like he taught me.': 'Trốn. Hát. Đừng đánh thứ mình không thắng nổi. Như chú đã dạy.',
    'The leader. If I hurt it, the whole pack will hate me. Maybe it can just sleep.': 'Con đầu đàn. Nếu mình làm nó đau, cả bầy sẽ ghét mình. Có khi nó chỉ cần ngủ thôi.', 'Uncle, you said grow up. I am trying. I am really trying.': 'Chú bảo em lớn lên. Em đang cố. Em cố thật mà.', 'Follow the howling': 'Đi theo tiếng hú',
    'A Note in the Sand': 'Mảnh Giấy Trên Cát', '"This world is dying because I have not finished it. I have to go. Do not look for me. Grow up. — Zero"': '"Thế giới này đang chết vì ta chưa hoàn thành nó. Ta phải đi. Đừng tìm ta. Hãy lớn lên. — Zero"',
    'The Second Book, 5:1': 'Sách Thứ Hai, 5:1', 'On the fifth day the Lamb made the beasts. It made them out of what people fear, because fear was the thing it knew best.': 'Ngày thứ năm, Con Chiên tạo ra muông thú. Nó tạo chúng từ nỗi sợ của con người, vì nỗi sợ là thứ nó hiểu rõ nhất.',
    'On Lilith-Varga': 'Về Lilith-Varga', 'They say she was a girl left behind in the sand, and the wolves raised her. They say she has never once let a cub be left behind since.': 'Người ta nói cô từng là một bé gái bị bỏ lại trên cát, và bầy sói đã nuôi cô lớn. Người ta nói từ đó cô chưa từng để một con sói con nào bị bỏ lại.',
    'Meridian Survey, Day Five': 'Báo Cáo Khảo Sát Meridian, Ngày Thứ Năm', 'The guardian has come to the Architect of his own will. He asked for one thing: that the girl not be made to sit on the Throne. The Architect agreed. The Architect agrees to everything, for now.': 'Người giám hộ đã tự mình đến với The Architect. Hắn chỉ xin một điều: đừng bắt cô bé ngồi lên Ngai. The Architect đã đồng ý. Lúc này, The Architect đồng ý mọi thứ.',
    'That morning Nyx woke up, and Zero was not there.': 'Sáng hôm đó Nyx tỉnh dậy, và Zero không còn ở đó.', 'Only his sword, standing in the sand. And a piece of paper.': 'Chỉ còn thanh kiếm của chú cắm xuống cát. Và một mảnh giấy.', 'This world is dying because I have not finished it. I have to go. Do not look for me. Grow up.': 'Thế giới này đang chết vì ta chưa hoàn thành nó. Ta phải đi. Đừng tìm ta. Hãy lớn lên.',
    '...Uncle?': '...Chú ơi?', 'UNCLE!': 'CHÚ ƠI!', 'The lullaby was gone, with him. Only the wind was left.': 'Bài ru biến mất cùng chú. Chỉ còn lại tiếng gió.', 'THE FIFTH DAY': 'NGÀY THỨ NĂM', 'BEASTS: THE DESERT OF THE PACK': 'MUÔNG THÚ: HOANG MẠC BẦY ĐÀN',
    'Lilith-Varga lowered her head. Her wolves lay down around Nyx, facing out, the way wolves guard their own.': 'Lilith-Varga cúi đầu. Bầy sói nằm xuống quanh Nyx, quay mặt ra ngoài, như cách sói canh giữ người nhà.', 'Four riders came over the dunes at dusk.': 'Bốn kỵ sĩ vượt qua đồi cát lúc hoàng hôn.',
    'ROOK': 'ROOK', 'We are looking for Zero. You... you are the girl he carried out of the City of Dawn.': 'Bọn ta đang tìm Zero. Em... em là cô bé nó bế ra khỏi Thành Phố Bình Minh.', 'He left. He told me not to look for him.': 'Chú ấy đi rồi. Chú dặn em đừng tìm chú.', 'He is gone, then...': 'Nó đi rồi à...', 'Then from now on, we follow you.': 'Vậy từ giờ, bọn ta theo em.',
    'War, Death, Plague and Famine knelt in the sand in front of a girl of fourteen.': 'Chiến Tranh, Tử Thần, Dịch Bệnh và Nạn Đói quỳ xuống cát trước một cô bé mười bốn tuổi.',
    'Cross the Desert of the Pack, alone': 'Một mình vượt qua Hoang Mạc Bầy Đàn', 'Face the Queen of the Pack': 'Đối mặt Nữ Hoàng Bầy Sói', 'The Wolf Queen': 'Nữ Hoàng Bầy Sói', 'Lilith-Varga lies in the sand. Her pack waits to see what the cub will do.': 'Lilith-Varga nằm trên cát. Bầy sói chờ xem con sói con sẽ làm gì.',
    'Tame her: offer your hand': 'Thuần phục cô: chìa tay ra', 'Finish the hunt': 'Kết thúc cuộc săn', 'You killed the alpha of her pack. She will not follow you now.': 'Em đã giết con đầu đàn của bầy cô ấy. Giờ cô ấy sẽ không theo em.',
    'Shadow Step': 'Bước Qua Bóng', 'Step into the dark and out again further on, through anything in the way. Foes you pass through fall asleep for a moment.': 'Bước vào bóng tối rồi bước ra xa hơn, xuyên qua mọi thứ cản đường. Kẻ thù em đi xuyên qua sẽ ngủ thiếp một lúc.',
    'Lullaby': 'Bài Ru', 'Sing the whole song. Every lesser foe that hears it falls asleep; the great ones grow heavy for a while.': 'Hát trọn bài. Mọi kẻ thù yếu nghe thấy đều ngủ say; kẻ mạnh cũng nặng nề một lúc.', 'CALL THE STARS': 'GỌI SAO'
});
