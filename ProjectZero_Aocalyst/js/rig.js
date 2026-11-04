'use strict';
/**
 * RIG: skeletal animation for all humanoids.
 * Poses are joint-angle tables. Clips interpolate between poses, and every clip
 * change crossfades from the last output pose, so nothing ever snaps.
 * Angle convention: 0 hangs straight down, positive swings toward the facing side.
 */
const PK = ['by', 'bx', 'lean', 'head', 'aF', 'fF', 'aB', 'fB', 'lF', 'sF', 'lB', 'sB', 'w', 'w2'];
const PI = {}; PK.forEach((k, i) => PI[k] = i);
const BASE_POSE = { by: 0, bx: 0, lean: 3, head: 0, aF: 8, fF: 18, aB: -8, fB: 14, lF: 6, sF: 8, lB: -6, sB: 8, w: 0, w2: 0 };

function poseArr(p, base) {
    const a = new Float32Array(PK.length);
    PK.forEach((k, i) => a[i] = p[k] !== undefined ? p[k] : base[k]);
    return a;
}
function mkClip(frames, keys, opt = {}) {
    return Object.assign({ frames, keys, loop: false, built: null }, opt);
}
function buildClip(c, base) {
    if (c.built && c.builtFor === base) return c.built;
    c.built = c.keys.map(k => ({ t: k[0], a: poseArr(k[1], base), ease: k[2] }));
    c.builtFor = base;
    return c.built;
}

/* Locomotion is procedural: phase advances with distance walked, so feet do not slide. */
function procRun(a, r) {
    const G2 = r.S.gait, φ = r.phase, s = Math.sin(φ), c = Math.cos(φ), amt = r.gaitAmt;
    const st = G2.stride * (.45 + .55 * amt), kn = G2.knee * (.5 + .5 * amt);
    a[PI.lean] = G2.lean * amt + 2;
    a[PI.lF] = G2.off + st * s; a[PI.lB] = G2.off - st * s;
    a[PI.sF] = 10 + kn * Math.max(0, c + .15); a[PI.sB] = 10 + kn * Math.max(0, -c + .15);
    a[PI.aF] = G2.armF - G2.arm * s * amt; a[PI.aB] = G2.armB + G2.arm * s * amt;
    a[PI.fF] = G2.elbow; a[PI.fB] = G2.elbow;
    a[PI.by] = -Math.abs(c) * G2.bounce * amt;
    a[PI.head] = -a[PI.lean] * .5;
    a[PI.w] = G2.w || 0; a[PI.w2] = G2.w2 || 0;
}
function procIdle(a, r) {
    const b = Math.sin(r.time * .05), Is = r.S.idle || BASE_POSE;
    PK.forEach((k, i) => a[i] = Is[k] !== undefined ? Is[k] : BASE_POSE[k]);
    a[PI.by] += b * 1.1; a[PI.aF] += b * 1.6; a[PI.aB] -= b * 1.3; a[PI.head] += Math.sin(r.time * .021) * 2;
    a[PI.sF] += 2 + b; a[PI.sB] += 2 + b;
}

