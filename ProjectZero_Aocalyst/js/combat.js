'use strict';
/** COMBAT: damage resolution, projectiles, telegraphs, fields and environmental hazards. */
const Combat = {
    targets() { return G.enemies.filter(e => !e.dead && !e.untargetable); },
    nearest(x, y, r, facing, needLos) {
        let best = null, bd = r * r;
        for (const e of G.enemies) {
            if (e.dead || e.untargetable) continue;
            const c = e.aim ? e.aim() : { x: e.x, y: e.y - e.h / 2 };
            const dx = c.x - x, dy = c.y - y, d = dx * dx + dy * dy;
            if (d >= bd) continue;
            if (facing && dx * facing < -60) continue;
            if (needLos && !G.level.los(x, y, c.x, c.y)) continue;
            best = e; bd = d;
        }
        return best;
    },
    targetsNear(x, y, r) {
        return this.targets().filter(e => Math.hypot(e.x - x, (e.y - e.h / 2) - y) < r + e.w / 2).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
    },
    targetsIn(R) {
        return G.enemies.filter(e => !e.dead && !e.untargetable && U.overlap(R, e.box()));
    },
    canStand(x, y) {
        const L = G.level;
        for (let dy = 8; dy <= 56; dy += 16) if (L.solidAt(x - 10, y - dy) || L.solidAt(x + 10, y - dy)) return false;
        for (const d of L.dyn) if (d.active && !d.oneway && x + 10 > d.x && x - 10 < d.x + d.w && y > d.y && y - 60 < d.y + d.h) return false;
        return x > 20 && x < L.pw - 20;
    },
    /** Player damage resolution. a = attack data; dmg is a multiple of attack power. */
    hit(p, t, a) {
        if (t.dead) return 0;
        let dmg = p.power * (a.dmg || 1) * (a.powerless ? 0 : 1);
        const front = t.armorFront && U.sign(p.x - t.x) === t.facing && t.state !== 'stagger';
        const behind = t.facing !== undefined && U.sign(p.x - t.x) === -t.facing;
        if (p.id === 'sable' && behind) dmg *= 1.6;
        const crit = a.forceCrit || U.chance(p.critRate + (a.crit || 0));
        if (crit) dmg *= p.critMult;
        if (front) { dmg *= .25; Sound.at('hit_metal', t.x); VFX.text(t.x, t.y - t.h - 8, 'ARMOR', '#aab', 13, 24); }
        dmg *= U.rand(.92, 1.08);
        const dir = t.x >= p.x ? 1 : -1;
        const dealt = t.hurt(dmg, { dir, kb: a.kb || 0, kby: a.kby || 0, stag: front ? 0 : (a.stag || 10), crit, src: p });
        if (a.element !== undefined) this.applyElement(p, t, a.element);
        if (a.allElements) { [0, 1, 2].forEach(i => { if (!t.dead) this.applyElement(p, t, i); }); }
        if (a.lifesteal) p.heal(Math.max(1, dealt * .12));
        const col = a.col || '#fff', hx = t.x + U.rand(-t.w * .3, t.w * .3), hy = t.y - t.h * U.rand(.3, .75);
        VFX.hit(hx, hy, col, crit ? 12 : 7);
        Sound.at(a.hit || 'hit_l', t.x); if (crit) Sound.at('crit', t.x, { v: .7 });
        if (!a.ult) {
            if ((a.stag || 0) >= 24) G.hitstop = Math.max(G.hitstop, crit ? 6 : 4); else G.hitstop = Math.max(G.hitstop, 1);
            p.energy = Math.min(p.maxEnergy, p.energy + 1.6);
            p.gainUlt(Math.min(3, dealt / (p.power * 2.2)));
        }
        if ((a.stag || 0) >= 24) G.addShake(3);
        return dealt;
    },
    aoe(p, x, y, R, a) {
        for (const t of this.targetsNear(x, y, R)) this.hit(p, t, a);
        for (const d of G.level.dyn) if (d.kind === 'breakable' && d.active && Math.hypot(d.x + d.w / 2 - x, d.y + d.h / 2 - y) < R) d.damage(9);
    },
    lineHit(p, x, y, ang, len, w, a) {
        const cx = Math.cos(ang), sy = Math.sin(ang);
        for (const t of this.targets()) {
            const c = t.aim ? t.aim() : { x: t.x, y: t.y - t.h / 2 }, dx = c.x - x, dy = c.y - y, along = dx * cx + dy * sy, off = Math.abs(-dx * sy + dy * cx);
            if (along > -30 && along < len && off < w / 2 + t.w / 2) this.hit(p, t, a);
        }
    },
    applyElement(p, t, el) {
        if (t.dead) return;
        const S = t.status || (t.status = {}), E = ELEMENTS[el].id, boost = p.up('m_react') ? 1.5 : 1;
        const react = (name, col) => { VFX.text(t.x, t.y - t.h - 18, name, col, 17, 40); Sound.at('explode', t.x, { v: .45 }); };
        const other = ['fire', 'frost', 'volt'].find(k => k !== E && S[k] > 0);
        if (other) {
            const pair = [E, other].sort().join('+');
            S.fire = S.frost = S.volt = 0;
            if (pair === 'fire+frost') { react('MELT', '#ffb070'); this.hit(p, t, { dmg: 2.6 * boost, stag: 30, hit: 'hit_h', col: '#ffb070' }); VFX.ring(t.x, t.y - t.h / 2, 80, '#ffb070'); }
            else if (pair === 'fire+volt') {
                react('OVERLOAD', '#ffb3ff'); VFX.ring(t.x, t.y - t.h / 2, 120, '#ffb3ff', 22, 10); G.addShake(5);
                for (const e of this.targetsNear(t.x, t.y - t.h / 2, 130)) this.hit(p, e, { dmg: 1.6 * boost, kb: 9, kby: -4, stag: 30, hit: 'hit_h', col: '#ffb3ff' });
            } else {
                react('SUPERCONDUCT', '#b8f0ff'); t.stun = Math.max(t.stun || 0, t.boss ? 20 : 80); t.shred = 300;
                this.targetsNear(t.x, t.y - t.h / 2, 200).slice(0, 4).forEach(e => { if (e !== t) { VFX.lightning(t.x, t.y - t.h / 2, e.x, e.y - e.h / 2); this.hit(p, e, { dmg: 1 * boost, stag: 30, hit: 'hit_l', col: '#b8f0ff' }); e.stun = Math.max(e.stun || 0, e.boss ? 0 : 60); } });
            }
            Save.stat('reactions', 1);
            return;
        }
        S[E] = 300;
    },
    banner(p, name, col, frames, sub) {
        G.banner = { name: tr(name), col, sub, t: 0, life: frames + 26 }; G.freeze = frames; Sound.sfx('ult'); G.addShake(8);
        VFX.ring(p.x, p.y - 40, 140, col, 24, 10);
    },
    shoot(owner, kind, x, y, vx, vy, o = {}) {
        const pr = new Proj(owner, kind, x, y, vx, vy, o); G.projs.push(pr); return pr;
    },
    /** Hostile projectile. dmg is absolute. */
    eshoot(e, kind, x, y, ang, spd, dmg, o = {}) {
        return this.shoot(e, kind, x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, Object.assign({ absDmg: dmg }, o));
    },
    /** Telegraphed attack. shape: rect, circle, cone or safe (everything except the circle hits). */
    warn(o) {
        o.max = o.t; o.fired = false;
        if (o.shape === 'rect') { if (o.w < 0) { o.x += o.w; o.w = -o.w; } if (o.h < 0) { o.y += o.h; o.h = -o.h; } }
        G.warns.push(o);
        return o;
    },
    warnHits(w) {
        const p = G.player, c = { x: p.x, y: p.y - p.h / 2 };
        if (w.shape === 'rect') return U.overlap(p.hurtBox, w);
        if (w.shape === 'circle') return Math.hypot(c.x - w.x, c.y - w.y) < w.r + 8;
        if (w.shape === 'safe') return Math.hypot(c.x - w.x, c.y - w.y) > w.r;
        if (w.shape === 'cone') {
            const a = Math.atan2(c.y - w.y, c.x - w.x);
            return Math.abs(U.normAngle(a - w.ang)) < w.spread / 2 && Math.hypot(c.x - w.x, c.y - w.y) < w.r;
        }
        return false;
    },
    tickWarns() {
        for (const w of G.warns) {
            if (--w.t === 0) {
                w.fired = true;
                if (w.dmg && this.warnHits(w)) G.player.hurt(w.dmg, { x: w.src ? w.src.x : undefined, kb: w.kb === undefined ? 7 : w.kb, kby: w.kby, unblockable: w.unblockable, owner: w.src });
                if (w.onFire) w.onFire(w);
            }
        }
        G.warns = G.warns.filter(w => w.t > 0);
    },
    drawWarns(ctx) {
        for (const w of G.warns) {
            const k = 1 - w.t / w.max, pulse = .16 + Math.abs(Math.sin(G.time * .2)) * .16 + k * .22;
            const safe = w.shape === 'safe', col = w.col || (safe ? '#00ffaa' : '#ff2a00');
            ctx.fillStyle = U.rgba(col, pulse); ctx.strokeStyle = col; ctx.lineWidth = 2;
            if (w.shape === 'rect') {
                ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeRect(w.x, w.y, w.w, w.h);
                ctx.fillStyle = U.rgba(col, .4); if (w.w > w.h) ctx.fillRect(w.x, w.y, w.w * k, w.h); else ctx.fillRect(w.x, w.y + w.h * (1 - k), w.w, w.h * k);
            } else if (w.shape === 'circle' || safe) {
                ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, TAU); ctx.fill(); ctx.stroke();
                ctx.fillStyle = U.rgba(col, .35); ctx.beginPath(); ctx.arc(w.x, w.y, w.r * k, 0, TAU); ctx.fill();
                if (safe) { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 14px "Courier New"'; ctx.fillText('SAFE ZONE', w.x, w.y); }
            } else if (w.shape === 'cone') {
                ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.arc(w.x, w.y, w.r, w.ang - w.spread / 2, w.ang + w.spread / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
        }
    },
    field(p, x, y, el, r, life) {
        G.fields.push({ kind: ['burn', 'freeze', 'tesla'][el], x, y, r, t: 0, life, owner: p, el, col: ELEMENTS[el].col });
    },
    tickFields() {
        for (const f of G.fields) {
            f.t++;
            if (f.kind === 'bastion') {
                if (f.t % 60 === 0) { VFX.ring(f.x, f.y, f.r, f.col, 20, 6); this.aoe(f.owner, f.x, f.y, f.r, { dmg: 1.2, kb: 7, stag: 30, col: f.col, hit: 'hit_metal' }); }
                for (const pr of G.projs) if (!pr.friendly && Math.hypot(pr.x - f.x, pr.y - f.y) < f.r) { pr.friendly = true; pr.owner = f.owner; pr.vx *= -1; pr.vy *= -1; pr.dmg = f.owner.power * 1.4; pr.hitSet = new Set(); pr.life = 60; pr.col = f.col; VFX.hit(pr.x, pr.y, f.col, 4); }
            } else if (f.kind === 'lavapool') {
                const p = G.player;
                if (Math.abs(p.x - f.x) < f.r && Math.abs(p.y - f.y) < 26 && G.time % 12 === 0) p.hurt(f.dmg, { tick: true, unblockable: true });
                if (G.time % 5 === 0) VFX.add(f.x + U.rand(-f.r, f.r), f.y, U.rand(-.5, .5), U.rand(-2.6, -.8), '#ff7a18', 22, 7, 1, 0);
            } else if (f.t % (f.kind === 'tesla' ? 24 : 30) === 0) {
                const hits = this.targetsNear(f.x, f.y - 40, f.r);
                for (const t of hits) {
                    this.hit(f.owner, t, { dmg: f.kind === 'freeze' ? .5 : .7, element: f.el, stag: f.kind === 'freeze' ? 22 : 8, col: f.col, hit: 'hit_l' });
                    if (f.kind === 'tesla') VFX.lightning(f.x + U.rand(-30, 30), f.y - 40, t.x, t.y - t.h / 2, f.col);
                    if (f.kind === 'freeze') t.slowT = 90;
                }
            }
        }
        G.fields = G.fields.filter(f => f.t < f.life);
    },
    drawFields(ctx) {
        for (const f of G.fields) {
            const fade = Math.min(1, (f.life - f.t) / 30), a = Math.min(1, f.t / 12) * fade;
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
            if (f.kind === 'bastion') {
                ctx.fillStyle = U.rgba(f.col, .1); ctx.strokeStyle = f.col; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); ctx.stroke();
                for (let i = 0; i < 6; i++) { const t = G.time * .02 + i * TAU / 6; ctx.fillStyle = f.col; ctx.fillRect(f.x + Math.cos(t) * f.r - 3, f.y + Math.sin(t) * f.r - 3, 6, 6); }
            } else if (f.kind === 'lavapool') {
                const g = ctx.createLinearGradient(0, f.y - 8, 0, f.y + 4); g.addColorStop(0, 'rgba(255,120,20,0)'); g.addColorStop(1, 'rgba(255,120,20,.9)');
                ctx.fillStyle = g; ctx.fillRect(f.x - f.r, f.y - 8, f.r * 2, 12);
            } else {
                ctx.fillStyle = U.rgba(f.col, .16 + Math.sin(f.t * .2) * .05);
                ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * .16, 0, 0, TAU); ctx.fill();
                ctx.fillStyle = f.col;
                for (let i = 0; i < 10; i++) {
                    const u = i / 9 * 2 - 1, h = (20 + 22 * Math.abs(Math.sin(f.t * .1 + i * 1.7))) * (f.kind === 'freeze' ? 1.4 : 1), px = f.x + u * f.r * .9;
                    if (f.kind === 'freeze') { ctx.beginPath(); ctx.moveTo(px - 7, f.y); ctx.lineTo(px, f.y - h); ctx.lineTo(px + 7, f.y); ctx.closePath(); ctx.fill(); }
                    else if (f.kind === 'burn') { ctx.globalAlpha = a * .7; ctx.drawImage(Glow.get(f.col), px - 14, f.y - h - 8, 28, h + 12); ctx.globalAlpha = a; }
                    else if (i % 3 === 0) { ctx.fillRect(px - 1, f.y - h, 2, h); }
                }
            }
            ctx.restore();
        }
    }
};

