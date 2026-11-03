'use strict';
/* Inlines the stylesheet and scripts into dist/ProjectZero_Aocalyst.html, matching the
   original game's single-file delivery. Everything is plain text, so no bundler is needed. */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => `<style>\n${fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8')}\n</style>`);
html = html.replace(/<script src="(js\/[a-z_]+\.js)"><\/script>\n?/g, (m, f) => `<script>\n${fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<\/script/g, '<\/script')}\n</script>\n`);
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'ProjectZero_Aocalyst.html');
fs.writeFileSync(out, html);
console.log('built', out, (html.length / 1024).toFixed(0) + ' KB');
if (/<script src=|<link rel="stylesheet"/.test(html)) { console.error('Build failed: external references remain in the single-file output.'); process.exit(1); }
