'use strict';
/**
 * CORE: constants, utilities, settings, persistence, input, script runner.
 * Everything here is free of game rules so it can run headless in tools/playtest.js.
 */
const VW = 1280, VH = 720, TILE = 32, GRAV = 0.6, TAU = Math.PI * 2;
const HEADLESS = typeof document === 'undefined' || !!(typeof window !== 'undefined' && window.__HEADLESS);

const U = {
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => Math.random() * (b - a) + a,
    randi: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    pick: a => a[Math.floor(Math.random() * a.length)],
    chance: p => Math.random() < p,
    dist: (a, b) => Math.hypot(b.x - a.x, b.y - a.y),
    sign: v => v < 0 ? -1 : 1,
    deg: d => d * Math.PI / 180,
    normAngle(a) { while (a <= -Math.PI) a += TAU; while (a > Math.PI) a -= TAU; return a; },
    smooth: t => t * t * (3 - 2 * t),
    easeOut: t => 1 - Math.pow(1 - t, 3),
    easeIn: t => t * t * t,
    easeInOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    overlap: (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y,
    mulberry(seed) {
        return () => {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    },
    /** 1D value noise used for terrain and parallax silhouettes. */
    noise1(x, seed = 0) {
        const h = n => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
        const i = Math.floor(x), f = x - i;
        return U.lerp(h(i), h(i + 1), U.smooth(f));
    },
    rgba(hex, a) {
        const n = parseInt(hex.slice(1), 16);
        return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
    },
    mix(c1, c2, t) {
        const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
        const m = s => Math.round(U.lerp(a >> s & 255, b >> s & 255, t));
        return '#' + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
    },
    canvas(w, h) {
        if (HEADLESS) return { width: w, height: h, getContext: () => makeNullCtx() };
        const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
    },
    fmtTime(s) { const m = Math.floor(s / 60); return m + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }
};

/** Recording-free context for headless runs. Every drawing call becomes a no-op. */
function makeNullCtx() {
    const grad = { addColorStop() { } };
    return new Proxy({}, {
        get(t, k) {
            if (k in t) return t[k];
            if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
            if (k === 'createPattern') return () => ({});
            if (k === 'measureText') return s => ({ width: String(s).length * 8 });
            if (k === 'canvas') return { width: VW, height: VH };
            return () => { };
        },
        set(t, k, v) { t[k] = v; return true; }
    });
}

/** Generator runner. `yield n` waits n ticks, `yield fn` waits until fn() is truthy. */
class Script {
    constructor(gen, tag) { this.g = gen; this.wait = 0; this.until = null; this.done = false; this.tag = tag; }
    step() {
        if (this.done) return;
        if (this.wait > 0) { this.wait--; return; }
        if (this.until) { if (!this.until()) return; this.until = null; }
        const r = this.g.next();
        if (r.done) { this.done = true; return; }
        if (typeof r.value === 'function') this.until = r.value;
        else this.wait = Math.max(0, (r.value | 0) - 1);
    }
}

/** Translate a source string for the current language; unknown strings pass through. */
const tr = s => (Settings.lang === 'vi' && typeof VI !== 'undefined' && VI[s]) || s;

/* ------------------------------ SETTINGS ------------------------------ */
const DEFAULT_BINDS = {
    left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', jump: 'Space', dodge: 'ShiftLeft',
    attack: 'KeyK', heavy: 'KeyL', skill1: 'Digit1', skill2: 'Digit2', ult: 'Digit3', interact: 'KeyE'
};
const ALT_BINDS = {
    left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', dodge: 'ShiftRight',
    attack: 'KeyJ', skill1: 'KeyU', skill2: 'KeyI', ult: 'KeyO', jump: 'KeyC'
};
const Settings = {
    master: .8, music: .65, sfx: .8, ambient: .7,
    quality: 2, renderScale: 0, lang: 'vi', fullscreen: false, shake: 1, dmgNumbers: true,
    scanlines: true, autoAim: true, camZoom: 1, camLead: 1,
    binds: Object.assign({}, DEFAULT_BINDS)
};

const Store = {
    KEY: 'pz_aocalyst_save_v1', SKEY: 'pz_aocalyst_settings_v1', mem: {},
    read(k) {
        try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) { /* storage blocked */ }
        return this.mem[k] === undefined ? null : this.mem[k];
    },
    write(k, v) {
        this.mem[k] = v;
        try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
    },
    remove(k) { delete this.mem[k]; try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } },
    loadSettings() {
        try {
            const raw = this.read(this.SKEY);
            if (!raw) return;
            const s = JSON.parse(raw);
            Object.assign(Settings, s);
            Settings.binds = Object.assign({}, DEFAULT_BINDS, s.binds || {});
        } catch (e) { console.warn('Settings were unreadable and have been reset.', e); }
    },
    saveSettings() { this.write(this.SKEY, JSON.stringify(Settings)); }
};

