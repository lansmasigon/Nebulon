// Quest System
class QuestSystem {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
        this.availableQuests = [];
        this.currentStage = GAME_STAGES.SOLAR_SYSTEM;
        this.unlockedStages = [GAME_STAGES.SOLAR_SYSTEM];
    }

    loadQuestsForStage(stage) {
        const stageQuests = GameData.quests[stage] || [];
        this.availableQuests = stageQuests.filter(q =>
            !this.completedQuests.includes(q.id) &&
            !this.activeQuests.find(aq => aq.id === q.id)
        );
    }

    acceptQuest(questId) {
        const quest = this.availableQuests.find(q => q.id === questId);
        if (!quest) return false;

        const activeQuest = {
            ...quest,
            progress: 0,
            startTime: Date.now()
        };

        if (quest.requirement.type === 'kill') activeQuest.killCount = 0;
        if (quest.requirement.type === 'collect') activeQuest.collectCount = 0;
        if (quest.requirement.type === 'delivery') activeQuest.hasPickedUp = false;

        this.activeQuests.push(activeQuest);
        this.availableQuests = this.availableQuests.filter(q => q.id !== questId);
        return true;
    }

    updateProgress(eventType, data) {
        const completed = [];

        for (let quest of this.activeQuests) {
            switch (quest.requirement.type) {
                case 'visit':
                    if (eventType === 'planet_visit' && data.planetId === quest.requirement.planet) {
                        quest.progress = 1;
                    }
                    break;

                case 'kill':
                    if (eventType === 'enemy_kill' && data.enemyType === quest.requirement.enemy) {
                        quest.killCount = (quest.killCount || 0) + 1;
                        quest.progress = quest.killCount / quest.requirement.count;
                    }
                    break;

                case 'collect':
                    if (eventType === 'item_collect' && data.itemId === quest.requirement.item) {
                        quest.collectCount = (quest.collectCount || 0) + 1;
                        quest.progress = quest.collectCount / quest.requirement.count;
                    }
                    break;

                case 'delivery':
                    if (eventType === 'planet_visit' && data.planetId === quest.requirement.from) {
                        quest.hasPickedUp = true;
                    }
                    if (eventType === 'planet_visit' && data.planetId === quest.requirement.to && quest.hasPickedUp) {
                        quest.progress = 1;
                    }
                    break;

                case 'boss':
                    if (eventType === 'boss_kill' && data.enemyType === quest.requirement.enemy) {
                        quest.progress = 1;
                    }
                    break;
            }

            if (quest.progress >= 1) {
                completed.push(quest);
            }
        }

        return completed;
    }

    completeQuest(questId) {
        const idx = this.activeQuests.findIndex(q => q.id === questId);
        if (idx === -1) return null;

        const quest = this.activeQuests.splice(idx, 1)[0];
        this.completedQuests.push(quest.id);

        // Check for stage unlock
        if (quest.rewards.unlocks) {
            if (!this.unlockedStages.includes(quest.rewards.unlocks)) {
                this.unlockedStages.push(quest.rewards.unlocks);
            }
        }

        return quest.rewards;
    }

    getActiveQuestForPlanet(planetId) {
        return this.activeQuests.find(q => q.target === planetId);
    }

    isStageUnlocked(stage) {
        return this.unlockedStages.includes(stage);
    }

    toSaveData() {
        return {
            activeQuests: this.activeQuests.map(q => ({ ...q })),
            completedQuests: [...this.completedQuests],
            currentStage: this.currentStage,
            unlockedStages: [...this.unlockedStages]
        };
    }

    loadSaveData(data) {
        this.activeQuests = data.activeQuests || [];
        this.completedQuests = data.completedQuests || [];
        this.currentStage = data.currentStage || GAME_STAGES.SOLAR_SYSTEM;
        this.unlockedStages = data.unlockedStages || [GAME_STAGES.SOLAR_SYSTEM];
    }
}
