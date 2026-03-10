// Player Ship Entity - Detailed Designs
class Ship {
    constructor(scene) {
        this.scene = scene;
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT / 2;
        this.rotation = -Math.PI / 2;
        this.velocityX = 0;
        this.velocityY = 0;

        // Base stats
        this.baseSpeed = PLAYER_SPEED;
        this.baseMaxHealth = PLAYER_MAX_HEALTH;
        this.baseMaxShield = PLAYER_MAX_SHIELD;
        this.baseDamage = 10;
        this.baseMaxFuel = PLAYER_MAX_FUEL;
        this.baseMaxCargo = 10;

        // Current stats (with upgrades)
        this.speed = this.baseSpeed;
        this.maxHealth = this.baseMaxHealth;
        this.maxShield = this.baseMaxShield;
        this.damage = this.baseDamage;
        this.maxFuel = this.baseMaxFuel;
        this.maxCargo = this.baseMaxCargo;

        // Current values
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.fuel = this.maxFuel;

        // Progression
        this.level = 1;
        this.xp = 0;
        this.xpToLevel = 100;
        this.credits = 100;

        // Upgrade levels
        this.upgrades = {
            speed: 0,
            shield: 0,
            hull: 0,
            damage: 0,
            cargo: 0
        };

        // Ship type
        this.shipType = 'starter';
        this.color = 0x00d4ff;

        // Combat
        this.fireRate = 200;
        this.lastFired = 0;
        this.missiles = 3;
        this.maxMissiles = 3;
        this.shieldActive = true;
        this.boostActive = false;
        this.boostCooldown = 0;
        this.thrusting = false;

        // Visual
        this.size = 16;
        this.thrustParticles = [];
        this.trailParticles = [];
        this.engineGlowPhase = 0;

        // Stats tracking
        this.enemiesKilled = 0;
        this.killsByType = {};
        this.itemsCollected = {};
        this.planetsVisited = [];
        this.bossesDefeated = [];
        this.planetBossesDefeated = [];
        this.planetQuestProgress = {};
    }

    applyUpgrades() {
        const shipData = GameData.ships.find(s => s.id === this.shipType);
        if (shipData) {
            this.baseSpeed = shipData.speed;
            this.baseMaxHealth = shipData.hull;
            this.baseMaxShield = shipData.shield;
            this.baseDamage = shipData.damage;
            this.baseMaxCargo = shipData.cargo;
            this.color = shipData.color;
        }

        this.speed = this.baseSpeed + (this.upgrades.speed > 0 ? GameData.upgrades.speed.levels[this.upgrades.speed - 1].bonus : 0);
        this.maxShield = this.baseMaxShield + (this.upgrades.shield > 0 ? GameData.upgrades.shield.levels[this.upgrades.shield - 1].bonus : 0);
        this.maxHealth = this.baseMaxHealth + (this.upgrades.hull > 0 ? GameData.upgrades.hull.levels[this.upgrades.hull - 1].bonus : 0);
        this.damage = this.baseDamage + (this.upgrades.damage > 0 ? GameData.upgrades.damage.levels[this.upgrades.damage - 1].bonus : 0);
        this.maxCargo = this.baseMaxCargo + (this.upgrades.cargo > 0 ? GameData.upgrades.cargo.levels[this.upgrades.cargo - 1].bonus : 0);
    }

