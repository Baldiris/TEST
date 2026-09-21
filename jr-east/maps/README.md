# Regional SVG Maps

Regional maps are presentation layers only.

Do not encode rail connectivity here.

## Add a new regional map

1. Copy `region-template.svg`
2. Rename it, for example:
   - `yokohama-kawasaki.svg`
   - `shonan.svg`
   - `saitama.svg`
3. Add station nodes with exact names:
   `data-station="横浜"`
4. Add the file path to the matching region in:
   `../network-data.js`
5. Run:
   `node ../../tests/jr-map-contract.test.js`

## Required station-node contract

Each interactive station node must have exactly one:

`data-station="<exact station name>"`

Do not use abbreviations or alternate station spelling.

## Runtime classes

The application may add these classes:

- `game-current`
- `game-goal`
- `game-reachable`
- `game-target`

The app stylesheet controls those interaction colors.

## Labels

Recommended:

- `major-label`
- `minor-label`

The app may use `labels-major-only` on the root SVG for overview mode.

## Geometry priorities

1. topological correctness
2. direction / regional sense
3. label readability
4. mobile usability
5. visual polish

Pixel-perfect geographic accuracy is not required.
