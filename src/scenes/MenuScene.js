// Menu Scene - Main Menu
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.BG_DARK, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Stars
        Helpers.generateStars(this, 200, GAME_WIDTH, GAME_HEIGHT);

        // Animated nebula background
        this.nebulaGraphics = this.add.graphics();
        this.drawNebula();

        // Title
        this.add.text(cx, 140, 'NEBULON', {
            fontFamily: 'monospace',
            fontSize: '64px',
            color: '#00d4ff',
            fontStyle: 'bold',
            stroke: '#003355',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, 265, 'A Space Adventure', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#888899'
        }).setOrigin(0.5);

        // Animated ship
        this.shipX = -50;
        this.shipY = 330;
        this.onlineAssetsReady = this.registry.get('onlineAssetsReady') === true;
        this.menuShipSprite = null;
        if (this.onlineAssetsReady && this.textures.exists('ship_player')) {
            this.menuShipSprite = this.add.image(this.shipX, this.shipY, 'ship_player').setScale(0.4);
        }

        // Buttons
        const saveSystem = new SaveSystem();
        const hasSave = saveSystem.hasSave();

        Helpers.createButton(this, cx, 380, 240, 48, 'NEW GAME', () => {
            saveSystem.deleteSave();
            this.startGame();
        }, COLORS.PRIMARY);

        if (hasSave) {
            Helpers.createButton(this, cx, 440, 240, 48, 'CONTINUE', () => {
                this.startGame(true);
            }, COLORS.SUCCESS);
        }

        Helpers.createButton(this, cx, hasSave ? 500 : 440, 240, 48, 'HOW TO PLAY', () => {
            this.showHelp();
        }, COLORS.WARNING);

        // Version info
        this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v1.0 - MVP', {
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#444455'
        }).setOrigin(1, 1);

        // Floating ship animation
        this.shipGraphics = this.add.graphics();
        this.time.addEvent({
            delay: 16,
            callback: () => this.animateShip(),
            loop: true
        });

        // Play ambient sound
        this.playAmbient();
    }

    drawNebula() {
        const g = this.nebulaGraphics;
        g.clear();
        // Nebula blobs
        const colors = [0x0033aa, 0x220055, 0x003344, 0x110033];
        for (let i = 0; i < 6; i++) {
            const x = Helpers.randomFloat(100, GAME_WIDTH - 100);
            const y = Helpers.randomFloat(50, GAME_HEIGHT - 50);
            const r = Helpers.randomFloat(80, 200);
            g.fillStyle(Helpers.randomElement(colors), Helpers.randomFloat(0.05, 0.15));
            g.fillCircle(x, y, r);
        }
    }

    animateShip() {
        this.shipX += 1.5;
        if (this.shipX > GAME_WIDTH + 50) this.shipX = -50;

        if (this.menuShipSprite) {
            this.menuShipSprite.setPosition(this.shipX, this.shipY);
            this.menuShipSprite.setRotation(Math.sin(Date.now() / 500) * 0.08 + Math.PI / 2);
            return;
        }

        const g = this.shipGraphics;
        g.clear();

        // Engine trail
        for (let i = 0; i < 5; i++) {
            g.fillStyle(0x0088ff, 0.1 - i * 0.02);
            g.fillCircle(this.shipX - 15 - i * 8, this.shipY, 4 - i * 0.5);
        }

        // Ship
        g.fillStyle(COLORS.PRIMARY, 1);
        g.fillTriangle(
            this.shipX + 12, this.shipY,
            this.shipX - 8, this.shipY - 6,
            this.shipX - 8, this.shipY + 6
        );
        g.fillStyle(0xffffff, 0.5);
        g.fillTriangle(
            this.shipX + 8, this.shipY,
            this.shipX - 4, this.shipY - 3,
            this.shipX - 4, this.shipY + 3
        );
    }

    startGame(loadSave) {
        this.scene.start('SpaceScene', { loadSave: loadSave || false });
    }

    showHelp() {
        // Create help overlay
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.85);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const panel = Helpers.createPanel(this, GAME_WIDTH / 2 - 300, 50, 600, 580, 0.95);

        const title = this.add.text(GAME_WIDTH / 2, 80, 'HOW TO PLAY', {
            fontFamily: 'monospace', fontSize: '24px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const controls = [
            '⌨ CONTROLS',
            '',
            'W / ↑  -  Thrust Forward',
            'A / ←  -  Rotate Left',
            'D / →  -  Rotate Right',
            'S / ↓  -  Brake',
            'SPACE  -  Fire Laser',
            'E      -  Fire Missile',
            'Q      -  Toggle Shield',
            'SHIFT  -  Speed Boost',
            'M      -  Open Map',
            'I      -  Open Inventory',
            'U      -  Ship Upgrades',
            'J      -  Quest Log',
            'ESC    -  Pause / Menu',
            '',
            '🎮 GAMEPLAY',
            '',
            'Accept quests, travel between planets,',
            'fight enemies, collect loot, and upgrade',
            'your ship to explore deeper into space!',
        ];

        this.add.text(GAME_WIDTH / 2, 120, controls.join('\n'), {
            fontFamily: 'monospace', fontSize: '13px', color: '#ccccdd',
            lineSpacing: 4, align: 'left'
        }).setOrigin(0.5, 0);

        const closeBtn = Helpers.createButton(this, GAME_WIDTH / 2, 600, 160, 40, 'CLOSE', () => {
            overlay.destroy();
            panel.destroy();
            title.destroy();
            closeBtn.destroy();
            textObj.destroy();
        }, COLORS.DANGER);

        const textObj = this.children.list[this.children.list.length - 3]; // text reference
    }

    playAmbient() {
        if (!this.game.audioCtx) return;
        // Simple ambient drone
        try {
            const ctx = this.game.audioCtx;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 80;
            gain.gain.value = 0.02;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            // Fade out after a bit
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
            osc.stop(ctx.currentTime + 5);
        } catch (e) { /* ignore audio errors */ }
    }
}
