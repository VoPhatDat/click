# Ghi chú đọc hiểu phần 1 (Project Zero: Aocalyst)

Viết trước khi sửa code phần 2. Bản gốc phần 1 nằm nguyên trong `../ProjectZero_Aocalyst/`.
Trước khi sửa, đã chạy trên bản sao: `node tools/smoke.js` (ALL PASSED) và `node tools/e2e.js` (CAMPAIGN COMPLETED).

## 1. Kiến trúc

- Classic script, biến toàn cục, không module. Thứ tự nạp trong `index.html`:
  `core, lang_vi, audio, music, rig, world, vfx, chars, combat, player, enemy, boss, looks, finale, levels, render, story, game, ui, main`.
  `tools/harness.js` có mảng `ORDER` giống hệt (thiếu `main`); `tools/build.js` thay mọi `<script src="js/x.js">` bằng nội dung file.
- Màn hình ảo cố định 1280×720 (`VW`, `VH`), `TILE = 32`, `GRAV = .6`. Logic chạy bước cố định 60 Hz trong `Game.frame`.
- Đối tượng toàn cục chính:
  - `G`: trạng thái thế giới (level, player, enemies, projs, warns, fields, scripts, camera, cờ cutscene) và các dịch vụ (`say`, `toast`, `spawn`, `runScript`, `startBoss`).
  - `Game`: vòng lặp, máy trạng thái (`title`, `menu`, `cine`, `play`, `pause`, `loading`), luồng chiến dịch.
  - `Save`: dữ liệu lưu (`Store`, khóa `pz_aocalyst_save_v1`).
  - `Scene.draw`: ghép một khung hình. `UI`: menu DOM. `HUD`: HUD trên canvas.
- `Script` (core.js) chạy generator: `yield n` chờ n tick, `yield fn` chờ tới khi `fn()` đúng. Boss, kỹ năng, cutscene, ambush đều viết bằng generator.
- Nạp màn: `Game.loadLevel(id)` gọi `LEVELS[id]()` (một builder `LB`), dựng `Level`, `Dyn`, đối tượng, spawn và checkpoint (beacon).
- Vật lý: `Phys.move(e)`. Thực thể dùng `x` là tâm, `y` là chân. Lực ngoài đi qua `Player.push` để không xuyên tường.

## 2. Định dạng dữ liệu

- **Level** (`levels.js`, class `LB`): `at(x,y).flat(n).up(n).down(n).upS/downS(n).gap(n, hazard)`, `plat`, `mover`, `crumble`, `breakable`, `gate`, `e(type,x,y)`, `obj(kind,x,y,{...})` (npc, lore, chest, lever, rune, beacon, exit, door, cryo), `say(x,y,speaker,text)`, `trig`, `ambush`, `deco`, `light`, `bossArena(bossId,x0,x1,y,sx,sy,{trigger})`, `done()`. Đơn vị là tile. Mỗi level có `theme` trong `THEMES`, `bg` là id của `Backdrop`, `next`, `weather`.
- **Quái** (`enemy.js`): `ENEMIES[type] = { name, ai, body, hp, dmg, spd, xp, w, h, poise, col:{a,b,g,s}, gear, atks:[A.*] }`. AI có các loại `melee, fast, ranged, heavy, flyer, support, elite, static, burrow`. Đòn tấn công lấy từ bảng `A` (`bite, swipe, pounce, shot, lob, slam, charge, burst, missile, heal, summon, ring`). Hình dạng: `Bodies[body]`, riêng thân `human` dùng rig.
- **Boss** (`boss.js`): `{ id, name, title, hp, w, h, col, music, reward, init, aim, box, parts, tick, phases:[{at, moves, rest, say, enter*}], moves:{ *move(b) }, death*, draw }`. `Boss.brain` bốc thăm move theo phase. Đòn phải báo trước bằng `Combat.warn({shape: rect|circle|cone|safe, t, dmg})`.
- **Cutscene** (`story.js`): `CUTS[id] = function*(c)` chạy bằng `Cine` với `c.shot(Stage.x)`, `c.actor(charId,x,y,facing,clip)`, `c.say(name,text,frames)`, `c.verse(text,ref,frames)`, `c.title`, `c.fade`. Có `LORE`, `NPCS`, `BOSS_INTRO`.
- **Nhạc** (`music.js`): `TRACKS[id] = { arr, bpm, key, oct, scale, prog, steps, mel, keep }`. Mỗi `Arr[name](m)` là bộ phối theo thể loại, gọi mỗi bước 1/16. Nhạc cụ trong `Inst` (pluck Karplus-Strong, choir formant, organ, strings, brass, bell, taiko...). Nhạc có tầng (stem) theo trạng thái `calm, combat, elite, boss, critical`. **Chủ đề chính phần 1** là `THEME = ['4-----5-4---2---', '3-----4-3---0---', '2---3---5---4---', '6-------4-------']`, dùng lại trong `wrath` và `ending`.
- **Âm thanh** (`audio.js`): `Sound.sfx(name, {v, p, pan})`, `Sound.at(name, x)` (tự pan theo camera), bảng `SFX` có khoảng 60 hiệu ứng.
- **Bản dịch**: `tr(s)` tra `VI[s]` theo câu gốc tiếng Anh. `tools/i18n.js` liệt kê câu thiếu bản dịch.
- **Nhân vật** (`chars.js`): frame data `atks.a1..aN {s, a, r, box, dmg, kb, stag, next, wind, str}`, `heavy`, `chargeAtk`, `skills.s1/s2 {name, desc, cost, cd, *run(p)}`, `ult *run`, `upgrades`, `style` (rig, gear painter).

