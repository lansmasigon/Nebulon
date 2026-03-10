// Inventory System
class InventorySystem {
    constructor() {
        this.items = []; // { id, name, type, rarity, value, count, description, effect }
        this.maxSlots = 20;
    }

    addItem(lootData) {
        // Check if item already exists
        const existing = this.items.find(i => i.id === lootData.id);
        if (existing) {
            existing.count = (existing.count || 1) + 1;
            return true;
        }

        // Check capacity
        if (this.items.length >= this.maxSlots) {
            return false; // Inventory full
        }

        this.items.push({
            ...lootData,
            count: 1
        });
        return true;
    }

    removeItem(itemId, count) {
        const idx = this.items.findIndex(i => i.id === itemId);
        if (idx === -1) return false;

        const item = this.items[idx];
        const removeCount = count || 1;

        if (item.count <= removeCount) {
            this.items.splice(idx, 1);
        } else {
            item.count -= removeCount;
        }
        return true;
    }

    hasItem(itemId, count) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return false;
        return (item.count || 1) >= (count || 1);
    }

    getItemCount(itemId) {
        const item = this.items.find(i => i.id === itemId);
        return item ? (item.count || 1) : 0;
    }

    getItemsByType(type) {
        return this.items.filter(i => i.type === type);
    }

    getTotalValue() {
        return this.items.reduce((sum, item) => sum + item.value * (item.count || 1), 0);
    }

    sellItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return 0;

        const value = item.value;
        this.removeItem(itemId, 1);
        return value;
    }

    sellAll() {
        const total = this.getTotalValue();
        this.items = [];
        return total;
    }

    isFull() {
        return this.items.length >= this.maxSlots;
    }

    toSaveData() {
        return {
            items: this.items.map(i => ({ ...i })),
            maxSlots: this.maxSlots
        };
    }

    loadSaveData(data) {
        this.items = data.items || [];
        this.maxSlots = data.maxSlots || 20;
    }
}
