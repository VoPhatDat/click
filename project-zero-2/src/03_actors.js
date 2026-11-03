'use strict';
// ===== Enemies, allies, Nyx =====
(function (PZ) {
  const clamp = PZ.clamp;

  PZ.spawnEnemy = function (w, type, x, y, o) {
    o = o || {};
    const d = PZ.ENEMIES[type] || { hp: 60, dmg: 8, ai: 'melee', w: 20, h: 56, speed: 170, color: '#555' };
    if (type === 'soldier') Object.assign(d, { ai: 'melee', hp: 60, dmg: 9, w: 20, h: 58, speed: 200, color: '#ff8a4a', name: null });
    const elite = !!o.elite, hpMul = (w.diff.enemyHp || 1) * (elite ? PZ.ELITE.hp : 1) * (1 + (w.save.ng || 0) * .5);
    const g = w.surf(x);
    const e = {
      kind: 'enemy', type, def: d, team: 'enemy', x, y: y != null ? y : (g === Infinity ? 300 : g), vx: 0, vy: 0, w: d.w * (elite ? 1.25 : 1), h: d.h * (elite ? 1.25 : 1),
      hp: d.hp * hpMul, maxHp: d.hp * hpMul, dmg: d.dmg * (elite ? PZ.ELITE.dmg : 1), speed: d.speed, face: -1, fly: !!d.fly, color: d.color,
      state: 'patrol', st: 0, t: Math.random() * 5, home: x, alert: false, hurtT: 0, stunT: 0, atkCd: 1 + Math.random(), elite, lightOnly: !!d.lightOnly, flyY: (y || 300)
    };
    if (e.fly && y == null) { e.y = (g === Infinity ? 360 : g) - 110 - Math.random() * 60; e.flyY = e.y; }
    return w.add(e);
  };

  const targetFor = (w, e) => {
    let best = null, bd = 1e12;
    const list = e.team === 'enemy' ? w.players.concat(w.ents.filter(a => a.team === 'player' && a.kind !== 'nyx' && a.kind !== 'player')) : w.ents.filter(a => a.team === 'enemy');
    for (const a of list) { if (a.dead || a.untouchable) continue; if (a.buffs && a.buffs.veil > 0) continue; const d = (a.x - e.x) ** 2 + (a.y - e.y) ** 2; if (d < bd) { bd = d; best = a; } }
    return best;
  };
  PZ.targetFor = targetFor;

  const alertNearby = (w, e) => { for (const o of w.ents) if (o.team === e.team && o.kind === 'enemy' && !o.alert && Math.abs(o.x - e.x) < 300) { o.alert = true; o.state = 'chase'; } };
  const meleeBox = (e, r, h) => ({ x0: Math.min(e.x, e.x + e.face * r), x1: Math.max(e.x, e.x + e.face * r), y0: e.y - e.h / 2 - h / 2, y1: e.y - e.h / 2 + h / 2 });
  const hitTargets = (w, e, box, dmg, o) => {
    const list = e.team === 'enemy' ? w.players.concat(w.ents.filter(a => a.team === 'player' && a.kind !== 'nyx')) : w.ents.filter(a => a.team === 'enemy');
    let n = 0; for (const a of list) if (!a.dead && PZ.overlap(box, PZ.rectOf(a))) { PZ.hurt(w, a, dmg, e, Object.assign({ kb: 220 }, o || {})); n++; }
    return n;
  };
  PZ.hitTargets = hitTargets;

  PZ.updateEnt = function (w, e, dt) {
    e.t += dt;
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.dead) { e.deathT += dt; e.vx *= .9; if (!e.fly) PZ.physics(w, e, dt); if (e.deathT > (e.boss ? 99 : .9)) e.remove = true; return; }
    if (e.kind === 'nyx') return PZ.updateNyx(w, e, dt);
    if (e.boss && e.ai) { e.ai(w, e, dt); return; }
    // DOTs
    if (e.poison > 0) { e.poisonTick = (e.poisonTick || 0) - dt; if (e.poisonTick <= 0) { e.poisonTick = .5; PZ.hurt(w, e, 2 + e.poison * .25, null, { elem: 'poison', pierceI: true }); e.poison -= 1.5; } }
    if (e.bleed > 0) { e.bleedTick = (e.bleedTick || 0) - dt; if (e.bleedTick <= 0) { e.bleedTick = .5; PZ.hurt(w, e, 2 + e.bleed * .3, null, { elem: 'blood', pierceI: true }); e.bleed -= 2; } }
    if (e.burn > 0) { e.burn -= dt; e.burnTick = (e.burnTick || 0) - dt; if (e.burnTick <= 0) { e.burnTick = .4; PZ.hurt(w, e, 3, null, { elem: 'fire', pierceI: true }); } }
    if (e.dead) return;
    if (e.hotT > 0) { e.hotT -= dt; PZ.heal(w, e, 4 * dt); }
    if (e.life != null) { e.life -= dt; if (e.life <= 0) { if (e.charmed) { e.team = 'enemy'; e.charmed = false; e.life = null; } else { e.dead = true; e.corpse = true; e.deathT = 0; w.emit({ t: 'vanish', x: e.x, y: e.y - e.h / 2 }); return; } } }
    if (e.hurtT > 0) e.hurtT -= dt;
    const slowMul = e.slowT > 0 ? .45 : 1; if (e.slowT > 0) e.slowT -= dt;
    if (e.stunT > 0) { e.stunT -= dt; e.vx *= .85; e.tele = 0; if (!e.fly) PZ.physics(w, e, dt); else { e.x += e.vx * dt; e.vy *= .9; e.y += e.vy * dt; } return; }
    e.atkCd -= dt;
    const tg = targetFor(w, e);
    const dx = tg ? tg.x - e.x : 0, dist = Math.abs(dx);
    if (tg && !e.alert && (dist < (e.team === 'player' ? 900 : 340)) && Math.abs(tg.y - e.y) < 260) { e.alert = true; e.state = 'chase'; w.emit({ t: 'alert', x: e.x, y: e.y - e.h - 10 }); alertNearby(w, e); }
    const AI = PZ.AI[e.def.ai] || PZ.AI.melee;
    AI(w, e, dt, tg, dx, dist, slowMul);
    if (e.fly) { e.x += e.vx * dt; e.y += e.vy * dt; e.x = clamp(e.x, w.minX + 10, Math.min(w.maxX, w.terrain.width) - 10); }
    else PZ.physics(w, e, dt);
    if (!e.fly && e.y > w.worldH + 100) { e.dead = true; e.remove = true; }
  };

  PZ.AI = {
    patrol(w, e, dt, slowMul) {
      if (e.fly) { e.vx = Math.sin(e.t * .7) * 50; e.vy = (e.flyY + Math.sin(e.t * 1.7) * 14 - e.y) * 2; e.face = PZ.sign(e.vx) || e.face; return; }
      const tx = e.home + Math.sin(e.t * .5) * 90; e.vx = clamp(tx - e.x, -1, 1) * e.speed * .35 * slowMul; if (Math.abs(e.vx) > 5) e.face = PZ.sign(e.vx);
    },
    melee(w, e, dt, tg, dx, dist, sm) {
      if (!e.alert || !tg) return PZ.AI.patrol(w, e, dt, sm);
      if (e.state === 'windup') { e.vx *= .8; e.st -= dt; e.tele = 1 - e.st / .4; if (e.st <= 0) { e.state = 'chase'; e.tele = 0; hitTargets(w, e, meleeBox(e, 58, 50), e.dmg); w.sfx('swipe', e.x); e.atkCd = .9; } return; }
      e.face = PZ.sign(dx) || e.face;
      if (dist > 46) e.vx = e.face * e.speed * sm; else { e.vx *= .7; if (e.atkCd <= 0) { e.state = 'windup'; e.st = .4; } }
    },
    stalker(w, e, dt, tg, dx, dist, sm) {
      if (!e.alert || !tg) return PZ.AI.patrol(w, e, dt, sm);
      if (e.hp < e.maxHp * .25 && !e.fled) { e.fled = true; e.state = 'flee'; e.st = 1.6; }
      if (e.state === 'flee') { e.st -= dt; e.face = -PZ.sign(dx) || 1; e.vx = e.face * e.speed * 1.2 * sm; if (e.st <= 0) e.state = 'chase'; return; }
      if (e.state === 'windup') { e.vx *= .8; e.st -= dt; e.tele = 1 - e.st / .5; if (e.st <= 0) { e.state = 'chase'; e.tele = 0; hitTargets(w, e, meleeBox(e, 70, 60), e.dmg, { name: e.type }); w.sfx('swipe', e.x); e.atkCd = 1.1; } return; }
      e.face = PZ.sign(dx) || e.face;
      if (dist > 54) e.vx = e.face * e.speed * sm; else { e.vx *= .7; if (e.atkCd <= 0) { e.state = 'windup'; e.st = .5; } }
    },
    charger(w, e, dt, tg, dx, dist, sm) {
      if (!e.alert || !tg) return PZ.AI.patrol(w, e, dt, sm);
      if (e.state === 'charge') {
        e.st -= dt; const r = PZ.rectOf(e);
        if (!e.hitDone) { const list = e.team === 'enemy' ? w.players : w.enemies(); for (const a of list) if (!a.dead && PZ.overlap(r, PZ.rectOf(a))) { PZ.hurt(w, a, e.dmg, e, { kb: 260, name: e.type }); e.hitDone = true; } }
        if (e.st <= 0) { e.state = 'recover'; e.st = 1.1; e.vx *= .2; e.vy *= .2; }
        return;
      }
      if (e.state === 'recover') { e.st -= dt; e.vx *= .92; e.vy = (tg.y - 140 - e.y) * .8; if (e.st <= 0) e.state = 'chase'; return; }
      if (e.state === 'windup') { e.st -= dt; e.tele = 1 - e.st / .6; e.vx *= .85; e.vy *= .85; if (e.st <= 0) { const a = Math.atan2(tg.y - 30 - e.y, tg.x - e.x); e.vx = Math.cos(a) * 640; e.vy = Math.sin(a) * 640; e.state = 'charge'; e.st = .55; e.hitDone = false; e.tele = 0; w.sfx('charge', e.x); } return; }
      const side = e.x < tg.x ? -1 : 1, hx = tg.x + side * 170, hy = tg.y - 130 + Math.sin(e.t * 2) * 20;
      e.vx = clamp(hx - e.x, -1, 1) * e.speed * sm + (hx - e.x) * .5; e.vy = (hy - e.y) * 2.2; e.face = PZ.sign(dx) || e.face;
      e.vx = clamp(e.vx, -e.speed * 1.5, e.speed * 1.5);
      if (e.atkCd <= 0 && dist < 280) { e.state = 'windup'; e.st = .6; e.atkCd = 2.4 + Math.random(); }
    },
    bomber(w, e, dt, tg, dx, dist, sm) {
      if (!e.alert || !tg) return PZ.AI.patrol(w, e, dt, sm);
      if (e.state === 'fuse') {
        e.st -= dt; e.tele = 1 - e.st / .8; e.vx *= .9; e.vy *= .9;
        if (e.st <= 0) {
          w.emit({ t: 'flashbang', x: e.x, y: e.y - e.h / 2 }); w.sfx('explode', e.x); w.emit({ t: 'shake', m: 7 });
          const list = e.team === 'enemy' ? w.players.concat(w.ents.filter(a => a.team === 'player' && a.kind !== 'nyx' && a.kind !== 'player')) : w.enemies();
          for (const a of list) if (!a.dead && Math.hypot(a.x - e.x, (a.y - a.h / 2) - (e.y - e.h / 2)) < 90) PZ.hurt(w, a, e.dmg, e, { kb: 320, name: e.type });
          e.hp = 0; PZ.killEnt(w, e, null);
        }
        return;
      }
      const a = Math.atan2(tg.y - 34 - e.y, tg.x - e.x);
      e.vx = Math.cos(a) * e.speed * sm; e.vy = Math.sin(a) * e.speed * sm + Math.sin(e.t * 4) * 20; e.face = PZ.sign(dx) || e.face;
      if (Math.hypot(tg.x - e.x, tg.y - 34 - e.y) < 70) { e.state = 'fuse'; e.st = .8; w.sfx('fuse', e.x); }
    },
    caster(w, e, dt, tg, dx, dist, sm) {
      if (!e.alert || !tg) return PZ.AI.patrol(w, e, dt, sm);
      e.face = PZ.sign(dx) || e.face;
      if (e.state === 'windup') {
        e.vx *= .8; e.st -= dt; e.tele = 1 - e.st / .7;
        if (e.st <= 0) { e.state = 'chase'; e.tele = 0; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; PZ.spawnProj(w, e, { x: e.x, y: e.y - e.h * .7, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, d: e.dmg, life: 2.4, size: 7, elem: 'light', look: 'ring', team: e.team, name: e.type, ghostly: true }); } w.sfx('hymn', e.x); e.atkCd = 2.6; }
        return;
      }
      const want = dist < 200 ? -1 : dist > 320 ? 1 : 0;
      e.vx = want * e.face * e.speed * sm;
      if (e.atkCd <= 0 && dist < 520) { e.state = 'windup'; e.st = .7; }
    }
  };

  // ---------------- Nyx: AI companion ----------------
  PZ.NYX_MODES = ['follow', 'attack', 'hide'];
  PZ.NYX_MODE_NAMES = { follow: { vi: 'Bám sát', en: 'Follow' }, attack: { vi: 'Tấn công', en: 'Attack' }, hide: { vi: 'Trốn', en: 'Hide' } };
  PZ.spawnNyx = function (w) {
    const p = w.player; const growth = Math.min(7, (w.save.chapter || 1));
    return w.add({ kind: 'nyx', team: 'player', untouchable: true, x: p.x - 40, y: p.y - 60, vx: 0, vy: 0, w: 14, h: 30, fly: true, face: 1, mode: 'follow', healCd: 6, atkCd: 1, t: 0, growth, hp: 1, maxHp: 1 });
  };
  PZ.updateNyx = function (w, n, dt) {
    const p = w.player; if (!p) return;
    n.healCd -= dt; n.atkCd -= dt;
    let tx = p.x - p.face * 46, ty = p.y - 70 + Math.sin(n.t * 2.2) * 8;
    if (n.mode === 'hide') { tx = p.x - p.face * 20; ty = p.y - 40; }
    // secret sense: drift toward hidden pages
    n.hint = null;
    if (n.mode === 'follow') for (const k of w.pickups) if ((k.kind === 'page' || k.kind === 'shard') && Math.abs(k.x - p.x) < 300) { n.hint = k; tx = PZ.lerp(tx, k.x, .55); ty = PZ.lerp(ty, k.y - 30, .5); break; }
    n.vx = (tx - n.x) * 4; n.vy = (ty - n.y) * 4; n.x += n.vx * dt; n.y += n.vy * dt; n.face = PZ.sign(p.x - n.x) || 1;
    if (n.mode !== 'hide' && n.healCd <= 0 && !p.dead && p.hp < p.maxHp * .6) { n.healCd = 12; PZ.heal(w, p, 6 + n.growth * 2); w.emit({ t: 'nyxheal', x: n.x, y: n.y }); w.sfx('nyxheal', n.x); }
    if (n.mode === 'attack' && n.atkCd <= 0) {
      const e = PZ.nearestEnemy(w, n, 420);
      if (e) { n.atkCd = 1.4; const a = Math.atan2(e.y - e.h / 2 - n.y, e.x - n.x); PZ.spawnProj(w, n, { x: n.x, y: n.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, d: 5 + n.growth, life: 1.2, size: 5, elem: 'light', look: 'orb', team: 'player', home: 2 }); }
    }
  };
  PZ.nyxCommand = function (w) {
    const n = w.ents.find(e => e.kind === 'nyx'); if (!n) return;
    n.mode = PZ.NYX_MODES[(PZ.NYX_MODES.indexOf(n.mode) + 1) % 3];
    w.emit({ t: 'nyxmode', mode: n.mode }); w.sfx('ui', n.x);
  };
})(globalThis.PZ);
