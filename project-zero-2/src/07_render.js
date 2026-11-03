'use strict';
// ===== Renderer: parallax worlds, skeletal rigs, particles, cinematic post-processing =====
(function (PZ) {
  const W = PZ.W, H = PZ.H, TAU = Math.PI * 2;
  const R = PZ.R = { parts: [], cam: { x: 0, y: 0, shake: 0, zoom: 1 }, flash: 0, flashC: '#fff', chroma: 0, t: 0, layers: {}, texts: [], cape: new Map(), banner: null, ultT: 0, ultName: '', glassBreak: 0 };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  R.mk = mk;
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };
  R.rgba = rgba;

  // ---------- value noise ----------
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const s = t => t * t * (3 - 2 * t);
    const a = PZ.hash(xi, yi), b = PZ.hash(xi + 1, yi), c = PZ.hash(xi, yi + 1), d = PZ.hash(xi + 1, yi + 1);
    return PZ.lerp(PZ.lerp(a, b, s(xf)), PZ.lerp(c, d, s(xf)), s(yf));
  }
  function fbm(x, y, o) { let v = 0, a = .5, f = 1; for (let i = 0; i < (o || 4); i++) { v += a * vnoise(x * f, y * f); f *= 2; a *= .5; } return v; }
  R.fbm = fbm;

  R.init = function (canvas) {
    R.cv = canvas; R.ctx = canvas.getContext('2d');
    R.bloomC = mk(W / 4, H / 4); R.bloomX = R.bloomC.getContext('2d');
    R.darkC = mk(W, H); R.darkX = R.darkC.getContext('2d');
    R.rimC = mk(256, 256); R.rimX = R.rimC.getContext('2d'); R.rimC2 = mk(256, 256); R.rimX2 = R.rimC2.getContext('2d');
    // grain
    R.grain = mk(256, 256); { const g = R.grain.getContext('2d'), id = g.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); }
    // vignette
    R.vig = mk(W, H); { const g = R.vig.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.62)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    // stone texture (fractal noise, generated once)
    R.stone = {};
    for (const [k, c1, c2] of [['dawn', '#f2e2c0', '#c9a874'], ['cathedral', '#f4efe4', '#bfb39a'], ['garden', '#7a5a3a', '#4a3420']]) {
      const c = mk(128, 128), g = c.getContext('2d'), id = g.createImageData(128, 128);
      const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        let n = fbm(x / 18 + k.length * 3, y / 18, 4);
        const brick = ((y % 32) < 2 || ((x + (Math.floor(y / 32) % 2) * 32) % 64) < 2) ? .55 : 1;
        n = n * brick; const i = (y * 128 + x) * 4;
        id.data[i] = PZ.lerp(b >> 16 & 255, a >> 16 & 255, n); id.data[i + 1] = PZ.lerp(b >> 8 & 255, a >> 8 & 255, n); id.data[i + 2] = PZ.lerp(b & 255, a & 255, n); id.data[i + 3] = 255;
      }
      g.putImageData(id, 0, 0); R.stone[k] = R.ctx.createPattern(c, 'repeat');
    }
    R.buildThemes();
  };

  // ---------- background layers (pre-rendered, tiled) ----------
  R.buildThemes = function () {
    const LW = 1920;
    const rnd = PZ.rng(99);
    const layer = (fn) => { const c = mk(LW, H); fn(c.getContext('2d'), LW); return c; };
    const spires = (g, w, base, col, n, hmin, hmax, win) => {
      g.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const x = rnd() * w, bw = 18 + rnd() * 50, bh = hmin + rnd() * (hmax - hmin);
        g.fillRect(x, base - bh, bw, bh + 40);
        g.beginPath(); // dome or spire
        if (rnd() < .5) { g.moveTo(x - 3, base - bh); g.lineTo(x + bw / 2, base - bh - bw * 1.6); g.lineTo(x + bw + 3, base - bh); }
        else { g.arc(x + bw / 2, base - bh, bw / 2 + 2, Math.PI, 0); }
        g.fill();
        if (win) { g.save(); g.fillStyle = win; for (let y = base - bh + 10; y < base; y += 16) for (let xx = x + 5; xx < x + bw - 6; xx += 10) if (rnd() < .45) g.fillRect(xx, y, 4, 8); g.restore(); g.fillStyle = col; }
      }
    };
    // DAWN
    R.layers.dawn = [
      { f: .04, c: layer((g, w) => { for (let i = 0; i < 26; i++) { const x = rnd() * w, y = 60 + rnd() * 220, r = 40 + rnd() * 120; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,250,235,.55)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.8, r * .5, 0, 0, TAU); g.fill(); } }) },
      { f: .12, c: layer((g, w) => spires(g, w, 420, 'rgba(214,168,108,.55)', 60, 60, 220)) },
      { f: .25, c: layer((g, w) => spires(g, w, 440, 'rgba(190,138,80,.8)', 46, 50, 190, 'rgba(255,248,210,.9)')) },
      { f: .45, c: layer((g, w) => { spires(g, w, 470, '#9a6a3a', 30, 40, 150, 'rgba(255,236,170,.95)'); g.fillStyle = '#a87842'; for (let x = 0; x < w; x += 240) { g.fillRect(x, 330, 220, 8); for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + 27 + k * 55, 380, 26, Math.PI, 0); g.lineTo(x + 53 + k * 55, 470); g.lineTo(x + 1 + k * 55, 470); g.fill(); } } }) },
      { f: .7, c: layer((g, w) => { g.fillStyle = '#8a5a30'; for (let x = 0; x < w; x += 300 + rnd() * 200) { const h = 160 + rnd() * 140; g.fillRect(x, 470 - h, 34, h + 80); g.beginPath(); g.moveTo(x - 8, 470 - h); g.lineTo(x + 17, 470 - h - 50); g.lineTo(x + 42, 470 - h); g.fill(); g.fillStyle = 'rgba(255,220,140,.8)'; g.fillRect(x + 12, 480 - h, 10, 18); g.fillStyle = '#8a5a30'; } }) }
    ];
    R.fg = R.fg || {};
    R.fg.dawn = { f: 1.3, c: layer((g, w) => { for (let x = 0; x < w; x += 900 + rnd() * 500) { g.fillStyle = 'rgba(150,40,30,.3)'; g.beginPath(); g.moveTo(x + 46, 40); g.lineTo(x + 110, 40); g.lineTo(x + 110, 230); g.lineTo(x + 78, 200); g.lineTo(x + 46, 230); g.fill(); g.fillStyle = 'rgba(255,210,90,.5)'; g.fillRect(x + 72, 90, 14, 14); } }) };
    // CATHEDRAL
    R.layers.cathedral = [
      { f: 0, c: layer((g, w) => {
        g.fillStyle = '#c9bb9e'; g.fillRect(0, 0, w, H);
        for (let x = 0; x < w; x += 320) { // arches + stained glass
          g.fillStyle = '#b8a888'; g.fillRect(x, 0, 40, H);
          const cx = x + 180, cy = 170;
          const rose = (r) => { for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU, a1 = (i + 1) / 24 * TAU; for (let ring = 0; ring < 4; ring++) { const r0 = r * ring / 4, r1 = r * (ring + 1) / 4; g.beginPath(); g.arc(cx, cy, r1, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.closePath(); g.fillStyle = ['#ffd36a', '#ff8a5a', '#8ac8ff', '#c8a0ff', '#ffffff', '#9ae0a0'][(i + ring * 3) % 6]; g.globalAlpha = .55 + rnd() * .3; g.fill(); g.globalAlpha = 1; g.strokeStyle = '#6a5a40'; g.lineWidth = 1.5; g.stroke(); } } };
          rose(88);
          g.fillStyle = '#d8caa8'; g.fillRect(x + 110, 280, 140, 260);
          for (let k = 0; k < 3; k++) { g.fillStyle = ['rgba(255,210,120,.5)', 'rgba(130,190,255,.45)', 'rgba(255,140,110,.45)'][k]; g.beginPath(); g.moveTo(x + 122 + k * 42, 470); g.lineTo(x + 122 + k * 42, 330); g.arc(x + 138 + k * 42, 330, 16, Math.PI, 0); g.lineTo(x + 154 + k * 42, 470); g.fill(); }
        }
      }) },
      { f: .2, c: layer((g, w) => { for (let x = 60; x < w; x += 160) { const gr = g.createLinearGradient(x, 0, x + 40, 0); gr.addColorStop(0, '#7a6c56'); gr.addColorStop(.5, '#a8987c'); gr.addColorStop(1, '#6a5c48'); g.fillStyle = gr; g.fillRect(x, 0, 40, 470); g.fillStyle = '#8a7a5e'; g.fillRect(x - 8, 0, 56, 24); g.fillRect(x - 8, 446, 56, 24); } }) }
    ];
    // GARDEN
    R.layers.garden = [
      { f: .06, c: layer((g, w) => { for (let i = 0; i < 18; i++) { const x = rnd() * w, y = 40 + rnd() * 160, r = 40 + rnd() * 90; g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x, y, r * 1.6, r * .45, 0, 0, TAU); g.fill(); } }) },
      { f: .15, c: layer((g, w) => { g.fillStyle = 'rgba(110,150,150,.6)'; g.beginPath(); g.moveTo(0, 540); for (let x = 0; x <= w; x += 20) g.lineTo(x, 330 - 90 * fbm(x / 300, 1, 3) - 40 * Math.sin(x / w * TAU * 2)); g.lineTo(w, 540); g.fill(); }) },
      { f: .32, c: layer((g, w) => { g.fillStyle = '#5f9a6a'; g.beginPath(); g.moveTo(0, 540); for (let x = 0; x <= w; x += 16) g.lineTo(x, 380 - 70 * fbm(x / 200, 5, 3) - 20 * Math.sin(x / w * TAU * 3)); g.lineTo(w, 540); g.fill(); }) },
      { f: .55, c: layer((g, w) => { for (let x = 30; x < w; x += 90 + rnd() * 140) R.tree(g, x, 470, 60 + rnd() * 70, rnd); }) }
    ];
  };
  R.tree = function (g, x, y, h, rnd) {
    g.strokeStyle = '#3a2a1a'; g.lineCap = 'round';
    const br = (x, y, a, l, d) => { if (d > 6 || l < 4) { g.fillStyle = rnd() < .5 ? 'rgba(80,150,80,.85)' : 'rgba(120,180,90,.85)'; g.beginPath(); g.arc(x, y, 6 + rnd() * 6, 0, TAU); g.fill(); return; } const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = Math.max(1, 7 - d); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a - .4 - rnd() * .3, l * .74, d + 1); br(x2, y2, a + .4 + rnd() * .3, l * .74, d + 1); };
    br(x, y, -Math.PI / 2, h * .38, 0);
  };

  // ---------- sky per theme ----------
  R.sky = function (ctx, w) {
    const th = w.theme;
    if (th === 'dawn') {
      const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f2b870'); gr.addColorStop(.45, '#fbe2b4'); gr.addColorStop(1, '#eea860'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      const sx = W * .72, sy = 130; const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 320); sg.addColorStop(0, 'rgba(255,255,250,1)'); sg.addColorStop(.12, 'rgba(255,250,220,.95)'); sg.addColorStop(.4, 'rgba(255,230,160,.35)'); sg.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
      // god rays
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(sx, sy);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + R.t * .02; ctx.rotate(TAU / 12); ctx.fillStyle = 'rgba(255,240,200,.05)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, -40 - 20 * Math.sin(R.t + i)); ctx.lineTo(900, 40); ctx.fill(); }
      ctx.restore();
    } else if (th === 'cathedral') { ctx.fillStyle = '#cfc2a8'; ctx.fillRect(0, 0, W, H); }
    else if (th === 'garden') {
      const cyc = (w.t / 90 + .3) % 1; // day-night cycle (90s)
      const keys = [[0, '#2a3a6a', '#f8b090'], [.15, '#7ab8e8', '#e8f4ff'], [.5, '#6aa8e0', '#d8ecff'], [.68, '#e88a5a', '#ffd0a0'], [.8, '#141a3a', '#3a3060'], [1, '#2a3a6a', '#f8b090']];
      let a = keys[0], b = keys[1]; for (let i = 0; i < keys.length - 1; i++) if (cyc >= keys[i][0] && cyc <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; }
      const k = (cyc - a[0]) / (b[0] - a[0] || 1);
      const mix = (c1, c2) => { const x = parseInt(c1.slice(1), 16), y = parseInt(c2.slice(1), 16); const r = PZ.lerp(x >> 16, y >> 16, k) | 0, gg = PZ.lerp(x >> 8 & 255, y >> 8 & 255, k) | 0, bb = PZ.lerp(x & 255, y & 255, k) | 0; return `rgb(${r},${gg},${bb})`; };
      const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, mix(a[1], b[1])); gr.addColorStop(1, mix(a[2], b[2])); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      const night = cyc > .72 || cyc < .08; R.nightK = night ? 1 : 0;
      if (night) { ctx.fillStyle = '#fff'; for (let i = 0; i < 80; i++) { ctx.globalAlpha = .4 + .4 * Math.sin(R.t * 2 + i); ctx.fillRect(PZ.hash(i, 1) * W, PZ.hash(i, 2) * 300, 2, 2); } ctx.globalAlpha = 1; }
      const sunA = cyc * TAU - Math.PI / 2; const sx = W / 2 + Math.cos(sunA - Math.PI / 2) * 420, sy = 420 + Math.sin(sunA - Math.PI / 2) * 340;
      ctx.fillStyle = night ? '#f0f0ff' : '#fff6d0'; ctx.beginPath(); ctx.arc(sx, sy, night ? 22 : 34, 0, TAU); ctx.fill();
    } else { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); }
  };

  const drawLayer = (ctx, L, camX) => { const lw = L.c.width; let ox = -((camX * L.f) % lw); if (ox > 0) ox -= lw; for (let x = ox; x < W; x += lw) ctx.drawImage(L.c, x, 0); };

  // ---------- terrain ----------
  R.terrain = function (ctx, w, cx) {
    const ter = w.terrain, T = PZ.TILE;
    const c0 = Math.max(0, Math.floor(cx / T) - 1), c1 = Math.min(ter.cols - 1, Math.ceil((cx + W) / T) + 1);
    const pat = R.stone[w.theme] || R.stone.dawn;
    ctx.save(); ctx.translate(-cx, 0);
    ctx.fillStyle = pat;
    ctx.beginPath();
    let open = false;
    for (let c = c0; c <= c1; c++) {
      const a = ter.yl[c], b = ter.yr[c];
      if (a === Infinity) { if (open) { ctx.lineTo(c * T, H + 50); ctx.closePath(); open = false; } continue; }
      if (!open) { ctx.moveTo(c * T, H + 50); ctx.lineTo(c * T, a); open = true; } else ctx.lineTo(c * T, a);
      ctx.lineTo((c + 1) * T, b);
    }
    if (open) { ctx.lineTo((c1 + 1) * T, H + 50); ctx.closePath(); }
    ctx.save(); ctx.translate(cx * 0, 0); ctx.fill(); ctx.restore();
    // depth shading
    const dg = ctx.createLinearGradient(0, 380, 0, H); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, w.theme === 'garden' ? 'rgba(10,20,10,.55)' : 'rgba(60,30,10,.45)'); ctx.fillStyle = dg; ctx.fill();
    // top trim
    ctx.lineWidth = 4; ctx.strokeStyle = w.theme === 'garden' ? '#6ab04a' : w.theme === 'cathedral' ? '#d8c28a' : '#ffe2a0';
    ctx.beginPath(); open = false;
    for (let c = c0; c <= c1; c++) { const a = ter.yl[c], b = ter.yr[c]; if (a === Infinity) { open = false; continue; } if (!open) { ctx.moveTo(c * T, a); open = true; } else ctx.lineTo(c * T, a); ctx.lineTo((c + 1) * T, b); }
    ctx.stroke();
    // walls (cliff faces) highlight
    ctx.strokeStyle = 'rgba(255,240,200,.35)'; ctx.lineWidth = 2;
    for (let c = c0 + 1; c <= c1; c++) { const pr = ter.yr[c - 1], cu = ter.yl[c]; if (pr !== Infinity && cu !== Infinity && Math.abs(pr - cu) > 30) { ctx.beginPath(); ctx.moveTo(c * T, pr); ctx.lineTo(c * T, cu); ctx.stroke(); } }
    // grass (garden) swaying
    if (w.theme === 'garden' && PZ.Settings.gfx !== 'low') {
      ctx.strokeStyle = '#7ac85a'; ctx.lineWidth = 1.5;
      for (let x = Math.floor(cx / 6) * 6; x < cx + W; x += 6) { const g = ter.surf(x); if (g === Infinity) continue; const sw = Math.sin(R.t * 2 + x * .05) * 3; ctx.beginPath(); ctx.moveTo(x, g); ctx.quadraticCurveTo(x + sw * .5, g - 5, x + sw, g - 8 - PZ.hash(x, 3) * 6); ctx.stroke(); }
    }
    // platforms
    for (const p of ter.plats) {
      if (p.x > cx + W || p.x + p.w < cx) continue;
      ctx.fillStyle = pat; ctx.fillRect(p.x, p.y, p.w, 14);
      ctx.fillStyle = 'rgba(255,230,160,.8)'; ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(p.x, p.y + 11, p.w, 3);
      ctx.fillStyle = 'rgba(255,220,140,.35)'; ctx.beginPath(); ctx.moveTo(p.x + 6, p.y + 14); ctx.lineTo(p.x + p.w / 2, p.y + 40); ctx.lineTo(p.x + p.w - 6, p.y + 14); ctx.fill();
    }
    // pillars
    for (const pl of ter.pillars) {
      const gr = ctx.createLinearGradient(pl.x - pl.w / 2, 0, pl.x + pl.w / 2, 0); gr.addColorStop(0, '#bfb092'); gr.addColorStop(.4, '#fffaf0'); gr.addColorStop(1, '#9a8c70');
      ctx.fillStyle = gr; ctx.fillRect(pl.x - pl.w / 2, pl.top, pl.w, 460 - pl.top);
      ctx.fillStyle = '#d8c89a'; ctx.fillRect(pl.x - pl.w / 2 - 8, pl.top - 14, pl.w + 16, 16); ctx.fillRect(pl.x - pl.w / 2 - 6, 444, pl.w + 12, 16);
      ctx.strokeStyle = 'rgba(120,100,70,.4)'; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(pl.x + k * 11, pl.top); ctx.lineTo(pl.x + k * 11, 444); ctx.stroke(); }
    }
    ctx.restore();
  };

  // ---------- skeletal humanoid rig ----------
  function limb(ctx, x, y, a1, l1, a2, l2, w1, w2, col) {
    const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
    const ex = kx + Math.sin(a1 + a2) * l2, ey = ky + Math.cos(a1 + a2) * l2;
    ctx.strokeStyle = col; ctx.lineCap = 'round';
    ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(kx, ky); ctx.stroke();
    ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(ex, ey); ctx.stroke();
    return [kx, ky, ex, ey];
  }
  R.limb = limb;

  // pose from state
  function poseOf(e, w) {
    const P = { lean: 0, bob: 0, thF: 0, shF: 0, thB: 0, shB: 0, arF: .2, elF: -.4, arB: -.2, elB: -.5, head: 0, wep: .6, crouch: 0 };
    const t = e.anim ? e.anim.t : R.t;
    const sp = Math.abs(e.vx);
    if (e.dead) { P.lean = 1.3; P.crouch = 20; P.arF = 1.4; P.arB = 1; return P; }
    if (!e.onGround && !e.fly && !e.flying) {
      if (e.vy < 0) { P.thF = -.9; P.shF = 1.3; P.thB = .3; P.shB = .5; P.arF = -1.2; P.arB = -.9; }
      else { P.thF = -.4; P.shF = .6; P.thB = .2; P.shB = .4; P.arF = -.6; P.arB = -1.1; }
      if (e.wallSlide) { P.lean = -.2; P.arF = -2.4; P.arB = -2; }
    } else if (sp > 30) {
      e.anim.run = (e.anim.run || 0) + sp * PZ.DT * .045;
      const ph = e.anim.run;
      P.thF = Math.sin(ph) * .85; P.thB = Math.sin(ph + Math.PI) * .85;
      P.shF = Math.max(0, -Math.cos(ph)) * 1.2 + .1; P.shB = Math.max(0, Math.cos(ph)) * 1.2 + .1;
      P.arF = -Math.sin(ph) * .7; P.arB = Math.sin(ph) * .7; P.lean = .18; P.bob = Math.abs(Math.sin(ph)) * 3;
    } else { P.bob = Math.sin(t * 2.2) * 1.2; P.arF = .15 + Math.sin(t * 2.2) * .04; P.arB = -.15; }
    if (e.dashT > 0) { P.lean = .6; P.thF = -1; P.shF = 1.4; P.thB = .9; P.shB = .3; P.arF = 1.4; P.arB = 1.2; }
    if (e.hurtT > 0) { P.lean = -.35; P.head = -.3; }
    if (e.guard) { P.arF = -1.3; P.elF = -1.2; }
    if (e.atk) {
      const k = e.atk.t / e.atk.hit.t, at = e.atk.hit.at / e.atk.hit.t;
      const kind = e.atk.hit.kind, odd = e.atk.idx % 2;
      if (kind === 'proj' || kind === 'zone') { P.arF = -1.57 + (k < at ? -.4 : .1); P.elF = 0; P.lean = .1; }
      else if (kind === 'spin') { P.wep = -k * TAU * 1.1; P.arF = -1.4 + Math.sin(k * TAU) * .6; P.lean = .2; }
      else {
        const wind = odd ? 1.8 : -2.6, end = odd ? -2.4 : 1.2;
        const s = k < at ? PZ.ease(k / at) * .3 : .3 + PZ.ease(Math.min(1, (k - at) / (1 - at) * 2.5)) * .7;
        P.arF = PZ.lerp(wind, end, s) * (k < at ? .6 : 1); if (k < at) P.arF = PZ.lerp(.2, wind, k / at);
        P.elF = -.2; P.lean = .25 * s; P.thF = -.5 * s; P.shF = .6 * s; P.thB = .5 * s;
        P.wep = P.arF * .3 + (odd ? -1.2 : .4);
      }
    }
    if (e.flying) { P.thF = .2; P.shF = .4; P.thB = .4; P.shB = .6; }
    return P;
  }

  // cape / hair verlet
  function chain(id, ax, ay, n, seg, wind) {
    let c = R.cape.get(id);
    if (!c) { c = []; for (let i = 0; i < n; i++) c.push({ x: ax, y: ay + i * seg, px: ax, py: ay + i * seg }); R.cape.set(id, c); }
    c[0].x = ax; c[0].y = ay; c[0].px = ax; c[0].py = ay;
    for (let i = 1; i < n; i++) { const p = c[i], vx = (p.x - p.px) * .9, vy = (p.y - p.py) * .9; p.px = p.x; p.py = p.y; p.x += vx + wind; p.y += vy + .55; }
    for (let it = 0; it < 3; it++) for (let i = 1; i < n; i++) { const a = c[i - 1], b = c[i]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, df = (d - seg) / d; b.x -= dx * df; b.y -= dy * df; }
    return c;
  }
  R.chain = chain;

  R.weapon = function (ctx, shape, len, col, glow, ang) {
    ctx.save(); ctx.rotate(ang);
    ctx.shadowColor = glow; ctx.shadowBlur = PZ.Settings.gfx === 'low' ? 0 : 8;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    switch (shape) {
      case 'sword': ctx.fillStyle = '#6a5030'; ctx.fillRect(-2, -3, 4, 10); ctx.fillStyle = '#ffd772'; ctx.fillRect(-7, 5, 14, 3); ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.moveTo(-3, 8); ctx.lineTo(3, 8); ctx.lineTo(1.5, 8 + len); ctx.lineTo(0, 12 + len); ctx.lineTo(-1.5, 8 + len); ctx.fill(); ctx.strokeStyle = 'rgba(255,200,90,.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(1, 22); ctx.lineTo(-1, 30); ctx.stroke(); break;
      case 'greatsword': ctx.fillStyle = '#4a3020'; ctx.fillRect(-2.5, -6, 5, 14); ctx.fillStyle = '#c8a040'; ctx.fillRect(-11, 7, 22, 5); ctx.fillStyle = '#dcd6cc'; ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(6, 12); ctx.lineTo(5, 10 + len); ctx.lineTo(0, 20 + len); ctx.lineTo(-5, 10 + len); ctx.fill(); ctx.fillStyle = 'rgba(255,210,120,.6)'; ctx.fillRect(-1, 14, 2, len - 6); break;
      case 'chain': for (let i = 0; i < 6; i++) { ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 6 + i * 5, 2.5, 3.5, 0, 0, TAU); ctx.stroke(); } break;
      case 'shield': ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); ctx.lineTo(14, 18); ctx.lineTo(0, 34); ctx.lineTo(-14, 18); ctx.fill(); ctx.strokeStyle = '#e0a040'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#e0a040'; ctx.fillRect(-2, -2, 4, 26); ctx.fillRect(-10, 6, 20, 4); break;
      case 'hammer': ctx.fillStyle = '#4a3020'; ctx.fillRect(-2.5, -4, 5, len); ctx.fillStyle = '#7a7a80'; ctx.fillRect(-14, len - 6, 28, 18); ctx.fillStyle = '#ff8a3a'; ctx.fillRect(-14, len + 2, 28, 3); break;
      case 'spear': ctx.fillStyle = '#5a3a20'; ctx.fillRect(-1.5, -20, 3, len + 10); ctx.fillStyle = '#f0e0b0'; ctx.beginPath(); ctx.moveTo(-5, len - 10); ctx.lineTo(5, len - 10); ctx.lineTo(0, len + 14); ctx.fill(); break;
      case 'daggers': ctx.fillStyle = '#c8c0ff'; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(2, 4); ctx.lineTo(0, 4 + len); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(-2, -3, 4, 7); break;
      case 'scythe': ctx.fillStyle = '#2a2030'; ctx.fillRect(-1.5, -10, 3, len + 10); ctx.strokeStyle = '#d0c8ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-14, len - 2, 18, -.3, Math.PI * .9); ctx.stroke(); break;
      case 'crossbow': ctx.fillStyle = '#3a2a3a'; ctx.fillRect(-3, 0, 6, len); ctx.strokeStyle = '#b8a8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, len - 6, 14, Math.PI * .1, Math.PI * .9); ctx.stroke(); break;
      case 'staff': ctx.fillStyle = '#3a4a2a'; ctx.fillRect(-2, -20, 4, len + 10); ctx.fillStyle = '#b8e060'; ctx.beginPath(); ctx.arc(0, len - 8, 7, 0, TAU); ctx.fill(); break;
      case 'censer': ctx.strokeStyle = '#c8b070'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len - 10); ctx.stroke(); ctx.fillStyle = '#b8903a'; ctx.beginPath(); ctx.arc(0, len - 4, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(184,255,96,.6)'; ctx.beginPath(); ctx.arc(0, len + 4, 6 + Math.sin(R.t * 8) * 2, 0, TAU); ctx.fill(); break;
      case 'flask': ctx.fillStyle = 'rgba(184,255,96,.85)'; ctx.beginPath(); ctx.arc(0, 10, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ddd'; ctx.fillRect(-2, 0, 4, 5); break;
      case 'sickles': ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(8, len - 6, 12, Math.PI * .6, Math.PI * 1.6); ctx.stroke(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -2, 4, len - 8); break;
      case 'whip': case 'goldwhip': ctx.strokeStyle = shape === 'whip' && col === '#ffd772' ? '#ffd772' : col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 1; i < 8; i++) ctx.lineTo(Math.sin(R.t * 10 + i) * 3, i * 6); ctx.stroke(); break;
      case 'claws': ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 3, 4); ctx.lineTo(i * 5, 4 + len); ctx.stroke(); } break;
      case 'wings': break;
    }
    ctx.restore();
  };

  // character drawer (used for heroes; scale for bosses/children)
  R.humanoid = function (ctx, e, pal, o) {
    o = o || {};
    const P = poseOf(e, R.w);
    const f = e.face || 1, s = o.scale || 1;
    ctx.save(); ctx.translate(e.x, e.y + P.crouch); ctx.scale(f * s, s);
    const hipY = -30 - P.bob * .3 + (o.hipAdj || 0);
    // back cape
    if (o.cape !== false) {
      const sx = e.x - f * 6 * s, sy = e.y + (hipY - 20) * s;
      const ch = chain(e.id + ':cape', sx, sy, 7, 6 * s, -f * (.6 + Math.abs(e.vx) / 300) + Math.sin(R.t * 2 + e.x * .01) * .15);
      ctx.restore(); ctx.save();
      ctx.fillStyle = pal.cape; ctx.globalAlpha = .95; ctx.beginPath(); ctx.moveTo(sx + f * 10 * s, sy);
      for (const p of ch) ctx.lineTo(p.x, p.y);
      for (let i = ch.length - 1; i >= 0; i--) ctx.lineTo(ch[i].x + f * (5 + i * 1.6) * s, ch[i].y);
      ctx.fill(); ctx.restore(); ctx.save(); ctx.translate(e.x, e.y + P.crouch); ctx.scale(f * s, s);
    }
    ctx.rotate(P.lean * .35);
    const dark = o.dark || '#00000033';
    // back limbs
    limb(ctx, -2, hipY, P.thB, 15, P.shB, 15, 7, 6, shade(pal.armor, -.35));
    limb(ctx, -3, hipY - 20, P.arB, 11, P.elB, 10, 5, 4, shade(pal.armor, -.3));
    // torso
    ctx.fillStyle = pal.armor; ctx.beginPath(); ctx.moveTo(-7, hipY + 2); ctx.lineTo(7, hipY + 2); ctx.lineTo(9, hipY - 22); ctx.lineTo(-8, hipY - 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = pal.trim; ctx.fillRect(-8, hipY - 3, 16, 3); ctx.fillRect(-1, hipY - 21, 3, 18);
    if (e.form === 'wrath') { ctx.fillStyle = 'rgba(180,40,60,.55)'; ctx.fillRect(-8, hipY - 22, 17, 24); }
    // head
    const hx = 1, hy = hipY - 30;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(P.head);
    ctx.fillStyle = pal.skin; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 7.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = pal.hair; ctx.beginPath(); ctx.arc(-1, -2, 7.2, Math.PI * .9, Math.PI * 2.05); ctx.fill();
    ctx.fillStyle = e.form === 'wrath' ? '#ff3a3a' : (pal.eye || '#2a2a3a'); ctx.fillRect(3, -1, 2, 2);
    if (e.form === 'wrath' && e.cid === 'zero') { ctx.strokeStyle = '#2a1018'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -6); ctx.quadraticCurveTo(-8, -14, -2, -16); ctx.stroke(); }
    ctx.restore();
    // hair strands (verlet)
    if (o.hair) {
      ctx.restore(); ctx.save();
      const ax = e.x + (hx - 4) * f * s, ay = e.y + P.crouch + (hy - 4) * s;
      const ch = chain(e.id + ':hair', ax, ay, 5, 4 * s, -f * (.4 + Math.abs(e.vx) / 400));
      ctx.strokeStyle = pal.hair; ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ch[0].x, ch[0].y); for (const p of ch) ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.translate(e.x, e.y + P.crouch); ctx.scale(f * s, s); ctx.rotate(P.lean * .35);
    }
    // front leg
    limb(ctx, 2, hipY, P.thF, 15, P.shF, 15, 7, 6, shade(pal.armor, -.1));
    // front arm + weapon
    const [ , , ex, ey] = limb(ctx, 3, hipY - 20, P.arF, 11, P.elF, 10, 5, 4, pal.armor);
    ctx.fillStyle = pal.skin; ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, TAU); ctx.fill();
    if (o.weapon) { ctx.save(); ctx.translate(ex, ey); R.weapon(ctx, o.weapon.shape, o.weapon.len, o.weapon.col || '#fff', o.weapon.glow || pal.glow, -(P.arF + P.elF) + (e.atk ? 0 : -.3) + P.wep * 0); ctx.restore(); }
    ctx.restore();
  };
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255; if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; } else { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } return `rgb(${r | 0},${g | 0},${b | 0})`; }
  R.shade = shade;

  // rim light: draw an entity into an offscreen, extract edge on light side, add back
  R.withRim = function (ctx, e, drawFn, rimCol, lightDir) {
    if (PZ.Settings.gfx === 'low') { drawFn(ctx); return; }
    const S = 256, X = R.rimX, X2 = R.rimX2, ox = e.x - S / 2, oy = e.y - S * .7;
    X.setTransform(1, 0, 0, 1, 0, 0); X.clearRect(0, 0, S, S); X.save(); X.translate(-ox, -oy); drawFn(X); X.restore();
    X2.setTransform(1, 0, 0, 1, 0, 0); X2.globalCompositeOperation = 'source-over'; X2.clearRect(0, 0, S, S); X2.drawImage(R.rimC, 0, 0);
    X2.globalCompositeOperation = 'source-in'; X2.fillStyle = rimCol; X2.fillRect(0, 0, S, S);
    X2.globalCompositeOperation = 'destination-out'; X2.drawImage(R.rimC, -lightDir[0] * 2.5, -lightDir[1] * 2.5);
    X2.globalCompositeOperation = 'source-over';
    ctx.drawImage(R.rimC, ox, oy);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(R.rimC2, ox, oy); ctx.restore();
  };

  // ---------- heroes ----------
  R.hero = function (ctx, p, w) {
    const d = p.def0, pal = d.pal, wep = PZ.weaponOf(p);
    if (p.iframes > 0 && !p.dashT && Math.floor(R.t * 30) % 2 && !p.atk) ctx.globalAlpha = .55;
    if (p.buffs.veil > 0) ctx.globalAlpha = .25;
    // ground shadow
    const g = w.surf(p.x); if (g !== Infinity) { ctx.fillStyle = 'rgba(40,20,0,.22)'; ctx.beginPath(); ctx.ellipse(p.x, g, 16 * Math.max(.3, 1 - (g - p.y) / 200), 4, 0, 0, TAU); ctx.fill(); }
    // aura by form
    if (p.form && PZ.Settings.gfx !== 'low') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(p.x, p.y - 32, 4, p.x, p.y - 32, 46); gr.addColorStop(0, p.form === 'light' ? 'rgba(255,240,180,.35)' : 'rgba(200,40,80,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(p.x - 50, p.y - 82, 100, 100); ctx.restore(); }
    if (p.immune > 0) { ctx.strokeStyle = 'rgba(255,160,80,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y - 32, 40, 0, TAU); ctx.stroke(); }
    if (p.parry > 0) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x + p.face * 16, p.y - 34, 26, -1.2, 1.2); ctx.stroke(); }
    if (p.cid === 'vesper') R.wings(ctx, p.x - p.face * 4, p.y - 50, p.face, 3, p.flying ? Math.sin(R.t * 14) : Math.sin(R.t * 2) * .3, .8);
    const wcol = wep.elem && PZ.ELEMS[wep.elem];
    const fn = c => R.humanoid(c, p, pal, { weapon: { shape: wep.shape, len: wep.len * .62, col: wep.shape === 'whip' && wep.boss ? '#ffd772' : '#eee', glow: p.form === 'wrath' ? '#ff3a5a' : wcol }, hair: p.cid === 'zero' || p.cid === 'sable' || p.cid === 'mirae' || p.cid === 'vesper' });
    R.withRim(ctx, p, fn, w.theme === 'garden' ? 'rgba(255,240,200,.9)' : 'rgba(255,250,220,.95)', [-.7, -.7]);
    ctx.globalAlpha = 1;
    if (p.buffs.twin > 0) { ctx.save(); ctx.globalAlpha = .35; ctx.translate(-p.face * 16, -4); R.humanoid(ctx, p, { skin: '#9ad', armor: '#447', trim: '#88f', cape: '#224', hair: '#aaf', glow: '#88f' }, { cape: false, weapon: { shape: wep.shape, len: wep.len * .62, col: '#aaf', glow: '#88f' } }); ctx.restore(); }
  };

  R.wings = function (ctx, x, y, f, n, flap, sc, burnt) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f * (sc || 1), sc || 1);
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < n; i++) {
        const a = -.5 - i * .45 + flap * .25 - side * .18, L = 60 - i * 8;
        ctx.save(); ctx.rotate(a + Math.PI); ctx.scale(side ? .8 : 1, 1);
        const isB = burnt && burnt[i];
        for (let k = 0; k < 7; k++) {
          ctx.fillStyle = isB ? (k % 2 ? '#3a2a24' : '#2a1a16') : (k % 2 ? 'rgba(255,252,240,.95)' : 'rgba(250,240,220,.9)');
          ctx.beginPath(); ctx.ellipse(k * L / 8 + 6, 4 + k * 2.4, 5, 12 + k * 1.6, .3, 0, TAU); ctx.fill();
        }
        if (isB) { ctx.strokeStyle = '#d8c8b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, 10); ctx.stroke(); }
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // ---------- enemies ----------
  R.enemy = function (ctx, e, w) {
    const a = e.dead ? Math.max(0, 1 - e.deathT / .9) : 1;
    ctx.save(); ctx.globalAlpha = a;
    const g = w.surf(e.x);
    if (g !== Infinity && e.type !== 'knight' && e.type !== 'forbidden') { ctx.fillStyle = 'rgba(40,20,0,.18)'; ctx.beginPath(); ctx.ellipse(e.x, g, e.w * .8, 4, 0, 0, TAU); ctx.fill(); }
    const fl = e.hitFlash > 0;
    const tele = e.tele || 0;
    if (tele > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,80,60,${.15 + tele * .4})`; ctx.beginPath(); ctx.arc(e.x, e.y - e.h / 2, e.w + 10 + tele * 14, 0, TAU); ctx.fill(); ctx.restore(); }
    const D = R.ENEMY_DRAW[e.type] || R.ENEMY_DRAW.generic;
    D(ctx, e, w, fl);
    if (e.elite) { ctx.strokeStyle = 'rgba(255,200,60,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - e.h - 8, 12, 4, 0, 0, TAU); ctx.stroke(); }
    if (e.team === 'player' && e.kind === 'enemy' && !e.boss) { ctx.fillStyle = '#7aff9a'; ctx.beginPath(); ctx.arc(e.x, e.y - e.h - 12, 3, 0, TAU); ctx.fill(); }
    if (e.marks) for (let i = 0; i < e.marks; i++) { ctx.fillStyle = '#b8a8ff'; ctx.fillRect(e.x - 10 + i * 5, e.y - e.h - 18, 3, 6); }
    if (e.poison > 0) { ctx.fillStyle = 'rgba(184,255,96,.7)'; ctx.beginPath(); ctx.arc(e.x + Math.sin(R.t * 5) * 8, e.y - e.h * .7 - (R.t * 30 % 20), 2, 0, TAU); ctx.fill(); }
    // small hp bar for damaged non-boss
    if (!e.boss && !e.dead && e.hp < e.maxHp && !e.dummy) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(e.x - 16, e.y - e.h - 10, 32, 4); ctx.fillStyle = e.team === 'player' ? '#7aff9a' : '#ff6a5a'; ctx.fillRect(e.x - 16, e.y - e.h - 10, 32 * e.hp / e.maxHp, 4); }
    ctx.restore();
  };
  const flashOr = (fl, c) => fl ? '#ffffff' : c;
  R.ENEMY_DRAW = {
    generic(ctx, e, w, fl) { ctx.fillStyle = flashOr(fl, e.color); ctx.fillRect(e.x - e.w / 2, e.y - e.h, e.w, e.h); },
    sleepless(ctx, e, w, fl) {
      const flap = Math.sin(R.t * 12 + e.id);
      R.wings(ctx, e.x, e.y - e.h * .7, e.face, 1, flap, .55);
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
      ctx.fillStyle = flashOr(fl, '#fff4d8'); ctx.beginPath(); ctx.moveTo(-8, -e.h * .75); ctx.lineTo(8, -e.h * .75); ctx.lineTo(13, 0); ctx.lineTo(-13, 0); ctx.fill();
      ctx.fillStyle = '#f0dcc0'; ctx.beginPath(); ctx.arc(0, -e.h * .85, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(3, -e.h * .86, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#c02020'; ctx.beginPath(); ctx.arc(3.5, -e.h * .86, 1.4, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd772'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -e.h - 4, 8, 2.5, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    },
    lantern(ctx, e, w, fl) {
      const fuse = e.state === 'fuse'; const fk = .8 + Math.sin(R.t * (fuse ? 40 : 9) + e.id) * .2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x, e.y - 14, 2, e.x, e.y - 14, 40 * fk + (fuse ? 30 * e.tele : 0)); gr.addColorStop(0, 'rgba(255,220,120,.9)'); gr.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = gr; ctx.fillRect(e.x - 80, e.y - 90, 160, 160); ctx.restore();
      ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x, e.y - 26); ctx.lineTo(e.x, e.y - 60); ctx.stroke();
      ctx.fillStyle = flashOr(fl, '#6a4a24'); ctx.fillRect(e.x - 9, e.y - 28, 18, 4); ctx.fillRect(e.x - 9, e.y - 2, 18, 4);
      ctx.fillStyle = fuse ? '#ffffff' : '#ffcf5a'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 13, 7 * fk, 10 * fk, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#6a4a24'; for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(e.x + dx, e.y - 26); ctx.lineTo(e.x + dx * .8, e.y - 2); ctx.stroke(); }
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(e.x - 3, e.y - 16, 2, 2); ctx.fillRect(e.x + 2, e.y - 16, 2, 2);
    },
    forbidden(ctx, e, w, fl) {
      ctx.save(); ctx.translate(e.x, e.y);
      for (let i = 0; i < 9; i++) { const yy = -e.h * (i / 9), r = 9 + Math.sin(i * 1.3 + R.t * 3) * 3 + (i < 3 ? 2 : 0); ctx.fillStyle = fl ? `rgba(255,255,255,.8)` : `rgba(14,10,20,${.75 - i * .03})`; ctx.beginPath(); ctx.arc(Math.sin(R.t * 2 + i) * 2, yy - 4, r, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(20,14,28,.4)'; ctx.beginPath(); ctx.arc(Math.sin(R.t * 3 + i * 2) * 14, -e.h * .5 - (R.t * 40 + i * 20) % 50, 3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(e.face * 2 - 4, -e.h + 10, 3, 3); ctx.fillRect(e.face * 2 + 2, -e.h + 10, 3, 3);
      if (e.state === 'windup') { ctx.strokeStyle = 'rgba(160,120,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.face * 30, -e.h / 2, 26, -1, 1); ctx.stroke(); }
      ctx.restore();
    },
    choir(ctx, e, w, fl) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.face, 1);
      ctx.fillStyle = flashOr(fl, '#e8dcc0'); ctx.beginPath(); ctx.moveTo(-6, -e.h); ctx.quadraticCurveTo(0, -e.h - 8, 6, -e.h); ctx.lineTo(14, 0); ctx.lineTo(-14, 0); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(2, -e.h + 10, 4, 3 + (e.state === 'windup' ? 3 : Math.abs(Math.sin(R.t * 4)) * 2), 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.fillRect(-10, -e.h * .55, 20, 3);
      if (e.state === 'windup') { ctx.strokeStyle = `rgba(255,240,180,${e.tele})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -e.h * .7, 20 + e.tele * 20, 0, TAU); ctx.stroke(); }
      ctx.restore();
    },
    soldier(ctx, e, w, fl) { ctx.save(); ctx.globalAlpha *= .7; R.humanoid(ctx, Object.assign(e, { anim: e.anim || { t: 0 } }), { skin: '#ffb07a', armor: '#c85a2a', trim: '#ffcf6a', cape: '#7a2a10', hair: '#3a1a0a', glow: '#ff8a4a' }, { weapon: { shape: 'spear', len: 50, col: '#ffd0a0', glow: '#ff8a4a' } }); ctx.restore(); },
    dummy(ctx, e, w, fl) {
      ctx.save(); ctx.translate(e.x, e.y); const wob = e.hitFlash > 0 ? Math.sin(R.t * 50) * .15 : 0; ctx.rotate(wob);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-3, -64, 6, 64); ctx.fillRect(-24, -48, 48, 5);
      ctx.fillStyle = flashOr(fl, '#d8b878'); ctx.beginPath(); ctx.ellipse(0, -40, 13, 20, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -66, 10, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#8a6a3a'; ctx.beginPath(); ctx.moveTo(-4, -68); ctx.lineTo(4, -64); ctx.moveTo(4, -68); ctx.lineTo(-4, -64); ctx.stroke(); ctx.restore();
    },
    knight(ctx, e, w, fl) {
      if (e.state === 'blink') ctx.globalAlpha *= .2;
      const pal = { skin: '#d8d0c0', armor: fl ? '#ffffff' : '#d8d0b8', trim: '#c8a040', cape: '#f0e8d0', hair: '#e8e0c8', glow: '#ffe7a0', eye: '#ffef9a' };
      e.anim = e.anim || { t: 0 }; e.anim.t += PZ.DT;
      R.humanoid(ctx, Object.assign(e, { atk: e.state === 'combo' ? { t: (1 - (e.tele || 0)) * .4, hit: { t: .4, at: .3, kind: 'melee' }, idx: e.combo || 0 } : null }), pal, { scale: 1.62, weapon: { shape: 'greatsword', len: 46, col: '#fff', glow: '#ffe7a0' } });
      // shield
      ctx.save(); ctx.translate(e.x + e.face * 26, e.y - 64); ctx.scale(e.face, 1);
      ctx.fillStyle = fl ? '#fff' : '#e8e0c8'; ctx.beginPath(); ctx.moveTo(-8, -30); ctx.lineTo(10, -30); ctx.lineTo(10, 20); ctx.lineTo(1, 38); ctx.lineTo(-8, 20); ctx.fill();
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#ffd772'; ctx.beginPath(); ctx.arc(1, 0, 7, 0, TAU); ctx.fill();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + R.t; ctx.fillRect(1 + Math.cos(a) * 10 - 1, Math.sin(a) * 10 - 1, 2, 2); }
      ctx.restore();
      // plume
      ctx.fillStyle = '#c83a2a'; ctx.beginPath(); ctx.ellipse(e.x - e.face * 4, e.y - 112, 5, 14, -e.face * .6, 0, TAU); ctx.fill();
    },
    seraphina(ctx, e, w, fl) { R.seraphina(ctx, e, w, fl); }
  };

  R.seraphina = function (ctx, e, w, fl) {
    const tired = e.state === 'tired' || e.state === 'defeated';
    const flap = tired ? -.6 : Math.sin(R.t * 3) * .5;
    // halo glow
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(e.x, e.y - 90, 10, e.x, e.y - 90, 200); gr.addColorStop(0, 'rgba(255,240,200,.22)'); gr.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = gr; ctx.fillRect(e.x - 200, e.y - 290, 400, 400); ctx.restore();
    R.wings(ctx, e.x, e.y - 92, 1, 3, flap, 1.25);
    R.wings(ctx, e.x, e.y - 92, -1, 3, flap, 1.25);
    ctx.save(); ctx.translate(e.x, e.y);
    // gown
    const sway = Math.sin(R.t * 2) * 6;
    const gg = ctx.createLinearGradient(0, -100, 0, 0); gg.addColorStop(0, fl ? '#fff' : '#fffaf0'); gg.addColorStop(1, fl ? '#fff' : '#f0d8a0');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(-12, -96); ctx.lineTo(12, -96); ctx.quadraticCurveTo(26, -40, 34 + sway, 0); ctx.lineTo(-34 + sway, 0); ctx.quadraticCurveTo(-26, -40, -12, -96); ctx.fill();
    ctx.strokeStyle = '#d8b060'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -70); ctx.quadraticCurveTo(0, -64, 14, -70); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-26 + i * 13 + sway * .5, -4); ctx.lineTo(-20 + i * 11, -60); ctx.strokeStyle = 'rgba(200,160,80,.35)'; ctx.stroke(); }
    // arms
    ctx.strokeStyle = '#f0e0cc'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const armA = e.state === 'radiance' ? -2.6 : tired ? .4 : -.4 + Math.sin(R.t) * .2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -92); ctx.lineTo(s * (10 + Math.sin(-armA) * 18), -92 + Math.cos(armA) * 18 * (armA < -1 ? -1 : 1)); ctx.lineTo(s * (12 + Math.sin(-armA) * 30), -92 + Math.cos(armA) * 30 * (armA < -1 ? -1 : 1)); ctx.stroke(); }
    // head + hair
    ctx.fillStyle = '#fff6e0'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(-9 + i * 2.2, -108); ctx.quadraticCurveTo(-14 + i * 3 + Math.sin(R.t * 2 + i) * 4, -80, -16 + i * 4 + Math.sin(R.t * 1.5 + i) * 6, -50); ctx.lineWidth = 3; ctx.strokeStyle = '#fff2d0'; ctx.stroke(); }
    ctx.fillStyle = '#f6e6d2'; ctx.beginPath(); ctx.ellipse(0, -108, 9, 11, 0, 0, TAU); ctx.fill();
    // stitched eyes
    ctx.strokeStyle = '#d8a020'; ctx.lineWidth = 1.2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 2, -109); ctx.lineTo(s * 7, -109); ctx.stroke(); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * (2.5 + k * 1.8), -111); ctx.lineTo(s * (3.5 + k * 1.8), -107); ctx.stroke(); } }
    if (tired) { ctx.fillStyle = 'rgba(255,220,120,.9)'; ctx.beginPath(); ctx.arc(-4, -106 + (R.t * 20 % 12), 1, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#c88a7a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-2.5, -101); ctx.quadraticCurveTo(0, tired ? -102 : -100, 2.5, -101); ctx.stroke();
    // halo
    ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -126, 16, 4, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  };

  R.nyx = function (ctx, n, w) {
    ctx.save(); ctx.globalAlpha = n.mode === 'hide' ? .4 : 1;
    const s = .62 + n.growth * .03;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, 34); gr.addColorStop(0, 'rgba(200,230,255,.6)'); gr.addColorStop(1, 'rgba(200,230,255,0)'); ctx.fillStyle = gr; ctx.fillRect(n.x - 40, n.y - 40, 80, 80); ctx.restore();
    ctx.translate(n.x, n.y + 14); ctx.scale(n.face * s, s);
    ctx.fillStyle = '#e8f2ff'; ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(6, -24); ctx.lineTo(11, 4); ctx.lineTo(-11, 4); ctx.fill();
    ctx.fillStyle = '#f6e8dc'; ctx.beginPath(); ctx.arc(0, -31, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#bcd8ff'; ctx.beginPath(); ctx.arc(-1, -33, 7.5, Math.PI * .85, Math.PI * 2.1); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = '#bcd8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, -32); ctx.quadraticCurveTo(-10 - i, -22, -8 + Math.sin(R.t * 3 + i) * 3, -12 - i * 2); ctx.stroke(); }
    ctx.fillStyle = '#2a3a5a'; ctx.fillRect(2, -32, 2, 2);
    ctx.fillStyle = '#fff6b0'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU - Math.PI / 2, r = i % 2 ? 2 : 5; ctx.lineTo(10 + Math.cos(a) * r, -42 + Math.sin(a) * r + Math.sin(R.t * 3) * 2); } ctx.fill();
    ctx.restore();
    if (n.hint) { ctx.strokeStyle = 'rgba(200,230,255,.6)'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.hint.x, n.hint.y); ctx.stroke(); ctx.setLineDash([]); }
  };

  // ---------- projectiles, zones, hazards, pickups ----------
  R.proj = function (ctx, p) {
    const col = PZ.ELEMS[p.elem] || '#fff';
    ctx.save(); ctx.translate(p.x, p.y);
    const a = Math.atan2(p.vy, p.vx);
    switch (p.look) {
      case 'feather': ctx.rotate(a); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 3, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#d8b060'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke(); break;
      case 'wave': case 'rift': ctx.globalCompositeOperation = 'lighter'; { const gr = ctx.createLinearGradient(0, -30, 0, 10); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, p.look === 'rift' ? 'rgba(255,120,40,.9)' : rgba(col.length === 7 ? col : '#ffffff', .85)); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-18, 10); ctx.quadraticCurveTo(0, -34 - Math.sin(R.t * 30) * 6, 18, 10); ctx.fill(); } break;
      case 'ring': ctx.strokeStyle = 'rgba(255,240,180,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.stroke(); break;
      case 'moth': ctx.fillStyle = '#c8ff70'; const fl = Math.sin(R.t * 30) * 4; ctx.beginPath(); ctx.ellipse(-3, 0, 4, 3 + fl * .4, 0, 0, TAU); ctx.ellipse(3, 0, 4, 3 - fl * .4, 0, 0, TAU); ctx.fill(); break;
      case 'spear': case 'ray': ctx.rotate(a); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,250,210,.95)'; ctx.fillRect(-22, -2, 44, 4); ctx.fillStyle = 'rgba(255,220,120,.4)'; ctx.fillRect(-30, -5, 60, 10); break;
      case 'crossbow': ctx.rotate(a); ctx.fillStyle = '#d0c8ff'; ctx.fillRect(-12, -1, 24, 2); ctx.beginPath(); ctx.moveTo(12, -3); ctx.lineTo(17, 0); ctx.lineTo(12, 3); ctx.fill(); break;
      case 'flask': ctx.rotate(p.t * 12); ctx.fillStyle = 'rgba(184,255,96,.9)'; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, TAU); ctx.fill(); ctx.fillStyle = '#ddd'; ctx.fillRect(-2, -p.size - 4, 4, 5); break;
      default: ctx.globalCompositeOperation = 'lighter'; { const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.2); gr.addColorStop(0, '#fff'); gr.addColorStop(.4, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, p.size * 2.2, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  };
  R.zone = function (ctx, z) {
    const k = Math.min(1, z.life / .5), col = PZ.ELEMS[z.elem] || '#fff';
    ctx.save(); ctx.globalAlpha = .55 * k;
    if (z.rect) { ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(0, z.rect.y0, 0, z.rect.y1); gr.addColorStop(0, 'rgba(255,250,200,0)'); gr.addColorStop(1, 'rgba(255,240,170,.9)'); ctx.fillStyle = gr; ctx.fillRect(z.rect.x0, z.rect.y0, z.rect.x1 - z.rect.x0, z.rect.y1 - z.rect.y0); }
    else if (z.look === 'firering') { ctx.strokeStyle = '#ff7a3a'; ctx.lineWidth = 8; ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (.9 + Math.sin(R.t * 20) * .05), 0, TAU); ctx.stroke(); }
    else { for (let i = 0; i < 7; i++) { const a = i * 1.7 + z.t * .6, rr = z.r * (.4 + .5 * PZ.hash(i, z.r | 0)); ctx.fillStyle = rgba(col, .35); ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * rr * .6, z.y + Math.sin(a) * rr * .25, rr * .6, 0, TAU); ctx.fill(); } }
    ctx.restore();
  };
  R.hazards = function (ctx, w) {
    for (const h of w.hazards) {
      if (h.kind === 'radiance') {
        const k = Math.min(1, h.t / h.tele);
        const srcs = [{ lx: h.lx, ly: h.ly, real: true }].concat(h.decoys.map(d => ({ lx: d.lx, ly: d.ly, real: false })));
        if (!h.fired) {
          // show light sources + shadows on the ground (fake ones flicker)
          for (const s of srcs) {
            const flick = s.real ? 1 : (.55 + .45 * Math.sin(R.t * 23 + s.lx));
            ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(s.lx, s.ly, 2, s.lx, s.ly, 30 + 70 * k); gr.addColorStop(0, `rgba(255,255,240,${.9 * flick})`); gr.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.lx, s.ly, 30 + 70 * k, 0, TAU); ctx.fill();
            ctx.strokeStyle = s.real ? `rgba(255,215,90,${.5 + .5 * k})` : `rgba(255,120,120,${.6 * flick})`; ctx.lineWidth = s.real ? 3 : 2; ctx.beginPath(); ctx.arc(s.lx, s.ly, 18 + 6 * Math.sin(R.t * 6), 0, TAU); ctx.stroke(); ctx.restore();
            ctx.save(); ctx.globalAlpha = (s.real ? .35 : .2 * flick) + .25 * k;
            for (const pl of w.terrain.pillars) R.pillarShadow(ctx, s.lx, s.ly, pl);
            ctx.restore();
          }
          // whole room brightening
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,245,210,${k * .1})`; ctx.fillRect(0, 0, 960, 540); ctx.restore();
        } else {
          const fk = 1 - (h.t - h.tele) / .7;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,252,235,${.6 * fk})`; ctx.fillRect(0, 0, 960, 540); ctx.restore();
          ctx.save(); ctx.globalAlpha = .85 * fk; for (const pl of w.terrain.pillars) R.pillarShadow(ctx, h.lx, h.ly, pl); ctx.restore();
        }
      } else if (h.kind === 'skypillar') {
        const k = Math.min(1, h.t / h.tele);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        if (!h.fired) { ctx.fillStyle = `rgba(255,240,180,${.15 + .35 * k})`; ctx.fillRect(h.x - 2 - 40 * (1 - k), 0, 4 + 80 * (1 - k), 460); }
        else { const fk = 1 - (h.t - h.tele) / .5; const gr = ctx.createLinearGradient(h.x - 46, 0, h.x + 46, 0); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(.5, `rgba(255,255,240,${fk})`); gr.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = gr; ctx.fillRect(h.x - 46, 0, 92, 460); }
        ctx.restore();
      }
    }
  };
  R.pillarShadow = function (ctx, lx, ly, pl) {
    const G = 460, x0 = pl.x - pl.w / 2, x1 = pl.x + pl.w / 2;
    const proj = ex => pl.top <= ly ? (ex < lx ? -2000 : 3000) : lx + (ex - lx) * (G - ly) / (pl.top - ly);
    ctx.fillStyle = 'rgba(30,20,50,1)';
    ctx.beginPath(); ctx.moveTo(x0, pl.top); ctx.lineTo(x1, pl.top); ctx.lineTo(proj(x1), G); ctx.lineTo(proj(x0), G); ctx.closePath();
    ctx.globalCompositeOperation = 'multiply'; ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const a = Math.min(x0, proj(x0), proj(x1)), b = Math.max(x1, proj(x0), proj(x1));
    ctx.fillStyle = 'rgba(40,30,80,.55)'; ctx.fillRect(Math.max(0, a), G - 3, Math.min(960, b) - Math.max(0, a), 6);
  };
  R.pickup = function (ctx, k) {
    const bob = Math.sin(R.t * 3 + k.x) * 3;
    ctx.save(); ctx.translate(k.x, k.y + bob);
    if (k.kind === 'seed') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(140,255,160,.8)'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 6, R.t * 2, 0, TAU); ctx.fill(); }
    else if (k.kind === 'orb') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,120,.9)'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); }
    else if (k.kind === 'page') { ctx.rotate(Math.sin(R.t * 2) * .2); ctx.fillStyle = '#f4e8c8'; ctx.fillRect(-9, -12, 18, 24); ctx.strokeStyle = '#a8803a'; ctx.strokeRect(-9, -12, 18, 24); ctx.fillStyle = '#7a5a2a'; for (let i = 0; i < 5; i++) ctx.fillRect(-6, -8 + i * 4, 12 - (i % 2) * 4, 1.5); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,230,150,.25)'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill(); }
    else if (k.kind === 'shard' || k.kind === 'relic') { ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); gr.addColorStop(0, 'rgba(220,240,255,.9)'); gr.addColorStop(1, 'rgba(160,200,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill(); ctx.rotate(R.t); ctx.fillStyle = k.kind === 'relic' ? '#ffd772' : '#eaf6ff'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, 0); ctx.lineTo(0, 10); ctx.lineTo(-6, 0); ctx.fill(); }
    ctx.restore();
  };

  // ---------- hub stations ----------
  R.station = function (ctx, s, w) {
    const g = w.surf(s.x);
    ctx.save(); ctx.translate(s.x, g);
    switch (s.id) {
      case 'altar': ctx.fillStyle = '#8a8070'; ctx.fillRect(-30, -24, 60, 24); ctx.fillStyle = '#a89c88'; ctx.fillRect(-36, -30, 72, 8);
        ['#e8d9a8', '#8a3a2a', '#2a2a38', '#3c5a2a', '#3a2a1a'].forEach((c, i) => { ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-48 + i * 24, -110, 3, 80); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-45 + i * 24, -108); ctx.lineTo(-29 + i * 24, -108 + Math.sin(R.t * 2 + i) * 2); ctx.lineTo(-29 + i * 24, -70); ctx.lineTo(-37 + i * 24, -78); ctx.lineTo(-45 + i * 24, -70); ctx.fill(); });
        break;
      case 'tree': { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, -110, 10, 0, -110, 120); gr.addColorStop(0, 'rgba(255,240,170,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(-130, -240, 260, 240); ctx.restore(); R.tree(ctx, 0, 0, 170, PZ.rng(5)); for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,240,170,.9)'; ctx.beginPath(); ctx.arc(Math.sin(i * 2.3) * 60, -110 + Math.cos(i * 1.7) * 40 + Math.sin(R.t + i) * 4, 2.5, 0, TAU); ctx.fill(); } break; }
      case 'forge': ctx.fillStyle = '#4a4040'; ctx.fillRect(-40, -60, 80, 60); ctx.fillStyle = '#2a2020'; ctx.fillRect(-26, -46, 52, 30); { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fk = .8 + Math.sin(R.t * 13) * .2; const gr = ctx.createRadialGradient(0, -30, 2, 0, -30, 60 * fk); gr.addColorStop(0, 'rgba(255,160,60,.9)'); gr.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = gr; ctx.fillRect(-70, -100, 140, 120); ctx.restore(); } ctx.fillStyle = '#5a5a60'; ctx.fillRect(48, -22, 34, 10); ctx.fillRect(58, -12, 14, 12); break;
      case 'codex': ctx.fillStyle = '#5a3a20'; ctx.fillRect(-4, -46, 8, 46); ctx.fillStyle = '#7a5030'; ctx.beginPath(); ctx.moveTo(-22, -46); ctx.lineTo(22, -46); ctx.lineTo(16, -56); ctx.lineTo(-16, -56); ctx.fill(); ctx.fillStyle = '#f4e8c8'; ctx.fillRect(-18, -62, 17, 10); ctx.fillRect(1, -62, 17, 10); break;
      case 'portal': {
        ctx.fillStyle = '#8a8070'; ctx.fillRect(-70, -170, 18, 170); ctx.fillRect(52, -170, 18, 170); ctx.beginPath(); ctx.arc(0, -170, 70, Math.PI, 0); ctx.arc(0, -170, 52, 0, Math.PI, true); ctx.fill();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(0, -220, 0, 0); gr.addColorStop(0, 'rgba(255,240,190,.5)'); gr.addColorStop(1, 'rgba(160,200,255,.15)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(-52, -170); ctx.arc(0, -170, 52, Math.PI, 0); ctx.lineTo(52, 0); ctx.fill(); ctx.restore();
        PZ.CHAPTERS.forEach((c, i) => { const a = Math.PI + (i + .5) / 7 * Math.PI; const lit = c.ready; ctx.fillStyle = lit ? c.color : '#3a3a3a'; ctx.beginPath(); ctx.arc(Math.cos(a) * 61, -170 + Math.sin(a) * 61, 6, 0, TAU); ctx.fill(); });
        break;
      }
      case 'statue': {
        const sp = w.save.spared.seraphina, kl = w.save.killed.seraphina; if (!sp && !kl) break;
        ctx.fillStyle = '#9a9488'; ctx.fillRect(-26, -20, 52, 20);
        if (sp) { ctx.save(); ctx.translate(0, -20); ctx.scale(.55, .55); ctx.fillStyle = '#d8d2c4'; ctx.beginPath(); ctx.moveTo(-12, -96); ctx.lineTo(12, -96); ctx.lineTo(30, 0); ctx.lineTo(-30, 0); ctx.fill(); ctx.beginPath(); ctx.arc(0, -108, 10, 0, TAU); ctx.fill(); for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s2 * 30, -90, 30, 12, s2 * .5, 0, TAU); ctx.fill(); } ctx.restore(); ctx.fillStyle = '#e8f0ff'; ctx.font = '11px Palatino Linotype, serif'; ctx.textAlign = 'center'; ctx.fillText(PZ.lang === 'vi' ? 'Seraphina đang ngủ' : 'Seraphina sleeps', 0, 14); }
        else { ctx.fillStyle = '#7a746a'; ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(-6, -46); ctx.lineTo(4, -30); ctx.lineTo(14, -52); ctx.lineTo(18, -20); ctx.fill(); }
        break;
      }
    }
    ctx.restore();
  };

  // ---------- particles ----------
  const P = R.parts;
  R.emit = function (o) { if (P.length > (PZ.Settings.gfx === 'low' ? 250 : PZ.Settings.gfx === 'med' ? 700 : 1400)) P.shift(); P.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, life: .6, t: 0, size: 3, col: '#fff', g: 0, drag: .96, kind: 'dot', add: true, rot: 0, vr: 0 }, o)); };
  R.burst = function (x, y, n, col, sp, o) { const m = PZ.Settings.gfx === 'low' ? .4 : 1; for (let i = 0; i < n * m; i++) { const a = Math.random() * TAU, v = sp * (.3 + Math.random()); R.emit(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .3 + Math.random() * .5, size: 1.5 + Math.random() * 3, col }, o)); } };
  R.updateParts = function (dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; }
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.floor != null && p.y > p.floor) { p.y = p.floor; p.vy *= -.4; p.vx *= .7; }
    }
  };
  R.drawParts = function (ctx) {
    for (const p of P) {
      const k = 1 - p.t / p.life;
      ctx.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      ctx.globalAlpha = Math.min(1, k * 1.4);
      ctx.fillStyle = p.col;
      if (p.kind === 'feather') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.ellipse(0, 0, p.size * 2, p.size * .6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      else if (p.kind === 'ring') { ctx.strokeStyle = p.col; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y, p.size + (1 - k) * p.grow, 0, TAU); ctx.stroke(); }
      else if (p.kind === 'streak') { ctx.strokeStyle = p.col; ctx.lineWidth = p.size * k; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); ctx.stroke(); }
      else if (p.kind === 'slash') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.face, 1); ctx.strokeStyle = p.col; ctx.lineCap = 'round';
        const sw = p.spin ? TAU : 2.2, a0 = p.spin ? 0 : -1.3 + (p.alt ? .4 : 0);
        for (let j = 0; j < 3; j++) { ctx.globalAlpha = k * (1 - j * .3); ctx.lineWidth = (p.size - j * 2) * k; ctx.beginPath(); ctx.arc(p.spin ? 0 : -p.r * .2, 0, p.r * (1 - j * .08), p.alt ? a0 + sw : a0, p.alt ? a0 : a0 + sw * Math.min(1, (p.t / p.life) * 3), p.alt); ctx.stroke(); }
        ctx.restore();
      }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.shrink === false ? 1 : k), 0, TAU); ctx.fill(); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  };

  // world events → visuals
  R.handleEvent = function (ev, w) {
    const sh = m => { if (PZ.Settings.shake) R.cam.shake = Math.max(R.cam.shake, m); };
    switch (ev.t) {
      case 'hit': {
        const col = PZ.ELEMS[ev.elem] || '#fff8e0';
        R.burst(ev.x, ev.y, ev.big ? 16 : 8, col, ev.big ? 380 : 240, { kind: 'streak', size: 2.5 });
        R.texts.push({ x: ev.x + (Math.random() - .5) * 16, y: ev.y - 10, t: 0, s: String(ev.amt), c: ev.team === 'player' ? '#ff6a6a' : ev.crit ? '#ffe27a' : '#ffffff', big: ev.crit || ev.big });
        if (ev.big) { R.chroma = Math.max(R.chroma, .25); sh(5); }
        break;
      }
      case 'slash': {
        const col = ev.form === 'wrath' ? '#ff4a6a' : (PZ.ELEMS[ev.elem] || '#fff');
        R.emit({ kind: 'slash', x: ev.x + ev.face * ev.r * .45, y: ev.y, face: ev.face, r: Math.max(26, ev.r * .55), size: 7, col: ev.ghost ? '#8a8aff' : col, life: .18, alt: ev.idx % 2 === 1, spin: ev.kind === 'spin', vx: 0, vy: 0, drag: 1 });
        break;
      }
      case 'eslash': R.emit({ kind: 'slash', x: ev.x + ev.face * 40, y: ev.y, face: ev.face, r: 60, size: 9, col: '#ffe7a0', life: .2, vx: 0, vy: 0, drag: 1 }); break;
      case 'death': R.burst(ev.x, ev.y, 26, ev.color || '#fff', 320, { g: 300 }); R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 6, grow: 60, col: '#fff3c0', life: .45 }); for (let i = 0; i < 6; i++) R.emit({ kind: 'feather', x: ev.x, y: ev.y, vx: (Math.random() - .5) * 200, vy: -Math.random() * 200, g: 120, drag: .97, life: 1.6, size: 3, col: 'rgba(255,250,235,.9)', add: false, vr: (Math.random() - .5) * 8 }); break;
      case 'parry': R.flash = .35; R.flashC = '#ffffff'; R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 10, grow: 90, col: '#ffffff', life: .4 }); R.burst(ev.x, ev.y, 24, '#fff6c8', 420); sh(6); break;
      case 'shake': sh(ev.m); break;
      case 'flash': R.flash = ev.a; R.flashC = '#fffaf0'; break;
      case 'dash': for (let i = 0; i < 8; i++) R.emit({ x: ev.x - ev.face * i * 8, y: ev.y - 30 + (Math.random() - .5) * 30, vx: -ev.face * 60, life: .3, size: 3, col: 'rgba(255,240,200,.6)' }); break;
      case 'jump': case 'walljump': case 'djump': R.burst(ev.x, ev.y, 8, 'rgba(240,220,180,.7)', 120, { add: false, g: 200 }); if (ev.t === 'djump') R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 4, grow: 24, col: '#fff', life: .3 }); break;
      case 'form': R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 8, grow: 50, col: ev.form === 'light' ? '#fff2b0' : '#ff3a5a', life: .4 }); break;
      case 'formburst': R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 10, grow: 140, col: ev.form === 'light' ? '#fff8d0' : '#ff2a4a', life: .5 }); R.burst(ev.x, ev.y, 30, ev.form === 'light' ? '#fff0b0' : '#ff3a5a', 500); R.chroma = .4; break;
      case 'ultflash': R.flash = 1; R.flashC = '#ffffff'; R.ultT = 1.6; R.ultName = ev.name; R.ultCid = ev.cid; break;
      case 'ultslash': R.emit({ kind: 'slash', x: R.cam.x + W / 2, y: 270 + (ev.i - 3) * 30, face: ev.i % 2 ? -1 : 1, r: 420, size: 16, col: ev.color, life: .3, vx: 0, vy: 0, drag: 1, alt: ev.i % 2 }); R.chroma = .5; break;
      case 'army': for (let i = 0; i < 24; i++) R.emit({ x: R.cam.x + (ev.face > 0 ? -40 : W + 40), y: 300 + Math.random() * 160, vx: ev.face * (700 + Math.random() * 300), vy: 0, drag: 1, life: 1.6, size: 10, col: 'rgba(255,140,70,.5)', shrink: false }); break;
      case 'radiance': R.chroma = .6; break;
      case 'phase': R.glassBreak = 1; R.chroma = .8; break;
      case 'bossdown': R.flash = .8; R.chroma = .8; break;
      case 'blink': R.burst(ev.x, ev.y - 40, 14, '#b8a8ff', 200); break;
      case 'markpop': R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 4, grow: 40, col: '#b8a8ff', life: .3 }); break;
      case 'execute': R.flash = .4; R.flashC = '#b8a8ff'; R.burst(ev.x, ev.y - 30, 30, '#d0c0ff', 400); break;
      case 'burst': R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 6, grow: ev.r, col: PZ.ELEMS[ev.elem] || '#fff', life: .35 }); R.burst(ev.x, ev.y, 14, PZ.ELEMS[ev.elem] || '#fff', 260); break;
      case 'flashbang': R.flash = .5; R.flashC = '#fff4c0'; R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 10, grow: 90, col: '#ffe090', life: .4 }); R.burst(ev.x, ev.y, 30, '#ffd070', 420); break;
      case 'shock': R.emit({ kind: 'ring', x: ev.x, y: ev.y - 4, size: 10, grow: 160, col: '#ffe7a0', life: .5 }); for (let i = 0; i < 16; i++) R.emit({ x: ev.x + (Math.random() - .5) * 60, y: ev.y, vx: (Math.random() - .5) * 400, vy: -Math.random() * 400, g: 1200, floor: ev.y, life: 1, size: 3, col: '#c8a874', add: false }); break;
      case 'heal': R.texts.push({ x: ev.x, y: ev.y - 10, t: 0, s: '+' + (ev.amt >= 999 ? 'MAX' : ev.amt), c: '#8aff9a' }); break;
      case 'nyxheal': R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 4, grow: 30, col: '#cfe8ff', life: .5 }); break;
      case 'rebirth': R.flash = .6; R.flashC = '#ff9a5a'; R.burst(ev.x, ev.y - 30, 50, '#ff8a3a', 400); break;
      case 'spare': R.burst(480, 300, 60, '#fff8e0', 300, { g: -40 }); break;
      case 'checkpoint': R.banner = { s: PZ.T('checkpoint'), t: 0 }; break;
      case 'page': R.banner = { s: PZ.T('page') + ': ' + PZ.tr(PZ.PAGES[ev.id].title), t: 0 }; break;
      case 'shard': R.banner = { s: PZ.tr(PZ.SHARDS[ev.id].name), t: 0 }; R.flash = .4; R.flashC = '#e0f0ff'; break;
      case 'relic': R.banner = { s: PZ.tr(PZ.RELICS[ev.id].name) + ' — ' + PZ.tr(PZ.RELICS[ev.id].desc), t: 0 }; break;
      case 'weapon': R.banner = { s: ev.name, t: 0, small: true }; break;
      case 'nyxmode': R.banner = { s: 'Nyx: ' + PZ.tr(PZ.NYX_MODE_NAMES[ev.mode]), t: 0, small: true }; break;
      case 'immune': R.texts.push({ x: ev.x, y: ev.y, t: 0, s: PZ.lang === 'vi' ? 'MIỄN' : 'IMMUNE', c: '#ffb070' }); break;
      case 'drain': for (let i = 0; i < 8; i++) R.emit({ x: ev.x, y: ev.y, vx: (ev.tx - ev.x) * 1.5 + (Math.random() - .5) * 80, vy: (ev.ty - ev.y) * 1.5 + (Math.random() - .5) * 80, life: .6, size: 3, col: '#ff4a5a' }); break;
      case 'rise': R.burst(ev.x, ev.y - 20, 20, '#b8ff60', 200, { g: -100 }); break;
      case 'charm': R.emit({ kind: 'ring', x: ev.x, y: ev.y, size: 4, grow: 30, col: '#b8ff60', life: .5 }); break;
    }
  };

  // ---------- camera ----------
  R.updateCam = function (w, dt) {
    const p = w.player; if (!p) return;
    const lo = w.minX, hi = Math.min(w.maxX, w.terrain.width || W);
    let tx = p.x - W / 2 + p.face * 70 + p.vx * .18;
    if (w.levelDef && w.levelDef.arena) tx = 0;
    tx = PZ.clamp(tx, lo, Math.max(lo, hi - W));
    R.cam.x += (tx - R.cam.x) * Math.min(1, dt * 5);
    if (Math.abs(R.cam.x - tx) > 600) R.cam.x = tx;
    R.cam.x = PZ.clamp(R.cam.x, lo, Math.max(lo, hi - W));
    R.cam.shake *= Math.pow(.02, dt);
  };

  // ---------- full frame ----------
  R.frame = function (w, dt, opts) {
    opts = opts || {};
    const ctx = R.ctx; R.w = w; R.t += dt;
    R.updateCam(w, dt); R.updateParts(dt);
    ctx.save();
    const sx = (Math.random() - .5) * R.cam.shake, sy = (Math.random() - .5) * R.cam.shake;
    ctx.translate(sx, sy);
    R.sky(ctx, w);
    const layers = R.layers[w.theme] || [];
    for (const L of layers) drawLayer(ctx, L, R.cam.x);
    // dust motes
    if (PZ.Settings.gfx !== 'low') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const x = ((PZ.hash(i, 9) * 2000 - R.cam.x * .8 + R.t * 8 * (1 + i % 3)) % 1000 + 1000) % 1000 - 20, y = (PZ.hash(i, 7) * 540 + Math.sin(R.t + i) * 20); ctx.fillStyle = w.theme === 'garden' ? `rgba(255,255,200,${.25 + R.nightK * .4})` : 'rgba(255,240,200,.35)'; ctx.fillRect(x, y, 2, 2); } ctx.restore(); }
    ctx.save(); ctx.translate(-R.cam.x, 0);
    if (w.stations) for (const s of w.stations) R.station(ctx, s, w);
    ctx.restore();
    R.terrain(ctx, w, R.cam.x);
    ctx.save(); ctx.translate(-R.cam.x, 0);
    R.hazards(ctx, w);
    for (const z of w.zones) R.zone(ctx, z);
    for (const k of w.pickups) R.pickup(ctx, k);
    for (const e of w.ents) { if (e.kind === 'nyx') continue; if (e.x < R.cam.x - 300 || e.x > R.cam.x + W + 300) continue; if (e.boss && e.type !== 'seraphina') R.withRim(ctx, e, c => R.enemy(c, e, w), 'rgba(255,240,200,.8)', [-.7, -.7]); else R.enemy(ctx, e, w); }
    for (const p of w.players) R.hero(ctx, p, w);
    for (const e of w.ents) if (e.kind === 'nyx') R.nyx(ctx, e, w);
    for (const p of w.projs) R.proj(ctx, p);
    R.drawParts(ctx);
    // floating numbers
    ctx.textAlign = 'center';
    for (let i = R.texts.length - 1; i >= 0; i--) { const t = R.texts[i]; t.t += dt; if (t.t > .9) { R.texts.splice(i, 1); continue; } ctx.globalAlpha = 1 - t.t / .9; ctx.font = `bold ${t.big ? 20 : 14}px Palatino Linotype, Times New Roman, serif`; ctx.fillStyle = '#000'; ctx.fillText(t.s, t.x + 1, t.y - t.t * 50 + 1); ctx.fillStyle = t.c; ctx.fillText(t.s, t.x, t.y - t.t * 50); }
    ctx.globalAlpha = 1;
    ctx.restore();
    if (R.fg[w.theme]) drawLayer(ctx, R.fg[w.theme], R.cam.x);
    // darkness (Seraphina phase 3)
    if (w.dark > .02) R.darkness(ctx, w);
    ctx.restore();
    R.post(ctx, w, dt, opts);
  };

  R.darkness = function (ctx, w) {
    const X = R.darkX; X.globalCompositeOperation = 'source-over'; X.clearRect(0, 0, W, H);
    X.fillStyle = `rgba(4,3,8,${w.dark})`; X.fillRect(0, 0, W, H);
    X.globalCompositeOperation = 'destination-out';
    const p = w.player, px = p.x - R.cam.x, py = p.y - 32;
    const gr = X.createRadialGradient(px, py, 10, px, py, 90); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = gr; X.fillRect(px - 100, py - 100, 200, 200);
    // the "sword glint" and her tired glow
    const b = w.boss; if (b && b.state === 'tired') { const bx = b.x - R.cam.x, by = b.y - 70; const g2 = X.createRadialGradient(bx, by, 4, bx, by, 60); g2.addColorStop(0, 'rgba(0,0,0,.9)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g2; X.fillRect(bx - 70, by - 70, 140, 140); }
    X.globalCompositeOperation = 'source-over';
    ctx.drawImage(R.darkC, 0, 0);
    // visual cues for sounds (accessibility)
    if (PZ.Settings.hints) for (const c of R.cues) { const k = 1 - c.t / 1.3; if (k <= 0) continue; ctx.save(); ctx.globalAlpha = k * .7; ctx.fillStyle = '#ffe9a0'; if (c.side != null) { const x = c.side > 0 ? W - 30 : 30; ctx.beginPath(); ctx.moveTo(x, 240); ctx.lineTo(x - c.side * 18, 270); ctx.lineTo(x, 300); ctx.fill(); } else { ctx.fillRect(c.x - R.cam.x - 1, 0, 2, 40); } ctx.restore(); }
  };
  R.cues = [];

  // ---------- post-processing ----------
  R.post = function (ctx, w, dt, opts) {
    const gfx = PZ.Settings.gfx;
    // bloom
    if (gfx !== 'low' && R.supportsFilter !== false) {
      const B = R.bloomX; B.clearRect(0, 0, W / 4, H / 4);
      try { B.filter = 'brightness(.85) contrast(3.4) blur(3px)'; if (B.filter === 'none') R.supportsFilter = false; } catch (e) { R.supportsFilter = false; }
      B.drawImage(R.cv, 0, 0, R.cv.width, R.cv.height, 0, 0, W / 4, H / 4); B.filter = 'none';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (gfx === 'high' ? .34 : .26) * (w.theme === 'garden' ? 1 : .7); ctx.imageSmoothingEnabled = true; ctx.drawImage(R.bloomC, 0, 0, W, H); ctx.restore();
    }
    // color grade
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    const grade = { dawn: ['rgba(255,200,120,.35)', 'rgba(120,60,20,.3)'], cathedral: ['rgba(255,220,170,.25)', 'rgba(60,40,90,.45)'], garden: ['rgba(255,230,180,.2)', 'rgba(20,60,40,.25)'] }[w.theme] || ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'];
    if (w.dark > .5) { grade[0] = 'rgba(40,40,90,.4)'; grade[1] = 'rgba(0,0,0,.5)'; }
    gr.addColorStop(0, grade[0]); gr.addColorStop(1, grade[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); ctx.restore();
    // chromatic aberration
    if (R.chroma > .02 && gfx !== 'low') {
      const o = R.chroma * 6;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .18 * Math.min(1, R.chroma * 2);
      ctx.drawImage(R.cv, 0, 0, R.cv.width, R.cv.height, o, 0, W, H);
      ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .12; ctx.fillStyle = '#ff6060'; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      R.chroma *= Math.pow(.05, dt);
    }
    // vignette + grain
    ctx.drawImage(R.vig, 0, 0);
    if (gfx !== 'low') { ctx.save(); ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay'; const gx = Math.random() * 256, gy = Math.random() * 256; for (let x = -gx; x < W; x += 256) for (let y = -gy; y < H; y += 256) ctx.drawImage(R.grain, x, y); ctx.restore(); }
    // flash
    if (R.flash > .01) { ctx.save(); ctx.globalAlpha = Math.min(1, R.flash); ctx.fillStyle = R.flashC; ctx.fillRect(0, 0, W, H); ctx.restore(); R.flash *= Math.pow(.02, dt); }
    // glass break on phase change
    if (R.glassBreak > .01) { R.drawCracks(ctx, R.glassBreak); R.glassBreak -= dt * .9; }
    // ultimate banner
    if (R.ultT > 0) { R.ultT -= dt; const k = Math.min(1, R.ultT / .3, (1.6 - R.ultT) / .2); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 210, W, 90); ctx.fillStyle = '#fff6d0'; ctx.font = 'italic 40px Palatino Linotype, Times New Roman, serif'; ctx.textAlign = 'center'; ctx.fillText(R.ultName, W / 2 + (1 - k) * 80, 268); ctx.restore(); }
  };
  R.drawCracks = function (ctx, k) {
    const rnd = PZ.rng(7);
    ctx.save(); ctx.globalAlpha = Math.min(1, k); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5;
    const cx = W / 2, cy = H / 2;
    for (let i = 0; i < 16; i++) { let a = rnd() * TAU, x = cx, y = cy; ctx.beginPath(); ctx.moveTo(x, y); for (let j = 0; j < 6; j++) { a += (rnd() - .5) * .8; const L = 40 + rnd() * 80; x += Math.cos(a) * L; y += Math.sin(a) * L; ctx.lineTo(x, y); } ctx.stroke(); }
    ctx.fillStyle = `rgba(255,255,255,${.25 * k})`; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };
})(globalThis.PZ);
