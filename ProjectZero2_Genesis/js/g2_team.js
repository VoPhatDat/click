'use strict';
/**
 * G2 TEAM: Team Up for the last map, and Nyx's revival.
 *   - At the start of the last map a notice asks: fight with everyone, or as Nyx and Zero?
 *   - Team Up: every companion of the journey fights at once, each driven by its own AI. They have
 *     health, read telegraphs and get out of them, spread out around the god, use their skills, and
 *     fall when their health runs out. The camera pulls back so the whole party is in view.
 *   - The Lullaby of Return: Sable (Death) teaches it to Nyx at the end of Day Five. Every blow the
 *     party lands fills Nyx's Night Spirit; when it is full, a fallen companion is sung back to the fight.
 *     Outside the last map it catches the player once, when the gauge is full.
 */
const TEAM_IDS = ['nyx', 'zero', 'vesper', 'rook', 'sable', 'mirae', 'ysolde'];
G2.spirit = { v: 0, add(n) { if (!Save.data || !Save.data.g2.reviveLearned) return; this.v = Math.min(100, this.v + n); } };
G2.team = {
    on: false,
    // the companions join only when the god shows its final form; before that the party fights by switching
    arrive() { if (this.on) return; this.spawn(this.want !== false); const A = G.arena, P = G.player; (G.allies || []).forEach((a, i) => { a.x = U.clamp(P.x + (i % 2 ? 1 : -1) * (70 + (i >> 1) * 70), A.x0 + 60, A.x1 - 60); a.y = A.y - 2; a.safe = { x: a.x, y: a.y }; a.vx = a.vy = 0; a.inv = 120; const col = CHARS[a.id].style.col.glow; VFX.ring(a.x, a.y - 34, 120, col, 22, 8); VFX.burst(a.x, a.y - 34, col, 20, 6, 30, 6, 1); }); },
    spawn(full) {
        const P = G.player, ids = full ? TEAM_IDS.filter(id => id !== P.id && CHARS[id] && (id !== 'zero' || Save.data.g2.zeroBack || true)) : ['zero'].filter(id => id !== P.id);
        G.allies = []; G.ally = null;
        ids.forEach((id, i) => { const a = new Player(id); a.isAlly = true; a.isTeam = true; a.brain = G2.teamBrain; a.lane = (i % 2 ? 1 : -1) * (120 + (i >> 1) * 110); a.slot = i; a.x = P.x - 80 - i * 40; a.y = P.y; a.safe = { x: a.x, y: a.y }; a.grounded = true; a.facing = 1; if (id === 'nyx') a.rig.S = nyxStyle(17); a.wIdx = 0; a.applyWeapon && a.applyWeapon(); G.allies.push(a); });
        this.on = true; G.g2team = !!full;
    },
    alive() { return (G.allies || []).filter(a => !a.down); },
    // the one you control has fallen: the first companion still standing takes over, the fallen one waits for the song
    handOver(old) { const next = this.alive()[0]; if (!next) return false; G.allies.splice(G.allies.indexOf(next), 1); next.isAlly = false; old.isAlly = true; old.down = true; old.hp = 0; old.state = 'move'; old.script = null; old.brain = G2.teamBrain; old.lane = next.lane; old.slot = next.slot; G.allies.push(old); G.player = next; next.inv = 90; G.toast(CHARS[old.id].name + ' ' + tr('has fallen'), '#ff8a8a'); VFX.burst(old.x, old.y - 34, CHARS[old.id].style.col.glow, 30, 7, 30, 6, 1); return true; },
    down() { return (G.allies || []).filter(a => a.down); }
};
// A companion's mind: get out of what is about to land, then go to its place around the target and fight.
G2.teamBrain = function (z) {
    const S = {}, A = G.arena, b = G.boss, go = d => { if (d < 0) S.left = true; else if (d > 0) S.right = true; }, hb = z.hurtBox;
    if (z.state === 'dead' || z.down) return S;
    let danger = false;
    for (const w of G.warns) {
        if (!w.dmg || w.t > 34) continue;
        if (w.shape === 'rect') { const x0 = Math.min(w.x, w.x + w.w), x1 = Math.max(w.x, w.x + w.w); if (hb.x + hb.w > x0 - 14 && hb.x < x1 + 14 && hb.y + hb.h > w.y && hb.y < w.y + w.h) { danger = true; if (x1 - x0 > 600 && w.h < 160) { if (w.y > z.y - 100) { if (z.grounded && w.t < 18) { S['!jump'] = S.jump = true; } } } else go(z.x < (x0 + x1) / 2 ? -1 : 1); if (w.t < 9 && z.dodgeCd <= 0) S['!dodge'] = true; } }
        else if (w.shape === 'circle' && Math.hypot(z.x - w.x, z.y - 30 - w.y) < w.r + 30) { danger = true; go(z.x < w.x ? -1 : 1); if (w.t < 10 && z.dodgeCd <= 0) S['!dodge'] = true; }
    }
    for (const p of G.projs) if (!p.friendly && Math.abs(p.x - z.x) < 90 && Math.abs(p.y - (z.y - 34)) < 70 && z.dodgeCd <= 0 && Math.random() < .25) { S['!dodge'] = true; danger = true; }
    if (danger) return S;
    if (!b || b.dead || b.intro || b.untargetable || b.transition) { const want = G.player.x + (z.lane || -80) * .6; if (Math.abs(want - z.x) > 40) go(want - z.x); return S; }
    const a = b.aim(), box = b.box(), ranged = z.def.ranged, tx = U.clamp(a.x + (ranged ? z.lane * 2.2 : z.lane * .6), A.x0 + 40, A.x1 - 40), dx = tx - z.x;
    if (Math.abs(dx) > (ranged ? 50 : 30)) go(dx); else z.facing = U.sign(a.x - z.x) || 1;
    // dash to close the distance, like anyone would
    if (Math.abs(dx) > 380 && z.dodgeCd <= 0 && z.grounded && (G.time + z.slot * 7) % 45 === 0) { z.facing = U.sign(dx); S['!dodge'] = true; }
    const reach = !ranged && Math.abs(a.x - z.x) < box.w / 2 + 70 && z.y > box.y && z.y - 80 < box.y + box.h;
    if (ranged || reach) { z.facing = U.sign(a.x - z.x) || 1; if ((G.time + z.slot * 3) % (ranged ? 5 : 4) === 0) { S['!attack'] = true; S.attack = true; } else S.attack = ranged; }
    // melee against something tall: jump, jump again at the top, and cut on the way
    if (!ranged && box.y + box.h < z.y - 60 && Math.abs(a.x - z.x) < box.w / 2 + 160) {
        if (z.grounded && (G.time + z.slot * 11) % 34 === 0) S['!jump'] = S.jump = true;
        else if (!z.grounded && z.vy > -3 && z.jumps < 2) S['!jump'] = S.jump = true;
        if (!z.grounded) { S.jump = true; z.facing = U.sign(a.x - z.x) || 1; if ((G.time + z.slot) % 4 === 0) S['!attack'] = S.attack = true; }
    }
    const k = (G.time + z.slot * 37) % 600; if (k === 100) S['!skill1'] = true; if (k === 260 && z.id !== 'nyx') S['!skill2'] = true; if (k === 420 && z.id !== 'ysolde') S['!skill3'] = true; if (z.ult >= 100 && (G.time + z.slot * 50) % 400 === 0) S['!ult'] = true;
    if (z.form && z.balance < 20 && G.time % 40 === 0) S['!form'] = true; if (z.form === 'wrath' && z.balance > 78) S['!form'] = true;
    return S;
};
// Companions are hit by the same telegraphs and shots as the player, and fall instead of dying.
G2.teamHits = function () {
    const L = G2.team.alive(); if (!L.length) return;
    for (const w of G.warns) { if (!w.dmg || w.t > 1 || w._team) continue; w._team = true;
        for (const z of L) { if (z.inv > 0) continue; const hb = z.hurtBox; let hit = false;
            if (w.shape === 'rect') { const x0 = Math.min(w.x, w.x + w.w), x1 = Math.max(w.x, w.x + w.w); hit = hb.x + hb.w > x0 && hb.x < x1 && hb.y + hb.h > w.y && hb.y < w.y + w.h; }
            else if (w.shape === 'circle') hit = Math.hypot(z.x - w.x, z.y - 30 - w.y) < w.r + 14;
            else if (w.shape === 'safe') hit = Math.hypot(z.x - w.x, z.y - 30 - w.y) > w.r;
            else if (w.shape === 'cone') { const a = Math.atan2(z.y - 30 - w.y, z.x - w.x); hit = Math.abs(U.normAngle(a - w.ang)) < w.spread / 2 && Math.hypot(z.x - w.x, z.y - 30 - w.y) < w.r; }
            else if (w.shape === 'light') hit = !Shadow.covered(w.lx, w.ly, z.x, z.y - 34);
            if (hit) z.hurt(w.dmg, { owner: w.src }); } }
    for (const p of G.projs) { if (p.friendly || p.dead) continue; for (const z of L) if (z.inv <= 0 && Math.abs(p.x - z.x) < 16 + (p.r || 6) && Math.abs(p.y - (z.y - 34)) < 30 + (p.r || 6)) { z.hurt(p.dmg || 10, { owner: p.owner }); p.life = 0; p.dead = true; break; } }
};
(function () {
    const hurt = Player.prototype.hurt;
    Player.prototype.hurt = function (dmg, src) {
        if (this.isTeam && this.isAlly) {
            if (this.down || this.inv > 0) return false; dmg *= .85;
            if (this.hp - dmg <= 0) { this.down = true; this.hp = 0; this.inv = 0; VFX.burst(this.x, this.y - 34, CHARS[this.id].style.col.glow, 30, 7, 30, 6, 1); Sound.sfx('hurt', { p: .7 }); G.toast(CHARS[this.id].name + ' ' + tr('has fallen'), '#ff8a8a'); G.say(CHARS[this.id].name, tr(U.pick(['...Nyx. Sorry.', 'I am down!', 'Keep going without me...'])), 90); return true; }
            this.hp -= dmg; this.inv = 30; this.rig.flash = 6; return true;
        }
        // The player: the Lullaby of Return catches a lethal blow when the spirit is full.
        if (this === G.player && Save.data && Save.data.g2.reviveLearned && this.inv <= 0 && this.hp - dmg * (Game.diff.dmgTaken || 1) <= 0 && this.state !== 'dead') {
            if (G2.spirit.v >= 100) { G2.spirit.v = 0; this.hp = Math.round(this.maxHp * .5); this.inv = 150; VFX.ring(this.x, this.y - 34, 220, '#b48cff', 30, 12); Sound.sfx('checkpoint'); G.toast(tr('Lullaby of Return'), '#e0d0ff'); return false; }
            // with the team, the fallen player hands over to a companion until the spirit can bring her back
            if (G2.team.on && G2.team.alive().length) { G2.team.handOver(this); return false; }
        }
        return hurt.call(this, dmg, src);
    };
    // whatever the cause (a hazard, a modifier the check above did not see), a fall with the team never ends the run
    const die = Player.prototype.die; Player.prototype.die = function (...a) { if (this === G.player && G2.team.on && G.boss && G2.team.alive().length && G2.team.handOver(this)) return; return die.apply(this, a); };
    // The spirit fills with every blow anyone lands, a little over time too; full, it sings someone back.
    const bh = Boss.prototype.hurt; Boss.prototype.hurt = function (dmg, o) { const s = o && (o.src || o.owner); if (s && s.isTeam && s.isAlly) dmg *= .28; const r = bh.call(this, dmg, o); if (r > 0) G2.spirit.add(r * (G2.team.on ? .012 : .02)); return r; };
    const eh = Enemy.prototype.hurt; if (eh) Enemy.prototype.hurt = function (...a) { const r = eh.apply(this, a); if (r) G2.spirit.add(.5); return r; };
    const tick = G.tick.bind(G);
    G.tick = function () {
        tick(); if (!G2.team.on || !G.level) return; const B = G.boss; G2.teamHits(); G2.spirit.add(.015);
        // keep everyone inside the arena once its gate has closed (a companion left outside could never come back)
        const Ar = G.arena; if (B && Ar) for (const z of [G.player, ...(G.allies || [])]) { if (z.x < Ar.x0 + 24 || z.x > Ar.x1 - 24) { z.x = U.clamp(z.x, Ar.x0 + 40, Ar.x1 - 40); z.vx = 0; } if (z.safe.x < Ar.x0 + 24 || z.safe.x > Ar.x1 - 24) z.safe = { x: U.clamp(G.player.x, Ar.x0 + 60, Ar.x1 - 60), y: Ar.y - 2 }; }
        const fallen = G2.team.down(); if (G2.spirit.v >= 100 && fallen.length) { const z = fallen[0]; G2.spirit.v = 0; z.down = false; z.hp = Math.round(z.maxHp * .6); z.inv = 120; z.state = 'move'; z.x = G.player.x - 60; z.y = G.player.y; z.vy = 0; VFX.ring(z.x, z.y - 34, 240, '#b48cff', 32, 14); VFX.burst(z.x, z.y - 34, '#e0d0ff', 30, 6, 40, 6, 1); Sound.sfx('checkpoint'); G.say('NYX', tr(U.pick(['Come back. I am singing for you.', 'Not yet. Wake up!', 'Back to us. Please.'])), 110); G.toast(tr('Lullaby of Return') + ': ' + CHARS[z.id].name, '#e0d0ff'); }
        if (!G2.team.alive().length && G.player.state === 'dead') G.allies.forEach(a => { a.down = false; a.hp = Math.round(a.maxHp * .6); });
    };
    // Wide camera: the whole arena and the whole party.
    const camTick = G.camTick.bind(G);
    G.camTick = function () { camTick(); if ((G2.team.on || G.boss && G.boss.ascended) && G.boss && G.arena && !G.cineCam) { const c = G.cam, A = G.arena; c.tz = Math.min(c.tz, (VW / (A.x1 - A.x0 + 200))); c.zoom = U.lerp(c.zoom, c.tz, .05); const vw = VW / c.zoom, vh = VH / c.zoom; const tx = (A.x0 + A.x1) / 2 - vw / 2, ty = A.y - vh * (G.boss.ascended ? .9 : .86); c.x = U.lerp(c.x, tx, .08); c.y = U.lerp(c.y, Math.max(0, Math.min(ty, G.level.ph - vh)), .08); } };
    // Switching with the team swaps who you control; the one you leave becomes AI.
    const sw = G2.swapParty; G2.swapParty = function (to) {
        if (!G2.team.on || !G.allies) return sw(to); const list = G2.team.alive(), P = G.player; if (!list.length) return;
        const next = to ? list.find(a => a.id === to) : list[0]; if (!next) return sw(to);
        G.allies.splice(G.allies.indexOf(next), 1); next.isAlly = false; P.isAlly = true; P.brain = G2.teamBrain; P.lane = next.lane; P.slot = next.slot; G.allies.push(P); G.player = next; VFX.burst(next.x, next.y - 34, CHARS[next.id].style.col.glow, 16, 5, 22, 5, 1); G.toast(CHARS[next.id].name, CHARS[next.id].style.col.glow);
    };
    // The notice at the start of the last map: decide before the fight, so the fight never stops.
    const ll = Game.loadLevel.bind(Game);
    Game.loadLevel = function (id, cp) {
        G2.team.on = false; G.allies = null; G.g2team = false; ll(id, cp);
        if (id === 'architect2') { const ask = () => { if (HEADLESS) { G2.team.want = !G.flags.noTeam; return; } if (cp && G2.team.last !== undefined) { G2.team.want = G2.team.last; return; } Game.state = 'menu'; UI.show('g2teamup'); }; G.delay ? G.delay(20, ask) : ask(); }
    };
    Object.assign(UI.screens, { g2teamup() { const n = TEAM_IDS.filter(id => CHARS[id] && id !== 'nyx').length; return `<div class="panel small"><h2>${tr('TEAM UP?')}</h2><p>${tr('The last battle is close. Everyone who walked this road with Nyx is here.')}</p><p class="hint">${tr('Team Up: all your companions fight at once, each on their own. They can fall; Nyx\'s Lullaby of Return brings them back when her Night Spirit is full. Otherwise: Nyx and Zero, side by side, and the others by switching.')}</p><nav><button data-do="g2team" data-arg="1" autofocus>${tr('TEAM UP')} (${n + 1})</button><button data-do="g2team" data-arg="0">${tr('Nyx and Zero')}</button></nav></div>`; } });
    const act = UI.act.bind(UI); UI.act = function (w, arg, el) { if (w === 'g2team') { UI.hide(); Game.state = 'play'; G2.team.last = G2.team.want = arg === '1'; Input.held = {}; return; } return act(w, arg, el); };
    // HUD: the Night Spirit, and the party's health.
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) {
        hd(c); if (!Save.data || !Save.data.g2.reviveLearned || !G.player || Game.state !== 'play' || G.letterbox) return;
        const x = 18, y = 112, v = G2.spirit.v / 100; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y, 180, 7); const g = c.createLinearGradient(x, 0, x + 180, 0); g.addColorStop(0, '#5a3ac0'); g.addColorStop(1, '#e0d0ff'); c.fillStyle = g; c.fillRect(x, y, 180 * v, 7); if (v >= 1) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(x - 1, y - 1, 182, 9); }
        c.font = '10px "Palatino Linotype", serif'; c.textAlign = 'left'; c.fillStyle = '#e0d0ff'; c.fillText(tr('Night Spirit') + (v >= 1 ? ' ✦' : ''), x, y - 3);
        if (G2.team.on && G.allies) G.allies.forEach((a, i) => { const yy = 126 + i * 15; c.fillStyle = a.down ? '#6a5a6a' : '#e8d8ff'; c.fillText(CHARS[a.id].name, x, yy + 7); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x + 64, yy, 90, 6); c.fillStyle = a.down ? '#4a3a4a' : CHARS[a.id].style.col.glow; c.fillRect(x + 64, yy, 90 * Math.max(0, a.hp / a.maxHp), 6); if (a.down) { c.fillStyle = '#ff8a8a'; c.fillText('✝', x + 158, yy + 7); } });
    };
})();
Object.assign(VI, {
    'TEAM UP?': 'CÙNG CHIẾN ĐẤU?', 'The last battle is close. Everyone who walked this road with Nyx is here.': 'Trận chiến cuối cùng đã tới gần. Tất cả những người đã đi cùng Nyx trên con đường này đều ở đây.',
    'Team Up: all your companions fight at once, each on their own. They can fall; Nyx\'s Lullaby of Return brings them back when her Night Spirit is full. Otherwise: Nyx and Zero, side by side, and the others by switching.': 'Cùng chiến đấu: tất cả đồng đội cùng lúc lao vào trận, mỗi người tự đánh theo cách của mình. Họ có thể gục; khi thanh Linh Lực Đêm đầy, Bài Ru Gọi Về của Nyx sẽ đưa họ trở lại. Nếu không: Nyx và Zero sánh vai, những người khác đổi vào bằng phím đổi người.',
    'TEAM UP': 'CÙNG CHIẾN ĐẤU', 'Nyx and Zero': 'Chỉ Nyx và Zero', 'has fallen': 'đã gục', '...Nyx. Sorry.': '...Nyx. Xin lỗi.', 'I am down!': 'Tôi gục rồi!', 'Keep going without me...': 'Đánh tiếp đi, đừng lo cho tôi...',
    'Lullaby of Return': 'Bài Ru Gọi Về', 'Come back. I am singing for you.': 'Quay về đi. Em đang hát gọi đây.', 'Not yet. Wake up!': 'Chưa được đâu. Dậy đi!', 'Back to us. Please.': 'Quay lại với bọn em đi. Làm ơn.', 'Night Spirit': 'Linh Lực Đêm'
});
