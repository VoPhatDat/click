/* KEY ART: renders the Part II key art with the game's own engine (node tools/keyart.js, after node tools/build.js). */
// Key art, rendered by the game itself: the final form over the torn heaven, the party below it, the logo.
const { chromium } = require('playwright'), fs = require('fs');
const OUT = require('path').join(__dirname, '..', 'art') + '/';
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + require('path').join(__dirname, '..', 'dist', 'ProjectZero2_Genesis.html') + ''); await pg.waitForTimeout(1500);
  await pg.evaluate(() => {
    Sound.ok = false; Save.data = Save.fresh('normal'); const g = Save.data.g2; g.chapter = 7; g.zeroBack = 1; g.liftedSword = 1; g.reviveLearned = 1; ['rook', 'sable', 'mirae', 'ysolde', 'zero', 'vesper'].forEach(i => Save.data.unlocked.push(i));
    UI.hide(); Game.loadLevel('architect2'); Game.state = 'play'; G2.team.want = true; G.player.x = G.arena.trigger + 40; G.startBoss(); G2.term.godMode = true;
    Game.frame = () => {};   // the page's own loop stops; the art is posed by hand
    const T = n => { for (let i = 0; i < n; i++) { if (UI.cur) { UI.hide(); Game.state = 'play'; } if (Cine.active) Cine.update(); G.tick(); Input.endTick(); } };
    T(60); let k = 0; while (G.boss.intro && k++ < 2000) T(1);
    const B = G.boss; B.phase = 4; B.bag = []; B.hp = Math.round(B.maxHp * .12) + 1; B.untargetable = false; B.dmgTakenMult = 1; B.hurt(10, {});
    k = 0; while (!(G2.song.active && G2.song.pos() > 51 && !G.lockInput) && k++ < 8000) T(1);
    T(30); window.__T = T;
  });
  // pose: the god in full, a little rage for colour; the party in a line below it, all facing it
  const pose = async (W, H, layout) => pg.evaluate(([W, H, layout]) => {
    const B = G.boss, A = G.arena; Settings.renderScale = W / 1280; Game.applyVideo(); Settings.quality = 2;
    for (const e of G.enemies) if (!e.boss) { e.hp = 0; e.dead = true; } G.enemies = G.enemies.filter(e => e.boss); G.warns = []; G.projs = []; G2.beams = []; G2.lasers = []; G2.bolts = []; G2.skillCap = null; G.toasts = []; G.sayQ = []; G.sayCur = null; G.g2title = null; G.g2final = null;
    B.scale = 1.45; B.form2 = 1; B.wings = 6; B.eye = 1; B.blink = 0; B.dilate = .6; B.rage = layout === 'poster' ? 1.6 : 1.1; B.rageT = B.rage; B.x = (A.x0 + A.x1) / 2; B.y = A.y + 40; B.script = null; B.capT = 0;
    const cx = B.x, all = [G.player, ...(G.allies || [])];
    const order = ['sable', 'rook', 'vesper', 'nyx', 'zero', 'mirae', 'ysolde'], spots = layout === 'poster' ? [-300, -200, -105, -25, 55, 150, 250] : [-520, -360, -210, -60, 70, 230, 400];
    for (const p of all) { const i = order.indexOf(p.id); p.down = false; p.g2hide = false; p.x = cx + spots[i]; p.y = A.y; p.vx = p.vy = 0; p.grounded = true; p.state = 'move'; p.inv = 0; p.facing = p.x < cx ? 1 : -1; if (p.id === 'nyx' || p.id === 'zero') p.facing = 1; }
    window.__party = all;
    G.lockInput = true; HUD.draw = () => {}; G.letterbox = 0; G.flash = 0; G.shake = 0;
    for (let i = 0; i < 40; i++) { for (const p of all) { p.x = cx + spots[order.indexOf(p.id)]; p.vx = 0; } window.__T(1); }
    for (const p of all) { p.rig.play(p.id === 'nyx' ? 'victory' : 'idle', 0); }
    for (let i = 0; i < 26; i++) { for (const p of all) { p.x = cx + spots[order.indexOf(p.id)]; p.vx = 0; p.facing = p.id === 'nyx' || p.id === 'zero' ? 1 : (p.x < cx ? 1 : -1); } G2.fx.ok || 0; window.__T(1); }
    const z = layout === 'poster' ? .62 : .6, vw = 1280 / z, vh = 720 / z; G.cineCam = null; G.cam.zoom = z; G.cam.x = cx - vw / 2; G.cam.y = A.y - vh * 1.0; G.cam.tz = z;
    for (const p of all) p.g2hide = true;
    const tick0 = BOSSES.architect2.tick; BOSSES.architect2.tick = bb => { tick0(bb); bb.x = cx; bb.y = A.y + 40; };
    B.x = cx; B.lastX = cx; B.wingS = null; Settings.renderScale = 1; Game.applyVideo();
    for (let i = 0; i < 50; i++) { window.__T(1); B.x = cx; Game.render(); }
    Settings.renderScale = W / 1280; Game.applyVideo(); B.x = cx; Game.render(); for (const p of all) p.g2hide = false;
  }, [W, H, layout]);
  // the party, large, on a ledge in front of the light
  const heroes = async (layout) => pg.evaluate((layout) => {
    const c = Game.ctx, s = Game.scale; c.setTransform(s, 0, 0, s, 0, 0); const W = 1280, H = 720, ground = layout === 'poster' ? 600 : 608;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; c.drawImage(Glow.get('#ffcf90'), W / 2 - 520, ground - 300, 1040, 360); c.globalAlpha = .35; c.drawImage(Glow.get('#b48cff'), W / 2 - 700, ground - 200, 1400, 260); c.restore();
    // the ledge: dark stone with a lit rim
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, ground + 26); const R = U.mulberry(11); for (let x = 0; x <= W; x += 40) c.lineTo(x, ground + 4 + Math.abs(x - W / 2) * .05 + (R() - .5) * 10); c.lineTo(W, H); c.closePath();
    const lg = c.createLinearGradient(0, ground, 0, H); lg.addColorStop(0, '#1c1424'); lg.addColorStop(1, '#05030a'); c.fillStyle = lg; c.fill(); c.strokeStyle = 'rgba(255,200,140,.55)'; c.lineWidth = 2; c.stroke();
    const P = window.__party, byId = id => P.find(p => p.id === id);
    const cast = layout === 'poster' ? [['sable', -250, 2.3, 1], ['rook', -175, 2.5, 1], ['vesper', -100, 2.7, 1], ['nyx', 0, 3.3, 1], ['zero', 92, 3.0, -1], ['mirae', 172, 2.6, -1], ['ysolde', 245, 2.4, -1]]
                                    : [['sable', -455, 1.6, 1], ['rook', -325, 1.8, 1], ['vesper', -190, 1.95, 1], ['nyx', -40, 2.35, 1], ['zero', 75, 2.2, -1], ['mirae', 220, 1.9, -1], ['ysolde', 360, 1.7, -1]];
    for (const [id, dx, sc, face] of cast.sort((a, b) => a[2] - b[2])) {
      const p = byId(id); if (!p) continue; const x = W / 2 + dx, y = ground + 6 + (Math.abs(dx) * .05);
      for (let i = 0; i < 30; i++) { p.rig.tick(); p.rig.updateChain(x, y, face, 0); }
      c.save(); c.translate(x, y); c.scale(sc, sc); c.translate(-x, -y);
      // a rim of the god's light along each figure
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35; c.drawImage(Glow.get(id === 'nyx' ? '#b48cff' : '#ffcf90'), x - 46, y - 92, 92, 92); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      p.rig.draw(c, x, y, face, 1); c.restore();
      c.save(); c.globalAlpha = .55; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y + 2, 22 * sc, 5 * sc, 0, 0, TAU); c.fill(); c.restore();
    }
  }, layout);
  // the logo, painted over the frame in the game's own type
  const logo = async (layout) => pg.evaluate((layout) => {
    const c = Game.ctx, s = Game.scale; c.setTransform(s, 0, 0, s, 0, 0); const W = 1280, H = 720;
    // cinematic grade: deeper corners, a warm floor
    const v = c.createRadialGradient(W / 2, H * .42, H * .3, W / 2, H * .5, W * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(4,2,10,.72)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    const fl = c.createLinearGradient(0, H * .7, 0, H); fl.addColorStop(0, 'rgba(0,0,0,0)'); fl.addColorStop(1, 'rgba(6,2,12,.85)'); c.fillStyle = fl; c.fillRect(0, H * .7, W, H * .3);
    const cy = layout === 'poster' ? H * .9 : H * .925; c.textAlign = 'center';
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .45; c.drawImage(Glow.get('#ffb060'), W / 2 - 420, cy - 120, 840, 200); c.restore();
    c.font = 'bold 46px "Palatino Linotype", "Book Antiqua", "Times New Roman", serif'; const t1 = 'PROJECT ZERO II'; const sp = 11; let wsum = 0; const ws = [...t1].map(ch => c.measureText(ch).width + sp); wsum = ws.reduce((a, b) => a + b, 0) - sp;
    let x = W / 2 - wsum / 2; c.textAlign = 'left'; c.lineWidth = 7; c.strokeStyle = 'rgba(20,6,0,.9)'; const g = c.createLinearGradient(0, cy - 60, 0, cy); g.addColorStop(0, '#fff6d8'); g.addColorStop(.55, '#ffd06a'); g.addColorStop(1, '#c87a30');
    for (let i = 0; i < t1.length; i++) { c.strokeText(t1[i], x, cy); c.fillStyle = g; c.shadowColor = '#ff9a40'; c.shadowBlur = 18; c.fillText(t1[i], x, cy); c.shadowBlur = 0; x += ws[i]; }
    c.textAlign = 'center'; c.font = '21px "Palatino Linotype", "Times New Roman", serif'; c.fillStyle = '#e8dcff'; const t2 = 'G  E  N  E  S  I  S'; c.lineWidth = 4; c.strokeText(t2, W / 2, cy + 28); c.fillText(t2, W / 2, cy + 28);
    c.fillStyle = 'rgba(255,216,107,.8)'; c.fillRect(W / 2 - 240, cy + 9, 480, 1.2);
    c.font = 'italic 12px "Palatino Linotype", serif'; c.fillStyle = 'rgba(232,220,255,.85)'; c.fillText('Sách Sáng Thế Thứ Hai  ·  Mọi ngày đều cần một đêm', W / 2, cy + 46);
    c.font = '11px "Palatino Linotype", serif'; c.fillStyle = 'rgba(255,255,255,.45)'; c.textAlign = 'right'; c.fillText('VoPhatDat + Claude', W - 18, H - 14);
  }, layout);
  const save = async (name) => { const d = await pg.evaluate(() => Game.canvas.toDataURL('image/png')); fs.writeFileSync(OUT + name, Buffer.from(d.split(',')[1], 'base64')); console.log('wrote', name); };
  await pose(3840, 2160, 'wide'); await heroes('wide'); await logo('wide'); await save('ProjectZeroII_keyart_3840x2160.png');
  await pose(3840, 2160, 'wide'); await heroes('wide'); await save('ProjectZeroII_keyart_nologo_3840x2160.png');
  console.log(errs.slice(0, 3)); await b.close();
})();
