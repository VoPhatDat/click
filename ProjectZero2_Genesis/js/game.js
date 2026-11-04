'use strict';
/** GAME: save data, world state (G), level lifecycle, main loop and top-level flow. */
const DIFFS = {
    story: { id: 'story', name: 'STORY', desc: 'For the plot. Enemies hit softly and hesitate.', playerHp: 1.35, dmgTaken: .7, enemyHp: .75, enemyDmg: .75, bossHp: .7, aiDelay: 1.4 },
    normal: { id: 'normal', name: 'OPERATOR', desc: 'The intended balance. Learn the patterns.', playerHp: 1, dmgTaken: 1, enemyHp: 1, enemyDmg: 1, bossHp: 1, aiDelay: 1 },
    hard: { id: 'hard', name: 'ENDBRINGER', desc: 'Enemies are aggressive and every mistake is expensive.', playerHp: .85, dmgTaken: 1.25, enemyHp: 1.3, enemyDmg: 1.25, bossHp: 1.35, aiDelay: .7 }
};
const ACHIEVEMENTS = {
    first_blood: { name: 'First Contact', desc: 'Defeat your first enemy.' },
    atlas: { name: 'Evacuation Complete', desc: 'Defeat ATLAS-9.' },
    sylvaris: { name: 'Put It Down', desc: 'Defeat Sylvaris.' },
    qareth: { name: 'High Tide', desc: 'Defeat Qareth.' },
    nadir: { name: 'Warmth', desc: 'Defeat Nadir.' },
    vulkaris: { name: 'Oath Released', desc: 'Defeat Vulkaris.' },
    endbringer: { name: 'Two Halves', desc: 'End the Endbringer.' },
    hard_clear: { name: 'True Operator', desc: 'Finish the game on Endbringer difficulty.' },
    no_death_boss: { name: 'Untouched', desc: 'Defeat a boss without being hit.' },
    archivist: { name: 'Archivist', desc: 'Collect every lore log.' },
    killer: { name: 'Line Sweeper', desc: 'Defeat 300 enemies.' },
    reactor: { name: 'Chain Reaction', desc: 'Trigger 25 elemental reactions.' },
    perfect: { name: 'Untouchable', desc: 'Land 25 perfect dodges.' },
    collector: { name: 'Treasure Hunter', desc: 'Open every chest.' },
    zero: { name: 'Subject Zero', desc: 'Find the body in the vault.' }
};
const CHEST_COUNT = 9;

const Save = {
    data: null, run: { damageDealt: 0, damageTaken: 0, kills: 0, time: 0, deaths: 0 },
    fresh(diff = 'normal') {
        return {
            v: 1, diff, activeChar: 'zero', chars: {}, unlocked: ['zero', 'rook', 'sable', 'mirae', 'ysolde'], cleared: {}, cp: null, shards: { r: false, g: false, b: false },
            relics: [], equipped: [null, null], lore: [], ach: [], cells: 0, opened: {}, flags: {}, stats: { kills: 0, deaths: 0, time: 0, reactions: 0, perfects: 0, ults: 0 }, seen: {}, gameDone: false
        };
    },
    charData(id) { const D = this.data; if (!D.chars[id]) D.chars[id] = { level: 1, xp: 0, sp: 0, up: {} }; return D.chars[id]; },
    hasUpgrade(ch, id) { return !!this.charData(ch).up[id]; },
    stat(k, n) { const S = this.data.stats; S[k] = (S[k] || 0) + n; if (k === 'reactions' && S[k] >= 25) this.ach('reactor'); if (k === 'perfects' && S[k] >= 25) this.ach('perfect'); if (k === 'kills' && S[k] >= 300) this.ach('killer'); },
    xpNeed(l) { return Math.round(70 * Math.pow(l, 1.45)); },
    addXP(n) {
        const a = this.data.activeChar;
        Object.keys(this.data.chars).concat(a).filter((v, i, s) => s.indexOf(v) === i).forEach(id => { if (this.data.unlocked.includes(id)) this.giveXP(id, id === a ? n : n * .6); });
        this.data.unlocked.forEach(id => { if (!this.data.chars[id]) this.giveXP(id, n * .6); });
    },
    giveXP(id, n) {
        const c = this.charData(id); c.xp += n;
        while (c.level < 25 && c.xp >= this.xpNeed(c.level)) {
            c.xp -= this.xpNeed(c.level); c.level++; c.sp++;
            if (id === this.data.activeChar && G.player) { G.player.recalc(); G.player.heal(G.player.maxHp * .35, true); G.toast(tr('LV') + ' ' + c.level + '  +1 SP', '#ffdd33'); Sound.sfx('levelup'); VFX.ring(G.player.x, G.player.y - 30, 110, '#ffdd33', 24, 7); }
        }
    },
    ach(id) { if (!this.data || this.data.ach.includes(id)) return; this.data.ach.push(id); if (G.level) G.toast(tr('ACHIEVEMENTS') + ': ' + tr(ACHIEVEMENTS[id].name), '#ff88ff'); },
    write() {
        if (!this.data) return false;
        try { return Store.write(Store.KEY, JSON.stringify(this.data)); } catch (e) { console.warn('Save failed', e); return false; }
    },
    /** Returns true only for a readable save of a compatible version. */
    load() {
        try {
            const raw = Store.read(Store.KEY); if (!raw) return false;
            const d = JSON.parse(raw); if (!d || d.v !== 1) return false;
            this.data = Object.assign(this.fresh(d.diff), d); return true;
        } catch (e) { console.warn('Save was corrupt and has been ignored.', e); return false; }
    },
    exists() { try { const r = Store.read(Store.KEY); if (!r) return false; const d = JSON.parse(r); return !!d && d.v === 1; } catch (e) { return false; } }
};

