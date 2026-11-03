'use strict';
/** UI: canvas HUD plus DOM menus. Every control here does real work. */
const HUD = {
    keyName(code) { return (code || '').replace('Key', '').replace('Digit', '').replace('ShiftLeft', 'SHIFT').replace('ShiftRight', 'RSHIFT').replace('Space', 'SPACE').replace('Arrow', ''); },
    bar(c, x, y, w, h, k, col, back = 'rgba(0,0,0,.55)') {
        c.fillStyle = back; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * U.clamp(k, 0, 1)), h - 2);
        c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w, h);
    },
    draw(c) {
        const P = G.player, d = P.def;
        c.save(); c.textBaseline = 'alphabetic';
        const hide = G.lbA > .5 && G.lockInput;
        if (!hide) {
            // Portrait
            c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(18, 18, 66, 66); c.strokeStyle = d.style.col.glow; c.lineWidth = 2; c.strokeRect(18, 18, 66, 66);
            this.portrait(c, d, 51, 54, P);
            c.font = 'bold 14px "Courier New", monospace'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(d.name, 92, 30);
            c.fillStyle = '#9ab'; c.font = '11px "Courier New", monospace'; c.fillText(tr('LV') + ' ' + Save.charData(P.id).level, 248, 30);
            this.bar(c, 92, 36, 200, 14, P.hp / P.maxHp, P.hp / P.maxHp < .3 ? (G.time % 30 < 15 ? '#ff2a1a' : '#a01410') : '#00e5d0');
            if (P.shield > 0) this.bar(c, 92, 36, 200, 14, P.shield / P.shieldMax, 'rgba(255,204,0,.8)', 'rgba(0,0,0,0)');
            c.fillStyle = '#fff'; c.font = '11px "Courier New", monospace'; c.fillText(`${Math.ceil(P.hp)}/${P.maxHp}`, 98, 47);
            this.bar(c, 92, 53, 170, 7, P.energy / P.maxEnergy, '#46a0ff');
            this.bar(c, 92, 63, 130, 4, 1 - P.dodgeCd / P.def.dodge.cd, '#ff5500');
            // Shards
            const S = Save.data.shards;[['#ff2a00', S.r], ['#00ff55', S.g], ['#0088ff', S.b]].forEach((s, i) => { c.save(); c.translate(102 + i * 20, 80); c.rotate(.785); c.fillStyle = s[1] ? s[0] : 'rgba(255,255,255,.08)'; c.fillRect(-6, -6, 12, 12); c.strokeStyle = s[1] ? '#fff' : '#555'; c.lineWidth = 1; c.strokeRect(-6, -6, 12, 12); c.restore(); });
            c.fillStyle = '#7fffd4'; c.font = '12px "Courier New", monospace'; c.fillText('◆ ' + Save.data.cells, 170, 85);
            // Status
            let bx = 18, by = 104; const tag = (t, col) => { c.font = 'bold 11px "Courier New", monospace'; const w = c.measureText(t).width + 12; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(bx, by, w, 17); c.strokeStyle = col; c.strokeRect(bx + .5, by + .5, w, 17); c.fillStyle = col; c.fillText(t, bx + 6, by + 13); bx += w + 5; };
            if (P.cannonAmmo > 0) tag(tr('CANNON') + ' ' + P.cannonAmmo, '#ff3322');
            if (P.shield > 0) tag('AEGIS ' + Math.ceil(P.shieldT / 60) + 's', '#ffcc00');
            if (P.defyT > 0) tag(tr('INVULNERABLE'), '#ffcc00');
            if (P.slow > 0) tag(tr('SLOWED'), '#8888ff');
            if (P.sandSlow) tag(tr('SINKING'), '#d8b070');
            if (P.sheltered > 0 && G.storm > .3) tag(tr('SHELTERED'), '#7fffb0');
            if (d.id === 'mirae') tag(tr(ELEMENTS[P.element].name), ELEMENTS[P.element].col);
            if (P.guarding) tag(tr('GUARD'), '#ffd86b');
            // Objective and compass
            c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '13px "Courier New", monospace';
            const obj = G.boss ? '' : tr(G.objective); if (obj) c.fillText('▸ ' + obj, VW - 22, 34);
            if (!G.boss) { const k = U.clamp(P.x / G.level.pw, 0, 1); this.bar(c, VW - 222, 42, 200, 5, k, 'rgba(0,255,255,.7)'); c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '11px "Courier New", monospace'; c.fillText(tr(G.level.name), VW - 22, 60); }
            this.skills(c, P, d);
            // Boss bar
            if (G.boss && !G.boss.intro) this.bossBar(c, G.boss);
            if (G.nearObj && !G.dialog) this.prompt(c, G.nearObj);
        }
        this.toasts(c); this.radio(c); this.banner(c); this.tutorial(c); this.titleCard(c);
        if (G.dialog) this.dialog(c);
        const lb = 62 * G.lbA; if (lb > 1) { c.fillStyle = '#000'; c.fillRect(0, 0, VW, lb); c.fillRect(0, VH - lb, VW, lb); }
        if (G.bossTitle) this.bossTitle(c);
        if (G.clash) {
            const k = G.clash.k, w = 620, x = VW / 2 - w / 2, y = 124; c.textAlign = 'center';
            c.font = 'bold 26px "Courier New", monospace'; c.fillStyle = G.time % 16 < 9 ? '#ffffff' : '#ffd9a0'; c.fillText(tr('MASH') + ' [' + this.keyName(Settings.binds.attack) + ']', VW / 2, y - 14);
            c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(x, y, w, 20); c.fillStyle = '#ff1100'; c.fillRect(x + 2, y + 2, w - 4, 16); c.fillStyle = '#00ffff'; c.fillRect(x + 2, y + 2, (w - 4) * k, 16); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x, y, w, 20);
        }
        if (G.bigText) {
            const b = G.bigText; c.textAlign = 'center'; c.fillStyle = b.col; c.font = 'bold 66px "Courier New", monospace'; c.fillText(tr(b.text), VW / 2 + U.rand(-3, 3), VH / 2 + 130);
            if (b.sub) { c.font = 'bold 24px "Courier New", monospace'; c.fillStyle = '#000'; c.fillText(tr(b.sub), VW / 2, VH / 2 + 176); }
        }
        if (Settings.showFps) { c.textAlign = 'left'; c.fillStyle = '#0f0'; c.font = '12px monospace'; c.fillText(`${Game.fps.toFixed(0)} fps  ${Game.frameMs.toFixed(1)}ms  parts:${VFX.n}`, 8, VH - 8); }
        c.restore();
    },
    portrait(c, d, x, y, P) {
        const C = d.style.col; c.save(); c.beginPath(); c.rect(19, 19, 64, 64); c.clip();
        Paint.torso(c, { hip: { x, y: y + 40 }, neck: { x, y: y + 6 }, lean: 0 }, 22, 24, C.armor, C.armor2);
        const J = { head: { x, y: y - 8, a: 0 }, neck: { x, y: y + 6 }, sh: { x, y: y + 8 }, hip: { x, y: y + 30 } };
        c.translate(x, y - 8); c.scale(2.1, 2.1); c.translate(-x, -(y - 8));
        Paint.disc(c, x, y - 8, 7.5, C.skin); if (d.style.headGear) d.style.headGear(c, J, d.style, P ? P.rig : { owner: null, time: 0 });
        c.restore();
    },
    skills(c, P, d) {
        const items = [
            { k: 'attack', name: tr(d.ranged ? 'FIRE' : 'ATTACK') }, { k: 'heavy', name: tr(d.canGuard ? 'GUARD' : d.id === 'mirae' ? 'ELEMENT' : 'HEAVY') },
            { k: 'skill1', name: d.skills.s1.name, cd: P.cds.s1 / d.skills.s1.cd, col: d.skills.s1.col, cost: d.skills.s1.cost, t: P.cds.s1 },
            { k: 'skill2', name: d.skills.s2.name, cd: P.cds.s2 / d.skills.s2.cd, col: d.skills.s2.col, cost: d.skills.s2.cost, t: P.cds.s2 },
            { k: 'ult', name: d.ult.name, ult: true, col: d.ult.col }
        ];
        const n = items.length, w = 64, gap = 8, x0 = VW / 2 - (n * (w + gap) - gap) / 2, y = VH - 80;
        items.forEach((it, i) => {
            const x = x0 + i * (w + gap), big = i >= 2;
            c.fillStyle = 'rgba(5,5,12,.7)'; c.fillRect(x, y, w, 58); c.strokeStyle = it.ult && P.ult >= 100 ? '#fff' : it.col || 'rgba(255,255,255,.3)'; c.lineWidth = it.ult && P.ult >= 100 ? 3 : 1.5; c.strokeRect(x, y, w, 58);
            c.font = 'bold 12px "Courier New", monospace'; c.textAlign = 'center';
            c.fillStyle = it.col || '#ccd'; c.fillText(this.keyName(Settings.binds[it.k]), x + w / 2, y + 16);
            if (big && !it.ult) { this.icon(c, x + w / 2, y + 35, it.col, i); }
            if (it.ult) { const k = P.ult / 100; c.fillStyle = U.rgba(it.col, .4); c.fillRect(x + 2, y + 56 - 54 * k, w - 4, 54 * k); c.fillStyle = '#fff'; c.font = 'bold 12px "Courier New", monospace'; c.fillText(P.ult >= 100 ? tr('READY') : Math.floor(P.ult) + '%', x + w / 2, y + 40); if (P.ult >= 100) Paint.glow(c, x + w / 2, y + 30, 46 + Math.sin(G.time * .15) * 6, it.col); }
            else if (!big) { c.fillStyle = '#889'; c.font = '10px "Courier New", monospace'; c.fillText(it.name, x + w / 2, y + 40); }
            if (it.cd > 0) { c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(x + 1, y + 1, w - 2, 56 * it.cd); c.fillStyle = '#fff'; c.font = 'bold 16px "Courier New", monospace'; c.fillText(Math.ceil(it.t / 60), x + w / 2, y + 40); }
            else if (it.cost && P.energy < it.cost) { c.fillStyle = 'rgba(40,90,180,.5)'; c.fillRect(x + 1, y + 1, w - 2, 56); }
        });
    },
    icon(c, x, y, col, i) {
        c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.5;
        if (i === 2) { c.beginPath(); c.moveTo(x - 12, y + 9); c.lineTo(x - 3, y - 2); c.lineTo(x + 3, y + 3); c.lineTo(x + 12, y - 10); c.stroke(); }
        else { c.beginPath(); c.arc(x, y, 10, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); }
    },
    bossBar(c, b) {
        const w = 720, x = VW / 2 - w / 2, y = 64;
        c.textAlign = 'center'; c.font = 'bold 22px "Courier New", monospace'; c.fillStyle = '#ff3a2a'; UIText.spaced(c, tr(b.name), VW / 2, y - 12, 5);
        c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(x, y, w, 18); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 2, y + 2, (w - 4) * U.clamp(b.hbar, 0, 1), 14);
        const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, b.enraged ? '#550000' : '#7700ff'); g.addColorStop(1, '#ff1100'); c.fillStyle = g; c.fillRect(x + 2, y + 2, (w - 4) * U.clamp(b.hp / b.maxHp, 0, 1), 14);
        c.strokeStyle = '#ff2a1a'; c.lineWidth = 2; c.strokeRect(x, y, w, 18);
        b.def.phases.forEach(p => { if (p.at && !b.enraged) { c.fillStyle = '#fff'; c.fillRect(x + w * p.at, y - 2, 2, 22); } });
    },
    prompt(c, o) {
        const cam = G.cam, x = (o.x - cam.x) * cam.zoom, y = (o.y - 92 - cam.y) * cam.zoom, label = tr({ beacon: 'Rest', npc: 'Talk', lore: 'Read', chest: 'Open', lever: 'Activate', rune: 'Awaken', cryo: 'Open chamber', door: 'Insert shards', exit: o.label || 'Continue' }[o.kind]);
        const s = `[${this.keyName(Settings.binds.interact)}] ${label}`; c.font = 'bold 14px "Courier New", monospace'; const w = c.measureText(s).width + 18;
        c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(x - w / 2, y - 16, w, 23); c.strokeStyle = '#00ffff'; c.lineWidth = 1; c.strokeRect(x - w / 2, y - 16, w, 23); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(s, x, y);
    },
    toasts(c) {
        G.toasts.forEach((t, i) => {
            const a = Math.min(1, Math.min(t.t, 200 - t.t) / 16), y = 148 + i * 30; c.globalAlpha = a; c.textAlign = 'center'; c.font = 'bold 18px "Courier New", monospace'; const w = c.measureText(t.text).width + 30;
            c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(VW / 2 - w / 2, y - 19, w, 28); c.fillStyle = t.col; c.fillText(t.text, VW / 2, y); c.globalAlpha = 1;
        });
    },
    radio(c) {
        const S = G.sayCur; if (!S || !S.text) return;
        const a = Math.min(1, Math.min(S.t, S.dur - S.t) / 12); c.globalAlpha = a; c.font = '18px "Segoe UI", Tahoma, Arial, sans-serif'; c.textAlign = 'left';
        const lines = UIText.wrap(c, S.text, 620), h = 16 + lines.length * 22 + (S.speaker ? 20 : 0), x = VW / 2 - 330, y = G.lbA > .5 ? VH - 66 - h : VH - 100 - h;
        c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(x, y, 660, h); c.fillStyle = S.vesper ? '#00ffff' : '#ff8844'; c.fillRect(x, y, 3, h);
        let yy = y + 20; if (S.speaker) { c.font = 'bold 13px "Segoe UI", Tahoma, Arial, sans-serif'; c.fillText(S.speaker, x + 14, yy); yy += 20; c.font = '18px "Segoe UI", Tahoma, Arial, sans-serif'; }
        c.fillStyle = '#eee'; const shown = Math.floor(S.t * 1.2); let used = 0;
        lines.forEach(l => { const n = Math.max(0, Math.min(l.length, shown - used)); used += l.length + 1; c.fillText(l.slice(0, n), x + 14, yy); yy += 22; });
        c.globalAlpha = 1;
    },
    banner(c) {
        const B = G.banner; if (!B) return;
        const k = Math.min(1, Math.min(B.t, B.life - B.t) / 10), h = 104 * k; c.fillStyle = 'rgba(0,0,0,.8)'; c.fillRect(0, VH / 2 - h / 2, VW, h); c.fillStyle = B.col; c.fillRect(0, VH / 2 - h / 2, VW, 2); c.fillRect(0, VH / 2 + h / 2 - 2, VW, 2);
        c.globalAlpha = k; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 54px "Courier New", monospace'; c.fillStyle = '#fff'; UIText.spaced(c, B.name, VW / 2 + U.rand(-2, 2), VH / 2 - (B.sub ? 12 : 0), 6);
        if (B.sub) { c.font = 'bold 20px "Courier New", monospace'; c.fillStyle = '#ffaa00'; c.fillText(B.sub, VW / 2, VH / 2 + 32); }
        c.globalAlpha = 1; c.textBaseline = 'alphabetic';
    },
    tutorial(c) {
        const T2 = G.tut; if (!T2) return;
        const K = id => this.keyName(Settings.binds[id]), d = G.player.def;
        const TXT = {
            move: Settings.lang === 'vi' ? [`${K('left')}/${K('right')} di chuyển   ${K('jump')} nhảy, nhấn lần nữa trên không để nhảy đôi`, `${K('dodge')} né: không nhận sát thương khi đang né   ${K('down')}+${K('jump')} xuống bệ`] : [`${K('left')}/${K('right')} move   ${K('jump')} jump, press again in the air to double jump`, `${K('dodge')} dodge: you cannot be hurt mid-dodge   ${K('down')}+${K('jump')} drop through a platform`],
            combat: Settings.lang === 'vi' ? [`${K('attack')} ${d.ranged ? 'bắn (giữ phím)' : 'đánh (nhấn liên tục để combo)'}   ${K('heavy')} ${d.canGuard ? 'nhấn để đập khiên, giữ để đỡ' : d.id === 'mirae' ? 'nhấn để đổi nguyên tố, giữ để tụ lực' : 'giữ để tụ lực'}`, `${K('skill1')} và ${K('skill2')} dùng kỹ năng   ${K('ult')} tung tuyệt kỹ khi đầy thanh   ${K('interact')} tương tác`] : [`${K('attack')} ${d.ranged ? 'fire (hold)' : 'attack (keep tapping to combo)'}   ${K('heavy')} ${d.canGuard ? 'tap to bash, hold to guard' : d.id === 'mirae' ? 'tap to change element, hold to charge' : 'hold to charge'}`, `${K('skill1')} and ${K('skill2')} use skills   ${K('ult')} fires your ultimate when the meter is full   ${K('interact')} interact`],
            storm: [tr('Storms push you back and hide the path.'), tr('Stand behind stone pillars to shelter from the wind.')],
            lava: [tr('Lava burns and throws you back to your last safe footing.'), tr('Bridges collapse behind you. Keep moving.')]
        }[T2.id];
        const a = Math.min(1, Math.min(T2.t, 520 - T2.t) / 20); c.globalAlpha = a; c.textAlign = 'center'; c.font = '15px "Courier New", monospace'; const y = VH - 170;
        c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(VW / 2 - 390, y - 20, 780, 54); c.fillStyle = '#7fffd4'; TXT.forEach((l, i) => c.fillText(l, VW / 2, y + i * 22)); c.globalAlpha = 1;
    },
    titleCard(c) {
        const T2 = G.titleCard; if (!T2) return;
        if (++T2.t > 230) { G.titleCard = null; return; }
        const a = Math.min(1, Math.min(T2.t, 230 - T2.t) / 30); c.globalAlpha = a; c.textAlign = 'center';
        c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, VH * .28, VW, 110);
        c.fillStyle = '#fff'; c.font = 'bold 42px "Courier New", monospace'; UIText.spaced(c, tr(T2.name), VW / 2, VH * .28 + 56, 4);
        c.fillStyle = '#ffaa66'; c.font = '17px "Courier New", monospace'; c.fillText(tr(T2.sub), VW / 2, VH * .28 + 90); c.globalAlpha = 1;
    },
    dialog(c) {
        const D = G.dialog, L = D.lines[D.i], w = 860, x = VW / 2 - w / 2; c.font = '20px "Segoe UI", Tahoma, Arial, sans-serif'; c.textAlign = 'left';
        const lines = UIText.wrap(c, L[1], w - 44), h = 66 + lines.length * 26, y = VH - h - 34;
        c.fillStyle = 'rgba(4,6,12,.92)'; c.fillRect(x, y, w, h); c.strokeStyle = D.lore ? '#00ffaa' : '#ff8844'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
        c.fillStyle = D.lore ? '#00ffaa' : '#ff8844'; c.font = 'bold 15px "Courier New", monospace'; c.fillText(L[0], x + 22, y + 26);
        c.font = '20px "Segoe UI", Tahoma, Arial, sans-serif'; c.fillStyle = '#eef'; const shown = Math.floor(D.t * 1.1); let used = 0;
        lines.forEach((l, i) => { const n = Math.max(0, Math.min(l.length, shown - used)); used += l.length + 1; c.fillText(l.slice(0, n), x + 22, y + 54 + i * 26); });
        c.font = '12px "Courier New", monospace'; c.fillStyle = '#889'; c.textAlign = 'right'; c.fillText(`[${this.keyName(Settings.binds.interact)}] ${tr('continue')}`, x + w - 14, y + h - 9);
    },
    bossTitle(c) {
        const B = G.bossTitle; B.t++; const a = Math.min(1, B.t / 14); c.globalAlpha = a; c.textAlign = 'center';
        const size = Math.min(98, 56 + B.t * .7); c.font = `bold ${size}px "Courier New", monospace`; c.fillStyle = '#fff'; c.fillText(tr(B.name), VW / 2 + U.rand(-2, 2), VH / 2 - 70);
        c.font = '23px "Courier New", monospace'; c.fillStyle = '#ffaa00'; UIText.spaced(c, tr(B.title), VW / 2, VH / 2 - 22, 3); c.globalAlpha = 1;
    }
};

