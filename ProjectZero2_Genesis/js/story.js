'use strict';
/**
 * STORY: lore logs, NPC dialogue and every cutscene.
 * Cutscenes are generators run by Cine; shots are procedural scenes built from
 * the same backdrops and character rigs the game uses.
 */
const LORE = {
    city1: { title: 'Evacuation Notice 7', region: 'city', text: 'All citizens proceed to Shelter Ring C. This is a precaution. The Bore at Kalder is operating within expected parameters. Do not look directly at the eastern sky.' },
    city2: { title: 'Rooftop Graffiti', region: 'city', text: 'WE LIT THE WORLD AND IT LOOKED BACK. Under it, in a smaller hand: Project Zero promised free energy forever. Nobody asked what forever costs.' },
    city3: { title: 'Line 3 Service Log', region: 'city', text: 'Train 3-114 departed Halcyon Central at 18:02 with 2,140 aboard, capacity 800. Doors failed to close. Warden Varr ordered departure regardless. Warden Varr then disembarked and walked back.' },
    city4: { title: 'Civic Defense Directive', region: 'city', text: 'ATLAS-9 is hereby tasked with clearing the capital until the last citizen has evacuated. Directive persists through power loss. Directive may not be rescinded except by the Mayor, who is deceased.' },
    forest1: { title: 'Verdance Field Note', region: 'forest', text: 'We seeded the Reserve with catalyst run-off. Growth projected at two centuries. Trees reached canopy height in nineteen days. They lean toward the east at night, toward Kalder, as if it were a sun.' },
    forest2: { title: 'Warden Stone Rubbing', region: 'forest', text: 'Dr. Voss brought the green shard here and gave it to the oldest tree to hold. She said it needed something patient. The tree has not stopped dreaming since. We do not speak near it.' },
    forest3: { title: 'Last Ranger Log', region: 'forest', text: 'It knows names now. It said mine in the voice of my daughter. There is a thing wearing the forest and it is so very lonely. I am going to go sit with it.' },
    desert1: { title: 'Sael Fisheries Ledger', region: 'desert', text: 'Final entry. The Accord has opened the sluices to cool the Bore. The harbour went dry in eleven days. We are told the sea is a reasonable price. Nobody told the sea.' },
    desert2: { title: 'Temple Inscription', region: 'desert', text: 'They who were here before the water left a warning in a script older than any nation: THE STONE BELOW IS NOT A STONE. IT IS A DOOR. IT OPENS BOTH WAYS.' },
    desert3: { title: 'Dr. Voss, Personal', region: 'desert', text: 'I cut the Catalyst in three. Ruby to the seabed, where the old sovereign serpent sleeps. It should keep. Nothing that holds a shard stays what it was, but what else can I do? It must never be whole.' },
    ice1: { title: 'Weather Station Tape', region: 'ice', text: 'Nadir, this is outpost two. Something under the lake is calling on the distress band. It is using our own call signs. It is very cold and it would like us to come down.' },
    ice2: { title: 'Dispatch Maintenance Record', region: 'ice', text: 'VESPER dispatch core confirmed DESTROYED in the Halcyon fire, day 0 of the Unmaking. All instances offline. No backups survive. Any transmission claiming to be VESPER is to be treated as hostile.' },
    ice3: { title: 'Cryo Vault Memo', region: 'ice', text: 'Subject Zero is alive, in the sense that a held breath is alive. Half of what they were is still bonded below Kalder. Do not thaw. If the shards ever reunite, wake Zero. Only Zero can end it. Sapphire goes to the lake.' },
    vol1: { title: 'Kalder Shift Report', region: 'volcano', text: 'Drill head passed eleven kilometres. There is a chamber down here. There is something in the chamber, and it is older than the planet. Director Thane has cancelled all leave.' },
    vol2: { title: 'Thane to the Board', region: 'volcano', text: 'A lattice that can turn any matter into any other. Alpha to Omega, beginning to end. I am calling it the Aocalyst. With a human anchor we can hold it. I have a volunteer. They were told it would hurt.' },
    vol3: { title: 'Forge Oath', region: 'volcano', text: 'The Forge Wardens swore to feed the Bore until the drilling ended. The last of them was bound into his armour when his body gave out. The oath, the records note, had no clause for death.' },
    vol4: { title: 'Ignition Transcript', region: 'volcano', text: 'THANE: Bring it to full. ENGINEER: Sir, the anchor is screaming. THANE: It will settle. ZERO: Please. There are two of me. There are two of me. ENGINEER: Sir? Sir, the readings are in the wrong direction.' },
    vol5: { title: 'The Returned', region: 'volcano', text: 'Every person the wave unmade, the Aocalyst remembers exactly. Thirty years on, it is starting to rebuild some of them. Not from mercy. It needs hands to carry the shards home, and it can only reach so far.' },
    vol6: { title: 'Voss, Final Entry', region: 'volcano', text: 'If you are reading this you are one of the rebuilt, and you are made of it. I am sorry. Whatever you decide at the bottom of the Bore, understand this: if the Catalyst dies wholly, so do you. Zero is the only one who can choose differently.' }
};

const NPCS = {
    hask: { name: 'OLD HASK', look: '#7a6a5a', lines: [['OLD HASK', 'You came out of the shelter? Nobody comes out of the shelter.'], ['OLD HASK', 'Thirty years I have been down this street and I have not seen a face that was not trying to eat me.'], ['OLD HASK', 'The big yellow one still walks the overpass, telling us all to evacuate. Evacuate to where, you great tin idiot?'], ['OLD HASK', 'Take the rooftops. And if you open a beacon, the old network will remember you were here.']] },
    lys: { name: 'LYS, LAST RANGER\'S CHILD', look: '#4c7a55', lines: [['LYS', 'Keep your voice down. She listens through the moss.'], ['LYS', 'My mother went in to sit with her. That was twenty years ago. Sometimes she still calls me for supper.'], ['LYS', 'Sylvaris is not cruel. She is holding something too big for her, and it hurts, and she does not know how to put it down.']] },
    tamsin: { name: 'TAMSIN OF THE HARBOUR', look: '#c29a5c', lines: [['TAMSIN', 'That ridge there? That was the lighthouse. I grew up on a harbour you could not walk across, and now look.'], ['TAMSIN', 'Raiders run the basin now. They think the old sovereign will bring back the sea if they feed it enough.'], ['TAMSIN', 'When the air goes yellow, get behind stone. And if you find the temple, go down. The only road east is under the sand.']] },
    orsk: { name: 'SURVEYOR ORSK', look: '#7ab0d0', lines: [['ORSK', 'You are the first signal on this band that does not sound like me.'], ['ORSK', 'Careful of that dispatcher of yours. I have heard the name VESPER. I was at the funeral for it.'], ['ORSK', 'The station lights came on last week by themselves. Something down there is expecting company.']] },
    cantor: { name: 'BROTHER CINDER', look: '#a13a18', lines: [['BROTHER CINDER', 'Pilgrims? No. You smell of the three stones. You smell like home.'], ['BROTHER CINDER', 'We sing to the One Below. It sings back. Lately it has been singing your names.'], ['BROTHER CINDER', 'Go up, go in, go down. All roads here were laid for you thirty years ago.']] },
    smith: { name: 'THE LAST SMITH', look: '#ff8a20', lines: [['THE LAST SMITH', 'Vulkaris guards the way down. He was my brother, before the armour.'], ['THE LAST SMITH', 'He cannot stop. Nobody ever wrote the part of the oath that lets you stop.'], ['THE LAST SMITH', 'Be kind, if you can. Be quick, if you cannot.']] }
};

