'use strict';
/**
 * WORLD: tile grid, slopes, dynamic solids and shared physics.
 * Entities use x = centre, y = feet, w/h = hitbox size, as in the original game.
 */
const T = { E: 0, S: 1, O: 2, R45: 3, L45: 4, R22A: 5, R22B: 6, L22A: 7, L22B: 8 };
const isSlope = t => t >= 3 && t <= 8;
/** Surface height inside a slope tile, 0..1 measured up from the tile bottom. */
function slopeH(t, f) {
    switch (t) {
        case T.R45: return f; case T.L45: return 1 - f;
        case T.R22A: return f * .5; case T.R22B: return .5 + f * .5;
        case T.L22A: return 1 - f * .5; case T.L22B: return .5 - f * .5;
    }
    return 1;
}

/** Moving platforms, gates, crumbling floors and breakable walls. Coordinates are top-left. */
class Dyn {
    constructor(o) {
        Object.assign(this, { x: 0, y: 0, w: 64, h: 16, oneway: false, active: true, kind: 'block', dx: 0, dy: 0, state: 0, timer: 0 }, o);
        this.x0 = this.x; this.y0 = this.y;
    }
    tick(t) {
        const ox = this.x, oy = this.y;
        if (this.kind === 'mover') {
            // Position is a pure function of time, so playtests can replay it exactly.
            const u = .5 - .5 * Math.cos((t + (this.phase || 0)) / this.period * TAU);
            this.x = this.x0 + (this.tx - this.x0) * u; this.y = this.y0 + (this.ty - this.y0) * u;
        } else if (this.kind === 'crumble') {
            if (this.state === 1) {
                if (--this.timer <= 0) { this.state = 2; this.timer = this.respawn || 220; this.active = false; this.vy = 0; Sound.at('crumble', this.x); VFX.debris(this.x + this.w / 2, this.y + 8, this.w, G.level.theme.debris); }
            } else if (this.state === 2) {
                this.vy += .5; this.y += this.vy;
                if (--this.timer <= 0) { if (this.respawn === 0) { this.dead = true; } else { this.state = 0; this.active = true; this.y = this.y0; } }
            }
        } else if (this.kind === 'gate') {
            const target = this.open ? this.y0 - this.h + 8 : this.y0;
            this.y += U.clamp(target - this.y, -5, 5);
            this.active = Math.abs(this.y - (this.y0 - this.h + 8)) > 6;
        } else if (this.kind === 'sinking') {
            const pressed = G.player && G.player.riding === this;
            this.y += pressed ? 1.2 : U.clamp(this.y0 - this.y, -1, 1);
        }
        this.dx = this.x - ox; this.dy = this.y - oy;
    }
    /** Scripted plates ignore footsteps and only fall when a boss script forces them. */
    trigger(force) {
        if (this.kind === 'crumble' && this.state === 0 && (force || !this.scripted)) { this.state = 1; this.timer = this.delay || 40; Sound.at('crumble', this.x, { v: .4 }); }
    }
    damage(n) {
        if (this.kind !== 'breakable') return false;
        this.hp -= n;
        VFX.hit(this.x + this.w / 2, this.y + this.h / 2, G.level.theme.debris, 6);
        if (this.hp <= 0) { this.dead = true; this.active = false; VFX.debris(this.x + this.w / 2, this.y + this.h / 2, this.w, G.level.theme.debris); Sound.at('crumble', this.x, { v: 1 }); G.flags['break_' + this.id] = true; if (this.onBreak) this.onBreak(); }
        return true;
    }
}

class Level {
    constructor(def) {
        Object.assign(this, def);
        this.pw = this.w * TILE; this.ph = this.h * TILE;
        this.chunks = new Map();
    }
    tile(tx, ty) { if (tx < 0 || tx >= this.w) return T.S; if (ty < 0) return T.E; if (ty >= this.h) return T.E; return this.grid[ty * this.w + tx]; }
    tileAt(px, py) { return this.tile(Math.floor(px / TILE), Math.floor(py / TILE)); }
    /** Height of the first walkable surface at or below py, or null within `max` pixels. */
    surfaceBelow(px, py, max = 400) {
        const tx = Math.floor(px / TILE);
        for (let ty = Math.floor(py / TILE); ty * TILE < py + max; ty++) {
            const t = this.tile(tx, ty);
            if (t === T.S || t === T.O) { const top = ty * TILE; if (top >= py - 1) return top; }
            else if (isSlope(t)) { const f = (px - tx * TILE) / TILE; return ty * TILE + TILE * (1 - slopeH(t, f)); }
        }
        return null;
    }
    solidAt(px, py) { return this.tileAt(px, py) === T.S; }
    /** Line of sight test used by AI and projectiles. */
    los(x1, y1, x2, y2) {
        const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 16);
        for (let i = 1; i < n; i++) if (this.solidAt(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n)) return false;
        return true;
    }
}

