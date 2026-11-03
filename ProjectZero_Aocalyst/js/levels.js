'use strict';
/**
 * LEVELS: tile-based builders. Coordinates are tiles unless stated otherwise.
 * Single jump clears about 6 tiles across and 4 up, double jump about 11 across and 8 up,
 * and every required gap below stays within what the slowest operator can do.
 */
class LB {
    constructor(id, w, h, def) {
        this.d = Object.assign({ id, w, h, grid: new Uint8Array(w * h), back: new Uint8Array(w * h), hazards: [], dynDefs: [], spawns: [], objs: [], trigs: [], decor: [], lights: [], route: [], cps: [], falls: [] }, def);
        this.cx = 0; this.cy = 0;
    }
    set(x, y, t) { const D = this.d; if (x >= 0 && x < D.w && y >= 0 && y < D.h) D.grid[y * D.w + x] = t; }
    get(x, y) { const D = this.d; return D.grid[y * D.w + x]; }
    fill(x0, y0, x1, y1, t = T.S) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, t); return this; }
    clear(x0, y0, x1, y1, back = 1) { this.fill(x0, y0, x1, y1, T.E); if (back) this.backwall(x0, y0, x1, y1, back); return this; }
    backwall(x0, y0, x1, y1, v = 1) { const D = this.d; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && x < D.w && y >= 0 && y < D.h) D.back[y * D.w + x] = v; return this; }
    at(x, y) { this.cx = x; this.cy = y; return this; }
    col(x, top) { this.fill(x, top, x, this.d.h - 1); }
    flat(n) { for (let i = 0; i < n; i++) this.col(this.cx + i, this.cy); this.cx += n; return this; }
    up(n) { for (let i = 0; i < n; i++) { this.set(this.cx, this.cy - 1, T.R45); this.col(this.cx, this.cy); this.cx++; this.cy--; } return this; }
    down(n) { for (let i = 0; i < n; i++) { this.set(this.cx, this.cy, T.L45); this.col(this.cx, this.cy + 1); this.cx++; this.cy++; } return this; }
    upS(n) { for (let i = 0; i < n; i++) { this.set(this.cx, this.cy - 1, T.R22A); this.col(this.cx, this.cy); this.cx++; this.set(this.cx, this.cy - 1, T.R22B); this.col(this.cx, this.cy); this.cx++; this.cy--; } return this; }
    downS(n) { for (let i = 0; i < n; i++) { this.set(this.cx, this.cy, T.L22A); this.col(this.cx, this.cy + 1); this.cx++; this.set(this.cx, this.cy, T.L22B); this.col(this.cx, this.cy + 1); this.cx++; this.cy++; } return this; }
    step(dy) { this.cy += dy; return this; }
    gap(n, haz, o = {}) {
        if (haz) { const y = this.cy + (o.dy === undefined ? 3 : o.dy); this.fill(this.cx, y + 1, this.cx + n - 1, this.d.h - 1); this.haz(haz, this.cx, y, n, 1.05, o); }
        this.cx += n; return this;
    }
    plat(x, y, len) { for (let i = 0; i < len; i++) this.set(x + i, y, T.O); return this; }
    haz(kind, x, y, w, h, o = {}) { this.d.hazards.push(Object.assign({ kind, x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE }, o)); return this; }
    px(o, keys) { keys.forEach(k => { if (o[k] !== undefined) o[k] *= TILE; }); return o; }
    mover(x, y, len, tx, ty, period, o = {}) { this.d.dynDefs.push(Object.assign({ kind: 'mover', oneway: true, x: x * TILE, y: y * TILE, w: len * TILE, h: 14, tx: tx * TILE, ty: ty * TILE, period, skin: 'plat' }, o)); return this; }
    crumble(x, y, len, o = {}) { for (let i = 0; i < len; i++) this.d.dynDefs.push(Object.assign({ kind: 'crumble', oneway: true, x: (x + i) * TILE, y: y * TILE, w: TILE, h: 16, delay: 34, skin: 'crumble' }, o)); return this; }
    breakable(x, y, w, h, id, o = {}) { this.d.dynDefs.push(Object.assign({ kind: 'breakable', x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE, hp: 3, id, skin: 'crack' }, o)); return this; }
    gate(x, y, h, id, o = {}) { this.d.dynDefs.push(Object.assign({ kind: 'gate', x: x * TILE, y: y * TILE, w: TILE, h: h * TILE, id, open: true, skin: 'gate', noStep: true }, o)); return this; }
    e(type, x, yTop) { this.d.spawns.push({ type, x: x * TILE, y: yTop * TILE }); return this; }
    es(list) { list.forEach(l => this.e(l[0], l[1], l[2])); return this; }
    obj(kind, x, y, o = {}) { this.d.objs.push(Object.assign({ kind, x: x * TILE, y: y * TILE }, o)); return this; }
    beacon(x, y) { this.d.cps.push({ x: x * TILE, y: y * TILE, id: this.d.cps.length }); return this.obj('beacon', x, y, { cpId: this.d.cps.length - 1 }); }
    trig(x, y, w, h, fn, o = {}) { this.d.trigs.push(Object.assign({ x: x * TILE, y: y * TILE, w: w * TILE, h: h * TILE, fn, once: true }, o)); return this; }
    say(x, y, speaker, text, dur = 200) { return this.trig(x, y - 8, 2, 12, () => G.say(speaker, text, dur)); }
    /** Locks the player in until every wave is cleared. */
    ambush(x0, x1, y, waves, id, gh = 8) {
        const gl = `amb_${id}_l`, gr = `amb_${id}_r`;
        this.gate(x0, y - gh, gh, gl); this.gate(x1, y - gh, gh, gr);
        return this.trig(x0 + 3, y - 12, 2, 13, () => { if (!G.flags['amb_' + id]) G.runScript(ambushScript(id, gl, gr, waves)); });
    }
    deco(kind, x, y, o = {}) { this.d.decor.push(Object.assign({ kind, x: x * TILE, y: y * TILE }, o)); return this; }
    light(x, y, r, col, a = 1, flicker = 0) { this.d.lights.push({ x: x * TILE, y: y * TILE, r, col, a, flicker }); return this; }
    wp(x, y) { this.d.route.push({ x: x * TILE, y: y * TILE }); return this; }
    bossArena(bossId, x0, x1, y, spawnX, spawnY, o = {}) { this.d.arena = Object.assign({ boss: bossId, x0: x0 * TILE, x1: x1 * TILE, y: y * TILE, sx: spawnX * TILE, sy: spawnY * TILE }, o, { trigger: o.trigger * TILE }); return this; }
    /** Trims unused columns so the camera and backdrop end with the authored map. */
    done() {
        const D = this.d, w0 = D.w; let last = 0;
        for (let x = w0 - 1; x > 0 && !last; x--) for (let y = 0; y < D.h; y++) if (D.grid[y * w0 + x]) { last = x; break; }
        const w = last + 1, g = new Uint8Array(w * D.h), bk = new Uint8Array(w * D.h);
        for (let y = 0; y < D.h; y++) for (let x = 0; x < w; x++) { g[y * w + x] = D.grid[y * w0 + x]; bk[y * w + x] = D.back[y * w0 + x]; }
        D.grid = g; D.back = bk; D.w = w;
        return D;
    }
}
function* ambushScript(id, gl, gr, waves) {
    G.setGates([gl, gr], false); G.combatLock = true; Sound.sfx('door'); Sound.sfx('warn'); G.toast('AMBUSH', '#ff4433');
    for (const w of waves) {
        for (const s of w) { const y = s[2] === undefined ? null : s[2] * TILE; G.spawnAt(s[0], s[1] * TILE, y, { spawnIn: true, lock: true }); yield 8; }
        yield 34;
        yield () => G.enemies.every(e => e.dead || !e.lock);
        yield 30;
    }
    G.flags['amb_' + id] = true; G.combatLock = false; G.setGates([gl, gr], true); Sound.sfx('door'); G.toast('AREA CLEAR', '#00ffaa');
}

