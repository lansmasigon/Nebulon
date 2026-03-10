// Space Scene - Infinite Space Exploration with Shops
class SpaceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceScene' });
    }

    init(data) {
        this.loadSave = data.loadSave || false;
        this.targetPlanet = data.targetPlanet || null;
        this.currentStage = data.stage || GAME_STAGES.SOLAR_SYSTEM;
        this.returnFromCombat = data.returnFromCombat || false;
        this.combatResult = data.combatResult || null;
    }

    create() {
        this.ship = this.registry.get('ship') || new Ship(this);
        this.questSystem = this.registry.get('questSystem') || new QuestSystem();
        this.inventory = this.registry.get('inventory') || new InventorySystem();
        this.combatSystem = new CombatSystem();
        this.saveSystem = new SaveSystem();
        this.upgradeSystem = new UpgradeSystem();

        if (this.loadSave && !this.registry.get('ship')) {
            var saveData = this.saveSystem.load();
            if (saveData) {
                this.ship.loadSaveData(saveData.ship);
                this.questSystem.loadSaveData(saveData.quests);
                this.inventory.loadSaveData(saveData.inventory);
                this.currentStage = this.questSystem.currentStage;
            }
        }

        this.ship.applyUpgrades();
        this.registry.set('ship', this.ship);
        this.registry.set('questSystem', this.questSystem);
        this.registry.set('inventory', this.inventory);
        this.questSystem.loadQuestsForStage(this.currentStage);

        // Camera offset for infinite space
        this.camX = 0;
        this.camY = 0;

        // Place ship in world center
        this.ship.x = 0;
        this.ship.y = 0;

        // Background layers
        this.add.graphics().fillStyle(COLORS.BG_DARK, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Generate parallax star layers
        this.starLayers = [];
        for (var layer = 0; layer < 3; layer++) {
            var stars = [];
            var count = 150 + layer * 80;
            for (var si = 0; si < count; si++) {
                stars.push({
                    x: Helpers.randomFloat(-2000, 2000),
                    y: Helpers.randomFloat(-2000, 2000),
                    size: Helpers.randomFloat(0.5, 2 - layer * 0.3),
                    alpha: Helpers.randomFloat(0.2, 0.9),
                    color: Helpers.randomElement([0xffffff, 0xaaccff, 0xffddaa, 0xffaaaa])
                });
            }
            this.starLayers.push({ stars: stars, parallax: 0.2 + layer * 0.3 });
        }

        // Nebula blobs
        this.nebulae = [];
        for (var ni = 0; ni < 12; ni++) {
            this.nebulae.push({
                x: Helpers.randomFloat(-3000, 3000),
                y: Helpers.randomFloat(-3000, 3000),
                radius: Helpers.randomFloat(100, 350),
                color: Helpers.randomElement([0x001133, 0x110022, 0x002222, 0x220011, 0x001122]),
                alpha: Helpers.randomFloat(0.04, 0.12)
            });
        }

        // Game entities
        this.enemies = [];
        this.asteroids = [];
        this.lootDrops = [];

        // Space shops
        this.spaceShops = [];
        this.generateSpaceShops();
        this.shopOpen = false;
        this.currentShop = null;
        this.shopUI = null;

        // Graphics layers
        this.bgGraphics = this.add.graphics();
        this.nebulaGraphics = this.add.graphics();
        this.entityGraphics = this.add.graphics();
        this.shipGraphics = this.add.graphics();
        this.fxGraphics = this.add.graphics();
        this.uiGraphics = this.add.graphics();

        // Planets in world space
        this.planets = GameData.planets[this.currentStage].map(function(p) { return new Planet(p); });
        this.placePlanetsInWorld();

        // Spawn timers
        this.spawnTimer = 0;
        this.spawnInterval = 5000;
        this.encounterTimer = Helpers.randomFloat(8000, 15000);

        if (this.returnFromCombat && this.combatResult) {
            this.processCombatResult(this.combatResult);
        }

        // Setup input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            M: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M),
            I: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
            U: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
            J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
            C: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
            F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
            ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        };

        this.createUI();
        this.notifications = [];

        if (!this.returnFromCombat) {
            this.addNotification('Welcome to ' + this.getStageName() + '! Explore freely. Press M for map.', COLORS.PRIMARY);
        }

        this.autoSaveTimer = 30000;
        this.shieldToggleTimer = 0;

        for (var i = 0; i < 8; i++) this.spawnAsteroid();
        for (var j = 0; j < 3; j++) this.spawnEnemy();
    }

    getStageName() {
        var names = { solar_system: 'the Solar System', first_galaxy: 'the First Galaxy', black_hole: 'the Black Hole Systems' };
        return names[this.currentStage] || 'Space';
    }

    placePlanetsInWorld() {
        // Spread planets across a large world area
        var stageData = GameData.planets[this.currentStage];
        for (var i = 0; i < this.planets.length; i++) {
            var pd = stageData[i];
            if (pd.orbitRadius) {
                // Solar system - use orbit positions but scale them up
                var angle = pd.startAngle || 0;
                this.planets[i].worldX = Math.cos(angle) * pd.orbitRadius * 6;
                this.planets[i].worldY = Math.sin(angle) * pd.orbitRadius * 6;
            } else {
                this.planets[i].worldX = (pd.x - 640) * 4;
                this.planets[i].worldY = (pd.y - 360) * 4;
            }
        }
    }

    generateSpaceShops() {
        var shopTypes = SPACE_SHOP_DATA.types;
        var shopCount = 5 + Helpers.randomInt(0, 3);
        for (var i = 0; i < shopCount; i++) {
            var type = shopTypes[i % shopTypes.length];
            var shopData = SPACE_SHOP_DATA[type];
            this.spaceShops.push({
                x: Helpers.randomFloat(-2500, 2500),
                y: Helpers.randomFloat(-2500, 2500),
                type: type,
                name: shopData.name,
                color: shopData.color,
                items: shopData.items,
                size: 25,
                pulsePhase: Helpers.randomFloat(0, Math.PI * 2)
            });
        }
    }

    createUI() {
        this.healthText = this.add.text(15, 12, '', { fontFamily: 'monospace', fontSize: '11px', color: '#00ff66' });
        this.shieldText = this.add.text(15, 38, '', { fontFamily: 'monospace', fontSize: '11px', color: '#4488ff' });
        this.fuelText = this.add.text(15, 64, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ff8800' });
        this.levelText = this.add.text(GAME_WIDTH - 15, 12, '', { fontFamily: 'monospace', fontSize: '12px', color: '#aa66ff' }).setOrigin(1, 0);
        this.creditsText = this.add.text(GAME_WIDTH - 15, 32, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffdd00' }).setOrigin(1, 0);
        this.xpText = this.add.text(GAME_WIDTH - 15, 52, '', { fontFamily: 'monospace', fontSize: '11px', color: '#888899' }).setOrigin(1, 0);
        this.questText = this.add.text(15, GAME_HEIGHT - 80, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ffdd00', wordWrap: { width: 300 } });
        this.add.text(GAME_WIDTH - 15, GAME_HEIGHT - 15, 'M:Map I:Inv U:Upgrades J:Quests C:Craft F:Shop', { fontFamily: 'monospace', fontSize: '10px', color: '#444455' }).setOrigin(1, 1);
        this.missileText = this.add.text(15, 88, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ff8800' });
        this.add.text(GAME_WIDTH / 2, 12, this.getStageName().toUpperCase(), { fontFamily: 'monospace', fontSize: '12px', color: '#445566' }).setOrigin(0.5, 0);
        this.coordText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, '', { fontFamily: 'monospace', fontSize: '10px', color: '#334455' }).setOrigin(0.5, 1);
        this.notifContainer = this.add.container(GAME_WIDTH / 2, 50);
    }

    update(time, delta) {
        var dt = delta;

        if (this.shopOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) || Phaser.Input.Keyboard.JustDown(this.keys.F)) {
                this.closeShop();
            }
            return;
        }

        this.handleInput(dt);
        this.updateShipPhysics(dt);
        this.updateEntities(dt);
        this.updateCamera();

        this.encounterTimer -= dt;
        if (this.encounterTimer <= 0) {
            this.triggerRandomEncounter();
            this.encounterTimer = Helpers.randomFloat(10000, 20000);
        }

        this.checkCollisions();
        this.combatSystem.update(dt);

        if (this.ship.shieldActive && this.ship.shield < this.ship.maxShield) {
            this.ship.rechargeShield(2 * (dt / 1000));
        }
        if (this.shieldToggleTimer > 0) this.shieldToggleTimer -= dt;

        this.autoSaveTimer -= dt;
        if (this.autoSaveTimer <= 0) {
            this.questSystem.currentStage = this.currentStage;
            this.saveSystem.save(this.ship, this.questSystem, this.inventory);
            this.autoSaveTimer = 30000;
        }

        this.drawFrame();
        this.updateUI();
        this.updateNotifications(dt);

        // Check planet proximity
        this.checkPlanetProximity();

        // Menu keys
        if (Phaser.Input.Keyboard.JustDown(this.keys.M)) this.openMap();
        if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.openInventory();
        if (Phaser.Input.Keyboard.JustDown(this.keys.U)) this.openUpgrades();
        if (Phaser.Input.Keyboard.JustDown(this.keys.J)) this.openQuests();
        if (Phaser.Input.Keyboard.JustDown(this.keys.C)) { this.scene.pause(); this.scene.launch('CraftingScene', { stage: this.currentStage }); }
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.tryOpenShop();
        if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.pauseGame();
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.tryLandOnPlanet();
    }

    handleInput(dt) {
        var ship = this.ship;
        if (this.keys.A.isDown || this.cursors.left.isDown) ship.rotation -= 3.5 * (dt / 1000);
        if (this.keys.D.isDown || this.cursors.right.isDown) ship.rotation += 3.5 * (dt / 1000);

        var thrustMultiplier = (this.keys.SHIFT.isDown && ship.fuel > 0) ? 1.8 : 1;
        if (this.keys.SHIFT.isDown && ship.fuel > 0) {
            ship.boostActive = true;
            ship.useFuel(5 * (dt / 1000));
        } else {
            ship.boostActive = false;
        }

        if (this.keys.W.isDown || this.cursors.up.isDown) {
            ship.velocityX += Math.cos(ship.rotation) * ship.speed * thrustMultiplier * (dt / 1000);
            ship.velocityY += Math.sin(ship.rotation) * ship.speed * thrustMultiplier * (dt / 1000);
            ship.thrusting = true;
        } else {
            ship.thrusting = false;
        }

        if (this.keys.S.isDown || this.cursors.down.isDown) {
            ship.velocityX -= Math.cos(ship.rotation) * ship.speed * 0.5 * (dt / 1000);
            ship.velocityY -= Math.sin(ship.rotation) * ship.speed * 0.5 * (dt / 1000);
        }

        if (this.keys.SPACE.isDown && ship.canFire()) {
            ship.fire();
            var projX = ship.x + Math.cos(ship.rotation) * ship.size;
            var projY = ship.y + Math.sin(ship.rotation) * ship.size;
            this.combatSystem.createProjectile(projX, projY, ship.rotation, 600, ship.damage, true, COLORS.PRIMARY);
            this.playSound('laser');
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            // E also handles missile if no planet nearby
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.Q) && this.shieldToggleTimer <= 0) {
            ship.shieldActive = !ship.shieldActive;
            this.shieldToggleTimer = 300;
            this.addNotification(ship.shieldActive ? 'Shields activated' : 'Shields deactivated',
                ship.shieldActive ? COLORS.SHIELD : COLORS.TEXT_DIM);
        }
    }

    updateShipPhysics(dt) {
        var ship = this.ship;
        ship.x += ship.velocityX * (dt / 1000);
        ship.y += ship.velocityY * (dt / 1000);
        ship.velocityX *= 0.995;
        ship.velocityY *= 0.995;

        var speed = Math.sqrt(ship.velocityX ** 2 + ship.velocityY ** 2);
        var maxSpeed = ship.speed * (ship.boostActive ? 1.8 : 1);
        if (speed > maxSpeed) {
            ship.velocityX = (ship.velocityX / speed) * maxSpeed;
            ship.velocityY = (ship.velocityY / speed) * maxSpeed;
        }
        // No screen wrapping - infinite space!
    }

    updateCamera() {
        this.camX = this.ship.x - GAME_WIDTH / 2;
        this.camY = this.ship.y - GAME_HEIGHT / 2;
    }

    updateEntities(dt) {
        for (var ei = 0; ei < this.enemies.length; ei++) {
            var enemy = this.enemies[ei];
            enemy.update(dt, this.ship.x, this.ship.y);
            if (enemy.canFire() && enemy.alive) {
                enemy.fire();
                var angle = Helpers.angleBetween(enemy.x, enemy.y, this.ship.x, this.ship.y);
                this.combatSystem.createProjectile(
                    enemy.x + Math.cos(angle) * enemy.size,
                    enemy.y + Math.sin(angle) * enemy.size,
                    angle, 400, enemy.damage, false, COLORS.DANGER
                );
            }
        }
        // Remove dead + far-away enemies
        var sx = this.ship.x, sy = this.ship.y;
        this.enemies = this.enemies.filter(function(e) {
            if (!e.alive) return false;
            return Helpers.distance(sx, sy, e.x, e.y) < 3000;
        });

        for (var ai = 0; ai < this.asteroids.length; ai++) this.asteroids[ai].update(dt);
        this.asteroids = this.asteroids.filter(function(a) {
            if (!a.alive) return false;
            return Helpers.distance(sx, sy, a.x, a.y) < 3000;
        });

        for (var li = 0; li < this.lootDrops.length; li++) this.lootDrops[li].update(dt);
        this.lootDrops = this.lootDrops.filter(function(l) { return l.alive; });

        for (var pi = 0; pi < this.planets.length; pi++) this.planets[pi].update(dt);

        // Update space shop pulses
        for (var shi = 0; shi < this.spaceShops.length; shi++) {
            this.spaceShops[shi].pulsePhase += dt / 500;
        }
    }

    checkCollisions() {
        var ship = this.ship;
        var combat = this.combatSystem;

        for (var pi = 0; pi < combat.projectiles.length; pi++) {
            var proj = combat.projectiles[pi];
            if (!proj.alive || !proj.isPlayer) continue;

            for (var ei = 0; ei < this.enemies.length; ei++) {
                var enemy = this.enemies[ei];
                if (!enemy.alive) continue;
                if (combat.checkCollision(proj.x, proj.y, proj.size, enemy.x, enemy.y, enemy.size)) {
                    proj.alive = false;
                    var killed = enemy.takeDamage(proj.damage);
                    combat.addDamageNumber(enemy.x, enemy.y - enemy.size, proj.damage, COLORS.WARNING);
                    combat.addExplosion(proj.x, proj.y, 8, COLORS.PRIMARY);
                    this.playSound('hit');
                    if (killed) this.onEnemyKilled(enemy);
                }
            }

            for (var ai = 0; ai < this.asteroids.length; ai++) {
                var ast = this.asteroids[ai];
                if (!ast.alive) continue;
                if (combat.checkCollision(proj.x, proj.y, proj.size, ast.x, ast.y, ast.size)) {
                    proj.alive = false;
                    var destroyed = ast.takeDamage(proj.damage);
                    combat.addExplosion(proj.x, proj.y, 6, 0x886644);
                    if (destroyed) {
                        combat.addExplosion(ast.x, ast.y, ast.size, 0x886644);
                        var drops = ast.getDrops();
                        for (var di = 0; di < drops.length; di++) {
                            this.lootDrops.push(new LootDrop(ast.x + Helpers.randomFloat(-20, 20), ast.y + Helpers.randomFloat(-20, 20), drops[di]));
                        }
                    }
                }
            }
        }

        for (var pi2 = 0; pi2 < combat.projectiles.length; pi2++) {
            var eproj = combat.projectiles[pi2];
            if (!eproj.alive || eproj.isPlayer) continue;
            if (combat.checkCollision(eproj.x, eproj.y, eproj.size, ship.x, ship.y, ship.size)) {
                eproj.alive = false;
                var dead = ship.takeDamage(eproj.damage);
                combat.addExplosion(eproj.x, eproj.y, 6, COLORS.DANGER);
                combat.addDamageNumber(ship.x, ship.y - ship.size - 10, eproj.damage, COLORS.DANGER);
                this.playSound('playerHit');
                if (dead) { this.gameOver(); return; }
            }
        }

        for (var ai2 = 0; ai2 < this.asteroids.length; ai2++) {
            var ast2 = this.asteroids[ai2];
            if (!ast2.alive) continue;
            if (combat.checkCollision(ship.x, ship.y, ship.size, ast2.x, ast2.y, ast2.size * 0.8)) {
                var dead2 = ship.takeDamage(ast2.damage);
                combat.addExplosion(ship.x, ship.y, 10, COLORS.DANGER);
                ast2.takeDamage(30);
                var bAngle = Helpers.angleBetween(ast2.x, ast2.y, ship.x, ship.y);
                ship.velocityX += Math.cos(bAngle) * 100;
                ship.velocityY += Math.sin(bAngle) * 100;
                if (dead2) { this.gameOver(); return; }
            }
        }

        for (var li = 0; li < this.lootDrops.length; li++) {
            var loot = this.lootDrops[li];
            if (!loot.alive) continue;
            if (Helpers.distance(ship.x, ship.y, loot.x, loot.y) < ship.size + loot.size + 15) {
                loot.alive = false;
                this.collectLoot(loot.data);
            }
        }
    }

    checkPlanetProximity() {
        this.nearPlanet = null;
        for (var i = 0; i < this.planets.length; i++) {
            var p = this.planets[i];
            if (!p.unlocked) continue;
            var wx = p.worldX || 0;
            var wy = p.worldY || 0;
            var dist = Helpers.distance(this.ship.x, this.ship.y, wx, wy);
            if (dist < 80 + p.radius * 3) {
                this.nearPlanet = p;
                break;
            }
        }
    }

    tryLandOnPlanet() {
        if (this.nearPlanet) {
            this.questSystem.currentStage = this.currentStage;
            this.saveSystem.save(this.ship, this.questSystem, this.inventory);
            var planetData = GameData.planets[this.currentStage].find(function(p) { return p.id === this.nearPlanet.id; }.bind(this));
            if (planetData) {
                this.scene.start('LandingScene', { planet: planetData, stage: this.currentStage });
            }
        } else {
            // Fire missile instead
            if (this.ship.missiles > 0) {
                this.ship.missiles--;
                var projX = this.ship.x + Math.cos(this.ship.rotation) * this.ship.size;
                var projY = this.ship.y + Math.sin(this.ship.rotation) * this.ship.size;
                var nearestEnemy = null, nearestDist = Infinity;
                for (var ei = 0; ei < this.enemies.length; ei++) {
                    if (!this.enemies[ei].alive) continue;
                    var d = Helpers.distance(this.ship.x, this.ship.y, this.enemies[ei].x, this.enemies[ei].y);
                    if (d < nearestDist) { nearestDist = d; nearestEnemy = this.enemies[ei]; }
                }
                var tx = nearestEnemy ? nearestEnemy.x : this.ship.x + Math.cos(this.ship.rotation) * 500;
                var ty = nearestEnemy ? nearestEnemy.y : this.ship.y + Math.sin(this.ship.rotation) * 500;
                this.combatSystem.createMissile(projX, projY, this.ship.rotation, this.ship.damage, tx, ty);
                this.playSound('missile');
            }
        }
    }

    tryOpenShop() {
        for (var i = 0; i < this.spaceShops.length; i++) {
            var shop = this.spaceShops[i];
            if (Helpers.distance(this.ship.x, this.ship.y, shop.x, shop.y) < 80) {
                this.openSpaceShop(shop);
                return;
            }
        }
        this.addNotification('No shop nearby. Look for station icons on the minimap.', COLORS.TEXT_DIM);
    }

    // ========== SHOP SYSTEM ==========
    openSpaceShop(shop) {
        this.shopOpen = true;
        this.currentShop = shop;

        // Create shop UI overlay
        this.shopContainer = this.add.container(0, 0);

        // Dark overlay
        var overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.shopContainer.add(overlay);

        // Panel
        var panel = this.add.graphics();
        panel.fillStyle(COLORS.BG_PANEL, 0.95);
        panel.fillRoundedRect(GAME_WIDTH / 2 - 250, 80, 500, 520, 12);
        panel.lineStyle(2, shop.color, 0.8);
        panel.strokeRoundedRect(GAME_WIDTH / 2 - 250, 80, 500, 520, 12);
        this.shopContainer.add(panel);

        // Title
        var title = this.add.text(GAME_WIDTH / 2, 100, '★ ' + shop.name + ' ★', {
            fontFamily: 'monospace', fontSize: '18px', color: '#' + shop.color.toString(16).padStart(6, '0'),
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);
        this.shopContainer.add(title);

        // Credits display
        var creditsLabel = this.add.text(GAME_WIDTH / 2, 130, 'Credits: ' + Helpers.formatNumber(this.ship.credits) + ' CR', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffdd00'
        }).setOrigin(0.5);
        this.shopContainer.add(creditsLabel);
        this.shopCreditsLabel = creditsLabel;

        // Items
        var startY = 165;
        for (var i = 0; i < shop.items.length; i++) {
            var item = shop.items[i];
            var iy = startY + i * 85;
            this.createShopItemButton(item, iy, shop.color);
        }

        // Close button
        var closeBtn = Helpers.createButton(this, GAME_WIDTH / 2, 560, 150, 36, 'Close [F/ESC]', function() {
            this.closeShop();
        }.bind(this), 0x666688);
        this.shopContainer.add(closeBtn);
    }

    createShopItemButton(item, y, shopColor) {
        var bg = this.add.graphics();
        bg.fillStyle(0x111133, 0.8);
        bg.fillRoundedRect(GAME_WIDTH / 2 - 220, y, 440, 72, 6);
        bg.lineStyle(1, shopColor, 0.3);
        bg.strokeRoundedRect(GAME_WIDTH / 2 - 220, y, 440, 72, 6);
        this.shopContainer.add(bg);

        var nameText = this.add.text(GAME_WIDTH / 2 - 200, y + 10, item.name, {
            fontFamily: 'monospace', fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
        });
        this.shopContainer.add(nameText);

        var descText = this.add.text(GAME_WIDTH / 2 - 200, y + 30, item.desc, {
            fontFamily: 'monospace', fontSize: '10px', color: '#888899'
        });
        this.shopContainer.add(descText);

        var costText = this.add.text(GAME_WIDTH / 2 + 130, y + 10, item.cost + ' CR', {
            fontFamily: 'monospace', fontSize: '12px', color: '#ffdd00'
        });
        this.shopContainer.add(costText);

        var buyBtn = Helpers.createButton(this, GAME_WIDTH / 2 + 160, y + 50, 90, 26, 'BUY', function() {
            this.buyShopItem(item);
        }.bind(this), this.ship.credits >= item.cost ? COLORS.SUCCESS : COLORS.DANGER);
        this.shopContainer.add(buyBtn);
    }

    buyShopItem(item) {
        if (this.ship.credits < item.cost) {
            this.addNotification('Not enough credits!', COLORS.DANGER);
            return;
        }
        this.ship.credits -= item.cost;
        var eff = item.effect;
        if (eff.fuel) { this.ship.fuel = Math.min(this.ship.maxFuel, this.ship.fuel + eff.fuel); }
        if (eff.health) { this.ship.health = Math.min(this.ship.maxHealth, this.ship.health + eff.health); }
        if (eff.shield) { this.ship.shield = Math.min(this.ship.maxShield, this.ship.shield + eff.shield); }
        if (eff.missiles) { this.ship.missiles = Math.min(this.ship.maxMissiles + 10, this.ship.missiles + eff.missiles); }
        if (eff.tempDamage) { this.ship.damage += eff.tempDamage; }
        if (eff.item) {
            var lootItem = this.findLootById(eff.item);
            if (lootItem) {
                for (var c = 0; c < (eff.count || 1); c++) this.inventory.addItem(Object.assign({}, lootItem));
            }
        }
        this.addNotification('Purchased: ' + item.name, COLORS.SUCCESS);
        if (this.shopCreditsLabel) this.shopCreditsLabel.setText('Credits: ' + Helpers.formatNumber(this.ship.credits) + ' CR');
    }

    closeShop() {
        this.shopOpen = false;
        this.currentShop = null;
        if (this.shopContainer) {
            this.shopContainer.destroy(true);
            this.shopContainer = null;
        }
    }

    onEnemyKilled(enemy) {
        this.combatSystem.addExplosion(enemy.x, enemy.y, enemy.size * 1.5, enemy.color);
        this.playSound('explosion');

        var leveled = this.ship.addXP(enemy.xpReward);
        this.ship.credits += enemy.creditReward;
        this.addNotification('+' + enemy.xpReward + ' XP  +' + enemy.creditReward + ' Credits', COLORS.WARNING);
        if (leveled) this.addNotification('LEVEL UP! Level ' + this.ship.level, COLORS.XP);

        this.ship.enemiesKilled++;
        this.ship.killsByType[enemy.type] = (this.ship.killsByType[enemy.type] || 0) + 1;

        var eventType = enemy.isBoss ? 'boss_kill' : 'enemy_kill';
        var completed = this.questSystem.updateProgress(eventType, { enemyType: enemy.type });
        for (var qi = 0; qi < completed.length; qi++) this.onQuestCompleted(completed[qi]);

        var drops = enemy.getDrops();
        for (var di = 0; di < drops.length; di++) {
            this.lootDrops.push(new LootDrop(
                enemy.x + Helpers.randomFloat(-30, 30),
                enemy.y + Helpers.randomFloat(-30, 30),
                drops[di]
            ));
        }

        if (Math.random() < 0.25 && this.ship.missiles < this.ship.maxMissiles) {
            this.ship.missiles = Math.min(this.ship.maxMissiles, this.ship.missiles + 1);
            this.addNotification('+1 Missile', COLORS.SECONDARY);
        }
    }

    collectLoot(lootData) {
        var added = this.inventory.addItem(lootData);
        if (added) {
            this.addNotification('Collected: ' + lootData.name, Helpers.rarityColor(lootData.rarity));
            this.playSound('pickup');
            this.ship.itemsCollected[lootData.id] = (this.ship.itemsCollected[lootData.id] || 0) + 1;
            var completed = this.questSystem.updateProgress('item_collect', { itemId: lootData.id });
            for (var qi = 0; qi < completed.length; qi++) this.onQuestCompleted(completed[qi]);
        } else {
            this.addNotification('Inventory full!', COLORS.DANGER);
        }
    }

    onQuestCompleted(quest) {
        this.addNotification('Quest Complete: ' + quest.title + '!', COLORS.SUCCESS);
        var rewards = this.questSystem.completeQuest(quest.id);
        if (rewards) {
            this.ship.addXP(rewards.xp);
            this.ship.credits += rewards.credits;
            this.addNotification('+' + rewards.xp + ' XP  +' + rewards.credits + ' Credits', COLORS.WARNING);
            if (rewards.loot) {
                var lootItem = this.findLootById(rewards.loot);
                if (lootItem) {
                    this.inventory.addItem(lootItem);
                    this.addNotification('Received: ' + lootItem.name, Helpers.rarityColor(lootItem.rarity));
                }
            }
            if (rewards.unlocks) this.addNotification('NEW AREA UNLOCKED: ' + rewards.unlocks.replace('_', ' ').toUpperCase() + '!', COLORS.LEGENDARY);
            if (rewards.isVictory) { var self = this; this.time.delayedCall(2000, function() { self.scene.start('VictoryScene'); }); }
        }
        this.questSystem.loadQuestsForStage(this.currentStage);
    }

    findLootById(id) {
        for (var tier of ['common', 'uncommon', 'rare', 'legendary']) {
            var item = GameData.loot[tier].find(function(l) { return l.id === id; });
            if (item) return item;
        }
        return null;
    }

    triggerRandomEncounter() {
        var roll = Math.random();
        if (roll < 0.35) {
            for (var i = 0; i < Helpers.randomInt(3, 8); i++) this.spawnAsteroid();
            this.addNotification('Asteroid field detected!', COLORS.WARNING);
        } else if (roll < 0.7) {
            var count = Helpers.randomInt(1, 3);
            for (var j = 0; j < count; j++) this.spawnEnemy();
            this.addNotification('Enemy ships detected!', COLORS.DANGER);
        }
    }

    spawnEnemy() {
        var angle = Helpers.randomFloat(0, Math.PI * 2);
        var dist = Helpers.randomFloat(600, 1200);
        var x = this.ship.x + Math.cos(angle) * dist;
        var y = this.ship.y + Math.sin(angle) * dist;

        var stageLevel = { solar_system: 1, first_galaxy: 5, black_hole: 10 };
        var baseLevel = stageLevel[this.currentStage] || 1;
        var level = baseLevel + Helpers.randomInt(0, 2);
        var type = Helpers.getEnemyForLevel(level);
        this.enemies.push(new Enemy(type, x, y, level));
    }

    spawnAsteroid() {
        var angle = Helpers.randomFloat(0, Math.PI * 2);
        var dist = Helpers.randomFloat(300, 1500);
        var x = this.ship.x + Math.cos(angle) * dist;
        var y = this.ship.y + Math.sin(angle) * dist;
        this.asteroids.push(new Asteroid(x, y));
    }

    drawFrame() {
        this.bgGraphics.clear();
        this.nebulaGraphics.clear();
        this.entityGraphics.clear();
        this.shipGraphics.clear();
        this.fxGraphics.clear();
        this.uiGraphics.clear();

        this.drawParallaxStars();
        this.drawNebulae();
        this.drawSpaceShops();
        this.drawPlanetsInWorld();

        for (var ai = 0; ai < this.asteroids.length; ai++) this.asteroids[ai].draw(this.entityGraphics, this.camX, this.camY);
        for (var ei = 0; ei < this.enemies.length; ei++) this.enemies[ei].draw(this.entityGraphics, this.camX, this.camY);
        for (var li = 0; li < this.lootDrops.length; li++) this.lootDrops[li].draw(this.entityGraphics, this.camX, this.camY);

        // Draw combat effects with camera offset
        this.drawCombatEffectsWithCamera();

        // Draw ship at screen center
        var savedX = this.ship.x, savedY = this.ship.y;
        this.ship.x = GAME_WIDTH / 2;
        this.ship.y = GAME_HEIGHT / 2;
        this.ship.draw(this.shipGraphics);
        this.ship.x = savedX;
        this.ship.y = savedY;

        this.drawUIBars();
        this.drawMinimap();

        // Planet landing prompt
        if (this.nearPlanet) {
            this.uiGraphics.fillStyle(COLORS.SUCCESS, 0.8 + Math.sin(Date.now() / 200) * 0.2);
            var cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2 + 40;
            this.uiGraphics.fillRoundedRect(cx - 80, cy - 10, 160, 22, 4);
            // Text drawn below in updateUI
        }
    }

    drawParallaxStars() {
        var g = this.bgGraphics;
        for (var l = 0; l < this.starLayers.length; l++) {
            var layer = this.starLayers[l];
            var ox = this.camX * layer.parallax;
            var oy = this.camY * layer.parallax;
            for (var s = 0; s < layer.stars.length; s++) {
                var star = layer.stars[s];
                var sx = ((star.x - ox) % 2000 + 3000) % 2000 - 360;
                var sy = ((star.y - oy) % 2000 + 3000) % 2000 - 360;
                if (sx < -10 || sx > GAME_WIDTH + 10 || sy < -10 || sy > GAME_HEIGHT + 10) continue;
                g.fillStyle(star.color, star.alpha);
                g.fillCircle(sx, sy, star.size);
            }
        }
    }

    drawNebulae() {
        var g = this.nebulaGraphics;
        for (var i = 0; i < this.nebulae.length; i++) {
            var neb = this.nebulae[i];
            var sx = neb.x - this.camX * 0.4;
            var sy = neb.y - this.camY * 0.4;
            var wrappedX = ((sx + 3000) % 4000) - 500;
            var wrappedY = ((sy + 3000) % 4000) - 500;
            g.fillStyle(neb.color, neb.alpha);
            g.fillCircle(wrappedX, wrappedY, neb.radius);
        }
    }

    drawSpaceShops() {
        var g = this.entityGraphics;
        for (var i = 0; i < this.spaceShops.length; i++) {
            var shop = this.spaceShops[i];
            var sx = shop.x - this.camX;
            var sy = shop.y - this.camY;
            if (sx < -60 || sx > GAME_WIDTH + 60 || sy < -60 || sy > GAME_HEIGHT + 60) continue;

            var pulse = 1 + Math.sin(shop.pulsePhase) * 0.1;

            // Station structure
            g.fillStyle(0x334455, 0.9);
            g.fillRect(sx - 18 * pulse, sy - 18 * pulse, 36 * pulse, 36 * pulse);
            g.fillStyle(0x222233, 0.9);
            g.fillRect(sx - 22 * pulse, sy - 5, 44 * pulse, 10);
            g.fillRect(sx - 5, sy - 22 * pulse, 10, 44 * pulse);

            // Color accent
            g.fillStyle(shop.color, 0.8);
            g.fillCircle(sx, sy, 6 * pulse);

            // Rotating ring
            var ringAngle = shop.pulsePhase * 0.5;
            for (var r = 0; r < 4; r++) {
                var ra = ringAngle + (r / 4) * Math.PI * 2;
                g.fillStyle(shop.color, 0.4);
                g.fillCircle(sx + Math.cos(ra) * 20 * pulse, sy + Math.sin(ra) * 20 * pulse, 3);
            }

            // Proximity glow
            var dist = Helpers.distance(this.ship.x, this.ship.y, shop.x, shop.y);
            if (dist < 120) {
                g.lineStyle(2, shop.color, 0.5 + Math.sin(shop.pulsePhase * 2) * 0.3);
                g.strokeCircle(sx, sy, 35);
                if (dist < 80) {
                    g.lineStyle(2, COLORS.SUCCESS, 0.8);
                    g.strokeCircle(sx, sy, 40);
                }
            }
        }
    }

    drawPlanetsInWorld() {
        var g = this.entityGraphics;
        for (var i = 0; i < this.planets.length; i++) {
            var planet = this.planets[i];
            var wx = planet.worldX || 0;
            var wy = planet.worldY || 0;
            var sx = wx - this.camX;
            var sy = wy - this.camY;

            // Draw if on screen
            if (sx > -80 && sx < GAME_WIDTH + 80 && sy > -80 && sy < GAME_HEIGHT + 80) {
                var r = planet.radius * 2;
                if (planet.hasRings) {
                    g.lineStyle(3, 0xddcc88, 0.4);
                    g.strokeEllipse(sx, sy, r * 3.5, r * 1.2);
                }
                g.fillStyle(planet.color, planet.unlocked ? 0.15 : 0.05);
                g.fillCircle(sx, sy, r * 1.8);
                g.fillStyle(planet.color, planet.unlocked ? 1 : 0.3);
                g.fillCircle(sx, sy, r);
                g.fillStyle(0xffffff, 0.12);
                g.fillCircle(sx - r * 0.2, sy - r * 0.2, r * 0.6);
                g.fillStyle(0x000000, 0.2);
                g.fillCircle(sx + r * 0.2, sy + r * 0.2, r * 0.5);

                if (planet.isBossArea && planet.unlocked) {
                    g.lineStyle(2, COLORS.DANGER, 0.4 + Math.sin(Date.now() / 300) * 0.3);
                    g.strokeCircle(sx, sy, r + 10);
                }
            } else {
                // Draw edge indicator arrow pointing to planet
                this.drawEdgeIndicator(g, sx, sy, planet.color, planet.name);
            }
        }
    }

    drawEdgeIndicator(g, sx, sy, color, name) {
        var cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2;
        var angle = Math.atan2(sy - cy, sx - cx);
        var padding = 40;

        var edgeX = Helpers.clamp(cx + Math.cos(angle) * (GAME_WIDTH / 2 - padding), padding, GAME_WIDTH - padding);
        var edgeY = Helpers.clamp(cy + Math.sin(angle) * (GAME_HEIGHT / 2 - padding), padding, GAME_HEIGHT - padding);

        g.fillStyle(color, 0.7);
        g.fillTriangle(
            edgeX + Math.cos(angle) * 10, edgeY + Math.sin(angle) * 10,
            edgeX + Math.cos(angle + 2.5) * 6, edgeY + Math.sin(angle + 2.5) * 6,
            edgeX + Math.cos(angle - 2.5) * 6, edgeY + Math.sin(angle - 2.5) * 6
        );
        g.fillStyle(color, 0.4);
        g.fillCircle(edgeX, edgeY, 4);
    }

    drawCombatEffectsWithCamera() {
        var g = this.fxGraphics;
        var combat = this.combatSystem;
        // Projectiles
        for (var i = 0; i < combat.projectiles.length; i++) {
            var p = combat.projectiles[i];
            if (!p.alive) continue;
            var sx = p.x - this.camX;
            var sy = p.y - this.camY;
            if (sx < -20 || sx > GAME_WIDTH + 20 || sy < -20 || sy > GAME_HEIGHT + 20) continue;
            g.fillStyle(p.color, 0.3);
            g.fillCircle(sx - p.velocityX * 0.003, sy - p.velocityY * 0.003, p.size * 0.8);
            g.fillStyle(p.color, 1);
            g.fillCircle(sx, sy, p.size);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(sx, sy, p.size * 0.4);
        }
        // Explosions
        if (combat.explosions) {
            for (var e = 0; e < combat.explosions.length; e++) {
                var exp = combat.explosions[e];
                var esx = exp.x - this.camX;
                var esy = exp.y - this.camY;
                g.fillStyle(exp.color, exp.alpha || 0.5);
                g.fillCircle(esx, esy, exp.radius || 5);
            }
        }
        // Damage numbers
        if (combat.damageNumbers) {
            for (var d = 0; d < combat.damageNumbers.length; d++) {
                var dn = combat.damageNumbers[d];
                var dnx = dn.x - this.camX;
                var dny = dn.y - this.camY;
                g.fillStyle(dn.color, dn.alpha || 0.8);
                g.fillCircle(dnx, dny, 4);
            }
        }
        // Missiles
        if (combat.missiles) {
            for (var m = 0; m < combat.missiles.length; m++) {
                var mis = combat.missiles[m];
                if (!mis.alive) continue;
                var msx = mis.x - this.camX;
                var msy = mis.y - this.camY;
                g.fillStyle(0xff8800, 0.8);
                g.fillCircle(msx, msy, 4);
                g.fillStyle(0xff4400, 0.3);
                g.fillCircle(msx - mis.velocityX * 0.005, msy - mis.velocityY * 0.005, 3);
            }
        }
    }

    drawUIBars() {
        var g = this.uiGraphics;
        var ship = this.ship;

        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(8, 8, 200, 98, 6);

        var healthPct = ship.health / ship.maxHealth;
        g.fillStyle(0x222233, 0.8);
        g.fillRoundedRect(70, 14, 130, 12, 3);
        g.fillStyle(healthPct > 0.3 ? COLORS.HEALTH : COLORS.DANGER, 0.9);
        g.fillRoundedRect(70, 14, 130 * healthPct, 12, 3);

        var shieldPct = ship.shield / ship.maxShield;
        g.fillStyle(0x222233, 0.8);
        g.fillRoundedRect(70, 40, 130, 12, 3);
        g.fillStyle(COLORS.SHIELD, ship.shieldActive ? 0.9 : 0.3);
        g.fillRoundedRect(70, 40, 130 * shieldPct, 12, 3);

        var fuelPct = ship.fuel / ship.maxFuel;
        g.fillStyle(0x222233, 0.8);
        g.fillRoundedRect(70, 66, 130, 12, 3);
        g.fillStyle(fuelPct > 0.2 ? COLORS.FUEL : COLORS.DANGER, 0.9);
        g.fillRoundedRect(70, 66, 130 * fuelPct, 12, 3);

        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(GAME_WIDTH - 195, 8, 190, 62, 6);

        var xpPct = ship.xp / ship.xpToLevel;
        g.fillStyle(0x222233, 0.8);
        g.fillRoundedRect(GAME_WIDTH - 185, 55, 170, 8, 3);
        g.fillStyle(COLORS.XP, 0.8);
        g.fillRoundedRect(GAME_WIDTH - 185, 55, 170 * xpPct, 8, 3);
    }

    drawMinimap() {
        var g = this.uiGraphics;
        var mmSize = 120;
        var mmX = GAME_WIDTH - mmSize - 15;
        var mmY = GAME_HEIGHT - mmSize - 45;
        var mmScale = mmSize / 6000; // Shows 6000 unit range

        g.fillStyle(0x000000, 0.5);
        g.fillRoundedRect(mmX, mmY, mmSize, mmSize, 6);
        g.lineStyle(1, COLORS.TEXT_DIM, 0.3);
        g.strokeRoundedRect(mmX, mmY, mmSize, mmSize, 6);

        var centerMX = mmX + mmSize / 2;
        var centerMY = mmY + mmSize / 2;

        // Planets
        for (var i = 0; i < this.planets.length; i++) {
            var p = this.planets[i];
            var px = centerMX + ((p.worldX || 0) - this.ship.x) * mmScale;
            var py = centerMY + ((p.worldY || 0) - this.ship.y) * mmScale;
            if (px > mmX + 2 && px < mmX + mmSize - 2 && py > mmY + 2 && py < mmY + mmSize - 2) {
                g.fillStyle(p.color, p.unlocked ? 0.9 : 0.3);
                g.fillCircle(px, py, Math.max(2, p.radius * 0.15));
            }
        }

        // Space shops
        for (var s = 0; s < this.spaceShops.length; s++) {
            var shop = this.spaceShops[s];
            var shx = centerMX + (shop.x - this.ship.x) * mmScale;
            var shy = centerMY + (shop.y - this.ship.y) * mmScale;
            if (shx > mmX + 2 && shx < mmX + mmSize - 2 && shy > mmY + 2 && shy < mmY + mmSize - 2) {
                g.fillStyle(shop.color, 0.7);
                g.fillRect(shx - 2, shy - 2, 4, 4);
            }
        }

        // Enemies
        for (var e = 0; e < this.enemies.length; e++) {
            var enemy = this.enemies[e];
            if (!enemy.alive) continue;
            var ex = centerMX + (enemy.x - this.ship.x) * mmScale;
            var ey = centerMY + (enemy.y - this.ship.y) * mmScale;
            if (ex > mmX + 2 && ex < mmX + mmSize - 2 && ey > mmY + 2 && ey < mmY + mmSize - 2) {
                g.fillStyle(COLORS.DANGER, 0.6);
                g.fillCircle(ex, ey, 1.5);
            }
        }

        // Player dot (center)
        g.fillStyle(COLORS.PRIMARY, 1);
        g.fillCircle(centerMX, centerMY, 3);
        // Direction indicator
        g.lineStyle(1, COLORS.PRIMARY, 0.6);
        g.lineBetween(centerMX, centerMY,
            centerMX + Math.cos(this.ship.rotation) * 8,
            centerMY + Math.sin(this.ship.rotation) * 8);
    }

    updateUI() {
        var ship = this.ship;
        this.healthText.setText('HP ' + Math.ceil(ship.health) + '/' + ship.maxHealth);
        this.shieldText.setText('SH ' + Math.ceil(ship.shield) + '/' + ship.maxShield);
        this.fuelText.setText('FL ' + Math.ceil(ship.fuel) + '/' + ship.maxFuel);
        this.levelText.setText('LVL ' + ship.level);
        this.creditsText.setText(Helpers.formatNumber(ship.credits) + ' CR');
        this.xpText.setText('XP ' + ship.xp + '/' + ship.xpToLevel);
        this.missileText.setText('MSL ' + ship.missiles + '/' + ship.maxMissiles);
        this.coordText.setText('X:' + Math.floor(ship.x) + ' Y:' + Math.floor(ship.y));

        if (this.questSystem.activeQuests.length > 0) {
            var q = this.questSystem.activeQuests[0];
            var pct = Math.floor((q.progress || 0) * 100);
            this.questText.setText('📋 ' + q.title + '\n' + q.description + '\nProgress: ' + pct + '%');
        } else {
            this.questText.setText('No active quests. Press J for quests.');
        }

        // Planet landing prompt text
        if (this.nearPlanet && !this.landPromptText) {
            this.landPromptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 41, 'Press E to land on ' + this.nearPlanet.name, {
                fontFamily: 'monospace', fontSize: '11px', color: '#000000', fontStyle: 'bold'
            }).setOrigin(0.5);
        } else if (!this.nearPlanet && this.landPromptText) {
            this.landPromptText.destroy();
            this.landPromptText = null;
        } else if (this.nearPlanet && this.landPromptText) {
            this.landPromptText.setText('Press E to land on ' + this.nearPlanet.name);
        }

        // Shop proximity indicators
        for (var i = 0; i < this.spaceShops.length; i++) {
            var shop = this.spaceShops[i];
            if (Helpers.distance(this.ship.x, this.ship.y, shop.x, shop.y) < 80) {
                if (!this.shopPromptText) {
                    this.shopPromptText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 65, 'Press F to open ' + shop.name, {
                        fontFamily: 'monospace', fontSize: '11px', color: '#ffdd00', stroke: '#000000', strokeThickness: 3
                    }).setOrigin(0.5);
                } else {
                    this.shopPromptText.setText('Press F to open ' + shop.name);
                }
                this.shopPromptText.setVisible(true);
                return;
            }
        }
        if (this.shopPromptText) this.shopPromptText.setVisible(false);
    }

    addNotification(text, color) {
        var notif = this.add.text(GAME_WIDTH / 2, 0, text, {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#' + (color || COLORS.TEXT).toString(16).padStart(6, '0'),
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);

        var y = 45 + this.notifications.length * 22;
        notif.setY(y);

        this.tweens.add({
            targets: notif, alpha: 1, duration: 200, yoyo: true, hold: 2500,
            onComplete: function() { notif.destroy(); this.notifications = this.notifications.filter(function(n) { return n !== notif; }); }.bind(this)
        });

        this.notifications.push(notif);
        if (this.notifications.length > 5) {
            var old = this.notifications.shift();
            if (old && old.active) old.destroy();
        }
    }

    updateNotifications(dt) {
        for (var i = 0; i < this.notifications.length; i++) {
            if (this.notifications[i] && this.notifications[i].active) {
                this.notifications[i].y = Helpers.lerp(this.notifications[i].y, 45 + i * 22, 0.1);
            }
        }
    }

    processCombatResult(result) {
        if (result.won) {
            this.addNotification('Combat Victory!', COLORS.SUCCESS);
            if (result.xp) this.ship.addXP(result.xp);
            if (result.credits) this.ship.credits += result.credits;
        }
    }

    openMap() {
        this.questSystem.currentStage = this.currentStage;
        this.saveSystem.save(this.ship, this.questSystem, this.inventory);
        this.scene.start('MapScene', { stage: this.currentStage });
    }

    openInventory() { this.scene.launch('InventoryScene'); this.scene.pause(); }
    openUpgrades() { this.scene.launch('UpgradeScene'); this.scene.pause(); }
    openQuests() { this.scene.launch('QuestScene', { stage: this.currentStage }); this.scene.pause(); }

    pauseGame() {
        this.questSystem.currentStage = this.currentStage;
        this.saveSystem.save(this.ship, this.questSystem, this.inventory);
        this.addNotification('Game saved!', COLORS.SUCCESS);
    }

    gameOver() {
        this.questSystem.currentStage = this.currentStage;
        this.saveSystem.save(this.ship, this.questSystem, this.inventory);
        this.scene.start('GameOverScene');
    }

    playSound(type) {
        if (!this.game.audioCtx) return;
        var ctx = this.game.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        try {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            switch (type) {
                case 'laser':
                    osc.type = 'square'; osc.frequency.setValueAtTime(800, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1); break;
                case 'missile':
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
                    gain.gain.setValueAtTime(0.04, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3); break;
                case 'hit':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
                    gain.gain.setValueAtTime(0.06, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08); break;
                case 'explosion':
                    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4); break;
                case 'pickup':
                    osc.type = 'sine'; osc.frequency.setValueAtTime(500, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.04, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15); break;
                case 'playerHit':
                    osc.type = 'square'; osc.frequency.setValueAtTime(150, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.07, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2); break;
            }
        } catch (e) { }
    }
}