    addXP(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            this.maxHealth += 5;
            this.maxShield += 3;
            this.health = this.maxHealth;
            this.shield = this.maxShield;
            return true;
        }
        return false;
    }

    takeDamage(amount) {
        if (this.shield > 0 && this.shieldActive) {
            const shieldDamage = Math.min(this.shield, amount);
            this.shield -= shieldDamage;
            amount -= shieldDamage;
        }
        this.health -= amount;
        this.health = Math.max(0, this.health);
        return this.health <= 0;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    rechargeShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }

    canFire() {
        return Date.now() - this.lastFired >= this.fireRate;
    }

    fire() {
        this.lastFired = Date.now();
    }

    useFuel(amount) {
        this.fuel -= amount;
        this.fuel = Math.max(0, this.fuel);
        return this.fuel > 0;
    }

    refuel() {
        this.fuel = this.maxFuel;
    }

    draw(graphics) {
        this.engineGlowPhase += 0.1;
        var design = SHIP_DESIGNS[this.shipType] || SHIP_DESIGNS.starter;
        var s = this.size;

        graphics.save();
        graphics.translateCanvas(this.x, this.y);
        graphics.rotateCanvas(this.rotation + Math.PI / 2);

        // Engine glow particles
        if (this.thrusting || this.boostActive) {
            var engineCount = design.engineCount || 1;
            var glowIntensity = this.boostActive ? 0.8 : 0.5;
            var flameLength = this.boostActive ? 1.5 : 1.0;

            for (var e = 0; e < engineCount; e++) {
                var engineOffX = 0;
                if (engineCount === 2) engineOffX = (e === 0 ? -s * 0.3 : s * 0.3);
                else if (engineCount === 3) engineOffX = (e - 1) * s * 0.3;
                else if (engineCount === 4) engineOffX = (e - 1.5) * s * 0.25;

                graphics.fillStyle(0xff6600, glowIntensity * 0.3);
                graphics.fillCircle(engineOffX, s * 0.7 * flameLength, s * 0.25 + Math.random() * 3);
                graphics.fillStyle(0xff8800, glowIntensity * 0.6);
                graphics.fillCircle(engineOffX, s * 0.55 * flameLength, s * 0.15 + Math.random() * 2);
                graphics.fillStyle(0xffcc44, glowIntensity * 0.9);
                graphics.fillCircle(engineOffX, s * 0.45 * flameLength, s * 0.08 + Math.random() * 1);

                if (this.boostActive) {
                    graphics.fillStyle(0xff4400, 0.2);
                    graphics.fillCircle(engineOffX, s * 1.1 + Math.random() * 6, s * 0.2);
                }
            }
        }

        var mainColor = this.color;
        var cockpitColor = Phaser.Display.Color.IntegerToColor(mainColor).brighten(40).color;
        var wingColor = Phaser.Display.Color.IntegerToColor(mainColor).darken(20).color;
        var accentColor = Phaser.Display.Color.IntegerToColor(mainColor).brighten(60).color;

        var colorMap = { main: mainColor, cockpit: cockpitColor, wing: wingColor, accent: accentColor, glow: accentColor };

        for (var i = 0; i < design.bodyParts.length; i++) {
            var part = design.bodyParts[i];
            var partColor = colorMap[part.color] || mainColor;

            if (part.type === 'tri') {
                graphics.fillStyle(partColor, 1);
                graphics.fillTriangle(
                    part.pts[0][0] * s, part.pts[0][1] * s,
                    part.pts[1][0] * s, part.pts[1][1] * s,
                    part.pts[2][0] * s, part.pts[2][1] * s
                );
            } else if (part.type === 'quad') {
                graphics.fillStyle(partColor, 1);
                graphics.beginPath();
                graphics.moveTo(part.pts[0][0] * s, part.pts[0][1] * s);
                graphics.lineTo(part.pts[1][0] * s, part.pts[1][1] * s);
                graphics.lineTo(part.pts[2][0] * s, part.pts[2][1] * s);
                graphics.lineTo(part.pts[3][0] * s, part.pts[3][1] * s);
                graphics.closePath();
                graphics.fillPath();
            } else if (part.type === 'circle') {
                graphics.fillStyle(partColor, 0.8);
                graphics.fillCircle(part.cx * s, part.cy * s, part.r * s);
            }
        }

        if (design.hasStripes) {
            graphics.lineStyle(1, 0xffffff, 0.15);
            graphics.lineBetween(-s * 0.15, -s * 0.5, -s * 0.15, s * 0.3);
            graphics.lineBetween(s * 0.15, -s * 0.5, s * 0.15, s * 0.3);
        }

        graphics.lineStyle(1, 0x000000, 0.15);
        graphics.lineBetween(-s * 0.1, -s * 0.3, -s * 0.1, s * 0.1);
        graphics.lineBetween(s * 0.1, -s * 0.3, s * 0.1, s * 0.1);

        graphics.fillStyle(0xffffff, 0.08);
        graphics.fillCircle(-s * 0.1, -s * 0.3, s * 0.25);

        // Shield visual
        if (this.shieldActive && this.shield > 0) {
            var shieldAlpha = (this.shield / this.maxShield) * 0.25;
            var shieldPulse = Math.sin(this.engineGlowPhase * 2) * 0.1;
            graphics.lineStyle(2, COLORS.SHIELD, shieldAlpha + 0.1 + shieldPulse);
            graphics.strokeCircle(0, 0, s * 1.4);
            graphics.fillStyle(COLORS.SHIELD, shieldAlpha * 0.3);
            graphics.fillCircle(0, 0, s * 1.4);
            for (var a = 0; a < 6; a++) {
                var ang = (a / 6) * Math.PI * 2 + this.engineGlowPhase * 0.5;
                graphics.fillStyle(COLORS.SHIELD, shieldAlpha * 0.5);
                graphics.fillCircle(Math.cos(ang) * s * 1.1, Math.sin(ang) * s * 1.1, 2);
            }
        }

        graphics.restore();
    }

    toSaveData() {
        return {
            level: this.level,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            credits: this.credits,
            health: this.health,
            shield: this.shield,
            fuel: this.fuel,
            upgrades: { ...this.upgrades },
            shipType: this.shipType,
            missiles: this.missiles,
            enemiesKilled: this.enemiesKilled,
            killsByType: { ...this.killsByType },
            itemsCollected: { ...this.itemsCollected },
            planetsVisited: [...this.planetsVisited],
            bossesDefeated: [...this.bossesDefeated],
            planetBossesDefeated: [...(this.planetBossesDefeated || [])],
            planetQuestProgress: { ...(this.planetQuestProgress || {}) }
        };
    }

    loadSaveData(data) {
        Object.assign(this, data);
        if (!this.planetBossesDefeated) this.planetBossesDefeated = [];
        if (!this.planetQuestProgress) this.planetQuestProgress = {};
        this.applyUpgrades();
    }
}