const THEMES = {
    city: { step: 'stone', dust: '#8a8070', debris: '#6a6660', music: 'city', amb: 'city', ambient: '#a9aab6', tile: { base: '#2c2e33', mid: '#3a3c42', top: '#5a5a5c', edge: '#8a8678', back: '#16171b', backLine: '#22242a' } },
    forest: { step: 'grass', dust: '#6a7a50', debris: '#4a3a24', music: 'forest', amb: 'forest', ambient: '#94b49e', tile: { base: '#2a2118', mid: '#3a2d1e', top: '#3e6a2e', edge: '#7fbf4a', back: '#12140e', backLine: '#1e2418' } },
    desert: { step: 'sand', dust: '#d8b070', debris: '#a07a42', music: 'desert', amb: 'desert', ambient: '#ece0c6', tile: { base: '#7a5a34', mid: '#94703f', top: '#d2a860', edge: '#f0d090', back: '#2e2214', backLine: '#3e2e1a' } },
    ice: { step: 'snow', dust: '#d8e8f4', debris: '#a8c8dc', music: 'ice', amb: 'ice', ambient: '#bccbe0', tile: { base: '#3a5068', mid: '#587894', top: '#c8dcec', edge: '#ffffff', back: '#142230', backLine: '#1e3244' } },
    volcano: { step: 'stone', dust: '#5a4a44', debris: '#3a2a26', music: 'volcano', amb: 'lava', ambient: '#e0b8a4', tile: { base: '#3a2420', mid: '#54352c', top: '#7a4c38', edge: '#ff8a28', back: '#1c1010', backLine: '#3a1a0e' } },
    core: { step: 'metal', dust: '#5a4a44', debris: '#3a2a26', music: 'volcano', amb: 'void', ambient: '#c0a0b4', tile: { base: '#2a2036', mid: '#3e304c', top: '#6a4e70', edge: '#ff3a10', back: '#141022', backLine: '#3e1020' } }
};

