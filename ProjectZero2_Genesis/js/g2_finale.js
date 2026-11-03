'use strict';
/**
 * DAY SEVEN, REST: THE EMPTY THRONE, and the last battle "THE SEVENTH DAY" (section 4B).
 *   Day Seven   the Shore of the Seventh Day; Zero's Shadow; the last Shard of Peace
 *   Act 0       the stair of glass through six clouds; those Nyx spared bow, the slain are broken stone
 *   Act 1       Nyx against Vesper: every hit pushes her toward the Throne; the Perfect Mirror;
 *               the rain of spears, the ash wings, the prayer refused (seven beads)
 *   Act 2       Vesper's memory, played as Vesper: run through the burning temple, shield the child
 *   Act 3       the Architect rises: the whole party, the spared come to help, four broken laws
 *   Act 4       the choice; endings 5A, 5B, 5C (Zero's Weariness: hold, do not strike), 5D (NG+)
 */
Object.assign(THEMES, {
    shore7: { step: 'stone', dust: '#9a9aa8', debris: '#5a5a6a', music: 'g2throne', amb: 'void', ambient: '#b0a8b8', tile: { base: '#2a2630', mid: '#3a3644', top: '#8a8098', edge: '#ffffff', back: '#141218', backLine: '#201e26' } },
    throne7: { step: 'stone', dust: '#b0a8a0', debris: '#6a6058', music: 'g2act0', amb: 'void', ambient: '#c0b0b0', tile: { base: '#24202a', mid: '#3a3442', top: '#d8d0e8', edge: '#ffe8c8', back: '#100e14', backLine: '#1a1820' } },
    memory7: { step: 'stone', dust: '#8a6a4a', debris: '#5a4030', music: 'g2act2', amb: 'void', ambient: '#c8a888', tile: { base: '#3a2a1e', mid: '#4a3626', top: '#8a6a4a', edge: '#ffb060', back: '#1a120c', backLine: '#2a1e14' } },
    arch7: { step: 'stone', dust: '#9a9ab0', debris: '#5a5a70', music: 'g2act3', amb: 'void', ambient: '#a8a0b8', tile: { base: '#14141c', mid: '#24242e', top: '#5a5a70', edge: '#ffe8a0', back: '#08080c', backLine: '#14141a' } }
});
(function () {
    const B = {
        shore7() { const L = [], add = (p, fn) => L.push({ img: Backdrop.layer(fn), par: p, parY: 0 }); add(0, (x, R) => { Backdrop.grad(x, [['#0c0a14'], ['#2a2236', .5], ['#5a4258', .8], ['#8a5a5a', 1]]); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .5; x.drawImage(Glow.get('#ff9a70'), 500, 380, 500, 300); x.globalAlpha = 1; }); add(.15, (x, R) => { x.fillStyle = 'rgba(40,30,50,.8)'; x.beginPath(); x.moveTo(0, VH); for (let px = 0; px <= BG_W; px += 30) x.lineTo(px, 480 - 30 * U.noise1(px / 300, 4)); x.lineTo(BG_W, VH); x.fill(); }); add(.4, (x, R) => { for (let px = 0; px < BG_W; px += 260 + R() * 200) { x.fillStyle = '#1a1620'; x.fillRect(px, 420, 14, 140); x.fillRect(px - 20, 420, 54, 8); } }); return L; },
        throne7() { const L = [], add = (p, fn) => L.push({ img: Backdrop.layer(fn), par: p, parY: 0 }); add(0, (x, R) => { Backdrop.grad(x, [['#06040a'], ['#1a1020', .5], ['#2a1418', 1]]); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .9; x.fillStyle = '#000'; x.globalCompositeOperation = 'source-over'; Paint.disc(x, 900, 240, 120, '#050305'); x.strokeStyle = '#ff6a2a'; x.lineWidth = 6; x.beginPath(); x.arc(900, 240, 122, 0, TAU); x.stroke(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .5; x.drawImage(Glow.get('#ff6a2a'), 720, 60, 360, 360); x.globalAlpha = 1; }); add(.1, (x, R) => { for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(220,210,230,${.05 + i * .02})`; x.beginPath(); x.ellipse(R() * BG_W, 520 - i * 60, 600, 30, 0, 0, TAU); x.fill(); } }); return L; },
        memory7() { const L = [], add = (p, fn) => L.push({ img: Backdrop.layer(fn), par: p, parY: 0 }); add(0, (x, R) => { Backdrop.grad(x, [['#2a1a10'], ['#6a3a1e', .6], ['#a85a2a', 1]]); }); add(.25, (x, R) => { for (let px = 0; px < BG_W; px += 200) { x.fillStyle = '#2a1a10'; x.fillRect(px + 40, 100, 50, 460); x.fillRect(px + 20, 90, 90, 20); x.fillStyle = 'rgba(255,140,60,.4)'; x.fillRect(px + 50, 120, 6, 400); } }); return L; },
        arch7() { const L = [], add = (p, fn) => L.push({ img: Backdrop.layer(fn), par: p, parY: 0 }); add(0, (x, R) => { Backdrop.grad(x, [['#020204'], ['#0c0a18', .5], ['#04040a', 1]]); x.strokeStyle = 'rgba(255,232,160,.1)'; for (let i = 0; i < 60; i++) { x.lineWidth = 1 + R() * 2; x.beginPath(); x.arc(R() * BG_W, R() * VH, 20 + R() * 260, 0, TAU); x.stroke(); } }); return L; }
    };
    const bb = Backdrop.build.bind(Backdrop); Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return bb(id); };
    const ab = Atmos.build.bind(Atmos), fg = {}; Atmos.build = function (id) { if (!B[id]) return ab(id); if (fg[id]) return fg[id]; return fg[id] = U.canvas(BG_W, VH); };
})();

/* ------------------------------ VESPER, PLAYABLE ------------------------------ */
Object.assign(Gear, {
    brokenspear(c) { c.fillStyle = Paint.c('#c8a040'); c.fillRect(-2, -20, 4, 70); Paint.poly(c, [-4, 50, 4, 50, 0, 70], '#fff0c8'); Paint.glow(c, 0, 56, 16, '#ffe8a0'); c.strokeStyle = Paint.c('#5a3a1a'); c.lineWidth = 1; c.beginPath(); c.moveTo(-3, 10); c.lineTo(3, 14); c.stroke(); },
    censer(c) { c.strokeStyle = Paint.c('#8a6a3a'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 18); c.stroke(); Paint.disc(c, 0, 24, 7, '#c8a040'); Paint.glow(c, 0, 24, 18, '#ff8a3a'); }
});
const vesperStyle = () => { const S = Object.assign({}, CHARS.sable.style); S.col = { armor: '#e8e0d8', armor2: '#c8b8a8', dark: '#3a2a2a', skin: '#e8d8c8', boot: '#5a4a3a', glow: '#ffb060', glove: '#e8d8c8' }; S.weaponF = Gear.brokenspear; S.weaponB = null;
    S.backGear = (c, J) => { const n = J.neck; for (let i = 0; i < 3; i++) for (const d of [-1, 1]) { c.save(); c.translate(n.x, n.y + 6); c.rotate(d * (.6 + i * .35) - Math.PI / 2 * 0); c.fillStyle = Paint.c(i < 1 ? '#f4efe8' : i < 2 ? '#c8b8a8' : '#3a2a24'); c.beginPath(); c.ellipse(d * 18, -10 - i * 4, 22 - i * 3, 6, d * (.4 + i * .3), 0, TAU); c.fill(); c.restore(); } };
    S.headGear = (c, J, St) => { const h = J.head; Paint.disc(c, h.x, h.y, 8, '#e8d8c8'); c.fillStyle = Paint.c('#c8a040'); c.fillRect(h.x - 2, h.y - 6, 10, 6); c.fillStyle = Paint.c('#ff3a1a'); c.fillRect(h.x + 4, h.y - 2, 3, 2); c.strokeStyle = Paint.c('#ffe07a'); c.lineWidth = 1.5; c.beginPath(); c.ellipse(h.x, h.y - 13, 8, 2.4, 0, 0, TAU); c.stroke(); };
    return S; };
CHARS.vesper = {
    id: 'vesper', name: 'VESPER', role: 'THE BURNED ANGEL', title: 'Vesper', hp: 150, atk: 23, speed: 5.2, jump: 13.5, energy: 100,
    dodge: { spd: 18, frames: 12, inv: 13, cd: 26, air: true, clip: 'dodge', after: true, col: '#ffb060' },
    bars: { POWER: 4, DURABILITY: 3, MOBILITY: 5, RANGE: 4 },
    bio: 'An angel who once asked to lie on the altar instead of a nameless child, and was burned for asking. She is not cruel. She only believes that someone always has to give themselves up.', line: '"Someone has to sit on the Throne."', weakness: 'Fragile when she is grounded.',
    passive: { name: 'Ash Rebirth', desc: 'Flight: hold Jump in the air to fly for 4 seconds. The first time she falls in a fight, she rises from her ashes at half health.' },
    style: vesperStyle(),
    skills: {
        s1: { name: 'Rain of Spears', desc: 'Spears of light fall in a line in front of you.', cost: 30, cd: 420, col: '#ffe8a0', *run(p) { for (let i = 0; i < 7; i++) { const x = p.x + p.facing * (70 + i * 60); Combat.warn({ shape: 'rect', x: x - 16, y: p.y - 300, w: 32, h: 300, t: 10 + i * 3, col: '#ffe8a0' }); G.delay(10 + i * 3, () => { for (const t of Combat.targetsNear(x, p.y - 60, 60)) Combat.hit(p, t, { dmg: 1.6, kb: 3, stag: 20, col: '#ffe8a0', light: true }); VFX.burst(x, p.y - 10, '#ffe8a0', 8, 4, 18, 4, 1); }); } Sound.sfx('volt'); yield 16; } },
        s2: { name: 'The Refused Prayer', desc: 'A ring of fire around you: it burns whatever stands close.', cost: 25, cd: 360, col: '#ff8a3a', *run(p) { VFX.ring(p.x, p.y - 34, 150, '#ff8a3a', 24, 10); Sound.sfx('fire'); for (const t of Combat.targetsNear(p.x, p.y - 34, 150)) Combat.hit(p, t, { dmg: 2, kb: 9, stag: 30, col: '#ff8a3a' }); yield 14; } },
        s3: { name: 'Ash Wings', desc: 'Your wings cut both sides of you at once.', cost: 20, cd: 240, col: '#c8b8a8', *run(p) { for (const d of [-1, 1]) VFX.slash(p.x + d * 60, p.y - 40, 90, d, '#e8d8c8'); for (const t of Combat.targetsNear(p.x, p.y - 34, 130)) Combat.hit(p, t, { dmg: 1.8, kb: 7, stag: 26, col: '#e8d8c8' }); Sound.sfx('swing_h'); yield 12; } }
    },
    ult: { name: 'THE SECOND HEAVEN', col: '#ffffff', *run(p) { Combat.banner(p, 'THE SECOND HEAVEN', '#ffffff', 34); p.inv = 140; G.flash = .6; yield 20; for (let i = 0; i < 60; i++) { const ts = Combat.targetsNear(p.x, p.y - 40, 800); if (ts.length) { const t = ts[i % ts.length]; Combat.hit(p, t, { dmg: .9, kb: 1, stag: 6, col: '#ffffff', light: true }); VFX.hit(t.x, t.y - 40, '#ffffff', 3); } yield 2; } } },
    upgrades: [{ id: 'v_hp', name: 'Unburned', desc: '+15% max HP.', cost: 1, mod: { hp: .15 } }, { id: 'v_atk', name: 'Bright Spear', desc: '+15% attack.', cost: 1, mod: { atk: .15 } }],
    weapons: [
        { id: 'spear', name: 'The Broken Spear of Light', desc: 'Thrown, then called back.', gear: 'brokenspear', len: 70, ranged: true, rate: 22, shot: { kind: 'bolt', spd: 16, dmg: 1.3, r: 6, len: 30, life: 50, col: '#ffe8a0', pierce: 3 } },
        { id: 'wings', name: 'Ash Wings', desc: 'The wings themselves, cutting both ways.', gear: null, len: 60, atks: chain3([AT('down', 5, 4, 8, [-60, -70, 130, 64], .8, { col: '#e8d8c8' }), AT('up', 5, 4, 8, [-60, -74, 130, 68], .8, { col: '#e8d8c8' }), AT('slam', 9, 5, 14, [-70, -90, 150, 90], 1.5, { col: '#ffffff', kb: 8, stag: 30, hit: 'hit_h' })]) },
        { id: 'censer', name: 'The Holy Censer', desc: 'Sparks of fire at range.', gear: 'censer', len: 20, ranged: true, rate: 12, shot: { kind: 'spark', spd: 11, dmg: .7, r: 7, life: 60, col: '#ff8a3a' } }
    ]
};
WEAPONS2.vesper = CHARS.vesper.weapons;
if (!CHAR_ORDER.includes('vesper')) CHAR_ORDER.push('vesper');
(function () { // Vesper flies while Jump is held in the air, four seconds at a time
    const upd = Player.prototype.update; Player.prototype.update = function () { upd.call(this); if (this.id !== 'vesper' || this !== G.player) return; if (this.grounded) this.fly = 240; else if (Input.down('jump') && this.vy > -1 && (this.fly || 0) > 0) { this.fly--; this.vy = Math.min(this.vy, -.2) * .5; if (G.time % 4 === 0) VFX.add(this.x + U.rand(-14, 14), this.y - 30, 0, 1, '#ffb060', 30, 3, 1, 0); } };
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (dmg, src) { const r = hurt.call(this, dmg, src); if (this.id === 'vesper' && this.hp <= 0 && !this.reborn && G.boss) { this.reborn = true; this.hp = Math.round(this.maxHp / 2); this.state = 'move'; this.inv = 120; VFX.ring(this.x, this.y - 34, 160, '#ffb060', 26, 10); G.toast('Ash Rebirth', '#ffb060'); } return r; };
})();

/* ------------------------------ DAY SEVEN: THE SHORE ------------------------------ */
Object.assign(ENEMIES, {
    mirrorself: { name: 'Your Own Reflection', ai: 'elite', body: 'human', hp: 260, dmg: 17, spd: 4, xp: 60, poise: 40, col: { a: '#4a4a5a', b: '#c8c8e0', g: '#b48cff', s: '#9a9ab0' }, gear: 'blade', atks: [mkA(A.swipe, { s: 14 }), mkA(A.charge, { spd: 12 })] },
    oldseraph: { name: 'Soldier of the Old Heaven', ai: 'melee', body: 'angel', hp: 150, dmg: 16, spd: 3, xp: 30, w: 34, h: 50, flyer: true, col: { a: '#a89a80', b: '#e8e0d0', g: '#ff8a3a' }, atks: [mkA(A.charge, { range: 300, spd: 12, s: 26, a: 24, cd: 120 })] },
    bead: { name: 'Rosary Bead', ai: 'static', body: 'wisp', hp: 90, dmg: 0, spd: 0, xp: 0, w: 30, h: 30, flyer: true, col: { a: '#8a5a2a', b: '#ffd8a0', g: '#ff8a3a' }, atks: [] }
});
const B_ZSHADOW = {
    id: 'zshadow', name: 'ZERO’S SHADOW', title: 'WHAT HE NEVER LET HIMSELF BE', hp: 5200, w: 60, h: 160, col: '#3a0a1a', mini: true, music: 'g2zshadow', reward: { xp: 1400, cells: 260 },
    init: b => { const r = new Rig(Object.assign({}, CHARS.zero.style, { scale: 1.4, col: { armor: '#0a0a10', armor2: '#1a1a24', dark: '#000', skin: '#000', boot: '#3a0a1a', glow: '#ff1a3a' }, weaponF: Gear.aocalyst })); r.owner = { form: 'wrath' }; r.play('idle', 0); return { rig: r }; },
    aim: b => ({ x: b.x, y: b.y - 90 }), box: b => ({ x: b.x - 30, y: b.y - 160, w: 60, h: 160 }),
    tick(b) { const R = b.rig; R.ground = true; R.phase += Math.abs(b.vx) / 10; if (!b.pose) R.play(Math.abs(b.vx) > .5 ? 'run' : 'idle', 6); b.vx *= .8; },
    phases: [{ moves: ['slash', 'dash', 'wave'], rest: 26 }, { at: .5, moves: ['slash', 'dash', 'wave', 'judgment'], rest: 18, say: ['ZERO’S SHADOW', 'I am every day he did not rest.'] }],
    moves: {
        *slash(b) { b.facing = b.P.x > b.x ? 1 : -1; for (let i = 0; i < 3; i++) { Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 140, w: b.facing * 140, h: 140, t: 18, dmg: b.D(15), src: b }); b.rig.custom([[0, { aF: 160, fF: 20 }], [1, { aF: 30, fF: 4 }]], 18, 3); yield 22; b.x += b.facing * 40; } yield 24; },
        *dash(b) { b.facing = b.P.x > b.x ? 1 : -1; const tx = U.clamp(b.P.x + b.facing * 100, b.A.x0 + 40, b.A.x1 - 40); Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 100, w: tx - b.x, h: 100, t: 26, dmg: b.D(18), src: b }); yield 26; b.x = tx; b.vx = b.facing * 8; Sound.sfx('dash'); yield 24; },
        *wave(b) { [-1, 1].forEach(d => Combat.shoot(b, 'wave', b.x, b.A.y - 22, d * 8, 0, { absDmg: b.D(12), life: 70, r: 22, pierce: 9, col: '#ff1a3a' })); Sound.sfx('slam'); yield 40; },
        *judgment(b) { for (let i = 0; i < 7; i++) { const x = b.A.x0 + 40 + i * (b.A.x1 - b.A.x0 - 80) / 6; Combat.warn({ shape: 'rect', x: x - 30, y: b.A.y - 400, w: 60, h: 400, t: 24 + i * 6, dmg: b.D(14), src: b, col: '#ff1a3a' }); } yield 80; }
    },
    draw(c, b) { b.rig.flash = b.flash > 0 ? 2 : 0; c.save(); c.globalAlpha = .9; b.rig.draw(c, b.x, b.y, b.facing); c.restore(); Paint.glow(c, b.x, b.y - 120, 30, '#ff1a3a'); }
};
Object.assign(BOSSES, { zshadow: B_ZSHADOW });
Object.assign(BOSS_INTRO, { zshadow: [['ZERO’S SHADOW', 'You never had a shadow, girl. He never let himself have one either. Here it is.'], ['ZERO', 'That is mine. Let me—'], ['NYX', 'No. We do this together.']] });

/* ------------------------------ THE SEVENTH DAY ------------------------------ */
G2.F = { act: () => Save.data.g2.act || 0, setAct(n) { Save.data.g2.act = n; Save.write(); } };
// Act 1: Vesper pushes Nyx back toward the Throne; the Perfect Mirror answers your most used moves.
const B_VESPER = {
    id: 'vesper', name: 'VESPER', title: 'THE BURNED ANGEL', hp: 9000, w: 70, h: 170, col: '#ffb060', female: true, music: 'g2act1', reward: { xp: 2600, cells: 0 },
    init: b => ({ mirror: G2.topMoves(), ring: 0 }),
    aim: b => ({ x: b.x, y: b.y - 100 }), box: b => ({ x: b.x - 35, y: b.y - 170, w: 70, h: 170 }),
    tick(b) {
        Light.add(b.x, b.y - 110, 260, '#ffb060', .7); if (G.time % 3 === 0) VFX.add(b.x + U.rand(-60, 60), b.y - U.rand(0, 120), 0, -U.rand(1, 2.5), '#ff8a3a', 50, 2.4, 1, 0);
        const P = G.player, tx = b.A.x0 + 70; if (P && !b.dead && P.x < tx && P.state !== 'dead') { G.say('VESPER', 'There. Sit. It is not so hard.', 120); P.inv = 0; P.defyT = 0; P.hurt(99999, { absDmg: 99999 }); }
        if (b.ring > 0 && !b.dead) { b.ring = Math.max(60, b.ring - 1.1); const P = G.player, d = Math.hypot(P.x - b.rx, P.y - 34 - b.ry); if (d > b.ring && G.time % 20 === 0) P.hurt(b.D(10), { owner: b, absDmg: b.D(10) }); if (!G.enemies.some(e => e.type === 'bead' && !e.dead)) { b.ring = 0; b.hp = Math.min(b.hp, 1); b.untargetable = false; b.prayerDone = true; } else if (b.ring <= 61) { G.flash = .6; P.hurt(b.D(40), { owner: b, absDmg: b.D(40) }); b.ring = 0; b.untargetable = false; for (const e of G.enemies) if (e.type === 'bead') e.dead = true; } }
    },
    phases: [
        { moves: ['spears', 'thrust', 'mirror', 'spears'], rest: 26 },
        { at: .66, moves: ['thrust', 'ash', 'spears', 'mirror'], rest: 22, enter: function* (b) { G.say('VESPER', 'I asked to lie on the altar instead of him. They burned me for asking.', 230); yield 80; G.g2ash = 1; G.toast('Ash: only her eyes and your blade', '#ffb060'); } },
        { at: .33, moves: ['prayer'], rest: 30, enter: function* (b) { G.g2ash = 0; G.say('VESPER', 'This world needs a day of rest. And you are that day.', 220); yield 70; G.say('NYX', 'I am not a tool for finishing anyone!', 160); yield 60; } }
    ],
    moves: {
        // Spears of light fall in a pattern from the Book; light cannot pass through Nyx's night.
        *spears(b) { const P = b.P, pat = U.pick([[0, 2, 4, 6, 8], [1, 3, 5, 7], [0, 1, 4, 5, 8], [2, 3, 6, 7]]), w = (b.A.x1 - b.A.x0) / 9; G.say('VESPER', U.pick(['Rain.', 'Kneel.', 'And the spears came down like a psalm.']), 80);
            for (const i of pat) Combat.warn({ shape: 'rect', x: b.A.x0 + i * w, y: b.A.y - 460, w, h: 460, t: 50, dmg: b.D(17), src: b, col: '#ffe8a0', lightSpear: true }); yield 64; },
        *thrust(b) { b.facing = b.P.x > b.x ? 1 : -1; Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 120, w: b.facing * 260, h: 120, t: 28, dmg: b.D(16), src: b, kb: 14, push: true }); yield 40; },
        *mirror(b) { const k = b.mirror[0]; G.say('VESPER', tr('I know your') + ' ' + tr(G2.ACT_NAME[k] || k) + '. ' + tr('I have watched you use it the whole way here.'), 170); b.reflect = 220; yield 60; },
        *ash(b) { for (let i = 0; i < 3; i++) { yield* B_VESPER.moves.thrust(b); } },
        // The prayer refused: a shrinking ring of fire; break the seven beads before it closes.
        *prayer(b) { if (b.prayed) { yield 60; return; } b.prayed = true; b.untargetable = true; yield* b.moveTo((b.A.x0 + b.A.x1) / 2, b.A.y, 30); b.kneelPray = 1; b.rx = b.x; b.ry = b.A.y - 120; b.ring = 760;
            for (let i = 0; i < 7; i++) { const a = -Math.PI + (i + .5) / 7 * Math.PI, e = new Enemy('bead', b.x + Math.cos(a) * 340, b.A.y - 120 + Math.sin(a) * 200, { summoned: true }); e.noGrav = true; G.enemies.push(e); }
            G.toast('Break the seven beads before the ring closes', '#ff8a3a'); yield () => !b.ring; b.kneelPray = 0; if (b.prayerDone) { b.hp = 1; b.beginDeath(); } yield 40; }
    },
    death: function* (b) {
        G.lockInput = true; G.warns = []; G.letterbox = 1; Music.stop(1); G.slowmo = 40; b.kneel = 1; yield* b.moveTo(b.x, b.A.y, 30); G.cineCam = { x: b.x, y: b.A.y - 120, zoom: 1.3 };
        G.say('NYX', '...', 80); yield 90; G.player.rig.custom([[0, { aF: 170, fF: 20 }], [1, { aF: 170, fF: 20 }]], 60, 30); yield 70;
        G.say('', tr('Nyx raised the sword...'), 120); yield 130; G.say('', tr('...and stopped.'), 120); yield 120;
        G2.shatter(); yield 50; G.cineCam = null; G.letterbox = 0; G.lockInput = false; b.gone = true;
        G2.F.setAct(2); Music.stop(.2); Game.loadLevel('memory');
    },
    draw(c, b) {
        if (b.gone) return; const f = b.flash > 0, x = b.x, y = b.y, t = b.anim, low = b.kneel || b.kneelPray;
        c.save(); c.translate(x, y); c.scale(1.4, 1.4);
        for (const d of [-1, 1]) for (let w = 0; w < 3; w++) { c.save(); c.translate(0, -100); c.scale(d, 1); c.rotate(-1 + w * .45 + Math.sin(t * .04) * .2 - (low ? .5 : 0)); const burnt = w >= 1 && d > 0 || w === 2;
            for (let k = 0; k < 7; k++) { c.fillStyle = f ? '#fff' : burnt ? (k % 2 ? '#3a2a24' : '#e8dcc8') : U.mix('#fffaf0', '#c8b8a8', k / 9); if (burnt) { c.strokeStyle = '#e8dcc8'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(14 + k * 9, 0); c.lineTo(18 + k * 9, 18 + k * 2); c.stroke(); } else { c.beginPath(); c.ellipse(16 + k * 9, 4 + k * 2, 5, 13 + k, .3, 0, TAU); c.fill(); } } c.restore(); }
        c.fillStyle = f ? '#fff' : '#3a2a24'; c.beginPath(); c.moveTo(-12, -100); c.lineTo(12, -100); c.lineTo(28, 0); c.lineTo(-28, 0); c.fill(); for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(255,${120 + i * 10},40,.7)`; c.fillRect(-24 + i * 6, -4 - (t * .8 + i * 9) % 30, 2, 4); }
        c.strokeStyle = '#e8d8c8'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(8, -94); c.lineTo(low ? 14 : 30, low ? -70 : -110); c.stroke(); c.fillStyle = '#ffe8a0'; c.save(); c.translate(low ? 14 : 30, low ? -70 : -110); c.rotate(low ? 1.2 : -.5); c.fillRect(-2, -30, 4, 50); c.restore();
        Paint.disc(c, 0, -112, 9, '#e8d8c8'); c.fillStyle = '#c8a040'; c.beginPath(); c.moveTo(-9, -118); c.lineTo(9, -118); c.lineTo(2, -106); c.lineTo(-9, -104); c.fill(); Paint.disc(c, 4, -112, 2, '#ff2a1a'); Paint.glow(c, 4, -112, 12, '#ff2a1a');
        c.strokeStyle = '#ffe07a'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -128, 11, 3, 0, 0, TAU); c.stroke();
        c.restore();
        if (b.ring > 0) { c.save(); c.strokeStyle = '#ff6a2a'; c.lineWidth = 8; c.globalAlpha = .8; c.beginPath(); c.arc(b.rx, b.ry, b.ring, 0, TAU); c.stroke(); c.globalAlpha = .12; c.fillStyle = '#ff3a1a'; c.beginPath(); c.rect(b.A.x0 - 400, b.A.y - 900, b.A.x1 - b.A.x0 + 800, 1000); c.arc(b.rx, b.ry, b.ring, 0, TAU, true); c.fill('evenodd'); c.restore(); }
    }
};
G2.topMoves = function () { const n = Save.data.g2.actCount || {}; return Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, 3).concat(['attack']).slice(0, 3); };
(function () {
    // Spears of light do not pass through Nyx's night.
    const wh = Combat.warnHits.bind(Combat); Combat.warnHits = function (w) { if (w.lightSpear && G2Night.shadeAt(G.player.x, G.player.y - 30)) return false; return wh(w); };
    // Every hit pushes Nyx back toward the Throne.
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (dmg, src) { const r = hurt.call(this, dmg, src); const b = G.boss; if (r && this === G.player && b && b.def.id === 'vesper' && !b.dead) { this.vx = -9; this.x -= 30; } return r; };
    // The Perfect Mirror: while it shines, her favourite of your moves is sent back at you.
    const bh = Boss.prototype.hurt; Boss.prototype.hurt = function (dmg, o) { if (this.def.id === 'vesper' && this.reflect > 0 && G.player && this.mirror.includes(G.player.lastAct) && (Combat._att === G.player)) { this.reflect -= 30; VFX.text(this.x, this.y - 190, tr('MIRRORED'), '#ffb060', 16, 40); G.player.hurt(this.D(6), { owner: this, absDmg: this.D(6) }); return 0; } if (this.reflect > 0) this.reflect--; return bh.call(this, dmg, o); };
    // The ash storm: dark everywhere but her eyes and your blade.
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) {
        const b = G.boss; if (G.g2ash && b && !b.dead && G.player) { const cam = G.cam, px = (G.player.x - cam.x) * cam.zoom, py = (G.player.y - 40 - cam.y) * cam.zoom, bx = (b.x + 4 - cam.x) * cam.zoom, by = (b.y - 150 - cam.y) * cam.zoom;
            c.save(); c.fillStyle = 'rgba(20,12,10,.9)'; c.beginPath(); c.rect(0, 0, VW, VH); c.arc(px, py, 90, 0, TAU, true); c.fill(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#ff2a1a'), bx - 30, by - 30, 60, 60); c.drawImage(Glow.get('#8a5aff'), px - 60, py - 60, 120, 120); c.restore(); }
        if (G.g2night > 0 && G.player) { const cam = G.cam, px = (G.player.x - cam.x) * cam.zoom, py = (G.player.y - 40 - cam.y) * cam.zoom, nyx = G.player.id === 'nyx', r = nyx ? 260 : 60; const g = c.createRadialGradient(px, py, r * .4, px, py, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${G.g2night})`); c.fillStyle = g; c.fillRect(0, 0, VW, VH); }
        if (G.g2sepia) { c.save(); c.globalCompositeOperation = 'color'; c.fillStyle = 'rgba(160,110,60,.55)'; c.fillRect(0, 0, VW, VH); c.restore(); c.fillStyle = 'rgba(30,20,10,.06)'; for (let i = 0; i < 4; i++) c.fillRect((G.time * 37 + i * 311) % VW, 0, 1.5, VH); }
        if (G.g2crack > 0) { c.save(); c.strokeStyle = `rgba(255,255,255,${G.g2crack})`; c.lineWidth = 2; const R = U.mulberry(7); for (let i = 0; i < 16; i++) { c.beginPath(); let x = VW / 2, y = VH / 2; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (R() - .5) * 260; y += (R() - .5) * 200; c.lineTo(x, y); } c.stroke(); } c.restore(); G.g2crack -= .01; }
        hd(c);
    };
})();
G2.shatter = function () { G.g2crack = 1; G.flash = .8; Sound.sfx('ice_crack'); Sound.sfx('bigboom', { v: .5 }); G.addShake(14); };

// Act 2: Vesper's memory. Vesper cannot fight. Run, shield, and at the altar hold the child.
CHARS.vesperYoung = Object.assign({}, CHARS.vesper, { id: 'vesperYoung', name: 'VESPER', noAttack: true, hp: 120, skills: { s1: { name: 'Shield Wing', desc: 'Fold a wing over yourself for a moment.', cost: 10, cd: 150, col: '#ffffff', *run(p) { p.inv = 50; VFX.ring(p.x, p.y - 34, 50, '#ffffff', 12, 4); yield 10; } }, s2: { name: 'Shield Wing', desc: '', cost: 0, cd: 9999, col: '#ffffff', *run(p) { yield 1; } }, s3: { name: 'Shield Wing', desc: '', cost: 0, cd: 9999, col: '#ffffff', *run(p) { yield 1; } } }, ult: { name: 'NONE', col: '#ffffff', *run(p) { yield 1; } }, weapons: [{ id: 'none', name: 'No weapon', desc: '', gear: null, len: 10 }] });
CHARS.vesperYoung.style = (() => { const S = vesperStyle(); S.backGear = (c, J) => { const n = J.neck, burn = G.g2burn || 0; for (let i = 0; i < 3; i++) for (const d of [-1, 1]) { c.save(); c.translate(n.x, n.y + 6); c.fillStyle = Paint.c(burn > (i + (d > 0 ? 0 : .5)) / 3.5 ? '#3a2a24' : '#f8f4ee'); c.beginPath(); c.ellipse(d * 18, -10 - i * 4, 22 - i * 3, 6, d * (.4 + i * .3), 0, TAU); c.fill(); c.restore(); } }; return S; })();
WEAPONS2.vesperYoung = CHARS.vesperYoung.weapons;
Object.assign(ENEMIES, { mtroop: { name: 'Meridian Templar', ai: 'melee', body: 'human', hp: 9999, dmg: 14, spd: 3.6, xp: 0, col: { a: '#3a3a44', b: '#c8c8d0', g: '#ff8a3a', s: '#8a8a96' }, gear: 'blade', atks: [mkA(A.swipe, { s: 18 })] } });
G2.memoryEnd = function* () {
    G.lockInput = true; G.letterbox = 1; Music.setState('boss'); G.g2music.phase = 1; G.say('HIGH PRIEST', 'Burn them both.', 140); yield 150;
    G.g2holdT = 0; G.toast('Hold the Interact key: hold the child', '#ffffff'); G.lockInput = false; G.g2holding = true;
    yield () => (G.g2holdT || 0) >= 200 || (HEADLESS && (G.g2holdT = 200));
    G.g2holding = false; G.lockInput = true; G.flash = 1; Music.stop(.3); yield 60;
    G.say('VESPER', 'I protected a child once, too... the way he protects you.', 240); yield 250;
    G2.shatter(); yield 40; G.g2sepia = 0; G.letterbox = 0; G.lockInput = false; G2.F.setAct(3); G2.cut('g2act2back', () => Game.loadLevel('architect2'));
};
(function () { const upd = Player.prototype.update; Player.prototype.update = function () { upd.call(this); if (G.g2holding && this === G.player) { if (Input.down('interact')) { G.g2holdT = (G.g2holdT || 0) + 1; G.g2burn = Math.min(1, G.g2holdT / 200); this.vx = 0; if (G.time % 5 === 0) VFX.burst(this.x + U.rand(-30, 30), this.y - 60, '#ff8a3a', 3, 3, 20, 4, 1); } } }; })();

// Act 3: the Architect, whole again, with the whole party; the spared help, the slain return as ghosts.
const ASSISTS = {
    seraphina: { line: ['SERAPHINA', 'Rest in my light a moment.'], fx() { const P = G.player; G.fields.push({ kind: 'g2heal', x: P.x, y: P.y - 30, r: 160, t: 0, life: 300 }); } },
    mareva: { line: ['MAREVA', 'Let the sea take its little eyes.'], fx() { for (const e of G.enemies) if (!e.boss && !e.dead) { e.hp = 0; e.die({ dir: 1 }); } if (G.boss) G.boss.hurt(300, {}); } },
    gardener: { line: ['THE GARDENER', 'Stand on my roots, children.'], fx() { G.g2grav = Math.max(G.g2grav, .8); G.player.inv = Math.max(G.player.inv, 200); } },
    astraea: { line: ['ASTRAEA', 'I see its next move. Left, then the grid. Go!'], fx() { if (G.boss) { G.boss.dmgTakenMult = 1.5; G.delay(420, () => G.boss && (G.boss.dmgTakenMult = 1)); } } },
    lilith: { line: ['LILITH-VARGA', 'Pack. Bite.'], fx() { if (G.boss) for (let i = 0; i < 6; i++) G.delay(i * 12, () => { G.boss && G.boss.hurt(120, {}); Sound.sfx('growl', { v: .5 }); }); } },
    archon: { line: ['ARCHON VEIL', 'Every machine in Meridian: stand down.'], fx() { if (G.boss) { G.boss.silenced = 420; G.boss.hurt(200, {}); } } }
};
const B_ARCHITECT2 = Object.assign({}, B_ARCHITECT, {
    id: 'architect2', name: 'THE ARCHITECT', title: 'WHAT HE FORGAVE AND NEVER HEALED', hp: 11000, music: 'g2act3', choice: false,
    phases: [
        { moves: ['triangles', 'grid', 'eyes'], rest: 26, enter: null },
        { at: .8, moves: ['triangles', 'grid', 'eyes', 'rain'], rest: 22, enter: function* (b) { G.say('THE ARCHITECT', 'FIRST LAW: UP IS DOWN.', 140); G.g2xf = { flip: 1 }; G.g2grav = .5; yield 50; G2.assist(b); } },
        { at: .6, moves: ['volley', 'grid', 'volley'], rest: 22, enter: function* (b) { G.g2xf = null; G.g2grav = 1; G.say('THE ARCHITECT', 'SECOND LAW: TIME RUNS HOME.', 140); yield 50; G.toast('Stand where its shots will fly back into it', '#ffe8a0'); G2.assist(b); } },
        { at: .4, moves: ['triangles', 'eyes', 'rain'], rest: 20, enter: function* (b) { G.say('THE ARCHITECT', 'THIRD LAW: THE WORLD TURNS.', 140); b.spin = .004; yield 50; G2.assist(b); } },
        { at: .2, moves: ['eyes', 'grid', 'triangles'], rest: 22, enter: function* (b) { b.spin = 0; G.g2xf = null; G.say('THE ARCHITECT', 'FOURTH LAW: NO LIGHT AT ALL.', 160); G.g2night = .96; yield 40; G.toast('Only Nyx can see in this dark', '#b48cff'); if (G.player.id !== 'nyx') G2.swapParty('nyx'); G.level.forceNyx = true; G2.assist(b); } }
    ],
    tick(b) {
        b.rings = b.rings.map((r, i) => r + (.01 + i * .006) * (1 + b.phase * .4)); b.y = b.A.y - 40 + Math.sin(b.anim * .02) * 20; Light.add(b.x, b.y - 200, 340, '#ffe8a0', .8);
        if (b.spin) { b.rot = (b.rot || 0) + b.spin; b.spin = Math.min(.03, b.spin + .000012); G.g2xf = { rot: b.rot }; }
        if (b.silenced > 0) { b.silenced--; if (b.script) b.script.wait = 2; }
        if (b.phase >= 4) b.open = Math.min(1, b.open + .006);
        // The time law: its shots turn round after a while, and strike it if you stood in their path.
        if (b.phase === 2) for (const p of G.projs) if (p.g2rev === undefined && p.owner === b) { p.g2rev = G.time + 55; } else if (p.g2rev && G.time >= p.g2rev && !p.friendly) { p.g2rev = 0; const P = G.player; if (Math.hypot(p.x - P.x, p.y - P.y + 34) < 120) { p.friendly = true; p.owner = P; p.dmg = P.power * 2.2; p.vx *= -1.2; p.vy *= -1.2; p.life = 90; p.hitSet = new Set(); p.col = '#ffffff'; } }
        if (G.ghostT === undefined) G.ghostT = 600; if (--G.ghostT <= 0) { G.ghostT = 900; G2.ghost(b); }
    },
    moves: Object.assign({}, B_ARCHITECT.moves, {
        *volley(b) { for (let k = 0; k < 4; k++) { const a = Math.atan2(b.P.y - 36 - (b.y - 200), b.P.x - b.x); for (let i = -1; i <= 1; i++) Combat.eshoot(b, 'orb', b.x, b.y - 200, a + i * .2, 5.5, b.D(11), { r: 11, life: 200, col: '#ffe8a0' }); yield 26; } yield 30; }
    }),
    death: function* (b) {
        G.lockInput = true; G.warns = []; G.letterbox = 1; Music.stop(.5); G.g2xf = null; G.g2grav = 1; G.g2night = 0; G.cineCam = { x: b.x, y: b.y - 200, zoom: 1.4 }; b.open = 1;
        G.say('ZERO, AS HE WAS ON THE ALTAR', 'I am what he forgave... and never healed.', 240); yield 250;
        yield 30; Sound.sfx('swing_h'); G.flash = .5; VFX.slash(b.x, b.y - 200, 300, 1, '#ffd86b'); yield 14; Sound.sfx('swing_h'); VFX.slash(b.x, b.y - 200, 300, -1, '#8a5aff'); yield 14;
        G.say('', tr('DAY AND NIGHT'), 120); Music.stop(.01); yield 30; Sound.sfx('bigboom'); G.flash = 1; G.addShake(30);
        for (let i = 0; i < 60; i++) { VFX.add(b.x + U.rand(-300, 300), b.y - 400 + U.rand(-200, 100), U.rand(-1, 1), U.rand(2, 6), i % 2 ? '#ffe8a0' : '#cfe8ff', 80, 3, 1, 0); if (i % 4 === 0) yield 1; }
        b.gone = true; yield 90; G.cineCam = null; G.letterbox = 0; G.lockInput = false; G2.F.setAct(4); G2.cut('g2choiceScene', () => G2.throneChoice());
    }
});
G2.assist = function (b) {
    const g = Save.data.g2, list = Object.keys(ASSISTS).filter(k => g.spared[k] && !(b.used || (b.used = {}))[k]); if (!list.length) return; const k = list[0]; b.used[k] = 1; const A = ASSISTS[k];
    G.say(A.line[0], A.line[1], 160); Combat.banner && Combat.banner(G.player, A.line[0], '#ffffff', 26); G.flash = .3; A.fx(); Sound.sfx('checkpoint'); G.g2music.lmotif = k;
};
G2.ghost = function (b) { const g = Save.data.g2, k = Object.keys(g.killed).find(x => BOSSES[x] && !(b.ghosted || (b.ghosted = {}))[x]); if (!k) return; b.ghosted[k] = 1; const e = new Enemy('mirrorself', U.clamp(G.player.x + 300, b.A.x0 + 40, b.A.x1 - 40), b.A.y - 60, { summoned: true }); e.ghostOf = k; e.name = tr('Ghost of') + ' ' + tr(BOSSES[k].name); G.enemies.push(e); G.toast(e.name, '#9aa0c0'); G.say(BOSSES[k].name, tr('You did not let me live. I will not let you finish.'), 140); };
(function () { const tf = Combat.tickFields; Combat.tickFields = function () { tf && tf.call(Combat); for (const f of G.fields) if (f.kind === 'g2heal' && G.player && Math.hypot(G.player.x - f.x, G.player.y - 30 - f.y) < f.r && G.time % 10 === 0) G.player.heal(3, true); }; })();
Object.assign(BOSSES, { vesper: B_VESPER, architect2: B_ARCHITECT2 });
Object.assign(BOSS_INTRO, {
    vesper: [['VESPER', 'Child. You know what you are now.'], ['VESPER', 'I will not kill you. I only have to put you on that Throne.'], ['NYX', 'Then you will have to push me the whole way.']],
    architect2: [['THE ARCHITECT', 'YOU BROKE ME, CHILD. I GATHERED MYSELF. I AM GOING TO SIT ON THE THRONE.'], ['ROOK', 'Over my dead body. Again.'], ['ZERO', 'Nyx. Together this time.']]
});

/* ------------------------------ ACT 4: THE CHOICE ------------------------------ */
G2.throneChoice = function () {
    const g = Save.data.g2; g.endings = g.endings || {}; Game.state = 'menu'; G.g2silent = 0;
    if (HEADLESS) { G.flags.g2end = G.flags.g2forceEnd || (G2.canTrue() ? '5c' : '5a'); G2.playEnding(G.flags.g2end); return; }
    UI.show('g2throne'); Music.cut('g2act4', 'calm');
};
G2.canTrue = () => G2.sparedCount() >= 5 && Object.keys(Save.data.g2.shards).length >= 7;
G2.canSecret = () => { const e = Save.data.g2.endings || {}; return !!Save.data.g2.ngplus && e['5a'] && e['5b'] && e['5c']; };
Object.assign(UI.screens, {
    g2throne() {
        const t = G2.canTrue(), s = G2.canSecret();
        return `<div class="panel small"><h2>${tr('THE EMPTY THRONE')}</h2><p>${tr('Nyx, Zero and Vesper stand before the Throne, all three spent. The Throne shines, waiting for someone to sit.')}</p><nav>
        <button data-do="g2end" data-arg="5a" autofocus>${tr('Nyx sits on the Throne')}</button>
        <button data-do="g2end" data-arg="5b">${tr('Let Zero sit instead')}</button>
        <button data-do="g2end" data-arg="5c" ${t ? '' : 'disabled'}>${tr('"No one needs to sit at all."')}</button>${t ? '' : `<p class="hint">${tr('Locked: spare at least five of the women who stood against you, and find all seven Shards of Peace.')} (${G2.sparedCount()}/5 · ${Object.keys(Save.data.g2.shards).length}/7)</p>`}
        ${s ? `<p class="hint">${tr('...or say nothing at all.')}</p>` : ''}</nav></div>`;
    }
});
(function () {
    const act = UI.act.bind(UI); UI.act = function (w, arg, el) { if (w === 'g2end') { UI.hide(); G2.playEnding(arg); return; } if (w === 'creditsdone' && G.g2ending) { this.stopCredits && this.stopCredits(); const e = G.g2ending; G.g2ending = null; G2.cut(e === '5d' ? 'g2after5d' : 'g2postcredits', () => { UI.show('title'); Game.state = 'title'; }); return; } return act(w, arg, el); };
    // Thirty seconds of silence before the Throne, in New Game+ once the other three are seen.
    const upd = Game.update ? Game.update.bind(Game) : null;
    setInterval && 0;
    const tick = G.tick.bind(G); G.tick = function () { tick(); };
    if (typeof window !== 'undefined') window.addEventListener && window.addEventListener('keydown', () => { G.g2silent = 0; });
    G2.silenceTick = function () { if (UI.cur === 'g2throne' && G2.canSecret()) { G.g2silent = (G.g2silent || 0) + 1 / 60; if (G.g2silent >= 30) { UI.hide(); G2.playEnding('5d'); } } };
    if (typeof setInterval !== 'undefined' && !HEADLESS) setInterval(() => G2.silenceTick(), 1000 / 60);
})();
G2.playEnding = function (id) {
    const g = Save.data.g2; g.endings = g.endings || {}; Save.write();
    if (id === '5c') { G2.cut('g2end5cIntro', () => { Game.loadLevel('weariness'); }); return; }
    G2.finishEnding(id);
};
G2.finishEnding = function (id) {
    const g = Save.data.g2; g.endings = g.endings || {}; g.endings[id] = 1; g.ngplus = 1; g.act = 0; Save.data.gameDone = true; Save.write(); G.g2ending = id;
    G2.cut({ '5a': 'g2end5a', '5b': 'g2end5b', '5c': 'g2end5c', '5d': 'g2end5d' }[id], () => { if (HEADLESS) { G.flags.g2done = id; return; } Music.cut('g2credits', 'calm'); UI.show('credits', { ending: true }); });
};

// 5C: Zero's Weariness. Every hit heals it; Nyx fades. Drop the sword and hold it.
const B_WEARY = {
    id: 'weariness', oneSong: true, name: 'ZERO’S WEARINESS', title: 'EVERY YEAR HE NEVER RESTED', hp: 4000, w: 60, h: 160, col: '#8a8aa0', music: 'g2end5cfight', reward: { xp: 0, cells: 0 },
    init: b => { const r = new Rig(Object.assign({}, CHARS.zero.style, { scale: 1.3, col: { armor: '#2a2a34', armor2: '#4a4a56', dark: '#1a1a20', skin: '#1a1a20', boot: '#4a4a56', glow: '#6a7a8a' }, weaponF: Gear.dragged })); r.owner = {}; r.play('idle', 0); return { rig: r, hug: 0, losses: 0, t0: G.time }; },
    aim: b => ({ x: b.x, y: b.y - 90 }), box: b => ({ x: b.x - 30, y: b.y - 160, w: 60, h: 160 }),
    tick(b) {
        const P = G.player, R = b.rig; R.ground = true; R.phase += Math.abs(b.vx) / 12; if (!b.pose) R.play(Math.abs(b.vx) > .5 ? 'run' : 'idle', 6);
        if (b.dead) return; if (G.time % 40 === 0 && P.hp > 1) P.hp = Math.max(1, P.hp - 1);
        if (G.time - b.t0 === 1800) G.say('ZERO', 'It... is only tired.', 200);
        const near = Math.abs(P.x - b.x) < 80, holding = near && Input.down('interact') && !Input.down('attack');
        if (holding) { b.hug++; b.vx = 0; P.vx = 0; if (b.hug % 30 === 0) VFX.burst(b.x, b.y - 90, '#ffffff', 6, 3, 30, 4, 1); if (b.hug >= 600) { b.hp = 0; b.beginDeath(); } } else if (b.hug > 0) b.hug = Math.max(0, b.hug - 2);
        G.g2detune = Math.min(20, b.hits || 0);
        if (P.state === 'dead' || P.hp <= 1) { b.losses++; P.hp = P.maxHp; P.state = 'move'; b.hug = 0; G.flash = .5; if (b.losses >= 3) G.say('VESPER', 'Stop fighting it. Hold it.', 200); }
    },
    phases: [{ moves: ['trudge', 'lunge', 'trudge'], rest: 40 }],
    moves: {
        *trudge(b) { b.facing = b.P.x > b.x ? 1 : -1; for (let i = 0; i < 40; i++) { b.vx = b.facing * 1.2; b.x += b.vx; yield 1; } },
        *lunge(b) { b.facing = b.P.x > b.x ? 1 : -1; G.toast(tr('It lunges: do not strike. Hold'), '#e0e0f0'); Combat.warn({ shape: 'rect', x: b.x, y: b.A.y - 120, w: b.facing * 160, h: 120, t: 50, dmg: b.D(10), src: b }); yield 50; b.x = U.clamp(b.x + b.facing * 120, b.A.x0 + 40, b.A.x1 - 40); yield 40; }
    },
    death: function* (b) { G.lockInput = true; Music.stop(.1); G.letterbox = 1; yield 120; G.say('', tr('The copy came apart into white petals. Zero fell to his knees, and for the first time, he cried.'), 260); for (let i = 0; i < 80; i++) { VFX.add(b.x + U.rand(-40, 40), b.y - U.rand(0, 160), U.rand(-1, 1), U.rand(-2, -.5), '#ffffff', 90, 3, 1, 0); if (i % 2) yield 1; } b.gone = true; yield 200; G.letterbox = 0; G.lockInput = false; G2.finishEnding('5c'); },
    draw(c, b) { if (b.gone) return; b.rig.flash = b.flash > 0 ? 2 : 0; b.rig.draw(c, b.x, b.y, b.facing); if (b.hug > 0) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.arc(b.x, b.y - 90, 60, -Math.PI / 2, -Math.PI / 2 + TAU * b.hug / 600); c.stroke(); } }
};
(function () { const bh = Boss.prototype.hurt; Boss.prototype.hurt = function (dmg, o) { if (this.def.id === 'weariness') { this.hits = (this.hits || 0) + 1; this.hp = Math.min(this.maxHp, this.hp + 40); VFX.text(this.x, this.y - 180, '+40', '#9aff9a', 14, 30); this.hug = 0; return 0; } return bh.call(this, dmg, o); }; })();
Object.assign(BOSSES, { weariness: B_WEARY });
Object.assign(BOSS_INTRO, { weariness: [['', 'The Throne broke. Out of it stepped a copy of Zero: armour split open, sword dragging, eyes hollow.'], ['NYX', 'Uncle...?'], ['ZERO', 'That is... every year I did not rest.']] });

/* ------------------------------ LEVELS ------------------------------ */
Object.assign(LEVELS, {
    shore() {
        const b = new LB('shore', 260, 50, { name: 'THE SHORE OF THE SEVENTH DAY', sub: 'The Seventh Day: rest, never made', region: 'city', theme: THEMES.shore7, bg: 'shore7', next: 'throne', spawn: { x: 5, y: 34 }, weather: 'ash', noAlly: true });
        b.at(0, 34).flat(24).beacon(5, 34); b.obj('lore', 14, 34, { id: 'g2p25' });
        b.say(6, 34, 'ZERO', 'I can walk. Slowly. Lead, Nyx. I will follow you this time.', 200);
        b.flat(12).es([['oldseraph', b.cx - 4, b.cy - 6], ['mirrorself', b.cx - 2, b.cy - 3]]); b.upS(2).flat(14).es([['oldseraph', b.cx - 6, b.cy - 6]]).downS(2).flat(8).beacon(b.cx - 4, b.cy);
        b.say(b.cx - 6, b.cy, 'NYX', 'It looks like me. It fights like me.', 140); b.say(b.cx - 1, b.cy, 'ZERO', 'Then do something you have never done.', 140);
        b.obj('lore', b.cx + 2, b.cy, { id: 'g2p26' });
        const sx = b.cx; b.flat(18); b.plat(sx + 3, b.cy - 4, 3).plat(sx + 7, b.cy - 8, 3).plat(sx + 11, b.cy - 12, 3); b.obj('chest', sx + 12, b.cy - 12, { id: 'g2shard7', cells: 100, shard: 'rest' }); b.es([['mirrorself', sx + 14, b.cy - 3], ['oldseraph', sx + 8, b.cy - 9]]);
        b.flat(10).beacon(b.cx - 4, b.cy); b.obj('lore', b.cx - 2, b.cy, { id: 'g2p27' });
        const ar = b.cx, y = b.cy; b.flat(44); b.fill(ar + 40, 0, ar + 43, 49);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 40, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('zshadow', ar + 3, ar + 40, y, ar + 26, y, { trigger: ar + 7 });
        b.obj('exit', ar + 37, y, { hidden: true, label: 'The stair of glass' }); b.flat(6); return b.done();
    },
    // Act 0 and Act 1 in one place: the stair of glass, then the floating disc with the Throne.
    throne() {
        const b = new LB('throne', 300, 120, { name: 'THE SEVENTH DAY', sub: 'The stair of glass, and the Empty Throne', region: 'city', theme: THEMES.throne7, bg: 'throne7', spawn: { x: 5, y: 110 }, weather: 'ash', noAlly: true });
        b.at(0, 110).flat(14).beacon(5, 110);
        const order = ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon'];
        for (let tier = 0; tier < 6; tier++) { b.flat(4); for (let k = 0; k < 4; k++) b.up(3).flat(3); b.flat(6); const boss = order[tier]; b.obj('exit', b.cx - 3, b.cy, { g2: 'witness', boss, label: tr(BOSSES[boss].name) }); b.deco('lamp', b.cx - 6, b.cy, { lit: 1 }); }
        b.trig(b.cx - 3, b.cy - 12, 2, 13, () => { if (!G.flags.lastStep) { G.flags.lastStep = 1; G2.cut('g2act0top'); } });
        b.flat(4).beacon(b.cx - 2, b.cy);
        const ar = b.cx, y = b.cy; b.flat(60); b.fill(ar + 58, 0, ar + 61, 119);
        b.gate(ar + 2, y - 10, 10, 'arena_l');
        b.bossArena('vesper', ar + 2, ar + 58, y, ar + 44, y, { trigger: ar + 8 }); b.obj('exit', ar + 4, y, { g2: 'throneSeat', label: '' });
        return b.done();
    },
    memory() {
        const b = new LB('memory', 200, 40, { name: 'VESPER’S MEMORY', sub: 'Before the first world ended', region: 'city', theme: THEMES.memory7, bg: 'memory7', spawn: { x: 5, y: 30 }, weather: 'ash', noAlly: true, forceChar: 'vesperYoung' });
        b.at(0, 30).flat(30).beacon(4, 30);
        b.say(6, 30, 'VESPER', 'The child. They have the child. I am coming.', 160);
        b.es([['mtroop', 2, 28]]); b.flat(20); b.haz('lava', b.cx - 14, 30, 3, 1, { dmg: 10 }); b.upS(2).flat(16).es([['mtroop', b.cx - 20, b.cy - 2]]); b.haz('lava', b.cx - 8, b.cy, 3, 1, { dmg: 10 }); b.downS(2).flat(20).beacon(b.cx - 6, b.cy);
        b.trig(b.cx - 16, b.cy - 12, 2, 13, () => { for (let i = 0; i < 4; i++) { const x = (G.player.x + 200 + i * 160); G.boss = null; Combat.warn({ shape: 'rect', x: x - 40, y: G.player.y - 400, w: 80, h: 400, t: 40 + i * 14, dmg: 18, src: { x, y: 0, def: {} } }); } Sound.sfx('slam'); G.toast('The pillars are falling', '#ffb060'); });
        b.flat(30).es([['mtroop', b.cx - 10, b.cy - 2], ['mtroop', b.cx - 26, b.cy - 2]]);
        b.flat(20); b.obj('exit', b.cx - 6, b.cy, { g2: 'altarChild', label: 'The altar' }); b.flat(8);
        const d = b.done(); d.g2sepia = true; return d;
    },
    architect2() {
        const b = new LB('architect2', 80, 40, { name: 'THE SKY TORN OPEN', sub: 'The Seventh Day: the Architect rises', region: 'city', theme: THEMES.arch7, bg: 'arch7', spawn: { x: 4, y: 32 }, weather: 'motes', indoors: true, noAlly: true });
        b.at(0, 32).flat(80); b.fill(0, 0, 1, 39); b.fill(78, 0, 79, 39); b.beacon(3, 32); b.gate(8, 22, 10, 'arena_l'); b.plat(18, 27, 5).plat(56, 27, 5).plat(37, 23, 5);
        b.bossArena('architect2', 9, 77, 32, 44, 32, { trigger: 11 }); return b.done();
    },
    weariness() {
        const b = new LB('weariness', 60, 30, { name: 'THE THRONE, BROKEN', sub: 'Good Night', region: 'city', theme: THEMES.throne7, bg: 'throne7', spawn: { x: 4, y: 24 }, weather: 'ash', indoors: true, noAlly: true, forceChar: 'nyx' });
        b.at(0, 24).flat(60); b.fill(0, 0, 1, 29); b.fill(58, 0, 59, 29); b.bossArena('weariness', 3, 57, 24, 40, 24, { trigger: 6 }); return b.done();
    }
});
(function () { // stations of the finale
    G2.stationExt = G2.stationExt || {};
    G2.stationExt.witness = () => { Game.state = 'play'; };
    G2.stationExt.throneSeat = () => { Game.state = 'play'; G.toast('Not yet.', '#ffe8c8'); };
    G2.stationExt.altarChild = () => { Game.state = 'play'; if (!G.flags.altar) { G.flags.altar = 1; G.runScript(G2.memoryEnd()); } };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { if (id === 'throne') { const a = G2.F.act(); if (a === 2) id = 'memory'; else if (a === 3) id = 'architect2'; } ll(id, cp); G.g2sepia = !!G.level.g2sepia; if (id === 'architect2' && G2.F.act() === 4) G.delay(30, () => G2.throneChoice()); if (id === 'architect2' || id === 'weariness') { G.ghostT = 600; } };
    // Those Nyx spared kneel on the stair; the slain are broken stone.
    const od = ObjArt.draw.bind(ObjArt); ObjArt.draw = function (c, L) { od(c, L); for (const o of L.objs) { if (o.g2 === 'witness') { const g = Save.data.g2, x = o.x, y = o.y; if (g.spared[o.boss]) { c.fillStyle = '#e8e0f0'; Paint.disc(c, x, y - 70, 9, '#e8e0f0'); Paint.poly(c, [x - 12, y - 60, x + 12, y - 60, x + 18, y - 4, x - 18, y - 4], '#d8d0e0'); c.fillStyle = '#e8e0f0'; c.font = '11px "Palatino Linotype", serif'; c.textAlign = 'center'; c.fillText(tr(BOSSES[o.boss].name), x, y - 90); Paint.glow(c, x, y - 60, 30, '#ffffff'); } else if (g.killed[o.boss]) { c.fillStyle = '#5a5660'; Paint.poly(c, [x - 16, y, x - 10, y - 50, x + 2, y - 44, x + 14, y - 62, x + 16, y], '#5a5660'); c.fillRect(x - 20, y - 6, 40, 6); } } else if (o.g2 === 'throneSeat') { const x = o.x, y = o.y; c.fillStyle = '#d8d0e0'; c.fillRect(x - 30, y - 120, 60, 120); c.fillRect(x - 40, y - 60, 80, 14); Paint.glow(c, x, y - 80, 70, '#ffffff'); } else if (o.g2 === 'altarChild') { const x = o.x, y = o.y; c.fillStyle = '#4a3020'; c.fillRect(x - 50, y - 30, 100, 30); Paint.disc(c, x, y - 40, 7, '#e8d0b8'); c.fillStyle = '#6a5a4a'; c.fillRect(x - 14, y - 36, 28, 6); } } };
})();
Object.assign(LORE, {
    g2p25: { title: 'The Second Book, 7:1', region: 'shore', text: 'And on the seventh day the Lamb did not rest. It began the day, and left it unfinished, and the unfinished day fell into the world as a small light, and slept.' },
    g2p26: { title: 'On Vesper', region: 'shore', text: 'She was the voice of Line 3. When they chose a child for the altar, she asked to go instead. They burned the dispatch core, and her with it. She did not quite die. Things that are loved rarely do.' },
    g2p27: { title: 'The Last Survey', region: 'shore', text: 'There is no Meridian left to write this. I write it anyway. The girl is coming up the stair. Whatever she chooses, the world will be finished by tonight.' }
});
Object.assign(CUTS, {
    *g2ch7open(c) {
        Music.cut('g2vesper', 'calm'); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 60);
        const g = c.actor('nyx', 520, 560, 1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(17); const z = G2.bladeZero(c.actor('zero', 420, 560, 1, 'kneel', { scale: 2 })); yield 40;
        yield* c.say('', 'Nyx was seventeen when the burned angel came down to meet her.', 220);
        const v = c.actor('vesper', 900, 560, -1, 'idle', { scale: 2 }); yield 40;
        yield* c.say('VESPER', 'You are the Seventh Day.', 160);
        yield* c.say('VESPER', 'Zero began to make you, but he never allowed himself to rest. So you were born unfinished.', 260);
        yield* c.say('VESPER', 'For the world to be whole, you must sit on the Throne and become its day of rest. You will not be a person any more.', 280);
        yield* c.say('ZERO', 'No. I will sit. Not her.', 160);
        yield* c.say('NYX', 'Stop. Both of you. It is my day. I will decide.', 200);
        c.clearActors(); c.title('THE SEVENTH DAY', 'REST: THE EMPTY THRONE', 220, '#ffffff'); c.fade(0, 20); yield 230;
    },
    *g2act0top(c) {
        Music.cut('g2act0', 'calm'); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 30);
        const g = c.actor('nyx', 640, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(17); const z = G2.bladeZero(c.actor('zero', 520, 560, 1, 'idle', { scale: 2 })); yield 40;
        yield* c.say('ZERO', 'Last time, I came up here alone.', 170);
        g.rig.custom([[0, { aF: 60, fF: 10 }], [1, { aF: 60, fF: 10 }]], 30, 10); yield 20;
        yield* c.say('NYX', 'Not this time.', 170);
        c.fade(1, 30); yield 34;
    },
    *g2act2back(c) {
        Music.cut('g2vesper', 'calm'); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 40);
        const g = c.actor('nyx', 600, 560, 1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(17); const v = c.actor('vesper', 720, 560, -1, 'kneel', { scale: 2 }); yield 40;
        yield* c.say('', 'Nyx lowered the sword, and held out her hand. Vesper took it, and stood.', 230);
        yield* c.say('', 'They were not enemies any more.', 170);
        c.flashA = .6; G.addShake(16); Sound.sfx('bigboom', { v: .6 }); yield* c.say('', 'Then the sky split open.', 150);
        c.fade(1, 30); yield 34;
    },
    *g2choiceScene(c) { Music.cut('g2act4', 'calm'); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 60); yield 60; yield* c.say('', 'The Architect fell like a rain of shooting stars. Then it was quiet.', 230); c.fade(1, 30); yield 34; },
    *g2end5cIntro(c) {
        Music.stop(.5); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 40);
        yield* c.say('', 'Nyx understood something Zero never had: a day of rest does not need anyone to give themselves up. It only needs to be allowed.', 300);
        yield* c.say('NYX', 'You do not have to finish anything any more, Uncle. You are allowed to rest.', 240);
        c.fade(1, 30); yield 34;
    },
    *g2end5a(c) {
        Music.cut('g2end5a', 'calm'); c.lb = 1; c.shot(Stage.dusk); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 560, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 660, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(17); yield 40;
        yield* c.say('NYX', 'This time it is my turn to sing you to sleep.', 220);
        g.vx = 2; g.rig.play('run'); yield 80; c.clearActors(); c.dusk = 0; for (let i = 0; i < 160; i++) { c.dusk = i / 160; yield 1; }
        yield* c.say('', 'Nyx sat on the Throne, and became the world’s first sunset.', 240);
        yield* c.say('', 'For the first time the whole world had a night, and everyone slept in peace. Zero sat alone on a hill and watched the sunset, every evening.', 300);
        yield* c.say('', 'Every evening, the world remembers the girl.', 260);
        c.fade(1, 80); yield 90;
    },
    *g2end5b(c) {
        Music.cut('g2end5b', 'calm'); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 60);
        const z = G2.bladeZero(c.actor('zero', 600, 560, 1, 'idle', { scale: 2 })), g = c.actor('nyx', 700, 560, -1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(17); yield 40;
        yield* c.say('ZERO', 'I have protected you since the first day. Let me do it until the last.', 240);
        z.vx = -2; z.rig.play('run'); yield 70; c.flashA = 1; z.alpha = 0; yield 40;
        yield* c.say('', 'Zero faded away. Nyx kept his sword, and became the new world’s guardian.', 240);
        Music.cut('g2lul7', 'calm'); c.shot(Stage.plaza); c.clearActors(); c.fade(0, 40); const g2 = c.actor('nyx', 560, 560, 1, 'idle', { scale: 2 }); g2.rig.S = nyxStyle(17); yield 30;
        yield* c.say('', 'Many years later, in a plaza, a grown Nyx found a nameless child asleep, exactly as she had been.', 260);
        yield* c.say('', 'Nyx picked the child up. And it began again.', 220);
        c.fade(1, 80); yield 90;
    },
    *g2end5c(c) {
        Music.stop(.1); c.lb = 1; c.shot(Stage.dusk); c.fade(0, 40); yield 120; // two seconds of silence
        Music.cut('g2end5c', 'calm');
        const lands = ['The City of Eternal Dawn has a night, and its people sleep deeply.', 'The Sea of Tears lies still.', 'The Forest of Memory is in flower.', 'The stars go back up into the sky.', 'The wolves lie down to rest.', 'In Meridian, the machines turn off their lights.', 'The Empty Throne is covered in grass.'];
        c.dusk = 1; for (const l of lands) { yield* c.say('', l, 170); }
        const sp = Save.data.g2.spared; if (sp.mareva) yield* c.say('', 'Mareva sings lullabies to children.', 150); if (sp.astraea) yield* c.say('', 'Astraea watches the stars with her own eyes.', 150); if (sp.lilith) yield* c.say('', 'Lilith-Varga leads her pack home to the forest.', 150);
        yield* c.say('', 'The Four Riders take off their armour. Rook sets his shield down for a table, and they eat supper, with Vesper.', 240);
        const g = c.actor('nyx', 640, 560, 1, 'kneel', { scale: 2 }); g.rig.S = nyxStyle(17); const z = G2.bladeZero(c.actor('zero', 700, 580, -1, 'kneel', { scale: 2 })); yield 40;
        yield* c.say('', 'On a grassy hill, Zero lies with his head in Nyx’s lap. The first day, turned all the way around.', 240);
        Music.cut('g2end5a', 'calm'); yield* c.say('', 'Nyx sings him the lullaby he used to sing to her. Zero closes his eyes, and sleeps. For the first time in both stories.', 280);
        yield* c.say('NYX', 'Good night, Zero.', 220);
        Music.stop(2); c.fade(1, 80); yield 90; c.clearActors(); c.lb = 0;
        yield* c.verse('"And on the seventh day, He rested."', '', 260);
    },
    *g2end5d(c) {
        Music.cut('g2end5d', 'calm'); c.lb = 1; c.shot(Stage.ashSky); c.fade(0, 60);
        const g = c.actor('nyx', 640, 560, 1, 'idle', { scale: 2 }); g.rig.S = nyxStyle(17); yield 60;
        yield* c.say('', 'Nyx said nothing. And under her feet, for the first time, a shadow appeared.', 240);
        yield* c.say('', 'The shadow pointed down: a stair beneath the Throne, to a second, older Throne. It was still warm, as if someone had just stood up.', 280);
        c.clearActors(); c.shot(Stage.void); yield* c.say('', 'A name was carved into it.', 160);
        c.title('LUCIFER', '', 200, '#ff2a1a'); yield 220;
        c.title('PROJECT ZERO III', 'THÁNH CHIẾN', 260, '#ffffff'); yield 280;
    },
    *g2postcredits(c) { Music.stop(.5); c.shot(Stage.void); c.fade(0, 40); yield 80; yield* c.say('', '"You did well."', 260); yield 60; },
    *g2after5d(c) { c.shot(Stage.void); yield 30; }
});
Stage.ashSky = (c, t) => { Backdrop.draw(c, 'throne7', { x: 400 + t * .1, y: 0, zoom: 1 }, t); c.fillStyle = '#24202a'; c.fillRect(0, 560, VW, 200); c.fillStyle = '#d8d0e8'; c.fillRect(0, 560, VW, 3); for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(255,140,80,.6)'; c.fillRect((i * 97) % VW, VH - ((t * 1.2 + i * 53) % VH), 2, 3); } };
Stage.dusk = (c, t, C) => { const k = C.dusk || 0; const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, U.mix('#3a2a5a', '#0e0a24', k)); g.addColorStop(.6, U.mix('#ff9a5a', '#5a2a4a', k * .7)); g.addColorStop(1, U.mix('#ffd8a0', '#2a1a2a', k * .6)); c.fillStyle = g; c.fillRect(0, 0, VW, VH); Paint.glow(c, 640, 520, 200, '#ff9a5a'); c.fillStyle = '#1a2a1a'; c.beginPath(); c.moveTo(0, VH); c.quadraticCurveTo(640, 480, VW, VH); c.fill(); for (const s of Stage.stars) { c.globalAlpha = k * .8; c.fillStyle = '#fff'; c.fillRect(s.x, s.y * .5, s.s, s.s); } c.globalAlpha = 1; };
REGIONS[6].level = 'shore';
LEVEL_ORDER.push('shore', 'throne', 'memory', 'architect2', 'weariness');
Object.assign(OBJECTIVES, { shore: 'Walk the Shore of the Seventh Day', throne: 'Climb to the Empty Throne', memory: 'Reach the child on the altar', architect2: 'Bring down the Architect, together', weariness: 'Do not strike. Hold.' });
G2.DAYS[7].open = 'g2ch7open';
(function () { // deploying a day plays its opening once; a lost finale resumes at its act
    const dp = Game.deploy.bind(Game);
    Game.deploy = function (id, cp) { const n = Object.keys(G2.DAYS).find(k => G2.DAYS[k].levels[0] === id), D = G2.DAYS[n], g = Save.data && Save.data.g2; if (D && D.open && g && !g.seen['open' + n]) { g.seen['open' + n] = 1; Save.write(); G2.cut(D.open, () => dp(id, cp)); return; } return dp(id, cp); };
    // The final boss of the Seventh Day ends nothing by itself: the acts carry on.
    const obd = Game.onBossDefeated.bind(Game); Game.onBossDefeated = function (def) { if (def.id === 'vesper' || def.id === 'architect2' || def.id === 'weariness') { G.boss = null; G.bossDone = true; Save.data.cleared[def.id] = true; return; } return obd(def); };
})();

Object.assign(VI, {
    'THE SHORE OF THE SEVENTH DAY': 'BỜ NGÀY THỨ BẢY', 'The Seventh Day: rest, never made': 'Ngày Thứ Bảy: sự nghỉ ngơi chưa từng được tạo ra', 'THE SEVENTH DAY': 'NGÀY THỨ BẢY', 'The stair of glass, and the Empty Throne': 'Cầu thang kính, và Ngai Trống', 'VESPER’S MEMORY': 'KÝ ỨC CỦA VESPER', 'Before the first world ended': 'Trước khi thế giới đầu tiên kết thúc', 'THE SKY TORN OPEN': 'BẦU TRỜI XÉ TOẠC', 'The Seventh Day: the Architect rises': 'Ngày Thứ Bảy: The Architect trỗi dậy', 'THE THRONE, BROKEN': 'CÁI NGAI ĐÃ VỠ', 'Good Night': 'Ngủ Ngon',
    'VESPER': 'VESPER', 'THE BURNED ANGEL': 'THIÊN THẦN BỊ THIÊU', 'An angel who once asked to lie on the altar instead of a nameless child, and was burned for asking. She is not cruel. She only believes that someone always has to give themselves up.': 'Một thiên thần từng xin được nằm lên bàn thờ thay cho một đứa trẻ không tên, và bị thiêu vì dám xin. Cô không độc ác. Cô chỉ tin rằng lúc nào cũng phải có ai đó hy sinh.',
    '"Someone has to sit on the Throne."': '"Phải có người ngồi lên Ngai."', 'Fragile when she is grounded.': 'Mong manh khi đứng dưới đất.', 'Ash Rebirth': 'Hồi Sinh Tro', 'Flight: hold Jump in the air to fly for 4 seconds. The first time she falls in a fight, she rises from her ashes at half health.': 'Bay: giữ Nhảy trên không để bay 4 giây. Lần đầu gục ngã trong trận, cô hồi sinh từ tro với nửa máu.',
    'Rain of Spears': 'Mưa Thương', 'Spears of light fall in a line in front of you.': 'Những mũi thương ánh sáng rơi thành hàng trước mặt.', 'The Refused Prayer': 'Lời Cầu Nguyện Bị Từ Chối', 'A ring of fire around you: it burns whatever stands close.': 'Một vòng lửa quanh mình: thiêu mọi thứ đứng gần.', 'Ash Wings': 'Cánh Tro', 'Your wings cut both sides of you at once.': 'Đôi cánh chém cả hai bên cùng lúc.', 'THE SECOND HEAVEN': 'THIÊN ĐÀNG THỨ HAI',
    'The Broken Spear of Light': 'Thương Ánh Sáng Gãy', 'Thrown, then called back.': 'Ném đi, rồi gọi về tay.', 'The wings themselves, cutting both ways.': 'Chính đôi cánh, chém cả hai phía.', 'The Holy Censer': 'Lư Hương Thánh', 'Sparks of fire at range.': 'Tia lửa đánh xa.', 'Unburned': 'Chưa Cháy', 'Bright Spear': 'Thương Sáng',
    'Your Own Reflection': 'Bản Sao Của Chính Em', 'Soldier of the Old Heaven': 'Thiên Binh Cũ', 'Rosary Bead': 'Hạt Tràng Hạt', 'Meridian Templar': 'Hiệp Sĩ Đền Meridian',
    'ZERO’S SHADOW': 'BÓNG CỦA ZERO', 'WHAT HE NEVER LET HIMSELF BE': 'ĐIỀU CHÚ CHƯA BAO GIỜ CHO PHÉP MÌNH LÀ', 'I am every day he did not rest.': 'Ta là mọi ngày hắn không nghỉ.', 'You never had a shadow, girl. He never let himself have one either. Here it is.': 'Ngươi chưa bao giờ có bóng, con bé. Hắn cũng chưa bao giờ cho phép mình có. Đây.', 'That is mine. Let me—': 'Đó là của ta. Để ta—', 'No. We do this together.': 'Không. Mình làm cùng nhau.',
    'There. Sit. It is not so hard.': 'Đó. Ngồi xuống. Đâu có khó.', 'I asked to lie on the altar instead of him. They burned me for asking.': 'Ta đã xin được lên bàn thờ thay hắn. Họ thiêu ta vì dám xin.', 'Ash: only her eyes and your blade': 'Bão tro: chỉ còn mắt cô ta và lưỡi kiếm của em', 'This world needs a day of rest. And you are that day.': 'Thế giới này cần một ngày nghỉ. Và con chính là ngày đó.', 'I am not a tool for finishing anyone!': 'Tôi không phải công cụ để hoàn thành ai cả!',
    'Rain.': 'Mưa.', 'Kneel.': 'Quỳ xuống.', 'And the spears came down like a psalm.': 'Và những mũi thương rơi xuống như một bài thánh vịnh.', 'I know your': 'Ta biết', 'I have watched you use it the whole way here.': 'Ta đã nhìn con dùng nó suốt dọc đường đến đây.', 'MIRRORED': 'PHẢN LẠI', 'Break the seven beads before the ring closes': 'Đập vỡ bảy hạt tràng trước khi vòng lửa khép lại',
    'Nyx raised the sword...': 'Nyx giơ kiếm lên...', '...and stopped.': '...rồi dừng lại.', 'HIGH PRIEST': 'GIÁO CHỦ', 'Burn them both.': 'Thiêu cả hai.', 'Hold the Interact key: hold the child': 'Giữ phím Tương tác: ôm lấy đứa trẻ', 'I protected a child once, too... the way he protects you.': 'Ta cũng từng bảo vệ một đứa trẻ... giống như hắn bảo vệ con.',
    'Shield Wing': 'Cánh Che', 'Fold a wing over yourself for a moment.': 'Gập cánh che lấy mình trong chốc lát.', 'No weapon': 'Không vũ khí', 'The child. They have the child. I am coming.': 'Đứa trẻ. Chúng bắt đứa trẻ rồi. Ta đến đây.', 'The pillars are falling': 'Cột đá đang đổ', 'The altar': 'Bàn thờ',
    'Rest in my light a moment.': 'Nghỉ trong ánh sáng của ta một chút.', 'Let the sea take its little eyes.': 'Để biển cuốn những con mắt nhỏ của nó đi.', 'Stand on my roots, children.': 'Đứng lên rễ của ta, các con.', 'I see its next move. Left, then the grid. Go!': 'Ta thấy đòn tiếp theo của nó. Bên trái, rồi tới lưới. Đi!', 'Pack. Bite.': 'Bầy. Cắn.', 'Every machine in Meridian: stand down.': 'Mọi cỗ máy ở Meridian: dừng lại.',
    'WHAT HE FORGAVE AND NEVER HEALED': 'NHỮNG GÌ CHÚ ĐÃ THA THỨ NHƯNG CHƯA CHỮA LÀNH', 'FIRST LAW: UP IS DOWN.': 'LUẬT THỨ NHẤT: TRÊN LÀ DƯỚI.', 'SECOND LAW: TIME RUNS HOME.': 'LUẬT THỨ HAI: THỜI GIAN CHẠY VỀ NHÀ.', 'Stand where its shots will fly back into it': 'Đứng đúng chỗ để đòn của nó bay ngược lại vào nó', 'THIRD LAW: THE WORLD TURNS.': 'LUẬT THỨ BA: THẾ GIỚI XOAY.', 'FOURTH LAW: NO LIGHT AT ALL.': 'LUẬT THỨ TƯ: KHÔNG CÒN ÁNH SÁNG.', 'Only Nyx can see in this dark': 'Chỉ Nyx nhìn thấy trong bóng tối này', 'Only Nyx can see in this dark.': 'Chỉ Nyx nhìn thấy trong bóng tối này.',
    'ZERO, AS HE WAS ON THE ALTAR': 'ZERO, LÚC BỊ HIẾN TẾ', 'I am what he forgave... and never healed.': 'Ta là những gì hắn đã tha thứ... nhưng chưa bao giờ chữa lành.', 'DAY AND NIGHT': 'NGÀY VÀ ĐÊM', 'Ghost of': 'Bóng ma của', 'You did not let me live. I will not let you finish.': 'Ngươi đã không để ta sống. Ta sẽ không để ngươi hoàn thành.',
    'YOU BROKE ME, CHILD. I GATHERED MYSELF. I AM GOING TO SIT ON THE THRONE.': 'NGƯƠI ĐÃ ĐẬP VỠ TA, ĐỨA TRẺ. TA ĐÃ GOM MÌNH LẠI. TA SẼ NGỒI LÊN NGAI.', 'Over my dead body. Again.': 'Bước qua xác ta đã. Lần nữa.', 'Nyx. Together this time.': 'Nyx. Lần này cùng nhau.', 'Child. You know what you are now.': 'Con bé. Giờ con biết mình là gì rồi.', 'I will not kill you. I only have to put you on that Throne.': 'Ta sẽ không giết con. Ta chỉ cần đặt con lên cái Ngai kia.', 'Then you will have to push me the whole way.': 'Vậy thì bà phải đẩy tôi suốt cả quãng đường.',
    'THE EMPTY THRONE': 'NGAI TRỐNG', 'Nyx, Zero and Vesper stand before the Throne, all three spent. The Throne shines, waiting for someone to sit.': 'Nyx, Zero và Vesper đứng trước Ngai, ai cũng kiệt sức. Ngai phát sáng, chờ ai đó ngồi lên.', 'Nyx sits on the Throne': 'Nyx ngồi lên Ngai', 'Let Zero sit instead': 'Để Zero ngồi thay', '"No one needs to sit at all."': '"Không ai cần ngồi cả."',
    'Locked: spare at least five of the women who stood against you, and find all seven Shards of Peace.': 'Đang khóa: tha cho ít nhất năm người phụ nữ từng chống lại em, và tìm đủ bảy Mảnh Bình Yên.', '...or say nothing at all.': '...hoặc không nói gì cả.',
    'ZERO’S WEARINESS': 'NỖI MỆT MỎI CỦA ZERO', 'EVERY YEAR HE NEVER RESTED': 'MỌI NĂM THÁNG CHÚ CHƯA TỪNG ĐƯỢC NGHỈ', 'It... is only tired.': 'Nó... chỉ mệt thôi.', 'Stop fighting it. Hold it.': 'Đừng đánh nữa. Ôm lấy nó.', 'It lunges: do not strike. Hold': 'Nó lao tới: đừng đánh. Hãy ôm',
    'The copy came apart into white petals. Zero fell to his knees, and for the first time, he cried.': 'Bản sao tan thành cánh hoa trắng. Zero quỵ xuống, lần đầu tiên khóc.', 'The Throne broke. Out of it stepped a copy of Zero: armour split open, sword dragging, eyes hollow.': 'Ngai vỡ, bước ra một bản sao Zero kiệt sức: giáp nứt toác, kiếm kéo lê, mắt trũng.', 'That is... every year I did not rest.': 'Đó là... mọi năm tháng ta chưa từng nghỉ.',
    'I can walk. Slowly. Lead, Nyx. I will follow you this time.': 'Ta đi được. Chậm thôi. Dẫn đường đi, Nyx. Lần này ta theo em.', 'It looks like me. It fights like me.': 'Nó giống em. Nó đánh giống em.', 'Then do something you have never done.': 'Vậy thì làm điều em chưa từng làm.', 'The stair of glass': 'Cầu thang kính', 'Not yet.': 'Chưa phải lúc.',
    'The Second Book, 7:1': 'Sách Thứ Hai, 7:1', 'And on the seventh day the Lamb did not rest. It began the day, and left it unfinished, and the unfinished day fell into the world as a small light, and slept.': 'Và vào ngày thứ bảy, Con Chiên đã không nghỉ. Nó bắt đầu ngày ấy, rồi bỏ dở, và ngày dở dang ấy rơi xuống thế giới như một đốm sáng nhỏ, và ngủ.',
    'On Vesper': 'Về Vesper', 'She was the voice of Line 3. When they chose a child for the altar, she asked to go instead. They burned the dispatch core, and her with it. She did not quite die. Things that are loved rarely do.': 'Cô là giọng nói của Tuyến 3. Khi họ chọn một đứa trẻ cho bàn thờ, cô xin được đi thay. Họ đốt lõi điều phối, và đốt cả cô. Cô không chết hẳn. Những thứ được yêu thương hiếm khi chết hẳn.',
    'The Last Survey': 'Bản Khảo Sát Cuối Cùng', 'There is no Meridian left to write this. I write it anyway. The girl is coming up the stair. Whatever she chooses, the world will be finished by tonight.': 'Không còn Meridian nào để viết điều này. Tôi vẫn viết. Cô bé đang leo lên cầu thang. Dù cô chọn gì, đêm nay thế giới sẽ hoàn tất.',
    'Nyx was seventeen when the burned angel came down to meet her.': 'Nyx mười bảy tuổi khi thiên thần bị thiêu xuống gặp cô.', 'You are the Seventh Day.': 'Con là Ngày Thứ Bảy.', 'Zero began to make you, but he never allowed himself to rest. So you were born unfinished.': 'Zero đã bắt đầu tạo ra con, nhưng hắn không bao giờ cho phép mình nghỉ. Nên con sinh ra dở dang.',
    'For the world to be whole, you must sit on the Throne and become its day of rest. You will not be a person any more.': 'Để thế giới hoàn chỉnh, con phải ngồi lên Ngai và trở thành ngày nghỉ của nó. Con sẽ không còn là một con người nữa.', 'No. I will sit. Not her.': 'Không. Ta sẽ ngồi. Không phải em ấy.', 'Stop. Both of you. It is my day. I will decide.': 'Thôi. Cả hai người. Đây là ngày của em. Em sẽ quyết định.', 'REST: THE EMPTY THRONE': 'NGHỈ NGƠI: NGAI TRỐNG',
    'Last time, I came up here alone.': 'Lần trước ta lên đây một mình.', 'Not this time.': 'Lần này thì không.', 'Nyx lowered the sword, and held out her hand. Vesper took it, and stood.': 'Nyx hạ kiếm, đưa tay kéo Vesper đứng dậy.', 'They were not enemies any more.': 'Hai người không còn là kẻ thù.', 'Then the sky split open.': 'Rồi bầu trời tách ra.', 'The Architect fell like a rain of shooting stars. Then it was quiet.': 'The Architect vỡ thành hàng triệu mảnh kính rơi như mưa sao băng. Rồi tất cả im lặng.',
    'Nyx understood something Zero never had: a day of rest does not need anyone to give themselves up. It only needs to be allowed.': 'Nyx hiểu ra điều Zero chưa từng hiểu: ngày nghỉ không cần ai hy sinh để tồn tại, nó chỉ cần được cho phép.', 'You do not have to finish anything any more, Uncle. You are allowed to rest.': 'Chú không cần hoàn thành gì nữa. Chú được nghỉ rồi.',
    'This time it is my turn to sing you to sleep.': 'Lần này đến lượt em ru chú ngủ.', 'Nyx sat on the Throne, and became the world’s first sunset.': 'Nyx bước lên Ngai và tan thành hoàng hôn đầu tiên của thế giới.', 'For the first time the whole world had a night, and everyone slept in peace. Zero sat alone on a hill and watched the sunset, every evening.': 'Cả thế giới lần đầu có đêm, mọi người ngủ yên. Zero ngồi một mình trên đồi nhìn hoàng hôn mỗi ngày.', 'Every evening, the world remembers the girl.': 'Mỗi buổi tối, thế giới lại nhớ đến cô bé.',
    'I have protected you since the first day. Let me do it until the last.': 'Ta đã bảo vệ em từ ngày đầu. Để ta làm đến ngày cuối.', 'Zero faded away. Nyx kept his sword, and became the new world’s guardian.': 'Zero tan biến. Nyx giữ lại thanh kiếm, trở thành người bảo vệ thế giới mới.', 'Many years later, in a plaza, a grown Nyx found a nameless child asleep, exactly as she had been.': 'Nhiều năm sau, Nyx trưởng thành tìm thấy một đứa trẻ không tên đang ngủ giữa quảng trường, giống hệt cô năm xưa.', 'Nyx picked the child up. And it began again.': 'Nyx bế đứa trẻ lên. Vòng lặp tiếp diễn.',
    'The City of Eternal Dawn has a night, and its people sleep deeply.': 'Thành Phố Bình Minh có đêm, người dân ngủ say.', 'The Sea of Tears lies still.': 'Biển Lệ lặng sóng.', 'The Forest of Memory is in flower.': 'Rừng Ký Ức nở hoa.', 'The stars go back up into the sky.': 'Sao trở về trời.', 'The wolves lie down to rest.': 'Bầy sói nằm nghỉ.', 'In Meridian, the machines turn off their lights.': 'Máy móc Meridian tắt đèn.', 'The Empty Throne is covered in grass.': 'Ngai trống phủ đầy cỏ.',
    'Mareva sings lullabies to children.': 'Mareva hát ru trẻ con.', 'Astraea watches the stars with her own eyes.': 'Astraea ngắm sao bằng mắt thường.', 'Lilith-Varga leads her pack home to the forest.': 'Lilith-Varga dắt bầy sói về rừng.', 'The Four Riders take off their armour. Rook sets his shield down for a table, and they eat supper, with Vesper.': 'Tứ Kỵ Sĩ cởi giáp. Rook đặt khiên xuống làm bàn, cả nhóm cùng Vesper ngồi ăn bữa tối.',
    'On a grassy hill, Zero lies with his head in Nyx’s lap. The first day, turned all the way around.': 'Trên đồi cỏ, Zero nằm gối đầu lên đùi Nyx, đảo ngược hoàn toàn cảnh chương 1.', 'Nyx sings him the lullaby he used to sing to her. Zero closes his eyes, and sleeps. For the first time in both stories.': 'Nyx hát bài ru Zero từng hát cho cô. Zero nhắm mắt, ngủ, lần đầu tiên trong cả hai phần game.', 'Good night, Zero.': 'Ngủ ngon, Zero.', '"And on the seventh day, He rested."': '"Và vào ngày thứ bảy, Người nghỉ ngơi."',
    'Nyx said nothing. And under her feet, for the first time, a shadow appeared.': 'Nyx im lặng trước Ngai. Bóng của Nyx, thứ cô chưa từng có, bắt đầu hiện ra dưới chân.', 'The shadow pointed down: a stair beneath the Throne, to a second, older Throne. It was still warm, as if someone had just stood up.': 'Cái bóng chỉ xuống một cầu thang dẫn sâu dưới Ngai, tới cái Ngai cổ xưa thứ hai, vẫn còn ấm như vừa có người rời đi.', 'A name was carved into it.': 'Trên Ngai cổ khắc một cái tên.',
    '"You did well."': '"Con đã làm tốt."', 'Walk the Shore of the Seventh Day': 'Đi qua Bờ Ngày Thứ Bảy', 'Climb to the Empty Throne': 'Leo lên Ngai Trống', 'Reach the child on the altar': 'Đến chỗ đứa trẻ trên bàn thờ', 'Bring down the Architect, together': 'Cùng nhau hạ The Architect', 'Do not strike. Hold.': 'Đừng đánh. Hãy ôm.'
});
