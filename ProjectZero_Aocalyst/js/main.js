'use strict';
/* Boot. The `?debug` hooks expose game state for tools/ and the browser console only. */
if (!HEADLESS) {
    window.addEventListener('error', e => {
        const b = document.getElementById('loading');
        console.error('Unhandled error', e.message, e.filename, e.lineno);
        if (Game.state === 'loading' && b) { b.style.display = 'flex'; b.querySelector('b').textContent = 'FAILED TO LOAD: ' + e.message; }
    });
    Game.init();
    setInterval(() => { if (UI.cur === 'select') UI.previewTick(); }, 16);
    if (location.search.includes('debug')) window.PZ = { G, Game, Save, UI, Settings, Sound, Music, Cine, LEVELS, BOSSES, CHARS, Input, Combat };
}
