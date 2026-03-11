// Boot Scene - Asset generation and loading
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.load.setCORS('anonymous');
        this.preloadOnlineAssets();
        this.createLoadingBar();
    }

    preloadOnlineAssets() {
        if (typeof ONLINE_ASSETS === 'undefined') return;

        for (var i = 0; i < ONLINE_ASSETS.images.length; i++) {
            var img = ONLINE_ASSETS.images[i];
            this.load.image(img.key, img.url);
        }

        for (var j = 0; j < ONLINE_ASSETS.audio.length; j++) {
            var snd = ONLINE_ASSETS.audio[j];
            this.load.audio(snd.key, snd.urls);
        }
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
        this.generateFallbackTextures();
        this.registry.set('onlineAssetsReady', this.areOnlineAssetsReady());

        // Generate texture data for sounds (Web Audio)
        this.generateSoundEffects();
    }

    areOnlineAssetsReady() {
        return typeof ONLINE_ASSETS !== 'undefined';
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

    generateFallbackTextures() {
        this.ensureFallbackTexture('ship_player', function(g) {
            g.fillStyle(0x00d4ff, 1);
            g.fillTriangle(24, 4, 6, 44, 42, 44);
            g.fillStyle(0xffffff, 0.35);
            g.fillTriangle(24, 10, 15, 32, 33, 32);
        }, 48, 48);

        this.ensureFallbackTexture('ship_player_alt', function(g) {
            g.fillStyle(0x66ddff, 1);
            g.fillRect(10, 10, 28, 28);
            g.fillStyle(0x003344, 0.5);
            g.fillRect(17, 4, 14, 12);
        }, 48, 48);

        this.ensureFallbackTexture('character_player', function(g) {
            g.fillStyle(0x22ccee, 1);
            g.fillCircle(16, 10, 7);
            g.fillStyle(0x1188aa, 1);
            g.fillRoundedRect(8, 18, 16, 20, 4);
            g.fillStyle(0xffffff, 0.2);
            g.fillRect(11, 22, 10, 8);
        }, 32, 40);

        this.ensureFallbackTexture('enemy_pirate', function(g) {
            g.fillStyle(0xff4444, 1);
            g.fillTriangle(24, 4, 6, 44, 42, 44);
        }, 48, 48);
        this.ensureFallbackTexture('enemy_alien', function(g) {
            g.fillStyle(0x66ff66, 1);
            g.fillEllipse(24, 24, 36, 26);
            g.fillStyle(0x112211, 1);
            g.fillCircle(18, 22, 3);
            g.fillCircle(30, 22, 3);
        }, 48, 48);
        this.ensureFallbackTexture('enemy_drone', function(g) {
            g.fillStyle(0xffcc44, 1);
            g.fillRect(8, 14, 32, 20);
            g.fillStyle(0x333333, 1);
            g.fillCircle(24, 24, 5);
        }, 48, 48);
        this.ensureFallbackTexture('enemy_boss', function(g) {
            g.fillStyle(0xff3366, 1);
            g.fillCircle(32, 32, 26);
            g.fillStyle(0xffdd00, 1);
            g.fillTriangle(22, 8, 32, 0, 42, 8);
        }, 64, 64);

        this.ensureFallbackTexture('asteroid_sprite', function(g) {
            g.fillStyle(0x887766, 1);
            g.fillCircle(32, 32, 28);
            g.fillStyle(0x000000, 0.2);
            g.fillCircle(40, 38, 12);
        }, 64, 64);
        this.ensureFallbackTexture('terrain_rock', function(g) {
            g.fillStyle(0x776655, 1);
            g.fillCircle(24, 24, 20);
            g.fillStyle(0x000000, 0.2);
            g.fillCircle(29, 28, 8);
        }, 48, 48);
        this.ensureFallbackTexture('terrain_crystal', function(g) {
            g.fillStyle(0x88ddff, 0.85);
            g.fillTriangle(24, 2, 8, 40, 40, 40);
            g.fillStyle(0xffffff, 0.25);
            g.fillTriangle(24, 8, 16, 30, 32, 30);
        }, 48, 48);
        this.ensureFallbackTexture('terrain_pillar', function(g) {
            g.fillStyle(0x666677, 1);
            g.fillRoundedRect(12, 4, 24, 40, 3);
            g.fillStyle(0x444455, 0.6);
            g.fillRect(20, 8, 8, 32);
        }, 48, 48);
        this.ensureFallbackTexture('terrain_ruins', function(g) {
            g.fillStyle(0x778899, 1);
            g.fillRect(6, 16, 36, 22);
            g.fillStyle(0x556677, 1);
            g.fillRect(12, 8, 24, 12);
            g.fillStyle(0x000000, 0.15);
            g.fillCircle(28, 26, 5);
        }, 48, 48);
        this.ensureFallbackTexture('terrain_plant', function(g) {
            g.fillStyle(0x33aa55, 0.9);
            g.fillCircle(16, 26, 10);
            g.fillCircle(30, 24, 11);
            g.fillCircle(23, 16, 9);
            g.fillStyle(0x228844, 1);
            g.fillRect(21, 28, 4, 12);
        }, 48, 48);
        this.ensureFallbackTexture('terrain_deco', function(g) {
            g.fillStyle(0xbb9955, 0.8);
            g.fillCircle(8, 8, 5);
        }, 16, 16);
        this.ensureFallbackTexture('shop_sprite', function(g) {
            g.fillStyle(0x00ffaa, 1);
            g.fillRect(8, 8, 32, 32);
            g.fillStyle(0xffffff, 0.25);
            g.fillRect(14, 14, 20, 20);
        }, 48, 48);
        this.ensureFallbackTexture('object_sprite', function(g) {
            g.fillStyle(0x888899, 1);
            g.fillRect(6, 10, 20, 16);
            g.fillStyle(0x444455, 1);
            g.fillRect(12, 4, 8, 8);
        }, 32, 32);
        this.ensureFallbackTexture('loot_sprite', function(g) {
            g.fillStyle(0x44aaff, 0.8);
            g.fillCircle(16, 16, 10);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(13, 13, 4);
        }, 32, 32);
        this.ensureFallbackTexture('planet_sprite', function(g) {
            g.fillStyle(0x6677aa, 1);
            g.fillCircle(32, 32, 28);
            g.fillStyle(0xffffff, 0.2);
            g.fillCircle(24, 24, 12);
        }, 64, 64);
        this.ensureFallbackTexture('laser_blue', function(g) {
            g.fillStyle(0x33ccff, 1);
            g.fillCircle(8, 8, 6);
        }, 16, 16);
        this.ensureFallbackTexture('bg_space', function(g) {
            g.fillStyle(0x060a22, 1);
            g.fillRect(0, 0, 256, 256);
            for (var i = 0; i < 120; i++) {
                g.fillStyle(0xffffff, Math.random());
                g.fillCircle(Math.random() * 256, Math.random() * 256, Math.random() * 1.5 + 0.5);
            }
        }, 256, 256);
    }

    ensureFallbackTexture(key, drawFn, w, h) {
        if (this.textures.exists(key)) return;
        var g = this.make.graphics({ x: 0, y: 0, add: false });
        drawFn(g);
        g.generateTexture(key, w, h);
        g.destroy();
    }
}