## 3. Cốt truyện phần 1 theo code

- "Sách của Zero" kể theo lối kinh thánh. Viên đá Aocalyst, năm vùng đất, năm ấn.
- Meridian Accord và Giám đốc **Thane** đào giếng Bore dưới Kalder, tìm thấy **cái Ngai**. Ngai đòi một con chiên: kẻ vô danh bị đánh số **Zero**.
- Ngày Phán Xét: Zero bị xé đôi. Thân xác bị đông lạnh ở trạm Nadir, cơn thịnh nộ thành **Endbringer**. Dr. **Voss** cắt Catalyst làm ba mảnh: đỏ, lục, lam.
- Ba mươi năm sau, Zero tỉnh dậy trong một bộ giáp "mơ ra". Tứ Kỵ Sĩ đi theo:
  - **Rook Adeyemi**, Chiến Tranh: kỹ sư trưởng, búa.
  - **Sable Vu**, Tử Thần: người đưa thư, song đao.
  - **Mirae Sol**, Dịch Bệnh: nhà nghiên cứu catalyst, phép nguyên tố.
  - **Ysolde Varr**, Nạn Đói: Warden của tuyến tàu Meridian Line, khiên và kiếm.
- 5 boss: ATLAS-9, Sylvaris, Qareth, Nadir, Vulkaris.
- **VESPER** trong code là "Meridian Line dispatch", lõi điều phối của tuyến tàu. Hồ sơ ở Nadir ghi lõi này **bị thiêu trong đám cháy Halcyon ngày đầu tiên**. Giọng nói dẫn đường là Endbringer. Ở cảnh mở đầu, giọng ấy xưng là "the evening star, the last voice left in heaven".
- Kết: Zero tha thứ cho cơn thịnh nộ của mình ("There were always two of us"), tự bước tới bàn thờ ("a lamb that walks to the altar on its own feet"), khép Sách lại. Lõi ổn định, trời mới đất mới.
- Sau credits: lõi điều phối Vesper thật khởi động lại dưới đáy biển Sael ("This is Vesper. The real one."). Zero đáp: "...Copy, dispatch. Still here."

### Chỗ bản tóm tắt trong prompt khác code (theo yêu cầu: lấy code)

| Prompt | Code phần 1 | Cách phần 2 xử lý |
|---|---|---|
| Zero cầm kiếm sáng | Zero dùng **pháo tay** (arm cannon), giáp đen, kính cyan, áo choàng đỏ | Giữ ngoại hình. Kiếm Aocalyst được **rèn lại từ ánh sáng của pháo tay**, nên Kiếm và Xích có nguồn gốc từ pháo |
| Vesper là thiên thần 6 cánh | Vesper là **lõi điều phối** bị thiêu ngày đầu và tự xưng "sao hôm" | Thế giới mới được viết theo Sách, nên ẩn dụ thành thật: giọng tự xưng sao hôm trở thành một thiên thần 6 cánh bị thiêu. Twist 1: chính lõi Vesper đã xin "dồn tải neo qua ta" thay cho đứa trẻ, bị Thane từ chối rồi đốt |
| Ysolde hút máu, Mirae phép độc | Ysolde là Warden cầm khiên, Mirae dùng 3 nguyên tố | Kỹ năng phần 2 làm mới theo prompt, mỗi kỹ năng có câu giải thích nó tiến hóa từ phần 1 |
| Zero "ngồi lên Ngai" | Zero "bước tới bàn thờ" và khép Lõi | Dùng chữ "Ngai" như phần 1 vẫn gọi |

