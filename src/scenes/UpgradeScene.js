// Upgrade Scene - Ship upgrades overlay
class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    create() {
        this.ship = this.registry.get('ship');
        this.upgradeSystem = new UpgradeSystem();

        // Semi-transparent background
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Panel
        const panelX = 160;
        const panelY = 50;
        const panelW = GAME_WIDTH - 320;
        const panelH = GAME_HEIGHT - 100;

        Helpers.createPanel(this, panelX, panelY, panelW, panelH, 0.95);

        // Title
        this.add.text(GAME_WIDTH / 2, panelY + 20, 'SHIP UPGRADES', {
            fontFamily: 'monospace', fontSize: '22px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Credits
        this.creditsText = this.add.text(GAME_WIDTH / 2, panelY + 48, `Credits: ${Helpers.formatNumber(this.ship.credits)}`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffdd00'
        }).setOrigin(0.5);

        // Current ship info
        const shipData = GameData.ships.find(s => s.id === this.ship.shipType);
        this.add.text(GAME_WIDTH / 2, panelY + 70, `Ship: ${shipData ? shipData.name : 'Scout Ship'}`, {
            fontFamily: 'monospace', fontSize: '12px', color: '#888899'
        }).setOrigin(0.5);

        // Upgrade cards
        const upgradeTypes = ['speed', 'shield', 'hull', 'damage', 'cargo'];
        const cardW = 170;
        const cardH = 280;
        const startX = panelX + 30;
        const cardY = panelY + 100;

        const icons = { speed: '⚡', shield: '🛡', hull: '🔩', damage: '🔫', cargo: '📦' };
        const statColors = {
            speed: COLORS.PRIMARY,
            shield: COLORS.SHIELD,
            hull: COLORS.HEALTH,
            damage: COLORS.DANGER,
            cargo: COLORS.WARNING
        };

        for (let i = 0; i < upgradeTypes.length; i++) {
            const type = upgradeTypes[i];
            const info = this.upgradeSystem.getUpgradeInfo(type, this.ship.upgrades[type]);
            const cx = startX + i * (cardW + 8);
            const color = statColors[type];

            // Card background
            const cardG = this.add.graphics();
            cardG.fillStyle(0x0a0a1a, 0.9);
            cardG.fillRoundedRect(cx, cardY, cardW, cardH, 8);
            cardG.lineStyle(2, color, 0.5);
            cardG.strokeRoundedRect(cx, cardY, cardW, cardH, 8);

            // Icon & name
            this.add.text(cx + cardW / 2, cardY + 15, icons[type], {
                fontSize: '24px'
            }).setOrigin(0.5);

            this.add.text(cx + cardW / 2, cardY + 45, info.name, {
                fontFamily: 'monospace', fontSize: '12px',
                color: '#' + color.toString(16).padStart(6, '0'),
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Level indicator
            const levelBar = this.add.graphics();
            const barStartX = cx + 15;
            const barY = cardY + 65;
            for (let l = 0; l < info.maxLevel; l++) {
                const segX = barStartX + l * 28;
                levelBar.fillStyle(l < info.currentLevel ? color : 0x222233, l < info.currentLevel ? 0.8 : 0.5);
                levelBar.fillRoundedRect(segX, barY, 24, 6, 2);
            }

            this.add.text(cx + cardW / 2, barY + 15, `Level ${info.currentLevel}/${info.maxLevel}`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#888899'
            }).setOrigin(0.5);

            // Current stats
            this.add.text(cx + 15, cardY + 95, 'Current:', {
                fontFamily: 'monospace', fontSize: '10px', color: '#666677'
            });
            this.add.text(cx + 15, cardY + 110, info.currentDesc, {
                fontFamily: 'monospace', fontSize: '11px', color: '#aabbcc'
            });
            this.add.text(cx + 15, cardY + 126, `+${info.currentBonus} bonus`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#888899'
            });

            // Next level info
            if (!info.isMaxed) {
                this.add.text(cx + 15, cardY + 150, 'Next:', {
                    fontFamily: 'monospace', fontSize: '10px', color: '#666677'
                });
                this.add.text(cx + 15, cardY + 165, info.nextDesc, {
                    fontFamily: 'monospace', fontSize: '11px', color: '#ddddee'
                });
                this.add.text(cx + 15, cardY + 181, `+${info.nextBonus} bonus`, {
                    fontFamily: 'monospace', fontSize: '10px', color: '#00ff88'
                });

                // Cost
                const canAfford = this.ship.credits >= info.nextCost;
                this.add.text(cx + cardW / 2, cardY + 210, `Cost: ${info.nextCost} CR`, {
                    fontFamily: 'monospace', fontSize: '11px',
                    color: canAfford ? '#ffdd00' : '#ff3366'
                }).setOrigin(0.5);

                // Upgrade button
                Helpers.createButton(this, cx + cardW / 2, cardY + cardH - 25, cardW - 20, 30,
                    canAfford ? 'UPGRADE' : 'INSUFFICIENT',
                    () => {
                        if (this.upgradeSystem.performUpgrade(type, this.ship)) {
                            this.scene.restart();
                        }
                    },
                    canAfford ? COLORS.SUCCESS : COLORS.TEXT_DIM
                );
            } else {
                this.add.text(cx + cardW / 2, cardY + 200, 'MAX LEVEL', {
                    fontFamily: 'monospace', fontSize: '14px', color: '#ffdd00', fontStyle: 'bold'
                }).setOrigin(0.5);
            }
        }

        // Ship list button
        Helpers.createButton(this, GAME_WIDTH / 2 - 100, panelY + panelH - 15, 160, 30, 'BUY SHIPS', () => {
            this.showShipList();
        }, COLORS.SECONDARY);

        // Close button
        Helpers.createButton(this, GAME_WIDTH / 2 + 100, panelY + panelH - 15, 120, 30, 'CLOSE', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        }, COLORS.DANGER);

