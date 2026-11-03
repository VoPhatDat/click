'use strict';
/**
 * G2 CHARS: every operator keeps their Part I rig and look, with a rebuilt kit.
 * Three weapons each (frame data in Part I format), three skills (generators),
 * a new ultimate, a new passive, and upgrade branches with skill variants.
 */
const PO = { // shared poses, same angle convention as rig.js
    down: [{ aF: 150, fF: 20, lean: -8, lF: 18, lB: -18 }, { aF: 30, fF: 6, lean: 20, lF: 26, sF: 24, lB: -26, sB: 12 }],
    up: [{ aF: 20, fF: 6, lean: 14, lF: 22, lB: -22 }, { aF: 132, fF: 16, lean: -6, lF: 18, sF: 16, lB: -30, sB: 20 }],
    thrust: [{ aF: 60, fF: 90, lean: -6 }, { aF: 92, fF: 0, lean: 26, lF: 32, sF: 26, lB: -32, sB: 12 }],
    spin: [{ lean: 180, aF: 90, aB: 90, by: 2 }, { lean: 360, aF: 80, aB: 80, lF: 30, sF: 40 }],
    slam: [{ aF: 178, fF: 18, lean: -14, lF: 14, sF: 24, lB: -14, sB: 24, by: 4 }, { aF: 34, fF: 2, lean: 30, lF: 40, sF: 56, lB: -34, sB: 14, by: 10 }],
    cast: [{ aF: 70, fF: 40, lean: -4 }, { aF: 92, fF: 2, lean: 6 }]
};
const AT = (pose, s, a, r, box, dmg, o = {}) => Object.assign({ s, a, r, box, dmg, kb: 4, stag: 14, move: 2, sfx: 'swing_l', hit: 'hit_l', slash: [Math.max(30, box[2] * .55), -36], trail: 1, wind: PO[pose][0], str: PO[pose][1] }, o);
const chain3 = (list) => { list.forEach((a, i) => { a.next = list[i + 1] ? 'a' + (i + 2) : undefined; }); const o = {}; list.forEach((a, i) => o['a' + (i + 1)] = a); return o; };

/* Weapon painters, drawn along +y of the hand as in chars.js Gear. */
Object.assign(Gear, {
    aocalyst(c, J, S, r) {
        c.fillStyle = Paint.c('#262a33'); c.fillRect(-4, -4, 8, 10); c.fillStyle = Paint.c('#00ffff'); c.fillRect(-7, 5, 14, 3);
        const wr = r.owner && r.owner.form === 'wrath', col = wr ? '#ff2a1a' : '#e8fbff';
        Paint.poly(c, [-3, 8, 3, 8, 2.5, 48, 0, 56, -2.5, 48], col);
        c.strokeStyle = Paint.c(wr ? '#5a0000' : '#00c8c8'); c.lineWidth = 1; c.beginPath(); c.moveTo(0, 14); c.lineTo(1.5, 24); c.lineTo(-1, 33); c.lineTo(1, 42); c.stroke();
        Paint.glow(c, 0, 32, 16, wr ? '#ff1100' : '#00ffff');
    },
    greatblade(c, J, S, r) {
        c.fillStyle = Paint.c('#2a2026'); c.fillRect(-3, -10, 6, 18); c.fillStyle = Paint.c('#c9a227'); c.fillRect(-12, 7, 24, 5);
        Paint.poly(c, [-7, 12, 7, 12, 6, 66, 0, 78, -6, 66], r.owner && r.owner.form === 'wrath' ? '#3a0a0c' : '#d8dee8');
        c.fillStyle = Paint.c('#ffd86b'); c.fillRect(-1, 16, 2, 50);
    },
    chainG(c, J, S, r) {
        for (let i = 0; i < 6; i++) { c.strokeStyle = Paint.c('#e8fbff'); c.lineWidth = 2; c.beginPath(); c.ellipse(Math.sin(G.time * .2 + i) * 1.5, 6 + i * 5, 2.4, 3.4, 0, 0, TAU); c.stroke(); }
        Paint.poly(c, [-5, 34, 5, 34, 0, 46], '#00ffff'); Paint.glow(c, 0, 40, 12, '#00ffff');
    },
    rampart(c, J, S, r) {
        Paint.poly(c, [-10, -26, 18, -24, 22, 0, 18, 30, -10, 34, -13, 0], '#5c2a1e'); Paint.poly(c, [-6, -20, 14, -19, 17, 0, 14, 25, -6, 28, -8, 0], '#c97a2a');
        c.fillStyle = Paint.c('#ffaa33'); c.fillRect(2, -16, 4, 40); c.fillRect(-4, 0, 18, 4); if (r.owner && r.owner.guarding) Paint.glow(c, 6, 0, 36, '#ffaa33');
    },
    lance(c) { c.fillStyle = Paint.c('#4a3020'); c.fillRect(-2, -30, 4, 96); Paint.poly(c, [-6, 60, 6, 60, 0, 90], '#ffd0a0'); Paint.poly(c, [-9, 12, 9, 12, 0, 22], '#c97a2a'); },
    scythe(c) { c.fillStyle = Paint.c('#231f33'); c.fillRect(-2, -18, 4, 76); c.strokeStyle = Paint.c('#d8b4fe'); c.lineWidth = 4; c.beginPath(); c.arc(-16, 56, 22, -.4, Math.PI * .85); c.stroke(); Paint.glow(c, -16, 60, 18, '#a855ff'); },
    crossbow(c) { c.fillStyle = Paint.c('#231f33'); c.fillRect(-3, 0, 6, 30); c.strokeStyle = Paint.c('#c084fc'); c.lineWidth = 2; c.beginPath(); c.arc(0, 24, 15, Math.PI * .1, Math.PI * .9); c.stroke(); },
    serpent(c) { c.fillStyle = Paint.c('#2c3a22'); c.fillRect(-2, -26, 4, 60); c.strokeStyle = Paint.c('#9dff40'); c.lineWidth = 2.5; c.beginPath(); for (let i = 0; i < 7; i++) c.lineTo(Math.sin(i * 1.3 + G.time * .1) * 5, -24 + i * 9); c.stroke(); Paint.disc(c, 0, -28, 5, '#9dff40'); Paint.glow(c, 0, -28, 14, '#9dff40'); },
    censer(c) { c.strokeStyle = Paint.c('#c8b070'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(G.time * .12) * 6, 26); c.stroke(); Paint.disc(c, Math.sin(G.time * .12) * 6, 32, 8, '#b8903a'); Paint.glow(c, Math.sin(G.time * .12) * 6, 38, 16, '#9dff40'); },
    flask(c) { Paint.disc(c, 0, 10, 6, '#9dff40'); c.fillStyle = Paint.c('#dde'); c.fillRect(-2, 0, 4, 5); Paint.glow(c, 0, 10, 12, '#9dff40'); },
    sickles(c) { c.fillStyle = Paint.c('#3a2a1a'); c.fillRect(-1.5, -2, 3, 18); c.strokeStyle = Paint.c('#ffd0c0'); c.lineWidth = 3; c.beginPath(); c.arc(9, 20, 12, Math.PI * .6, Math.PI * 1.6); c.stroke(); },
    whip(c) { c.strokeStyle = Paint.c('#8a2a2a'); c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 0); for (let i = 1; i < 9; i++) c.lineTo(Math.sin(G.time * .3 + i) * 3, i * 6); c.stroke(); for (let i = 2; i < 9; i += 2) Paint.poly(c, [-3, i * 6, 3, i * 6, 0, i * 6 - 4], '#ffb0a0'); },
    claws(c) { c.strokeStyle = Paint.c('#ff5a5a'); c.lineWidth = 2; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 3, 2); c.lineTo(i * 5, 18); c.stroke(); } }
});

