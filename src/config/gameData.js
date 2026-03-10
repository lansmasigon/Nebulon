// Game Data - Planets, Enemies, Loot, Quests, Upgrades
const GameData = {
    planets: {
        solar_system: [
            { id: 'mercury', name: 'Mercury', orbitRadius: 70, orbitSpeed: 0.8, startAngle: 0.5, radius: 8, color: 0xb5b5b5, description: 'A scorching planet closest to the Sun.', resources: ['metal', 'fuel'], enemyLevel: 1, order: 0, unlocked: true },
            { id: 'venus', name: 'Venus', orbitRadius: 105, orbitSpeed: 0.6, startAngle: 2.1, radius: 12, color: 0xe8cda0, description: 'Shrouded in thick clouds of sulfuric acid.', resources: ['metal', 'rare_materials'], enemyLevel: 1, order: 1, unlocked: false },
            { id: 'earth', name: 'Earth', orbitRadius: 145, orbitSpeed: 0.5, startAngle: 4.0, radius: 13, color: 0x4488cc, description: 'Home planet. The hub of humanity.', resources: ['fuel', 'ship_parts'], enemyLevel: 0, isHub: true, order: 2, unlocked: false },
            { id: 'mars', name: 'Mars', orbitRadius: 185, orbitSpeed: 0.4, startAngle: 1.0, radius: 10, color: 0xcc4422, description: 'The Red Planet. Ancient ruins lie beneath.', resources: ['metal', 'alien_artifacts'], enemyLevel: 2, order: 3, unlocked: false },
            { id: 'jupiter', name: 'Jupiter', orbitRadius: 240, orbitSpeed: 0.25, startAngle: 3.5, radius: 24, color: 0xddaa66, description: 'Gas giant with a massive storm system.', resources: ['fuel', 'rare_materials'], enemyLevel: 3, hasStation: true, order: 4, unlocked: false },
            { id: 'saturn', name: 'Saturn', orbitRadius: 300, orbitSpeed: 0.2, startAngle: 5.5, radius: 20, color: 0xddcc88, description: 'Famous for its ring system.', resources: ['metal', 'ship_parts'], enemyLevel: 3, hasRings: true, order: 5, unlocked: false },
            { id: 'uranus', name: 'Uranus', orbitRadius: 350, orbitSpeed: 0.15, startAngle: 0.8, radius: 16, color: 0x66ccdd, description: 'An ice giant tilted on its side.', resources: ['rare_materials', 'alien_artifacts'], enemyLevel: 4, order: 6, unlocked: false },
            { id: 'neptune', name: 'Neptune', orbitRadius: 395, orbitSpeed: 0.12, startAngle: 3.0, radius: 15, color: 0x3355cc, description: 'The windiest planet in the Solar System.', resources: ['fuel', 'alien_artifacts'], enemyLevel: 5, order: 7, unlocked: false },
            { id: 'pluto', name: 'Pluto', orbitRadius: 430, orbitSpeed: 0.08, startAngle: 1.5, radius: 6, color: 0x998877, description: 'A distant dwarf planet with secrets.', resources: ['alien_artifacts', 'rare_materials'], enemyLevel: 5, isBossArea: true, order: 8, unlocked: false }
        ],
        first_galaxy: [
            { id: 'xeron', name: 'Xeron Prime', x: 300, y: 350, orbitRadius: 0, radius: 30, color: 0x22dd88, description: 'An alien world covered in bioluminescent forests.', resources: ['alien_artifacts', 'rare_materials'], enemyLevel: 6 },
            { id: 'nebulos', name: 'Nebulos', x: 600, y: 200, orbitRadius: 0, radius: 35, color: 0xdd44aa, description: 'A gas giant with breathable clouds.', resources: ['fuel', 'rare_materials'], enemyLevel: 7 },
            { id: 'crystallis', name: 'Crystallis', x: 900, y: 450, orbitRadius: 0, radius: 25, color: 0x44ddff, description: 'Entire surface covered in crystal formations.', resources: ['rare_materials', 'advanced_weapons'], enemyLevel: 7 },
            { id: 'station_alpha', name: 'Station Alpha', x: 1100, y: 280, orbitRadius: 0, radius: 20, color: 0xffdd00, description: 'A massive alien space station.', resources: ['ship_parts', 'advanced_weapons'], enemyLevel: 8, isStation: true },
            { id: 'darkmoon', name: 'Dark Moon', x: 1350, y: 400, orbitRadius: 0, radius: 22, color: 0x555566, description: 'A rogue moon hiding a pirate fortress.', resources: ['alien_artifacts', 'advanced_weapons'], enemyLevel: 9, isBossArea: true }
        ],
        black_hole: [
            { id: 'void_edge', name: 'Void Edge', x: 400, y: 300, orbitRadius: 0, radius: 28, color: 0x8822dd, description: 'The boundary of the black hole system.', resources: ['rare_materials', 'advanced_weapons'], enemyLevel: 10 },
            { id: 'singularity', name: 'Singularity Station', x: 800, y: 350, orbitRadius: 0, radius: 35, color: 0xff2266, description: 'A station orbiting the event horizon.', resources: ['advanced_weapons', 'alien_artifacts'], enemyLevel: 12, isStation: true },
            { id: 'event_horizon', name: 'Event Horizon', x: 1200, y: 300, orbitRadius: 0, radius: 50, color: 0x110022, description: 'The point of no return. Ultimate power awaits.', resources: ['alien_artifacts', 'advanced_weapons'], enemyLevel: 15, isBossArea: true, isFinal: true }
        ]
    },

    enemies: {
        pirate: { name: 'Pirate Ship', health: 30, speed: 120, damage: 8, xp: 15, credits: 20, color: 0xff4444, size: 14 },
        alien: { name: 'Alien Fighter', health: 50, speed: 150, damage: 12, xp: 25, credits: 35, color: 0x44ff44, size: 16 },
        drone: { name: 'Rogue Drone', health: 20, speed: 180, damage: 5, xp: 10, credits: 15, color: 0xffff44, size: 10 },
        asteroid_creature: { name: 'Asteroid Creature', health: 60, speed: 80, damage: 15, xp: 30, credits: 40, color: 0x886644, size: 20 },
        boss_pirate: { name: 'Pirate Commander', health: 200, speed: 100, damage: 20, xp: 100, credits: 200, color: 0xff0000, size: 30, isBoss: true },
        boss_alien: { name: 'Alien Warship', health: 400, speed: 80, damage: 30, xp: 250, credits: 500, color: 0x00ff00, size: 40, isBoss: true },
        boss_void: { name: 'Void Titan', health: 800, speed: 60, damage: 50, xp: 500, credits: 1000, color: 0x8800ff, size: 55, isBoss: true }
    },

    loot: {
        common: [
            { id: 'metal', name: 'Scrap Metal', type: 'resource', rarity: 'common', value: 5, description: 'Basic building material.' },
            { id: 'fuel', name: 'Fuel Cell', type: 'resource', rarity: 'common', value: 8, description: 'Standard fuel supply.' },
            { id: 'ship_parts', name: 'Ship Parts', type: 'resource', rarity: 'common', value: 10, description: 'Spare parts for repairs.' }
        ],
        uncommon: [
            { id: 'rare_materials', name: 'Rare Materials', type: 'resource', rarity: 'uncommon', value: 25, description: 'Unusual compounds for advanced crafting.' },
            { id: 'shield_booster', name: 'Shield Booster', type: 'equipment', rarity: 'uncommon', value: 40, description: 'Temporarily increases shield capacity.', effect: { shield: 15 } },
            { id: 'hull_patch', name: 'Hull Patch Kit', type: 'equipment', rarity: 'uncommon', value: 35, description: 'Repairs hull damage.', effect: { health: 20 } }
        ],
        rare: [
            { id: 'alien_artifacts', name: 'Alien Artifact', type: 'artifact', rarity: 'rare', value: 80, description: 'Mysterious alien technology.' },
            { id: 'advanced_weapons', name: 'Advanced Weapon Module', type: 'weapon', rarity: 'rare', value: 100, description: 'Superior firepower for your ship.' },
            { id: 'warp_crystal', name: 'Warp Crystal', type: 'artifact', rarity: 'rare', value: 120, description: 'Powers warp drive technology.' }
        ],
        legendary: [
            { id: 'void_core', name: 'Void Core', type: 'artifact', rarity: 'legendary', value: 500, description: 'Energy from beyond the event horizon.' },
            { id: 'titan_cannon', name: 'Titan Cannon', type: 'weapon', rarity: 'legendary', value: 800, description: 'The most powerful weapon in the galaxy.' },
            { id: 'quantum_shield', name: 'Quantum Shield', type: 'equipment', rarity: 'legendary', value: 600, description: 'Near-impenetrable shield technology.' }
        ]
    },

    quests: {
        solar_system: [
            { id: 'q_scan_mars', type: 'exploration', title: 'Scan Mars Ruins', description: 'Travel to Mars and scan the ancient ruins.', target: 'mars', requirement: { type: 'visit', planet: 'mars' }, rewards: { xp: 50, credits: 100, loot: 'rare_materials' } },
            { id: 'q_pirates_saturn', type: 'combat', title: 'Clear Saturn Pirates', description: 'Destroy 3 pirate ships near Saturn.', target: 'saturn', requirement: { type: 'kill', enemy: 'pirate', count: 3 }, rewards: { xp: 80, credits: 150, loot: 'advanced_weapons' } },
            { id: 'q_fuel_jupiter', type: 'loot', title: 'Fuel Run to Jupiter', description: 'Collect 3 fuel cells from Jupiter\'s moons.', target: 'jupiter', requirement: { type: 'collect', item: 'fuel', count: 3 }, rewards: { xp: 40, credits: 80, loot: 'ship_parts' } },
            { id: 'q_cargo_earth', type: 'delivery', title: 'Supply Run', description: 'Deliver cargo from Mars to Earth station.', target: 'earth', requirement: { type: 'delivery', from: 'mars', to: 'earth' }, rewards: { xp: 60, credits: 120, loot: 'shield_booster' } },
            { id: 'q_explore_neptune', type: 'exploration', title: 'Neptune Discovery', description: 'Explore Neptune\'s mysterious storms.', target: 'neptune', requirement: { type: 'visit', planet: 'neptune' }, rewards: { xp: 70, credits: 140, loot: 'alien_artifacts' } },
            { id: 'q_boss_pluto', type: 'combat', title: 'Pirate Commander', description: 'Defeat the Pirate Commander hiding near Pluto.', target: 'pluto', requirement: { type: 'boss', enemy: 'boss_pirate' }, rewards: { xp: 200, credits: 500, loot: 'warp_crystal', unlocks: 'first_galaxy' } }
        ],
        first_galaxy: [
            { id: 'q_explore_xeron', type: 'exploration', title: 'Xeron Forests', description: 'Explore the bioluminescent forests of Xeron Prime.', target: 'xeron', requirement: { type: 'visit', planet: 'xeron' }, rewards: { xp: 100, credits: 200, loot: 'alien_artifacts' } },
            { id: 'q_aliens_nebulos', type: 'combat', title: 'Alien Threat', description: 'Destroy 5 alien fighters near Nebulos.', target: 'nebulos', requirement: { type: 'kill', enemy: 'alien', count: 5 }, rewards: { xp: 150, credits: 300, loot: 'advanced_weapons' } },
            { id: 'q_crystals', type: 'loot', title: 'Crystal Harvest', description: 'Collect rare crystals from Crystallis.', target: 'crystallis', requirement: { type: 'collect', item: 'rare_materials', count: 5 }, rewards: { xp: 120, credits: 250, loot: 'warp_crystal' } },
            { id: 'q_station_alpha', type: 'delivery', title: 'Station Resupply', description: 'Deliver supplies to Station Alpha.', target: 'station_alpha', requirement: { type: 'delivery', from: 'xeron', to: 'station_alpha' }, rewards: { xp: 130, credits: 280, loot: 'advanced_weapons' } },
            { id: 'q_boss_galaxy', type: 'combat', title: 'Alien Warship', description: 'Defeat the Alien Warship at Dark Moon.', target: 'darkmoon', requirement: { type: 'boss', enemy: 'boss_alien' }, rewards: { xp: 400, credits: 1000, loot: 'quantum_shield', unlocks: 'black_hole' } }
        ],
        black_hole: [
            { id: 'q_void_edge', type: 'exploration', title: 'Edge of the Void', description: 'Survey the Void Edge anomaly.', target: 'void_edge', requirement: { type: 'visit', planet: 'void_edge' }, rewards: { xp: 200, credits: 500, loot: 'void_core' } },
            { id: 'q_singularity', type: 'combat', title: 'Singularity Siege', description: 'Clear enemies from Singularity Station.', target: 'singularity', requirement: { type: 'kill', enemy: 'alien', count: 8 }, rewards: { xp: 300, credits: 800, loot: 'titan_cannon' } },
            { id: 'q_final_boss', type: 'combat', title: 'The Void Titan', description: 'Face the ultimate challenge at the Event Horizon.', target: 'event_horizon', requirement: { type: 'boss', enemy: 'boss_void' }, rewards: { xp: 1000, credits: 5000, loot: 'void_core', isVictory: true } }
        ]
    },

    upgrades: {
        speed: { name: 'Engine Upgrade', levels: [
            { cost: 100, bonus: 20, description: 'Basic thrusters' },
            { cost: 250, bonus: 40, description: 'Ion engines' },
            { cost: 500, bonus: 60, description: 'Plasma drives' },
            { cost: 1000, bonus: 80, description: 'Warp engines' },
            { cost: 2000, bonus: 100, description: 'Quantum drives' }
        ]},
        shield: { name: 'Shield Upgrade', levels: [
            { cost: 120, bonus: 15, description: 'Basic shields' },
            { cost: 300, bonus: 30, description: 'Reinforced shields' },
            { cost: 600, bonus: 50, description: 'Energy shields' },
            { cost: 1200, bonus: 75, description: 'Plasma shields' },
            { cost: 2500, bonus: 100, description: 'Quantum shields' }
        ]},
        hull: { name: 'Hull Upgrade', levels: [
            { cost: 100, bonus: 20, description: 'Reinforced plating' },
            { cost: 250, bonus: 40, description: 'Titanium hull' },
            { cost: 500, bonus: 60, description: 'Composite armor' },
            { cost: 1000, bonus: 80, description: 'Nano-repair hull' },
            { cost: 2000, bonus: 100, description: 'Void-forged armor' }
        ]},
        damage: { name: 'Weapon Upgrade', levels: [
            { cost: 150, bonus: 5, description: 'Twin lasers' },
            { cost: 350, bonus: 10, description: 'Plasma cannons' },
            { cost: 700, bonus: 15, description: 'Missile rack' },
            { cost: 1500, bonus: 25, description: 'Photon torpedoes' },
            { cost: 3000, bonus: 40, description: 'Titan cannon' }
        ]},
        cargo: { name: 'Cargo Upgrade', levels: [
            { cost: 80, bonus: 5, description: 'Expanded hold' },
            { cost: 200, bonus: 10, description: 'Cargo bay' },
            { cost: 400, bonus: 15, description: 'Storage module' },
            { cost: 800, bonus: 20, description: 'Freight system' },
            { cost: 1600, bonus: 30, description: 'Quantum storage' }
        ]}
    },

    ships: [
        { id: 'starter', name: 'Scout Ship', speed: 200, shield: 50, hull: 100, cargo: 10, damage: 10, color: 0x00d4ff, description: 'Basic scout vessel.', cost: 0 },
        { id: 'fighter', name: 'Fighter', speed: 250, shield: 60, hull: 120, cargo: 8, damage: 15, color: 0xff4444, description: 'Fast combat ship.', cost: 500 },
        { id: 'freighter', name: 'Freighter', speed: 150, shield: 80, hull: 200, cargo: 30, damage: 8, color: 0x44ff44, description: 'Heavy cargo ship.', cost: 800 },
        { id: 'explorer', name: 'Explorer', speed: 220, shield: 70, hull: 150, cargo: 15, damage: 12, color: 0xffaa00, description: 'Balanced exploration vessel.', cost: 1200 },
        { id: 'warship', name: 'Warship', speed: 180, shield: 100, hull: 250, cargo: 12, damage: 25, color: 0xff00ff, description: 'Heavy military vessel.', cost: 3000 },
        { id: 'warp_ship', name: 'Warp Ship', speed: 300, shield: 90, hull: 180, cargo: 20, damage: 20, color: 0x8800ff, description: 'Advanced warp-capable ship.', cost: 5000 }
    ],

    crafting: [
        { id: 'craft_hull_patch', name: 'Hull Patch Kit', ingredients: [{ id: 'metal', count: 3 }, { id: 'ship_parts', count: 1 }], result: { id: 'hull_patch', name: 'Hull Patch Kit', type: 'equipment', rarity: 'uncommon', value: 35, description: 'Repairs hull damage.', effect: { health: 20 } } },
        { id: 'craft_shield_boost', name: 'Shield Booster', ingredients: [{ id: 'rare_materials', count: 2 }, { id: 'metal', count: 2 }], result: { id: 'shield_booster', name: 'Shield Booster', type: 'equipment', rarity: 'uncommon', value: 40, description: 'Temporarily increases shield capacity.', effect: { shield: 15 } } },
        { id: 'craft_fuel_cell', name: 'Fuel Cell', ingredients: [{ id: 'fuel', count: 2 }, { id: 'metal', count: 1 }], result: { id: 'fuel_cell_plus', name: 'Fuel Cell+', type: 'resource', rarity: 'uncommon', value: 20, description: 'Enhanced fuel cell.', effect: { fuel: 30 } } },
        { id: 'craft_weapon_mod', name: 'Weapon Module', ingredients: [{ id: 'rare_materials', count: 3 }, { id: 'alien_artifacts', count: 1 }], result: { id: 'advanced_weapons', name: 'Advanced Weapon Module', type: 'weapon', rarity: 'rare', value: 100, description: 'Superior firepower for your ship.' } },
        { id: 'craft_warp_crystal', name: 'Warp Crystal', ingredients: [{ id: 'alien_artifacts', count: 3 }, { id: 'rare_materials', count: 2 }], result: { id: 'warp_crystal', name: 'Warp Crystal', type: 'artifact', rarity: 'rare', value: 120, description: 'Powers warp drive technology.' } },
        { id: 'craft_quantum_shield', name: 'Quantum Shield', ingredients: [{ id: 'alien_artifacts', count: 2 }, { id: 'advanced_weapons', count: 1 }, { id: 'rare_materials', count: 3 }], result: { id: 'quantum_shield', name: 'Quantum Shield', type: 'equipment', rarity: 'legendary', value: 600, description: 'Near-impenetrable shield technology.' } }
    ]
};
