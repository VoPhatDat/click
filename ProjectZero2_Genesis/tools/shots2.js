// Captures screenshots of the real single-file build in Chromium.
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'ProjectZero2_Genesis.html') + '?debug'); await pg.waitForTimeout(1500);
  const ev = s => pg.evaluate(s), shot = async (f, w = 300) => { await pg.waitForTimeout(w); await pg.screenshot({ path: 'shots/' + f }); };
  await shot('01_title.png');
  await ev(`Save.data=Save.fresh('normal');UI.hide();Game.state='cine';Cine.play(CUTS.g2opening,()=>{})`);
  for (const [n, f] of [[420, '02_glass.png'], [1100, '03_creation.png'], [1500, '04_unfinished.png'], [900, '05_vesper.png'], [700, '06_plaza.png']]) { await ev(`for(let i=0;i<${n};i++)Cine.update()`); await shot(f); }
  const lv = async (id, x, y, n, file, extra) => { await ev(`Cine.active=false;UI.hide();Save.data.activeChar='nyx';Save.data.g2.named=true;Game.loadLevel('${id}');G.titleCard=null;G.player.x=${x}*32;G.player.y=${y}*32;G.player.safe={x:G.player.x,y:G.player.y};if(G.ally){G.ally.x=G.player.x-50;G.ally.y=G.player.y;}Game.state='play';G.lines=[];${extra || ''}`); await shot(file, n); };
  await lv('dawn', 12, 30, 1800, '07_dawn_nyx_zero.png');
  await lv('dawn', 60, 30, 1200, '08_dawn_shade.png', `G.player.cds.s1=0;Input.simulated={'!skill1':true};setTimeout(()=>Input.simulated=null,80)`);
  await lv('cathedral', 20, 26, 7000, '09_seraphina.png', 'G.player.inv=99999;');
  await ev(`const t=G.level.objs.find(o=>o.g2==='tower');G2.raiseTower(t)`); await shot('10_tower_shade.png', 900);
  await ev(`Game.state='menu';UI.show('g2choice')`); await shot('11_choice.png');
  await ev(`UI.hide();`); await lv('garden', 26, 28, 1500, '12_garden.png');
  await ev(`Settings.lang='en';UI.show('title')`); await shot('13_title_en.png'); await ev(`Settings.lang='vi'`);
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors'); await b.close();
})();
