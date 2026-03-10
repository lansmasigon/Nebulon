// Crafting Scene - Crafting overlay
class CraftingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CraftingScene' });
    }

    create() {
        this.ship = this.registry.get('ship');
        this.inventory = this.registry.get('inventory');
        this.craftingSystem = new CraftingSystem();

        // Semi-transparent background
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Panel
        const panelX = 120;
        const panelY = 40;
        const panelW = GAME_WIDTH - 240;
        const panelH = GAME_HEIGHT - 80;

        Helpers.createPanel(this, panelX, panelY, panelW, panelH, 0.95);

        // Title
        this.add.text(GAME_WIDTH / 2, panelY + 20, 'CRAFTING STATION', {
            fontFamily: 'monospace', fontSize: '22px', color: '#ff6b35', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, panelY + 48, 'Combine materials to create items', {
            fontFamily: 'monospace', fontSize: '11px', color: '#888899'
        }).setOrigin(0.5);

        // Recipe list
        const recipes = this.craftingSystem.getAvailableRecipes(this.inventory);
        const startY = panelY + 75;
        const cardH = 80;

        if (recipes.length === 0) {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No crafting recipes available.', {
                fontFamily: 'monospace', fontSize: '13px', color: '#555566'
            }).setOrigin(0.5);
        }

        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const y = startY + i * (cardH + 8);

            if (y + cardH > panelY + panelH - 50) break; // Don't overflow panel

            const g = this.add.graphics();
            const canCraft = recipe.canCraft;

            // Card background
            g.fillStyle(canCraft ? 0x0a1a0a : 0x0a0a1a, 0.9);
            g.fillRoundedRect(panelX + 20, y, panelW - 40, cardH, 6);
            g.lineStyle(1, canCraft ? COLORS.SUCCESS : COLORS.TEXT_DIM, 0.4);
            g.strokeRoundedRect(panelX + 20, y, panelW - 40, cardH, 6);

            // Result item
            const resultColor = Helpers.rarityColor(recipe.result.rarity);
            g.fillStyle(resultColor, 1);
            g.fillCircle(panelX + 42, y + 20, 6);

            this.add.text(panelX + 55, y + 10, recipe.result.name, {
                fontFamily: 'monospace', fontSize: '13px',
                color: '#' + resultColor.toString(16).padStart(6, '0'),
                fontStyle: 'bold'
            });

            this.add.text(panelX + 55, y + 28, recipe.result.description || '', {
                fontFamily: 'monospace', fontSize: '10px', color: '#888899',
                wordWrap: { width: 300 }
            });

            // Ingredients
            let ingX = panelX + 55;
            const ingY = y + 50;
            this.add.text(ingX, ingY, 'Needs: ', {
                fontFamily: 'monospace', fontSize: '10px', color: '#666677'
            });
            ingX += 50;

            for (let ing of recipe.ingredients) {
                const hasEnough = this.inventory.hasItem(ing.id, ing.count);
                const currentCount = this.inventory.getItemCount(ing.id);
                this.add.text(ingX, ingY, `${ing.id}(${currentCount}/${ing.count})`, {
                    fontFamily: 'monospace', fontSize: '10px',
                    color: hasEnough ? '#00ff88' : '#ff3366'
                });
                ingX += 120;
            }

            // Craft button
            if (canCraft) {
                Helpers.createButton(this, panelX + panelW - 80, y + cardH / 2, 90, 28, 'CRAFT', () => {
                    if (this.craftingSystem.craft(recipe, this.inventory)) {
                        this.scene.restart();
                    }
                }, COLORS.SUCCESS);
            } else {
                this.add.text(panelX + panelW - 80, y + cardH / 2, 'MISSING', {
                    fontFamily: 'monospace', fontSize: '10px', color: '#555566'
                }).setOrigin(0.5);
            }
        }

        // Close button
        Helpers.createButton(this, GAME_WIDTH / 2, panelY + panelH - 10, 120, 30, 'CLOSE', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        }, COLORS.DANGER);

        // ESC to close
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        });
    }
}
