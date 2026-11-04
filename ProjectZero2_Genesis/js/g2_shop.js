'use strict';
/**
 * G2 SHOP: the Peddler of the Seventh Road, at the Ash Forge in the Garden. Relics for Seeds of Genesis (✿).
 * Relics are worn by the whole party: the companions who fight beside Nyx (AI or switched in) get the
 * same bonuses as whoever you control. Some relics only matter in the last battle, with the team.
 */
Object.assign(RELICS, {
    dunecharm: { name: 'Dune Charm', desc: '+15% max HP.', mod: { hp: .15 } },
    stardust: { name: 'Fallen Stardust', desc: '+10% crit chance, critical hits deal +25% damage.', mod: { crit: .1, critDmg: .25 } },
    wolftooth: { name: 'Pack Leader\'s Fang', desc: '+12% attack. Regain 2 HP on every kill.', mod: { atk: .12, killHeal: 2 } },
    tideglass: { name: 'Tide Glass', desc: 'Dodge recovers 25% faster, energy regen +25%.', mod: { dodgeCd: .25, enReg: .25 } },
    emberseed: { name: 'Ember Seed', desc: 'Ultimate charges 35% faster.', mod: { ultGain: .35 } },
    moonveil: { name: 'Moon Veil', desc: 'Take 12% less damage.', mod: { dr: .12 } },
    wingshard: { name: 'Wing Shard', desc: 'Jump 12% higher.', mod: {} },
    lulbell: { name: 'Lullaby Bell', desc: 'Nyx\'s Night Spirit fills 40% faster.', mod: {} },
    banner: { name: 'Banner of the Four', desc: 'Companions fighting beside you take 25% less damage.', mod: {} },
    feather: { name: 'Feather of Return', desc: 'The Lullaby of Return brings a companion back at full health.', mod: {} }
});
const G2_SHOP = [['dunecharm', 150], ['tideglass', 180], ['stardust', 200], ['emberseed', 200], ['wolftooth', 220], ['moonveil', 240], ['wingshard', 160], ['lulbell', 220], ['banner', 260], ['feather', 300]];
G2.hasRelic = id => !!(Save.data && Save.data.equipped && Save.data.equipped.includes(id));
Object.assign(UI.screens, {
    g2shop() {
        const D = Save.data; this.back = () => UI.show('g2forge');
        return `<div class="panel wide"><h2>${tr('THE PEDDLER OF THE SEVENTH ROAD')}</h2><p class="center">✿ ${D.cells} ${tr('Seeds of Genesis')} · ${tr('Relics are worn by the whole party.')}</p><div class="grid">${G2_SHOP.map(([id, cost]) => { const r = RELICS[id], has = D.relics.includes(id); return `<button class="card ${has ? 'owned' : ''}" data-do="g2buy" data-arg="${id}" ${has || D.cells < cost ? 'disabled' : ''}><b>${tr(r.name)}</b><span>${tr(r.desc)}</span><em>${has ? tr('OWNED') : cost + ' ✿'}</em></button>`; }).join('')}</div>
        <nav class="row"><button data-do="relics">${tr('RELICS')}</button><button data-do="g2forgeback" autofocus>${tr('BACK')}</button></nav></div>`;
    }
});
(function () {
    // a way in from the forge
    const fg = UI.screens.g2forge; UI.screens.g2forge = function () { return fg.call(this).replace('<nav class="row"><button data-do="relics">RELICS</button>', `<nav class="row"><button data-do="g2shop">${tr('THE PEDDLER')}</button><button data-do="relics">RELICS</button>`); };
    const act = UI.act.bind(UI); UI.act = function (w, arg, el) {
        if (w === 'g2shop') return this.show('g2shop'); if (w === 'g2forgeback') return this.show('g2forge');
        if (w === 'g2buy') { const D = Save.data, it = G2_SHOP.find(x => x[0] === arg); if (it && !D.relics.includes(arg) && D.cells >= it[1]) { D.cells -= it[1]; D.relics.push(arg); const s = D.equipped.indexOf(null); if (s >= 0) D.equipped[s] = arg; Sound.sfx('levelup'); Save.write(); if (G.player) G.player.recalc(); (G.allies || []).forEach(a => a.recalc()); } else Sound.sfx('ui_deny'); return this.show('g2shop'); }
        const r = act(w, arg, el); if (w === 'equip') { if (G.player) G.player.recalc(); (G.allies || []).forEach(a => a.recalc()); } return r;
    };
    // the relics that do more than a number
    const dj = Player.prototype.doJump; Player.prototype.doJump = function (air) { dj.call(this, air); if (G2.hasRelic('wingshard')) this.vy *= 1.12; };
    const add = G2.spirit.add; G2.spirit.add = function (n) { return add.call(this, n * (G2.hasRelic('lulbell') ? 1.4 : 1)); };
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (dmg, src) { if (this.isTeam && this.isAlly && G2.hasRelic('banner')) dmg *= .75; return hurt.call(this, dmg, src); };
    const tick = G.tick.bind(G); G.tick = function () { const before = G2.team.on ? G2.team.down().length : 0; tick(); if (G2.team.on && G2.hasRelic('feather') && G2.team.down().length < before) for (const a of G.allies) if (!a.down && a.inv > 100) a.hp = a.maxHp; };
})();
Object.assign(VI, {
    'THE PEDDLER OF THE SEVENTH ROAD': 'NGƯỜI BÁN RONG TRÊN CON ĐƯỜNG THỨ BẢY', 'THE PEDDLER': 'NGƯỜI BÁN RONG', 'Relics are worn by the whole party.': 'Cả đội cùng hưởng sức mạnh của di vật.', 'OWNED': 'ĐÃ CÓ',
    'Dune Charm': 'Bùa Cát', '+15% max HP.': '+15% máu tối đa.', 'Fallen Stardust': 'Bụi Sao Rơi', '+10% crit chance, critical hits deal +25% damage.': '+10% tỉ lệ chí mạng, đòn chí mạng gây thêm 25% sát thương.',
    'Pack Leader\'s Fang': 'Nanh Sói Đầu Đàn', '+12% attack. Regain 2 HP on every kill.': '+12% tấn công. Hồi 2 máu mỗi lần hạ địch.', 'Tide Glass': 'Kính Thủy Triều', 'Dodge recovers 25% faster, energy regen +25%.': 'Né hồi nhanh hơn 25%, hồi năng lượng +25%.',
    'Ember Seed': 'Hạt Than Hồng', 'Ultimate charges 35% faster.': 'Tuyệt chiêu nạp nhanh hơn 35%.', 'Moon Veil': 'Màn Trăng', 'Take 12% less damage.': 'Nhận ít hơn 12% sát thương.',
    'Wing Shard': 'Mảnh Cánh', 'Jump 12% higher.': 'Nhảy cao hơn 12%.', 'Lullaby Bell': 'Chuông Hát Ru', 'Nyx\'s Night Spirit fills 40% faster.': 'Linh Lực Đêm của Nyx đầy nhanh hơn 40%.',
    'Banner of the Four': 'Cờ Tứ Kỵ', 'Companions fighting beside you take 25% less damage.': 'Đồng đội sát cánh cùng bạn nhận ít hơn 25% sát thương.', 'Feather of Return': 'Lông Vũ Gọi Về', 'The Lullaby of Return brings a companion back at full health.': 'Bài Ru Gọi Về đưa đồng đội trở lại với đầy máu.'
});
