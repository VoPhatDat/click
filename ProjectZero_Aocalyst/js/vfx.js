'use strict';
/**
 * VFX: pooled particles, timed effects, floating combat text and the light map.
 * Glow sprites are pre-rendered: shadowBlur made the original game slow.
 */
const Glow = {
    cache: {},
    get(col) {
        if (this.cache[col]) return this.cache[col];
        const c = U.canvas(64, 64), x = c.getContext('2d');
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, U.rgba(col, 1)); g.addColorStop(.3, U.rgba(col, .45)); g.addColorStop(1, U.rgba(col, 0));
        x.fillStyle = g; x.fillRect(0, 0, 64, 64);
        return this.cache[col] = c;
    }
};

const MAX_PARTS = [160, 320, 520];
const VFX = {
    parts: [], n: 0, fx: [], floaters: [],
    reset() { this.n = 0; this.fx = []; this.floaters = []; },
    /** kinds: 0 square, 1 glow, 2 streak, 3 smoke, 4 shard */
    add(x, y, vx, vy, col, life, size, kind = 0, grav = .1, drag = 1) {
        if (this.n >= MAX_PARTS[Settings.quality]) return;
        let p = this.parts[this.n];
        if (!p) p = this.parts[this.n] = {};
        this.n++;
        p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.col = col; p.life = p.max = life; p.size = size; p.kind = kind; p.grav = grav; p.drag = drag; p.rot = Math.random() * TAU;
    },
    tick() {
        const P = this.parts;
        for (let i = 0; i < this.n;) {
            const p = P[i];
            p.vy += p.grav; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx; p.y += p.vy;
            if (--p.life <= 0) { this.n--; P[i] = P[this.n]; P[this.n] = p; continue; }
            i++;
        }
        for (const f of this.fx) f.t++;
        this.fx = this.fx.filter(f => f.t < f.life);
        for (const f of this.floaters) { f.t++; f.y += f.vy; f.vy *= .94; }
        this.floaters = this.floaters.filter(f => f.t < f.life);
    },
    draw(ctx) {
        const c = G.cam, x0 = c.x - 50, x1 = c.x + VW / c.zoom + 50, y0 = c.y - 50, y1 = c.y + VH / c.zoom + 50;
        for (const f of this.fx) if (f.below) f.draw(ctx, f.t / f.life, f);
        for (let i = 0; i < this.n; i++) {
            const p = this.parts[i];
            if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
            const k = p.life / p.max;
            if (p.kind === 1) {
                ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
                const s = p.size * (1 + (1 - k)); ctx.drawImage(Glow.get(p.col), p.x - s, p.y - s, s * 2, s * 2);
                ctx.globalCompositeOperation = 'source-over';
            } else if (p.kind === 2) {
                ctx.strokeStyle = p.col; ctx.globalAlpha = k; ctx.lineWidth = p.size;
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); ctx.stroke();
            } else if (p.kind === 3) {
                ctx.fillStyle = p.col; ctx.globalAlpha = k * .35; const s = p.size * (1.8 - k);
                ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill();
            } else if (p.kind === 4) {
                ctx.fillStyle = p.col; ctx.globalAlpha = Math.min(1, k * 2);
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + p.life * .2);
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .6); ctx.restore();
            } else {
                ctx.fillStyle = p.col; ctx.globalAlpha = k; ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
        for (const f of this.fx) if (!f.below) { ctx.save(); f.draw(ctx, f.t / f.life, f); ctx.restore(); }
        ctx.globalAlpha = 1;
    },
    drawFloaters(ctx) {
        if (!Settings.dmgNumbers) return;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const f of this.floaters) {
            const k = 1 - f.t / f.life, pop = f.t < 6 ? 1 + (6 - f.t) * .09 : 1;
            ctx.globalAlpha = Math.min(1, k * 2);
            ctx.font = `bold ${Math.round(f.size * pop)}px "Courier New", monospace`;
            ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(f.text, f.x, f.y);
            ctx.fillStyle = f.col; ctx.fillText(f.text, f.x, f.y);
        }
        ctx.globalAlpha = 1;
    },
    effect(life, draw, below = false) { this.fx.push({ t: 0, life, draw, below }); },
    text(x, y, text, col = '#fff', size = 18, life = 42) {
        if (this.floaters.length > 40) this.floaters.shift();
        this.floaters.push({ x: x + U.rand(-8, 8), y, text: tr(text), col, size, life, t: 0, vy: -2.4 });
    },
    burst(x, y, col, n, spd = 5, life = 30, size = 3, kind = 0) {
        for (let i = 0; i < n; i++) {
            const a = U.rand(0, TAU), s = U.rand(spd * .3, spd);
            this.add(x, y, Math.cos(a) * s, Math.sin(a) * s, col, U.rand(life * .5, life), U.rand(size * .6, size * 1.4), kind);
        }
    },
    hit(x, y, col, n = 8) {
        for (let i = 0; i < n; i++) { const a = U.rand(0, TAU), s = U.rand(2, 8); this.add(x, y, Math.cos(a) * s, Math.sin(a) * s, col, U.randi(8, 18), 2, 2, .12, .92); }
        this.add(x, y, 0, 0, col, 9, 26, 1, 0);
    },
    dust(x, y, n = 6, col = '#9a8f80') { for (let i = 0; i < n; i++) this.add(x + U.rand(-10, 10), y - 2, U.rand(-1.6, 1.6), U.rand(-1, -.1), col, U.randi(18, 36), U.rand(5, 10), 3, 0, .96); },
    debris(x, y, w, col) { for (let i = 0; i < 16; i++) this.add(x + U.rand(-w / 2, w / 2), y, U.rand(-3, 3), U.rand(-6, 0), col, U.randi(26, 50), U.rand(4, 9), 4, .35); },
    smoke(x, y, col = '#333', n = 1, s = 14) { for (let i = 0; i < n; i++) this.add(x + U.rand(-8, 8), y + U.rand(-8, 8), U.rand(-.5, .5), U.rand(-1.4, -.3), col, U.randi(30, 60), s, 3, 0); },
    ring(x, y, r, col, life = 22, w = 8) {
        this.effect(life, (c, k) => {
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.strokeStyle = col; c.lineWidth = w * (1 - k) + 1;
            c.beginPath(); c.arc(x, y, r * U.easeOut(k), 0, TAU); c.stroke();
        });
    },
    /** Flat ground shockwave that reads clearly as "stay off the ground here". */
    groundWave(x, y, r, col, life = 26) {
        this.effect(life, (c, k) => {
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.strokeStyle = col; c.lineWidth = 6 * (1 - k) + 1;
            c.beginPath(); c.ellipse(x, y, r * U.easeOut(k), r * .22 * U.easeOut(k), 0, 0, TAU); c.stroke();
        });
    },
    beam(x, y, ang, len, w, col, life = 16) {
        this.effect(life, (c, k) => {
            const t = Math.sin(k * Math.PI);
            c.translate(x, y); c.rotate(ang); c.globalCompositeOperation = 'lighter';
            c.fillStyle = col; c.globalAlpha = .75; c.fillRect(0, -w / 2 * t, len, w * t);
            c.fillStyle = '#fff'; c.globalAlpha = 1; c.fillRect(0, -w / 6 * t, len, w / 3 * t);
        });
    },
    /** Crescent slash aligned with the attack box. */
    slash(x, y, r, facing, col, a0 = -1.2, a1 = 1.2, life = 11, thick = 1) {
        this.effect(life, (c, k) => {
            const e = U.easeOut(k);
            c.translate(x, y); c.scale(facing, 1); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k * k;
            c.fillStyle = col; c.beginPath();
            const a = a0 + (a1 - a0) * Math.min(1, e * 1.3);
            c.arc(0, 0, r, a0, a); c.arc(r * .16 * thick, 0, r * .84, a, a0, true); c.closePath(); c.fill();
        });
    },
    trail(pts, col, w = 8) {
        // Weapon ribbon drawn straight from the recent tip history.
        if (pts.length < 2) return;
        const copy = pts.map(p => ({ x: p.x, y: p.y, bx: p.bx, by: p.by }));
        this.effect(8, (c, k) => {
            c.globalCompositeOperation = 'lighter'; c.fillStyle = col; c.globalAlpha = (1 - k) * .55;
            c.beginPath(); c.moveTo(copy[0].x, copy[0].y);
            for (let i = 1; i < copy.length; i++) c.lineTo(copy[i].x, copy[i].y);
            for (let i = copy.length - 1; i >= 0; i--) c.lineTo(U.lerp(copy[i].x, copy[i].bx, .6), U.lerp(copy[i].y, copy[i].by, .6));
            c.closePath(); c.fill();
        });
    },
    lightning(x1, y1, x2, y2, col = '#aee9ff', life = 10) {
        const pts = []; const n = 7;
        for (let i = 0; i <= n; i++) pts.push({ x: U.lerp(x1, x2, i / n) + (i % n ? U.rand(-14, 14) : 0), y: U.lerp(y1, y2, i / n) + (i % n ? U.rand(-14, 14) : 0) });
        this.effect(life, (c, k) => {
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.strokeStyle = col; c.lineWidth = 3;
            c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
        });
    }
};

