// Crafting System
class CraftingSystem {
    constructor() {
        this.recipes = GameData.crafting || [];
    }

    getAvailableRecipes(inventory) {
        return this.recipes.map(recipe => ({
            ...recipe,
            canCraft: this.canCraft(recipe, inventory)
        }));
    }

    canCraft(recipe, inventory) {
        for (let ingredient of recipe.ingredients) {
            if (!inventory.hasItem(ingredient.id, ingredient.count)) {
                return false;
            }
        }
        return true;
    }

    craft(recipe, inventory) {
        if (!this.canCraft(recipe, inventory)) return false;

        // Remove ingredients
        for (let ingredient of recipe.ingredients) {
            inventory.removeItem(ingredient.id, ingredient.count);
        }

        // Add result
        const added = inventory.addItem({ ...recipe.result });
        if (!added) {
            // Refund ingredients if inventory is full
            for (let ingredient of recipe.ingredients) {
                for (let i = 0; i < ingredient.count; i++) {
                    const loot = this.findLootById(ingredient.id);
                    if (loot) inventory.addItem({ ...loot });
                }
            }
            return false;
        }

        return true;
    }

    findLootById(id) {
        for (let tier of ['common', 'uncommon', 'rare', 'legendary']) {
            const item = GameData.loot[tier].find(l => l.id === id);
            if (item) return item;
        }
        return null;
    }
}