const Phys = {
    /** Advances an entity with tile and dynamic collision. Sets e.grounded, e.onWall, e.riding. */
    move(e) {
        const L = G.level;
        if (e.riding) {
            const r = e.riding;
            if (r.active && !r.dead) { e.x += r.dx; e.y = r.y; }
            e.riding = null;
        }
        const wasGround = e.grounded;
        e.onWall = 0;
        const steps = Math.max(1, Math.ceil(Math.abs(e.vx) / 10));
        for (let i = 0; i < steps; i++) if (!this.stepX(e, e.vx / steps, L)) { e.onWall = U.sign(e.vx); e.vx = 0; break; }
        const nY = Math.max(1, Math.ceil(Math.abs(e.vy) / 14));
        e.grounded = false;
        for (let i = 0; i < nY; i++) if (this.stepY(e, e.vy / nY, L, wasGround)) break;
        const hw = e.w / 2;
        if (e.x < hw) { e.x = hw; e.vx = Math.max(0, e.vx); }
        if (e.x > L.pw - hw) { e.x = L.pw - hw; e.vx = Math.min(0, e.vx); }
    },
    stepX(e, dx, L) {
        const nx = e.x + dx, edge = nx + U.sign(dx) * e.w / 2, top = e.y - e.h, ft = e.y - 11;
        const tx = Math.floor(edge / TILE);
        for (let ty = Math.floor((top + 1) / TILE); ty <= Math.floor(ft / TILE); ty++) {
            if (L.tile(tx, ty) === T.S) {
                // Solid tile at the top of a slope: the surface is reachable, so it is not a wall.
                const curT = L.tileAt(e.x, e.y - 2) || L.tileAt(e.x, e.y + 2);
                if (isSlope(curT) && ty * TILE >= e.y - 12) continue;
                return false;
            }
        }
        for (const d of L.dyn) {
            if (!d.active || d.oneway) continue;
            if (nx + e.w / 2 > d.x && nx - e.w / 2 < d.x + d.w && e.y - 1 > d.y && top < d.y + d.h) {
                if (e.y - d.y < 11 && !d.noStep) continue;
                return false;
            }
        }
        e.x = nx; return true;
    },
    stepY(e, dy, L, wasGround) {
        const ny = e.y + dy, hw = e.w / 2 - 2;
        if (dy >= 0) {
            let land = Infinity, ride = null;
            const probe = [e.x - hw, e.x, e.x + hw];
            const from = Math.floor((e.y - 14) / TILE), to = Math.floor((ny + (wasGround ? 12 : 0)) / TILE);
            const cx = Math.floor(e.x / TILE);
            // Slopes take priority under the centre so edges of neighbouring tiles do not snag.
            for (let ty = from; ty <= to; ty++) {
                const t = L.tile(cx, ty);
                if (isSlope(t)) {
                    const top = ty * TILE + TILE * (1 - slopeH(t, (e.x - cx * TILE) / TILE));
                    if (ny >= top - (wasGround ? 12 : 0) && e.y <= top + 13) land = Math.min(land, top);
                }
            }
            if (land === Infinity) {
                for (const px of probe) {
                    const tx = Math.floor(px / TILE);
                    for (let ty = from; ty <= to; ty++) {
                        const t = L.tile(tx, ty), top = ty * TILE;
                        if (t === T.S) { if (ny >= top && e.y <= top + 8) land = Math.min(land, top); }
                        else if (t === T.O && !e.dropThrough) { if (ny >= top && e.y <= top + 2) land = Math.min(land, top); }
                    }
                }
            }
            for (const d of L.dyn) {
                if (!d.active) continue;
                if (e.x + hw > d.x && e.x - hw < d.x + d.w && ny >= d.y && e.y <= d.y + 12 + Math.max(0, d.dy)) {
                    if (d.oneway && e.dropThrough) continue;
                    if (d.y < land) { land = d.y; ride = d; }
                }
            }
            if (land !== Infinity && (ny >= land || wasGround)) {
                e.y = land; e.vy = 0; e.grounded = true; e.riding = ride;
                if (ride && ride.kind === 'crumble' && e.isPlayer) ride.trigger();
                return true;
            }
            e.y = ny; return false;
        }
        const top = ny - e.h;
        const ty = Math.floor(top / TILE);
        for (const px of [e.x - hw, e.x, e.x + hw]) {
            if (L.tile(Math.floor(px / TILE), ty) === T.S) { e.y = (ty + 1) * TILE + e.h; e.vy = 0; return true; }
        }
        for (const d of L.dyn) {
            if (!d.active || d.oneway) continue;
            if (e.x + hw > d.x && e.x - hw < d.x + d.w && top < d.y + d.h && e.y - e.h >= d.y + d.h - 2) { e.y = d.y + d.h + e.h; e.vy = 0; return true; }
        }
        e.y = ny; return false;
    }
};
