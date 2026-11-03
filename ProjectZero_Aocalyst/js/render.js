'use strict';
/**
 * RENDER: procedural art. Backgrounds are pre-rendered to tiled offscreen layers,
 * terrain is painted into 16x16-tile chunks on first view, and only animated
 * elements (lava, water, eruptions, aurora) are drawn live.
 */
const BG_W = 1600;
const Backdrop = {
    cache: {},
    layer(fn) { const c = U.canvas(BG_W, VH), x = c.getContext('2d'); fn(x, U.mulberry(c.width * 7 + Math.floor(Math.random() * 1e3))); return c; },
    grad(x, stops) { const g = x.createLinearGradient(0, 0, 0, VH); stops.forEach((s, i) => g.addColorStop(s[1] === undefined ? i / (stops.length - 1) : s[1], s[0])); x.fillStyle = g; x.fillRect(0, 0, BG_W, VH); },
    /** Seamless ridge line: harmonics of the tile width guarantee the wrap. */
    ridge(x, base, amp, col, seed, rough = 1) {
        x.fillStyle = col; x.beginPath(); x.moveTo(0, VH);
        for (let i = 0; i <= BG_W; i += 6) {
            const u = i / BG_W * TAU;
            let h = 0; for (let k = 1; k <= 6; k++) h += Math.sin(u * k * (rough > 1 ? k : 1) + seed * k * 1.7) / k;
            x.lineTo(i, base - h * amp);
        }
        x.lineTo(BG_W, VH); x.closePath(); x.fill();
    },
    build(id) {
        if (this.cache[id]) return this.cache[id];
        const L = [], add = (par, fn, parY = 0) => L.push({ img: this.layer(fn), par, parY });
        const self = this;
        ({
            city() {
                add(0, x => {
                    self.grad(x, [['#2a2530'], ['#5a3f3a', .45], ['#a86a3c', .72], ['#c08a50', .86], ['#3a3236', 1]]);
                    x.globalCompositeOperation = 'lighter'; x.drawImage(Glow.get('#ff9a50'), 900, 250, 460, 460); x.globalCompositeOperation = 'source-over';
                    x.fillStyle = 'rgba(30,24,30,.35)'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(Math.random() * BG_W, 120 + Math.random() * 240, 300, 34, 0, 0, TAU); x.fill(); }
                });
                const sky = (par, base, col, win, h0, w0, parY) => add(par, (x, R) => {
                    x.fillStyle = col;
                    for (let px = -20; px < BG_W;) {
                        const w = w0 * (.5 + R()), h = h0 * (.4 + R() * .8), top = base - h;
                        const tilt = R() < .25;
                        x.save(); if (tilt) { x.translate(px + w / 2, base); x.rotate(R() * .16 - .08); x.translate(-px - w / 2, -base); }
                        x.beginPath(); x.moveTo(px, VH); x.lineTo(px, top);
                        const broken = R() < .6, cuts = 5;
                        for (let i = 1; i <= cuts; i++) x.lineTo(px + w * i / cuts, top + (broken ? R() * h * .22 : 0));
                        x.lineTo(px + w, VH); x.closePath(); x.fill();
                        if (win) { for (let wy = top + 14; wy < base; wy += 16) for (let wx = px + 6; wx < px + w - 6; wx += 11) if (R() < .1) { x.fillStyle = R() < .3 ? '#d8a050' : '#3a3a44'; x.fillRect(wx, wy, 5, 7); x.fillStyle = col; } }
                        if (R() < .35) { x.fillRect(px + w * .5, top - 40, 3, 40); }
                        x.restore(); x.fillStyle = col; px += w + R() * 26 - 4;
                    }
                    x.fillRect(0, base, BG_W, VH - base);
                }, parY);
                sky(.08, 500, '#4c3f44', false, 300, 90, .02); sky(.18, 560, '#332c32', true, 340, 110, .05); sky(.34, 640, '#1f1c22', true, 360, 140, .09);
            },
            forest() {
                add(0, x => {
                    self.grad(x, [['#0e2a22'], ['#1e5a44', .4], ['#5ea070', .7], ['#a8d0a0', .85], ['#1a3a2a', 1]]);
                    x.globalCompositeOperation = 'lighter'; x.drawImage(Glow.get('#fff4c0'), 500, -200, 800, 800); x.globalCompositeOperation = 'source-over';
                });
                const trunks = (par, col, n, wMin, wMax, parY) => add(par, (x, R) => {
                    x.fillStyle = col;
                    for (let i = 0; i < n; i++) {
                        const px = i / n * BG_W + R() * 60, w = wMin + R() * (wMax - wMin);
                        x.beginPath(); x.moveTo(px - w * 1.6, VH); x.bezierCurveTo(px - w * .6, VH - 200, px - w * .5, 300, px - w * .6, 0); x.lineTo(px + w * .6, 0); x.bezierCurveTo(px + w * .5, 300, px + w * .6, VH - 200, px + w * 1.6, VH); x.closePath(); x.fill();
                        for (let b = 0; b < 3; b++) { const by = 60 + R() * 300, d = R() < .5 ? -1 : 1; x.beginPath(); x.moveTo(px, by + 14); x.quadraticCurveTo(px + d * 90, by - 10, px + d * (120 + R() * 80), by - 40); x.quadraticCurveTo(px + d * 80, by, px, by - 10); x.fill(); }
                    }
                    for (let i = 0; i < 30; i++) { x.beginPath(); x.ellipse(R() * BG_W, R() * 90, 130, 56, 0, 0, TAU); x.fill(); }
                }, parY);
                trunks(.1, '#2f6a50', 9, 18, 34, .02); trunks(.22, '#1f4c3a', 7, 30, 50, .05); trunks(.4, '#123226', 5, 46, 76, .1);
            },
            desert() {
                add(0, x => {
                    self.grad(x, [['#3e6a9a'], ['#b8a890', .38], ['#f0c080', .6], ['#e8a050', .78], ['#a8602c', 1]]);
                    x.globalCompositeOperation = 'lighter'; x.drawImage(Glow.get('#fff0c0'), 980, 40, 300, 300); x.drawImage(Glow.get('#ffffff'), 1070, 130, 120, 120); x.globalCompositeOperation = 'source-over';
                });
                add(.06, (x, R) => { self.ridge(x, 450, 22, '#c89a68', 2.1); for (let i = 0; i < 6; i++) { const px = R() * BG_W, w = 70 + R() * 130, h = 60 + R() * 100; x.fillStyle = '#b0845a'; x.beginPath(); x.moveTo(px - w * .7, 470); x.lineTo(px - w * .4, 450 - h); x.lineTo(px + w * .4, 450 - h - 8); x.lineTo(px + w * .7, 470); x.closePath(); x.fill(); } }, .02);
                add(.16, (x, R) => { self.ridge(x, 530, 34, '#b07e4c', 4.4); x.fillStyle = '#8f6840'; for (let i = 0; i < 4; i++) { const px = 100 + i * 390 + R() * 70, y = 500; x.beginPath(); x.moveTo(px - 26, y); x.lineTo(px - 10, y - 110); x.lineTo(px + 12, y - 118); x.lineTo(px + 28, y); x.closePath(); x.fill(); x.fillRect(px - 42, y - 124, 84, 10); } }, .05);
                add(.32, x => self.ridge(x, 610, 44, '#94683a', 1.3), .08);
                add(.52, x => self.ridge(x, 680, 40, '#7a5430', 3.3), .12);
            },
            ice() {
                add(0, x => {
                    self.grad(x, [['#071426'], ['#14304e', .45], ['#46708e', .72], ['#9cc4d8', .9], ['#d0e4ee', 1]]);
                    x.fillStyle = '#fff'; for (let i = 0; i < 120; i++) { x.globalAlpha = Math.random() * .8; x.fillRect(Math.random() * BG_W, Math.random() * 360, 1.5, 1.5); } x.globalAlpha = 1;
                });
                const mts = (par, base, h, col, cap, seed, parY) => add(par, (x, R) => {
                    x.fillStyle = col;
                    for (let i = -1; i < 9; i++) {
                        const px = i * BG_W / 8 + 50, H = h * (.6 + R() * .5), w = BG_W / 8 * (.9 + R() * .5), pk = px + w * (.3 + R() * .3);
                        x.fillStyle = col; x.beginPath(); x.moveTo(px - w * .7, base); x.lineTo(pk, base - H); x.lineTo(px + w * 1.1, base); x.closePath(); x.fill();
                        x.fillStyle = cap; x.beginPath(); x.moveTo(pk, base - H); x.lineTo(pk - H * .2, base - H * .72); x.lineTo(pk - H * .06, base - H * .78); x.lineTo(pk + H * .05, base - H * .68); x.lineTo(pk + H * .25, base - H * .74); x.closePath(); x.fill();
                    }
                    x.fillStyle = col; x.fillRect(0, base - 2, BG_W, VH - base + 2);
                }, parY);
                mts(.05, 480, 330, '#27455e', '#a8c8dc', 1, .02); mts(.15, 560, 300, '#1c3448', '#c8dcec', 2, .05); mts(.3, 660, 300, '#142636', '#e4f0f8', 3, .09);
            },
            volcano() {
                add(0, x => {
                    self.grad(x, [['#240a0c'], ['#5a1612', .3], ['#b0300e', .58], ['#f4621a', .8], ['#ffb050', 1]]);
                    for (let i = 0; i < 30; i++) { const w = 240 + Math.random() * 260; x.globalAlpha = .5; x.drawImage(Glow.get('#1c0a0c'), Math.random() * BG_W - w, Math.random() * 300 - 90, w * 2, 180); } x.globalAlpha = 1;
                });
                add(.05, (x, R) => {
                    // Kalder Massif itself, always on the horizon.
                    const c = 800; x.fillStyle = '#3a1616'; x.beginPath(); x.moveTo(c - 760, VH); x.lineTo(c - 120, 190); x.lineTo(c - 60, 200); x.lineTo(c - 30, 176); x.lineTo(c + 40, 196); x.lineTo(c + 110, 186); x.lineTo(c + 760, VH); x.closePath(); x.fill();
                    x.strokeStyle = '#ff5a10'; x.lineWidth = 3; for (let i = 0; i < 7; i++) { let px = c - 60 + i * 20, y = 200; x.beginPath(); x.moveTo(px, y); while (y < VH) { y += 30; px += (R() - .5 + (i - 3) * .15) * 36; x.lineTo(px, y); } x.stroke(); }
                    self.ridge(x, 610, 40, '#2a0e10', 2.4);
                }, .03);
                add(.2, x => self.ridge(x, 600, 66, '#220b0c', 3.9, 2), .07);
                add(.4, x => { self.ridge(x, 680, 54, '#180708', 5.1, 2); }, .12);
            },
            forge() {
                add(0, x => { self.grad(x, [['#1e100c'], ['#3e1a10', .6], ['#8a3210', 1]]); });
                add(.15, (x, R) => {
                    x.fillStyle = '#2c1610'; for (let i = 0; i < 10; i++) { const px = i * 160 + 30, w = 60 + R() * 60; x.fillRect(px, 0, w, VH); x.fillStyle = '#ff5a10'; for (let k = 0; k < 8; k++) x.fillRect(px + 12, 70 + k * 80, w - 24, 4); x.fillStyle = '#2c1610'; }
                    x.strokeStyle = '#361c14'; x.lineWidth = 26; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, 120 + i * 150); x.lineTo(BG_W, 120 + i * 150); x.stroke(); }
                }, .1);
                add(.35, (x, R) => { x.fillStyle = '#20100c'; for (let i = 0; i < 6; i++) { const px = i * 270 + R() * 80; x.fillRect(px, 0, 34, VH); x.fillRect(px - 26, 300 + R() * 200, 86, 16); } }, .2);
            },
            core() {
                add(0, x => {
                    self.grad(x, [['#100818'], ['#2a1034', .6], ['#5a1420', 1]]);
                    x.strokeStyle = 'rgba(255,42,0,.14)'; x.lineWidth = 2; for (let i = 0; i < 30; i++) { x.beginPath(); x.ellipse(800, 360, 90 + i * 36, 40 + i * 16, 0, 0, TAU); x.stroke(); }
                });
                add(.14, (x, R) => { x.fillStyle = '#1e0e28'; for (let i = 0; i < 12; i++) { const px = i * 136 + R() * 40; x.fillRect(px, 0, 18 + R() * 26, VH); } x.strokeStyle = '#2e1426'; x.lineWidth = 16; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(0, 100 + i * 130); x.lineTo(BG_W, 100 + i * 130); x.stroke(); } }, .12);
            }
        })[id]();
        return this.cache[id] = L;
    },
    draw(ctx, id, cam, t, level) {
        const L = this.build(id);
        for (const l of L) {
            const off = -((cam.x * l.par) % BG_W), oy = l.parY ? -U.clamp((cam.y - (level ? level.ph * .4 : 0)) * l.parY, -80, 80) : 0;
            ctx.drawImage(l.img, off, oy); if (off + BG_W < VW) ctx.drawImage(l.img, off + BG_W, oy);
            // Vertical parallax must not expose the layers beneath at the frame edges.
            if (oy < 0) for (const ox of [off, off + BG_W]) ctx.drawImage(l.img, 0, VH - 2, BG_W, 2, ox, VH + oy - 1, BG_W, 2 - oy);
            if (oy > 0 && L.indexOf(l) === 0) ctx.drawImage(l.img, 0, 0, BG_W, 1, off, 0, BG_W, oy);
        }
        this.live(ctx, id, cam, t, level);
        if (level && level.bgMode) FinalBG.draw(ctx, cam, t, level);
    },
    live(ctx, id, cam, t, level) {
        if (id === 'forest') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 5; i++) {
                const x = ((i * 310 - cam.x * .15 + 2000) % 1600) - 100, a = .06 + Math.sin(t * .01 + i) * .03;
                const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, `rgba(255,250,200,${a})`); g.addColorStop(1, 'rgba(255,250,200,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x - 90, VH); ctx.lineTo(x - 260, VH); ctx.closePath(); ctx.fill();
            }
            ctx.restore();
        } else if (id === 'ice') {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let b = 0; b < 3; b++) {
                ctx.beginPath(); const y0 = 70 + b * 46;
                for (let x = 0; x <= VW; x += 24) ctx.lineTo(x, y0 + Math.sin(x * .006 + t * .004 + b) * 30 + Math.sin(x * .013 - t * .006) * 14);
                for (let x = VW; x >= 0; x -= 24) ctx.lineTo(x, y0 + 80 + Math.sin(x * .006 + t * .004 + b) * 24);
                ctx.closePath(); ctx.fillStyle = ['rgba(60,255,170,.06)', 'rgba(90,160,255,.05)', 'rgba(200,90,255,.04)'][b]; ctx.fill();
            }
            ctx.restore();
        } else if (id === 'volcano' || id === 'core' || id === 'forge') {
            if (id === 'volcano') {
                const c = ((800 - cam.x * .05) % BG_W + BG_W) % BG_W, cy = 188 - U.clamp((cam.y - (level ? level.ph * .4 : 0)) * .03, -80, 80);
                ctx.save(); ctx.globalCompositeOperation = 'lighter';
                const pulse = 1 + Math.sin(t * .03) * .1 + (G.eruption ? .6 : 0);
                ctx.drawImage(Glow.get('#ff5a10'), c - 240 * pulse, cy - 240 * pulse, 480 * pulse, 480 * pulse);
                for (let i = 0; i < 8; i++) { const u = ((t * .9 + i * 37) % 240) / 240, x = c + Math.sin(i * 2.7) * 90 * u, y = cy - Math.sin(u * Math.PI) * (180 + i * 18); ctx.globalAlpha = 1 - u; ctx.drawImage(Glow.get('#ffb040'), x - 8, y - 8, 16, 16); }
                ctx.restore();
                // Soft smoke column: sprites, not hard discs.
                ctx.save();
                for (let i = 0; i < 12; i++) { const u = ((t * .35 + i * 30) % 360) / 360, s = 60 + u * 220; ctx.globalAlpha = .55 * Math.sin(u * Math.PI); ctx.drawImage(Glow.get('#120808'), c + Math.sin(i * 1.9 + u * 3) * 70 * u + u * 120 - s, cy - u * 260 - s, s * 2, s * 2); }
                ctx.restore();
            }
            if (id === 'core') {
                ctx.save(); ctx.translate(VW / 2 - (cam.x % 200) * .02, VH / 2); ctx.globalCompositeOperation = 'lighter';
                const col = level && level.bgVoid ? '#ff0000' : '#ff2a00';
                for (let i = 0; i < 5; i++) { ctx.rotate(t * .001 * (i % 2 ? -1 : 1) + i); ctx.strokeStyle = U.rgba(col, .14); ctx.lineWidth = 3; ctx.setLineDash([60, 40]); ctx.beginPath(); ctx.arc(0, 0, 200 + i * 90, 0, TAU); ctx.stroke(); }
                ctx.setLineDash([]); ctx.restore();
            }
        }
    }
};

