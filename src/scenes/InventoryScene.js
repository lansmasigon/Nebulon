// Inventory Scene - Item management overlay
class InventoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InventoryScene' });
    }

    create() {
        this.ship = this.registry.get('ship');
        this.inventory = this.registry.get('inventory');

        // Semi-transparent background
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Panel
        const panelX = 140;
        const panelY = 40;
        const panelW = GAME_WIDTH - 280;
        const panelH = GAME_HEIGHT - 80;

        Helpers.createPanel(this, panelX, panelY, panelW, panelH, 0.95);

        // Title
        this.add.text(GAME_WIDTH / 2, panelY + 20, 'INVENTORY', {
            fontFamily: 'monospace', fontSize: '22px', color: '#00d4ff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Capacity
        this.add.text(GAME_WIDTH / 2, panelY + 48, `${this.inventory.items.length} / ${this.inventory.maxSlots} slots`, {
            fontFamily: 'monospace', fontSize: '11px', color: '#888899'
        }).setOrigin(0.5);

        // Credits
        this.add.text(GAME_WIDTH - 180, panelY + 20, `${Helpers.formatNumber(this.ship.credits)} CR`, {
            fontFamily: 'monospace', fontSize: '14px', color: '#ffdd00'
        });

        // Item grid
        const gridX = panelX + 30;
        const gridY = panelY + 75;
        const cellW = 180;
        const cellH = 55;
        const cols = 5;

        const items = this.inventory.items;
        const g = this.add.graphics();

        if (items.length === 0) {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Inventory is empty.\nExplore planets and defeat enemies to collect loot!', {
                fontFamily: 'monospace', fontSize: '13px', color: '#555566', align: 'center'
            }).setOrigin(0.5);
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = gridX + col * (cellW + 8);
            const cy = gridY + row * (cellH + 6);

            const rarityColor = Helpers.rarityColor(item.rarity);

            // Cell background
            g.fillStyle(0x111122, 0.8);
            g.fillRoundedRect(cx, cy, cellW, cellH, 6);
            g.lineStyle(1, rarityColor, 0.5);
            g.strokeRoundedRect(cx, cy, cellW, cellH, 6);

            // Rarity dot
            g.fillStyle(rarityColor, 1);
            g.fillCircle(cx + 12, cy + 14, 4);

            // Item name
            this.add.text(cx + 22, cy + 6, item.name, {
                fontFamily: 'monospace', fontSize: '11px',
                color: '#' + rarityColor.toString(16).padStart(6, '0'),
                fontStyle: 'bold'
            });

            // Count & value
            this.add.text(cx + 22, cy + 22, `x${item.count || 1}  |  ${item.value}cr`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#888899'
            });

            // Type badge
            this.add.text(cx + cellW - 8, cy + 6, item.type.toUpperCase(), {
                fontFamily: 'monospace', fontSize: '8px', color: '#555566'
            }).setOrigin(1, 0);

            // Sell button
            const sellBtn = this.add.text(cx + cellW - 8, cy + cellH - 14, 'SELL', {
                fontFamily: 'monospace', fontSize: '9px', color: '#ffdd00', backgroundColor: '#222233',
                padding: { x: 4, y: 2 }
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

            sellBtn.on('pointerdown', () => {
                const value = this.inventory.sellItem(item.id);
                this.ship.credits += value;
                this.scene.restart();
            });

            sellBtn.on('pointerover', () => sellBtn.setColor('#ffffff'));
            sellBtn.on('pointerout', () => sellBtn.setColor('#ffdd00'));

            // Use button for equipment
            if (item.effect) {
                const useBtn = this.add.text(cx + cellW - 45, cy + cellH - 14, 'USE', {
                    fontFamily: 'monospace', fontSize: '9px', color: '#00ff88', backgroundColor: '#222233',
                    padding: { x: 4, y: 2 }
                }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

                useBtn.on('pointerdown', () => {
                    if (item.effect.health) this.ship.heal(item.effect.health);
                    if (item.effect.shield) this.ship.rechargeShield(item.effect.shield);
                    this.inventory.removeItem(item.id, 1);
                    this.scene.restart();
                });
            }
        }

        // Sell All button
        if (items.length > 0) {
            Helpers.createButton(this, GAME_WIDTH / 2, panelY + panelH - 40, 160, 35, 'SELL ALL', () => {
                const total = this.inventory.sellAll();
                this.ship.credits += total;
                this.scene.restart();
            }, COLORS.WARNING);
        }

        // Close button
        Helpers.createButton(this, GAME_WIDTH / 2, panelY + panelH - 5, 120, 30, 'CLOSE', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        }, COLORS.DANGER);

        // ESC to close
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        });
        this.input.keyboard.on('keydown-I', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        });
    }
}
