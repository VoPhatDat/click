'use strict';
// ===== Close-up portraits with expressions + lip sync, and stained-glass panels =====
(function (PZ) {
  const R = PZ.R, TAU = Math.PI * 2;
  const LOOK = {
    zero: { skin: '#ecd6bf', hair: '#f4f0e6', iris: '#e0b040', lip: '#c88a7a', rim: '#ffe7a0', hairLen: 1, armor: '#c9b98f' },
    nyx: { skin: '#f6e6da', hair: '#bcd8ff', iris: '#6ab0ff', lip: '#e0a0a0', rim: '#cfe8ff', hairLen: .8, child: true, armor: '#e8f2ff' },
    vesper: { skin: '#e8d4c4', hair: '#3a3030', iris: '#ff3a2a', lip: '#a86a5a', rim: '#ff8a3a', hairLen: 1.2, mask: true, armor: '#5a4a40' },
    seraphina: { skin: '#f6e6d2', hair: '#fff2d0', iris: null, lip: '#d8a090', rim: '#fff4c0', hairLen: 1.5, stitched: true, halo: true, armor: '#fffaf0' },
    knight: { skin: '#a8a090', hair: '#e8e0c8', iris: '#ffef9a', lip: '#6a5a50', rim: '#ffe7a0', helm: true, armor: '#d8d0b8' },
    rook: { skin: '#b98a6a', hair: '#2a1a12', iris: '#5a3a20', lip: '#8a5a4a', rim: '#ff9a5a', hairLen: .3, beard: true, armor: '#8a3a2a' },
    sable: { skin: '#dcd6e0', hair: '#e8e8f0', iris: '#9a8cff', lip: '#9a7a8a', rim: '#b8a8ff', hairLen: 1.1, armor: '#2a2a38' },
    mirae: { skin: '#e8d8c4', hair: '#6a2a5a', iris: '#8ae060', lip: '#b87a7a', rim: '#c8ff70', hairLen: 1, armor: '#3c5a2a' },
    ysolde: { skin: '#cfbfa2', hair: '#1a1410', iris: '#ff4a4a', lip: '#8a3a3a', rim: '#ff6a6a', hairLen: 1.3, armor: '#3a2a1a' },
    citizen: { skin: '#d8c4a8', hair: '#6a5a4a', iris: '#4a4a4a', lip: '#a07a6a', rim: '#ffe0a0', hairLen: .5, tired: true, armor: '#8a7a60' },
    narrator: null
  };
  PZ.LOOK = LOOK;
  const EMO = { // brow tilt, brow height, lid (0 open..1 closed), mouth curve
    neutral: [0, 0, .15, 0], smile: [-.1, -1, .25, .7], worry: [.35, 2, .15, -.2], sad: [.4, 1, .4, -.5], cry: [.5, 2, .45, -.6], angry: [-.5, -2, .3, -.4], cold: [-.25, -1, .35, -.1], pain: [.45, 1, .5, -.4], tired: [.2, 1, .55, -.2]
  };

  R.portrait = function (ctx, who, emo, x, y, s, o) {
    const L = LOOK[who]; if (!L) return;
    o = o || {}; const E = EMO[emo] || EMO.neutral; const t = R.t;
    const m = o.speaking ? PZ.Audio.mouth() : { open: 0 };
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const breath = Math.sin(t * 1.6) * 1.2, wind = Math.sin(t * .9) * 4 + Math.sin(t * 2.3) * 2;
    const nod = o.speaking ? Math.sin(t * 5) * m.open * 1.6 : 0;
    // backlight
    const bg = ctx.createRadialGradient(0, -10, 10, 0, -10, 150); bg.addColorStop(0, R.rgba(L.rim, .35)); bg.addColorStop(1, R.rgba(L.rim, 0)); ctx.fillStyle = bg; ctx.fillRect(-160, -170, 320, 320);
    if (L.halo) { ctx.strokeStyle = '#ffe07a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -112, 62, 14, 0, 0, TAU); ctx.stroke(); }
    ctx.translate(0, breath + nod);
    // back hair strands
    const hairStrand = (sx, sy, len, w, ph) => { ctx.strokeStyle = L.hair; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx + wind * .3, sy + len * .3, sx + wind * .8 + Math.sin(t * 2 + ph) * 4, sy + len * .7, sx + wind + Math.sin(t * 1.7 + ph) * 6, sy + len); ctx.stroke(); };
    if (L.hairLen) for (let i = 0; i < 14; i++) hairStrand(-38 + i * 6, -40, 70 * L.hairLen + (i % 3) * 10, 6, i);
    // shoulders / armor
    ctx.fillStyle = L.armor; ctx.beginPath(); ctx.moveTo(-90, 120); ctx.quadraticCurveTo(-70, 50, -26, 44); ctx.lineTo(26, 44); ctx.quadraticCurveTo(70, 50, 90, 120); ctx.fill();
    ctx.fillStyle = R.shade(L.armor, -.3); ctx.fillRect(-20, 30, 40, 22);
    // face
    const sc = L.child ? .9 : 1;
    ctx.save(); ctx.scale(sc, sc);
    if (L.helm) {
      ctx.fillStyle = L.armor; ctx.beginPath(); ctx.ellipse(0, -10, 44, 54, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1814'; ctx.fillRect(-30, -18, 60, 10); ctx.fillStyle = L.iris; ctx.fillRect(-20, -15, 8, 4); ctx.fillRect(12, -15, 8, 4);
      ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(0, 40); ctx.stroke();
      ctx.fillStyle = '#c83a2a'; ctx.beginPath(); ctx.ellipse(wind * .5, -72, 8, 22, wind * .02, 0, TAU); ctx.fill();
      ctx.restore(); ctx.restore(); return;
    }
    // neck + head with split lighting
    ctx.fillStyle = R.shade(L.skin, -.15); ctx.fillRect(-12, 18, 24, 30);
    const fg = ctx.createLinearGradient(-40, 0, 40, 0); fg.addColorStop(0, R.shade(L.skin, .12)); fg.addColorStop(.55, L.skin); fg.addColorStop(1, R.shade(L.skin, -.28));
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-34, -30); ctx.quadraticCurveTo(-36, 10, -18, 30); ctx.quadraticCurveTo(0, 42, 18, 30); ctx.quadraticCurveTo(36, 10, 34, -30); ctx.quadraticCurveTo(30, -62, 0, -64); ctx.quadraticCurveTo(-30, -62, -34, -30); ctx.fill();
    // rim light on the right edge
    ctx.strokeStyle = R.rgba(L.rim, .8); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(33, -34); ctx.quadraticCurveTo(35, 10, 17, 30); ctx.stroke();
    // eyes
    const lid = Math.max(E[2], (Math.sin(t * .7) > .985 ? 1 : 0), L.tired ? .5 : 0);
    for (const sd of [-1, 1]) {
      const ex = sd * 14, ey = -12;
      if (L.stitched) {
        ctx.strokeStyle = '#d8a020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ex - 9, ey); ctx.quadraticCurveTo(ex, ey + 3, ex + 9, ey); ctx.stroke();
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(ex + k * 2.6, ey - 3); ctx.lineTo(ex + k * 2.6 + 1, ey + 4); ctx.stroke(); }
        if (emo === 'cry' || emo === 'sad') { ctx.fillStyle = 'rgba(255,230,140,.9)'; ctx.beginPath(); ctx.ellipse(ex + 2, ey + 8 + (t * 18 % 22), 1.6, 2.6, 0, 0, TAU); ctx.fill(); }
        continue;
      }
      if (L.mask && sd < 0) { continue; }
      ctx.fillStyle = '#fbf8f2'; ctx.beginPath(); ctx.ellipse(ex, ey, 9, 5.5, 0, 0, TAU); ctx.fill();
      const look = Math.sin(t * .4) * 1.5;
      ctx.fillStyle = L.iris; ctx.beginPath(); ctx.arc(ex + look, ey, 4.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex + look, ey, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex + look - 1.5, ey - 1.6, 1.3, 0, TAU); ctx.fill();
      // eyelid
      ctx.fillStyle = R.shade(L.skin, -.08); ctx.beginPath(); ctx.ellipse(ex, ey - 5.5 + 11 * lid * .5, 10, 5.5 * lid + .5, 0, Math.PI, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,10,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(ex, ey, 9, 5.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      if (emo === 'cry') { ctx.fillStyle = 'rgba(170,210,255,.85)'; ctx.beginPath(); ctx.ellipse(ex + 3, ey + 8 + (t * 20 % 24), 1.6, 2.6, 0, 0, TAU); ctx.fill(); }
    }
    // brows
    if (!L.mask || true) for (const sd of [-1, 1]) { if (L.mask && sd < 0) continue; const bx = sd * 14, by = -24 + E[1]; ctx.strokeStyle = R.shade(L.hair === '#fff2d0' || L.hair === '#f4f0e6' ? '#c8b898' : L.hair, -.1); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 8 * sd, by - E[0] * 6); ctx.lineTo(bx + 8 * sd, by + E[0] * 6); ctx.stroke(); }
    // mask (Vesper): gold, cracked half
    if (L.mask) {
      ctx.fillStyle = '#d8b050'; ctx.beginPath(); ctx.moveTo(-34, -40); ctx.lineTo(2, -46); ctx.lineTo(-2, -20); ctx.lineTo(6, -4); ctx.lineTo(-4, 14); ctx.lineTo(-20, 28); ctx.quadraticCurveTo(-36, 6, -34, -40); ctx.fill();
      ctx.strokeStyle = '#7a5a20'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-10, -8); ctx.lineTo(-6, 4); ctx.stroke();
      ctx.fillStyle = '#2a1a0a'; ctx.beginPath(); ctx.ellipse(-14, -12, 8, 3.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,120,60,.25)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-20 + i * 8 + Math.sin(t * 3 + i) * 3, 40 - (t * 30 + i * 13) % 60, 2, 0, TAU); ctx.fill(); }
    }
    // nose
    ctx.strokeStyle = 'rgba(120,70,50,.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(4, 6); ctx.lineTo(0, 8); ctx.stroke();
    // mouth (lip sync: open / round / flat)
    const mo = m.open || 0, curve = E[3];
    const mw = 10 * (1 - (m.round || 0) * .35 + (m.flat || 0) * .15);
    ctx.fillStyle = '#4a1a1a';
    if (mo > .08) { ctx.beginPath(); ctx.ellipse(0, 18, mw, 1.5 + mo * 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8e0d8'; ctx.fillRect(-mw * .6, 18 - 1.5 - mo * 6 + 1, mw * 1.2, 1.6); }
    ctx.strokeStyle = L.lip; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-mw, 18 - curve * 3); ctx.quadraticCurveTo(0, 18 + curve * 4 - mo * 6, mw, 18 - curve * 3); ctx.stroke();
    if (mo > .08) { ctx.beginPath(); ctx.moveTo(-mw, 18 - curve * 3); ctx.quadraticCurveTo(0, 18 + mo * 7, mw, 18 - curve * 3); ctx.stroke(); }
    // beard
    if (L.beard) { ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(-28, 34, 0, 44); ctx.quadraticCurveTo(28, 34, 30, 0); ctx.quadraticCurveTo(20, 24, 0, 24); ctx.quadraticCurveTo(-20, 24, -30, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,200,180,.5)'; ctx.beginPath(); ctx.moveTo(-22, -30); ctx.lineTo(-12, -2); ctx.stroke(); }
    // front hair / bangs
    ctx.fillStyle = L.hair; ctx.beginPath(); ctx.moveTo(-38, -24); ctx.quadraticCurveTo(-40, -70, 0, -70); ctx.quadraticCurveTo(40, -70, 38, -24); ctx.quadraticCurveTo(30, -52, 12, -48); ctx.quadraticCurveTo(2, -36 + wind * .3, -10, -44); ctx.quadraticCurveTo(-24, -40, -38, -24); ctx.fill();
    if (L.hairLen) for (let i = 0; i < 5; i++) hairStrand(-30 + i * 14, -50, 30 + i * 4, 3, i + 4);
    ctx.restore(); ctx.restore();
  };

  // ---------- stained glass panels (prologue) ----------
  R.glassCache = {};
  R.glass = function (i, w, h) {
    const key = i + ':' + w; if (R.glassCache[key]) return R.glassCache[key];
    const c = R.mk(w, h), g = c.getContext('2d'), rnd = PZ.rng(100 + i);
    const pal = [['#c83a2a', '#e8a040', '#3a6ac8', '#e8d8a0'], ['#6a5a4a', '#c8a040', '#2a2a3a', '#a85a3a'], ['#c8a040', '#8a2a2a', '#e8e0c8', '#3a3a6a'], ['#e8e0d0', '#1a1018', '#c82a3a', '#5a3a8a'], ['#8a3a2a', '#2a2a38', '#3c5a2a', '#c8a050'], ['#ff8a5a', '#4a2a2a', '#ffd772', '#2a1a1a'], ['#ffe7a0', '#c82a3a', '#e8e0d0', '#3a6ac8'], ['#ffe9a8', '#6ac8ff', '#7ae07a', '#c8b0ff']][i];
    // voronoi-ish glass cells
    const pts = []; for (let k = 0; k < 70; k++) pts.push([rnd() * w, rnd() * h, pal[k % 4]]);
    const id = g.createImageData(w, h);
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      let b = 1e9, b2 = 1e9, col = null; for (const p of pts) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < b) { b2 = b; b = d; col = p[2]; } else if (d < b2) b2 = d; }
      const edge = Math.sqrt(b2) - Math.sqrt(b) < 3; const n = parseInt(col.slice(1), 16), f = .55 + .45 * R.fbm(x / 40, y / 40, 3);
      const r = edge ? 30 : (n >> 16) * f, gg = edge ? 26 : (n >> 8 & 255) * f, bb = edge ? 22 : (n & 255) * f;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const o = ((y + dy) * w + x + dx) * 4; id.data[o] = r; id.data[o + 1] = gg; id.data[o + 2] = bb; id.data[o + 3] = 255; }
    }
    g.putImageData(id, 0, 0);
    // central motif in lead + bright glass
    g.save(); g.translate(w / 2, h / 2); g.lineWidth = 6; g.strokeStyle = '#1e1a16';
    const fig = (x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y - 60 * s, 14 * s, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 20 * s, y - 40 * s); g.lineTo(x + 20 * s, y - 40 * s); g.lineTo(x + 28 * s, y + 40 * s); g.lineTo(x - 28 * s, y + 40 * s); g.closePath(); g.fill(); g.stroke(); };
    switch (i) {
      case 0: g.fillStyle = '#e8d8a0'; g.beginPath(); g.moveTo(-60, 70); g.lineTo(-60, -20); g.lineTo(0, -70); g.lineTo(60, -20); g.lineTo(60, 70); g.closePath(); g.fill(); g.stroke(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k / 5 * TAU; g.fillStyle = '#c83a2a'; g.beginPath(); g.arc(Math.cos(a) * 110, Math.sin(a) * 110, 16, 0, TAU); g.fill(); g.stroke(); } break;
      case 1: g.fillStyle = '#6a5a4a'; g.fillRect(-30, -90, 60, 180); g.strokeRect(-30, -90, 60, 180); g.fillStyle = '#c8a040'; for (let k = 0; k < 4; k++) { g.fillRect(-60 + k * 30, 60, 16, 30); } g.beginPath(); g.moveTo(-90, 100); g.lineTo(90, 100); g.stroke(); break;
      case 2: g.fillStyle = '#8a2a2a'; g.fillRect(-90, 30, 180, 30); g.strokeRect(-90, 30, 180, 30); fig(0, 0, .7, '#e8e0c8'); for (let k = 0; k < 6; k++) { g.fillStyle = '#ffb040'; g.beginPath(); g.moveTo(-80 + k * 32, 30); g.lineTo(-70 + k * 32, -10 - rnd() * 30); g.lineTo(-60 + k * 32, 30); g.fill(); g.stroke(); } break;
      case 3: g.save(); g.beginPath(); g.rect(-100, -100, 100, 200); g.clip(); fig(0, 0, 1.2, '#e8e0d0'); g.restore(); g.save(); g.beginPath(); g.rect(0, -100, 100, 200); g.clip(); fig(0, 0, 1.2, '#1a1018'); g.fillStyle = '#c82a3a'; g.beginPath(); g.arc(6, -74, 4, 0, TAU); g.fill(); g.restore(); g.beginPath(); g.moveTo(0, -110); g.lineTo(-6, -40); g.lineTo(6, 10); g.lineTo(-4, 100); g.stroke(); break;
      case 4: ['#8a3a2a', '#2a2a38', '#3c5a2a', '#c8a050'].forEach((c2, k) => fig(-96 + k * 64, 20, .55, c2)); break;
      case 5: { g.fillStyle = '#ffd772'; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(-50 + k * 50, -40, 18, 60, (k - 1) * .5, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#2a1a1a'; g.beginPath(); g.arc(0, -10, 26, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#ff3a2a'; g.beginPath(); g.arc(8, -14, 5, 0, TAU); g.fill(); for (let k = 0; k < 5; k++) { g.fillStyle = '#ff8a5a'; g.beginPath(); g.arc(-80 + k * 40, 80, 10, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-86 + k * 40, 74); g.lineTo(-74 + k * 40, 86); g.stroke(); } break; }
      case 6: fig(-24, 10, .9, '#e8e0d0'); fig(24, 10, .9, '#c82a3a'); g.fillStyle = '#ffe7a0'; g.beginPath(); g.arc(0, -96, 20, 0, TAU); g.fill(); g.stroke(); break;
      case 7: { g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(0, -30, 46, 0, TAU); g.fill(); g.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 52, -30 + Math.sin(a) * 52); g.lineTo(Math.cos(a) * 80, -30 + Math.sin(a) * 80); g.stroke(); } g.fillStyle = '#7ae07a'; g.beginPath(); g.ellipse(0, 90, 120, 26, 0, Math.PI, TAU); g.fill(); g.stroke(); break; }
    }
    g.restore();
    // arch frame
    g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.moveTo(0, h); g.lineTo(0, w / 2); g.arc(w / 2, w / 2, w / 2, Math.PI, 0); g.lineTo(w, h); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#2a2018'; g.lineWidth = 12; g.beginPath(); g.moveTo(6, h); g.lineTo(6, w / 2); g.arc(w / 2, w / 2, w / 2 - 6, Math.PI, 0); g.lineTo(w - 6, h); g.stroke();
    return (R.glassCache[key] = c);
  };
})(globalThis.PZ);