/* --------------------------- TERRAIN CHUNKS --------------------------- */
const CHUNK = 16, CHUNK_RES = 2;
const Terrain = {
    prepare(L) {
        // Depth from the nearest open tile drives the shading, giving soft rock mass.
        const W = L.w, H = L.h, d = L.depth = new Uint8Array(W * H).fill(5);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (L.grid[y * W + x] !== T.S) d[y * W + x] = 0;
        for (let p = 0; p < 4; p++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = y * W + x; if (d[i] === 0) continue;
            let m = 5; if (x > 0) m = Math.min(m, d[i - 1]); if (x < W - 1) m = Math.min(m, d[i + 1]); if (y > 0) m = Math.min(m, d[i - W]); if (y < H - 1) m = Math.min(m, d[i + W]);
            d[i] = Math.min(d[i], m + 1);
        }
        L.chunks = new Map();
    },
    hash(x, y) { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); },
    chunk(L, cx, cy) {
        const key = cx + cy * 4096; let c = L.chunks.get(key);
        if (c) { L.chunks.delete(key); L.chunks.set(key, c); return c; } // keep recency order
        const res = Settings.quality === 0 ? 1 : CHUNK_RES;
        c = U.canvas(CHUNK * TILE * res, CHUNK * TILE * res);
        const x = c.getContext('2d'); x.scale(res, res); this.paint(L, x, cx, cy);
        // Keep the cache bounded: chunk canvases are the largest allocation in a level.
        if (L.chunks.size > 42) { const k = L.chunks.keys().next().value; L.chunks.delete(k); }
        L.chunks.set(key, c); return c;
    },
    paint(L, x, cx, cy) {
        const P = L.theme.tile, reg = L.region, sx = cx * CHUNK, sy = cy * CHUNK, TT = TILE;
        for (let ty = sy; ty < sy + CHUNK; ty++) for (let tx = sx; tx < sx + CHUNK; tx++) {
            if (tx >= L.w || ty >= L.h) continue;
            const i = ty * L.w + tx, t = L.grid[i], b = L.back[i], px = (tx - sx) * TT, py = (ty - sy) * TT, n = this.hash(tx, ty);
            if (b && t !== T.S) this.backTile(L, x, px, py, tx, ty, b, P, n);
            if (t === T.S) this.solid(L, x, px, py, tx, ty, P, n, reg);
            else if (isSlope(t)) this.slope(L, x, px, py, t, P, n);
            else if (t === T.O) this.oneway(L, x, px, py, tx, ty, P, n, reg);
        }
    },
    backTile(L, x, px, py, tx, ty, b, P, n) {
        x.fillStyle = P.back; x.fillRect(px, py, TILE, TILE);
        x.strokeStyle = P.backLine; x.lineWidth = 1;
        if (b === 1) { x.strokeRect(px + .5, py + .5, TILE, TILE); if (n > .85) { x.fillStyle = '#2a2a30'; x.fillRect(px + 8, py + 6, 16, 20); } }
        else if (b === 2) { x.strokeRect(px + .5, py + .5, TILE, TILE / 2); if (n > .92) { x.fillStyle = P.backLine; x.fillRect(px, py + 10, TILE, 3); } }
        else if (b === 3) { if ((tx + ty) % 3 === 0) { x.strokeRect(px + 4, py + 4, 24, 24); } if (n > .9) { x.fillStyle = '#4a3a22'; x.fillRect(px + 12, py + 12, 8, 8); } }
        else if (b === 4) { x.strokeRect(px + .5, py + .5, TILE, TILE); if (tx % 5 === 0) { x.fillStyle = 'rgba(160,220,255,.08)'; x.fillRect(px + 6, py + 6, 20, 20); } }
        else if (b === 5) { if (n > .55) { x.fillStyle = 'rgba(255,90,16,.05)'; x.fillRect(px, py, TILE, TILE); } if (tx % 7 === 0) { x.fillStyle = '#1a0e0c'; x.fillRect(px + 10, py, 12, TILE); } }
        else if (b === 6) { if ((ty) % 4 === 0) { x.fillStyle = 'rgba(255,42,0,.09)'; x.fillRect(px, py + 14, TILE, 3); } }
    },
    /** Per-region rock texture. Noise is sampled in world space so patterns run across tiles. */
    solid(L, x, px, py, tx, ty, P, n, reg) {
        const d = L.depth[ty * L.w + tx], k = U.clamp(1 - d / 5, 0, 1), TT = TILE, h = (a, b) => this.hash(tx * a + 3, ty * b + 7);
        const above = L.tile(tx, ty - 1), open = above === T.E || above === T.O, volcanic = reg === 'volcano';
        const facade = reg === 'city' && ty < 40 && d > 1;
        x.fillStyle = U.mix(P.base, P.mid, k * .9 + n * .1); x.fillRect(px, py, TT + .5, TT + .5);
        if (facade) {
            x.fillStyle = 'rgba(0,0,0,.13)'; for (let b = 0; b < 4; b++) { x.fillRect(px, py + b * 8 + 7, TT, 1); for (let c = 0; c < 2; c++) x.fillRect(px + ((b % 2) * 8 + c * 16) % TT, py + b * 8, 1, 8); }
            if (tx % 4 === 1 && ty % 4 === 1) {
                const lit = n > .72; x.fillStyle = '#23252c'; x.fillRect(px - 3, py - 3, TT * 1.6, TT * 1.8);
                x.fillStyle = lit ? '#b89a58' : '#101218'; x.fillRect(px, py, TT * 1.4, TT * 1.6);
                x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.moveTo(px, py + 30); x.lineTo(px + 26, py); x.lineTo(px + 36, py); x.lineTo(px, py + 42); x.fill();
                x.fillStyle = '#2a2c33'; x.fillRect(px + TT * .68, py, 2, TT * 1.6); x.fillRect(px, py + TT * .78, TT * 1.4, 2);
                if (!lit && n < .3) { x.strokeStyle = '#3a3c44'; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 6, py); x.lineTo(px + 24, py + 28); x.lineTo(px + 12, py + 50); x.stroke(); }
            }
        } else if (reg === 'city') {
            for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.16)'; x.fillRect(px + h(i + 1, 3) * 30, py + h(5, i + 2) * 30, 2, 2); }
            if (n < .1) { x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(px + 2, py + 6); x.lineTo(px + 13, py + 15); x.lineTo(px + 9, py + 26); x.lineTo(px + 22, py + 30); x.stroke(); }
            if (n > .93) { x.strokeStyle = '#7a4a2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(px + 8, py + 30); x.lineTo(px + 14, py + 8); x.stroke(); }
        } else if (reg === 'forest') {
            for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? 'rgba(120,90,50,.25)' : 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(px + h(i + 1, 2) * 30, py + h(4, i + 3) * 30, 2 + h(i, i) * 3.4, 1.4 + h(i, 1) * 2, 0, 0, TAU); x.fill(); }
            if (n > .86 && d <= 2) { x.strokeStyle = '#4a3a24'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(px, py + 14); x.bezierCurveTo(px + 10, py + 6, px + 20, py + 24, px + TT, py + 12); x.stroke(); }
            if (n < .05) { x.fillStyle = '#6a6a5e'; x.beginPath(); x.ellipse(px + 16, py + 18, 9, 6, .3, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(px + 11, py + 14, 8, 2); }
        } else if (reg === 'desert') {
            for (let b = 0; b < 3; b++) { const yy = py + 5 + b * 11 + U.noise1(tx * .3 + b, ty) * 5; x.fillStyle = b === 1 ? 'rgba(255,225,170,.14)' : 'rgba(70,40,14,.2)'; x.fillRect(px, yy, TT + .5, 2.4 + (b % 2)); }
            if (n > .9) { x.fillStyle = 'rgba(60,34,12,.4)'; x.beginPath(); x.ellipse(px + 16, py + 16, 7, 3, 0, 0, TAU); x.fill(); }
        } else if (reg === 'ice') {
            x.fillStyle = 'rgba(190,235,255,.09)'; x.beginPath(); x.moveTo(px + n * 20, py); x.lineTo(px + n * 20 + 12, py); x.lineTo(px + n * 8 + 4, py + TT); x.lineTo(px + n * 8 - 8, py + TT); x.fill();
            x.strokeStyle = 'rgba(220,245,255,.16)'; x.lineWidth = 1; if (n > .55) { x.beginPath(); x.moveTo(px + 3, py + n * 26); x.lineTo(px + 15, py + 8); x.lineTo(px + 28, py + 24); x.stroke(); }
            if (n < .1) { x.fillStyle = 'rgba(120,216,255,.2)'; x.beginPath(); x.moveTo(px + 16, py + 6); x.lineTo(px + 25, py + 18); x.lineTo(px + 16, py + 28); x.lineTo(px + 7, py + 18); x.fill(); }
        } else if (volcanic) {
            // Basalt columns with magma seams.
            const col = Math.floor(tx / 2); x.fillStyle = this.hash(col, 1) > .5 ? 'rgba(255,190,150,.05)' : 'rgba(0,0,0,.18)'; x.fillRect(px, py, TT, TT);
            if (tx % 2 === 0) { x.fillStyle = 'rgba(0,0,0,.42)'; x.fillRect(px, py, 2, TT); }
            if ((ty + col * 3) % 5 === 0) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(px, py + 12, TT, 1.6); }
            if (n > .9 && d > 1) { x.strokeStyle = '#ff5a10'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(px + 2, py + 5); x.lineTo(px + 14, py + 15); x.lineTo(px + 9, py + 29); x.stroke(); x.strokeStyle = '#ffd060'; x.lineWidth = .9; x.stroke(); x.fillStyle = 'rgba(255,90,16,.12)'; x.fillRect(px - 4, py, TT + 8, TT); }
        } else {
            // The Bore: machined ribs.
            x.fillStyle = 'rgba(0,0,0,.25)'; if (ty % 3 === 0) x.fillRect(px, py + 14, TT, 3); x.fillStyle = 'rgba(255,255,255,.05)'; if (tx % 4 === 0) x.fillRect(px + 4, py, 2, TT);
            if (n > .92) { x.fillStyle = '#ff2a00'; x.fillRect(px + 8, py + 12, 16, 2); }
        }
        if (d === 1) { x.fillStyle = 'rgba(255,255,255,.035)'; x.fillRect(px, py, TT, TT); }
        if (open) {
            x.fillStyle = P.top; x.fillRect(px, py, TT + .5, 7 + n * 3);
            x.fillStyle = P.edge; x.fillRect(px, py, TT + .5, 2.5);
            if (reg === 'forest') {
                x.fillStyle = '#2c5222'; x.fillRect(px, py + 6, TT + .5, 3); for (let g = 0; g < 7; g++) { const gx = px + g * 4.6 + n * 3, gh = 5 + h(g + 1, 9) * 8; x.fillStyle = g % 3 ? '#4e8a36' : '#7fbf4a'; x.beginPath(); x.moveTo(gx - 1.4, py + 2); x.lineTo(gx + (g % 2 ? 2 : -2), py - gh); x.lineTo(gx + 1.4, py + 2); x.fill(); }
                if (n > .82) { Paint.disc(x, px + 14, py - 9, 2.2, n > .9 ? '#f4c8e8' : '#fff0a0'); }
            }
            if (reg === 'ice') { x.fillStyle = '#ffffff'; x.fillRect(px, py - 2, TT + .5, 6); x.fillStyle = '#e4f2fb'; x.beginPath(); x.moveTo(px, py + 4); for (let g = 0; g <= 4; g++) x.lineTo(px + g * 8, py + 5 + (g % 2 ? 7 * n + 2 : 2)); x.lineTo(px + TT, py + 3); x.closePath(); x.fill(); }
            if (reg === 'desert') { x.fillStyle = 'rgba(255,240,200,.35)'; for (let g = 0; g < 2; g++) x.fillRect(px + h(g + 2, 1) * 18, py + 3.5 + g * 3, 13, 1.2); }
            if (volcanic) { x.fillStyle = '#2a1a16'; x.fillRect(px, py + 1, TT, 3); if (n > .55) { x.fillStyle = '#ff7a18'; x.fillRect(px + n * 18, py + 2, 8, 1.8); } if (n < .2) { x.fillStyle = '#1a100e'; x.beginPath(); x.moveTo(px + 6, py + 1); x.lineTo(px + 12, py - 5); x.lineTo(px + 19, py + 1); x.fill(); } }
            if (reg === 'city' && !facade) { x.fillStyle = '#6a6458'; if (n > .75) x.fillRect(px, py + 8, TT, 2); if (tx % 6 === 0) { x.fillStyle = '#c8b860'; x.fillRect(px + 4, py + 3, 14, 2); } if (n < .25) { x.strokeStyle = '#1a1a1c'; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 4, py + 2); x.lineTo(px + 12, py + 9); x.lineTo(px + 18, py + 5); x.stroke(); } if (n > .9) { x.fillStyle = '#3e5a26'; for (let g = 0; g < 4; g++) x.fillRect(px + 6 + g * 4, py - 4 - g % 2 * 3, 1.6, 6); } }
        }
        const below = L.tile(tx, ty + 1);
        if (below === T.E) {
            x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(px, py + 25, TT, 7);
            if (reg === 'ice' && n > .55) { x.fillStyle = '#d2f3ff'; x.beginPath(); x.moveTo(px + 5, py + 31); x.lineTo(px + 12, py + 42 + n * 16); x.lineTo(px + 19, py + 31); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(px + 10, py + 31, 2, 12); }
            if (reg === 'forest' && n > .55) { x.strokeStyle = '#3e6a2e'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px + n * 24, py + 30); x.quadraticCurveTo(px + n * 24 + 5, py + 40, px + n * 24 - 2, py + 44 + n * 18); x.stroke(); }
            if (volcanic && n > .6) { x.fillStyle = '#1e1210'; x.beginPath(); x.moveTo(px + 8, py + 31); x.lineTo(px + 14, py + 44 + n * 10); x.lineTo(px + 20, py + 31); x.fill(); }
            if (reg === 'city' && n > .8) { x.strokeStyle = '#6a4a2a'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px + 12, py + 31); x.lineTo(px + 15, py + 46); x.stroke(); }
        }
    },
    slope(L, x, px, py, t, P, n) {
        const y0 = py + TILE * (1 - slopeH(t, 0)), y1 = py + TILE * (1 - slopeH(t, 1));
        x.fillStyle = P.mid; x.beginPath(); x.moveTo(px, y0); x.lineTo(px + TILE, y1); x.lineTo(px + TILE, py + TILE + .5); x.lineTo(px, py + TILE + .5); x.closePath(); x.fill();
        x.strokeStyle = P.top; x.lineWidth = 9; x.lineCap = 'butt'; x.beginPath(); x.moveTo(px, y0 + 4); x.lineTo(px + TILE, y1 + 4); x.stroke();
        x.strokeStyle = P.edge; x.lineWidth = 2.5; x.beginPath(); x.moveTo(px, y0); x.lineTo(px + TILE, y1); x.stroke();
    },
    oneway(L, x, px, py, tx, ty, P, n, reg) {
        const col = { city: '#55504a', forest: '#5a4426', desert: '#a07a42', ice: '#a8d0e8', volcano: '#4a2c20' }[reg] || '#555';
        if (reg === 'forest') { x.fillStyle = '#4a3820'; x.fillRect(px, py + 2, TILE, 10); x.fillStyle = '#3e6a2e'; x.fillRect(px, py, TILE, 4); }
        else if (reg === 'ice') { x.fillStyle = col; x.fillRect(px, py, TILE, 9); x.fillStyle = '#fff'; x.fillRect(px, py, TILE, 3); }
        else { x.fillStyle = col; x.fillRect(px, py, TILE, 9); x.fillStyle = P.edge; x.globalAlpha = .6; x.fillRect(px, py, TILE, 2); x.globalAlpha = 1; x.fillStyle = 'rgba(0,0,0,.35)'; if (tx % 3 === 0) x.fillRect(px + 2, py + 9, 4, 6); }
    },
    draw(ctx, L, cam) {
        const z = cam.zoom, x0 = Math.floor(cam.x / (CHUNK * TILE)), x1 = Math.floor((cam.x + VW / z) / (CHUNK * TILE));
        const y0 = Math.floor(cam.y / (CHUNK * TILE)), y1 = Math.floor((cam.y + VH / z) / (CHUNK * TILE));
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
            if (cx < 0 || cy < 0 || cx * CHUNK >= L.w || cy * CHUNK >= L.h) continue;
            ctx.drawImage(this.chunk(L, cx, cy), cx * CHUNK * TILE, cy * CHUNK * TILE, CHUNK * TILE + .5, CHUNK * TILE + .5);
        }
        // Paint one neighbouring chunk per frame so scrolling never pays for a burst at once.
        for (let cy = y0 - 1; cy <= y1 + 1; cy++) for (let cx = x0 - 1; cx <= x1 + 1; cx++) {
            if (cx < 0 || cy < 0 || cx * CHUNK >= L.w || cy * CHUNK >= L.h || L.chunks.has(cx + cy * 4096)) continue;
            this.chunk(L, cx, cy); return;
        }
    }
};