        // ESC to close
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        });
        this.input.keyboard.on('keydown-U', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        });
    }

    showShipList() {
        // Clear and show ship purchase screen
        this.scene.restart(); // For simplicity, we overlay

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.9);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        const panelX = 100;
        const panelY = 40;
        Helpers.createPanel(this, panelX, panelY, GAME_WIDTH - 200, GAME_HEIGHT - 80, 0.95);

        this.add.text(GAME_WIDTH / 2, panelY + 20, 'SHIP DEALER', {
            fontFamily: 'monospace', fontSize: '22px', color: '#ff6b35', fontStyle: 'bold'
        }).setOrigin(0.5);

        const ships = GameData.ships;
        const cardW = 180;
        const cardH = 220;
        const startX = panelX + 25;

        for (let i = 0; i < ships.length; i++) {
            const s = ships[i];
            const cx = startX + i * (cardW + 10);
            const cy = panelY + 60;
            const owned = this.ship.shipType === s.id;

            const g = this.add.graphics();
            g.fillStyle(owned ? 0x002211 : 0x0a0a1a, 0.9);
            g.fillRoundedRect(cx, cy, cardW, cardH, 8);
            g.lineStyle(2, owned ? COLORS.SUCCESS : s.color, 0.6);
            g.strokeRoundedRect(cx, cy, cardW, cardH, 8);

            // Ship visual
            g.fillStyle(s.color, 1);
            g.fillTriangle(cx + cardW / 2, cy + 25, cx + cardW / 2 - 15, cy + 55, cx + cardW / 2 + 15, cy + 55);

            this.add.text(cx + cardW / 2, cy + 65, s.name, {
                fontFamily: 'monospace', fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5);

            const stats = [
                `SPD: ${s.speed}`,
                `SHD: ${s.shield}`,
                `HUL: ${s.hull}`,
                `DMG: ${s.damage}`,
                `CRG: ${s.cargo}`
            ];

            this.add.text(cx + 15, cy + 80, stats.join('\n'), {
                fontFamily: 'monospace', fontSize: '10px', color: '#aabbcc', lineSpacing: 2
            });

            if (owned) {
                this.add.text(cx + cardW / 2, cy + cardH - 25, 'EQUIPPED', {
                    fontFamily: 'monospace', fontSize: '11px', color: '#00ff88', fontStyle: 'bold'
                }).setOrigin(0.5);
            } else if (s.cost === 0) {
                // Free ship, already available
            } else {
                const canAfford = this.ship.credits >= s.cost;
                this.add.text(cx + cardW / 2, cy + 170, `${s.cost} CR`, {
                    fontFamily: 'monospace', fontSize: '11px', color: canAfford ? '#ffdd00' : '#ff3366'
                }).setOrigin(0.5);

                Helpers.createButton(this, cx + cardW / 2, cy + cardH - 20, cardW - 20, 26,
                    canAfford ? 'BUY' : 'LOCKED',
                    () => {
                        if (canAfford) {
                            this.ship.credits -= s.cost;
                            this.ship.shipType = s.id;
                            this.ship.applyUpgrades();
                            this.scene.restart();
                        }
                    },
                    canAfford ? COLORS.SUCCESS : COLORS.TEXT_DIM
                );
            }
        }

        Helpers.createButton(this, GAME_WIDTH / 2, panelY + GAME_HEIGHT - 120, 140, 30, 'BACK', () => {
            this.scene.restart();
        }, COLORS.TEXT_DIM);
    }
}
