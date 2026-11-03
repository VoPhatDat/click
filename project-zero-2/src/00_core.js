'use strict';
// ===== PROJECT ZERO II: GENESIS — core (shared by browser + Node tests) =====
var PZ = globalThis.PZ = globalThis.PZ || {};
PZ.VERSION = '0.1.0-M1';
PZ.W = 960; PZ.H = 540; PZ.DT = 1 / 60; PZ.TILE = 32;
PZ.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

PZ.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
PZ.lerp = (a, b, t) => a + (b - a) * t;
PZ.sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
PZ.ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
PZ.rng = function (seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
};
PZ.hash = function (x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---------- language ----------
PZ.lang = 'vi';
PZ.tr = function (o) {
  if (o == null) return '';
  if (typeof o === 'string') return o;
  return o[PZ.lang] || o.vi || '';
};
PZ.UI_TEXT = {
  continue: { vi: 'Tiếp tục', en: 'Continue' }, newgame: { vi: 'Hành trình mới', en: 'New Journey' },
  load: { vi: 'Tải hành trình', en: 'Load Journey' }, options: { vi: 'Tùy chọn', en: 'Options' },
  music: { vi: 'Phòng Nhạc', en: 'Music Room' }, codex: { vi: 'Codex', en: 'Codex' },
  lang: { vi: 'Ngôn ngữ: Tiếng Việt', en: 'Language: English' }, back: { vi: 'Quay lại', en: 'Back' },
  slot: { vi: 'Ô lưu', en: 'Slot' }, empty: { vi: '— trống —', en: '— empty —' },
  paused: { vi: 'TẠM DỪNG', en: 'PAUSED' }, resume: { vi: 'Tiếp tục', en: 'Resume' },
  tohub: { vi: 'Về Vườn Sáng Thế', en: 'Return to the Garden' }, totitle: { vi: 'Về màn hình chính', en: 'Title screen' },
  volMusic: { vi: 'Âm lượng nhạc', en: 'Music volume' }, volSfx: { vi: 'Âm lượng hiệu ứng', en: 'SFX volume' },
  volVoice: { vi: 'Âm lượng giọng nói', en: 'Voice volume' }, gfx: { vi: 'Đồ họa', en: 'Graphics' },
  diff: { vi: 'Độ khó', en: 'Difficulty' }, hints: { vi: 'Gợi ý hình ảnh cho âm thanh', en: 'Visual sound cues' },
  keys: { vi: 'Đổi phím', en: 'Rebind keys' }, shake: { vi: 'Rung màn hình', en: 'Screen shake' },
  low: { vi: 'Thấp', en: 'Low' }, med: { vi: 'Trung', en: 'Medium' }, high: { vi: 'Cao', en: 'High' },
  on: { vi: 'Bật', en: 'On' }, off: { vi: 'Tắt', en: 'Off' },
  pressKey: { vi: 'Nhấn phím mới… (Esc để hủy)', en: 'Press a new key… (Esc cancels)' },
  spare: { vi: 'Tha thứ', en: 'Spare' }, kill: { vi: 'Kết liễu', en: 'Strike down' },
  dead: { vi: 'NGƯƠI ĐÃ NGÃ XUỐNG', en: 'YOU HAVE FALLEN' }, retry: { vi: 'Đứng dậy lần nữa', en: 'Rise again' },
  interact: { vi: 'Tương tác', en: 'Interact' }, locked: { vi: 'Chưa mở — sẽ có ở mốc tiếp theo', en: 'Locked — coming in the next milestone' },
  seeds: { vi: 'Hạt Giống', en: 'Seeds' }, saved: { vi: 'Đã lưu', en: 'Saved' }, skip: { vi: 'Giữ Esc / Start để bỏ qua', en: 'Hold Esc / Start to skip' },
  page: { vi: 'Trang kinh', en: 'Scripture page' }, shard: { vi: 'Mảnh Bình Yên', en: 'Shard of Peace' },
  checkpoint: { vi: 'Điểm hồi sinh', en: 'Checkpoint' }, cutscenes: { vi: 'Xem lại cutscene', en: 'Replay cutscenes' },
  credits: { vi: 'Lời cảm ơn', en: 'Credits' }
};
PZ.T = k => PZ.tr(PZ.UI_TEXT[k]) || k;

// ---------- difficulty ----------
PZ.DIFFS = [
  { id: 'story', name: { vi: 'Kể Chuyện', en: 'Story' }, dmgTaken: .45, enemyHp: .7 },
  { id: 'normal', name: { vi: 'Thường', en: 'Normal' }, dmgTaken: 1, enemyHp: 1 },
  { id: 'apoc', name: { vi: 'Khải Huyền', en: 'Apocalypse' }, dmgTaken: 1.5, enemyHp: 1.3 },
  { id: 'judge', name: { vi: 'Phán Xét (1 mạng)', en: 'Judgment (1 life)' }, dmgTaken: 1.6, enemyHp: 1.35, permadeath: true }
];

// ---------- storage (try/catch, memory fallback for Node / private mode) ----------
PZ.Store = {
  mem: {},
  get(k) { try { if (globalThis.localStorage) { const v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); } } catch (e) { } return this.mem[k] == null ? null : JSON.parse(this.mem[k]); },
  set(k, v) { const s = JSON.stringify(v); try { if (globalThis.localStorage) { localStorage.setItem(k, s); return true; } } catch (e) { } this.mem[k] = s; return true; }
};
PZ.SAVE_SLOTS = 3;
PZ.newSave = function () {
  return {
    v: 1, created: Date.now(), playtime: 0, ng: 0,
    char: 'zero', unlockedChars: ['zero', 'rook', 'sable', 'mirae', 'ysolde'],
    chapter: 1, cleared: {}, flags: {}, spared: {}, killed: {},
    pages: {}, shards: {}, codex: {}, seeds: 0, endings: {},
    weapons: {}, equip: {}, relics: [], equippedRelics: [],
    skillPts: {}, tree: {}, variants: {}, stats: { skillUse: {}, deaths: 0, kills: 0 },
    music: { title: 1 }, achievements: {}, checkpoint: null
  };
};
PZ.Settings = Object.assign({
  music: .7, sfx: .8, voice: .9, gfx: 'med', lang: 'vi', diff: 1, hints: true, shake: true, keys: null
}, PZ.Store.get('pz2_settings') || {});
PZ.saveSettings = () => PZ.Store.set('pz2_settings', PZ.Settings);
PZ.lang = PZ.Settings.lang;

