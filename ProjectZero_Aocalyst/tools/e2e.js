'use strict';
/* Plays the whole campaign through the real flow: every boss, reward, unlock, stage
   transition, the Trinity door, the ending, then a save/load round trip. */
const { load } = require('./harness');
const X = load(), { G, Game, Save, UI, Input, Cine, BOSSES, REGIONS, Store, LORE } = X;
const log = (...a) => console.log(...a); let fails = 0;
const must = (c, m) => { if (c) log('ok   ', m); else { fails++; log('FAIL ', m); } };
Game.deploy = (id, cp) => Game.loadLevel(id, cp);
let screen = null; UI.show = (n, a) => { screen = { n, a }; }; UI.hide = () => { screen = null; };
const openRegion = i => { const D = Save.data; if (i === 0) return true; const prev = REGIONS[i - 1]; return !!D.cleared[prev.level]; };
const finishCut = () => { let n = 0; while (Cine.active && n++ < 40000) Cine.update(); };

function fight() {
    const A = G.arena, P = G.player; G.enemies = []; P.x = A.trigger + 60; P.y = A.y - 2; P.vy = 0; P.grounded = true;
    P.power *= 40; P.inv = 1e9; Input.simulated = {}; let t = 0, killed = false;
    G.startBoss();
    while (t++ < 40000 && (G.boss || !killed) && Game.state === 'play') {
        const b = G.boss;
        if (b && !b.intro && !b.untargetable && t % 10 === 0) X.Combat.hit(P, b, { dmg: 1, hit: 'hit_l', ult: true });
        if (b && b.dead) killed = true;
        G.tick(); Input.endTick();
    }
    Input.simulated = null; return t;
}
Save.data = Save.fresh('normal'); Game.diff = X.Game.diff; Store.write(Store.KEY, '');
Game.newGame('normal'); finishCut(); must(screen && screen.n === 'select', 'opening leads to character select');
must(Save.data.activeChar === 'zero' && Save.data.unlocked.includes('zero'), 'original hero Zero playable from the start'); Game.loadLevel('city'); must(G.level.id === 'city' && Game.state === 'play', 'city loads');
const origRes = Game.onBossDefeated.bind(Game); Game.onBossDefeated = def => { origRes(def); Game.state = 'menu'; screen = { n: 'results', a: { def } }; };
const order = [['city', 'atlas', 'forest'], ['forest', 'sylvaris', 'desert'], ['desert', 'qareth', 'ice'], ['ice', 'nadir', 'volcano1']];
for (const [lvl, boss, next] of order) {
    if (lvl === 'ice') { const c = G.level.objs.find(o => o.kind === 'cryo'), gate = G.level.dyn.find(d => d.id === 'vaultgate'); must(gate && !gate.open, 'vault exit starts sealed'); G.nearObj = c; G.interact(); finishCut(); must(Save.data.flags.zeroAwake, 'Zero awakened at the cryo vault'); must(gate.open, 'waking Zero opens the vault exit'); must(Game.state === 'play', 'returns to gameplay after cutscene'); }
    const t = fight(); must(Save.data.cleared[lvl], `${boss} defeated in ${(t / 60) | 0}s of game time, ${lvl} cleared`);
    Game.state = 'menu'; Game.afterResults(screen.a.def); finishCut();
    must(screen && screen.n === 'hub', `hub shown after ${lvl}`);
    const i = REGIONS.findIndex(r => r.level === next); must(openRegion(i), `${next} unlocked`);
    Game.loadLevel(next);
}
must(Save.data.shards.g && Save.data.shards.r && Save.data.shards.b, 'all three Core shards collected');
const ex = G.level.objs.find(o => o.kind === 'exit' && !o.hidden); G.nearObj = ex; G.interact(); must(G.level.id === 'volcano2', 'Forge door leads to stage II');
fight(); Game.state = 'menu'; Game.afterResults(screen.a.def); must(G.level.id === 'volcano3', 'Vulkaris leads to stage III');
const door = G.level.objs.find(o => o.kind === 'door'), tg = G.level.dyn.find(d => d.id === 'trinity'); G.nearObj = door; G.interact(); must(tg.open, 'Trinity door opens with three shards');
let ending = false; const oEnd = Game.onFinalBossDefeated.bind(Game); Game.onFinalBossDefeated = () => { oEnd(); ending = true; };
const t = fight(); must(ending, `Endbringer defeated through all phases (${(t / 60) | 0}s)`); finishCut();
must(screen && screen.n === 'credits', 'ending rolls into credits'); must(Save.data.gameDone, 'completion recorded');
const before = JSON.stringify(Save.data); Save.write(); Save.data = null; must(Save.load() && JSON.stringify(Save.data) === before, 'save and load round trip is lossless');
Store.write(Store.KEY, '{corrupt'); Save.data = null; must(!Save.load(), 'corrupt save is rejected without crashing');
log(fails ? fails + ' FAILED' : '\nCAMPAIGN COMPLETED'); process.exit(fails ? 1 : 0);