const CLIPS = {
    idle: mkClip(1, [], { proc: procIdle, loop: true }),
    run: mkClip(1, [], { proc: procRun, loop: true }),
    jump: mkClip(14, [[0, { lean: 8, lF: 20, sF: 40, lB: -22, sB: 30, aF: 30, aB: -40, fF: 40, fB: 20 }], [1, { lean: 4, lF: 34, sF: 60, lB: -8, sB: 16, aF: 40, aB: -30, fF: 50, fB: 30 }]]),
    djump: mkClip(16, [[0, { lean: 25, lF: 70, sF: 110, lB: 30, sB: 100, aF: 40, aB: 30 }], [.5, { lean: 180, lF: 60, sF: 100, lB: 50, sB: 100, aF: 60, aB: 60 }], [1, { lean: 360, lF: 20, sF: 40, lB: -8, sB: 20, aF: 20, aB: -20 }]]),
    fall: mkClip(20, [[0, { lean: 2, lF: 14, sF: 30, lB: -14, sB: 26, aF: 60, aB: -70, fF: 30, fB: 20 }], [1, { lean: -2, lF: 22, sF: 24, lB: -22, sB: 32, aF: 90, aB: -100, fF: 20, fB: 10 }]], { loop: true }),
    land: mkClip(12, [[0, { by: 12, lean: 16, lF: 40, sF: 70, lB: -22, sB: 50, aF: 30, aB: -30 }], [1, {}]]),
    dodge: mkClip(16, [[0, { lean: 24, by: 6, lF: 40, sF: 60, lB: -40, sB: 40, aF: -40, aB: -60, fF: 20 }], [.5, { lean: 30, by: 8, lF: 60, sF: 80, lB: -50, sB: 40, aF: -60, aB: -70 }], [1, { lean: 10, lF: 20, sF: 40, lB: -20, sB: 20 }]]),
    roll: mkClip(18, [[0, { lean: 40, by: 14, lF: 80, sF: 110, lB: 60, sB: 100, aF: 70, aB: 70 }], [.5, { lean: 200, by: 18, lF: 90, sF: 120, lB: 70, sB: 110, aF: 80, aB: 80 }], [1, { lean: 360, by: 8, lF: 40, sF: 70, lB: -10, sB: 30, aF: 20 }]]),
    hit: mkClip(18, [[0, { lean: -20, head: -18, aF: -30, aB: -50, fF: 30, by: 3, lF: -12, lB: -24, sB: 18 }], [.4, { lean: -14, head: -10, aF: -20, aB: -40 }], [1, {}]]),
    death: mkClip(60, [[0, { lean: -14, head: -20, aF: -40, aB: -60, lF: 0, sF: 20 }], [.3, { lean: -24, by: 18, aF: -30, aB: -70, lF: 40, sF: 90, lB: 20, sB: 80 }], [.7, { lean: -70, by: 30, head: -20, aF: -20, aB: -40, lF: 60, sF: 50, lB: 30, sB: 30 }], [1, { lean: -92, by: 40, head: -14, aF: -100, aB: -80, fF: 5, lF: 80, sF: 10, lB: 70, sB: 20 }]]),
    victory: mkClip(50, [[0, {}], [.3, { by: 3, lF: 16, sF: 26, aF: 160, fF: 8, aB: -14, head: -10 }], [1, { lF: 12, sF: 20, aF: 170, fF: 4, aB: -10, head: -12 }]]),
    interact: mkClip(30, [[0, {}], [.35, { lean: 16, aF: 70, fF: 30, head: 10, lF: 14, sF: 26 }], [.7, { lean: 12, aF: 80, fF: 16, head: 8 }], [1, {}]]),
    crouch: mkClip(12, [[0, { by: 14, lean: 20, lF: 56, sF: 96, lB: 30, sB: 90, aF: 30, fF: 40 }], [1, { by: 16, lean: 22, lF: 60, sF: 100, lB: 34, sB: 96, aF: 34, fF: 44 }]], { loop: true }),
    wall: mkClip(10, [[0, { lean: -8, lF: 30, sF: 50, lB: 10, sB: 40, aF: 100, fF: 20, aB: 70, fB: 30, head: -6 }], [1, { lean: -8, lF: 28, sF: 48, lB: 8, sB: 42, aF: 104, fF: 20, aB: 74, fB: 30, head: -8 }]], { loop: true }),
    talk: mkClip(70, [[0, { head: 4 }], [.3, { head: -2, aF: 30, fF: 40 }], [.6, { head: 3, aF: 16, fF: 26 }], [1, { head: 4 }]], { loop: true }),
    kneel: mkClip(30, [[0, { by: 16, lean: 22, lF: 74, sF: 100, lB: -6, sB: 100, aF: 34, fF: 30, aB: 14, head: 14 }], [1, { by: 18, lean: 26, lF: 76, sF: 104, lB: -8, sB: 102, aF: 38, fF: 30, aB: 16, head: 18 }]], { loop: true })
};

