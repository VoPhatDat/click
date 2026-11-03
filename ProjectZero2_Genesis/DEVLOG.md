# Project Zero II: Genesis, nhật ký phát triển

Dựng trên mã nguồn Phần 1 (`../ProjectZero_Aocalyst/`, không sửa). Phần 2 là các file `js/g2_*.js` mở rộng đúng kiến trúc cũ (LB, generator boss, Cine/Stage, Arr/TRACKS, rig, `tr()`), nạp sau `ui.js` (thứ tự trong `index.html`).

## Bản hiện tại: trọn 7 chương, trận cuối, 4 kết thúc

### Cốt truyện (theo Phụ lục A)
| Ngày | Tuổi Nyx | Vùng | Mini-boss | Boss | Lựa chọn |
|---|---|---|---|---|---|
| 1 Ánh Sáng | 6 | Thành Phố Bình Minh Vĩnh Cửu → Thánh Đường | Hiệp Sĩ Không Bóng | Seraphina (4 tháp, bóng cột, pha mù nghe chuông) | tha / giết |
| 2 Nước | 8 | Biển Lệ → Nhà Nguyện Chìm | Cá Voi Đèn Lồng (rồi cưỡi nó qua biển) | Mareva (thủy triều dâng, kéo Zero xuống đáy, Nyx lặn xuống hát ru cứu chú; pha cuối né theo nhịp bài hát) | tha / giết |
| 3 Đất & Cây | 10 | Rừng Ký Ức → Nôi Rễ | Bù Nhìn Ký Ức | Mẹ Của Rễ (rễ → tim → mặt nạ; ôm giữ Nyx phải vùng ra) | chữa lành / phá hủy |
| 4 Tinh Tú | 13 | Đài Thiên Văn Vỡ → Mái Vòm Định Tinh | Đồng Hồ Sao Băng | Astraea (đọc 10 giây hành động gần nhất, né đúng đòn bạn dùng nhiều nhất; pha 3 lật trọng lực) | tha / giết |
| 5 Muông Thú | 14 | Hoang Mạc Bầy Đàn → Hốc Bầy Sói | Behemoth Con (ru ngủ thì cưỡi được), Linh Dương Sừng Lửa | Lilith-Varga (bầy sói vây, hóa sói khổng lồ, hát ru cả bầy) | thuần phục (khóa nếu đã giết sói đầu đàn) / giết |
| 6 Con Người | 15–16 | Thủ Đô Meridian Mới → Đại Sảnh → Lõi | Cỗ Máy Rao Giảng | Archon Veil (3 câu hỏi giữa trận, trả lời thật lòng để thuyết phục) → The Architect (Zero trong lõi) | thuyết phục (cần ≥2 câu đúng) / đánh bại |
| 7 Nghỉ Ngơi | 17 | Bờ Ngày Thứ Bảy → Ngai Trống | Bóng Của Zero | Trận cuối | |

- **Nyx lớn dần:** chương 1–2 không đánh được (trốn, Đêm Nhỏ, ngân nga, gọi Zero). Chương 3 có kiếm gỗ Zero gọt (cảnh "Để em biết là em có thể"). Chương 4 có Đèn Lồng Bóng Đêm. Chương 5 một mình, kéo lê kiếm của Zero, có Bước Qua Bóng, Bài Ru, Gọi Sao. Chương 6 nhấc được kiếm, kiếm sáng tím.
- **Zero:** AI đồng hành chương 1–4 (Bám sát / Tấn công / Giữ chỗ). Biến mất chương 5 (mảnh giấy trên cát). Bị nhốt trong The Architect chương 6. Chơi được từ chương 7. Ho ra tro từ chương 3.
- **Tứ Kỵ Sĩ** gia nhập cuối chương 5 ("Vậy từ giờ, bọn ta theo em"). Từ chương 6 đổi người tức thì bằng phím C.
- **Trận cuối:**
  - Hồi 0: cầu thang kính, người được tha cúi chào, người bị giết thành tượng vỡ; "Lần trước ta lên đây một mình." / "Lần này thì không."
  - Hồi 1: Nyx đấu Vesper. Mỗi đòn đẩy Nyx về phía Ngai, chạm Ngai là thua. Gương Hoàn Hảo phản lại 3 chiêu bạn dùng nhiều nhất. Mưa Thương (Đêm Nhỏ chặn được), Bão Tro (chỉ thấy mắt đỏ và kiếm tím), Lời Cầu Nguyện Bị Từ Chối (phá 7 hạt tràng trước khi vòng lửa khép).
  - Hồi 2: điều khiển Vesper trong ký ức sepia, không đánh được, giữ nút để ôm đứa trẻ, cánh cháy dần.
  - Hồi 3: The Architect, đội hình 7 người (Nyx, Zero, Vesper, Tứ Kỵ Sĩ). Mỗi boss nữ được tha đến giúp một lần, người bị giết hiện về làm bóng ma. 4 luật vật lý: trọng lực đảo, thời gian ngược (đạn bay ngược về boss nếu bạn đứng đúng chỗ), màn hình xoay, đêm tuyệt đối (chỉ Nyx thấy). Kết bằng "Ngày và Đêm".
  - Hồi 4: lựa chọn. 5A Ngày Nghỉ, 5B Người Bảo Vệ, 5C Ngủ Ngon (cần tha ≥5 và đủ 7 Mảnh Bình Yên; trận Nỗi Mệt Mỏi Của Zero: đánh thì nó hồi máu, giữ phím Tương tác 10 giây để ôm), 5D bí mật (New Game+, đã xem 3 kết thúc, im lặng 30 giây: LUCIFER, PROJECT ZERO III).
