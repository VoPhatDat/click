# Project Zero: Aocalyst

Tiếng Việt là ngôn ngữ mặc định, đổi sang English trong Cài đặt > Hình ảnh.

A complete 2D action-adventure grown from `game_backup.html`, which is kept unchanged.
No installs or assets: art, music and sound are all generated in the browser.

## Play

Open `dist/ProjectZero_Aocalyst.html` in Chrome, Edge or Firefox, or open `index.html` for the
multi-file version. Click once if you hear nothing, because browsers wait for a first input.

| Action | Keys | Alternative |
|--------|------|-------------|
| Move, aim | A D W S | Arrow keys |
| Jump, double jump | Space | C |
| Dodge | Shift | |
| Attack | K | J |
| Heavy, guard, change element | L | |
| Skills | 1, 2 | U, I |
| Ultimate | 3 | O |
| Interact | E | |
| Pause | Esc or P | |

All keys can be rebound in Settings. Gamepads work automatically.

## Develop

```bash
node tools/build.js
```

```bash
node tools/smoke.js
```

```bash
node tools/e2e.js
```

See `docs/GDD.md` for the design and `docs/DEVLOG.md` for the audit, architecture and test notes.
