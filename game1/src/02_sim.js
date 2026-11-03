'use strict';
// ===== Simulation: terrain, physics, combat, player kits. NO rendering here (runs in Node). =====
(function (PZ) {
  const T = PZ.TILE, clamp = PZ.clamp;
  PZ.G = 1800;

  // ---------------- Terrain (column heightfield with slopes, cliffs, pits) ----------------
  class Terrain {
    constructor() { this.yl = []; this.yr = []; this.cur = 460; this.plats = []; this.pillars = []; }
    get cols() { return this.yl.length; }
    get width() { return this.yl.length * T; }
    flat(n) { for (let i = 0; i < n; i++) { this.yl.push(this.cur); this.yr.push(this.cur); } return this; }
    slope(n, dy) { for (let i = 0; i < n; i++) { this.yl.push(this.cur); this.cur += dy; this.yr.push(this.cur); } return this; }
    cliff(dy) { this.cur += dy; return this; }
    pit(n) { for (let i = 0; i < n; i++) { this.yl.push(Infinity); this.yr.push(Infinity); } return this; }
    plat(colX, y, wCols) { this.plats.push({ x: colX * T, y, w: wCols * T }); return this; }
    surf(x) {
      const c = Math.floor(x / T);
      if (c < 0) return this.yl.length ? this.yl[0] : 460;
      if (c >= this.yl.length) return this.yl.length ? this.yr[this.yl.length - 1] : 460;
      const a = this.yl[c], b = this.yr[c];
      if (a === Infinity) return Infinity;
      return a + (b - a) * ((x - c * T) / T);
    }
    colX(c) { return c * T; }
  }
  PZ.Terrain = Terrain;

  const rectOf = e => ({ x0: e.x - e.w / 2, x1: e.x + e.w / 2, y0: e.y - e.h, y1: e.y });
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  PZ.rectOf = rectOf; PZ.overlap = overlap;
  function segRect(x0, y0, x1, y1, r) { // Liang–Barsky
    let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
    const p = [-dx, dx, -dy, dy], q = [x0 - r.x0, r.x1 - x0, y0 - r.y0, r.y1 - y0];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; }
      else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
    }
    return true;
  }
  PZ.segRect = segRect;

  // ---------------- Mods from skill tree ----------------
  PZ.computeMods = function (save, cid) {
    const m = { dmg: 0, crit: .05, ultCharge: 0, cdr: 0, speed: 0, dashCd: 0, skillDmg: 0, hp: 0, def: 0, regen: 0 };
    const tr = (save && save.tree && save.tree[cid]) || {};
    for (const b of PZ.TREE) { const n = tr[b.id] || 0; for (let i = 0; i < n && i < b.nodes.length; i++) for (const k in b.nodes[i]) m[k] += b.nodes[i][k]; }
    return m;
  };

  // ---------------- World ----------------
  class World {
    constructor(save, opts) {
      opts = opts || {};
      this.save = save || PZ.newSave();
      this.diff = PZ.DIFFS[opts.diff != null ? opts.diff : (PZ.Settings.diff || 1)];
      this.terrain = new Terrain(); this.ents = []; this.projs = []; this.zones = []; this.hazards = []; this.pickups = []; this.triggers = []; this.delayed = [];
      this.events = []; this.t = 0; this.frame = 0; this.nextId = 1; this.minX = 0; this.maxX = 1e9; this.worldH = 640;
      this.timeScale = 1; this.slowT = 0; this.timeStop = 0; this.dark = 0; this.darkTarget = 0; this.lock = null;
      this.scene = null; this.choice = null; this.over = null; this.boss = null; this.checkpoint = { x: 100, y: 0 };
      this.players = []; this.level = null; this.theme = 'dawn'; this.rng = PZ.rng(opts.seed || 1234);
      this.plague = 0; this.recordActions = []; // used by bosses that read player history
    }
    get player() { return this.players[0]; }
    emit(ev) { this.events.push(ev); if (this.events.length > 400) this.events.splice(0, 100); }
    sfx(id, x, o) { this.emit(Object.assign({ t: 'sfx', id, x: x == null ? (this.player ? this.player.x : 0) : x }, o || {})); }
    add(e) { e.id = this.nextId++; this.ents.push(e); return e; }
    enemies() { return this.ents.filter(e => e.team === 'enemy' && !e.dead); }
    surf(x) { return this.terrain.surf(x); }
    after(d, fn) { this.delayed.push({ t: d, fn }); }
    slowmo(d, s) { this.slowT = Math.max(this.slowT, d); this.timeScale = s || .3; this.emit({ t: 'slowmo', d }); }

    update(intents) {
      const real = PZ.DT;
      if (this.slowT > 0) { this.slowT -= real; if (this.slowT <= 0) this.timeScale = 1; }
      const dt = real * this.timeScale;
      this.t += dt; this.frame++;
      this.dark += (this.darkTarget - this.dark) * Math.min(1, real * 2.5);
      for (let i = this.delayed.length - 1; i >= 0; i--) { const d = this.delayed[i]; d.t -= dt; if (d.t <= 0) { this.delayed.splice(i, 1); d.fn(this); } }
      this.players.forEach((p, i) => PZ.updatePlayer(this, p, intents[i] || PZ.makeIntent(), dt));
      if (this.timeStop > 0) { this.timeStop -= real; }
      const frozen = this.timeStop > 0;
      for (const e of this.ents) { if (e.dead && !e.corpse) continue; if (e.kind === 'player') continue; if (frozen && e.team === 'enemy') continue; PZ.updateEnt(this, e, dt); }
      this.ents = this.ents.filter(e => !e.remove);
      PZ.updateProjs(this, dt, frozen);
      PZ.updateZones(this, dt);
      for (let i = this.hazards.length - 1; i >= 0; i--) { const h = this.hazards[i]; h.t += dt; if (h.update) h.update(this, h, dt); if (h.dead) this.hazards.splice(i, 1); }
      for (const tr of this.triggers) if (!tr.done && this.player && this.player.x >= tr.x) { tr.done = true; tr.fn(this, tr); }
      PZ.updatePickups(this);
      if (this.plague > 0) this.plague -= dt;
    }
  }
  PZ.World = World;

  // ---------------- physics ----------------
  PZ.physics = function (w, e, dt, o) {
    o = o || {};
    const ter = w.terrain;
    const prevY = e.y;
    if (!e.fly) {
      const gmul = e.gmul || 1;
      e.vy += PZ.G * gmul * dt;
      if (e.wallSlide && e.vy > 120) e.vy = 120;
      if (e.vy > 1300) e.vy = 1300;
    }
    // horizontal with wall check
    let nx = e.x + e.vx * dt;
    e.wall = 0;
    if (!e.fly) {
      const dir = PZ.sign(e.vx);
      if (dir) {
        const edge = nx + dir * e.w / 2, ge = ter.surf(edge);
        if (ge < e.y - 14) { // wall
          const c = Math.floor(edge / T);
          nx = dir > 0 ? c * T - e.w / 2 - .01 : (c + 1) * T + e.w / 2 + .01;
          e.vx = 0; e.wall = dir;
        }
      }
    }
    const lo = w.minX + e.w / 2, hi = Math.min(w.maxX, ter.width || 1e9) - e.w / 2;
    if (nx < lo) { nx = lo; e.vx = Math.max(0, e.vx); e.wall = -1; } else if (nx > hi) { nx = hi; e.vx = Math.min(0, e.vx); e.wall = 1; }
    e.x = nx;
    e.y += e.vy * dt;
    if (e.fly) return;
    const wasGround = e.onGround; e.onGround = false; e.onPlat = null;
    const g = ter.surf(e.x);
    if (g !== Infinity) {
      if (e.y >= g && (prevY <= g + 20 || wasGround)) { e.y = g; e.vy = 0; e.onGround = true; }
      else if (wasGround && e.vy >= 0 && g - e.y < 18 && g - e.y > 0) { e.y = g; e.vy = 0; e.onGround = true; } // stick on downslopes
    }
    if (!e.onGround && e.vy >= 0 && !e.dropT) {
      for (const p of ter.plats) {
        if (e.x >= p.x && e.x <= p.x + p.w && prevY <= p.y + 1 && e.y >= p.y) { e.y = p.y; e.vy = 0; e.onGround = true; e.onPlat = p; break; }
      }
    }
    if (e.dropT) e.dropT -= dt;
  };

  // ---------------- damage ----------------
  PZ.hurt = function (w, tgt, amt, src, o) {
    o = o || {};
    if (!tgt || tgt.dead || amt <= 0) return 0;
    if (tgt.untouchable) return 0;
    if (tgt.iframes > 0 && !o.pierceI) return 0;
    const dirX = o.dir != null ? o.dir : (src ? PZ.sign(tgt.x - src.x) || 1 : 1);
    if (tgt.kind === 'player') {
      if (tgt.parry > 0 && !o.unparryable) { PZ.onParry(w, tgt, src); return 0; }
      if (tgt.immune > 0) { w.emit({ t: 'immune', x: tgt.x, y: tgt.y - 40 }); return 0; }
      amt *= w.diff.dmgTaken * (1 - tgt.def);
      if (tgt.guard && tgt.face === -dirX && !o.unblockable) { amt *= (1 - tgt.guard); w.sfx('block', tgt.x); }
      if (tgt.form === 'light' && tgt.balance < 15) amt *= 1.3;
      if (tgt.rage != null) tgt.rage = Math.min(100, tgt.rage + amt * 1.2);
      tgt.ult = Math.min(100, tgt.ult + amt * .35);
      w.save.stats.lastHitBy = o.name || (src && src.type) || '';
    } else {
      if (tgt.lightOnly && o.elem !== 'light') amt *= .25;
      if (tgt.shieldFront && PZ.sign(src ? src.x - tgt.x : -dirX) === tgt.face && !(o.armorBreak > 0) && tgt.state !== 'stunned') { amt *= .3; w.sfx('clang', tgt.x); w.emit({ t: 'spark', x: tgt.x + tgt.face * tgt.w / 2, y: tgt.y - tgt.h / 2 }); }
      if (tgt.vulnMul) amt *= tgt.vulnMul;
      if (tgt.armor && !(o.armorBreak > 0)) amt *= (1 - tgt.armor);
    }
    let crit = false;
    if (o.critChance && Math.random() < o.critChance) { amt *= 1.75; crit = true; }
    if (o.forceCrit) { amt *= 1.75; crit = true; }
    amt = Math.max(1, Math.round(amt));
    tgt.hp -= amt;
    tgt.hitFlash = .12;
    w.emit({ t: 'hit', x: tgt.x, y: tgt.y - tgt.h * .6, amt, crit, elem: o.elem || 'phys', team: tgt.team, big: amt > 30 || crit });
    if (o.kb && !tgt.heavy) { tgt.vx += dirX * o.kb; if (!tgt.fly && o.kb > 200) tgt.vy = Math.min(tgt.vy, -160); }
    if (o.stun && !tgt.boss) { tgt.stunT = Math.max(tgt.stunT || 0, o.stun); }
    if (o.stun && tgt.boss && o.stun >= 1) { tgt.stunT = Math.max(tgt.stunT || 0, .35); }
    if (o.poison) tgt.poison = Math.min(30, (tgt.poison || 0) + o.poison);
    if (o.bleed) tgt.bleed = Math.min(30, (tgt.bleed || 0) + o.bleed);
    if (tgt.kind === 'player') { tgt.iframes = .5; tgt.hurtT = .25; w.emit({ t: 'shake', m: 6 }); w.sfx('hurt', tgt.x); }
    else if (tgt.kind !== 'player' && tgt.hurtT != null) tgt.hurtT = .15;
    if (tgt.hp <= 0) {
      if (tgt.boss) { tgt.hp = 0; if (tgt.onDefeat) tgt.onDefeat(w, tgt); }
      else if (tgt.kind === 'player') PZ.playerDie(w, tgt);
      else PZ.killEnt(w, tgt, src);
    }
    return amt;
  };

  PZ.killEnt = function (w, e, src) {
    e.dead = true; e.deathT = 0; e.corpse = true;
    w.emit({ t: 'death', x: e.x, y: e.y - e.h / 2, color: e.color, kind: e.type });
    w.sfx('kill', e.x);
    if (e.team === 'enemy') {
      w.save.stats.kills++;
      if (e.def && e.def.name) PZ.codexUnlock(w.save, 'enemy_' + e.type);
      const n = (e.elite ? 3 : 0) + (w.rng() < .35 ? 1 : 0);
      for (let i = 0; i < n; i++) w.pickups.push({ kind: 'seed', x: e.x + (i - n / 2) * 14, y: e.y - 20, vy: -300, t: 0 });
      if (w.rng() < .12) w.pickups.push({ kind: 'orb', x: e.x, y: e.y - 20, vy: -260, t: 0 });
      if (w.plague > 0 && !e.boss && !e.risen) { // Mirae's plague raises the dead as allies
        w.after(.6, () => { const r = PZ.spawnEnemy(w, e.type, e.x, e.y); r.team = 'player'; r.hp = r.maxHp * .5; r.life = 8; r.risen = true; w.emit({ t: 'rise', x: r.x, y: r.y }); });
      }
    }
  };

  PZ.codexUnlock = function (save, key) { if (!save.codex[key]) { save.codex[key] = 1; save._codexNew = key; } };

  // ---------------- Player ----------------
  PZ.makePlayer = function (w, cid, save, slot) {
    const d = PZ.CHARS[cid], mods = PZ.computeMods(save, cid);
    const p = {
      kind: 'player', team: 'player', cid, def0: d, slot: slot || 0, x: 120, y: 300, vx: 0, vy: 0, w: 22, h: 62, face: 1,
      maxHp: Math.round(d.hp * (1 + mods.hp)), hp: 0, def: Math.min(.6, d.armor + mods.def), mods,
      speed: d.speed * (1 + mods.speed), jumpV: d.jump, airJumps: d.airJumps, jumpsLeft: d.airJumps,
      onGround: false, coyote: 0, jumpBuf: 0, wall: 0, wallSlide: false,
      weapons: d.weapons.slice(), wIdx: 0, atk: null, comboIdx: -1, comboT: 0, cds: { s1: 0, s2: 0, s3: 0 }, dashCd: 0, dashT: 0,
      iframes: 0, parry: 0, immune: 0, hurtT: 0, ult: 0, buffs: {}, anim: { t: 0, run: 0 }, stats: { hits: 0 }, guard: 0,
      form: cid === 'zero' ? 'light' : null, balance: 50, formCd: 0, rage: cid === 'rook' ? 0 : null, hunger: cid === 'ysolde' ? 20 : null,
      idleT: 0, lastHitT: 0, flight: cid === 'vesper' ? 4 : null, revive: cid === 'vesper' ? 1 : 0, regenAcc: 0
    };
    // boss weapons owned are usable by anyone; append if owned
    for (const wid in PZ.WEAPONS) if (PZ.WEAPONS[wid].owner === '*' && save.weapons[wid]) p.weapons.push(wid);
    if (save.equip && save.equip[cid] != null) p.wIdx = clamp(save.equip[cid], 0, p.weapons.length - 1);
    p.hp = p.maxHp;
    return p;
  };
  PZ.weaponOf = p => PZ.WEAPONS[p.weapons[p.wIdx]];

  PZ.playerDmgMul = function (w, p) {
    let m = 1 + p.mods.dmg;
    if (p.form === 'light') m *= .9; else if (p.form === 'wrath') m *= 1.45;
    if (p.rage != null) m *= 1 + p.rage / 200;
    if (p.hunger != null) m *= 1 + p.hunger / 150;
    if (w.save.equippedRelics.includes('quietbell') && p.hp >= p.maxHp) m *= 1.15;
    const tier = (w.save.weapons[p.weapons[p.wIdx]] || {}).tier || 0;
    return m * PZ.TIERS[tier].mul;
  };

  PZ.onParry = function (w, p, src) {
    p.parry = 0; p.iframes = .4;
    PZ.heal(w, p, 12);
    if (src && !src.dead && src.kind !== 'player') { src.stunT = Math.max(src.stunT || 0, src.boss ? .8 : 1.6); }
    w.emit({ t: 'parry', x: p.x, y: p.y - 34 }); w.sfx('parry', p.x); w.slowmo(.35, .25);
    p.ult = Math.min(100, p.ult + 12);
    if (w.save.equippedRelics.includes('mirrorparry')) PZ.spawnProj(w, p, { x: p.x, y: p.y - 34, vx: p.face * 1100, vy: 0, d: 30, life: .7, size: 10, pierce: 9, elem: 'light', look: 'ray' });
  };

  PZ.heal = function (w, e, n) {
    if (!e || e.dead) return;
    const before = e.hp; e.hp = Math.min(e.maxHp, e.hp + n);
    if (e.hp - before >= 1) w.emit({ t: 'heal', x: e.x, y: e.y - e.h, amt: Math.round(e.hp - before) });
  };

  PZ.playerDie = function (w, p) {
    if (p.revive > 0) { p.revive--; p.hp = p.maxHp * .5; p.iframes = 2; w.emit({ t: 'rebirth', x: p.x, y: p.y }); w.sfx('rebirth', p.x); return; }
    p.hp = 0; p.dead = true; w.over = 'dead'; w.save.stats.deaths++; w.emit({ t: 'pdeath', x: p.x, y: p.y }); w.sfx('pdeath', p.x);
  };

  PZ.respawnPlayer = function (w, p) {
    p.dead = false; p.hp = p.maxHp; p.x = w.checkpoint.x; p.y = (w.surf(p.x) === Infinity ? 300 : w.surf(p.x)); p.vx = p.vy = 0; p.iframes = 1.5; w.over = null;
    p.atk = null; p.cds = { s1: 0, s2: 0, s3: 0 };
  };

  // melee hit resolution
  PZ.doMelee = function (w, p, hit, wep, mul, o) {
    o = o || {};
    const reach = hit.r, hh = hit.h, cy = p.y - 32;
    const box = hit.kind === 'spin' ? { x0: p.x - reach, x1: p.x + reach, y0: cy - hh / 2, y1: cy + hh / 2 }
      : { x0: Math.min(p.x, p.x + p.face * reach), x1: Math.max(p.x, p.x + p.face * reach), y0: cy - hh / 2, y1: cy + hh / 2 };
    w.emit({ t: 'slash', x: p.x, y: cy, face: p.face, r: reach, h: hh, kind: hit.kind, elem: wep.elem, shape: wep.shape, ghost: !!o.ghost, idx: o.idx || 0, form: p.form });
    let hits = 0;
    for (const e of w.ents) {
      if (e.team !== 'enemy' || e.dead || e.untouchable) continue;
      if (!overlap(box, rectOf(e))) continue;
      hits++;
      PZ.applyHit(w, p, e, hit.d * mul, hit, wep);
    }
    if (hits && hit.shake) w.emit({ t: 'shake', m: hit.shake });
    return hits;
  };

  PZ.applyHit = function (w, p, e, dmg, hit, wep) {
    let elem = wep.elem;
    if (p.form === 'light') elem = 'light'; else if (p.form === 'wrath') elem = 'void';
    const o = { elem, kb: hit.kb, stun: hit.stun, critChance: p.mods.crit, armorBreak: (wep.armorBreak || 0) + (p.form === 'wrath' ? 1 : 0), poison: wep.poison, bleed: wep.bleed, dir: PZ.sign(e.x - p.x) || p.face };
    if (p.buffs.nextCrit) { o.forceCrit = true; dmg *= p.buffs.nextCrit; p.buffs.nextCrit = 0; p.buffs.veil = 0; }
    const dealt = PZ.hurt(w, e, dmg, p, o);
    if (dealt > 0) {
      p.stats.hits++; p.lastHitT = w.t;
      p.ult = Math.min(100, p.ult + dealt / 7 * (1 + p.mods.ultCharge));
      if (p.form === 'light') PZ.heal(w, p, .6);
      if (wep.lifesteal) PZ.heal(w, p, dealt * wep.lifesteal);
      if (p.cid === 'sable') { e.marks = Math.min(5, (e.marks || 0) + 1); if (e.marks >= 5 && !e.dead) { e.marks = 0; PZ.hurt(w, e, 20, p, { elem: 'shadow', pierceI: true }); w.emit({ t: 'markpop', x: e.x, y: e.y - e.h / 2 }); } }
      if (p.hunger != null) p.hunger = Math.max(0, p.hunger - 3);
      if (w.save.equippedRelics.includes('emberheart') && p.stats.hits % 5 === 0) e.burn = 3;
      w.sfx(wep.sfx + '_hit', e.x);
      if (dealt > 40) w.slowmo(.12, .35);
    }
    return dealt;
  };

  PZ.spawnProj = function (w, owner, o) {
    const pr = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, d: 10, life: 1, size: 6, pierce: 1, grav: 0, team: owner ? owner.team : 'enemy', owner, hitSet: new Set(), t: 0, elem: 'light', look: 'bolt' }, o);
    w.projs.push(pr); return pr;
  };
  PZ.spawnZone = function (w, owner, o) {
    const z = Object.assign({ x: 0, y: 0, r: 80, life: 2, dps: 0, team: owner ? owner.team : 'enemy', owner, t: 0, tick: 0, elem: 'poison', look: 'smoke' }, o);
    w.zones.push(z); return z;
  };

  // weapon "fire" (when attack reaches its active frame)
  PZ.fireHit = function (w, p, hit, wep, idx, ghost) {
    const mul = PZ.playerDmgMul(w, p) * (ghost ? .6 : 1);
    if (hit.kind === 'proj') {
      const pj = hit.proj, n = pj.spread || 1;
      for (let i = 0; i < n; i++) {
        const ang = (i - (n - 1) / 2) * .14;
        PZ.spawnProj(w, p, { x: p.x + p.face * 20, y: p.y - 36, vx: p.face * pj.v * Math.cos(ang), vy: (pj.vy || 0) + pj.v * Math.sin(ang), d: hit.d * mul, life: pj.life, size: pj.size, pierce: pj.pierce || 1, grav: pj.grav || 0, home: pj.home || 0, burst: pj.burst || 0, heal: pj.heal || 0, elem: p.form === 'light' ? 'light' : wep.elem, wep, hit, look: wep.shape, returns: pj.returns });
      }
      w.sfx(wep.sfx, p.x);
    } else if (hit.kind === 'zone') {
      PZ.doMelee(w, p, hit, wep, mul, { idx, ghost });
      PZ.spawnZone(w, p, { x: p.x + p.face * 40, y: p.y - 20, r: hit.zone.r, life: hit.zone.life, dps: hit.zone.dps * mul, slow: hit.zone.slow, elem: wep.elem, heal: p.cid === 'mirae' ? 3 : 0, wep });
      w.sfx(wep.sfx, p.x);
    } else {
      w.sfx(wep.sfx, p.x, { idx });
      const n = PZ.doMelee(w, p, hit, wep, mul, { idx, ghost });
      if (hit.kind === 'pull') { // chain: pull enemies; if none, pull self forward
        if (!n) { p.vx = p.face * 900; p.vy = -200; w.emit({ t: 'chainpull', x: p.x, y: p.y - 32, face: p.face }); }
      }
      if (hit.wave) PZ.spawnProj(w, p, { x: p.x + p.face * 40, y: p.y - 14, vx: p.face * hit.wave.v, d: hit.wave.d * mul, life: hit.wave.life, size: 18, pierce: 9, elem: wep.elem, look: 'wave', ground: true, wep, hit });
    }
  };

  // ---------------- player update ----------------
  PZ.updatePlayer = function (w, p, I, dt) {
    p.anim.t += dt;
    if (p.dead) { p.vx *= .9; PZ.physics(w, p, dt); return; }
    const realDt = PZ.DT;
    // timers
    for (const k in p.cds) if (p.cds[k] > 0) p.cds[k] -= dt;
    ['dashCd', 'iframes', 'parry', 'hurtT', 'formCd', 'comboT', 'coyote', 'jumpBuf'].forEach(k => { if (p[k] > 0) p[k] -= dt; });
    if (p.immune > 0) { p.immune -= dt; if (p.buffs.stand && (Math.abs(p.vx) > 40 || !p.onGround)) { p.immune = 0; p.buffs.stand = 0; } }
    for (const k in p.buffs) if (typeof p.buffs[k] === 'number' && k !== 'nextCrit' && p.buffs[k] > 0) { p.buffs[k] -= dt; if (p.buffs[k] <= 0) p.buffs[k] = 0; }
    if (p.buffs.hot > 0) PZ.heal(w, p, 4 * dt);
    if (p.mods.regen) { p.regenAcc += p.mods.regen * dt; if (p.regenAcc >= 1) { PZ.heal(w, p, Math.floor(p.regenAcc)); p.regenAcc %= 1; } }
    // track idle (for the 'let go' mechanic and bosses reading input history)
    const any = PZ.ACTIONS.some(a => I[a]);
    p.idleT = any ? 0 : p.idleT + realDt;
    // passives
    if (p.form) {
      p.balance = clamp(p.balance + (p.form === 'light' ? -6 : 6) * dt, 0, 100);
      if (p.form === 'wrath' && p.balance > 85) { p.hp -= 3 * dt; if (p.hp < 1) p.hp = 1; }
      if (I.formP && p.formCd <= 0) PZ.switchForm(w, p);
    }
    if (p.rage != null) p.rage = Math.max(0, p.rage - 4 * dt);
    if (p.hunger != null) {
      if (w.t - p.lastHitT > 1.5) p.hunger = Math.min(100, p.hunger + 7 * dt);
      if (p.hunger > 50) { p.hp -= (p.hunger - 50) / 25 * dt; if (p.hp < 1) p.hp = 1; }
    }
    // weapon switch
    if (I.weaponP && !p.atk) { p.wIdx = (p.wIdx + 1) % p.weapons.length; w.save.equip[p.cid] = p.wIdx; w.emit({ t: 'weapon', name: PZ.tr(PZ.weaponOf(p).name) }); w.sfx('swap', p.x); }

    const wep = PZ.weaponOf(p);
    p.guard = (wep.guard && I.attack && !p.atk && p.onGround) ? wep.guard : 0;
    // dash
    if (I.dashP && p.dashCd <= 0 && !p.atk) {
      p.dashT = .17; p.dashCd = .6 * (1 - p.mods.dashCd); p.iframes = Math.max(p.iframes, .2); p.vx = (I.left ? -1 : I.right ? 1 : p.face) * 720; p.vy = Math.min(p.vy, 0) * .2;
      p.face = PZ.sign(p.vx); w.sfx('dash', p.x); w.emit({ t: 'dash', x: p.x, y: p.y, face: p.face });
    }
    // skills
    const skills = p.def0.skills;
    ['s1', 's2', 's3'].forEach((k, i) => {
      if (I[k + 'P'] && p.cds[k] <= 0 && !p.stunT) {
        const sid = skills[i], sd = PZ.SKILLS[sid], vr = PZ.VARIANTS[(w.save.variants[sid] || 'A')];
        const ok = PZ.useSkill(w, p, sid, vr.dmg * (1 + p.mods.skillDmg));
        if (ok !== false) { p.cds[k] = sd.cd * vr.cd * (1 - p.mods.cdr); w.save.stats.skillUse[sid] = (w.save.stats.skillUse[sid] || 0) + 1; w.recordActions.push({ t: w.t, a: sid }); }
      }
    });
    if (I.ultP && p.ult >= 100) { p.ult = 0; PZ.useSkill(w, p, p.def0.ult, 1 + p.mods.skillDmg); w.save.stats.skillUse[p.def0.ult] = (w.save.stats.skillUse[p.def0.ult] || 0) + 1; }

    // attack
    if (I.attackP) {
      const combo = wep.combo;
      const canChain = p.atk && p.atk.t >= p.atk.hit.t * .55;
      if (!p.atk || canChain) {
        const idx = (p.atk || p.comboT > 0) ? (p.comboIdx + 1) % combo.length : 0;
        const hit = combo[idx];
        p.comboIdx = idx; p.atk = { hit, wep, t: 0, done: false, idx };
        if (I.left) p.face = -1; else if (I.right) p.face = 1;
        p.vx = p.face * (hit.lunge || 0) + p.vx * .2;
        w.recordActions.push({ t: w.t, a: 'atk' + idx });
        if (p.buffs.twin > 0 && hit.kind !== 'proj') w.after(.12, () => { if (!p.dead) PZ.fireHit(w, p, hit, wep, idx, true); });
      }
    }
    const spdMul = p.form === 'light' ? 1.2 : p.form === 'wrath' ? .8 : 1;
    if (p.atk) {
      p.atk.t += dt * spdMul;
      if (!p.atk.done && p.atk.t >= p.atk.hit.at) { p.atk.done = true; PZ.fireHit(w, p, p.atk.hit, p.atk.wep, p.atk.idx, false); }
      if (p.atk.t >= p.atk.hit.t) { p.atk = null; p.comboT = .45; }
    } else if (p.comboT <= 0) p.comboIdx = -1;

    // movement
    const mv = (I.left ? -1 : 0) + (I.right ? 1 : 0);
    let spd = p.speed * (p.form === 'light' ? 1.1 : p.form === 'wrath' ? .9 : 1) * (p.slowT > 0 ? .5 : 1);
    if (p.slowT > 0) p.slowT -= dt;
    if (p.dashT > 0) { p.dashT -= dt; if (p.dashT <= 0) p.vx *= .35; }
    else if (p.stunT > 0) { p.stunT -= dt; p.vx *= .85; }
    else {
      const atkSlow = p.atk ? .25 : 1;
      const target = mv * spd * atkSlow;
      const acc = p.onGround ? 3200 : 1800;
      if (Math.abs(target - p.vx) < acc * dt) p.vx = target; else p.vx += PZ.sign(target - p.vx) * acc * dt;
      if (mv && !p.atk) p.face = mv;
    }
    // jump
    if (p.onGround) { p.coyote = .1; p.jumpsLeft = p.airJumps; if (p.flight != null) p.flight = Math.min(4, p.flight + dt * 2); }
    if (I.jumpP) p.jumpBuf = .12;
    p.wallSlide = !p.onGround && p.wall !== 0 && p.vy > 0 && ((p.wall > 0 && I.right) || (p.wall < 0 && I.left));
    if (p.jumpBuf > 0 && !p.stunT) {
      if (I.down && p.onPlat) { p.dropT = .25; p.onGround = false; p.y += 2; p.jumpBuf = 0; }
      else if (p.coyote > 0) { p.vy = -p.jumpV; p.coyote = 0; p.jumpBuf = 0; p.onGround = false; w.sfx('jump', p.x); w.emit({ t: 'jump', x: p.x, y: p.y }); }
      else if (p.wallSlide || (p.wall !== 0 && !p.onGround)) { p.vy = -p.jumpV * .9; p.vx = -p.wall * 420; p.face = -p.wall; p.jumpBuf = 0; w.sfx('jump', p.x); w.emit({ t: 'walljump', x: p.x, y: p.y }); }
      else if (p.jumpsLeft > 0) { p.jumpsLeft--; p.vy = -p.jumpV * .88; p.jumpBuf = 0; w.sfx('jump2', p.x); w.emit({ t: 'djump', x: p.x, y: p.y }); }
    }
    if (!I.jump && p.vy < -260 && !p.dashT) p.vy += 2600 * dt; // variable jump height
    // vesper flight
    p.flying = false;
    if (p.flight != null && !p.onGround && I.jump && p.vy > -50 && p.flight > 0) { p.flying = true; p.flight -= dt; p.vy = I.up ? -220 : I.down ? 220 : Math.min(p.vy, 30) * .5; }
    if (p.dashT > 0) p.vy = Math.min(p.vy, 40);
    PZ.physics(w, p, dt);
    // pit
    if (p.y > w.worldH + 120) {
      PZ.hurt(w, p, p.maxHp * .15, null, { pierceI: true, unparryable: true, name: 'fall' });
      if (!p.dead) { p.x = w.checkpoint.x; p.y = w.surf(p.x) === Infinity ? 200 : w.surf(p.x) - 1; p.vx = p.vy = 0; p.iframes = 1; }
    }
  };

  PZ.switchForm = function (w, p) {
    const off = Math.abs(p.balance - 50);
    const from = p.form; p.form = from === 'light' ? 'wrath' : 'light'; p.formCd = .6;
    w.sfx('form_' + p.form, p.x); w.emit({ t: 'form', form: p.form, x: p.x, y: p.y - 30 });
    if (off > 20) { // transition strike
      p.balance += (50 - p.balance) * .6;
      const dm = (p.form === 'wrath' ? 34 : 24) * PZ.playerDmgMul(w, p);
      for (const e of w.enemies()) { const dx = e.x - p.x, dy = (e.y - e.h / 2) - (p.y - 30); if (dx * dx + dy * dy < 140 * 140) PZ.hurt(w, e, dm, p, { elem: p.form === 'light' ? 'light' : 'void', kb: 300 }); }
      if (p.form === 'light') PZ.heal(w, p, 8);
      w.emit({ t: 'formburst', x: p.x, y: p.y - 30, form: p.form }); w.emit({ t: 'shake', m: 7 });
    }
  };

  // ---------------- skills ----------------
  const nearestEnemy = (w, p, range, filt) => { let best = null, bd = range * range; for (const e of w.ents) { if (e.team !== 'enemy' || e.dead || e.untouchable) continue; if (filt && !filt(e)) continue; const dx = e.x - p.x, dy = e.y - p.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e; } } return best; };
  PZ.nearestEnemy = nearestEnemy;
  const onScreen = (w, p) => w.enemies().filter(e => Math.abs(e.x - p.x) < 560 && !e.untouchable);

  PZ.useSkill = function (w, p, sid, pw) {
    const dm = PZ.playerDmgMul(w, p) * pw;
    w.emit({ t: 'skill', id: sid, x: p.x, y: p.y, face: p.face, cid: p.cid });
    w.sfx('skill_' + sid, p.x);
    switch (sid) {
      case 'twin': p.buffs.twin = 6; break;
      case 'forgive': p.parry = .35; break;
      case 'genstep': {
        const x0 = p.x; p.dashT = .2; p.iframes = .3; p.vx = p.face * 1500; p.dashCd = .2;
        w.after(.2, () => { const a = Math.min(x0, p.x), b = Math.max(x0, p.x); PZ.spawnZone(w, p, { x: (a + b) / 2, y: p.y - 30, rect: { x0: a, x1: b, y0: p.y - 70, y1: p.y }, life: 1.4, burst: 22 * dm, dps: 10 * dm, elem: 'light', look: 'trail' }); });
        break;
      }
      case 'firstday': {
        w.emit({ t: 'ultflash', cid: p.cid, name: PZ.tr(PZ.SKILLS.firstday.name) }); w.slowmo(1.6, .4); p.iframes = 2;
        const cols = ['#fff6c8', '#6ac8ff', '#7ae07a', '#c8b0ff', '#ffb050', '#c0c8d8', '#ffffff'];
        for (let i = 0; i < 7; i++) w.after(.25 + i * .13, () => { for (const e of onScreen(w, p)) PZ.hurt(w, e, 26 * dm, p, { elem: 'light', pierceI: true }); w.emit({ t: 'ultslash', i, color: cols[i] }); w.emit({ t: 'shake', m: 5 }); });
        break;
      }
      case 'command':
        for (let i = 0; i < 3; i++) { const s = PZ.spawnEnemy(w, 'soldier', p.x - p.face * (30 + i * 26), p.y); s.team = 'player'; s.life = 10; s.dmg = 9 * dm; }
        break;
      case 'rift': PZ.spawnProj(w, p, { x: p.x + p.face * 30, y: p.y - 10, vx: p.face * 640, d: 26 * dm, life: .9, size: 22, pierce: 12, elem: 'fire', look: 'rift', ground: true, burn: 3 }); w.emit({ t: 'shake', m: 8 }); break;
      case 'stand': if (!p.onGround) return false; p.immune = 3; p.buffs.stand = 3; break;
      case 'lastbattle':
        w.emit({ t: 'ultflash', cid: p.cid, name: PZ.tr(PZ.SKILLS.lastbattle.name) }); w.emit({ t: 'army', x: p.x, face: p.face }); p.iframes = 2.2;
        for (let i = 0; i < 5; i++) w.after(.3 + i * .25, () => { for (const e of onScreen(w, p)) PZ.hurt(w, e, 18 * dm, p, { elem: 'fire', kb: 200, dir: p.face, pierceI: true }); w.emit({ t: 'shake', m: 6 }); });
        break;
      case 'swap': {
        const e = nearestEnemy(w, p, 460); if (!e) return false;
        const side = -PZ.sign(p.x - e.x) || 1; w.emit({ t: 'blink', x: p.x, y: p.y });
        p.x = clamp(e.x + side * (e.w / 2 + 24), w.minX + 20, Math.min(w.maxX, w.terrain.width) - 20);
        if (!e.fly && w.surf(p.x) !== Infinity) p.y = Math.min(p.y, w.surf(p.x)); p.face = -side; p.iframes = .35; p.buffs.nextCrit = Math.max(p.buffs.nextCrit || 0, 1); w.emit({ t: 'blink', x: p.x, y: p.y });
        break;
      }
      case 'knell':
        for (const e of onScreen(w, p)) {
          if (e.marks) { PZ.hurt(w, e, 14 * e.marks * dm, p, { elem: 'shadow', pierceI: true }); e.marks = 0; w.emit({ t: 'markpop', x: e.x, y: e.y - e.h / 2 }); }
          if (!e.dead && !e.boss && e.hp < e.maxHp * .2) { PZ.hurt(w, e, e.hp + 1, p, { elem: 'shadow', pierceI: true }); w.emit({ t: 'execute', x: e.x, y: e.y }); }
        }
        break;
      case 'veil': p.buffs.veil = 4; p.buffs.nextCrit = 3; break;
      case 'verdict':
        w.emit({ t: 'ultflash', cid: p.cid, name: PZ.tr(PZ.SKILLS.verdict.name) }); w.timeStop = 1.8; p.iframes = 2.2;
        w.after(.05, () => { const list = onScreen(w, p); list.forEach((e, i) => w.after(.12 * i, () => PZ.hurt(w, e, 48 * dm, p, { elem: 'shadow', pierceI: true, forceCrit: true }))); });
        break;
      case 'butterflies': for (let i = 0; i < 6; i++) PZ.spawnProj(w, p, { x: p.x, y: p.y - 40, vx: (Math.random() - .5) * 300 + p.face * 120, vy: -120 - Math.random() * 200, d: 9 * dm, life: 3, size: 6, home: 6, elem: 'poison', look: 'moth', poison: 4 }); break;
      case 'parasite': {
        const e = nearestEnemy(w, p, 320, x => !x.boss); if (!e) return false;
        e.team = 'player'; e.life = 10; e.charmed = true; w.emit({ t: 'charm', x: e.x, y: e.y - e.h }); break;
      }
      case 'serum': p.buffs.hot = 6; for (const a of w.ents) if (a.team === 'player' && !a.dead) { a.hotT = 6; } break;
      case 'plague':
        w.emit({ t: 'ultflash', cid: p.cid, name: PZ.tr(PZ.SKILLS.plague.name) }); w.plague = 5;
        PZ.spawnZone(w, p, { x: p.x, y: p.y - 60, r: 620, life: 5, dps: 14 * dm, elem: 'poison', look: 'fog', heal: 4 });
        break;
      case 'devour': {
        const e = nearestEnemy(w, p, 110); if (!e) return false;
        const d = PZ.hurt(w, e, 24 * dm, p, { elem: 'blood' }); PZ.heal(w, p, d * .5); e.shieldFront = false; e.armorDown = 3;
        if (p.hunger != null) p.hunger = Math.max(0, p.hunger - 15); w.emit({ t: 'bite', x: e.x, y: e.y - e.h / 2 }); break;
      }
      case 'wither': PZ.spawnZone(w, p, { x: p.x, y: p.y - 30, r: 150, life: 4, dps: 7 * dm, slow: .5, elem: 'blood', look: 'wither', drain: .5 }); break;
      case 'feast': if (p.hunger < 30) return false; p.hp = p.maxHp; p.hunger -= 50; if (p.hunger < 0) p.hunger = 0; w.emit({ t: 'heal', x: p.x, y: p.y - 60, amt: 999 }); break;
      case 'greatfamine': {
        w.emit({ t: 'ultflash', cid: p.cid, name: PZ.tr(PZ.SKILLS.greatfamine.name) }); let tot = 0;
        for (const e of onScreen(w, p)) { const amt = e.boss ? e.maxHp * .08 : e.hp * .3 + 10; tot += PZ.hurt(w, e, amt, p, { elem: 'blood', pierceI: true }); w.emit({ t: 'drain', x: e.x, y: e.y - e.h / 2, tx: p.x, ty: p.y - 30 }); }
        PZ.heal(w, p, tot); break;
      }
      case 'spearrain': for (let i = 0; i < 9; i++) { const e = nearestEnemy(w, p, 600); const tx = (e ? e.x : p.x + p.face * 200) + (i - 4) * 34; w.after(i * .06, () => PZ.spawnProj(w, p, { x: tx, y: p.y - 420, vx: 0, vy: 1300, d: 12 * dm, life: .6, size: 6, elem: 'light', look: 'spear' })); } break;
      case 'deniedprayer': PZ.spawnZone(w, p, { x: p.x, y: p.y - 30, r: 120, life: 3, dps: 18 * dm, elem: 'fire', look: 'firering', follow: p }); break;
      case 'ashrebirth': return false;
      case 'secondheaven':
        w.emit({ t: 'ultflash', cid: p.cid, name: PZ.tr(PZ.SKILLS.secondheaven.name) }); p.iframes = 2;
        for (let i = 0; i < 40; i++) w.after(i * .03, () => { const a = -Math.PI * Math.random(); PZ.spawnProj(w, p, { x: p.x, y: p.y - 50, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, d: 7 * dm, life: .9, size: 5, home: 8, elem: 'light', look: 'ray' }); });
        break;
    }
    return true;
  };

  // ---------------- projectiles / zones / pickups ----------------
  PZ.updateProjs = function (w, dt, frozen) {
    for (let i = w.projs.length - 1; i >= 0; i--) {
      const p = w.projs[i];
      if (frozen && p.team === 'enemy') continue;
      p.t += dt; p.life -= dt;
      if (p.home) {
        const tgt = p.team === 'player' ? PZ.nearestEnemy(w, p, 500) : w.player;
        if (tgt) { const a = Math.atan2((tgt.y - tgt.h / 2) - p.y, tgt.x - p.x), sp = Math.max(300, Math.hypot(p.vx, p.vy)); p.vx += (Math.cos(a) * sp - p.vx) * Math.min(1, p.home * dt); p.vy += (Math.sin(a) * sp - p.vy) * Math.min(1, p.home * dt); }
      }
      if (p.returns && p.t > .35 && p.owner) { const a = Math.atan2(p.owner.y - 36 - p.y, p.owner.x - p.x); p.vx += Math.cos(a) * 3000 * dt; p.vy += Math.sin(a) * 3000 * dt; if (Math.hypot(p.owner.x - p.x, p.owner.y - 36 - p.y) < 30 && p.t > .5) p.life = 0; }
      p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.ground) { const g = w.surf(p.x); if (g !== Infinity) p.y = g - 10; }
      let dead = p.life <= 0;
      const g = w.surf(p.x);
      if (!p.ground && !p.ghostly && g !== Infinity && p.y > g) dead = true;
      const r = { x0: p.x - p.size, x1: p.x + p.size, y0: p.y - p.size, y1: p.y + p.size };
      if (!dead) {
        if (p.team === 'player') {
          for (const e of w.ents) {
            if (e.team !== 'enemy' || e.dead || e.untouchable || p.hitSet.has(e.id)) continue;
            if (!overlap(r, rectOf(e))) continue;
            p.hitSet.add(e.id);
            if (p.owner && p.owner.kind === 'player' && p.wep) PZ.applyHit(w, p.owner, e, p.d, Object.assign({}, p.hit, { kb: 90 }), p.wep);
            else PZ.hurt(w, e, p.d, p.owner, { elem: p.elem, kb: 80, poison: p.poison, dir: PZ.sign(p.vx) });
            if (p.burn) e.burn = p.burn;
            if (--p.pierce <= 0) { dead = true; break; }
          }
        } else {
          for (const e of w.ents.concat(w.players)) {
            if (e.team !== 'player' || e.dead || e.untouchable || e.kind === 'nyx' || p.hitSet.has(e.id || -1)) continue;
            if (!overlap(r, rectOf(e))) continue;
            p.hitSet.add(e.id || -1);
            PZ.hurt(w, e, p.d, p.owner, { elem: p.elem, kb: 140, dir: PZ.sign(p.vx) || 1, name: p.name });
            if (p.slow) e.slowT = p.slow;
            if (--p.pierce <= 0) { dead = true; break; }
          }
        }
      }
      if (dead) {
        if (p.burst) {
          w.emit({ t: 'burst', x: p.x, y: p.y, r: p.burst, elem: p.elem });
          for (const e of w.ents) if (e.team !== p.team && !e.dead && e.kind !== 'nyx' && Math.hypot(e.x - p.x, e.y - e.h / 2 - p.y) < p.burst) PZ.hurt(w, e, p.d * .8, p.owner, { elem: p.elem, poison: p.poison || (p.wep && p.wep.poison) });
          if (p.heal) for (const a of w.players) if (Math.hypot(a.x - p.x, a.y - 30 - p.y) < p.burst) PZ.heal(w, a, p.heal);
          w.sfx('burst', p.x);
        }
        w.projs.splice(i, 1);
      }
    }
  };

  PZ.updateZones = function (w, dt) {
    for (let i = w.zones.length - 1; i >= 0; i--) {
      const z = w.zones[i]; z.t += dt; z.life -= dt; z.tick -= dt;
      if (z.follow) { z.x = z.follow.x; z.y = z.follow.y - 30; }
      const inZ = e => z.rect ? overlap(z.rect, rectOf(e)) : Math.hypot(e.x - z.x, (e.y - e.h / 2) - z.y) < z.r;
      if (z.burst) { z.hitSet = z.hitSet || new Set(); for (const e of w.ents) if (e.team !== z.team && !e.dead && !z.hitSet.has(e.id) && inZ(e)) { z.hitSet.add(e.id); PZ.hurt(w, e, z.burst, z.owner, { elem: z.elem, pierceI: true }); } }
      if (z.tick <= 0) {
        z.tick = .25;
        for (const e of w.ents.concat(w.players)) {
          if (e.dead || e.kind === 'nyx') continue;
          if (!inZ(e)) continue;
          if (e.team !== z.team && z.dps) { const d = PZ.hurt(w, e, z.dps * .25, z.owner, { elem: z.elem, pierceI: true }); if (z.drain && z.owner) PZ.heal(w, z.owner, d * z.drain); if (z.slow) e.slowT = .4; }
          else if (e.team === z.team && z.heal) PZ.heal(w, e, z.heal * .25);
        }
      }
      if (z.life <= 0) w.zones.splice(i, 1);
    }
  };

  PZ.updatePickups = function (w) {
    const p = w.player; if (!p) return;
    for (let i = w.pickups.length - 1; i >= 0; i--) {
      const k = w.pickups[i]; k.t += PZ.DT;
      if (k.vy != null) { k.vy += PZ.G * .6 * PZ.DT; k.y += k.vy * PZ.DT; const g = w.surf(k.x); if (g !== Infinity && k.y > g - 8) { k.y = g - 8; k.vy = 0; } }
      const dx = p.x - k.x, dy = (p.y - 30) - k.y, d = Math.hypot(dx, dy);
      if ((k.kind === 'seed' || k.kind === 'orb') && d < 110 && k.t > .4) { k.x += dx * .12; k.y += dy * .12; }
      if (d < 34 && k.t > .3) {
        w.pickups.splice(i, 1);
        if (k.kind === 'seed') { w.save.seeds++; w.sfx('seed', k.x); }
        else if (k.kind === 'orb') { PZ.heal(w, p, 18); w.sfx('orb', k.x); }
        else if (k.kind === 'page') { w.save.pages[k.id] = 1; PZ.codexUnlock(w.save, 'page_' + k.id); w.emit({ t: 'page', id: k.id }); w.sfx('page', k.x); }
        else if (k.kind === 'shard') { w.save.shards[k.id] = 1; w.emit({ t: 'shard', id: k.id }); w.sfx('shard', k.x); }
        else if (k.kind === 'relic') { if (!w.save.relics.includes(k.id)) w.save.relics.push(k.id); w.emit({ t: 'relic', id: k.id }); w.sfx('shard', k.x); }
      }
    }
  };
})(globalThis.PZ);
