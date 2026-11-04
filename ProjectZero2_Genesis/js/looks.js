'use strict';
/**
 * LOOKS: the detailed art pass. Hero gear, faction outfits for human enemies, unique
 * NPC costumes, redrawn creature bodies and extra boss detail. Gameplay is untouched.
 */
const Looks = {
    /** Applies a costume to a generated enemy style, chosen by enemy definition. */
    dress(d, S) {
        const n = d.name || '', C = d.col, O = this.outfits;
        const key = /Scavenger/.test(n) ? 'scav' : /Gunner/.test(n) ? 'gunner' : /Hunter/.test(n) ? 'hunter' : /Raider Warlord/.test(n) ? 'warlord' : /Raider/.test(n) ? 'raider' : /Thrall/.test(n) ? 'thrall' : /Mutant/.test(n) ? 'ash' : /Cantor/.test(n) ? 'cantor' : /Forge Knight/.test(n) ? 'knight' : null;
        if (key) O[key](S, C);
        return S;
    },
    npc(S, N) { const id = Object.keys(NPCS).find(k => NPCS[k] === N); if (this.npcs[id]) this.npcs[id](S); return S; },
    head(c, J, fn) { const h = J.head; c.save(); c.translate(h.x, h.y); c.rotate(h.a); fn(c); c.restore(); },
    outfits: {
        scav(S, C) {
            S.col.armor = '#54463a'; S.col.armor2 = '#7a6a54'; S.col.boot = '#2a241e';
            S.skirt = (c, J) => Paint.poly(c, [J.hip.x - 8, J.hip.y - 4, J.hip.x + 8, J.hip.y - 4, J.hip.x + 12, J.hip.y + 13, J.hip.x + 3, J.hip.y + 9, J.hip.x - 3, J.hip.y + 14, J.hip.x - 11, J.hip.y + 10], '#6a5540');
            S.torsoGear = (c, J) => { Paint.limb(c, { x: J.sh.x - 5, y: J.sh.y - 1 }, { x: J.hip.x + 5, y: J.hip.y - 4 }, 2.2, '#3a2c20'); };
            S.headGear = (c, J) => Looks.head(c, J, x => {
                Paint.poly(x, [-8, 3, -8, -5, -2, -10, 6, -9, 8, -3, 8, 1, 0, 2], '#6a5540');
                Paint.disc(x, 3, -1, 2.8, '#222'); Paint.disc(x, 3, -1, 1.7, C.g); x.fillStyle = Paint.c('#3a2c20'); x.fillRect(-7, -2, 8, 1.8);
                x.fillStyle = Paint.c('#2a241e'); x.fillRect(0, 2, 8, 3.4);
            });
        },
        gunner(S, C) {
            S.col.armor = '#3e443c'; S.col.armor2 = '#6d7468';
            S.backGear = (c, J) => { c.fillStyle = Paint.c('#2a2e2a'); c.fillRect(J.neck.x - 13, J.neck.y + 2, 9, 18); c.fillStyle = Paint.c('#6d5a2c'); c.fillRect(J.neck.x - 12, J.neck.y + 16, 7, 3); };
            S.headGear = (c, J) => Looks.head(c, J, x => {
                Paint.poly(x, [-9, 0, -8, -7, -1, -10, 7, -8, 9, -2, 2, -2], '#454a44'); x.fillStyle = Paint.c(C.g); x.fillRect(3, -1, 5, 2); x.fillStyle = Paint.c('#222'); x.fillRect(1, 1.5, 7, 3.6);
            });
            S.torsoGear = (c, J) => { for (let i = 0; i < 3; i++) { c.fillStyle = Paint.c('#6d5a2c'); c.fillRect(J.hip.x - 6 + i * 4, J.hip.y - 10, 3, 6); } };
        },
        hunter(S, C) {
            S.col.armor = '#23272e'; S.col.armor2 = '#3a404a'; S.col.boot = '#101216';
            S.skirt = (c, J, s, r) => { const w = (r.gaitAmt || 0) * 7; Paint.poly(c, [J.hip.x - 8, J.hip.y - 5, J.hip.x + 7, J.hip.y - 5, J.hip.x + 3 - w, J.hip.y + 24, J.hip.x - 15 - w, J.hip.y + 22], '#191c22'); c.fillStyle = Paint.c('#b02a2a'); c.fillRect(J.hip.x - 8, J.hip.y - 5, 1.6, 14); };
            S.pauldron = (c, J) => { Paint.poly(c, [J.sh.x - 8, J.sh.y - 5, J.sh.x + 8, J.sh.y - 6, J.sh.x + 10, J.sh.y + 3, J.sh.x - 6, J.sh.y + 5], '#b02a2a'); };
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-9, 2, -9, -6, -2, -11, 8, -8, 9, 3], '#191c22'); x.fillStyle = Paint.c(C.g); x.fillRect(1, -3, 8, 2.6); Paint.glow(x, 6, -2, 9, C.g); });
        },
        raider(S, C) {
            S.col.armor = '#7a5230'; S.col.armor2 = '#c29a5c'; S.col.boot = '#3a2614';
            S.torsoGear = (c, J) => { Paint.limb(c, { x: J.sh.x + 5, y: J.sh.y }, { x: J.hip.x - 6, y: J.hip.y - 3 }, 2.6, '#3a2614'); };
            S.headGear = (c, J) => Looks.head(c, J, x => {
                Paint.poly(x, [-9, 4, -9, -6, 0, -10, 8, -7, 9, -2, 7, 5], '#d8c090'); Paint.poly(x, [-8, 0, -18, 4, -12, 8, -7, 5], '#c0a878');
                x.fillStyle = Paint.c('#a87850'); x.fillRect(1, -3.5, 7, 3.5); x.fillStyle = Paint.c('#111'); x.fillRect(3, -2.6, 3, 1.4);
            });
        },
        warlord(S, C) {
            Looks.outfits.raider(S, C); S.col.armor = '#3a2418'; S.col.armor2 = '#c23a1e';
            S.pauldron = (c, J) => { Paint.disc(c, J.sh.x, J.sh.y, 8, '#6a4a2a'); for (let i = -1; i <= 1; i++) Paint.poly(c, [J.sh.x + i * 6 - 2, J.sh.y - 6, J.sh.x + i * 8, J.sh.y - 15, J.sh.x + i * 6 + 2, J.sh.y - 6], '#e8d8b0'); };
            const h = S.headGear; S.headGear = (c, J, s, r) => { h(c, J, s, r); Looks.head(c, J, x => { for (let i = 0; i < 5; i++) Paint.poly(x, [-6 + i * 3, -9, -8 + i * 3, -20 - i, -3 + i * 3, -9], i % 2 ? '#c23a1e' : '#ffb040'); }); };
        },
        thrall(S, C) {
            S.col.armor = '#4c6a84'; S.col.armor2 = '#a8d4ec'; S.col.skin = '#8eb2c8';
            S.pauldron = (c, J) => { for (let i = 0; i < 3; i++) Paint.poly(c, [J.sh.x - 6 + i * 5, J.sh.y - 2, J.sh.x - 4 + i * 5, J.sh.y - 13 - i * 2, J.sh.x + i * 5, J.sh.y - 2], '#d2f3ff'); };
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-7, -5, -4, -13, -1, -7, 2, -14, 5, -6], '#d2f3ff'); x.fillStyle = Paint.c('#7fd8ff'); x.fillRect(2, -2, 5, 2); x.fillStyle = Paint.c('#2a3e50'); x.fillRect(2, 2, 6, 2); });
        },
        ash(S, C) {
            S.col.armor = '#2e2624'; S.col.armor2 = '#4e3e38'; S.col.skin = '#3a2e2a'; S.col.boot = '#181210';
            S.torsoGear = (c, J) => { c.strokeStyle = Paint.c('#ff5a18'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(J.neck.x + 3, J.neck.y + 3); c.lineTo(J.hip.x - 2, J.hip.y - 10); c.lineTo(J.hip.x + 4, J.hip.y - 3); c.moveTo(J.neck.x - 3, J.neck.y + 6); c.lineTo(J.hip.x + 3, J.hip.y - 13); c.stroke(); };
            S.headGear = (c, J, s, r) => Looks.head(c, J, x => { x.strokeStyle = Paint.c('#ff5a18'); x.lineWidth = 1; x.beginPath(); x.moveTo(-3, -7); x.lineTo(1, -2); x.lineTo(-1, 3); x.stroke(); x.fillStyle = Paint.c('#ffcc66'); x.fillRect(3, -2, 4, 2); Paint.poly(x, [1, 3, 8, 3, 7, 6, 2, 6], '#120c0a'); });
        },
        cantor(S, C) {
            S.col.armor = '#6a2412'; S.col.armor2 = '#a13a18'; S.col.boot = '#2a1208';
            S.skirt = (c, J, s, r) => { const w = (r.gaitAmt || 0) * 5; Paint.poly(c, [J.hip.x - 9, J.hip.y - 6, J.hip.x + 9, J.hip.y - 6, J.hip.x + 13 - w, J.hip.y + 30, J.hip.x - 14 - w, J.hip.y + 30], '#7a2a12'); c.fillStyle = Paint.c('#ffcc00'); c.fillRect(J.hip.x - 1, J.hip.y - 6, 2.4, 36); };
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-9, 6, -9, -5, -3, -13, 2, -15, 7, -8, 8, 4, 2, 7], '#6a2412'); x.fillStyle = Paint.c('#120806'); x.beginPath(); x.ellipse(4, -1, 4, 6, 0, 0, TAU); x.fill(); x.fillStyle = Paint.c('#ffcc00'); x.fillRect(3, -2, 4, 1.6); Paint.glow(x, 5, -1, 9, '#ffcc00'); });
        },
        knight(S, C) {
            S.col.armor = '#2a2020'; S.col.armor2 = '#7a2a12'; S.col.boot = '#140e0e'; S.bone = Object.assign({}, S.bone, { limbW: 8, chest: 11, waist: 7 });
            S.pauldron = (c, J) => { Paint.disc(c, J.sh.x, J.sh.y, 10, '#3a2a26'); Paint.poly(c, [J.sh.x - 9, J.sh.y - 4, J.sh.x, J.sh.y - 15, J.sh.x + 9, J.sh.y - 4], '#1e1614'); c.strokeStyle = Paint.c('#ff7a18'); c.lineWidth = 1.2; c.beginPath(); c.arc(J.sh.x, J.sh.y, 8, .4, 2.6); c.stroke(); };
            S.emblem = c => { Paint.glow(c, 0, -14, 14, '#ff7a18'); Paint.disc(c, 1, -14, 3, '#ffdd88'); };
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-9, 6, -9, -6, 0, -12, 9, -7, 10, 3, 3, 7], '#2a2020'); x.fillStyle = Paint.c('#ff7a18'); x.fillRect(1, -3, 9, 2.4); for (let i = 0; i < 3; i++) Paint.poly(x, [-8 + i * 5, -8, -7 + i * 5, -18, -4 + i * 5, -9], '#140e0e'); });
        }
    },
    npcs: {
        hask(S) { // Old survivor: patched coat, cap, grey beard, walking stick
            S.col.armor = '#54493c'; S.col.armor2 = '#74654f'; S.col.skin = '#a88a70'; S.idle = Object.assign({}, S.idle, { lean: 16, head: -8 });
            S.skirt = (c, J) => Paint.poly(c, [J.hip.x - 9, J.hip.y - 4, J.hip.x + 9, J.hip.y - 4, J.hip.x + 11, J.hip.y + 18, J.hip.x - 11, J.hip.y + 16], '#54493c');
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-8, -3, -7, -9, 6, -9, 12, -4], '#3e3a30'); Paint.poly(x, [-2, 2, 8, 1, 7, 8, 1, 10, -3, 6], '#c8c4b8'); x.fillStyle = Paint.c('#222'); x.fillRect(3, -3, 2.4, 1.8); });
            S.weaponF = c => { c.fillStyle = Paint.c('#5a4228'); c.fillRect(-1.5, -6, 3, 46); };
        },
        lys(S) { // Young ranger: green hood, bark leather, longbow
            S.col.armor = '#3a5a3e'; S.col.armor2 = '#6a8a58'; S.col.skin = '#c89a78';
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-9, 6, -9, -5, -2, -12, 7, -7, 5, -3, -2, -3, -3, 6], '#2c4a30'); x.fillStyle = Paint.c('#222'); x.fillRect(3, -2, 2.4, 1.8); Paint.poly(x, [-4, 6, -10, 11, -3, 9], '#2c4a30'); });
            S.backGear = (c, J) => { c.strokeStyle = Paint.c('#5a4228'); c.lineWidth = 2.5; c.beginPath(); c.arc(J.neck.x - 22, J.neck.y + 14, 30, -1.1, 1.1); c.stroke(); c.strokeStyle = Paint.c('#ddd'); c.lineWidth = .7; c.beginPath(); c.moveTo(J.neck.x - 9, J.neck.y - 13); c.lineTo(J.neck.x - 9, J.neck.y + 41); c.stroke(); };
        },
        tamsin(S) { // Harbour woman: faded sailor stripes, headscarf, net
            S.col.armor = '#3e6a8a'; S.col.armor2 = '#e0d8c4'; S.col.skin = '#a87850'; S.col.boot = '#3a2a1c';
            S.skirt = (c, J) => Paint.poly(c, [J.hip.x - 8, J.hip.y - 4, J.hip.x + 8, J.hip.y - 4, J.hip.x + 13, J.hip.y + 24, J.hip.x - 12, J.hip.y + 24], '#8a6a44');
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-9, 3, -9, -6, -1, -11, 8, -6, 7, -4, -2, -4, -4, 4], '#c23a1e'); Paint.poly(x, [-8, 0, -15, 6, -7, 5], '#c23a1e'); x.fillStyle = Paint.c('#222'); x.fillRect(3, -2, 2.4, 1.8); });
            S.torsoGear = (c, J) => { c.fillStyle = Paint.c('#3e6a8a'); for (let i = 0; i < 4; i++) c.fillRect(J.neck.x - 6, J.neck.y + 5 + i * 4, 13, 1.6); };
        },
        orsk(S) { // Polar surveyor: fur parka, goggles, instrument pack
            S.col.armor = '#b84a22'; S.col.armor2 = '#d86a3a'; S.col.skin = '#d8b090'; S.col.boot = '#2a2a2e'; S.bone = Object.assign({}, S.bone, { waist: 9, chest: 10 });
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.disc(x, -1, -1, 10, '#e8e0d0'); Paint.disc(x, 2, 0, 6.5, '#d8b090'); Paint.disc(x, 4, -1, 2.8, '#7fd8ff'); x.fillStyle = Paint.c('#222'); x.fillRect(-5, -2, 7, 1.6); });
            S.backGear = (c, J) => { c.fillStyle = Paint.c('#3a4a5a'); c.fillRect(J.neck.x - 15, J.neck.y + 1, 10, 20); Paint.limb(c, { x: J.neck.x - 11, y: J.neck.y + 1 }, { x: J.neck.x - 15, y: J.neck.y - 22 }, 1.5, '#222'); Paint.disc(c, J.neck.x - 15, J.neck.y - 22, 2, '#ff3322'); };
        },
        cantor(S) { Looks.outfits.cantor(S, { g: '#ffcc00' }); S.weaponF = c => { c.fillStyle = Paint.c('#3a2a1a'); c.fillRect(-1.5, -20, 3, 56); Paint.disc(c, 0, -22, 5, '#ffcc00'); Paint.glow(c, 0, -22, 14, '#ffcc00'); }; },
        smith(S) { // Forge smith: leather apron, bare arms, tongs
            S.col.armor = '#6a4a30'; S.col.armor2 = '#8a6a48'; S.col.skin = '#8a5a3e'; S.col.boot = '#2a1a12'; S.bone = Object.assign({}, S.bone, { limbW: 8, chest: 11 });
            S.skirt = (c, J) => Paint.poly(c, [J.hip.x - 8, J.hip.y - 12, J.hip.x + 9, J.hip.y - 12, J.hip.x + 10, J.hip.y + 18, J.hip.x - 3, J.hip.y + 18], '#4a3220');
            S.headGear = (c, J) => Looks.head(c, J, x => { Paint.poly(x, [-1, 3, 8, 2, 7, 9, 0, 9], '#3a2a20'); x.fillStyle = Paint.c('#222'); x.fillRect(-8, -7, 16, 3); Paint.disc(x, 4, -2, 2.6, '#ffcc66'); });
            S.weaponF = c => { c.strokeStyle = Paint.c('#444'); c.lineWidth = 2.4; c.beginPath(); c.moveTo(-3, 0); c.lineTo(1, 34); c.moveTo(3, 0); c.lineTo(-1, 34); c.stroke(); Paint.disc(c, 0, 36, 4, '#ff7a18'); Paint.glow(c, 0, 36, 13, '#ff7a18'); };
        }
    }
};

