'use strict';
/** G2 LEVELS: the Garden of Genesis (hub), the City of Eternal Dawn, the Cathedral Without Shadow. Built with LB. */
Object.assign(THEMES, {
    garden: { step: 'grass', dust: '#8aa070', debris: '#5a4a30', music: 'g2garden', amb: 'forest', ambient: '#c4bcb4', tile: { base: '#4a3a26', mid: '#5c4830', top: '#4a7a38', edge: '#88b060', back: '#1e2418', backLine: '#2a3220' } },
    dawn: { step: 'stone', dust: '#a07a5a', debris: '#6a4a38', music: 'g2dawn', amb: 'city', ambient: '#b89888', tile: { base: '#2e2220', mid: '#45322a', top: '#8a6448', edge: '#e8a860', back: '#1c1418', backLine: '#2c2024' } },
    cathedral: { step: 'stone', dust: '#8a7a68', debris: '#5a4e42', music: 'g2sera', amb: 'void', ambient: '#a8a0a8', tile: { base: '#24202a', mid: '#38323a', top: '#6e6258', edge: '#e8c878', back: '#16121a', backLine: '#26202a' } }
});

/* Backdrops for the new lands, built with the same layer helpers as render.js. */
(function () {
    const build = Backdrop.build.bind(Backdrop);
    const towers = (x, R, base, col, n, hmin, hmax, win) => { for (let i = 0; i < n; i++) { const px = R() * BG_W, w = 18 + R() * 50, h = hmin + R() * (hmax - hmin); x.fillStyle = col; x.fillRect(px, base - h, w, h + 400); x.beginPath(); if (R() < .5) { x.moveTo(px - 3, base - h); x.lineTo(px + w / 2, base - h - w * 1.6); x.lineTo(px + w + 3, base - h); } else x.arc(px + w / 2, base - h, w / 2 + 2, Math.PI, 0); x.fill(); if (win) { x.fillStyle = win; for (let y = base - h + 10; y < base; y += 16) for (let xx = px + 5; xx < px + w - 6; xx += 10) if (R() < .5) x.fillRect(xx, y, 4, 8); } } };
    const B = {
        dawn() {
            // The sun that never set: stuck on the horizon, the sky above it bruised from never going dark.
            const L = [], add = (par, fn, parY = 0) => L.push({ img: Backdrop.layer(fn), par, parY });
            add(0, (x, R) => {
                Backdrop.grad(x, [['#1e1830'], ['#3e2a48', .3], ['#7a3e4a', .58], ['#c8643a', .8], ['#e89850', 1]]);
                x.globalCompositeOperation = 'lighter'; x.globalAlpha = .55; x.drawImage(Glow.get('#ff9a50'), 760, 200, 620, 620); x.globalAlpha = .8; x.drawImage(Glow.get('#ffd8a0'), 960, 390, 220, 220); x.globalAlpha = 1;
                for (let i = 0; i < 9; i++) { x.save(); x.translate(1070, 500); x.rotate(-Math.PI / 2 + (i - 4) * .2); x.fillStyle = 'rgba(255,190,120,.035)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(-60, -900); x.lineTo(60, -900); x.fill(); x.restore(); }
                x.globalCompositeOperation = 'source-over'; x.fillStyle = 'rgba(255,230,210,.5)'; for (let i = 0; i < 70; i++) { x.globalAlpha = .15 + R() * .3; x.fillRect(R() * BG_W, R() * 180, 1.5, 1.5); } x.globalAlpha = 1;
            });
            add(.06, (x, R) => { for (let i = 0; i < 26; i++) { x.fillStyle = R() < .5 ? 'rgba(200,110,110,.16)' : 'rgba(255,170,110,.12)'; x.beginPath(); x.ellipse(R() * BG_W, 160 + R() * 220, 160 + R() * 260, 10 + R() * 10, 0, 0, TAU); x.fill(); } });
            add(.14, (x, R) => towers(x, R, 440, 'rgba(96,58,72,.75)', 60, 60, 220));
            add(.28, (x, R) => towers(x, R, 480, 'rgba(66,40,50,.92)', 46, 50, 200, 'rgba(255,190,120,.55)'));
            add(.5, (x, R) => { towers(x, R, 520, '#3a2428', 26, 40, 160, 'rgba(255,180,100,.7)'); x.fillStyle = '#2e1c20'; for (let px = 0; px < BG_W; px += 240) { x.fillRect(px, 380, 220, 8); for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(px + 27 + k * 55, 430, 26, Math.PI, 0); x.lineTo(px + 53 + k * 55, 520); x.lineTo(px + 1 + k * 55, 520); x.fill(); } } x.fillStyle = 'rgba(232,140,80,.35)'; for (let px = 0; px < BG_W; px += 240) x.fillRect(px, 378, 220, 2); });
            add(.75, (x, R) => { for (let px = 0; px < BG_W; px += 260 + R() * 200) { const h = 180 + R() * 160; x.fillStyle = '#1e1216'; x.fillRect(px, 560 - h, 34, h + 200); x.beginPath(); x.moveTo(px - 8, 560 - h); x.lineTo(px + 17, 510 - h); x.lineTo(px + 42, 560 - h); x.fill(); x.fillStyle = 'rgba(232,140,80,.5)'; x.fillRect(px + 32, 560 - h, 2, h); x.fillStyle = 'rgba(255,190,110,.75)'; x.fillRect(px + 12, 570 - h, 10, 18); } });
            return L;
        },
        cathedral() {
            // Dim stone and coloured glass: the only bright thing in here is the goddess herself.
            const L = [], add = (par, fn) => L.push({ img: Backdrop.layer(fn), par, parY: 0 });
            add(0, (x, R) => {
                Backdrop.grad(x, [['#120e18'], ['#221c28', .5], ['#18141c', 1]]);
                for (let px = 0; px < BG_W; px += 320) {
                    x.fillStyle = '#1a1620'; x.fillRect(px, 0, 40, VH); const cx = px + 180, cy = 190;
                    x.fillStyle = '#0c0a10'; x.beginPath(); x.arc(cx, cy, 98, 0, TAU); x.fill();
                    for (let i = 0; i < 24; i++) for (let ring = 0; ring < 4; ring++) { x.beginPath(); x.arc(cx, cy, 92 * (ring + 1) / 4, i / 24 * TAU, (i + 1) / 24 * TAU); x.arc(cx, cy, 92 * ring / 4, (i + 1) / 24 * TAU, i / 24 * TAU, true); x.closePath(); x.fillStyle = ['#c89a40', '#a8483a', '#3a6aa8', '#6a4aa0', '#d8c8a0', '#3a8a6a'][(i + ring * 3) % 6]; x.globalAlpha = .45 + R() * .3; x.fill(); x.globalAlpha = 1; x.strokeStyle = '#0c0a10'; x.lineWidth = 2; x.stroke(); }
                    x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,220,170,.035)'; x.beginPath(); x.moveTo(cx - 60, cy); x.lineTo(cx + 60, cy); x.lineTo(cx + 180, 600); x.lineTo(cx - 20, 600); x.fill(); x.globalCompositeOperation = 'source-over';
                    for (let k = 0; k < 3; k++) { x.fillStyle = ['rgba(200,150,70,.3)', 'rgba(70,110,170,.3)', 'rgba(170,80,70,.3)'][k]; x.beginPath(); x.moveTo(px + 122 + k * 42, 560); x.lineTo(px + 122 + k * 42, 370); x.arc(px + 138 + k * 42, 370, 16, Math.PI, 0); x.lineTo(px + 154 + k * 42, 560); x.fill(); }
                }
            });
            add(.2, x => { for (let px = 60; px < BG_W; px += 160) { const g = x.createLinearGradient(px, 0, px + 40, 0); g.addColorStop(0, '#16121a'); g.addColorStop(.55, '#3a3038'); g.addColorStop(1, '#100c12'); x.fillStyle = g; x.fillRect(px, 0, 40, 560); } });
            return L;
        },
        garden() {
            const L = [], add = (par, fn, parY = 0) => L.push({ img: Backdrop.layer(fn), par, parY });
            add(0, x => { Backdrop.grad(x, [['#2a3858'], ['#5a7088', .5], ['#c8a088', .85], ['#e0b890', 1]]); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .6; x.drawImage(Glow.get('#ffc890'), 960, 260, 300, 300); x.globalAlpha = 1; });
            add(.05, (x, R) => { for (let i = 0; i < 18; i++) { x.fillStyle = 'rgba(255,220,200,.14)'; x.beginPath(); x.ellipse(R() * BG_W, 50 + R() * 180, 90 + R() * 160, 30, 0, 0, TAU); x.fill(); } });
            add(.16, (x, R) => { x.fillStyle = 'rgba(70,84,104,.8)'; x.beginPath(); x.moveTo(0, VH); for (let px = 0; px <= BG_W; px += 20) x.lineTo(px, 380 - 110 * U.noise1(px / 260, 3) - 30 * Math.sin(px / BG_W * TAU * 2)); x.lineTo(BG_W, VH); x.fill(); });
            add(.34, (x, R) => { x.fillStyle = '#34503e'; x.beginPath(); x.moveTo(0, VH); for (let px = 0; px <= BG_W; px += 16) x.lineTo(px, 450 - 80 * U.noise1(px / 180, 9)); x.lineTo(BG_W, VH); x.fill(); });
            add(.6, (x, R) => { for (let px = 40; px < BG_W; px += 110 + R() * 160) { x.fillStyle = '#3a2a1a'; x.fillRect(px - 5, 420, 10, 160); x.fillStyle = R() < .5 ? '#2a4a32' : '#3a5a36'; for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(px + Math.cos(k * 1.2) * 40, 400 + Math.sin(k * 2.3) * 26, 42, 28, 0, 0, TAU); x.fill(); } } });
            return L;
        }
    };
    const ab = Atmos.build.bind(Atmos), fg = {};
    Atmos.build = function (id) {
        if (!B[id]) return ab(id);
        if (fg[id]) return fg[id];
        const c = U.canvas(BG_W, VH), x = c.getContext('2d'), R = U.mulberry(id.length * 13);
        if (id === 'garden') { for (let px = 0; px < BG_W; px += 180 + R() * 220) { x.fillStyle = 'rgba(40,80,40,.55)'; x.beginPath(); x.ellipse(px, -20, 90 + R() * 60, 40 + R() * 30, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(40,80,40,.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, 10); x.quadraticCurveTo(px + 10, 60, px - 4, 90 + R() * 40); x.stroke(); } }
        else if (id === 'dawn') { for (let px = 0; px < BG_W; px += 500 + R() * 400) { x.fillStyle = 'rgba(150,40,30,.28)'; x.beginPath(); x.moveTo(px, 0); x.lineTo(px + 60, 0); x.lineTo(px + 60, 170); x.lineTo(px + 30, 140); x.lineTo(px, 170); x.fill(); x.fillStyle = 'rgba(255,210,90,.35)'; x.fillRect(px + 24, 50, 12, 12); } }
        return fg[id] = c;
    };
    Atmos.fogCol.garden = '#c8b0a0'; Atmos.fogCol.city = '#8a5a5a';
    Backdrop.build = function (id) { if (B[id]) { if (!this.cache[id]) this.cache[id] = B[id](); return this.cache[id]; } return build(id); };
})();