/* World state and the services the rest of the code calls. */
const G = {
    level: null, player: null, enemies: [], projs: [], warns: [], fields: [], scripts: [], delays: [], objs: [], cam: { x: 0, y: 0, zoom: 1, tz: 1 }, time: 0,
    hitstop: 0, slowmo: 0, freeze: 0, shake: 0, flash: 0, hurtFlash: 0, fade: 0, heat: 0, wind: 0, storm: 0, flags: {}, lockInput: false, letterbox: 0, lbA: 0, darken: 0, banner: null, bigText: null,
    sayQ: [], sayCur: null, dialog: null, toasts: [], boss: null, arena: null, combatLock: false, cineCam: null, afters: [], cpId: 0, tut: null, objective: '', pillars: [], pickups: [], nearObj: null,
    addShake(n) { this.shake = Math.max(this.shake, n * Settings.shake); },
    runScript(gen, tag) { const s = new Script(gen, tag); this.scripts.push(s); return s; },
    delay(n, fn) { this.delays.push({ t: n, fn }); },
    delay2(c, n, fn) { const s = new Script((function* () { yield n; fn(); })()); const prev = c.script, step = prev.step.bind(prev); prev.step = () => { step(); s.step(); }; },
    say(speaker, text, dur = 200) { this.sayQ.push({ speaker: tr(speaker), text: tr(text), dur, t: 0, vesper: speaker === 'VESPER' }); },
    toast(text, col = '#fff') { if (this.toasts.length > 3) this.toasts.shift(); this.toasts.push({ text: tr(text), col, t: 0 }); },
    tutorial(id) { if (Save.data.seen['tut_' + id]) return; Save.data.seen['tut_' + id] = 1; this.tut = { id, t: 0 }; },
    setGates(ids, open) { for (const d of this.level.dyn) if (d.kind === 'gate' && ids.includes(d.id)) d.open = open; },
    spawn(type, x, y, opt) { const e = new Enemy(type, x, y, opt); this.enemies.push(e); return e; },
    spawnAt(type, x, y, opt) {
        const flyer = ENEMIES[type].ai === 'flyer';
        if (flyer) return this.spawn(type, x, y === null ? this.player.y - 220 : y, opt);
        const s = this.level.surfaceBelow(x, (y === null ? this.player.y - 240 : y), 500);
        return this.spawn(type, x, s === null ? this.player.y : s, opt);
    },
    inCombat() { return this.combatLock || !!this.boss || this.enemies.some(e => !e.dead && e.state !== 'idle' && e.state !== 'patrol' && Math.abs(e.x - this.player.x) < 700); },
    alertNear(src) { for (const e of this.enemies) if (e !== src && !e.dead && (e.state === 'idle' || e.state === 'patrol') && Math.hypot(e.x - src.x, e.y - src.y) < 300) { e.state = 'alert'; e.alertT = U.randi(12, 30); } },
    needHeal(s) { return this.enemies.some(e => e !== s && !e.dead && !e.boss && e.hp < e.maxHp * .7 && Math.hypot(e.x - s.x, e.y - s.y) < 300); },
    inBastion(p) { return this.fields.some(f => f.kind === 'bastion' && Math.hypot(f.x - p.x, f.y - p.y + 30) < f.r); },
    afterimage(p, col) {
        if (this.afters.length > 10) this.afters.shift();
        p.rig.solve();
        this.afters.push({ x: p.x, y: p.y, facing: p.facing, J: JSON.parse(JSON.stringify(p.rig.J)), S: p.rig.S, rig: p.rig, t: 0, col });
    },
    /** Erupting column used by Sylvaris's roots and the volcanic attacks. */
    pillar(x, y, h, col, tip, w = 56, glow = false) {
        this.pillars.push({ x, y, h, col, tip, w, t: 0, glow });
        VFX.dust(x, y, 8, this.level.theme.dust); this.addShake(4);
    },
    onKill(e) {
        const R = Save.run; R.kills++; Save.stat('kills', 1); Save.ach('first_blood');
        Save.addXP(e.def.xp * (e.summoned ? .3 : 1));
        const p = this.player; p.gainUlt(e.def.elite ? 18 : 5); if (p.mods.killHeal) p.heal(p.mods.killHeal);
        const n = e.summoned ? 1 : U.randi(1, 3) + (e.def.elite ? 8 : 0);
        for (let i = 0; i < n; i++) this.pickups.push({ kind: 'cell', x: e.x, y: e.y - e.h / 2, vx: U.rand(-3, 3), vy: U.rand(-7, -3), t: 0 });
        if (U.chance(e.def.elite ? 1 : .14)) this.pickups.push({ kind: 'heal', x: e.x, y: e.y - e.h / 2, vx: U.rand(-2, 2), vy: -6, t: 0 });
        if (U.chance(.05) && !e.summoned) this.pickups.push({ kind: 'energy', x: e.x, y: e.y - e.h / 2, vx: U.rand(-2, 2), vy: -6, t: 0 });
        if (e.def.elite) { this.addShake(10); this.slowmo = 30; Sound.sfx('explode'); }
    },
    interact() {
        const o = this.nearObj; if (!o) return;
        const p = this.player;
        p.rig.play('interact', 4); p.vx = 0;
        switch (o.kind) {
            case 'beacon': this.activateBeacon(o); break;
            case 'npc': { const N = NPCS[o.id]; this.dialog = { lines: N.lines.map(l => [tr(l[0]), tr(l[1])]), i: 0, t: 0 }; this.lockInput = true; break; }
            case 'lore':
                if (!Save.data.lore.includes(o.id)) { Save.data.lore.push(o.id); if (Save.data.lore.length >= Object.keys(LORE).length) Save.ach('archivist'); Save.addXP(25); Save.write(); }
                o.read = true; Sound.sfx('ui_ok'); this.dialog = { lines: [[tr('ARCHIVE') + ': ' + tr(LORE[o.id].title), tr(LORE[o.id].text)]], i: 0, t: 0, lore: true }; this.lockInput = true; break;
            case 'chest':
                if (o.open) return; o.open = true; Save.data.opened[o.id] = 1; Sound.sfx('pickup'); Sound.sfx('door', { v: .4 }); VFX.burst(o.x, o.y - 20, '#ffdd33', 26, 6, 34, 6, 1);
                if (o.relic) { if (!Save.data.relics.includes(o.relic)) Save.data.relics.push(o.relic); this.toast(tr('Relic') + ': ' + tr(RELICS[o.relic].name), '#ffdd33'); }
                if (o.cells) { Save.data.cells += o.cells; this.toast('+' + o.cells + ' ' + tr('Aether cells'), '#7fffd4'); }
                if (Object.keys(Save.data.opened).length >= CHEST_COUNT) Save.ach('collector');
                Save.addXP(40); Save.write(); break;
            case 'lever': case 'rune':
                if (o.on) return; o.on = true; Sound.sfx(o.kind === 'rune' ? 'checkpoint' : 'lever'); VFX.burst(o.x, o.y - 30, o.kind === 'rune' ? '#7fffb0' : '#ffdd33', 14, 4, 24, 5, 1);
                this.flags['cnt_' + o.group] = (this.flags['cnt_' + o.group] || 0) + 1;
                if (o.drains) { const h = this.level.hazards.find(z => z.id === 'hallLava'); if (h) { h.drained = (h.drained || 0) + o.drains; if (h.drained >= 1) h.kind = 'none'; else { const d = h.h * o.drains; h.y += d; h.h -= d; } Sound.sfx('lava_burst'); this.addShake(6); } }
                if (o.script) { this.runScript(LevelScripts[o.script](o)); }
                else if (this.flags['cnt_' + o.group] >= o.need) { this.setGates([o.gate], true); Sound.sfx('door'); this.addShake(6); this.toast('A WAY HAS OPENED', '#7fffb0'); }
                else this.toast(`${this.flags['cnt_' + o.group]} / ${o.need}`, '#ffdd33');
                break;
            case 'cryo':
                if (o.open) return; o.open = true; this.setGates([o.gate], true); Game.unlockZero(); break;
            case 'door': {
                const S = Save.data.shards;
                if (S.r && S.g && S.b) { this.setGates([o.gate], true); o.open = true; Sound.sfx('bigboom'); this.addShake(12); this.flash = .6; this.say('ZERO', 'Three keys. Here we go.', 140); }
                else this.toast('THREE CORE SHARDS REQUIRED', '#ff4433');
                break;
            }
            case 'exit': Game.finishStage(); break;
        }
    },
    activateBeacon(o) {
        const first = !o.lit; this.level.objs.forEach(b => { if (b.kind === 'beacon') b.cur = false; }); o.lit = true; o.cur = true; this.cpId = o.cpId;
        const p = this.player; p.hp = p.maxHp; p.energy = p.maxEnergy; p.safe = { x: o.x, y: o.y };
        Sound.sfx('checkpoint'); VFX.ring(o.x, o.y - 30, 130, '#00ffff', 26, 8); VFX.burst(o.x, o.y - 30, '#00ffff', 20, 4, 34, 6, 1);
        Save.data.cp = { level: this.level.id, cp: o.cpId }; Save.data.activeChar = p.id; Save.write();
        this.toast('BEACON LINKED. PROGRESS SAVED', '#00ffff');
    },
    tick() {
        this.time++;
        if (this.storm !== undefined) this.stormTick();
        if (this.dialog) { this.dialogTick(); }
        if (this.hitstop > 0) { this.hitstop--; VFX.tick(); return; }
        if (this.slowmo > 0) { this.slowmo--; if (this.slowmo % 2 === 0) { VFX.tick(); this.camTick(); return; } }
        const L = this.level;
        if (this.freeze > 0) {
            this.freeze--; this.player.update(); VFX.tick(); this.camTick(); this.miscTick(); return;
        }
        for (const d of L.dyn) d.tick(this.time);
        L.dyn = L.dyn.filter(d => !d.dead || d.tag === 'coreplate');
        this.player.update();
        for (const e of this.enemies) e.update();
        this.enemies = this.enemies.filter(e => !e.gone);
        for (const p of this.projs) p.update();
        this.projs = this.projs.filter(p => !p.dead);
        Combat.tickWarns(); Combat.tickFields();
        this.triggers(); this.objTick(); this.pickupTick(); this.crusherTick(); this.arenaLavaTick();
        for (const s of this.scripts) s.step();
        this.scripts = this.scripts.filter(s => !s.done);
        for (const d of this.delays) if (--d.t <= 0) { d.done = true; d.fn(); }
        this.delays = this.delays.filter(d => !d.done);
        if (L.rockfall && !this.boss && this.time % L.rockfall.every === 0) this.rockfall();
        VFX.tick(); this.miscTick(); this.camTick();
        Save.run.time += 1 / 60; Save.data.stats.time += 1 / 60;
        if (this.time % 60 === 0) { Ambience.update(); this.musicTick(); }
        if (this.player.sheltered > 0) this.player.sheltered--;
    },
    miscTick() {
        for (const a of this.afters) a.t++; this.afters = this.afters.filter(a => a.t < 14);
        for (const p of this.pillars) p.t++; this.pillars = this.pillars.filter(p => p.t < 34);
        for (const t of this.toasts) t.t++; this.toasts = this.toasts.filter(t => t.t < 200);
        if (this.flash > 0) this.flash -= .045; if (this.hurtFlash > 0) this.hurtFlash -= .02; if (this.fade > 0) this.fade -= .03;
        this.lbA = U.lerp(this.lbA, this.letterbox, .08);
        if (this.banner && ++this.banner.t > this.banner.life) this.banner = null;
        if (this.bigText && --this.bigText.t <= 0) this.bigText = null;
        if (this.tut && ++this.tut.t > 520) this.tut = null;
        if (!this.sayCur && this.sayQ.length) { this.sayCur = this.sayQ.shift(); Sound.sfx('blip'); }
        if (this.sayCur && ++this.sayCur.t > this.sayCur.dur) this.sayCur = null;
    },
    dialogTick() {
        const D = this.dialog; D.t++;
        if (Input.pressed('interact') || Input.pressed('jump') || Input.pressed('attack') || Input.pressedNow['Enter']) {
            const full = Math.floor(D.t * 1.1) >= D.lines[D.i][1].length;
            if (!full) { D.t = 9999; return; }
            D.i++; D.t = 0; Sound.sfx('ui_move');
            if (D.i >= D.lines.length) { this.dialog = null; this.lockInput = false; }
        }
    },
    stormTick() {
        const L = this.level, C = L && L.stormCycle;
        if (this.boss && this.boss.def.id !== 'x' && (this.boss.storm || this.boss.def.id === 'nadir' && this.boss.phase > 0)) { this.storm = 1; }
        else if (C) {
            const u = this.time % C.period, on = u < C.on, near = C.period - u < 120, prev = this.stormOn;
            const target = on ? 1 : 0; this.storm = U.lerp(this.storm, target, .02); this.stormOn = on;
            if (near && !this.stormWarned) { this.stormWarned = true; this.toast('STORM FRONT APPROACHING', '#ffcc55'); Sound.sfx('warn'); }
            if (on) this.stormWarned = false;
            if (on !== prev) Ambience.setStorm(on ? .42 : 0, L.region === 'ice' ? 1800 : 1200);
            const p = this.player;
            // Storms only reach open sky: anything with a back wall behind it counts as cover.
            const covered = L.back[Math.floor(p.y / TILE - 1) * L.w + Math.floor(p.x / TILE)] > 0;
            this.covered = covered;
            if (on && this.storm > .5 && !p.sheltered && !covered && p.state !== 'dodge' && !this.lockInput && !this.boss) p.push(-C.force * this.storm);
            this.wind = -this.storm * 2.6;
            if (L.region === 'ice' && on) { p.cold = 2; }
        } else { this.storm = 0; }
    },
    triggers() {
        const L = this.level, P = this.player, me = { x: P.x - 12, y: P.y - 60, w: 24, h: 60 };
        for (const t of L.trigs) {
            if (t.fired) continue;
            if (U.overlap(me, t)) { if (t.once) t.fired = true; t.fn(); }
        }
        const A = this.arena;
        if (A && !this.boss && !this.bossDone && P.x > A.trigger && P.y < A.y + 40) this.startBoss();
    },
    objTick() {
        const P = this.player; let best = null, bd = 74;
        for (const o of this.level.objs) {
            if (o.hidden) continue;
            if (o.kind === 'npc') { o.rig.tick(); o.rig.solve(); o.facing = P.x < o.x ? -1 : 1; }
            if (o.kind === 'beacon' && !o.lit && Math.abs(o.x - P.x) < 54 && Math.abs(o.y - P.y) < 80 && P.grounded) { this.activateBeacon(o); }
            const interactive = ({ npc: 1, lore: 1, chest: !o.open, lever: !o.on, rune: !o.on, cryo: !o.open, door: !o.open, exit: 1, beacon: o.lit })[o.kind];
            if (!interactive) continue;
            const d = Math.hypot(o.x - P.x, (o.y - 30) - (P.y - 30));
            if (d < bd) { bd = d; best = o; }
        }
        this.nearObj = best;
    },
    pickupTick() {
        const P = this.player;
        for (const k of this.pickups) {
            k.t++; const L = this.level;
            const dx = P.x - k.x, dy = P.y - 34 - k.y, d = Math.hypot(dx, dy);
            if (k.t > 24 && d < 200) { k.vx += dx / d * 1.1; k.vy += dy / d * 1.1; k.vx *= .9; k.vy *= .9; }
            else { k.vy = Math.min(k.vy + .35, 9); k.vx *= .96; if (L.solidAt(k.x, k.y + k.vy + 3)) { k.vy = 0; k.vx *= .8; } }
            k.x += k.vx; k.y += k.vy;
            if (d < 24) {
                k.dead = true;
                if (k.kind === 'cell') { Save.data.cells += 1; Sound.sfx('pickup', { v: .3, gap: .05, p: 1.2 }); }
                else if (k.kind === 'heal') { P.heal(P.maxHp * .18); Sound.sfx('pickup'); }
                else { P.energy = Math.min(P.maxEnergy, P.energy + 35); P.ult = Math.min(100, P.ult + 10); Sound.sfx('pickup'); }
            }
            if (k.t > 900) k.dead = true;
        }
        this.pickups = this.pickups.filter(k => !k.dead);
    },
    crusherTick() {
        const P = this.player;
        for (const d of this.level.dyn) {
            if (!d.crush) continue;
            if (d.dy > .4 && P.x + 10 > d.x && P.x - 10 < d.x + d.w && P.y - 60 < d.y + d.h + 4 && P.y > d.y + d.h) { P.hurt(P.maxHp * .2, { unblockable: true, tick: true }); if (P.state !== 'dead') P.returnToSafe(); }
        }
    },
    arenaLavaTick() {
        const L = this.level, A = this.arena;
        if (!A || !A.risingLava || !L.flagsLava) return;
        if (!A.lava) { A.lava = { kind: 'lava', x: A.x0, y: A.y + 20, w: A.x1 - A.x0, h: 90 }; L.hazards.push(A.lava); }
        const u = (this.time % 840) / 840, tgt = u < .55 ? A.y + 16 : A.y - 40;
        if (this.boss && !this.boss.dead) { A.lava.y = U.lerp(A.lava.y, tgt, .012); A.lava.h = A.y + 110 - A.lava.y; } else { A.lava.y += 2; }
        if (Math.abs(A.lava.y - (A.y - 40)) < 3 && u > .9) this.say('', '', 1);
    },
    rockfall() {
        const P = this.player, x = P.x + U.rand(-260, 460), s = this.level.surfaceBelow(x, P.y - 300, 600); if (s === null || this.lockInput) return;
        if (this.level.indoors) return;
        Combat.warn({ shape: 'rect', x: x - 26, y: s - 70, w: 52, h: 70, t: 54, dmg: 18 * Game.diff.enemyDmg, unblockable: false, onFire: () => { VFX.debris(x, s, 44, '#3a2a26'); VFX.burst(x, s, '#ff7a18', 8, 5, 18, 6, 1); Sound.at('slam', x, { v: .4 }); } });
        this.delay(32, () => { Combat.shoot({ x, y: 0 }, 'rock', x, s - 22 * 18, 0, 18, { absDmg: 0, ghost: true, life: 22, r: 12 }); });
    },
    musicTick() {
        if (this.boss) return;
        const near = this.enemies.filter(e => !e.dead && e.state !== 'idle' && e.state !== 'patrol' && Math.abs(e.x - this.player.x) < 760);
        Music.setState(near.some(e => e.def.elite) ? 'elite' : near.length || this.combatLock ? 'combat' : 'calm');
    },
    camTick() {
        const c = this.cam, P = this.player, A = this.boss && this.arena;
        c.tz = this.cineCam ? this.cineCam.zoom : A && this.boss.form === 'wrath' ? 1.02 * Settings.camZoom : A ? Math.max(.68, VW / (A.x1 - A.x0 + 60)) * Settings.camZoom : 1.3 * Settings.camZoom;
        c.zoom = U.lerp(c.zoom, c.tz, .05);
        const vw = VW / c.zoom, vh = VH / c.zoom, L = this.level;
        let tx, ty;
        if (this.cineCam) { tx = this.cineCam.x - vw / 2; ty = this.cineCam.y - vh / 2; }
        else if (A) { const mid = (P.x + U.clamp(this.boss.aim().x, A.x0, A.x1)) / 2; tx = U.clamp(mid - vw / 2, A.x0 - 40, Math.max(A.x0 - 40, A.x1 + 40 - vw)); ty = A.y - vh * .78 + Math.min(0, P.y - A.y) * .3; }
        else { tx = P.x - vw / 2 + P.facing * 90 * Settings.camLead + P.vx * 8; ty = P.y - vh * .64 + P.vy * 3; if (Input.down('up') && P.grounded && Math.abs(P.vx) < .2 && !G.lockInput) ty -= 130; if (Input.down('down') && P.grounded && !G.lockInput) ty += 130; }
        c.x = U.lerp(c.x, tx, this.cineCam ? .05 : .09); c.y = U.lerp(c.y, ty, this.cineCam ? .05 : .1);
        c.x = U.clamp(c.x, 0, Math.max(0, L.pw - vw)); c.y = U.clamp(c.y, 0, Math.max(0, L.ph - vh));
    },
    startBoss() {
        const A = this.arena; this.bossHitTaken = this.player.lastHurt;
        const def = BOSSES[A.boss], b = new Boss(def, A.sx, A.sy);
        this.boss = b; this.enemies = this.enemies.filter(e => e.dead); this.enemies.push(b); this.setGates(['arena_l'], false); Sound.sfx('door');
        this.runScript(this.bossIntroScript(b, def));
    },
    *bossIntroScript(b, def) {
        this.lockInput = true; this.letterbox = 1; Music.stop(.8); this.player.vx = 0;
        yield 40; this.cineCam = { x: b.aim().x, y: Math.min(b.aim().y, this.arena.y - 180), zoom: 1 };
        Sound.sfx('roar'); this.addShake(12); yield 70;
        const lines = BOSS_INTRO[def.id] || [];
        for (const l of lines) { this.say(l[0], l[1], 118); yield 124; }
        this.bossTitle = { name: b.name, title: b.title, t: 0 }; Sound.sfx('bigboom'); this.flash = .5; this.addShake(18);
        Music.play(def.music, 'boss'); Ambience.set(this.level.region === 'volcano' ? 'lava' : this.level.theme.amb); yield 110;
        this.bossTitle = null; this.cineCam = null; this.letterbox = 0; this.lockInput = false; this.bossStartT = this.time; this.hitDuringBoss = false; this.player.lastHurt = 9999;
        b.start();
    }
};