/* ---------------------------- WEAPONS ---------------------------- */
const WEAPONS2 = {
    zero: [
        { id: 'aocalyst', name: 'Aocalyst Blade', desc: 'The arm cannon, reforged as a cracked blade of its own light. Fast cuts.', gear: 'aocalyst', len: 54,
          atks: chain3([AT('down', 5, 4, 8, [4, -66, 74, 62], .8, { col: '#bff8ff' }), AT('up', 5, 4, 8, [4, -70, 74, 66], .8, { col: '#bff8ff' }), AT('down', 6, 4, 10, [4, -72, 80, 70], .95, { col: '#e8fbff', move: 4 }), AT('thrust', 8, 5, 16, [0, -64, 104, 50], 1.5, { col: '#ffffff', move: 9, kb: 8, stag: 30, hit: 'hit_h', sfx: 'swing_m', shake: 4 })]),
          heavy: AT('slam', 12, 5, 18, [2, -90, 104, 92], 2.4, { kb: 11, kby: -5, stag: 50, hit: 'hit_h', sfx: 'swing_h', slam: true, col: '#e8fbff', shake: 7 }) },
        { id: 'judgment', name: 'Greatblade of Judgment', desc: 'Slow and heavy. Breaks armour and guards.', gear: 'greatblade', len: 76, armorBreak: true,
          atks: chain3([AT('down', 12, 5, 16, [2, -88, 104, 88], 1.9, { kb: 9, stag: 40, hit: 'hit_h', sfx: 'swing_h', col: '#ffd86b', shake: 5 }), AT('up', 13, 5, 16, [2, -96, 108, 96], 2.1, { kb: 9, stag: 44, hit: 'hit_h', sfx: 'swing_h', col: '#ffd86b' }), AT('slam', 18, 6, 24, [0, -110, 126, 110], 3.4, { kb: 14, kby: -6, stag: 80, hit: 'hit_h', sfx: 'swing_h', slam: true, col: '#ffffff', shake: 10 })]) },
        { id: 'chain', name: 'Chain of Genesis', desc: 'Mid range. Hooks foes and drags them in; with nothing to catch, it drags you.', gear: 'chainG', len: 40,
          atks: chain3([AT('thrust', 8, 4, 12, [8, -58, 170, 30], .8, { pull: true, col: '#bff8ff', sfx: 'swing_m' }), AT('thrust', 8, 4, 12, [8, -58, 170, 30], .8, { pull: true, col: '#bff8ff', sfx: 'swing_m' }), AT('thrust', 10, 5, 16, [8, -62, 210, 36], 1.4, { pull: true, hook: true, col: '#ffffff', sfx: 'swing_h', hit: 'hit_h', stag: 36 })]) }
    ],
    rook: [
        { id: 'rampart', name: 'Rampart Shield', desc: 'Bash with a wall of iron. Hold heavy to guard.', gear: 'rampart', len: 30, guard: true,
          atks: chain3([AT('thrust', 7, 4, 12, [4, -76, 66, 72], 1, { kb: 7, stag: 30, hit: 'hit_metal', col: '#ffaa33', move: 4 }), AT('thrust', 7, 4, 12, [4, -76, 66, 72], 1, { kb: 7, stag: 30, hit: 'hit_metal', col: '#ffaa33', move: 4 }), AT('thrust', 12, 5, 18, [4, -84, 84, 80], 1.9, { kb: 13, stag: 70, hit: 'hit_metal', sfx: 'swing_h', col: '#ffd080', move: 8, shake: 6 })]),
          heavy: AT('thrust', 10, 5, 16, [2, -74, 66, 70], 1.4, { kb: 11, stag: 50, hit: 'hit_metal', col: '#ffaa33' }) },
        { id: 'doom', name: 'Doom Hammer', desc: 'The old hammer. Slams send out shockwaves; hold heavy to charge.', gear: 'hammer', len: 56, p1: true },
        { id: 'lance', name: 'Cavalry Lance', desc: 'Long thrusts. The third charges straight through a line.', gear: 'lance', len: 90,
          atks: chain3([AT('thrust', 8, 4, 12, [8, -60, 124, 34], 1, { col: '#ffd0a0', move: 3 }), AT('thrust', 8, 4, 12, [8, -60, 124, 34], 1, { col: '#ffd0a0', move: 3 }), AT('thrust', 10, 12, 18, [0, -66, 90, 46], 1.8, { col: '#ffffff', move: 20, kb: 10, stag: 50, hit: 'hit_h', sfx: 'swing_h', shake: 6 })]) }
    ],
    sable: [
        { id: 'shadow', name: 'Twin Shadow Daggers', desc: 'The old kukris. Five quick cuts.', gear: 'kukri', len: 26, p1: true },
        { id: 'scythe', name: 'Soul Scythe', desc: 'Sweeps all around you and drinks a little of every soul it cuts.', gear: 'scythe', len: 64, lifesteal: true,
          atks: chain3([AT('spin', 7, 6, 10, [-80, -84, 160, 84], .8, { col: '#d8b4fe', sfx: 'swing_m' }), AT('spin', 7, 6, 10, [-80, -84, 160, 84], .8, { col: '#d8b4fe', sfx: 'swing_m' }), AT('spin', 10, 8, 16, [-100, -96, 200, 96], 1.4, { col: '#ffffff', kb: 9, stag: 40, hit: 'hit_h', sfx: 'swing_h' })]) },
        { id: 'bow', name: 'Silent Crossbow', desc: 'Long range and no sound. Every bolt pierces.', gear: 'crossbow', len: 30, ranged: true, rate: 16, shot: { kind: 'knife', spd: 19, dmg: 1.1, r: 7, pierce: 3, life: 60, col: '#c084fc' } }
    ],
    mirae: [
        { id: 'serpent', name: 'Serpent Staff', desc: 'Spits venom that clings and burns.', gear: 'serpent', len: 30, ranged: true, rate: 18, shot: { kind: 'orb', spd: 11, dmg: .95, r: 9, life: 60, col: '#9dff40', poison: 1, home: .05 } },
        { id: 'censer', name: 'Thurible', desc: 'Swing the censer; heavy leaves smoke that poisons foes and heals you.', gear: 'censer', len: 34,
          atks: chain3([AT('spin', 7, 6, 12, [-60, -70, 120, 66], .8, { col: '#9dff40', poison: 1 }), AT('spin', 7, 6, 12, [-60, -70, 120, 66], .8, { col: '#9dff40', poison: 1 }), AT('spin', 9, 7, 16, [-76, -80, 152, 80], 1.2, { col: '#c8ff70', poison: 1, stag: 30 })]),
          heavy: AT('cast', 10, 4, 18, [0, -60, 40, 40], .5, { smoke: true, col: '#9dff40' }) },
        { id: 'flasks', name: 'Thrown Flasks', desc: 'Lobbed flasks burst in a poison cloud.', gear: 'flask', len: 12, ranged: true, rate: 24, shot: { kind: 'orb', spd: 10, dmg: 1.2, r: 8, life: 90, col: '#c8ff70', grav: .35, explode: 70, poison: 1, lob: true } }
    ],
    ysolde: [
        { id: 'sickles', name: 'Twin Sickles', desc: 'Four ripping hooks. Every one drinks.', gear: 'sickles', len: 30, lifesteal: true,
          atks: chain3([AT('down', 5, 4, 8, [4, -64, 66, 60], .7, { col: '#ff8a8a', move: 4 }), AT('up', 5, 4, 8, [4, -66, 66, 62], .7, { col: '#ff8a8a', move: 4 }), AT('down', 5, 4, 9, [4, -66, 70, 64], .8, { col: '#ff8a8a', move: 4 }), AT('spin', 8, 6, 14, [-70, -78, 140, 78], 1.3, { col: '#ffffff', kb: 8, stag: 30, hit: 'hit_h' })]) },
        { id: 'whip', name: 'Thorn Whip', desc: 'Long lashes that leave bleeding thorns.', gear: 'whip', len: 50, bleed: true,
          atks: chain3([AT('thrust', 8, 4, 12, [8, -60, 176, 28], .9, { col: '#ff6a6a', sfx: 'swing_m' }), AT('thrust', 8, 4, 12, [8, -60, 176, 28], .9, { col: '#ff6a6a', sfx: 'swing_m' }), AT('down', 10, 5, 16, [8, -84, 196, 70], 1.4, { col: '#ffffff', kb: 9, stag: 40, hit: 'hit_h', sfx: 'swing_h' })]) },
        { id: 'fangs', name: 'Fang and Claw', desc: 'The beast within: frantic short claws.', gear: 'claws', len: 18, lifesteal: true,
          atks: chain3([AT('down', 3, 3, 5, [4, -60, 52, 54], .5, { col: '#ff5a5a', move: 5 }), AT('up', 3, 3, 5, [4, -60, 52, 54], .5, { col: '#ff5a5a', move: 5 }), AT('down', 3, 3, 5, [4, -60, 52, 54], .5, { col: '#ff5a5a', move: 5 }), AT('up', 3, 3, 5, [4, -60, 52, 54], .55, { col: '#ff5a5a', move: 5 }), AT('thrust', 6, 4, 12, [0, -64, 72, 60], 1.2, { col: '#ffffff', move: 14, kb: 8, stag: 30, hit: 'hit_h' })]) }
    ]
};
// Part I frame data is reused where the weapon is the old one.
WEAPONS2.rook[1].atks = CHARS.rook.atks; WEAPONS2.rook[1].chargeAtk = CHARS.rook.chargeAtk;
WEAPONS2.sable[0].atks = CHARS.sable.atks; WEAPONS2.sable[0].heavy = CHARS.sable.heavy;
const W_TIERS = [{ name: 'Common', mul: 1, col: '#c8c8c8', cost: 0 }, { name: 'Rare', mul: 1.15, col: '#6ab0ff', cost: 60 }, { name: 'Holy', mul: 1.32, col: '#ffe27a', cost: 150 }, { name: 'Legendary', mul: 1.52, col: '#ff9a3a', cost: 320 }, { name: 'Genesis', mul: 1.8, col: '#ffffff', cost: 600 }];

