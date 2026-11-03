'use strict';
/**
 * G2 WORLD: what every chapter shares.
 *   - Nyx grows up: her body, weapons and night powers change with the chapter (Appendix A)
 *   - the party: the Four Riders join at the end of Day Five; from Day Six you switch on the fly
 *   - water you can swim in, with breath (Day Two)
 *   - a mercy choice for every boss, with its own question; some choices can be locked
 *   - Shards of Peace, one hidden in every day; the Garden remembers what you did
 *   - the order of the days and what happens after each boss
 */
/* ------------------------------ NYX GROWS UP ------------------------------ */
Object.assign(Gear, {
    woodsword(c) { c.fillStyle = Paint.c('#5a3a1e'); c.fillRect(-2.5, -3, 5, 9); c.fillStyle = Paint.c('#8a6a3a'); c.fillRect(-7, 5, 14, 3); Paint.poly(c, [-3, 8, 3, 8, 2.6, 36, 0, 42, -2.6, 36], '#c8a070'); c.strokeStyle = Paint.c('#7a5a30'); c.lineWidth = .8; c.beginPath(); c.moveTo(0, 12); c.lineTo(0, 34); c.stroke(); },
    lantern(c, J, S, r) { c.strokeStyle = Paint.c('#3a3050'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke(); c.fillStyle = Paint.c('#2a2440'); c.fillRect(-7, 12, 14, 3); c.fillRect(-7, 30, 14, 3); Paint.glow(c, 0, 22, 26, '#6a4ae0'); Paint.disc(c, 0, 22, 6.5, '#1a1030'); Paint.disc(c, 0, 22, 3, '#b48cff'); c.strokeStyle = Paint.c('#3a3050'); for (const dx of [-6, 0, 6]) { c.beginPath(); c.moveTo(dx, 14); c.lineTo(dx, 30); c.stroke(); } },
    nyxblade(c, J, S, r) { c.fillStyle = Paint.c('#262a33'); c.fillRect(-4, -4, 8, 10); c.fillStyle = Paint.c('#b48cff'); c.fillRect(-7, 5, 14, 3); Paint.poly(c, [-3, 8, 3, 8, 2.5, 50, 0, 58, -2.5, 50], '#e8dcff'); c.strokeStyle = Paint.c('#6a3ac0'); c.lineWidth = 1; c.beginPath(); c.moveTo(0, 14); c.lineTo(1.5, 24); c.lineTo(-1, 33); c.lineTo(1, 44); c.stroke(); Paint.glow(c, 0, 32, 20, '#8a5aff'); },
    dragged(c) { c.save(); c.rotate(1.25); c.fillStyle = Paint.c('#262a33'); c.fillRect(-4, -4, 8, 10); Paint.poly(c, [-3, 8, 3, 8, 2.5, 48, 0, 56, -2.5, 48], '#9aa2b0'); c.restore(); }
});
const NYX_WEAPONS = {
    hands: { id: 'hands', name: 'Bare Hands', desc: 'Nothing to hold yet.', gear: null, len: 10 },
    wood: { id: 'wood', name: 'Wooden Sword', desc: 'Zero carved it for you. "Not for fighting. So you know that you can."', gear: 'woodsword', len: 40,
        atks: chain3([AT('down', 6, 4, 10, [4, -56, 60, 50], .7, { col: '#e8d0a0' }), AT('up', 6, 4, 10, [4, -58, 60, 52], .7, { col: '#e8d0a0' }), AT('thrust', 8, 5, 14, [0, -52, 80, 40], 1.2, { col: '#fff0c8', move: 7, kb: 7, stag: 26 })]),
        heavy: AT('slam', 12, 5, 18, [2, -70, 80, 70], 1.8, { kb: 9, kby: -4, stag: 40, hit: 'hit_h', sfx: 'swing_h', col: '#fff0c8' }) },
    lantern: { id: 'lantern', name: 'Night Lantern', desc: 'A lantern that gives off darkness. Its shot puts lesser foes to sleep for a moment.', gear: 'lantern', len: 30, ranged: true, rate: 20, shot: { kind: 'orb', spd: 9, dmg: .8, r: 9, life: 70, col: '#8a5aff', sleep: 50 } },
    blade: { id: 'blade', name: 'Zero’s Sword', desc: 'It glows for you as well, but with the blue-violet of night, not his gold.', gear: 'nyxblade', len: 56,
        atks: chain3([AT('down', 5, 4, 8, [4, -66, 76, 62], .85, { col: '#d8c8ff' }), AT('up', 5, 4, 8, [4, -70, 76, 66], .85, { col: '#d8c8ff' }), AT('down', 6, 4, 10, [4, -72, 82, 70], 1, { col: '#e8dcff', move: 4 }), AT('thrust', 8, 5, 16, [0, -64, 108, 50], 1.6, { col: '#ffffff', move: 9, kb: 8, stag: 30, hit: 'hit_h', sfx: 'swing_m', shake: 4 })]),
        heavy: AT('slam', 12, 5, 18, [2, -90, 106, 92], 2.4, { kb: 11, kby: -5, stag: 50, hit: 'hit_h', sfx: 'swing_h', slam: true, col: '#e8dcff', shake: 7 }) }
};
const NYX_SKILLS = {
    call: CHARS.nyx.skills.s2, hum: CHARS.nyx.skills.s3,
    step: { name: 'Shadow Step', desc: 'Step into the dark and out again further on, through anything in the way. Foes you pass through fall asleep for a moment.', cost: 20, cd: 200, col: '#8a5aff', *run(p) {
        const d = Input.down('left') ? -1 : Input.down('right') ? 1 : p.facing, x0 = p.x, L = G.level; p.facing = d; p.inv = 26; Sound.sfx('blink'); VFX.burst(p.x, p.y - 30, '#6a4ae0', 18, 5, 24, 6, 1);
        let x = p.x; for (let i = 0; i < 24; i++) { const nx = x + d * 10; if (L.tileAt(nx, p.y - 30) && L.tileAt(nx, p.y - 30) !== T.E && L.tileAt(nx, p.y - 30) !== T.O) break; x = nx; }
        for (const t of Combat.targetsNear((x0 + x) / 2, p.y - 30, Math.abs(x - x0) / 2 + 30)) if (!t.boss) { t.stun = Math.max(t.stun || 0, 60); VFX.text(t.x, t.y - t.h - 10, 'z', '#e0d0ff', 14, 40); } else Combat.hit(p, t, { dmg: 1.2, kb: 0, stag: 10, col: '#8a5aff' });
        p.x = x; p.vy = 0; VFX.burst(p.x, p.y - 30, '#6a4ae0', 18, 5, 24, 6, 1); G.fields.push({ kind: 'g2shade', x: x0, y: p.y - 30, r: 70, t: 0, life: 120, owner: p, col: '#2a1a5a' }); yield 8;
    } },
    lullaby: { name: 'Lullaby', desc: 'Sing the whole song. Every lesser foe that hears it falls asleep; the great ones grow heavy for a while.', cost: 40, cd: 720, col: '#e0d0ff', *run(p) {
        const R = p.up('n_s3') ? 560 : 420; p.pose({ head: -12, aF: 40, fF: 70 }, 8); Sound.sfx('toll', { v: .4 }); VFX.ring(p.x, p.y - 30, R, '#e0d0ff', 40, 8);
        for (const t of Combat.targetsNear(p.x, p.y - 30, R)) { if (!t.boss) { t.stun = 300; t.g2sleep = 300; VFX.text(t.x, t.y - t.h - 10, 'z z z', '#e0d0ff', 16, 80); } else { t.slowT = 180; t.dmgTakenMult = (t.dmgTakenMult || 1); t.drowsy = 180; } } yield 16;
    } },
    stars: { name: 'CALL THE STARS', col: '#e8e0ff', *run(p) {
        Combat.banner(p, 'CALL THE STARS', '#e8e0ff', 34); p.inv = 150; G.darken = .7; yield 24;
        for (let i = 0; i < 14; i++) { const ts = Combat.targetsNear(p.x, p.y - 30, 820).filter(t => !t.dead), t = ts.length ? ts[i % ts.length] : null, x = t ? t.x + U.rand(-30, 30) : p.x + U.rand(-400, 400), y = t ? t.y - (t.h || 60) / 2 : p.y - 40;
            Combat.warn({ shape: 'circle', x, y, r: 70, t: 14, col: '#e8e0ff' }); G.delay(14, () => { VFX.ring(x, y, 80, '#ffffff', 16, 6); Sound.sfx('explode', { v: .4 }); for (const q of Combat.targetsNear(x, y, 80)) Combat.hit(p, q, { dmg: 3.2, kb: 6, stag: 40, col: '#e8e0ff', light: false }); }); yield 5; }
        yield 30; G.darken = 0;
    } }
};
/** Nyx's body and kit for a chapter. Applied to CHARS.nyx before each level is built. */
G2.nyxKit = function (ch) {
    const age = NYX_AGES[ch] || 6, N = CHARS.nyx, B = G2._nyxBase = G2._nyxBase || { hp: N.hp, atk: N.atk, speed: N.speed, jump: N.jump };
    N.style = nyxStyle(age); N.noAttack = ch <= 2; N.ranged = false;
    N.hp = [90, 90, 90, 110, 130, 130, 170, 190][ch] || 90; N.atk = [8, 8, 8, 12, 15, 15, 22, 24][ch] || 8; N.speed = ch === 5 ? 4.6 : 4.6 + (ch >= 6 ? .5 : 0); N.jump = 13 + (ch >= 4 ? .6 : 0);
    N.weapons = ch <= 2 ? [NYX_WEAPONS.hands] : ch === 3 ? [NYX_WEAPONS.wood] : ch <= 5 ? [NYX_WEAPONS.wood, NYX_WEAPONS.lantern] : [NYX_WEAPONS.blade, NYX_WEAPONS.lantern, NYX_WEAPONS.wood];
    WEAPONS2.nyx = N.weapons;
    N.skills = { s1: N.skills.s1, s2: ch <= 4 ? NYX_SKILLS.call : NYX_SKILLS.step, s3: ch <= 3 ? NYX_SKILLS.hum : NYX_SKILLS.lullaby };
    N.ult = ch <= 4 ? G2._nyxUlt || (G2._nyxUlt = N.ult) : NYX_SKILLS.stars;
    N.weakness = ['', 'Six years old. She cannot fight; Zero fights for her.', 'Eight years old. She cannot fight; Zero fights for her.', 'Ten. A wooden sword, and Zero beside her.', 'Thirteen. The Night Lantern, and Zero beside her.', 'Fourteen, and alone.', 'Fifteen. She leads now.', 'Seventeen.'][ch] || '';
    N.dragging = ch === 5 && !Save.data.g2.liftedSword;
    return age;
};
// The Night Lantern's shot is darkness: lesser foes it touches doze for a moment.
(function () {
    const hit = Combat.hit; Combat.hit = function (att, t, o) { Combat._att = att; const r = hit.call(Combat, att, t, o); const pr = Combat._proj; if (pr && pr.g2sleep && t && !t.boss && !t.dead) { t.stun = Math.max(t.stun || 0, pr.g2sleep); VFX.text(t.x, t.y - (t.h || 60) - 8, 'z', '#e0d0ff', 13, 30); } return r; };
    const fb = Player.prototype.fireBasic; Player.prototype.fireBasic = function () { const n = G.projs.length; fb.call(this); const w = this.weapon; if (w && w.shot && w.shot.sleep) for (let i = n; i < G.projs.length; i++) G.projs[i].g2sleep = w.shot.sleep; };
})();

/* ------------------------------ THE PARTY ------------------------------ */
Object.assign(DEFAULT_BINDS, { party: 'KeyC' }); Object.assign(ALT_BINDS, { party: 'KeyV' }); if (!Settings.binds.party) Settings.binds.party = 'KeyC';
G2.party = function () { const D = Save.data; return ['nyx', 'zero', 'vesper', 'rook', 'sable', 'mirae', 'ysolde'].filter(id => D.unlocked.includes(id) && CHARS[id] && (id !== 'zero' || D.g2.zeroBack)); };
G2.swapParty = function (to) {
    const P = G.player, list = G2.party(); if (!P || P.state === 'dead') return; if (!to && (list.length < 2 || P.state === 'skill' || G.level.soloNyx)) return;
    if (G.level.forceNyx && P.id === 'nyx' && !to) { G.toast('Only Nyx can see in this dark.', '#b48cff'); return; }
    const id = to || list[(list.indexOf(P.id) + 1) % list.length]; if (id === P.id) return;
    G.partyHp = G.partyHp || {}; G.partyHp[P.id] = P.hp / P.maxHp;
    const N = new Player(id); N.x = P.x; N.y = P.y; N.vx = P.vx; N.vy = P.vy; N.facing = P.facing; N.grounded = P.grounded; N.safe = P.safe; N.inv = 40; N.ult = P.ult;
    if (G.partyHp[id] !== undefined) N.hp = Math.max(1, Math.round(N.maxHp * G.partyHp[id]));
    if (id === 'nyx') N.rig.S = nyxStyle(NYX_AGES[Save.data.g2.chapter] || 17);
    G.player = N; VFX.burst(N.x, N.y - 34, CHARS[id].style.col.glow, 20, 5, 24, 6, 1); Sound.sfx('blink', { v: .5 }); G.toast(CHARS[id].name, CHARS[id].style.col.glow);
};
(function () {
    const tc = Player.prototype.tryCombat;
    Player.prototype.tryCombat = function (In) { if (this === G.player && In.pressed('party') && (Save.data.g2.chapter || 1) >= 6) G2.swapParty(); return tc.call(this, In); };
})();

/* ------------------------------ WATER ------------------------------ */
G2.waterAt = function (x, y) { const W = G.level && G.level.g2water; if (!W) return null; for (const w of W) if (x >= w.x0 && x <= w.x1 && y > w.y - (G.g2tide || 0)) return w; return null; };
(function () {
    const upd = Player.prototype.update;
    Player.prototype.update = function () {
        const w = G.level && G.level.g2water ? G2.waterAt(this.x, this.y - 30) : null;
        if (!w) { if (this.g2swim) { this.g2swim = false; this.noGrav = false; if (this.vy < -2) this.vy = -9; } return upd.call(this); }
        if (!this.g2swim) { this.g2swim = true; VFX.burst(this.x, w.y - (G.g2tide || 0), '#9ad8ff', 14, 4, 20, 5, 1); Sound.sfx('splash', { v: .5 }); }
        this.noGrav = true; const keepSpd = this.def.speed;
        upd.call(this);
        this.vy = U.clamp(this.vy + .16, -6, 2.4); this.vx *= .92;
        if (this === G.player || this.isAlly) {
            const In = this.isAlly ? Input : Input; if (In.pressed('jump') || (this.isAlly && G.player && G.player.y < this.y - 40)) { this.vy = -5.2; Sound.sfx('swim', { v: .25 }); VFX.burst(this.x, this.y - 10, '#cfeaff', 5, 2, 16, 3, 1); }
            if (In.down('down')) this.vy = Math.min(3.4, this.vy + .3);
            if (this === G.player) { const under = G2.waterAt(this.x, this.y - 58); G.g2breath = U.clamp((G.g2breath === undefined ? 100 : G.g2breath) + (under ? -.14 : 1.2), 0, 100); if (G.g2breath <= 0 && G.time % 30 === 0) this.hurt(4, { tick: true, absDmg: 4 }); }
        }
        this.def.speed = keepSpd;
    };
    // Draw the water over the world, with a light surface line.
    const dr = Combat.drawFields; Combat.drawFields = function (c) {
        dr.call(Combat, c); const W = G.level && G.level.g2water; if (!W) return;
        for (const w of W) { const y = w.y - (G.g2tide || 0), g = c.createLinearGradient(0, y, 0, y + 500); g.addColorStop(0, 'rgba(60,120,170,.34)'); g.addColorStop(1, 'rgba(10,30,60,.62)'); c.fillStyle = g; c.fillRect(w.x0, y, w.x1 - w.x0, (G.level.ph || 4000) - y);
            c.strokeStyle = 'rgba(200,235,255,.55)'; c.lineWidth = 2; c.beginPath(); for (let x = w.x0; x <= w.x1; x += 16) c.lineTo(x, y + Math.sin(x * .03 + G.time * .06) * 3); c.stroke(); }
    };
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) { hd(c); const P = G.player; if (P && P.g2swim && G.g2breath !== undefined && G.g2breath < 100) { const x = VW / 2 - 80, y = 96; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x, y, 160, 8); c.fillStyle = G.g2breath < 25 ? '#ff6a6a' : '#9ad8ff'; c.fillRect(x, y, 160 * G.g2breath / 100, 8); c.font = '11px "Palatino Linotype", serif'; c.textAlign = 'center'; c.fillStyle = '#dff4ff'; c.fillText(tr('Breath'), VW / 2, y - 3); } };
})();