const LEVELS = {
    /* ============================ MAP 01 ============================== */
    city() {
        const b = new LB('city', 440, 62, { name: 'THE FALLEN CITY', sub: 'The First Seal: the great city is fallen', region: 'city', theme: THEMES.city, bg: 'city', next: 'forest', spawn: { x: 6, y: 40 }, weather: 'ash' });
        b.at(0, 40).flat(34).beacon(9, 40);
        b.obj('npc', 18, 40, { id: 'hask' });
        b.deco('car', 24, 40).deco('lamp', 13, 40, { lit: 1 }).deco('rubble', 28, 40).deco('sign', 31, 40, { text: 'EVAC ROUTE 7' }).deco('vine', 4, 40);
        b.obj('lore', 26, 40, { id: 'city1' });
        b.trig(8, 30, 2, 11, () => G.tutorial('move'));
        b.trig(30, 30, 2, 11, () => G.tutorial('combat'));
        b.gap(5, 'wire', { period: 110, on: 40 }).flat(32);
        b.deco('car', 44, 40, { flip: 1 }).deco('lamp', 52, 40, { broken: 1 }).deco('rubble', 58, 40).deco('car', 63, 40);
        b.es([['scav', 44, 38], ['scav', 50, 38], ['gunner', 62, 38], ['drone', 56, 30]]);
        b.say(40, 40, 'VESPER', 'Signal locked. I am VESPER, Meridian Line dispatch. Head east through the old transit district.');
        // Building A: climb the interior floors to reach the rooftops.
        const ax = 71, aw = 26;
        b.at(ax, 40).flat(aw);
        b.fill(ax, 12, ax + aw, 37); b.clear(ax + 1, 13, ax + aw - 1, 39); b.clear(ax - 1, 36, ax, 39, 0);
        [33, 26, 19].forEach((y, i) => { b.plat(ax + 1, y, aw - 1); b.clear(ax + (i % 2 ? 18 : 3), y, ax + (i % 2 ? 24 : 8), y); });
        b.fill(ax + 1, 12, ax + aw - 1, 12, T.O);
        b.plat(ax + 16, 37, 4);
        b.plat(ax + 3, 30, 3);
        b.es([['scav', ax + 14, 34], ['gunner', ax + 10, 25], ['hound', ax + 16, 25], ['scav', ax + 12, 18], ['gunner', ax + 20, 18]]);
        b.breakable(ax + 22, 34, 1, 5, 'citywall1'); b.clear(ax + 23, 34, ax + 25, 39);
        b.obj('chest', ax + 24, 40, { id: 'city_c1', relic: 'keycard' });
        b.deco('desk', ax + 8, 40).deco('desk', ax + 6, 33).deco('desk', ax + 14, 26).deco('poster', ax + 12, 29).deco('poster', ax + 6, 22, { text: 'THE FUTURE IS ZERO' });
        b.light(ax + 8, 30, 170, '#ffd9a0', .7, 1).light(ax + 16, 16, 150, '#ffd9a0', .6, 1);
        b.fill(ax + aw, 12, ax + aw, 61);
        b.say(ax + 3, 18, 'SABLE', 'Rooftops are safer. Nothing down there but people who stopped being people.');
        // Roof run with collapsing and moving links.
        b.at(ax + aw + 1, 12);
        b.gap(7); b.crumble(ax + aw + 3, 13, 3);
        const bx = ax + aw + 8;
        b.at(bx, 15).flat(23);
        b.deco('antenna', bx + 5, 15).deco('ac', bx + 14, 15).deco('rubble', bx + 19, 15);
        b.es([['hound', bx + 8, 13], ['drone', bx + 14, 8], ['gunner', bx + 19, 13]]);
        b.mover(bx + 24, 17, 3, bx + 30, 17, 300, { skin: 'plat' });
        const cx = bx + 35;
        b.at(cx, 18).flat(16).down(3).flat(6);
        b.beacon(cx + 3, 18);
        b.obj('lore', cx + 8, 18, { id: 'city2' }); b.deco('tank', cx + 12, 18);
        // Fire escape down to the plaza.
        const fx = b.cx;
        for (let i = 0; i < 4; i++) b.plat(fx + (i % 2 ? 6 : 1), 25 + i * 4, 5);
        b.fill(fx - 1, 21, fx - 1, 61); b.fill(fx + 11, 18, fx + 11, 38);
        b.at(fx, 42).flat(12).say(fx + 2, 41, 'ROOK', 'Halcyon Plaza. I poured these foundations. Heads up, this is a kill box.');
        // Plaza ambush.
        const px = fx + 12; b.at(px, 42).flat(52);
        b.ambush(px + 2, px + 50, 42, [[['scav', px + 10], ['scav', px + 42], ['gunner', px + 44]], [['hound', px + 8], ['hound', px + 44], ['drone', px + 26, 30], ['gunner', px + 12]], [['sentry', px + 26, 36]]], 'plaza');
        b.deco('fountain', px + 26, 42).deco('lamp', px + 13, 42, { lit: 1 }).deco('lamp', px + 39, 42, { lit: 1 }).deco('car', px + 34, 42, { flip: 1 });
        b.light(px + 13, 36, 190, '#ffcf90', .8, 1).light(px + 39, 36, 190, '#ffcf90', .8, 1);
        // Subway stairs down.
        b.beacon(px + 54 - 2, 42);
        const sx = px + 52; b.at(sx, 42).flat(5).down(12);
        const tx = b.cx;
        // Open ramp ends at the tunnel mouth; a toppled tower blocks the surface road above it.
        b.fill(tx, 40, tx + 92, 45); b.fill(tx, 8, tx + 4, 39);
        b.clear(tx, 46, tx + 92, 53, 2);
        b.at(tx, 54).flat(26);
        b.deco('train', tx + 8, 54);
        b.es([['scav', tx + 8, 52], ['gunner', tx + 18, 52], ['hound', tx + 22, 52]]);
        b.say(tx + 1, 54, 'YSOLDE', 'Line 3. My line. The last train left this platform with the doors still open.');
        b.obj('lore', tx + 14, 54, { id: 'city3' });
        b.light(tx + 6, 48, 150, '#a0d0ff', .6, 1).light(tx + 22, 48, 150, '#a0d0ff', .6, 1);
        b.gap(12, 'wire', { dy: 2, period: 150, on: 70 });
        b.plat(b.cx - 10, 52, 3).plat(b.cx - 5, 51, 3);
        b.flat(24);
        const hid = b.cx - 14;
        b.es([['sentry', hid + 4, 52], ['drone', hid - 2, 49]]);
        b.breakable(hid, 42, 3, 4, 'cityhidden', { oneway: false }); b.clear(hid, 42, hid + 2, 45, 2); b.clear(hid - 4, 38, hid + 7, 41, 2);
        b.fill(hid - 5, 36, hid + 8, 37); b.fill(hid - 5, 38, hid - 5, 41); b.fill(hid + 8, 38, hid + 8, 41); // collapsed bunker lid
        b.plat(hid - 1, 49, 5);
        b.obj('chest', hid + 4, 42, { id: 'city_c2', cells: 80 }); b.obj('lore', hid - 2, 42, { id: 'city4' });
        b.beacon(b.cx - 4, 54);
        b.flat(30);
        b.es([['hunter', b.cx - 16, 52]]);
        b.say(b.cx - 26, 54, 'VESPER', 'Elite signature ahead. These hunters still answer to the Civic Defense net.');
        // Ramp back to the surface.
        const rx = b.cx;
        b.fill(rx, 40, rx + 40, 45); b.clear(rx, 46, rx + 2, 53, 2);
        b.fill(rx, 46, rx, 53);
        const ramp = rx - 8;
        b.clear(ramp, 40, ramp + 7, 45, 2);
        for (let i = 0; i < 4; i++) b.plat(ramp + (i % 2 ? 4 : 0), 50 - i * 3, 4);
        b.at(rx + 1, 40).flat(22).upS(4).flat(6);
        b.deco('car', rx + 8, 40).deco('sign', rx + 16, 40, { text: 'OVERPASS CLOSED' });
        b.es([['gunner', rx + 12, 38], ['scav', rx + 18, 38]]);
        // Boss: the collapsing overpass.
        const ar = b.cx; const y = b.cy;
        b.at(ar, y).flat(70); b.fill(ar + 62, 0, ar + 69, 61);
        b.fill(ar - 1, 0, ar + 4, y - 11); // ceiling lip keeps the fight on the deck
        b.gate(ar + 3, y - 10, 10, 'arena_l');
        b.beacon(ar - 3, y);
        b.bossArena('atlas', ar + 4, ar + 62, y, ar + 46, y, { trigger: ar + 8 });
        b.deco('lamp', ar + 18, y, { lit: 1 }).deco('lamp', ar + 42, y, { lit: 1 }).deco('rubble', ar + 30, y);
        b.obj('exit', ar + 58, y, { hidden: true });
        b.light(ar + 18, y - 6, 220, '#ffdd88', .7).light(ar + 42, y - 6, 220, '#ffdd88', .7);
        return b.done();
    },

    /* ============================ MAP 02 ============================== */
    forest() {
        const b = new LB('forest', 460, 64, { name: 'THE WHISPERING FOREST', sub: 'The Second Seal: the garden devoured its keepers', region: 'forest', theme: THEMES.forest, bg: 'forest', next: 'desert', spawn: { x: 5, y: 34 }, weather: 'motes' });
        b.at(0, 34).flat(22).upS(2).flat(10).downS(3).flat(8);
        b.beacon(8, 34); b.obj('npc', 16, 34, { id: 'lys' });
        b.deco('tree', 4, 34).deco('fern', 12, 34).deco('tree', 22, 32).deco('fern', 30, 32).deco('shroom', 34, 32).deco('ruinArch', 42, 35);
        b.say(20, 32, 'MIRAE', 'Verdance Reserve. We seeded this with catalyst run-off. It was meant to take two hundred years.', 220);
        b.es([['thornling', 30, 30], ['thornling', 38, 30], ['mothling', 34, 26]]);
        b.obj('lore', 26, 32, { id: 'forest1' });
        // River with current: fall in and you drift back.
        const rv = b.cx;
        b.gap(18, 'water', { dy: 3, flow: -1.1 }); b.plat(rv + 3, 34, 3).plat(rv + 8, 33, 3).plat(rv + 13, 34, 3);
        b.deco('waterfall', rv + 9, 12, { h: 26 });
        b.flat(14).up(3).flat(8);
        b.es([['stalker', b.cx - 16, 30], ['spitter', b.cx - 6, 30]]);
        // Great tree: climb the trunk by branches and bounce caps.
        const gt = b.cx + 3;
        b.flat(30);
        b.fill(gt + 6, 2, gt + 13, b.cy - 5); b.deco('roots', gt + 9, b.cy);
        b.clear(gt + 6, b.cy - 4, gt + 13, b.cy - 1, 1);
        b.haz('bounce', gt - 1, b.cy - .5, 2, .5, { force: 19 }); b.deco('capShroom', gt, b.cy);
        // Branch ladder up the west side into a hollow near the crown.
        for (let r = b.cy - 5, i = 0; r >= 12; r -= 5, i++) b.plat(gt + (i % 2 ? 1 : -2), r, 5);
        b.plat(gt + 14, b.cy - 8, 5).plat(gt + 14, b.cy - 14, 5);
        b.clear(gt + 7, 7, gt + 12, 11, 1); b.clear(gt + 6, 8, gt + 6, 11, 1);
        b.es([['mothling', gt + 18, b.cy - 12], ['spitter', gt - 1, b.cy - 12], ['spitter', gt + 16, b.cy - 16]]);
        b.obj('chest', gt + 10, 12, { id: 'forest_c1', relic: 'seedling' });
        b.obj('lore', gt + 8, 12, { id: 'forest2' });
        b.light(gt + 9, 9, 120, '#7fffb0', .8, 1);
        b.es([['stalker', gt + 22, b.cy - 2]]);
        b.beacon(gt + 24, b.cy);
        b.flat(6).downS(2).flat(10);
        // Poison hollow.
        const ph = b.cx;
        b.gap(16, 'poison', { dy: 2 }); b.plat(ph + 2, b.cy + 0, 3).plat(ph + 7, b.cy - 1, 3).plat(ph + 12, b.cy, 3);
        b.flat(10);
        b.es([['spitter', ph + 8, b.cy - 4], ['thornling', ph + 20, b.cy - 2], ['hulk', ph + 24, b.cy - 2]]);
        b.flat(12).say(ph + 18, b.cy, 'VESPER', 'Root Gate ahead. The old wardens sealed it with three rune stones. Wake all three.', 200);
        // Rune puzzle: three stones, one down in the undercroft.
        const rg = b.cx; const gy = b.cy;
        b.flat(26);
        b.gate(rg + 22, gy - 10, 10, 'rootgate', { open: false, skin: 'rootgate' });
        b.fill(rg + 21, 0, rg + 23, gy - 11);
        b.obj('rune', rg + 4, gy, { id: 'r1', group: 'runes', need: 3, gate: 'rootgate' });
        b.plat(rg + 12, gy - 5, 5).plat(rg + 15, gy - 9, 4);
        b.obj('rune', rg + 16, gy - 9, { id: 'r2', group: 'runes', need: 3, gate: 'rootgate' });
        b.clear(rg + 8, gy, rg + 10, gy + 2, 2);
        b.clear(rg + 2, gy + 3, rg + 20, gy + 9, 2); b.fill(rg + 2, gy + 10, rg + 20, 63);
        b.haz('thorns', rg + 11, gy + 9.4, 3, .6);
        b.plat(rg + 11, gy + 6, 3);
        b.obj('rune', rg + 18, gy + 10, { id: 'r3', group: 'runes', need: 3, gate: 'rootgate' });
        b.obj('chest', rg + 4, gy + 10, { id: 'forest_c2', cells: 90 });
        b.es([['thornling', rg + 16, gy + 7], ['stalker', rg + 6, gy + 7]]);
        b.light(rg + 10, gy + 7, 200, '#7fffb0', .8, 1); b.deco('glowshroom', rg + 6, gy + 10).deco('glowshroom', rg + 15, gy + 10);
        b.plat(rg + 7, gy + 7, 4);
        b.at(rg + 24, gy).flat(14).beacon(rg + 30, gy);
        b.ambush(rg + 40, rg + 86, gy, [[['thornling', rg + 48], ['stalker', rg + 76], ['mothling', rg + 60, gy - 10]], [['hulk', rg + 62], ['spitter', rg + 48], ['spitter', rg + 78]], [['grove', rg + 62]]], 'grove', 9);
        b.flat(52);
        b.deco('ruinArch', rg + 50, gy).deco('tree', rg + 56, gy).deco('tree', rg + 72, gy).deco('fern', rg + 66, gy);
        b.flat(18).beacon(b.cx - 8, gy);
        b.obj('lore', b.cx - 13, gy, { id: 'forest3' });
        // Boss: Sylvaris fills the east end of her hollow.
        const ar = b.cx;
        b.flat(70); b.fill(ar + 66, 0, ar + 69, 63);
        b.fill(ar - 1, 0, ar + 2, gy - 15);
        b.gate(ar + 2, gy - 14, 14, 'arena_l');
        b.bossArena('sylvaris', ar + 3, ar + 66, gy, ar + 56, gy, { trigger: ar + 7 });
        b.obj('exit', ar + 40, gy, { hidden: true });
        for (let i = 0; i < 4; i++) b.deco('glowshroom', ar + 12 + i * 11, gy);
        b.light(ar + 20, gy - 8, 300, '#7fffb0', .6, 1).light(ar + 46, gy - 12, 320, '#a0ffda', .7, 1);
        return b.done();
    },

    /* ============================ MAP 03 ============================== */
    desert() {
        const b = new LB('desert', 500, 66, { name: 'THE SCORCHED WASTELAND', sub: 'The Third Seal: the sea was turned to dust', region: 'desert', theme: THEMES.desert, bg: 'desert', next: 'ice', spawn: { x: 5, y: 34 }, weather: 'sand', stormCycle: { period: 1500, on: 480, force: 1.7 } });
        b.at(0, 34).flat(20).upS(3).flat(5).downS(4).flat(6);
        b.beacon(9, 34); b.obj('npc', 15, 34, { id: 'tamsin' }); b.deco('tent', 6, 34).deco('tent', 19, 34);
        b.say(22, 33, 'VESPER', 'Storm fronts cross this basin in cycles. When the wind rises, get behind stone or it will drag you.', 230);
        b.trig(26, 20, 2, 14, () => G.tutorial('storm'));
        b.deco('ribcage', 30, 31).es([['scuttler', 30, 29], ['scuttler', 36, 30], ['raider', 40, 30]]);
        b.obj('lore', 34, 31, { id: 'desert1' });
        b.upS(4).flat(8);
        b.deco('pillarS', b.cx - 6, b.cy); b.haz('shelter', b.cx - 8, b.cy - 6, 5, 6);
        b.downS(5);
        const q1 = b.cx;
        b.gap(14, 'quicksand', { dy: 1 }); b.fill(q1, b.cy + 3, q1 + 13, 65);
        b.plat(q1 + 4, b.cy - 1, 3).plat(q1 + 9, b.cy - 1, 3);
        b.flat(12).upS(5).flat(10);
        b.deco('pillarS', b.cx - 4, b.cy); b.haz('shelter', b.cx - 7, b.cy - 6, 5, 6);
        b.es([['raider', b.cx - 6, b.cy - 4], ['burrower', b.cx - 22, b.cy + 4], ['scarab', b.cx - 16, b.cy - 12]]);
        b.beacon(b.cx - 11, b.cy);
        b.downS(6).flat(14);
        b.es([['burrower', b.cx - 6, b.cy - 2], ['scuttler', b.cx - 12, b.cy - 2]]);
        b.deco('settlement', b.cx - 10, b.cy);
        // Sand-swallowed temple: the only way east is down through its halls.
        const tx = b.cx, ty = b.cy;
        b.flat(8).upS(2);
        b.fill(tx + 12, ty - 12, tx + 13, ty + 3);
        b.deco('templeFront', tx + 8, ty - 2);
        b.clear(tx + 3, ty, tx + 7, ty + 4, 3);
        for (let c = tx + 12; c < tx + 90; c++) b.col(c, b.cy);
        const hallY = ty + 14;
        b.clear(tx + 3, ty + 4, tx + 86, hallY - 1, 3);
        b.fill(tx + 3, hallY, tx + 86, 65);
        b.plat(tx + 5, ty + 8, 4).plat(tx + 2, ty + 11, 2);
        b.es([['scuttler', tx + 18, hallY - 2], ['obelisk', tx + 30, hallY - 2], ['raider', tx + 40, hallY - 2]]);
        b.say(tx + 6, hallY, 'YSOLDE', 'A temple on the seabed. Whoever built this was here before the water was.');
        b.obj('lore', tx + 22, hallY, { id: 'desert2' });
        b.beacon(tx + 12, hallY);
        for (let i = 0; i < 5; i++) b.deco('columnT', tx + 16 + i * 14, hallY);
        b.light(tx + 12, hallY - 5, 170, '#33ddff', .7, 1).light(tx + 36, hallY - 5, 170, '#33ddff', .7, 1).light(tx + 62, hallY - 5, 170, '#33ddff', .7, 1);
        // Pressure plates: both side halls must be triggered to open the sun door.
        b.gate(tx + 70, hallY - 10, 10, 'sundoor', { open: false, skin: 'sundoor' });
        b.obj('lever', tx + 34, hallY, { id: 'sun1', group: 'sun', need: 2, gate: 'sundoor', skin: 'plate' });
        b.clear(tx + 44, hallY, tx + 47, hallY + 8, 3); b.clear(tx + 44, hallY + 6, tx + 62, hallY + 10, 3); b.fill(tx + 44, hallY + 11, tx + 62, 65);
        b.obj('lever', tx + 60, hallY + 11, { id: 'sun2', group: 'sun', need: 2, gate: 'sundoor', skin: 'plate' });
        b.obj('chest', tx + 54, hallY + 11, { id: 'desert_c1', relic: 'sunplate' });
        b.haz('spikes', tx + 50, hallY + 10.4, 2, .6); b.plat(tx + 50, hallY + 8, 2);
        b.plat(tx + 45, hallY + 3, 2);
        b.es([['obelisk', tx + 56, hallY + 9], ['scarab', tx + 52, hallY + 7], ['scuttler', tx + 62, hallY - 2], ['raider', tx + 66, hallY - 2]]);
        // Exit shaft back up to the surface.
        const up = tx + 72;
        b.clear(up, ty - 2, up + 13, hallY - 1, 3);
        for (let i = 0; i < 4; i++) b.plat(up + (i % 2 ? 7 : 1), hallY - 4 - i * 4, 5);
        b.plat(up + 3, ty - 2, 8);
        b.at(tx + 90, b.cy).flat(14);
        for (let c = tx + 84; c < tx + 90; c++) b.fill(c, b.cy, c, b.cy);
        b.beacon(tx + 96, b.cy);
        b.say(tx + 92, b.cy, 'SABLE', 'Great. More sand. I was starting to miss it.');
        b.ambush(tx + 106, tx + 152, b.cy, [[['raider', tx + 112], ['raider', tx + 146], ['scuttler', tx + 130], ['scuttler', tx + 122]], [['burrower', tx + 128], ['scarab', tx + 116, b.cy - 10], ['scarab', tx + 140, b.cy - 10]], [['warlord', tx + 130]]], 'warlord', 8);
        b.flat(50);
        b.deco('tent', tx + 118, b.cy).deco('tent', tx + 140, b.cy).deco('banner', tx + 128, b.cy);
        b.flat(16).beacon(b.cx - 6, b.cy); b.obj('lore', b.cx - 12, b.cy, { id: 'desert3' });
        // Basin arena.
        const ar = b.cx, y = b.cy;
        b.flat(72); b.fill(ar + 66, 0, ar + 71, 65);
        b.fill(ar - 1, 0, ar + 2, y - 15);
        b.gate(ar + 2, y - 14, 14, 'arena_l');
        b.bossArena('qareth', ar + 3, ar + 66, y, ar + 36, y + 6, { trigger: ar + 7 });
        b.obj('exit', ar + 35, y, { hidden: true });
        [14, 34, 54].forEach(o => { b.deco('pillarS', ar + o, y); b.haz('shelter', ar + o - 4, y - 6, 3.5, 6); b.fill(ar + o, y - 5, ar + o, y - 1); });
        return b.done();
    },

    /* ============================ MAP 04 ============================== */
    ice() {
        const b = new LB('ice', 470, 80, { name: 'THE FROZEN ABYSS', sub: 'The Fourth Seal: the deep froze with the damned inside it', region: 'ice', theme: THEMES.ice, bg: 'ice', next: 'volcano1', spawn: { x: 5, y: 60 }, weather: 'snow', stormCycle: { period: 1400, on: 420, force: 1.2, whiteout: true } });
        b.at(0, 60).flat(20);
        b.beacon(8, 60); b.obj('npc', 15, 60, { id: 'orsk' }); b.deco('tent', 5, 60).deco('iceSpire', 18, 60);
        b.haz('slip', 20, 40, 60, 21);
        b.say(21, 60, 'VESPER', 'Surface ice is slick. Mind your footing and do not stop moving during a whiteout.', 200);
        b.flat(10).up(4).flat(8).up(4).flat(10);
        b.es([['wolf', 28, 56], ['wolf', 36, 50], ['wisp', 40, 44]]);
        b.obj('lore', 38, 52, { id: 'ice1' });
        // Frozen lake: thin plates over black water.
        const lk = b.cx;
        b.gap(30, 'water', { dy: 4 });
        for (let i = 0; i < 6; i++) b.crumble(lk + 1 + i * 5, b.cy + (i % 2), 4, { delay: 46, skin: 'ice' });
        b.deco('iceSpire', lk + 15, b.cy + 4);
        b.flat(8).up(3).flat(6);
        b.es([['thrall', b.cx - 10, b.cy - 4], ['thrall', b.cx - 5, b.cy - 2]]);
        b.beacon(b.cx - 4, b.cy);
        // Vertical cliff climb with icicle hazards.
        const cl = b.cx, cy = b.cy;
        b.flat(4); b.fill(cl + 4, cy - 34, cl + 5, cy - 1); b.step(-34);
        b.at(cl + 4, cy - 34);
        const ledges = [[cl - 8, cy - 6, 6], [cl - 1, cy - 11, 5], [cl - 10, cy - 15, 6], [cl - 2, cy - 20, 6], [cl - 9, cy - 25, 5], [cl - 1, cy - 30, 5]];
        ledges.forEach(l => b.plat(l[0], l[1], l[2]));
        b.fill(cl - 14, cy - 34, cl - 13, cy - 7);
        b.es([['wisp', cl - 5, cy - 16], ['thrall', cl + 1, cy - 22], ['wolf', cl - 7, cy - 17]]);
        b.haz('slip', cl - 12, cy - 34, 16, 32);
        b.obj('chest', cl - 10, cy - 15, { id: 'ice_c1', cells: 110 });
        // High ridge to the station.
        b.at(cl + 6, cy - 34).flat(30).down(3).flat(16);
        b.deco('radioMast', b.cx - 28, cy - 34).deco('iceSpire', b.cx - 20, cy - 31);
        b.es([['wolf', b.cx - 34, cy - 37], ['shellback', b.cx - 22, cy - 34], ['wisp', b.cx - 14, cy - 40]]);
        b.beacon(b.cx - 6, b.cy);
        b.say(b.cx - 30, b.cy, 'MIRAE', 'Nadir Station. I spent three winters here. The lights should not still be on.');
        // Research facility: two generators open the lower lab door.
        const rx = b.cx, ry = b.cy;
        b.flat(92);
        b.fill(rx + 2, ry - 16, rx + 90, ry + 18); b.clear(rx + 3, ry - 15, rx + 88, ry - 1, 4); b.clear(rx + 2, ry - 6, rx + 2, ry - 1, 4);
        b.clear(rx + 3, ry, rx + 88, ry + 17, 4); b.fill(rx + 2, ry + 18, rx + 90, 79);
        for (let f = 0; f < 2; f++) { const y = ry + f * 9; for (let x = rx + 3; x <= rx + 88; x++) if ((f === 0 && !(x >= rx + 76 && x <= rx + 81)) || (f === 1 && !(x >= rx + 8 && x <= rx + 13))) b.set(x, y, T.S); }
        b.fill(rx + 3, ry - 16, rx + 88, ry - 16);
        for (let i = 0; i < 4; i++) b.deco('labRack', rx + 10 + i * 18, ry);
        b.light(rx + 14, ry - 8, 180, '#a0e0ff', .8, 1).light(rx + 44, ry - 8, 180, '#a0e0ff', .8, 1).light(rx + 70, ry - 8, 180, '#a0e0ff', .8, 1).light(rx + 30, ry + 5, 170, '#ff8080', .6, 1).light(rx + 66, ry + 5, 170, '#ff8080', .6, 1).light(rx + 40, ry + 14, 200, '#7fd8ff', .8, 1);
        b.es([['thrall', rx + 20, ry - 2], ['thrall', rx + 42, ry - 2], ['wisp', rx + 58, ry - 6], ['shellback', rx + 68, ry - 2]]);
        b.obj('lore', rx + 26, ry, { id: 'ice2' });
        b.obj('lever', rx + 86, ry, { id: 'gen1', group: 'gens', need: 2, gate: 'labdoor', skin: 'generator' });
        // Mid floor: drop at the east hole, travel west.
        b.plat(rx + 76, ry + 4, 6);
        b.es([['thrall', rx + 62, ry + 7], ['wolf', rx + 48, ry + 7], ['shellback', rx + 30, ry + 7], ['wisp', rx + 40, ry + 4]]);
        b.obj('lever', rx + 4, ry + 9, { id: 'gen2', group: 'gens', need: 2, gate: 'labdoor', skin: 'generator' });
        b.obj('lore', rx + 20, ry + 9, { id: 'ice3' });
        // Lower floor: the cryo vault.
        b.plat(rx + 9, ry + 13, 4);
        b.gate(rx + 40, ry + 10, 8, 'labdoor', { open: false, skin: 'labdoor' });
        b.obj('chest', rx + 30, ry + 18, { id: 'ice_c2', relic: 'coldcell' });
        b.obj('cryo', rx + 60, ry + 18, { gate: 'vaultgate' });
        b.gate(rx + 83, ry + 9, 9, 'vaultgate', { open: false, skin: 'labdoor' });
        b.beacon(rx + 46, ry + 18);
        b.es([['rimeg', rx + 74, ry + 16]]);
        b.say(rx + 42, ry + 18, 'VESPER', '...Do not open that chamber. There is nothing in it of value. Proceed to the lake.', 180);
        // Service shaft exits east onto the lake shelf.
        b.clear(rx + 84, ry + 10, rx + 92, ry + 17, 4);
        b.at(rx + 92, ry + 18);
        const ar = rx + 96, y = ry + 18;
        b.fill(rx + 91, ry - 20, rx + 91, ry + 9);
        b.at(rx + 92, y).flat(4);
        for (let c = rx + 92; c < rx + 94; c++) b.fill(c, ry, c, y - 9);
        // Lake arena: plates on black water, boss rising from the centre.
        const W = 62;
        b.fill(ar, y + 6, ar + W + 8, 79); b.haz('water', ar + 4, y + 5, W, 1.2);
        b.fill(ar, y, ar + 3, 79); b.fill(ar + W + 4, y, ar + W + 8, 79); b.fill(ar + W + 4, 0, ar + W + 8, y - 1);
        for (let i = 0; i < W; i += 2) b.crumble(ar + 4 + i, y, 2, { scripted: true, respawn: 400, skin: 'ice', tag: 'plate', delay: 20 });
        b.fill(ar - 1, 0, ar + 1, y - 15);
        b.gate(ar + 1, y - 14, 14, 'arena_l');
        b.bossArena('nadir', ar + 2, ar + W + 4, y, ar + 34, y, { trigger: ar + 7 });
        b.obj('exit', ar + 34, y, { hidden: true });
        return b.done();
    },

    /* ======================== MAP 05: THE VOLCANIC CORE ==================== */
    volcano1() {
        const b = new LB('volcano1', 520, 80, { name: 'THE VOLCANIC CORE', sub: 'The Fifth Seal, I: the road of ash', region: 'volcano', theme: THEMES.volcano, bg: 'volcano', next: 'volcano2', spawn: { x: 5, y: 62 }, weather: 'embers', rockfall: { every: 170 }, heat: true });
        const lava = (o = {}) => o;
        b.at(0, 62).flat(26);
        b.beacon(9, 62); b.obj('npc', 18, 62, { id: 'cantor' }); b.deco('lavaRock', 4, 62).deco('ruinPillarV', 14, 62).deco('ruinPillarV', 23, 62);
        b.say(24, 62, 'VESPER', 'Kalder Massif. The bore is at the summit. Every path up has moved since the charts were drawn.', 200);
        b.trig(25, 50, 2, 13, () => G.tutorial('lava'));
        // First lava river, crossed by a collapsing causeway.
        const r1 = b.cx;
        b.gap(30, 'lava', { dy: 3 }); b.crumble(r1 + 1, 62, 6, { delay: 30, skin: 'basalt' }); b.crumble(r1 + 9, 61, 6, { delay: 30, skin: 'basalt' }); b.crumble(r1 + 17, 60, 6, { delay: 30, skin: 'basalt' }); b.crumble(r1 + 25, 60, 5, { delay: 30, skin: 'basalt' });
        b.deco('lavafall', r1 + 12, 34, { h: 30 }); b.light(r1 + 15, 60, 360, '#ff5a10', 1, 1);
        b.step(-2).flat(12).up(4).flat(12);
        b.es([['slug', b.cx - 22, b.cy], ['ashman', b.cx - 12, b.cy - 2], ['imp', b.cx - 8, b.cy - 10]]);
        b.haz('geyser', b.cx - 18, b.cy - 8, 2, 8, { period: 180, on: 50 });
        b.beacon(b.cx - 4, b.cy);
        b.obj('lore', b.cx - 8, b.cy, { id: 'vol1' });
        // Moving rock shelves over a chasm.
        const ch = b.cx, cy = b.cy;
        b.gap(40, 'lava', { dy: 8 });
        b.mover(ch + 2, cy - 1, 4, ch + 12, cy - 1, 340, { skin: 'basalt' });
        b.mover(ch + 16, cy - 2, 4, ch + 16, cy - 8, 260, { skin: 'basalt' });
        b.mover(ch + 22, cy - 8, 4, ch + 33, cy - 8, 320, { skin: 'basalt', phase: 80 });
        b.es([['imp', ch + 12, cy - 12], ['imp', ch + 26, cy - 15]]);
        b.step(-8).flat(14).up(5).flat(10);
        b.deco('bridgeRuin', b.cx - 10, b.cy);
        b.es([['ashman', b.cx - 22, b.cy + 2], ['lavag', b.cx - 8, b.cy - 2], ['cantor', b.cx - 3, b.cy - 2]]);
        b.say(b.cx - 26, b.cy, 'ROOK', 'That hum in the rock. That is the bore. Thirty years and it never stopped drilling.');
        // Collapsed bridge with crumbling span and a hidden chamber below.
        const br = b.cx, by = b.cy;
        b.gap(34, 'lava', { dy: 12 });
        b.crumble(br + 1, by, 8, { delay: 24, skin: 'bridge' }); b.crumble(br + 12, by, 10, { delay: 24, skin: 'bridge' }); b.crumble(br + 25, by, 8, { delay: 24, skin: 'bridge' });
        b.plat(br + 5, by + 7, 4).plat(br + 12, by + 8, 3).deco('bridgePier', br + 10, by + 12).deco('bridgePier', br + 23, by + 12);
        b.fill(br + 15, by + 4, br + 28, by + 11); b.clear(br + 15, by + 5, br + 27, by + 10, 5);
        b.breakable(br + 15, by + 5, 3, 6, 'volhidden1');
        b.obj('chest', br + 25, by + 11, { id: 'vol_c1', relic: 'pilot' }); b.obj('lore', br + 21, by + 11, { id: 'vol2' }); b.light(br + 22, by + 8, 150, '#ffcc66', .8, 1);
        b.fill(br + 19, by + 11, br + 27, by + 11, T.E); b.fill(br + 15, by + 11, br + 28, by + 12);
        b.flat(10).up(6).flat(8);
        b.beacon(b.cx - 6, b.cy);
        // Eruption gate: an event blasts open the only way forward.
        const eg = b.cx, ey = b.cy;
        b.flat(30);
        b.fill(eg + 22, ey - 12, eg + 23, ey - 7); b.fill(eg + 20, 0, eg + 25, ey - 13);
        b.breakable(eg + 22, ey - 6, 2, 6, 'erupt', { hp: 999, skin: 'magmaWall' });
        b.obj('lever', eg + 18, ey, { id: 'valve1', skin: 'valve', script: 'eruptGate' });
        b.es([['slug', eg + 8, ey - 2], ['ashman', eg + 13, ey - 2]]);
        b.say(eg + 4, ey, 'VESPER', 'Pressure valve ahead. Open it and get back. This mountain is going to do the rest.', 190);
        b.at(eg + 30, ey).up(4).flat(14).upS(3).flat(14);
        b.es([['imp', b.cx - 28, b.cy - 8], ['obsidian', b.cx - 14, b.cy - 2], ['ashman', b.cx - 8, b.cy - 2], ['ashman', b.cx - 22, b.cy]]);
        b.haz('steam', b.cx - 34, b.cy - 6, 3, 6, { period: 160, on: 60 });
        b.beacon(b.cx - 3, b.cy);
        // Timed lava run: bridges fall behind the player while the eruption chases.
        const run = b.cx, ry = b.cy;
        b.trig(run + 1, ry - 12, 2, 13, () => G.runScript(lavaRunScript(run, ry)));
        b.gap(46, 'lava', { dy: 8 });
        for (let i = 0; i < 7; i++) b.crumble(run + 1 + i * 6.5 | 0, ry - (i % 3), 5, { delay: 28, skin: 'basalt' });
        b.step(-1).flat(10).up(6).flat(30);
        b.ambush(b.cx - 28, b.cx + 18, b.cy, [[['ashman', b.cx - 20], ['ashman', b.cx + 8], ['imp', b.cx - 8, b.cy - 10]], [['lavag', b.cx - 6], ['cantor', b.cx + 10], ['slug', b.cx - 18]], [['forge', b.cx - 4]]], 'ascent', 8);
        b.flat(30);
        const dx = b.cx;
        b.flat(10);
        b.deco('forgeDoor', dx + 2, b.cy);
        b.obj('exit', dx + 2, b.cy, { label: 'Enter the Forge' });
        b.fill(dx + 9, 0, dx + 9, 79);
        return b.done();
    },
    volcano2() {
        const b = new LB('volcano2', 360, 110, { name: 'THE VOLCANIC CORE', sub: 'The Fifth Seal, II: the flaming gate', region: 'volcano', theme: THEMES.volcano, bg: 'forge', next: 'volcano3', spawn: { x: 5, y: 30 }, weather: 'embers', heat: true, indoors: true });
        // Whole map is a cavern carved from solid rock.
        b.fill(0, 0, 359, 109); b.clear(0, 12, 60, 29, 5); b.fill(0, 30, 62, 34);
        b.beacon(8, 30); b.obj('npc', 16, 30, { id: 'smith' });
        for (let i = 0; i < 4; i++) { b.deco('furnace', 22 + i * 10, 30); b.light(22 + i * 10, 26, 180, '#ff8a20', .9, 1); }
        b.say(18, 30, 'YSOLDE', 'The Meridian built this to feed the bore. Those furnaces should have burned out decades ago.');
        b.es([['ashman', 34, 28], ['cantor', 46, 28], ['slug', 54, 28]]);
        // Descent shaft: staggered lifts.
        const sx = 58;
        b.clear(sx, 12, sx + 28, 72, 5); b.fill(sx + 29, 12, sx + 29, 60);
        b.haz('lava', sx + 1, 70, 27, 2.1); b.fill(sx, 72, sx + 29, 109);
        b.mover(sx + 3, 32, 5, sx + 3, 42, 280, { skin: 'metal' });
        b.mover(sx + 12, 40, 5, sx + 12, 52, 300, { skin: 'metal', phase: 90 });
        b.mover(sx + 21, 50, 5, sx + 21, 62, 280, { skin: 'metal', phase: 40 });
        b.es([['imp', sx + 10, 36], ['imp', sx + 20, 44]]);
        // Ledge to west side hidden room.
        b.plat(sx - 1, 46, 2); b.clear(sx - 12, 41, sx - 1, 46, 5); b.fill(sx - 12, 47, sx, 48);
        b.breakable(sx - 1, 41, 1, 6, 'forgehidden'); b.obj('chest', sx - 8, 47, { id: 'vol_c2', cells: 160 }); b.obj('lore', sx - 5, 47, { id: 'vol3' });
        b.plat(sx - 1, 47, 2);
        // Valve hall with three stages of draining lava.
        const hx = sx + 29, hy = 62;
        b.clear(hx, 50, hx + 100, hy - 1, 5); b.fill(hx, hy, hx + 100, 109);
        b.beacon(hx + 6, hy);
        b.gate(hx + 92, hy - 12, 12, 'vdoor', { open: false, skin: 'sundoor' });
        b.fill(hx + 91, 44, hx + 93, 49);
        b.clear(hx + 20, hy, hx + 74, hy + 8, 5); b.fill(hx + 20, hy + 9, hx + 74, 109);
        b.d.hazards.push({ kind: 'lava', x: (hx + 20) * TILE, y: (hy + 1) * TILE, w: 55 * TILE, h: 8 * TILE, id: 'hallLava', drainable: true });
        for (let i = 0; i < 5; i++) b.plat(hx + 22 + i * 11, hy, 5);
        b.mover(hx + 27, hy - 2, 4, hx + 27, hy - 2, 300, { skin: 'metal' });
        b.es([['ashman', hx + 24, hy - 2], ['obsidian', hx + 48, hy - 2], ['imp', hx + 40, hy - 10], ['cantor', hx + 66, hy - 2], ['lavag', hx + 80, hy - 2]]);
        b.obj('lever', hx + 16, hy, { id: 'v1', group: 'valves', need: 3, gate: 'vdoor', skin: 'valve', drains: .34 });
        b.plat(hx + 44, hy - 5, 5); b.obj('lever', hx + 46, hy - 5, { id: 'v2', group: 'valves', need: 3, gate: 'vdoor', skin: 'valve', drains: .34 });
        b.obj('lever', hx + 84, hy, { id: 'v3', group: 'valves', need: 3, gate: 'vdoor', skin: 'valve', drains: .34 });
        b.say(hx + 12, hy, 'MIRAE', 'Three valves feed that door. Each one drains a little of the hall, so watch your step.', 200);
        for (let i = 0; i < 3; i++) b.light(hx + 30 + i * 18, hy + 2, 300, '#ff5a10', 1, 1);
        b.obj('lore', hx + 70, hy - 0, { id: 'vol4' }); b.plat(hx + 66, hy, 9);
        // Crusher corridor, timing puzzle.
        const cx = hx + 94;
        b.clear(cx, 50, cx + 58, hy - 1, 5); b.fill(cx, hy, cx + 58, 109);
        for (let i = 0; i < 4; i++) { const px = cx + 8 + i * 11; b.d.dynDefs.push({ kind: 'mover', x: px * TILE, y: 50 * TILE, w: 3 * TILE, h: 5 * TILE, tx: px * TILE, ty: 56.5 * TILE, period: 200, phase: i * 50, skin: 'crusher', noStep: true, crush: true }); }
        b.beacon(cx + 4, hy);
        b.es([['ashman', cx + 52, hy - 2]]);
        // Arena
        const ar = cx + 56;
        b.clear(ar, 34, ar + 68, hy - 1, 5); b.fill(ar + 69, 30, ar + 72, 109);
        b.gate(ar + 2, hy - 12, 12, 'arena_l');
        b.fill(ar + 1, 34, ar + 3, hy - 13);
        b.bossArena('vulkaris', ar + 4, ar + 68, hy, ar + 50, hy, { trigger: ar + 8, risingLava: true });
        [[12, hy - 6, 6], [28, hy - 9, 6], [44, hy - 6, 6], [56, hy - 11, 6], [20, hy - 14, 5], [38, hy - 16, 6]].forEach(p => b.plat(ar + p[0], p[1], p[2]));
        for (let i = 0; i < 4; i++) { b.deco('furnace', ar + 10 + i * 16, hy); b.light(ar + 10 + i * 16, hy - 5, 220, '#ff8a20', .9, 1); }
        b.obj('exit', ar + 60, hy, { hidden: true });
        return b.done();
    },
    volcano3() {
        const b = new LB('volcano3', 260, 150, { name: 'THE VOLCANIC CORE', sub: 'The Fifth Seal, III: the Lake of Fire', region: 'volcano', theme: THEMES.core, bg: 'core', spawn: { x: 6, y: 30 }, weather: 'embers', heat: true, indoors: true, finale: true });
        b.fill(0, 0, 259, 149);
        // Bore lip
        b.clear(0, 10, 44, 29, 6); b.fill(0, 30, 44, 36);
        b.beacon(8, 30); b.deco('boreRig', 22, 30); b.obj('lore', 16, 30, { id: 'vol5' });
        b.say(6, 30, 'VESPER', 'You are at the Bore. Descend. All three shards. Hurry now. Hurry.', 170);
        // The Bore: a long vertical descent on rings.
        const sx = 40;
        b.clear(sx, 10, sx + 40, 118, 6);
        for (let i = 0; i < 9; i++) { const y = 36 + i * 9, left = i % 2 === 0; b.plat(left ? sx + 2 : sx + 28, y, 10); if (i % 3 === 2) b.mover(left ? sx + 14 : sx + 18, y, 7, left ? sx + 22 : sx + 10, y + 3, 260, { skin: 'metal', phase: i * 40 }); }
        b.fill(sx, 118, sx + 40, 149); b.es([['imp', sx + 14, 44], ['forge', sx + 32, 52], ['imp', sx + 24, 62], ['obsidian', sx + 8, 62], ['cantor', sx + 30, 70], ['lavag', sx + 6, 80], ['imp', sx + 18, 92]]);
        b.beacon(sx + 6, 118);
        b.say(sx + 10, 118, 'ZERO', 'That voice. I know what VESPER is now.', 170);
        // Trinity door
        const dx = sx + 40;
        b.clear(dx, 100, dx + 50, 117, 6); b.fill(dx, 118, dx + 50, 149);
        b.gate(dx + 36, 106, 12, 'trinity', { open: false, skin: 'trinity' });
        b.obj('door', dx + 34, 118, { need: 'shards', gate: 'trinity' });
        b.obj('lore', dx + 14, 118, { id: 'vol6' });
        b.deco('boreRig', dx + 6, 118);
        b.beacon(dx + 28, 118);
        // Final arena: the Core. Stone edges, plated centre over open lava.
        const ar = dx + 44, y = 118, W = 74;
        b.clear(ar, 46, ar + W, y - 1, 0); b.fill(ar + W + 1, 40, ar + W + 4, 149); // open back: the sky itself changes with each phase
        b.fill(ar - 1, 44, ar + 1, 105);
        b.clear(ar + 12, y, ar + W - 12, y + 6, 6); b.fill(ar + 12, y + 7, ar + W - 12, 149);
        b.haz('lava', ar + 12, y + 3, W - 23, 4.2, { coreLava: true });
        for (let i = 0; i < W - 24; i += 3) b.crumble(ar + 12 + i, y, 3, { scripted: true, respawn: 0, skin: 'plate', tag: 'coreplate', delay: 18 });
        for (let i = 0; i < 4; i++) { const px = ar + 18 + i * 13; b.mover(px, y - 2 - (i % 2) * 3, 6, px, y - 9 - (i % 2) * 3, 300, { skin: 'metal', phase: i * 60, tag: 'corelift', active: false, ghosted: true }); }
        b.gate(ar + 1, y - 12, 12, 'arena_l');
        b.bossArena('endbringer', ar + 2, ar + W, y, ar + 56, y - 7, { trigger: ar + 6 });
        return b.done();
    }
};

