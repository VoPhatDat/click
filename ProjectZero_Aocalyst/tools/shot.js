/* Paste into the debug console: loads a level at a position, simulates, renders one frame. */
window.shot = (lvl, ch, x, y, ticks = 90, extra) => {
    const { G, Game, Save } = PZ;
    if (!Save.data) Save.data = Save.fresh('normal');
    Save.data.unlocked = ['rook', 'sable', 'mirae', 'ysolde', 'zero']; Save.data.shards = { r: true, g: true, b: true }; Save.data.activeChar = ch;
    Game.loadLevel(lvl); G.player.inv = 9999;
    if (x !== undefined) { G.player.x = x * 32; G.player.y = y * 32; G.player.vy = 0; G.player.safe = { x: G.player.x, y: G.player.y }; }
    G.titleCard = null; G.tut = null;
    if (extra) extra(G);
    for (let i = 0; i < ticks; i++) G.tick();
    Game.state = 'pause'; Game.render(); document.getElementById('screens').style.display = 'none';
    return { x: G.player.x, y: G.player.y, grounded: G.player.grounded, enemies: G.enemies.length };
};
