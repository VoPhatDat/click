'use strict';
/**
 * G2 TERMINAL: a console for the player. Open it with the ` key (or F2). Commands: help, unlock, goto,
 * chapter, god, heal, lastcard, ending, music, spare, shards, clear, close.
 * Also: a global look for Part II (colour grading by place and a fine film grain).
 */
G2.term = {
    open: false, el: null, out: null, input: null, hist: [], hi: 0,
    cmds: {
        help: ['show this list', () => Object.entries(G2.term.cmds).map(([k, v]) => `  ${k.padEnd(10)} ${v[0]}`).join('\n')],
        unlock: ['open every day, character, weapon and the true ending', () => { const D = Save.data || (Save.data = Save.fresh('normal')), g = D.g2; g.chapter = 7; g.named = 1; g.woodSword = 1; g.liftedSword = 1; g.zeroBack = 1; for (const id of ['nyx', 'zero', 'vesper', 'rook', 'sable', 'mirae', 'ysolde']) if (!D.unlocked.includes(id)) D.unlocked.push(id); for (let k = 1; k <= 7; k++) g.seen['open' + k] = 1; D.cleared.seraphina = true; Save.write(); return 'Every day, character and weapon unlocked. The Gate of Seven Days is open.'; }],
        goto: ['goto <level>: jump to a level (dawn cathedral sea mareva forest2 roots observ astraea desert2 lilith meridian archon architect shore throne memory architect2 garden)', a => { if (!LEVELS[a[0]]) return 'No level called "' + (a[0] || '') + '".'; G2.term.toggle(false); Game.loadLevel(a[0]); Game.state = 'play'; return 'Going to ' + a[0] + '.'; }],
        chapter: ['chapter <1-7>: set the current day (Nyx\'s age follows)', a => { const n = U.clamp(+a[0] || 1, 1, 7); Save.data.g2.chapter = n; Save.write(); return 'Day ' + n + '. Nyx is ' + NYX_AGES[n] + '.'; }],
        god: ['toggle invulnerability', () => { G2.term.godMode = !G2.term.godMode; return 'God mode ' + (G2.term.godMode ? 'ON' : 'OFF') + '.'; }],
        heal: ['full health and energy', () => { const P = G.player; if (!P) return 'No one to heal.'; P.hp = P.maxHp; P.energy = P.def.energy || 100; return 'Healed.'; }],
        lastcard: ['go straight to the Architect\'s final form', () => { G2.term.cmds.unlock[1](); G2.term.toggle(false); Game.loadLevel('architect2'); Game.state = 'play'; G.player.x = G.arena.trigger + 40; G.startBoss(); G2.term.wantLast = true; return 'The Architect. It is about to show its final form.'; }],
        ending: ['ending <5a|5b|5c|5d>: play an ending', a => { const e = (a[0] || '').toLowerCase(); if (!['5a', '5b', '5c', '5d'].includes(e)) return 'Endings: 5a 5b 5c 5d.'; G2.term.toggle(false); G2.playEnding(e); return 'Playing ending ' + e + '.'; }],
        music: ['music <track>: play a track (try g2act3, g2lul7, lastcard = the final form theme)', a => { Sound.resume && Sound.resume(); if (a[0] === 'lastcard') { G2.song.load(); setTimeout(() => G2.song.start(0), 600); return 'The final form.'; } if (!TRACKS[a[0]]) return 'Tracks: ' + Object.keys(TRACKS).filter(k => k.startsWith('g2')).join(' '); Music.cut(a[0], 'boss'); return 'Playing ' + a[0] + '.'; }],
        spare: ['spare every boss so far (for the true ending)', () => { const g = Save.data.g2; for (const k of ['seraphina', 'mareva', 'gardener', 'astraea', 'lilith', 'archon']) { g.spared[k] = 1; delete g.killed[k]; } Save.write(); return 'Everyone spared.'; }],
        shards: ['all seven Shards of Peace', () => { const g = Save.data.g2; for (const k of ['light', 'water', 'earth', 'stars', 'beasts', 'mankind', 'rest']) g.shards[k] = 1; Save.write(); return 'Seven Shards of Peace.'; }],
        clear: ['clear the screen', () => { G2.term.out.textContent = ''; return ''; }],
        close: ['close the terminal', () => { G2.term.toggle(false); return ''; }]
    },
    build() {
        if (this.el || typeof document === 'undefined') return;
        const el = this.el = document.createElement('div'); el.id = 'g2term';
        el.innerHTML = '<pre></pre><div class="row"><span>&gt;</span><input type="text" spellcheck="false" autocomplete="off"></div>';
        const st = document.createElement('style'); st.textContent = '#g2term{position:fixed;left:2%;right:2%;top:2%;height:44%;background:rgba(8,6,16,.94);border:1px solid #b48cff;box-shadow:0 0 30px rgba(120,80,220,.5);z-index:99;display:none;flex-direction:column;font:14px/1.4 Consolas,"Courier New",monospace;color:#e8dcff;padding:10px 14px}#g2term pre{flex:1;overflow:auto;margin:0;white-space:pre-wrap}#g2term .row{display:flex;gap:8px;align-items:center;border-top:1px solid rgba(180,140,255,.35);padding-top:6px}#g2term input{flex:1;background:transparent;border:0;outline:0;color:#fff6d8;font:inherit}#g2term span{color:#ffd86b}';
        document.head.appendChild(st); document.body.appendChild(el); this.out = el.querySelector('pre'); this.input = el.querySelector('input');
        this.input.addEventListener('keydown', e => {
            e.stopPropagation(); if (e.code === 'Backquote' || e.code === 'F2' || e.code === 'Escape') { e.preventDefault(); this.toggle(false); return; }
            if (e.code === 'Enter') { const v = this.input.value.trim(); this.input.value = ''; if (v) { this.hist.push(v); this.hi = this.hist.length; this.run(v); } }
            if (e.code === 'ArrowUp' && this.hi > 0) { this.input.value = this.hist[--this.hi]; e.preventDefault(); } if (e.code === 'ArrowDown' && this.hi < this.hist.length) { this.input.value = this.hist[++this.hi] || ''; }
        });
        this.print('PROJECT ZERO II: GENESIS  terminal. Type "help".');
    },
    print(s) { if (!this.out) return; this.out.textContent += s + '\n'; this.out.scrollTop = 1e9; },
    run(line) { this.print('> ' + line); const [c, ...a] = line.split(/\s+/), C = this.cmds[c.toLowerCase()]; if (!C) return this.print('Unknown command "' + c + '". Type "help".'); try { const r = C[1](a); if (r) this.print(r); } catch (e) { this.print('Error: ' + e.message); } },
    toggle(on = !this.open) { this.build(); if (!this.el) return; this.open = on; this.el.style.display = on ? 'flex' : 'none'; Input.held = {}; if (on) setTimeout(() => this.input.focus(), 0); else this.input.blur(); }
};
(function () {
    if (typeof window !== 'undefined') window.addEventListener('keydown', e => { if ((e.code === 'Backquote' || e.code === 'F2') && !(e.target && e.target.tagName === 'INPUT')) { e.preventDefault(); G2.term.toggle(); } }, true);
    const hurt = Player.prototype.hurt; Player.prototype.hurt = function (d, s) { if (G2.term.godMode && this === G.player) return false; return hurt.call(this, d, s); };
    // lastcard: once the Architect is up, take it straight to 12%
    const tick = G.tick.bind(G); G.tick = function () { tick(); const b = G.boss; if (G2.term.wantLast && b && b.def.id === 'architect2' && !b.intro && !b.transition) { G2.term.wantLast = false; b.phase = 4; b.bag = []; b.hp = Math.round(b.maxHp * .12) + 1; b.untargetable = false; b.dmgTakenMult = 1; b.hurt(10, {}); } };
})();

