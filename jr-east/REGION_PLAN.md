# JR East Regional Map Plan — V0.3

## Current network size

- 16 services
- 299 game stations
- 9 presentation regions
- Tokyo core is the only finished interactive regional SVG

## Current region assignment estimate

Assignment is currently estimated by shortest graph distance to the nearest regional hub.

| Region | Approx. stations |
| --- | ---: |
| Tokyo core | 62 |
| Tama / west Tokyo | 49 |
| Saitama | 54 |
| north Kanto | 24 |
| Joban | 7 |
| Chiba | 32 |
| Yokohama / Kawasaki | 35 |
| Shonan / Kamakura | 25 |
| west Kanagawa | 11 |

These counts are not hard game boundaries. Regions may overlap.

The Joban region is small because the current V0.3 network only includes the rapid service subset. It should grow when additional Joban-area services are added.

## Recommended SVG production order

### 1. Yokohama / Kawasaki

Why:
- dense network
- multiple services
- important bridge between Tokyo and Shonan
- good test for overlapping lines

Primary hubs:
- 川崎
- 横浜
- 武蔵小杉
- 新横浜

### 2. Shonan / Kamakura

Primary hubs:
- 大船
- 藤沢
- 茅ケ崎
- 鎌倉
- 逗子

### 3. Saitama

Primary hubs:
- 大宮
- 浦和
- 川越
- 武蔵浦和

### 4. Chiba

Primary hubs:
- 西船橋
- 津田沼
- 千葉
- 蘇我

### 5. Tama / west Tokyo

Primary hubs:
- 立川
- 八王子
- 三鷹
- 府中本町
- 橋本

### 6. Joban

Primary hubs:
- 北千住
- 松戸
- 柏
- 取手

Do not over-polish this map until the Joban service dataset is expanded.

### 7. north Kanto

Primary hubs:
- 高崎
- 宇都宮
- 小山
- 熊谷

### 8. west Kanagawa

Primary hubs:
- 平塚
- 国府津
- 小田原
- 熱海

## Regional map philosophy

A regional map is allowed to show visual-only reference stations.

If a station is not currently in the game network:

- do **not** use `data-station`
- optionally use `data-reference-station`

This keeps map context without accidentally turning a non-game station into an interactive node.

## Current example

The Tokyo core SVG visually includes:

- 綾瀬
- 亀有
- 金町
- 新日本橋
- 馬喰町

These are currently reference-only because they are not included in the V0.3 game network.

## Automatic loading

The application already supports regional map paths from `network-data.js`.

When a region receives a non-null `map` path:

1. the app can load the SVG
2. station nodes become interactive automatically
3. current / goal / reachable / target states are applied
4. if no regional map exists, the app falls back to the all-station network

## Before enabling a map

Run the CI map contract.

It checks:

- service order integrity
- overview node validity
- region hub validity
- map file existence
- duplicate `data-station`
- unknown game stations
- required region hubs

## Long-term expansion

The uploaded JR East Kanto map indicates significantly broader coverage than the current 16-service dataset.

Do not attempt to draw those missing areas first.

Preferred order:

1. extend network/service data
2. verify game graph
3. assign regional metadata
4. then draw the corresponding SVG

This prevents visual maps from getting ahead of gameplay data.
