# ASTRA HANDOFF — Kimagure JR Trip

## Current production concept

The application is a Momotetsu-style JR East station travel game.

Do **not** redesign the game rules from scratch.

Current stable rules:

- 1 station interval = 1 game step
- dice = 1–6
- candidate stations are based on graph distance
- goal can be selected if it is within the dice value
- user selects destination station directly
- arrival creates two optional quests
- progress is stored in LocalStorage
- no backend / login / AI runtime dependency

## What has already been solved

- 16 services
- 299 station network
- network connectivity tests
- Tokyo core interactive SVG
- current / goal / reachable state rendering
- Kanto overview data model
- region metadata
- data / rendering separation
- fallback all-station network
- GitHub Pages deployment
- CI regression checks

## Architecture rule

Do not put railway connectivity back into SVG files.

The source of truth is:

`jr-east/network-data.js`

SVG files are only layouts.

## Main work for Astra

The most valuable work is **regional SVG production and refinement**.

Priority:

1. Yokohama / Kawasaki
2. Shonan / Kamakura
3. Saitama
4. Chiba
5. Tama / west Tokyo
6. Joban
7. north Kanto
8. west Kanagawa

Tokyo core already exists and should be treated as the reference implementation.

## SVG requirements

Every station node that the game must interact with needs:

`data-station="exact station name"`

Names must match `network-data.js` exactly.

Do not silently rename stations.

Use:

- `major-label`
- `minor-label`

where practical.

The game may dynamically add:

- `game-current`
- `game-goal`
- `game-reachable`
- `game-target`

## Visual objective

The goal is not a pixel-perfect copy of JR East's official map.

Prioritize:

1. topology
2. direction / regional sense
3. readability
4. mobile usability
5. station selection clarity

Use the uploaded JR East Kanto route map only as a structural reference.

## Copyright / licensing

The Tokyo core SVG is adapted from Wikimedia Commons material under CC BY-SA 4.0 and carries attribution.

Do not paste copyrighted JR East map artwork directly into the application.

## Do not break

- Metro app
- JR fallback all-station network
- LocalStorage migration
- candidate cards
- quests
- arrival animation
- GitHub Pages workflow
- Quality Check workflow

## Definition of done for each regional map

- all intended station nodes present
- exact station names match data
- no duplicate `data-station`
- mobile readable
- current / goal / reachable states visible
- no JS syntax or CI regression
- region can be used without editing game connectivity