class Rig {
    constructor(style) {
        this.S = style; this.base = Object.assign({}, BASE_POSE, style.idle || {});
        this.out = new Float32Array(PK.length); this.from = new Float32Array(PK.length); this.tmp = new Float32Array(PK.length);
        this.clip = null; this.name = ''; this.t = 0; this.blend = 0; this.blendMax = 1; this.speed = 1;
        this.phase = 0; this.gaitAmt = 1; this.time = Math.random() * 500; this.flash = 0; this.ground = true;
        this.J = {}; this.tip = { x: 0, y: 0 }; this.chain = [];
        for (let i = 0; i < 7; i++) this.chain.push({ x: 0, y: 0, ox: 0, oy: 0, init: false });
        this.play('idle', 0);
    }
    play(name, blend = 7, speed = 1) {
        if (name === this.name) { this.speed = speed; return; }
        const clip = this.S.clips && this.S.clips[name] || CLIPS[name];
        if (!clip) { console.warn('Missing clip', name); return; }
        this.setClip(clip, name, blend, speed);
    }
    /** Ad-hoc clip used by attacks: keys are timed to the attack's frame data. */
    custom(keys, frames, blend = 3, name = '_atk') {
        this.setClip(mkClip(frames, keys), name + Math.random(), blend, 1);
    }
    setClip(clip, name, blend, speed) {
        this.from.set(this.out); this.blend = this.blendMax = Math.max(blend, .001);
        this.clip = clip; this.name = name; this.t = 0; this.speed = speed;
    }
    get done() { return !this.clip.loop && this.t >= this.clip.frames; }
    tick() {
        this.time++;
        const c = this.clip; this.t += this.speed;
        if (c.proc) c.proc(this.tmp, this);
        else {
            const K = buildClip(c, this.base);
            let u = this.t / c.frames;
            if (c.loop) u = u % 1; else u = Math.min(1, u);
            let i = 0; while (i < K.length - 2 && u > K[i + 1].t) i++;
            const a = K[i], b = K[Math.min(i + 1, K.length - 1)], d = (b.t - a.t) || 1;
            let e = U.clamp((u - a.t) / d, 0, 1); e = b.ease === 'snap' ? U.easeOut(e) : U.smooth(e);
            for (let n = 0; n < PK.length; n++) this.tmp[n] = a.a[n] + (b.a[n] - a.a[n]) * e;
        }
        if (this.blend > 0) {
            this.blend--;
            const k = U.smooth(1 - this.blend / this.blendMax);
            for (let n = 0; n < PK.length; n++) this.out[n] = this.from[n] + (this.tmp[n] - this.from[n]) * k;
        } else this.out.set(this.tmp);
        if (this.flash > 0) this.flash--;
    }
    /** Forward kinematics into this.J, in local space with feet near y=0. */
    solve() {
        const o = this.out, S = this.S.bone, J = this.J, rad = Math.PI / 180;
        const lean = o[PI.lean] * rad, legLen = S.thigh + S.shin;
        const hx = o[PI.bx], hy = o[PI.by] - legLen;
        const dir = (a) => [Math.sin(a), Math.cos(a)];
        const nx = hx + Math.sin(lean) * S.torso, ny = hy - Math.cos(lean) * S.torso;
        const leg = (t, s) => {
            const [ax, ay] = dir(t * rad), [bx, by] = dir((t - s) * rad);
            const kx = hx + ax * S.thigh, ky = hy + ay * S.thigh;
            return { kx, ky, fx: kx + bx * S.shin, fy: ky + by * S.shin };
        };
        const LF = leg(o[PI.lF], o[PI.sF]), LB = leg(o[PI.lB], o[PI.sB]);
        const dy = this.ground ? -Math.max(LF.fy, LB.fy) : 0;
        const dropped = (o[PI.lean] > 120 || o[PI.lean] < -60);
        const sh = dropped ? 0 : dy;
        const sx = hx + Math.sin(lean) * (S.torso - 3), sy = hy - Math.cos(lean) * (S.torso - 3);
        const arm = (a, f) => {
            const a1 = a * rad + lean, a2 = (a + f) * rad + lean;
            const [ax, ay] = dir(a1), [bx, by] = dir(a2);
            const ex = sx + ax * S.upper, ey = sy + ay * S.upper;
            return { ex, ey, hx: ex + bx * S.fore, hy: ey + by * S.fore, ang: a2 };
        };
        const AF = arm(o[PI.aF], o[PI.fF]), AB = arm(o[PI.aB], o[PI.fB]);
        J.hip = { x: hx, y: hy + sh }; J.neck = { x: nx, y: ny + sh }; J.sh = { x: sx, y: sy + sh };
        J.head = { x: nx + Math.sin(lean) * S.head * .9, y: ny - Math.cos(lean) * S.head * .9 + sh, a: lean + o[PI.head] * rad };
        J.kF = { x: LF.kx, y: LF.ky + sh }; J.fF = { x: LF.fx, y: LF.fy + sh }; J.kB = { x: LB.kx, y: LB.ky + sh }; J.fB = { x: LB.fx, y: LB.fy + sh };
        J.eF = { x: AF.ex, y: AF.ey + sh }; J.hF = { x: AF.hx, y: AF.hy + sh, a: AF.ang + o[PI.w] * rad };
        J.eB = { x: AB.ex, y: AB.ey + sh }; J.hB = { x: AB.hx, y: AB.hy + sh, a: AB.ang + o[PI.w2] * rad };
        J.lean = lean;
    }
    /** Keeps the cape or scarf verlet chain following the rig's neck in world space. */
    updateChain(wx, wy, facing, wind = 0) {
        this.solve();
        const S = this.S, sc = S.scale || 1, ax = wx + this.J.neck.x * facing * sc - facing * 3, ay = wy + this.J.neck.y * sc + 2;
        const C = this.chain, seg = S.chainSeg || 7;
        C.forEach((p, i) => {
            if (!p.init) { p.x = p.ox = ax; p.y = p.oy = ay; p.init = true; }
            if (i === 0) { p.x = ax; p.y = ay; return; }
            const vx = (p.x - p.ox) * .9, vy = (p.y - p.oy) * .9; p.ox = p.x; p.oy = p.y;
            p.x += vx + wind + Math.sin(this.time * .08 + i) * .25; p.y += vy + .45;
        });
        for (let n = 0; n < 2; n++) for (let i = 1; i < C.length; i++) {
            const a = C[i - 1], b = C[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, k = (d - seg) / d;
            b.x -= dx * k; b.y -= dy * k;
        }
        const w = this.J.hF, s = facing * sc;
        const len = S.weaponLen || 30;
        this.tip.x = wx + (w.x + Math.sin(w.a) * len) * s; this.tip.y = wy + (w.y + Math.cos(w.a) * len) * sc;
        this.tip.bx = wx + w.x * s; this.tip.by = wy + w.y * sc;
    }
    draw(ctx, x, y, facing, alpha = 1) {
        this.solve();
        const S = this.S, sc = S.scale || 1;
        ctx.save(); ctx.globalAlpha = alpha;
        if (S.chainPaint) S.chainPaint(ctx, this, x, y, facing);
        ctx.translate(x, y); ctx.scale(facing * sc, sc);
        Paint.flash = this.flash > 0;
        S.paint(ctx, this.J, S, this);
        Paint.flash = false;
        ctx.restore();
    }
}

/* ------------------------------ PAINTING ------------------------------ */
const Paint = {
    flash: false,
    c(col) { return this.flash ? '#ffffff' : col; },
    limb(ctx, a, b, w, col) {
        ctx.strokeStyle = this.c(col); ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    },
    /** Limb with an armour highlight running along the leading edge. */
    plated(ctx, a, b, w, col, hi) {
        this.limb(ctx, a, b, w, col);
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d * w * .25, ny = dx / d * w * .25;
        ctx.strokeStyle = this.c(hi); ctx.lineWidth = Math.max(1, w * .22);
        ctx.beginPath(); ctx.moveTo(a.x - nx + dx * .15, a.y - ny + dy * .15); ctx.lineTo(b.x - nx - dx * .15, b.y - ny - dy * .15); ctx.stroke();
    },
    disc(ctx, x, y, r, col) { ctx.fillStyle = this.c(col); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); },
    poly(ctx, pts, col) {
        ctx.fillStyle = this.c(col); ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
        ctx.closePath(); ctx.fill();
    },
    /** Draws in a frame at `p`, rotated so +y runs along the given limb angle. */
    at(ctx, p, a, fn) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-a); fn(ctx); ctx.restore();
    },
    torso(ctx, J, w1, w2, col, hi) {
        const a = J.hip, b = J.neck, l = J.lean, cx = Math.cos(l), sy = Math.sin(l);
        ctx.fillStyle = this.c(col); ctx.beginPath();
        ctx.moveTo(a.x - cx * w1, a.y - sy * w1); ctx.lineTo(b.x - cx * w2, b.y - sy * w2);
        ctx.lineTo(b.x + cx * w2, b.y + sy * w2); ctx.lineTo(a.x + cx * w1, a.y + sy * w1); ctx.closePath(); ctx.fill();
        if (hi) {
            ctx.strokeStyle = this.c(hi); ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(a.x + cx * w1 * .8, a.y + sy * w1 * .8); ctx.lineTo(b.x + cx * w2 * .8, b.y + sy * w2 * .8); ctx.stroke();
        }
    },
    glow(ctx, x, y, r, col) {
        if (Settings.quality < 1) return;
        const op = ctx.globalCompositeOperation; ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(Glow.get(col), x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = op;
    }
};