class Proj {
    constructor(owner, kind, x, y, vx, vy, o) {
        this.owner = owner; this.kind = kind; this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.friendly = !!owner.isPlayer; this.r = o.r || 6; this.life = o.life || 120; this.pierce = o.pierce || 0;
        this.hitSet = new Set(); this.col = o.col || '#ff7040'; this.len = o.len || 0; this.grav = o.grav || 0;
        this.homing = o.homing || 0; this.element = o.element; this.explode = o.explode || 0; this.stag = o.stag || 8;
        this.kby = o.kby || 0; this.kb = o.kb === undefined ? 3 : o.kb; this.ghost = o.ghost; this.bounce = o.bounce; this.split = o.split;
        this.lifesteal = o.lifesteal; this.onDie = o.onDie; this.mult = o.dmg || 1;
        this.dmg = this.friendly ? owner.power * this.mult : o.absDmg;
        if (kind === 'wave') { this.col = '#ffaa33'; this.ground = true; }
        if (this.element !== undefined) this.col = ELEMENTS[this.element].col;
    }
    update() {
        const p = G.player;
        if (this.homing && !this.friendly) {
            const a = Math.atan2(p.y - 30 - this.y, p.x - this.x), s = Math.hypot(this.vx, this.vy);
            this.vx = U.lerp(this.vx, Math.cos(a) * s, this.homing); this.vy = U.lerp(this.vy, Math.sin(a) * s, this.homing);
        }
        this.vy += this.grav; this.x += this.vx; this.y += this.vy;
        const L = G.level;
        if (this.ground) {
            const s = L.surfaceBelow(this.x, this.y - 30, 110);
            if (s === null) { this.life = 0; } else { this.y = s - 8; }
            if (G.time % 2 === 0) { VFX.add(this.x + U.rand(-10, 10), this.y + 6, U.rand(-1, 1), U.rand(-7, -3), this.col, 18, 6, 1, .3); VFX.dust(this.x, this.y + 8, 1, L.theme.dust); }
        } else if (!this.ghost && L.solidAt(this.x, this.y)) {
            if (this.bounce > 0) { this.bounce--; this.vy *= -.7; this.vx *= .9; this.y -= 10; }
            else { this.die(true); return; }
        }
        if (this.kind === 'missile' && G.time % 2 === 0) VFX.add(this.x, this.y, 0, 0, '#999', 20, 7, 3, 0);
        if (this.kind === 'fire' && G.time % 3 === 0) VFX.add(this.x, this.y, U.rand(-.6, .6), U.rand(-.6, .6), '#ff7a18', 14, 8, 1, 0);
        if (this.friendly) {
            for (const t of G.enemies) {
                if (t.dead || t.untargetable || this.hitSet.has(t)) continue;
                const b = t.box(), nx = U.clamp(this.x, b.x, b.x + b.w), ny = U.clamp(this.y, b.y, b.y + b.h);
                if ((this.x - nx) ** 2 + (this.y - ny) ** 2 > this.r * this.r) continue;
                this.hitSet.add(t);
                Combat.hit(this.owner, t, { dmg: this.dmg / this.owner.power, kb: this.kb, kby: this.kby, stag: this.stag, element: this.element, lifesteal: this.lifesteal, col: this.col, hit: this.pierce > 3 ? 'hit_h' : 'hit_l' });
                if (this.pierce-- <= 0) { this.die(false); return; }
            }
            for (const d of L.dyn) if (d.kind === 'breakable' && d.active && U.overlap({ x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }, d)) { d.damage(this.pierce > 3 || this.explode ? 3 : 1); this.die(true); return; }
        } else if (U.overlap({ x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }, p.hurtBox)) {
            const landed = p.hurt(this.dmg, { x: this.x - this.vx, kb: this.kb + 1, proj: this, owner: this.owner });
            if (this.friendly) return; // reflected by a perfect guard
            if (landed || p.guarding) { this.die(true); return; }
        }
        if (--this.life <= 0) this.die(false);
    }
    die(hitWall) {
        if (this.dead) return;
        this.dead = true;
        if (this.explode) {
            VFX.ring(this.x, this.y, this.explode, this.col, 18, 8); Sound.at('explode', this.x, { v: .6 }); G.addShake(4);
            if (this.friendly) Combat.aoe(this.owner, this.x, this.y, this.explode, { dmg: this.mult * .8, kb: 7, kby: -3, stag: 30, element: this.element, col: this.col, hit: 'hit_h' });
            else if (Math.hypot(G.player.x - this.x, G.player.y - 30 - this.y) < this.explode) G.player.hurt(this.dmg, { x: this.x });
        } else if (hitWall) VFX.hit(this.x, this.y, this.col, 5);
        if (this.split) for (let i = 0; i < this.split; i++) { const a = TAU / this.split * i; Combat.eshoot(this.owner, 'fire', this.x, this.y, a, 5, this.dmg * .5, { col: this.col, life: 70, r: 6 }); }
        if (this.onDie) this.onDie(this);
    }
    draw(ctx) {
        const r = this.r, a = Math.atan2(this.vy, this.vx);
        ctx.save(); ctx.translate(this.x, this.y);
        switch (this.kind) {
            case 'bolt': case 'rail':
                ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';
                ctx.drawImage(Glow.get(this.col), -r * 4, -r * 2.6, r * 8, r * 5.2);
                ctx.fillStyle = this.col; ctx.fillRect(-(this.len || r * 7), -r * .5, this.len || r * 7, r);
                ctx.fillStyle = '#fff'; ctx.fillRect(-(this.len || r * 7) * .6, -r * .2, (this.len || r * 7) * .6, r * .4);
                break;
            case 'knife':
                ctx.rotate(a); ctx.fillStyle = '#e9e5ff'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-6, -3); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill();
                ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = U.rgba('#a855ff', .5); ctx.fillRect(-20, -1.5, 14, 3);
                break;
            case 'wave':
                ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(Glow.get(this.col), -32, -46, 64, 66);
                ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.moveTo(-18, 10); ctx.lineTo(0, -24); ctx.lineTo(18, 10); ctx.closePath(); ctx.fill();
                break;
            case 'rock':
                ctx.rotate(G.time * .12); ctx.fillStyle = '#4b403a'; ctx.beginPath(); for (let i = 0; i < 7; i++) { const t = i / 7 * TAU, q = r * (i % 2 ? .75 : 1); ctx.lineTo(Math.cos(t) * q, Math.sin(t) * q); } ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#ff7a18'; ctx.lineWidth = 1.5; ctx.stroke();
                break;
            case 'ice':
                ctx.rotate(a); ctx.fillStyle = '#d2f3ff'; ctx.beginPath(); ctx.moveTo(r * 2, 0); ctx.lineTo(-r, -r * .7); ctx.lineTo(-r, r * .7); ctx.closePath(); ctx.fill();
                ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(Glow.get('#7fd8ff'), -r * 2, -r * 2, r * 4, r * 4);
                break;
            case 'missile':
                ctx.rotate(a); ctx.fillStyle = '#ddd'; ctx.fillRect(-10, -3.5, 18, 7); ctx.fillStyle = '#e33'; ctx.fillRect(6, -3.5, 5, 7);
                ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(Glow.get('#ffb040'), -22, -8, 16, 16);
                break;
            default:
                ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(Glow.get(this.col), -r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * .5, 0, TAU); ctx.fill();
        }
        ctx.restore();
    }
}

