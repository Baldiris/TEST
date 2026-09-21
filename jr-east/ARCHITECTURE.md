# JR East Kanto Architecture — V0.3

## Goal

The JR East version must scale beyond the Tokyo core without turning the entire Kanto area into one unreadable giant SVG.

The architecture is split into four layers:

1. **Network data**
   - station adjacency
   - services / line colors
   - game rules
2. **Region metadata**
   - Tokyo core
   - Tama / west Tokyo
   - Saitama
   - north Kanto
   - Joban
   - Chiba
   - Yokohama / Kawasaki
   - Shonan / Kamakura
   - west Kanagawa
3. **Map layouts**
   - Kanto overview
   - regional SVGs
   - fallback all-station network
4. **Game UI**
   - current station
   - goal
   - reachable stations
   - route hint
   - dice / quests / history

## Files

- `network-data.js`
  - source of truth for services, regions and overview layout
- `app.js`
  - gameplay and map interaction logic
- `tokyo-core-map.svg`
  - first production regional SVG
- `index.html`
  - application shell
- `style.css`
  - visual states and responsive layout

## Important rule

**Map geometry must never redefine game connectivity.**

A station may move visually in an SVG without changing the rail graph.

## Current map levels

### Kanto overview

Purpose:
- show broad direction
- show current and goal in Kanto context
- avoid displaying all 299 stations

Overview nodes are intentionally schematic.

### Tokyo core

Purpose:
- detailed interactive game board
- direct station tapping after dice roll
- current / goal / reachable highlights

Tokyo core and Yokohama / Kawasaki have interactive regional SVGs.

### All stations

Purpose:
- fallback
- debugging
- gameplay outside finished regional SVG coverage

This view should remain until all regional SVGs are production-ready.

## Region strategy

Regions may overlap. They are presentation scopes, not gameplay boundaries.

Current region set:

- Tokyo core
- Tama / west Tokyo
- Saitama
- north Kanto
- Joban
- Chiba
- Yokohama / Kawasaki
- Shonan / Kamakura
- west Kanagawa

## Region map contract

Each regional SVG should:

- use a stable viewBox
- include a `data-station="<station name>"` attribute for each interactive station node
- preserve one unique station node per station inside that regional map
- avoid embedding gameplay rules
- expose labels separately where possible
- support major/minor label classes
- remain usable at mobile width

Recommended CSS classes:

- `major-label`
- `minor-label`
- `labels-major-only`

## Game interaction contract

The renderer may apply:

- `game-current`
- `game-goal`
- `game-reachable`
- `game-target`

The map must tolerate those classes being added dynamically.

## Data migration

V0.3 uses:

`kimagureJREastKantoV03`

Legacy state from V0.1 / V0.2 should migrate automatically.

## Non-goals for V0.3

- Completing all Kanto regional SVGs
- Perfect geographical accuracy
- Adding express-train movement rules
- Replacing station-based dice movement
- Removing the all-station fallback

## Next implementation order

1. Confirm V0.3 architecture and regression tests
2. Build Yokohama / Kawasaki regional SVG
3. Build Shonan / Kamakura regional SVG
4. Build Saitama regional SVG
5. Build Chiba regional SVG
6. Build Tama / west Tokyo regional SVG
7. Build Joban regional SVG
8. Build north Kanto regional SVG
9. Build west Kanagawa regional SVG
10. Add automatic region-map switching
11. Tune labels and mobile layout
12. Remove or demote fallback only after regional coverage is complete