/* ------------------------------ HAZARDS ------------------------------- */
const HazardArt = {
    draw(c, L, cam, t) {
        const vx0 = cam.x - 60, vx1 = cam.x + VW / cam.zoom + 60, vy0 = cam.y - 80, vy1 = cam.y + VH / cam.zoom + 80;
        for (const h of L.hazards) {
            if (h.x > vx1 || h.x + h.w < vx0 || h.y > vy1 || h.y + h.h < vy0) continue;
            if (h.coreLava && L.lavaHidden) continue;
            switch (h.kind) {
                case 'lava': this.liquid(c, h, t, '#ff5a10', '#ffd060', '#b82206', 5, cam); Light.add(h.x + h.w / 2, h.y, Math.min(520, h.w * .7 + 120), '#ff5a10', 1); for (let px = h.x + 100; px < h.x + h.w; px += 240) Light.add(px, h.y, 220, '#ff7a18', .7 + Math.sin(t * .1 + px) * .2); if (G.time % 8 === 0 && Settings.quality) VFX.add(U.rand(Math.max(h.x, vx0), Math.min(h.x + h.w, vx1)), h.y, U.rand(-.5, .5), U.rand(-3.6, -1), '#ffb040', 34, 3, 1, .02); break;
                case 'water': this.liquid(c, h, t, '#16465e', '#7fc8e8', '#0c2a3e', 2.5, cam, .78); if (h.flow) { c.strokeStyle = 'rgba(200,240,255,.3)'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const px = h.x + ((t * -h.flow * 2 + i * 70) % h.w + h.w) % h.w; c.beginPath(); c.moveTo(px, h.y + 7); c.lineTo(px + 24, h.y + 7); c.stroke(); } } break;
                case 'poison': this.liquid(c, h, t, '#3a5a10', '#9dff40', '#22380c', 2, cam, .85); Light.add(h.x + h.w / 2, h.y, 240, '#9dff40', .5); if (G.time % 9 === 0) VFX.add(U.rand(h.x, h.x + h.w), h.y, 0, -.9, '#9dff40', 40, 12, 3, 0); break;
                case 'quicksand': {
                    c.fillStyle = '#b08a4a'; c.fillRect(h.x, h.y, h.w, h.h);
                    c.strokeStyle = 'rgba(80,50,20,.5)'; c.lineWidth = 2; for (let i = 0; i < 4; i++) { const r = ((t * .6 + i * 22) % 88); c.beginPath(); c.ellipse(h.x + h.w / 2, h.y + 8, h.w * .5 * (1 - r / 88), 6 * (1 - r / 88), 0, 0, TAU); c.stroke(); } break;
                }
                case 'spikes': case 'thorns': {
                    const col = h.kind === 'thorns' ? '#4a6a2a' : '#8a8a90'; c.fillStyle = col;
                    for (let px = h.x; px < h.x + h.w; px += 14) { c.beginPath(); c.moveTo(px, h.y + h.h); c.lineTo(px + 7, h.y - 6); c.lineTo(px + 14, h.y + h.h); c.fill(); } break;
                }
                case 'wire': {
                    const on = Hazards.active(h);
                    c.fillStyle = '#18202a'; c.fillRect(h.x, h.y, h.w, h.h + 4); c.strokeStyle = on ? '#9fe0ff' : '#44505a'; c.lineWidth = on ? 3 : 1.5;
                    c.beginPath(); for (let px = h.x; px <= h.x + h.w; px += 16) c.lineTo(px, h.y + 4 + (on ? U.rand(-7, 7) : Math.sin(px) * 2)); c.stroke();
                    if (on) { Light.add(h.x + h.w / 2, h.y, 200, '#9fe0ff', .9); if (G.time % 3 === 0) VFX.add(U.rand(h.x, h.x + h.w), h.y, U.rand(-2, 2), -3, '#cfefff', 12, 2, 2); }
                    else if ((h.period - ((t + (h.phase || 0)) % h.period)) < 34 && t % 8 < 4) { c.fillStyle = '#ffdd33'; c.fillRect(h.x, h.y - 3, h.w, 2); } break;
                }
                case 'geyser': case 'steam': {
                    const on = Hazards.active(h), col = h.kind === 'geyser' ? '#ff7a18' : '#cfcfd6';
                    c.fillStyle = '#2a1a16'; c.fillRect(h.x + h.w * .2, h.y + h.h - 6, h.w * .6, 6);
                    if (on) { for (let i = 0; i < 2; i++) VFX.add(h.x + h.w / 2 + U.rand(-8, 8), h.y + h.h, U.rand(-1, 1), -U.rand(7, 11), col, 22, h.kind === 'geyser' ? 9 : 14, h.kind === 'geyser' ? 1 : 3, .04); if (h.kind === 'geyser') Light.add(h.x + h.w / 2, h.y + h.h * .5, 150, '#ff7a18', .9); }
                    else if ((h.period - ((t + (h.phase || 0)) % h.period)) < 40 && t % 4 === 0) VFX.add(h.x + h.w / 2, h.y + h.h, U.rand(-.6, .6), -2, col, 12, 5, 3, 0);
                    break;
                }
            }
        }
    },
    liquid(c, h, t, body, crest, deep, amp, cam, alpha = 1) {
        c.save(); c.globalAlpha = alpha;
        const x0 = Math.max(h.x, cam.x - 40), x1 = Math.min(h.x + h.w, cam.x + VW / cam.zoom + 40), y = h.y + (h.drain || 0);
        const g = c.createLinearGradient(0, y, 0, y + Math.min(140, h.h)); g.addColorStop(0, body); g.addColorStop(1, deep);
        c.fillStyle = g; c.beginPath(); c.moveTo(x0, h.y + h.h + 8);
        for (let px = x0; px <= x1 + 12; px += 12) c.lineTo(px, y + Math.sin(px * .03 + t * .05) * amp + Math.sin(px * .011 - t * .03) * amp * .6);
        c.lineTo(x1 + 12, h.y + h.h + 8); c.closePath(); c.fill();
        c.strokeStyle = crest; c.lineWidth = 2.5; c.beginPath();
        for (let px = x0; px <= x1 + 12; px += 12) c.lineTo(px, y + Math.sin(px * .03 + t * .05) * amp + Math.sin(px * .011 - t * .03) * amp * .6);
        c.stroke(); c.restore();
    }
};

