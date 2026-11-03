# Project Zero II: Genesis, nhật ký phát triển

## M1 (bản hiện tại, 2.0.0-M1)

**Nền tảng:** dựng trên mã nguồn phần 1 (`../ProjectZero_Aocalyst/`, không sửa). Phần 2 thêm các file `js/g2_*.js` theo đúng mẫu cũ (LB, generator boss, Cine/Stage, Arr/TRACKS, rig/looks, `tr()`), nạp sau `ui.js`.

**Đã làm**
- Đoạn mở đầu "Sách Sáng Thế Thứ Hai", 6 cảnh: kính màu tóm tắt phần 1, sáu ngày tạo dựng (giáp Zero nứt dần), "Và Người đã không nghỉ", thế giới thiếu một ngày, giọng Vesper, bé gái ngủ ở quảng trường rồi tiêu đề.
- Nyx là nhân vật người chơi (6 tuổi): Đêm Nhỏ, Gọi Chú Zero, Ngân Nga, tối thượng "Một Đêm Cho Tất Cả". Zero là AI đồng hành, bất tử, có 3 lệnh.
- Chương 1: Thành Phố Bình Minh Vĩnh Cửu, cảnh đặt tên, Hiệp Sĩ Không Bóng, Thánh Đường Không Bóng với Seraphina (4 tháp, 3 pha, pha mù có chuông định hướng), lựa chọn tha/giết, cảnh sau.
- Vườn Sáng Thế (hub) với các trạm: bàn thờ (khóa tới Ngày Thứ Năm), cây kỹ năng, lò rèn, thư khố, tượng, cổng Bảy Ngày.
- 7 bản nhạc mới, "Bài Ru Của Zero" là leitmotif. Boss Seraphina có 3 đoạn theo pha.
- Tiếng Việt mặc định, 609/616 chuỗi đã dịch (7 chuỗi còn lại là tên riêng và mã màu).
- Credits: VoPhatDat + Claude.

**Sửa sau phản hồi**
- Nền menu núi lửa là phần còn sót của phần 1 (cảnh trận cuối), không liên quan phần 2: đã thay bằng thành phố bình minh dưới màn đêm tím.
- Bối cảnh quá sáng, chói mắt: Thành Phố Bình Minh chuyển sang tông mặt trời sát chân trời trên nền trời tím bầm. Thánh Đường tối, chỉ còn kính màu và Seraphina phát sáng. Vườn chuyển sang chiều muộn dịu. Font đổi sang Palatino.

**Kiểm thử (đều do bot, chưa có người chơi thật)**
- `node tools/e2e2.js`: toàn bộ chiến dịch chương 1 bằng Nyx (cả nhánh tha và giết), các trạm, lưu/tải, 5 nhân vật đánh trực tiếp với 2 boss: PASS.
- `node tools/smoke.js`: mọi cutscene chạy hết: PASS.
- `node tools/music_check.js`: 7 track, mỗi cặp chung tối đa 2/5 yếu tố, không dùng lại arranger/vòng hợp âm phần 1: PASS.
- `node tools/i18n.js`: 609/616.
- Phần 1 (`../ProjectZero_Aocalyst`, `node tools/e2e.js`): CAMPAIGN COMPLETED.
- Ảnh chụp: `node tools/shots2.js` lưu vào `shots/`.

**Nói thật**
- Nhạc chưa được tai người nghe. Mới chỉ kiểm tra bằng máy (cấu trúc, khác biệt). Chưa có công cụ đo độ to (±3 dB) chạy được trong môi trường không có loa: chưa đo.
- Độ khó chỉ được thử bằng bot. Đã chỉnh: Nyx nhận ít sát thương hơn (×0.45 khi dưới 10 tuổi), tự hồi máu khi hết nguy hiểm. Hiệp Sĩ yếu hơn khi chơi trực tiếp bằng nhân vật khác.
- Chương 2–7, trận cuối và các kết thúc chưa làm (M2–M5).

**Build:** `node tools/build.js` tạo `dist/ProjectZero2_Genesis.html` (một file) và `dist/artifact.html` (bản cho link online).
