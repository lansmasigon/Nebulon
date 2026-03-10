// Boot Scene - Asset generation and loading
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // We generate all assets procedurally, no external files needed
        this.createLoadingBar();
    }

    createLoadingBar() {
        const width = GAME_WIDTH;
        const height = GAME_HEIGHT;

        const bg = this.add.graphics();
        bg.fillStyle(COLORS.BG_DARK, 1);
        bg.fillRect(0, 0, width, height);

        // Stars
        for (let i = 0; i < 100; i++) {
            bg.fillStyle(0xffffff, Helpers.randomFloat(0.2, 0.8));
            bg.fillCircle(Helpers.randomFloat(0, width), Helpers.randomFloat(0, height), Helpers.randomFloat(0.5, 1.5));
        }

        const title = this.add.text(width / 2, height / 2 - 60, 'NEBULON', {
            fontFamily: 'monospace',
            fontSize: '36px',
            color: '#00d4ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subtitle = this.add.text(width / 2, height / 2, 'Initializing systems...', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#888899'
        }).setOrigin(0.5);

        // Loading bar
        const barWidth = 300;
        const barHeight = 4;
        const barX = width / 2 - barWidth / 2;
        const barY = height / 2 + 40;

        const barBg = this.add.graphics();
        barBg.fillStyle(0x222233, 1);
        barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 2);

        const barFill = this.add.graphics();

        // Animate loading
        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 1500,
            onUpdate: (tween) => {
                const val = tween.getValue();
                barFill.clear();
                barFill.fillStyle(COLORS.PRIMARY, 1);
                barFill.fillRoundedRect(barX, barY, barWidth * (val / 100), barHeight, 2);
            },
            onComplete: () => {
                this.scene.start('MenuScene');
            }
        });
    }

    create() {
        // Generate texture data for sounds (Web Audio)
        this.generateSoundEffects();
    }

    generateSoundEffects() {
        // Store audio context for sound generation
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.game.audioCtx = new AudioContext();
        } catch (e) {
            console.warn('Web Audio not supported');
            this.game.audioCtx = null;
        }
    }
}
