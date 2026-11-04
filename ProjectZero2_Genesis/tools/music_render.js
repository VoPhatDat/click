'use strict';
/**
 * Renders tracks offline in Chromium (OfflineAudioContext) so they can be listened to and measured.
 *   node tools/music_render.js [ids...] [--sec=40] [--state=calm|combat|boss|critical] [--phase=n] [--out=dir]
 * Writes <out>/<id>.wav (converted to .mp3 when ffmpeg exists) and <out>/levels.json with RMS, peak and
 * clipping per track. The music has still only been checked by numbers until a person listens to it.
 */
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const ids = args.filter(a => !a.startsWith('--')), SEC = +(opt('sec') || 40), OUT = path.resolve(opt('out') || path.join(__dirname, '..', 'shots', 'music'));
fs.mkdirSync(OUT, { recursive: true });
let ff = false; try { execSync('ffmpeg -version', { stdio: 'ignore' }); ff = true; } catch (e) { }
(async () => {
    const b = await chromium.launch(), pg = await b.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto('file://' + path.join(__dirname, '..', 'index.html')); await pg.waitForTimeout(800);
    const list = ids.length ? ids : await pg.evaluate(() => Object.keys(TRACKS).filter(k => TRACKS[k].meta));
    const levels = fs.existsSync(path.join(OUT, 'levels.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'levels.json'), 'utf8')) : {};
    for (const id of list) {
        const spec = id.split(':'), tid = spec[0], state = spec[1] || opt('state') || (TRACKS_STATE(tid)), phase = +(spec[2] || opt('phase') || 0);
        const res = await pg.evaluate(async ({ tid, state, phase, SEC }) => {
            const sr = 44100, T = TRACKS[tid]; if (!T) return { err: 'no track ' + tid };
            // Fresh offline audio graph built by the game's own Sound.init.
            const RealAC = window.AudioContext; window.AudioContext = function () { return new OfflineAudioContext(2, sr * (SEC + 3), sr); };
            Sound.ctx = null; Sound.ok = false; Sound.buses = {}; Music.stems = {}; Music.waves = {}; Music.timer && clearInterval(Music.timer); Music.timer = null;
            Sound.init(); window.AudioContext = RealAC; const c = Sound.ctx; if (!c) return { err: 'no ctx' };
            Settings.music = 1; Settings.master = 1; Sound.applyVolumes && Sound.applyVolumes();
            Music.ensureStems(); Music.state = state; Music.track = T; Music.trackId = tid; Music.step = 0; Music.lastV = null; Music.pendingId = null;
            if (Music.delay) Music.delay.delayTime.value = 60 / T.bpm * .75;
            G.boss = phase >= 0 && T.meta && T.meta.boss ? { def: { id: T.meta.boss }, phase, dead: false } : null; G.g2music = { phase };
            Music.applyMix(.05);
            const sd = 60 / T.bpm / 4; let t = .1, s = 0;
            while (t < SEC) { Music.playStep(s, t, sd); t += sd; s++; }
            const buf = await c.startRendering();
            const L = buf.getChannelData(0), R = buf.getChannelData(1), n = Math.min(L.length, sr * SEC);
            let sum = 0, peak = 0, clip = 0; for (let i = sr; i < n; i++) { const a = Math.abs(L[i]), bb = Math.abs(R[i]); sum += L[i] * L[i] + R[i] * R[i]; peak = Math.max(peak, a, bb); if (a > .999 || bb > .999) clip++; }
            const rms = Math.sqrt(sum / ((n - sr) * 2));
            // 16-bit WAV, base64 for the trip back to Node.
            const wav = new DataView(new ArrayBuffer(44 + n * 4)), w = (o, s) => { for (let i = 0; i < s.length; i++) wav.setUint8(o + i, s.charCodeAt(i)); };
            w(0, 'RIFF'); wav.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 2, true); wav.setUint32(24, sr, true); wav.setUint32(28, sr * 4, true); wav.setUint16(32, 4, true); wav.setUint16(34, 16, true); w(36, 'data'); wav.setUint32(40, n * 4, true);
            for (let i = 0; i < n; i++) { wav.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); wav.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
            const u8 = new Uint8Array(wav.buffer); let bin = ''; for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
            return { rmsDb: 20 * Math.log10(rms + 1e-9), peakDb: 20 * Math.log10(peak + 1e-9), clip, b64: btoa(bin) };
        }, { tid, state, phase, SEC });
        if (res.err) { console.log('skip', id, res.err); continue; }
        const name = id.replace(/:/g, '_'), wavP = path.join(OUT, name + '.wav'); fs.writeFileSync(wavP, Buffer.from(res.b64, 'base64'));
        if (ff) { execSync(`ffmpeg -y -loglevel error -i "${wavP}" -codec:a libmp3lame -q:a 4 "${path.join(OUT, name + '.mp3')}"`); fs.unlinkSync(wavP); }
        levels[id] = { rmsDb: +res.rmsDb.toFixed(2), peakDb: +res.peakDb.toFixed(2), clip: res.clip, state, phase };
        console.log(`${id.padEnd(22)} rms ${res.rmsDb.toFixed(1)} dB  peak ${res.peakDb.toFixed(1)} dB  clipped samples ${res.clip}`);
    }
    fs.writeFileSync(path.join(OUT, 'levels.json'), JSON.stringify(levels, null, 1));
    // --normalize: move every track toward the target loudness by scaling its gain (applied in Music.applyMix).
    if (args.includes('--normalize')) {
        const GF = path.join(__dirname, '..', 'js', 'g2_music_levels.js'), prev = {};
        if (fs.existsSync(GF)) { const m = fs.readFileSync(GF, 'utf8').match(/G2_GAINS = (\{[\s\S]*?\});/); if (m) Object.assign(prev, JSON.parse(m[1])); }
        const meta = await (async () => { const b2 = await chromium.launch(), p2 = await b2.newPage(); await p2.goto('file://' + path.join(__dirname, '..', 'index.html')); const r = await p2.evaluate(() => { const o = {}; for (const k in TRACKS) if (TRACKS[k].meta) o[k] = { quiet: !!TRACKS[k].meta.quiet, gain: TRACKS[k].gain || 1 }; return o; }); await b2.close(); return r; })();
        for (const id of Object.keys(levels)) { const tid = id.split(':')[0]; if (!meta[tid] || id.includes(':')) continue; const target = meta[tid].quiet ? -25 : -18, g = (prev[tid] || 1) * Math.pow(10, (target - levels[id].rmsDb) / 20); prev[tid] = +U_clamp(g, .12, 4).toFixed(3); }
        fs.writeFileSync(GF, "'use strict';\n/* Per-track gain, measured offline by tools/music_render.js --normalize. */\nconst G2_GAINS = " + JSON.stringify(prev, null, 1) + ";\nfor (const k in G2_GAINS) if (TRACKS[k]) TRACKS[k].gain = G2_GAINS[k];\n");
        console.log('wrote', GF);
    }
    if (errs.length) console.log(errs.slice(0, 5).join('\n'));
    await b.close();
})();
function U_clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function TRACKS_STATE(id) { return /boss|knight|sera|mareva|garden_?er|astraea|lilith|archon|architect|vesper|act1|act3|whale|scarecrow|clock|antelope|preacher|shadow/.test(id) && !/garden$/.test(id) ? 'boss' : 'calm'; }