Object.assign(LEVELS, {
    garden() {
        const b = new LB('garden', 120, 40, { name: 'THE GARDEN OF GENESIS', sub: 'Between the days', region: 'forest', theme: THEMES.garden, bg: 'garden', spawn: { x: 6, y: 30 }, weather: 'motes', hub: true });
        b.at(0, 30).flat(20).upS(2).flat(18).downS(2).flat(24).upS(1).flat(20).downS(1).flat(30);
        b.beacon(4, 30);
        b.obj('exit', 12, 30, { g2: 'altar', label: 'Knights’ Altar' }).obj('exit', 30, 28, { g2: 'tree', label: 'Tree of Grace' }).obj('exit', 48, 30, { g2: 'forge', label: 'Ash Forge' });
        b.obj('npc', 58, 30, { id: 'gardener' }); b.obj('exit', 70, 30, { g2: 'statue', label: 'Statue' }); b.obj('exit', 84, 29, { g2: 'archive', label: 'Second Book' });
        b.e('dummy', 96, 29); b.obj('exit', 112, 30, { g2: 'portal', label: 'Gate of Seven Days' });
        b.deco('tree', 22, 28).deco('fern', 40, 28).deco('tree', 64, 30).deco('fern', 76, 30).deco('shroom', 90, 29).deco('tree', 104, 30);
        b.light(30, 24, 220, '#fff0b0', .7).light(48, 27, 160, '#ff9a40', .8, 1).light(112, 24, 260, '#cfe8ff', .9);
        return b.done();
    },
    dawn() {
        const b = new LB('dawn', 320, 50, { name: 'THE CITY OF ETERNAL DAWN', sub: 'The First Day: the sun that never set', region: 'city', theme: THEMES.dawn, bg: 'dawn', next: 'cathedral', spawn: { x: 5, y: 36 }, weather: 'motes' });
        b.at(0, 36).flat(26).beacon(6, 36);
        b.obj('npc', 20, 36, { id: 'citizen' }); b.say(4, 36, 'ZERO', 'Stay in the shadows, little one. Let me do the fighting. Press E to talk, and U to make a little night of your own.', 260);
        b.deco('lamp', 14, 36, { lit: 1 }).deco('banner', 22, 36);
        b.upS(3).flat(10).es([['sleepless', b.cx - 4, 28], ['choir', b.cx - 2, 31]]).downS(3).flat(8);
        b.obj('lore', b.cx - 4, b.cy, { id: 'g2p1' });
        b.gap(7, 'wire', { period: 120, on: 40 }); b.plat(b.cx - 5, b.cy - 1, 3);
        b.flat(16).es([['sleepless', b.cx - 10, 26], ['lantern', b.cx - 4, 28], ['forbidden', b.cx - 6, 34]]);
        b.say(b.cx - 14, b.cy, 'ZERO', 'The angels went mad without sleep. Anything that moves, they charge. Hide in your night when they come.', 220); b.trig(b.cx - 6, b.cy - 12, 2, 13, () => { if (!Save.data.g2.named) { Save.data.g2.named = true; G2.cut('g2naming'); } });
        // The sun wall: climb on broken bridges, a page waits at the top.
        const wx = b.cx; b.flat(6); b.upS(2).flat(10); b.plat(wx + 8, b.cy - 3, 3); b.upS(2).flat(12); b.obj('lore', b.cx - 6, b.cy, { id: 'g2p2' });
        b.es([['choir', b.cx - 4, b.cy - 2], ['lantern', b.cx - 8, b.cy - 6]]);
        b.say(b.cx - 10, b.cy, 'NYX', 'Uncle, your armour is cracked. Does it hurt?', 160); b.say(b.cx - 4, b.cy, 'ZERO', 'Only when I stop.', 140);
        b.downS(2).flat(6).downS(2).flat(10).beacon(b.cx - 6, b.cy);
        // The Alley of Forbidden Shadows.
        b.say(b.cx - 4, b.cy, 'NYX', 'Those shadows look like mine. Why does everyone hate them?', 200); b.say(b.cx + 2, b.cy, 'ZERO', 'Because this city forgot what night is for. Only light truly hurts them. Stay behind me.', 220);
        b.flat(30).es([['forbidden', b.cx - 22, b.cy - 2], ['forbidden', b.cx - 12, b.cy - 2], ['lantern', b.cx - 8, b.cy - 6], ['dawnwarden', b.cx - 4, b.cy - 2]]);
        b.crumble(b.cx, b.cy, 6); b.gap(6); b.flat(10);
        // Hidden shard: high ledges above the dome.
        const sx = b.cx; b.flat(16); b.plat(sx + 2, b.cy - 4, 3).plat(sx + 6, b.cy - 8, 3).plat(sx + 10, b.cy - 12, 3);
        b.obj('chest', sx + 11, b.cy - 12, { id: 'g2shard1', cells: 40, shard: 'light' }); b.obj('lore', sx + 14, b.cy, { id: 'g2p3' });
        b.es([['sleepless', sx + 8, b.cy - 6], ['choir', sx + 14, b.cy - 2]]);
        b.upS(2).flat(10).beacon(b.cx - 4, b.cy);
        // The Dawn Gate: the knight's arena.
        const ar = b.cx, y = b.cy; b.flat(44); b.fill(ar + 40, 0, ar + 43, 49);
        b.gate(ar + 2, y - 10, 10, 'arena_l'); b.gate(ar + 40, y - 10, 10, 'arena_r', { open: false });
        b.bossArena('knight', ar + 3, ar + 40, y, ar + 30, y, { trigger: ar + 7 });
        b.obj('exit', ar + 37, y, { hidden: true, label: 'Enter the Cathedral' }); b.obj('lore', ar + 34, y, { id: 'g2p4' });
        b.flat(6);
        return b.done();
    },
    cathedral() {
        const b = new LB('cathedral', 70, 34, { name: 'THE CATHEDRAL WITHOUT SHADOW', sub: 'The First Day: Seraphina', region: 'city', theme: THEMES.cathedral, bg: 'cathedral', spawn: { x: 4, y: 26 }, weather: 'motes', indoors: true });
        b.at(0, 26).flat(70); b.fill(0, 0, 1, 33); b.fill(68, 0, 69, 33);
        b.beacon(3, 26); b.gate(8, 16, 10, 'arena_l');
        const x0 = 9, x1 = 67, y = 26;
        [14, 30, 46, 62].forEach((tx, i) => b.obj('exit', tx, y, { g2: 'tower', id: 'tower' + i, label: 'Raise the shadow', cd: 0 }));
        b.bossArena('seraphina', x0, x1, y, 52, 18, { trigger: 12, pillars: [{ x: 22 * TILE, top: 19 * TILE }, { x: 38 * TILE, top: 19 * TILE }, { x: 54 * TILE, top: 19 * TILE }] });
        return b.done();
    }
});
REGIONS.length = 0;
REGIONS.push(
    { id: 'day1', level: 'dawn', name: 'THE FIRST DAY: LIGHT', desc: 'The City of Eternal Dawn. The sun never sets and no one can sleep.', col: '#ffe9a8', boss: 'SERAPHINA' },
    { id: 'day2', level: null, name: 'THE SECOND DAY: WATER', desc: 'The Sea of Tears.', col: '#6ac8ff', boss: 'MAREVA' },
    { id: 'day3', level: null, name: 'THE THIRD DAY: LAND AND TREE', desc: 'The Forest of Memory.', col: '#7ae07a', boss: 'THE GARDENER' },
    { id: 'day4', level: null, name: 'THE FOURTH DAY: STARS', desc: 'The Broken Observatory.', col: '#c8b0ff', boss: 'ASTRAEA' },
    { id: 'day5', level: null, name: 'THE FIFTH DAY: BEASTS', desc: 'The Desert of the Pack.', col: '#ffb050', boss: 'LILITH-VARGA' },
    { id: 'day6', level: null, name: 'THE SIXTH DAY: MANKIND', desc: 'New Meridian.', col: '#c0c8d8', boss: 'ARCHON VEIL' },
    { id: 'day7', level: null, name: 'THE SEVENTH DAY: REST', desc: 'The Empty Throne.', col: '#ffffff', boss: 'VESPER' }
);
LEVEL_ORDER.length = 0; LEVEL_ORDER.push('garden', 'dawn', 'cathedral');
Object.assign(OBJECTIVES, { garden: 'Walk to the Gate of Seven Days', dawn: 'Reach the Dawn Gate', cathedral: 'Let the First Day sleep' });

