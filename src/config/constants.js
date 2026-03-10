// Game Constants
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const PLAYER_SPEED = 200;
const PLAYER_MAX_HEALTH = 100;
const PLAYER_MAX_SHIELD = 50;
const PLAYER_MAX_FUEL = 100;

// Infinite space world size
const SPACE_WORLD_SIZE = 12000;
const SPACE_CHUNK_SIZE = 800;

const ENEMY_TYPES = {
    PIRATE: 'pirate',
    ALIEN: 'alien',
    DRONE: 'drone',
    ASTEROID_CREATURE: 'asteroid_creature',
    BOSS_PIRATE: 'boss_pirate',
    BOSS_ALIEN: 'boss_alien',
    BOSS_VOID: 'boss_void'
};

const LOOT_RARITY = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    LEGENDARY: 'legendary'
};

const GAME_STAGES = {
    SOLAR_SYSTEM: 'solar_system',
    FIRST_GALAXY: 'first_galaxy',
    BLACK_HOLE: 'black_hole'
};

const QUEST_TYPES = {
    EXPLORATION: 'exploration',
    COMBAT: 'combat',
    LOOT: 'loot',
    DELIVERY: 'delivery'
};

// Weapon types for planet surface exploration
const WEAPON_TYPES = {
    PISTOL: 'pistol',
    RIFLE: 'rifle',
    SHOTGUN: 'shotgun',
    CANNON: 'cannon'
};

const WEAPON_DATA = {
    pistol: { name: 'Plasma Pistol', damage: 8, fireRate: 300, speed: 700, spread: 0, projectiles: 1, color: 0x00d4ff, range: 350, ammo: Infinity },
    rifle: { name: 'Pulse Rifle', damage: 12, fireRate: 150, speed: 900, spread: 0.05, projectiles: 1, color: 0x00ff88, range: 500, ammo: 120 },
    shotgun: { name: 'Scatter Blaster', damage: 6, fireRate: 600, speed: 550, spread: 0.3, projectiles: 5, color: 0xff6b35, range: 200, ammo: 40 },
    cannon: { name: 'Nova Cannon', damage: 35, fireRate: 1200, speed: 400, spread: 0, projectiles: 1, color: 0xff3366, range: 400, ammo: 15, explosive: true, explosionRadius: 60 }
};

// Player abilities for planet surface
const ABILITY_TYPES = {
    DASH: 'dash',
    JETPACK: 'jetpack',
    SHIELD: 'shield'
};

