'use strict';
/* Loads the real game scripts into a Node VM with stubbed DOM and null canvases. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const ORDER = ['core', 'lang_vi', 'audio', 'music', 'rig', 'world', 'vfx', 'chars', 'combat', 'player', 'enemy', 'boss', 'looks', 'finale', 'levels', 'render', 'story', 'game', 'ui', 'g2_core', 'g2_lang', 'g2_chars', 'g2_enemies', 'g2_bosses', 'g2_nyx', 'g2_levels', 'g2_story', 'g2_music', 'g2_ui'];

function load() {
    const ctx = vm.createContext({ console, Math, JSON, Date, performance: { now: () => Date.now() }, setTimeout: fn => fn && 0, clearTimeout() { }, setInterval: () => 0, clearInterval() { }, Set, Map, Float32Array, Uint8Array, Array, Object, Proxy, isNaN, parseInt, parseFloat, String, Number, Infinity, NaN });
    let src = ORDER.map(f => fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8')).join('\n;\n');
    src += `
    ;var __x = { G, Game, Save, UI, Settings, Sound, Music, Cine, CUTS, LEVELS, LEVEL_ORDER, BOSSES, CHARS, CHAR_ORDER, ENEMIES, Input, Combat, Phys, T, TILE, GRAV, isSlope, slopeH, Scene, Script, Rig, RELICS, LORE, NPCS, HUD, U, Level, Dyn, Terrain, Player, Enemy, makeNullCtx, VW, VH, Weather, Stage, REGIONS, ACHIEVEMENTS, Hazards, Store, TRACKS, U, BOSSES: BOSSES, G2Night, NYX_AGES, G2, B_SERA, B_KNIGHT, Shadow, WEAPONS2, W_TIERS, Boss, Proj, Atmos: typeof Atmos === 'undefined' ? null : Atmos };`;
    vm.runInContext(src, ctx, { filename: 'game.bundle.js' });
    const X = ctx.__x;
    X.UI.hide = X.UI.show = X.UI.showLoading = X.UI.hideLoading = () => { };
    X.UI.root = {}; X.Game.init();
    X.Game.ctx = X.makeNullCtx(); X.Game.canvas = { width: 1280, height: 720 };
    return X;
}
module.exports = { load, ROOT };
