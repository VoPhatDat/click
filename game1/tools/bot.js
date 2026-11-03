// Autoplay bot: drives the same intent interface a human uses. Reads world state (it is a test bot).
function makeBot(PZ, opts) {
  opts = opts || {};
  const mem = { jumpHold: 0, stuckT: 0, lastX: 0, t: 0, dashLock: 0 };
  function edge(I, k, on) { I[k] = on; I[k + 'P'] = on; }
  return function bot(w) {
    const p = w.player, I = PZ.makeIntent();
    if (!p || p.dead) return I;
    mem.t += PZ.DT;
    const press = k => edge(I, k, true);
    const move = d => { if (d < 0) I.left = true; else if (d > 0) I.right = true; };
    if (mem.jumpHold > 0) { mem.jumpHold--; I.jump = true; }
    const jump = () => { if (p.onGround || p.jumpsLeft > 0 || p.wall) { press('jump'); mem.jumpHold = 18; } };
    const boss = w.boss && !w.boss.dead ? w.boss : null;

    // ---------- Seraphina specific dodges ----------
    const rad = w.hazards.find(h => h.kind === 'radiance' && !h.fired);
    if (rad) {
      const spans = PZ.shadowSpans(w, rad.lx, rad.ly);
      let best = null, bd = 1e9;
      for (const [a, b] of spans) { if (b - a < 20) continue; const c = PZ.clamp(p.x, a + 14, b - 14); const d = Math.abs(c - p.x); if (d < bd) { bd = d; best = c; } }
      if (best != null) {
        if (!PZ.inShadow(w, rad.lx, rad.ly, p.x, p.y - 34) || Math.abs(best - p.x) > 30) { move(best - p.x); if (Math.abs(best - p.x) > 160 && p.dashCd <= 0 && !opts.noDash) press('dash'); }
        if (p.cid === 'rook' && rad.t > rad.tele - .4 && p.cds.s3 <= 0 && !PZ.inShadow(w, rad.lx, rad.ly, p.x, p.y - 34)) { I.left = I.right = false; press('s3'); }
        return I;
      }
    }
    const sky = w.hazards.find(h => h.kind === 'skypillar' && !h.fired);
    if (sky && Math.abs(p.x - sky.x) < 90) { move(p.x < sky.x ? -1 : 1); if (p.x < 60) I.left = false, I.right = true; if (p.x > 900) I.right = false, I.left = true; return I; }
    if (boss && (boss.state === 'sweep' || boss.state === 'bellRun' || boss.state === 'charge')) {
      const toward = PZ.sign(p.x - boss.x) === PZ.sign(boss.vx);
      const gap = Math.abs(boss.x - p.x);
      if (toward && gap < 150 && gap > 30) { jump(); }
      if (toward && gap < 200) return I;
    }
    if (boss && boss.state === 'bellTele') return I;
    if (boss && boss.type === 'knight' && boss.state === 'chargeTele' && Math.abs(boss.x - p.x) < 300) { /* wait to jump */ }
    // incoming ground waves
    for (const pr of w.projs) if (pr.team === 'enemy' && pr.look === 'wave') { const d = pr.x - p.x; if (Math.abs(d) < 90 && PZ.sign(-d) === PZ.sign(pr.vx)) { jump(); break; } }

    // ---------- choose target ----------
    let tgt = null;
    if (boss && !boss.untouchable && boss.state !== 'defeated') tgt = boss;
    if (!tgt) { let bd = 1e9; for (const e of w.ents) if (e.team === 'enemy' && !e.dead && !e.dummy && !e.untouchable && Math.abs(e.x - p.x) < 520 && Math.abs(e.y - p.y) < 300) { const d = Math.abs(e.x - p.x); if (d < bd) { bd = d; tgt = e; } } }
    // Zero balance + light form vs forbidden shadows
    if (p.form) {
      const needLight = tgt && tgt.lightOnly;
      if (p.formCd <= 0 && ((p.form === 'light' && (p.balance < 18 && !needLight)) || (p.form === 'wrath' && (p.balance > 80 || needLight)))) press('form');
    }
    if (tgt) {
      const wep = PZ.weaponOf(p), ranged = wep.combo[0].kind === 'proj';
      const want = ranged ? 260 : Math.max(36, (wep.combo[0].r || 60) * .7);
      const dx = tgt.x - p.x, dist = Math.abs(dx);
      const high = tgt.fly && (p.y - 30) - (tgt.y - tgt.h / 2) > 70;
      if (dist > want) move(dx); else if (ranged && dist < 140) move(-dx);
      else p.face = PZ.sign(dx) || p.face;
      if (dist < want + 40 || ranged) {
        if (I.left || I.right) { } else { if (PZ.sign(dx) !== p.face) move(dx); }
        if ((mem.t * 60 | 0) % 3 === 0) press('attack');
      }
      if (high && dist < 90 && p.onGround && !ranged) jump();
      const near = dist < 220;
      if (near) {
        for (const k of ['s1', 's2', 's3']) if (p.cds[k] <= 0 && Math.random() < .03) { press(k); break; }
        if (p.ult >= 100) press('ult');
      }
      if (p.hp < p.maxHp * .35 && p.cid === 'ysolde' && p.cds.s3 <= 0 && p.hunger >= 30) press('s3');
    } else {
      // traverse right
      move(1);
      const ahead = w.surf(p.x + 46);
      if (p.onGround && (ahead === Infinity || ahead < p.y - 14)) jump();
      if (!p.onGround && p.vy > 60 && w.surf(p.x + 20) === Infinity && p.jumpsLeft > 0) jump();
      if (p.wall > 0 && !p.onGround) { if (Math.random() < .2) jump(); }
      if (Math.abs(p.x - mem.lastX) < 1) mem.stuckT += PZ.DT; else mem.stuckT = 0; mem.lastX = p.x;
      if (mem.stuckT > .8) { jump(); if (mem.stuckT > 2) { move(-1); I.right = false; } if (mem.stuckT > 2.6) mem.stuckT = 0; }
    }
    // obstacles while moving (also when chasing a target)
    if (I.left || I.right) {
      const d = I.left ? -1 : 1, ah = w.surf(p.x + d * 40);
      if (p.onGround && (ah === Infinity || ah < p.y - 14)) jump();
      if (!p.onGround && p.wall === d && Math.random() < .15) jump();
      if (!p.onGround && p.vy > 60 && w.surf(p.x + d * 20) === Infinity && p.jumpsLeft > 0) jump();
    }
    return I;
  };
}
module.exports = { makeBot };
