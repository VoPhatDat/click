'use strict';
/**
 * CHARS: the five playable operators. Attacks are frame data (startup, active,
 * recovery) with poses, skills are generator scripts driven by the player state.
 * Zero keeps the original game's kit: arm cannon, Escalating Cannon, Aegis, Trinity.
 */
const humanClips = extra => Object.assign({}, extra);

/* Gear painters */
const Gear = {
    hammer(c, J, S, r) {
        c.fillStyle = Paint.c('#4a4038'); c.fillRect(-2.5, -8, 5, 46);
        Paint.poly(c, [-15, 34, 15, 34, 18, 44, 15, 56, -15, 56, -18, 44], '#2b2d33');
        c.fillStyle = Paint.c('#ffaa33'); c.fillRect(-13, 42, 26, 4);
        if (r.owner && r.owner.charge > 0) Paint.glow(c, 0, 45, 18 + r.owner.charge * .5, '#ffaa33');
    },
    kukri(flip) {
        return (c, J, S, r) => {
            c.fillStyle = Paint.c('#222'); c.fillRect(-1.5, -2, 3, 8);
            Paint.poly(c, [-1.5, 5, 2, 5, 5 * flip, 16, 3 * flip, 26, -3, 25, -2, 15], '#c9c4f5');
            c.fillStyle = Paint.c('#a855ff'); c.fillRect(-.5, 7, 1.6, 15);
        };
    },
    focus(c, J, S, r) {
        const col = r.owner ? ELEMENTS[r.owner.element].col : '#7fffd4';
        Paint.glow(c, 0, 6, 15, col); Paint.disc(c, 0, 5, 3, '#ffffff');
    },
    shield(c, J, S, r) {
        Paint.poly(c, [-6, -24, 15, -22, 19, 0, 15, 26, -6, 30, -9, 0], '#3b4a63');
        Paint.poly(c, [-3, -18, 12, -17, 15, 0, 12, 21, -3, 24, -5, 0], '#c9a227');
        Paint.poly(c, [0, -11, 8, -10, 10, 0, 8, 14, 0, 16, -2, 0], '#26324a');
        if (r.owner && r.owner.guarding) Paint.glow(c, 6, 0, 34, '#ffd86b');
    },
    sword(c, J, S, r) {
        c.fillStyle = Paint.c('#6b5a2a'); c.fillRect(-1.5, -3, 3, 8); c.fillRect(-6, 4, 12, 2.5);
        Paint.poly(c, [-2.5, 6, 2.5, 6, 2, 38, 0, 44, -2, 38], '#dfe7ef');
    },
    cannon(c, J, S, r) {
        const on = r.owner && r.owner.cannonAmmo > 0;
        c.fillStyle = Paint.c('#444a56'); c.fillRect(-5, 0, 10, 24);
        c.fillStyle = Paint.c('#262a33'); c.fillRect(-6, 4, 12, 5);
        const g = on ? '#ff1100' : '#00ffff'; c.fillStyle = Paint.c(g); c.fillRect(on ? -4 : -2, 22, on ? 8 : 4, 5);
        Paint.glow(c, 0, 26, on ? 14 : 9, g);
    }
};
const ELEMENTS = [
    { id: 'fire', name: 'EMBER', col: '#ff6a2a', sfx: 'fire' },
    { id: 'frost', name: 'RIME', col: '#7fd8ff', sfx: 'frost' },
    { id: 'volt', name: 'ARC', col: '#d9b3ff', sfx: 'volt' }
];

