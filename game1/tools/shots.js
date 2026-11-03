// Visual check: drive the real build in Chromium and capture screenshots of each area.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', 'ProjectZero2_Genesis.html'));
  await pg.waitForTimeout(500);
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(2200);
  await pg.screenshot({ path: 'shots/01_title.png' });
  const ev = s => pg.evaluate(s);
  await ev(`PZ.Game.slot=2;PZ.Game.save=PZ.newSave();PZ.Game.menu=null;PZ.Game.playScene('prologue')`); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: 'shots/02_glass.png' });
  await ev(`for(let i=0;i<8;i++)PZ.Game.nextStep()`); await pg.waitForTimeout(1800); await pg.screenshot({ path: 'shots/03_book.png' });
  await ev(`PZ.Game.nextStep()`); await pg.waitForTimeout(900); await pg.screenshot({ path: 'shots/04_vesper.png' });
  await ev(`PZ.Game.scene=null;PZ.Game.enterHub(false)`); await pg.waitForTimeout(300);
  await ev(`PZ.Game.w.player.x=560`); await pg.waitForTimeout(1200); await pg.screenshot({ path: 'shots/05_hub.png' });
  await ev(`PZ.Game.enterLevel('ch1');PZ.Game.w.triggers.forEach(t=>{if(t.x<1500)t.done=true});PZ.Game.w.player.x=700`); await pg.keyboard.down('KeyD'); await pg.waitForTimeout(1300); await pg.keyboard.press('KeyJ'); await pg.waitForTimeout(120); await pg.keyboard.press('KeyJ'); await pg.waitForTimeout(150);
  await pg.screenshot({ path: 'shots/06_ch1.png' }); await pg.keyboard.up('KeyD');
  await ev(`PZ.Game.w.player.x=4300;PZ.Game.w.player.y=300;PZ.Game.w.triggers.forEach(t=>{if(t.x<4600)t.done=true})`); await pg.waitForTimeout(1500); await pg.screenshot({ path: 'shots/07_ch1_shadows.png' });
  await ev(`PZ.Game.enterLevel('ch1_boss')`); await pg.waitForTimeout(5200); await pg.screenshot({ path: 'shots/08_boss.png' });
  await pg.waitForTimeout(3000); await pg.screenshot({ path: 'shots/09_boss2.png' });
  await ev(`PZ.Game.state='scene';PZ.Game.scene={steps:PZ.SCENES.ch1_preboss,i:2,t:1,prevState:'play'}`); await pg.waitForTimeout(700); await pg.screenshot({ path: 'shots/10_portrait.png' });
  console.log('errors:', errs.length ? errs.slice(0, 10).join('\n') : 'none');
  await b.close();
})();