/* ------------------------------ KITS ------------------------------ */
const near = (p, r) => Combat.targetsNear(p.x, p.y - 30, r);
const KITS = {
    zero: {
        role: 'BEARER OF THE SEVENTH DAY', title: 'Zero', atk: 24, ranged: false, gunner: false, heavyCharge: null,
        bio: 'The Lamb who walked to the altar on its own feet and closed the Book. A new world was written from that Book, with every crack in its author. Zero wakes in the Garden of Genesis, whole for the first time, and still has not slept.',
        line: '"Then let it be mended."', weakness: 'Light Form left on too long blinds you; Wrath Form left on too long burns your own life.',
        passive: { name: 'Balance', desc: 'Switch between Light (fast, heals on hit, takes 30% more damage when Balance runs low) and Wrath (heavy, breaks armour, drains HP when Balance runs high). Switching far from the centre unleashes a transition strike.' },
        skills: {
            s1: { name: 'Twin Edge', desc: 'For 6 seconds a shadow of yourself repeats every cut at 60% power.', cost: 30, cd: 540, col: '#9aa8ff', *run(p) { p.buffs.twin = p.up('z2_s1') ? 540 : 360; VFX.ring(p.x, p.y - 34, 90, '#9aa8ff', 18, 6); Sound.sfx('blink'); yield 6; } },
            s2: { name: 'Forgiveness', desc: 'A perfect guard for a third of a second: the blow is forgiven, you heal, and the attacker is stunned.', cost: 15, cd: 300, col: '#ffffff', *run(p) { p.vx = 0; p.parry = p.up('z2_s2') ? 30 : 21; p.pose({ aF: 82, fF: 40, lean: 6, by: 6, lF: 20, sF: 30, lB: -20, sB: 22 }, 4); Sound.sfx('block'); yield () => p.parry <= 0; yield 4; } },
            s3: { name: 'Genesis Step', desc: 'Dash through the line of foes; the light you leave behind burns them.', cost: 20, cd: 210, col: '#00ffff', *run(p) { const x0 = p.x, d = (Input.down('left') ? -1 : Input.down('right') ? 1 : p.facing); p.facing = d; p.inv = 20; Sound.sfx('dash'); for (let i = 0; i < 10; i++) { p.vx = d * 24; p.vy = 0; G.afterimage(p, '#00ffff'); yield 1; } p.vx = d * 4; const len = Math.abs(p.x - x0) + 40; VFX.beam(Math.min(x0, p.x) - 20, p.y - 34, 0, len, 44, '#00ffff', 16); Combat.lineHit(p, Math.min(x0, p.x) - 20, p.y - 34, 0, len, 80, { dmg: p.up('z2_s3') ? 2.6 : 1.8, stag: 30, col: '#bff8ff', hit: 'hit_h', light: true }); yield 6; } }
        },
        ult: { name: 'THE FIRST DAY', col: '#ffffff', *run(p) {
            Combat.banner(p, 'THE FIRST DAY', '#ffffff', 40); p.inv = 160; p.noGrav = true; p.vx = p.vy = 0; G.flash = 1; yield 40;
            const cols = ['#fff6c8', '#6ac8ff', '#7ae07a', '#c8b0ff', '#ffb050', '#c0c8d8', '#ffffff'];
            for (let i = 0; i < 7; i++) { G.slowmo = 8; VFX.slash(p.x + (i % 2 ? -1 : 1) * 160, p.y - 40 - (i - 3) * 14, 380, i % 2 ? -1 : 1, cols[i], -1.4, 1.4, 14, 2); Sound.sfx('swing_h'); G.addShake(6); for (const t of near(p, 820)) Combat.hit(p, t, { dmg: 1.6, stag: 30, col: cols[i], hit: 'hit_h', ult: true, light: true }); yield 10; }
            p.noGrav = false; yield 10;
        } },
        upgrades: [
            { id: 'z2_atk', name: 'Mended Edge', desc: '+15% attack.', cost: 1, mod: { atk: .15 }, branch: 'Might' },
            { id: 'z2_hp', name: 'Whole at Last', desc: '+15% max HP.', cost: 1, mod: { hp: .15 }, branch: 'Faith' },
            { id: 'z2_s1', name: 'Twin Edge: Long Shadow', desc: 'Variant: the shadow stays 9 seconds.', cost: 2, branch: 'Grace' },
            { id: 'z2_s2', name: 'Forgiveness: Patience', desc: 'Variant: the perfect guard window is 40% longer.', cost: 2, branch: 'Faith' },
            { id: 'z2_s3', name: 'Genesis Step: Burning Trail', desc: 'Variant: the trail deals 45% more damage.', cost: 2, branch: 'Might' },
            { id: 'z2_bal', name: 'Still Centre', desc: 'Balance drifts half as fast.', cost: 3, branch: 'Grace' }
        ]
    },
    rook: {
        role: 'RIDER OF WAR', passive: { name: 'Battlefield Rage', desc: 'Every blow taken builds Rage. Rage raises damage by up to 50% and fades slowly.' },
        weakness: 'Slow. Rage is empty at the start of every fight.',
        skills: {
            s1: { name: 'Command', desc: 'Call three shadow soldiers who fight beside you for 10 seconds.', cost: 35, cd: 840, col: '#ffaa33', *run(p) { p.pose(PO.up[1], 8); Sound.sfx('trumpet', { v: .5 }); for (let i = 0; i < 3; i++) G.fields.push({ kind: 'g2ally', x: p.x - p.facing * (40 + i * 28), y: p.y, t: 0, life: p.up('r2_s1') ? 900 : 600, owner: p, col: '#ffaa33', cd: 20 + i * 8, facing: p.facing }); yield 12; } },
            s2: { name: 'Earth Rift', desc: 'Slam the ground and send a burning rift along it.', cost: 25, cd: 360, col: '#ff7a18', *run(p) { p.pose(PO.slam[0], 12); yield 12; p.pose(PO.slam[1], 3, 'snap'); yield 3; Sound.sfx('slam'); G.addShake(10); VFX.groundWave(p.x + p.facing * 60, p.y, 140, '#ff7a18'); Combat.shoot(p, 'wave', p.x + p.facing * 40, p.y - 22, p.facing * 10, 0, { dmg: 2.4, pierce: 99, life: 60, kby: -8, stag: 40, r: 26, element: 0 }); if (p.up('r2_s2')) Combat.shoot(p, 'wave', p.x - p.facing * 40, p.y - 22, -p.facing * 10, 0, { dmg: 2.4, pierce: 99, life: 60, kby: -8, stag: 40, r: 26, element: 0 }); yield 18; } },
            s3: { name: 'No Retreat', desc: 'Plant your feet: immune to all damage for 3 seconds while you stand still.', cost: 30, cd: 960, col: '#ffe2a8', *run(p) { if (!p.grounded) { p.energy += 30; p.cds.s3 = 20; return; } p.standT = 180; VFX.ring(p.x, p.y - 34, 80, '#ffe2a8', 20, 8); Sound.sfx('block'); yield 8; } }
        },
        ult: { name: 'THE LAST BATTLE', col: '#ff8a20', *run(p) {
            Combat.banner(p, 'THE LAST BATTLE', '#ff8a20', 30); p.inv = 140; yield 20; G.flags.army = { t: 0, dir: p.facing, x: G.cam.x };
            for (let i = 0; i < 6; i++) { Sound.sfx('slam', { v: .6 }); G.addShake(8); for (const t of near(p, 900)) Combat.hit(p, t, { dmg: 1.4, kb: 6 * p.facing, stag: 30, col: '#ffaa33', hit: 'hit_h', ult: true }); yield 14; }
            G.flags.army = null; yield 10;
        } },
        upgrades: [
            { id: 'r2_atk', name: 'Veteran', desc: '+15% attack.', cost: 1, mod: { atk: .15 }, branch: 'Might' }, { id: 'r2_hp', name: 'Layered Plate', desc: '+15% max HP.', cost: 1, mod: { hp: .15 }, branch: 'Faith' },
            { id: 'r2_s1', name: 'Command: Long Watch', desc: 'Variant: soldiers stay 15 seconds.', cost: 2, branch: 'Grace' }, { id: 'r2_s2', name: 'Earth Rift: Twin Rift', desc: 'Variant: the rift runs both ways.', cost: 2, branch: 'Might' },
            { id: 'r2_rage', name: 'Old Scars', desc: 'Rage builds twice as fast.', cost: 2, branch: 'Might' }, { id: 'r2_dr', name: 'Doors Stay Open', desc: 'Take 10% less damage.', cost: 3, mod: { dr: .1 }, branch: 'Faith' }
        ]
    },
    sable: {
        passive: { name: 'Death Mark', desc: 'Hits mark foes. Five marks burst on their own; Death Knell detonates them all.' },
        weakness: 'Fragile, and the marks do nothing until they are spent.',
        skills: {
            s1: { name: 'Shadow Swap', desc: 'Step out of the nearest foe\'s shadow, behind them. The next hit is critical.', cost: 20, cd: 240, col: '#a855ff', *run(p) {
                const t = Combat.nearest(p.x, p.y, 520); if (!t) { p.energy += 20; p.cds.s1 = 20; Sound.sfx('ui_deny'); return; }
                p.inv = 24; VFX.burst(p.x, p.y - 30, '#a855ff', 18, 5, 26, 7, 1); Sound.sfx('blink'); yield 3;
                const side = p.x < t.x ? 1 : -1, nx = t.x + side * (t.w / 2 + 26); if (Combat.canStand(nx, t.y)) { p.x = nx; p.y = Math.min(t.y, p.y); } p.facing = t.x > p.x ? 1 : -1; p.buffs.nextCrit = 2; VFX.burst(p.x, p.y - 30, '#a855ff', 18, 5, 26, 7, 1); yield 6;
            } },
            s2: { name: 'Death Knell', desc: 'Detonate every mark nearby. Foes under 20% health die at once.', cost: 30, cd: 480, col: '#e9d5ff', *run(p) {
                Sound.sfx('toll', { v: .7 }); VFX.ring(p.x, p.y - 30, 420, '#e9d5ff', 22, 8);
                for (const t of near(p, 640)) { if (t.marks) { Combat.hit(p, t, { dmg: .9 * t.marks * (p.up('s2_s2') ? 1.4 : 1), stag: 30, col: '#e9d5ff', hit: 'hit_h', ult: true }); t.marks = 0; } if (!t.dead && !t.boss && t.hp < t.maxHp * .2) { t.hurt(t.hp + 1, { dir: 0, stag: 0 }); VFX.text(t.x, t.y - t.h - 20, 'EXECUTED', '#e9d5ff', 16, 40); } }
                yield 14;
            } },
            s3: { name: 'Veil', desc: 'Vanish for 4 seconds. Foes lose you, and your first strike deals triple.', cost: 30, cd: 720, col: '#7c3aed', *run(p) { p.veil = 240; p.buffs.nextCrit = 3; Sound.sfx('blink'); VFX.burst(p.x, p.y - 30, '#7c3aed', 24, 4, 30, 8, 1); yield 6; } }
        },
        ult: { name: 'HOUR OF VERDICT', col: '#a855ff', *run(p) {
            Combat.banner(p, 'HOUR OF VERDICT', '#a855ff', 24); p.inv = 160; G.freeze = 110; G.darken = .5; const ts = near(p, 900).slice(0, 10); yield 20;
            for (const t of ts) { if (t.dead) continue; VFX.slash(t.x, t.y - t.h / 2, 60, 1, '#e9d5ff'); Combat.hit(p, t, { dmg: 3.2, stag: 60, col: '#e9d5ff', hit: 'hit_h', forceCrit: true, ult: true }); Sound.sfx('swing_l'); yield 6; }
            G.darken = 0; yield 8;
        } },
        upgrades: [
            { id: 's2_atk', name: 'Sharpened Spine', desc: '+15% attack.', cost: 1, mod: { atk: .15 }, branch: 'Might' }, { id: 's2_crit', name: 'Killer Instinct', desc: '+12% crit chance.', cost: 1, mod: { crit: .12 }, branch: 'Grace' },
            { id: 's2_s2', name: 'Death Knell: Heavy Bell', desc: 'Variant: detonations deal 40% more.', cost: 2, branch: 'Might' }, { id: 's2_mark', name: 'Deep Marks', desc: 'Marks burst at four instead of five.', cost: 2, branch: 'Grace' },
            { id: 's2_hp', name: 'Second Wind', desc: '+20% max HP.', cost: 2, mod: { hp: .2 }, branch: 'Faith' }, { id: 's2_cd', name: 'Eleven Minutes', desc: 'Cooldowns recover 20% faster.', cost: 3, mod: { cdr: .2 }, branch: 'Grace' }
        ]
    },
    mirae: {
        passive: { name: 'Two Faces', desc: 'The same drop is poison to foes and medicine to friends: every cloud and field you leave heals you while you stand in it.' },
        weakness: 'Poison is slow. Burst comes only from Plague.', heavyCharge: null, hover: true,
        skills: {
            s1: { name: 'Venom Moths', desc: 'Release six moths that hunt the nearest foes.', cost: 25, cd: 360, col: '#9dff40', *run(p) { p.pose(PO.cast[1], 6); Sound.sfx('squish'); for (let i = 0; i < (p.up('m2_s1') ? 9 : 6); i++) { const pr = Combat.shoot(p, 'orb', p.x, p.y - 44, U.rand(-4, 4) + p.facing * 2, U.rand(-6, -2), { dmg: .7, r: 6, life: 180, col: '#c8ff70' }); pr.g2home = .08; pr.g2poison = 1; } yield 10; } },
            s2: { name: 'Parasite', desc: 'Take over the nearest lesser foe for 10 seconds. It fights for you.', cost: 35, cd: 900, col: '#b8ff60', *run(p) { const t = Combat.nearest(p.x, p.y, 360); if (!t || t.boss) { p.energy += 35; p.cds.s2 = 20; Sound.sfx('ui_deny'); return; } t.g2charm = 600; VFX.lightning(p.x, p.y - 40, t.x, t.y - t.h / 2, '#b8ff60'); Sound.sfx('volt'); yield 10; } },
            s3: { name: 'Serum', desc: 'Heal 40% of your health over 6 seconds.', cost: 30, cd: 660, col: '#7fffd4', *run(p) { p.hot = 360; VFX.ring(p.x, p.y - 34, 70, '#7fffd4', 18, 6); Sound.sfx('checkpoint', { v: .6 }); yield 6; } }
        },
        ult: { name: 'THE GREAT PLAGUE', col: '#9dff40', *run(p) {
            Combat.banner(p, 'THE GREAT PLAGUE', '#9dff40', 30); p.inv = 100; yield 16;
            G.fields.push({ kind: 'g2fog', x: p.x, y: p.y - 60, r: 700, t: 0, life: 320, owner: p, col: '#9dff40' }); Sound.sfx('squish'); G.addShake(6); yield 14;
        } },
        upgrades: [
            { id: 'm2_atk', name: 'Purified Residue', desc: '+15% attack.', cost: 1, mod: { atk: .15 }, branch: 'Might' }, { id: 'm2_en', name: 'Deep Reserves', desc: '+40 max energy.', cost: 1, mod: { energy: 40 }, branch: 'Grace' },
            { id: 'm2_s1', name: 'Venom Moths: Swarm', desc: 'Variant: nine moths.', cost: 2, branch: 'Might' }, { id: 'm2_heal', name: 'Bedside Manner', desc: 'Your clouds heal twice as much.', cost: 2, branch: 'Faith' },
            { id: 'm2_hp', name: 'Antibodies', desc: '+15% max HP.', cost: 2, mod: { hp: .15 }, branch: 'Faith' }, { id: 'm2_cd', name: 'Notes in the Margin', desc: 'Cooldowns recover 20% faster.', cost: 3, mod: { cdr: .2 }, branch: 'Grace' }
        ]
    },
    ysolde: {
        passive: { name: 'Hunger', desc: 'Hunger rises whenever you stop striking. The hungrier you are, the harder you hit, but above half you start to waste away.' },
        weakness: 'Standing still is starvation.', canGuard: false,
        skills: {
            s1: { name: 'Devour', desc: 'Bite the nearest foe: drain its life, strip its armour, sate some hunger.', cost: 20, cd: 300, col: '#ff4a5a', *run(p) { const t = Combat.nearest(p.x, p.y, 130); if (!t) { p.energy += 20; p.cds.s1 = 20; Sound.sfx('ui_deny'); return; } p.pose(PO.thrust[1], 3, 'snap'); yield 3; const d = Combat.hit(p, t, { dmg: 2.4, stag: 40, col: '#ff4a5a', hit: 'hit_h' }); p.heal(d * .5); t.shred = 300; t.armorFront = false; p.hunger = Math.max(0, p.hunger - 15); Sound.sfx('growl'); yield 10; } },
            s2: { name: 'Withered Harvest', desc: 'A field of famine: foes inside are slowed and drained.', cost: 30, cd: 600, col: '#c8a050', *run(p) { p.pose(PO.cast[1], 6); G.fields.push({ kind: 'g2wither', x: p.x, y: p.y, r: 170, t: 0, life: 240, owner: p, col: '#c8a050' }); Sound.sfx('frost', { v: .6 }); yield 10; } },
            s3: { name: 'Last Feast', desc: 'Heal to full. Costs half your hunger, and needs at least a third.', cost: 0, cd: 1200, col: '#ffffff', *run(p) { if (p.hunger < 33) { p.cds.s3 = 30; VFX.text(p.x, p.y - 80, 'NOT HUNGRY ENOUGH', '#ffb0a0', 13, 30); return; } p.hunger = Math.max(0, p.hunger - 50); p.heal(p.maxHp); VFX.ring(p.x, p.y - 34, 90, '#ff4a5a', 20, 8); Sound.sfx('levelup'); yield 6; } }
        },
        ult: { name: 'THE GREAT FAMINE', col: '#ff4a5a', *run(p) {
            Combat.banner(p, 'THE GREAT FAMINE', '#ff4a5a', 30); p.inv = 90; yield 16; let tot = 0;
            for (const t of near(p, 900)) { const amt = t.boss ? t.maxHp * .08 : t.hp * .3 + 10; tot += t.hurt(amt, { dir: 0, stag: 30 }); VFX.lightning(t.x, t.y - t.h / 2, p.x, p.y - 30, '#ff4a5a'); }
            p.heal(tot); G.addShake(8); yield 16;
        } },
        upgrades: [
            { id: 'y2_atk', name: 'Duty Blade', desc: '+15% attack.', cost: 1, mod: { atk: .15 }, branch: 'Might' }, { id: 'y2_hp', name: 'Oath Plate', desc: '+15% max HP.', cost: 1, mod: { hp: .15 }, branch: 'Faith' },
            { id: 'y2_slow', name: 'Lean Years', desc: 'Hunger rises half as fast.', cost: 2, branch: 'Faith' }, { id: 'y2_bite', name: 'Devour: Marrow', desc: 'Variant: Devour heals for all the damage it deals.', cost: 2, branch: 'Might' },
            { id: 'y2_sp', name: 'The Line Never Stops', desc: '+10% move speed.', cost: 2, branch: 'Grace' }, { id: 'y2_crit', name: 'Hollow Eyes', desc: '+10% crit chance.', cost: 3, mod: { crit: .1 }, branch: 'Grace' }
        ]
    }
};
for (const id in KITS) Object.assign(CHARS[id], KITS[id], { weapons: WEAPONS2[id] });
Object.assign(RELICS, {
    mirror: { name: 'Mirror of Forgiveness', desc: 'A perfect guard or parry fires a ray of light.', mod: {} },
    ember: { name: 'Ember Heart', desc: 'Every fifth hit sets the foe alight.', mod: {} },
    bell: { name: 'Quiet Bell', desc: '+15% damage while at full health.', mod: {} },
    ticket3: { name: 'Line 3 Ticket', desc: 'From the last journey. +5% attack and max HP.', mod: { atk: .05, hp: .05 } }
});

