# DEVLOG — Project Zero II: Genesis

## M1 (v0.1.0) — engine, Vườn Sáng Thế, Chương 1, Seraphina

### Đã làm
- **Engine**: phần mô phỏng (`src/00–06`) tách khỏi phần vẽ (`07`, `09`) và âm thanh (`08`), nên chạy được trong Node để test. Bước thời gian cố định 60 Hz. Địa hình có dốc, vực, tường lướt, bục một chiều.
- **Nhân vật**: Zero (Ánh Sáng/Thịnh Nộ + Cân Bằng), Rook (Thịnh Nộ Chiến Trường), Sable (Dấu Ấn Tử), Mirae (thuốc/độc), Ysolde (Cơn Đói), Vesper (bay, đang khóa). Mỗi người có 3 vũ khí, 3 kỹ năng (biến thể A/B), tuyệt kỹ, cây kỹ năng 3 nhánh có respec. Tổng cộng 19 vũ khí, tính cả vũ khí rơi từ Seraphina.
- **Nyx**: hồi máu, chỉ chỗ trang kinh ẩn, 3 lệnh Bám sát / Tấn công / Trốn.
- **Chương 1**: 4 loại quái (Thiên Thần Mất Ngủ, Đèn Lồng Sống, Bóng Bị Cấm, Ca Viên Không Mắt) cùng bản tinh anh, mini-boss Hiệp Sĩ Không Bóng, 4 trang kinh, 1 Mảnh Bình Yên.
- **Seraphina**: phase 1 đứng vào bóng cột, phase 2 nguồn sáng giả, phase 3 màn hình tối và né theo chuông định vị trái/phải. Kết trận được chọn tha hay giết.
- **Cốt truyện**: cutscene mở đầu kể lại phần 1 bằng kính màu, Sách Sáng Thế Thứ Hai, các cảnh của chương 1, Codex, thành tựu.
- **Âm thanh**: toàn bộ tự tổng hợp bằng WebAudio, gồm 8 bài nhạc, nhạc phân tầng và chuyển bài khớp ô nhịp.
- **Build**: `node tools/build.js` → `dist/ProjectZero2_Genesis.html` (một file, chạy offline).

### Kiểm thử (`node tools/test.js all`)
- Smoke: mọi màn và mọi nhân vật bấm đủ mọi nút đều không lỗi.
- E2E: hub → chương 1 → Hiệp Sĩ → Seraphina → tha / giết → hub đều đạt.
- Bot đánh boss: 6 nhân vật × 2 boss, mỗi cặp 3 trận, cặp nào cũng thắng ít nhất 1 trận (xem số liệu trong lần chạy).
- Soak: 30 phút mô phỏng (108 000 khung hình) không crash, không rò thực thể, không NaN.
- Ảnh chụp bằng Chromium (`node tools/shots.js` → `shots/`): không có lỗi JS.

### Chưa kiểm chứng
- **Nhạc chưa được người thật nghe kiểm tra.** Âm lượng từng bài chưa được đo.
- Độ khó mới được bot kiểm tra, chưa có người chơi thật.
- Chưa đo FPS trên máy tầm trung thật.
- Lồng tiếng dùng Web Speech: có giọng tiếng Việt hay không là tùy máy. Khẩu hình suy ra từ chữ, không phải từ âm thanh, vì âm thanh TTS không đưa vào WebAudio được.
- Chưa có điều khiển cảm ứng nên chưa chơi được trên điện thoại.
- Bot trong soak test chạy nhanh hơn thời gian thực rất nhiều. Đây là 30 phút mô phỏng chứ không phải 30 phút chạy trong trình duyệt.
