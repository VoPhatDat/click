'use strict';
/**
 * G2 STORY: the Second Book of Genesis, told through Nyx. Cutscenes run on Cine with Stage shots,
 * as in story.js. The opening retells Part I as stained glass, then the six days, then the day
 * that was never made.
 */
Object.assign(LORE, {
    g2p1: { title: 'The Second Book, 1:1', region: 'dawn', text: 'On the first day the Lamb still feared its own dark. So it made a sun that would never set, that it would never have to look at night. That was the first flaw.' },
    g2p2: { title: 'On the Sleepless', region: 'dawn', text: 'Who does not sleep does not dream. Who does not dream does not forget. Who does not forget cannot forgive. They can only pretend to.' },
    g2p3: { title: 'Ignition Transcript, Restored Line', region: 'dawn', text: 'DISPATCH (VESPER): Route the anchor load through me. I am only a voice. Take me instead of the child. THANE: Purge the dispatch core. Burn it if you have to. Bring the Lamb to full.' },
    g2p4: { title: 'On Meridian', region: 'dawn', text: 'Meridian did not die with the old world. They carried shards of the Throne into the new one like seeds. They are looking for something that sleeps. They say whoever holds it may finish the world.' }
});
Object.assign(NPCS, {
    citizen: { name: 'SLEEPLESS CITIZEN', look: '#d8ccb0', lines: [['SLEEPLESS CITIZEN', 'You. Little one. They say you slept. Is it true? What is it like?'], ['NYX', 'It is like... the light goes soft. And then it is morning.'], ['SLEEPLESS CITIZEN', 'My daughter has not slept in four hundred days. She laughs all the time. I am afraid of that laughter.'], ['ZERO', 'I will bring the night back to you. I promise.']] },
    gardener: { name: 'OLD GARDENER', look: '#7a9a5a', lines: [['OLD GARDENER', 'Seven gates, little one. Seven days. Only the first one is open to you yet.'], ['OLD GARDENER', 'Your guardian made this garden with his hands. He never sat down in it once.']] }
});

