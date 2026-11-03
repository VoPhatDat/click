'use strict';
// ===== Story: "Sách Sáng Thế Thứ Hai" — scenes, scripture pages, Codex =====
(function (PZ) {
  const V = (vi, en) => ({ vi, en });
  PZ.SPEAKERS = {
    zero: { name: V('Zero', 'Zero'), color: '#ffe7a0', voice: { pitch: .9, rate: .92, fx: 'none' } },
    nyx: { name: V('Nyx', 'Nyx'), color: '#cfe8ff', voice: { pitch: 1.6, rate: 1.05, fx: 'soft' } },
    vesper: { name: V('Giọng nói', 'A Voice'), color: '#ff9a6a', voice: { pitch: 1.15, rate: .82, fx: 'angel' } },
    seraphina: { name: V('Seraphina', 'Seraphina'), color: '#fff2c0', voice: { pitch: 1.3, rate: .78, fx: 'whisper' } },
    knight: { name: V('Hiệp Sĩ Không Bóng', 'Shadowless Knight'), color: '#e0d8c0', voice: { pitch: .6, rate: .8, fx: 'dark' } },
    rook: { name: V('Rook', 'Rook'), color: '#ff9a6a', voice: { pitch: .6, rate: .9, fx: 'none' } },
    sable: { name: V('Sable', 'Sable'), color: '#c0b0ff', voice: { pitch: 1.0, rate: 1.0, fx: 'none' } },
    mirae: { name: V('Mirae', 'Mirae'), color: '#c8ff70', voice: { pitch: 1.25, rate: .95, fx: 'none' } },
    ysolde: { name: V('Ysolde', 'Ysolde'), color: '#ff7a7a', voice: { pitch: 1.1, rate: .9, fx: 'none' } },
    citizen: { name: V('Người dân không ngủ', 'Sleepless citizen'), color: '#d8ccb0', voice: { pitch: .95, rate: .85, fx: 'none' } },
    narrator: { name: V('', ''), color: '#e8d8b0', voice: { pitch: .8, rate: .85, fx: 'narrator' } }
  };

  PZ.SCENES = {
    prologue: [
      { glass: 0, text: V('Thuở trước, có năm vùng đất. Dưới núi lửa Kalder có một cái Ngai, nơi giữ quyền phán xét thế giới, khóa bằng năm ấn.', 'Once there were five lands. Beneath the volcano Kalder sat a Throne that held the judgment of the world, locked by five seals.') },
      { glass: 1, text: V('Meridian muốn có quyền năng của Chúa. Họ đào xuống tận cái Ngai. Ngai đòi một vật tế.', 'Meridian wanted the power of God. They dug down to the Throne. The Throne demanded an offering.') },
      { glass: 2, text: V('Họ bắt một người không tên. Người ấy là Zero.', 'They took a nameless one. That one was Zero.') },
      { glass: 3, text: V('Trong Ngày Phán Xét, Zero bị xé làm đôi. Nỗi đau và cơn giận đứng dậy thành Endbringer.', 'On the Day of Judgment, Zero was torn in two. The pain and the wrath rose up as the Endbringer.') },
      { glass: 4, text: V('Ba mươi năm sau, Zero tỉnh dậy. Bốn người chết sống lại đi theo: Chiến Tranh, Tử Thần, Dịch Bệnh, Nạn Đói.', 'Thirty years later Zero awoke. Four of the dead rose to follow: War, Death, Pestilence, Famine.') },
      { glass: 5, text: V('Một giọng nói xưng là Vesper dẫn đường. Nhưng giọng ấy là Endbringer. Năm ấn vỡ.', 'A voice calling itself Vesper led the way. But the voice was the Endbringer. Five seals broke.') },
      { glass: 6, text: V('Zero đánh bại chính mình, rồi tha thứ cho chính mình. Hai nửa hợp làm một. Zero ngồi lên Ngai và khép nó lại.', 'Zero defeated itself, then forgave itself. The halves became one. Zero sat upon the Throne and closed it.') },
      { glass: 7, text: V('Trời mới và đất mới ra đời. Suốt thời gian ấy, Chúa không nói một lời.', 'A new heaven and a new earth were born. All that while, God said nothing.') },
      { book: V('SÁCH SÁNG THẾ THỨ HAI\n\nChương mở đầu\n\nThế giới mới mang theo mọi vết nứt trong lòng kẻ đã tạo ra nó.\nBảy ngày. Bảy vùng đất. Bảy cái lỗi.\nVà ở nơi sâu nhất của tro tàn, một thiên thần chưa chết hẳn mở mắt.', 'THE SECOND BOOK OF GENESIS\n\nThe opening chapter\n\nThe new world carries every crack in the heart of the one who made it.\nSeven days. Seven lands. Seven flaws.\nAnd in the deepest ash, an angel not quite dead opens her eyes.') },
      { say: 'vesper', emo: 'cold', text: V('Ai cho phép ngươi tha thứ thay tất cả?', 'Who gave you the right to forgive on behalf of everyone?') }
    ],
    hub_first: [
      { say: 'nyx', emo: 'smile', text: V('Anh tỉnh rồi! Em là Nyx. Em sinh ra từ tia sáng đầu tiên của thế giới mới… anh tạo ra em đấy, anh không nhớ à?', 'You’re awake! I’m Nyx. I was born from the first light of the new world… you made me, don’t you remember?') },
      { say: 'zero', emo: 'tired', text: V('Ta nhớ ánh sáng. Ta không nhớ đã được ngủ.', 'I remember the light. I do not remember sleeping.') },
      { say: 'nyx', emo: 'worry', text: V('Đây là Vườn Sáng Thế. Bảy cánh cổng dẫn tới bảy ngày. Nhưng mọi thứ đang hỏng dần. Ngày Thứ Nhất không chịu tắt nắng.', 'This is the Garden of Genesis. Seven gates lead to seven days. But everything is breaking. The First Day refuses to let the sun go down.') },
      { say: 'rook', emo: 'neutral', text: V('Bọn ta vẫn ở đây, Zero. Chọn ai đi cùng ở Bàn Thờ Kỵ Sĩ.', 'We are still here, Zero. Choose who walks with you at the Knights’ Altar.') },
      { say: 'nyx', emo: 'smile', text: V('Bấm N để ra lệnh cho em: bám sát, tấn công, hoặc trốn. Cổng Bảy Ngày ở cuối vườn.', 'Press N to command me: follow, attack, or hide. The Gate of Seven Days is at the end of the garden.') }
    ],
    ch1_intro: [
      { title: { main: V('NGÀY THỨ NHẤT', 'THE FIRST DAY'), sub: V('Ánh Sáng — Thành Phố Bình Minh Vĩnh Cửu', 'Light — City of Eternal Dawn') } },
      { book: V('Và Người phán: hãy có ánh sáng.\nVà ánh sáng có mặt.\nNhưng Người quên phán: hãy có buổi chiều.\nNên ánh sáng ở lại mãi.', 'And it was said: let there be light.\nAnd there was light.\nBut it was forgotten to say: let there be evening.\nSo the light stayed, forever.') },
      { say: 'nyx', emo: 'worry', text: V('Ở đây mặt trời không bao giờ lặn. Người dân không thể ngủ. Họ bắt đầu… quên mất mình là ai.', 'Here the sun never sets. The people cannot sleep. They are starting to… forget who they are.') },
      { say: 'zero', emo: 'neutral', text: V('Vì ta đã tạo ra ánh sáng mà không có bóng tối.', 'Because I made light without darkness.') }
    ],
    ch1_talk1: [
      { say: 'citizen', emo: 'tired', text: V('Ngài là người tạo ra mặt trời phải không? Xin ngài… cho tôi nhắm mắt một lát thôi.', 'You are the one who made the sun, aren’t you? Please… just let me close my eyes a moment.') },
      { say: 'citizen', emo: 'tired', text: V('Con tôi đã bốn trăm ngày không ngủ. Nó cười suốt. Tôi sợ tiếng cười ấy.', 'My child has not slept in four hundred days. She laughs all the time. I am afraid of that laughter.') },
      { say: 'zero', emo: 'pain', text: V('…Ta sẽ mang đêm về cho các ngươi.', '…I will bring the night back to you.') }
    ],
    ch1_talk2: [
      { say: 'sable', emo: 'neutral', text: V('Thiên thần ở đây không ngủ nên phát điên. Kẻ nào chuyển động là chúng lao vào.', 'The angels here went mad without sleep. Anything that moves, they charge.') },
      { say: 'ysolde', emo: 'smile', text: V('Ít ra chúng không đói. Ta thì đói.', 'At least they are not hungry. I am.') },
      { say: 'mirae', emo: 'neutral', text: V('Zero, giọng nói ở Vườn hôm trước… Ta từng nghe nó rồi. Ba mươi năm trước, trên bàn thờ. Trước khi lửa nổi lên.', 'Zero, the voice in the Garden… I have heard it before. Thirty years ago, at the altar. Before the fire rose.') },
      { say: 'zero', emo: 'neutral', text: V('Trên bàn thờ chỉ có ta.', 'There was no one on the altar but me.') },
      { say: 'mirae', emo: 'worry', text: V('Ngươi chắc chứ?', 'Are you certain?') }
    ],
    ch1_talk3: [
      { say: 'nyx', emo: 'worry', text: V('Cẩn thận! Đó là những Cái Bóng Bị Cấm. Thành phố này cấm bóng tối, nên bóng tối thành quái vật.', 'Careful! Those are the Forbidden Shadows. This city outlaws darkness, so darkness became monsters.') },
      { say: 'nyx', emo: 'smile', text: V('Chỉ ánh sáng mới làm chúng đau thật sự. Zero, dùng Dạng Ánh Sáng (Tab). Các kỵ sĩ khác chỉ gây được một phần tư sát thương thôi.', 'Only light truly hurts them. Zero, use Light Form (Tab). The other knights deal only a quarter damage.') },
      { say: 'zero', emo: 'neutral', text: V('Bóng tối cũng là của ta. Ta sẽ không ghét nó.', 'The dark is mine too. I will not hate it.') }
    ],
    ch1_knight: [
      { say: 'knight', emo: 'cold', text: V('Dừng lại. Sau ta là Thánh Đường của Nàng. Không cái bóng nào được qua.', 'Halt. Behind me is Her Cathedral. No shadow may pass.') },
      { say: 'zero', emo: 'neutral', text: V('Bóng của ngươi đâu, hiệp sĩ?', 'Where is your shadow, knight?') },
      { say: 'knight', emo: 'pain', text: V('Nó bỏ ta đi từ lâu rồi. Ta đứng dưới nắng quá lâu.', 'It left me long ago. I stood in the sun too long.') }
    ],
    ch1_preboss: [
      { say: 'nyx', emo: 'worry', text: V('Thánh Đường Không Bóng… Ba cây cột là thứ duy nhất ở đây còn đổ bóng.', 'The Cathedral Without Shadow… Those three pillars are the only things here that still cast shade.') },
      { say: 'seraphina', emo: 'cold', text: V('Ai đó… bước vào mà mang theo bóng tối. Ta không nhìn thấy, nhưng ta cảm thấy nó lạnh.', 'Someone… walks in carrying darkness. I cannot see it, but I feel how cold it is.') },
      { say: 'seraphina', emo: 'angry', text: V('Ta là ngày thứ nhất. Ta khâu mắt mình bằng chỉ vàng để không bao giờ thấy đêm.', 'I am the first day. I sewed my eyes with golden thread so I would never see night.') },
      { say: 'zero', emo: 'pain', text: V('Ta không đến để giết ngươi, Seraphina. Ta đến để cho ngươi ngủ.', 'I did not come to kill you, Seraphina. I came to let you sleep.') },
      { tip: V('Khi nàng tụ ánh sáng: đứng vào BÓNG của cột. Phase 2: chỉ một nguồn sáng là thật, viền vàng không chớp. Phase 3: nhắm mắt, nghe tiếng chuông bên trái hoặc phải.', 'When she gathers light: stand in a pillar’s SHADOW. Phase 2: only one light is real, its gold rim does not flicker. Phase 3: listen for the bell, left or right.') }
    ],
    ch1_post_spare: [
      { say: 'seraphina', emo: 'cry', text: V('Ngươi… không giết ta.', 'You… did not kill me.') },
      { say: 'zero', emo: 'smile', text: V('Nhắm mắt đi. Lần này không cần khâu.', 'Close your eyes. This time you need no thread.') },
      { narr: V('Và lần đầu tiên, mặt trời của Thành Phố Bình Minh lặn xuống.\nNgười dân nằm xuống ngay giữa đường và ngủ.', 'And for the first time the sun of the City of Dawn went down.\nThe people lay down in the streets and slept.') },
      { say: 'seraphina', emo: 'sad', text: V('Zero. Thiên thần bị thiêu ấy… ngày ngươi lên bàn thờ, cô ấy đã quỳ xin được lên thay ngươi. Ta đã ở đó. Ta đã nhìn.', 'Zero. The burned angel… the day you went to the altar, she knelt and begged to take your place. I was there. I watched.') },
      { say: 'seraphina', emo: 'sad', text: V('Hãy hỏi cô ấy vì sao cô ấy bị thiêu, còn ngươi được tha.', 'Ask her why she burned, while you were spared.') },
      { say: 'seraphina', emo: 'neutral', text: V('Và coi chừng Meridian. Họ đang nhặt mảnh vỡ của cái Ngai cũ. Họ muốn lắp ra một Chúa.', 'And beware Meridian. They are gathering the shards of the old Throne. They mean to assemble a God.') }
    ],
    ch1_post_kill: [
      { say: 'seraphina', emo: 'pain', text: V('Vậy ra… kẻ tha thứ cho tất cả… cũng biết giết.', 'So… the one who forgave everyone… also knows how to kill.') },
      { narr: V('Mặt trời rơi như một hòn than tắt.\nThành phố chìm vào bóng tối. Người dân ngủ, nhưng ngủ trong sợ hãi.', 'The sun fell like a dying coal.\nThe city sank into darkness. The people slept, but slept afraid.') },
      { say: 'nyx', emo: 'cry', text: V('Zero… cô ấy chỉ là mệt thôi mà.', 'Zero… she was only tired.') },
      { say: 'vesper', emo: 'cold', text: V('Thấy chưa. Sự tha thứ của ngươi luôn có giá, và luôn là người khác trả.', 'You see. Your forgiveness always has a price, and someone else always pays it.') }
    ],
    hub_after1: [
      { say: 'vesper', emo: 'cold', text: V('Ngày thứ nhất đã có đêm. Ngươi nghĩ thế là đủ sao? Còn sáu ngày nữa, Zero. Và ngày thứ bảy chưa từng tồn tại.', 'The first day has its night. Do you think that is enough? Six days remain, Zero. And the seventh has never existed.') },
      { say: 'nyx', emo: 'worry', text: V('Cổng Ngày Thứ Hai đang rỉ nước… mặn như nước mắt.', 'The Gate of the Second Day is leaking… salty, like tears.') },
      { tip: V('Hết bản thử M1. Chương 2 (Biển Lệ, Mareva) sẽ có ở mốc tiếp theo. Cảm ơn bạn đã chơi!', 'End of the M1 build. Chapter 2 (Sea of Tears, Mareva) arrives in the next milestone. Thank you for playing!') }
    ],
    credits_m1: [
      { book: V('PROJECT ZERO II: GENESIS\nbản thử M1\n\nMọi hình ảnh, âm nhạc và giọng nói đều được tạo bằng mã.\nKhông dùng tài nguyên bên ngoài.', 'PROJECT ZERO II: GENESIS\nM1 test build\n\nEvery image, note and voice is generated by code.\nNo external assets.') }
    ]
  };

  PZ.PAGES = {
    p1_1: { title: V('Trang I — Về Ánh Sáng', 'Page I — On Light'), text: V('Ngày đầu, Zero còn sợ bóng tối của chính mình.\nNên Zero làm ra một mặt trời không bao giờ lặn,\nđể không bao giờ phải nhìn thấy đêm.\nĐó là cái lỗi thứ nhất.', 'On the first day Zero still feared its own dark.\nSo Zero made a sun that never set,\nso it would never have to see the night.\nThat was the first flaw.') },
    p1_2: { title: V('Trang II — Về Người Mất Ngủ', 'Page II — On the Sleepless'), text: V('Kẻ không ngủ thì không mơ.\nKẻ không mơ thì không quên.\nKẻ không quên thì không thể tha thứ —\nchỉ có thể giả vờ.', 'Who does not sleep does not dream.\nWho does not dream does not forget.\nWho does not forget cannot forgive —\nonly pretend to.') },
    p1_3: { title: V('Trang III — Về Thiên Thần Thứ Bảy', 'Page III — On the Seventh Angel'), text: V('Có bảy thiên thần đứng quanh bàn thờ hôm ấy.\nSáu kẻ cúi đầu.\nMột kẻ bước lên và nói: "Hãy lấy con thay cho đứa trẻ."\nTên của kẻ ấy đã bị đốt khỏi mọi cuốn sách.', 'Seven angels stood around the altar that day.\nSix bowed their heads.\nOne stepped forward and said: "Take me instead of the child."\nThat one’s name was burned from every book.') },
    p1_4: { title: V('Trang IV — Về Meridian', 'Page IV — On Meridian'), text: V('Meridian không chết cùng thế giới cũ.\nHọ mang mảnh vỡ của Ngai vào thế giới mới như mang hạt giống.\nHọ gọi cái họ đang xây là Kiến Trúc Sư.\nHọ gọi nó là "Chúa không bao giờ im lặng".', 'Meridian did not die with the old world.\nThey carried shards of the Throne into the new one like seeds.\nThey call what they are building the Architect.\nThey call it "the God who is never silent".') }
  };
  PZ.SHARDS = { shard_1: { name: V('Mảnh Bình Yên thứ nhất: Bóng Mát', 'First Shard of Peace: Shade'), text: V('Một mảnh bóng râm nhỏ, mát như bàn tay mẹ đặt lên trán.', 'A small piece of shade, cool as a mother’s hand on your brow.') } };

  PZ.CODEX = {
    char_zero: { cat: 'chars', title: V('Zero', 'Zero'), text: V('Kẻ bị hiến tế, kẻ đã tha thứ, kẻ đã khép Ngai. Giờ đây là Kẻ Mang Ngày Thứ Bảy, dù ngày ấy chưa từng tồn tại. Chiến đấu ở hai dạng: Ánh Sáng và Thịnh Nộ.', 'The sacrificed, the forgiver, the one who closed the Throne. Now the Bearer of the Seventh Day, though that day has never existed. Fights in two forms: Light and Wrath.') },
    char_nyx: { cat: 'chars', title: V('Nyx', 'Nyx'), text: V('Đứa trẻ sinh ra từ tia sáng đầu tiên của thế giới mới. Cô bé lớn lên qua từng ngày sáng thế.', 'A child born of the new world’s first light. She grows with each day of creation.') },
    char_rook: { cat: 'chars', title: V('Rook — Chiến Tranh', 'Rook — War'), text: V('Ngày xưa hắn đỡ đòn cho người khác. Giờ càng bị đánh, hắn càng mạnh.', 'He once took blows for others. Now every blow makes him stronger.') },
    char_sable: { cat: 'chars', title: V('Sable — Tử Thần', 'Sable — Death'), text: V('Nàng đánh dấu những ai sắp chết, rồi gọi họ về.', 'She marks those about to die, then calls them home.') },
    char_mirae: { cat: 'chars', title: V('Mirae — Dịch Bệnh', 'Mirae — Pestilence'), text: V('Cùng một giọt thuốc: với kẻ thù là độc, với đồng đội là thuốc chữa.', 'One drop: poison to foes, cure to friends.') },
    char_ysolde: { cat: 'chars', title: V('Ysolde — Nạn Đói', 'Ysolde — Famine'), text: V('Cơn đói của nàng không bao giờ ngủ. Càng đói, nàng càng nguy hiểm, kể cả với chính mình.', 'Her hunger never sleeps. The hungrier she is, the deadlier, even to herself.') },
    char_vesper: { cat: 'chars', title: V('Giọng nói', 'The Voice'), text: V('Một giọng nữ từ nơi tro tàn. Ở phần 1, Endbringer đã mượn tên cô. Lần này giọng nói là thật.', 'A woman’s voice from the ash. In Part I the Endbringer borrowed her name. This time the voice is real.') },
    land_garden: { cat: 'lands', title: V('Vườn Sáng Thế', 'Garden of Genesis'), text: V('Nơi Zero trở về giữa các ngày. Khu vườn thay đổi theo những gì ngươi chọn.', 'Where Zero returns between the days. The garden changes with your choices.') },
    land_dawn: { cat: 'lands', title: V('Thành Phố Bình Minh Vĩnh Cửu', 'City of Eternal Dawn'), text: V('Ngày Thứ Nhất. Mặt trời không bao giờ lặn, người dân không thể ngủ. Ánh sáng ở đây không có bóng tối để nghỉ.', 'The First Day. The sun never sets; no one can sleep. Light here has no darkness to rest in.') },
    term_throne: { cat: 'terms', title: V('Cái Ngai', 'The Throne'), text: V('Nơi chứa quyền phán xét. Zero đã khép nó ở phần 1. Mảnh vỡ của nó vẫn còn trong thế giới mới.', 'Seat of judgment. Zero closed it in Part I. Its shards remain in the new world.') },
    term_meridian: { cat: 'terms', title: V('Meridian', 'Meridian'), text: V('Tổ chức đã hiến tế Zero. Tàn dư của họ đang xây một "Chúa nhân tạo".', 'The order that sacrificed Zero. Their remnants are building an "artificial God".') },
    term_shard: { cat: 'terms', title: V('Mảnh Bình Yên', 'Shards of Peace'), text: V('Bảy mảnh ẩn ở bảy ngày. Người ta nói ai đủ bảy mảnh sẽ được phép nghỉ ngơi.', 'Seven pieces hidden in the seven days. It is said that whoever holds all seven is allowed to rest.') },
    term_forms: { cat: 'terms', title: V('Ánh Sáng và Thịnh Nộ', 'Light and Wrath'), text: V('Dạng Ánh Sáng: nhanh, hồi máu khi đánh trúng, nhưng ở quá lâu sẽ bị mù quáng (nhận thêm 30% sát thương). Dạng Thịnh Nộ: chậm, đánh nặng, phá giáp, nhưng ở quá lâu sẽ mất máu. Đổi dạng khi thanh Cân Bằng lệch xa sẽ tung đòn chuyển tiếp.', 'Light: fast, heals on hit, but too long makes you blinded (+30% damage taken). Wrath: slow, heavy, armor-breaking, but too long drains HP. Switching while Balance is far off-center unleashes a transition strike.') }
  };
  PZ.CODEX_CATS = { chars: V('Nhân vật', 'Characters'), lands: V('Vùng đất', 'Lands'), enemies: V('Quái vật', 'Creatures'), bosses: V('Boss', 'Bosses'), pages: V('Trang kinh', 'Scripture'), terms: V('Thuật ngữ', 'Terms') };
  PZ.codexEntry = function (key) {
    if (PZ.CODEX[key]) return PZ.CODEX[key];
    if (key.startsWith('enemy_')) { const d = PZ.ENEMIES[key.slice(6)]; return d && { cat: 'enemies', title: d.name, text: d.desc }; }
    if (key.startsWith('boss_')) { const d = PZ.BOSSES[key.slice(5)]; return d && { cat: 'bosses', title: { vi: d.name.vi + ' — ' + d.title.vi, en: d.name.en + ' — ' + d.title.en }, text: d.desc }; }
    if (key.startsWith('page_')) { const d = PZ.PAGES[key.slice(5)]; return d && { cat: 'pages', title: d.title, text: d.text }; }
    return null;
  };
  PZ.DEFAULT_CODEX = ['char_zero', 'char_nyx', 'char_rook', 'char_sable', 'char_mirae', 'char_ysolde', 'char_vesper', 'land_garden', 'term_throne', 'term_meridian', 'term_forms', 'term_shard'];

  PZ.ACHIEVEMENTS = {
    first_light: V('Ánh Sáng Đầu Tiên — hoàn thành Chương 1', 'First Light — finish Chapter 1'),
    mercy_1: V('Giấc Ngủ Đầu Tiên — tha cho Seraphina', 'The First Sleep — spare Seraphina'),
    knight: V('Bóng Mát — đánh bại Hiệp Sĩ Không Bóng', 'Shade — defeat the Shadowless Knight'),
    pages_1: V('Người Đọc Kinh — nhặt đủ 4 trang kinh chương 1', 'Reader — find all 4 pages of Chapter 1'),
    shard_1: V('Mảnh Bình Yên Thứ Nhất', 'The First Shard of Peace'),
    parry10: V('Tha Thứ Mười Lần — 10 lần đỡ hoàn hảo', 'Seventy Times Seven — 10 perfect parries'),
    allchars: V('Tứ Kỵ Sĩ — dùng cả 5 nhân vật', 'The Horsemen — play all 5 heroes')
  };
})(globalThis.PZ);
