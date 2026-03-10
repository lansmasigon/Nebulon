// Map Scene - Solar System Orbital View / Galaxy Map
class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    init(data) {
        this.currentStage = data.stage || GAME_STAGES.SOLAR_SYSTEM;
    }

    create() {
        this.ship = this.registry.get('ship');
        this.questSystem = this.registry.get('questSystem');

        // Background
        const bg = this.add.graphics();
        bg.fillStyle(0x020208, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        Helpers.generateStars(this, 350, GAME_WIDTH, GAME_HEIGHT);

        // Map graphics (redrawn each frame)
        this.mapGraphics = this.add.graphics();

        // Create planet objects
        this.planets = GameData.planets[this.currentStage].map(p => new Planet(p));

        // Mark visited planets & update unlock status
        this.updatePlanetUnlocks();

        // Center of the solar system (for orbital view)
        this.centerX = GAME_WIDTH / 2;
        this.centerY = GAME_HEIGHT / 2 + 20;

        // Title
        const stageName = {
            solar_system: 'SOLAR SYSTEM',
            first_galaxy: 'FIRST GALAXY',
            black_hole: 'BLACK HOLE SYSTEMS'
        };
        this.add.text(GAME_WIDTH / 2, 18, stageName[this.currentStage] || 'SPACE MAP', {
            fontFamily: 'monospace', fontSize: '20px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Stage navigation tabs
        const stages = [
            { key: GAME_STAGES.SOLAR_SYSTEM, name: 'Solar System' },
            { key: GAME_STAGES.FIRST_GALAXY, name: 'First Galaxy' },
            { key: GAME_STAGES.BLACK_HOLE, name: 'Black Hole' }
        ];

        let stageX = 100;
        for (let stage of stages) {
            const unlocked = this.questSystem.isStageUnlocked(stage.key);
            const isCurrent = this.currentStage === stage.key;
            const color = isCurrent ? COLORS.PRIMARY : unlocked ? COLORS.SUCCESS : COLORS.TEXT_DIM;

            const btn = Helpers.createButton(this, stageX, GAME_HEIGHT - 35, 140, 30,
                (unlocked ? '' : '🔒 ') + stage.name,
                () => {
                    if (unlocked) {
                        this.currentStage = stage.key;
                        this.scene.restart({ stage: stage.key });
                    }
                }, color);

            if (!unlocked) btn.setAlpha(0.5);
            stageX += 160;
        }

        // Back button
        Helpers.createButton(this, GAME_WIDTH - 100, GAME_HEIGHT - 35, 120, 30, 'BACK', () => {
            this.scene.start('SpaceScene', { stage: this.currentStage });
        }, COLORS.TEXT_DIM);

        // Planet info panel
        this.infoPanel = this.add.container(0, 0).setVisible(false);
        this.infoBg = this.add.graphics();
        this.infoTitle = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', fontStyle: 'bold' });
        this.infoDesc = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '11px', color: '#888899', wordWrap: { width: 220 } });
        this.infoDetails = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '11px', color: '#aabbcc' });
        this.infoPanel.add([this.infoBg, this.infoTitle, this.infoDesc, this.infoDetails]);

        // Planet labels
        this.planetLabels = [];
        for (let planet of this.planets) {
            const label = this.add.text(0, 0, planet.name, {
                fontFamily: 'monospace', fontSize: '9px',
                color: planet.unlocked ? '#aabbcc' : '#555566'
            }).setOrigin(0.5, 0);
            this.planetLabels.push(label);
        }

        // Mouse interaction
        this.selectedPlanet = null;
        this.input.on('pointermove', (pointer) => this.onPointerMove(pointer));
        this.input.on('pointerdown', (pointer) => this.onPointerDown(pointer));

        // Player stats
        this.add.text(GAME_WIDTH - 15, 15, `LVL ${this.ship.level}  |  ${Helpers.formatNumber(this.ship.credits)} CR`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#888899'
        }).setOrigin(1, 0);

        // Instructions
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 65, 'Click a planet to travel there. Complete exploration to unlock the next planet.', {
            fontFamily: 'monospace', fontSize: '10px', color: '#555566'
        }).setOrigin(0.5);
    }

    updatePlanetUnlocks() {
        for (let planet of this.planets) {
            if (this.ship.planetsVisited.includes(planet.id)) {
                planet.visited = true;
            }

            if (this.currentStage === GAME_STAGES.SOLAR_SYSTEM) {
                if (planet.order === 0) {
                    planet.unlocked = true;
                } else {
                    const prevPlanet = this.planets.find(p => p.order === planet.order - 1);
                    if (prevPlanet && prevPlanet.visited) {
                        planet.unlocked = true;
                    }
                    if (planet.visited) {
                        planet.unlocked = true;
                    }
                }
            } else {
                planet.unlocked = true;
            }
        }
    }

    update(time, delta) {
        if (this.currentStage === GAME_STAGES.SOLAR_SYSTEM) {
            for (let planet of this.planets) {
                planet.updateOrbit(delta, this.centerX, this.centerY);
            }
        } else {
            for (let planet of this.planets) {
                planet.update(delta);
                const scaleX = GAME_WIDTH / 1800;
                const scaleY = (GAME_HEIGHT - 120) / 600;
                planet.x = planet.staticX * scaleX + 40;
                planet.y = planet.staticY * scaleY + 60;
            }
        }

        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];
            this.planetLabels[i].setPosition(planet.x, planet.y + planet.radius + 6);
        }

        this.mapGraphics.clear();
        this.drawMap();
    }

    drawMap() {
        const g = this.mapGraphics;
        if (this.currentStage === GAME_STAGES.SOLAR_SYSTEM) {
            this.drawSolarSystem(g);
        } else {
            this.drawGalaxyMap(g);
        }
    }

    drawSolarSystem(g) {
        const cx = this.centerX;
        const cy = this.centerY;

        // Sun glow layers
        g.fillStyle(0xff8800, 0.04);
        g.fillCircle(cx, cy, 55);
        g.fillStyle(0xffaa00, 0.06);
        g.fillCircle(cx, cy, 42);
        g.fillStyle(0xffcc00, 0.1);
        g.fillCircle(cx, cy, 32);
        g.fillStyle(0xffdd44, 0.8);
        g.fillCircle(cx, cy, 22);
        g.fillStyle(0xffffaa, 0.9);
        g.fillCircle(cx, cy, 14);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx - 5, cy - 5, 8);

        // Draw orbit rings
        for (let planet of this.planets) {
            const alpha = planet.unlocked ? 0.15 : 0.05;
            g.lineStyle(1, planet.color, alpha);
            g.strokeCircle(cx, cy, planet.orbitRadius);
        }

        // Draw planets
        for (let planet of this.planets) {
            planet.draw(g);

            if (planet.unlocked) {
                const quest = this.questSystem.getActiveQuestForPlanet(planet.id);
                if (quest) {
                    g.fillStyle(COLORS.WARNING, 0.8 + Math.sin(planet.pulsePhase * 4) * 0.2);
                    g.fillCircle(planet.x - planet.radius - 5, planet.y - planet.radius - 5, 4);
                }
            }
        }
    }

    drawGalaxyMap(g) {
        for (let i = 0; i < this.planets.length - 1; i++) {
            const p1 = this.planets[i];
            const p2 = this.planets[i + 1];
            g.lineStyle(1, COLORS.PRIMARY, 0.15);
            g.lineBetween(p1.x, p1.y, p2.x, p2.y);
            const t = (Date.now() % 3000) / 3000;
            const dotX = Helpers.lerp(p1.x, p2.x, t);
            const dotY = Helpers.lerp(p1.y, p2.y, t);
            g.fillStyle(COLORS.PRIMARY, 0.3);
            g.fillCircle(dotX, dotY, 2);
        }

        for (let planet of this.planets) {
            planet.draw(g);
            const quest = this.questSystem.getActiveQuestForPlanet(planet.id);
            if (quest) {
                g.fillStyle(COLORS.WARNING, 0.8 + Math.sin(planet.pulsePhase * 4) * 0.2);
                g.fillCircle(planet.x - planet.radius - 5, planet.y - planet.radius - 5, 4);
            }
        }
    }

    onPointerMove(pointer) {
        let hovered = null;
        for (let planet of this.planets) {
            const dist = Helpers.distance(pointer.x, pointer.y, planet.x, planet.y);
            planet.hovered = dist < planet.radius + 15;
            if (planet.hovered) hovered = planet;
        }

        if (hovered) {
            this.showPlanetInfo(hovered, pointer.x, pointer.y);
        } else {
            this.infoPanel.setVisible(false);
        }
    }

    onPointerDown(pointer) {
        for (let planet of this.planets) {
            const dist = Helpers.distance(pointer.x, pointer.y, planet.x, planet.y);
            if (dist < planet.radius + 15) {
                if (!planet.unlocked) return;
                for (let p of this.planets) p.selected = false;
                planet.selected = true;
                this.selectedPlanet = planet;
                this.travelToPlanet(planet);
                return;
            }
        }
    }

    showPlanetInfo(planet, mx, my) {
        const panelW = 240;
        const panelH = 130;
        let px = mx + 15;
        let py = my - 10;
        if (px + panelW > GAME_WIDTH) px = mx - panelW - 15;
        if (py + panelH > GAME_HEIGHT) py = GAME_HEIGHT - panelH - 10;
        if (py < 5) py = 5;

        this.infoBg.clear();
        this.infoBg.fillStyle(0x111133, 0.95);
        this.infoBg.fillRoundedRect(px, py, panelW, panelH, 8);
        this.infoBg.lineStyle(1, planet.unlocked ? COLORS.PRIMARY : 0x555555, 0.5);
        this.infoBg.strokeRoundedRect(px, py, panelW, panelH, 8);

        this.infoTitle.setPosition(px + 10, py + 8);
        this.infoTitle.setText(planet.name);
        this.infoTitle.setColor('#' + planet.color.toString(16).padStart(6, '0'));

        this.infoDesc.setPosition(px + 10, py + 28);
        this.infoDesc.setText(planet.unlocked ? planet.description : '🔒 Explore the previous planet to unlock.');

        let details = '';
        if (planet.unlocked) {
            details = `Threat: ${planet.enemyLevel}`;
            if (planet.isHub) details += '  |  HUB';
            if (planet.hasStation || planet.isStation) details += '  |  STATION';
            if (planet.isBossArea) details += '  |  BOSS';
            if (planet.visited) details += '  |  VISITED';
        } else {
            details = 'LOCKED';
        }

        this.infoDetails.setPosition(px + 10, py + panelH - 20);
        this.infoDetails.setText(details);
        this.infoPanel.setVisible(true);
    }

    travelToPlanet(planet) {
        this.scene.start('LandingScene', {
            planet: {
                id: planet.id,
                name: planet.name,
                color: planet.color,
                description: planet.description,
                resources: planet.resources,
                enemyLevel: planet.enemyLevel,
                isHub: planet.isHub,
                hasStation: planet.hasStation,
                hasRings: planet.hasRings,
                isStation: planet.isStation,
                isBossArea: planet.isBossArea,
                isFinal: planet.isFinal
            },
            stage: this.currentStage
        });
    }
}