/** Layered humanoid: tapered limbs with shading, joints, boots, gloves, belt and chest plate. */
function paintHumanoid(ctx, J, S, r) {
    const C = S.col, B = S.bone, L = B.limbW || 6;
    if (S.backGear) S.backGear(ctx, J, S, r);
    Paint.arm(ctx, J.sh, J.eB, J.hB, L * .92, C.dark, U.mix(C.dark, C.armor2, .4), C, true);
    if (S.weaponB) Paint.at(ctx, J.hB, J.hB.a, c => S.weaponB(c, J, S, r));
    Paint.leg(ctx, J.hip, J.kB, J.fB, L, C.dark, U.mix(C.dark, C.armor2, .35), C, true);
    if (S.skirt) S.skirt(ctx, J, S, r);
    Paint.chest(ctx, J, B, C, S);
    if (S.torsoGear) S.torsoGear(ctx, J, S, r);
    Paint.leg(ctx, J.hip, J.kF, J.fF, L, C.armor, C.armor2, C, false);
    const nx = J.neck.x, ny = J.neck.y; Paint.limb(ctx, { x: nx, y: ny + 2 }, { x: J.head.x, y: J.head.y + 3 }, 4.5, C.skin);
    ctx.fillStyle = Paint.c(C.skin); ctx.beginPath(); ctx.ellipse(J.head.x, J.head.y, B.head * .78, B.head * .9, J.head.a, 0, TAU); ctx.fill();
    if (S.headGear) S.headGear(ctx, J, S, r);
    Paint.arm(ctx, J.sh, J.eF, J.hF, L, C.armor, C.armor2, C, false);
    if (S.pauldron) S.pauldron(ctx, J, S, r);
    if (S.weaponF) Paint.at(ctx, J.hF, J.hF.a, c => S.weaponF(c, J, S, r));
    if (S.overGear) S.overGear(ctx, J, S, r);
}