/* ------------------------------ MERCY ------------------------------ */
const CHOICES = {
    seraphina: { q: '"Uncle, is she bad?"', d: 'Seraphina kneels. She has not slept since the first day. What Zero answers will be remembered on the Seventh Day.', spare: '"No. She is only tired. Let her sleep."', kill: '"She hurt the whole city. I will end it."' },
    mareva: { q: '"Will she drown us again?"', d: 'Mareva floats, her song broken. The tide waits for an answer.', spare: '"Let her go back to the sea, and sing."', kill: '"End the song."' },
    gardener: { q: 'The Mother of Roots', d: 'The great tree bends over Nyx, its wooden children silent. Its heart is open.', spare: 'Heal the tree', kill: 'Destroy the tree' },
    astraea: { q: 'The blind prophet', d: 'Astraea smiles at nothing. "You beat me. You did not beat the stars."', spare: '"Then watch them with me, with your own eyes."', kill: '"I will break every star you read."' },
    lilith: { q: 'The Wolf Queen', d: 'Lilith-Varga lies in the sand. Her pack waits to see what the cub will do.', spare: 'Tame her: offer your hand', kill: 'Finish the hunt', lock: () => Save.data.g2.alphaKilled, lockMsg: 'You killed the alpha of her pack. She will not follow you now.' },
    archon: { q: 'Archon Veil', d: 'The Hierarch drops her blade. For a moment she looks like someone who once had a father who left.', spare: 'Persuade her to turn on the Architect', kill: 'Defeat her', lock: () => (Save.data.g2.persuade || 0) < 2, lockMsg: 'She will not listen yet. Answer her honestly during the fight.' }
};
Object.assign(UI.screens, {
    g2choice(a) {
        const C = CHOICES[(a && a.boss) || 'seraphina'], locked = C.lock && C.lock();
        return `<div class="panel small"><h2>${tr(C.q)}</h2><p>${tr(C.d)}</p><nav><button data-do="g2spare" ${locked ? 'disabled' : 'autofocus'}>${tr(C.spare)}</button>${locked ? `<p class="hint">${tr(C.lockMsg)}</p>` : ''}<button data-do="g2kill" ${locked ? 'autofocus' : ''}>${tr(C.kill)}</button></nav></div>`;
    }
});
/** The shared ending of a boss with a choice: kneel, ask, remember, then hand back to the game. */
G2.mercy = function* (b, line, opts = {}) {
    G.lockInput = true; G.warns = []; G.letterbox = 1; Music.stop(1.2); G.slowmo = 40; G.g2blind = 0; G.g2tide = 0;
    b.kneel = 1; if (opts.ground !== false) yield* b.moveTo(b.x, b.A.y, 30); G.cineCam = { x: b.x, y: b.A.y - 120, zoom: 1.3 };
    if (line) { G.say(line[0], line[1], 200); yield 210; }
    const id = b.def.id, C = CHOICES[id]; G.flags.g2choice = null;
    if (HEADLESS && C && C.lock && C.lock()) G.flags.g2choice = 'kill';
    if (!HEADLESS) UI.show('g2choice', { boss: id });
    yield () => G.flags.g2choice; UI.hide();
    const spare = G.flags.g2choice === 'spare' && !(C && C.lock && C.lock());
    Save.data.g2[spare ? 'spared' : 'killed'][id] = 1; delete Save.data.g2[spare ? 'killed' : 'spared'][id];
    if (spare) { Sound.sfx('checkpoint'); VFX.ring(b.x, b.y - 100, 260, '#e0d0ff', 30, 12); for (let i = 0; i < 40; i++) { b.sleep = i / 40; yield 1; } }
    else { Sound.sfx('swing_h'); G.flash = 1; G.addShake(16); Sound.sfx('bigboom'); b.gone = true; yield 40; }
    G.cineCam = null; G.letterbox = 0; G.lockInput = false;
    Game.onBossDefeated(b.def);
};
(function () { const ach = Save.ach.bind(Save); Save.ach = function (id) { if (!ACHIEVEMENTS[id]) return; return ach(id); }; })();
G2.sparedCount = () => ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon'].filter(k => Save.data.g2.spared[k]).length;

