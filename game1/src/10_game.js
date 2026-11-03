'use strict';
// ===== Game shell: input (keyboard + gamepad, rebinding), menus, cutscenes, HUD, flow, saves =====
(function (PZ) {
  const W = PZ.W, H = PZ.H, R = PZ.R, A = PZ.Audio, TAU = Math.PI * 2;
  const FONT = '"Palatino Linotype","Book Antiqua",Palatino,"Times New Roman",serif';
  const G = PZ.Game = { state: 'boot', t: 0, save: null, slot: 0, w: null, menu: null, toast: [], card: null, sub: null, subQ: [] };

  // ---------------- input ----------------
  const Inp = PZ.Input = { down: new Set(), prev: {}, capture: null, lastPad: null };
  const keymap = () => PZ.Settings.keys || PZ.DEFAULT_KEYS;
  const GAME_KEYS = new Set(Object.values(PZ.DEFAULT_KEYS).flat());
  addEventListener('keydown', e => {
    if (Inp.capture) { e.preventDefault(); const cb = Inp.capture; Inp.capture = null; cb(e.code); return; }
    Inp.down.add(e.code); if (GAME_KEYS.has(e.code) || (PZ.Settings.keys && Object.values(PZ.Settings.keys).flat().includes(e.code))) e.preventDefault();
    A.init();
  });
  addEventListener('keyup', e => Inp.down.delete(e.code));
  addEventListener('blur', () => Inp.down.clear());
  Inp.read = function () {
    const km = keymap(), cur = {};
    for (const a of PZ.ACTIONS) cur[a] = (km[a] || []).some(k => Inp.down.has(k));
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && [...pads].find(p => p && p.connected);
    if (gp) {
      const b = i => gp.buttons[i] && gp.buttons[i].pressed, ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      cur.left = cur.left || ax < -.4 || b(14); cur.right = cur.right || ax > .4 || b(15); cur.up = cur.up || ay < -.5 || b(12); cur.down = cur.down || ay > .5 || b(13);
      cur.jump = cur.jump || b(0); cur.dash = cur.dash || b(1); cur.attack = cur.attack || b(2); cur.s3 = cur.s3 || b(3); cur.interact = cur.interact || b(3);
      cur.s1 = cur.s1 || b(4); cur.s2 = cur.s2 || b(5); cur.form = cur.form || b(6); cur.ult = cur.ult || b(7); cur.nyx = cur.nyx || b(8); cur.pause = cur.pause || b(9); cur.weapon = cur.weapon || b(11) || b(10);
      if (gp.buttons.some(x => x.pressed)) A.init();
    }
    const I = PZ.makeIntent();
    for (const a of PZ.ACTIONS) { I[a] = cur[a]; I[a + 'P'] = cur[a] && !Inp.prev[a]; }
    Inp.prev = cur; return I;
  };
  PZ.keyLabel = code => code ? code.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '↑↓←→'.includes('') ? '' : '').replace('Left', '←').replace('Right', '→').replace('Up', '↑').replace('Down', '↓').replace('Space', 'Space') : '—';

  // ---------------- text helpers ----------------
  function font(sz, it, b) { return `${it ? 'italic ' : ''}${b ? 'bold ' : ''}${sz}px ${FONT}`; }
  G.font = font;
  function wrap(ctx, text, maxW) {
    const out = []; for (const para of String(text).split('\n')) { let line = ''; for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } out.push(line); } return out;
  }
  G.wrap = wrap;
  function txt(ctx, s, x, y, sz, col, al, o) { o = o || {}; ctx.font = font(sz, o.it, o.b); ctx.textAlign = al || 'left'; ctx.textBaseline = 'alphabetic'; if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(s, x + 1.5, y + 1.5); } ctx.fillStyle = col || '#f4e8c8'; ctx.fillText(s, x, y); }
  G.txt = txt;
  function frame(ctx, x, y, w, h, o) {
    o = o || {};
    const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, o.bg0 || 'rgba(30,22,14,.92)'); gr.addColorStop(1, o.bg1 || 'rgba(14,10,8,.94)');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.strokeStyle = 'rgba(200,160,80,.4)'; ctx.lineWidth = 1; ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
    ctx.fillStyle = '#e8c068'; for (const [cx, cy] of [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3], [x + w - 3, y + h - 3]]) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
  }
  G.frameBox = frame;
  function parchment(ctx, x, y, w, h) {
    const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#efe0bc'); gr.addColorStop(1, '#d8c294'); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(120,80,30,.08)'; for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(x + PZ.hash(i, 1) * w, y + PZ.hash(i, 2) * h, 10 + PZ.hash(i, 3) * 40, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 3; ctx.strokeRect(x + 6, y + 6, w - 12, h - 12); ctx.strokeStyle = 'rgba(138,106,48,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
  }
  G.parchment = parchment;

  // ---------------- toasts / achievements ----------------
  G.toastMsg = function (s, c) { G.toast.push({ s, t: 0, c: c || '#f4e8c8' }); };
  G.achieve = function (id) { if (!G.save || G.save.achievements[id]) return; G.save.achievements[id] = Date.now(); G.toastMsg('✦ ' + PZ.tr(PZ.ACHIEVEMENTS[id]), '#ffe27a'); A.sfxPlay('shard'); };
  G.checkAchievements = function () {
    const s = G.save; if (!s) return;
    if (s.cleared.seraphina) G.achieve('first_light');
    if (s.spared.seraphina) G.achieve('mercy_1');
    if (s.cleared.knight) G.achieve('knight');
    if (['p1_1', 'p1_2', 'p1_3', 'p1_4'].every(k => s.pages[k])) G.achieve('pages_1');
    if (s.shards.shard_1) G.achieve('shard_1');
    if ((s.stats.parries || 0) >= 10) G.achieve('parry10');
    if (['zero', 'rook', 'sable', 'mirae', 'ysolde'].every(c => s.flags['used_' + c])) G.achieve('allchars');
  };

  // ---------------- saves ----------------
  G.slotKey = i => 'pz2_slot' + i;
  G.saveGame = function (quiet) { if (!G.save) return; G.save.lastSaved = Date.now(); PZ.Store.set(G.slotKey(G.slot), G.save); if (!quiet) G.toastMsg(PZ.T('saved')); };
  G.loadSlot = i => PZ.Store.get(G.slotKey(i));

  // ---------------- menus ----------------
  G.openMenu = function (m) { m.sel = m.sel || 0; m.parent = G.menu; G.menu = m; while (m.items[m.sel] && m.items[m.sel].disabled && m.sel < m.items.length - 1) m.sel++; };
  G.closeMenu = function () { const m = G.menu; G.menu = m && m.parent || null; if (m && m.onClose) m.onClose(); };
  G.menuInput = function (I) {
    const m = G.menu; if (!m) return;
    if (m.capture) return;
    const n = m.items.length;
    const mv = d => { let s = m.sel; for (let k = 0; k < n; k++) { s = (s + d + n) % n; if (!m.items[s].disabled) break; } m.sel = s; A.sfxPlay('ui'); };
    if (I.upP) mv(-1); if (I.downP) mv(1);
    const it = m.items[m.sel];
    if (it && I.leftP && it.left) { it.left(); A.sfxPlay('ui'); }
    if (it && I.rightP && it.right) { it.right(); A.sfxPlay('ui'); }
    if ((I.interactP || I.attackP || I.jumpP) && it && !it.disabled && it.act) { A.sfxPlay('uiok'); it.act(); }
    if (I.pauseP || I.dashP) { if (m.back) m.back(); else if (m.parent !== undefined && !m.noBack) G.closeMenu(); A.sfxPlay('ui'); }
  };
  G.drawMenu = function (ctx) {
    const m = G.menu; if (!m) return;
    const w = m.w || 520, rowH = m.rowH || 34, h = Math.min(500, 90 + m.items.length * rowH + (m.extraH || 0)), x = (W - w) / 2 + (m.dx || 0), y = m.y != null ? m.y : (H - h) / 2;
    if (m.dim !== false) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, H); }
    frame(ctx, x, y, w, h);
    txt(ctx, typeof m.title === 'function' ? m.title() : m.title, x + w / 2, y + 42, 26, '#ffe7a0', 'center', { it: true });
    const maxRows = Math.floor((h - 90 - (m.extraH || 0)) / rowH);
    const off = Math.max(0, Math.min(m.sel - maxRows + 2, m.items.length - maxRows));
    m.items.slice(off, off + maxRows).forEach((it, k) => {
      const i = k + off, yy = y + 82 + k * rowH, sel = i === m.sel;
      if (sel) { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(200,160,80,0)'); g.addColorStop(.5, 'rgba(200,160,80,.28)'); g.addColorStop(1, 'rgba(200,160,80,0)'); ctx.fillStyle = g; ctx.fillRect(x + 14, yy - 22, w - 28, rowH - 4); }
      const label = typeof it.label === 'function' ? it.label() : it.label;
      txt(ctx, (sel ? '✦ ' : '') + label, x + (m.align === 'left' ? 36 : w / 2), yy, 19, it.disabled ? 'rgba(200,190,170,.4)' : sel ? '#fff4d0' : '#e0d0b0', m.align === 'left' ? 'left' : 'center');
      if (it.right && sel) { txt(ctx, '◂', x + 24, yy, 18, '#c8a050', 'left'); txt(ctx, '▸', x + w - 24, yy, 18, '#c8a050', 'right'); }
    });
    if (m.footer) txt(ctx, typeof m.footer === 'function' ? m.footer() : m.footer, x + w / 2, y + h - 18, 13, '#b8a888', 'center', { it: true });
    if (m.draw) m.draw(ctx, x, y, w, h);
  };

  // ---------------- title / main menus ----------------
  G.titleMenu = function () {
    const hasAny = [0, 1, 2].some(i => G.loadSlot(i));
    G.menu = null;
    G.openMenu({
      title: '', w: 380, y: 300, dim: false, noBack: true, rowH: 30,
      items: [
        { label: () => PZ.T('continue'), disabled: !hasAny, act: () => { const best = [0, 1, 2].map(i => [i, G.loadSlot(i)]).filter(x => x[1]).sort((a, b) => (b[1].lastSaved || 0) - (a[1].lastSaved || 0))[0]; if (best) G.startFromSave(best[0], best[1]); } },
        { label: () => PZ.T('newgame'), act: () => G.slotMenu(true) },
        { label: () => PZ.T('load'), disabled: !hasAny, act: () => G.slotMenu(false) },
        { label: () => PZ.T('options'), act: () => G.optionsMenu() },
        { label: () => PZ.T('music'), act: () => G.musicMenu() },
        { label: () => PZ.T('cutscenes'), act: () => G.sceneMenu() },
        { label: () => PZ.T('lang'), act: () => { PZ.lang = PZ.Settings.lang = PZ.lang === 'vi' ? 'en' : 'vi'; PZ.saveSettings(); }, left: () => { PZ.lang = PZ.Settings.lang = PZ.lang === 'vi' ? 'en' : 'vi'; PZ.saveSettings(); }, right: () => { PZ.lang = PZ.Settings.lang = PZ.lang === 'vi' ? 'en' : 'vi'; PZ.saveSettings(); } }
      ]
    });
  };
  G.slotMenu = function (fresh) {
    const items = [0, 1, 2].map(i => {
      const s = G.loadSlot(i);
      const desc = s ? `${PZ.T('slot')} ${i + 1} — ${PZ.tr(PZ.CHARS[s.char].name)} · ${PZ.lang === 'vi' ? 'Chương' : 'Chapter'} ${s.cleared.seraphina ? 2 : 1} · ${Math.floor(s.playtime / 60)}′ · ${Object.keys(s.pages).length}📜` : `${PZ.T('slot')} ${i + 1} ${PZ.T('empty')}`;
      return { label: desc, disabled: !fresh && !s, act: () => { if (fresh) G.chooseDifficulty(i); else G.startFromSave(i, s); } };
    });
    items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
    G.openMenu({ title: fresh ? PZ.T('newgame') : PZ.T('load'), items, w: 620, footer: fresh ? (PZ.lang === 'vi' ? 'Hành trình mới sẽ ghi đè lên ô đã chọn' : 'A new journey overwrites the chosen slot') : '' });
  };
  G.chooseDifficulty = function (slot) {
    G.openMenu({
      title: PZ.T('diff'), w: 560, items: PZ.DIFFS.map((d, i) => ({ label: PZ.tr(d.name) + (i === 1 ? (PZ.lang === 'vi' ? ' (khuyên dùng)' : ' (recommended)') : ''), act: () => { PZ.Settings.diff = i; PZ.saveSettings(); G.newGame(slot); } })).concat([{ label: () => PZ.T('back'), act: () => G.closeMenu() }]),
      footer: () => PZ.lang === 'vi' ? 'Kể Chuyện: nhận ít sát thương · Phán Xét: chết một lần là hết hành trình' : 'Story: take little damage · Judgment: one death ends the journey'
    });
  };
  G.optionsMenu = function () {
    const S = PZ.Settings, pct = v => Math.round(v * 100) + '%', step = (k, d) => { S[k] = PZ.clamp(Math.round((S[k] + d) * 10) / 10, 0, 1); A.setVolumes(); PZ.saveSettings(); };
    const gfxs = ['low', 'med', 'high'];
    G.openMenu({
      title: PZ.T('options'), w: 600, items: [
        { label: () => `${PZ.T('volMusic')}: ${pct(S.music)}`, left: () => step('music', -.1), right: () => step('music', .1) },
        { label: () => `${PZ.T('volSfx')}: ${pct(S.sfx)}`, left: () => step('sfx', -.1), right: () => step('sfx', .1) },
        { label: () => `${PZ.T('volVoice')}: ${pct(S.voice)}`, left: () => step('voice', -.1), right: () => step('voice', .1) },
        { label: () => `${PZ.T('gfx')}: ${PZ.T(S.gfx)}`, left: () => { S.gfx = gfxs[(gfxs.indexOf(S.gfx) + 2) % 3]; PZ.saveSettings(); G.resize(); }, right: () => { S.gfx = gfxs[(gfxs.indexOf(S.gfx) + 1) % 3]; PZ.saveSettings(); G.resize(); } },
        { label: () => `${PZ.T('diff')}: ${PZ.tr(PZ.DIFFS[S.diff].name)}`, left: () => { S.diff = (S.diff + 3) % 4; PZ.saveSettings(); }, right: () => { S.diff = (S.diff + 1) % 4; PZ.saveSettings(); } },
        { label: () => `${PZ.T('hints')}: ${PZ.T(S.hints ? 'on' : 'off')}`, act: () => { S.hints = !S.hints; PZ.saveSettings(); }, left: () => { S.hints = !S.hints; PZ.saveSettings(); }, right: () => { S.hints = !S.hints; PZ.saveSettings(); } },
        { label: () => `${PZ.T('shake')}: ${PZ.T(S.shake ? 'on' : 'off')}`, act: () => { S.shake = !S.shake; PZ.saveSettings(); }, left: () => { S.shake = !S.shake; PZ.saveSettings(); }, right: () => { S.shake = !S.shake; PZ.saveSettings(); } },
        { label: () => PZ.T('lang'), act: () => { PZ.lang = S.lang = PZ.lang === 'vi' ? 'en' : 'vi'; PZ.saveSettings(); } },
        { label: () => PZ.T('keys'), act: () => G.keysMenu() },
        { label: () => PZ.T('back'), act: () => G.closeMenu() }
      ], footer: () => PZ.lang === 'vi' ? '◂ ▸ để chỉnh · Esc để quay lại' : '◂ ▸ to adjust · Esc to go back'
    });
  };
  G.keysMenu = function () {
    const km = () => PZ.Settings.keys || PZ.DEFAULT_KEYS;
    const items = PZ.ACTIONS.filter(a => a !== 'pause').map(a => ({ label: () => `${PZ.tr(PZ.ACTION_NAMES[a])}: ${(km()[a] || []).map(PZ.keyLabel).join(' / ')}`, act: () => {
      const m = G.menu; m.capture = true; G.toastMsg(PZ.T('pressKey'));
      Inp.capture = code => { m.capture = false; if (code === 'Escape') return; const k = JSON.parse(JSON.stringify(km())); for (const b in k) k[b] = k[b].filter(c => c !== code); k[a] = [code].concat((k[a] || []).slice(0, 1)); PZ.Settings.keys = k; PZ.saveSettings(); };
    } }));
    items.push({ label: PZ.lang === 'vi' ? 'Khôi phục mặc định' : 'Reset to defaults', act: () => { PZ.Settings.keys = null; PZ.saveSettings(); } });
    items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
    G.openMenu({ title: PZ.T('keys'), items, w: 620, rowH: 28, align: 'left', footer: PZ.lang === 'vi' ? 'Tay cầm: A nhảy · B lướt · X đánh · Y kỹ năng 3 / tương tác · LB/RB kỹ năng 1–2 · LT đổi dạng · RT tuyệt kỹ · R3 đổi vũ khí · Back: Nyx' : 'Pad: A jump · B dash · X attack · Y skill 3 / interact · LB/RB skills 1–2 · LT form · RT ultimate · R3 weapon · Back: Nyx' });
  };
  G.musicMenu = function () {
    const heard = PZ.Store.get('pz2_music') || {};
    const items = A.TRACK_ORDER.map(id => ({ label: heard[id] ? PZ.tr(A.TRACKS[id].name) : '— ? —', disabled: !heard[id], act: () => { A.init(); A.play(id, { now: true }); A.setIntensity(id === 'seraphina' ? 1 : 2); G.musicRoomTrack = id; } }));
    items.push({ label: () => PZ.T('back'), act: () => { G.closeMenu(); A.play('title', { now: true }); A.setIntensity(0); } });
    G.openMenu({ title: PZ.T('music'), items, w: 560, footer: () => PZ.lang === 'vi' ? 'Bài nhạc mở khi nghe lần đầu trong game' : 'Tracks unlock when first heard in-game' });
  };
  G.sceneMenu = function () {
    const seen = PZ.Store.get('pz2_scenes') || {};
    const ids = ['prologue', 'hub_first', 'ch1_intro', 'ch1_talk1', 'ch1_talk2', 'ch1_talk3', 'ch1_knight', 'ch1_preboss', 'ch1_post_spare', 'ch1_post_kill', 'hub_after1'];
    const items = ids.map(id => ({ label: seen[id] ? id.replace(/_/g, ' ') : '— ? —', disabled: !seen[id], act: () => { const back = G.menu; G.menu = null; G.playScene(id, () => { G.state = 'title'; G.menu = back; A.play('title'); }); } }));
    items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
    G.openMenu({ title: PZ.T('cutscenes'), items, w: 520, rowH: 28 });
  };

  // ---------------- flow ----------------
  G.newGame = function (slot) {
    G.slot = slot; G.save = PZ.newSave(); for (const k of PZ.DEFAULT_CODEX) G.save.codex[k] = 1; G.save.codex.land_dawn = 1;
    G.saveGame(true); G.menu = null;
    G.playScene('prologue', () => G.enterHub(true));
  };
  G.startFromSave = function (slot, s) { G.slot = slot; G.save = s; for (const k of PZ.DEFAULT_CODEX) s.codex[k] = 1; G.menu = null; G.enterHub(false); };
  G.enterHub = function (first) {
    G.w = PZ.loadLevel('hub', G.save, { diff: PZ.Settings.diff }); G.state = 'play'; A.play('hub'); A.setIntensity(0);
    G.save.flags['used_' + G.save.char] = 1; G.saveGame(true);
    if (first) G.playScene('hub_first');
    else if (G.save.cleared.seraphina && !G.save.flags.after1) { G.save.flags.after1 = 1; G.playScene('hub_after1'); }
  };
  G.enterLevel = function (id) {
    G.w = PZ.loadLevel(id, G.save, { diff: PZ.Settings.diff }); G.state = 'play';
    const L = PZ.LEVELS[id]; A.play(L.music); A.setIntensity(id === 'ch1_boss' ? 0 : 0, id === 'ch1_boss' ? 'exact' : false);
    if (id === 'ch1_boss') A.setLayers([1, 0, 0, 0]);
    R.cam.x = 0; R.parts.length = 0;
  };
  G.enterChapter = function (n) {
    if (n !== 1) return;
    G.playScene('ch1_intro', () => G.enterLevel('ch1'));
  };

  // ---------------- cutscenes ----------------
  G.playScene = function (id, done) {
    const steps = PZ.SCENES[id]; if (!steps) { done && done(); return; }
    const seen = PZ.Store.get('pz2_scenes') || {}; seen[id] = 1; PZ.Store.set('pz2_scenes', seen);
    G.scene = { id, steps, i: -1, t: 0, done, prevState: G.state === 'scene' ? 'play' : G.state, skipT: 0 };
    G.state = 'scene';
    if (id === 'prologue') A.play('prologue', { now: true });
    if (id === 'ch1_post_spare') A.play('lullaby');
    G.nextStep();
  };
  G.nextStep = function () {
    const sc = G.scene; sc.i++; sc.t = 0; A.stopVoice();
    if (sc.i >= sc.steps.length) { G.scene = null; G.state = sc.prevState === 'title' ? 'title' : 'play'; if (G.state === 'play' && !G.w) G.state = 'title'; const d = sc.done; d && d(); return; }
    const st = sc.steps[sc.i];
    const text = PZ.tr(st.text || st.book || st.narr || st.tip);
    if (st.say) sc.est = A.speak(st.say, text);
    else if (st.glass != null || st.narr || st.book) sc.est = A.speak('narrator', text.replace(/\n/g, ' '));
    else sc.est = 1.5;
  };
  G.sceneUpdate = function (I, dt) {
    const sc = G.scene; sc.t += dt;
    const st = sc.steps[sc.i];
    if (I.pause) { sc.skipT += dt; if (sc.skipT > .7) { A.stopVoice(); sc.i = sc.steps.length - 1; G.nextStep(); return; } } else sc.skipT = 0;
    const minT = .35;
    if (sc.t > minT && (I.interactP || I.attackP || I.jumpP || G.clicked)) { G.clicked = false; G.nextStep(); return; }
    const auto = st.title ? 3.2 : (sc.est || 2) + (st.glass != null ? 1.6 : 2.4);
    if (sc.t > auto + 6) G.nextStep();
  };
  G.drawScene = function (ctx) {
    const sc = G.scene, st = sc.steps[sc.i]; if (!st) return;
    const k = Math.min(1, sc.t / .5);
    if (G.w && sc.prevState === 'play' && st.say) { /* in-world dialogue: world stays visible */ }
    else { ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, W, H); }
    // letterbox 2.39:1
    const bar = (H - W / 2.39) / 2;
    if (st.glass != null) {
      const gw = 300, gh = 380, gx = W / 2 - gw / 2, gy = 26;
      const img = R.glass(st.glass, gw, gh);
      ctx.save(); ctx.globalAlpha = k;
      const lg = ctx.createRadialGradient(W / 2, gy + gh / 2, 50, W / 2, gy + gh / 2, 420); lg.addColorStop(0, 'rgba(255,230,170,.25)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, gx, gy + (1 - k) * 10);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .15 + .08 * Math.sin(R.t * 2); ctx.drawImage(img, gx, gy); ctx.restore();
      // light shafts through glass
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,230,180,${.03 + .02 * Math.sin(R.t + i)})`; ctx.beginPath(); ctx.moveTo(gx + 40 + i * 50, gy + 100); ctx.lineTo(gx - 120 + i * 110, H); ctx.lineTo(gx - 60 + i * 110, H); ctx.lineTo(gx + 70 + i * 50, gy + 100); ctx.fill(); } ctx.restore();
      ctx.font = font(20, true); const lines = wrap(ctx, PZ.tr(st.text), 760);
      lines.forEach((l, i) => txt(ctx, l, W / 2, gy + gh + 40 + i * 28, 20, '#f4e8c8', 'center', { it: true }));
    } else if (st.book) {
      parchment(ctx, 160, 40, 640, 460);
      const lines = PZ.tr(st.book).split('\n');
      let y = 100; lines.forEach((l, i) => { const vis = Math.min(1, Math.max(0, sc.t * 1.4 - i * .35)); ctx.globalAlpha = vis; if (i === 0) { txt(ctx, l, W / 2, y, 30, '#5a3a14', 'center', { shadow: false, b: true }); y += 50; } else { ctx.font = font(20, true); for (const ln of wrap(ctx, l, 520)) { txt(ctx, ln, W / 2, y, 20, '#3a2810', 'center', { it: true, shadow: false }); y += 30; } } });
      ctx.globalAlpha = 1;
      // drop cap ornament
      ctx.strokeStyle = '#8a6a30'; ctx.beginPath(); ctx.moveTo(300, 128); ctx.lineTo(660, 128); ctx.stroke();
    } else if (st.title) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const a = Math.min(1, sc.t / .8) * Math.min(1, (3.2 - sc.t) / .6 + .3);
      ctx.globalAlpha = Math.max(0, a);
      txt(ctx, PZ.tr(st.title.main), W / 2, H / 2 - 10, 54, '#ffe7a0', 'center', { b: true });
      ctx.strokeStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(W / 2 - 200 * a, H / 2 + 12); ctx.lineTo(W / 2 + 200 * a, H / 2 + 12); ctx.stroke();
      txt(ctx, PZ.tr(st.title.sub), W / 2, H / 2 + 46, 22, '#e8d8b0', 'center', { it: true });
      ctx.globalAlpha = 1;
    } else if (st.narr) {
      ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(0, 0, W, H);
      ctx.font = font(22, true); const lines = PZ.tr(st.narr).split('\n').flatMap(l => wrap(ctx, l, 720));
      lines.forEach((l, i) => { ctx.globalAlpha = Math.min(1, Math.max(0, sc.t * 1.2 - i * .5)); txt(ctx, l, W / 2, H / 2 - lines.length * 16 + i * 34, 22, '#f4e8c8', 'center', { it: true }); });
      ctx.globalAlpha = 1;
    } else if (st.tip) {
      frame(ctx, 140, 180, 680, 180);
      txt(ctx, PZ.lang === 'vi' ? 'Lời dặn' : 'Counsel', W / 2, 222, 22, '#ffe7a0', 'center', { it: true });
      ctx.font = font(18); wrap(ctx, PZ.tr(st.tip), 620).forEach((l, i) => txt(ctx, l, W / 2, 258 + i * 26, 18, '#f0e0c0', 'center'));
    } else if (st.say) {
      const sp = PZ.SPEAKERS[st.say];
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar * k); ctx.fillRect(0, H - bar * k, W, bar * k);
      const left = ['zero', 'rook', 'sable', 'mirae', 'ysolde'].includes(st.say);
      const px = left ? 170 : W - 170;
      R.portrait(ctx, st.say, st.emo, px, 230, 1.55, { speaking: true });
      frame(ctx, 60, H - 170, W - 120, 130, { bg0: 'rgba(20,14,10,.9)', bg1: 'rgba(10,8,6,.95)' });
      txt(ctx, PZ.tr(sp.name), left ? 90 : W - 90, H - 136, 22, sp.color, left ? 'left' : 'right', { b: true });
      ctx.font = font(20); const full = PZ.tr(st.text), shown = full.slice(0, Math.floor(sc.t * 45));
      wrap(ctx, shown, W - 200).forEach((l, i) => txt(ctx, l, 100, H - 102 + i * 28, 20, '#f4e8c8'));
    }
    txt(ctx, PZ.T('skip'), W - 16, H - 10, 11, 'rgba(230,210,170,.5)', 'right', { it: true });
    if (sc.t > .5 && Math.sin(R.t * 5) > 0) txt(ctx, '▾', W - 90, H - 48, 18, '#c8a050', 'center');
  };

  // ---------------- hub stations ----------------
  G.stationNear = function () { const w = G.w; if (!w || !w.stations) return null; const p = w.player; return w.stations.find(s => s.name && Math.abs(s.x - p.x) < 56) || null; };
  G.useStation = function (s) {
    const w = G.w, p = w.player, sv = G.save;
    if (s.id === 'altar') {
      const items = PZ.CHAR_ORDER.map(cid => { const d = PZ.CHARS[cid], locked = d.locked && !sv.unlockedChars.includes(cid); return { label: (locked ? '🔒 ' : '') + PZ.tr(d.name) + ' — ' + PZ.tr(d.title) + (sv.char === cid ? ' ✓' : ''), disabled: locked, act: () => { sv.char = cid; sv.flags['used_' + cid] = 1; const x = p.x; G.w = PZ.loadLevel('hub', sv, { diff: PZ.Settings.diff }); G.w.player.x = x; G.menu = null; G.saveGame(true); G.checkAchievements(); } }; });
      items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
      G.openMenu({ title: PZ.tr(s.name), items, w: 600, footer: () => PZ.tr(PZ.CHARS[sv.char].passiveName) });
    } else if (s.id === 'tree') G.treeMenu();
    else if (s.id === 'forge') G.forgeMenu();
    else if (s.id === 'codex') G.codexMenu();
    else if (s.id === 'portal') {
      const items = PZ.CHAPTERS.map(c => ({ label: `${c.n}. ${PZ.tr(c.day)} — ${PZ.tr(c.land)}${c.ready ? (sv.cleared.seraphina && c.n === 1 ? ' ✓' : '') : ' 🔒'}`, disabled: !c.ready, act: () => { G.menu = null; G.saveGame(true); G.enterChapter(c.n); } }));
      items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
      G.openMenu({ title: PZ.tr(s.name), items, w: 720, rowH: 30, footer: () => PZ.T('locked') });
    } else if (s.id === 'dummy') G.toastMsg(PZ.lang === 'vi' ? 'Đánh thử thoải mái. Bù nhìn không biết đau.' : 'Hit freely. The dummy feels no pain.');
  };
  G.skillPoints = function () { const s = G.save; const total = 2 + (s.cleared.knight ? 2 : 0) + (s.cleared.seraphina ? 3 : 0) + Object.keys(s.pages).length; const tr = s.tree[s.char] || {}; const spent = Object.values(tr).reduce((a, b) => a + b, 0); return { total, spent, free: total - spent }; };
  G.treeMenu = function () {
    const sv = G.save, cid = sv.char, d = PZ.CHARS[cid];
    const tr = () => (sv.tree[cid] = sv.tree[cid] || {});
    const items = PZ.TREE.map(b => ({ label: () => { const n = tr()[b.id] || 0; return `${PZ.tr(b.name)}  ${'◆'.repeat(n)}${'◇'.repeat(5 - n)}  ${n < 5 ? '→ ' + PZ.treeDesc(b.nodes[n]) : ''}`; }, act: () => { const n = tr()[b.id] || 0; if (n < 5 && G.skillPoints().free > 0) { tr()[b.id] = n + 1; A.sfxPlay('shard'); G.reloadHubKeep(); } else A.sfxPlay('ui'); } }));
    d.skills.forEach(sid => items.push({ label: () => `${PZ.tr(PZ.SKILLS[sid].name)}: ${PZ.tr(PZ.VARIANTS[sv.variants[sid] || 'A'].name)}`, act: () => { sv.variants[sid] = (sv.variants[sid] || 'A') === 'A' ? 'B' : 'A'; }, left: () => { sv.variants[sid] = (sv.variants[sid] || 'A') === 'A' ? 'B' : 'A'; }, right: () => { sv.variants[sid] = (sv.variants[sid] || 'A') === 'A' ? 'B' : 'A'; } }));
    items.push({ label: PZ.lang === 'vi' ? 'Đặt lại điểm (miễn phí)' : 'Respec (free)', act: () => { sv.tree[cid] = {}; G.reloadHubKeep(); } });
    items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
    G.openMenu({ title: () => `${PZ.tr(d.name)} — ${PZ.lang === 'vi' ? 'điểm còn' : 'points'}: ${G.skillPoints().free}`, items, w: 700, rowH: 30, align: 'left',
      footer: () => { const it = G.menu.items[G.menu.sel]; const i = G.menu.sel - 3; return i >= 0 && i < 3 ? PZ.tr(PZ.SKILLS[d.skills[i]].desc) : (PZ.lang === 'vi' ? 'Điểm có được từ boss và trang kinh' : 'Points come from bosses and scripture pages'); } });
  };
  G.reloadHubKeep = function () { const x = G.w.player.x; G.w = PZ.loadLevel('hub', G.save, { diff: PZ.Settings.diff }); G.w.player.x = x; };
  G.forgeMenu = function () {
    const sv = G.save, p = G.w.player;
    const items = p.weapons.map(wid => ({ label: () => { const wp = PZ.WEAPONS[wid], tier = (sv.weapons[wid] || { tier: 0 }).tier, nx = PZ.TIERS[tier + 1]; return `${PZ.tr(wp.name)} [${PZ.tr(PZ.TIERS[tier].name)}]${nx ? ` → ${PZ.tr(nx.name)}: ${nx.cost} ${PZ.T('seeds')}` : ''}`; }, act: () => { const st = sv.weapons[wid] = sv.weapons[wid] || { tier: 0 }; const nx = PZ.TIERS[st.tier + 1]; if (nx && sv.seeds >= nx.cost) { sv.seeds -= nx.cost; st.tier++; A.sfxPlay('clang'); G.toastMsg(PZ.tr(PZ.WEAPONS[wid].name) + ' → ' + PZ.tr(nx.name), nx.color); } else A.sfxPlay('ui'); } }));
    for (const rid of sv.relics) items.push({ label: () => `${sv.equippedRelics.includes(rid) ? '◆' : '◇'} ${PZ.tr(PZ.RELICS[rid].name)} — ${PZ.tr(PZ.RELICS[rid].desc)}`, act: () => { const e = sv.equippedRelics; const i = e.indexOf(rid); if (i >= 0) e.splice(i, 1); else if (e.length < 3) e.push(rid); } });
    items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
    G.openMenu({ title: () => `${PZ.lang === 'vi' ? 'Lò Rèn Tro' : 'Ash Forge'} — ${sv.seeds} ${PZ.T('seeds')}`, items, w: 760, rowH: 30, align: 'left', footer: () => { const it = p.weapons[G.menu.sel]; return it ? PZ.tr(PZ.WEAPONS[it].desc || '') : (PZ.lang === 'vi' ? 'Thánh tích: đeo tối đa 3' : 'Relics: equip up to 3'); } });
  };
  G.codexMenu = function () {
    const sv = G.save;
    const cats = Object.keys(PZ.CODEX_CATS);
    const items = cats.map(c => ({ label: () => { const n = Object.keys(sv.codex).filter(k => { const e = PZ.codexEntry(k); return e && e.cat === c; }).length; return `${PZ.tr(PZ.CODEX_CATS[c])} (${n})`; }, act: () => {
      const keys = Object.keys(sv.codex).filter(k => { const e = PZ.codexEntry(k); return e && e.cat === c; });
      const its = keys.map(k => ({ label: PZ.tr(PZ.codexEntry(k).title), act: () => { G.book = { key: k, t: 0 }; } }));
      its.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
      G.openMenu({ title: PZ.tr(PZ.CODEX_CATS[c]), items: its, w: 560, rowH: 28, dx: -180 });
    } }));
    items.push({ label: () => PZ.T('back'), act: () => G.closeMenu() });
    G.openMenu({ title: PZ.tr({ vi: 'Sách Sáng Thế Thứ Hai', en: 'The Second Genesis' }), items, w: 520 });
  };
  G.drawBook = function (ctx) {
    const b = G.book; if (!b) return; b.t += PZ.DT;
    const e = PZ.codexEntry(b.key); const flip = Math.min(1, b.t * 3);
    ctx.save(); ctx.translate(W / 2 + 150, H / 2); ctx.scale(PZ.ease(flip), 1); ctx.translate(-(W / 2 + 150), -H / 2);
    parchment(ctx, 520, 50, 400, 440);
    txt(ctx, PZ.tr(e.title), 720, 100, 22, '#5a3a14', 'center', { b: true, shadow: false });
    ctx.font = font(16, true); let y = 140; for (const l of PZ.tr(e.text).split('\n').flatMap(s => wrap(ctx, s, 340))) { txt(ctx, l, 545, y, 16, '#3a2810', 'left', { it: true, shadow: false }); y += 24; }
    ctx.restore();
  };

  // ---------------- HUD ----------------
  G.hud = function (ctx, w) {
    const p = w.player; if (!p) return;
    // portrait medallion
    ctx.save(); ctx.beginPath(); ctx.arc(52, 52, 34, 0, TAU); ctx.fillStyle = 'rgba(20,14,10,.85)'; ctx.fill(); ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 3; ctx.stroke(); ctx.clip();
    R.portrait(ctx, p.cid === 'vesper' ? 'vesper' : p.cid, p.hp < p.maxHp * .3 ? 'pain' : 'neutral', 52, 66, .45); ctx.restore();
    // hp bar
    const bx = 94, by = 26, bw = 260;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx, by, bw, 14);
    const hk = p.hp / p.maxHp; G.hpGhost = G.hpGhost == null ? hk : Math.max(hk, G.hpGhost - PZ.DT * .4);
    ctx.fillStyle = 'rgba(255,240,200,.5)'; ctx.fillRect(bx, by, bw * G.hpGhost, 14);
    const hg = ctx.createLinearGradient(0, by, 0, by + 14); hg.addColorStop(0, '#ff7a6a'); hg.addColorStop(1, '#a82a2a'); ctx.fillStyle = hg; ctx.fillRect(bx, by, bw * hk, 14);
    ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, 14);
    txt(ctx, `${Math.ceil(p.hp)} / ${p.maxHp}`, bx + bw - 4, by + 12, 11, '#fff', 'right');
    // resource bar
    let ry = by + 20;
    const bar = (k, c1, c2, label) => { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx, ry, bw * .8, 8); const g = ctx.createLinearGradient(bx, 0, bx + bw * .8, 0); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(bx, ry, bw * .8 * k, 8); ctx.strokeStyle = 'rgba(200,160,80,.7)'; ctx.strokeRect(bx, ry, bw * .8, 8); txt(ctx, label, bx + bw * .8 + 6, ry + 8, 11, '#e8d8b8'); ry += 13; };
    if (p.form) {
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(bx, ry, bw * .8, 8);
      const g = ctx.createLinearGradient(bx, 0, bx + bw * .8, 0); g.addColorStop(0, '#fff4c0'); g.addColorStop(.5, '#8a8070'); g.addColorStop(1, '#c02a4a'); ctx.fillStyle = g; ctx.fillRect(bx, ry, bw * .8, 8);
      ctx.fillStyle = '#fff'; ctx.fillRect(bx + bw * .8 * p.balance / 100 - 2, ry - 3, 4, 14);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(bx + bw * .8 * .15 - 1, ry, 2, 8); ctx.fillRect(bx + bw * .8 * .85 - 1, ry, 2, 8);
      txt(ctx, p.form === 'light' ? (PZ.lang === 'vi' ? 'Ánh Sáng' : 'Light') : (PZ.lang === 'vi' ? 'Thịnh Nộ' : 'Wrath'), bx + bw * .8 + 6, ry + 8, 11, p.form === 'light' ? '#fff4c0' : '#ff6a7a'); ry += 13;
    }
    if (p.rage != null) bar(p.rage / 100, '#ff8a3a', '#ff3a2a', PZ.lang === 'vi' ? 'Thịnh nộ' : 'Rage');
    if (p.hunger != null) bar(p.hunger / 100, '#8a2a2a', '#ff4a5a', PZ.lang === 'vi' ? 'Cơn đói' : 'Hunger');
    if (p.flight != null) bar(p.flight / 4, '#fff', '#ffb070', PZ.lang === 'vi' ? 'Bay' : 'Flight');
    // ultimate gem
    const ux = 52, uy = 104; ctx.save(); ctx.translate(ux, uy); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(-11, -11, 22, 22); ctx.fillStyle = p.ult >= 100 ? `hsl(${45 + Math.sin(R.t * 6) * 10},100%,70%)` : '#c8a050'; ctx.fillRect(-11, 11 - 22 * p.ult / 100, 22, 22 * p.ult / 100); ctx.strokeStyle = '#ffe7a0'; ctx.strokeRect(-11, -11, 22, 22); ctx.restore();
    if (p.ult >= 100) txt(ctx, 'P', ux, uy + 30, 11, '#ffe7a0', 'center');
    // skills
    const km = PZ.Settings.keys || PZ.DEFAULT_KEYS;
    p.def0.skills.forEach((sid, i) => {
      const k = 's' + (i + 1), cd = Math.max(0, p.cds[k]), full = PZ.SKILLS[sid].cd * PZ.VARIANTS[G.save.variants[sid] || 'A'].cd * (1 - p.mods.cdr);
      const x = 96 + i * 44, y = ry + 6;
      ctx.fillStyle = 'rgba(20,14,10,.8)'; ctx.fillRect(x, y, 38, 38); ctx.strokeStyle = cd > 0 ? '#6a5a3a' : '#e8c068'; ctx.lineWidth = 2; ctx.strokeRect(x, y, 38, 38);
      ctx.fillStyle = PZ.ELEMS[PZ.weaponOf(p).elem] || '#fff'; ctx.globalAlpha = cd > 0 ? .3 : .9; ctx.font = font(18, false, true); ctx.textAlign = 'center'; ctx.fillText(PZ.tr(PZ.SKILLS[sid].name)[0], x + 19, y + 26); ctx.globalAlpha = 1;
      if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.moveTo(x + 19, y + 19); ctx.arc(x + 19, y + 19, 26, -Math.PI / 2, -Math.PI / 2 + TAU * cd / full); ctx.closePath(); ctx.save(); ctx.beginPath(); ctx.rect(x, y, 38, 38); ctx.clip(); ctx.fill(); ctx.restore(); txt(ctx, cd.toFixed(cd < 1 ? 1 : 0), x + 19, y + 24, 12, '#fff', 'center'); }
      txt(ctx, PZ.keyLabel((km[k] || [])[0]), x + 34, y + 36, 9, '#c8b088', 'right');
    });
    // weapon + seeds + nyx
    const wp = PZ.weaponOf(p), tier = (G.save.weapons[p.weapons[p.wIdx]] || {}).tier || 0;
    txt(ctx, PZ.tr(wp.name), 230, ry + 22, 13, PZ.TIERS[tier].color); txt(ctx, `Q ⇄  ${p.wIdx + 1}/${p.weapons.length}`, 230, ry + 38, 11, '#b8a888');
    txt(ctx, `✿ ${G.save.seeds}`, W - 20, 30, 16, '#8aff9a', 'right');
    const ny = w.ents.find(e => e.kind === 'nyx'); if (ny) txt(ctx, `Nyx: ${PZ.tr(PZ.NYX_MODE_NAMES[ny.mode])} (N)`, W - 20, 50, 12, '#cfe8ff', 'right');
    // minimap strip
    if (!w.levelDef.arena && w.terrain.width > W * 1.5) {
      const mx = W - 220, my = 62, mw = 200, mh = 24, sc = mw / w.terrain.width;
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(mx, my, mw, mh); ctx.strokeStyle = 'rgba(200,160,80,.6)'; ctx.strokeRect(mx, my, mw, mh);
      ctx.fillStyle = 'rgba(232,210,160,.6)'; for (let c = 0; c < w.terrain.cols; c += 2) { const y0 = w.terrain.yl[c]; if (y0 === Infinity) continue; ctx.fillRect(mx + c * 32 * sc, my + mh * (y0 - 200) / 340, 2 * 32 * sc, mh - mh * (y0 - 200) / 340); }
      ctx.fillStyle = '#fff'; ctx.fillRect(mx + p.x * sc - 1.5, my + 2, 3, mh - 4);
      for (const k of w.pickups) if (k.kind === 'page' || k.kind === 'shard') { ctx.fillStyle = k.kind === 'page' ? '#f4e8c8' : '#cfe8ff'; if (Math.abs(k.x - p.x) < 400) ctx.fillRect(mx + k.x * sc - 1, my - 4, 2, 4); }
    }
    // boss bar (cinematic)
    const b = w.boss;
    if (b && !b.dead && b.state !== 'defeated') {
      const bw2 = 560, x0 = (W - bw2) / 2, y0 = H - 48;
      txt(ctx, PZ.tr(b.meta.name).split('').join(' '), W / 2, y0 - 18, 20, '#fff4d0', 'center', { b: true });
      txt(ctx, PZ.tr(b.meta.title), W / 2, y0 - 2, 12, '#d8c8a0', 'center', { it: true });
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x0, y0 + 6, bw2, 8);
      G.bossGhost = G.bossGhost == null ? 1 : Math.max(b.hp / b.maxHp, G.bossGhost - PZ.DT * .25);
      ctx.fillStyle = 'rgba(255,240,200,.6)'; ctx.fillRect(x0, y0 + 6, bw2 * G.bossGhost, 8);
      const g = ctx.createLinearGradient(x0, 0, x0 + bw2, 0); g.addColorStop(0, '#c8a040'); g.addColorStop(1, '#fff4c0'); ctx.fillStyle = g; ctx.fillRect(x0, y0 + 6, bw2 * b.hp / b.maxHp, 8);
      ctx.strokeStyle = '#c8a050'; ctx.strokeRect(x0, y0 + 6, bw2, 8);
      for (const th of (b.type === 'seraphina' ? [.66, .33] : [.5])) { ctx.fillStyle = '#1a1208'; ctx.fillRect(x0 + bw2 * th - 1, y0 + 4, 2, 12); }
      ctx.fillStyle = '#e8c068'; for (const xx of [x0 - 8, x0 + bw2 + 8]) { ctx.save(); ctx.translate(xx, y0 + 10); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
    } else G.bossGhost = null;
    // station prompt
    const s = G.stationNear(); if (s) { const sx = s.x - R.cam.x; frame(ctx, sx - 150, 380, 300, 40); txt(ctx, `${PZ.keyLabel((km.interact || [])[0])}: ${PZ.tr(s.name)}`, sx, 406, 15, '#fff4d0', 'center'); }
    // in-combat subtitles
    if (G.sub) { const sp = PZ.SPEAKERS[G.sub.who] || PZ.SPEAKERS.narrator; const a = Math.min(1, G.sub.t * 4, (G.sub.dur - G.sub.t) * 2); ctx.globalAlpha = Math.max(0, a); ctx.font = font(18, true); const line = `${PZ.tr(sp.name)}: ${PZ.tr(G.sub.text)}`; const lw = Math.min(860, ctx.measureText(line).width + 40); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect((W - lw) / 2, 120, lw, 34); txt(ctx, line, W / 2, 143, 18, sp.color, 'center', { it: true }); ctx.globalAlpha = 1; }
  };

  // banners + toasts + boss card
  G.overlays = function (ctx, dt) {
    if (R.banner) { R.banner.t += dt; const b = R.banner, a = Math.min(1, b.t * 3, (2.6 - b.t) * 2); if (b.t > 2.6) R.banner = null; else { ctx.globalAlpha = a; txt(ctx, b.s, W / 2, b.small ? 170 : 160, b.small ? 16 : 22, '#ffe7a0', 'center', { it: true }); ctx.globalAlpha = 1; } }
    G.toast = G.toast.filter(t => (t.t += dt) < 3.5);
    G.toast.forEach((t, i) => { const a = Math.min(1, t.t * 4, (3.5 - t.t) * 2); ctx.globalAlpha = a; frame(ctx, W - 380, H - 120 - i * 46, 360, 38); txt(ctx, t.s, W - 200, H - 95 - i * 46, 14, t.c, 'center'); ctx.globalAlpha = 1; });
    if (G.card) {
      G.card.t += dt; const c = G.card, k = c.t; if (k > 3.2) G.card = null; else {
        const a = Math.min(1, k * 2, (3.2 - k) * 2); const bar = 60 * Math.min(1, k * 3, (3.2 - k) * 3);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
        ctx.globalAlpha = a; txt(ctx, c.name.split('').join(' '), W / 2 + (1 - Math.min(1, k * 1.5)) * 60, H / 2 + 50, 44, '#fff4d0', 'center', { b: true });
        ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 240 * a, H / 2 + 66); ctx.lineTo(W / 2 + 240 * a, H / 2 + 66); ctx.stroke();
        txt(ctx, c.title, W / 2, H / 2 + 94, 20, '#e8d8b0', 'center', { it: true }); ctx.globalAlpha = 1;
      }
    }
  };

  // ---------------- per-frame game logic ----------------
  G.handleWorldEvents = function (w) {
    const cam = R.cam.x + W / 2;
    for (const ev of w.events) {
      R.handleEvent(ev, w);
      if (ev.t === 'sfx') { const pan = ev.pan != null ? ev.pan : (ev.x - cam) / (W / 2); A.sfxPlay(ev.id, pan, ev); if (ev.hint) R.cues.push({ t: 0, side: ev.id === 'bell' ? (ev.pan > 0 ? 1 : -1) : null, x: ev.x }); }
      else if (ev.t === 'say' && !ev.breath) { const text = PZ.tr(ev.text); if (text) { G.sub = { who: ev.who, text: ev.text, t: 0, dur: Math.max(3, text.length * .07) }; A.speak(ev.who, text); } }
      else if (ev.t === 'bossintro') { const m = PZ.BOSSES[ev.id]; G.card = { t: 0, name: PZ.tr(m.name), title: PZ.tr(m.title) }; if (ev.id === 'knight') A.play('knight', { now: false }); }
      else if (ev.t === 'phase') { if (ev.id === 'seraphina') A.setLayers(ev.phase === 2 ? [1, 1, 0, 0] : [0, 0, 1, 0]); }
      else if (ev.t === 'bossdown') { if (ev.id === 'knight') { A.play('ch1'); A.setIntensity(0); } else A.setLayers([0, 0, 1, 0]); }
      else if (ev.t === 'unlock') G.saveGame(true);
      else if (ev.t === 'checkpoint') G.saveGame(true);
      else if (ev.t === 'parry') G.save.stats.parries = (G.save.stats.parries || 0) + 1;
      else if (ev.t === 'page' || ev.t === 'shard') { G.saveGame(true); G.checkAchievements(); }
      else if (ev.t === 'cue') R.cues.push({ t: 0, side: ev.side, x: ev.x });
    }
    w.events.length = 0;
    R.cues = R.cues.filter(c => (c.t += PZ.DT) < 1.3);
  };

  G.playUpdate = function (I, dt) {
    const w = G.w;
    if (I.pauseP) { G.pauseMenu(); return; }
    if (I.nyxP) PZ.nyxCommand(w);
    if (I.interactP && G.stationNear()) { G.useStation(G.stationNear()); return; }
    w.update([I]);
    G.save.playtime += dt;
    G.handleWorldEvents(w);
    if (G.sub) { G.sub.t += dt; if (G.sub.t > G.sub.dur) G.sub = null; }
    // music intensity
    const p = w.player;
    if (w.level === 'ch1') {
      let lvl = 0; for (const e of w.ents) if (e.team === 'enemy' && !e.dead && !e.dummy) { const d = Math.abs(e.x - p.x); if (d < 600) lvl = Math.max(lvl, 1); if (e.alert && d < 400) lvl = Math.max(lvl, 2); }
      if (p.hp < p.maxHp * .25 && lvl >= 2) lvl = 3;
      if (!w.boss) A.setIntensity(lvl);
    }
    A.setFilter(p.hp < p.maxHp * .25, w.timeScale < .6);
    if (p.hp < p.maxHp * .25 && !p.dead) { G.hbT = (G.hbT || 0) - dt; if (G.hbT <= 0) { G.hbT = .85; A.sfxPlay('heartbeat'); } }
    // footsteps
    if (p.onGround && Math.abs(p.vx) > 40) { const ph = Math.floor((p.anim.run || 0) / Math.PI); if (ph !== G.stepPh) { G.stepPh = ph; A.sfxPlay(w.theme === 'garden' ? 'step_grass' : 'step_stone', 0); } }
    // flow
    if (w.scene) { const id = w.scene; w.scene = null; G.playScene(id, () => { if (w.exit) { const ex = w.exit; w.exit = null; G.enterLevel(ex); } }); return; }
    if (w.choice && G.state === 'play') { G.choiceMenu(); return; }
    if (w.over === 'dead') { G.state = 'dead'; G.deadT = 0; A.play('death', { now: true }); if (PZ.DIFFS[PZ.Settings.diff].permadeath) { G.save.flags.permadead = 1; } return; }
    if (G.save._codexNew) { const e = PZ.codexEntry(G.save._codexNew); if (e) G.toastMsg('Codex: ' + PZ.tr(e.title), '#cfe8ff'); G.save._codexNew = null; }
  };
  G.choiceMenu = function () {
    G.state = 'choice';
    G.menu = null;
    G.openMenu({ title: PZ.lang === 'vi' ? 'Seraphina quỳ xuống. Ngươi sẽ làm gì?' : 'Seraphina kneels. What will you do?', w: 640, noBack: true, items: [
      { label: () => PZ.T('spare') + (PZ.lang === 'vi' ? ' — để nàng ngủ' : ' — let her sleep'), act: () => G.choose(true) },
      { label: () => PZ.T('kill') + (PZ.lang === 'vi' ? ' — kết thúc ngày thứ nhất bằng lưỡi kiếm' : ' — end the first day with the blade'), act: () => G.choose(false) }
    ], footer: PZ.lang === 'vi' ? 'Lựa chọn này sẽ được nhớ đến ở Ngày Thứ Bảy.' : 'This choice will be remembered on the Seventh Day.' });
  };
  G.choose = function (spare) {
    const w = G.w; G.menu = null; G.state = 'play';
    PZ.resolveChoice(w, spare); G.checkAchievements(); G.saveGame(true);
    const id = w.scene; w.scene = null;
    G.playScene(id, () => { G.enterHub(false); });
  };
  G.pauseMenu = function () {
    G.state = 'pause'; G.menu = null;
    G.openMenu({ title: PZ.T('paused'), w: 420, back: () => { G.menu = null; G.state = 'play'; }, items: [
      { label: () => PZ.T('resume'), act: () => { G.menu = null; G.state = 'play'; } },
      { label: () => PZ.T('options'), act: () => G.optionsMenu() },
      { label: () => PZ.T('codex'), act: () => G.codexMenu() },
      { label: () => PZ.T('tohub'), disabled: G.w.level === 'hub', act: () => { G.menu = null; G.saveGame(true); G.enterHub(false); } },
      { label: () => PZ.T('totitle'), act: () => { G.saveGame(true); G.menu = null; G.toTitle(); } }
    ] });
  };
  G.toTitle = function () { G.state = 'title'; G.w = null; A.play('title'); A.setIntensity(0); G.titleMenu(); };

  // ---------------- main loop ----------------
  G.draw = function (dt) {
    const ctx = R.ctx; ctx.setTransform(G.scale, 0, 0, G.scale, 0, 0);
    if (G.state === 'boot') return G.drawBoot(ctx);
    if (G.state === 'title' || (G.state === 'scene' && !G.w)) { G.drawTitleBg(ctx, dt); if (G.state === 'title') { G.drawLogo(ctx); G.drawMenu(ctx); G.overlays(ctx, dt); } }
    if (G.w && G.state !== 'title') { R.frame(G.w, (G.state === 'play') ? dt * G.w.timeScale : 0); ctx.setTransform(G.scale, 0, 0, G.scale, 0, 0); if (G.state !== 'scene') G.hud(ctx, G.w); }
    if (G.state === 'scene') G.drawScene(ctx);
    if (G.state === 'pause' || G.state === 'choice') { G.drawMenu(ctx); G.drawBook(ctx); }
    if (G.state === 'play' && G.menu) { G.drawMenu(ctx); G.drawBook(ctx); }
    if (G.state === 'dead') G.drawDead(ctx, dt);
    if (G.state !== 'title') G.overlays(ctx, dt);
    if (G.showFps) txt(ctx, (G.fps | 0) + ' fps', 8, H - 8, 11, '#8f8');
  };
  G.drawBoot = function (ctx) {
    ctx.fillStyle = '#0a0806'; ctx.fillRect(0, 0, W, H);
    txt(ctx, 'PROJECT ZERO II', W / 2, H / 2 - 40, 46, '#ffe7a0', 'center', { b: true });
    txt(ctx, 'G E N E S I S', W / 2, H / 2, 24, '#e8d8b0', 'center', { it: true });
    if (Math.sin(performance.now() / 300) > -.3) txt(ctx, PZ.lang === 'vi' ? 'Nhấn phím bất kỳ hoặc chạm để bắt đầu (nên đeo tai nghe)' : 'Press any key or tap to begin (headphones recommended)', W / 2, H / 2 + 80, 16, '#c8b898', 'center', { it: true });
  };
  G.titleWorld = null;
  G.drawTitleBg = function (ctx, dt) {
    if (!G.titleWorld) { G.titleWorld = new PZ.World(PZ.newSave(), { diff: 1 }); G.titleWorld.theme = 'dawn'; G.titleWorld.terrain.flat(200); }
    const tw = G.titleWorld; tw.t += dt; R.t += dt;
    R.sky(ctx, tw); for (const L of R.layers.dawn) { const lw = L.c.width; let ox = -(((R.t * 30) * L.f) % lw); for (let x = ox; x < W; x += lw) ctx.drawImage(L.c, x, 0); }
    ctx.fillStyle = 'rgba(20,10,0,.25)'; ctx.fillRect(0, 0, W, H);
    // falling feathers
    for (let i = 0; i < 18; i++) { const x = (PZ.hash(i, 3) * W + Math.sin(R.t * .7 + i) * 40), y = ((PZ.hash(i, 4) * H + R.t * (20 + i * 2)) % (H + 40)) - 20; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(R.t + i) * .8); ctx.fillStyle = 'rgba(255,250,235,.7)'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2.4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.drawImage(R.vig, 0, 0);
  };
  G.drawLogo = function (ctx) {
    const a = Math.min(1, R.t / 2);
    ctx.globalAlpha = a;
    txt(ctx, 'PROJECT ZERO II', W / 2, 150, 60, '#fff4d0', 'center', { b: true });
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .25 * a; txt(ctx, 'PROJECT ZERO II', W / 2, 150, 60, '#ffd772', 'center', { b: true, shadow: false }); ctx.restore(); ctx.globalAlpha = a;
    txt(ctx, 'G  E  N  E  S  I  S', W / 2, 196, 28, '#ffe7a0', 'center', { it: true });
    txt(ctx, PZ.lang === 'vi' ? '— Sách Sáng Thế Thứ Hai —' : '— The Second Book of Genesis —', W / 2, 232, 16, '#f0dcb0', 'center', { it: true });
    txt(ctx, 'v' + PZ.VERSION + (PZ.lang === 'vi' ? ' · bản thử M1' : ' · M1 test build'), W - 12, H - 10, 11, 'rgba(255,240,210,.6)', 'right');
    ctx.globalAlpha = 1;
  };
  G.drawDead = function (ctx, dt) {
    G.deadT += dt; const a = Math.min(1, G.deadT / 1.2);
    ctx.fillStyle = `rgba(10,4,4,${.75 * a})`; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a; txt(ctx, PZ.T('dead'), W / 2, H / 2 - 20, 42, '#d84a3a', 'center', { b: true });
    const perma = PZ.DIFFS[PZ.Settings.diff].permadeath;
    txt(ctx, perma ? (PZ.lang === 'vi' ? 'Độ khó Phán Xét: hành trình kết thúc.' : 'Judgment difficulty: the journey ends.') : (PZ.lang === 'vi' ? 'Nhấn E / Enter để ' : 'Press E / Enter to ') + (perma ? '' : PZ.T('retry').toLowerCase()), W / 2, H / 2 + 30, 18, '#f0d0c0', 'center', { it: true });
    ctx.globalAlpha = 1;
  };

  G.resize = function () {
    const cv = R.cv; const fit = Math.min(innerWidth / W, innerHeight / H);
    const dpr = devicePixelRatio || 1, q = PZ.Settings.gfx === 'high' ? 2 : PZ.Settings.gfx === 'med' ? 1.5 : 1;
    G.scale = Math.max(1, Math.min(q, fit * dpr));
    cv.width = Math.round(W * G.scale); cv.height = Math.round(H * G.scale);
    cv.style.width = Math.floor(W * fit) + 'px'; cv.style.height = Math.floor(H * fit) + 'px';
    R.ctx = cv.getContext('2d');
  };

  G.boot = function () {
    const cv = document.getElementById('game');
    R.init(cv); G.resize(); addEventListener('resize', G.resize);
    const start = () => { if (G.state !== 'boot') return; A.init(); G.state = 'title'; R.t = 0; A.play('title', { now: true }); G.titleMenu(); };
    addEventListener('keydown', start); addEventListener('pointerdown', start);
    cv.addEventListener('pointerdown', () => { G.clicked = true; });
    addEventListener('keydown', e => { if (e.code === 'F3') G.showFps = !G.showFps; });
    let last = performance.now(), acc = 0, fpsAcc = 0, fpsN = 0;
    const loop = now => {
      const dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt;
      fpsAcc += dt; fpsN++; if (fpsAcc > .5) { G.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
      // fixed-step simulation, variable render
      let steps = 0;
      while (acc >= PZ.DT && steps < 4) { G.tick(); acc -= PZ.DT; steps++; }
      if (steps === 4) acc = 0;
      G.draw(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    if (speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = () => { };
  };
  G.tick = function () {
    const I = Inp.read();
    G.t += PZ.DT;
    if (G.state === 'title') { G.menuInput(I); return; }
    if (G.state === 'scene') { G.sceneUpdate(I, PZ.DT); return; }
    if (G.state === 'pause' || G.state === 'choice') { if (G.book) { if (I.pauseP || I.dashP || I.interactP || I.attackP) G.book = null; return; } G.menuInput(I); return; }
    if (G.state === 'dead') {
      if (G.deadT > 1 && (I.interactP || I.attackP || I.jumpP)) {
        if (PZ.DIFFS[PZ.Settings.diff].permadeath) { G.toTitle(); return; }
        const w = G.w; if (w.levelDef.arena) G.enterLevel(w.level); else { PZ.respawnPlayer(w, w.player); if (w.boss && w.boss.type === 'knight') { w.boss.hp = w.boss.maxHp; w.boss.phase = 1; w.boss.x = w.lock.x0 + 760; w.boss.state = 'intro'; w.boss.st = 1; } G.state = 'play'; A.play(w.boss ? 'knight' : PZ.LEVELS[w.level].music, { now: true }); }
      }
      return;
    }
    if (G.state === 'play') {
      if (G.menu) { if (G.book) { if (I.pauseP || I.dashP || I.interactP || I.attackP) G.book = null; return; } G.menuInput(I); return; }
      G.playUpdate(I, PZ.DT);
    }
  };
})(globalThis.PZ);