// Ship visual designs per type
const SHIP_DESIGNS = {
    starter: {
        bodyParts: [
            { type: 'tri', pts: [[0,-1],[-.6,.5],[.6,.5]], color: 'main' },
            { type: 'tri', pts: [[0,-.7],[-.2,.2],[.2,.2]], color: 'cockpit' },
        ],
        wingStyle: 'standard', engineCount: 1, hasStripes: false
    },
    fighter: {
        bodyParts: [
            { type: 'tri', pts: [[0,-1.1],[-.5,.3],[.5,.3]], color: 'main' },
            { type: 'quad', pts: [[-.5,.1],[-.9,.6],[-.7,.6],[-.4,.3]], color: 'wing' },
            { type: 'quad', pts: [[.5,.1],[.9,.6],[.7,.6],[.4,.3]], color: 'wing' },
            { type: 'tri', pts: [[0,-.8],[-.15,.1],[.15,.1]], color: 'cockpit' },
        ],
        wingStyle: 'swept', engineCount: 2, hasStripes: true
    },
    freighter: {
        bodyParts: [
            { type: 'quad', pts: [[-.4,-.8],[.4,-.8],[.5,.6],[-.5,.6]], color: 'main' },
            { type: 'quad', pts: [[-.3,-.6],[.3,-.6],[.2,-.2],[-.2,-.2]], color: 'cockpit' },
            { type: 'quad', pts: [[-.5,.1],[-.7,.5],[-.6,.6],[-.4,.3]], color: 'wing' },
            { type: 'quad', pts: [[.5,.1],[.7,.5],[.6,.6],[.4,.3]], color: 'wing' },
        ],
        wingStyle: 'box', engineCount: 3, hasStripes: true
    },
    explorer: {
        bodyParts: [
            { type: 'tri', pts: [[0,-1],[-.55,.4],[.55,.4]], color: 'main' },
            { type: 'quad', pts: [[-.55,.2],[-.85,.5],[-.75,.55],[-.45,.35]], color: 'wing' },
            { type: 'quad', pts: [[.55,.2],[.85,.5],[.75,.55],[.45,.35]], color: 'wing' },
            { type: 'tri', pts: [[0,-.7],[-.2,.15],[.2,.15]], color: 'cockpit' },
            { type: 'circle', cx: -.65, cy: .4, r: .08, color: 'accent' },
            { type: 'circle', cx: .65, cy: .4, r: .08, color: 'accent' },
        ],
        wingStyle: 'angled', engineCount: 2, hasStripes: false
    },
    warship: {
        bodyParts: [
            { type: 'quad', pts: [[-.3,-1],[.3,-1],[.45,.5],[-.45,.5]], color: 'main' },
            { type: 'quad', pts: [[-.45,.1],[-.95,.55],[-.8,.6],[-.35,.3]], color: 'wing' },
            { type: 'quad', pts: [[.45,.1],[.95,.55],[.8,.6],[.35,.3]], color: 'wing' },
            { type: 'tri', pts: [[0,-.85],[-.15,-.3],[.15,-.3]], color: 'cockpit' },
            { type: 'quad', pts: [[-.2,-.5],[-.35,-.5],[-.35,.3],[-.2,.3]], color: 'accent' },
            { type: 'quad', pts: [[.2,-.5],[.35,-.5],[.35,.3],[.2,.3]], color: 'accent' },
        ],
        wingStyle: 'heavy', engineCount: 4, hasStripes: true
    },
    warp_ship: {
        bodyParts: [
            { type: 'tri', pts: [[0,-1.2],[-.4,.3],[.4,.3]], color: 'main' },
            { type: 'quad', pts: [[-.4,.0],[-.7,.2],[-.65,.5],[-.35,.35]], color: 'wing' },
            { type: 'quad', pts: [[.4,.0],[.7,.2],[.65,.5],[.35,.35]], color: 'wing' },
            { type: 'tri', pts: [[0,-.9],[-.15,-.1],[.15,-.1]], color: 'cockpit' },
            { type: 'circle', cx: 0, cy: .15, r: .12, color: 'glow' },
        ],
        wingStyle: 'delta', engineCount: 2, hasStripes: false
    }
};

