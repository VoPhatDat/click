'use strict';
// ===== Levels: Vườn Sáng Thế (hub), Chương 1, đấu trường Seraphina =====
(function (PZ) {
  const T = PZ.TILE;

  PZ.CHAPTERS = [
    { n: 1, day: { vi: 'Ngày Thứ Nhất — Ánh Sáng', en: 'The First Day — Light' }, land: { vi: 'Thành Phố Bình Minh Vĩnh Cửu', en: 'City of Eternal Dawn' }, level: 'ch1', ready: true, color: '#ffe9a8' },
    { n: 2, day: { vi: 'Ngày Thứ Hai — Nước', en: 'The Second Day — Water' }, land: { vi: 'Biển Lệ', en: 'The Sea of Tears' }, color: '#6ac8ff' },
    { n: 3, day: { vi: 'Ngày Thứ Ba — Đất và Cây', en: 'The Third Day — Land and Tree' }, land: { vi: 'Rừng Ký Ức', en: 'Forest of Memory' }, color: '#7ae07a' },
    { n: 4, day: { vi: 'Ngày Thứ Tư — Tinh Tú', en: 'The Fourth Day — Stars' }, land: { vi: 'Đài Thiên Văn Vỡ', en: 'The Broken Observatory' }, color: '#c8b0ff' },
    { n: 5, day: { vi: 'Ngày Thứ Năm — Muông Thú', en: 'The Fifth Day — Beasts' }, land: { vi: 'Hoang Mạc Bầy Đàn', en: 'Desert of the Pack' }, color: '#ffb050' },
    { n: 6, day: { vi: 'Ngày Thứ Sáu — Con Người', en: 'The Sixth Day — Mankind' }, land: { vi: 'Thủ Đô Meridian Mới', en: 'New Meridian' }, color: '#c0c8d8' },
    { n: 7, day: { vi: 'Ngày Thứ Bảy — Nghỉ Ngơi', en: 'The Seventh Day — Rest' }, land: { vi: 'Ngai Trống', en: 'The Empty Throne' }, color: '#ffffff' }
  ];

  PZ.LEVELS = {};

  // ---------------- HUB ----------------
  PZ.LEVELS.hub = {
    name: { vi: 'Vườn Sáng Thế', en: 'Garden of Genesis' }, theme: 'garden', music: 'hub',
    build(w) {
      const t = w.terrain; t.cur = 460;
      t.flat(10).slope(4, -8).flat(10).slope(4, 8).flat(16).slope(3, -8).flat(14).slope(3, 8).flat(16);
      w.worldH = 600;
      w.stations = [
        { id: 'altar', x: 260, name: { vi: 'Bàn Thờ Kỵ Sĩ — đổi nhân vật', en: 'Knights’ Altar — change hero' } },
        { id: 'tree', x: 560, name: { vi: 'Cây Ân Điển — kỹ năng', en: 'Tree of Grace — skills' } },
        { id: 'forge', x: 900, name: { vi: 'Lò Rèn Tro — vũ khí, thánh tích', en: 'Ash Forge — weapons, relics' } },
        { id: 'codex', x: 1180, name: { vi: 'Sách Sáng Thế Thứ Hai — Codex', en: 'The Second Genesis — Codex' } },
        { id: 'dummy', x: 1480, name: { vi: 'Bù nhìn luyện tập', en: 'Training dummy' } },
        { id: 'portal', x: 1900, name: { vi: 'Cổng Bảy Ngày', en: 'Gate of Seven Days' } },
        { id: 'statue', x: 1700, name: null }
      ];
      w.checkpoint = { x: 140, y: 460 };
      const d = PZ.spawnEnemy(w, 'dummy', 1480); Object.assign(d, { hp: 99999, maxHp: 99999, dummy: true, color: '#b89a6a', w: 26, h: 64 }); d.def = { ai: 'dummy' };
      PZ.AI.dummy = (w, e) => { e.vx = 0; e.hp = Math.min(e.maxHp, e.hp + 5000 * PZ.DT); };
    }
  };

  // ---------------- CHAPTER 1 ----------------
  PZ.LEVELS.ch1 = {
    name: { vi: 'Thành Phố Bình Minh Vĩnh Cửu', en: 'City of Eternal Dawn' }, theme: 'dawn', music: 'ch1', chapter: 1,
    build(w) {
      const t = w.terrain; t.cur = 460; w.worldH = 600;
      const S = (type, c, o) => PZ.spawnEnemy(w, type, c * T + 16, null, o);
      const C = () => t.cols;
      // --- Section A: Đại lộ Không Đêm (the Sleepless Avenue)
      t.flat(16);
      w.triggers.push({ x: 7 * T, fn: w => { w.scene = 'ch1_talk1'; } });
      t.slope(4, -16).flat(8); S('sleepless', C() - 4);
      t.slope(4, 16).flat(8); S('choir', C() - 3);
      // pit with platforms
      const pitC = C(); t.pit(6); t.plat(pitC + 1, 410, 2); t.plat(pitC + 4, 380, 2); t.flat(10); S('sleepless', C() - 6); S('lantern', C() - 2);
      w.triggers.push({ x: (C() - 8) * T, fn: w => { w.checkpoint = { x: w.player.x, y: w.player.y }; w.emit({ t: 'checkpoint' }); } });
      // --- Section B: Bức Tường Nắng (wall-jump climb) with hidden page above
      t.cliff(-96).flat(6); const wallC = C();
      t.plat(wallC - 3, 250, 3); w.pickups.push({ kind: 'page', id: 'p1_1', x: (wallC - 1.5) * T, y: 226 });
      t.cliff(-96).flat(10); S('choir', C() - 4); S('lantern', C() - 7);
      t.slope(6, 16).flat(4).slope(6, 16).flat(12); S('sleepless', C() - 8); S('sleepless', C() - 4, { elite: true });
      w.triggers.push({ x: (C() - 10) * T, fn: w => { w.scene = 'ch1_talk2'; } });
      // --- Section C: Hẻm Bóng Cấm (forbidden shadows — use Light form)
      t.flat(6); w.triggers.push({ x: C() * T, fn: w => { w.checkpoint = { x: w.player.x, y: w.player.y }; w.emit({ t: 'checkpoint' }); w.scene = 'ch1_talk3'; } });
      t.flat(18); S('forbidden', C() - 14); S('forbidden', C() - 8); S('lantern', C() - 5);
      t.slope(4, -16).flat(4); const hc = C(); t.plat(hc - 2, 300, 4); w.pickups.push({ kind: 'page', id: 'p1_2', x: (hc) * T, y: 276 });
      t.slope(4, 16).flat(14); S('forbidden', C() - 10, { elite: true }); S('choir', C() - 3);
      // --- Section D: Mái Vòm Không Ngủ (pits, hidden shard)
      const p2 = C(); t.pit(4); t.plat(p2 + 1, 400, 2); t.flat(6); t.pit(5); t.plat(C() - 4, 390, 3); t.flat(8); S('sleepless', C() - 4); S('lantern', C() - 2);
      // shard: high platforms reachable by double jump chain
      const sc = C(); t.flat(14); t.plat(sc + 2, 360, 2); t.plat(sc + 5, 290, 2); t.plat(sc + 8, 220, 2);
      w.pickups.push({ kind: 'shard', id: 'shard_1', x: (sc + 9) * T, y: 196 });
      w.pickups.push({ kind: 'page', id: 'p1_3', x: (sc + 12) * T, y: 420 });
      S('choir', sc + 12); S('forbidden', sc + 6);
      w.triggers.push({ x: sc * T, fn: w => { w.checkpoint = { x: w.player.x, y: w.player.y }; w.emit({ t: 'checkpoint' }); } });
      // --- Section E: Cổng Bình Minh — knight arena
      t.flat(6); const ac = C(); t.flat(30);
      w.triggers.push({ x: (ac + 4) * T, fn: w => { w.lock = { x0: ac * T, x1: ac * T + 960 }; w.minX = ac * T; w.maxX = ac * T + 960; w.scene = 'ch1_knight'; w.checkpoint = { x: (ac + 4) * T, y: 460 }; PZ.spawnKnight(w, ac * T + 760); } });
      // --- Section F: the cathedral stair
      t.slope(10, -12).flat(10); w.pickups.push({ kind: 'page', id: 'p1_4', x: (C() - 5) * T, y: t.cur - 24 }); S('choir', C() - 2, { elite: true });
      t.flat(14);
      w.triggers.push({ x: (C() - 6) * T, fn: w => { w.exit = 'ch1_boss'; w.scene = 'ch1_preboss'; } });
      w.checkpoint = { x: 80, y: 460 };
    }
  };

  // ---------------- SERAPHINA ARENA ----------------
  PZ.LEVELS.ch1_boss = {
    name: { vi: 'Thánh Đường Không Bóng', en: 'Cathedral Without Shadow' }, theme: 'cathedral', music: 'seraphina', chapter: 1, arena: true,
    build(w) {
      const t = w.terrain; t.cur = 460; t.flat(30); w.worldH = 600;
      t.pillars = [{ x: 200, w: 44, top: 250 }, { x: 480, w: 44, top: 250 }, { x: 760, w: 44, top: 250 }];
      w.minX = 0; w.maxX = 960; w.checkpoint = { x: 120, y: 460 };
      w.startBoss = () => PZ.spawnSeraphina(w);
    }
  };

  // ---------------- loader ----------------
  PZ.loadLevel = function (id, save, opts) {
    opts = opts || {};
    const L = PZ.LEVELS[id];
    const w = new PZ.World(save, opts);
    w.level = id; w.levelDef = L; w.theme = L.theme;
    L.build(w);
    const party = opts.party || [save.char];
    party.forEach((cid, i) => { const p = PZ.makePlayer(w, cid, save, i); p.id = w.nextId++; p.x = w.checkpoint.x + i * 30; p.y = w.surf(p.x); w.players.push(p); });
    if (id !== 'hub' || true) PZ.spawnNyx(w);
    // remove already-collected pickups
    w.pickups = w.pickups.filter(k => !((k.kind === 'page' && save.pages[k.id]) || (k.kind === 'shard' && save.shards[k.id])));
    if (w.startBoss && !opts.noBoss) w.startBoss();
    return w;
  };
})(globalThis.PZ);
