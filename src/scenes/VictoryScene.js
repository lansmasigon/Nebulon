// Victory Scene
class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    create() {
        const ship = this.registry.get('ship');

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x000a15, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Bright stars
        for (let i = 0; i < 200; i++) {
            const x = Helpers.randomFloat(0, GAME_WIDTH);
            const y = Helpers.randomFloat(0, GAME_HEIGHT);
            const size = Helpers.randomFloat(0.5, 2.5);
            const color = Helpers.randomElement([0xffffff, 0x88ccff, 0xffddaa, 0xaaffaa]);
            bg.fillStyle(color, Helpers.randomFloat(0.3, 1));
            bg.fillCircle(x, y, size);
        }

        // Nebula celebration
        const colors = [0x4400ff, 0x0044ff, 0xff8800, 0x00ff88];
        for (let i = 0; i < 10; i++) {
            bg.fillStyle(Helpers.randomElement(colors), Helpers.randomFloat(0.05, 0.15));
            bg.fillCircle(Helpers.randomFloat(0, GAME_WIDTH), Helpers.randomFloat(0, GAME_HEIGHT), Helpers.randomFloat(60, 180));
        }

        // Victory text
        const title = this.add.text(GAME_WIDTH / 2, 120, 'VICTORY!', {
            fontFamily: 'monospace', fontSize: '56px', color: '#ffdd00', fontStyle: 'bold',
            stroke: '#443300', strokeThickness: 5
        }).setOrigin(0.5);

        // Pulsing animation
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(GAME_WIDTH / 2, 190, 'The Void Titan has been defeated!', {
            fontFamily: 'monospace', fontSize: '18px', color: '#00d4ff'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 220, 'You have conquered the deepest reaches of space.', {
            fontFamily: 'monospace', fontSize: '14px', color: '#888899'
        }).setOrigin(0.5);

        // Stats panel
        Helpers.createPanel(this, GAME_WIDTH / 2 - 200, 260, 400, 250, 0.8);

        this.add.text(GAME_WIDTH / 2, 280, 'JOURNEY STATS', {
            fontFamily: 'monospace', fontSize: '16px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        if (ship) {
            const stats = [
                `Final Level: ${ship.level}`,
                `Total Enemies Defeated: ${ship.enemiesKilled}`,
                `Planets Explored: ${ship.planetsVisited.length}`,
                `Bosses Defeated: ${ship.bossesDefeated.length}`,
                `Final Ship: ${GameData.ships.find(s => s.id === ship.shipType)?.name || 'Scout Ship'}`,
                `Credits Remaining: ${Helpers.formatNumber(ship.credits)}`,
                '',
                `Total Play Score: ${Math.floor(
                    ship.level * 100 +
                    ship.enemiesKilled * 10 +
                    ship.planetsVisited.length * 50 +
                    ship.bossesDefeated.length * 500 +
                    ship.credits * 0.1
                )}`
            ];

            this.add.text(GAME_WIDTH / 2, 310, stats.join('\n'), {
                fontFamily: 'monospace', fontSize: '13px', color: '#ccccdd',
                lineSpacing: 5, align: 'center'
            }).setOrigin(0.5, 0);
        }

        // Celebratory particles
        this.time.addEvent({
            delay: 300,
            callback: () => this.spawnFirework(),
            loop: true
        });

        // Buttons
        Helpers.createButton(this, GAME_WIDTH / 2, 560, 220, 45, 'NEW GAME+', () => {
            // Keep upgrades, start over with harder enemies
            const saveSystem = new SaveSystem();
            saveSystem.deleteSave();
            this.registry.remove('ship');
            this.registry.remove('questSystem');
            this.registry.remove('inventory');
            this.scene.start('MenuScene');
        }, COLORS.PRIMARY);

        Helpers.createButton(this, GAME_WIDTH / 2, 620, 220, 45, 'MAIN MENU', () => {
            this.registry.remove('ship');
            this.registry.remove('questSystem');
            this.registry.remove('inventory');
            this.scene.start('MenuScene');
        }, COLORS.TEXT_DIM);
    }

    spawnFirework() {
        const x = Helpers.randomFloat(100, GAME_WIDTH - 100);
        const y = Helpers.randomFloat(50, GAME_HEIGHT - 100);
        const color = Helpers.randomElement([0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff]);

        const g = this.add.graphics();
        const particles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * Helpers.randomFloat(50, 120),
                vy: Math.sin(angle) * Helpers.randomFloat(50, 120),
                alpha: 1,
                size: Helpers.randomFloat(1, 3)
            });
        }

        const update = this.time.addEvent({
            delay: 16,
            callback: () => {
                g.clear();
                let alive = false;
                for (let p of particles) {
                    p.x += p.vx * 0.016;
                    p.y += p.vy * 0.016;
                    p.vy += 30 * 0.016; // gravity
                    p.alpha -= 0.02;
                    if (p.alpha > 0) {
                        alive = true;
                        g.fillStyle(color, p.alpha);
                        g.fillCircle(p.x, p.y, p.size);
                    }
                }
                if (!alive) {
                    g.destroy();
                    update.remove();
                }
            },
            loop: true
        });
    }
}
