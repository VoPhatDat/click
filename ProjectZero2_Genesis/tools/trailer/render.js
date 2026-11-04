/* TRAILER RENDER: node tools/trailer/render.js <music> <out.mp4> [--preview] [--from=s --to=s]
 * Loads the built game, injects the director, renders every frame at 1920x1080 and pipes it to ffmpeg
 * with the music. --preview writes one still per shot instead (a contact sheet to check the cut). */
const { chromium } = require('playwright'), path = require('path'), fs = require('fs'), { spawn } = require('child_process');
const args = process.argv.slice(2), music = args[0], out = args[1], preview = args.includes('--preview'), opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? +a.split('=')[1] : null; };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = []; pg.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') logs.push(m.text().slice(0, 160)); }); pg.on('pageerror', e => logs.push('pageerror ' + e.message));
  await pg.goto('file://' + path.join(__dirname, '..', '..', 'dist', 'ProjectZero2_Genesis.html')); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { Save.data = Save.fresh('normal'); UI.hide(); Settings.renderScale = 1.5; Game.applyVideo(); });
  await pg.addScriptTag({ path: path.join(__dirname, 'director.js') }); await pg.evaluate(() => TR.prep());
  const total = await pg.evaluate(() => TR.frames), fps = 30, f0 = Math.round((opt('from') || 0) * fps), f1 = Math.min(total, Math.round((opt('to') || 1e9) * fps));
  if (preview) {
    const shots = await pg.evaluate(() => TR.SHOTS.map(s => [s.t0, s.t1]));
    for (let i = 0; i < shots.length; i++) { const [a, z] = shots[i], mid = a + (z - a) * .6; for (let f = Math.round(a * fps); f <= Math.round(mid * fps); f++) await pg.evaluate(f => TR.render(f), f);
      const d = await pg.evaluate(() => Game.canvas.toDataURL('image/jpeg', .85)); fs.writeFileSync(path.join(out, 'shot_' + String(i).padStart(2, '0') + '_' + a.toFixed(2) + '.jpg'), Buffer.from(d.split(',')[1], 'base64')); process.stdout.write('.'); }
    console.log('\n' + logs.slice(0, 8).join('\n')); await b.close(); return;
  }
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', ...(music ? ['-ss', String(f0 / fps), '-i', music] : []), '-map', '0:v', ...(music ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await pg.evaluate(f => TR.render(f), f); const d = await pg.evaluate(() => Game.canvas.toDataURL('image/jpeg', .93));
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`frame ${f}/${f1} (${((Date.now() - t0) / 1000) | 0}s)\n`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('done', out, logs.slice(0, 8).join('\n')); await b.close();
})();