// Enemy visual designs per type
const ENEMY_DESIGNS = {
    pirate: {
        shape: 'angular', bodyColor: 0xff4444, accentColor: 0xcc2222,
        parts: [
            { type: 'tri', pts: [[.9,0],[-.5,-.45],[-.5,.45]], fill: 'body' },
            { type: 'tri', pts: [[-.5,-.45],[-.8,-.3],[-.6,-.1]], fill: 'wing' },
            { type: 'tri', pts: [[-.5,.45],[-.8,.3],[-.6,.1]], fill: 'wing' },
            { type: 'circle', cx: .2, cy: 0, r: .15, fill: 'cockpit' },
        ],
        hasSkull: true
    },
    alien: {
        shape: 'organic', bodyColor: 0x44ff44, accentColor: 0x22aa22,
        parts: [
            { type: 'ellipse', cx: 0, cy: 0, rx: .7, ry: .4, fill: 'body' },
            { type: 'tri', pts: [[.5,0],[-.1,-.5],[.0,-.2]], fill: 'wing' },
            { type: 'tri', pts: [[.5,0],[-.1,.5],[.0,.2]], fill: 'wing' },
            { type: 'circle', cx: .25, cy: -.1, r: .1, fill: 'eye' },
            { type: 'circle', cx: .25, cy: .1, r: .1, fill: 'eye' },
        ],
        hasGlow: true
    },
    drone: {
        shape: 'mechanical', bodyColor: 0xffff44, accentColor: 0xaaaa22,
        parts: [
            { type: 'quad', pts: [[.5,-.2],[.5,.2],[-.5,.2],[-.5,-.2]], fill: 'body' },
            { type: 'quad', pts: [[-.3,-.35],[.1,-.35],[.1,-.2],[-.3,-.2]], fill: 'panel' },
            { type: 'quad', pts: [[-.3,.35],[.1,.35],[.1,.2],[-.3,.2]], fill: 'panel' },
            { type: 'circle', cx: .3, cy: 0, r: .12, fill: 'sensor' },
        ],
        hasAntenna: true
    },
    asteroid_creature: {
        shape: 'rocky', bodyColor: 0x886644, accentColor: 0x554433,
        parts: [
            { type: 'irregular', numPts: 8, minR: .6, maxR: .9, fill: 'body' },
            { type: 'circle', cx: .2, cy: -.15, r: .12, fill: 'eye' },
            { type: 'circle', cx: .2, cy: .15, r: .1, fill: 'eye' },
        ],
        hasTentacles: true
    },
    boss_pirate: {
        shape: 'angular', bodyColor: 0xff0000, accentColor: 0xaa0000,
        parts: [
            { type: 'tri', pts: [[1,0],[-.6,-.55],[-.6,.55]], fill: 'body' },
            { type: 'quad', pts: [[-.2,-.55],[-.7,-.8],[-.9,-.5],[-.5,-.3]], fill: 'wing' },
            { type: 'quad', pts: [[-.2,.55],[-.7,.8],[-.9,.5],[-.5,.3]], fill: 'wing' },
            { type: 'tri', pts: [[.6,0],[.1,-.2],[.1,.2]], fill: 'cockpit' },
        ],
        hasSkull: true, hasCrown: true
    },
    boss_alien: {
        shape: 'organic', bodyColor: 0x00ff00, accentColor: 0x008800,
        parts: [
            { type: 'ellipse', cx: 0, cy: 0, rx: .85, ry: .55, fill: 'body' },
            { type: 'tri', pts: [[.6,0],[-.2,-.65],[.0,-.3]], fill: 'wing' },
            { type: 'tri', pts: [[.6,0],[-.2,.65],[.0,.3]], fill: 'wing' },
            { type: 'circle', cx: .35, cy: -.15, r: .13, fill: 'eye' },
            { type: 'circle', cx: .35, cy: .15, r: .13, fill: 'eye' },
            { type: 'circle', cx: .35, cy: 0, r: .1, fill: 'eye' },
        ],
        hasGlow: true, hasAura: true
    },
    boss_void: {
        shape: 'eldritch', bodyColor: 0x8800ff, accentColor: 0x5500aa,
        parts: [
            { type: 'star', cx: 0, cy: 0, outerR: .9, innerR: .5, points: 6, fill: 'body' },
            { type: 'circle', cx: 0, cy: 0, r: .35, fill: 'core' },
            { type: 'circle', cx: 0, cy: 0, r: .2, fill: 'eye' },
        ],
        hasGlow: true, hasAura: true, hasTentacles: true
    }
};