/* ------------------------ PLAYER, PART II ------------------------ */
const _PlayerP1 = Player;
Player = class extends _PlayerP1 {
    constructor(id) {
        super(id);
        const base = CHARS[id];
        this.def = Object.create(base);
        this.cds.s3 = 0; this.buffs = {}; this.parry = 0; this.standT = 0; this.veil = 0; this.hot = 0; this.hitCount = 0; this.lastHitT = 0;
        this.form = id === 'zero' ? 'light' : null; this.balance = 50; this.formCd = 0; this.rage = id === 'rook' ? 0 : null; this.hunger = id === 'ysolde' ? 20 : null;
        this.wIdx = (Save.data && Save.data.g2 && Save.data.g2.wIdx[id]) || 0; this.applyWeapon();
    }
    get weapon() { return this.def.weapons[this.wIdx]; }
    applyWeapon() {
        const w = this.weapon, base = CHARS[this.id], d = this.def;
        d.atks = w.atks || base.atks; d.heavy = w.heavy || null; d.chargeAtk = w.chargeAtk || null; d.heavyCharge = null;
        d.ranged = !!w.ranged; d.gunner = false; d.rate = w.rate || 12; d.canGuard = !!w.guard; d.guardPose = base.guardPose || { aF: 82, fF: 8, aB: -14, fB: 30, lean: 6, by: 5, lF: 22, sF: 32, lB: -20, sB: 26, w: 8 };
        this.rig.S = Object.assign({}, base.style, { weaponF: Gear[w.gear] || base.style.weaponF, weaponLen: w.len || base.style.weaponLen });
        if (this.id === 'sable' && w.id !== 'shadow') this.rig.S.weaponB = null;
        if (this.id === 'ysolde') this.rig.S.weaponB = w.id === 'sickles' ? Gear.sickles : null;
        if (this.id === 'rook' && w.id === 'rampart') this.rig.S.weaponB = Gear.hammer;
    }
    swapWeapon() {
        if (this.state !== 'move') return;
        this.wIdx = (this.wIdx + 1) % this.def.weapons.length; Save.data.g2.wIdx[this.id] = this.wIdx; this.applyWeapon();
        Sound.sfx('hit_metal', { v: .4 }); G.toast(tr(this.weapon.name), W_TIERS[this.tier()].col);
    }
    tier() { return (Save.data.g2.wTier[this.id + ':' + this.weapon.id]) || 0; }
    switchForm() {
        if (!this.form || this.formCd > 0) return;
        const off = Math.abs(this.balance - 50); this.form = this.form === 'light' ? 'wrath' : 'light'; this.formCd = 36;
        Sound.sfx(this.form === 'light' ? 'parry' : 'roar', { v: .6 }); VFX.ring(this.x, this.y - 34, 60, this.form === 'light' ? '#bff8ff' : '#ff1100', 14, 5);
        if (off > 20) {
            this.balance += (50 - this.balance) * .6; G.addShake(8); G.slowmo = 10;
            VFX.ring(this.x, this.y - 34, 170, this.form === 'light' ? '#ffffff' : '#ff2a1a', 22, 10);
            Combat.aoe(this, this.x, this.y - 34, 160, { dmg: this.form === 'wrath' ? 2.6 : 1.8, kb: 10, stag: 50, hit: 'hit_h', col: this.form === 'light' ? '#ffffff' : '#ff2a1a', light: this.form === 'light' });
            if (this.form === 'light') this.heal(this.maxHp * .06);
        }
    }
    tickTimers(In) {
        super.tickTimers(In);
        if (this.cds.s3 > 0) this.cds.s3 -= 1 + this.mods.cdr;
        if (this.parry > 0) this.parry--; if (this.formCd > 0) this.formCd--; if (this.veil > 0) this.veil--;
        for (const k in this.buffs) if (this.buffs[k] > 0 && k !== 'nextCrit') this.buffs[k]--;
        if (this.standT > 0) { this.standT--; if (Math.abs(this.vx) > 1.2 || !this.grounded) this.standT = 0; }
        if (this.hot > 0) { this.hot--; this.heal(this.maxHp * .4 / 360, true); }
        if (this.form) {
            const k = this.up('z2_bal') ? .05 : .1; this.balance = U.clamp(this.balance + (this.form === 'light' ? -k : k), 0, 100);
            if (this.form === 'wrath' && this.balance > 85 && this.hp > 1 && G.time % 20 === 0) this.hp = Math.max(1, this.hp - 1);
        }
        if (this.rage !== null) this.rage = Math.max(0, this.rage - .07);
        if (this.hunger !== null && this.state !== 'dead') {
            if (G.time - this.lastHitT > 90) this.hunger = Math.min(100, this.hunger + (this.up('y2_slow') ? .06 : .12));
            if (this.hunger > 50 && G.time % 30 === 0) this.hp = Math.max(1, this.hp - Math.ceil((this.hunger - 50) / 25));
        }
        // Power is recomposed every tick from level, weapon tier and the live mechanics.
        let m = W_TIERS[this.tier()].mul;
        if (this.form === 'light') m *= .9; else if (this.form === 'wrath') m *= 1.45;
        if (this.rage !== null) m *= 1 + this.rage / 200;
        if (this.hunger !== null) m *= 1 + this.hunger / 150;
        if (Save.data.equipped.includes('bell') && this.hp >= this.maxHp) m *= 1.15;
        this.power = this.basePower * m;
        const spd = CHARS[this.id].speed * (this.form === 'light' ? 1.1 : this.form === 'wrath' ? .9 : 1) * (this.up('y2_sp') ? 1.1 : 1);
        this.def.speed = spd;
    }
    recalc() { super.recalc(); this.basePower = this.power; }
    tryCombat(In) {
        if (In.pressed('weapon')) { this.swapWeapon(); return true; }
        if (In.pressed('form') && this.form) { this.switchForm(); }
        if (In.pressed('skill3') && this.startSkill('s3')) return true;
        if (In.pressed('nyx') && !this.def.noAttack && G.ally) G2.commandZero();
        return super.tryCombat(In);
    }
    startAttack(def) {
        if (def && def.smoke) { G.fields.push({ kind: 'g2smoke', x: this.x + this.facing * 70, y: this.y - 20, r: 100, t: 0, life: 200, owner: this, col: '#9dff40' }); Sound.sfx('squish'); }
        super.startAttack(def);
    }
    strike(a, hits, dmgOverride) {
        super.strike(a, hits, dmgOverride);
        if (this.buffs.twin > 0 && hits && hits.add && hits !== this._twinFor) {
            this._twinFor = hits; const ghost = Object.assign({}, a, { dmg: a.dmg * .6, col: '#9aa8ff' }), seen = new Set();
            G.delay(8, () => { if (this.state !== 'dead') { G.afterimage(this, '#9aa8ff'); _PlayerP1.prototype.strike.call(this, ghost, seen); } });
        }
    }
    fireBasic() {
        const w = this.weapon, s = w.shot; if (!s) return super.fireBasic();
        const a = this.aimAngle(); this.firing = 12; this.aimLast = a; this.shotCd = Math.round(w.rate * this.mods.rate);
        if (Math.abs(Math.cos(a)) > .05) this.facing = Math.cos(a) > 0 ? 1 : -1;
        const mx = this.x + Math.cos(a) * 24, my = this.y - 42 + Math.sin(a) * 24;
        let vx = Math.cos(a) * s.spd, vy = Math.sin(a) * s.spd;
        if (s.lob) { const t = Combat.nearest(this.x, this.y - 40, 620, 0, true); if (t) { const T = 34; vx = (t.x - mx) / T; vy = (t.y - t.h / 2 - my) / T - .5 * s.grav * T; } else { vx = this.facing * 7; vy = -7; } }
        const pr = Combat.shoot(this, s.kind, mx, my, vx, vy, { dmg: s.dmg, r: s.r, pierce: s.pierce || 0, life: s.life, col: s.col, grav: s.grav || 0, explode: s.explode || 0, stag: 10, poison: s.poison });
        if (s.home) pr.g2home = s.home; pr.g2poison = s.poison;
        Sound.sfx(this.id === 'sable' ? 'knife' : 'squish', { v: .5 });
    }
    hurt(dmg, src = {}) {
        if (this.state === 'dead') return false;
        if (this.parry > 0 && !src.tick) {
            this.parry = 0; this.inv = 24; this.heal(this.maxHp * .1); G.slowmo = 18; Sound.sfx('parry'); VFX.ring(this.x + this.facing * 20, this.y - 34, 80, '#ffffff', 18, 6); VFX.text(this.x, this.y - 84, 'FORGIVEN', '#ffffff', 16, 34);
            if (src.owner && src.owner.stagger && !src.owner.boss) src.owner.stagger(80); if (src.owner && src.owner.boss) src.owner.stunT = 30;
            if (Save.data.equipped.includes('mirror')) Combat.shoot(this, 'rail', this.x, this.y - 42, this.facing * 26, 0, { dmg: 3, pierce: 9, r: 10, life: 40, col: '#ffffff' });
            this.ult = Math.min(100, this.ult + 10); Save.stat('parries', 1); return false;
        }
        if (this.standT > 0 && !src.fall) { if (G.time % 10 === 0) VFX.text(this.x, this.y - 80, 'IMMUNE', '#ffe2a8', 13, 20); return false; }
        if (this.form === 'light' && this.balance < 15) dmg *= 1.3;
        const r = super.hurt(dmg, src);
        if (r && this.rage !== null) this.rage = Math.min(100, this.rage + dmg / this.maxHp * 100 * (this.up('r2_rage') ? 2.4 : 1.2));
        return r;
    }
    draw(ctx) {
        if (this.veil > 0) ctx.globalAlpha = .3;
        if (this.form === 'wrath') Paint.glow(ctx, this.x, this.y - 32, 40, '#ff1100'); else if (this.form === 'light') Paint.glow(ctx, this.x, this.y - 32, 34, '#bff8ff');
        if (this.standT > 0) { ctx.strokeStyle = '#ffe2a8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y - 32, 44, 0, TAU); ctx.stroke(); }
        if (this.parry > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x + this.facing * 18, this.y - 34, 28, -1.2, 1.2); ctx.stroke(); }
        super.draw(ctx); ctx.globalAlpha = 1;
        if (G.flags.army) { const A = G.flags.army; A.t++; for (let i = 0; i < 16; i++) { const x = A.x + (A.dir > 0 ? -60 + A.t * 16 : VW + 60 - A.t * 16) - i * 40 * A.dir, y = this.y - (i % 3) * 10; ctx.globalAlpha = .45; ctx.fillStyle = '#ff8a40'; ctx.fillRect(x - 10, y - 60, 20, 60); ctx.globalAlpha = 1; } }
    }
};

