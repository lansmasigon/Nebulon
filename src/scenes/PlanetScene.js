// Planet Scene - Detailed Top-Down Exploration with Shops, Bosses, Quests
class PlanetScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlanetScene' });
    }

    init(data) {
        this.planetData = data.planet;
        this.stage = data.stage || GAME_STAGES.SOLAR_SYSTEM;
    }

    create() {
        this.ship = this.registry.get('ship');
        this.questSystem = this.registry.get('questSystem');
        this.inventory = this.registry.get('inventory');
        this.saveSystem = new SaveSystem();

        var p = this.planetData;

        if (!this.ship.planetsVisited.includes(p.id)) this.ship.planetsVisited.push(p.id);
        var completed = this.questSystem.updateProgress('planet_visit', { planetId: p.id });
        if (completed) { for (var qi = 0; qi < completed.length; qi++) this.showQuestComplete(completed[qi]); }

        // Bigger world!
        this.worldWidth = 4800;
        this.worldHeight = 4800;

        this.biomeData = BIOME_DATA[p.id] || { biomes: ['rocky'], groundColor: 0x444444, skyColors: [0x0a0a1a, 0x111133], hazard: null };

        // Planet quest tracking
        this.planetQuestId = p.id;
        this.planetQuest = PLANET_MAIN_QUESTS[p.id] || null;
        this.questObjectivesCompleted = {};
        var savedProgress = this.ship.planetQuestProgress[p.id];
        if (savedProgress) this.questObjectivesCompleted = Object.assign({}, savedProgress);

        // Boss tracking
        this.bossDefeated = this.ship.planetBossesDefeated && this.ship.planetBossesDefeated.includes(p.id);

        this.generateWorld(p);

        this.bgGraphics = this.add.graphics();
        this.terrainGraphics = this.add.graphics();
        this.entityGraphics = this.add.graphics();
        this.playerGraphics = this.add.graphics();
        this.projectileGraphics = this.add.graphics();
        this.fxGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();
        this.terrainSpriteLayer = this.add.container(0, 0).setDepth(1);
        this.useTerrainSpriteLayers = this.textures.exists('terrain_rock') || this.textures.exists('terrain_crystal') || this.textures.exists('terrain_pillar') || this.textures.exists('terrain_ruins') || this.textures.exists('terrain_plant');

        this.drawStaticTerrain();
        this.createTerrainSpriteLayers();

        this.player = {
            x: this.worldWidth / 2, y: this.worldHeight / 2,
            vx: 0, vy: 0, speed: 160, size: 12, rotation: 0,
            health: this.ship.health, maxHealth: this.ship.maxHealth,
            invincible: 0, currentWeapon: WEAPON_TYPES.PISTOL,
            weapons: {
                pistol: { unlocked: true, ammo: Infinity, fireTimer: 0 },
                rifle: { unlocked: this.ship.level >= 3, ammo: 120, fireTimer: 0 },
                shotgun: { unlocked: this.ship.level >= 5, ammo: 40, fireTimer: 0 },
                cannon: { unlocked: this.ship.level >= 8, ammo: 15, fireTimer: 0 }
            },
            dashCooldown: 0, dashTimer: 0, isDashing: false,
            jetpackFuel: 100, jetpackActive: false,
            shieldActive: false, shieldCooldown: 0, shieldTimer: 0,
            shieldHP: 30, maxShieldHP: 30,
            killCount: 0, collectCount: {}
        };
        this.onlineAssetsReady = this.registry.get('onlineAssetsReady') === true;
        this.spriteIdCounter = 0;
        this.collectibleSprites = {};
        this.interactableSprites = {};
        this.surfaceEnemySprites = {};
        this.projectileSprites = {};
        this.playerSprite = null;
        if (this.textures.exists('character_player')) {
            this.playerSprite = this.add.image(0, 0, 'character_player').setDepth(60).setScale(0.85);
        }

        this.camX = 0;
        this.camY = 0;
        this.projectiles = [];
        this.particles = [];

        // Shop state
        this.shopOpen = false;
        this.shopContainer = null;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            TWO: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            THREE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            FOUR: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
            SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
            ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        };

        this.mouseDown = false;
        this.input.on('pointerdown', function() { this.mouseDown = true; }.bind(this));
        this.input.on('pointerup', function() { this.mouseDown = false; }.bind(this));

        this.createHUD(p);
        this.notifications = [];
        this.addNotification('Landed on ' + p.name + '! Explore the surface.', COLORS.PRIMARY);
        if (this.planetQuest) {
            this.addNotification('QUEST: ' + this.planetQuest.title, COLORS.WARNING);
        }

        this.hazardTimer = 0;
        this.saveSystem.save(this.ship, this.questSystem, this.inventory);
    }

    // ============ WORLD GENERATION ============
    generateWorld(p) {
        var biome = this.biomeData;
        this.tiles = [];
        this.obstacles = [];
        this.collectibles = [];
        this.surfaceEnemies = [];
        this.interactables = [];
        this.decorations = [];

        var tileSize = 60;
        var cols = Math.ceil(this.worldWidth / tileSize);
        var rows = Math.ceil(this.worldHeight / tileSize);

        for (var r = 0; r < rows; r++) {
            this.tiles[r] = [];
            for (var c = 0; c < cols; c++) {
                var noise1 = Math.sin(c * 0.15 + r * 0.1) * 0.5 + 0.5;
                var noise2 = Math.sin(c * 0.08 - r * 0.12 + 3) * 0.5 + 0.5;
                var noise3 = Math.sin(c * 0.3 + r * 0.25 + 7) * 0.5 + 0.5;
                var biomeIdx = Math.floor((noise1 + noise2) / 2 * biome.biomes.length) % biome.biomes.length;
                this.tiles[r][c] = { biome: biome.biomes[biomeIdx], height: noise3, x: c * tileSize, y: r * tileSize, size: tileSize };
            }
        }

        // More obstacles for bigger map
        var obstacleCount = Helpers.randomInt(80, 150);
        for (var i = 0; i < obstacleCount; i++) {
            var x = Helpers.randomFloat(100, this.worldWidth - 100);
            var y = Helpers.randomFloat(100, this.worldHeight - 100);
            var size = Helpers.randomFloat(15, 45);
            if (Helpers.distance(x, y, this.worldWidth / 2, this.worldHeight / 2) < 120) continue;
            this.obstacles.push({
                x: x, y: y, size: size,
                type: Helpers.randomElement(['rock', 'crystal', 'pillar', 'ruins', 'plant']),
                color: this.getObstacleColor(biome)
            });
        }

        // Decorations for detail
        var decoCount = Helpers.randomInt(100, 200);
        for (var di = 0; di < decoCount; di++) {
            this.decorations.push({
                x: Helpers.randomFloat(50, this.worldWidth - 50),
                y: Helpers.randomFloat(50, this.worldHeight - 50),
                type: Helpers.randomElement(['grass', 'pebble', 'crack', 'moss', 'spore', 'vent']),
                size: Helpers.randomFloat(3, 12),
                color: this.getDecoColor(biome),
                rotation: Helpers.randomFloat(0, Math.PI * 2)
            });
        }

        // More collectibles
        var collectCount = Helpers.randomInt(25, 40);
        for (var ci = 0; ci < collectCount; ci++) {
            var cx = Helpers.randomFloat(80, this.worldWidth - 80);
            var cy = Helpers.randomFloat(80, this.worldHeight - 80);
            var loot = this.getRandomPlanetLoot(p);
            this.collectibles.push({
                x: cx, y: cy, size: 8, alive: true, data: loot,
                bobPhase: Helpers.randomFloat(0, Math.PI * 2),
                color: Helpers.rarityColor(loot.rarity)
            });
        }

        // More enemies for bigger map
        if (p.enemyLevel > 0) {
            var enemyCount = Helpers.randomInt(10, 18 + Math.floor(p.enemyLevel));
            for (var ei = 0; ei < enemyCount; ei++) {
                var ex = Helpers.randomFloat(300, this.worldWidth - 300);
                var ey = Helpers.randomFloat(300, this.worldHeight - 300);
                if (Helpers.distance(ex, ey, this.worldWidth / 2, this.worldHeight / 2) < 250) continue;
                this.surfaceEnemies.push(this.createSurfaceEnemy(ex, ey, p.enemyLevel, false));
            }
        }

        // BOSS - always spawn one per planet!
        if (!this.bossDefeated) {
            var bossData = PLANET_BOSS_DATA[p.id];
            if (bossData) {
                var bx = Helpers.randomFloat(this.worldWidth * 0.2, this.worldWidth * 0.8);
                var by = Helpers.randomFloat(this.worldHeight * 0.2, this.worldHeight * 0.8);
                while (Helpers.distance(bx, by, this.worldWidth / 2, this.worldHeight / 2) < 400) {
                    bx = Helpers.randomFloat(this.worldWidth * 0.2, this.worldWidth * 0.8);
                    by = Helpers.randomFloat(this.worldHeight * 0.2, this.worldHeight * 0.8);
                }
                this.surfaceEnemies.push(this.createPlanetBoss(bx, by, p.id, bossData));
            }
        }

        // Station/Shop interactable
        if (p.isHub || p.hasStation || p.isStation) {
            this.interactables.push({
                x: this.worldWidth / 2 + 200, y: this.worldHeight / 2 - 150,
                size: 30, type: 'station', label: 'STATION', color: 0xffdd00
            });
        }

        // Planet shop
        var shopData = PLANET_SHOP_DATA[p.id];
        if (shopData) {
            this.interactables.push({
                x: this.worldWidth / 2 - 200, y: this.worldHeight / 2 + 200,
                size: 28, type: 'planet_shop', label: shopData.name, color: 0x00ffaa,
                shopData: shopData
            });
        }

        // Ship (landing zone)
        this.interactables.push({
            x: this.worldWidth / 2, y: this.worldHeight / 2 + 30,
            size: 25, type: 'ship', label: 'SHIP (E to leave)', color: COLORS.PRIMARY
        });

        // Quest giver NPC
        if (this.planetQuest) {
            this.interactables.push({
                x: this.worldWidth / 2 + 80, y: this.worldHeight / 2 - 80,
                size: 12, type: 'quest_npc', label: 'Quest: ' + this.planetQuest.title, color: COLORS.WARNING
            });
        }
    }

    getDecoColor(biome) {
        var bc = biome.groundColor;
        var r = ((bc >> 16) & 0xff) + Helpers.randomInt(-30, 30);
        var g = ((bc >> 8) & 0xff) + Helpers.randomInt(-30, 30);
        var b = (bc & 0xff) + Helpers.randomInt(-30, 30);
        return (Helpers.clamp(r, 0, 255) << 16) | (Helpers.clamp(g, 0, 255) << 8) | Helpers.clamp(b, 0, 255);
    }

    createPlanetBoss(x, y, planetId, bossData) {
        return {
            x: x, y: y, vx: 0, vy: 0,
            size: bossData.size, health: bossData.health, maxHealth: bossData.health,
            damage: bossData.damage, speed: bossData.speed, alive: true,
            rotation: Helpers.randomFloat(0, Math.PI * 2),
            isBoss: true, isPlanetBoss: true, planetId: planetId,
            color: bossData.color, name: bossData.name,
            state: 'patrol', patrolAngle: Helpers.randomFloat(0, Math.PI * 2),
            patrolTimer: 0, attackCooldown: 0, hitFlash: 0,
            xp: bossData.xp, credits: bossData.credits,
            type: 'boss_' + planetId, attackPattern: bossData.attackPattern,
            phase: 1, maxPhases: bossData.phases,
            specialTimer: 0, specialCooldown: 3000
        };
    }

    createSurfaceEnemy(x, y, level, isBoss) {
        return {
            x: x, y: y, vx: 0, vy: 0,
            size: isBoss ? 22 : 12,
            health: isBoss ? 200 + level * 30 : 20 + level * 8,
            maxHealth: isBoss ? 200 + level * 30 : 20 + level * 8,
            damage: isBoss ? 15 + level * 3 : 5 + level,
            speed: Helpers.randomFloat(40, 80), alive: true,
            rotation: Helpers.randomFloat(0, Math.PI * 2),
            isBoss: isBoss, color: isBoss ? COLORS.DANGER : Helpers.randomElement([0xff4444, 0x44ff44, 0xff8844, 0x8844ff]),
            state: 'patrol', patrolAngle: Helpers.randomFloat(0, Math.PI * 2),
            patrolTimer: 0, attackCooldown: 0, hitFlash: 0,
            xp: isBoss ? 100 + level * 20 : 10 + level * 3,
            credits: isBoss ? 200 + level * 30 : 15 + level * 5,
            type: Helpers.randomElement(['alien', 'drone', 'pirate'])
        };
    }

    getObstacleColor(biome) {
        var bc = biome.groundColor;
        var r = ((bc >> 16) & 0xff) + Helpers.randomInt(-20, 30);
        var g = ((bc >> 8) & 0xff) + Helpers.randomInt(-20, 30);
        var b = (bc & 0xff) + Helpers.randomInt(-20, 30);
        return (Helpers.clamp(r, 0, 255) << 16) | (Helpers.clamp(g, 0, 255) << 8) | Helpers.clamp(b, 0, 255);
    }

    // ============ STATIC TERRAIN ============
    drawStaticTerrain() {
        var g = this.terrainGraphics;
        var biome = this.biomeData;
        var baseColor = biome.groundColor;

        for (var ri = 0; ri < this.tiles.length; ri++) {
            var row = this.tiles[ri];
            for (var ci = 0; ci < row.length; ci++) {
                var tile = row[ci];
                var colorVar = this.getBiomeTileColor(tile.biome, baseColor, tile.height);
                g.fillStyle(colorVar, 1);
                g.fillRect(tile.x, tile.y, tile.size + 1, tile.size + 1);
                if (tile.height > 0.7 && Math.random() < 0.3) {
                    g.fillStyle(0x000000, 0.08);
                    g.fillCircle(tile.x + tile.size / 2, tile.y + tile.size / 2, Helpers.randomFloat(5, 15));
                }
            }
        }

        if (!this.useTerrainSpriteLayers) {
            // Draw decorations (static fallback)
            for (var di = 0; di < this.decorations.length; di++) {
                var deco = this.decorations[di];
                g.fillStyle(deco.color, 0.4);
                if (deco.type === 'grass' || deco.type === 'plant' || deco.type === 'spore') {
                    for (var blade = 0; blade < 3; blade++) {
                        var ba = deco.rotation + blade * 0.8;
                        g.lineStyle(1, deco.color, 0.5);
                        g.lineBetween(deco.x, deco.y, deco.x + Math.cos(ba) * deco.size, deco.y + Math.sin(ba) * deco.size);
                    }
                } else if (deco.type === 'pebble') {
                    g.fillCircle(deco.x, deco.y, deco.size * 0.5);
                } else if (deco.type === 'crack') {
                    g.lineStyle(1, 0x000000, 0.15);
                    g.lineBetween(deco.x, deco.y, deco.x + deco.size * 2, deco.y + deco.size);
                } else if (deco.type === 'moss') {
                    g.fillStyle(0x225522, 0.2);
                    g.fillCircle(deco.x, deco.y, deco.size);
                } else if (deco.type === 'vent') {
                    g.fillStyle(0x333333, 0.3);
                    g.fillCircle(deco.x, deco.y, deco.size * 0.8);
                    g.fillStyle(0x111111, 0.2);
                    g.fillCircle(deco.x, deco.y, deco.size * 0.4);
                }
            }

            // Draw obstacles (fallback)
            for (var oi = 0; oi < this.obstacles.length; oi++) {
                var obs = this.obstacles[oi];
                g.fillStyle(obs.color, 0.9);
                if (obs.type === 'rock') {
                    g.fillCircle(obs.x, obs.y, obs.size);
                    g.fillStyle(0x000000, 0.15);
                    g.fillCircle(obs.x + obs.size * 0.2, obs.y + obs.size * 0.2, obs.size * 0.7);
                } else if (obs.type === 'crystal') {
                    var s = obs.size;
                    g.fillStyle(0x88ccff, 0.5);
                    g.fillTriangle(obs.x, obs.y - s, obs.x - s * 0.5, obs.y + s * 0.5, obs.x + s * 0.5, obs.y + s * 0.5);
                    g.fillStyle(0xaaddff, 0.3);
                    g.fillTriangle(obs.x, obs.y - s * 0.6, obs.x - s * 0.3, obs.y + s * 0.3, obs.x + s * 0.3, obs.y + s * 0.3);
                } else if (obs.type === 'pillar') {
                    g.fillRect(obs.x - obs.size * 0.3, obs.y - obs.size, obs.size * 0.6, obs.size * 2);
                    g.fillStyle(0x000000, 0.1);
                    g.fillRect(obs.x - obs.size * 0.15, obs.y - obs.size * 0.8, obs.size * 0.3, obs.size * 1.6);
                } else if (obs.type === 'ruins') {
                    g.fillStyle(0x667788, 0.6);
                    g.fillRect(obs.x - obs.size * 0.5, obs.y - obs.size * 0.3, obs.size, obs.size * 0.6);
                    g.fillStyle(0x556677, 0.4);
                    g.fillRect(obs.x - obs.size * 0.3, obs.y - obs.size * 0.6, obs.size * 0.6, obs.size * 0.3);
                    g.fillStyle(0x000000, 0.1);
                    g.fillCircle(obs.x + obs.size * 0.1, obs.y, obs.size * 0.15);
                } else if (obs.type === 'plant') {
                    g.fillStyle(0x228833, 0.6);
                    g.fillCircle(obs.x, obs.y, obs.size * 0.7);
                    g.fillStyle(0x33aa44, 0.4);
                    g.fillCircle(obs.x - obs.size * 0.2, obs.y - obs.size * 0.3, obs.size * 0.4);
                    g.fillCircle(obs.x + obs.size * 0.3, obs.y - obs.size * 0.1, obs.size * 0.35);
                }
            }
        }
    }

    createTerrainSpriteLayers() {
        if (!this.useTerrainSpriteLayers || !this.terrainSpriteLayer) return;

        // Decorative sprite layer
        for (var di = 0; di < this.decorations.length; di++) {
            var deco = this.decorations[di];
            var localBiome = this.getBiomeAtWorldPosition(deco.x, deco.y);
            var decoKey = this.getDecoTextureKey(deco, localBiome);
            if (!decoKey || !this.textures.exists(decoKey)) continue;
            var decoStyle = this.getBiomeStyle(localBiome);

            var decoSprite = this.add.image(deco.x, deco.y, decoKey);
            decoSprite.setDepth(2);
            decoSprite.setTint(this.mixTint(deco.color || 0xffffff, decoStyle.tint));
            decoSprite.setAlpha(0.12 + decoStyle.decoAlphaBoost);
            decoSprite.setRotation(deco.rotation || 0);
            decoSprite.setScale(Helpers.clamp(((deco.size || 4) / 8) * decoStyle.decoScale, 0.28, 1.35));
            this.terrainSpriteLayer.add(decoSprite);
        }

        // Obstacle sprite layer
        for (var oi = 0; oi < this.obstacles.length; oi++) {
            var obs = this.obstacles[oi];
            var obsBiome = this.getBiomeAtWorldPosition(obs.x, obs.y);
            var obsKey = this.getObstacleTextureKey(obs, obsBiome);
            if (!obsKey || !this.textures.exists(obsKey)) continue;
            var obsStyle = this.getBiomeStyle(obsBiome);

            var obsSprite = this.add.image(obs.x, obs.y, obsKey);
            obsSprite.setDepth(3);
            obsSprite.setTint(this.mixTint(obs.color || 0xffffff, obsStyle.tint));
            obsSprite.setRotation(obs.rotation || 0);
            obsSprite.setScale(Helpers.clamp(((obs.size || 20) / 24) * obsStyle.obstacleScale, 0.4, 2.4));
            obsSprite.setAlpha(obs.type === 'crystal' ? (0.75 + obsStyle.crystalAlphaBoost) : (0.82 + obsStyle.obstacleAlphaBoost));
            this.terrainSpriteLayer.add(obsSprite);
        }
    }

    getObstacleTextureKey(obstacle, biomeName) {
        if (!obstacle) return null;
        // Biome-biased overrides first
        if ((biomeName === 'lava' || biomeName === 'volcanic' || biomeName === 'sulfur_plains') && obstacle.type !== 'crystal') {
            return this.textures.exists('terrain_ruins') ? 'terrain_ruins' : (this.textures.exists('terrain_rock') ? 'terrain_rock' : null);
        }
        if (biomeName === 'acid_lakes' && obstacle.type !== 'pillar') {
            return this.textures.exists('terrain_crystal') ? 'terrain_crystal' : (this.textures.exists('terrain_rock') ? 'terrain_rock' : null);
        }
        if ((biomeName === 'ice_caps' || biomeName === 'ice_plains' || biomeName === 'deep_ice' || biomeName === 'frozen_waste' || biomeName === 'nitrogen_ice') && obstacle.type !== 'plant') {
            return this.textures.exists('terrain_crystal') ? 'terrain_crystal' : (this.textures.exists('terrain_pillar') ? 'terrain_pillar' : null);
        }
        if ((biomeName === 'forest' || biomeName === 'moss') && obstacle.type !== 'ruins') {
            return this.textures.exists('terrain_plant') ? 'terrain_plant' : (this.textures.exists('terrain_rock') ? 'terrain_rock' : null);
        }

        if (obstacle.type === 'rock' && this.textures.exists('terrain_rock')) return 'terrain_rock';
        if (obstacle.type === 'crystal' && this.textures.exists('terrain_crystal')) return 'terrain_crystal';
        if (obstacle.type === 'pillar' && this.textures.exists('terrain_pillar')) return 'terrain_pillar';
        if (obstacle.type === 'ruins' && this.textures.exists('terrain_ruins')) return 'terrain_ruins';
        if (obstacle.type === 'plant' && this.textures.exists('terrain_plant')) return 'terrain_plant';
        return this.textures.exists('object_sprite') ? 'object_sprite' : null;
    }

    getDecoTextureKey(deco, biomeName) {
        if (!deco) return null;
        if (biomeName === 'lava' || biomeName === 'volcanic' || biomeName === 'sulfur_plains') {
            return this.textures.exists('terrain_crystal') ? 'terrain_crystal' : (this.textures.exists('terrain_deco') ? 'terrain_deco' : null);
        }
        if (biomeName === 'acid_lakes') {
            return this.textures.exists('terrain_plant') ? 'terrain_plant' : (this.textures.exists('terrain_deco') ? 'terrain_deco' : null);
        }
        if (biomeName === 'forest' || biomeName === 'moss') {
            return this.textures.exists('terrain_plant') ? 'terrain_plant' : (this.textures.exists('terrain_deco') ? 'terrain_deco' : null);
        }
        if (biomeName === 'ice_caps' || biomeName === 'ice_plains' || biomeName === 'deep_ice' || biomeName === 'frozen_waste' || biomeName === 'nitrogen_ice') {
            return this.textures.exists('terrain_crystal') ? 'terrain_crystal' : (this.textures.exists('terrain_deco') ? 'terrain_deco' : null);
        }
        if (deco.type === 'grass' || deco.type === 'moss' || deco.type === 'spore' || deco.type === 'plant') {
            return this.textures.exists('terrain_plant') ? 'terrain_plant' : null;
        }
        if (deco.type === 'pebble' || deco.type === 'crack' || deco.type === 'vent') {
            return this.textures.exists('terrain_deco') ? 'terrain_deco' : null;
        }
        return this.textures.exists('terrain_deco') ? 'terrain_deco' : null;
    }

    getBiomeAtWorldPosition(x, y) {
        if (!this.tiles || this.tiles.length === 0) return null;
        var tileSize = 60;
        var col = Helpers.clamp(Math.floor(x / tileSize), 0, this.tiles[0].length - 1);
        var row = Helpers.clamp(Math.floor(y / tileSize), 0, this.tiles.length - 1);
        var tile = this.tiles[row] && this.tiles[row][col];
        return tile ? tile.biome : null;
    }

    getBiomeStyle(biomeName) {
        var styles = {
            lava: { tint: 0xff7a2a, obstacleScale: 1.05, obstacleAlphaBoost: 0.05, crystalAlphaBoost: 0.08, decoScale: 0.9, decoAlphaBoost: 0.1 },
            volcanic: { tint: 0xcc7744, obstacleScale: 1.08, obstacleAlphaBoost: 0.05, crystalAlphaBoost: 0.06, decoScale: 0.95, decoAlphaBoost: 0.08 },
            sulfur_plains: { tint: 0xbba233, obstacleScale: 1.02, obstacleAlphaBoost: 0.04, crystalAlphaBoost: 0.05, decoScale: 0.9, decoAlphaBoost: 0.09 },
            acid_lakes: { tint: 0x99cc55, obstacleScale: 0.95, obstacleAlphaBoost: 0.02, crystalAlphaBoost: 0.08, decoScale: 1.05, decoAlphaBoost: 0.12 },
            forest: { tint: 0x66bb66, obstacleScale: 1.0, obstacleAlphaBoost: 0.03, crystalAlphaBoost: 0.02, decoScale: 1.1, decoAlphaBoost: 0.1 },
            ice_caps: { tint: 0xbfe7ff, obstacleScale: 1.06, obstacleAlphaBoost: 0.02, crystalAlphaBoost: 0.12, decoScale: 0.95, decoAlphaBoost: 0.08 },
            ice_plains: { tint: 0xcdeeff, obstacleScale: 1.06, obstacleAlphaBoost: 0.02, crystalAlphaBoost: 0.12, decoScale: 0.95, decoAlphaBoost: 0.08 },
            deep_ice: { tint: 0x99d6ff, obstacleScale: 1.08, obstacleAlphaBoost: 0.03, crystalAlphaBoost: 0.12, decoScale: 0.9, decoAlphaBoost: 0.08 },
            frozen_waste: { tint: 0xb8d8ee, obstacleScale: 1.04, obstacleAlphaBoost: 0.02, crystalAlphaBoost: 0.1, decoScale: 0.9, decoAlphaBoost: 0.07 },
            nitrogen_ice: { tint: 0xc8e6ff, obstacleScale: 1.04, obstacleAlphaBoost: 0.02, crystalAlphaBoost: 0.1, decoScale: 0.9, decoAlphaBoost: 0.07 }
        };
        return styles[biomeName] || { tint: 0xffffff, obstacleScale: 1, obstacleAlphaBoost: 0, crystalAlphaBoost: 0, decoScale: 1, decoAlphaBoost: 0.05 };
    }

    mixTint(baseColor, overlayColor) {
        var br = (baseColor >> 16) & 0xff;
        var bg = (baseColor >> 8) & 0xff;
        var bb = baseColor & 0xff;
        var or = (overlayColor >> 16) & 0xff;
        var og = (overlayColor >> 8) & 0xff;
        var ob = overlayColor & 0xff;
        var r = Math.floor(br * 0.55 + or * 0.45);
        var g = Math.floor(bg * 0.55 + og * 0.45);
        var b = Math.floor(bb * 0.55 + ob * 0.45);
        return (Helpers.clamp(r, 0, 255) << 16) | (Helpers.clamp(g, 0, 255) << 8) | Helpers.clamp(b, 0, 255);
    }

    getBiomeTileColor(biomeName, baseColor, height) {
        var r = (baseColor >> 16) & 0xff;
        var g = (baseColor >> 8) & 0xff;
        var b = baseColor & 0xff;
        var hv = (height - 0.5) * 30;
        switch (biomeName) {
            case 'rocky': case 'craters':
                return ((Helpers.clamp(r + hv, 0, 255) << 16) | (Helpers.clamp(g + hv - 5, 0, 255) << 8) | Helpers.clamp(b + hv - 5, 0, 255));
            case 'lava':
                return height > 0.6 ? 0xff4400 : ((Helpers.clamp(r + hv, 0, 255) << 16) | (Helpers.clamp(g - 10, 0, 255) << 8) | Helpers.clamp(b - 10, 0, 255));
            case 'volcanic': case 'sulfur_plains':
                return height > 0.7 ? 0xaa6600 : ((Helpers.clamp(r + hv, 0, 255) << 16) | (Helpers.clamp(g + hv, 0, 255) << 8) | Helpers.clamp(b - 15, 0, 255));
            case 'acid_lakes':
                return height > 0.65 ? 0x88aa22 : baseColor;
            case 'forest':
                return ((Helpers.clamp(r - 10, 0, 255) << 16) | (Helpers.clamp(g + hv + 10, 0, 255) << 8) | Helpers.clamp(b - 10, 0, 255));
            case 'ocean_shore':
                return height > 0.6 ? 0x2266aa : 0x88aa66;
            case 'mountains':
                return ((Helpers.clamp(r + hv + 15, 0, 255) << 16) | (Helpers.clamp(g + hv + 15, 0, 255) << 8) | Helpers.clamp(b + hv + 15, 0, 255));
            case 'desert': case 'canyons':
                return ((Helpers.clamp(r + hv, 0, 255) << 16) | (Helpers.clamp(g + hv - 10, 0, 255) << 8) | Helpers.clamp(b - 20, 0, 255));
            case 'ice_caps': case 'ice_plains': case 'deep_ice': case 'frozen_waste': case 'nitrogen_ice':
                return ((Helpers.clamp(180 + hv, 0, 255) << 16) | (Helpers.clamp(200 + hv, 0, 255) << 8) | Helpers.clamp(220 + hv, 0, 255));
            default:
                return ((Helpers.clamp(r + hv, 0, 255) << 16) | (Helpers.clamp(g + hv, 0, 255) << 8) | Helpers.clamp(b + hv, 0, 255));
        }
    }

    // ============ HUD ============
    createHUD(p) {
        this.add.text(GAME_WIDTH / 2, 12, p.name.toUpperCase(), {
            fontFamily: 'monospace', fontSize: '16px', color: '#' + p.color.toString(16).padStart(6, '0'),
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.healthText = this.add.text(15, 40, '', { fontFamily: 'monospace', fontSize: '11px', color: '#00ff66' });
        this.shieldText = this.add.text(15, 60, '', { fontFamily: 'monospace', fontSize: '11px', color: '#4488ff' });
        this.weaponText = this.add.text(15, GAME_HEIGHT - 70, '', { fontFamily: 'monospace', fontSize: '12px', color: '#00d4ff' });
        this.ammoText = this.add.text(15, GAME_HEIGHT - 50, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ffdd00' });
        this.abilityText = this.add.text(15, GAME_HEIGHT - 30, '', { fontFamily: 'monospace', fontSize: '10px', color: '#888899' });
        this.creditsText = this.add.text(GAME_WIDTH - 15, 55, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffdd00' }).setOrigin(1, 0);
        this.invText = this.add.text(GAME_WIDTH - 15, 75, '', { fontFamily: 'monospace', fontSize: '11px', color: '#888899' }).setOrigin(1, 0);
        this.statusText = this.add.text(GAME_WIDTH / 2, 35, '', { fontFamily: 'monospace', fontSize: '13px', color: '#00ff88', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        this.questStatusText = this.add.text(GAME_WIDTH - 15, GAME_HEIGHT - 90, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffdd00', wordWrap: { width: 250 } }).setOrigin(1, 0);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'WASD:Move | Mouse:Aim+Shoot | 1-4:Weapons | SHIFT:Dash | SPACE:Jet | Q:Shield | E:Interact | F:Shop', {
            fontFamily: 'monospace', fontSize: '9px', color: '#334455', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 1);

        this.weaponSlots = this.add.graphics();
        this.minimapG = this.add.graphics();
    }

    // ============ UPDATE LOOP ============
    update(time, delta) {
        var dt = delta;

        if (this.shopOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) || Phaser.Input.Keyboard.JustDown(this.keys.F)) {
                this.closePlanetShop();
            }
            return;
        }

        this.handleInput(dt);
        this.updatePlayer(dt);
        this.updateEnemies(dt);
        this.updateProjectiles(dt);
        this.updateCollectibles(dt);
        this.checkCollisions();
        this.updateParticles(dt);
        this.updateCamera();
        this.updateHazards(dt);

        this.bgGraphics.clear();
        this.entityGraphics.clear();
        this.playerGraphics.clear();
        this.projectileGraphics.clear();
        this.fxGraphics.clear();
        this.uiGraphics.clear();
        this.weaponSlots.clear();
        this.minimapG.clear();

        this.terrainGraphics.setPosition(-this.camX, -this.camY);
        if (this.terrainSpriteLayer) this.terrainSpriteLayer.setPosition(-this.camX, -this.camY);

        this.drawBackground();
        this.drawEntities();
        this.drawProjectiles();
        this.drawPlayer();
        this.drawParticles();
        this.drawHUDBars();
        this.drawWeaponSlots();
        this.drawMinimap();
        this.updateHUDText();
        this.updateNotificationDisplay(dt);
        this.cleanupPlanetSceneSprites();

        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.leavePlanet();
    }

    // ============ INPUT ============
    handleInput(dt) {
        var p = this.player;
        var moveX = 0, moveY = 0;
        if (this.keys.A.isDown || this.cursors.left.isDown) moveX -= 1;
        if (this.keys.D.isDown || this.cursors.right.isDown) moveX += 1;
        if (this.keys.W.isDown || this.cursors.up.isDown) moveY -= 1;
        if (this.keys.S.isDown || this.cursors.down.isDown) moveY += 1;
        if (moveX !== 0 && moveY !== 0) { moveX *= 0.707; moveY *= 0.707; }

        var speed = p.isDashing ? p.speed * 3 : p.speed;
        p.vx = moveX * speed;
        p.vy = moveY * speed;

        var pointer = this.input.activePointer;
        p.rotation = Math.atan2(pointer.y + this.camY - p.y, pointer.x + this.camX - p.x);

        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) p.currentWeapon = WEAPON_TYPES.PISTOL;
        if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && p.weapons.rifle.unlocked) p.currentWeapon = WEAPON_TYPES.RIFLE;
        if (Phaser.Input.Keyboard.JustDown(this.keys.THREE) && p.weapons.shotgun.unlocked) p.currentWeapon = WEAPON_TYPES.SHOTGUN;
        if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR) && p.weapons.cannon.unlocked) p.currentWeapon = WEAPON_TYPES.CANNON;

        if (this.mouseDown) this.fireWeapon(dt);

        if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) && p.dashCooldown <= 0 && (moveX !== 0 || moveY !== 0)) {
            p.isDashing = true; p.dashTimer = 150; p.dashCooldown = 1500;
            for (var i = 0; i < 5; i++) {
                this.particles.push({ x: p.x, y: p.y, vx: Helpers.randomFloat(-30, 30), vy: Helpers.randomFloat(-30, 30), life: 300, maxLife: 300, type: 'spark', color: COLORS.PRIMARY, size: 3 });
            }
        }

        if (this.keys.SPACE.isDown && p.jetpackFuel > 0) {
            p.jetpackActive = true; p.jetpackFuel -= 20 * (dt / 1000); p.speed = 220;
            if (Math.random() < 0.3) this.particles.push({ x: p.x, y: p.y + 5, vx: Helpers.randomFloat(-20, 20), vy: Helpers.randomFloat(10, 30), life: 300, maxLife: 300, type: 'spark', color: 0xff8800, size: 2 });
        } else {
            p.jetpackActive = false; p.speed = 160;
            p.jetpackFuel = Math.min(100, p.jetpackFuel + 10 * (dt / 1000));
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.Q) && p.shieldCooldown <= 0) {
            p.shieldActive = !p.shieldActive;
            if (p.shieldActive) { p.shieldTimer = 5000; p.shieldHP = p.maxShieldHP; }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.checkInteraction();
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.tryOpenPlanetShop();

        if (p.dashTimer > 0) { p.dashTimer -= dt; } else { p.isDashing = false; }
        if (p.dashCooldown > 0) p.dashCooldown -= dt;
        if (p.shieldCooldown > 0) p.shieldCooldown -= dt;
        if (p.shieldActive) {
            p.shieldTimer -= dt;
            if (p.shieldTimer <= 0 || p.shieldHP <= 0) { p.shieldActive = false; p.shieldCooldown = 8000; }
        }
        if (p.invincible > 0) p.invincible -= dt;
    }

    fireWeapon(dt) {
        var p = this.player;
        var weaponState = p.weapons[p.currentWeapon];
        var weaponData = WEAPON_DATA[p.currentWeapon];
        if (!weaponState || !weaponState.unlocked) return;
        if (weaponState.fireTimer > 0) { weaponState.fireTimer -= dt; return; }
        if (weaponState.ammo !== Infinity && weaponState.ammo <= 0) { this.addNotification('Out of ammo!', COLORS.DANGER); return; }

        weaponState.fireTimer = weaponData.fireRate;
        if (weaponState.ammo !== Infinity) weaponState.ammo--;

        var projCount = weaponData.projectiles || 1;
        for (var i = 0; i < projCount; i++) {
            var spread = (Math.random() - 0.5) * (weaponData.spread || 0) * 2;
            var angle = p.rotation + spread;
            var spawnDist = p.size + 5;
            this.projectiles.push({
                x: p.x + Math.cos(angle) * spawnDist, y: p.y + Math.sin(angle) * spawnDist,
                vx: Math.cos(angle) * weaponData.speed, vy: Math.sin(angle) * weaponData.speed,
                damage: weaponData.damage + Math.floor(this.ship.damage * 0.5),
                size: weaponData.explosive ? 5 : 3, color: weaponData.color,
                isPlayer: true, life: (weaponData.range / weaponData.speed) * 1000,
                explosive: weaponData.explosive || false, explosionRadius: weaponData.explosionRadius || 0
            });
        }
    }

    // ============ PHYSICS ============
    updatePlayer(dt) {
        var p = this.player;
        p.x += p.vx * (dt / 1000);
        p.y += p.vy * (dt / 1000);
        p.x = Helpers.clamp(p.x, 20, this.worldWidth - 20);
        p.y = Helpers.clamp(p.y, 20, this.worldHeight - 20);

        for (var oi = 0; oi < this.obstacles.length; oi++) {
            var obs = this.obstacles[oi];
            var dist = Helpers.distance(p.x, p.y, obs.x, obs.y);
            if (dist < p.size + obs.size) {
                var angle = Math.atan2(p.y - obs.y, p.x - obs.x);
                p.x += Math.cos(angle) * (p.size + obs.size - dist);
                p.y += Math.sin(angle) * (p.size + obs.size - dist);
            }
        }

        var wk = Object.keys(p.weapons);
        for (var wi = 0; wi < wk.length; wi++) {
            if (p.weapons[wk[wi]].fireTimer > 0) p.weapons[wk[wi]].fireTimer -= dt;
        }
    }

    updateEnemies(dt) {
        var pl = this.player;
        for (var ei = 0; ei < this.surfaceEnemies.length; ei++) {
            var enemy = this.surfaceEnemies[ei];
            if (!enemy.alive) continue;
            var distToPlayer = Helpers.distance(enemy.x, enemy.y, pl.x, pl.y);

            if (distToPlayer < (enemy.isBoss ? 400 : 300)) {
                enemy.state = distToPlayer < (enemy.isBoss ? 120 : 80) ? 'attack' : 'chase';
            } else {
                enemy.state = 'patrol';
            }

            switch (enemy.state) {
                case 'patrol':
                    enemy.patrolTimer -= dt;
                    if (enemy.patrolTimer <= 0) { enemy.patrolAngle = Helpers.randomFloat(0, Math.PI * 2); enemy.patrolTimer = Helpers.randomFloat(2000, 4000); }
                    enemy.x += Math.cos(enemy.patrolAngle) * enemy.speed * 0.5 * (dt / 1000);
                    enemy.y += Math.sin(enemy.patrolAngle) * enemy.speed * 0.5 * (dt / 1000);
                    enemy.rotation = enemy.patrolAngle;
                    break;
                case 'chase':
                    var chaseAngle = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
                    enemy.x += Math.cos(chaseAngle) * enemy.speed * (dt / 1000);
                    enemy.y += Math.sin(chaseAngle) * enemy.speed * (dt / 1000);
                    enemy.rotation = chaseAngle;
                    break;
                case 'attack':
                    enemy.rotation = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
                    if (enemy.attackCooldown <= 0 && pl.invincible <= 0) {
                        var dmg = enemy.damage;
                        if (pl.shieldActive && pl.shieldHP > 0) { pl.shieldHP -= dmg; dmg = 0; if (pl.shieldHP < 0) { dmg = -pl.shieldHP; pl.shieldHP = 0; } }
                        if (dmg > 0) { pl.health -= dmg; pl.invincible = 500; }
                        enemy.attackCooldown = enemy.isBoss ? 600 : 1000;
                        var kbAngle = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
                        pl.x += Math.cos(kbAngle) * 30;
                        pl.y += Math.sin(kbAngle) * 30;
                        this.particles.push({ x: pl.x, y: pl.y - pl.size, vx: 0, vy: -40, life: 600, maxLife: 600, type: 'text', text: '-' + enemy.damage, color: COLORS.DANGER });
                        if (pl.health <= 0) { this.playerDied(); return; }
                    }
                    break;
            }

            // Boss special attacks
            if (enemy.isPlanetBoss && enemy.alive) {
                // Phase transitions
                if (enemy.maxPhases >= 2 && enemy.health < enemy.maxHealth * 0.5 && enemy.phase === 1) {
                    enemy.phase = 2; enemy.speed *= 1.2; enemy.damage = Math.floor(enemy.damage * 1.3);
                    this.addNotification(enemy.name + ' enters Phase 2!', COLORS.DANGER);
                }
                if (enemy.maxPhases >= 3 && enemy.health < enemy.maxHealth * 0.25 && enemy.phase === 2) {
                    enemy.phase = 3; enemy.speed *= 1.2; enemy.damage = Math.floor(enemy.damage * 1.3);
                    this.addNotification(enemy.name + ' enters Phase 3! ENRAGED!', COLORS.DANGER);
                }

                // Special attack patterns
                enemy.specialTimer -= dt;
                if (enemy.specialTimer <= 0 && distToPlayer < 400) {
                    enemy.specialTimer = enemy.specialCooldown / enemy.phase;
                    this.doBossSpecialAttack(enemy);
                }
            }

            // Ranged attacks
            if (enemy.state === 'chase' && distToPlayer > 100 && distToPlayer < 300 && enemy.attackCooldown <= 0) {
                var fireAngle = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
                this.projectiles.push({
                    x: enemy.x + Math.cos(fireAngle) * enemy.size,
                    y: enemy.y + Math.sin(fireAngle) * enemy.size,
                    vx: Math.cos(fireAngle) * 300, vy: Math.sin(fireAngle) * 300,
                    damage: enemy.damage * 0.6, size: 3, color: COLORS.DANGER,
                    isPlayer: false, life: 1500, explosive: false, explosionRadius: 0
                });
                enemy.attackCooldown = enemy.isBoss ? 800 : 1500;
            }

            enemy.x = Helpers.clamp(enemy.x, 20, this.worldWidth - 20);
            enemy.y = Helpers.clamp(enemy.y, 20, this.worldHeight - 20);

            for (var oi2 = 0; oi2 < this.obstacles.length; oi2++) {
                var obs2 = this.obstacles[oi2];
                if (Helpers.distance(enemy.x, enemy.y, obs2.x, obs2.y) < enemy.size + obs2.size) {
                    var pushAngle = Math.atan2(enemy.y - obs2.y, enemy.x - obs2.x);
                    enemy.x += Math.cos(pushAngle) * 2;
                    enemy.y += Math.sin(pushAngle) * 2;
                }
            }

            if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;
            if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
        }
    }

    doBossSpecialAttack(enemy) {
        var pl = this.player;
        switch (enemy.attackPattern) {
            case 'charge':
                var ca = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
                enemy.x += Math.cos(ca) * 150;
                enemy.y += Math.sin(ca) * 150;
                for (var i = 0; i < 8; i++) this.particles.push({ x: enemy.x, y: enemy.y, vx: Helpers.randomFloat(-80, 80), vy: Helpers.randomFloat(-80, 80), life: 400, maxLife: 400, type: 'spark', color: enemy.color, size: 4 });
                break;
            case 'spray': case 'multihead':
                for (var s = 0; s < (enemy.phase + 2); s++) {
                    var sa = (s / (enemy.phase + 2)) * Math.PI * 2;
                    this.projectiles.push({
                        x: enemy.x + Math.cos(sa) * enemy.size, y: enemy.y + Math.sin(sa) * enemy.size,
                        vx: Math.cos(sa) * 250, vy: Math.sin(sa) * 250,
                        damage: enemy.damage * 0.4, size: 4, color: enemy.color,
                        isPlayer: false, life: 2000, explosive: false, explosionRadius: 0
                    });
                }
                break;
            case 'turret': case 'lightning':
                for (var t = 0; t < 3; t++) {
                    var ta2 = Math.atan2(pl.y - enemy.y, pl.x - enemy.x) + (t - 1) * 0.3;
                    this.projectiles.push({
                        x: enemy.x + Math.cos(ta2) * enemy.size, y: enemy.y + Math.sin(ta2) * enemy.size,
                        vx: Math.cos(ta2) * 400, vy: Math.sin(ta2) * 400,
                        damage: enemy.damage * 0.5, size: 4, color: 0xffff00,
                        isPlayer: false, life: 1500, explosive: false, explosionRadius: 0
                    });
                }
                break;
            case 'shatter':
                for (var sh = 0; sh < 6; sh++) {
                    var sha = Helpers.randomFloat(0, Math.PI * 2);
                    this.projectiles.push({
                        x: enemy.x + Math.cos(sha) * enemy.size * 1.5, y: enemy.y + Math.sin(sha) * enemy.size * 1.5,
                        vx: Math.cos(sha) * 200, vy: Math.sin(sha) * 200,
                        damage: enemy.damage * 0.3, size: 5, color: 0x88ccff,
                        isPlayer: false, life: 2500, explosive: true, explosionRadius: 30
                    });
                }
                break;
            case 'teleport':
                enemy.x = pl.x + Helpers.randomFloat(-150, 150);
                enemy.y = pl.y + Helpers.randomFloat(-150, 150);
                for (var tp = 0; tp < 10; tp++) this.particles.push({ x: enemy.x, y: enemy.y, vx: Helpers.randomFloat(-100, 100), vy: Helpers.randomFloat(-100, 100), life: 500, maxLife: 500, type: 'spark', color: 0x8822dd, size: 5 });
                break;
            default:
                var da = Math.atan2(pl.y - enemy.y, pl.x - enemy.x);
                this.projectiles.push({
                    x: enemy.x + Math.cos(da) * enemy.size, y: enemy.y + Math.sin(da) * enemy.size,
                    vx: Math.cos(da) * 350, vy: Math.sin(da) * 350,
                    damage: enemy.damage * 0.8, size: 6, color: enemy.color,
                    isPlayer: false, life: 2000, explosive: true, explosionRadius: 40
                });
                break;
        }
    }

    updateProjectiles(dt) {
        for (var pi = 0; pi < this.projectiles.length; pi++) {
            var proj = this.projectiles[pi];
            proj.x += proj.vx * (dt / 1000);
            proj.y += proj.vy * (dt / 1000);
            proj.life -= dt;
            if (proj.x < 0 || proj.x > this.worldWidth || proj.y < 0 || proj.y > this.worldHeight) proj.life = 0;
            for (var oi3 = 0; oi3 < this.obstacles.length; oi3++) {
                var obs3 = this.obstacles[oi3];
                if (Helpers.distance(proj.x, proj.y, obs3.x, obs3.y) < obs3.size + proj.size) {
                    proj.life = 0;
                    if (proj.explosive) this.createExplosion(proj.x, proj.y, proj.explosionRadius, proj.color);
                    break;
                }
            }
        }
        this.projectiles = this.projectiles.filter(function(p) { return p.life > 0; });
    }

    checkCollisions() {
        var pl = this.player;
        for (var pi2 = 0; pi2 < this.projectiles.length; pi2++) {
            var proj = this.projectiles[pi2];
            if (!proj.isPlayer || proj.life <= 0) continue;
            for (var ei2 = 0; ei2 < this.surfaceEnemies.length; ei2++) {
                var enemy = this.surfaceEnemies[ei2];
                if (!enemy.alive) continue;
                if (Helpers.distance(proj.x, proj.y, enemy.x, enemy.y) < enemy.size + proj.size) {
                    proj.life = 0;
                    enemy.health -= proj.damage;
                    enemy.hitFlash = 150;
                    this.particles.push({ x: enemy.x, y: enemy.y - enemy.size, vx: Helpers.randomFloat(-20, 20), vy: -60, life: 600, maxLife: 600, type: 'text', text: '-' + Math.floor(proj.damage), color: COLORS.WARNING });
                    if (proj.explosive) {
                        this.createExplosion(proj.x, proj.y, proj.explosionRadius, proj.color);
                        for (var ei3 = 0; ei3 < this.surfaceEnemies.length; ei3++) {
                            var other = this.surfaceEnemies[ei3];
                            if (!other.alive || other === enemy) continue;
                            if (Helpers.distance(proj.x, proj.y, other.x, other.y) < proj.explosionRadius) {
                                other.health -= proj.damage * 0.5; other.hitFlash = 150;
                                if (other.health <= 0) this.killEnemy(other);
                            }
                        }
                    }
                    if (enemy.health <= 0) this.killEnemy(enemy);
                    break;
                }
            }
        }

        for (var pi3 = 0; pi3 < this.projectiles.length; pi3++) {
            var eProj = this.projectiles[pi3];
            if (eProj.isPlayer || eProj.life <= 0) continue;
            if (Helpers.distance(eProj.x, eProj.y, pl.x, pl.y) < pl.size + eProj.size) {
                eProj.life = 0;
                var dmg = eProj.damage;
                if (pl.shieldActive && pl.shieldHP > 0) { pl.shieldHP -= dmg; dmg = 0; if (pl.shieldHP < 0) { dmg = -pl.shieldHP; pl.shieldHP = 0; } }
                if (dmg > 0 && pl.invincible <= 0) { pl.health -= dmg; pl.invincible = 300; if (pl.health <= 0) this.playerDied(); }
            }
        }
    }

    createExplosion(x, y, radius, color) {
        for (var i = 0; i < 15; i++) {
            var angle = Helpers.randomFloat(0, Math.PI * 2);
            var speed = Helpers.randomFloat(30, 120);
            this.particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 500, maxLife: 500, type: 'spark', color: Helpers.randomElement([color, 0xff8800, 0xffaa00, 0xffffff]), size: Helpers.randomFloat(2, 6) });
        }
    }

    updateCollectibles(dt) {
        var pl = this.player;
        for (var ci = 0; ci < this.collectibles.length; ci++) {
            var item = this.collectibles[ci];
            if (!item.alive) continue;
            item.bobPhase += dt / 300;
            if (Helpers.distance(item.x, item.y, pl.x, pl.y) < 25) {
                item.alive = false;
                this.collectItem(item.data);
                for (var fi = 0; fi < 6; fi++) this.particles.push({ x: item.x, y: item.y, vx: Helpers.randomFloat(-50, 50), vy: Helpers.randomFloat(-50, 50), life: 400, maxLife: 400, type: 'spark', color: item.color, size: Helpers.randomFloat(2, 4) });
            }
        }
    }

    updateParticles(dt) {
        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].x += this.particles[i].vx * (dt / 1000);
            this.particles[i].y += this.particles[i].vy * (dt / 1000);
            this.particles[i].life -= dt;
        }
        this.particles = this.particles.filter(function(p) { return p.life > 0; });
    }

    updateCamera() {
        var targetX = this.player.x - GAME_WIDTH / 2;
        var targetY = this.player.y - GAME_HEIGHT / 2;
        this.camX = Helpers.lerp(this.camX, Helpers.clamp(targetX, 0, this.worldWidth - GAME_WIDTH), 0.1);
        this.camY = Helpers.lerp(this.camY, Helpers.clamp(targetY, 0, this.worldHeight - GAME_HEIGHT), 0.1);
    }

    updateHazards(dt) {
        if (!this.biomeData.hazard) return;
        this.hazardTimer -= dt;
        if (this.hazardTimer > 0) return;
        this.hazardTimer = 5000;
        switch (this.biomeData.hazard) {
            case 'heat': this.player.health -= 2; this.addNotification('Extreme heat!', COLORS.DANGER); break;
            case 'acid': this.player.health -= 3; this.addNotification('Acid atmosphere!', COLORS.DANGER); break;
            case 'cold': this.player.speed = Math.max(100, this.player.speed - 10); this.addNotification('Freezing cold!', COLORS.SHIELD); break;
            case 'radiation': if (Math.random() < 0.3) { this.player.health -= 5; this.addNotification('Radiation burst!', COLORS.DANGER); } break;
        }
    }

    // ============ PLANET SHOP ============
    tryOpenPlanetShop() {
        for (var i = 0; i < this.interactables.length; i++) {
            var obj = this.interactables[i];
            if (obj.type === 'planet_shop' && Helpers.distance(this.player.x, this.player.y, obj.x, obj.y) < 60) {
                this.openPlanetShop(obj);
                return;
            }
        }
    }

    openPlanetShop(shopObj) {
        this.shopOpen = true;
        this.shopContainer = this.add.container(0, 0);

        var overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.shopContainer.add(overlay);

        var panel = this.add.graphics();
        panel.fillStyle(COLORS.BG_PANEL, 0.95);
        panel.fillRoundedRect(GAME_WIDTH / 2 - 260, 60, 520, 560, 12);
        panel.lineStyle(2, 0x00ffaa, 0.8);
        panel.strokeRoundedRect(GAME_WIDTH / 2 - 260, 60, 520, 560, 12);
        this.shopContainer.add(panel);

        var title = this.add.text(GAME_WIDTH / 2, 85, '★ ' + shopObj.shopData.name + ' ★', {
            fontFamily: 'monospace', fontSize: '18px', color: '#00ffaa', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.shopContainer.add(title);

        var credits = this.add.text(GAME_WIDTH / 2, 115, 'Credits: ' + Helpers.formatNumber(this.ship.credits) + ' CR', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffdd00'
        }).setOrigin(0.5);
        this.shopContainer.add(credits);
        this.planetShopCredits = credits;

        // Standard items
        var items = [
            { id: 'ps_repair', name: 'Full Repair', cost: 50, desc: 'Fully restore HP', effect: { health: 999 } },
            { id: 'ps_ammo_rifle', name: 'Rifle Ammo x30', cost: 25, desc: 'Ammo for Pulse Rifle', effect: { ammo_rifle: 30 } },
            { id: 'ps_ammo_shotgun', name: 'Shotgun Ammo x10', cost: 25, desc: 'Ammo for Scatter Blaster', effect: { ammo_shotgun: 10 } },
            { id: 'ps_ammo_cannon', name: 'Cannon Ammo x5', cost: 40, desc: 'Ammo for Nova Cannon', effect: { ammo_cannon: 5 } },
        ];

        // Add special item
        if (shopObj.shopData.specialItem) {
            items.push(shopObj.shopData.specialItem);
        }

        var startY = 145;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var iy = startY + i * 80;

            var bg = this.add.graphics();
            bg.fillStyle(0x111133, 0.8);
            bg.fillRoundedRect(GAME_WIDTH / 2 - 230, iy, 460, 68, 6);
            bg.lineStyle(1, 0x00ffaa, 0.2);
            bg.strokeRoundedRect(GAME_WIDTH / 2 - 230, iy, 460, 68, 6);
            this.shopContainer.add(bg);

            var nm = this.add.text(GAME_WIDTH / 2 - 210, iy + 10, item.name, { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', fontStyle: 'bold' });
            this.shopContainer.add(nm);
            var ds = this.add.text(GAME_WIDTH / 2 - 210, iy + 30, item.desc, { fontFamily: 'monospace', fontSize: '10px', color: '#888899' });
            this.shopContainer.add(ds);
            var ct = this.add.text(GAME_WIDTH / 2 + 130, iy + 10, item.cost + ' CR', { fontFamily: 'monospace', fontSize: '12px', color: '#ffdd00' });
            this.shopContainer.add(ct);

            var btn = Helpers.createButton(this, GAME_WIDTH / 2 + 160, iy + 48, 90, 24, 'BUY', (function(itm) {
                return function() { this.buyPlanetShopItem(itm); }.bind(this);
            }.bind(this))(item), this.ship.credits >= item.cost ? COLORS.SUCCESS : COLORS.DANGER);
            this.shopContainer.add(btn);
        }

        var closeBtn = Helpers.createButton(this, GAME_WIDTH / 2, 580, 150, 36, 'Close [F/ESC]', function() { this.closePlanetShop(); }.bind(this), 0x666688);
        this.shopContainer.add(closeBtn);
    }

    buyPlanetShopItem(item) {
        if (this.ship.credits < item.cost) { this.addNotification('Not enough credits!', COLORS.DANGER); return; }
        this.ship.credits -= item.cost;
        var eff = item.effect;
        if (eff.health) { this.player.health = Math.min(this.player.maxHealth, this.player.health + eff.health); }
        if (eff.ammo_rifle) { this.player.weapons.rifle.ammo += eff.ammo_rifle; }
        if (eff.ammo_shotgun) { this.player.weapons.shotgun.ammo += eff.ammo_shotgun; }
        if (eff.ammo_cannon) { this.player.weapons.cannon.ammo += eff.ammo_cannon; }
        if (eff.shield) { this.player.maxShieldHP += eff.shield; this.player.shieldHP = this.player.maxShieldHP; }
        if (eff.damage) { this.ship.damage += eff.damage; }
        if (eff.maxHealth) { this.player.maxHealth += eff.maxHealth; this.ship.maxHealth += eff.maxHealth; }
        if (eff.speed) { this.player.speed += eff.speed; }
        if (eff.jetpackFuel) { this.player.jetpackFuel = Math.min(100, this.player.jetpackFuel + eff.jetpackFuel); }
        this.addNotification('Bought ' + item.name + '!', COLORS.SUCCESS);
        if (this.planetShopCredits) this.planetShopCredits.setText('Credits: ' + Helpers.formatNumber(this.ship.credits) + ' CR');
    }

    closePlanetShop() {
        if (this.shopContainer) { this.shopContainer.destroy(); this.shopContainer = null; }
        this.shopOpen = false;
    }

    // ============ INTERACTION ============
    checkInteraction() {
        var pl = this.player;
        for (var i = 0; i < this.interactables.length; i++) {
            var obj = this.interactables[i];
            if (Helpers.distance(pl.x, pl.y, obj.x, obj.y) > 50) continue;
            switch (obj.type) {
                case 'ship':
                    this.leavePlanet();
                    return;
                case 'station':
                    this.addNotification('Station: Upgrades available in orbit!', COLORS.PRIMARY);
                    return;
                case 'planet_shop':
                    this.openPlanetShop(obj);
                    return;
                case 'quest_npc':
                    if (this.planetQuest) {
                        var prog = this.getQuestProgress();
                        if (prog.complete) {
                            this.completePlanetQuest();
                        } else {
                            this.addNotification('Quest: ' + this.planetQuest.description + ' (' + prog.current + '/' + prog.target + ')', COLORS.WARNING);
                        }
                    }
                    return;
            }
        }
    }

    getQuestProgress() {
        if (!this.planetQuest) return { current: 0, target: 1, complete: false };
        var q = this.planetQuest;
        var current = 0;
        var target = q.target;
        switch (q.type) {
            case 'kill':
                current = this.player.killCount;
                break;
            case 'boss':
                current = this.bossDefeated ? 1 : 0; target = 1;
                break;
            case 'collect':
                current = this.player.collectCount[q.collectType] || 0;
                break;
            case 'explore':
                current = this.questObjectivesCompleted.explored ? 1 : 0; target = 1;
                break;
            default:
                current = this.player.killCount; break;
        }
        return { current: current, target: target, complete: current >= target };
    }

    completePlanetQuest() {
        var q = this.planetQuest;
        if (!q) return;
        this.ship.credits += q.reward.credits || 0;
        this.ship.xp += q.reward.xp || 0;
        if (!this.ship.completedPlanetQuests) this.ship.completedPlanetQuests = [];
        this.ship.completedPlanetQuests.push(this.planetQuestId);
        this.addNotification('★ QUEST COMPLETE: ' + q.title + '! +' + (q.reward.credits || 0) + ' CR +' + (q.reward.xp || 0) + ' XP', COLORS.SUCCESS);
        this.planetQuest = null; // prevent re-completion
    }

    // ============ ENEMY / LOOT LOGIC ============
    killEnemy(enemy) {
        enemy.alive = false;
        this.player.killCount++;

        // XP + Credits
        this.ship.xp += enemy.xp;
        this.ship.credits += enemy.credits;
        this.addNotification('+' + enemy.credits + ' CR, +' + enemy.xp + ' XP', COLORS.SUCCESS);

        // Death particles
        for (var i = 0; i < 10; i++) {
            var a = Helpers.randomFloat(0, Math.PI * 2);
            this.particles.push({ x: enemy.x, y: enemy.y, vx: Math.cos(a) * Helpers.randomFloat(40, 120), vy: Math.sin(a) * Helpers.randomFloat(40, 120), life: 600, maxLife: 600, type: 'spark', color: enemy.color, size: Helpers.randomFloat(2, 5) });
        }

        // Boss kill
        if (enemy.isPlanetBoss) {
            this.bossDefeated = true;
            if (!this.ship.planetBossesDefeated) this.ship.planetBossesDefeated = [];
            if (!this.ship.planetBossesDefeated.includes(enemy.planetId)) {
                this.ship.planetBossesDefeated.push(enemy.planetId);
            }
            this.addNotification('★ BOSS DEFEATED: ' + enemy.name + '! ★', COLORS.WARNING);
            // Drop bonus loot
            for (var bi = 0; bi < 3; bi++) {
                var bx = enemy.x + Helpers.randomFloat(-30, 30);
                var by = enemy.y + Helpers.randomFloat(-30, 30);
                var loot = this.getRandomPlanetLoot(this.planetData, true);
                this.collectibles.push({ x: bx, y: by, size: 10, alive: true, data: loot, bobPhase: Helpers.randomFloat(0, Math.PI * 2), color: Helpers.rarityColor(loot.rarity) });
            }
        }

        // Quest progress
        var completed = this.questSystem.updateProgress('enemy_kill', { enemyType: enemy.type });
        if (completed) { for (var qi = 0; qi < completed.length; qi++) this.showQuestComplete(completed[qi]); }

        // Level check
        this.checkLevelUp();
    }

    checkLevelUp() {
        var xpNeeded = this.ship.level * 100;
        while (this.ship.xp >= xpNeeded) {
            this.ship.xp -= xpNeeded;
            this.ship.level++;
            this.addNotification('LEVEL UP! Now level ' + this.ship.level, COLORS.WARNING);
            this.ship.maxHealth += 5;
            this.ship.damage += 1;
            this.player.maxHealth = this.ship.maxHealth;
            this.player.health = this.player.maxHealth;
            xpNeeded = this.ship.level * 100;
        }
    }

    getRandomPlanetLoot(p, isBoss) {
        var rarity = 'common';
        var roll = Math.random();
        if (isBoss) {
            if (roll < 0.3) rarity = 'legendary';
            else if (roll < 0.6) rarity = 'rare';
            else rarity = 'uncommon';
        } else {
            if (roll < 0.05) rarity = 'legendary';
            else if (roll < 0.15) rarity = 'rare';
            else if (roll < 0.35) rarity = 'uncommon';
        }
        var names = { common: ['Scrap', 'Mineral', 'Ore Chunk'], uncommon: ['Refined Ore', 'Crystal Shard', 'Data Chip'], rare: ['Exotic Gem', 'Alien Artifact', 'Power Cell'], legendary: ['Ancient Relic', 'Dark Matter Core', 'Quantum Crystal'] };
        var values = { common: 10, uncommon: 30, rare: 80, legendary: 200 };
        return {
            name: Helpers.randomElement(names[rarity] || names.common),
            rarity: rarity,
            value: values[rarity] + Helpers.randomInt(0, 20),
            type: 'material'
        };
    }

    collectItem(data) {
        this.ship.credits += data.value;
        this.inventory.addItem(data);
        this.player.collectCount[data.type] = (this.player.collectCount[data.type] || 0) + 1;
        this.addNotification('+' + data.name + ' (' + data.rarity + ') +' + data.value + ' CR', Helpers.rarityColor(data.rarity));
    }

    playerDied() {
        this.ship.health = Math.floor(this.ship.maxHealth * 0.3);
        this.saveSystem.save(this.ship, this.questSystem, this.inventory);
        this.scene.start('GameOverScene', { from: 'planet' });
    }

    leavePlanet() {
        this.ship.health = this.player.health;
        if (!this.ship.planetQuestProgress) this.ship.planetQuestProgress = {};
        this.ship.planetQuestProgress[this.planetQuestId] = this.questObjectivesCompleted;
        this.saveSystem.save(this.ship, this.questSystem, this.inventory);
        this.scene.start('SpaceScene', { stage: this.stage });
    }

    // ============ DRAWING ============
    drawBackground() {
        var g = this.bgGraphics;
        var skyColors = this.biomeData.skyColors || [0x0a0a1a, 0x111133];
        g.fillStyle(skyColors[0], 1);
        g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    drawEntities() {
        var g = this.entityGraphics;
        var cx = this.camX, cy = this.camY;
        var t = this.time.now;

        // Draw collectibles
        for (var ci = 0; ci < this.collectibles.length; ci++) {
            var item = this.collectibles[ci];
            if (!item.alive) continue;
            var sx = item.x - cx, sy = item.y - cy + Math.sin(item.bobPhase) * 3;
            if (sx < -20 || sx > GAME_WIDTH + 20 || sy < -20 || sy > GAME_HEIGHT + 20) {
                this.tryRenderPlanetCollectibleSprite(item, sx, sy, true);
                continue;
            }
            if (this.tryRenderPlanetCollectibleSprite(item, sx, sy, false)) continue;
            g.fillStyle(item.color, 0.9);
            g.fillCircle(sx, sy, item.size);
            g.fillStyle(0xffffff, 0.3 + Math.sin(t / 200) * 0.2);
            g.fillCircle(sx, sy, item.size * 0.5);
        }

        // Draw interactables
        for (var ii = 0; ii < this.interactables.length; ii++) {
            var obj = this.interactables[ii];
            var ix = obj.x - cx, iy = obj.y - cy;
            if (ix < -40 || ix > GAME_WIDTH + 40 || iy < -40 || iy > GAME_HEIGHT + 40) {
                this.tryRenderPlanetInteractableSprite(obj, ix, iy, true);
                continue;
            }
            if (this.tryRenderPlanetInteractableSprite(obj, ix, iy, false)) {
                var distToObjSprite = Helpers.distance(this.player.x, this.player.y, obj.x, obj.y);
                if (distToObjSprite < 100) {
                    if (!obj._label) {
                        obj._label = this.add.text(0, 0, obj.label, { fontFamily: 'monospace', fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5).setDepth(200);
                    }
                    obj._label.setPosition(ix, iy - obj.size - 14);
                    obj._label.setVisible(true);
                } else if (obj._label) {
                    obj._label.setVisible(false);
                }
                continue;
            }

            g.fillStyle(obj.color, 0.15);
            g.fillCircle(ix, iy, obj.size + 8 + Math.sin(t / 300) * 3);
            g.fillStyle(obj.color, 0.7);

            if (obj.type === 'ship') {
                g.fillTriangle(ix, iy - obj.size, ix - obj.size * 0.7, iy + obj.size * 0.6, ix + obj.size * 0.7, iy + obj.size * 0.6);
            } else if (obj.type === 'station') {
                g.fillRect(ix - obj.size * 0.5, iy - obj.size * 0.5, obj.size, obj.size);
                g.fillStyle(0xffffff, 0.3);
                g.fillCircle(ix, iy, obj.size * 0.3);
            } else if (obj.type === 'planet_shop') {
                g.fillRect(ix - obj.size * 0.6, iy - obj.size * 0.5, obj.size * 1.2, obj.size);
                g.fillStyle(0xffffff, 0.2);
                g.fillRect(ix - obj.size * 0.4, iy - obj.size * 0.3, obj.size * 0.8, obj.size * 0.6);
                g.lineStyle(1, 0x00ffaa, 0.5);
                g.strokeCircle(ix, iy - obj.size * 0.7, 5);
            } else if (obj.type === 'quest_npc') {
                g.fillCircle(ix, iy - 4, 6);
                g.fillRect(ix - 4, iy + 2, 8, 10);
                g.fillStyle(COLORS.WARNING, 0.8 + Math.sin(t / 200) * 0.2);
                g.fillCircle(ix, iy - 16, 5);
                var excl = this.add.text ? null : null; // just use graphics
                g.fillStyle(0x000000, 1);
                g.fillRect(ix - 1, iy - 19, 2, 5);
                g.fillRect(ix - 1, iy - 13, 2, 2);
            }

            // Distance label
            var distToObj = Helpers.distance(this.player.x, this.player.y, obj.x, obj.y);
            if (distToObj < 100) {
                if (!obj._label) {
                    obj._label = this.add.text(0, 0, obj.label, { fontFamily: 'monospace', fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5).setDepth(200);
                }
                obj._label.setPosition(ix, iy - obj.size - 14);
                obj._label.setVisible(true);
            } else if (obj._label) {
                obj._label.setVisible(false);
            }
        }

        // Draw enemies
        for (var ei = 0; ei < this.surfaceEnemies.length; ei++) {
            var enemy = this.surfaceEnemies[ei];
            if (!enemy.alive) continue;
            var ex = enemy.x - cx, ey = enemy.y - cy;
            if (ex < -40 || ex > GAME_WIDTH + 40 || ey < -40 || ey > GAME_HEIGHT + 40) {
                this.tryRenderPlanetEnemySprite(enemy, ex, ey, true);
                continue;
            }
            if (this.tryRenderPlanetEnemySprite(enemy, ex, ey, false)) continue;

            if (enemy.hitFlash > 0) {
                g.fillStyle(0xffffff, 0.8);
            } else if (enemy.isPlanetBoss) {
                // Boss glow
                g.fillStyle(enemy.color, 0.15 + Math.sin(t / 200) * 0.05);
                g.fillCircle(ex, ey, enemy.size + 10 + Math.sin(t / 300) * 4);
                g.fillStyle(enemy.color, 0.9);
            } else {
                g.fillStyle(enemy.color, 0.9);
            }

            // Body
            g.fillCircle(ex, ey, enemy.size);

            // Face direction indicator
            var faceX = Math.cos(enemy.rotation) * enemy.size * 0.6;
            var faceY = Math.sin(enemy.rotation) * enemy.size * 0.6;
            g.fillStyle(0x000000, 0.5);
            g.fillCircle(ex + faceX, ey + faceY, enemy.size * 0.3);

            // Boss crown
            if (enemy.isPlanetBoss) {
                g.fillStyle(0xffdd00, 0.9);
                g.fillTriangle(ex - 8, ey - enemy.size - 5, ex, ey - enemy.size - 14, ex + 8, ey - enemy.size - 5);
                g.fillTriangle(ex - 4, ey - enemy.size - 5, ex, ey - enemy.size - 12, ex + 4, ey - enemy.size - 5);

                // Phase indicator
                if (enemy.phase >= 2) {
                    g.lineStyle(2, 0xff4444, 0.4 + Math.sin(t / 100) * 0.3);
                    g.strokeCircle(ex, ey, enemy.size + 5);
                }
                if (enemy.phase >= 3) {
                    g.lineStyle(2, 0xff0000, 0.6);
                    g.strokeCircle(ex, ey, enemy.size + 10);
                }
            }

            // Health bar
            if (enemy.health < enemy.maxHealth) {
                var barW = enemy.size * 2;
                var barY2 = ey + enemy.size + 5;
                g.fillStyle(0x000000, 0.6);
                g.fillRect(ex - barW / 2, barY2, barW, 4);
                g.fillStyle(enemy.isPlanetBoss ? COLORS.DANGER : COLORS.SUCCESS, 0.8);
                g.fillRect(ex - barW / 2, barY2, barW * (enemy.health / enemy.maxHealth), 4);
                if (enemy.isPlanetBoss) {
                    // Boss name
                    if (!enemy._nameText) {
                        enemy._nameText = this.add.text(0, 0, enemy.name, { fontFamily: 'monospace', fontSize: '10px', color: '#ff4444', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold' }).setOrigin(0.5).setDepth(200);
                    }
                    enemy._nameText.setPosition(ex, barY2 + 10);
                }
            }
        }
    }

    drawProjectiles() {
        var g = this.projectileGraphics;
        var cx = this.camX, cy = this.camY;
        for (var pi = 0; pi < this.projectiles.length; pi++) {
            var proj = this.projectiles[pi];
            var px = proj.x - cx, py = proj.y - cy;
            if (px < -10 || px > GAME_WIDTH + 10 || py < -10 || py > GAME_HEIGHT + 10) {
                this.tryRenderPlanetProjectileSprite(proj, px, py, true);
                continue;
            }
            if (this.tryRenderPlanetProjectileSprite(proj, px, py, false)) continue;
            g.fillStyle(proj.color, 0.9);
            g.fillCircle(px, py, proj.size);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(px, py, proj.size * 0.4);
            // Trail
            g.lineStyle(1, proj.color, 0.3);
            g.lineBetween(px, py, px - proj.vx * 0.02, py - proj.vy * 0.02);
        }
    }

    drawPlayer() {
        var g = this.playerGraphics;
        var p = this.player;
        var sx = p.x - this.camX, sy = p.y - this.camY;
        var t = this.time.now;

        // Invincibility flash
        if (p.invincible > 0 && Math.floor(t / 80) % 2 === 0) return;

        if (this.tryRenderPlanetPlayerSprite(sx, sy)) {
            if (p.shieldActive) {
                g.lineStyle(2, COLORS.SHIELD, 0.3 + Math.sin(t / 200) * 0.15);
                g.strokeCircle(sx, sy, p.size + 8);
                g.fillStyle(COLORS.SHIELD, 0.08);
                g.fillCircle(sx, sy, p.size + 8);
            }
            return;
        }

        // Shield visual
        if (p.shieldActive) {
            g.lineStyle(2, COLORS.SHIELD, 0.3 + Math.sin(t / 200) * 0.15);
            g.strokeCircle(sx, sy, p.size + 8);
            g.fillStyle(COLORS.SHIELD, 0.08);
            g.fillCircle(sx, sy, p.size + 8);
        }

        // Body
        g.fillStyle(COLORS.PRIMARY, 0.9);
        var frontX = Math.cos(p.rotation) * p.size;
        var frontY = Math.sin(p.rotation) * p.size;
        var leftX = Math.cos(p.rotation + 2.5) * p.size * 0.8;
        var leftY = Math.sin(p.rotation + 2.5) * p.size * 0.8;
        var rightX = Math.cos(p.rotation - 2.5) * p.size * 0.8;
        var rightY = Math.sin(p.rotation - 2.5) * p.size * 0.8;
        g.fillTriangle(sx + frontX, sy + frontY, sx + leftX, sy + leftY, sx + rightX, sy + rightY);

        // Eye / helmet visor
        g.fillStyle(0x00ffff, 0.7);
        g.fillCircle(sx + Math.cos(p.rotation) * p.size * 0.4, sy + Math.sin(p.rotation) * p.size * 0.4, 3);

        // Jetpack flames
        if (p.jetpackActive) {
            g.fillStyle(0xff6600, 0.6 + Math.sin(t / 50) * 0.3);
            var bx = sx - Math.cos(p.rotation) * p.size * 0.7;
            var by = sy - Math.sin(p.rotation) * p.size * 0.7;
            g.fillCircle(bx, by, 4 + Math.sin(t / 50) * 2);
            g.fillStyle(0xffaa00, 0.4);
            g.fillCircle(bx, by, 2);
        }

        // Dash trail
        if (p.isDashing) {
            g.fillStyle(COLORS.PRIMARY, 0.2);
            g.fillCircle(sx - Math.cos(p.rotation) * 15, sy - Math.sin(p.rotation) * 15, p.size * 0.6);
        }
    }

    drawParticles() {
        var g = this.fxGraphics;
        var cx = this.camX, cy = this.camY;
        for (var i = 0; i < this.particles.length; i++) {
            var part = this.particles[i];
            var alpha = Helpers.clamp(part.life / part.maxLife, 0, 1);
            var px = part.x - cx, py = part.y - cy;
            if (px < -20 || px > GAME_WIDTH + 20 || py < -20 || py > GAME_HEIGHT + 20) continue;

            if (part.type === 'text') {
                if (!part._txt) {
                    part._txt = this.add.text(0, 0, part.text, { fontFamily: 'monospace', fontSize: '11px', color: '#' + part.color.toString(16).padStart(6, '0'), fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5).setDepth(300);
                }
                part._txt.setPosition(px, py);
                part._txt.setAlpha(alpha);
                if (part.life <= 0 && part._txt) { part._txt.destroy(); }
            } else {
                g.fillStyle(part.color, alpha);
                g.fillCircle(px, py, part.size * alpha);
            }
        }
    }

    drawHUDBars() {
        var g = this.uiGraphics;
        var p = this.player;

        // Health bar
        g.fillStyle(0x000000, 0.6);
        g.fillRect(12, 28, 160, 10);
        g.fillStyle(COLORS.SUCCESS, 0.8);
        g.fillRect(12, 28, 160 * Helpers.clamp(p.health / p.maxHealth, 0, 1), 10);
        g.lineStyle(1, 0xffffff, 0.2);
        g.strokeRect(12, 28, 160, 10);

        // Shield bar
        if (p.shieldActive) {
            g.fillStyle(0x000000, 0.6);
            g.fillRect(12, 52, 120, 6);
            g.fillStyle(COLORS.SHIELD, 0.7);
            g.fillRect(12, 52, 120 * Helpers.clamp(p.shieldHP / p.maxShieldHP, 0, 1), 6);
        }

        // Jetpack fuel
        g.fillStyle(0x000000, 0.5);
        g.fillRect(12, 82, 80, 5);
        g.fillStyle(0xff8800, 0.6);
        g.fillRect(12, 82, 80 * (p.jetpackFuel / 100), 5);

        // Dash cooldown
        if (p.dashCooldown > 0) {
            g.fillStyle(0x000000, 0.5);
            g.fillRect(12, 92, 80, 4);
            g.fillStyle(COLORS.PRIMARY, 0.5);
            g.fillRect(12, 92, 80 * (1 - p.dashCooldown / 1500), 4);
        }

        // XP bar
        var xpNeeded = this.ship.level * 100;
        g.fillStyle(0x000000, 0.5);
        g.fillRect(GAME_WIDTH / 2 - 80, 24, 160, 5);
        g.fillStyle(0x8844ff, 0.6);
        g.fillRect(GAME_WIDTH / 2 - 80, 24, 160 * (this.ship.xp / xpNeeded), 5);
    }

    drawWeaponSlots() {
        var g = this.weaponSlots;
        var weapons = ['pistol', 'rifle', 'shotgun', 'cannon'];
        var colors = [0x00aaff, 0x00ff88, 0xff8800, 0xff4444];
        var startX = GAME_WIDTH / 2 - 80;
        var slotY = GAME_HEIGHT - 22;

        for (var i = 0; i < weapons.length; i++) {
            var w = this.player.weapons[weapons[i]];
            var sx = startX + i * 42;
            g.fillStyle(0x000000, 0.5);
            g.fillRect(sx, slotY - 8, 36, 16);
            if (w.unlocked) {
                g.fillStyle(this.player.currentWeapon === weapons[i] ? colors[i] : 0x333344, this.player.currentWeapon === weapons[i] ? 0.6 : 0.3);
                g.fillRect(sx + 1, slotY - 7, 34, 14);
            }
            g.lineStyle(1, this.player.currentWeapon === weapons[i] ? colors[i] : 0x444455, 0.6);
            g.strokeRect(sx, slotY - 8, 36, 16);
        }
    }

    drawMinimap() {
        var g = this.minimapG;
        var mmX = GAME_WIDTH - 120, mmY = 10, mmW = 110, mmH = 110;

        g.fillStyle(0x000000, 0.5);
        g.fillRect(mmX, mmY, mmW, mmH);
        g.lineStyle(1, 0x334455, 0.5);
        g.strokeRect(mmX, mmY, mmW, mmH);

        // Player dot
        var px = mmX + (this.player.x / this.worldWidth) * mmW;
        var py = mmY + (this.player.y / this.worldHeight) * mmH;
        g.fillStyle(COLORS.PRIMARY, 1);
        g.fillCircle(px, py, 2);

        // Enemies
        for (var ei = 0; ei < this.surfaceEnemies.length; ei++) {
            var en = this.surfaceEnemies[ei];
            if (!en.alive) continue;
            g.fillStyle(en.isPlanetBoss ? COLORS.DANGER : 0xff4444, en.isPlanetBoss ? 1 : 0.6);
            g.fillCircle(mmX + (en.x / this.worldWidth) * mmW, mmY + (en.y / this.worldHeight) * mmH, en.isPlanetBoss ? 3 : 1);
        }

        // Interactables
        for (var ii = 0; ii < this.interactables.length; ii++) {
            var obj = this.interactables[ii];
            g.fillStyle(obj.color, 0.8);
            g.fillCircle(mmX + (obj.x / this.worldWidth) * mmW, mmY + (obj.y / this.worldHeight) * mmH, 2);
        }

        // Collectibles
        for (var ci = 0; ci < this.collectibles.length; ci++) {
            var col = this.collectibles[ci];
            if (!col.alive) continue;
            g.fillStyle(col.color, 0.3);
            g.fillRect(mmX + (col.x / this.worldWidth) * mmW, mmY + (col.y / this.worldHeight) * mmH, 1, 1);
        }
    }

    updateHUDText() {
        var p = this.player;
        this.healthText.setText('HP: ' + Math.ceil(p.health) + '/' + p.maxHealth);
        this.shieldText.setText(p.shieldActive ? 'SHIELD: ' + Math.ceil(p.shieldHP) : 'Shield: [Q]');
        var wData = WEAPON_DATA[p.currentWeapon];
        this.weaponText.setText('Weapon: ' + (wData ? wData.name : p.currentWeapon));
        var ammo = p.weapons[p.currentWeapon];
        this.ammoText.setText(ammo && ammo.ammo !== Infinity ? 'Ammo: ' + ammo.ammo : 'Ammo: ∞');
        this.abilityText.setText('Dash:[SHIFT] Jet:[SPACE] Shield:[Q]');
        this.creditsText.setText(Helpers.formatNumber(this.ship.credits) + ' CR');
        this.invText.setText('Lv.' + this.ship.level + ' | XP: ' + this.ship.xp + '/' + (this.ship.level * 100));

        // Status text
        var nearShop = false, nearShip = false, nearNPC = false;
        for (var i = 0; i < this.interactables.length; i++) {
            var obj = this.interactables[i];
            if (Helpers.distance(p.x, p.y, obj.x, obj.y) < 60) {
                if (obj.type === 'planet_shop') nearShop = true;
                if (obj.type === 'ship') nearShip = true;
                if (obj.type === 'quest_npc') nearNPC = true;
            }
        }
        if (nearShop) this.statusText.setText('[F] Open Shop');
        else if (nearShip) this.statusText.setText('[E] Return to Ship');
        else if (nearNPC) this.statusText.setText('[E] Talk to NPC');
        else this.statusText.setText('');

        // Quest HUD
        if (this.planetQuest) {
            var prog = this.getQuestProgress();
            this.questStatusText.setText('QUEST: ' + this.planetQuest.title + '\n' + this.planetQuest.description + '\nProgress: ' + prog.current + '/' + prog.target);
        } else if (this.ship.completedPlanetQuests && this.ship.completedPlanetQuests.includes(this.planetQuestId)) {
            this.questStatusText.setText('★ Quest Complete ★');
        } else {
            this.questStatusText.setText('');
        }
    }

    // ============ NOTIFICATIONS ============
    addNotification(text, color) {
        this.notifications.push({ text: text, color: color || COLORS.PRIMARY, life: 3000, maxLife: 3000 });
    }

    updateNotificationDisplay(dt) {
        var startY = 100;
        for (var i = this.notifications.length - 1; i >= 0; i--) {
            var n = this.notifications[i];
            n.life -= dt;
            if (n.life <= 0) {
                if (n._txt) n._txt.destroy();
                this.notifications.splice(i, 1);
                continue;
            }
            var alpha = Helpers.clamp(n.life / 1000, 0, 1);
            if (!n._txt) {
                n._txt = this.add.text(GAME_WIDTH / 2, startY, n.text, {
                    fontFamily: 'monospace', fontSize: '12px', color: '#' + n.color.toString(16).padStart(6, '0'),
                    fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
                }).setOrigin(0.5).setDepth(500);
            }
            var idx = this.notifications.indexOf(n);
            n._txt.setPosition(GAME_WIDTH / 2, startY + idx * 20);
            n._txt.setAlpha(alpha);
        }
    }

    showQuestComplete(quest) {
        this.addNotification('★ Quest Complete: ' + (quest.title || quest.name || 'Unknown') + '!', COLORS.WARNING);
    }
    ensurePlanetEntityId(entity, prefix) {
        if (!entity.__spriteId) {
            this.spriteIdCounter += 1;
            entity.__spriteId = prefix + '_' + this.spriteIdCounter;
        }
        return entity.__spriteId;
    }

    getPlanetEnemyTextureKey(enemy) {
        if (!enemy) return null;
        if (enemy.isPlanetBoss) return this.textures.exists('enemy_boss') ? 'enemy_boss' : null;
        if (enemy.type === 'alien' && this.textures.exists('enemy_alien')) return 'enemy_alien';
        if (enemy.type === 'drone' && this.textures.exists('enemy_drone')) return 'enemy_drone';
        if (enemy.type === 'pirate' && this.textures.exists('enemy_pirate')) return 'enemy_pirate';
        return this.textures.exists('enemy_pirate') ? 'enemy_pirate' : null;
    }

    tryRenderPlanetEnemySprite(enemy, sx, sy, forceHide) {
        var key = this.getPlanetEnemyTextureKey(enemy);
        if (!key) return false;
        var id = this.ensurePlanetEntityId(enemy, 'pl_enemy');
        var sprite = this.surfaceEnemySprites[id];
        if (!sprite) {
            sprite = this.add.image(sx, sy, key).setDepth(38);
            this.surfaceEnemySprites[id] = sprite;
        }
        if (forceHide) { sprite.setVisible(false); return true; }
        if (sprite.texture.key !== key) sprite.setTexture(key);
        sprite.setVisible(true);
        sprite.setPosition(sx, sy);
        sprite.setRotation(enemy.rotation + Math.PI / 2);
        sprite.setScale(Helpers.clamp(enemy.size / 20, 0.45, 2.3));
        sprite.setTint(enemy.hitFlash > 0 ? 0xffffff : enemy.color);
        sprite.setAlpha(enemy.isPlanetBoss ? 0.95 : 0.9);
        return true;
    }

    tryRenderPlanetCollectibleSprite(item, sx, sy, forceHide) {
        if (!this.textures.exists('loot_sprite') && !this.textures.exists('object_sprite')) return false;
        var key = item.data && (item.data.rarity === 'common' || item.data.rarity === 'uncommon') && this.textures.exists('object_sprite') ? 'object_sprite' : 'loot_sprite';
        var id = this.ensurePlanetEntityId(item, 'pl_loot');
        var sprite = this.collectibleSprites[id];
        if (!sprite) {
            sprite = this.add.image(sx, sy, key).setDepth(30);
            this.collectibleSprites[id] = sprite;
        }
        if (forceHide) { sprite.setVisible(false); return true; }
        if (sprite.texture.key !== key) sprite.setTexture(key);
        sprite.setVisible(true);
        sprite.setPosition(sx, sy);
        sprite.setScale(0.2 + Math.sin(item.bobPhase || 0) * 0.02);
        sprite.setTint(item.color || 0xffffff);
        return true;
    }

    tryRenderPlanetInteractableSprite(obj, sx, sy, forceHide) {
        if (!this.textures.exists('shop_sprite') && !this.textures.exists('object_sprite') && !this.textures.exists('ship_player_alt')) return false;
        var key = 'object_sprite';
        if (obj.type === 'planet_shop' || obj.type === 'station') key = this.textures.exists('shop_sprite') ? 'shop_sprite' : 'object_sprite';
        if (obj.type === 'ship') key = this.textures.exists('ship_player_alt') ? 'ship_player_alt' : 'object_sprite';
        if (obj.type === 'quest_npc') key = this.textures.exists('character_player') ? 'character_player' : 'object_sprite';
        var id = this.ensurePlanetEntityId(obj, 'pl_obj');
        var sprite = this.interactableSprites[id];
        if (!sprite) {
            sprite = this.add.image(sx, sy, key).setDepth(32);
            this.interactableSprites[id] = sprite;
        }
        if (forceHide) { sprite.setVisible(false); return true; }
        if (sprite.texture.key !== key) sprite.setTexture(key);
        sprite.setVisible(true);
        sprite.setPosition(sx, sy);
        sprite.setScale(Helpers.clamp(obj.size / 32, 0.35, 1.5));
        sprite.setTint(obj.color || 0xffffff);
        sprite.setAlpha(0.9);
        return true;
    }

    tryRenderPlanetProjectileSprite(proj, px, py, forceHide) {
        if (!this.textures.exists('laser_blue')) return false;
        var id = this.ensurePlanetEntityId(proj, 'pl_proj');
        var sprite = this.projectileSprites[id];
        if (!sprite) {
            sprite = this.add.image(px, py, 'laser_blue').setDepth(42);
            this.projectileSprites[id] = sprite;
        }
        if (forceHide) { sprite.setVisible(false); return true; }
        sprite.setVisible(true);
        sprite.setPosition(px, py);
        sprite.setScale(Helpers.clamp((proj.size || 3) / 6, 0.25, 1.2));
        sprite.setTint(proj.color || 0xffffff);
        sprite.setAlpha(0.9);
        return true;
    }

    tryRenderPlanetPlayerSprite(sx, sy) {
        if (!this.playerSprite) return false;
        this.playerSprite.setVisible(true);
        this.playerSprite.setPosition(sx, sy);
        this.playerSprite.setRotation(this.player.rotation + Math.PI / 2);
        this.playerSprite.setScale(Helpers.clamp(this.player.size / 14, 0.6, 1.3));
        this.playerSprite.setTint(COLORS.PRIMARY);
        return true;
    }

    cleanupPlanetSceneSprites() {
        this.cleanupPlanetSpriteMap(this.collectibleSprites, this.collectibles);
        this.cleanupPlanetSpriteMap(this.interactableSprites, this.interactables, true);
        this.cleanupPlanetSpriteMap(this.surfaceEnemySprites, this.surfaceEnemies);
        this.cleanupPlanetSpriteMap(this.projectileSprites, this.projectiles, false, 'life');
    }

    cleanupPlanetSpriteMap(map, entities, noAliveFlag, lifeKey) {
        var aliveIds = {};
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e || !e.__spriteId) continue;
            if (noAliveFlag || e.alive || (lifeKey && e[lifeKey] > 0)) aliveIds[e.__spriteId] = true;
        }
        for (var k in map) {
            if (!aliveIds[k]) {
                if (map[k] && map[k].destroy) map[k].destroy();
                delete map[k];
            }
        }
    }
}