const CHARS = {
    rook: {
        id: 'rook', name: 'ROOK ADEYEMI', role: 'RIDER OF WAR', title: 'Vanguard',
        hp: 190, atk: 30, speed: 4.6, jump: 13.2, energy: 100,
        dodge: { spd: 11, frames: 17, inv: 13, cd: 42, air: false, clip: 'roll' },
        bars: { POWER: 5, DURABILITY: 5, MOBILITY: 2, RANGE: 2 },
        bio: 'Chief engineer of the Halcyon shelters. He sealed the blast doors on the Day of Unmaking, with thousands still outside, and woke thirty years later unable to die of it.',
        line: '"Doors stay open this time."',
        weakness: 'Slow, short dodge, no air recovery.',
        passive: { name: 'Iron Hide', desc: 'Takes 15% less damage and shrugs off stagger from anything below a quarter of max HP.' },
        style: {
            scale: 1.08, bone: { thigh: 15, shin: 15, upper: 13, fore: 14, torso: 23, head: 9, limbW: 8, waist: 8, chest: 12 },
            col: { armor: '#3a3f4b', armor2: '#6b7284', dark: '#23262e', skin: '#5c3a26', boot: '#191b21', glow: '#ffaa33' },
            weaponLen: 56, gait: { stride: 34, knee: 46, arm: 20, armF: 30, armB: 24, elbow: 42, lean: 12, bounce: 3.4, off: 2, w: 40 },
            idle: { aF: 34, fF: 34, aB: 26, fB: 46, w: 30, lean: 6, lF: 10, lB: -10, sF: 12, sB: 12 },
            paint: paintHumanoid,
            weaponF: Gear.hammer,
            torsoGear(c, J) { Paint.disc(c, J.sh.x, J.sh.y, 11, '#6b7284'); Paint.disc(c, J.sh.x + 1, J.sh.y, 7, '#3a3f4b'); },
            headGear(c, J) { const h = J.head; Paint.disc(c, h.x, h.y - 1, 9, '#3a3f4b'); c.fillStyle = Paint.c('#ffaa33'); c.fillRect(h.x + 1, h.y - 2, 8, 3); }
        },
        atks: {
            a1: { s: 8, a: 4, r: 11, box: [6, -66, 72, 64], dmg: .9, kb: 5, stag: 22, move: 2, next: 'a2', sfx: 'swing_m', hit: 'hit_h', slash: [46, -36], col: '#ffc070', trail: 1, wind: { aF: 145, fF: 22, lean: -8, lF: 18, lB: -18 }, str: { aF: 40, fF: 8, lean: 18, lF: 26, sF: 26, lB: -26, sB: 12 } },
            a2: { s: 9, a: 4, r: 12, box: [6, -74, 76, 74], dmg: 1, kb: 6, stag: 24, move: 2, next: 'a3', sfx: 'swing_m', hit: 'hit_h', slash: [48, -36], col: '#ffc070', trail: 1, wind: { aF: 20, fF: 6, lean: 14, lF: 22, lB: -22 }, str: { aF: 128, fF: 16, lean: -6, lF: 18, sF: 16, lB: -30, sB: 20 } },
            a3: { s: 15, a: 5, r: 20, box: [4, -86, 96, 86], dmg: 1.7, kb: 10, kby: -5, stag: 44, move: 3, sfx: 'swing_h', hit: 'hit_h', slash: [56, -40], col: '#ffa040', trail: 1, shake: 7, slam: true, wind: { aF: 178, fF: 18, lean: -14, lF: 14, sF: 24, lB: -14, sB: 24, by: 4 }, str: { aF: 34, fF: 2, lean: 30, lF: 40, sF: 56, lB: -34, sB: 14, by: 10 } }
        },
        chargeAtk: { full: 54, s: 4, a: 5, r: 24, box: [4, -96, 112, 96], dmgMin: 1.5, dmgMax: 3.6, kb: 13, kby: -6, stag: 60, sfx: 'swing_h', hit: 'hit_h', col: '#ff8a20', slam: true, windPose: { aF: 176, fF: 16, lean: -16, lF: 18, sF: 34, lB: -22, sB: 30, by: 8 }, str: { aF: 26, fF: 0, lean: 34, lF: 44, sF: 60, lB: -36, sB: 14, by: 12 } },
        skills: {
            s1: {
                name: 'Seismic Breach', desc: 'Slam the hammer down and send a fissure along the ground.', cost: 30, cd: 420, col: '#ffaa33',
                *run(p) {
                    p.pose({ aF: 178, fF: 14, lean: -14, by: 6, lF: 14, sF: 30, lB: -14, sB: 30 }, 14); yield 14;
                    p.pose({ aF: 28, fF: 0, lean: 34, by: 12, lF: 42, sF: 58, lB: -34, sB: 14 }, 3, 'snap'); yield 4;
                    Sound.sfx('slam'); G.addShake(10); VFX.groundWave(p.x + p.facing * 60, p.y, 120, '#ffaa33');
                    const dirs = p.up('r_s1') ? [1, -1] : [p.facing];
                    dirs.forEach(d => Combat.shoot(p, 'wave', p.x + d * 40, p.y - 22, d * 9, 0, { dmg: 2.4, pierce: 99, life: 60, kby: -8, stag: 40, r: 26 }));
                    yield 22;
                }
            },
            s2: {
                name: 'Counter Stance', desc: 'Brace. Any hit in the window is negated and answered with a crushing blow.', cost: 20, cd: 480, col: '#ffe2a8',
                *run(p) {
                    p.vx = 0; p.counterOpen = p.up('r_s2') ? 70 : 46; p.pose({ aF: 60, fF: 90, lean: 8, by: 8, lF: 24, sF: 44, lB: -24, sB: 30, w: 80 }, 6);
                    Sound.sfx('block');
                    yield () => p.counterOpen <= 0 || p.counterHit;
                    if (!p.counterHit) { p.counterOpen = 0; yield 8; return; }
                    p.counterHit = false; p.inv = 34; G.slowmo = 16; Sound.sfx('parry'); VFX.ring(p.x, p.y - 40, 110, '#ffe2a8');
                    p.pose({ aF: 178, fF: 14, lean: -14, by: 5 }, 8); yield 9;
                    p.pose({ aF: 26, fF: 0, lean: 34, by: 12, lF: 42, sF: 58, lB: -34, sB: 14 }, 3, 'snap'); yield 3;
                    Sound.sfx('slam'); G.addShake(14);
                    p.strike({ box: [-20, -100, 150, 100], dmg: 3.2, kb: 14, kby: -6, stag: 70, hit: 'hit_h', col: '#ffe2a8' }, {});
                    VFX.slash(p.x + p.facing * 40, p.y - 40, 76, p.facing, '#ffe2a8', -1.4, 1.5, 12);
                    yield 16;
                }
            }
        },
        ult: {
            name: 'CATACLYSM', col: '#ff8a20',
            *run(p) {
                Combat.banner(p, 'CATACLYSM', '#ff8a20', 34); p.inv = 110; p.noGrav = true; p.vx = 0;
                p.pose({ aF: 176, fF: 10, lean: -18, by: 10, lF: 30, sF: 70, lB: -8, sB: 50 }, 10); yield 12;
                for (let i = 0; i < 18; i++) { p.vy = -15 + i * .6; if (i % 2) VFX.add(p.x, p.y, U.rand(-1, 1), 3, '#ff8a20', 22, 12, 1, 0); yield 1; }
                p.vy = 0; yield 8;
                p.pose({ aF: 22, fF: 0, lean: 36, lF: 40, sF: 60, lB: -30, sB: 20 }, 4, 'snap');
                p.noGrav = false; p.vy = 26; yield () => p.grounded;
                const R = p.up('r_ult') ? 520 : 400;
                Sound.sfx('bigboom'); G.addShake(26); G.flash = .5; VFX.groundWave(p.x, p.y, R, '#ff8a20', 34); VFX.ring(p.x, p.y - 30, R * .8, '#ffd080', 28, 14);
                for (let i = 0; i < 26; i++) VFX.add(p.x + U.rand(-R * .6, R * .6), p.y, U.rand(-2, 2), U.rand(-11, -3), '#ff8a20', 40, 10, 1, .3);
                Combat.aoe(p, p.x, p.y - 30, R, { dmg: 7, kb: 16, kby: -9, stag: 120, hit: 'hit_h', col: '#ff8a20', ult: true });
                yield 26;
            }
        },
        upgrades: [
            { id: 'r_atk', name: 'Tempered Head', desc: '+15% attack.', cost: 1, mod: { atk: .15 } },
            { id: 'r_hp', name: 'Layered Plate', desc: '+15% max HP.', cost: 1, mod: { hp: .15 } },
            { id: 'r_s1', name: 'Twin Fissure', desc: 'Seismic Breach travels both ways.', cost: 2 },
            { id: 'r_s2', name: 'Patient Hands', desc: 'Counter Stance stays open 50% longer.', cost: 2 },
            { id: 'r_ult', name: 'Tectonic Reach', desc: 'Cataclysm radius +30%.', cost: 3 },
            { id: 'r_chg', name: 'Overcharge', desc: 'Fully charged heavy deals +40%.', cost: 2 }
        ]
    },

    sable: {
        id: 'sable', name: 'SABLE VU', role: 'RIDER OF DEATH', title: 'Phantom',
        hp: 105, atk: 19, speed: 6.5, jump: 13.8, energy: 100,
        dodge: { spd: 19, frames: 12, inv: 12, cd: 24, air: true, clip: 'dodge', after: true },
        bars: { POWER: 3, DURABILITY: 1, MOBILITY: 5, RANGE: 3 },
        bio: 'A Meridian Line courier who could cross Halcyon in eleven minutes and never once delivered bad news. Sable keeps moving so the past cannot catch up.',
        line: '"Blink and you\'ll keep your dignity."',
        weakness: 'Fragile: one boss combo can end the run.',
        canWall: true,
        passive: { name: 'Ghost Edge', desc: '20% crit chance, +60% damage from behind, and a perfect dodge refills the dash.' },
        style: {
            bone: { thigh: 15, shin: 15, upper: 12, fore: 12, torso: 20, head: 8, limbW: 5, waist: 5, chest: 7 },
            col: { armor: '#231f33', armor2: '#3e3760', dark: '#141220', skin: '#caa184', boot: '#0d0c14', glow: '#a855ff' },
            weaponLen: 26, chainSeg: 8, gait: { stride: 50, knee: 80, arm: 8, armF: -50, armB: -60, elbow: 20, lean: 28, bounce: 2.5, off: 8, w: 90, w2: 90 },
            idle: { aF: 24, fF: 44, aB: -22, fB: 34, w: 60, w2: 70, lean: 10, lF: 18, sF: 30, lB: -16, sB: 26, by: 4 },
            paint: paintHumanoid, weaponF: Gear.kukri(1), weaponB: Gear.kukri(-1),
            chainPaint(c, r) { paintChain(5, '#7c3aed', '#c084fc')(c, r); },
            headGear(c, J) {
                const h = J.head; Paint.disc(c, h.x - 1, h.y - 1, 8.5, '#231f33');
                Paint.poly(c, [h.x + 1, h.y - 3, h.x + 9, h.y - 2, h.x + 8, h.y + 3, h.x + 1, h.y + 4], '#caa184');
                c.fillStyle = Paint.c('#c084fc'); c.fillRect(h.x + 3, h.y - 1, 4, 1.6);
            }
        },
        atks: {
            a1: { s: 3, a: 3, r: 6, box: [4, -62, 56, 56], dmg: .75, kb: 2, stag: 9, move: 5, next: 'a2', sfx: 'swing_l', hit: 'hit_l', slash: [32, -36], col: '#c084fc', trail: 1, wind: { aF: 110, fF: 40, lean: -4, w: 60 }, str: { aF: 70, fF: -10, lean: 24, lF: 30, sF: 22, lB: -30, sB: 30, w: 80 } },
            a2: { s: 3, a: 3, r: 6, box: [4, -62, 56, 56], dmg: .75, kb: 2, stag: 9, move: 5, next: 'a3', sfx: 'swing_l', hit: 'hit_l', slash: [32, -36], col: '#c084fc', wind: { aB: 110, fB: 30, lean: -4 }, str: { aB: 74, fB: -8, aF: -40, lean: 26, lF: -24, sF: 30, lB: 30, sB: 20, w2: 80 } },
            a3: { s: 3, a: 3, r: 7, box: [4, -70, 62, 66], dmg: .85, kb: 3, stag: 10, move: 5, next: 'a4', sfx: 'swing_l', hit: 'hit_l', slash: [34, -40], col: '#d8b4fe', trail: 1, wind: { aF: 40, fF: 20, aB: 30, lean: 16 }, str: { aF: 120, fF: 10, aB: 120, fB: 10, lean: -2, lF: 30, sF: 30, lB: -24, sB: 20 } },
            a4: { s: 4, a: 3, r: 7, box: [4, -66, 66, 62], dmg: .9, kb: 3, stag: 12, move: 6, next: 'a5', sfx: 'swing_l', hit: 'hit_l', slash: [36, -36], col: '#d8b4fe', wind: { lean: 180, aF: 90, aB: 90, by: 2 }, str: { lean: 360, aF: 80, aB: 80, lF: 30, sF: 40 } },
            a5: { s: 6, a: 4, r: 14, box: [0, -74, 86, 72], dmg: 1.5, kb: 8, kby: -3, stag: 28, move: 8, sfx: 'swing_m', hit: 'hit_h', slash: [46, -38], col: '#e9d5ff', shake: 4, trail: 1, wind: { aF: -60, fF: 10, aB: -70, lean: 34, by: 8, lF: 60, sF: 90, lB: -30, sB: 40 }, str: { aF: 96, fF: 0, aB: 96, fB: 0, lean: 30, lF: 40, sF: 30, lB: -40, sB: 20, w: 90, w2: 90 } }
        },
        heavy: { s: 12, a: 5, r: 14, box: [0, -60, 118, 44], dmg: 2.3, kb: 7, stag: 34, move: 15, sfx: 'swing_m', hit: 'hit_h', slash: [54, -36], col: '#a855ff', pierceBack: true, trail: 1, wind: { aF: -50, fF: 90, aB: -60, fB: 80, lean: 30, by: 12, lF: 60, sF: 90, lB: -30, sB: 40 }, str: { aF: 90, fF: 0, aB: 84, fB: 0, lean: 38, lF: 56, sF: 30, lB: -56, sB: 14, w: 90, w2: 90 } },
        skills: {
            s1: {
                name: 'Shadowstep', desc: 'Vanish and strike the nearest enemy from behind.', cost: 25, cd: 300, col: '#a855ff',
                *run(p) {
                    const t = Combat.nearest(p.x, p.y, p.up('s_s1') ? 640 : 460);
                    if (!t) { p.energy += 25; p.cds.s1 = 20; Sound.sfx('ui_deny'); return; }
                    p.inv = 24; VFX.burst(p.x, p.y - 30, '#a855ff', 18, 5, 26, 7, 1); Sound.sfx('blink');
                    yield 3;
                    const side = p.x < t.x ? 1 : -1, nx = t.x + side * (t.w / 2 + 26);
                    if (Combat.canStand(nx, t.y)) { p.x = nx; p.y = Math.min(t.y, p.y); } else if (Combat.canStand(t.x - side * (t.w / 2 + 26), t.y)) p.x = t.x - side * (t.w / 2 + 26);
                    p.facing = t.x > p.x ? 1 : -1;
                    VFX.burst(p.x, p.y - 30, '#a855ff', 18, 5, 26, 7, 1);
                    p.pose({ aF: 96, fF: 0, aB: 96, fB: 0, lean: 30, lF: 40, sF: 30, lB: -40, sB: 20, w: 90, w2: 90 }, 3, 'snap'); yield 4;
                    p.strike({ box: [-6, -70, 96, 74], dmg: 3, kb: 6, stag: 40, forceCrit: true, hit: 'hit_h', col: '#e9d5ff' }, {});
                    VFX.slash(p.x + p.facing * 34, p.y - 36, 50, p.facing, '#e9d5ff'); Sound.sfx('swing_m'); yield 10;
                }
            },
            s2: {
                name: 'Blade Fan', desc: 'Throw a spread of piercing knives.', cost: 20, cd: 240, col: '#c084fc',
                *run(p) {
                    p.pose({ aF: 110, fF: 0, aB: 100, fB: 0, lean: 14, lF: 24, sF: 20, lB: -24, sB: 20 }, 4, 'snap'); yield 5;
                    const n = p.up('s_s2') ? 7 : 5, base = p.aimAngle();
                    Sound.sfx('knife');
                    for (let i = 0; i < n; i++) {
                        const a = base + (i - (n - 1) / 2) * .13;
                        Combat.shoot(p, 'knife', p.x, p.y - 40, Math.cos(a) * 15, Math.sin(a) * 15, { dmg: .85, pierce: 2, life: 42, stag: 10, r: 8 });
                    }
                    yield 12;
                }
            }
        },
        ult: {
            name: 'THOUSAND CUTS', col: '#a855ff',
            *run(p) {
                Combat.banner(p, 'THOUSAND CUTS', '#a855ff', 30); p.inv = 150; p.noGrav = true; p.vx = p.vy = 0;
                p.pose({ aF: -50, fF: 90, aB: -60, fB: 80, lean: 30, by: 12, lF: 60, sF: 90, lB: -30, sB: 40 }, 8); yield 22;
                const ox = p.x, oy = p.y, targets = Combat.targetsNear(p.x, p.y, 760).slice(0, p.up('s_ult') ? 10 : 7);
                const passes = targets.length <= 2 ? 6 : 2;
                for (let n = 0; n < passes; n++) for (const t of targets) {
                    if (t.dead) continue;
                    const px = p.x, py = p.y, d = n % 2 ? -1 : 1;
                    p.x = t.x + d * (t.w / 2 + 18); p.y = t.y; p.facing = -d;
                    VFX.effect(9, (c, k) => { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.strokeStyle = '#d8b4fe'; c.lineWidth = 4; c.beginPath(); c.moveTo(px, py - 30); c.lineTo(p.x, p.y - 30); c.stroke(); });
                    Combat.hit(p, t, { dmg: 1.5, stag: 30, kb: 1, hit: 'hit_l', col: '#e9d5ff', crit: .5, ult: true });
                    Sound.sfx('swing_l'); G.addShake(3); yield 4;
                }
                p.x = ox; p.y = oy; p.noGrav = false; VFX.burst(p.x, p.y - 30, '#a855ff', 24, 6, 30, 8, 1); yield 8;
            }
        },
        upgrades: [
            { id: 's_atk', name: 'Sharpened Spine', desc: '+15% attack.', cost: 1, mod: { atk: .15 } },
            { id: 's_crit', name: 'Killer Instinct', desc: '+12% crit chance.', cost: 1, mod: { crit: .12 } },
            { id: 's_s1', name: 'Long Shadow', desc: 'Shadowstep reaches 40% further.', cost: 2 },
            { id: 's_s2', name: 'Seven Fold', desc: 'Blade Fan throws 7 knives.', cost: 2 },
            { id: 's_ult', name: 'Death by Inches', desc: 'Thousand Cuts tags up to 10 targets.', cost: 3 },
            { id: 's_hp', name: 'Second Wind', desc: '+20% max HP.', cost: 2, mod: { hp: .2 } }
        ]
    },

    mirae: {
        id: 'mirae', name: 'MIRAE SOL', role: 'RIDER OF PLAGUE', title: 'Arcanist',
        hp: 115, atk: 21, speed: 5, jump: 13.5, energy: 120,
        dodge: { spd: 15, frames: 11, inv: 12, cd: 36, air: true, clip: 'dodge', after: true },
        bars: { POWER: 4, DURABILITY: 2, MOBILITY: 3, RANGE: 5 },
        bio: 'Junior catalyst researcher, youngest on Project Zero. The residue in her blood answers to thought: ember, rime and arc. She reads every field log looking for the moment she could have stopped it.',
        line: '"Physics is a suggestion. I have notes."',
        weakness: 'Weak up close; slow bolts need leading without auto-aim.',
        ranged: true, hover: true,
        passive: { name: 'Resonance', desc: 'Two elements on one target react: Melt (Ember + Rime), Overload (Ember + Arc), Superconduct (Rime + Arc).' },
        style: {
            bone: { thigh: 14, shin: 15, upper: 12, fore: 12, torso: 21, head: 8, limbW: 5, waist: 5, chest: 7 },
            col: { armor: '#d8e3e0', armor2: '#f4fbf8', dark: '#7a8c8c', skin: '#e5c29f', boot: '#39474a', glow: '#7fffd4' },
            weaponLen: 12, gait: { stride: 26, knee: 36, arm: 8, armF: 44, armB: -30, elbow: 40, lean: 10, bounce: 1.6, off: 2 },
            idle: { aF: 44, fF: 60, aB: -14, fB: 24, lean: 2, lF: 6, lB: -6 },
            paint: paintHumanoid, weaponF: Gear.focus,
            torsoGear(c, J, S, r) {
                const h = J.hip, a = (r.gaitSwing || 0);
                Paint.poly(c, [h.x - 8, h.y - 2, h.x + 8, h.y - 2, h.x + 7 + a, h.y + 24, h.x - 13 + a, h.y + 26], '#b9cac6');
                c.fillStyle = Paint.c('#2dd4bf'); c.fillRect(h.x - 7, h.y - 2, 14, 2.4);
            },
            headGear(c, J) {
                const h = J.head; Paint.disc(c, h.x - 2, h.y - 3, 8, '#1e2a3a'); Paint.disc(c, h.x - 7, h.y - 8, 4, '#1e2a3a');
                Paint.poly(c, [h.x + 1, h.y - 4, h.x + 8, h.y - 2, h.x + 7, h.y + 5, h.x + 1, h.y + 5], '#e5c29f');
                c.fillStyle = Paint.c('#2dd4bf'); c.fillRect(h.x + 2, h.y - 1, 6, 1.6);
            },
            overGear(c, J, S, r) {
                // Orbiting motes show which elements are ready at a glance.
                for (let i = 0; i < 3; i++) {
                    const a = r.time * .05 + i * TAU / 3;
                    const on = r.owner ? r.owner.element === i : false;
                    Paint.glow(c, J.neck.x + Math.cos(a) * 24, J.neck.y + Math.sin(a) * 10, on ? 9 : 5, ELEMENTS[i].col);
                }
            }
        },
        rate: 15,
        castPose: { aF: 92, fF: 2 },
        heavyCharge: { full: 50 },
        skills: {
            s1: {
                name: 'Elemental Field', desc: 'Conjure a zone of your attuned element: burning ground, freezing spikes or a tesla field.', cost: 35, cd: 480, col: '#7fffd4',
                *run(p) {
                    const el = ELEMENTS[p.element];
                    p.pose({ aF: 150, fF: 10, aB: 140, fB: 10, lean: -4, head: -10 }, 8); yield 12;
                    p.pose({ aF: 40, fF: 16, aB: 40, fB: 16, lean: 14, by: 6 }, 4, 'snap'); yield 4;
                    const fx = p.x + p.facing * 150, gy = G.level.surfaceBelow(fx, p.y - 30, 300) || p.y;
                    Sound.sfx(el.sfx); Combat.field(p, fx, gy, p.element, p.up('m_s1') ? 280 : 200, 300);
                    yield 12;
                }
            },
            s2: {
                name: 'Phase Blink', desc: 'Step through space, even past thin walls, leaving a burst of your element.', cost: 15, cd: 180, col: '#99f6e4',
                *run(p) {
                    const el = ELEMENTS[p.element];
                    p.inv = 16; Sound.sfx('blink'); VFX.burst(p.x, p.y - 34, el.col, 16, 5, 22, 6, 1);
                    Combat.aoe(p, p.x, p.y - 30, 90, { dmg: 1, kb: 6, stag: 18, element: p.element, col: el.col, hit: 'hit_l' });
                    const dx = Input.down('left') ? -1 : Input.down('right') ? 1 : p.facing, dy = Input.down('up') ? -1 : 0;
                    let tx = p.x, ty = p.y; const reach = p.up('m_s2') ? 300 : 220;
                    for (let d = 20; d <= reach; d += 20) {
                        const nx = p.x + dx * d * (dy ? .72 : 1), ny = p.y + dy * d * .72;
                        if (Combat.canStand(nx, ny)) { tx = nx; ty = ny; }
                    }
                    p.x = tx; p.y = ty; p.vy = 0; VFX.burst(p.x, p.y - 34, el.col, 16, 5, 22, 6, 1); yield 6;
                }
            }
        },
        ult: {
            name: 'AOCALYST BLOOM', col: '#7fffd4',
            *run(p) {
                Combat.banner(p, 'AOCALYST BLOOM', '#7fffd4', 50); p.inv = 96; p.noGrav = true; p.vx = p.vy = 0;
                p.pose({ aF: 168, fF: 6, aB: 160, fB: 6, lean: -8, head: -18, lF: 20, sF: 44, lB: -4, sB: 44 }, 12);
                for (let i = 0; i < 46; i++) {
                    const a = U.rand(0, TAU), r = U.rand(150, 300), c = ELEMENTS[i % 3].col;
                    VFX.add(p.x + Math.cos(a) * r, p.y - 50 + Math.sin(a) * r, -Math.cos(a) * r / 18, -Math.sin(a) * r / 18, c, 18, 10, 1, 0);
                    p.vy = -.5; if (i % 8 === 0) Sound.sfx('charge', { v: .5 }); yield 1;
                }
                p.vy = 0; const R = p.up('m_ult') ? 640 : 500;
                Sound.sfx('bigboom'); G.addShake(28); G.flash = .9; ELEMENTS.forEach((e, i) => VFX.ring(p.x, p.y - 50, R * (1 - i * .18), e.col, 34, 20));
                Combat.aoe(p, p.x, p.y - 50, R, { dmg: 8, kb: 12, kby: -7, stag: 100, col: '#7fffd4', hit: 'hit_h', ult: true, allElements: true });
                yield 22; p.noGrav = false;
            }
        },
        upgrades: [
            { id: 'm_atk', name: 'Purified Residue', desc: '+15% attack.', cost: 1, mod: { atk: .15 } },
            { id: 'm_en', name: 'Deep Reserves', desc: '+40 max energy.', cost: 1, mod: { energy: 40 } },
            { id: 'm_s1', name: 'Wide Field', desc: 'Elemental Field radius +40%.', cost: 2 },
            { id: 'm_s2', name: 'Long Step', desc: 'Phase Blink reaches 35% further.', cost: 2 },
            { id: 'm_ult', name: 'Full Bloom', desc: 'Aocalyst Bloom radius +28%.', cost: 3 },
            { id: 'm_react', name: 'Chain Reaction', desc: 'Elemental reactions deal +50%.', cost: 2 }
        ]
    },

    ysolde: {
        id: 'ysolde', name: 'YSOLDE VARR', role: 'RIDER OF FAMINE', title: 'Warden',
        hp: 170, atk: 29, speed: 4.8, jump: 13.3, energy: 100,
        dodge: { spd: 12, frames: 14, inv: 11, cd: 38, air: false, clip: 'dodge' },
        bars: { POWER: 3, DURABILITY: 5, MOBILITY: 2, RANGE: 3 },
        bio: 'Warden of the Meridian Line for twenty-six years. She got the last train out of Halcyon and went back on foot for the passengers it left behind. None of them made it. She has not put the shield down since.',
        line: '"Stand behind me. That is the entire plan."',
        weakness: 'Low burst damage; guard drains energy.',
        passive: { name: 'Steadfast', desc: 'Blocking restores energy. Out of combat, HP slowly recovers.' },
        canGuard: true,
        style: {
            scale: 1.03, bone: { thigh: 15, shin: 15, upper: 13, fore: 13, torso: 22, head: 8.5, limbW: 7, waist: 7, chest: 10 },
            col: { armor: '#4b5a78', armor2: '#c9a227', dark: '#2a3346', skin: '#c28f6e', boot: '#1d2433', glow: '#ffd86b' },
            weaponLen: 44, chainSeg: 7, gait: { stride: 34, knee: 50, arm: 12, armF: 62, armB: -10, elbow: 40, lean: 8, bounce: 2.4, off: 2, w: 40, w2: 60 },
            idle: { aF: 62, fF: 42, aB: -10, fB: 30, w: 40, w2: 60, lean: 3, lF: 10, lB: -10, sF: 10, sB: 10 },
            paint: paintHumanoid, weaponF: Gear.shield, weaponB: Gear.sword,
            chainPaint(c, r) { paintChain(9, '#7a1f1f', '#c9a227')(c, r); },
            torsoGear(c, J) { Paint.disc(c, J.sh.x, J.sh.y, 9, '#c9a227'); Paint.disc(c, J.sh.x, J.sh.y, 6, '#4b5a78'); },
            headGear(c, J) {
                const h = J.head; Paint.disc(c, h.x, h.y - 1, 8.6, '#4b5a78');
                c.fillStyle = Paint.c('#c9a227'); c.fillRect(h.x - 2, h.y - 11, 3, 8);
                Paint.poly(c, [h.x + 2, h.y - 3, h.x + 9, h.y - 2, h.x + 8, h.y + 4, h.x + 2, h.y + 4], '#c28f6e');
                Paint.poly(c, [h.x - 3, h.y - 10, h.x - 15, h.y - 13, h.x - 12, h.y - 5, h.x - 3, h.y - 6], '#7a1f1f');
            }
        },
        atks: {
            a1: { s: 6, a: 4, r: 10, box: [4, -66, 72, 62], dmg: .8, kb: 4, stag: 16, move: 2, next: 'a2', sfx: 'swing_l', hit: 'hit_l', slash: [40, -36], col: '#ffe9a8', trail: 2, wind: { aB: 130, fB: 30, lean: -4, aF: 40 }, str: { aB: 50, fB: 6, lean: 16, lF: 22, sF: 22, lB: -22, sB: 14, w2: 86, aF: 30 } },
            a2: { s: 7, a: 4, r: 10, box: [4, -70, 76, 66], dmg: .9, kb: 4, stag: 18, move: 2, next: 'a3', sfx: 'swing_l', hit: 'hit_l', slash: [42, -36], col: '#ffe9a8', trail: 2, wind: { aB: 20, fB: 10, lean: 14, aF: 70 }, str: { aB: 120, fB: 16, lean: 0, lF: 18, sF: 16, lB: -26, sB: 18, aF: 40, w2: 86 } },
            a3: { s: 10, a: 5, r: 16, box: [2, -78, 88, 74], dmg: 1.5, kb: 9, kby: -3, stag: 34, move: 5, sfx: 'swing_m', hit: 'hit_h', slash: [46, -38], col: '#ffd86b', trail: 2, shake: 5, wind: { aB: -30, fB: 60, lean: -8, aF: 90, fF: 20 }, str: { aB: 90, fB: 0, lean: 26, lF: 36, sF: 30, lB: -30, sB: 14, aF: 100, fF: 10, w2: 90 } }
        },
        heavy: { s: 10, a: 5, r: 16, box: [2, -74, 66, 70], dmg: 1.4, kb: 11, stag: 50, move: 4, sfx: 'swing_m', hit: 'hit_metal', slash: [40, -38], col: '#ffd86b', shake: 4, wind: { aF: 30, fF: 90, lean: -8 }, str: { aF: 88, fF: 2, lean: 18, lF: 30, sF: 26, lB: -26, sB: 12 } },
        guardPose: { aF: 82, fF: 8, aB: -14, fB: 30, lean: 6, by: 5, lF: 22, sF: 32, lB: -20, sB: 26, w: 8 },
        skills: {
            s1: {
                name: 'Bulwark Charge', desc: 'Rush forward behind the shield, carrying enemies with you and stopping projectiles.', cost: 25, cd: 300, col: '#ffd86b',
                *run(p) {
                    p.pose({ aF: 82, fF: 8, lean: 24, by: 6, lF: 40, sF: 40, lB: -40, sB: 20 }, 4); p.inv = 26; Sound.sfx('dash');
                    p.guarding = true; const seen = new Set();
                    for (let i = 0; i < 24; i++) {
                        p.vx = p.facing * 12;
                        for (const t of Combat.targetsNear(p.x + p.facing * 40, p.y - 30, 56)) {
                            if (!seen.has(t)) { seen.add(t); Combat.hit(p, t, { dmg: 1.6, stag: 60, kb: 14, kby: -3, hit: 'hit_metal', col: '#ffd86b' }); G.addShake(5); }
                            else if (t.push !== false && !t.boss) t.x += p.vx * .85;
                        }
                        if (i % 2 === 0) VFX.dust(p.x - p.facing * 14, p.y, 1);
                        if (p.onWall) break;
                        yield 1;
                    }
                    p.guarding = false; p.vx *= .2; yield 8;
                }
            },
            s2: {
                name: 'Chain Anchor', desc: 'Lash out a chain that drags nearby enemies in and stuns them.', cost: 25, cd: 360, col: '#c9a227',
                *run(p) {
                    p.pose({ aB: 150, fB: 10, lean: -6, aF: 60 }, 6); yield 8;
                    p.pose({ aB: 30, fB: 10, lean: 16, aF: 30, lF: 20, sF: 24, lB: -20 }, 3, 'snap'); yield 3;
                    Sound.sfx('swing_h'); Sound.sfx('hit_metal');
                    const R = p.up('y_s2') ? 520 : 400, ts = Combat.targetsNear(p.x, p.y - 30, R);
                    for (const t of ts) {
                        const tx = t.x, ty = t.y - t.h / 2;
                        VFX.effect(14, (c, k) => { c.globalAlpha = 1 - k; c.strokeStyle = '#c9a227'; c.lineWidth = 3; c.setLineDash([7, 5]); c.beginPath(); c.moveTo(p.x, p.y - 40); c.lineTo(tx, ty); c.stroke(); c.setLineDash([]); });
                        if (!t.boss) { t.vx = (p.x + p.facing * 54 - t.x) * .14; t.vy = -3; t.stun = 70; }
                        Combat.hit(p, t, { dmg: .8, stag: 50, kb: 0, hit: 'hit_metal', col: '#ffd86b' });
                    }
                    yield 14;
                }
            }
        },
        ult: {
            name: 'BASTION', col: '#ffd86b',
            *run(p) {
                Combat.banner(p, 'BASTION', '#ffd86b', 26); p.inv = 40;
                p.pose({ aF: 40, fF: 0, aB: 150, fB: 0, lean: 18, by: 10, lF: 40, sF: 56, lB: -24, sB: 26 }, 8); yield 16;
                Sound.sfx('slam'); G.addShake(12); VFX.ring(p.x, p.y - 40, 240, '#ffd86b', 30, 12);
                const dur = p.up('y_ult') ? 660 : 480;
                G.fields.push({ kind: 'bastion', x: p.x, y: p.y - 30, r: 200, t: 0, life: dur, owner: p, col: '#ffd86b' });
                yield 16;
            }
        },
        upgrades: [
            { id: 'y_atk', name: 'Duty Blade', desc: '+15% attack.', cost: 1, mod: { atk: .15 } },
            { id: 'y_hp', name: 'Oath Plate', desc: '+15% max HP.', cost: 1, mod: { hp: .15 } },
            { id: 'y_guard', name: 'Hold the Line', desc: 'Guard blocks all damage and costs half the energy.', cost: 2 },
            { id: 'y_s2', name: 'Long Chain', desc: 'Chain Anchor range +30%.', cost: 2 },
            { id: 'y_ult', name: 'Last Stand', desc: 'Bastion lasts 3 seconds longer.', cost: 3 },
            { id: 'y_regen', name: 'Warden\'s Patience', desc: 'Out-of-combat recovery is doubled.', cost: 1 }
        ]
    },

    zero: {
        id: 'zero', name: 'ZERO', role: 'THE LAMB', title: 'Zero',
        hp: 130, atk: 6.2, speed: 5.6, jump: 13.5, energy: 100,
        dodge: { spd: 17, frames: 13, inv: 13, cd: 28, air: true, clip: 'dodge', eight: true, col: '#ff5500', after: true },
        bars: { POWER: 4, DURABILITY: 3, MOBILITY: 4, RANGE: 5 },
        bio: 'The one without a name. Bound as the Lamb of Project Zero and torn in two on the Day of Judgment, it rose from the ash thirty years later with no memory and an arm cannon that remembers everything. Heaven has told it to carry the Book.',
        line: '"Then let it be judged."',
        weakness: 'No melee at all; damage depends on staying at range and on Core shards.',
        ranged: true, gunner: true,
        passive: { name: 'Death Defy', desc: 'While Aegis holds, a lethal blow leaves Zero at 1 HP with a second of invulnerability.' },
        style: {
            bone: { thigh: 15, shin: 15, upper: 12, fore: 13, torso: 21, head: 8, limbW: 6, waist: 6, chest: 8 },
            col: { armor: '#1a1a24', armor2: '#343447', dark: '#101018', skin: '#101018', boot: '#00c0c0', glow: '#00ffff' },
            weaponLen: 28, chainSeg: 9, gait: { stride: 42, knee: 66, arm: 10, armF: 88, armB: -20, elbow: 4, lean: 14, bounce: 2.4, off: 4 },
            idle: { aF: 80, fF: 6, aB: -8, fB: 18, lean: 3, lF: 8, lB: -8 },
            paint: paintHumanoid, weaponF: Gear.cannon,
            chainPaint(c, r) { paintChain(13, '#990000', '#ff1100')(c, r); },
            torsoGear(c, J) { c.fillStyle = Paint.c('#00ffff'); c.fillRect(J.hip.x - 8, J.hip.y - 3, 16, 3.5); },
            headGear(c, J, S, r) {
                const h = J.head; Paint.disc(c, h.x, h.y, 8.2, '#1a1a24');
                const on = r.owner && r.owner.cannonAmmo > 0, col = on ? '#ff1100' : '#00ffff';
                c.fillStyle = Paint.c(col); c.fillRect(h.x + 2, h.y - 2.5, 6.5, 3.6); Paint.glow(c, h.x + 5, h.y - 1, 8, col);
            }
        },
        rate: 7,
        castPose: { aF: 92, fF: 2 },
        heavyCharge: { full: 46 },
        skills: {
            s1: {
                name: 'Escalating Cannon', desc: 'Overload the arm: the next 30 shots hit harder with every round, and kick back.', cost: 30, cd: 480, col: '#ff1100',
                *run(p) { p.cannonAmmo = 30; p.cannonFired = 0; VFX.burst(p.x, p.y - 34, '#ff1100', 20, 7, 26, 8, 1); G.addShake(8); Sound.sfx('charge'); yield 8; }
            },
            s2: {
                name: 'Aegis Forcefield', desc: 'For 5 seconds a shield absorbs damage and your rounds drain life.', cost: 30, cd: 480, col: '#ffcc00',
                *run(p) { p.shield = p.shieldMax = p.up('z_s2') ? 180 : 120; p.shieldT = 300; VFX.ring(p.x, p.y - 34, 80, '#ffcc00'); G.addShake(6); Sound.sfx('parry'); yield 8; }
            }
        },
        ult: {
            name: 'TRINITY OBLITERATION', col: '#ff00ff',
            *run(p) {
                const S = Save.data.shards, cols = [];
                if (S.r) cols.push('#ff2a00'); if (S.g) cols.push('#00ff55'); if (S.b) cols.push('#0088ff');
                if (!cols.length) cols.push('#00ffff');
                const mult = cols.length === 3 ? 4 : cols.length === 2 ? 2 : 1;
                Combat.banner(p, cols.length === 3 ? 'TRINITY OBLITERATION' : 'AUTO-OBLITERATION', cols.length === 3 ? '#ff00ff' : cols[0], 44, `POWER OUTPUT: x${mult}`);
                p.inv = 100; p.noGrav = true; p.vx = p.vy = 0;
                p.pose({ aF: 92, fF: 0, lean: 14, by: 6, lF: 24, sF: 30, lB: -30, sB: 20 }, 10); yield 46;
                for (let i = 0; i < cols.length; i++) {
                    const a = p.aimAngle(), off = (i - (cols.length - 1) / 2) * .08, ang = a + off;
                    VFX.beam(p.x, p.y - 42, ang, 1500, 150, cols[i], 26);
                    Sound.sfx('laser'); Sound.sfx('explode'); G.addShake(18); G.flash = .3;
                    Combat.lineHit(p, p.x, p.y - 42, ang, 1500, 110, { dmg: 6 * (mult > 1 ? mult * .8 : 1), kb: 14, stag: 90, col: cols[i], hit: 'hit_h', ult: true });
                    yield 18;
                }
                p.noGrav = false; yield 8;
            }
        },
        upgrades: [
            { id: 'z_atk', name: 'Hot Rounds', desc: '+15% attack.', cost: 1, mod: { atk: .15 } },
            { id: 'z_hp', name: 'Reinforced Frame', desc: '+15% max HP.', cost: 1, mod: { hp: .15 } },
            { id: 'z_s1', name: 'Bottomless Mag', desc: 'Escalating Cannon damage ramps 50% faster.', cost: 2 },
            { id: 'z_s2', name: 'Hardened Aegis', desc: 'Aegis absorbs 50% more damage.', cost: 2 },
            { id: 'z_chg', name: 'Rail Coil', desc: 'Charged shot deals +40% and pierces walls of enemies.', cost: 2 },
            { id: 'z_rate', name: 'Cyclic Feed', desc: 'Fire rate +20%.', cost: 3, mod: { rate: .8 } }
        ]
    }
};
const CHAR_ORDER = ['zero', 'rook', 'sable', 'mirae', 'ysolde'];