/* ---- combat hooks: light-only foes, armour break, marks, hunger, pull, poison, bleed ---- */
(function () {
    const hit = Combat.hit.bind(Combat);
    Combat.hit = function (p, t, a) {
        if (!p || !p.isPlayer || !t || t.dead) return hit(p, t, a);
        a = Object.assign({}, a);
        const pj = Combat._proj; if (pj) { if (pj.g2poison) a.poison = 1; if (pj.light) a.light = true; }
        const lightHit = a.light || p.form === 'light';
        if (t.def && t.def.lightOnly && !lightHit) { a.dmg = (a.dmg || 1) * .25; }
        if (p.buffs && p.buffs.nextCrit) { a.forceCrit = true; a.dmg = (a.dmg || 1) * p.buffs.nextCrit; p.buffs.nextCrit = 0; p.veil = 0; }
        let af = false; const W = p.weapon;
        if ((p.form === 'wrath' || (W && W.armorBreak)) && t.armorFront) { af = true; t.armorFront = false; }
        if (W && W.lifesteal) a.lifesteal = true;
        const d = hit(p, t, a);
        if (af) t.armorFront = true;
        if (d > 0) {
            p.lastHitT = G.time; p.hitCount = (p.hitCount || 0) + 1;
            if (p.form === 'light') p.heal(.6, true);
            if (p.id === 'sable' && !t.dead) { t.marks = (t.marks || 0) + 1; if (t.marks >= (p.up('s2_mark') ? 4 : 5)) { t.marks = 0; hit(p, t, { dmg: 1.2, stag: 20, col: '#e9d5ff', hit: 'hit_h', ult: true }); VFX.ring(t.x, t.y - t.h / 2, 40, '#e9d5ff', 12, 4); } }
            if (p.hunger !== null) p.hunger = Math.max(0, p.hunger - 3);
            if ((a.pull || (W && W.atks && a.hook)) && !t.boss && !t.dead) { t.vx = (p.x + p.facing * 40 - t.x) * .16; t.vy = -3; }
            if (a.poison || (W && W.id === 'serpent')) t.g2poison = Math.max(t.g2poison || 0, 180);
            if (W && W.bleed) t.g2bleed = Math.max(t.g2bleed || 0, 150);
            if (Save.data.equipped.includes('ember') && p.hitCount % 5 === 0 && !t.dead) Combat.applyElement(p, t, 0);
        }
        return d;
    };
    // A hooked chain that catches nothing drags its wielder forward instead.
    const strike = _PlayerP1.prototype.strike;
    _PlayerP1.prototype.strike = function (a, hits, o) {
        const n0 = hits && hits.size; strike.call(this, a, hits, o);
        if (a.hook && this.atkT === a.s + a.a - 1 && hits && hits.size === n0 && hits.size === 0) { this.vx = this.facing * 16; this.vy = -5; VFX.beam(this.x, this.y - 40, this.facing > 0 ? 0 : Math.PI, 200, 6, '#e8fbff', 10); }
    };
    // Friendly homing (moths, Nyx's light, venom).
    const pu = Proj.prototype.update;
    Proj.prototype.update = function () {
        if (this.g2home && this.friendly) { const t = Combat.nearest(this.x, this.y, 520); if (t) { const c = t.aim ? t.aim() : { x: t.x, y: t.y - t.h / 2 }, a = Math.atan2(c.y - this.y, c.x - this.x), s = Math.max(6, Math.hypot(this.vx, this.vy)); this.vx = U.lerp(this.vx, Math.cos(a) * s, this.g2home); this.vy = U.lerp(this.vy, Math.sin(a) * s, this.g2home); } }
        Combat._proj = this; try { pu.call(this); } finally { Combat._proj = null; }
    };
    const eu = Enemy.prototype.update;
    Enemy.prototype.update = function () {
        if (!this.dead && G.time % 30 === 0) {
            if (this.g2poison > 0) { this.hurt(G.player.power * .22, { dir: 0, stag: 0 }); VFX.add(this.x, this.y - this.h * .6, 0, -1.4, '#9dff40', 20, 6, 1, 0); }
            if (this.g2bleed > 0) { this.hurt(G.player.power * .18, { dir: 0, stag: 0 }); VFX.add(this.x, this.y - this.h * .6, 0, 1, '#ff4a5a', 20, 5, 1, .2); }
        }
        if (this.g2poison > 0) this.g2poison--; if (this.g2bleed > 0) this.g2bleed--;
        if (this.g2charm > 0 && !this.dead) return this.charmTick();
        eu.call(this);
    };
    Enemy.prototype.charmTick = function () {
        this.g2charm--; this.anim++;
        let best = null, bd = 1e9; for (const e of G.enemies) if (e !== this && !e.dead && !e.g2charm && !e.untargetable) { const d = Math.abs(e.x - this.x); if (d < bd) { bd = d; best = e; } }
        if (best) { this.facing = U.sign(best.x - this.x); if (bd > 50) this.vx = this.facing * this.def.spd; else { this.vx *= .7; if (G.time % 40 === 0) { Combat.hit(G.player, best, { dmg: .7, stag: 20, col: '#b8ff60', hit: 'hit_l' }); VFX.slash(this.x + this.facing * 26, this.y - this.h / 2, 40, this.facing, '#b8ff60'); } } }
        if (this.flyer) { this.x += this.vx; this.y += Math.sin(this.anim * .05) * .5; } else { this.vy = Math.min(this.vy + GRAV, 14); Phys.move(this); }
        if (this.rig) { this.rig.play(Math.abs(this.vx) > .4 ? 'run' : 'idle', 6); this.rig.tick(); this.rig.solve(); }
        if (G.time % 6 === 0) VFX.add(this.x, this.y - this.h - 8, 0, -.6, '#b8ff60', 14, 4, 1, 0);
    };
    const tg = Combat.targets.bind(Combat); Combat.targets = () => tg().filter(e => !e.g2charm);
    const tin = Combat.targetsIn.bind(Combat); Combat.targetsIn = R => tin(R).filter(e => !e.g2charm);
    const sees = Enemy.prototype.sees; Enemy.prototype.sees = function (d, dx, dy) { if (G.player && G.player.veil > 0) return false; return sees.call(this, d, dx, dy); };
    // The plague raises the fallen as brief allies.
    const ok = G.onKill.bind(G);
    G.onKill = function (e) {
        ok(e);
        const fog = G.fields.find(f => f.kind === 'g2fog');
        if (fog && !e.boss && !e.summoned && !e.risen) G.delay(36, () => { const r = G.spawn(e.type, e.x, e.y, { spawnIn: true, summoned: true, hpMult: .5 }); r.g2charm = 480; r.risen = true; });
    };
    /* G2 fields live alongside Part I fields but never reach Part I's element code. */
    const tf = Combat.tickFields.bind(Combat), df = Combat.drawFields.bind(Combat);
    Combat.tickFields = function () {
        const mine = G.fields.filter(f => f.kind.startsWith('g2')); G.fields = G.fields.filter(f => !f.kind.startsWith('g2')); tf();
        const P = G.player;
        for (const f of mine) {
            f.t++;
            if (f.kind === 'g2ally') {
                const t = Combat.nearest(f.x, f.y - 30, 600); if (t) { f.facing = U.sign(t.x - f.x); if (Math.abs(t.x - f.x) > 46) f.x += f.facing * 3.4; else if (--f.cd <= 0) { f.cd = 40; Combat.hit(f.owner, t, { dmg: .7, stag: 20, col: '#ffaa33', hit: 'hit_l' }); VFX.slash(f.x + f.facing * 26, f.y - 30, 40, f.facing, '#ffaa33'); } }
                else f.x = U.lerp(f.x, P.x - P.facing * 60, .05);
                const s = G.level.surfaceBelow(f.x, f.y - 40, 200); if (s !== null) f.y = s;
            } else if (f.kind !== 'g2shade' && f.t % 30 === 0) {
                const heal = (f.kind === 'g2smoke' || f.kind === 'g2fog') ? (f.owner.up && f.owner.up('m2_heal') ? 2 : 1) : 0;
                for (const t of Combat.targetsNear(f.x, f.y - 20, f.r)) {
                    Combat.hit(f.owner, t, { dmg: f.kind === 'g2fog' ? .6 : f.kind === 'g2wither' ? .45 : .4, stag: 6, col: f.col, hit: 'hit_l', ult: true, poison: f.kind !== 'g2wither' });
                    if (f.kind === 'g2wither') { t.slowT = 40; f.owner.heal(f.owner.power * .15, true); }
                }
                if (heal && Math.hypot(P.x - f.x, P.y - 30 - f.y) < f.r) P.heal(P.maxHp * .02 * heal, true);
            }
        }
        G.fields = G.fields.concat(mine.filter(f => f.t < f.life));
    };
    Combat.drawFields = function (c) {
        const mine = G.fields.filter(f => f.kind.startsWith('g2')), rest = G.fields.filter(f => !f.kind.startsWith('g2'));
        G.fields = rest; df(c); G.fields = rest.concat(mine);
        for (const f of mine) {
            if (f.kind === 'g2shade') continue;
            const a = Math.min(1, f.t / 12) * Math.min(1, (f.life - f.t) / 30);
            c.save(); c.globalAlpha = a;
            if (f.kind === 'g2ally') { const st = CHARS.rook.style; c.globalAlpha = .55 * a; c.save(); c.translate(f.x, f.y); c.scale(f.facing * 1.05, 1.05); c.fillStyle = '#ff8a40'; c.fillRect(-9, -62, 18, 40); Paint.disc(c, 0, -68, 8, '#ff8a40'); c.fillRect(-3, -40, 26, 5); c.restore(); }
            else { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const ang = i * 1.7 + f.t * .02, rr = f.r * (.35 + .5 * Math.abs(Math.sin(i * 2.1))); c.fillStyle = U.rgba(f.col, .12); c.beginPath(); c.arc(f.x + Math.cos(ang) * rr * .6, f.y + Math.sin(ang) * rr * .22, rr * .55, 0, TAU); c.fill(); } }
            c.restore();
        }
    };
})();
