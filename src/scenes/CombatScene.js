// Combat Scene - Dedicated combat encounters
class CombatScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CombatScene' });
    }

    init(data) {
        this.enemyType = data.enemyType || 'pirate';
        this.enemyLevel = data.level || 1;
        this.isBoss = data.isBoss || false;
        this.previousScene = data.previousScene || 'SpaceScene';
    }

    create() {
        this.ship = this.registry.get('ship');
        this.combatSystem = new CombatSystem();

        // Background
        this.add.graphics().fillStyle(COLORS.BG_DARK, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        Helpers.generateStars(this, 200, GAME_WIDTH, GAME_HEIGHT);

        // Spawn enemy
        this.enemy = new Enemy(this.enemyType, GAME_WIDTH * 0.7, GAME_HEIGHT / 2, this.enemyLevel);

        // Position player
        this.ship.x = GAME_WIDTH * 0.3;
        this.ship.y = GAME_HEIGHT / 2;
        this.ship.rotation = 0;
        this.ship.velocityX = 0;
        this.ship.velocityY = 0;

        // Graphics
        this.gameGraphics = this.add.graphics();
        this.fxGraphics = this.add.graphics();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        };

        // Boss name
        if (this.isBoss) {
            this.add.text(GAME_WIDTH / 2, 30, this.enemy.name, {
                fontFamily: 'monospace', fontSize: '20px', color: '#ff4444', fontStyle: 'bold'
            }).setOrigin(0.5);
        }

        // Damage numbers (text objects pool)
        this.damageTexts = [];

        this.combatOver = false;
    }

    update(time, delta) {
        if (this.combatOver) return;
        const dt = delta;

        // Input
        if (this.keys.A.isDown || this.cursors.left.isDown) this.ship.rotation -= 3.5 * (dt / 1000);
        if (this.keys.D.isDown || this.cursors.right.isDown) this.ship.rotation += 3.5 * (dt / 1000);

        if (this.keys.W.isDown || this.cursors.up.isDown) {
            this.ship.velocityX += Math.cos(this.ship.rotation) * this.ship.speed * (dt / 1000);
            this.ship.velocityY += Math.sin(this.ship.rotation) * this.ship.speed * (dt / 1000);
        }
        if (this.keys.S.isDown || this.cursors.down.isDown) {
            this.ship.velocityX *= 0.95;
            this.ship.velocityY *= 0.95;
        }

        // Fire
        if (this.keys.SPACE.isDown && this.ship.canFire()) {
            this.ship.fire();
            const px = this.ship.x + Math.cos(this.ship.rotation) * this.ship.size;
            const py = this.ship.y + Math.sin(this.ship.rotation) * this.ship.size;
            this.combatSystem.createProjectile(px, py, this.ship.rotation, 600, this.ship.damage, true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.E) && this.ship.missiles > 0) {
            this.ship.missiles--;
            const px = this.ship.x + Math.cos(this.ship.rotation) * this.ship.size;
            const py = this.ship.y + Math.sin(this.ship.rotation) * this.ship.size;
            this.combatSystem.createMissile(px, py, this.ship.rotation, this.ship.damage, this.enemy.x, this.enemy.y);
        }

        // Ship physics
        this.ship.x += this.ship.velocityX * (dt / 1000);
        this.ship.y += this.ship.velocityY * (dt / 1000);
        this.ship.velocityX *= 0.995;
        this.ship.velocityY *= 0.995;
        this.ship.x = Helpers.clamp(this.ship.x, 20, GAME_WIDTH - 20);
        this.ship.y = Helpers.clamp(this.ship.y, 20, GAME_HEIGHT - 20);

        // Enemy AI
        this.enemy.update(dt, this.ship.x, this.ship.y);
        if (this.enemy.canFire()) {
            this.enemy.fire();
            const angle = Helpers.angleBetween(this.enemy.x, this.enemy.y, this.ship.x, this.ship.y);
            this.combatSystem.createProjectile(
                this.enemy.x + Math.cos(angle) * this.enemy.size,
                this.enemy.y + Math.sin(angle) * this.enemy.size,
                angle, 400, this.enemy.damage, false, COLORS.DANGER
            );
        }

        // Update projectiles
        this.combatSystem.update(dt);

        // Collisions
        for (let proj of this.combatSystem.projectiles) {
            if (!proj.alive) continue;

            if (proj.isPlayer && Helpers.distance(proj.x, proj.y, this.enemy.x, this.enemy.y) < this.enemy.size + proj.size) {
                proj.alive = false;
                const killed = this.enemy.takeDamage(proj.damage);
                this.combatSystem.addExplosion(proj.x, proj.y, 8, COLORS.PRIMARY);
                this.showDamage(this.enemy.x, this.enemy.y - this.enemy.size, proj.damage, '#ffdd00');

                if (killed) {
                    this.combatSystem.addExplosion(this.enemy.x, this.enemy.y, this.enemy.size * 2, this.enemy.color);
                    this.onVictory();
                    return;
                }
            }

            if (!proj.isPlayer && Helpers.distance(proj.x, proj.y, this.ship.x, this.ship.y) < this.ship.size + proj.size) {
                proj.alive = false;
                const dead = this.ship.takeDamage(proj.damage);
                this.combatSystem.addExplosion(proj.x, proj.y, 6, COLORS.DANGER);
                this.showDamage(this.ship.x, this.ship.y - this.ship.size - 10, proj.damage, '#ff3366');

                if (dead) {
                    this.onDefeat();
                    return;
                }
            }
        }

        // Shield regen
        if (this.ship.shieldActive && this.ship.shield < this.ship.maxShield) {
            this.ship.rechargeShield(1 * (dt / 1000));
        }

        // Draw
        this.gameGraphics.clear();
        this.fxGraphics.clear();

        this.enemy.draw(this.gameGraphics);
        this.ship.draw(this.gameGraphics);
        this.combatSystem.draw(this.fxGraphics);

        // Boss health bar at top
        if (this.isBoss) {
            const barW = 400;
            const barH = 12;
            const barX = GAME_WIDTH / 2 - barW / 2;
            this.gameGraphics.fillStyle(0x222233, 0.8);
            this.gameGraphics.fillRoundedRect(barX, 55, barW, barH, 4);
            const pct = this.enemy.health / this.enemy.maxHealth;
            this.gameGraphics.fillStyle(COLORS.DANGER, 1);
            this.gameGraphics.fillRoundedRect(barX, 55, barW * pct, barH, 4);
        }

        // Player health/shield
        this.gameGraphics.fillStyle(0x000000, 0.5);
        this.gameGraphics.fillRoundedRect(8, GAME_HEIGHT - 45, 200, 38, 6);

        const hp = this.ship.health / this.ship.maxHealth;
        this.gameGraphics.fillStyle(0x222233, 0.8);
        this.gameGraphics.fillRoundedRect(12, GAME_HEIGHT - 40, 190, 12, 3);
        this.gameGraphics.fillStyle(COLORS.HEALTH, 0.9);
        this.gameGraphics.fillRoundedRect(12, GAME_HEIGHT - 40, 190 * hp, 12, 3);

        const sp = this.ship.shield / this.ship.maxShield;
        this.gameGraphics.fillStyle(0x222233, 0.8);
        this.gameGraphics.fillRoundedRect(12, GAME_HEIGHT - 22, 190, 12, 3);
        this.gameGraphics.fillStyle(COLORS.SHIELD, 0.9);
        this.gameGraphics.fillRoundedRect(12, GAME_HEIGHT - 22, 190 * sp, 12, 3);
    }

    showDamage(x, y, amount, color) {
        const text = this.add.text(x, y, '-' + amount, {
            fontFamily: 'monospace', fontSize: '14px', color: color, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    onVictory() {
        this.combatOver = true;
        const xp = this.enemy.xpReward;
        const credits = this.enemy.creditReward;
        this.ship.addXP(xp);
        this.ship.credits += credits;
        this.ship.enemiesKilled++;
        this.ship.killsByType[this.enemyType] = (this.ship.killsByType[this.enemyType] || 0) + 1;
        if (this.isBoss) this.ship.bossesDefeated.push(this.enemyType);

        // Quest progress
        const questSystem = this.registry.get('questSystem');
        if (questSystem) {
            const eventType = this.isBoss ? 'boss_kill' : 'enemy_kill';
            questSystem.updateProgress(eventType, { enemyType: this.enemyType });
        }

        this.time.delayedCall(1500, () => {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'VICTORY!', {
                fontFamily: 'monospace', fontSize: '36px', color: '#00ff88', fontStyle: 'bold'
            }).setOrigin(0.5);

            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `+${xp} XP    +${credits} Credits`, {
                fontFamily: 'monospace', fontSize: '16px', color: '#ffdd00'
            }).setOrigin(0.5);

            this.time.delayedCall(2000, () => {
                this.scene.start('SpaceScene', {
                    returnFromCombat: true,
                    combatResult: { won: true, xp, credits }
                });
            });
        });
    }

    onDefeat() {
        this.combatOver = true;
        this.combatSystem.addExplosion(this.ship.x, this.ship.y, 30, COLORS.SECONDARY);

        this.time.delayedCall(1500, () => {
            this.scene.start('GameOverScene');
        });
    }
}
