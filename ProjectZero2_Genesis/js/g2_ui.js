'use strict';
/** G2 UI: Part II title, the Gate of Seven Days, the mercy choice, the forge, and a HUD with three skills. */
Object.assign(UI.screens, {
    title() {
        const can = Save.exists(), p1 = G2.hasPart1();
        return `<div class="title"><div class="logo"><span>PROJECT ZERO II</span><em>G E N E S I S</em><small>${Settings.lang === 'vi' ? 'SÁCH SÁNG THẾ THỨ HAI' : 'THE SECOND BOOK OF GENESIS'}</small></div>
        <nav>${can ? '<button data-do="continue" autofocus>CONTINUE</button>' : ''}
        <button data-do="newgame" ${can ? '' : 'autofocus'}>NEW GAME</button>
        ${G2.ngAvailable() ? '<button data-do="g2ngplus">NEW GAME+</button>' : ''}<button data-do="g2music">${tr('MUSIC ROOM')}</button>
        <button data-do="settings">SETTINGS</button><button data-do="credits">CREDITS</button><button data-do="exit">EXIT</button></nav>
        <p class="hint">${p1 ? (Settings.lang === 'vi' ? 'Đã tìm thấy hành trình phần 1: bạn sẽ nhận một món quà ở Vườn Sáng Thế.' : 'A Part I journey was found: a gift waits in the Garden.') : ''} ${tr('Arrow keys or mouse to navigate. Click once if you hear nothing: browsers wait for a first input before playing audio.')}</p><p class="hint">v${G2.VERSION}</p></div>`;
    },
    g2forge() {
        const D = Save.data, P = G.player; this.back = () => G2.closeStation();
        return `<div class="panel wide"><h2>THE ASH FORGE</h2><p class="center">✿ ${D.cells} ${tr('Seeds of Genesis')}</p><div class="grid">${CHARS[P.id].weapons.map(w => { const k = P.id + ':' + w.id, tier = D.g2.wTier[k] || 0, nx = W_TIERS[tier + 1]; return `<button class="card" data-do="g2forge" data-arg="${w.id}" ${!nx || D.cells < nx.cost ? 'disabled' : ''}><b style="color:${W_TIERS[tier].col}">${tr(w.name)}: ${tr(W_TIERS[tier].name)}</b><span>${tr(w.desc)}</span><em>${nx ? tr('FORGE') + ' → ' + tr(nx.name) + ' (' + nx.cost + ' ✿)' : tr('MAXED')}</em></button>`; }).join('')}</div>
        <nav class="row"><button data-do="relics">RELICS</button><button data-do="g2close" autofocus>BACK</button></nav></div>`;
    }
});
G2.stationExt = G2.stationExt || {};
G2.station = function (id) {
    if (G2.stationExt[id]) return G2.stationExt[id]();
    Game.state = 'menu';
    if (id === 'altar') { if ((Save.data.g2.chapter || 1) < 5) { Game.state = 'play'; G.toast('Only Nyx walks the first days. The Riders join on the Fifth Day.', '#e8d8ff'); return; } UI.show('select', { pick: Save.data.activeChar, from: 'hub' }); }
    else if (id === 'tree') UI.show('skills', { ch: Save.data.activeChar });
    else if (id === 'forge') UI.show('g2forge');
    else if (id === 'archive') UI.show('archive', { open: null });
    else if (id === 'portal') UI.show('hub');
    else { Game.state = 'play'; const g = Save.data.g2; G.toast(g.spared.seraphina ? 'Seraphina sleeps here, under the first night.' : g.killed.seraphina ? 'A broken statue. The first day ended by the blade.' : 'An empty pedestal.', '#e0dacc'); }
    if (UI.cur) { const old = UI.back; UI.back = () => G2.closeStation(); }
};
G2.closeStation = function () { UI.hide(); if (G.level && G.level.id === 'garden') { Game.state = 'play'; Input.held = {}; } else Game.toHub(); };
(function () {
    const act = UI.act.bind(UI);
    UI.act = function (what, arg, el) {
        const inGarden = G.level && G.level.id === 'garden';
        if (what === 'g2spare' || what === 'g2kill') { G.flags.g2choice = what === 'g2spare' ? 'spare' : 'kill'; UI.hide(); return; }
        if (what === 'g2close' || (what === 'hub' && inGarden)) return G2.closeStation();
        if (what === 'g2forge') { const P = G.player, k = P.id + ':' + arg, D = Save.data, tier = D.g2.wTier[k] || 0, nx = W_TIERS[tier + 1]; if (nx && D.cells >= nx.cost) { D.cells -= nx.cost; D.g2.wTier[k] = tier + 1; Sound.sfx('levelup'); Save.write(); } else Sound.sfx('ui_deny'); return this.show('g2forge'); }
        if (what === 'selok' && inGarden) { Save.data.activeChar = this.args.pick || Save.data.activeChar; Save.write(); UI.hide(); const x = G.player.x; Game.loadLevel('garden'); G.player.x = x; return; }
        if (what === 'quitHub') { Save.write(); UI.hide(); Game.toHub(); return; }
        return act(what, arg, el);
    };
    const show = UI.show.bind(UI);
    UI.show = function (name, args) { show(name, args); if (name === 'skills' || name === 'relics' || name === 'archive' || name === 'select') { if (G.level && G.level.id === 'garden') this.back = () => G2.closeStation(); } };
    // HUD: three skills, the weapon in hand, and each operator's own gauge.
    HUD.skills = function (c, P, d) {
        const sk = k => ({ k: 'skill' + k[1], name: d.skills[k].name, cd: P.cds[k] / d.skills[k].cd, col: d.skills[k].col, cost: d.skills[k].cost, t: P.cds[k] });
        const items = [{ k: 'attack', name: tr(d.noAttack ? 'POINT' : d.ranged ? 'FIRE' : 'ATTACK') }, { k: 'heavy', name: tr(d.canGuard ? 'GUARD' : 'HEAVY') }, sk('s1'), sk('s2'), sk('s3'), { k: 'ult', name: d.ult.name, ult: true, col: d.ult.col }];
        const w = 60, gap = 8, x0 = VW / 2 - (items.length * (w + gap) - gap) / 2, y = VH - 80;
        items.forEach((it, i) => {
            const x = x0 + i * (w + gap), big = i >= 2;
            c.fillStyle = 'rgba(14,10,6,.75)'; c.fillRect(x, y, w, 58); c.strokeStyle = it.ult && P.ult >= 100 ? '#fff' : it.col || 'rgba(232,192,104,.5)'; c.lineWidth = it.ult && P.ult >= 100 ? 3 : 1.5; c.strokeRect(x, y, w, 58);
            c.font = 'bold 12px "Courier New", monospace'; c.textAlign = 'center'; c.fillStyle = it.col || '#e8d8b0'; c.fillText(this.keyName(Settings.binds[it.k]), x + w / 2, y + 16);
            if (big && !it.ult && !(it.cd > 0)) { c.font = 'bold 18px "Palatino Linotype", "Times New Roman", serif'; c.fillText(tr(it.name)[0], x + w / 2, y + 42); }
            if (it.ult) { const k = P.ult / 100; c.fillStyle = U.rgba(it.col, .4); c.fillRect(x + 2, y + 56 - 54 * k, w - 4, 54 * k); c.fillStyle = '#fff'; c.fillText(P.ult >= 100 ? tr('READY') : Math.floor(P.ult) + '%', x + w / 2, y + 40); }
            else if (!big) { c.fillStyle = '#b8a888'; c.font = '10px "Courier New", monospace'; c.fillText(it.name, x + w / 2, y + 40); }
            if (it.cd > 0) { c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(x + 1, y + 1, w - 2, 56 * it.cd); c.fillStyle = '#fff'; c.font = 'bold 15px "Courier New", monospace'; c.fillText(Math.ceil(it.t / 60), x + w / 2, y + 40); }
            else if (it.cost && P.energy < it.cost) { c.fillStyle = 'rgba(40,90,180,.5)'; c.fillRect(x + 1, y + 1, w - 2, 56); }
        });
        // Weapon and gauges
        c.textAlign = 'left'; const W = P.weapon, tier = W_TIERS[P.tier()];
        c.font = 'bold 13px "Palatino Linotype", "Times New Roman", serif'; c.fillStyle = tier.col; c.fillText(tr(W.name) + '  [' + this.keyName(Settings.binds.weapon) + ']', x0, y - 10);
        const gauge = (label, k, c1, c2, mark) => { const gx = x0 + items.length * (w + gap) - 180, gy = y - 20; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(gx, gy, 172, 9); const g = c.createLinearGradient(gx, 0, gx + 172, 0); g.addColorStop(0, c1); g.addColorStop(1, c2); c.fillStyle = g; c.fillRect(gx, gy, mark ? 172 : 172 * k, 9); if (mark) { c.fillStyle = '#fff'; c.fillRect(gx + 172 * k - 2, gy - 3, 4, 15); } c.strokeStyle = 'rgba(232,192,104,.7)'; c.strokeRect(gx, gy, 172, 9); c.fillStyle = '#e8d8b0'; c.font = '11px "Palatino Linotype", serif'; c.fillText(label, gx, gy - 4); };
        if (P.form) gauge(tr(P.form === 'light' ? 'Light Form' : 'Wrath Form') + '  [' + this.keyName(Settings.binds.form) + ']', P.balance / 100, '#fff4c0', '#c02a4a', true);
        else if (P.rage !== null) gauge(tr('Battlefield Rage'), P.rage / 100, '#ff8a3a', '#ff2a1a');
        else if (P.hunger !== null) gauge(tr('Hunger'), P.hunger / 100, '#8a2a2a', '#ff4a5a');
        else if (P.id === 'sable' && P.veil > 0) gauge(tr('Veil'), P.veil / 240, '#3a2a5a', '#c084fc');
        if (G.ally) { c.fillStyle = '#00ffff'; c.font = '11px "Palatino Linotype", serif'; c.fillText('Zero: ' + tr({ follow: 'Follow', attack: 'Attack', hold: 'Hold' }[G.ally.aiMode]) + ' [' + this.keyName(Settings.binds.nyx) + ']', x0, y - 26); }
    };
    HUD.bossTitle = (function (orig) { return function (c) { return orig.call(this, c); }; })(HUD.bossTitle);
})();
// Menu backdrop: the City of Eternal Dawn with the first night creeping in from above.
Scene.menuBg = function (c, t) {
    Backdrop.draw(c, 'dawn', { x: 600 + t * .1, y: 0, zoom: 1 }, t);
    const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(14,10,40,.92)'); g.addColorStop(.55, 'rgba(30,18,60,.55)'); g.addColorStop(1, 'rgba(8,4,16,.35)');
    c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    c.fillStyle = '#e8d8ff'; for (const s of Stage.stars) { c.globalAlpha = .25 + Math.sin(t * .02 + s.p) * .25; c.fillRect(s.x, s.y * .55, s.s, s.s); } c.globalAlpha = 1;
    G.cam.x = G.cam.y = 0; G.cam.zoom = 1;
    if (Settings.quality && t % 4 === 0) VFX.add(U.rand(0, VW), VH + 10, U.rand(-.3, .3), U.rand(-1.6, -.6), '#b48cff', 220, 2.6, 1, 0);
    VFX.tick(); VFX.draw(c);
};

