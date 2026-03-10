// Quest Scene - Quest log overlay
class QuestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'QuestScene' });
    }

    init(data) {
        this.stage = data.stage || GAME_STAGES.SOLAR_SYSTEM;
    }

    create() {
        this.ship = this.registry.get('ship');
        this.questSystem = this.registry.get('questSystem');

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
        this.add.text(GAME_WIDTH / 2, panelY + 20, 'QUEST LOG', {
            fontFamily: 'monospace', fontSize: '22px', color: '#ffdd00', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Tabs
        const tabY = panelY + 55;
        let activeTab = 'active';

        const activeBtn = Helpers.createButton(this, GAME_WIDTH / 2 - 120, tabY, 120, 28, 'ACTIVE', () => {
            this.scene.restart({ stage: this.stage });
        }, COLORS.PRIMARY);

        const availBtn = Helpers.createButton(this, GAME_WIDTH / 2, tabY, 120, 28, 'AVAILABLE', () => {
            activeTab = 'available';
            this.showAvailableQuests(panelX, panelY + 90, panelW);
        }, COLORS.SUCCESS);

        const doneBtn = Helpers.createButton(this, GAME_WIDTH / 2 + 120, tabY, 120, 28, 'COMPLETED', () => {
            activeTab = 'completed';
            this.showCompletedQuests(panelX, panelY + 90, panelW);
        }, COLORS.TEXT_DIM);

        // Show active quests by default
        this.showActiveQuests(panelX, panelY + 90, panelW);

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
        this.input.keyboard.on('keydown-J', () => {
            this.scene.stop();
            this.scene.resume('SpaceScene');
        });
    }

    showActiveQuests(panelX, startY, panelW) {
        const quests = this.questSystem.activeQuests;

        if (quests.length === 0) {
            this.add.text(GAME_WIDTH / 2, startY + 60, 'No active quests.\nCheck the Available tab for new quests!', {
                fontFamily: 'monospace', fontSize: '13px', color: '#555566', align: 'center'
            }).setOrigin(0.5);
            return;
        }

        let y = startY + 10;
        for (let quest of quests) {
            this.drawQuestCard(panelX + 20, y, panelW - 40, quest, true);
            y += 80;
        }
    }

    showAvailableQuests(panelX, startY, panelW) {
        // Clear content area (simple approach: restart)
        this.questSystem.loadQuestsForStage(this.stage);
        const quests = this.questSystem.availableQuests;

        // We need to redraw - for simplicity, add new elements
        // In a production game, we'd use containers
        const clearG = this.add.graphics();
        clearG.fillStyle(COLORS.BG_PANEL, 0.95);
        clearG.fillRoundedRect(panelX + 5, startY, panelW - 10, 400, 8);

        if (quests.length === 0) {
            this.add.text(GAME_WIDTH / 2, startY + 60, 'No available quests for this area.\nComplete existing quests or explore new stages!', {
                fontFamily: 'monospace', fontSize: '13px', color: '#555566', align: 'center'
            }).setOrigin(0.5);
            return;
        }

        let y = startY + 10;
        for (let quest of quests) {
            this.drawQuestCard(panelX + 20, y, panelW - 40, quest, false);
            y += 80;
        }
    }

    showCompletedQuests(panelX, startY, panelW) {
        const clearG = this.add.graphics();
        clearG.fillStyle(COLORS.BG_PANEL, 0.95);
        clearG.fillRoundedRect(panelX + 5, startY, panelW - 10, 400, 8);

        const completed = this.questSystem.completedQuests;

        if (completed.length === 0) {
            this.add.text(GAME_WIDTH / 2, startY + 60, 'No completed quests yet.', {
                fontFamily: 'monospace', fontSize: '13px', color: '#555566', align: 'center'
            }).setOrigin(0.5);
            return;
        }

        let y = startY + 15;
        for (let questId of completed) {
            this.add.text(panelX + 30, y, `✓ ${questId}`, {
                fontFamily: 'monospace', fontSize: '12px', color: '#00ff88'
            });
            y += 22;
        }
    }

    drawQuestCard(x, y, width, quest, isActive) {
        const g = this.add.graphics();

        const typeColors = {
            exploration: COLORS.PRIMARY,
            combat: COLORS.DANGER,
            loot: COLORS.WARNING,
            delivery: COLORS.SUCCESS
        };
        const color = typeColors[quest.type] || COLORS.TEXT;

        // Card bg
        g.fillStyle(0x0a0a1a, 0.8);
        g.fillRoundedRect(x, y, width, 70, 6);
        g.lineStyle(1, color, 0.4);
        g.strokeRoundedRect(x, y, width, 70, 6);

        // Type badge
        const typeIcon = { exploration: '🔭', combat: '⚔', loot: '💎', delivery: '📦' };
        this.add.text(x + 10, y + 8, typeIcon[quest.type] || '?', { fontSize: '16px' });

        // Title
        this.add.text(x + 35, y + 8, quest.title, {
            fontFamily: 'monospace', fontSize: '13px',
            color: '#' + color.toString(16).padStart(6, '0'),
            fontStyle: 'bold'
        });

        // Description
        this.add.text(x + 35, y + 26, quest.description, {
            fontFamily: 'monospace', fontSize: '10px', color: '#888899',
            wordWrap: { width: width - 200 }
        });

        // Rewards
        const rewards = quest.rewards;
        this.add.text(x + 35, y + 48, `Rewards: ${rewards.xp}XP  ${rewards.credits}CR`, {
            fontFamily: 'monospace', fontSize: '10px', color: '#aabbcc'
        });

        if (isActive) {
            // Progress bar
            const pct = quest.progress || 0;
            const barW = 100;
            g.fillStyle(0x222233, 0.8);
            g.fillRoundedRect(x + width - barW - 15, y + 15, barW, 12, 3);
            g.fillStyle(color, 0.8);
            g.fillRoundedRect(x + width - barW - 15, y + 15, barW * pct, 12, 3);

            this.add.text(x + width - 15, y + 14, `${Math.floor(pct * 100)}%`, {
                fontFamily: 'monospace', fontSize: '10px', color: '#ffffff'
            }).setOrigin(1, 0);

            if (pct >= 1) {
                this.add.text(x + width - 60, y + 40, '✓ COMPLETE!', {
                    fontFamily: 'monospace', fontSize: '12px', color: '#00ff88', fontStyle: 'bold'
                });
            }
        } else {
            // Accept button
            Helpers.createButton(this, x + width - 55, y + 35, 90, 26, 'ACCEPT', () => {
                this.questSystem.acceptQuest(quest.id);
                this.scene.restart({ stage: this.stage });
            }, COLORS.SUCCESS);
        }
    }
}