- Mỗi chương có cutscene mở đầu, thoại giữa đường, giới thiệu boss, cảnh sau boss, 4 trang kinh (3 ở ngày 7) và 1 Mảnh Bình Yên. Lời văn tiếng Việt theo đúng câu chữ trong bản yêu cầu (Zero xưng "ta", gọi Nyx là "em").

### Số liệu
- 29 loại quái mới, 8 mini-boss, 8 boss chính (7 boss nữ) cùng The Architect hồi 3 và Nỗi Mệt Mỏi Của Zero.
- 7 nhân vật chơi được: Nyx, Zero, Vesper, Rook, Sable, Mirae, Ysolde. Vesper bay được 4 giây, có Hồi Sinh Tro.
- 40 bài nhạc (mỗi vùng, mỗi boss, mỗi hồi của trận cuối, credits). Bài Ru Của Zero có một bản cho mỗi chương.
- 994/1008 chuỗi đã dịch (phần còn lại là tên riêng, mã màu).

### Nhạc (làm lại toàn bộ sau phản hồi "nhạc không hay")
- **Nhạc cụ tổng hợp mới:** piano có partial lệch và hai dây, giọng nữ formant có vibrato, giọng trẻ con, ngân nga, cello, violin, kèn sừng, guitar điện méo, synth, hộp nhạc lệch nốt, dulcimer, đồng hồ, búa máy, nhịp tim, tiếng sói hú, gió, sóng, tiếng rè phim cũ, chuông nhà thờ.
- **Reverb riêng theo nơi:** sảnh, nhà thờ, dưới nước, rừng, hang, hư không, phòng.
- **Đổi bài và đổi pha boss luôn rơi đúng ô nhịp.**
- **Giai điệu phát triển từ leitmotif bằng phép sequence.** Mọi nốt ở phách mạnh được đặt vào nốt của hợp âm: 100% với các bài chính, 83–89% với bài ru (do chính giai điệu bài ru).
- `tools/music_render.js` render từng bài ra MP3 (`shots/music/`) và đo độ to. `--normalize` cân bằng âm lượng: mọi bài nằm trong khoảng −18 ±1.5 dB RMS (trừ 2 bài cố ý nhỏ: im lặng chương 5 và hồi 4), không rè.
- `tools/music_check.js`: mỗi cặp bài khác nhau ít nhất 3/5 yếu tố, không dùng lại arranger hay vòng hợp âm của Phần 1, mỗi boss có bài riêng với ≥3 đoạn theo pha: **PASS**.


### Nhạc, lần làm lại thứ hai: một phong cách epic chung (theo yêu cầu của người chơi)
Người chơi gửi một bài tham khảo ("I wrote EPIC Boss Fight music for a Video Game", GameChanger OST) và yêu cầu toàn bộ nhạc Phần 2 theo chất đó, đồng nhất, bỏ chất điện tử. Phân tích bài tham khảo bằng `ana.py` (FFT, spectral flux, chroma):