/* ------------------------------ HERO GEAR ------------------------------- */
(function heroes() {
    const R = CHARS.rook.style, Sb = CHARS.sable.style, M = CHARS.mirae.style, Y = CHARS.ysolde.style, Z = CHARS.zero.style;
    const rivets = (c, pts) => { pts.forEach(p => Paint.disc(c, p[0], p[1], .9, '#c8ccd4')); };
    /* Rook: walking bulkhead */
    R.col.glove = '#23262e';
    R.weaponF = (c, J, S, r) => {
        c.fillStyle = Paint.c('#4a4038'); c.fillRect(-2.6, -10, 5.2, 50); c.fillStyle = Paint.c('#2b2d33'); for (let i = 0; i < 4; i++) c.fillRect(-3.4, -2 + i * 8, 6.8, 2);
        Paint.poly(c, [-17, 34, 17, 34, 21, 42, 21, 50, 17, 58, -17, 58, -21, 50, -21, 42], '#2b2d33'); Paint.poly(c, [-13, 37, 13, 37, 16, 45, 13, 55, -13, 55, -16, 45], '#3e424c');
        c.fillStyle = Paint.c('#ffaa33'); c.fillRect(-14, 44, 28, 3.4); Paint.glow(c, 0, 46, 15, '#ffaa33');
        rivets(c, [[-11, 39], [11, 39], [-11, 53], [11, 53]]);
        Paint.poly(c, [-23, 42, -29, 46, -23, 50], '#6b7284'); Paint.poly(c, [23, 42, 29, 46, 23, 50], '#6b7284');
        if (r.owner && r.owner.charge > 0) Paint.glow(c, 0, 45, 20 + r.owner.charge * .6, '#ffaa33');
    };
    R.torsoGear = (c, J) => { Paint.glow(c, J.neck.x + 2, J.neck.y + 9, 9, '#ffaa33'); Paint.disc(c, J.neck.x + 2, J.neck.y + 9, 2.8, '#ffe2a8'); };
    R.pauldron = (c, J) => {
        const s = J.sh; Paint.poly(c, [s.x - 12, s.y + 3, s.x - 9, s.y - 7, s.x + 1, s.y - 10, s.x + 11, s.y - 6, s.x + 13, s.y + 4, s.x + 4, s.y + 8, s.x - 6, s.y + 7], '#6b7284');
        Paint.poly(c, [s.x - 8, s.y + 2, s.x - 6, s.y - 5, s.x + 1, s.y - 7, s.x + 9, s.y - 4, s.x + 9, s.y + 2, s.x, s.y + 4], '#3a3f4b'); c.fillStyle = Paint.c('#ffaa33'); c.fillRect(s.x - 5, s.y - 2, 12, 1.8); rivets(c, [[s.x - 6, s.y + 1], [s.x + 7, s.y + 1]]);
    };
    R.headGear = (c, J) => Looks.head(c, J, x => {
        Paint.poly(x, [-10, 7, -11, -5, -5, -12, 5, -12, 11, -5, 11, 7, 5, 10, -5, 10], '#3a3f4b'); Paint.poly(x, [1, -5, 11, -5, 11, 1, 1, 1], '#14161a');
        x.fillStyle = Paint.c('#ffaa33'); x.fillRect(2, -3.4, 9, 2.6); Paint.glow(x, 7, -2, 11, '#ffaa33'); for (let i = 0; i < 3; i++) { x.fillStyle = Paint.c('#14161a'); x.fillRect(3 + i * 2.6, 3.5, 1.3, 5); }
        x.strokeStyle = Paint.c('#23262e'); x.lineWidth = 2; x.beginPath(); x.moveTo(-7, 6); x.quadraticCurveTo(-12, 12, -5, 14); x.stroke();
    });
    /* Sable: courier wraps, crossed straps, cloth mask */
    Sb.col.glove = '#3e3760';
    const kukri = flip => c => { c.fillStyle = Paint.c('#222'); c.fillRect(-1.7, -3, 3.4, 9); Paint.poly(c, [-1.8, 5, 2.4, 5, 6 * flip, 15, 5 * flip, 22, 1 * flip, 28, -3.5 * flip, 25, -2.2 * flip, 15], '#d8d4ff'); c.strokeStyle = Paint.c('#a855ff'); c.lineWidth = 1; c.beginPath(); c.moveTo(0, 7); c.quadraticCurveTo(4 * flip, 15, 1 * flip, 25); c.stroke(); };
    Sb.weaponF = kukri(1); Sb.weaponB = kukri(-1);
    Sb.torsoGear = (c, J) => { Paint.limb(c, { x: J.sh.x + 6, y: J.sh.y }, { x: J.hip.x - 6, y: J.hip.y - 3 }, 2, '#7c3aed'); Paint.limb(c, { x: J.sh.x - 6, y: J.sh.y }, { x: J.hip.x + 6, y: J.hip.y - 3 }, 2, '#3e3760'); };
    Sb.skirt = (c, J, s, r) => { const w = (r.gaitAmt || 0) * 8; Paint.poly(c, [J.hip.x - 6, J.hip.y - 3, J.hip.x + 2, J.hip.y - 3, J.hip.x - 8 - w, J.hip.y + 14, J.hip.x - 14 - w, J.hip.y + 11], '#7c3aed'); };
    Sb.headGear = (c, J) => Looks.head(c, J, x => {
        Paint.poly(x, [-9, 8, -10, -4, -3, -11, 6, -9, 9, -3, 7, 1, 0, 0, -1, 8], '#231f33'); Paint.poly(x, [1, -5, 8, -4, 8, -1, 1, -1], '#caa184');
        Paint.poly(x, [0, -1, 9, 0, 8, 6, 0, 7], '#3e3760'); x.fillStyle = Paint.c('#e9d5ff'); x.fillRect(4, -3.6, 3.4, 1.6); Paint.glow(x, 6, -3, 7, '#c084fc');
    });
    /* Mirae: lab coat tails, instrument belt, data visor */
    M.col.glove = '#2dd4bf';
    M.skirt = (c, J, s, r) => {
        const a = r.gaitSwing || 0, h = J.hip; Paint.poly(c, [h.x - 8, h.y - 4, h.x + 8, h.y - 4, h.x + 9 + a * .5, h.y + 26, h.x + 1 + a, h.y + 30, h.x - 2 + a, h.y + 22, h.x - 12 + a * 1.3, h.y + 32], '#c8d8d4');
        c.strokeStyle = Paint.c('#2dd4bf'); c.lineWidth = 1; c.beginPath(); c.moveTo(h.x - 12 + a * 1.3, h.y + 30); c.lineTo(h.x + 1 + a, h.y + 28); c.stroke();
    };
    M.torsoGear = (c, J) => { c.strokeStyle = Paint.c('#7a8c8c'); c.lineWidth = 1; c.beginPath(); c.moveTo(J.neck.x + 2, J.neck.y + 1); c.lineTo(J.hip.x + 2, J.hip.y); c.stroke(); Paint.disc(c, J.neck.x + 5, J.neck.y + 8, 1.6, '#2dd4bf'); };
    M.headGear = (c, J) => Looks.head(c, J, x => {
        Paint.disc(x, -2, -3, 8.2, '#1e2a3a'); Paint.disc(x, -8, -9, 4.4, '#1e2a3a'); x.strokeStyle = Paint.c('#2dd4bf'); x.lineWidth = 1.2; x.beginPath(); x.moveTo(-11, -7); x.lineTo(-5, -11); x.stroke();
        Paint.poly(x, [0, -5, 8, -3, 7, 5, 1, 6], '#e5c29f'); Paint.poly(x, [-2, -6, 3, -7, 1, -1, -4, 0], '#1e2a3a'); x.fillStyle = Paint.c('rgba(45,212,191,.75)'); x.fillRect(1.5, -3, 7, 2.6); Paint.glow(x, 5, -2, 7, '#2dd4bf');
    });
    M.weaponF = (c, J, S, r) => {
        const col = r.owner ? ELEMENTS[r.owner.element].col : '#7fffd4'; Paint.glow(c, 0, 7, 17, col); Paint.disc(c, 0, 6, 3.2, '#ffffff');
        for (let i = 0; i < 4; i++) { const a = r.time * .13 + i * 1.57; c.fillStyle = Paint.c(col); c.fillRect(Math.cos(a) * 8 - 1, 6 + Math.sin(a) * 8 - 1, 2, 2); }
    };
    /* Ysolde: plate, tabard with the Line's mark, tower shield */
    Y.col.glove = '#c9a227';
    Y.emblem = (c, T, w) => { c.strokeStyle = Paint.c('#c9a227'); c.lineWidth = 1.1; c.beginPath(); c.moveTo(-w * .4, -T * .5); c.lineTo(w * .1, -T * .85); c.lineTo(w * .6, -T * .5); c.lineTo(w * .1, -T * .34); c.closePath(); c.stroke(); };
    Y.skirt = (c, J, s, r) => { const h = J.hip, w = (r.gaitAmt || 0) * 5; Paint.poly(c, [h.x - 3, h.y - 2, h.x + 7, h.y - 2, h.x + 6 - w, h.y + 25, h.x + 1 - w, h.y + 29, h.x - 4 - w, h.y + 25], '#7a1f1f'); c.fillStyle = Paint.c('#c9a227'); c.fillRect(h.x - 3, h.y - 2, 10, 1.6); };
    Y.pauldron = (c, J) => { const s = J.sh; Paint.poly(c, [s.x - 9, s.y + 3, s.x - 7, s.y - 6, s.x + 2, s.y - 8, s.x + 9, s.y - 4, s.x + 9, s.y + 4, s.x, s.y + 6], '#4b5a78'); c.strokeStyle = Paint.c('#c9a227'); c.lineWidth = 1.3; c.beginPath(); c.moveTo(s.x - 7, s.y + 2); c.quadraticCurveTo(s.x + 1, s.y - 8, s.x + 8, s.y + 2); c.stroke(); };
    Y.torsoGear = () => { };
    Y.headGear = (c, J) => Looks.head(c, J, x => {
        Paint.poly(x, [-9, 6, -10, -4, -4, -11, 5, -11, 9, -5, 8, 3, 3, 7], '#4b5a78'); Paint.poly(x, [2, -4, 9, -4, 8, 3, 2, 3], '#c28f6e'); x.fillStyle = Paint.c('#c9a227'); x.fillRect(-1, -11, 2.6, 14); x.fillRect(1, -5.5, 8, 1.8); x.fillStyle = Paint.c('#222'); x.fillRect(4, -2.6, 2.4, 1.6);
        Paint.poly(x, [-2, -11, -8, -18, -18, -19, -24, -11, -16, -13, -8, -8], '#7a1f1f');
    });
    Y.weaponF = (c, J, S, r) => {
        Paint.poly(c, [-8, -26, 16, -24, 21, 0, 16, 28, -8, 33, -11, 0], '#3b4a63'); Paint.poly(c, [-5, -21, 13, -19, 17, 0, 13, 23, -5, 27, -7, 0], '#c9a227'); Paint.poly(c, [-2, -16, 10, -15, 13, 0, 10, 18, -2, 21, -4, 0], '#26324a');
        c.strokeStyle = Paint.c('#c9a227'); c.lineWidth = 1.6; c.beginPath(); c.moveTo(4, -10); c.lineTo(9, 1); c.lineTo(4, 14); c.lineTo(-1, 1); c.closePath(); c.stroke(); Paint.disc(c, 4, 1, 2.2, '#ffd86b');
        rivets(c, [[-3, -18], [11, -17], [-3, 23], [11, 20]]);
        if (r.owner && r.owner.guarding) Paint.glow(c, 6, 0, 38, '#ffd86b');
    };
    Y.weaponB = c => { c.fillStyle = Paint.c('#6b5a2a'); c.fillRect(-1.5, -4, 3, 9); c.fillStyle = Paint.c('#c9a227'); c.fillRect(-7, 4, 14, 2.6); Paint.disc(c, 0, -5, 2.4, '#c9a227'); Paint.poly(c, [-2.8, 6.5, 2.8, 6.5, 2.2, 40, 0, 47, -2.2, 40], '#e6edf4'); c.strokeStyle = Paint.c('#9aa8b6'); c.lineWidth = .9; c.beginPath(); c.moveTo(0, 7); c.lineTo(0, 40); c.stroke(); };
    /* Zero: the original silhouette: dark armour, neon lines, visor, red cape, arm cannon */
    Z.col.glove = '#0c0c14';
    Z.emblem = (c, T, w) => { c.fillStyle = Paint.c('#00ffff'); c.fillRect(-w * .1, -T * .8, 2.4, T * .4); c.fillRect(-w * .5, -T * .62, w * 1.1, 1.5); Paint.glow(c, 1, -T * .62, 9, '#00ffff'); };
    Z.torsoGear = (c, J) => { c.fillStyle = Paint.c('#00ffff'); c.fillRect(J.hip.x - 7, J.hip.y - 1.5, 14, 2.6); };
    Z.pauldron = (c, J) => { const s = J.sh; Paint.poly(c, [s.x - 8, s.y + 2, s.x - 6, s.y - 5, s.x + 3, s.y - 7, s.x + 9, s.y - 3, s.x + 8, s.y + 4, s.x, s.y + 5], '#262634'); c.fillStyle = Paint.c('#00ffff'); c.fillRect(s.x - 4, s.y - 1, 9, 1.4); };
    Z.headGear = (c, J, S, r) => Looks.head(c, J, x => {
        const on = r.owner && r.owner.cannonAmmo > 0, col = on ? '#ff1100' : '#00ffff';
        Paint.poly(x, [-9, 6, -9, -5, -3, -11, 5, -10, 9, -4, 9, 3, 4, 7], '#1a1a24'); Paint.poly(x, [0, -5, 10, -4, 9, 1, 0, 1], '#08080e');
        x.fillStyle = Paint.c(col); x.fillRect(1.5, -3.2, 8.5, 2.8); Paint.glow(x, 6, -2, 10, col);
        Paint.poly(x, [-8, -7, -15, -13, -6, -10], '#262634'); x.fillStyle = Paint.c('#00c0c0'); x.fillRect(-7, -1, 4, 1.2);
    });
    Z.weaponF = (c, J, S, r) => {
        const on = r.owner && r.owner.cannonAmmo > 0, g = on ? '#ff1100' : '#00ffff';
        Paint.poly(c, [-6, -2, 6, -2, 7, 8, 5, 26, -5, 26, -7, 8], '#3a3e4a'); c.fillStyle = Paint.c('#20232c'); c.fillRect(-7.5, 6, 15, 4.4); c.fillRect(-7, 14, 14, 3);
        c.fillStyle = Paint.c(g); c.fillRect(-1, 0, 2, 22); c.fillRect(on ? -4.5 : -3, 26, on ? 9 : 6, 4.2); Paint.glow(c, 0, 28, on ? 17 : 11, g);
    };
    [Z, R, Sb, M, Y].forEach(s => { s.weaponLen = s.weaponLen; });
})();