/* Hub stations are exits with a g2 tag; chests can carry a Shard of Peace. */
(function () {
    const it = G.interact.bind(G);
    G.level && 0;
    G.interact = function () {
        const o = this.nearObj;
        if (o && o.kind === 'exit' && o.g2 === 'tower') { this.player.rig.play('interact', 4); G2.raiseTower(o); return; }
        if (o && o.kind === 'exit' && o.g2) { this.player.rig.play('interact', 4); this.player.vx = 0; G2.station(o.g2); return; }
        if (o && o.kind === 'chest' && o.shard && !o.open) { Save.data.g2.shards[o.shard] = 1; this.toast('Shard of Peace: Shade', '#e0f0ff'); G.flash = .4; }
        it();
    };
    const ll = Game.loadLevel.bind(Game);
    Game.loadLevel = function (id, cp) { G.g2blind = 0; G.g2cue = null; G.flags.army = null; ll(id, cp); if (G.level.id === 'garden') G2.enterGarden(); };
    Game.toHub = function () { this.deploy('garden'); };
    const od = ObjArt.draw.bind(ObjArt);
    ObjArt.draw = function (c, L) {
        od(c, L); const t = G.time;
        for (const o of L.objs) {
            if (o.kind !== 'exit' || !o.g2) continue; const x = o.x, y = o.y;
            if (o.g2 === 'altar') { c.fillStyle = '#8a8070'; c.fillRect(x - 30, y - 24, 60, 24); ['#00ffff', '#ffaa33', '#a855ff', '#7fffd4', '#ffd86b'].forEach((col, i) => { c.fillStyle = '#5a4a3a'; c.fillRect(x - 48 + i * 24, y - 110, 3, 86); c.fillStyle = col; c.fillRect(x - 45 + i * 24, y - 108, 14, 34); }); }
            else if (o.g2 === 'tree') { c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#fff0b0'), x - 120, y - 260, 240, 240); c.restore(); Decor.tree(c, { x, y }); for (let i = 0; i < 10; i++) Paint.disc(c, x + Math.sin(i * 2.3) * 60, y - 200 + Math.cos(i * 1.7) * 40 + Math.sin(t * .03 + i) * 4, 2.5, '#fff0b0'); }
            else if (o.g2 === 'forge') { c.fillStyle = '#4a4040'; c.fillRect(x - 40, y - 60, 80, 60); c.fillStyle = '#2a2020'; c.fillRect(x - 26, y - 46, 52, 30); Paint.glow(c, x, y - 30, 50 + Math.sin(t * .2) * 6, '#ff8a30'); c.fillStyle = '#5a5a60'; c.fillRect(x + 48, y - 22, 34, 10); }
            else if (o.g2 === 'archive') { c.fillStyle = '#5a3a20'; c.fillRect(x - 4, y - 46, 8, 46); c.fillStyle = '#f4e8c8'; c.fillRect(x - 18, y - 60, 17, 12); c.fillRect(x + 1, y - 60, 17, 12); Paint.glow(c, x, y - 54, 24, '#ffe9a8'); }
            else if (o.g2 === 'tower') { const on = o.cd > G.time; c.fillStyle = '#9a8c70'; c.fillRect(x - 16, y - 150, 32, 150); c.fillStyle = '#d8c89a'; c.fillRect(x - 22, y - 160, 44, 12); Paint.glow(c, x, y - 150, on ? 40 : 22, on ? '#2a1a5a' : '#b48cff'); Paint.disc(c, x, y - 150, 6, on ? '#140c24' : '#e8e0ff'); }
            else if (o.g2 === 'portal') { c.fillStyle = '#8a8070'; c.fillRect(x - 70, y - 170, 18, 170); c.fillRect(x + 52, y - 170, 18, 170); c.beginPath(); c.arc(x, y - 170, 70, Math.PI, 0); c.arc(x, y - 170, 52, 0, Math.PI, true); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,240,190,.35)'; c.fillRect(x - 52, y - 170, 104, 170); c.restore(); REGIONS.forEach((r, i) => { const a = Math.PI + (i + .5) / 7 * Math.PI; Paint.disc(c, x + Math.cos(a) * 61, y - 170 + Math.sin(a) * 61, 6, r.level ? r.col : '#3a3a3a'); }); }
            else if (o.g2 === 'statue') { const g = Save.data.g2; if (!g.spared.seraphina && !g.killed.seraphina) continue; c.fillStyle = '#9a9488'; c.fillRect(x - 26, y - 20, 52, 20); if (g.spared.seraphina) { c.fillStyle = '#e0dacc'; c.beginPath(); c.moveTo(x - 10, y - 110); c.lineTo(x + 10, y - 110); c.lineTo(x + 24, y - 20); c.lineTo(x - 24, y - 20); c.fill(); Paint.disc(c, x, y - 120, 10, '#e0dacc'); for (const d of [-1, 1]) { c.beginPath(); c.ellipse(x + d * 30, y - 96, 30, 10, d * .5, 0, TAU); c.fill(); } } else { c.fillStyle = '#7a746a'; c.beginPath(); c.moveTo(x - 14, y - 20); c.lineTo(x - 6, y - 50); c.lineTo(x + 4, y - 34); c.lineTo(x + 14, y - 56); c.lineTo(x + 18, y - 20); c.fill(); } }
        }
        if (G.arena && G.arena.pillars) for (const p of G.arena.pillars) { const gr = c.createLinearGradient(p.x - 22, 0, p.x + 22, 0); gr.addColorStop(0, '#bfb092'); gr.addColorStop(.4, '#fffaf0'); gr.addColorStop(1, '#9a8c70'); c.fillStyle = gr; c.fillRect(p.x - 22, p.top, 44, G.arena.y - p.top); c.fillStyle = '#d8c89a'; c.fillRect(p.x - 30, p.top - 14, 60, 16); }
    };
})();