/* Environmental hazards are rectangles with logic; drawing lives in render.js. */
const Hazards = {
    active(h) { return !h.period || ((G.time + (h.phase || 0)) % h.period) < h.on; },
    touch(p, h) {
        switch (h.kind) {
            case 'lava':
                if (p.lavaCd > G.time) return;
                p.lavaCd = G.time + 50;
                p.hurt(Math.max(12, p.maxHp * .16), { tick: true, unblockable: true });
                if (p.state !== 'dead') { Sound.sfx('lava_burst'); VFX.burst(p.x, p.y - 8, '#ff7a18', 22, 8, 26, 9, 1); p.returnToSafe(); }
                break;
            case 'spikes': case 'thorns':
                if (p.hurt(p.maxHp * .1, { tick: true, unblockable: true })) { p.vy = -10; p.inv = 50; }
                p.spikeHits = (p.spikeHits || 0) + 1;
                break;
            case 'poison': p.slow = 12; p.inHazard = true; if (G.time % 30 === 0) p.hurt(Math.ceil(p.maxHp * .03), { tick: true, unblockable: true }); if (G.time % 6 === 0) VFX.add(p.x + U.rand(-10, 10), p.y, 0, -1.2, '#9dff40', 18, 7, 1, 0); break;
            case 'water': p.inWater = true; if (h.flow) p.push(h.flow); break;
            case 'quicksand':
                p.sandSlow = true; p.inHazard = true; p.vy = Math.min(p.vy, 1.1); if (p.vy > 0) p.grounded = false;
                if (G.time % 40 === 0) p.hurt(Math.ceil(p.maxHp * .02), { tick: true, unblockable: true });
                if (p.grounded === false) { p.coyote = 3; }
                break;
            case 'wire': case 'steam': case 'geyser':
                if (!this.active(h)) return;
                if (h.kind === 'geyser') { p.vy = Math.min(p.vy, -14); p.jumps = 1; }
                p.hurt(p.maxHp * (h.kind === 'wire' ? .08 : .06), { tick: true, unblockable: true });
                break;
            case 'wind': if (!h.need || G.flags[h.need]) { if (!p.sheltered) p.push(h.force); } break;
            case 'slip': p.onIce = true; break;
            case 'bounce': if (p.vy >= 0 && p.state !== 'dodge') { p.vy = -(h.force || 20); p.jumps = 1; p.noCut = true; Sound.sfx('squish'); h.squash = 12; VFX.burst(p.x, p.y, '#a0ffda', 8, 4, 16, 5, 1); } break;
            case 'shelter': p.sheltered = 2; break;
            case 'cold': p.cold = 6; break;
            case 'trigger': break;
        }
    }
};
