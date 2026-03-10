// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        const ship = this.registry.get('ship');

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0000, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Dim stars
        for (let i = 0; i < 80; i++) {
            bg.fillStyle(0xff4444, Helpers.randomFloat(0.05, 0.15));
            bg.fillCircle(Helpers.randomFloat(0, GAME_WIDTH), Helpers.randomFloat(0, GAME_HEIGHT), Helpers.randomFloat(0.5, 1.5));
        }

        // Explosion debris
        const debrisG = this.add.graphics();
        for (let i = 0; i < 30; i++) {
            const x = GAME_WIDTH / 2 + Helpers.randomFloat(-200, 200);
            const y = GAME_HEIGHT / 2 + Helpers.randomFloat(-100, 100);
            const size = Helpers.randomFloat(2, 8);
            debrisG.fillStyle(Helpers.randomElement([0x444455, 0x553333, 0x333344]), 0.5);
            debrisG.fillRect(x, y, size, size);
        }

        // Red explosion glow
        debrisG.fillStyle(0xff2200, 0.1);
        debrisG.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 150);
        debrisG.fillStyle(0xff4400, 0.15);
        debrisG.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 80);

        // Game Over text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'SHIP DESTROYED', {
            fontFamily: 'monospace', fontSize: '42px', color: '#ff3366', fontStyle: 'bold',
            stroke: '#330011', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'Your journey has ended...', {
            fontFamily: 'monospace', fontSize: '16px', color: '#884444'
        }).setOrigin(0.5);

        // Stats
        if (ship) {
            const stats = [
                `Level: ${ship.level}`,
                `Enemies Defeated: ${ship.enemiesKilled}`,
                `Planets Visited: ${ship.planetsVisited.length}`,
                `Credits Earned: ${Helpers.formatNumber(ship.credits)}`
            ];

            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, stats.join('\n'), {
                fontFamily: 'monospace', fontSize: '13px', color: '#888899',
                lineSpacing: 6, align: 'center'
            }).setOrigin(0.5);
        }

        // Buttons
        Helpers.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, 200, 45, 'RESPAWN (Keep Progress)', () => {
            // Respawn with half health at the start
            if (ship) {
                ship.health = ship.maxHealth * 0.5;
                ship.shield = ship.maxShield * 0.3;
                ship.credits = Math.floor(ship.credits * 0.8); // Lose 20% credits
            }
            this.scene.start('SpaceScene');
        }, COLORS.SUCCESS);

        Helpers.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 180, 200, 45, 'MAIN MENU', () => {
            // Clear registry
            this.registry.remove('ship');
            this.registry.remove('questSystem');
            this.registry.remove('inventory');
            this.scene.start('MenuScene');
        }, COLORS.TEXT_DIM);
    }
}