/* ---------------------------- LIGHT MAP ------------------------------- */
const Light = {
    list: [], canvas: null, ctx: null, W: 320, H: 180,
    init() { this.canvas = U.canvas(this.W, this.H); this.ctx = this.canvas.getContext('2d'); },
    add(x, y, r, col, a = 1) { if (this.list.length < 64) this.list.push({ x, y, r, col, a }); },
    /** Multiplies the scene by a low-resolution light buffer. World coordinates in, screen coordinates out. */
    apply(ctx, ambient, cam) {
        if (Settings.quality === 0) { this.list.length = 0; return; }
        const L = this.ctx, sx = this.W / VW, zoom = cam.zoom;
        L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.fillStyle = ambient; L.fillRect(0, 0, this.W, this.H);
        L.globalCompositeOperation = 'lighter';
        for (const l of this.list) {
            const px = (l.x - cam.x) * zoom * sx, py = (l.y - cam.y) * zoom * sx, r = l.r * zoom * sx;
            if (px < -r || px > this.W + r || py < -r || py > this.H + r) continue;
            L.globalAlpha = Math.min(1, l.a); L.drawImage(Glow.get(l.col), px - r, py - r, r * 2, r * 2);
        }
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.canvas, 0, 0, VW, VH); ctx.restore();
        if (Settings.quality === 2) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (const l of this.list) {
                const px = (l.x - cam.x) * zoom, py = (l.y - cam.y) * zoom, r = l.r * zoom * .55;
                if (px < -r || px > VW + r || py < -r || py > VH + r) continue;
                ctx.globalAlpha = Math.min(.16, l.a * .16); ctx.drawImage(Glow.get(l.col), px - r, py - r, r * 2, r * 2);
            }
            ctx.restore();
        }
        this.list.length = 0;
    }
};