/* ------------------------------ DOM MENUS ------------------------------- */
const UI = {
    root: null, cur: null, back: null, args: {},
    init() {
        this.root = document.getElementById('screens');
        this.root.addEventListener('click', e => {
            const b = e.target.closest('[data-do]'); if (!b || b.disabled) return;
            Sound.resume(); Sound.sfx('ui_ok');
            this.act(b.dataset.do, b.dataset.arg, b);
        });
        this.root.addEventListener('mouseover', e => { const b = e.target.closest('button'); if (b && !b.disabled && document.activeElement !== b) { b.focus({ preventScroll: true }); } });
        this.root.addEventListener('focusin', e => { if (e.target.tagName === 'BUTTON') Sound.sfx('ui_move', { gap: .05, v: .5 }); });
        this.root.addEventListener('input', e => {
            const k = e.target.dataset.set; if (!k) return;
            Settings[k] = parseFloat(e.target.value); Sound.applyVolumes(); Store.saveSettings();
            const lab = e.target.parentElement.querySelector('.val'); if (lab) lab.textContent = Math.round(Settings[k] * 100) + '%';
            if (k === 'sfx') Sound.sfx('hit_l');
        });
        Input.listeners.push(e => this.keyNav(e));
    },
    keyNav(e) {
        if (!this.cur || Input.captureCb) return;
        const btns = [...this.root.querySelectorAll('button:not([disabled]), input[type=range]')];
        if (!btns.length) return;
        const i = btns.indexOf(document.activeElement);
        const move = d => { btns[(i + d + btns.length) % btns.length].focus(); e.preventDefault(); };
        if (e.code === 'ArrowDown' || e.code === 'KeyS') move(1);
        else if (e.code === 'ArrowUp' || e.code === 'KeyW') move(-1);
        else if ((e.code === 'ArrowRight' || e.code === 'KeyD') && document.activeElement.tagName === 'BUTTON') move(1);
        else if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && document.activeElement.tagName === 'BUTTON') move(-1);
    },
    hide() { this.cur = null; this.back = null; this.root.innerHTML = ''; this.root.style.display = 'none'; },
    showLoading(id) { const b = document.getElementById('loading'); b.style.display = 'flex'; b.querySelector('b').textContent = tr('LOADING'); },
    hideLoading() { document.getElementById('loading').style.display = 'none'; },
    show(name, args = {}) {
        this.cur = name; this.args = args; this.back = null; this.root.style.display = 'flex';
        this.root.innerHTML = this.screens[name].call(this, args);
        this.root.className = 'scr-' + name; this.localize();
        const f = this.root.querySelector('[autofocus]') || this.root.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true });
        if (name === 'title') { Music.play('cathedral', 'calm'); Ambience.set('lava'); }
        if (name === 'credits') this.startCredits(args);
    },
    /** Literal labels in the templates translate here; dynamic text goes through tr() directly. */
    localize() {
        if (Settings.lang !== 'vi') return;
        const w = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue.trim(); if (t && VI[t]) n.nodeValue = VI[t]; }
    },
    act(what, arg, el) {
        const A = {
            continue: () => Game.continueGame(),
            opchars: () => { if (Game.loadSave()) { Game.state = 'menu'; this.show('select', { pick: Save.data.activeChar, from: 'hub' }); } },
            opmap: () => Game.continueGame(),
            newgame: () => { if (Save.exists()) this.show('confirm', { text: 'Starting a new game replaces your current save.', yes: 'pickdiff', no: 'title' }); else this.show('difficulty'); },
            pickdiff: () => this.show('difficulty'),
            diff: () => Game.newGame(arg),
            title: () => { Game.state = 'title'; Weather.set(null); VFX.reset(); this.show('title'); },
            settings: () => this.show('settings', { from: this.cur, tab: 'video', parent: this.args }),
            settab: () => this.show('settings', Object.assign({}, this.args, { tab: arg })),
            setback: () => this.show(this.args.from === 'pause' ? 'pause' : this.args.from === 'hub' ? 'hub' : 'title'),
            toggle: () => { Settings[arg] = !Settings[arg]; Store.saveSettings(); if (arg === 'scanlines') Game.applyVideo(); this.show('settings', this.args); },
            quality: () => { Settings.quality = +arg; Store.saveSettings(); if (Weather.kind) Weather.set(Weather.kind); this.show('settings', this.args); },
            lang: () => { Settings.lang = arg; Store.saveSettings(); this.show('settings', this.args); },
            res: () => { Settings.renderScale = +arg; Store.saveSettings(); Game.applyVideo(); this.show('settings', this.args); },
            fs: () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); setTimeout(() => this.show('settings', this.args), 180); },
            bind: () => { el.textContent = tr('PRESS A KEY'); Input.captureCb = code => { if (code !== 'Escape') { Object.keys(Settings.binds).forEach(k => { if (Settings.binds[k] === code) Settings.binds[k] = Settings.binds[arg]; }); Settings.binds[arg] = code; Store.saveSettings(); } this.show('settings', this.args); }; },
            bindreset: () => { Settings.binds = Object.assign({}, DEFAULT_BINDS); Store.saveSettings(); this.show('settings', this.args); },
            zoom: () => { Settings.camZoom = +arg; Store.saveSettings(); this.show('settings', this.args); },
            shake: () => { Settings.shake = +arg; Store.saveSettings(); this.show('settings', this.args); },
            credits: () => this.show('credits', {}),
            exit: () => this.show('exit'),
            winclose: () => { window.close(); },
            resume: () => Game.resume(),
            quitHub: () => { Save.write(); Game.state = 'menu'; Weather.set(null); Game.toHub(); },
            restartCp: () => { Game.deploy(G.level.id); },
            retry: () => Game.retry(),
            selpick: () => { this.args.pick = arg; this.show('select', this.args); },
            selok: () => { Save.data.activeChar = this.args.pick || Save.data.activeChar; Save.write(); if (this.args.next) this.args.next(); else this.show('hub'); },
            charsel: () => this.show('select', { pick: Save.data.activeChar, from: 'hub' }),
            hub: () => this.show('hub'),
            deploy: () => { const r = REGIONS.find(x => x.id === arg); const lvl = this.resumeLevel(r); Game.deploy(lvl); },
            skills: () => this.show('skills', { ch: Save.data.activeChar }),
            skch: () => this.show('skills', { ch: arg }),
            buy: () => { const ch = this.args.ch, c = Save.charData(ch), u = CHARS[ch].upgrades.find(x => x.id === arg); if (c.sp >= u.cost && !c.up[u.id]) { c.sp -= u.cost; c.up[u.id] = 1; Sound.sfx('levelup'); Save.write(); } else Sound.sfx('ui_deny'); this.show('skills', this.args); },
            equip: () => { const E = Save.data.equipped; const i = E.indexOf(arg); if (i >= 0) E[i] = null; else { const s = E.indexOf(null); E[s >= 0 ? s : 1] = arg; } Save.write(); this.show('relics'); },
            relics: () => this.show('relics'),
            archive: () => this.show('archive', { open: null }),
            arch: () => this.show('archive', { open: arg }),
            achievements: () => this.show('achievements'),
            resultsok: () => Game.afterResults(this.args.def),
            creditsdone: () => { if (this.args.ending) { this.stopCredits(); Game.playCut('postCredits', () => { this.show('title'); Game.state = 'title'; }); } else { this.stopCredits(); this.show('title'); } }
        };
        if (A[what]) A[what]();
    },
    /** Regions in progress resume at the right stage of multi-stage maps. */
    resumeLevel(r) {
        const D = Save.data;
        if (r.id === 'volcano') { if (D.cp && D.cp.level.startsWith('volcano')) return D.cp.level; if (D.cleared.volcano2) return 'volcano3'; if (D.cleared.volcano1) return 'volcano2'; return 'volcano1'; }
        return r.level;
    },
    regionOpen(i) { if (i === 0) return true; const D = Save.data; const prev = REGIONS[i - 1]; return !!(D.cleared[prev.level] || (prev.id === 'volcano' && D.cleared.volcano3)); },
    screens: {
        title() {
            const can = Save.exists();
            return `<div class="title"><div class="logo"><span>PROJECT ZERO</span><em>A O C A L Y S T</em><small>${Settings.lang === 'vi' ? 'NGÀY PHÁN XÉT' : 'THE DAY OF JUDGMENT'}</small></div>
            <nav>${can ? '<button data-do="continue" autofocus>CONTINUE</button>' : ''}
            <button data-do="newgame" ${can ? '' : 'autofocus'}>NEW GAME</button>
            <button data-do="opchars" ${can ? '' : 'disabled'}>CHARACTER SELECTION</button><button data-do="opmap" ${can ? '' : 'disabled'}>MAP SELECTION</button>
            <button data-do="settings">SETTINGS</button><button data-do="credits">CREDITS</button><button data-do="exit">EXIT</button></nav>
            <p class="hint">Arrow keys or mouse to navigate. Click once if you hear nothing: browsers wait for a first input before playing audio.</p></div>`;
        },
        exit() { return `<div class="panel small"><h2>EXIT</h2><p>Close this tab to leave the game. Your progress is saved at every beacon.</p><nav><button data-do="winclose">CLOSE TAB</button><button data-do="title">BACK</button></nav></div>`; },
        confirm(a) { return `<div class="panel small"><h2>ARE YOU SURE?</h2><p>${a.text}</p><nav><button data-do="${a.yes}">CONTINUE</button><button data-do="${a.no}" autofocus>CANCEL</button></nav></div>`; },
        difficulty() {
            this.back = () => this.show('title');
            return `<div class="panel"><h2>SELECT DIFFICULTY</h2><div class="cards">${Object.values(DIFFS).map(d => `<button class="card" data-do="diff" data-arg="${d.id}" ${d.id === 'normal' ? 'autofocus' : ''}><b>${tr(d.name)}</b><span>${tr(d.desc)}</span></button>`).join('')}</div><nav class="row"><button data-do="title">BACK</button></nav></div>`;
        },
        select(a) {
            const D = Save.data, pick = a.pick || D.activeChar, c = CHARS[pick], cd = Save.charData(pick);
            if (a.from === 'hub') this.back = () => this.show('hub');
            const bars = Object.entries(c.bars).map(([k, v]) => `<div class="stat"><label>${k}</label><i>${'▮'.repeat(v)}<u>${'▮'.repeat(5 - v)}</u></i></div>`).join('');
            return `<div class="panel wide"><h2>CHOOSE YOUR OPERATOR</h2><div class="sel"><div class="roster">${CHAR_ORDER.map(id => {
                const ch = CHARS[id], un = D.unlocked.includes(id); return `<button class="rost ${id === pick ? 'on' : ''}" data-do="selpick" data-arg="${id}" ${un ? '' : 'disabled'} style="--c:${ch.style.col.glow}"><b>${un ? ch.name : '? ? ?'}</b><span>${un ? tr(ch.role) : tr('LOCKED')}</span></button>`;
            }).join('')}</div>
            <div class="detail" style="--c:${c.style.col.glow}"><canvas id="selPreview" width="300" height="300"></canvas><div><h3>${c.name}</h3><h4>${tr(c.role)}  ·  ${tr('LV')} ${cd.level}</h4><q>${tr(c.line)}</q><p>${tr(c.bio)}</p>${bars}
            <p><b>${tr(c.passive.name)}.</b> ${tr(c.passive.desc)}</p>
            <p><b>${tr(c.skills.s1.name)}.</b> ${tr(c.skills.s1.desc)}<br><b>${tr(c.skills.s2.name)}.</b> ${tr(c.skills.s2.desc)}<br><b>${Settings.lang === 'vi' ? 'Tuyệt kỹ' : 'Ultimate'}: ${tr(c.ult.name)}.</b></p><p class="warn">${Settings.lang === 'vi' ? 'Điểm yếu' : 'Weakness'}: ${tr(c.weakness)}</p></div></div></div>
            <nav class="row"><button data-do="selok" autofocus>${a.next ? 'DEPLOY' : 'CONFIRM'}</button></nav></div>`;
        },
        hub() {
            const D = Save.data; const done = D.gameDone;
            setTimeout(() => this.startHubPreview(), 0);
            return `<div class="panel wide"><h2>MERIDIAN LINE: DISPATCH BOARD</h2><div class="hub"><div class="line">${REGIONS.map((r, i) => {
                const open = this.regionOpen(i), cleared = r.id === 'volcano' ? D.cleared.volcano3 : D.cleared[r.level], resume = D.cp && (D.cp.level === r.level || (r.id === 'volcano' && D.cp.level.startsWith('volcano')));
                return `<button class="stop ${cleared ? 'done' : ''}" data-do="deploy" data-arg="${r.id}" ${open ? '' : 'disabled'} style="--c:${r.col}"><b>${tr(open ? r.name : 'SIGNAL LOST')}</b><span>${tr(open ? r.desc : 'Clear the previous stop to reach this station.')}</span><em>${tr(cleared ? 'CLEARED, REPLAY' : resume ? 'RESUME AT BEACON' : open ? 'DEPLOY' : '')}</em></button>`;
            }).join('')}</div>
            <div class="side"><div class="op">${tr('OPERATOR')}<br><b>${CHARS[D.activeChar].name}</b><small>${tr('LV')} ${Save.charData(D.activeChar).level}  ·  ${D.cells} ◆</small></div>
            <button data-do="charsel">CHANGE OPERATOR</button><button data-do="skills">${tr('SKILLS')} ${Object.values(D.chars).some(c => c.sp > 0) ? '●' : ''}</button><button data-do="relics">RELICS</button><button data-do="archive">${tr('ARCHIVE')} ${D.lore.length}/${Object.keys(LORE).length}</button><button data-do="achievements">${tr('ACHIEVEMENTS')} ${D.ach.length}/${Object.keys(ACHIEVEMENTS).length}</button><button data-do="settings">SETTINGS</button><button data-do="title">MAIN MENU</button></div></div></div>`;
        },
        skills(a) {
            const D = Save.data, ch = a.ch, c = CHARS[ch], cd = Save.charData(ch);
            this.back = () => this.show('hub');
            return `<div class="panel wide"><h2>SKILLS</h2><nav class="tabs">${D.unlocked.map(id => `<button class="${id === ch ? 'on' : ''}" data-do="skch" data-arg="${id}">${tr(CHARS[id].title)}</button>`).join('')}</nav>
            <p class="center"><b>${c.name}</b>  ·  ${tr('LV')} ${cd.level}  ·  XP ${Math.floor(cd.xp)}/${Save.xpNeed(cd.level)}  ·  <b>${cd.sp} SP</b></p>
            <div class="grid">${c.upgrades.map(u => { const own = cd.up[u.id]; return `<button class="card ${own ? 'owned' : ''}" data-do="buy" data-arg="${u.id}" ${own || cd.sp < u.cost ? 'disabled' : ''}><b>${tr(u.name)}</b><span>${tr(u.desc)}</span><em>${own ? tr('LEARNED') : u.cost + ' SP'}</em></button>`; }).join('')}</div>
            <nav class="row"><button data-do="hub" autofocus>BACK</button></nav></div>`;
        },
        relics() {
            const D = Save.data; this.back = () => this.show('hub');
            return `<div class="panel wide"><h2>RELICS</h2><p class="center">${tr('EQUIPPED')}: ${D.equipped.filter(Boolean).map(r => tr(RELICS[r].name)).join(', ') || '-'} (2)</p>
            <div class="grid">${Object.entries(RELICS).map(([id, r]) => { const has = D.relics.includes(id), on = D.equipped.includes(id); return `<button class="card ${on ? 'owned' : ''}" data-do="equip" data-arg="${id}" ${has ? '' : 'disabled'}><b>${has ? tr(r.name) : '? ? ?'}</b><span>${tr(has ? r.desc : 'Not found yet.')}</span><em>${tr(on ? 'EQUIPPED' : has ? 'EQUIP' : '')}</em></button>`; }).join('')}</div>
            <nav class="row"><button data-do="hub" autofocus>BACK</button></nav></div>`;
        },
        archive(a) {
            const D = Save.data; this.back = () => this.show('hub');
            const open = a.open && LORE[a.open];
            return `<div class="panel wide"><h2>ARCHIVE</h2><div class="arch"><div class="list">${Object.entries(LORE).map(([id, l]) => { const has = D.lore.includes(id); return `<button data-do="arch" data-arg="${id}" ${has ? '' : 'disabled'} class="${a.open === id ? 'on' : ''}">${tr(has ? l.title : '[ UNRECOVERED ]')}</button>`; }).join('')}</div><div class="read">${open ? `<h3>${tr(open.title)}</h3><p>${tr(open.text)}</p>` : '<p>Select a recovered log.</p>'}</div></div><nav class="row"><button data-do="hub">BACK</button></nav></div>`;
        },
        achievements() {
            const D = Save.data; this.back = () => this.show('hub');
            return `<div class="panel wide"><h2>ACHIEVEMENTS</h2><div class="grid three">${Object.entries(ACHIEVEMENTS).map(([id, a]) => `<div class="card ${D.ach.includes(id) ? 'owned' : 'off'}"><b>${tr(a.name)}</b><span>${tr(a.desc)}</span></div>`).join('')}</div><p class="center">${tr('Enemies defeated')} ${D.stats.kills}  ·  ✝ ${D.stats.deaths}  ·  ${tr('Time')} ${U.fmtTime(D.stats.time)}</p><nav class="row"><button data-do="hub" autofocus>BACK</button></nav></div>`;
        },
        settings(a) {
            this.args = a; this.back = () => this.act('setback');
            const tab = a.tab || 'video', B = (cond, what, arg, label) => `<button class="${cond ? 'on' : ''}" data-do="${what}" data-arg="${arg}">${label}</button>`, Sl = (k, l) => `<label class="slide">${l}<input type="range" min="0" max="1" step="0.05" value="${Settings[k]}" data-set="${k}"><span class="val">${Math.round(Settings[k] * 100)}%</span></label>`;
            const pages = {
                video: `<h3>Graphics quality</h3><div class="opts">${B(Settings.quality === 0, 'quality', 0, 'LOW')}${B(Settings.quality === 1, 'quality', 1, 'MEDIUM')}${B(Settings.quality === 2, 'quality', 2, 'HIGH')}</div>
                    <h3>Language</h3><div class="opts">${B(Settings.lang === 'vi', 'lang', 'vi', 'TIẾNG VIỆT')}${B(Settings.lang === 'en', 'lang', 'en', 'ENGLISH')}</div>
                    <h3>Resolution</h3><div class="opts">${B(Settings.renderScale === 0, 'res', 0, 'AUTO')}${B(Settings.renderScale === .75, 'res', .75, '960×540')}${B(Settings.renderScale === 1, 'res', 1, '1280×720')}${B(Settings.renderScale === 1.5, 'res', 1.5, '1920×1080')}</div>
                    <h3>Display</h3><div class="opts"><button class="${document.fullscreenElement ? 'on' : ''}" data-do="fs">${document.fullscreenElement ? 'FULLSCREEN' : 'WINDOWED'}</button>${B(Settings.scanlines, 'toggle', 'scanlines', 'SCANLINES ' + (Settings.scanlines ? 'ON' : 'OFF'))}${B(Settings.dmgNumbers, 'toggle', 'dmgNumbers', 'DAMAGE NUMBERS ' + (Settings.dmgNumbers ? 'ON' : 'OFF'))}${B(Settings.showFps, 'toggle', 'showFps', 'FPS ' + (Settings.showFps ? 'ON' : 'OFF'))}</div>`,
                audio: `${Sl('master', 'Master')}${Sl('music', 'Music')}${Sl('sfx', 'Sound effects')}${Sl('ambient', 'Ambience')}`,
                controls: `<div class="binds">${Object.keys(DEFAULT_BINDS).map(k => `<div><label>${k}</label><button data-do="bind" data-arg="${k}">${HUD.keyName(Settings.binds[k])}</button></div>`).join('')}</div><div class="opts">${B(Settings.autoAim, 'toggle', 'autoAim', 'AUTO-AIM ' + (Settings.autoAim ? 'ON' : 'OFF'))}<button data-do="bindreset">RESET KEYS</button></div><p class="hint">Gamepads work automatically. Arrow keys and J, U, I, O also work as alternatives.</p>`,
                camera: `<h3>Camera zoom</h3><div class="opts">${B(Settings.camZoom === .9, 'zoom', .9, 'FAR')}${B(Settings.camZoom === 1, 'zoom', 1, 'NORMAL')}${B(Settings.camZoom === 1.1, 'zoom', 1.1, 'CLOSE')}</div><h3>Screen shake</h3><div class="opts">${B(Settings.shake === 0, 'shake', 0, 'OFF')}${B(Settings.shake === .5, 'shake', .5, 'LOW')}${B(Settings.shake === 1, 'shake', 1, 'FULL')}</div>`
            };
            return `<div class="panel wide"><h2>SETTINGS</h2><nav class="tabs">${['video', 'audio', 'controls', 'camera'].map(t => `<button class="${t === tab ? 'on' : ''}" data-do="settab" data-arg="${t}">${tr(t.toUpperCase())}</button>`).join('')}</nav><div class="page">${pages[tab]}</div><nav class="row"><button data-do="setback">BACK</button></nav></div>`;
        },
        pause() {
            this.back = () => Game.resume();
            return `<div class="panel small"><h2>PAUSED</h2><p class="center">${tr(G.level.name)}<br><small>${tr(G.objective)}</small></p><nav><button data-do="resume" autofocus>RESUME</button><button data-do="restartCp">RESTART FROM BEACON</button><button data-do="settings">SETTINGS</button><button data-do="quitHub">DISPATCH BOARD</button></nav></div>`;
        },
        gameover() {
            return `<div class="panel small over"><h2>CONSUMED BY THE VOID</h2><p class="center">${Settings.lang === 'vi' ? 'Sát thương gây ra' : 'Damage dealt'}: ${Save.run.damageDealt}</p><nav><button data-do="retry" autofocus>RETURN TO BEACON</button><button data-do="quitHub">DISPATCH BOARD</button></nav></div>`;
        },
        results(a) {
            const R = a.def.reward, D = Save.data; const rel = R.relic ? RELICS[R.relic].name : null, shard = { r: 'RUBY CORE', g: 'EMERALD CORE', b: 'SAPPHIRE CORE' }[R.shard];
            return `<div class="panel small"><h2>${tr(a.def.name)}</h2><ul class="res"><li>${tr('Experience')} <b>+${R.xp}</b></li><li>${tr('Aether cells')} <b>+${R.cells}</b></li>${rel ? `<li>${tr('Relic')} <b>${tr(rel)}</b></li>` : ''}${shard ? `<li>${tr('Shard')} <b>${shard}</b></li>` : ''}<li>${tr('Time')} <b>${U.fmtTime(Save.run.time)}</b></li><li>${tr('Enemies defeated')} <b>${Save.run.kills}</b></li></ul><nav><button data-do="resultsok" autofocus>CONTINUE</button></nav></div>`;
        },
        credits(a) {
            this.back = a.ending ? null : () => this.act('creditsdone');
            const roles = [['PROJECT ZERO: AOCALYST', ''], ['Based on', 'PROJECT: ZERO, THE ENDBRINGER'], ['Game direction, code, art, music and sound', 'Generated procedurally in the browser'], ['Original game concept', 'Vo Phat Dat'], ['Engine', 'HTML5 Canvas and Web Audio, no external assets'], ['ROOK ADEYEMI', 'Vanguard'], ['SABLE VU', 'Phantom'], ['MIRAE SOL', 'Arcanist'], ['YSOLDE VARR', 'Warden'], ['ZERO', 'Anchor'], ['In memory of', 'everyone left on the platform'], ['Thank you for playing', 'The doors stay open.']];
            return `<div class="credits"><div class="roll" id="roll">${roles.map(r => `<h3>${tr(r[0])}</h3><p>${tr(r[1])}</p>`).join('')}</div><button data-do="creditsdone">${a.ending ? 'CONTINUE' : 'BACK'}</button></div>`;
        }
    },
    startCredits(a) {
        const roll = document.getElementById('roll'); let y = 720; this.stopCredits();
        Music.play('ending', 'calm');
        this.credT = setInterval(() => { y -= 1; roll.style.transform = `translateY(${y}px)`; if (y < -roll.scrollHeight - 40) { clearInterval(this.credT); if (a.ending) this.act('creditsdone'); else y = 720; } }, 26);
    },
    stopCredits() { clearInterval(this.credT); },
    /** Live rig preview on the character select screen. */
    startHubPreview() { },
    previewTick() {
        const cv = document.getElementById('selPreview'); if (!cv) { this.prev = null; return; }
        const id = this.args.pick || Save.data.activeChar;
        if (!this.prev || this.prev.id !== id) { const r = new Rig(CHARS[id].style); r.owner = { element: 0, charge: 0 }; this.prev = { id, r, n: 0 }; }
        const P = this.prev, c = cv.getContext('2d'); P.n++;
        if (P.n % 300 === 80) P.r.play('victory', 12); if (P.n % 300 === 180) P.r.play('run', 12); if (P.n % 300 === 280) P.r.play('idle', 12);
        P.r.gaitAmt = 1; P.r.phase += .36; P.r.tick(); P.r.updateChain(150, 250, 1, -.5);
        c.clearRect(0, 0, 300, 300); c.save(); c.translate(150, 262); c.scale(2.6, 2.6); c.translate(-150, -250);
        P.r.draw(c, 150, 250, 1); c.restore();
    }
};
