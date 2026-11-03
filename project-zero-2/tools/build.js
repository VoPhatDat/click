// Build: inline every src/*.js into one offline HTML file.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Project Zero II: Genesis</title>
<style>
html,body{margin:0;height:100%;background:#0a0806;overflow:hidden}
body{display:flex;align-items:center;justify-content:center}
canvas{display:block;image-rendering:auto;outline:none}
</style></head><body>
<canvas id="game" tabindex="0"></canvas>
<script>
${js.replace(/<\/script/gi, '<\\/script')}
PZ.Game.boot();
</script></body></html>`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'ProjectZero2_Genesis.html'), html);
// dev index that loads sources directly
fs.writeFileSync(path.join(root, 'index.html'), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Project Zero II: Genesis (dev)</title><style>html,body{margin:0;height:100%;background:#0a0806;overflow:hidden}body{display:flex;align-items:center;justify-content:center}</style></head><body><canvas id="game" tabindex="0"></canvas>${files.map(f => `<script src="src/${f}"></script>`).join('')}<script>PZ.Game.boot()</script></body></html>`);
console.log('built', (html.length / 1024).toFixed(0) + ' KB', files.length, 'files');
