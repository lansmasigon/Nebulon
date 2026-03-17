# Nebulon 🚀

A 2D space adventure game built with Phaser.js where you explore the Solar System, battle enemies, collect loot, and progress to distant galaxies and black hole systems.

## Features

- **Space Exploration** - Navigate your ship through space, visit planets, and discover new areas
- **Combat System** - Fight pirate ships, alien fighters, rogue drones, and epic bosses with lasers and missiles
- **Quest System** - Accept and complete exploration, combat, loot collection, and delivery quests
- **Loot & Inventory** - Collect resources from common scrap to legendary artifacts
- **Ship Upgrades** - Upgrade your engines, shields, hull, weapons, and cargo capacity
- **Multiple Ships** - Purchase new ships: Fighter, Freighter, Explorer, Warship, and Warp Ship
- **3 Game Stages** - Progress from the Solar System → First Galaxy → Black Hole Systems
- **Boss Battles** - Face the Pirate Commander, Alien Warship, and the Void Titan
- **Save System** - Auto-save with manual save support via localStorage
- **Procedural Audio** - Generated sound effects for lasers, explosions, and more
- **Online Asset Pipeline** - CDN-loaded images/audio with automatic procedural fallback if unavailable

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Thrust Forward |
| A / ← | Rotate Left |
| D / → | Rotate Right |
| S / ↓ | Brake |
| SPACE | Fire Laser |
| E | Fire Missile |
| Q | Toggle Shield |
| SHIFT | Speed Boost (uses fuel) |
| M | Open Map |
| I | Open Inventory |
| U | Ship Upgrades |
| J | Quest Log |
| ESC | Save Game |

## Getting Started

### Prerequisites
- Node.js (v16+)

### Install & Run

```bash
npm install
npm start
```

Then open your browser to `http://localhost:8080`

### Run as Desktop App (Electron)

```bash
npm run electron
```

## Tech Stack

- **Phaser.js 3** - Game engine
- **HTML5 Canvas** - Rendering
- **Web Audio API** - Procedural sound effects
- **Electron.js** - Desktop packaging (optional)

## Game Progression

```
Solar System (9 planets)
    ↓ Defeat Pirate Commander
First Galaxy (5 worlds)
    ↓ Defeat Alien Warship  
Black Hole Systems (3 zones)
    ↓ Defeat Void Titan
    VICTORY!
```