/* --------------------- MOVERS, GATES AND BREAKABLES -------------------- */
const DynArt = {
    draw(c, L, cam) {
        for (const d of L.dyn) {
            if (d.dead || (d.ghosted) || (!d.active && d.kind !== 'crumble' && d.kind !== 'gate')) continue;
            if (d.kind === 'crumble' && d.state === 2 && d.y > cam.y + VH) continue;
            if (d.x > cam.x + VW / cam.zoom + 50 || d.x + d.w < cam.x - 50) continue;
            let sx = 0;
            if (d.state === 1) { sx = Math.sin(G.time * 1.2) * 2; }
            const x = d.x + sx, y = d.y, w = d.w, h = d.h, s = d.tint ? 'tint' : d.skin;
            switch (s) {
                case 'plat': c.fillStyle = '#4a4e56'; c.fillRect(x, y, w, h); c.fillStyle = '#ffdd33'; for (let i = 0; i < w; i += 24) c.fillRect(x + i, y, 12, 3); c.fillStyle = '#23262c'; c.fillRect(x + 6, y + h, w - 12, 5); break;
                case 'crumble': c.fillStyle = '#55504a'; c.fillRect(x, y, w, h); c.strokeStyle = '#1a1a1c'; c.beginPath(); c.moveTo(x + 4, y); c.lineTo(x + 14, y + h); c.stroke(); break;
                case 'ice': c.fillStyle = '#a8d8ec'; c.fillRect(x, y, w, h); c.fillStyle = '#fff'; c.fillRect(x, y, w, 3); c.strokeStyle = '#6aa0c0'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 8, y + 3); c.lineTo(x + 18, y + 12); c.stroke(); break;
                case 'basalt': c.fillStyle = '#2c1c1a'; c.fillRect(x, y, w, h); c.fillStyle = '#ff5a10'; c.fillRect(x, y + h - 3, w, 2); c.fillStyle = '#4a342e'; c.fillRect(x, y, w, 4); break;
                case 'bridge': c.fillStyle = '#4a3a30'; c.fillRect(x, y, w, h); c.fillStyle = '#2a201a'; c.fillRect(x + 2, y + h, 5, 8); c.fillStyle = '#6a5240'; c.fillRect(x, y, w, 3); break;
                case 'metal': c.fillStyle = '#2e2a30'; c.fillRect(x, y, w, h); c.fillStyle = '#ff7a18'; c.fillRect(x + 4, y + 5, w - 8, 3); c.fillStyle = '#4a464e'; c.fillRect(x, y, w, 3); break;
                case 'plate': c.fillStyle = '#2a2230'; c.fillRect(x, y, w, h); c.fillStyle = '#ff2a00'; c.fillRect(x + 1, y, w - 2, 2); c.strokeStyle = '#120a14'; c.strokeRect(x, y, w, h); break;
                case 'tint': c.fillStyle = d.tint; c.fillRect(x, y, w, h); c.fillStyle = '#ff0000'; c.fillRect(x, y, w, 2); break;
                case 'crusher': {
                    c.fillStyle = '#26202a'; c.fillRect(x, y, w, h); c.fillStyle = '#ff5a10'; c.fillRect(x, y + h - 6, w, 3);
                    c.fillStyle = '#6a6470'; for (let i = 0; i < w; i += 14) { c.beginPath(); c.moveTo(x + i, y + h); c.lineTo(x + i + 7, y + h + 10); c.lineTo(x + i + 14, y + h); c.fill(); }
                    c.fillStyle = '#17131a'; c.fillRect(x + w / 2 - 9, y - 300, 18, 300); break;
                }
                case 'gate': c.fillStyle = '#23262c'; c.fillRect(x, y, w, h); c.fillStyle = '#ffdd33'; for (let i = 0; i < h; i += 26) c.fillRect(x + 2, y + i, w - 4, 11); break;
                case 'rootgate': c.fillStyle = '#2a2016'; c.fillRect(x, y, w, h); c.strokeStyle = '#5a7a2c'; c.lineWidth = 5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + 4 + i * 11, y); c.bezierCurveTo(x - 12, y + h * .3, x + 40, y + h * .6, x + 4 + i * 11, y + h); c.stroke(); } break;
                case 'sundoor': c.fillStyle = '#4a3a22'; c.fillRect(x, y, w, h); c.fillStyle = '#33ddff'; c.fillRect(x + 12, y + 8, 7, h - 16); Light.add(x + 16, y + h / 2, 120, '#33ddff', .6); break;
                case 'labdoor': c.fillStyle = '#2e4258'; c.fillRect(x, y, w, h); c.fillStyle = '#ff5544'; c.fillRect(x + 10, y + h / 2, 12, 6); Light.add(x + 16, y + h / 2, 90, '#ff5544', .7); break;
                case 'trinity': {
                    c.fillStyle = '#1a1020'; c.fillRect(x - 6, y, w + 12, h);
                    const S = Save.data.shards;[['#ff2a00', S.r], ['#00ff55', S.g], ['#0088ff', S.b]].forEach((p, i) => { Paint.disc(c, x + w / 2, y + 60 + i * 90, 11, p[1] ? p[0] : '#2a2030'); if (p[1]) Light.add(x + w / 2, y + 60 + i * 90, 100, p[0], .8); });
                    break;
                }
                case 'crack': { c.fillStyle = L.theme.tile.mid; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 2, y + 4); c.lineTo(x + w * .6, y + h * .3); c.lineTo(x + w * .3, y + h * .6); c.lineTo(x + w - 3, y + h - 4); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(x + w * .8, y + 5); c.lineTo(x + w * .4, y + h * .35); c.stroke(); break; }
                case 'magmaWall': c.fillStyle = '#241412'; c.fillRect(x, y, w, h); c.strokeStyle = '#ff5a10'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + h * .2); c.lineTo(x + w, y + h * .5); c.lineTo(x, y + h * .8); c.stroke(); Light.add(x + w / 2, y + h / 2, 130, '#ff5a10', .7); break;
                default: c.fillStyle = '#444'; c.fillRect(x, y, w, h);
            }
        }
    }
};