const LevelScripts = {
    *eruptGate(o) {
        G.lockInput = true; G.letterbox = 1; const P = G.player;
        G.cineCam = { x: o.x + 40, y: o.y - 90, zoom: 1 }; Sound.sfx('distant_boom'); G.addShake(8); yield 50;
        for (let i = 0; i < 40; i++) { if (i % 4 === 0) { G.addShake(6); Sound.sfx('crumble', { v: .4 }); } yield 2; }
        G.flash = .8; Sound.sfx('bigboom'); G.addShake(24); G.eruption = 1;
        const w = G.level.dyn.find(d => d.id === 'erupt'); if (w) { w.hp = 0; w.damage(1); VFX.burst(w.x, w.y + 80, '#ff7a18', 36, 12, 40, 10, 1); }
        for (let i = 0; i < 14; i++) G.pillar(o.x + 50 + i * 26, o.y, 500, '#ff7a18', '#fff0a0', 40, true);
        yield 80; G.say('ROOK', 'The mountain just rearranged itself. Go!', 130);
        G.eruption = 0; G.cineCam = null; G.letterbox = 0; G.lockInput = false;
    }
};

const Game = {
    state: 'boot', perfN: 0, scaleCap: 0, canvas: null, ctx: null, diff: DIFFS.normal, accum: 0, last: 0, menuT: 0, fps: 60, frameMs: 0, returnTo: null, pendingCp: null,
    init() {
        Store.loadSettings();
        Input.init(); Light.init(); Post.init(); Stage.init();
        if (HEADLESS) return;
        this.canvas = document.getElementById('gameCanvas'); this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.applyVideo();
        window.addEventListener('resize', () => this.fit()); this.fit();
        UI.init();
        Input.listeners.push(e => { Sound.resume(); this.onKey(e); });
        window.addEventListener('pointerdown', () => Sound.resume());
        document.addEventListener('fullscreenchange', () => { Settings.fullscreen = !!document.fullscreenElement; });
        document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(); this.last = performance.now(); });
        Weather.set(null);
        this.state = 'title'; UI.show('title');
        requestAnimationFrame(t => this.frame(t));
    },
    applyVideo() {
        if (HEADLESS) return;
        // Auto scale renders at the window's real pixel size, so art stays crisp in fullscreen.
        const box = document.getElementById('stage'), px = (box.clientWidth || VW) * (window.devicePixelRatio || 1);
        const s = this.scale = Settings.renderScale || U.clamp(Math.ceil(px / VW * 4) / 4, 1, this.scaleCap || 2);
        if (this.canvas.width !== Math.round(VW * s)) { this.canvas.width = Math.round(VW * s); this.canvas.height = Math.round(VH * s); }
        Post.scratch = null;
        document.body.classList.toggle('crt', Settings.scanlines);
    },
    /** Letterboxes the fixed 16:9 virtual screen into the window; floor height no longer depends on window size. */
    fit() {
        const w = window.innerWidth, h = window.innerHeight, k = Math.min(w / VW, h / VH), box = document.getElementById('stage');
        box.style.width = Math.floor(VW * k) + 'px'; box.style.height = Math.floor(VH * k) + 'px';
        document.documentElement.style.setProperty('--ui', (k).toFixed(3));
        if (this.canvas) this.applyVideo();
    },
    onKey(e) {
        if (e.code === 'Escape' || e.code === 'KeyP') {
            if (this.state === 'play' && !G.dialog) this.pause();
            else if (this.state === 'pause') this.resume();
            else if (UI.cur && UI.back) UI.back();
        }
    },
    pause() { if (this.state !== 'play') return; this.state = 'pause'; UI.show('pause'); Sound.sfx('ui_back'); },
    resume() { if (this.state !== 'pause') return; this.state = 'play'; UI.hide(); Input.held = {}; },
    /* Fixed-step loop: game logic always runs at 60Hz regardless of the monitor. */
    frame(t) {
        requestAnimationFrame(n => this.frame(n));
        const dt = Math.min(100, t - this.last || 16.7); this.last = t; this.accum += dt;
        this.fps = U.lerp(this.fps, 1000 / dt, .05);
        const t0 = performance.now();
        let n = 0;
        while (this.accum >= 16.667 && n < 4) { this.tick(); this.accum -= 16.667; n++; }
        if (n === 4) this.accum = 0;
        if (n > 0) this.render();
        this.frameMs = U.lerp(this.frameMs, performance.now() - t0, .1);
        // Auto resolution holds 60fps on weak machines: it steps down before the player notices.
        if (this.state === 'play' && !Settings.renderScale && ++this.perfN >= 150) {
            this.perfN = 0;
            const slow = this.frameMs > 14 || this.fps < 48;
            if (slow && this.scale > 1) { this.scaleCap = Math.max(1, this.scale - .25); this.applyVideo(); }
            else if (slow && !Post.noBloom && this.fps < 40) Post.noBloom = true;
        }
    },
    tick() {
        Input.pollPad();
        this.menuT++;
        if (UI.cur) {
            // Gamepad menu navigation; keyboard navigation arrives through key events.
            const edge = k => Input.pad[k] && !Input.padPrev[k], nav = code => UI.keyNav({ code, preventDefault() { } });
            if (edge('down')) nav('ArrowDown'); if (edge('up')) nav('ArrowUp');
            if (edge('jump') && document.activeElement) document.activeElement.click();
        }
        if (this.state === 'play') {
            G.tick();
            if (Input.pad.pause && !Input.padPrev.pause) this.pause();
        } else if (this.state === 'cine') Cine.update();
        Input.endTick();
    },
    render() {
        const c = this.ctx, s = this.scale || 1; c.setTransform(s, 0, 0, s, 0, 0);
        if (this.state === 'cine') Cine.render(c);
        else if (this.state === 'play' || this.state === 'pause') Scene.draw(c, this.canvas);
        else Scene.menuBg(c, this.menuT);
    },
    /* ------- flow ------- */
    newGame(diffId) {
        Save.data = Save.fresh(diffId); this.diff = DIFFS[diffId]; Save.run = { damageDealt: 0, damageTaken: 0, kills: 0, time: 0, deaths: 0 };
        Save.write();
        this.playCut('opening', () => { UI.show('select', { next: () => this.deploy('city') }); this.state = 'menu'; });
    },
    loadSave() {
        if (!Save.load()) { UI.show('title'); return false; }
        this.diff = DIFFS[Save.data.diff] || DIFFS.normal; Save.run = { damageDealt: 0, damageTaken: 0, kills: 0, time: 0, deaths: 0 };
        return true;
    },
    continueGame() { if (this.loadSave()) this.toHub(); },
    toHub() { this.state = 'menu'; Music.play('train', 'calm'); Ambience.set('train'); UI.show('hub'); },
    playCut(id, cb) { UI.hide(); this.state = 'cine'; Cine.play(CUTS[id], cb); },
    /** Enter a level, resuming from a saved beacon when that beacon belongs to this level. */
    deploy(levelId, cpOverride) {
        UI.hide(); this.state = 'loading'; UI.showLoading(LEVELS[levelId] ? levelId : 'city');
        setTimeout(() => this.loadLevel(levelId, cpOverride), 40);
    },
    loadLevel(id, cpOverride) {
        const def = LEVELS[id](); const L = new Level(def);
        L.dyn = def.dynDefs.map(o => new Dyn(o)); L.objs = def.objs; L.hazards = def.hazards;
        Terrain.prepare(L);
        Object.assign(G, { level: L, enemies: [], projs: [], warns: [], fields: [], scripts: [], delays: [], flags: {}, boss: null, bossDone: false, arena: def.arena || null, combatLock: false, lockInput: false, letterbox: 0, lbA: 0, cineCam: null, banner: null, bigText: null, sayQ: [], sayCur: null, dialog: null, toasts: [], afters: [], pickups: [], pillars: [], storm: 0, stormOn: false, stormWarned: false, wind: 0, heat: 0, flash: 0, darken: 0, eruption: 0, ghosts: null, assist: null, clash: null, clashAllies: null, hitstop: 0, slowmo: 0, freeze: 0, tut: null, bossTitle: null, nearObj: null });
        VFX.reset();
        const P = G.player = new Player(Save.data.activeChar);
        L.dyn.forEach(d => { if (d.kind === 'gate' && d.open) { d.y = d.y0 - d.h + 8; d.active = false; } if (d.active === false && d.kind === 'mover') d.active = false; });
        // Saved checkpoints and collected items persist between sessions.
        let cp = cpOverride !== undefined ? cpOverride : (Save.data.cp && Save.data.cp.level === id ? Save.data.cp.cp : null);
        L.objs.forEach(o => {
            if (o.kind === 'chest' && Save.data.opened[o.id]) o.open = true;
            if (o.kind === 'lore' && Save.data.lore.includes(o.id)) o.read = true;
            if (o.kind === 'npc') { o.rig = new Rig(npcStyle(NPCS[o.id])); o.rig.play('talk', 0); o.facing = -1; o.rig.solve(); }
            if (o.kind === 'cryo' && Save.data.flags.zeroAwake) { o.open = true; G.setGates([o.gate], true); L.dyn.forEach(d => { if (d.id === o.gate) { d.y = d.y0 - d.h + 8; d.active = false; } }); }
        });
        for (const s of def.spawns) {
            const fly = ENEMIES[s.type].ai === 'flyer', y = fly ? s.y : (L.surfaceBelow(s.x, s.y, 700));
            if (y === null) { console.warn('Spawn without ground', s); continue; }
            G.spawn(s.type, s.x, y);
        }
        const sp = cp !== null && def.cps[cp] ? def.cps[cp] : { x: def.spawn.x * TILE, y: def.spawn.y * TILE };
        P.x = sp.x; P.y = sp.y; P.safe = { x: P.x, y: P.y }; P.grounded = true;
        G.cpId = cp === null ? 0 : cp;
        L.objs.forEach(o => { if (o.kind === 'beacon' && cp !== null && o.cpId <= cp) { o.lit = true; if (o.cpId === cp) o.cur = true; } });
        G.enemies = G.enemies.filter(e => Math.abs(e.x - P.x) > 260 || e.y < P.y - 200 || e.y > P.y + 200);
        G.cam.zoom = 1; G.cam.x = U.clamp(P.x - VW / 2, 0, L.pw - VW); G.cam.y = U.clamp(P.y - VH * .64, 0, Math.max(0, L.ph - VH));
        G.objective = OBJECTIVES[id] || ''; G.time = 0;
        Weather.set(def.weather); Music.play(def.theme.music, 'calm'); Ambience.set(def.theme.amb); Ambience.setStorm(0);
        G.titleCard = { name: def.name, sub: def.sub, t: 0 };
        UI.hideLoading(); this.state = 'play'; UI.hide();
    },
    onPlayerDead() { UI.show('gameover'); this.state = 'menu'; },
    retry() { this.deploy(G.level.id); },
    onBossDefeated(def) {
        const D = Save.data, R = def.reward;
        G.boss = null; G.bossDone = true; Save.ach(def.id);
        if (G.player.lastHurt > (G.time - (G.bossStartT || 0))) Save.ach('no_death_boss');
        Save.addXP(R.xp); D.cells += R.cells; if (R.relic && !D.relics.includes(R.relic)) D.relics.push(R.relic);
        if (R.shard) D.shards[R.shard] = true;
        G.player.recalc();
        Sound.sfx('victory'); Music.stop(.5); G.player.rig.play('victory', 8); G.player.locked = true; G.player.vx = 0;
        G.setGates(['arena_l'], true);
        D.cleared[G.level.id] = true; D.cp = null; Save.write();
        setTimeout(() => { if (this.state === 'play') { this.state = 'menu'; UI.show('results', { def }); } }, 1600);
        if (HEADLESS) { this.state = 'menu'; }
    },
    afterResults(def) {
        const id = def.id;
        if (id === 'vulkaris') { this.deploy('volcano3'); return; }
        const cut = { atlas: 'afterCity', sylvaris: 'afterForest', qareth: 'afterDesert', nadir: 'afterIce' }[id];
        if (cut) this.playCut(cut, () => this.toHub()); else this.toHub();
    },
    finishStage() {
        const L = G.level; Save.data.cleared[L.id] = true; Save.data.cp = null; Save.write();
        if (L.next) this.deploy(L.next);
    },
    unlockZero() {
        const D = Save.data; D.flags.zeroAwake = true; Save.ach('zero'); Save.write();
        this.state = 'cine'; Cine.play(CUTS.cryoReveal, () => { this.state = 'play'; Music.play(G.level.theme.music, 'calm'); G.toast('ZERO HAS AWOKEN', '#00ffff'); G.objective = 'Reach the frozen lake and take the last shard'; });
    },
    onFinalBossDefeated() {
        const D = Save.data; D.gameDone = true; D.cleared.volcano3 = true; D.cleared.volcano = true; Save.ach('endbringer'); if (D.diff === 'hard') Save.ach('hard_clear'); Save.write();
        this.playCut('ending', () => { this.state = 'menu'; UI.show('credits', { ending: true }); });
    }
};