// Space shop data
const SPACE_SHOP_DATA = {
    types: ['fuel_depot', 'arms_dealer', 'repair_station', 'trade_post', 'black_market'],
    fuel_depot: { name: 'Fuel Depot', color: 0xff8800, icon: 'fuel',
        items: [
            { id: 'buy_fuel_small', name: 'Fuel Cell (Small)', cost: 15, effect: { fuel: 25 }, desc: 'Restores 25 fuel.' },
            { id: 'buy_fuel_large', name: 'Fuel Cell (Large)', cost: 35, effect: { fuel: 60 }, desc: 'Restores 60 fuel.' },
            { id: 'buy_fuel_full', name: 'Full Refuel', cost: 60, effect: { fuel: 999 }, desc: 'Completely refuels your ship.' },
        ]
    },
    arms_dealer: { name: 'Arms Dealer', color: 0xff3366, icon: 'weapon',
        items: [
            { id: 'buy_missiles_3', name: 'Missiles x3', cost: 40, effect: { missiles: 3 }, desc: 'Adds 3 missiles.' },
            { id: 'buy_missiles_5', name: 'Missiles x5', cost: 60, effect: { missiles: 5 }, desc: 'Adds 5 missiles.' },
            { id: 'buy_damage_boost', name: 'Damage Boost', cost: 120, effect: { tempDamage: 5 }, desc: '+5 damage for this run.' },
        ]
    },
    repair_station: { name: 'Repair Station', color: 0x00ff66, icon: 'repair',
        items: [
            { id: 'buy_repair_small', name: 'Patch Kit', cost: 20, effect: { health: 30 }, desc: 'Repairs 30 HP.' },
            { id: 'buy_repair_full', name: 'Full Repair', cost: 80, effect: { health: 999 }, desc: 'Fully repairs hull.' },
            { id: 'buy_shield_charge', name: 'Shield Charge', cost: 40, effect: { shield: 999 }, desc: 'Fully charges shields.' },
        ]
    },
    trade_post: { name: 'Trade Post', color: 0xffdd00, icon: 'trade',
        items: [
            { id: 'buy_metal', name: 'Scrap Metal x5', cost: 20, effect: { item: 'metal', count: 5 }, desc: 'Buy 5 scrap metal.' },
            { id: 'buy_rare_mat', name: 'Rare Materials x2', cost: 50, effect: { item: 'rare_materials', count: 2 }, desc: 'Buy 2 rare materials.' },
            { id: 'buy_parts', name: 'Ship Parts x3', cost: 30, effect: { item: 'ship_parts', count: 3 }, desc: 'Buy 3 ship parts.' },
        ]
    },
    black_market: { name: 'Black Market', color: 0x8822dd, icon: 'illegal',
        items: [
            { id: 'buy_alien_art', name: 'Alien Artifact', cost: 150, effect: { item: 'alien_artifacts', count: 1 }, desc: 'A rare alien artifact.' },
            { id: 'buy_adv_weapon', name: 'Weapon Module', cost: 200, effect: { item: 'advanced_weapons', count: 1 }, desc: 'Advanced weapon technology.' },
            { id: 'buy_warp_crystal', name: 'Warp Crystal', cost: 300, effect: { item: 'warp_crystal', count: 1 }, desc: 'Mysterious warp crystal.' },
        ]
    }
};

// Planet shop data
const PLANET_SHOP_DATA = {
    mercury: { name: 'Volcanic Bazaar', specialItem: { id: 'heat_suit', name: 'Heat Suit', cost: 100, desc: 'Reduces heat damage by 50%.', effect: { hazardResist: 'heat' } } },
    venus: { name: 'Acid Market', specialItem: { id: 'acid_filter', name: 'Acid Filter', cost: 120, desc: 'Resists acid damage.', effect: { hazardResist: 'acid' } } },
    earth: { name: 'Earth Hub Market', specialItem: { id: 'nav_computer', name: 'Nav Computer', cost: 80, desc: 'Shows all planet locations on minimap.', effect: { mapReveal: true } } },
    mars: { name: 'Rust Trader', specialItem: { id: 'sand_boots', name: 'Sand Boots', cost: 90, desc: '+20% movement speed on Mars.', effect: { speedBoost: 0.2 } } },
    jupiter: { name: 'Storm Exchange', specialItem: { id: 'storm_shield', name: 'Storm Shield', cost: 200, desc: 'Blocks storm damage.', effect: { hazardResist: 'storms' } } },
    saturn: { name: 'Ring Bazaar', specialItem: { id: 'rad_suit', name: 'Radiation Suit', cost: 180, desc: 'Blocks radiation.', effect: { hazardResist: 'radiation' } } },
    uranus: { name: 'Ice Trader', specialItem: { id: 'thermal_gen', name: 'Thermal Generator', cost: 220, desc: 'Blocks cold damage.', effect: { hazardResist: 'cold' } } },
    neptune: { name: 'Deep Market', specialItem: { id: 'grav_anchor', name: 'Gravity Anchor', cost: 250, desc: 'Resist wind pushback.', effect: { hazardResist: 'wind' } } },
    pluto: { name: 'Void Exchange', specialItem: { id: 'void_cloak', name: 'Void Cloak', cost: 350, desc: 'Resist void damage.', effect: { hazardResist: 'void' } } },
};