/* ------------------------------ THE SEVEN DAYS ------------------------------ */
G2.DAYS = {
    2: { boss: 'mareva', levels: ['sea', 'mareva'], spared: 'g2MarevaAfter', killed: 'g2MarevaAfter' },
    3: { boss: 'gardener', levels: ['forest2', 'roots'], spared: 'g2GardenerAfter', killed: 'g2GardenerAfter' },
    4: { boss: 'astraea', levels: ['observ', 'astraea'], spared: 'g2AstraeaAfter', killed: 'g2AstraeaAfter' },
    5: { boss: 'lilith', levels: ['desert2', 'lilith'], spared: 'g2LilithAfter', killed: 'g2LilithAfter' },
    6: { boss: 'architect', levels: ['meridian', 'archon', 'architect'], spared: 'g2ArchitectAfter', killed: 'g2ArchitectAfter' },
    7: { boss: 'vesper', levels: ['shore', 'throne'] }
};
(function () {
    // After a main boss: its scene, then the next day opens and Nyx goes home to the Garden.
    const ar = Game.afterResults.bind(Game);
    Game.afterResults = function (def) {
        for (const [n, d] of Object.entries(G2.DAYS)) if (d.boss === def.id && d.spared) {
            const g = Save.data.g2; g.chapter = Math.max(g.chapter, +n + 1); Save.write();
            this.playCut(g.spared[def.id] ? d.spared : d.killed, () => { const day = G2.DAYS[n]; if (day.after) day.after(); this.toHub(); }); return;
        }
        if (def.id === 'archon') { G2.cut('g2ArchonAfter', () => Game.deploy('architect')); return; }
        ar(def);
    };
    // The Gate of Seven Days opens one day at a time.
    UI.screens.hub = function () {
        const D = Save.data, ch = D.g2.chapter || 1; this.back = () => G2.closeStation();
        return `<div class="panel wide"><h2>${tr('THE GATE OF SEVEN DAYS')}</h2><div class="hub"><div class="line">${REGIONS.map((r, i) => {
            const open = !!r.level && i + 1 <= ch, done = i + 1 < ch;
            return `<button class="stop ${done ? 'done' : ''}" data-do="deploy" data-arg="${r.id}" ${open ? '' : 'disabled'} style="--c:${r.col}"><b>${tr(r.name)}</b><span>${tr(open ? r.desc : 'This day has not dawned yet.')}</span><em>${tr(done ? 'CLEARED, REPLAY' : open ? 'ENTER' : '')}</em></button>`;
        }).join('')}</div>
        <div class="side"><div class="op">${tr('OPERATOR')}<br><b>${CHARS[D.activeChar].name}</b><small>${tr('LV')} ${Save.charData(D.activeChar).level}  ·  ${D.cells} ✿</small></div>
        <p>${tr('Shards of Peace')}: ${Object.keys(D.g2.shards).length}/7<br>${tr('Spared')}: ${Object.keys(D.g2.spared).length} · ${tr('Slain')}: ${Object.keys(D.g2.killed).length}<br>${tr('Nyx')}: ${NYX_AGES[ch] || 17} ${tr('years old')}</p>
        <button data-do="g2close">${tr('BACK TO THE GARDEN')}</button><button data-do="settings">${tr('SETTINGS')}</button><button data-do="title">${tr('MAIN MENU')}</button></div></div></div>`;
    };
    // Apply Nyx's age before every level is built.
    const ll = Game.loadLevel.bind(Game);
    Game.loadLevel = function (id, cp) {
        const D = Save.data; if (D && D.g2) G2.nyxKit(D.g2.chapter || 1);
        G.g2tide = 0; G.g2breath = 100; G.g2blind = 0; G.partyHp = {}; G.g2music = G.g2music || {}; G.g2music.phase = 0;
        ll(id, cp);
        if (G.level.forceChar && G.player.id !== G.level.forceChar) G2.swapParty(G.level.forceChar);
    };
    // A child dragging a sword far too heavy for her walks slowly.
    const upd = Player.prototype.update;
    Player.prototype.update = function () { if (this.id === 'nyx' && this.def.dragging) { const s = this.def.speed; this.def.speed = s * .82; upd.call(this); this.def.speed = s; return; } upd.call(this); };
    const dr = Player.prototype.draw;
    Player.prototype.draw = function (ctx) { dr.call(this, ctx); if (this.id === 'nyx' && this.def.dragging && this.state !== 'dead') { ctx.save(); ctx.translate(this.x - this.facing * 14, this.y - 18); ctx.rotate(this.facing * 1.9); Gear.aocalyst(ctx, null, null, { owner: null }); ctx.restore(); } };
})();
G2.dayOf = levelId => { for (const [n, d] of Object.entries(G2.DAYS)) if (d.levels.includes(levelId)) return +n; return levelId === 'dawn' || levelId === 'cathedral' ? 1 : 0; };