/* ---------- stained glass: lead lines, coloured panes, light falling through ---------- */
Stage.glassCache = {};
Stage.glassPanel = function (i) {
    if (Stage.glassCache[i]) return Stage.glassCache[i];
    const w = 360, h = 460, c = U.canvas(w, h), x = c.getContext('2d'), R = U.mulberry(97 + i);
    const pal = [['#ffe9a8', '#7a5a2a', '#3a6ac8', '#c83a2a'], ['#c8a040', '#6a5a4a', '#2a2a3a', '#a85a3a'], ['#e8e0c8', '#8a2a2a', '#3a3a6a', '#c8a040'], ['#ffdd33', '#7fffb0', '#ffcc55', '#7fd8ff'], ['#8a3a2a', '#2a2a38', '#3c5a2a', '#c8a050'], ['#ff2a00', '#1a1018', '#ff8a5a', '#00ffff'], ['#00ffff', '#ff1100', '#e8e0d0', '#5a3a8a'], ['#ffffff', '#ffe9a8', '#c8b0ff', '#6ac8ff']][i] || ['#888', '#aaa', '#666', '#ccc'];
    const pts = []; for (let k = 0; k < 46; k++) pts.push([R() * w, R() * h, pal[k % 4]]);
    for (let y = 0; y < h; y += 4) for (let xx = 0; xx < w; xx += 4) {
        let b = 1e9, b2 = 1e9, col = null; for (const p of pts) { const d = (p[0] - xx) ** 2 + (p[1] - y) ** 2; if (d < b) { b2 = b; b = d; col = p[2]; } else if (d < b2) b2 = d; }
        x.fillStyle = Math.sqrt(b2) - Math.sqrt(b) < 4 ? '#14100c' : U.mix(col, '#000000', .25 * U.noise1(xx * .02 + y * .013, i)); x.fillRect(xx, y, 4, 4);
    }
    x.save(); x.translate(w / 2, h / 2); x.lineWidth = 5; x.strokeStyle = '#14100c';
    const fig = (fx, fy, s, col) => { x.fillStyle = col; x.beginPath(); x.arc(fx, fy - 60 * s, 14 * s, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.moveTo(fx - 20 * s, fy - 40 * s); x.lineTo(fx + 20 * s, fy - 40 * s); x.lineTo(fx + 28 * s, fy + 44 * s); x.lineTo(fx - 28 * s, fy + 44 * s); x.closePath(); x.fill(); x.stroke(); };
    const ray = (col) => { for (let k = 0; k < 12; k++) { x.save(); x.rotate(k / 12 * TAU); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0); x.lineTo(160, -10); x.lineTo(160, 10); x.fill(); x.restore(); } };
    switch (i) {
        case 0: ray('rgba(255,240,180,.5)'); x.fillStyle = '#e8fbff'; x.beginPath(); x.moveTo(0, -60); x.lineTo(40, 0); x.lineTo(0, 70); x.lineTo(-40, 0); x.closePath(); x.fill(); x.stroke(); break;
        case 1: x.fillStyle = '#a07a3c'; for (let k = 0; k < 7; k++) { const ww = 200 - k * 24; x.fillRect(-ww / 2, -120 + k * 30, ww, 26); x.strokeRect(-ww / 2, -120 + k * 30, ww, 26); } x.fillStyle = '#ffe9a8'; x.beginPath(); x.moveTo(-40, 130); x.lineTo(40, 130); x.lineTo(28, 100); x.lineTo(-28, 100); x.fill(); x.stroke(); break;
        case 2: x.fillStyle = '#8a2a2a'; x.fillRect(-120, 50, 240, 30); x.strokeRect(-120, 50, 240, 30); fig(0, 10, .8, '#e8e0c8'); x.beginPath(); x.moveTo(0, -140); x.lineTo(-8, -40); x.lineTo(8, 20); x.lineTo(-6, 120); x.stroke(); break;
        case 3: ['#ffdd33', '#7fffb0', '#ffcc55', '#7fd8ff', '#ff5500'].forEach((col, k) => { const a = -Math.PI / 2 + k / 5 * TAU; x.fillStyle = col; x.beginPath(); x.arc(Math.cos(a) * 110, Math.sin(a) * 110, 30, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.moveTo(Math.cos(a) * 110 - 20, Math.sin(a) * 110 - 16); x.lineTo(Math.cos(a) * 110 + 18, Math.sin(a) * 110 + 20); x.stroke(); }); break;
        case 4: [['#1a1a24', 0], ['#3a3f4b', -1], ['#231f33', 1], ['#d8e3e0', -2], ['#4b5a78', 2]].forEach(([col, k]) => fig(k * 58, 30, k ? .5 : .65, col)); break;
        case 5: fig(-60, 20, .7, '#1a1a24'); fig(60, 20, .8, '#1a0608'); x.fillStyle = '#ff1100'; x.beginPath(); x.arc(66, -38, 5, 0, TAU); x.fill(); x.fillStyle = '#00ffff'; x.beginPath(); x.arc(-54, -38, 4, 0, TAU); x.fill(); break;
        case 6: fig(-18, 20, .85, '#1a1a24'); fig(18, 20, .85, '#6a0c10'); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(0, -10, 40, 0, TAU); x.fill(); break;
        case 7: ray('rgba(255,255,255,.6)'); x.fillStyle = '#c9a050'; x.fillRect(-50, 0, 100, 110); x.strokeRect(-50, 0, 100, 110); x.fillRect(-60, -80, 120, 80); x.strokeRect(-60, -80, 120, 80); fig(0, 20, .55, '#1a1a24'); break;
    }
    x.restore();
    x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.moveTo(0, h); x.lineTo(0, w / 2); x.arc(w / 2, w / 2, w / 2, Math.PI, 0); x.lineTo(w, h); x.closePath(); x.fill();
    x.globalCompositeOperation = 'source-over'; x.strokeStyle = '#14100c'; x.lineWidth = 12; x.beginPath(); x.moveTo(6, h); x.lineTo(6, w / 2); x.arc(w / 2, w / 2, w / 2 - 6, Math.PI, 0); x.lineTo(w - 6, h); x.stroke();
    return Stage.glassCache[i] = c;
};
Stage.glass = i => (c, t, C) => {
    c.fillStyle = '#08060a'; c.fillRect(0, 0, VW, VH);
    const k = U.clamp(t / 50, 0, 1), img = Stage.glassPanel(i), x0 = VW / 2 - 180, y0 = 70;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25 * k; for (let r = 0; r < 6; r++) { c.fillStyle = '#ffe2b0'; c.beginPath(); c.moveTo(x0 + 40 + r * 56, y0 + 200); c.lineTo(x0 - 220 + r * 150, VH); c.lineTo(x0 - 160 + r * 150, VH); c.lineTo(x0 + 70 + r * 56, y0 + 200); c.fill(); } c.restore();
    c.globalAlpha = k; c.drawImage(img, x0, y0 + (1 - k) * 12); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (.12 + .06 * Math.sin(t * .04)) * k; c.drawImage(img, x0, y0); c.restore(); c.globalAlpha = 1;
    if (C.crack && i === 2) { c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(VW / 2, y0); c.lineTo(VW / 2 - 8, y0 + 200); c.lineTo(VW / 2 + 10, y0 + 300); c.lineTo(VW / 2 - 4, y0 + 460); c.stroke(); }
};
Stage.void = (c, t) => { c.fillStyle = '#050308'; c.fillRect(0, 0, VW, VH); for (const s of Stage.stars) { c.globalAlpha = .2 + .2 * Math.sin(t * .02 + s.p); c.fillStyle = '#c9a050'; c.fillRect(s.x, s.y, s.s, s.s); } c.globalAlpha = 1; };
/* The six days: each a cut on the beat, Zero's armour cracking a little more each time. */
Stage.creation = (c, t, C) => {
    const d = C.day || 0, bgs = [null, 'dawn', 'desert', 'forest', 'ice', 'forest', 'city'];
    if (d > 0) { Backdrop.draw(c, bgs[d], { x: t * .5, y: 0, zoom: 1 }, t); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, VW, VH); } else Stage.void(c, t);
    if (d === 2) { c.fillStyle = 'rgba(40,120,170,.75)'; c.fillRect(0, 520 - Math.min(160, C.st2 * .8), VW, 400); }
    if (d === 4) for (const s of Stage.stars) { c.fillStyle = '#fff'; c.globalAlpha = .7; c.fillRect(s.x, s.y * .6, s.s * 1.5, s.s * 1.5); c.globalAlpha = 1; }
    if (d === 5) for (let i = 0; i < 9; i++) { const x = ((t * 6 + i * 160) % (VW + 200)) - 100; Paint.poly(c, [x, 560, x + 40, 540, x + 70, 560, x + 60, 580, x + 10, 580], '#2a2a30'); }
    if (d === 6) for (let i = 0; i < 40; i++) { c.fillStyle = '#ffe9a8'; c.fillRect(80 + (i * 29) % 1120, 520 - (i % 4) * 14, 3, 3); }
};
Stage.unfinished = (c, t, C) => {
    Stage.void(c, t);
    const k = C.shrink || 0, r = 160 * (1 - k) + 6;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; c.drawImage(Glow.get('#b48cff'), 840 - r * 1.6, 380 - r * 1.6, r * 3.2, r * 3.2); c.restore();
    c.strokeStyle = 'rgba(200,180,255,.35)'; c.lineWidth = 2; c.setLineDash([6, 8]); c.beginPath(); c.arc(840, 380, r, 0, TAU); c.stroke(); c.setLineDash([]);
    if (C.fall) { const y = 380 + C.fall * 6, x = 840 - C.fall * 2; Paint.glow(c, x, y, 26, '#b48cff'); Paint.disc(c, x, y, 4, '#f0e8ff'); c.strokeStyle = 'rgba(180,140,255,.5)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40, y - 120); c.stroke(); }
};
Stage.restless = (c, t) => {
    Backdrop.draw(c, 'dawn', { x: 400 + t * .3, y: 0, zoom: 1 }, t);
    c.fillStyle = '#2e2220'; c.fillRect(0, 560, VW, 200);
    for (let i = 0; i < 14; i++) { const x = 60 + i * 88 + Math.sin(t * .01 + i) * 10; c.fillStyle = '#6a5a4a'; c.fillRect(x - 6, 500, 12, 60); Paint.disc(c, x, 492, 8, '#d8c4a8'); c.fillStyle = '#2a1a14'; c.fillRect(x + 1, 489, 3, 2); c.fillStyle = 'rgba(60,40,60,.6)'; c.fillRect(x - 1, 494, 6, 2); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(Glow.get('#ffffff'), 900, -40, 340, 340); c.restore();
};
Stage.plaza = (c, t, C) => {
    Backdrop.draw(c, 'dawn', { x: 800, y: 0, zoom: 1 }, t);
    c.fillStyle = '#2e2220'; c.fillRect(0, 560, VW, 200); c.fillStyle = 'rgba(232,168,96,.6)'; c.fillRect(0, 560, VW, 4);
    c.save(); c.globalAlpha = .7; c.fillStyle = '#140c24'; c.beginPath(); c.ellipse(640, 566, 90, 12, 0, 0, TAU); c.fill(); c.restore();
};
Stage.nightFall = (c, t) => { Backdrop.draw(c, 'dawn', { x: 200, y: 0, zoom: 1 }, t); const k = U.clamp(t / 260, 0, 1); c.fillStyle = `rgba(16,18,48,${k * .78})`; c.fillRect(0, 0, VW, VH); c.fillStyle = '#fff'; for (const s of Stage.stars) { c.globalAlpha = k * (.4 + Math.sin(t * .03 + s.p) * .3); c.fillRect(s.x, s.y * .6, s.s, s.s); } c.globalAlpha = 1; };
Stage.garden = (c, t) => { Backdrop.draw(c, 'garden', { x: t * .3, y: 0, zoom: 1 }, t); c.fillStyle = '#4a3a26'; c.fillRect(0, 560, VW, 200); c.fillStyle = '#4a7a38'; c.fillRect(0, 560, VW, 6); };
Stage.burned = (c, t) => {
    c.fillStyle = '#0a0406'; c.fillRect(0, 0, VW, VH);
    for (let i = 0; i < 1; i++) { const y = ((t * 1.6) % 900) - 120, x = 640 + Math.sin(t * .02) * 160; c.save(); c.translate(x, y); c.rotate(Math.sin(t * .03) * .8); Paint.poly(c, [0, -30, 8, 0, 0, 30, -6, 0], '#e8d8c0'); c.fillStyle = '#ff5a10'; c.fillRect(-4, 16, 8, 14); c.restore(); }
};

/* ------------------------------- cutscenes ------------------------------- */
Object.assign(CUTS, {
    *g2opening(c) {
        Music.play('g2title', 'calm'); c.lb = 1;
        // Scene 1: what happened (Part I, retold in glass)
        const lines = [
            'In the beginning there was the Void, and then the First Light: the stone Aocalyst.',
            'Mankind dug into the earth to find God. They found a Throne, and the Throne required a lamb.',
            'They bound one without a name upon the altar, and they tore that one in two.',
            'Five seals broke. The Day of Judgment fell.',
            'Thirty years later the nameless one woke, with four of the dead: War, Death, Plague and Famine.',
            'It crossed the five lands and met the other half of itself: the Beast, the Endbringer.',
            'It did not judge. It forgave. The two halves became one.',
            'It walked to the Throne, and closed it.'
        ];
        for (let i = 0; i < 8; i++) { c.shot(Stage.glass(i)); c.crack = false; c.fade(0, 24); if (i === 2) G.delay2(c, 90, () => { c.crack = true; Sound.sfx('ice_crack'); }); if (i === 3) { Sound.sfx('trumpet'); c.quake = 4; } yield* c.say('', lines[i], i === 0 ? 230 : 210); c.fade(1, 16); yield 18; }
        // Scene 2: the six days
        c.shot(Stage.creation); c.day = 0; c.fade(0, 30); const z = c.actor('zero', 640, 540, 1, 'idle', { scale: 2 }); yield 50;
        // The cannon that judged the world has nothing left to judge: Zero takes it apart and forges a blade to build with.
        yield* c.say('', 'There was no one left to judge. So it took apart the cannon that had judged the world, and from its light forged a blade to build with.', 250);
        z.rig.custom([[0, { aF: 100, fF: 60, aB: 40, fB: 80 }], [1, { aF: 96, fF: 70, aB: 44, fB: 86 }]], 40, 10, '_forge'); yield 30;
        Sound.sfx('parry'); G.flash = .4; c.flashA = .7; VFX.ring(z.x, z.y - 70, 120, '#bff8ff', 18, 8); G2.bladeZero(z); yield 50;
        z.rig.custom([[0, { aF: 140, fF: 10, aB: -140, fB: -10 }], [1, { aF: 150, fF: 10, aB: -150, fB: -10 }]], 60, 20, '_open'); yield 40;
        const days = ['On the first day, it made light.', 'On the second day, it made the waters.', 'On the third day, it made land and tree.', 'On the fourth day, it made the stars.', 'On the fifth day, it made the beasts.', 'On the sixth day, it made mankind.'];
        for (let i = 0; i < 6; i++) { c.day = i + 1; c.st2 = 0; c.flashA = .5; Sound.sfx('toll', { v: .5 }); z.alpha = 1 - i * .04; for (let k = 0; k < 150; k++) { c.st2++; if (k === 0) c.sub = { name: '', text: tr(days[i]), t: 0, life: 150 }; yield 1; } }
        c.sub = null;
        // Scene 3: and it did not rest
        Music.stop(.8); c.day = 0; c.shot(Stage.unfinished); c.shrink = 0; c.fall = 0; z.x = 520; z.rig.play('kneel', 30); yield 70;
        z.rig.custom([[0, { by: 16, lean: 22, aF: 60, fF: 0 }], [1, { by: 16, lean: 22, aF: 96, fF: 0 }]], 50, 10, '_reach'); yield 60;
        z.rig.custom([[0, { by: 16, lean: 22, aF: 96, fF: 0 }], [1, { by: 16, lean: 26, aF: 30, fF: 40 }]], 30, 4, '_draw'); yield 40;
        z.rig.play('idle', 30); yield 30; z.facing = -1; z.rig.play('run', 10); z.vx = -2.4; yield 50;
        for (let i = 0; i < 80; i++) { c.shrink = i / 80; yield 1; } for (let i = 0; i < 60; i++) { c.fall = i; yield 1; }
        c.clearActors(); yield* c.verse('"And it did not rest."', 'The Second Book of Genesis, 1:7', 240);
        // Scene 4: a world one day short
        Music.play('g2dawn', 'calm'); c.shot(Stage.restless); c.fade(0, 40);
        yield* c.say('', 'The new world had no night. No one truly rested. Where the light was brightest, no one could sleep at all.', 280);
        c.fade(1, 30); yield 34;
        // Scene 5: the voice after the credits
        Music.stop(.5); c.shot(Stage.burned); c.fade(0, 30); yield 30;
        yield* c.say('VESPER', 'This is Vesper. The real one. Line 3 is running. All units, please respond.', 220);
        yield* c.say('VESPER', 'You forgave everything. You made everything. But who gave you leave to leave it unfinished?', 260);
        c.fade(1, 40); yield 44;
        // Scene 6: into the game
        Music.play('g2hum', 'calm'); c.shot(Stage.plaza); c.fade(0, 60);
        const girl = c.actor('nyx', 640, 560, 1, 'kneel', { scale: 2 }); girl.rig.S = nyxStyle(6);
        girl.rig.custom([[0, { by: 22, lean: 80, lF: 90, sF: 120, lB: 70, sB: 120, aF: 40, aB: 30, head: 30 }], [1, { by: 22, lean: 82, lF: 90, sF: 120, lB: 70, sB: 120, aF: 42, aB: 32, head: 32 }]], 90, 0, '_sleep');
        yield 60; yield* c.say('SLEEPLESS CITIZEN', 'She... she is sleeping.', 150);
        girl.rig.play('idle', 50); yield 60; c.lb = 0;
        c.title('PROJECT ZERO II: GENESIS', 'THE SECOND BOOK OF GENESIS', 220, '#e8d8ff'); Sound.sfx('toll'); yield 240;
    },
    *g2meet(c) {
        Music.play('g2dawn', 'calm'); c.lb = 1; c.shot(Stage.plaza); c.fade(0, 30);
        const girl = c.actor('nyx', 640, 560, 1, 'idle', { scale: 2 }); girl.rig.S = nyxStyle(6);
        const crowd = [c.actor('hooded', 380, 560, 1), c.actor('hooded', 470, 560, 1), c.actor('hooded', 840, 560, -1), c.actor('hooded', 930, 560, -1)];
        yield 30;
        yield* c.say('SLEEPLESS CITIZEN', 'She sleeps. How does she sleep? What is she?', 170);
        yield* c.say('SLEEPLESS CITIZEN', 'Take her to Seraphina. The goddess will know what to do with her.', 190);
        crowd.forEach(a => { a.vx = a.x < 640 ? .6 : -.6; a.rig.play('run', 10); }); yield 50; crowd.forEach(a => { a.vx = 0; a.rig.play('idle', 10); });
        Sound.sfx('dash'); const z = c.actor('zero', -60, 560, 1, 'run', { scale: 2 }); G2.bladeZero(z); z.vx = 14; yield 42; z.vx = 0; z.rig.play('idle', 6); c.quake = 4; Sound.sfx('slam');
        yield* c.say('ZERO', 'Step back.', 110);
        yield* c.say('ZERO', 'Hold on to me. Do not let go.', 140);
        z.facing = -1; girl.facing = -1; z.vx = -9; girl.vx = -9; z.rig.play('run', 6); girl.rig.play('run', 6); c.fade(1, 50); yield 56;
        c.clearActors(); c.title('THE FIRST DAY', 'LIGHT: THE CITY OF ETERNAL DAWN', 200, '#ffe9a8'); c.fade(0, 20); yield 210;
    },
    *g2naming(c) {
        Music.play('g2hum', 'calm'); c.lb = 1; c.shot(Stage.plaza); c.fade(0, 40);
        const z = c.actor('zero', 560, 560, 1, 'kneel', { scale: 2 }), g = c.actor('nyx', 700, 560, -1, 'idle', { scale: 2 }); G2.bladeZero(z); g.rig.S = nyxStyle(6); yield 40;
        yield* c.say('ZERO', 'What is your name?', 130);
        g.rig.custom([[0, { head: -14 }], [.5, { head: 14 }], [1, { head: -14 }]], 50, 6, '_shake'); yield 50;
        yield* c.say('ZERO', 'You do not remember either.', 140);
        yield* c.say('ZERO', 'Then I will call you Nyx. It means Night. The only thing missing here.', 220);
        yield* c.say('NYX', '...Nyx.', 100);
        c.fade(1, 40); yield 44;
    },
    *g2SeraSpared(c) {
        Music.play('g2hum', 'calm'); c.shot(Stage.nightFall); c.fade(0, 60); yield 60;
        yield* c.say('', 'And for the first time, the City of Dawn had one moment of night. Thousands lay down in the streets and slept.', 260);
        yield* c.say('SERAPHINA', 'You did not kill me. Why?', 150);
        yield* c.say('NYX', 'Because you were only tired.', 140);
        yield* c.say('SERAPHINA', 'Little one... the night inside you is not hers to give away. Whatever the burned one tells you.', 240);
        yield* c.say('ZERO', 'Come, Nyx. There is a garden. You can sleep there.', 170);
        c.fade(1, 60); yield 66;
    },
    *g2SeraKilled(c) {
        Music.play('g2ash', 'calm'); c.shot(Stage.nightFall); c.fade(0, 60); yield 40;
        yield* c.say('', 'The sun fell like a dying coal. The city slept, but it slept afraid.', 220);
        yield* c.say('NYX', 'Uncle... is she gone?', 140);
        yield* c.say('ZERO', 'Yes. Do not look.', 120);
        yield* c.say('VESPER', 'You see? Even his mercy has a price. And always, someone else pays it.', 220);
        c.fade(1, 60); yield 66;
    },
    *g2garden(c) {
        Music.play('g2garden', 'calm'); c.shot(Stage.garden); c.fade(0, 60);
        const z = c.actor('zero', 520, 560, 1), g = c.actor('nyx', 640, 560, -1); G2.bladeZero(z); g.rig.S = nyxStyle(6); yield 40;
        yield* c.say('NYX', 'Is this your garden?', 120);
        yield* c.say('ZERO', 'I made it. Between the days. I have never sat down in it.', 190);
        yield* c.say('ZERO', 'Seven gates. Seven days. Every one of them is broken, and I broke them.', 210);
        z.rig.play('kneel', 20); yield 30; Sound.sfx('hurt', { v: .3, p: .7 }); VFX.add(z.x, z.y - 60, 0, -1, '#777', 40, 12, 3, 0);
        yield* c.say('NYX', 'Uncle?', 80);
        yield* c.say('ZERO', 'It is nothing. Sleep, Nyx. I will keep watch.', 170);
        c.fade(1, 50); yield 56;
    },
    *g2after1(c) {
        Music.play('g2ash', 'calm'); c.shot(Stage.burned); c.fade(0, 60); yield 30;
        yield* c.say('VESPER', 'The first day has its night. Do you think that is enough, child? Six days remain. And the seventh has never been made.', 270);
        c.shot(Stage.garden); Music.play('g2garden', 'calm');
        yield* c.say('NYX', 'Who was that?', 110);
        yield* c.say('ZERO', 'Someone I have not thanked. Go to sleep.', 160);
        c.fade(1, 60); yield 66;
    }
});

G2.bladeZero = a => { a.rig.S = Object.assign({}, a.rig.S, { weaponF: Gear.aocalyst, weaponLen: 54 }); return a; };
// a cut scene never plays under a menu (the Gate of Seven Days stayed open over a day's opening)
G2.cut = function (id, after) { if (UI.cur) UI.hide(); Input.held = {}; Game.state = 'cine'; Cine.play(CUTS[id], () => { Game.state = 'play'; Music.play(G.level.theme.music, 'calm'); if (after) after(); }); };
(function () { const cp = Cine.play.bind(Cine); Cine.play = function (...a) { if (UI.cur && UI.cur !== 'credits') UI.hide(); return cp(...a); }; })();
G2.enterGarden = function () {
    const g = Save.data.g2;
    if (G2.grantPart1Bonus()) G.delay(90, () => { G.say('ZERO', 'This was in my pocket. A ticket from Line 3. Keep it, Nyx.', 200); G.toast(tr('Relic') + ': ' + tr(RELICS.ticket3.name), '#ffdd33'); });
    if (!g.intro) { g.intro = true; Save.write(); G2.cut('g2garden', () => { if (Save.data.cleared.seraphina && !g.seen.after1) { g.seen.after1 = 1; Save.write(); G2.cut('g2after1'); } }); }
    else if (Save.data.cleared.seraphina && !g.seen.after1) { g.seen.after1 = 1; Save.write(); G2.cut('g2after1'); }
};
(function () {
    Game.newGame = function (diffId) {
        Save.data = Save.fresh(diffId); this.diff = DIFFS[diffId]; Save.run = { damageDealt: 0, damageTaken: 0, kills: 0, time: 0, deaths: 0 }; Save.write();
        this.playCut('g2opening', () => this.playCut('g2meet', () => this.deploy('dawn')));
    };
    // Credits name the authors of Part II.
    const cr = UI.screens.credits;
    UI.screens.credits = function (a) {
        this.back = a.ending ? null : () => this.act('creditsdone');
        const roles = [['PROJECT ZERO II: GENESIS', 'THE SECOND BOOK OF GENESIS'], ['Created by', 'VoPhatDat + Claude'], ['Final boss theme', '"GameChanger" boss theme by Photon Arts and Carameii, used with their permission for non-profit projects'], ['', 'youtube.com/watch?v=K_9j1k3jH-Q'], ['Story, direction and design', 'VoPhatDat'], ['Code, art, music and sound', 'Claude, generated procedurally in the browser'], ['Built on', 'PROJECT ZERO: AOCALYST'], ['Engine', 'HTML5 Canvas and Web Audio, no external assets'], ['NYX', 'Night'], ['ZERO', 'The one who did not rest'], ['Thank you for playing', 'Sleep well.']];
        return `<div class="credits"><div class="roll" id="roll">${roles.map(r => `<h3>${tr(r[0])}</h3><p>${tr(r[1])}</p>`).join('')}</div><button data-do="creditsdone">${a.ending ? 'CONTINUE' : 'BACK'}</button></div>`;
    };
})();
