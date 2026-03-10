// Landing Scene - Animated transition when landing on a planet
class LandingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LandingScene' });
    }

    init(data) {
        this.planetData = data.planet;
        this.stage = data.stage;
    }

    create() {
        const p = this.planetData;

        // Background: space fading to atmosphere
        this.bg = this.add.graphics();
        this.fg = this.add.graphics();
        this.shipG = this.add.graphics();

        // Stars
        this.stars = [];
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Helpers.randomFloat(0, GAME_WIDTH),
                y: Helpers.randomFloat(0, GAME_HEIGHT),
                size: Helpers.randomFloat(0.5, 2),
                alpha: Helpers.randomFloat(0.3, 1)
            });
        }

        // Planet surface color
        const biome = BIOME_DATA[p.id] || { groundColor: 0x444444, skyColors: [0x0a0a1a, 0x111133] };
        this.surfaceColor = biome.groundColor;
        this.skyColors = biome.skyColors;

        // Animation phase
        this.phase = 0; // 0=approach, 1=atmosphere entry, 2=descent, 3=landing
        this.timer = 0;
        this.totalDuration = 3000;
        this.shipX = GAME_WIDTH / 2;
        this.shipY = 100;
        this.shipScale = 0.5;
        this.shakeAmount = 0;

        // Planet name text
        this.titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '', {
            fontFamily: 'monospace', fontSize: '28px', color: '#' + p.color.toString(16).padStart(6, '0'),
            fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setAlpha(0);

        this.subtitleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
            fontFamily: 'monospace', fontSize: '14px', color: '#888899',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0);

        // Status text
        this.statusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'APPROACHING PLANET...', {
            fontFamily: 'monospace', fontSize: '12px', color: '#00d4ff'
        }).setOrigin(0.5);
    }

    update(time, delta) {
        this.timer += delta;
        const progress = Math.min(this.timer / this.totalDuration, 1);

        this.bg.clear();
        this.fg.clear();
        this.shipG.clear();

        if (progress < 0.3) {
            // Phase: Approach - stars zoom by, planet grows
            this.drawApproach(progress / 0.3);
            this.statusText.setText('APPROACHING PLANET...');
        } else if (progress < 0.6) {
            // Phase: Atmosphere entry - shake, glow, heat effects
            this.drawAtmosphereEntry((progress - 0.3) / 0.3);
            this.statusText.setText('ENTERING ATMOSPHERE...');
        } else if (progress < 0.9) {
            // Phase: Descent - sky transitions, ground appears
            this.drawDescent((progress - 0.6) / 0.3);
            this.statusText.setText('DESCENDING...');
        } else {
            // Phase: Landing
            this.drawLanding((progress - 0.9) / 0.1);
            this.statusText.setText('LANDING SEQUENCE COMPLETE');
        }

        // Show planet name partway through
        if (progress > 0.2 && progress < 0.5) {
            const alpha = Math.sin((progress - 0.2) / 0.3 * Math.PI);
            this.titleText.setText(this.planetData.name.toUpperCase()).setAlpha(alpha);
            this.subtitleText.setText(this.planetData.description).setAlpha(alpha * 0.7);
        } else {
            this.titleText.setAlpha(0);
            this.subtitleText.setAlpha(0);
        }

        // Transition to PlanetScene
        if (progress >= 1) {
            this.scene.start('PlanetScene', {
                planet: this.planetData,
                stage: this.stage
            });
        }
    }

    drawApproach(t) {
        // Space background
        this.bg.fillStyle(0x0a0a1a, 1);
        this.bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Stars zooming by
        for (let star of this.stars) {
            const sy = star.y + t * 200;
            const alpha = star.alpha * (1 - t * 0.5);
            this.bg.fillStyle(0xffffff, alpha);
            this.bg.fillCircle(star.x, sy % GAME_HEIGHT, star.size);
        }

        // Growing planet circle at bottom
        const planetRadius = 50 + t * 400;
        const planetY = GAME_HEIGHT + 300 - t * 200;
        this.bg.fillStyle(this.planetData.color, 0.15 + t * 0.3);
        this.bg.fillCircle(GAME_WIDTH / 2, planetY, planetRadius);
        this.bg.fillStyle(this.planetData.color, 0.3 + t * 0.3);
        this.bg.fillCircle(GAME_WIDTH / 2, planetY, planetRadius * 0.7);

        // Ship descending
        this.shipY = 100 + t * 150;
        this.drawShip(this.shipX, this.shipY, 1);
    }

    drawAtmosphereEntry(t) {
        // Sky transitioning from space to atmosphere
        const skyR = Math.floor(Helpers.lerp(10, (this.skyColors[1] >> 16) & 0xff, t));
        const skyG = Math.floor(Helpers.lerp(10, (this.skyColors[1] >> 8) & 0xff, t));
        const skyB = Math.floor(Helpers.lerp(26, this.skyColors[1] & 0xff, t));
        this.bg.fillStyle((skyR << 16) | (skyG << 8) | skyB, 1);
        this.bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Remaining stars fading
        for (let star of this.stars) {
            this.bg.fillStyle(0xffffff, star.alpha * (1 - t));
            this.bg.fillCircle(star.x, star.y, star.size);
        }

        // Heat glow around ship
        this.shakeAmount = t * 4;
        const shakeX = (Math.random() - 0.5) * this.shakeAmount;
        const shakeY = (Math.random() - 0.5) * this.shakeAmount;
        this.shipY = 250 + t * 100;

        // Fire trail
        for (let i = 0; i < 8; i++) {
            const fx = this.shipX + shakeX + Helpers.randomFloat(-10, 10);
            const fy = this.shipY - 20 - i * 8 + shakeY;
            this.fg.fillStyle(Helpers.randomElement([0xff4400, 0xff8800, 0xffaa00]), 0.6 - i * 0.07);
            this.fg.fillCircle(fx, fy, 6 - i * 0.5);
        }

        // Heat shield glow
        this.fg.fillStyle(0xff4400, 0.15 + t * 0.2);
        this.fg.fillCircle(this.shipX + shakeX, this.shipY + shakeY - 5, 30);

        this.drawShip(this.shipX + shakeX, this.shipY + shakeY, 1);
    }

    drawDescent(t) {
        // Full atmosphere sky
        for (let i = 0; i < 10; i++) {
            const rowT = i / 10;
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(this.skyColors[0]),
                Phaser.Display.Color.IntegerToColor(this.skyColors[1]),
                10, i
            );
            this.bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            this.bg.fillRect(0, i * (GAME_HEIGHT / 10), GAME_WIDTH, GAME_HEIGHT / 10 + 1);
        }

        // Ground rising
        const groundY = GAME_HEIGHT - t * 200;
        this.bg.fillStyle(this.surfaceColor, 1);
        this.bg.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);

        // Terrain detail
        for (let i = 0; i < 20; i++) {
            const tx = i * (GAME_WIDTH / 20);
            const noise = Math.sin(i * 0.8) * 15;
            this.bg.fillStyle(this.surfaceColor, 0.7);
            this.bg.fillRect(tx, groundY + noise - 5, GAME_WIDTH / 20 + 1, 10);
        }

        // Ship descending
        this.shipY = 350 + t * 100;
        this.drawShip(this.shipX, this.shipY, 1 - t * 0.2);

        // Engine glow
        this.fg.fillStyle(0x00aaff, 0.4 - t * 0.2);
        this.fg.fillCircle(this.shipX, this.shipY + 15, 8 - t * 3);
    }

    drawLanding(t) {
        // Final frame - ground level view
        for (let i = 0; i < 10; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.IntegerToColor(this.skyColors[0]),
                Phaser.Display.Color.IntegerToColor(this.skyColors[1]),
                10, i
            );
            this.bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
            this.bg.fillRect(0, i * (GAME_HEIGHT / 10), GAME_WIDTH, GAME_HEIGHT / 10 + 1);
        }

        const groundY = GAME_HEIGHT - 200;
        this.bg.fillStyle(this.surfaceColor, 1);
        this.bg.fillRect(0, groundY, GAME_WIDTH, 200);

        // Dust clouds on landing
        for (let i = 0; i < 8; i++) {
            const dx = GAME_WIDTH / 2 + (i - 4) * 40 + Math.sin(i + this.timer / 100) * 20;
            const dy = groundY - 5 + Math.sin(i * 2) * 5;
            this.fg.fillStyle(this.surfaceColor, 0.4 * (1 - t));
            this.fg.fillCircle(dx, dy, 15 + i * 3);
        }

        // Ship settled
        this.shipY = 450 - t * 10;
        this.drawShip(this.shipX, this.shipY, 0.8);

        // Landing gear lines
        this.fg.lineStyle(2, 0x556677, 1);
        this.fg.lineBetween(this.shipX - 12, this.shipY + 12, this.shipX - 18, groundY);
        this.fg.lineBetween(this.shipX + 12, this.shipY + 12, this.shipX + 18, groundY);
    }

    drawShip(x, y, scale) {
        const s = 14 * scale;
        this.shipG.fillStyle(COLORS.PRIMARY, 1);
        this.shipG.fillTriangle(x, y - s, x - s * 0.7, y + s * 0.5, x + s * 0.7, y + s * 0.5);
        this.shipG.fillStyle(0x003366, 0.6);
        this.shipG.fillTriangle(x, y - s * 0.5, x - s * 0.35, y + s * 0.2, x + s * 0.35, y + s * 0.2);
        // Wings
        this.shipG.fillStyle(COLORS.PRIMARY, 0.7);
        this.shipG.fillTriangle(x - s * 0.7, y + s * 0.3, x - s * 1.2, y + s * 0.6, x - s * 0.3, y + s * 0.5);
        this.shipG.fillTriangle(x + s * 0.7, y + s * 0.3, x + s * 1.2, y + s * 0.6, x + s * 0.3, y + s * 0.5);
    }
}