| | Tham khảo | Nhạc cũ của game |
|---|---|---|
| Tempo | ~172 BPM | 136–152 |
| Giọng | La thứ hòa âm (nốt cảm G# mạnh) | Rê thứ |
| Độ sáng | 1730 Hz | ~1050 Hz |
| Dải tần | trung–cao 54%, sub 8% | 60–800 Hz chiếm 67%, sub 3% |
| Cấu trúc | intro dồn từ −46 lên −9 dB trong 25 giây, cao trào, lắng, dồn lại | phẳng |

**Đã làm:**
- EQ chung cho nhạc Phần 2: −4 dB ở 330 Hz, +4 dB ở 3.8 kHz, +5 dB trên 8.5 kHz, +3 dB sub.
- Bộ máy `epic()` (`js/g2_epic.js`) dùng chung cho mọi bài vùng, mini-boss và boss:
  - ostinato dây trầm (móc đơn) và dây cao (móc kép), kèn sừng, "braam" trombone;
  - hợp xướng, taiko, tom, snare half-time, cymbal;
  - riser và cú "boom" khi đổi pha; chu kỳ 16 ô nhịp có đoạn lắng và đoạn dồn lại.
- Mỗi bài giữ leitmotif và một màu riêng: Mareva hát soprano, Lilith có guitar méo, Astraea có đồng hồ và celesta, Mẹ Của Rễ có giọng trẻ con lệch tông, Archon có violin solo, The Architect có dãy 12 âm.
- Nhạc khám phá chơi cùng dàn nhạc ở mức nhẹ, và tự chuyển sang epic khi vào trận.
- Boss nhanh hơn (120–168 BPM). Hồi 1 chạy 164 BPM nhịp 7/4, hồi 3 chạy 172 BPM giọng La thứ như bài tham khảo.
- `music_check` được nới cho phong cách chung: các bài epic phải khác nhau ít nhất 2 trong 4 yếu tố (nhịp, giọng, nhạc cụ chính, tempo), thay cho quy tắc cũ "khác thể loại".

### Kiểm thử (đều do bot)
- `node tools/e2e2.js`: chương 1 bằng Nyx (cả tha và giết), 7 nhân vật đánh thật Hiệp Sĩ và Seraphina: PASS.
- `node tools/e2e3.js`: chiến dịch từ ngày 2 tới cả 4 kết thúc (cutscene, chương, lựa chọn, mở khóa, các hồi, NG+, lưu/tải). Người chơi được giữ sống, bài này kiểm tra mạch truyện, không kiểm tra độ khó: **CAMPAIGN II COMPLETE**.
- `node tools/bossbot2.js`: bot đánh thật (không bất tử) 15 boss với đúng bộ kỹ năng của chương đó: thắng hết. Mareva chỉ 1/2, vì Nyx 8 tuổi không đánh được và phụ thuộc vào Zero.
- `node tools/reach2.js`: bot đi bộ qua 10 màn khám phá (nhảy, bơi, lặn, dốc) tới cổng boss: đi qua hết.
- `node tools/bosstour.js` và `node tools/smoke.js`: mọi màn và mọi cutscene chạy không lỗi.
- Phần 1 (`../ProjectZero_Aocalyst`) vẫn chạy hết chiến dịch.

### Nói thật: chưa làm hoặc làm đơn giản hơn bản yêu cầu
- Nhạc **chưa được tai người nghe**, mới chỉ đo bằng máy. Các bài cần nghe góp ý nhất là nhạc boss và các hồi trận cuối.
- Độ khó chỉ bot thử. Thời lượng ước chừng 1.5–3 giờ, chưa đạt 4–6 giờ như tiêu chí.
- Chưa có:
  - lồng tiếng và khẩu hình khớp lời;
  - chân dung cận mặt có biểu cảm;
  - Codex dạng sách lật (mới có kho Trang Kinh của Phần 1);
  - 3 skin mỗi nhân vật;
  - co-op, Boss Rush, bảng xếp hạng;
  - trailer;
  - boss ẩn Endbringer hồi sinh;
  - vũ khí rơi từ boss;
  - ≥40 thành tựu;
  - 4 mức độ khó mới (vẫn dùng 3 mức của Phần 1).
- "Nhạc chạy ngược" (hồi 3, Astraea pha 3, kết thúc 5D) được làm bằng giai điệu đảo chiều và bao âm ngược, không phải phát ngược âm thanh thật.
- "Lật trọng lực" là lật khung hình cộng trọng lực thấp, không phải đi trên trần thật.

**Build:** `node tools/build.js` tạo `dist/ProjectZero2_Genesis.html` (một file, chơi offline) và `dist/artifact.html` (bản cho link online).
