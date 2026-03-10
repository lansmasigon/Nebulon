// Nebulon - Main Game Configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        BootScene,
        MenuScene,
        SpaceScene,
        CombatScene,
        LandingScene,
        PlanetScene,
        MapScene,
        InventoryScene,
        UpgradeScene,
        QuestScene,
        GameOverScene,
        VictoryScene,
        CraftingScene
    ]
};

// Start the game
const game = new Phaser.Game(config);