/* -------------------------- SET DRESSING -------------------------------- */
const Decor = {
    car(c, d) {
        const C = d.flip ? '#4a2a2a' : '#34404c'; c.save(); c.translate(d.x, d.y); if (d.flip) c.rotate(.05);
        c.fillStyle = C; c.fillRect(-60, -28, 120, 22); c.beginPath(); c.moveTo(-34, -28); c.lineTo(-20, -48); c.lineTo(26, -48); c.lineTo(42, -28); c.fill();
        c.fillStyle = '#10141a'; c.fillRect(-16, -44, 18, 14); c.fillRect(6, -44, 18, 14); c.fillStyle = '#7a4a2a'; c.fillRect(-58, -12, 40, 5); c.fillRect(10, -26, 22, 8);
        c.fillStyle = '#15161a'; c.beginPath(); c.arc(-36, -6, 11, 0, TAU); c.arc(38, -6, 11, 0, TAU); c.fill(); c.restore();
    },
    lamp(c, d, t) {
        const on = d.lit && (t + d.x) % 311 > 26;
        c.fillStyle = '#23262c'; c.fillRect(d.x - 2.5, d.y - 110, 5, 110); c.fillRect(d.x - 2, d.y - 112, 30, 4);
        if (d.broken) { c.save(); c.translate(d.x, d.y - 60); c.rotate(.8); c.fillRect(-2.5, -50, 5, 50); c.restore(); return; }
        c.fillStyle = on ? '#ffe2a8' : '#3a3a3a'; c.fillRect(d.x + 16, d.y - 108, 13, 5);
        if (on) Light.add(d.x + 22, d.y - 100, 170, '#ffd9a0', .9);
    },
    rubble(c, d) { c.fillStyle = '#3a3a3e'; for (let i = 0; i < 9; i++) { const x = d.x + (i - 4) * 12, s = 9 + (i * 37 % 13); c.fillRect(x, d.y - s, s + 5, s); } c.fillStyle = '#6b4a2a'; c.fillRect(d.x - 26, d.y - 22, 3, 22); c.fillRect(d.x + 14, d.y - 30, 3, 30); },
    sign(c, d) { c.fillStyle = '#23262c'; c.fillRect(d.x - 2, d.y - 56, 4, 56); c.fillStyle = '#2a4a3a'; c.fillRect(d.x - 54, d.y - 80, 108, 30); c.fillStyle = '#d8e8d0'; c.font = 'bold 11px "Courier New"'; c.textAlign = 'center'; c.fillText(tr(d.text || ''), d.x, d.y - 61); },
    vine(c, d) { c.strokeStyle = '#3e5a26'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(d.x + i * 14, d.y); c.quadraticCurveTo(d.x + i * 20, d.y - 40, d.x + i * 8, d.y - 80 - i * 12); c.stroke(); } },
    desk(c, d) { c.fillStyle = '#3a342e'; c.fillRect(d.x - 30, d.y - 24, 60, 5); c.fillRect(d.x - 26, d.y - 19, 4, 19); c.fillRect(d.x + 22, d.y - 19, 4, 19); c.fillStyle = '#1a1c20'; c.fillRect(d.x - 12, d.y - 40, 26, 16); },
    poster(c, d) { c.fillStyle = '#7a2020'; c.fillRect(d.x - 24, d.y - 44, 48, 62); c.fillStyle = '#f0d8a0'; c.font = 'bold 8px "Courier New"'; c.textAlign = 'center'; c.fillText((d.text || 'MERIDIAN').slice(0, 10), d.x, d.y - 20); c.fillText((d.text || '').slice(11), d.x, d.y - 10); Paint.disc(c, d.x, d.y - 32, 6, '#f0d8a0'); },
    antenna(c, d) { c.strokeStyle = '#2a2c32'; c.lineWidth = 3; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x, d.y - 110); c.moveTo(d.x - 16, d.y - 80); c.lineTo(d.x + 16, d.y - 80); c.moveTo(d.x - 11, d.y - 95); c.lineTo(d.x + 11, d.y - 95); c.stroke(); if ((Date.now() >> 9) & 1) { Paint.disc(c, d.x, d.y - 112, 3, '#ff3322'); Light.add(d.x, d.y - 112, 60, '#ff3322', .8); } },
    ac(c, d) { c.fillStyle = '#44484e'; c.fillRect(d.x - 28, d.y - 34, 56, 34); c.fillStyle = '#2a2c30'; c.beginPath(); c.arc(d.x, d.y - 17, 12, 0, TAU); c.fill(); },
    tank(c, d) { c.fillStyle = '#3a3e44'; c.fillRect(d.x - 30, d.y - 72, 60, 52); c.fillRect(d.x - 26, d.y - 20, 5, 20); c.fillRect(d.x + 21, d.y - 20, 5, 20); c.fillStyle = '#2a2c30'; c.beginPath(); c.moveTo(d.x - 34, d.y - 72); c.lineTo(d.x, d.y - 94); c.lineTo(d.x + 34, d.y - 72); c.fill(); },
    fountain(c, d) { c.fillStyle = '#4a4a50'; c.fillRect(d.x - 70, d.y - 16, 140, 16); c.fillRect(d.x - 12, d.y - 56, 24, 40); c.fillStyle = '#3a3a3e'; c.fillRect(d.x - 40, d.y - 62, 80, 8); c.fillStyle = '#5a5a60'; c.beginPath(); c.arc(d.x, d.y - 72, 12, 0, TAU); c.fill(); c.fillStyle = '#3e5a26'; c.fillRect(d.x - 60, d.y - 20, 30, 5); },
    train(c, d) { c.fillStyle = '#26303a'; c.fillRect(d.x - 150, d.y - 92, 300, 86); c.fillStyle = '#c9a227'; c.fillRect(d.x - 150, d.y - 48, 300, 5); c.fillStyle = '#10141a'; for (let i = 0; i < 6; i++) c.fillRect(d.x - 136 + i * 48, d.y - 82, 34, 28); c.fillStyle = '#15161a'; c.fillRect(d.x - 150, d.y - 6, 300, 6); },
    tree(c, d) { c.fillStyle = '#2a2016'; c.beginPath(); c.moveTo(d.x - 24, d.y); c.bezierCurveTo(d.x - 10, d.y - 50, d.x - 10, d.y - 150, d.x - 6, d.y - 200); c.lineTo(d.x + 6, d.y - 200); c.bezierCurveTo(d.x + 10, d.y - 150, d.x + 10, d.y - 50, d.x + 24, d.y); c.fill(); c.fillStyle = '#2c4a2a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(d.x + Math.cos(i * 1.2) * 56, d.y - 200 + Math.sin(i * 2.3) * 36, 54, 34, 0, 0, TAU); c.fill(); } },
    fern(c, d, t) { c.strokeStyle = '#3e6a2e'; c.lineWidth = 3; const w = Math.sin(t * .03 + d.x) * 4; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(d.x, d.y); c.quadraticCurveTo(d.x + i * 7, d.y - 30, d.x + i * 16 + w, d.y - 14 - (3 - Math.abs(i)) * 7); c.stroke(); } },
    shroom(c, d) { c.fillStyle = '#d8d0b8'; c.fillRect(d.x - 3, d.y - 16, 6, 16); c.fillStyle = '#8a3a2a'; c.beginPath(); c.arc(d.x, d.y - 16, 13, Math.PI, 0); c.fill(); },
    capShroom(c, d, t) { const sq = 1; c.fillStyle = '#c8e8d8'; c.fillRect(d.x - 7, d.y - 18, 14, 18); c.fillStyle = '#2dd4a0'; c.beginPath(); c.ellipse(d.x, d.y - 18, 30 * sq, 15 / sq, 0, Math.PI, 0); c.fill(); Paint.glow(c, d.x, d.y - 22, 26, '#a0ffda'); Light.add(d.x, d.y - 24, 90, '#a0ffda', .7); },
    glowshroom(c, d, t) { const p = .7 + Math.sin(t * .05 + d.x) * .2; for (let i = -1; i <= 1; i++) { const x = d.x + i * 15, h = 14 + (i + 1) * 7; c.fillStyle = '#a8e8d8'; c.fillRect(x - 2, d.y - h, 4, h); c.fillStyle = '#2dd4bf'; c.beginPath(); c.arc(x, d.y - h, 9, Math.PI, 0); c.fill(); } Light.add(d.x, d.y - 24, 110, '#2dd4bf', p); },
    ruinArch(c, d) { c.fillStyle = '#4a5048'; c.fillRect(d.x - 54, d.y - 110, 18, 110); c.fillRect(d.x + 36, d.y - 74, 18, 74); c.beginPath(); c.arc(d.x, d.y - 110, 54, Math.PI, 1.7 * Math.PI); c.lineTo(d.x + 16, d.y - 110); c.arc(d.x, d.y - 110, 36, 1.7 * Math.PI, Math.PI, true); c.fill(); c.fillStyle = '#3e6a2e'; c.fillRect(d.x - 56, d.y - 120, 22, 7); c.strokeStyle = '#7fffb0'; c.lineWidth = 1; c.strokeRect(d.x - 50, d.y - 70, 10, 20); },
    waterfall(c, d, t) { const h = d.h * TILE, w = 52; c.fillStyle = 'rgba(120,200,235,.5)'; c.fillRect(d.x - w / 2, d.y, w, h); c.strokeStyle = 'rgba(230,250,255,.65)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = d.x - w / 2 + 6 + i * 8, o = (t * 5 + i * 37) % 60; for (let y = o; y < h; y += 60) { c.beginPath(); c.moveTo(x, d.y + y); c.lineTo(x, d.y + y + 26); c.stroke(); } } if (G.time % 4 === 0) VFX.add(d.x + U.rand(-w / 2, w / 2), d.y + h, U.rand(-1.5, 1.5), U.rand(-2.6, -.8), '#cfefff', 18, 7, 3, .08); },
    lavafall(c, d, t) { const h = d.h * TILE, w = 64; const g = c.createLinearGradient(d.x - w / 2, 0, d.x + w / 2, 0); g.addColorStop(0, '#b82206'); g.addColorStop(.5, '#ffb040'); g.addColorStop(1, '#b82206'); c.fillStyle = g; c.fillRect(d.x - w / 2, d.y, w, h); c.strokeStyle = 'rgba(255,240,180,.8)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = d.x - 22 + i * 11, o = (t * 3 + i * 53) % 90; for (let y = o; y < h; y += 90) { c.beginPath(); c.moveTo(x, d.y + y); c.lineTo(x, d.y + y + 38); c.stroke(); } } Light.add(d.x, d.y + h * .5, 340, '#ff5a10', 1); if (G.time % 3 === 0) VFX.add(d.x + U.rand(-w / 2, w / 2), d.y + h, U.rand(-2, 2), U.rand(-5, -2), '#ffb040', 26, 4, 1, .12); },
    roots(c, d) { c.strokeStyle = '#2a2016'; c.lineWidth = 16; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(d.x + i * 26, d.y - 130); c.quadraticCurveTo(d.x + i * 42, d.y - 40, d.x + i * 72, d.y); c.stroke(); } },
    tent(c, d) { c.fillStyle = '#7a5a3a'; c.beginPath(); c.moveTo(d.x - 52, d.y); c.lineTo(d.x, d.y - 62); c.lineTo(d.x + 52, d.y); c.fill(); c.fillStyle = '#2a1e14'; c.beginPath(); c.moveTo(d.x - 14, d.y); c.lineTo(d.x, d.y - 40); c.lineTo(d.x + 14, d.y); c.fill(); },
    ribcage(c, d) { c.strokeStyle = '#d8c8a8'; c.lineWidth = 7; c.lineCap = 'round'; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(d.x + i * 26 - 80, d.y); c.quadraticCurveTo(d.x + i * 26 - 60, d.y - 90 - Math.sin(i * .9) * 30, d.x + i * 26 - 40, d.y - 66); c.stroke(); } c.lineWidth = 9; c.beginPath(); c.moveTo(d.x - 100, d.y - 10); c.lineTo(d.x + 110, d.y - 16); c.stroke(); },
    pillarS(c, d) { c.fillStyle = '#6a5436'; c.fillRect(d.x - 18, d.y - 150, 36, 150); c.fillStyle = '#8a7048'; c.fillRect(d.x - 24, d.y - 158, 48, 10); c.fillStyle = '#4a3a22'; for (let i = 0; i < 5; i++) c.fillRect(d.x - 14, d.y - 138 + i * 26, 10, 12); },
    settlement(c, d) { c.fillStyle = '#8a6a44'; c.fillRect(d.x - 90, d.y - 60, 66, 60); c.fillRect(d.x + 30, d.y - 80, 80, 80); c.fillStyle = '#2a1e14'; c.fillRect(d.x - 74, d.y - 34, 16, 34); c.fillRect(d.x + 60, d.y - 40, 18, 40); c.fillStyle = '#6a2a1e'; c.fillRect(d.x - 96, d.y - 66, 80, 6); },
    templeFront(c, d) { c.fillStyle = '#7a6444'; c.fillRect(d.x - 150, d.y - 190, 300, 190); c.fillStyle = '#94784e'; c.beginPath(); c.moveTo(d.x - 170, d.y - 190); c.lineTo(d.x, d.y - 260); c.lineTo(d.x + 170, d.y - 190); c.fill(); c.fillStyle = '#4a3a22'; for (let i = 0; i < 6; i++) c.fillRect(d.x - 134 + i * 52, d.y - 182, 18, 182); Light.add(d.x, d.y - 100, 170, '#33ddff', .5); },
    columnT(c, d) { c.fillStyle = '#5a4a30'; c.fillRect(d.x - 16, d.y - 280, 32, 280); c.fillStyle = '#33ddff'; for (let i = 0; i < 4; i++) c.fillRect(d.x - 2, d.y - 240 + i * 56, 4, 20); },
    banner(c, d) { c.fillStyle = '#3a2a1a'; c.fillRect(d.x - 2, d.y - 130, 5, 130); c.fillStyle = '#c23a1e'; c.fillRect(d.x + 3, d.y - 128, 44, 62); },
    iceSpire(c, d) { c.fillStyle = '#7ab0d0'; c.beginPath(); c.moveTo(d.x - 36, d.y); c.lineTo(d.x - 8, d.y - 130); c.lineTo(d.x + 12, d.y - 70); c.lineTo(d.x + 24, d.y - 100); c.lineTo(d.x + 40, d.y); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(d.x - 16, d.y); c.lineTo(d.x - 8, d.y - 130); c.lineTo(d.x, d.y); c.fill(); },
    radioMast(c, d) { c.strokeStyle = '#2a3a4a'; c.lineWidth = 4; c.beginPath(); c.moveTo(d.x - 26, d.y); c.lineTo(d.x, d.y - 220); c.lineTo(d.x + 26, d.y); for (let i = 1; i < 6; i++) { c.moveTo(d.x - 26 + i * 4.4, d.y - i * 36); c.lineTo(d.x + 26 - i * 4.4, d.y - i * 36); } c.stroke(); if ((Date.now() >> 9) & 1) Light.add(d.x, d.y - 220, 90, '#ff3322', .9); },
    labRack(c, d) { c.fillStyle = '#26384a'; c.fillRect(d.x - 26, d.y - 90, 52, 90); for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#2dd4bf' : '#ff5544'; c.fillRect(d.x - 18, d.y - 82 + i * 15, 10, 4); c.fillStyle = '#16222e'; c.fillRect(d.x, d.y - 84 + i * 15, 18, 9); } },
    lavaRock(c, d) { c.fillStyle = '#2a1a18'; c.beginPath(); c.moveTo(d.x - 40, d.y); c.lineTo(d.x - 16, d.y - 54); c.lineTo(d.x + 18, d.y - 40); c.lineTo(d.x + 40, d.y); c.fill(); c.strokeStyle = '#ff5a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(d.x - 12, d.y - 40); c.lineTo(d.x, d.y - 16); c.lineTo(d.x - 6, d.y); c.stroke(); },
    ruinPillarV(c, d) { c.fillStyle = '#342626'; c.fillRect(d.x - 16, d.y - 120, 32, 120); c.fillStyle = '#2a1c1c'; c.beginPath(); c.moveTo(d.x - 22, d.y - 118); c.lineTo(d.x + 4, d.y - 150); c.lineTo(d.x + 22, d.y - 118); c.fill(); c.fillStyle = '#ff7a18'; c.fillRect(d.x - 6, d.y - 96, 12, 3); c.fillRect(d.x - 6, d.y - 80, 12, 3); },
    bridgeRuin(c, d) { c.fillStyle = '#3a2a24'; c.fillRect(d.x - 60, d.y - 70, 22, 70); c.fillRect(d.x + 60, d.y - 54, 22, 54); },
    bridgePier(c, d) { c.fillStyle = '#2a1e1a'; c.fillRect(d.x - 18, d.y - 140, 36, 150); c.fillStyle = '#ff5a10'; c.fillRect(d.x - 18, d.y - 8, 36, 3); },
    forgeDoor(c, d, t) { c.fillStyle = '#1a1012'; c.fillRect(d.x - 80, d.y - 180, 160, 180); c.fillStyle = '#ff5a10'; c.fillRect(d.x - 56, d.y - 150, 112, 150); c.fillStyle = '#0c0606'; for (let i = 0; i < 5; i++) c.fillRect(d.x - 56 + i * 24, d.y - 150, 12, 150); Light.add(d.x, d.y - 80, 300, '#ff5a10', 1); },
    furnace(c, d, t) { c.fillStyle = '#241816'; c.fillRect(d.x - 36, d.y - 100, 72, 100); c.fillRect(d.x - 16, d.y - 150, 32, 50); const f = .6 + Math.sin(t * .2 + d.x) * .25; c.fillStyle = U.rgba('#ff7a18', f + .2); c.fillRect(d.x - 24, d.y - 44, 48, 34); c.fillStyle = '#ffd060'; c.fillRect(d.x - 14, d.y - 26, 28, 16); if (G.time % 12 === 0) VFX.add(d.x, d.y - 150, U.rand(-.5, .5), -1.4, '#555', 50, 12, 3, 0); },
    boreRig(c, d, t) { c.strokeStyle = '#2a2230'; c.lineWidth = 8; c.beginPath(); c.moveTo(d.x - 90, d.y); c.lineTo(d.x - 30, d.y - 240); c.lineTo(d.x + 30, d.y - 240); c.lineTo(d.x + 90, d.y); c.stroke(); c.lineWidth = 3; c.setLineDash([12, 12]); c.lineDashOffset = -t * .4; c.strokeStyle = '#ff2a00'; c.beginPath(); c.moveTo(d.x, d.y - 240); c.lineTo(d.x, d.y); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; }
};

/* ------------------------------ WEATHER -------------------------------- */
const Weather = {
    parts: [], kind: null,
    set(kind) {
        this.kind = kind; this.parts = [];
        const n = [40, 90, 160][Settings.quality];
        for (let i = 0; i < n; i++) this.parts.push({ x: Math.random() * VW, y: Math.random() * VH, z: U.rand(.4, 1.2), s: Math.random() * TAU });
    },
    draw(c, cam, t, storm) {
        const K = this.kind; if (!K) return;
        c.save();
        for (const p of this.parts) {
            let vx = 0, vy = 0, col = '#fff', size = 2, a = .7, streak = 0;
            if (K === 'ash') { vx = -.6 - storm * 3; vy = .7; col = '#b0a8a0'; size = 2.2 * p.z; a = .5; }
            else if (K === 'motes') { vx = Math.sin(t * .01 + p.s) * .3; vy = Math.cos(t * .013 + p.s) * .3 - .1; col = '#d8ffb0'; size = 2 * p.z; a = .35 + Math.sin(t * .03 + p.s) * .3; }
            else if (K === 'sand') { vx = -2.4 - storm * 15; vy = .35; col = '#e0c080'; size = 1.6 * p.z; a = .28 + storm * .4; streak = storm * 26; }
            else if (K === 'snow') { vx = -.8 - storm * 11; vy = 1.5 + storm * 3; col = '#ffffff'; size = 2.6 * p.z; a = .75; streak = storm * 12; }
            else if (K === 'embers') { vx = .4 + Math.sin(t * .02 + p.s) * .6; vy = -1.2 - (G.eruption ? 1.4 : 0); col = U.chance(.002) ? '#fff' : '#ff8a30'; size = 2 * p.z; a = .75; }
            else if (K === 'rain') { vx = -1.8; vy = 14; col = '#a0c0e0'; size = 1.2; a = .45; streak = 13; }
            p.x += vx * p.z; p.y += vy * p.z;
            const sx = ((p.x - cam.x * p.z * .5) % VW + VW) % VW, sy = ((p.y - cam.y * p.z * .3) % VH + VH) % VH;
            c.globalAlpha = U.clamp(a, 0, 1); c.fillStyle = col;
            if (streak) { c.strokeStyle = col; c.lineWidth = size; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - vx * 1.2, sy - vy * 1.2); c.stroke(); } else c.fillRect(sx, sy, size, size);
        }
        c.restore();
    }
};