/** Lava chases the player across a collapsing span; scripted rocks keep the pressure on. */
function* lavaRunScript(x, y) {
    if (G.flags.lavarun) return; G.flags.lavarun = true;
    G.toast('ERUPTION! RUN!', '#ff5500'); Sound.sfx('bigboom'); G.addShake(16); Music.setState('elite');
    G.eruption = 1;
    const dyn = G.level.dyn.filter(d => d.kind === 'crumble' && d.x >= x * TILE && d.x < (x + 50) * TILE).sort((a, b) => a.x - b.x);
    let i = 0;
    for (let t = 0; t < 520; t++) {
        if (t > 90 && t % 7 === 0 && i < dyn.length) { const d = dyn[i++]; if (Math.abs(d.x - G.player.x) > 80 || d.x < G.player.x) d.trigger(true); }
        if (t % 46 === 0) { const px = G.player.x + U.rand(80, 360), s = G.level.surfaceBelow(px, y * TILE - 200, 500); if (s !== null) Combat.warn({ shape: 'rect', x: px - 30, y: s - 70, w: 60, h: 70, t: 42, dmg: 22 * Game.diff.enemyDmg, onFire: w => { Sound.at('slam', px, { v: .5 }); VFX.debris(px, s, 50, '#3a2a26'); } }); }
        if (G.player.x > (x + 48) * TILE) break;
        yield 1;
    }
    G.eruption = 0; Music.setState('calm'); dyn.forEach(d => { d.respawn = 120; });
}

const LEVEL_ORDER = ['city', 'forest', 'desert', 'ice', 'volcano1', 'volcano2', 'volcano3'];
const REGIONS = [
    { id: 'city', level: 'city', name: 'THE FALLEN CITY', desc: 'Halcyon. Thirty years of dust over the capital of the Meridian Accord.', col: '#ffdd33', boss: 'ATLAS-9' },
    { id: 'forest', level: 'forest', name: 'THE WHISPERING FOREST', desc: 'A terraforming test that outran its makers by two centuries.', col: '#7fffb0', boss: 'SYLVARIS' },
    { id: 'desert', level: 'desert', name: 'THE SCORCHED WASTELAND', desc: 'The bed of the Sael Sea, drained to cool the Bore.', col: '#ffcc55', boss: 'QARETH' },
    { id: 'ice', level: 'ice', name: 'THE FROZEN ABYSS', desc: 'Nadir Station: where Project Zero hid what it could not destroy.', col: '#7fd8ff', boss: 'NADIR' },
    { id: 'volcano', level: 'volcano1', name: 'THE VOLCANIC CORE', desc: 'Kalder Massif. The Bore. The place where the world was opened.', col: '#ff5500', boss: 'THE ENDBRINGER' }
];