/* ------------------------------- INPUT -------------------------------- */
const Input = {
    held: {}, pressedNow: {}, releasedNow: {}, pad: {}, padPrev: {}, listeners: [], captureCb: null, simulated: null,
    init() {
        if (HEADLESS) return;
        window.addEventListener('keydown', e => {
            if (this.captureCb) { e.preventDefault(); const cb = this.captureCb; this.captureCb = null; cb(e.code); return; }
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) {
                if (!(e.target && e.target.tagName === 'INPUT' && e.target.type === 'text')) {
                    if (e.code !== 'Tab' && !(e.target && e.target.tagName === 'BUTTON' && e.code === 'Space')) e.preventDefault();
                }
            }
            if (!e.repeat) { this.held[e.code] = true; this.pressedNow[e.code] = true; }
            this.listeners.forEach(fn => fn(e));
        });
        window.addEventListener('keyup', e => { this.held[e.code] = false; this.releasedNow[e.code] = true; });
        // A window losing focus would otherwise leave keys stuck down.
        window.addEventListener('blur', () => { this.held = {}; });
    },
    actionCodes(a) {
        const out = [Settings.binds[a]];
        if (ALT_BINDS[a] && !Object.values(Settings.binds).includes(ALT_BINDS[a])) out.push(ALT_BINDS[a]);
        return out;
    },
    down(a) {
        if (this.simulated) return !!this.simulated[a];
        if (this.pad[a]) return true;
        return this.actionCodes(a).some(c => this.held[c]);
    },
    pressed(a) {
        if (this.simulated) return !!this.simulated['!' + a];
        if (this.pad[a] && !this.padPrev[a]) return true;
        return this.actionCodes(a).some(c => this.pressedNow[c]);
    },
    released(a) {
        if (this.simulated) return false;
        if (!this.pad[a] && this.padPrev[a]) return true;
        return this.actionCodes(a).some(c => this.releasedNow[c]);
    },
    pollPad() {
        if (HEADLESS || !navigator.getGamepads) return;
        this.padPrev = this.pad; this.pad = {};
        const gp = Array.from(navigator.getGamepads()).find(p => p);
        if (!gp) return;
        const b = i => gp.buttons[i] && gp.buttons[i].pressed, ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        const p = this.pad;
        p.left = ax < -.4 || b(14); p.right = ax > .4 || b(15); p.up = ay < -.5 || b(12); p.down = ay > .5 || b(13);
        p.jump = b(0); p.dodge = b(1) || b(5); p.attack = b(2); p.heavy = b(3); p.skill1 = b(4); p.skill2 = b(6);
        p.ult = b(7); p.interact = b(10) || b(11); p.pause = b(9);
    },
    endTick() { this.pressedNow = {}; this.releasedNow = {}; if (this.simulated) { for (const k in this.simulated) if (k[0] === '!') delete this.simulated[k]; } }
};