/* ------------------------------ THE LOOK OF PART II ------------------------------ */
// Colour grading by place (cool shadows, warm light) and a fine film grain, under the HUD.
G2.look = {
    grain: null,
    GRADE: { dawn: ['#3a1a40', '#ffb070'], cathedral: ['#1a1030', '#ffd8a0'], sea: ['#0a1830', '#9ad8ff'], mareva: ['#081428', '#b0e0ff'], forest2: ['#14200e', '#ffe0a0'], roots: ['#1a1008', '#ffc070'], observ: ['#120a28', '#d8c0ff'], astraea: ['#100828', '#e8d8ff'], desert2: ['#2a1008', '#ffb060'], lilith: ['#2a0c08', '#ff9a50'], meridian: ['#140a10', '#ff8a6a'], archon: ['#140a10', '#ffd8a0'], architect: ['#0a0818', '#ffe8a0'], shore: ['#1a1024', '#ffb090'], throne: ['#180a14', '#ffb070'], memory: ['#2a1608', '#ffc080'], architect2: ['#0c0818', '#ffe0a0'], garden: ['#101a28', '#ffd8a0'] },
    draw(c) {
        if (!G.level || Settings.quality < 1 || Game.state !== 'play' && Game.state !== 'pause') return; const g = this.GRADE[G.level.id]; if (!g) return;
        c.save(); c.globalCompositeOperation = 'soft-light'; const gr = c.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, g[0]); gr.addColorStop(.55, 'rgba(128,128,128,0)'); gr.addColorStop(1, g[1]); c.globalAlpha = .35; c.fillStyle = gr; c.fillRect(0, 0, VW, VH); c.restore();
        if (Settings.quality >= 2 && !HEADLESS) { if (!this.grain) { const n = this.grain = U.canvas(256, 256), x = n.getContext('2d'), im = x.createImageData(256, 256); if (!im || !im.data) { this.grain = null; return; } for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 120; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); }
            c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .06; const ox = -(G.time * 37 % 256), oy = -(G.time * 53 % 256); for (let x = ox; x < VW; x += 256) for (let y = oy; y < VH; y += 256) c.drawImage(this.grain, x, y); c.restore(); }
    }
};
(function () { const hd = HUD.draw.bind(HUD); HUD.draw = function (c) { G2.look.draw(c); hd(c); }; })();