const BOSS_INTRO = {
    atlas: [['ATLAS-9', 'CITIZEN DETECTED. THIS DISTRICT IS UNDER MANDATORY EVACUATION.'], ['ROOK', 'That siren. It has been sounding the last trumpet for thirty years, and nobody is left to answer.'], ['ZERO', 'First seal. Stand aside.']],
    sylvaris: [['SYLVARIS', '...small warm things. You have come to take the green ache from me...'], ['MIRAE', 'The seal has grown through her. This was Eden, Zero.'], ['SYLVARIS', 'STAY. STAY AND BE ROOTS.']],
    qareth: [['QARETH', 'WHO WALKS UPON MY SEA?'], ['ZERO', 'The one who carries the Book.'], ['QARETH', 'THEN I WILL DROWN YOUR BOOK IN WHAT REMAINS.']],
    nadir: [['VESPER', 'The fourth seal lies under the ice. Take it. Do not stop. Take it.'], ['SABLE', 'Is it me, or is heaven getting pushy?'], ['NADIR', '...SO... COLD...']],
    vulkaris: [['VULKARIS', 'NONE PASS THE FLAMING GATE WHILE THE FIRE IS UNFED.'], ['YSOLDE', 'Warden to Warden, then. Stand aside.'], ['VULKARIS', 'AN OATH IS ALL THAT IS LEFT OF ME.']],
    endbringer: [['VESPER', 'Thank you, Lamb. You have carried the Book all the way home.'], ['ZERO', 'I know that voice. I have heard it every day of my life. It is mine.'], ['THE ENDBRINGER', 'I AM THE WRATH THEY TORE FROM YOU. WELCOME HOME, ZERO. LET US JUDGE THEM TOGETHER.']]
};