/* ----------------------------- CREATURE BODIES --------------------------- */
const fang = (c, x, y, l, dir, col) => Paint.poly(c, [x - 1.6, y, x + 1.6, y, x, y + l * dir], col);
Object.assign(Bodies, {
    beast(c, e, C) {
        const moving = Math.abs(e.vx) > .4, s = moving ? Math.sin(e.anim * .32) : 0, l = e.w * .44, h = e.h, leap = e.grounded ? 0 : -.3, by = -h * .66 - Math.abs(s) * 2, dk = U.mix(C.a, '#000000', .35);
        const leg = (x, ph, near) => {
            const a = (ph ? s : -s) * .8 + leap, kx = x + Math.sin(a) * 9, ky = by + 13, fx = x + Math.sin(a) * 16 - 2, col = near ? C.a : dk;
            Paint.taper(c, { x, y: by + 2 }, { x: kx, y: ky }, near ? 5 : 4, 3, col); Paint.taper(c, { x: kx, y: ky }, { x: fx, y: -1 }, 3, 2, col); Paint.poly(c, [fx - 3, 0, fx + 6, 0, fx + 3, -3.5, fx - 3, -3.5], C.g === '#ff3322' ? '#2a1a1a' : dk);
        };
        leg(-l, 1, false); leg(l * .75, 0, false);
        const tw = Math.sin(e.anim * .15) * 6; Paint.taper(c, { x: -l - 3, y: by - 3 }, { x: -l - 22, y: by - 13 + tw }, 4, 1, C.b);
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.moveTo(-l - 7, by + 5); c.quadraticCurveTo(-l, by - h * .36, 2, by - h * .3); c.quadraticCurveTo(l + 4, by - h * .52, l + 11, by - 7); c.quadraticCurveTo(l + 6, by + 11, l - 6, by + 9); c.quadraticCurveTo(-l * .2, by + 13, -l - 7, by + 5); c.closePath(); c.fill();
        c.fillStyle = Paint.c('rgba(255,255,255,.1)'); c.beginPath(); c.ellipse(l * .3, by - h * .17, l * .6, h * .12, -.15, 0, TAU); c.fill();
        for (let i = 0; i < 8; i++) { const x = -l + i * (l * 2 / 7), y = by - h * .3 - Math.sin(i * .9) * 3 - (i > 4 ? (i - 4) * 1.6 : 0); Paint.poly(c, [x - 4, y + 3, x + 2, y - 8, x + 5, y + 3], C.a); }
        leg(-l + 7, 0, true); leg(l * .75 - 6, 1, true);
        const open = e.telegraphing() || (e.state === 'attack') ? 8 : 2.5, hx = l + 8, hy = by - 8;
        Paint.poly(c, [hx - 7, hy - 8, hx + 8, hy - 9, hx + 25, hy - 2, hx + 25, hy + 3, hx - 5, hy + 8], C.b);
        Paint.poly(c, [hx - 1, hy - 8, hx + 3, hy - 16, hx + 6, hy - 8], C.a);
        Paint.poly(c, [hx - 3, hy + 5, hx + 22, hy + 3 + open * .35, hx + 20, hy + 5 + open, hx, hy + 9], C.a);
        for (let i = 0; i < 4; i++) { fang(c, hx + 7 + i * 5, hy + 2, 4, 1, '#f4efe0'); fang(c, hx + 6 + i * 5, hy + 4 + open * .8, 3.5, -1, '#f4efe0'); }
        c.fillStyle = Paint.c(C.g); c.fillRect(hx + 7, hy - 5, 5, 2.6); Paint.glow(c, hx + 9, hy - 4, 9, C.g);
    },
    bug(c, e, C) {
        const a = e.anim * .5, dk = U.mix(C.a, '#000000', .3);
        for (let i = 0; i < 3; i++) { const x = -14 + i * 14, f = Math.sin(a + i * 2) * 5; [[-1, dk], [1, C.a]].forEach(([d, col]) => { const kx = x + d * 8 + f * d * .5; Paint.limb(c, { x, y: -12 }, { x: kx, y: -20 }, 2.6, col); Paint.limb(c, { x: kx, y: -20 }, { x: x + d * 15 + f, y: 0 }, 2, col); }); }
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(-8, -15, 18, 11, 0, 0, TAU); c.fill(); c.fillStyle = Paint.c(C.a); for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(-22 + i * 7, -15, 2, 10.5 - Math.abs(i - 2) * 1.2, 0, 0, TAU); c.fill(); }
        c.fillStyle = Paint.c('rgba(255,255,255,.18)'); c.beginPath(); c.ellipse(-8, -21, 12, 3, 0, 0, TAU); c.fill();
        Paint.poly(c, [-24, -18, -36, -30, -32, -14], C.a); Paint.disc(c, -36, -31, 3, C.g);
        Paint.disc(c, 13, -14, 9, C.b); const m = Math.sin(a) * 2.5;
        Paint.poly(c, [18, -18, 34, -22 + m, 24, -14], '#e8d8b0'); Paint.poly(c, [18, -9, 34, -6 - m, 24, -13], '#e8d8b0'); Paint.disc(c, 15, -18, 2.4, C.g); Paint.disc(c, 19, -12, 1.6, C.g);
    },
    sprout(c, e, C) {
        const s = Math.abs(e.vx) > .3 ? Math.sin(e.anim * .25) : 0, tel = e.telegraphing() ? 1 : 0, sw = Math.sin(e.anim * .05) * 1.5;
        Paint.taper(c, { x: -5, y: -24 }, { x: -8 + s * 8, y: -1 }, 5, 3, C.a); Paint.taper(c, { x: 5, y: -24 }, { x: 8 - s * 8, y: -1 }, 5, 3, U.mix(C.a, C.b, .4));
        for (const d of [-1, 1]) for (let i = 0; i < 3; i++) Paint.limb(c, { x: d * 8 + (d < 0 ? s * 8 : -s * 8), y: -2 }, { x: d * 8 + (d < 0 ? s * 8 : -s * 8) + (i - 1) * 6, y: 0 }, 1.6, C.a);
        Paint.taper(c, { x: 0, y: -22 }, { x: sw, y: -46 }, 8, 7, C.b, U.mix(C.b, '#ffffff', .3));
        c.strokeStyle = Paint.c(C.a); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-5, -24); c.bezierCurveTo(3, -30, -4, -38, 4, -45); c.stroke();
        Paint.taper(c, { x: 4, y: -42 }, { x: 19 + tel * 8, y: -33 - tel * 24 }, 3.5, 1.6, C.a); Paint.poly(c, [18 + tel * 8, -37 - tel * 24, 30 + tel * 8, -36 - tel * 34, 23 + tel * 8, -31 - tel * 24], '#d8ff8a');
        Paint.taper(c, { x: -4, y: -42 }, { x: -15, y: -25 + s * 3 }, 3.5, 1.6, C.a);
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + sw * .08, r = 21 - (i % 2) * 5; Paint.poly(c, [sw + Math.cos(a - .4) * 7, -52 + Math.sin(a - .4) * 7, sw + Math.cos(a) * r, -52 + Math.sin(a) * r * .78, sw + Math.cos(a + .4) * 7, -52 + Math.sin(a + .4) * 7], i % 2 ? C.a : C.b); }
        Paint.disc(c, sw, -52, 7.5, U.mix(C.a, '#000000', .4)); Paint.disc(c, sw + 3, -52, 3.4, C.g); Paint.glow(c, sw + 3, -52, 11, C.g);
    },
    bulb(c, e, C) {
        const p = 1 + Math.sin(e.anim * .08) * .05 + (e.telegraphing() ? .18 : 0);
        for (let i = 0; i < 5; i++) { const x = -20 + i * 10; Paint.taper(c, { x: x * .4, y: -13 }, { x, y: 0 }, 4, 2, '#2c3a22'); }
        Paint.poly(c, [-20, -6, -32, -2, -14, 0], '#3e5a26'); Paint.poly(c, [20, -6, 32, -3, 14, 0], '#3e5a26');
        c.fillStyle = Paint.c(C.a); c.beginPath(); c.ellipse(0, -25, 20 * p, 22 * p, 0, 0, TAU); c.fill();
        for (let i = -2; i <= 2; i++) { c.fillStyle = Paint.c(i % 2 ? C.b : U.mix(C.a, C.b, .5)); c.beginPath(); c.ellipse(i * 7.5, -25, 3.6, (19 - Math.abs(i) * 2) * p, 0, 0, TAU); c.fill(); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + e.anim * .01; Paint.poly(c, [10 + Math.cos(a) * 7, -38 + Math.sin(a) * 7, 10 + Math.cos(a + .25) * 15, -38 + Math.sin(a + .25) * 15, 10 + Math.cos(a + .5) * 7, -38 + Math.sin(a + .5) * 7], C.b); }
        Paint.disc(c, 10, -38, 7.5, '#120a18'); Paint.glow(c, 10, -38, 17, C.g); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; fang(c, 10 + Math.cos(a) * 6, -38 + Math.sin(a) * 6, 3, Math.sin(a) > 0 ? -1 : 1, '#e8f0c0'); }
    },
    golem(c, e, C) {
        const s = Math.abs(e.vx) > .2 ? Math.sin(e.anim * .15) : 0, atk = e.state === 'attack' && e.atk && e.atk.kind === 'slam', tel = atk ? (e.atkT < e.atk.s ? 1 : -1) : 0, h = e.h, H = -Math.abs(s) * 2.5, dk = U.mix(C.a, '#000000', .3);
        const leg = (x, p, col) => { const kx = x + p * s * 9, fx = x + p * s * 13; Paint.taper(c, { x, y: -h * .4 + H }, { x: kx, y: -h * .2 }, 10, 8, col); Paint.taper(c, { x: kx, y: -h * .2 }, { x: fx, y: -6 }, 8, 7.5, col); Paint.poly(c, [fx - 11, 0, fx + 15, 0, fx + 11, -9, fx - 9, -10], dk); };
        leg(-13, 1, dk); const ar2 = .15 - s * .15;
        Paint.taper(c, { x: -23, y: -h * .76 + H }, { x: -27 - Math.sin(ar2) * 14, y: -h * .48 + H }, 9, 7, dk); Paint.taper(c, { x: -27 - Math.sin(ar2) * 14, y: -h * .48 + H }, { x: -28 - Math.sin(ar2) * 20, y: -h * .24 + H }, 7, 8, dk);
        Paint.poly(c, [-20, -h * .34 + H, 20, -h * .34 + H, 29, -h * .72 + H, 21, -h * .9 + H, 8, -h * .94 + H, -10, -h * .93 + H, -24, -h * .86 + H, -30, -h * .7 + H], C.b);
        Paint.poly(c, [-20, -h * .34 + H, -2, -h * .34 + H, -6, -h * .93 + H, -24, -h * .86 + H, -30, -h * .7 + H], U.mix(C.b, '#000000', .25));
        c.fillStyle = Paint.c(C.a); [[-16, -h * .8, 15, 7], [6, -h * .74, 16, 9], [-12, -h * .6, 11, 8], [8, -h * .5, 12, 7], [-14, -h * .44, 13, 5]].forEach(p => c.fillRect(p[0], p[1] + H, p[2], p[3]));
        c.strokeStyle = Paint.c(C.g); c.lineWidth = 2.2; c.beginPath(); c.moveTo(-4, -h * .36 + H); c.lineTo(5, -h * .49 + H); c.lineTo(-3, -h * .62 + H); c.lineTo(7, -h * .82 + H); c.moveTo(5, -h * .49 + H); c.lineTo(17, -h * .55 + H); c.moveTo(-3, -h * .62 + H); c.lineTo(-17, -h * .68 + H); c.stroke();
        Paint.glow(c, 2, -h * .6 + H, 20, C.g); leg(13, -1, C.a);
        const ar = tel > 0 ? -2.2 : tel < 0 ? .35 : .2 + Math.sin(e.anim * .05) * .08, ex = 27 + Math.sin(ar) * 22, ey = -h * .76 + H + Math.cos(ar) * 22, hx = ex + Math.sin(ar + .2) * 22, hy = ey + Math.cos(ar + .2) * 22;
        Paint.taper(c, { x: 25, y: -h * .77 + H }, { x: ex, y: ey }, 10, 8, C.a); Paint.taper(c, { x: ex, y: ey }, { x: hx, y: hy }, 8, 9, C.a);
        Paint.poly(c, [hx - 13, hy - 8, hx + 12, hy - 9, hx + 14, hy + 7, hx + 7, hy + 13, hx - 9, hy + 13, hx - 14, hy + 6], C.b); c.fillStyle = Paint.c(C.g); c.fillRect(hx - 7, hy + 2, 15, 2);
        Paint.poly(c, [14, -h * .86 + H, 38, -h * .82 + H, 36, -h * .7 + H, 16, -h * .7 + H], C.b);
        Paint.poly(c, [-9, -h * .9 + H, 13, -h * .92 + H, 15, -h * 1.03 + H, 5, -h * 1.08 + H, -8, -h * 1.03 + H], C.b); c.fillStyle = Paint.c('#0c0806'); c.fillRect(1, -h * 1 + H, 13, 5); c.fillStyle = Paint.c(C.g); c.fillRect(4, -h * .99 + H, 9, 3); Paint.glow(c, 9, -h * .985 + H, 11, C.g);
    },
    mech(c, e, C) {
        const s = Math.abs(e.vx) > .2 ? Math.sin(e.anim * .16) : 0, h = e.h, D = (x, y, w, hh, col) => { c.fillStyle = Paint.c(col); c.fillRect(x, y, w, hh); };
        const leg = (x, p) => { const k = p * s * 9; Paint.taper(c, { x, y: -h * .46 }, { x: x + (x < 0 ? -6 : 6) + k, y: -h * .22 }, 6, 5, C.a); Paint.taper(c, { x: x + (x < 0 ? -6 : 6) + k, y: -h * .22 }, { x: x + k, y: -5 }, 4.6, 4, C.b); D(x + k - 11, -6, 24, 6, '#23272e'); Paint.disc(c, x + (x < 0 ? -6 : 6) + k, -h * .22, 4, '#6b7686'); };
        leg(-13, -1);
        D(-24, -h * .96, 48, h * .55, C.a); D(-24, -h * .96, 48, 4, C.b); D(-20, -h * .9, 18, h * .36, '#23272e'); D(-24, -h * .47, 48, 5, C.b);
        for (let i = 0; i < 6; i++) { c.fillStyle = Paint.c(i % 2 ? C.g : '#14161a'); c.fillRect(-24 + i * 8, -h * .47, 8, 5); }
        D(2, -h * .88, 20, 11, '#101216'); D(6, -h * .85, 13, 5, C.g); Paint.glow(c, 13, -h * .83, 15, C.g);
        for (let i = 0; i < 4; i++) D(-17, -h * .86 + i * 5, 11, 2, '#3a4048');
        Paint.disc(c, -21, -h * .93, 1.1, '#c8ccd4'); Paint.disc(c, 21, -h * .93, 1.1, '#c8ccd4');
        leg(13, 1);
        D(18, -h * .72, 32, 10, '#22242a'); D(46, -h * .74, 8, 14, '#14161a'); D(18, -h * .76, 16, 16, C.b); Paint.disc(c, 26, -h * .69, 3, C.g);
        D(-30, -h * .98, 9, 22, '#22242a'); for (let i = 0; i < 2; i++) Paint.disc(c, -25.5, -h * .94 + i * 9, 2.6, '#14161a');
        c.strokeStyle = Paint.c('#2a2e36'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(-10, -h * .96); c.lineTo(-13, -h * 1.15); c.stroke(); Paint.disc(c, -13, -h * 1.15, 1.8, C.g);
    },
    obelisk(c, e, C) {
        const h = e.h, b = Math.sin(e.anim * .05) * 3, r = e.anim * .02;
        Paint.poly(c, [-27, 0, 27, 0, 21, -h * .14, -21, -h * .14], C.a); c.fillStyle = Paint.c(C.g); c.fillRect(-20, -h * .08, 40, 2);
        Paint.poly(c, [-19, -h * .22 + b, 19, -h * .22 + b, 13, -h + b, -13, -h + b], C.b); Paint.poly(c, [-19, -h * .22 + b, -3, -h * .22 + b, -2, -h + b, -13, -h + b], U.mix(C.b, '#000000', .3));
        c.strokeStyle = Paint.c(C.a); c.lineWidth = 1.3; c.strokeRect(-8, -h * .9 + b, 17, h * .62);
        for (let i = 0; i < 5; i++) { c.fillStyle = Paint.c(C.g); c.save(); c.globalAlpha *= .4 + Math.abs(Math.sin(e.anim * .06 + i)) * .6; c.fillRect(-5, -h * (.34 + i * .11) + b, 10, 2.4); c.fillRect(-1, -h * (.31 + i * .11) + b, 2, 3); c.restore(); }
        Paint.poly(c, [-13, -h + b, 13, -h + b, 0, -h - 15 + b], C.a); Paint.glow(c, 0, -h * .92 + b, 16, C.g);
        for (let i = 0; i < 3; i++) { const a = r * 3 + i * 2.1, x = Math.cos(a) * 30, y = -h * .55 + Math.sin(a) * 11 + b; Paint.poly(c, [x - 4, y, x, y - 7, x + 4, y, x, y + 7], C.b); }
        if (e.armorFront) { Paint.poly(c, [20, -h * .96, 33, -h * .78, 33, -h * .1, 20, -h * .02], '#34344c'); Paint.poly(c, [23, -h * .85, 30, -h * .74, 30, -h * .16, 23, -h * .1], '#14141e'); c.fillStyle = Paint.c(C.g); c.fillRect(25, -h * .55, 3, h * .12); }
    },
    shell(c, e, C) {
        const s = Math.abs(e.vx) > .2 ? Math.sin(e.anim * .28) : 0, h = e.h;
        for (let i = 0; i < 4; i++) { const x = -24 + i * 16, f = (i % 2 ? s : -s) * 9; Paint.taper(c, { x, y: -14 }, { x: x + f, y: -2 }, 6, 4, C.a); Paint.poly(c, [x + f - 6, 0, x + f + 6, 0, x + f + 3, -5, x + f - 4, -5], '#22303e'); }
        c.fillStyle = Paint.c(C.a); c.fillRect(-34, -h * .5, 64, 14);
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(-3, -h * .48, 34, h * .5, 0, Math.PI, TAU); c.closePath(); c.fill();
        c.fillStyle = Paint.c('rgba(0,0,0,.2)'); c.beginPath(); c.ellipse(-12, -h * .48, 25, h * .46, 0, Math.PI, TAU); c.closePath(); c.fill();
        c.strokeStyle = Paint.c(C.a); c.lineWidth = 2.4; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 11 - 3, -h * .5); c.quadraticCurveTo(i * 9 - 3, -h * .78, i * 4 - 3, -h * .97); c.stroke(); }
        for (let i = -2; i <= 2; i++) Paint.poly(c, [i * 9 - 8, -h * .92 + Math.abs(i) * 4, i * 10 - 3, -h * 1.1 + Math.abs(i) * 6, i * 9 + 2, -h * .92 + Math.abs(i) * 4], '#d2f3ff');
        Paint.poly(c, [27, -h * .6, 41, -h * .38, 40, -h * .2, 28, -10, 24, -h * .3], '#b8d6ea'); Paint.poly(c, [32, -h * .22, 46, -h * .12, 34, -10], '#e8f8ff'); c.fillStyle = Paint.c(C.g); c.fillRect(32, -h * .42, 6, 3.4); Paint.glow(c, 35, -h * .4, 10, C.g);
    },
    drone(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .1) * 2, w = Math.abs(Math.sin(e.anim * .8));
        c.fillStyle = Paint.c(C.b); c.fillRect(-24, y - 13, 48, 2.6); [-22, 22].forEach(x => { c.fillStyle = Paint.c('#22242a'); c.fillRect(x - 2, y - 14, 4, 6); c.fillStyle = Paint.c('rgba(200,220,240,.55)'); c.fillRect(x - 13 * w, y - 15.5, 26 * w, 1.5); });
        Paint.poly(c, [-17, y - 10, 15, y - 10, 19, y - 2, 14, y + 8, -14, y + 8, -19, y - 2], C.a); Paint.poly(c, [-17, y - 10, 15, y - 10, 17, y - 5, -17, y - 5], C.b);
        Paint.disc(c, 8, y + 1, 6, '#101216'); Paint.disc(c, 9, y + 1, 3.6, C.g); Paint.glow(c, 9, y + 1, 14, C.g); c.fillStyle = Paint.c('#22242a'); c.fillRect(-14, y + 8, 5, 5); c.fillRect(-6, y + 8, 5, 5); c.fillRect(-11, y + 2, 12, 1.6);
    },
    moth(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .08) * 4, f = .4 + Math.abs(Math.sin(e.anim * .3)) * .9;
        c.save(); c.globalAlpha *= .9;
        [[-1, 1], [1, .75]].forEach(([d, q]) => { c.fillStyle = Paint.c(C.b); c.beginPath(); c.moveTo(-2, y); c.bezierCurveTo(-22, y + d * 16 * f * q, -8, y + d * 26 * f * q, 6, y + d * 14 * f * q); c.quadraticCurveTo(6, y + d * 5 * f, -2, y); c.fill(); c.fillStyle = Paint.c(C.a); c.beginPath(); c.ellipse(-3, y + d * 13 * f * q, 4, 3.2 * f, 0, 0, TAU); c.fill(); Paint.disc(c, -3, y + d * 13 * f * q, 1.6, '#ffffff'); });
        c.restore();
        Paint.taper(c, { x: -10, y: y + 1 }, { x: 9, y }, 2, 4, C.a); for (let i = 0; i < 2; i++) { c.strokeStyle = Paint.c(C.b); c.lineWidth = 1; c.beginPath(); c.moveTo(11, y - 1); c.quadraticCurveTo(18, y - 8 + i * 8, 20, y - 6 + i * 9); c.stroke(); } Paint.glow(c, 0, y, 24, C.g);
    },
    wisp(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .07) * 5; Paint.glow(c, 0, y, 34, C.g);
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + e.anim * .03; Paint.poly(c, [Math.cos(a) * 19, y + Math.sin(a) * 19, Math.cos(a + .55) * 7, y + Math.sin(a + .55) * 7, Math.cos(a - .55) * 7, y + Math.sin(a - .55) * 7], C.b); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - e.anim * .05 + .5; Paint.poly(c, [Math.cos(a) * 11, y + Math.sin(a) * 11, Math.cos(a + .7) * 5, y + Math.sin(a + .7) * 5, Math.cos(a - .7) * 5, y + Math.sin(a - .7) * 5], '#ffffff'); }
        Paint.disc(c, 0, y, 5, '#fff'); Paint.disc(c, 2, y, 2, C.a);
    },
    imp(c, e, C) {
        const y = -e.h / 2 + Math.sin(e.anim * .1) * 3, f = Math.sin(e.anim * .4), wing = d => { Paint.poly(c, [d * 3, y - 3, d * 16, y - 20 - f * 10, d * 30, y - 13 - f * 11, d * 22, y - 4 - f * 5, d * 27, y + 6 - f * 6, d * 16, y + 3, d * 15, y + 12 - f * 3, d * 3, y + 6], C.a); c.strokeStyle = Paint.c(C.b); c.lineWidth = 1; c.beginPath(); c.moveTo(d * 3, y - 2); c.lineTo(d * 30, y - 13 - f * 11); c.moveTo(d * 3, y); c.lineTo(d * 27, y + 6 - f * 6); c.stroke(); };
        wing(-1); wing(1); Paint.taper(c, { x: -2, y: y + 7 }, { x: -14, y: y + 19 + f * 3 }, 3.5, 1, C.b); Paint.poly(c, [-14, y + 16 + f * 3, -21, y + 22 + f * 3, -12, y + 22 + f * 3], '#ffb040');
        c.fillStyle = Paint.c(C.b); c.beginPath(); c.ellipse(0, y + 1, 9, 10.5, 0, 0, TAU); c.fill(); c.strokeStyle = Paint.c('#ffcc66'); c.lineWidth = 1; c.beginPath(); c.moveTo(-3, y + 8); c.lineTo(1, y + 2); c.lineTo(-2, y - 3); c.stroke();
        Paint.poly(c, [-6, y - 6, -10, y - 18, -1, y - 8], C.a); Paint.poly(c, [6, y - 6, 10, y - 18, 1, y - 8], C.a); c.fillStyle = Paint.c('#ffee88'); c.fillRect(2, y - 3, 5.4, 2.6); fang(c, 3, y + 3, 3, 1, '#fff'); fang(c, 6, y + 3, 3, 1, '#fff'); Paint.glow(c, 0, y, 22, C.g);
    },
    blob(c, e, C) {
        const h = e.h, w = e.w, q = Math.sin(e.anim * .12) * 3;
        c.fillStyle = Paint.c(C.a); c.beginPath(); c.moveTo(-w / 2 - 6, 0); c.quadraticCurveTo(-w / 2 + q, -h, 6, -h + q); c.quadraticCurveTo(w / 2 + 8 - q, -h * .85, w / 2 + 10, 0); c.closePath(); c.fill();
        for (let i = 0; i < 6; i++) { const x = -20 + i * 8, yy = -h * .46 - Math.sin(i * 1.4) * h * .2 + q * .3; Paint.poly(c, [x - 6, yy + 3, x - 2, yy - 7, x + 6, yy - 4, x + 6, yy + 5], U.mix(C.a, '#000000', .3)); }
        c.strokeStyle = Paint.c(C.g); c.lineWidth = 2.2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-22 + i * 11, -2); c.quadraticCurveTo(-18 + i * 10 + q, -h * .3, -14 + i * 8, -h * .62); c.stroke(); }
        Paint.glow(c, 14, -h * .55, 20, C.g); c.fillStyle = Paint.c('#ffee88'); c.fillRect(13, -h * .68, 8, 3.6); c.fillRect(13, -h * .52, 8, 2.2); for (let i = 0; i < 4; i++) { const u = ((e.anim * .8 + i * 40) % 90) / 90; c.fillStyle = Paint.c('#ffb040'); c.fillRect(-16 + i * 12, -h * .3 - u * 26, 2.4, 2.4); }
    },
    worm(c, e, C) {
        const h = e.h, tel = e.telegraphing() ? 1 : 0;
        for (let i = 0; i < 7; i++) { const u = i / 6, x = Math.sin(e.anim * .08 + i) * 3 + u * 8, r = 20 - u * 6; Paint.disc(c, x, -u * h, r, i % 2 ? C.a : C.b); c.strokeStyle = Paint.c(U.mix(C.a, '#000000', .3)); c.lineWidth = 1.2; c.beginPath(); c.arc(x, -u * h, r, .3, 2.8); c.stroke(); for (const d of [-1, 1]) Paint.poly(c, [x + d * r * .7, -u * h - 3, x + d * (r + 7), -u * h - 6, x + d * r * .7, -u * h + 3], '#e8d8b0'); }
        Paint.disc(c, 8, -h, 13 + tel * 4, '#1a0a06'); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + (tel ? e.anim * .1 : 0), r = 13 + tel * 4; Paint.poly(c, [8 + Math.cos(a - .25) * r, -h + Math.sin(a - .25) * r, 8 + Math.cos(a) * (r - 9), -h + Math.sin(a) * (r - 9), 8 + Math.cos(a + .25) * r, -h + Math.sin(a + .25) * r], '#f0e4c8'); } Paint.glow(c, 8, -h, 17, C.g);
    }
});