// Planet boss definitions
const PLANET_BOSS_DATA = {
    mercury: { name: 'Magma Worm', health: 150, damage: 12, speed: 70, color: 0xff4400, size: 28, xp: 80, credits: 150, attackPattern: 'charge', phases: 2 },
    venus: { name: 'Acid Queen', health: 200, damage: 15, speed: 60, color: 0x88aa22, size: 30, xp: 100, credits: 200, attackPattern: 'spray', phases: 2 },
    earth: { name: 'Rogue Mech', health: 180, damage: 14, speed: 65, color: 0x667788, size: 32, xp: 90, credits: 180, attackPattern: 'turret', phases: 2 },
    mars: { name: 'Sand Titan', health: 250, damage: 18, speed: 55, color: 0xcc6633, size: 35, xp: 130, credits: 250, attackPattern: 'burrow', phases: 3 },
    jupiter: { name: 'Storm Lord', health: 300, damage: 20, speed: 70, color: 0xddaa44, size: 38, xp: 160, credits: 300, attackPattern: 'lightning', phases: 3 },
    saturn: { name: 'Crystal Golem', health: 350, damage: 22, speed: 50, color: 0x88ccff, size: 40, xp: 190, credits: 350, attackPattern: 'shatter', phases: 3 },
    uranus: { name: 'Frost Hydra', health: 400, damage: 25, speed: 60, color: 0x44ddff, size: 42, xp: 220, credits: 400, attackPattern: 'multihead', phases: 3 },
    neptune: { name: 'Abyssal Kraken', health: 500, damage: 30, speed: 45, color: 0x2244aa, size: 48, xp: 280, credits: 500, attackPattern: 'tentacle', phases: 3 },
    pluto: { name: 'Void Sentinel', health: 600, damage: 35, speed: 55, color: 0x8822dd, size: 50, xp: 350, credits: 600, attackPattern: 'teleport', phases: 4 },
};