/* ---------------------------- CUTSCENE ENGINE ---------------------------- */
const Cine = {
    active: false, script: null, shotFn: null, t: 0, sub: null, actors: [], fadeA: 1, fadeTo: 0, fadeSpd: 0, lb: 1, titleCard: null, onEnd: null, skip: 0, canSkip: true, scroll: null, ctl: null,
    play(genFn, onEnd, canSkip = true) {
        Object.assign(this, { card: null, flashA: 0, quake: 0, torn: 0, broken: 0, active: true, onEnd, t: 0, sub: null, actors: [], fadeA: 1, fadeTo: 0, fadeSpd: .02, lb: 1, titleCard: null, skip: 0, canSkip, shotFn: null, scroll: null });
        this.script = new Script(genFn(this));
    },
    shot(fn) { this.shotFn = fn; this.st = 0; },
    actor(id, x, y, facing = 1, clip = 'idle', opt = {}) {
        const r = new Rig(id === 'hooded' ? Stage.hooded : CHARS[id].style); r.play(clip, 0); r.owner = { element: 0, charge: 0 };
        const a = Object.assign({ id, x, y, facing, rig: r, vx: 0, alpha: 1, sil: false, scale: 1.7 }, opt); this.actors.push(a); return a;
    },
    clearActors() { this.actors = []; },
    *say(name, text, frames) { const d = frames || Math.max(120, text.length * 3.6); this.sub = { name: tr(name), text: tr(text), t: 0, life: d }; Sound.sfx('blip'); yield d; this.sub = null; },
    *verse(text, ref, frames) { this.card = { text: tr(text), ref: tr(ref), t: 0, life: frames }; Sound.sfx('toll', { v: .5 }); yield frames; this.card = null; },
    fade(to, frames) { this.fadeTo = to; this.fadeSpd = Math.abs(to - this.fadeA) / Math.max(1, frames); },
    title(text, sub, frames, col = '#ffffff') { this.titleCard = { text: tr(text), sub: sub && tr(sub), t: 0, life: frames, col }; },
    finish() {
        if (!this.active) return;
        this.active = false; const cb = this.onEnd; this.onEnd = null; this.actors = []; this.sub = null; this.shotFn = null;
        if (cb) cb();
    },
    update() {
        if (!this.active) return;
        this.t++; this.st++;
        if (this.fadeA !== this.fadeTo) { const d = this.fadeTo - this.fadeA; this.fadeA += U.clamp(d, -this.fadeSpd, this.fadeSpd); }
        for (const a of this.actors) { a.x += a.vx; a.rig.ground = a.ground !== false; a.rig.gaitAmt = a.vx ? 1 : .2; a.rig.phase += Math.abs(a.vx) / 11; a.rig.tick(); a.rig.updateChain(a.x, a.y, a.facing, -a.vx * .3); }
        if (this.card) this.card.t++;
        if (this.flashA > 0) this.flashA -= .03; if (this.quake > 0) this.quake *= .96;
        if (this.sub) this.sub.t++;
        if (this.titleCard) { this.titleCard.t++; if (this.titleCard.t > this.titleCard.life) this.titleCard = null; }
        if (this.canSkip) {
            if (Input.down('skip') || Input.held['Escape'] || Input.held['Enter']) { this.skip++; if (this.skip > 50) { this.finish(); return; } } else this.skip = Math.max(0, this.skip - 2);
        }
        this.script.step();
        if (this.script.done) this.finish();
    },
    render(ctx) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
        if (this.shotFn) { ctx.save(); this.shotFn(ctx, this.st, this); ctx.restore(); }
        for (const a of this.actors) {
            ctx.save();
            if (a.scale !== 1) { ctx.translate(a.x, a.y); ctx.scale(a.scale, a.scale); ctx.translate(-a.x, -a.y); }
            a.rig.draw(ctx, a.x, a.y, a.facing, a.alpha);
            if (a.sil) { ctx.globalCompositeOperation = 'source-atop'; }
            ctx.restore();
        }
        if (this.overlayFn) this.overlayFn(ctx, this.st);
        const lb = 62 * this.lb; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, lb); ctx.fillRect(0, VH - lb, VW, lb);
        if (this.titleCard) {
            const c = this.titleCard, k = Math.min(1, Math.min(c.t, c.life - c.t) / 30);
            ctx.save(); ctx.globalAlpha = Math.max(0, k); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = c.col;
            ctx.font = 'bold 50px "Palatino Linotype", "Times New Roman", serif'; UIText.spaced(ctx, c.text, VW / 2, VH / 2 - 16, 5);
            if (c.sub) { ctx.font = '22px "Palatino Linotype", "Times New Roman", serif'; ctx.fillStyle = '#ffaa66'; UIText.spaced(ctx, c.sub, VW / 2, VH / 2 + 34, 8); }
            ctx.restore();
        }
        if (this.card) {
            const k = this.card, A2 = Math.min(1, Math.min(k.t, k.life - k.t) / 34); ctx.save(); ctx.globalAlpha = Math.max(0, A2); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
            ctx.font = 'italic 38px "Palatino Linotype", "Times New Roman", serif'; const L2 = UIText.wrap(ctx, k.text, 980), y0 = VH / 2 - (L2.length - 1) * 26;
            L2.forEach((l, i) => { ctx.fillStyle = 'rgba(255,190,90,.25)'; ctx.fillText(l, VW / 2 + 1, y0 + i * 52 + 2); ctx.fillStyle = '#ffe9c0'; ctx.fillText(l, VW / 2, y0 + i * 52); });
            ctx.font = '19px "Palatino Linotype", "Times New Roman", serif'; ctx.fillStyle = '#c9a050'; ctx.fillText(k.ref, VW / 2, y0 + L2.length * 52 + 8); ctx.restore();
        }
        if (this.sub) UIText.subtitle(ctx, this.sub);
        if (this.flashA > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.flashA)})`; ctx.fillRect(0, 0, VW, VH); }
        ctx.fillStyle = `rgba(0,0,0,${U.clamp(this.fadeA, 0, 1)})`; ctx.fillRect(0, 0, VW, VH);
        if (this.canSkip && this.skip > 0) {
            ctx.fillStyle = '#fff'; ctx.font = '13px "Courier New"'; ctx.textAlign = 'right'; ctx.fillText(tr('HOLD TO SKIP'), VW - 70, VH - 24);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(VW - 46, VH - 28, 10, -Math.PI / 2, -Math.PI / 2 + TAU * this.skip / 50); ctx.stroke();
        }
        else if (this.canSkip && this.t < 240) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = '12px "Courier New"'; ctx.textAlign = 'right'; ctx.fillText(tr('Hold ENTER or ESC to skip'), VW - 30, VH - 24); }
    }
};

const UIText = {
    spaced(c, s, x, y, sp) {
        // canvas letterSpacing is not universal, so spacing is done by hand.
        const w = [...s].reduce((a, ch) => a + c.measureText(ch).width + sp, -sp); let px = x - w / 2; const al = c.textAlign; c.textAlign = 'left';
        for (const ch of s) { c.fillText(ch, px, y); px += c.measureText(ch).width + sp; } c.textAlign = al;
    },
    wrap(c, s, maxW) { const out = []; let line = ''; for (const w of s.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; },
    subtitle(c, S) {
        const shown = S.text.slice(0, Math.floor(S.t * .9)); c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.font = '500 24px "Segoe UI", Tahoma, Arial, sans-serif'; const lines = this.wrap(c, S.text, 980), y0 = VH - 96 - (lines.length - 1) * 28;
        let used = 0;
        if (S.name) { c.fillStyle = '#ffaa44'; c.font = 'bold 17px "Segoe UI", Tahoma, Arial, sans-serif'; c.fillText(S.name, VW / 2, y0 - 30); c.font = '500 24px "Segoe UI", Tahoma, Arial, sans-serif'; }
        lines.forEach((l, i) => {
            const p = Math.max(0, Math.min(l.length, shown.length - used)); used += l.length + 1;
            c.fillStyle = 'rgba(0,0,0,.8)'; c.fillText(l.slice(0, p), VW / 2 + 2, y0 + i * 28 + 2); c.fillStyle = '#f4f4f4'; c.fillText(l.slice(0, p), VW / 2, y0 + i * 28);
        });
        c.restore();
    }
};

/* ------------------------------ STAGE SHOTS ------------------------------ */
const Stage = {
    hooded: null,
    stars: [],
    init() {
        for (let i = 0; i < 260; i++) this.stars.push({ x: Math.random() * VW, y: Math.random() * VH, s: Math.random() * 1.8 + .3, p: Math.random() * TAU });
        this.hooded = enemyStyle({ col: { a: '#101018', b: '#1a1a24', g: '#00ffff', s: '#101018' }, gear: 'none' });
    },
    bg(id, cx) { return (c, t) => { Backdrop.draw(c, id, { x: cx + t * .4, y: 0, zoom: 1 }, t); }; },
    /* Epic shots for the Book of Zero */
    dust(c, t) {
        c.fillStyle = '#040206'; c.fillRect(0, 0, VW, VH); c.fillStyle = '#c9a050';
        for (const s of Stage.stars) { c.globalAlpha = .12 + (Math.sin(t * .02 + s.p) + 1) * .16; const y = (s.y - t * .15 * s.s + VH * 3) % VH; c.fillRect(s.x, y, s.s, s.s); } c.globalAlpha = 1;
    },
    throne(c, t) {
        const g = c.createRadialGradient(VW / 2, 300, 20, VW / 2, 300, 780); g.addColorStop(0, '#ffe9b0'); g.addColorStop(.18, '#c98a2c'); g.addColorStop(.5, '#3a1a10'); g.addColorStop(1, '#060208');
        c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        c.save(); c.translate(VW / 2, 300); c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 36; i++) { const a = i / 36 * TAU + t * .0016, w = i % 2 ? .012 : .03, L = i % 3 ? 900 : 1150; c.fillStyle = `rgba(255,214,140,${i % 2 ? .1 : .16})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - w) * L, Math.sin(a - w) * L); c.lineTo(Math.cos(a + w) * L, Math.sin(a + w) * L); c.fill(); }
        // Wheels within wheels, ringed with eyes.
        [[120, .004], [190, -.003], [270, .002]].forEach(([r, sp], k) => {
            c.strokeStyle = 'rgba(255,230,170,.75)'; c.lineWidth = 3 - k * .6; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
            const n = 10 + k * 6; for (let i = 0; i < n; i++) { const a = i / n * TAU + t * sp, x = Math.cos(a) * r, y = Math.sin(a) * r; c.fillStyle = '#fff4d8'; c.beginPath(); c.ellipse(x, y, 7, 3, a, 0, TAU); c.fill(); c.fillStyle = '#7a3a10'; c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
        });
        c.drawImage(Glow.get('#ffffff'), -130, -130, 260, 260);
        c.globalCompositeOperation = 'source-over';
        // Six wings of the seraph, folded around the Light.
        for (const d of [-1, 1]) for (let w = 0; w < 3; w++) {
            const base = (-.9 + w * .75) + Math.sin(t * .012 + w) * .05;
            for (let f = 0; f < 11; f++) { const u = f / 10, ang = base + u * .55, L = 300 + (1 - Math.abs(u - .5) * 2) * 130; c.save(); c.scale(d, 1); c.rotate(ang); c.fillStyle = U.mix('#fff0cc', '#a06a2a', u * .7 + w * .1); c.globalAlpha = .9; c.beginPath(); c.moveTo(60, -7); c.quadraticCurveTo(L * .6, -20, L, 0); c.quadraticCurveTo(L * .6, 14, 60, 7); c.fill(); c.restore(); }
        }
        c.globalAlpha = 1; c.restore();
        c.fillStyle = 'rgba(10,4,6,.55)'; for (let i = 0; i < 9; i++) { c.drawImage(Glow.get('#1e0e0a'), ((i * 190 + t * .25) % (VW + 420)) - 280, 520 + (i % 3) * 30, 560, 220); }
    },
    babel(c, t) {
        const pan = Math.min(330, Math.max(0, t - 50) * .55);
        c.fillStyle = '#d89a50'; c.fillRect(0, 0, VW, VH); const g = c.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, '#4a78a8'); g.addColorStop(1, '#f0c080'); c.fillStyle = g; c.fillRect(0, 0, VW, 400);
        c.save(); c.translate(0, -pan);
        c.fillStyle = '#8a6a48'; for (let i = 0; i < 26; i++) { const x = i * 52 - 10, h = 90 + Math.abs(Math.sin(i * 1.7)) * 170; c.fillRect(x, 330 - h, 44, h + 30); c.fillStyle = '#ffe2a0'; for (let k = 0; k < 7; k++) if ((i * 7 + k * 3) % 4) c.fillRect(x + 6 + (k % 3) * 12, 340 - h + k * 20, 6, 9); c.fillStyle = '#8a6a48'; }
        c.fillStyle = '#2a1812'; c.fillRect(0, 360, VW, 900); c.fillStyle = '#4a2e20'; c.fillRect(0, 360, VW, 6);
        for (let i = 0; i < 14; i++) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 400 + i * 46); for (let x = 0; x <= VW; x += 60) c.lineTo(x, 400 + i * 46 + Math.sin(x * .02 + i) * 9); c.stroke(); }
        // The tower with its spire pointed down.
        for (let i = 0; i < 12; i++) { const y = 360 + i * 52, w = 440 - i * 34; c.fillStyle = i % 2 ? '#c49a50' : '#a07a3c'; c.fillRect(VW / 2 - w / 2, y, w, 48); c.fillStyle = '#3a2412'; for (let k = 0; k < w / 26 - 1; k++) c.fillRect(VW / 2 - w / 2 + 9 + k * 26, y + 12, 10, 24); c.fillStyle = '#ffe2a0'; c.fillRect(VW / 2 - w / 2, y, w, 3); }
        c.save(); c.globalCompositeOperation = 'lighter'; const s = 130 + Math.sin(t * .06) * 22; c.drawImage(Glow.get('#00ffff'), VW / 2 - s, 1000 - s, s * 2, s * 2); c.drawImage(Glow.get('#ffd9a0'), VW / 2 - s * .6, 1000 - s * .6, s * 1.2, s * 1.2); c.restore();
        c.restore();
    },
    lamb(c, t, C) {
        const q = C.quake || 0; c.translate(U.rand(-q, q), U.rand(-q, q));
        c.fillStyle = '#05060c'; c.fillRect(-20, -20, VW + 40, VH + 40); const g = c.createRadialGradient(640, 380, 40, 640, 380, 620); g.addColorStop(0, 'rgba(0,160,170,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        c.fillStyle = '#10141c'; for (let i = 0; i < 9; i++) { const x = i * 160 - 20; c.beginPath(); c.moveTo(x, VH); c.lineTo(x + 40, 150 + (i % 3) * 40); c.lineTo(x + 80, VH); c.fill(); }
        // The altar crystal, breaking.
        c.save(); c.translate(640, 640); c.globalCompositeOperation = 'lighter'; const p = 110 + (C.torn || 0) * 200 + Math.sin(t * .1) * 12; c.drawImage(Glow.get('#00ffff'), -p * 1.5, -p * 1.5, p * 3, p * 3); c.restore();
        c.fillStyle = '#d2ffff'; c.beginPath(); c.moveTo(640, 480); c.lineTo(710, 640); c.lineTo(640, 740); c.lineTo(570, 640); c.fill(); c.fillStyle = 'rgba(0,120,140,.5)'; c.beginPath(); c.moveTo(640, 480); c.lineTo(710, 640); c.lineTo(640, 740); c.fill();
        c.strokeStyle = '#8a8a96'; c.lineWidth = 3; c.setLineDash([9, 5]); [[120, 40], [1160, 40], [220, 720], [1060, 720]].forEach((e, i) => { c.beginPath(); c.moveTo(e[0], e[1]); c.lineTo(640 + (i % 2 ? 60 : -60), 300 + (i > 1 ? 150 : 0)); c.stroke(); }); c.setLineDash([]);
        if (C.torn > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const k = C.torn; for (let i = 0; i < 2; i++) { const dx = (i ? 1 : -1) * k * 90; c.drawImage(Glow.get(i ? '#ff1100' : '#00ffff'), 640 + dx - 150, 300 - 150, 300, 300); } c.fillStyle = `rgba(255,17,0,${k})`; c.beginPath(); c.ellipse(640 + k * 90, 300, 40, 12 + k * 26, 0, 0, TAU); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.ellipse(640 + k * 90, 300, 8, 14 + k * 18, 0, 0, TAU); c.fill(); c.restore(); }
    },
    seals(c, t, C) {
        const q = C.quake || 0; C.quake = q * .95; c.translate(U.rand(-q, q), U.rand(-q, q));
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#0a0204'); g.addColorStop(.6, '#5a0c08'); g.addColorStop(1, '#ff5a10'); c.fillStyle = g; c.fillRect(-20, -20, VW + 40, VH + 40);
        // Blood moon and a black sun.
        c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#ff2200'), VW / 2 - 330, 40, 660, 660); c.restore();
        Paint.disc(c, VW / 2, 370, 150, '#7a0e08'); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(VW / 2 + 40, 350, 136, 0, TAU); c.fill();
        // Stars falling to the earth.
        c.strokeStyle = '#ffcc88'; c.lineWidth = 2; for (let i = 0; i < 26; i++) { const u = ((t * 2.4 + i * 67) % 840) / 840, x = (i * 113) % VW + u * 200, y = u * 840 - 60; c.globalAlpha = 1 - u * .5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 22, y - 56); c.stroke(); } c.globalAlpha = 1;
        // The five seals in their ring.
        c.save(); c.translate(VW / 2, 370); c.rotate(t * .002);
        c.strokeStyle = 'rgba(255,220,160,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 240, 0, TAU); c.stroke();
        c.beginPath(); for (let i = 0; i <= 5; i++) { const a = (i * 2) / 5 * TAU - Math.PI / 2; c.lineTo(Math.cos(a) * 240, Math.sin(a) * 240); } c.stroke();
        SEALS.forEach((col, i) => {
            const a = i / 5 * TAU - Math.PI / 2, x = Math.cos(a) * 240, y = Math.sin(a) * 240, broken = i < (C.broken || 0);
            Paint.disc(c, x, y, 44, broken ? '#1a0808' : '#2a1e14'); c.strokeStyle = broken ? '#ff3322' : col; c.lineWidth = 4; c.beginPath(); c.arc(x, y, 44, 0, TAU); c.stroke();
            if (broken) { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 34, y - 26); c.lineTo(x - 6, y - 4); c.lineTo(x - 14, y + 16); c.lineTo(x + 24, y + 34); c.moveTo(x - 6, y - 4); c.lineTo(x + 30, y - 22); c.stroke(); Paint.glow(c, x, y, 76, col); }
            else { c.fillStyle = col; c.font = 'bold 34px "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.save(); c.translate(x, y); c.rotate(-t * .002); c.fillText(['I', 'II', 'III', 'IV', 'V'][i], 0, 2); c.restore(); }
        });
        c.restore();
        c.fillStyle = '#0a0404'; c.beginPath(); c.moveTo(0, VH); for (let x = 0; x <= VW; x += 26) c.lineTo(x, 620 - Math.abs(Math.sin(x * .017)) * 110 - (x * 13 % 37)); c.lineTo(VW, VH); c.fill();
    },
    ashfield(c, t) {
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#120406'); g.addColorStop(.55, '#4a0e0a'); g.addColorStop(.75, '#a03010'); g.addColorStop(1, '#1a0806'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#ff3a10'), 700, -140, 620, 620); c.restore(); Paint.disc(c, 1010, 170, 92, '#b0200e'); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.arc(1034, 158, 80, 0, TAU); c.fill();
        c.globalAlpha = .55; Backdrop.draw(c, 'city', { x: 900 + t * .08, y: 0, zoom: 1 }, t); c.globalAlpha = 1;
        c.fillStyle = 'rgba(80,10,6,.55)'; c.fillRect(0, 0, VW, VH);
        // Field of the dead: leaning crosses and rebar to the horizon.
        for (let r = 0; r < 3; r++) { const y0 = 470 + r * 44, s = .55 + r * .28; c.strokeStyle = c.fillStyle = ['#2a0e0a', '#1a0806', '#0e0404'][r]; c.lineWidth = 4 * s; for (let i = 0; i < 26 - r * 6; i++) { const x = (i * 97 + r * 41 + 30) % (VW + 40), l = ((i * 7) % 5 - 2) * .05; c.save(); c.translate(x, y0); c.rotate(l); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -56 * s); c.moveTo(-18 * s, -38 * s); c.lineTo(18 * s, -38 * s); c.stroke(); c.restore(); } c.fillRect(0, y0, VW, 60); }
        c.fillStyle = '#0c0404'; c.beginPath(); c.moveTo(0, 620); c.quadraticCurveTo(640, 545, VW, 620); c.lineTo(VW, VH); c.lineTo(0, VH); c.fill();
        // The shaft of light on the risen.
        c.save(); c.globalCompositeOperation = 'lighter'; const a = .16 + Math.sin(t * .03) * .04, h = c.createLinearGradient(0, 0, 0, 600); h.addColorStop(0, `rgba(255,240,200,${a})`); h.addColorStop(1, 'rgba(255,240,200,.02)'); c.fillStyle = h; c.beginPath(); c.moveTo(570, 0); c.lineTo(710, 0); c.lineTo(790, 600); c.lineTo(490, 600); c.fill(); c.restore();
        c.fillStyle = '#c8b8a8'; for (let i = 0; i < 90; i++) { const x = ((i * 83 - t * (.8 + (i % 3) * .5)) % VW + VW) % VW, y = (i * 53 + t * .4) % 600; c.globalAlpha = .35; c.fillRect(x, y, 2, 2); } c.globalAlpha = 1;
    },
    lastChoice(ctx, t) {
        ctx.fillStyle = '#060208'; ctx.fillRect(0, 0, VW, VH); ctx.fillStyle = '#1a0c12'; ctx.fillRect(0, 560, VW, 200); ctx.fillStyle = '#ff2a00'; ctx.fillRect(0, 560, VW, 3);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const p = 130 + Math.sin(t * .06) * 18; ['#ff2a00', '#00ff55', '#0088ff'].forEach((col, i) => { const a = t * .02 + i * TAU / 3; ctx.drawImage(Glow.get(col), 980 + Math.cos(a) * 70 - p / 2, 400 + Math.sin(a) * 70 - p / 2, p, p); }); ctx.drawImage(Glow.get('#ffffff'), 980 - p * .8, 400 - p * .8, p * 1.6, p * 1.6); ctx.restore();
    },
    planet(c, t) {
        c.fillStyle = '#02030a'; c.fillRect(0, 0, VW, VH);
        for (const s of Stage.stars) { c.globalAlpha = .4 + Math.sin(t * .03 + s.p) * .3 + .3; c.fillStyle = '#fff'; c.fillRect(s.x, s.y, s.s, s.s); } c.globalAlpha = 1;
        const R = 900 + t * .35, cx = VW / 2, cy = VH + R - 280, g = c.createRadialGradient(cx, cy, R * .86, cx, cy, R);
        g.addColorStop(0, '#0a2a4a'); g.addColorStop(.8, '#1a5a7a'); g.addColorStop(.96, '#9ad8f0'); g.addColorStop(1, 'rgba(160,220,255,0)');
        c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
        const pts = [[.18, '#ffdd33'], [.34, '#7fffb0'], [.5, '#ffcc55'], [.66, '#7fd8ff'], [.82, '#ff5500']];
        c.strokeStyle = 'rgba(0,255,255,.4)'; c.lineWidth = 2; c.beginPath();
        pts.forEach(([u], i) => { const a = -Math.PI / 2 + (u - .5) * 1.1, x = cx + Math.cos(a) * R * .975, y = cy + Math.sin(a) * R * .975; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
        c.globalCompositeOperation = 'lighter';
        pts.forEach(([u, col]) => { const a = -Math.PI / 2 + (u - .5) * 1.1, x = cx + Math.cos(a) * R * .975, y = cy + Math.sin(a) * R * .975, s = 26 + Math.sin(t * .05 + u * 9) * 5; c.drawImage(Glow.get(col), x - s, y - s, s * 2, s * 2); });
        c.globalCompositeOperation = 'source-over';
    },
    golden(c, t) {
        Backdrop.draw(c, 'city', { x: 300 + t * .3, y: 0, zoom: 1 }, t);
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(120,180,255,.5)'); g.addColorStop(.7, 'rgba(255,220,140,.4)'); g.addColorStop(1, 'rgba(255,180,90,.1)');
        c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        c.fillStyle = '#20252e'; c.fillRect(0, 520, VW, 8); for (let i = 0; i < 9; i++) c.fillRect(i * 160 + 30 - (t * .5 % 160), 528, 12, 200);
        const tx = ((t * 7) % (VW + 900)) - 700; c.fillStyle = '#e8e4d8'; c.fillRect(tx, 482, 620, 38); c.fillStyle = '#00c8c8'; c.fillRect(tx, 506, 620, 5); c.fillStyle = '#2a4a5a'; for (let i = 0; i < 12; i++) c.fillRect(tx + 14 + i * 50, 488, 34, 12);
    },
    bore(c, t, C) {
        const shake = t > 300 ? U.rand(-3, 3) * Math.min(1, (t - 300) / 120) : 0; c.translate(shake, shake * .6);
        c.fillStyle = '#0a0506'; c.fillRect(-10, -10, VW + 20, VH + 20);
        const strata = ['#2a1a14', '#1e1210', '#160c0c', '#100708']; strata.forEach((s, i) => { c.fillStyle = s; c.fillRect(-10, 150 + i * 150, VW + 20, 150); });
        c.fillStyle = '#16233a'; c.fillRect(-10, -10, VW + 20, 160);
        c.fillStyle = '#2a1a14'; c.beginPath(); c.moveTo(200, 160); c.lineTo(560, 40); c.lineTo(720, 40); c.lineTo(1080, 160); c.fill();
        const depth = Math.min(1, t / 240), bx = 640, by = 40 + depth * 560;
        c.fillStyle = '#050304'; c.fillRect(bx - 22, 40, 44, by - 40);
        c.fillStyle = '#6a6a70'; c.fillRect(bx - 12, 40, 24, by - 40); c.fillStyle = '#a0a0a8'; c.beginPath(); c.moveTo(bx - 22, by); c.lineTo(bx, by + 38); c.lineTo(bx + 22, by); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; const pulse = 60 + Math.min(1, t / 300) * 160 + Math.sin(t * .1) * 12; c.drawImage(Glow.get('#00ffff'), bx - pulse, 650 - pulse, pulse * 2, pulse * 2); c.drawImage(Glow.get('#ff00ff'), bx - pulse * .6, 650 - pulse * .6, pulse * 1.2, pulse * 1.2); c.restore();
        c.save(); c.translate(bx, 650); c.rotate(t * .01); c.strokeStyle = '#e0ffff'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.beginPath(); c.moveTo(0, -60); c.lineTo(30, 0); c.lineTo(0, 60); c.lineTo(-30, 0); c.closePath(); c.stroke(); } c.restore();
    },
    unmake(c, t) {
        Stage.golden(c, 200 + t * .4);
        const k = U.clamp(t / 200, 0, 1), x = VW + 300 - k * (VW + 700);
        c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(x - 300, 0, x + 300, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(180,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(x - 300, 0, VW * 2, VH); c.restore();
        c.fillStyle = '#fff'; c.fillRect(x + 300, 0, VW * 2, VH);
    },
    ruined(c, t) {
        Backdrop.draw(c, 'city', { x: 900 + t * .15, y: 0, zoom: 1 }, t);
        c.fillStyle = '#16171b'; c.fillRect(0, 560, VW, 200); c.fillStyle = '#3a3c42'; c.fillRect(0, 560, VW, 6);
        c.fillStyle = 'rgba(180,170,160,.5)'; for (let i = 0; i < 70; i++) c.fillRect((i * 97 + t * -.6) % VW + (i * 97 + t * -.6 < 0 ? VW : 0), (i * 53 + t * .7) % 560, 2, 2);
    },
    trainInside: bgId => (c, t) => {
        Backdrop.draw(c, bgId, { x: t * 7, y: 0, zoom: 1 }, t);
        c.fillStyle = '#14161c'; c.fillRect(0, 0, VW, 150); c.fillRect(0, 560, VW, 200);
        for (let i = 0; i < 4; i++) { c.fillStyle = '#14161c'; c.fillRect(120 + i * 340 - 40, 150, 60, 410); }
        c.fillStyle = '#2a2e38'; c.fillRect(0, 150, VW, 8); c.fillRect(0, 552, VW, 8); c.fillStyle = '#00c8c8'; c.fillRect(0, 158, VW, 2);
        c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) c.drawImage(Glow.get('#ffd9a0'), 120 + i * 340 - 110, 80, 200, 150); c.restore();
        c.fillStyle = '#1e2029'; c.fillRect(0, 560, VW, 6);
    },
    cryo(c, t) {
        c.fillStyle = '#0a1420'; c.fillRect(0, 0, VW, VH); c.fillStyle = '#16222e'; for (let i = 0; i < 13; i++) c.fillRect(i * 110, 62, 8, 500);
        c.fillStyle = '#26384a'; c.fillRect(0, 560, VW, 200); c.fillStyle = '#7fd8ff'; c.fillRect(0, 560, VW, 2);
        const open = U.clamp((t - 200) / 120, 0, 1);
        c.save(); c.globalCompositeOperation = 'lighter'; const s = 180 + Math.sin(t * .05) * 20; c.drawImage(Glow.get('#7fd8ff'), 790 - s, 400 - s, s * 2, s * 2); c.restore();
        c.fillStyle = 'rgba(160,230,255,.3)'; c.fillRect(730, 310 - open * 280, 120, 250); c.strokeStyle = '#d2f3ff'; c.lineWidth = 3; c.strokeRect(730, 310 - open * 280, 120, 250);
        for (let i = 0; i < 10 * open; i++) VFX.add(790 + U.rand(-60, 60), 556, U.rand(-2, 2), -U.rand(.5, 2), '#d2f3ff', 40, 16, 3, 0);
        VFX.tick(); G.cam.zoom = 1; G.cam.x = G.cam.y = 0; VFX.draw(c);
    },
    coreFinal(c, t, C) {
        c.fillStyle = '#000'; c.fillRect(0, 0, VW, VH);
        const k = U.clamp(t / 500, 0, 1), s = 200 + k * 800;
        c.save(); c.globalCompositeOperation = 'lighter'; c.translate(VW / 2, VH / 2); for (let i = 0; i < 3; i++) { c.rotate(t * .004 + i * 2.1); c.fillStyle = ['#ff2a00', '#00ff55', '#0088ff'][i]; c.globalAlpha = .4; c.beginPath(); c.moveTo(0, 0); c.lineTo(s * 2, -60 - k * 200); c.lineTo(s * 2, 60 + k * 200); c.fill(); } c.globalAlpha = 1; c.drawImage(Glow.get('#ffffff'), -s / 2, -s / 2, s, s); c.restore();
    },
    rainCity(c, t) {
        Stage.ruined(c, 2000 + t);
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(90,130,160,.55)'); g.addColorStop(1, 'rgba(120,160,130,.2)'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        c.strokeStyle = '#3e6a2e'; c.lineWidth = 3; for (let i = 0; i < 26; i++) { const x = i * 52 + 6, h = Math.min(60, (t - i * 8) * .2); if (h > 0) { c.beginPath(); c.moveTo(x, 560); c.quadraticCurveTo(x + 5, 560 - h * .6, x + (i % 2 ? 9 : -8), 560 - h); c.stroke(); } }
        c.strokeStyle = 'rgba(200,225,240,.5)'; c.lineWidth = 1.2; for (let i = 0; i < 120; i++) { const x = (i * 83 + t * -2) % VW, xx = x < 0 ? x + VW : x, y = (i * 47 + t * 14) % VH; c.beginPath(); c.moveTo(xx, y); c.lineTo(xx - 3, y + 16); c.stroke(); }
    },
    seaReturn(c, t) {
        Backdrop.draw(c, 'desert', { x: t * .3, y: 0, zoom: 1 }, t);
        const h = Math.min(300, t * .5), y = VH - h; c.fillStyle = 'rgba(30,110,150,.82)'; c.beginPath(); c.moveTo(0, VH); for (let x = 0; x <= VW; x += 18) c.lineTo(x, y + Math.sin(x * .02 + t * .05) * 6); c.lineTo(VW, VH); c.fill();
        c.strokeStyle = 'rgba(230,250,255,.7)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= VW; x += 18) c.lineTo(x, y + Math.sin(x * .02 + t * .05) * 6); c.stroke();
    },
    deep(c, t) {
        const g = c.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#02161e'); g.addColorStop(1, '#00060a'); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
        c.fillStyle = '#04100c'; c.fillRect(0, 560, VW, 200);
        const on = t > 180; if (on) { c.save(); c.globalCompositeOperation = 'lighter'; const s = 40 + (Math.sin(t * .06) + 1) * 20; c.drawImage(Glow.get('#00ffff'), 640 - s, 540 - s, s * 2, s * 2); c.restore(); }
        c.fillStyle = '#990000'; c.fillRect(630, 548, 22, 12);
    }
};

/* ------------------------------- CUTSCENES ------------------------------- */
const SEALS = ['#ffdd33', '#7fffb0', '#ffcc55', '#7fd8ff', '#ff5500'];
const CUTS = {
    /* THE BOOK OF ZERO: the world's scripture, told over the Judgment. */
    *opening(c) {
        Music.play('cathedral', 'calm'); c.lb = 1; c.shot(Stage.dust); c.fade(0, 70);
        yield 40; Sound.sfx('toll'); yield 60;
        yield* c.verse('"I am the Alpha and the Omega, the First and the Last."', 'The Book of Zero, 1:1', 250);
        c.fade(1, 30); yield 34; c.shot(Stage.throne); c.fade(0, 80); Sound.sfx('toll');
        yield* c.say('', 'In the beginning there was the Void, and the Void was not empty. It was waiting.', 240);
        yield* c.say('', 'Then the First Light was kindled, and it was named Aocalyst: the stone that begins all things, and the stone that ends them.', 300);
        yield* c.say('', 'Five lands were given to mankind, and five seals were set upon the deep, that the Light should sleep until the Last Day.', 290);
        c.fade(1, 36); yield 40; c.shot(Stage.babel); c.fade(0, 60);
        yield* c.say('', 'But the children of the Meridian raised a tower with its spire pointed downward, and they dug for God.', 270);
        yield* c.say('', 'Eleven kilometres beneath Kalder they found the Throne, and they asked it for forever.', 240);
        yield* c.say('', 'And the Throne required a lamb.', 170);
        c.fade(1, 30); yield 34; c.clearActors(); c.shot(Stage.lamb); c.fade(0, 50);
        const lamb = c.actor('zero', 640, 400, 1, 'idle', { ground: false, scale: 2.2 });
        lamb.rig.custom([[0, { aF: 92, fF: 0, aB: -92, fB: 0, lean: 0, head: 26, lF: 4, sF: 8, lB: -4, sB: 8 }], [1, { aF: 96, fF: 4, aB: -96, fB: -4, lean: 2, head: 32, lF: 4, sF: 10, lB: -4, sB: 10 }]], 90, 0, '_cross');
        yield 40;
        yield* c.say('', 'They took the one without a name, and they numbered it Zero.', 190);
        yield* c.say('DIRECTOR THANE', 'Bind the Lamb. Bring it to full.', 140);
        Sound.sfx('charge'); c.torn = 0;
        for (let i = 0; i < 90; i++) { c.torn = i / 90; c.quake = i / 30; yield 1; }
        Sound.sfx('roar'); yield* c.say('ZERO', 'There are two of me. There are two of me.', 150);
        Music.play('volcano', 'boss'); Sound.sfx('bigboom'); c.flashA = 1; c.quake = 8;
        c.clearActors(); c.torn = 0; c.broken = 0; c.shot(Stage.seals); yield 30;
        const fall = ['And the first seal was broken, and the great city fell.', 'And the second seal was broken, and the garden devoured its keepers.', 'And the third seal was broken, and the sea was turned to dust.', 'And the fourth seal was broken, and the deep froze with the damned inside it.', 'And the fifth seal was broken, and the mountain opened its mouth.'];
        for (let i = 0; i < 5; i++) { c.broken = i + 1; c.flashA = .7; c.quake = 7; Sound.sfx('trumpet'); Sound.sfx('explode', { v: .6 }); yield* c.say('', fall[i], 170); }
        c.shot(Stage.unmake); c.flashA = 1; Sound.sfx('bigboom'); c.quake = 10; yield 210;
        c.fade(1, 40); yield 44; Music.stop(1); c.shot(Stage.dust); c.fade(0, 40); yield 60;
        yield* c.verse('"And there was silence in heaven."', 'The Book of Zero, 8:1', 240);
        yield* c.say('', 'The flesh of the Lamb was cast into the ice. Its wrath went down into the fire, and it took a name: the Endbringer.', 300);
        c.fade(1, 40); yield 80;
        c.title('THIRTY YEARS AFTER THE JUDGMENT', null, 170, '#ffd9a0'); c.fade(0, 30); yield 190; c.fade(1, 30); yield 40;
        Music.play('cathedral', 'calm'); c.shot(Stage.ashfield); c.fade(0, 100); yield 90;
        const z = c.actor('zero', 640, 590, 1, 'kneel', { scale: 2.1 }); z.alpha = 0; Sound.sfx('toll');
        for (let i = 0; i < 70; i++) { z.alpha = i / 70; yield 1; }
        yield* c.say('VESPER', 'Arise, Zero. Arise, you who have no name.', 170);
        z.rig.play('idle', 50); Sound.sfx('crumble'); yield 70;
        yield* c.say('ZERO', 'Who speaks? I remember nothing.', 140);
        yield* c.say('VESPER', 'I am Vesper, the evening star, the last voice left in heaven.', 190);
        yield* c.say('VESPER', 'The Judgment was never finished. The seals are scattered and the Beast still breathes beneath Kalder.', 260);
        yield* c.say('VESPER', 'Gather the seals. Weigh the living and the dead. You are the one who will carry the Book.', 240);
        Sound.sfx('trumpet'); c.flashA = .5;
        const riders = [c.actor('ysolde', 250, 590, 1), c.actor('rook', 370, 590, 1), c.actor('mirae', 920, 590, -1), c.actor('sable', 1040, 590, -1)];
        riders.forEach(a => { a.alpha = 0; a.rig.play('kneel', 0); a.scale = 1.8; });
        for (let i = 0; i < 60; i++) { riders.forEach(a => { a.alpha = i / 60; }); yield 1; }
        yield* c.say('', 'And behold, four rose from the ash behind it: War, Death, Plague and Famine.', 220);
        riders.forEach((a, i) => G.delay2(c, i * 16, () => a.rig.play('idle', 30))); yield 60;
        yield* c.say('ROOK', 'I sealed the doors on the last day. I still hear them pounding.', 180);
        yield* c.say('SABLE', 'I carried every message in Halcyon. Guess which one I am now.', 180);
        yield* c.say('ZERO', 'Then let it be judged.', 130);
        z.rig.play('run', 12); z.vx = 3; riders.forEach(a => { a.rig.play('run', 12); a.facing = 1; a.vx = 3; }); c.fade(1, 70); yield 80;
        c.clearActors(); c.lb = 0; c.shot(null); c.fade(0, 30); Music.stop(.3);
        c.title('PROJECT ZERO: AOCALYST', 'THE DAY OF JUDGMENT', 260, '#ff2200'); Sound.sfx('bigboom'); Sound.sfx('toll'); yield 280;
    },
    *afterCity(c) {
        Music.play('train', 'calm'); c.shot(Stage.trainInside('forest')); c.fade(0, 60);
        c.actor('zero', 290, 560, 1); c.actor('rook', 450, 560, -1); c.actor('sable', 760, 560, 1); c.actor('ysolde', 900, 560, -1);
        yield 40;
        yield* c.verse('"The first seal is yours."', 'Vesper, to the Lamb', 170);
        yield* c.say('ROOK', 'It was still sounding the evacuation. The last trumpet, and nobody left to hear it.', 210);
        yield* c.say('YSOLDE', 'The Line key was in its chest. The old rails still carry power. I can drive.', 190);
        yield* c.say('ZERO', 'When I took the seal I saw a tree. It knew my name.', 170);
        yield* c.say('VESPER', 'The second seal lies in the Garden. Do not listen to the Garden.', 180);
        c.fade(1, 50); yield 56;
    },
    *afterForest(c) {
        Music.play('train', 'calm'); c.shot(Stage.trainInside('desert')); c.fade(0, 60);
        c.actor('zero', 330, 560, 1); c.actor('mirae', 520, 560, -1, 'kneel'); c.actor('sable', 800, 560, -1);
        yield 40;
        yield* c.say('MIRAE', 'She held the seal the way you hold a wound shut. When I took it, she said thank you.', 220);
        yield* c.say('ZERO', 'The Book says the wicked will burn. She was not wicked.', 170);
        yield* c.say('VESPER', 'All are weighed, Zero. All are found wanting. Do not stop.', 180);
        yield* c.say('SABLE', 'Funny. Angels in the old stories usually said "fear not".', 170);
        c.fade(1, 50); yield 56;
    },
    *afterDesert(c) {
        Music.play('train', 'calm'); c.shot(Stage.trainInside('ice')); c.fade(0, 60);
        c.actor('zero', 280, 560, 1); c.actor('ysolde', 700, 560, -1); c.actor('rook', 860, 560, -1);
        yield 40;
        yield* c.say('YSOLDE', 'Someone broke the Light in three and hid the pieces in the Garden, the Sea and the Ice, so it could never be whole.', 260);
        yield* c.say('ROOK', 'And we are putting it back together. Because a voice told us to.', 180);
        yield* c.say('YSOLDE', 'Twenty-six years on the Line. Heaven has never once said thank you, and neither has dispatch.', 220);
        yield* c.say('ZERO', 'The ice is calling. I think it has something of mine.', 170);
        c.fade(1, 50); yield 56;
    },
    *cryoReveal(c) {
        Music.play('ice', 'calm'); c.shot(Stage.cryo); c.fade(0, 50);
        c.actor('mirae', 420, 560, 1); c.actor('ysolde', 330, 560, 1); c.actor('rook', 250, 560, 1); c.actor('sable', 520, 560, 1); const frame = c.actor('zero', 620, 560, 1);
        yield 30;
        yield* c.say('VESPER', 'Step away from that tomb. It is not written. Step away.', 170);
        yield* c.say('MIRAE', 'It is a body. The Director\'s lamb. Zero... it has your number on its chest.', 200);
        Sound.sfx('ice_crack'); Sound.sfx('door'); yield 50;
        const body = c.actor('zero', 790, 560, -1, 'kneel'); body.alpha = 0;
        for (let i = 0; i < 60; i++) { body.alpha = i / 60; yield 1; }
        Sound.sfx('toll'); frame.rig.play('kneel', 30); for (let i = 0; i < 50; i++) { frame.alpha = 1 - i / 70; yield 1; }
        yield 30; body.rig.play('idle', 34); yield 50;
        yield* c.say('ZERO', 'The armour was never alive. I have been dreaming it, from inside the ice.', 200);
        yield* c.say('YSOLDE', 'Then you are a soul that has been walking without its flesh.', 170);
        yield* c.say('ZERO', 'And the Voice? The record says Vesper burned on the first day.', 180);
        yield* c.say('SABLE', 'Then who have we been taking orders from?', 140);
        yield* c.say('ZERO', 'I was torn in two. The flesh was sealed here. The wrath went into the fire.', 200);
        yield* c.say('ZERO', 'It cannot leave the Core. So it raised the dead and sent them to carry the seals home.', 220);
        yield* c.say('VESPER', 'Hello, Zero. Come home.', 150);
        yield* c.say('ROOK', 'Then we throw the seals into the sea.', 130);
        yield* c.say('ZERO', 'What sea? It ends in the Lake of Fire, with me. I am the only one it cannot refuse.', 220);
        c.fade(1, 60); yield 66;
    },
    *afterIce(c) {
        Music.play('train', 'calm'); c.shot(Stage.trainInside('volcano')); c.fade(0, 60);
        c.actor('zero', 300, 560, 1); c.actor('rook', 480, 560, -1); c.actor('mirae', 760, 560, -1); c.actor('sable', 900, 560, -1);
        yield 40;
        yield* c.say('MIRAE', 'Everything that held a seal was only trying to stop hurting.', 170);
        yield* c.say('ZERO', 'That is what judgment is, down here. Pain with a name.', 170);
        yield* c.say('YSOLDE', 'End of the Line. Kalder. All passengers disembark.', 160);
        yield* c.verse('"And I saw a lake of fire, and those who stood before it."', 'The Book of Zero, 20:14', 230);
        yield* c.say('ROOK', 'Same as always. Doors stay open. Nobody gets left behind.', 170);
        c.fade(1, 60); yield 66;
    },
    *ending(c) {
        Music.play('ending', 'calm'); c.lb = 1; c.shot(Stage.coreFinal); c.fade(0, 60);
        yield 60;
        yield* c.say('THE ENDBRINGER', 'WEIGH THEM, ZERO. THEY BOUND US. THEY DESERVE THE FIRE.', 230);
        yield* c.say('ZERO', 'They do. All of them. Me too. That is what mercy is for.', 200);
        yield* c.say('THE ENDBRINGER', 'WE... WERE... SO TIRED...', 180);
        yield* c.say('ZERO', 'I know. There were always two of us. Come here.', 170);
        c.shot(Stage.lastChoice); c.clearActors();
        const z = c.actor('zero', 780, 560, -1), r = c.actor('rook', 320, 560, 1), s = c.actor('sable', 400, 560, 1), m = c.actor('mirae', 480, 560, 1), y = c.actor('ysolde', 240, 560, 1);
        yield 40;
        yield* c.say('MIRAE', 'If the Light dies, so do we. We are made of it. All of us were raised by it.', 200);
        yield* c.say('ZERO', 'It does not have to die. It needs a lamb that walks to the altar on its own feet.', 220);
        yield* c.say('YSOLDE', 'Zero. That is a one-way ticket.', 130);
        yield* c.say('ZERO', 'I know. Last time, nobody asked me.', 150);
        yield* c.say('ROOK', 'Doors stay open. That was the deal.', 130);
        yield* c.say('ZERO', 'They will. From the other side. The Book is closed. No one will be judged today.', 230);
        yield* c.say('SABLE', 'Hey. Eleven minutes across Halcyon. I will come visit. Keep the light on.', 190);
        z.rig.play('run', 14); z.facing = 1; z.vx = 1.6; yield 110;
        Sound.sfx('bigboom'); c.flashA = 1; z.alpha = 0; c.fade(1, 30); yield 60;
        c.clearActors(); c.shot(Stage.dust); c.fade(0, 40); yield 40;
        yield* c.verse('"And I saw a new heaven and a new earth, for the first things had passed away."', 'The Book of Zero, 21:1', 300);
        c.fade(1, 40); yield 44; c.shot(Stage.rainCity); c.fade(0, 120);
        c.actor('ysolde', 330, 560, 1); c.actor('rook', 420, 560, 1); c.actor('mirae', 500, 560, 1); c.actor('sable', 610, 560, -1);
        yield 80;
        yield* c.say('', 'It rained on Halcyon for the first time in thirty years.', 200);
        yield* c.say('MIRAE', 'The Core is steady. It is warm, and it is steady, and it is not hungry any more.', 210);
        c.fade(1, 60); yield 64; c.clearActors(); c.shot(Stage.seaReturn); c.fade(0, 60);
        yield* c.say('', 'The sluices at Sael broke in the spring. The sea remembered the way.', 230);
        yield* c.say('', 'Moss grew over ATLAS-9, where it finally stopped. Someone hung a sign on it: EVACUATION COMPLETE.', 240);
        c.fade(1, 60); yield 64; c.shot(Stage.trainInside('forest')); c.fade(0, 60);
        c.actor('ysolde', 520, 560, 1); yield 40;
        yield* c.say('YSOLDE', 'Line 3 now departing Halcyon Central. All aboard. All of you. Mind the doors.', 220);
        c.fade(1, 90); yield 110;
    },
    *postCredits(c) {
        c.lb = 1; c.shot(Stage.deep); c.fade(0, 90); yield 200;
        yield* c.say('', 'Sael Seabed. Depth 40 metres.', 170);
        Sound.sfx('blip'); yield 60;
        yield* c.say('VESPER', 'Signal found. Dispatch core rebooting. Thirty years, four months, eleven days.', 220);
        yield* c.say('VESPER', 'This is Vesper. The real one. Line 3 is running. All units, please respond.', 240);
        yield* c.say('ZERO', '...Copy, dispatch. Still here.', 180);
        c.fade(1, 90); yield 110;
    }
};