/* ------------------------------ BOSS DETAIL ------------------------------ */
(function bossDetail() {
    const wrap = (def, over, under) => { const d = def.draw; def.draw = (c, b) => { if (under) under(c, b); d(c, b); if (over) { c.save(); over(c, b); c.restore(); } }; };
    wrap(B_ATLAS, (c, b) => {
        // Hydraulics, rivets, damage and a working evacuation screen across the chest.
        const H = -14 * Math.abs(Math.sin(b.legA)), R = (x, y) => Paint.disc(c, x, y + H, 2, '#8a92a0');
        c.translate(b.x, b.y); c.scale(b.facing, 1);
        for (let i = 0; i < 8; i++) { R(-68 + i * 19.5, -220); R(-68 + i * 19.5, -130); } for (let i = 0; i < 5; i++) { R(-68, -210 + i * 18); R(68, -210 + i * 18); }
        c.strokeStyle = '#1a1c20'; c.lineWidth = 2; c.beginPath(); c.moveTo(-74, -176 + H); c.lineTo(-46, -176 + H); c.moveTo(46, -176 + H); c.lineTo(74, -176 + H); c.moveTo(-60, -226 + H); c.lineTo(-60, -200 + H); c.stroke();
        [[-34, -108], [34, -108]].forEach(([x, y]) => { c.fillStyle = '#6b7686'; c.fillRect(x - 3, y + H, 6, 34); c.fillStyle = '#c8ccd4'; c.fillRect(x - 1.5, y + 34 + H, 3, 16); });
        if (b.plating) {
            c.fillStyle = '#06100a'; c.fillRect(-40, -196 + H, 62, 24); c.fillStyle = '#33ff88'; c.font = 'bold 8px monospace'; c.textAlign = 'left'; c.fillText('EVACUATE', -37, -186 + H); if ((b.anim >> 5) & 1) c.fillText('ROUTE 7 >>', -37, -176 + H);
            c.strokeStyle = 'rgba(255,221,51,.5)'; c.lineWidth = 1; c.strokeRect(-46, -200 + H, 92, 66);
        }
        for (let i = 0; i < 3; i++) { if ((b.anim + i * 20) % 26 < 3) VFX.add(b.x + b.facing * (-60 + i * 50), b.y - 200 + H, U.rand(-1, 1), -1.4, '#ffdd33', 14, 2, 2, .05); if ((b.anim + i * 11) % 40 === 0) VFX.smoke(b.x - b.facing * 40, b.y - 230 + H, '#555', 1, 10); }
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(20, -226 + H); c.lineTo(60, -226 + H); c.lineTo(30, -190 + H); c.fill();
    });
    wrap(B_SYLV, (c, b) => {
        // Glowing sap veins, fungal shelves and flowers around the eye.
        c.translate(b.x, b.y); const sw = Math.sin(b.anim * .02) * 6, col = b.open ? '#ff66cc' : '#7fffb0';
        c.strokeStyle = U.rgba(col, .75); c.lineWidth = 2.4; c.lineCap = 'round';
        [[-70, 0, -40, -120, -46, -180], [80, 0, 60, -110, 40, -170], [-20, 0, 0, -60, -8, -140]].forEach(v => { c.beginPath(); c.moveTo(v[0], v[1]); c.quadraticCurveTo(v[2], v[3], v[4], v[5]); c.stroke(); });
        for (let i = 0; i < 4; i++) { const y = -60 - i * 62, x = i % 2 ? 84 : -92; Paint.poly(c, [x - 26, y, x + 26, y, x + 18, y + 10, x - 18, y + 10], '#c8a878'); Paint.poly(c, [x - 26, y, x + 26, y, x + 10, y - 9, x - 12, y - 9], '#e8d0a0'); }
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, r = 70 + b.open * 30 + (i % 2) * 8, x = -10 + Math.cos(a) * r * .92, y = -230 + Math.sin(a) * r * 1.3; for (let k = 0; k < 5; k++) { const p = k / 5 * TAU; Paint.disc(c, x + Math.cos(p) * 5, y + Math.sin(p) * 5, 3.2, i % 3 ? '#f4c8e8' : '#fff0a0'); } Paint.disc(c, x, y, 2.6, '#ffdd33'); }
        if (b.anim % 11 === 0) VFX.add(b.x + U.rand(-160, 160), b.y - U.rand(260, 420), U.rand(-.6, .2), U.rand(.4, 1.1), col, 90, 4, 1, 0);
    });
    wrap(B_QARETH, (c, b) => {
        // Scale rows and a bronze crown of the drowned sovereign.
        c.translate(b.x, b.y); c.rotate(b.ang);
        c.fillStyle = 'rgba(70,46,20,.6)'; for (let i = 0; i < 6; i++) for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(-56 + i * 13 + (k % 2) * 6, k * 11, 5.4, .3, 2.9); c.fill(); }
        for (let i = 0; i < 6; i++) { const y = -38 - 0, x = -44 + i * 13; Paint.poly(c, [x - 5, y, x, y - 18 - (i % 2) * 7, x + 5, y], '#c9a227'); Paint.poly(c, [x - 5, -y, x, -y + 18 + (i % 2) * 7, x + 5, -y], '#c9a227'); }
        c.fillStyle = '#33ddff'; c.fillRect(-26, -42, 8, 4); c.fillRect(-26, 38, 8, 4);
    });
    wrap(B_NADIR, (c, b) => {
        // Ice crust, drifting frost and scars along the skull.
        c.translate(b.hx, b.hy); const ang = Math.atan2(b.P.y - 30 - b.hy, b.P.x - b.hx), flip = Math.cos(ang) < 0 ? -1 : 1; c.scale(flip, 1); c.rotate(flip > 0 ? ang * .4 : (Math.PI - ang) * -.4);
        c.strokeStyle = 'rgba(10,30,50,.6)'; c.lineWidth = 1.6; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-60 + i * 18, -40); c.quadraticCurveTo(-48 + i * 18, -14, -58 + i * 20, 16); c.stroke(); }
        Paint.poly(c, [-20, -52, 10, -58, 30, -40, 8, -44], '#d2f3ff'); Paint.poly(c, [60, -34, 96, -22, 66, -24], '#d2f3ff');
        if (b.anim % 8 === 0) VFX.add(b.hx + U.rand(-70, 70), b.hy + U.rand(-30, 30), U.rand(-.5, .5), U.rand(.2, .9), '#d2f3ff', 50, 4, 1, 0);
    });
    wrap(B_VULK, (c, b) => {
        // Layered plate edges, oath chains and rising embers.
        c.translate(b.x, b.y); c.scale(b.facing, 1); const g = b.enraged ? '#ffe070' : '#ff7a18';
        c.strokeStyle = '#4a342a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-58, -160); c.lineTo(-34, -186); c.lineTo(34, -186); c.lineTo(58, -160); c.moveTo(-44, -112); c.lineTo(44, -112); c.moveTo(-40, -98); c.lineTo(40, -98); c.stroke();
        c.setLineDash([5, 3]); c.strokeStyle = '#8a7a70'; c.lineWidth = 3; c.beginPath(); c.moveTo(-50, -170); c.quadraticCurveTo(0, -80, 52, -166); c.stroke(); c.setLineDash([]);
        for (let i = 0; i < 6; i++) { const x = -40 + i * 16; Paint.poly(c, [x - 5, -86, x + 5, -86, x + 3, -66 - (i % 2) * 8, x - 3, -66 - (i % 2) * 8], '#201412'); c.fillStyle = g; c.fillRect(x - 1, -84, 2, 12); }
        if (b.anim % 3 === 0) VFX.add(b.x + U.rand(-50, 50), b.y - U.rand(60, 200), U.rand(-.5, .5), -U.rand(.8, 2), g, 34, 3, 1, 0);
    });
    wrap(B_END, (c, b) => {
        // Rotating sigils: the Catalyst lattice under the eye.
        if (b.deathK) return;
        c.translate(b.x, b.y); c.globalCompositeOperation = 'lighter'; const t = b.t2, col = b.enraged ? '#ff2200' : '#cc66ff';
        c.strokeStyle = U.rgba(col, .75); c.lineWidth = 1.6;
        for (let k = 0; k < 2; k++) { c.save(); c.rotate(t * (k ? -.3 : .2)); const R = b.radius * (k ? .9 : 1.25), n = k ? 6 : 8; c.beginPath(); for (let i = 0; i <= n; i++) { const a = i * 3 / n * TAU; c.lineTo(Math.cos(a) * R, Math.sin(a) * R); } c.stroke(); c.restore(); }
        c.fillStyle = U.rgba(col, .9); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * .15; c.fillRect(Math.cos(a) * b.radius * 1.42 - 1.5, Math.sin(a) * b.radius * 1.42 - 3, 3, 6); }
        const view = b.locked !== null ? b.locked : Math.atan2(b.P.y - 30 - b.y, b.P.x - b.x); c.rotate(view); c.strokeStyle = '#ffffff'; c.lineWidth = 1; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.beginPath(); c.moveTo(25 + Math.cos(a) * 4, Math.sin(a) * 12); c.lineTo(25 + Math.cos(a) * 13, Math.sin(a) * 26); c.stroke(); }
    });
})();
