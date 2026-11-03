# Project Zero: Aocalyst, development log

## Audit of `game_backup.html` (kept unchanged)

Single-file HTML5 Canvas game, about 2,400 lines of vanilla JS, no assets. One side-on arena, one
gunner, one two-form boss. Identity worth keeping: neon cyan and blood red palette, the Courier
look, double jump, 8-way dash, three override skills, telegraphed red warning zones, the Endbringer
and its True Void form, RGB Core shards powering Trinity Obliteration, big cinematic title cards.

Bugs confirmed by running or reading it:

| # | Problem | Fix in the new build |
|---|---------|----------------------|
| 1 | Player could not die: HP reached -99,899 with no game over | Death, game over, retry from beacon |
| 2 | Boss took about 53 minutes of sustained fire to kill | HP rebalanced, fights run 1 to 3 minutes |
| 3 | Logic ran per display frame, so 144 Hz played 2.4x faster | Fixed 60 Hz timestep |
| 4 | Window resize moved the floor and arena | Fixed 1280x720 virtual screen, letterboxed |
| 5 | Leftward dash telegraph could never hit (negative rect width) | Rects normalised in `Combat.warn` |
| 6 | Skills 17 and 18 hit unconditionally, regardless of position | Now positional telegraphs |
| 7 | Shield made the player immune to all warning zones | Damage goes through the shield |
| 8 | Skill 7 telegraphed and did nothing | Replaced by real falling strikes |
| 9 | `frameCount` froze in cinematics, so `%`-based shakes stuck | Cinematics run on their own clock |
| 10 | Canvas given a CSS variable as stroke colour | Real colours |
| 11 | Heavy `shadowBlur` and per-frame DOM writes | Pre-rendered glow sprites, canvas HUD |
| 12 | Keys stuck when the window lost focus | Cleared on blur |

## Architecture

Vanilla JS with classic scripts, so `index.html` opens by double click like the original, and
`tools/build.js` produces a one-file `dist/ProjectZero_Aocalyst.html`.

| File | Responsibility |
|------|----------------|
| `js/core.js` | Constants, utilities, settings, storage, input, generator script runner |
| `js/lang_vi.js` | Vietnamese text keyed by English source; `tools/i18n.js` reports gaps |
| `js/audio.js` | WebAudio mix buses, 58 synthesised SFX, ambience |
| `js/music.js` | Composed score: wavetables, voice leading, stems, sidechain, echo |
| `js/rig.js` | Skeletal animation with crossfades, procedural locomotion, verlet capes |
| `js/world.js` | Tile grid, slopes, dynamic solids, shared physics |
| `js/vfx.js` | Particle pool, effects, floating text, low-resolution light map |
| `js/chars.js` | Five operators: frame data, skills, ultimates, upgrades, relics |
| `js/player.js` | Player state machine, damage intake, animation selection |
| `js/combat.js` | Hit resolution, elements, projectiles, telegraphs, fields, hazards |
| `js/enemy.js` | Data-driven AI and 30 enemy types |
| `js/boss.js` | Six bosses scripted as interruptible generators |
| `js/looks.js` | Art pass: hero gear, enemy outfits, NPC costumes, creature bodies, boss detail |
| `js/levels.js` | Tile builders for seven stages across five regions |
| `js/render.js` | Parallax backdrops, chunked terrain, set dressing, weather, post effects |
| `js/story.js` | Lore, dialogue, cutscene engine, all cinematics |
| `js/game.js` | Save data, world state, level lifecycle, main loop, campaign flow |
| `js/ui.js` | Canvas HUD and DOM menus |

## Phases

1. **Audit**: done, findings above.
2. **Design**: done, see `docs/GDD.md`.
3. **Core gameplay**: done. Five operators, combat, AI, progression.
4. **World**: done. Seven stages, Volcanic Core gets three of them.
5. **Art, animation, VFX**: done, all procedural.
6. **Audio**: done, all synthesised.
7. **UI and story**: done. Menus, HUD, opening, ending, credits, post-credits.
8. **Testing and polish**: automated checks below. Human playtesting is still needed.

## Tests

| Command | What it proves |
|---------|----------------|
| `node tools/smoke.js` | Every stage with every operator runs and draws; every cutscene finishes |
| `node tools/reach.js [level]` | Each stage is completable by the slowest operator, through the real collision code, opening gates only after their switches are reached. Also finds unreachable pickups. Writes `tools/out_<level>.png` |
| `node tools/bossbot.js [ops]` | A bot fights all six bosses through every phase; reports duration and damage |
| `node tools/e2e.js` | The whole campaign end to end, including unlocks, Trinity door, ending, save/load, corrupt save |
| `tools/soak.js` in the browser | Real canvas and real audio graph across every stage, boss phase, SFX and track |

Defects these tests caught during development: boss arena trigger compared tiles with pixels;
platforms in the desert shaft wiped by a later carve; forest crown ladder out of jump range; a wall
tile behind the eruption gate; hidden rooms with stone behind breakable walls; a surface road that
skipped the entire subway; melee operators unable to reach Nadir and Qareth; volcano far too dark.

## Known limits

- Balance comes from bot runs, not from human players. Tune `DIFFS` in `js/game.js` and boss `hp`.
- Moving platforms are approximated as static copies in `reach.js`; movers themselves are time-pure
  and were checked by eye only.
- Music and sound were verified to play without errors, but nobody has judged them by ear yet.
- There is no recorded voice acting: story is delivered as subtitles with radio blips.
- Vietnamese is the default language; English remains selectable.

## Reported bugs

- **Zero inside the sand (player report).** Wind, currents and gravity wells wrote to `x` directly, so a
  storm dragged the player through walls, even underground. All forces now go through `Player.push`,
  which uses collision. Tiles with a back wall count as cover, and a body inside rock is returned to
  its last safe footing after 12 ticks.

## The last battle (`js/finale.js`)

Four phases and a finisher: the False Seraph (the Beast wears the Throne's shape from the opening);
the Lake of Fire (floor falls, echoes of all five seal-bearers return with their own attacks); the
True Void (the sky is one eye that tracks the player, plus the Scales, Seven Trumpets, Eyes and Book);
the Wrath of Zero (a fast duel against Zero's mirror on a white stage, with the main theme sung over
war drums); and Last Light, a beam struggle the player mashes through as the Riders and shards join.
One Rider intercedes per phase when the player falls below 30% HP.
