// Save System
class SaveSystem {
    constructor() {
        this.saveKey = 'Nebulon_save';
    }

    save(ship, questSystem, inventory) {
        const data = {
            version: 1,
            timestamp: Date.now(),
            ship: ship.toSaveData(),
            quests: questSystem.toSaveData(),
            inventory: inventory.toSaveData()
        };

        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.saveKey);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }

    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }
}