// Planet main quest definitions
const PLANET_MAIN_QUESTS = {
    mercury: { title: 'Core Sample', desc: 'Collect 3 lava samples from deep craters. Defeat the Magma Worm guardian.', objectives: [{ type: 'collect', item: 'metal', count: 3 }, { type: 'boss', bossId: 'mercury' }] },
    venus: { title: 'Acid Neutralizer', desc: 'Gather 2 rare materials and defeat the Acid Queen.', objectives: [{ type: 'collect', item: 'rare_materials', count: 2 }, { type: 'boss', bossId: 'venus' }] },
    earth: { title: 'Mech Menace', desc: 'Clear 5 drones and defeat the Rogue Mech.', objectives: [{ type: 'kill', count: 5 }, { type: 'boss', bossId: 'earth' }] },
    mars: { title: 'Buried Secrets', desc: 'Find 2 alien artifacts and defeat the Sand Titan.', objectives: [{ type: 'collect', item: 'alien_artifacts', count: 2 }, { type: 'boss', bossId: 'mars' }] },
    jupiter: { title: 'Storm Tamer', desc: 'Collect 3 fuel cells and defeat the Storm Lord.', objectives: [{ type: 'collect', item: 'fuel', count: 3 }, { type: 'boss', bossId: 'jupiter' }] },
    saturn: { title: 'Crystal Heart', desc: 'Mine 4 rare materials and defeat the Crystal Golem.', objectives: [{ type: 'collect', item: 'rare_materials', count: 4 }, { type: 'boss', bossId: 'saturn' }] },
    uranus: { title: 'Frozen Legacy', desc: 'Recover 3 alien artifacts and defeat the Frost Hydra.', objectives: [{ type: 'collect', item: 'alien_artifacts', count: 3 }, { type: 'boss', bossId: 'uranus' }] },
    neptune: { title: 'Deep Dive', desc: 'Find 2 advanced weapons and defeat the Abyssal Kraken.', objectives: [{ type: 'collect', item: 'advanced_weapons', count: 2 }, { type: 'boss', bossId: 'neptune' }] },
    pluto: { title: 'Edge of Nothing', desc: 'Collect 3 alien artifacts and defeat the Void Sentinel.', objectives: [{ type: 'collect', item: 'alien_artifacts', count: 3 }, { type: 'boss', bossId: 'pluto' }] },
};

// Planet biome definitions
const BIOME_DATA = {
    mercury: { biomes: ['rocky', 'craters', 'lava'], groundColor: 0x665544, skyColors: [0x1a0a00, 0x331100], temp: 'extreme_hot', hazard: 'heat' },
    venus: { biomes: ['volcanic', 'acid_lakes', 'sulfur_plains'], groundColor: 0x887744, skyColors: [0x332200, 0x664400], temp: 'hot', hazard: 'acid' },
    earth: { biomes: ['forest', 'ocean_shore', 'mountains'], groundColor: 0x225533, skyColors: [0x001133, 0x003366], temp: 'mild', hazard: null },
    mars: { biomes: ['desert', 'canyons', 'ice_caps'], groundColor: 0x883322, skyColors: [0x220800, 0x441100], temp: 'cold', hazard: 'dust_storms' },
    jupiter: { biomes: ['gas_platforms', 'storm_zones', 'floating_rocks'], groundColor: 0x886633, skyColors: [0x1a1100, 0x443300], temp: 'extreme_cold', hazard: 'storms' },
    saturn: { biomes: ['ring_debris', 'ice_fields', 'crystal_caves'], groundColor: 0x887755, skyColors: [0x1a1500, 0x332a00], temp: 'cold', hazard: 'radiation' },
    uranus: { biomes: ['ice_plains', 'methane_pools', 'frozen_geysers'], groundColor: 0x335566, skyColors: [0x001a22, 0x003344], temp: 'extreme_cold', hazard: 'cold' },
    neptune: { biomes: ['deep_ice', 'dark_ocean', 'wind_tunnels'], groundColor: 0x223366, skyColors: [0x000a22, 0x001144], temp: 'extreme_cold', hazard: 'wind' },
    pluto: { biomes: ['frozen_waste', 'nitrogen_ice', 'void_cracks'], groundColor: 0x555555, skyColors: [0x0a0a0a, 0x111111], temp: 'extreme_cold', hazard: 'void' }
};

const COLORS = {
    PRIMARY: 0x00d4ff,
    SECONDARY: 0xff6b35,
    SUCCESS: 0x00ff88,
    DANGER: 0xff3366,
    WARNING: 0xffdd00,
    SHIELD: 0x4488ff,
    HEALTH: 0x00ff66,
    FUEL: 0xff8800,
    XP: 0xaa66ff,
    COMMON: 0xaaaaaa,
    UNCOMMON: 0x00cc44,
    RARE: 0x3388ff,
    LEGENDARY: 0xff8800,
    BG_DARK: 0x0a0a1a,
    BG_PANEL: 0x111133,
    TEXT: 0xffffff,
    TEXT_DIM: 0x888899
};
