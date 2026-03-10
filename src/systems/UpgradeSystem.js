// Upgrade System
class UpgradeSystem {
    constructor() {
        this.upgrades = GameData.upgrades;
    }

    canUpgrade(type, currentLevel, credits) {
        const upgradeData = this.upgrades[type];
        if (!upgradeData) return false;
        if (currentLevel >= upgradeData.levels.length) return false;
        return credits >= upgradeData.levels[currentLevel].cost;
    }

    getUpgradeCost(type, currentLevel) {
        const upgradeData = this.upgrades[type];
        if (!upgradeData || currentLevel >= upgradeData.levels.length) return Infinity;
        return upgradeData.levels[currentLevel].cost;
    }

    getUpgradeInfo(type, currentLevel) {
        const upgradeData = this.upgrades[type];
        if (!upgradeData) return null;

        const current = currentLevel > 0 ? upgradeData.levels[currentLevel - 1] : null;
        const next = currentLevel < upgradeData.levels.length ? upgradeData.levels[currentLevel] : null;

        return {
            name: upgradeData.name,
            currentLevel,
            maxLevel: upgradeData.levels.length,
            currentBonus: current ? current.bonus : 0,
            currentDesc: current ? current.description : 'None',
            nextCost: next ? next.cost : null,
            nextBonus: next ? next.bonus : null,
            nextDesc: next ? next.description : 'Max level',
            isMaxed: currentLevel >= upgradeData.levels.length
        };
    }

    performUpgrade(type, ship) {
        if (!this.canUpgrade(type, ship.upgrades[type], ship.credits)) {
            return false;
        }

        const cost = this.getUpgradeCost(type, ship.upgrades[type]);
        ship.credits -= cost;
        ship.upgrades[type]++;
        ship.applyUpgrades();
        return true;
    }
}