const OBJECTIVES = {
    city: 'Find the First Seal on the overpass', forest: 'Find the Second Seal in the heart of the Garden', desert: 'Cross the dead sea and find the Beast', ice: 'Reach Nadir Station and take the Fourth Seal',
    volcano1: 'Climb Kalder to the Flaming Gate', volcano2: 'Open the Gate and defeat its Cherub', volcano3: 'Descend to the Lake of Fire'
};
function npcStyle(N) {
    return Looks.npc(enemyStyle({ col: { a: U.mix(N.look, '#000000', .45), b: N.look, g: '#ffd9a0', s: '#b5926d' }, gear: 'none' }), N);
}

/* Scene composition for a gameplay frame. */
const Scene = {
    draw(c, canvas) {
        const L = G.level, cam = G.cam, t = G.time, P = G.player;
        const sx = G.shake > 0 ? U.rand(-G.shake, G.shake) : 0, sy = G.shake > 0 ? U.rand(-G.shake, G.shake) : 0;
        G.shake *= .86; if (G.shake < .4) G.shake = 0;
        c.save();
        Backdrop.draw(c, L.bgVoid ? 'core' : L.bg, cam, t, L);
        if (L.bgVoid) { c.fillStyle = 'rgba(120,0,10,.3)'; c.fillRect(0, 0, VW, VH); }
        c.translate(sx, sy); c.scale(cam.zoom, cam.zoom); c.translate(-cam.x, -cam.y);
        for (const d of L.decor) if (d.x > cam.x - 300 && d.x < cam.x + VW / cam.zoom + 300 && !this.fg(d)) Decor[d.kind](c, d, t);
        Terrain.draw(c, L, cam);
        if (G.boss && G.boss.def.id === 'nadir') { /* boss sits behind the ice plates */ G.boss.draw(c); }
        DynArt.draw(c, L, cam);
        HazardArt.draw(c, L, cam, t);
        for (const l of L.lights) if (l.x > cam.x - 300 && l.x < cam.x + VW + 300) Light.add(l.x, l.y, l.r, l.col, l.flicker ? l.a * (.82 + Math.sin(t * .17 + l.x) * .1 + (Math.sin(t * 1.3 + l.y) > .96 ? -.4 : 0)) : l.a);
        ObjArt.draw(c, L);
        if (typeof FinalBG !== 'undefined') FinalBG.ghosts(c);
        Combat.drawFields(c);
        Combat.drawWarns(c);
        for (const p of G.pillars) this.pillar(c, p);
        for (const e of G.enemies) if (!e.boss && !e.flyer && !e.dead && e.x > cam.x - 100 && e.x < cam.x + VW / cam.zoom + 100) this.shadow(c, e.x, e.y, e.w * .9);
        this.shadow(c, P.x, P.grounded ? P.y : (L.surfaceBelow(P.x, P.y, 300) || -999), P.grounded ? 24 : 16);
        for (const e of G.enemies) { if (e.part || (e.boss && e.def.id === 'nadir')) continue; if (e.x > cam.x - 300 && e.x < cam.x + VW / cam.zoom + 300) e.draw(c); }
        for (const a of G.afters) { c.globalAlpha = (1 - a.t / 14) * .5; c.save(); c.translate(a.x, a.y); c.scale(a.facing * (a.S.scale || 1), a.S.scale || 1); Paint.flash = true; const tmp = Paint.c; Paint.c = () => a.col; paintHumanoid(c, a.J, a.S, a.rig); Paint.c = tmp; Paint.flash = false; c.restore(); c.globalAlpha = 1; }
        P.draw(c);
        if (G.assist) { const a = G.assist; this.shadow(c, a.x, a.y, 22); a.rig.draw(c, a.x, a.y, a.facing, Math.min(1, Math.min(a.t, a.life - a.t) / 16)); }
        if (G.clashAllies) for (const a of G.clashAllies) { this.shadow(c, a.x, G.arena.y, 22); a.rig.draw(c, a.x, G.arena.y, 1); }
        Light.add(P.x, P.y - 30, 200, P.def.style.col.glow, .55); Light.add(P.x, P.y - 30, 280, '#ffffff', .3);
        for (const pr of G.projs) { pr.draw(c); if (pr.kind !== 'knife') Light.add(pr.x, pr.y, 70, pr.col, .6); }
        for (const k of G.pickups) this.pickup(c, k);
        VFX.draw(c);
        VFX.drawFloaters(c);
        c.restore();
        if (L.theme.ambient) Light.apply(c, this.ambient(L), cam);
        Atmos.draw(c, cam, t, L);
        Weather.draw(c, cam, t, G.storm);
        if (G.storm > .02 && !G.covered) {
            const col = L.region === 'ice' ? '225,238,248' : '206,160,92', a = G.storm * (L.stormCycle && L.stormCycle.whiteout || G.boss ? .62 : .4);
            c.fillStyle = `rgba(${col},${a})`; c.fillRect(0, 0, VW, VH);
        }
        if (P.cold > 0 && L.region === 'ice') { c.fillStyle = 'rgba(160,210,255,.07)'; c.fillRect(0, 0, VW, VH); }
        if (G.darken > 0) { c.fillStyle = `rgba(0,0,0,${G.darken})`; c.fillRect(0, 0, VW, VH); }
        Post.heat(c, canvas, G.heat * (L.heat ? 1 : 0), t);
        Post.bloom(c, canvas);
        Atmos.foreground(c, cam, L);
        if (Settings.quality > 0) c.drawImage(Post.vignette, 0, 0, VW, VH);
        if (G.heat > .35) { c.fillStyle = `rgba(255,70,10,${(G.heat - .35) * .22})`; c.fillRect(0, 0, VW, VH); }
        if (G.hurtFlash > 0) { c.fillStyle = `rgba(255,20,10,${G.hurtFlash * .4})`; c.fillRect(0, 0, VW, VH); }
        if (G.flash > 0) { c.fillStyle = `rgba(255,255,255,${Math.min(1, G.flash)})`; c.fillRect(0, 0, VW, VH); }
        if (G.fade > 0) { c.fillStyle = `rgba(0,0,0,${Math.min(1, G.fade)})`; c.fillRect(0, 0, VW, VH); }
        HUD.draw(c);
    },
    fg() { return false; },
    /** Soft contact shadow, the cheapest way to plant figures on the ground. */
    shadow(c, x, y, w) { if (y < 0) return; c.globalAlpha = .5; c.drawImage(Glow.get('#000000'), x - w, y - 6, w * 2, 12); c.globalAlpha = 1; },
    ambient(L) { return L.bgMode === 'white' ? '#ffffff' : L.bgMode === 'void' ? '#d0a0a4' : L.bgMode === 'seraph' ? '#d8c0a8' : L.theme.ambient; },
    pillar(c, p) {
        const k = p.t / 34, up = k < .25 ? U.easeOut(k * 4) : k > .7 ? 1 - U.easeIn((k - .7) / .3) : 1, h = p.h * up;
        if (p.glow) {
            c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = p.col; c.globalAlpha = .8; c.fillRect(p.x - p.w / 2, p.y - h, p.w, h); c.fillStyle = p.tip; c.fillRect(p.x - p.w / 5, p.y - h, p.w / 2.5, h); c.restore(); Light.add(p.x, p.y - h / 2, 240, p.col, 1);
        } else { c.fillStyle = p.col; c.beginPath(); c.moveTo(p.x - p.w / 2, p.y); c.lineTo(p.x, p.y - h); c.lineTo(p.x + p.w / 2, p.y); c.fill(); c.fillStyle = p.tip; c.beginPath(); c.moveTo(p.x - 4, p.y - h + 30); c.lineTo(p.x, p.y - h); c.lineTo(p.x + 4, p.y - h + 30); c.fill(); }
    },
    pickup(c, k) {
        const col = k.kind === 'cell' ? '#7fffd4' : k.kind === 'heal' ? '#00ff88' : '#6cf', s = k.kind === 'cell' ? 4 : 7;
        c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get(col), k.x - s * 2.5, k.y - s * 2.5, s * 5, s * 5); c.restore();
        c.fillStyle = '#fff'; c.save(); c.translate(k.x, k.y); c.rotate(.785); c.fillRect(-s / 2, -s / 2, s, s); c.restore();
    },
    menuBg(c, t) {
        Backdrop.draw(c, 'volcano', { x: t * .12, y: 400, zoom: 1 }, t);
        c.fillStyle = 'rgba(5,2,8,.34)'; c.fillRect(0, 0, VW, VH);
        G.cam.x = G.cam.y = 0; G.cam.zoom = 1;
        if (Settings.quality && t % 3 === 0) VFX.add(U.rand(0, VW), VH + 10, U.rand(-.5, .9), U.rand(-3.2, -1.2), '#ff8a30', 170, 3.4, 1, 0);
        VFX.tick(); VFX.draw(c);
    }
};