/* --------------------------- ATMOSPHERE LAYERS --------------------------- */
const Atmos = {
    fogCol: { city: '#b0a090', forest: '#b8f0d0', desert: '#f0d4a0', ice: '#dcecf8', volcano: '#ff6a24' },
    fg: {},
    draw(c, cam, t, L) {
        if (Settings.quality === 0) return;
        const col = L.bgVoid ? '#ff0a00' : this.fogCol[L.region] || '#fff', n = Settings.quality === 2 ? 6 : 3, g = Glow.get(col);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
            const sp = .25 + i * .07, w = 520 + i * 90, x = ((t * sp + i * 311 - cam.x * (.5 + i * .08)) % (VW + w * 2) + VW + w * 2) % (VW + w * 2) - w, y = VH * (.52 + i * .07) + Math.sin(t * .006 + i) * 22;
            c.globalAlpha = (L.indoors ? .05 : .09) + (L.region === 'volcano' ? .05 : 0); c.drawImage(g, x - w / 2, y - 60, w, 120);
        }
        c.restore();
    },
    build(id) {
        if (this.fg[id]) return this.fg[id];
        const cv = U.canvas(BG_W / 2, VH / 2), x = cv.getContext('2d'); x.scale(.5, .5);
        const R = U.mulberry(id.length * 91), dark = { city: '#0c0c10', forest: '#071410', desert: '#2a1a0c', ice: '#16283a', volcano: '#0c0404', forge: '#0c0504', core: '#08040c' }[id] || '#000';
        x.fillStyle = dark; x.strokeStyle = dark;
        for (let i = 0; i < 14; i++) {
            const px = R() * BG_W, h = 22 + R() * 54, w = 16 + R() * 40;
            if (id === 'forest') { x.beginPath(); x.ellipse(px, -8, 100 + R() * 70, h, 0, 0, TAU); x.fill(); x.lineWidth = 2; x.beginPath(); x.moveTo(px, 10); x.quadraticCurveTo(px + 8, h + 30, px - 4, h + 58); x.stroke(); }
            else if (id === 'city') { x.lineWidth = 2.4; x.beginPath(); x.moveTo(px, -4); x.quadraticCurveTo(px + 40, h + 24, px + 120, -4); x.stroke(); x.fillRect(px + 200, -4, w, h * .6); }
            else { x.beginPath(); x.moveTo(px - w, -4); x.lineTo(px, h + 12); x.lineTo(px + w, -4); x.fill(); }
            if (i % 2) { x.beginPath(); x.moveTo(px - w * 1.8, VH + 4); x.lineTo(px - w * .4, VH - h * .55); x.lineTo(px + w * .7, VH - h * .36); x.lineTo(px + w * 1.8, VH + 4); x.fill(); }
        }
        return this.fg[id] = cv;
    },
    foreground(c, cam, L) {
        if (Settings.quality === 0) return;
        const img = this.build(L.bg), off = -((cam.x * 1.5) % BG_W + BG_W) % BG_W;
        c.save(); c.globalAlpha = .9; c.drawImage(img, off, 0, BG_W, VH); c.drawImage(img, off + BG_W, 0, BG_W, VH); c.restore();
    }
};