/* ------------------------------ BENT LAWS ------------------------------ */
// The world can be flipped (gravity turned over) or turned (the screen rotating), the HUD stays put.
// G.g2xf = { flip: 0..1, rot: radians }. Low gravity: G.g2grav < 1.
(function () {
    const sd = Scene.draw.bind(Scene);
    Scene.draw = function (c, canvas) {
        const X = G.g2xf; if (!X || (!X.flip && !X.rot)) { G._xfBase = null; return sd(c, canvas); }
        G._xfBase = c.getTransform(); c.save(); c.translate(VW / 2, VH / 2); c.rotate(X.rot || 0); c.scale(1 + Math.abs(Math.sin(X.rot || 0)) * .25, 1 - 2 * U.clamp(X.flip || 0, 0, 1)); c.translate(-VW / 2, -VH / 2);
        try { sd(c, canvas); } finally { c.restore(); }
    };
    const hd = HUD.draw.bind(HUD); HUD.draw = function (c) { if (G._xfBase) { c.save(); c.setTransform(G._xfBase); hd(c); c.restore(); } else hd(c); };
    const bl = Post.bloom.bind(Post); Post.bloom = function (c, cv) { if (G._xfBase) return; return bl(c, cv); };
    const upd = Player.prototype.update; Player.prototype.update = function () { upd.call(this); if (G.g2grav !== undefined && G.g2grav < 1 && !this.grounded && !this.noGrav && !this.g2swim) this.vy -= GRAV * (1 - G.g2grav); };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { G.g2xf = null; G.g2grav = 1; G.g2night = 0; return ll(id, cp); };
})();
G2.ACT_KINDS = ['attack', 'heavy', 'skill1', 'skill2', 'skill3', 'dodge', 'ult'];
// The last ten seconds of what the player did: prophets and mirrors read it.
(function () {
    const tc = Player.prototype.tryCombat;
    Player.prototype.tryCombat = function (In) {
        if (this === G.player) for (const k of G2.ACT_KINDS) if (In.pressed(k)) { const kind = k === 'attack' && this.def.ranged ? 'ranged' : k; (G.g2acts = G.g2acts || []).push({ t: G.time, k: kind }); this.lastAct = kind; Save.data.g2.actCount = Save.data.g2.actCount || {}; Save.data.g2.actCount[kind] = (Save.data.g2.actCount[kind] || 0) + 1; }
        if (G.g2acts && G.g2acts.length && G.time - G.g2acts[0].t > 600) G.g2acts = G.g2acts.filter(a => G.time - a.t <= 600);
        return tc.call(this, In);
    };
})();
G2.habit = function () { const A = G.g2acts || [], n = {}; for (const a of A) n[a.k] = (n[a.k] || 0) + 1; let best = null, bn = 0; for (const k in n) if (n[k] > bn) { bn = n[k]; best = k; } return { kind: best, share: A.length ? bn / A.length : 0, n: A.length }; };

/* A level may hold several arenas in a row: the next one wakes when the last mini-boss falls. */
(function () {
    const nextArena = () => { const L = G.level; if (!L || !L.g2arenas) return; const a = L.g2arenas.find(x => !Save.data.cleared[x.boss]); G.arena = a || null; G.bossDone = !a; };
    const ll = Game.loadLevel.bind(Game); Game.loadLevel = function (id, cp) { ll(id, cp); nextArena(); };
    const obd = Game.onBossDefeated.bind(Game); Game.onBossDefeated = function (def) { obd(def); if (def.mini) nextArena(); };
})();
// Part II lands are dusk and night: no bright daylight fog in the forest or the desert.
Object.assign(Atmos.fogCol, { forest: '#4a5a40', desert: '#8a5a40' });