/* In-world interactive objects. */
const ObjArt = {
    draw(c, L) {
        const t = G.time, cam = G.cam;
        for (const o of L.objs) {
            if (o.hidden || o.x < cam.x - 200 || o.x > cam.x + VW / cam.zoom + 200) continue;
            switch (o.kind) {
                case 'beacon': {
                    const on = o.lit, col = on ? '#00ffff' : '#556';
                    c.fillStyle = '#23262c'; c.fillRect(o.x - 4, o.y - 62, 8, 62); c.fillRect(o.x - 16, o.y - 6, 32, 6);
                    c.save(); c.translate(o.x, o.y - 72); c.rotate(t * .03); c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(-9, -9, 18, 18); c.restore();
                    if (on) { Paint.glow(c, o.x, o.y - 72, 30, col); Light.add(o.x, o.y - 60, 190, '#00ffff', o.cur ? 1 : .55); }
                    break;
                }
                case 'npc': o.rig.draw(c, o.x, o.y, o.facing); Light.add(o.x, o.y - 40, 130, '#ffd9a0', .5); break;
                case 'lore': {
                    const col = o.read ? '#556677' : '#00ffaa', y = o.y - 26 + Math.sin(t * .05 + o.x) * 3;
                    c.fillStyle = '#16181c'; c.fillRect(o.x - 12, y - 14, 24, 28); c.fillStyle = col; c.fillRect(o.x - 9, y - 11, 18, 3); c.fillRect(o.x - 9, y - 5, 12, 2); c.fillRect(o.x - 9, y, 15, 2);
                    if (!o.read) { Paint.glow(c, o.x, y, 26, col); Light.add(o.x, y, 90, col, .6); } break;
                }
                case 'chest': {
                    c.fillStyle = '#3a2a1a'; c.fillRect(o.x - 22, o.y - 22, 44, 22); c.fillStyle = '#c9a227'; c.fillRect(o.x - 22, o.y - 13, 44, 3); c.fillRect(o.x - 3, o.y - 16, 6, 8);
                    if (o.open) { c.fillStyle = '#2a1e12'; c.fillRect(o.x - 22, o.y - 34, 44, 12); } else { c.fillStyle = '#4a3622'; c.fillRect(o.x - 22, o.y - 30, 44, 9); Paint.glow(c, o.x, o.y - 22, 26, '#ffdd33'); }
                    break;
                }
                case 'lever': {
                    if (o.skin === 'valve') { c.fillStyle = '#2c2024'; c.fillRect(o.x - 10, o.y - 44, 20, 44); c.save(); c.translate(o.x, o.y - 50); c.rotate(o.on ? 1.6 : 0); c.strokeStyle = o.on ? '#00ffaa' : '#ff5a10'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.moveTo(-15, 0); c.lineTo(15, 0); c.moveTo(0, -15); c.lineTo(0, 15); c.stroke(); c.restore(); Light.add(o.x, o.y - 50, 90, o.on ? '#00ffaa' : '#ff5a10', .7); }
                    else if (o.skin === 'plate') { c.fillStyle = o.on ? '#33ddff' : '#6a5436'; c.fillRect(o.x - 22, o.y - (o.on ? 4 : 9), 44, o.on ? 4 : 9); Light.add(o.x, o.y - 20, 80, o.on ? '#33ddff' : '#ffcc55', .5); }
                    else if (o.skin === 'generator') { c.fillStyle = '#26384a'; c.fillRect(o.x - 24, o.y - 62, 48, 62); c.fillStyle = o.on ? '#2dd4bf' : '#ff5544'; c.fillRect(o.x - 15, o.y - 52, 30, 10); Light.add(o.x, o.y - 46, 110, o.on ? '#2dd4bf' : '#ff5544', .8); }
                    else { c.fillStyle = '#333'; c.fillRect(o.x - 8, o.y - 16, 16, 16); c.strokeStyle = '#ffdd33'; c.lineWidth = 4; c.beginPath(); c.moveTo(o.x, o.y - 14); c.lineTo(o.x + (o.on ? 14 : -14), o.y - 36); c.stroke(); }
                    break;
                }
                case 'rune': { const col = o.on ? '#7fffb0' : '#4a5a48'; c.fillStyle = '#3a4238'; c.beginPath(); c.moveTo(o.x - 16, o.y); c.lineTo(o.x - 9, o.y - 58); c.lineTo(o.x + 9, o.y - 62); c.lineTo(o.x + 16, o.y); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(o.x - 6, o.y - 44); c.lineTo(o.x + 6, o.y - 32); c.lineTo(o.x - 6, o.y - 20); c.stroke(); if (o.on) { Paint.glow(c, o.x, o.y - 32, 32, col); Light.add(o.x, o.y - 32, 130, col, .9); } break; }
                case 'cryo': { c.fillStyle = 'rgba(160,230,255,.3)'; c.fillRect(o.x - 34, o.y - 110, 68, 110); c.strokeStyle = '#d2f3ff'; c.lineWidth = 3; c.strokeRect(o.x - 34, o.y - 110, 68, 110); if (!o.open) { c.fillStyle = '#101018'; c.fillRect(o.x - 7, o.y - 88, 14, 76); Paint.glow(c, o.x, o.y - 60, 56, '#7fd8ff'); } Light.add(o.x, o.y - 60, 200, '#7fd8ff', 1); break; }
                case 'door': { c.fillStyle = '#ff2a00'; c.fillRect(o.x - 2, o.y - 40, 4, 40); break; }
            }
        }
    }
};