/* ------------------------------ NEW GAME+, THE MUSIC ROOM, THE GARDEN THAT REMEMBERS ------------------------------ */
G2.ngAvailable = function () { try { const raw = Store.read(Store.KEY); return !!raw && /"ngplus":1/.test(raw); } catch (e) { return false; } };
G2.newGamePlus = function () {
    const old = Save.data || (Save.load() && Save.data); if (!old) return Game.newGame('normal');
    const keep = { unlocked: old.unlocked.slice(), chars: old.chars, relics: old.relics.slice(), cells: old.cells, ach: old.ach.slice(), lore: old.lore.slice(), endings: Object.assign({}, old.g2.endings), heard: Object.assign({}, old.g2.heard || {}), wTier: Object.assign({}, old.g2.wTier) };
    Game.newGame(old.diff || 'normal'); const D = Save.data; Object.assign(D, { unlocked: keep.unlocked, chars: keep.chars, relics: keep.relics, cells: keep.cells, ach: keep.ach, lore: keep.lore });
    Object.assign(D.g2, { ngplus: 1, endings: keep.endings, heard: keep.heard, wTier: keep.wTier }); Save.write();
};
const MUSIC_ROOM = ['g2title', 'g2garden', 'g2lul1', 'g2dawn', 'g2knight', 'g2sera', 'g2lul2', 'g2sea', 'g2whale', 'g2mareva', 'g2lul3', 'g2forest', 'g2scarecrow', 'g2gardener', 'g2lul4', 'g2observ', 'g2clock', 'g2astraea', 'g2lul5', 'g2desert', 'g2antelope', 'g2lilith', 'g2lul6', 'g2meridian', 'g2preacher', 'g2archon', 'g2architect', 'g2lul7', 'g2throne', 'g2zshadow', 'g2vesper', 'g2act0', 'g2act1', 'g2act2', 'g2act3', 'g2act4', 'g2end5a', 'g2end5b', 'g2end5cfight', 'g2end5c', 'g2end5d', 'g2credits'];
Object.assign(UI.screens, {
    g2music(a) {
        const heard = (Save.data && Save.data.g2.heard) || {}, all = Save.data && Save.data.g2.ngplus; this.back = () => { Music.cut('g2title', 'calm'); this.show('title'); };
        return `<div class="panel wide"><h2>${tr('MUSIC ROOM')}</h2><div class="grid">${MUSIC_ROOM.map((id, i) => { const T = TRACKS[id], open = all || heard[id] || i < 2; return `<button class="card" data-do="g2play" data-arg="${id}" ${open ? '' : 'disabled'}><b>${open ? tr(T.meta.genre) : '???'}</b><span>${open ? T.meta.meter + ' · ' + T.meta.key + ' · ' + T.meta.tempo + ' BPM' : tr('Not heard yet')}</span><em>${open ? tr(T.meta.lead) : ''}</em></button>`; }).join('')}</div>
        <button class="card" data-do="g2lastcard"><b>GAMECHANGER</b><span>Photon Arts &amp; Carameii · 172 BPM</span><em>${tr('Final boss theme')}</em></button>
        <p class="hint">${tr('Every track is synthesised live in your browser. No one but you has listened to them yet: tell us which ones work.')}</p><nav class="row"><button data-do="title" autofocus>${tr('BACK')}</button></nav></div>`;
    }
});
(function () {
    const act = UI.act.bind(UI); UI.act = function (w, arg, el) {
        if (w === 'g2music') { if (!Save.data) Save.load(); Sound.resume && Sound.resume(); return this.show('g2music'); }
        if (w === 'g2play') { Sound.resume && Sound.resume(); Music.cut(arg, TRACKS[arg].meta.boss ? 'boss' : 'calm'); return; }
        if (w === 'g2lastcard') { Sound.resume && Sound.resume(); G2.song.load(); const go = (n = 0) => { if (G2.song.buf) { G2.song.start(0); G2.song.looping = false; } else if (n < 50) setTimeout(() => go(n + 1), 100); }; go(); return; }
        if (w === 'title' && G2.song.active && !G.boss) G2.song.stop(.5);
        if (w === 'g2ngplus') { Sound.resume && Sound.resume(); G2.newGamePlus(); return; }
        return act(w, arg, el);
    };
    // The Garden remembers: those Nyx spared rest here in light; the slain stand as broken stone.
    const gl = LEVELS.garden; const floorY = (d, tx) => { for (let ty = 0; ty < d.h; ty++) if (d.grid[ty * d.w + tx] !== T.E) return ty * TILE; return 30 * TILE; };
    LEVELS.garden = function () { const d = gl(); ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon'].forEach((k, i) => d.objs.push({ kind: 'exit', g2: 'witness', boss: k, x: (36 + i * 13) * TILE, y: floorY(d, 36 + i * 13), label: '' })); if (Save.data && Save.data.g2.spared.lilith) d.objs.push({ kind: 'npc', id: 'wolfpup', x: 104 * TILE, y: floorY(d, 104) }); return d; };
    Object.assign(NPCS, { wolfpup: { name: 'A WOLF OF THE PACK', look: '#6a5a50', lines: [['A WOLF OF THE PACK', '...'], ['NYX', 'You came to guard the Garden? Good wolf.']] } });
    // The party key, once there is a party.
    const sk = HUD.skills; HUD.skills = function (c, P, d) { sk.call(this, c, P, d); if ((Save.data.g2.chapter || 1) >= 6 && G2.party().length > 1) { c.font = '11px "Palatino Linotype", serif'; c.textAlign = 'left'; c.fillStyle = '#e8d8ff'; c.fillText(tr('Switch') + ' [' + this.keyName(Settings.binds.party) + ']: ' + G2.party().map(id => CHARS[id].name).join(' · '), VW / 2 - 214, VH - 126); } };
})();
Object.assign(VI, { 'MUSIC ROOM': 'PHÒNG NHẠC', 'Not heard yet': 'Chưa nghe thấy', 'Every track is synthesised live in your browser. No one but you has listened to them yet: tell us which ones work.': 'Mọi bài nhạc được tổng hợp trực tiếp trong trình duyệt của bạn. Ngoài bạn ra chưa ai nghe chúng: hãy cho chúng tôi biết bài nào ổn.', 'BACK': 'QUAY LẠI', 'Switch': 'Đổi người', 'A WOLF OF THE PACK': 'MỘT CON SÓI TRONG BẦY', 'You came to guard the Garden? Good wolf.': 'Em đến canh Vườn à? Sói ngoan.', 'NEW GAME+': 'CHƠI LẠI+' });