## 4. Kế hoạch mở rộng (file mới, theo đúng mẫu cũ)

File mới nạp **sau `ui.js`, trước `main.js`**, và được thêm vào `index.html` cùng `tools/harness.js`:

| File | Mở rộng gì | Theo mẫu |
|---|---|---|
| `js/g2_core.js` | Khóa save mới, cờ phần 2 (tha/giết, Mảnh Bình Yên, trang kinh), phát hiện save phần 1, phím mới `skill3`, `form`, `weapon`, `nyx` | `Store`, `Save.fresh`, `DEFAULT_BINDS` |
| `js/g2_chars.js` | Bộ kỹ năng mới cho 5 nhân vật, 3 vũ khí mỗi người, kỹ năng thứ 3, cơ chế riêng (Cân Bằng, Thịnh Nộ, Dấu Ấn, hai mặt, Cơn Đói), Nyx | frame data `atks`, generator skill, `Gear` |
| `js/g2_enemies.js` | Quái chương 1 | `ENEMIES`, `A`, `Bodies` |
| `js/g2_bosses.js` | Hiệp Sĩ Không Bóng, Seraphina (bóng cột, nguồn sáng giả, phase mù), lựa chọn tha hoặc giết | `B_*` generator, `Combat.warn` thêm hình `light` |
| `js/g2_levels.js` | Vườn Sáng Thế, Thành Phố Bình Minh, Thánh Đường, theme, backdrop | `LB`, `THEMES`, `Backdrop.build` |
| `js/g2_story.js` | Cutscene mở đầu kể lại phần 1 bằng chính `Stage` cũ, Sách Sáng Thế Thứ Hai, cảnh chương 1, trang kinh (`LORE`), NPC | `CUTS`, `Cine`, `Stage`, `LORE`, `NPCS`, `BOSS_INTRO` |
| `js/g2_music.js` | Chủ đề Genesis chơi chồng được lên `THEME`, nhạc khu vườn, Bình Minh (6/8 Rê Lydian), Hiệp Sĩ, Seraphina (Requiem) | `Arr`, `TRACKS`, `Inst` |
| `js/g2_ui.js` | Màn hình chính phần 2, bảng Bảy Ngày (thay hub), màn hình tha/giết, HUD 3 kỹ năng, thanh Cân Bằng | `UI.screens`, `HUD` |
| `js/g2_lang.js` | Bản dịch tiếng Việt cho mọi câu mới | `VI` |

Test: mở rộng `smoke.js` (thêm level mới), `e2e.js` (chiến dịch phần 2 M1), `bossbot.js` (boss mới), `i18n.js` (quét file `g2_*`).

## 5. Âm nhạc phần 1 (để phần 2 không dùng lại)

Tất cả nhạc là `Arr[name](m)` trong `js/music.js`, phát theo stem calm / combat / elite / boss / critical (`STEM_MIX`).

| Track | Arranger | BPM | Khóa / điệu | Vòng hợp âm | Ghi chú |
|---|---|---|---|---|---|
| cathedral, menu | cathedral | 48 | D minor | 0 0 5 5 3 3 4 4 | pad, chuông kim loại |
| city | city | 74 | C minor | 0 5 3 4 2 5 1 4 | swing, lead |
| forest | forest | 92 | E dorian | 0 3 0 6 2 6 3 4 | 12 bước (nhịp ba), taiko |
| desert | desert | 108 | A hijaz | 0 0 0 0 | arp, taiko |
| ice | ice | 50 | B minor | 0 0 5 5 3 3 4 4 | choir, pad |
| volcano | volcano | 96 | D minor | 0 0 5 6 0 0 3 4 | ostinato, taiko |
| boss | boss | 152 | C harmonic minor | 0 0 5 4 | 14 bước, heavy |
| finalboss | finalboss | 164 | D minor | 0 0 5 6 3 3 4 4 | heavy |
| wrath | wrath | 132 | D harmonic minor | 0 5 3 4 0 5 1 4 | choir, brass |
| ending | ending | 62 | F major | 0 4 5 2 3 0 3 4 | chủ đề THEME |
| train | train | 80 | G dorian | 0 3 0 4 | post-credits |

`tools/music_check.js` kiểm tra rằng không track nào của phần 2 dùng lại các arranger hay vòng hợp âm trên.
