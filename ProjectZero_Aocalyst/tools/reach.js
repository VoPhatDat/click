'use strict';
/**
 * Completability proof. Floods every state reachable by the SLOWEST operator (Rook: no air
 * dash, weakest jump) through the real collision code, opening a gate only after a state
 * reaches all the switches it requires. Writes a PNG of each level with the reachable area.
 * Moving platforms are approximated by static copies at their ends and midpoint.
 */
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { load, ROOT } = require('./harness');
const X = load(), { G, Game, Save, Phys, LEVELS, T, TILE, CHARS, Level, Dyn, Terrain, isSlope } = X;
const only = process.argv[2];

function png(file, w, h, rgb) {
    const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
    const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
    const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
    fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

function floodLevel(id) {
    Save.data = Save.fresh('normal'); Save.data.activeChar = 'rook'; Save.data.shards = { r: true, g: true, b: true };
    Game.loadLevel(id);
    const L = G.level, d = CHARS.rook, speed = d.speed, J = d.jump;
    G.enemies = []; L.trigs = [];
    // Static stand-ins for moving platforms.
    const extra = [];
    L.dyn.filter(m => m.kind === 'mover' && !m.crush).forEach(m => { for (const u of [0, .25, .5, .75, 1]) extra.push(new Dyn({ kind: 'block', oneway: true, x: m.x0 + (m.tx - m.x0) * u, y: m.y0 + (m.ty - m.y0) * u, w: m.w, h: m.h })); });
    L.dyn = L.dyn.filter(m => m.kind !== 'mover' || m.crush).concat(extra);
    L.dyn.forEach(m => { if (m.kind === 'crumble') { m.scripted = true; } });
    L.dyn.forEach(m => { if (m.kind === 'breakable' && m.hp < 100) m.active = false; }); // the player can break these
    const kills = L.hazards.filter(h => ['lava', 'spikes', 'thorns'].includes(h.kind) || (h.kind === 'wire' && false));
    const bounces = L.hazards.filter(h => h.kind === 'bounce');
    const visited = new Set(), reachTiles = new Set();
    const key = s => `${s.x >> 4},${s.y >> 4},${s.jumps},${s.grounded ? '' : Math.round(s.vy / 4)},${Math.sign(s.vx)}`;
    const start = { x: G.player.x, y: G.player.y, vx: 0, vy: 0, jumps: 0, grounded: true, riding: null, w: 24, h: 60, onWall: 0 };
    const queue = [start]; visited.add(key(start));
    const objs = L.objs.filter(o => ['lever', 'rune', 'door', 'cryo', 'chest', 'lore', 'exit', 'beacon', 'npc'].includes(o.kind));
    const seenObj = new Set(); const log = []; let n = 0;
    const openGates = () => {
        let changed = false;
        for (const o of objs) {
            if (!seenObj.has(o) || o.used) continue;
            if (o.kind === 'lever' || o.kind === 'rune') {
                o.used = true; const g = o.group; G.flags[g] = (G.flags[g] || 0) + 1; log.push(`switch ${o.id} at tile ${o.x / TILE | 0}`);
                if (o.script) { L.dyn.filter(m => m.id === 'erupt').forEach(m => { m.active = false; m.dead = true; }); changed = true; }
                if (o.need && G.flags[g] >= o.need) { G.setGates([o.gate], true); L.dyn.forEach(m => { if (m.kind === 'gate' && m.id === o.gate) m.active = false; }); changed = true; }
                if (o.drains) { const h = L.hazards.find(z => z.id === 'hallLava'); if (h) { h.drained = (h.drained || 0) + o.drains; if (h.drained >= 1) { const i = kills.indexOf(h); if (i >= 0) kills.splice(i, 1); changed = true; } } }
            }
            if (o.kind === 'door' || o.kind === 'cryo') { o.used = true; G.setGates([o.gate], true); L.dyn.forEach(m => { if (m.id === o.gate) m.active = false; }); changed = true; }
        }
        return changed;
    };
    const stepOne = (s, dir, press) => {
        const e = Object.assign({}, s); e.vx = dir * speed;
        if (press) { if (e.grounded) { e.vy = -J; e.jumps = 1; e.grounded = false; e.riding = null; } else if (e.jumps < 2) { e.vy = -J * .94; e.jumps = 2; } }
        for (let i = 0; i < 6; i++) {
            e.vy = Math.min(e.vy + X.GRAV, 16);
            Phys.move(e);
            const r = { x: e.x - 12, y: e.y - 60, w: 24, h: 60 };
            for (const h of kills) if (X.U.overlap(r, h)) return null;
            for (const h of bounces) if (e.vy >= 0 && X.U.overlap(r, h)) { e.vy = -(h.force || 20); e.jumps = 1; }
            if (e.y > L.ph) return null;
            if (e.grounded) { e.jumps = 0; }
        }
        return e;
    };
    for (; ;) {
        while (queue.length) {
            const s = queue.pop(); n++;
            if (n > 1500000) { console.log('   state cap reached'); queue.length = 0; break; }
            reachTiles.add(((s.y - 30) / TILE | 0) * L.w + (s.x / TILE | 0));
            for (const o of objs) if (!seenObj.has(o) && Math.hypot(o.x - s.x, o.y - s.y) < 74) seenObj.add(o);
            for (const dir of [1, -1, 0]) for (const press of [false, true]) {
                if (press && !s.grounded && s.jumps >= 2) continue;
                const e = stepOne(s, dir, press); if (!e) continue;
                const k = key(e); if (visited.has(k)) continue; visited.add(k); queue.push(e);
            }
        }
        if (!openGates()) break;
        visited.clear(); queue.push(start);
    }
    const A = L.arena; let endOK = false, far = 0;
    reachTiles.forEach(i => { const x = i % L.w; far = Math.max(far, x); });
    if (A) { reachTiles.forEach(i => { const x = i % L.w, y = i / L.w | 0; if (x * TILE > A.trigger && Math.abs(y * TILE - A.y) < 200) endOK = true; }); }
    const ex = L.objs.find(o => o.kind === 'exit' && !o.hidden); if (ex && seenObj.has(ex)) endOK = true;
    const missed = objs.filter(o => !seenObj.has(o) && !o.hidden).map(o => `${o.kind}:${o.id || ''}@${o.x / TILE | 0},${o.y / TILE | 0}`);
    // Image
    const sc = 3, W = L.w * sc, H = L.h * sc, img = Buffer.alloc(W * H * 3, 0);
    const put = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 3; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; };
    const box = (tx, ty, tw, th, c) => { for (let y = 0; y < th * sc; y++) for (let x = 0; x < tw * sc; x++) put(Math.floor(tx * sc + x), Math.floor(ty * sc + y), c); };
    for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        const t = L.tile(x, y), i = y * L.w + x, c = t === T.S ? [120, 120, 130] : t === T.O ? [220, 180, 60] : isSlope(t) ? [170, 150, 150] : reachTiles.has(i) ? [20, 90, 70] : L.back[i] ? [34, 30, 40] : [10, 10, 16];
        box(x, y, 1, 1, c);
    }
    for (const h of L.hazards) { const c = { lava: [255, 80, 10], water: [40, 90, 200], poison: [120, 255, 40], quicksand: [190, 150, 60], wire: [90, 200, 255], thorns: [60, 180, 40], spikes: [200, 200, 200] }[h.kind]; if (c) box(h.x / TILE, h.y / TILE, h.w / TILE, h.h / TILE, c); }
    for (const m of L.dyn) box(m.x / TILE, m.y / TILE, m.w / TILE, Math.max(1, m.h / TILE), m.kind === 'gate' ? [255, 255, 0] : m.kind === 'breakable' ? [255, 0, 255] : m.kind === 'crumble' ? [255, 150, 150] : [255, 255, 255]);
    for (const o of L.objs) box(o.x / TILE - 1, o.y / TILE - 2, 2, 2, seenObj.has(o) ? [0, 255, 255] : [255, 0, 0]);
    png(path.join(ROOT, 'tools', 'out_' + id + '.png'), W, H, img);
    return { id, endOK, states: n, far, width: L.w, missed, switches: log };
}
fs.mkdirSync(path.join(ROOT, 'tools'), { recursive: true });
let bad = 0;
for (const id of (only ? [only] : X.LEVEL_ORDER)) {
    const r = floodLevel(id);
    console.log(`${r.endOK ? 'PASS' : 'FAIL'} ${r.id}: reached column ${r.far}/${r.width}, ${r.states} states`);
    if (r.switches.length) console.log('   ' + r.switches.join('; '));
    if (r.missed.length) console.log('   unreached: ' + r.missed.join(' '));
    if (!r.endOK) bad++;
}
process.exit(bad ? 1 : 0);