/** Cape or scarf: a widening cloth strip with a lit fold and a frayed hem, in world space. */
function paintChain(width, colA, colB) {
    return (ctx, r) => {
        const C = r.chain; if (!C[0].init) return;
        const n = C.length, L = [], R = [];
        for (let i = 0; i < n; i++) {
            const a = C[Math.max(0, i - 1)], b = C[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, w = width * (.35 + i / n * .75) / 2;
            L.push({ x: C[i].x - dy / d * w, y: C[i].y + dx / d * w }); R.push({ x: C[i].x + dy / d * w, y: C[i].y - dx / d * w });
        }
        ctx.fillStyle = Paint.c(colA); ctx.beginPath(); ctx.moveTo(L[0].x, L[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(L[i].x, L[i].y);
        const e = C[n - 1], o = R[n - 1], m = L[n - 1];
        ctx.lineTo(U.lerp(m.x, o.x, .33) + (e.x - C[n - 2].x) * .7, U.lerp(m.y, o.y, .33) + (e.y - C[n - 2].y) * .7); ctx.lineTo(U.lerp(m.x, o.x, .5), U.lerp(m.y, o.y, .5)); ctx.lineTo(U.lerp(m.x, o.x, .75) + (e.x - C[n - 2].x) * .5, U.lerp(m.y, o.y, .75) + (e.y - C[n - 2].y) * .5);
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = Paint.c(colB); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(C[0].x, C[0].y); for (let i = 1; i < n; i++) ctx.lineTo(C[i].x, C[i].y); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = width * .16; ctx.beginPath(); ctx.moveTo(R[0].x, R[0].y); for (let i = 1; i < n; i++) ctx.lineTo(R[i].x, R[i].y); ctx.stroke();
    };
}
Object.assign(Paint, {
    /** Tapered limb segment with a shaded back edge and a lit front edge. */
    taper(ctx, a, b, w1, w2, col, hi) {
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
        ctx.fillStyle = this.c(col); ctx.beginPath();
        ctx.moveTo(a.x + nx * w1, a.y + ny * w1); ctx.lineTo(b.x + nx * w2, b.y + ny * w2); ctx.arc(b.x, b.y, w2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
        ctx.lineTo(a.x - nx * w1, a.y - ny * w1); ctx.arc(a.x, a.y, w1, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true); ctx.closePath(); ctx.fill();
        if (hi) {
            ctx.strokeStyle = this.c(hi); ctx.lineWidth = Math.max(.9, w1 * .32); ctx.lineCap = 'round'; ctx.beginPath();
            ctx.moveTo(a.x - nx * w1 * .5 + dx * .1, a.y - ny * w1 * .5 + dy * .1); ctx.lineTo(b.x - nx * w2 * .5 - dx * .1, b.y - ny * w2 * .5 - dy * .1); ctx.stroke();
        }
    },
    leg(ctx, hip, knee, foot, L, col, hi, C, back) {
        this.taper(ctx, hip, knee, L * .72, L * .5, col, back ? null : hi);
        this.taper(ctx, knee, foot, L * .5, L * .38, col, back ? null : hi);
        this.disc(ctx, knee.x + .6, knee.y, L * .46, back ? col : hi);
        if (!back) this.disc(ctx, knee.x + .6, knee.y, L * .22, C.glow);
        const b = back ? U.mix(C.boot || col, '#000000', .35) : (C.boot || col);
        this.poly(ctx, [foot.x - L * .5, foot.y - L * .7, foot.x + L * .42, foot.y - L * .7, foot.x + L * 1.05, foot.y - L * .16, foot.x + L * 1.05, foot.y + .6, foot.x - L * .55, foot.y + .6], b);
        ctx.fillStyle = this.c('rgba(0,0,0,.45)'); ctx.fillRect(foot.x - L * .55, foot.y - .7, L * 1.6, 1.4);
    },
    arm(ctx, sh, el, hand, L, col, hi, C, back) {
        this.taper(ctx, sh, el, L * .6, L * .46, col, back ? null : hi);
        this.taper(ctx, el, hand, L * .5, L * .4, back ? col : hi, null);
        this.disc(ctx, el.x, el.y, L * .34, back ? col : C.armor);
        this.disc(ctx, hand.x, hand.y, L * .46, back ? U.mix(col, '#000000', .2) : (C.glove || C.boot || col));
    },
    chest(ctx, J, B, C, S) {
        const T = B.torso, wW = B.waist || 6, wC = B.chest || 8;
        ctx.save(); ctx.translate(J.hip.x, J.hip.y); ctx.rotate(J.lean);
        this.poly(ctx, [-wW, 2, wW, 2, wW + 1, -T * .3, wC, -T * .68, wC * .86, -T - 1, -wC * .86, -T - 1, -wC, -T * .68, -wW - 1, -T * .3], C.armor);
        ctx.fillStyle = this.c('rgba(0,0,0,.24)'); ctx.beginPath(); ctx.moveTo(-wW, 2); ctx.lineTo(-1, 2); ctx.lineTo(-wC * .1, -T - 1); ctx.lineTo(-wC * .86, -T - 1); ctx.lineTo(-wC, -T * .68); ctx.closePath(); ctx.fill();
        this.poly(ctx, [-wC * .55, -T * .46, wC * .7, -T * .46, wC * .78, -T * .86, -wC * .5, -T * .9], C.armor2);
        ctx.strokeStyle = this.c('rgba(0,0,0,.4)'); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(wC * .1, -T * .46); ctx.lineTo(wC * .12, -T * .88); ctx.moveTo(-wW * .8, -T * .3); ctx.lineTo(wW * .9, -T * .3); ctx.moveTo(-wW * .7, -T * .16); ctx.lineTo(wW * .8, -T * .16); ctx.stroke();
        ctx.fillStyle = this.c(C.boot || '#222'); ctx.fillRect(-wW - 1, -2.5, wW * 2 + 2, 5);
        ctx.fillStyle = this.c(C.glow); ctx.fillRect(wW * .1, -1.8, 3.4, 3.6);
        if (S.emblem) S.emblem(ctx, T, wC);
        ctx.restore();
    }
});
