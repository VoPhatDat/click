'use strict';
// ===== Bosses: Hiệp Sĩ Không Bóng (mini), SERAPHINA =====
(function (PZ) {
  const clamp = PZ.clamp;
  const GROUND = 460;

  PZ.makeBoss = function (w, id, x, y, ai, o) {
    const meta = PZ.BOSSES[id];
    const hp = meta.hp * (w.diff.enemyHp || 1) * (1 + (w.save.ng || 0) * .5);
    const e = w.add(Object.assign({
      kind: 'enemy', type: id, boss: true, meta, team: 'enemy', heavy: true, x, y, vx: 0, vy: 0, w: 50, h: 100, face: -1,
      hp, maxHp: hp, phase: 1, state: 'intro', st: 1.6, t: 0, ai, hurtT: 0, stunT: 0, color: '#fff', tele: 0, def: { name: meta.name }
    }, o || {}));
    w.boss = e; PZ.codexUnlock(w.save, 'boss_' + id);
    w.emit({ t: 'bossintro', id });
    return e;
  };

  function say(w, who, vi, en, o) { w.emit(Object.assign({ t: 'say', who, text: { vi, en } }, o || {})); }
  PZ.bossSay = say;

  function phaseCheck(w, e, thresholds, onPhase) {
    const f = e.hp / e.maxHp;
    for (let i = 0; i < thresholds.length; i++) {
      const ph = i + 2;
      if (e.phase < ph && f <= thresholds[i]) { e.phase = ph; e.untouchable = true; e.state = 'transition'; e.st = 2.4; e.tele = 0; w.hazards = w.hazards.filter(h => h.owner !== e); w.emit({ t: 'phase', id: e.type, phase: ph }); w.slowmo(.8, .3); w.emit({ t: 'shake', m: 10 }); onPhase(ph); return true; }
    }
    return false;
  }

  // =============== HIỆP SĨ KHÔNG BÓNG ===============
  PZ.BOSS_AI_knight = function (w, e, dt) {
    const p = w.player; e.t += dt; if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.state === 'defeated') { e.vx *= .9; PZ.physics(w, e, dt); return; }
    if (e.stunT > 0) { e.stunT -= dt; e.vx *= .8; e.shieldFront = false; PZ.physics(w, e, dt); return; }
    const dx = p.x - e.x, dist = Math.abs(dx), fast = e.phase >= 2 ? 1.35 : 1;
    phaseCheck(w, e, [.5], () => say(w, 'knight', 'Mặt trời lấy mất bóng của ta. Ta sẽ lấy của ngươi.', 'The sun took my shadow. I will take yours.'));
    e.st -= dt * fast;
    switch (e.state) {
      case 'intro': e.shieldFront = true; if (e.st <= 0) { e.state = 'approach'; e.st = 1.2; say(w, 'knight', 'Cổng Bình Minh không mở cho kẻ có bóng.', 'The Dawn Gate does not open for those who cast shadows.'); } break;
      case 'transition': e.shieldFront = false; e.vx *= .9; if (e.st <= 0) { e.untouchable = false; e.state = 'approach'; e.st = .6; } break;
      case 'approach': {
        e.shieldFront = true; e.face = PZ.sign(dx) || e.face; e.vx = e.face * 90 * fast;
        if (e.st <= 0) {
          const r = Math.random();
          if (e.phase >= 2 && r < .25) { e.state = 'blink'; e.st = .45; e.untouchable = true; w.emit({ t: 'blink', x: e.x, y: e.y }); w.sfx('blink', e.x); }
          else if (dist > 230) { e.state = 'chargeTele'; e.st = .65; w.sfx('tele', e.x); }
          else if (dist < 130) { e.state = 'combo'; e.st = .38; e.combo = 3; }
          else { e.state = 'slamTele'; e.st = .5; w.sfx('tele', e.x); }
        }
        break;
      }
      case 'blink': e.vx = 0; if (e.st <= 0) { e.untouchable = false; e.x = clamp(p.x - p.face * 70, w.minX + 40, w.maxX - 40); e.face = PZ.sign(p.x - e.x) || 1; w.emit({ t: 'blink', x: e.x, y: e.y }); e.state = 'combo'; e.st = .3; e.combo = 1; } break;
      case 'chargeTele': e.shieldFront = true; e.vx = 0; e.tele = 1 - e.st / .65; e.face = PZ.sign(dx) || e.face; if (e.st <= 0) { e.tele = 0; e.state = 'charge'; e.st = .6; e.hitDone = false; w.sfx('charge', e.x); } break;
      case 'charge': {
        e.shieldFront = true; e.vx = e.face * 720;
        if (!e.hitDone && PZ.overlap(PZ.rectOf(e), PZ.rectOf(p))) { PZ.hurt(w, p, 20, e, { kb: 420, name: 'knight' }); e.hitDone = true; }
        if (e.st <= 0 || e.wall) { e.state = 'recover'; e.st = e.wall ? 1.4 : .9; if (e.wall) { w.emit({ t: 'shake', m: 8 }); w.sfx('clang', e.x); } }
        break;
      }
      case 'slamTele': e.vx = 0; e.tele = 1 - e.st / .5; if (e.st <= 0) { e.tele = 0; e.state = 'slamAir'; e.vy = -760; e.vx = clamp(dx * 1.4, -520, 520); } break;
      case 'slamAir':
        if (e.onGround && e.vy >= 0 && e.t > .05) {
          e.state = 'recover'; e.st = .9; w.emit({ t: 'shake', m: 12 }); w.sfx('slam', e.x); w.emit({ t: 'shock', x: e.x, y: e.y });
          for (const s of [-1, 1]) PZ.spawnProj(w, e, { x: e.x + s * 30, y: e.y - 12, vx: s * 480, d: 16, life: 1.3, size: 16, pierce: 9, elem: 'light', look: 'wave', ground: true, team: 'enemy', name: 'knight' });
        }
        break;
      case 'combo':
        e.shieldFront = false; e.face = PZ.sign(dx) || e.face; e.vx *= .8; e.tele = 1 - e.st / .38;
        if (e.st <= 0) {
          e.tele = 0; w.sfx('swipe', e.x); e.vx = e.face * 220;
          PZ.hitTargets(w, e, { x0: Math.min(e.x, e.x + e.face * 92), x1: Math.max(e.x, e.x + e.face * 92), y0: e.y - 90, y1: e.y }, 13, { name: 'knight' });
          w.emit({ t: 'eslash', x: e.x, y: e.y - 50, face: e.face, r: 92 });
          if (--e.combo > 0) e.st = .32; else { e.state = 'recover'; e.st = .8; }
        }
        break;
      case 'recover': e.shieldFront = false; e.vx *= .85; if (e.st <= 0) { e.state = 'approach'; e.st = .8 + Math.random() * .6; } break;
    }
    PZ.physics(w, e, dt);
  };

  PZ.spawnKnight = function (w, x) {
    const e = PZ.makeBoss(w, 'knight', x, GROUND, PZ.BOSS_AI_knight, { w: 44, h: 104, color: '#e8e0c8', shieldFront: true });
    e.y = w.surf(x);
    e.onDefeat = (w, e) => {
      e.state = 'defeated'; e.untouchable = true; e.dead = true; e.corpse = true; e.deathT = 0;
      w.emit({ t: 'bossdown', id: 'knight' }); w.sfx('bossdown', e.x); w.slowmo(1.2, .25);
      say(w, 'knight', 'Cuối cùng… có bóng mát.', 'At last… some shade.');
      for (let i = 0; i < 8; i++) w.pickups.push({ kind: 'seed', x: e.x + (i - 4) * 12, y: e.y - 40, vy: -400 - i * 20, t: 0 });
      w.pickups.push({ kind: 'relic', id: 'quietbell', x: e.x, y: e.y - 30, vy: -300, t: 0 });
      w.save.cleared.knight = 1; w.boss = null;
      if (w.lock) { w.lock = null; w.minX = 0; w.maxX = 1e9; }
      w.emit({ t: 'unlock' });
    };
    return e;
  };

  // =============== SERAPHINA ===============
  const HOVER = 250;
  PZ.inShadow = function (w, lx, ly, px, py) {
    for (const pl of w.terrain.pillars) { if (PZ.segRect(lx, ly, px, py, { x0: pl.x - pl.w / 2, x1: pl.x + pl.w / 2, y0: pl.top, y1: GROUND })) return true; }
    return false;
  };
  PZ.shadowSpans = function (w, lx, ly) { // ground intervals in shadow (for render + bot)
    const out = [];
    for (const pl of w.terrain.pillars) {
      const xs = [pl.x - pl.w / 2, pl.x + pl.w / 2];
      for (const ex of [pl.x - pl.w / 2, pl.x + pl.w / 2]) { if (pl.top <= ly) { xs.push(ex < lx ? -9999 : 9999); continue; } xs.push(lx + (ex - lx) * (GROUND - ly) / (pl.top - ly)); }
      out.push([Math.max(0, Math.min(...xs)), Math.min(960, Math.max(...xs))]);
    }
    return out;
  };

  function radiance(w, e, decoys) {
    const lx = e.x, ly = HOVER - 100;
    const hz = { kind: 'radiance', owner: e, lx, ly, t: 0, tele: e.phase >= 2 ? 2.1 : 2.4, decoys: decoys || [], fired: false, update(w, h) {
      if (!h.fired && h.t >= h.tele) {
        h.fired = true; w.emit({ t: 'radiance', lx: h.lx, ly: h.ly }); w.emit({ t: 'shake', m: 9 }); w.sfx('radiance', h.lx); w.emit({ t: 'flash', a: .8 });
        for (const p of w.players) if (!p.dead && !PZ.inShadow(w, h.lx, h.ly, p.x, p.y - 34)) PZ.hurt(w, p, 38, e, { pierceI: true, unparryable: true, unblockable: true, name: 'radiance' });
      }
      if (h.t >= h.tele + .7) h.dead = true;
    } };
    w.hazards.push(hz); w.sfx('radiance_charge', lx);
    return hz;
  }

  PZ.BOSS_AI_seraphina = function (w, e, dt) {
    const p = w.player; e.t += dt; if (e.hitFlash > 0) e.hitFlash -= dt;
    if (e.state === 'defeated') { e.vx = 0; e.vy = 0; e.y += (GROUND - e.y) * dt * 2; return; }
    if (e.stunT > 0) e.stunT -= dt;
    phaseCheck(w, e, [.66, .33], ph => {
      if (ph === 2) say(w, 'seraphina', 'Ta khâu mắt mình lại… để khỏi phải thấy những gì ngươi giấu trong bóng.', 'I sewed my eyes shut… so I would not see what you hide in the shadows.');
      if (ph === 3) { say(w, 'seraphina', 'Vậy hãy cùng ta mù. Nghe đi, Zero. Nghe ánh sáng rơi.', 'Then be blind with me. Listen, Zero. Listen to the light fall.'); w.darkTarget = .95; w.emit({ t: 'blind' }); }
    });
    e.st -= dt;
    const goTo = (tx, ty, k) => { e.vx = (tx - e.x) * (k || 3); e.vy = (ty - e.y) * (k || 3); };
    const next = () => {
      const cyc = e.phase === 1 ? ['feathers', 'radiance', 'sweep', 'feathers', 'radiance', 'sweep'] : e.phase === 2 ? ['feathers', 'radiance2', 'sweep', 'crossfeathers', 'radiance2', 'sweep'] : ['bell', 'skyfall', 'bell', 'whisper', 'skyfall', 'bell'];
      e.ci = ((e.ci == null ? -1 : e.ci) + 1) % cyc.length; const m = cyc[e.ci];
      e.untouchable = false; e.vulnMul = 1;
      if (m === 'feathers' || m === 'crossfeathers') { e.state = m; e.st = .5; e.vol = 3; e.tx = PZ.clamp(p.x + (Math.random() - .5) * 300, 140, 820); }
      else if (m === 'radiance' || m === 'radiance2') { e.state = 'radianceMove'; e.st = .9; e.rad2 = m === 'radiance2'; e.tx = [140, 480, 820][Math.floor(Math.random() * 3)]; }
      else if (m === 'sweep') { e.state = 'sweepMove'; e.side = p.x < 480 ? 1 : -1; e.st = .9; }
      else if (m === 'bell') { e.state = 'bellTele'; e.side = Math.random() < .5 ? -1 : 1; e.st = 1.5; e.x = e.side > 0 ? 1040 : -80; e.y = GROUND; e.untouchable = true; w.sfx('bell', e.x, { pan: e.side, hint: true }); w.emit({ t: 'cue', side: e.side, kind: 'bell' }); }
      else if (m === 'skyfall') { e.state = 'skyTele'; e.st = 1.25; e.tx = p.x; e.untouchable = true; w.hazards.push({ kind: 'skypillar', owner: e, x: p.x, t: 0, tele: 1.25, update(w, h) { if (!h.fired && h.t >= h.tele) { h.fired = true; w.sfx('skyfall', h.x); w.emit({ t: 'shake', m: 8 }); for (const q of w.players) if (Math.abs(q.x - h.x) < 46 && !q.dead) PZ.hurt(w, q, 30, e, { unparryable: true, name: 'skyfall' }); } if (h.t > h.tele + .5) h.dead = true; } }); w.sfx('bellhigh', p.x, { pan: 0, hint: true }); w.emit({ t: 'cue', x: p.x, kind: 'sky' }); }
      else if (m === 'whisper') { e.state = 'whisper'; e.st = 2.2; e.untouchable = true; e.vol = 4; }
    };
    switch (e.state) {
      case 'intro': goTo(480, HOVER, 2); if (e.st <= 0) { say(w, 'seraphina', 'Ngươi mang bóng tối vào thành của ta.', 'You bring darkness into my city.'); next(); } break;
      case 'transition': goTo(480, HOVER - 40, 2); if (e.st <= 0) { e.untouchable = false; next(); } break;
      case 'feathers': case 'crossfeathers':
        goTo(e.tx, HOVER - 20, 2);
        if (e.st <= 0) {
          e.st = .5;
          const srcs = e.state === 'crossfeathers' ? [[20, HOVER - 60], [940, HOVER - 60]] : [[e.x, e.y - 60]];
          for (const [sx, sy] of srcs) { const a0 = Math.atan2(p.y - 34 - sy, p.x - sx); for (let i = -3; i <= 3; i++) { const a = a0 + i * .13; PZ.spawnProj(w, e, { x: sx, y: sy, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, d: 9, life: 3, size: 6, elem: 'light', look: 'feather', team: 'enemy', name: 'feather' }); } }
          w.sfx('feathers', e.x);
          if (--e.vol <= 0) next();
        }
        break;
      case 'radianceMove': goTo(e.tx, HOVER - 30, 4); if (e.st <= 0) {
        let dec = [];
        if (e.rad2) { dec = [140, 480, 820].filter(x => Math.abs(x - e.tx) > 10).map(x => ({ lx: x, ly: HOVER - 100 })); w.emit({ t: 'decoys', list: dec }); }
        e.radHz = radiance(w, e, dec); e.state = 'radiance'; e.st = e.radHz.tele + .3;
      } break;
      case 'radiance': goTo(e.tx, HOVER - 30, 4); if (e.st <= 0) { e.state = 'tiredDrop'; e.st = .5; } break;
      case 'tiredDrop': goTo(e.x, GROUND, 6); if (e.st <= 0) { e.state = 'tired'; e.st = 2.4; e.vulnMul = 1.3; say(w, 'seraphina', '', '', { breath: true }); } break;
      case 'tired': e.vx = 0; e.vy = (GROUND - e.y) * 6; if (e.st <= 0) { e.vulnMul = 1; next(); } break;
      case 'sweepMove': goTo(e.side > 0 ? 900 : 60, GROUND, 5); if (e.st <= 0) { e.state = 'sweepTele'; e.st = .9; w.sfx('tele', e.x); } break;
      case 'sweepTele': e.vx = 0; e.vy = (GROUND - e.y) * 8; e.tele = 1 - e.st / .9; if (e.st <= 0) { e.tele = 0; e.state = 'sweep'; e.hitDone = false; w.sfx('sweep', e.x); } break;
      case 'sweep': case 'bellRun': {
        e.vy = (GROUND - e.y) * 8; e.vx = -e.side * (e.state === 'sweep' ? 950 : 1000);
        const box = { x0: e.x - 40, x1: e.x + 40, y0: GROUND - 62, y1: GROUND };
        if (!e.hitDone) for (const q of w.players) if (!q.dead && PZ.overlap(box, PZ.rectOf(q))) { PZ.hurt(w, q, 22, e, { kb: 380, dir: -e.side, unparryable: false, name: 'sweep' }); e.hitDone = true; }
        const endX = e.side > 0 ? 70 : 890;
        if ((e.side > 0 && e.x <= endX) || (e.side < 0 && e.x >= endX)) { e.untouchable = false; e.state = 'tired'; e.st = e.phase >= 3 ? 1.7 : 1.8; e.vulnMul = 1.2; e.humT = 0; }
        break;
      }
      case 'bellTele': e.vx = 0; e.vy = 0; if (e.st <= 0) { e.state = 'bellRun'; e.hitDone = false; w.sfx('rush', e.x, { pan: e.side }); } break;
      case 'skyTele': e.vx = 0; e.vy = 0; if (e.st <= 0) { e.x = e.tx + (Math.random() < .5 ? -90 : 90); e.x = PZ.clamp(e.x, 60, 900); e.y = GROUND; e.untouchable = false; e.state = 'tired'; e.st = 1.7; e.vulnMul = 1.2; } break;
      case 'whisper':
        e.vx = 0; e.vy = 0;
        if (e.st <= 2.2 - .5 * (5 - e.vol) && e.vol > 0) { e.vol--; const sx = Math.random() < .5 ? -20 : 980; const a = Math.atan2(p.y - 34 - 300, p.x - sx); for (let i = -1; i <= 1; i++) PZ.spawnProj(w, e, { x: sx, y: 300, vx: Math.cos(a + i * .1) * 330, vy: Math.sin(a + i * .1) * 330, d: 8, life: 3.5, size: 6, elem: 'light', look: 'feather', team: 'enemy', name: 'feather' }); w.sfx('whisper', sx, { pan: sx < 480 ? -1 : 1, hint: true }); }
        if (e.st <= 0) next();
        break;
    }
    if (e.state === 'tired' && e.phase >= 3) { e.humT = (e.humT || 0) - dt; if (e.humT <= 0) { e.humT = .55; w.sfx('hum', e.x, { pan: (e.x - p.x) / 480, hint: true }); } }
    e.x += e.vx * dt; e.y += e.vy * dt;
    e.face = PZ.sign(p.x - e.x) || e.face;
  };

  PZ.spawnSeraphina = function (w) {
    const e = PZ.makeBoss(w, 'seraphina', 480, 120, PZ.BOSS_AI_seraphina, { fly: true, w: 56, h: 118, color: '#fff4d0' });
    e.onDefeat = (w, e) => {
      e.state = 'defeated'; e.untouchable = true; w.hazards = []; w.projs = w.projs.filter(q => q.team !== 'enemy');
      w.darkTarget = 0; w.emit({ t: 'bossdown', id: 'seraphina' }); w.sfx('bossdown', e.x); w.slowmo(1.6, .25);
      say(w, 'seraphina', 'Ta… mệt quá. Từ ngày đầu tiên, ta chưa từng được nhắm mắt mà ngủ.', 'I am… so tired. Since the first day I have never closed my eyes to sleep.');
      w.after(2.2, () => { w.choice = { boss: 'seraphina' }; });
    };
    return e;
  };

  PZ.resolveChoice = function (w, spare) {
    const id = w.choice.boss; w.choice = null;
    if (spare) w.save.spared[id] = 1; else w.save.killed[id] = 1;
    w.save.cleared[id] = 1; w.save.weapons.goldthread = w.save.weapons.goldthread || { tier: 0 };
    const e = w.boss;
    if (e) { if (spare) { e.spared = true; w.emit({ t: 'spare', id }); } else { e.dead = true; e.corpse = true; e.deathT = 0; w.emit({ t: 'execute', x: e.x, y: e.y }); w.emit({ t: 'flash', a: 1 }); } }
    w.boss = null; w.scene = spare ? 'ch1_post_spare' : 'ch1_post_kill';
    for (let i = 0; i < 12; i++) w.pickups.push({ kind: 'seed', x: 480 + (i - 6) * 14, y: 400, vy: -420, t: 0 });
  };
})(globalThis.PZ);