/* Relics are equipment: two slots, found in chests or dropped by bosses. */
const RELICS = {
    keycard: { name: 'Rusted Transit Pass', desc: '+8% attack.', mod: { atk: .08 } },
    gyro: { name: 'Atlas Gyroscope', desc: '+25 max energy and energy regen +30%.', mod: { energy: 25, enReg: .3 } },
    sporeheart: { name: 'Sporeheart', desc: 'Regain 3 HP on every kill.', mod: { killHeal: 3 } },
    seedling: { name: 'Glass Seedling', desc: '+12% max HP.', mod: { hp: .12 } },
    scarab: { name: 'Sovereign Scarab', desc: '+10% crit chance.', mod: { crit: .1 } },
    sunplate: { name: 'Sunplate Fragment', desc: 'Take 10% less damage.', mod: { dr: .1 } },
    fang: { name: 'Nadir Fang', desc: 'Critical hits deal +40% damage.', mod: { critDmg: .4 } },
    coldcell: { name: 'Coldcell', desc: 'All cooldowns recover 20% faster.', mod: { cdr: .2 } },
    cinder: { name: 'Cinder Crown', desc: 'Ultimate charges 30% faster.', mod: { ultGain: .3 } },
    pilot: { name: 'Pilot Light', desc: 'Dodge cooldown is 30% shorter.', mod: { dodgeCd: .3 } }
};