/* ---------------------------- POST EFFECTS ------------------------------ */
const Post = {
    scratch: null, sctx: null,
    vignette: null,
    init() {
        const c = this.vignette = U.canvas(VW / 2, VH / 2), x = c.getContext('2d');
        const g = x.createRadialGradient(VW / 4, VH / 4, VH * .2, VW / 4, VH / 4, VW * .32); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
        x.fillStyle = g; x.fillRect(0, 0, VW / 2, VH / 2);
    },
    bl: null, blx: null,
    /** Bloom: a small copy multiplied by itself keeps only the brights, then adds back softly. */
    bloom(ctx, canvas) {
        if (Settings.quality < 2 || this.noBloom) return;
        if (!this.bl) { this.bl = U.canvas(320, 180); this.blx = this.bl.getContext('2d'); }
        const b = this.blx; b.globalCompositeOperation = 'copy'; b.drawImage(canvas, 0, 0, 320, 180);
        b.globalCompositeOperation = 'multiply'; b.drawImage(this.bl, 0, 0); b.drawImage(this.bl, 0, 0);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .46; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(this.bl, 0, 0, VW, VH); ctx.restore();
    },
    /** Heat shimmer: slices the lower frame and offsets each row with a travelling sine. */
    heat(ctx, canvas, amt, t) {
        if (Settings.quality < 2 || amt < .05) return;
        if (!this.scratch || this.scratch.width !== canvas.width || this.scratch.height !== canvas.height) { this.scratch = U.canvas(canvas.width, canvas.height); this.sctx = this.scratch.getContext('2d'); }
        this.sctx.drawImage(canvas, 0, 0);
        const sy = canvas.height / VH, sx = canvas.width / VW, rowH = 8;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (let y = VH * .35; y < VH; y += rowH) {
            const k = (y - VH * .35) / (VH * .65), o = Math.sin(y * .05 + t * .13) * amt * 3.2 * k;
            ctx.drawImage(this.scratch, 0, y * sy, canvas.width, rowH * sy + 1, o * sx, y * sy, canvas.width, rowH * sy + 1);
        }
        ctx.restore();
    }
};