// ---------- input: actions abstracted so bots can drive the same sim ----------
PZ.ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'dash', 's1', 's2', 's3', 'ult', 'form', 'weapon', 'interact', 'nyx', 'pause'];
PZ.DEFAULT_KEYS = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyK'], attack: ['KeyJ'], dash: ['KeyL', 'ShiftLeft'], s1: ['KeyU'], s2: ['KeyI'], s3: ['KeyO'],
  ult: ['KeyP'], form: ['Tab', 'KeyF'], weapon: ['KeyQ'], interact: ['KeyE', 'Enter'], nyx: ['KeyN'], pause: ['Escape']
};
PZ.ACTION_NAMES = {
  left: { vi: 'Trái', en: 'Left' }, right: { vi: 'Phải', en: 'Right' }, up: { vi: 'Lên', en: 'Up' }, down: { vi: 'Xuống', en: 'Down' },
  jump: { vi: 'Nhảy', en: 'Jump' }, attack: { vi: 'Đánh', en: 'Attack' }, dash: { vi: 'Lướt', en: 'Dash' },
  s1: { vi: 'Kỹ năng 1', en: 'Skill 1' }, s2: { vi: 'Kỹ năng 2', en: 'Skill 2' }, s3: { vi: 'Kỹ năng 3', en: 'Skill 3' },
  ult: { vi: 'Tuyệt kỹ', en: 'Ultimate' }, form: { vi: 'Đổi dạng', en: 'Switch form' }, weapon: { vi: 'Đổi vũ khí', en: 'Switch weapon' },
  interact: { vi: 'Tương tác', en: 'Interact' }, nyx: { vi: 'Lệnh cho Nyx', en: 'Command Nyx' }, pause: { vi: 'Tạm dừng', en: 'Pause' }
};
PZ.makeIntent = function () { const o = {}; for (const a of PZ.ACTIONS) { o[a] = false; o[a + 'P'] = false; } o.idle = 0; return o; };
