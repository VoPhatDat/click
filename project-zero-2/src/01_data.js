'use strict';
(function (PZ) {
  // ===================== CHARACTERS =====================
  PZ.CHARS = {
    zero: {
      name: { vi: 'Zero', en: 'Zero' }, title: { vi: 'Kẻ Mang Ngày Thứ Bảy', en: 'Bearer of the Seventh Day' },
      hp: 150, speed: 260, jump: 640, airJumps: 1, armor: 0,
      pal: { skin: '#e9d2b8', armor: '#c9b98f', trim: '#ffd772', cape: '#e8e2d0', hair: '#f2efe6', glow: '#fff1b8' },
      weapons: ['aocalyst', 'judgment', 'chain'], skills: ['twin', 'forgive', 'genstep'], ult: 'firstday', passive: 'balance',
      passiveName: { vi: 'Cân Bằng: Ánh Sáng ⇄ Thịnh Nộ', en: 'Balance: Light ⇄ Wrath' }
    },
    rook: {
      name: { vi: 'Rook', en: 'Rook' }, title: { vi: 'Chiến Tranh', en: 'War' },
      hp: 210, speed: 215, jump: 580, airJumps: 0, armor: .2,
      pal: { skin: '#b98a6a', armor: '#8a3a2a', trim: '#e0a040', cape: '#5a1a14', hair: '#2a1a12', glow: '#ff8a4a' },
      weapons: ['bulwark', 'doomhammer', 'lance'], skills: ['command', 'rift', 'stand'], ult: 'lastbattle', passive: 'rage',
      passiveName: { vi: 'Thịnh Nộ Chiến Trường', en: 'Battlefield Rage' }
    },
    sable: {
      name: { vi: 'Sable', en: 'Sable' }, title: { vi: 'Tử Thần', en: 'Death' },
      hp: 120, speed: 300, jump: 680, airJumps: 2, armor: 0,
      pal: { skin: '#d8d4dc', armor: '#2a2a38', trim: '#9a8cff', cape: '#14141e', hair: '#e8e8f0', glow: '#b8a8ff' },
      weapons: ['shadowblades', 'soulscythe', 'mutebow'], skills: ['swap', 'knell', 'veil'], ult: 'verdict', passive: 'mark',
      passiveName: { vi: 'Dấu Ấn Tử', en: 'Death Mark' }
    },
    mirae: {
      name: { vi: 'Mirae', en: 'Mirae' }, title: { vi: 'Dịch Bệnh', en: 'Pestilence' },
      hp: 125, speed: 240, jump: 620, airJumps: 1, armor: 0,
      pal: { skin: '#e6d6c2', armor: '#3c5a2a', trim: '#b8e060', cape: '#22341a', hair: '#6a2a5a', glow: '#c8ff70' },
      weapons: ['serpentstaff', 'censer', 'flasks'], skills: ['butterflies', 'parasite', 'serum'], ult: 'plague', passive: 'twofaced',
      passiveName: { vi: 'Hai Mặt: thuốc và độc', en: 'Two Faces: cure and poison' }
    },
    ysolde: {
      name: { vi: 'Ysolde', en: 'Ysolde' }, title: { vi: 'Nạn Đói', en: 'Famine' },
      hp: 135, speed: 275, jump: 640, airJumps: 1, armor: 0,
      pal: { skin: '#c8b89a', armor: '#3a2a1a', trim: '#c8a050', cape: '#2a1a10', hair: '#1a1410', glow: '#ff5a5a' },
      weapons: ['twinsickles', 'thornwhip', 'fangs'], skills: ['devour', 'wither', 'feast'], ult: 'greatfamine', passive: 'hunger',
      passiveName: { vi: 'Cơn Đói', en: 'Hunger' }
    },
    vesper: {
      name: { vi: 'Vesper', en: 'Vesper' }, title: { vi: 'Thiên Thần Bị Thiêu', en: 'The Burned Angel' },
      hp: 140, speed: 255, jump: 600, airJumps: 0, armor: 0, locked: true,
      pal: { skin: '#f0e0d0', armor: '#d8c8a0', trim: '#ffcf6a', cape: '#3a3030', hair: '#f6f0e8', glow: '#ff7a3a' },
      weapons: ['brokenspear', 'ashwings', 'holycenser'], skills: ['spearrain', 'deniedprayer', 'ashrebirth'], ult: 'secondheaven', passive: 'flight',
      passiveName: { vi: 'Bay (4 giây)', en: 'Flight (4s)' }
    }
  };
  PZ.CHAR_ORDER = ['zero', 'rook', 'sable', 'mirae', 'ysolde', 'vesper'];

  // ===================== WEAPONS =====================
  // hit: d dmg, r reach, h height, t duration, at active time, lunge, kb, kind melee|spin|proj|zone|pull
  const M = (d, r, h, t, at, o) => Object.assign({ d, r, h, t, at, kind: 'melee', lunge: 0, kb: 120 }, o || {});
  PZ.WEAPONS = {
    aocalyst: { name: { vi: 'Kiếm Aocalyst', en: 'Aocalyst Blade' }, desc: { vi: 'Thanh kiếm cũ nay đã nứt. Chém nhanh.', en: 'The old blade, now cracked. Fast cuts.' }, owner: 'zero', shape: 'sword', sfx: 'sword', elem: 'light', len: 46,
      combo: [M(11, 62, 56, .24, .08, { lunge: 120 }), M(11, 62, 56, .24, .08, { lunge: 120 }), M(13, 66, 64, .28, .1, { lunge: 160 }), M(15, 70, 70, .3, .1, { lunge: 160 }), M(24, 86, 84, .42, .16, { lunge: 260, kb: 340 })] },
    judgment: { name: { vi: 'Đại Đao Phán Xét', en: 'Greatblade of Judgment' }, desc: { vi: 'Chém nặng, phá giáp.', en: 'Heavy cuts that break armor.' }, owner: 'zero', shape: 'greatsword', sfx: 'heavy', elem: 'light', len: 70, armorBreak: 2,
      combo: [M(26, 88, 80, .5, .22, { lunge: 90, kb: 260 }), M(30, 92, 90, .55, .24, { lunge: 110, kb: 300 }), M(48, 110, 120, .75, .34, { lunge: 160, kb: 480, shake: 8 })] },
    chain: { name: { vi: 'Xích Sáng Thế', en: 'Chain of Genesis' }, desc: { vi: 'Tầm trung. Kéo kẻ địch lại gần; nhát cuối tự kéo mình đi.', en: 'Mid range. Pulls foes in; the last link pulls you along.' }, owner: 'zero', shape: 'chain', sfx: 'chain', elem: 'light', len: 30,
      combo: [M(10, 150, 30, .32, .12, { kb: -200 }), M(10, 150, 30, .32, .12, { kb: -200 }), M(18, 190, 34, .45, .16, { kind: 'pull', kb: -420 })] },

    bulwark: { name: { vi: 'Khiên Tường Thành', en: 'Rampart Shield' }, desc: { vi: 'Giữ nút đánh để giơ khiên; đập khiên làm choáng.', en: 'Bash to stun; heavy guard.' }, owner: 'rook', shape: 'shield', sfx: 'shield', elem: 'fire', len: 40, guard: .6,
      combo: [M(14, 58, 70, .34, .12, { lunge: 160, stun: .4 }), M(14, 58, 70, .34, .12, { lunge: 160 }), M(26, 70, 80, .5, .2, { lunge: 260, stun: .9, kb: 380 })] },
    doomhammer: { name: { vi: 'Búa Tận Thế', en: 'Doom Hammer' }, desc: { vi: 'Đập xuống tạo sóng chấn động.', en: 'Slams send out shockwaves.' }, owner: 'rook', shape: 'hammer', sfx: 'heavy', elem: 'fire', len: 64, armorBreak: 1,
      combo: [M(24, 80, 80, .5, .24, { kb: 260 }), M(28, 84, 84, .55, .26, { kb: 280 }), M(40, 90, 70, .8, .38, { shake: 10, wave: { v: 520, life: .7, d: 22 } })] },
    lance: { name: { vi: 'Thương Kỵ Binh', en: 'Cavalry Lance' }, desc: { vi: 'Đâm xa; nhát cuối lao xuyên đội hình.', en: 'Long thrusts; the last one charges through ranks.' }, owner: 'rook', shape: 'spear', sfx: 'spear', elem: 'fire', len: 90,
      combo: [M(15, 104, 30, .34, .12, { lunge: 90 }), M(15, 104, 30, .34, .12, { lunge: 90 }), M(30, 120, 40, .6, .1, { lunge: 720, pierce: true, kb: 300 })] },

    shadowblades: { name: { vi: 'Song Đao Bóng', en: 'Twin Shadow Daggers' }, desc: { vi: 'Năm nhát chém cực nhanh.', en: 'Five lightning-fast cuts.' }, owner: 'sable', shape: 'daggers', sfx: 'dagger', elem: 'shadow', len: 26,
      combo: [M(7, 50, 50, .14, .05, { lunge: 140 }), M(7, 50, 50, .14, .05, { lunge: 140 }), M(8, 52, 50, .16, .05, { lunge: 160 }), M(8, 52, 50, .16, .05), M(16, 64, 60, .3, .1, { lunge: 300, kb: 260 })] },
    soulscythe: { name: { vi: 'Lưỡi Hái Linh Hồn', en: 'Soul Scythe' }, desc: { vi: 'Đánh vòng tròn quanh mình, hút hồn hồi máu.', en: 'Circular sweeps that drain souls.' }, owner: 'sable', shape: 'scythe', sfx: 'scythe', elem: 'shadow', len: 66, lifesteal: .12,
      combo: [M(14, 84, 84, .4, .16, { kind: 'spin' }), M(14, 84, 84, .4, .16, { kind: 'spin' }), M(26, 104, 104, .6, .24, { kind: 'spin', kb: 300 })] },
    mutebow: { name: { vi: 'Nỏ Câm', en: 'Silent Crossbow' }, desc: { vi: 'Bắn xa không tiếng động. Nhát cuối xuyên thấu.', en: 'Silent long shots. The last pierces.' }, owner: 'sable', shape: 'crossbow', sfx: 'bow', elem: 'shadow', len: 34,
      combo: [M(12, 0, 0, .3, .08, { kind: 'proj', proj: { v: 900, life: .9, size: 6 } }), M(12, 0, 0, .3, .08, { kind: 'proj', proj: { v: 900, life: .9, size: 6 } }), M(22, 0, 0, .5, .14, { kind: 'proj', proj: { v: 1100, life: 1, size: 8, pierce: 4 } })] },

    serpentstaff: { name: { vi: 'Trượng Rắn', en: 'Serpent Staff' }, desc: { vi: 'Phun độc thành tia; độc lan sang kẻ gần.', en: 'Spits venom bolts.' }, owner: 'mirae', shape: 'staff', sfx: 'magic', elem: 'poison', len: 70, poison: 4,
      combo: [M(8, 0, 0, .3, .1, { kind: 'proj', proj: { v: 620, life: .8, size: 9 } }), M(8, 0, 0, .3, .1, { kind: 'proj', proj: { v: 620, life: .8, size: 9 } }), M(14, 0, 0, .45, .16, { kind: 'proj', proj: { v: 520, life: 1, size: 14, home: 3 } })] },
    censer: { name: { vi: 'Lư Hương', en: 'Thurible' }, desc: { vi: 'Đánh vung và để lại vùng khói độc.', en: 'Swings leave poison smoke.' }, owner: 'mirae', shape: 'censer', sfx: 'chain', elem: 'poison', len: 60, poison: 3,
      combo: [M(10, 70, 60, .34, .14, { kind: 'spin' }), M(10, 70, 60, .34, .14, { kind: 'spin' }), M(8, 60, 60, .5, .2, { kind: 'zone', zone: { r: 90, life: 3, dps: 10, slow: .3 } })] },
    flasks: { name: { vi: 'Bình Thuốc Ném', en: 'Thrown Flasks' }, desc: { vi: 'Ném bình vỡ tung; bình thuốc hồi máu khi rơi gần mình.', en: 'Lobbed flasks burst.' }, owner: 'mirae', shape: 'flask', sfx: 'glass', elem: 'poison', len: 14, poison: 5,
      combo: [M(12, 0, 0, .36, .12, { kind: 'proj', proj: { v: 520, vy: -380, grav: 1400, life: 1.4, size: 8, burst: 70 } }), M(12, 0, 0, .36, .12, { kind: 'proj', proj: { v: 600, vy: -320, grav: 1400, life: 1.4, size: 8, burst: 70 } }), M(20, 0, 0, .5, .16, { kind: 'proj', proj: { v: 420, vy: -480, grav: 1400, life: 1.6, size: 11, burst: 110, heal: 6 } })] },

    twinsickles: { name: { vi: 'Lưỡi Liềm Đôi', en: 'Twin Sickles' }, desc: { vi: 'Bốn nhát móc xé, hút máu.', en: 'Four ripping hooks that drink blood.' }, owner: 'ysolde', shape: 'sickles', sfx: 'dagger', elem: 'blood', len: 34, lifesteal: .1,
      combo: [M(10, 58, 56, .2, .07, { lunge: 140 }), M(10, 58, 56, .2, .07, { lunge: 140 }), M(12, 60, 60, .24, .08, { lunge: 160 }), M(20, 70, 70, .38, .14, { lunge: 260, kb: 280 })] },
    thornwhip: { name: { vi: 'Roi Gai', en: 'Thorn Whip' }, desc: { vi: 'Quất tầm xa, gây chảy máu.', en: 'Long lashes that cause bleeding.' }, owner: 'ysolde', shape: 'whip', sfx: 'whip', elem: 'blood', len: 40, bleed: 4,
      combo: [M(12, 170, 26, .34, .14), M(12, 170, 26, .34, .14), M(22, 200, 40, .5, .2, { kb: 300 })] },
    fangs: { name: { vi: 'Nanh Vuốt', en: 'Fang & Claw' }, desc: { vi: 'Hóa thú: cào cực nhanh, tầm ngắn.', en: 'Beast form: frantic short claws.' }, owner: 'ysolde', shape: 'claws', sfx: 'claw', elem: 'blood', len: 20, lifesteal: .06,
      combo: [M(6, 46, 50, .11, .04, { lunge: 100 }), M(6, 46, 50, .11, .04, { lunge: 100 }), M(6, 46, 50, .11, .04), M(7, 48, 50, .12, .04), M(16, 56, 60, .26, .08, { lunge: 340, kb: 240 })] },

    brokenspear: { name: { vi: 'Thương Ánh Sáng Gãy', en: 'Broken Spear of Light' }, owner: 'vesper', shape: 'spear', sfx: 'spear', elem: 'light', len: 80,
      combo: [M(14, 96, 36, .3, .1), M(14, 96, 36, .3, .1), M(26, 0, 0, .5, .14, { kind: 'proj', proj: { v: 1000, life: .8, size: 9, pierce: 9, returns: true } })] },
    ashwings: { name: { vi: 'Cánh Tro', en: 'Ash Wings' }, owner: 'vesper', shape: 'wings', sfx: 'scythe', elem: 'fire', len: 50,
      combo: [M(12, 80, 70, .3, .1, { kind: 'spin' }), M(12, 80, 70, .3, .1, { kind: 'spin' }), M(24, 100, 90, .5, .2, { kind: 'spin', kb: 320 })] },
    holycenser: { name: { vi: 'Lư Hương Thánh', en: 'Holy Censer' }, owner: 'vesper', shape: 'censer', sfx: 'magic', elem: 'fire', len: 50,
      combo: [M(10, 0, 0, .26, .08, { kind: 'proj', proj: { v: 760, life: .8, size: 7 } }), M(10, 0, 0, .26, .08, { kind: 'proj', proj: { v: 760, life: .8, size: 7 } }), M(18, 0, 0, .4, .12, { kind: 'proj', proj: { v: 700, life: .9, size: 10, spread: 3 } })] },

    // ---- boss weapons (universal) ----
    goldthread: { name: { vi: 'Sợi Chỉ Vàng Seraphina', en: "Seraphina's Golden Thread" }, desc: { vi: 'Roi chỉ vàng. Nhát cuối khâu mắt kẻ địch: choáng 1 giây.', en: 'A whip of golden thread. Finisher stitches eyes shut: 1s stun.' }, owner: '*', boss: 'seraphina', shape: 'whip', sfx: 'whip', elem: 'light', len: 40,
      combo: [M(13, 180, 30, .32, .12), M(13, 180, 30, .32, .12), M(20, 210, 44, .48, .18, { stun: 1 })] }
  };
  PZ.TIERS = [
    { id: 0, name: { vi: 'Thường', en: 'Common' }, mul: 1, color: '#c8c8c8', cost: 0 },
    { id: 1, name: { vi: 'Hiếm', en: 'Rare' }, mul: 1.15, color: '#6ab0ff', cost: 3 },
    { id: 2, name: { vi: 'Thánh', en: 'Holy' }, mul: 1.32, color: '#ffe27a', cost: 6 },
    { id: 3, name: { vi: 'Huyền Thoại', en: 'Legendary' }, mul: 1.52, color: '#ff9a3a', cost: 10 },
    { id: 4, name: { vi: 'Sáng Thế', en: 'Genesis' }, mul: 1.8, color: '#ffffff', cost: 16 }
  ];
  PZ.ELEMS = { light: '#fff0b0', fire: '#ff7a3a', water: '#6ac8ff', shadow: '#9a7aff', void: '#c050ff', poison: '#b8ff60', blood: '#ff4a5a' };

  // ===================== SKILLS (logic lives in sim) =====================
  const S = (vi, en, cd, dvi, den) => ({ name: { vi, en }, cd, desc: { vi: dvi, en: den } });
  PZ.SKILLS = {
    twin: S('Lưỡi Kép', 'Twin Edge', 9, 'Gọi bóng của mình chém cùng trong 6 giây.', 'A shadow-self mirrors your cuts for 6s.'),
    forgive: S('Tha Thứ', 'Forgiveness', 5, 'Đỡ hoàn hảo trong 0.35s: chặn đòn, hồi máu, làm choáng.', 'Perfect parry for 0.35s: block, heal, stun.'),
    genstep: S('Bước Sáng Thế', 'Genesis Step', 3.5, 'Lướt xa, vệt sáng để lại gây sát thương.', 'Long dash; the trail burns foes.'),
    firstday: S('Ngày Đầu Tiên', 'The First Day', 0, 'Trắng xóa, rồi 7 nhát chém mang màu 7 vùng đất.', 'White-out, then seven cuts in the seven colors.'),
    command: S('Hiệu Lệnh', 'Command', 14, 'Gọi bóng 3 binh sĩ chiến đấu cùng 10 giây.', 'Summon 3 shadow soldiers for 10s.'),
    rift: S('Đất Nứt', 'Earth Rift', 7, 'Đập đất, vết nứt lửa chạy dọc mặt đất.', 'Slam the ground; a burning rift runs forward.'),
    stand: S('Không Lùi Bước', 'No Retreat', 16, 'Đứng yên: miễn sát thương 3 giây.', 'Stand still: immune for 3s.'),
    lastbattle: S('Trận Chiến Cuối Cùng', 'The Last Battle', 0, 'Đạo quân bóng ma xung phong qua màn hình.', 'A ghost army charges across the screen.'),
    swap: S('Đổi Chỗ Bóng', 'Shadow Swap', 4, 'Dịch chuyển ra sau kẻ địch gần nhất.', 'Teleport behind the nearest foe.'),
    knell: S('Chuông Báo Tử', 'Death Knell', 8, 'Kích nổ mọi Dấu Ấn; quái máu dưới 20% chết ngay.', 'Detonate all marks; foes under 20% die.'),
    veil: S('Ẩn Thân', 'Veil', 12, 'Tàng hình 4 giây; nhát đầu gây gấp ba.', 'Invisible 4s; first strike deals triple.'),
    verdict: S('Giờ Phán Quyết', 'Hour of Verdict', 0, 'Thời gian dừng lại; Sable chém tất cả.', 'Time stops; Sable cuts everyone.'),
    butterflies: S('Bầy Bướm Độc', 'Venom Moths', 6, '6 con bướm tự tìm mục tiêu.', '6 homing moths.'),
    parasite: S('Ký Sinh', 'Parasite', 15, 'Điều khiển con quái gần nhất trong 10 giây.', 'Turn the nearest foe to your side for 10s.'),
    serum: S('Huyết Thanh', 'Serum', 11, 'Hồi máu theo thời gian cho bạn và đồng minh.', 'Heal over time for you and allies.'),
    plague: S('Đại Dịch', 'The Great Plague', 0, 'Sương độc phủ màn hình; quái chết trong đó thành đồng minh.', 'Poison fog; the dead rise as allies.'),
    devour: S('Nuốt Chửng', 'Devour', 6, 'Cắn kẻ gần nhất, hút máu và xóa buff.', 'Bite, drain, strip buffs.'),
    wither: S('Mùa Màng Khô Héo', 'Withered Harvest', 10, 'Vùng làm chậm và rút máu.', 'A zone that slows and drains.'),
    feast: S('Bữa Tiệc Cuối', 'Last Feast', 20, 'Hồi đầy máu, tốn nửa thanh đói.', 'Full heal; costs half your hunger.'),
    greatfamine: S('Nạn Đói Vĩ Đại', 'The Great Famine', 0, 'Mọi kẻ địch mất 30% máu, chuyển sang Ysolde.', 'All foes lose 30% HP to Ysolde.'),
    spearrain: S('Mưa Thương', 'Spear Rain', 7, 'Thương ánh sáng rơi quanh kẻ địch.', 'Spears of light rain down.'),
    deniedprayer: S('Lời Cầu Nguyện Bị Từ Chối', 'Denied Prayer', 10, 'Vòng lửa quanh mình.', 'A ring of fire around you.'),
    ashrebirth: S('Hồi Sinh Tro', 'Ash Rebirth', 0, 'Nội tại: chết thì sống lại 1 lần.', 'Passive: revive once.'),
    secondheaven: S('Thiên Đàng Thứ Hai', 'The Second Heaven', 0, 'Mở cánh trắng, bắn hàng trăm tia sáng.', 'White wings; hundreds of rays.')
  };
  // Variants: each skill has A/B choice
  PZ.VARIANTS = {
    A: { name: { vi: 'Biến thể A: Uy lực', en: 'Variant A: Power' }, dmg: 1.35, cd: 1 },
    B: { name: { vi: 'Biến thể B: Nhanh', en: 'Variant B: Swift' }, dmg: .9, cd: .7 }
  };
  // Skill tree: 3 branches, 5 nodes each (cost 1 pt each, sequential)
  PZ.TREE = [
    { id: 'might', name: { vi: 'Sức Mạnh', en: 'Might' }, nodes: [{ dmg: .06 }, { dmg: .06 }, { crit: .06 }, { dmg: .08 }, { ultCharge: .25 }] },
    { id: 'grace', name: { vi: 'Ân Điển', en: 'Grace' }, nodes: [{ cdr: .06 }, { speed: .05 }, { cdr: .06 }, { dashCd: .2 }, { skillDmg: .2 }] },
    { id: 'faith', name: { vi: 'Đức Tin', en: 'Faith' }, nodes: [{ hp: .08 }, { def: .06 }, { hp: .08 }, { regen: 1 }, { def: .1 }] }
  ];
  PZ.treeDesc = n => {
    const k = Object.keys(n)[0], v = n[k];
    const L = { dmg: ['Sát thương', 'Damage'], crit: ['Chí mạng', 'Crit'], ultCharge: ['Nạp tuyệt kỹ', 'Ult charge'], cdr: ['Hồi chiêu', 'Cooldown'], speed: ['Tốc độ', 'Speed'], dashCd: ['Hồi lướt', 'Dash cooldown'], skillDmg: ['Sát thương kỹ năng', 'Skill damage'], hp: ['Máu', 'HP'], def: ['Phòng thủ', 'Defense'], regen: ['Hồi máu/giây', 'Regen/s'] }[k];
    return (PZ.lang === 'vi' ? L[0] : L[1]) + ' +' + (v < 1 ? Math.round(v * 100) + '%' : v);
  };

  // ===================== RELICS =====================
  PZ.RELICS = {
    mirrorparry: { name: { vi: 'Gương Đỡ', en: 'Parry Mirror' }, desc: { vi: 'Đỡ hoàn hảo bắn ra tia sáng.', en: 'Perfect parries fire a ray.' } },
    emberheart: { name: { vi: 'Tim Than Hồng', en: 'Ember Heart' }, desc: { vi: 'Đòn thứ 5 liên tiếp gây cháy.', en: 'Every 5th hit ignites.' } },
    quietbell: { name: { vi: 'Chuông Lặng', en: 'Quiet Bell' }, desc: { vi: '+15% sát thương khi máu đầy.', en: '+15% damage at full HP.' } }
  };

  // ===================== ENEMIES =====================
  PZ.ENEMIES = {
    sleepless: { name: { vi: 'Thiên Thần Mất Ngủ', en: 'Sleepless Angel' }, desc: { vi: 'Không ngủ từ ngày đầu tiên. Lao thẳng vào bất cứ thứ gì chuyển động.', en: 'Has not slept since the first day. Charges at anything that moves.' }, hp: 42, dmg: 14, ai: 'charger', fly: true, w: 18, h: 44, speed: 140, xp: 6, color: '#fff4d8' },
    lantern: { name: { vi: 'Đèn Lồng Sống', en: 'Living Lantern' }, desc: { vi: 'Một ngọn đèn không bao giờ được tắt. Nổ chói mắt khi lại gần.', en: 'A lamp never allowed to go out. Bursts blindingly when close.' }, hp: 26, dmg: 24, ai: 'bomber', fly: true, w: 16, h: 26, speed: 95, xp: 4, color: '#ffcf5a' },
    forbidden: { name: { vi: 'Bóng Bị Cấm', en: 'Forbidden Shadow' }, desc: { vi: 'Bóng tối bị cấm tồn tại trong thành phố. Chỉ ánh sáng làm nó đau thật sự.', en: 'Darkness forbidden in the city. Only light truly hurts it.' }, hp: 60, dmg: 16, ai: 'stalker', w: 20, h: 58, speed: 120, xp: 8, color: '#18141e', lightOnly: true },
    choir: { name: { vi: 'Ca Viên Không Mắt', en: 'Eyeless Chorister' }, desc: { vi: 'Hát thánh ca không ngừng; tiếng hát bắn thành vòng sáng.', en: 'Sings without rest; its hymn becomes rings of light.' }, hp: 48, dmg: 12, ai: 'caster', w: 18, h: 56, speed: 60, xp: 7, color: '#e8dcc0' }
  };
  PZ.ELITE = { hp: 2.4, dmg: 1.4, name: { vi: 'Tinh Anh', en: 'Elite' } };

  // ===================== BOSSES (meta) =====================
  PZ.BOSSES = {
    knight: { name: { vi: 'HIỆP SĨ KHÔNG BÓNG', en: 'THE SHADOWLESS KNIGHT' }, title: { vi: 'Kẻ Gác Cổng Bình Minh', en: 'Warden of the Dawn Gate' }, hp: 1100, mini: true, track: 'knight',
      desc: { vi: 'Hắn đã đứng gác dưới nắng quá lâu đến mức cái bóng bỏ hắn mà đi.', en: 'He stood watch in the sun so long his shadow left him.' } },
    seraphina: { name: { vi: 'SERAPHINA', en: 'SERAPHINA' }, title: { vi: 'Nữ Thần Ánh Sáng Mù', en: 'The Blind Goddess of Light' }, hp: 2300, female: true, track: 'seraphina',
      desc: { vi: 'Sáu cánh. Đôi mắt bị khâu bằng chỉ vàng để không bao giờ phải nhìn thấy bóng tối. Cô ta là ngày thứ nhất, và ngày thứ nhất không biết đến đêm.', en: 'Six wings. Eyes sewn shut with gold thread so she would never see the dark. She is the first day, and the first day knows no night.' } }
  };
})(globalThis.PZ);
