// Utility helpers
const Helpers = {
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    rarityColor(rarity) {
        const colors = {
            common: COLORS.COMMON,
            uncommon: COLORS.UNCOMMON,
            rare: COLORS.RARE,
            legendary: COLORS.LEGENDARY
        };
        return colors[rarity] || COLORS.TEXT;
    },

    getRandomLoot(level) {
        const roll = Math.random();
        let pool;
        if (roll < 0.5) pool = GameData.loot.common;
        else if (roll < 0.8) pool = GameData.loot.uncommon;
        else if (roll < 0.95) pool = GameData.loot.rare;
        else pool = GameData.loot.legendary;
        return Helpers.randomElement(pool);
    },

    getEnemyForLevel(level) {
        if (level <= 2) return Helpers.randomElement(['pirate', 'drone']);
        if (level <= 5) return Helpers.randomElement(['pirate', 'alien', 'drone']);
        if (level <= 8) return Helpers.randomElement(['alien', 'asteroid_creature', 'pirate']);
        return Helpers.randomElement(['alien', 'asteroid_creature']);
    },

    generateStars(scene, count, width, height) {
        const graphics = scene.add.graphics();
        for (let i = 0; i < count; i++) {
            const x = Helpers.randomFloat(0, width);
            const y = Helpers.randomFloat(0, height);
            const size = Helpers.randomFloat(0.5, 2);
            const alpha = Helpers.randomFloat(0.3, 1);
            const color = Helpers.randomElement([0xffffff, 0xaaccff, 0xffddaa, 0xffaaaa]);
            graphics.fillStyle(color, alpha);
            graphics.fillCircle(x, y, size);
        }
        return graphics;
    },

    drawShipShape(graphics, x, y, size, color, rotation) {
        graphics.save();
        graphics.translateCanvas(x, y);
        graphics.rotateCanvas(rotation || 0);
        graphics.fillStyle(color, 1);
        graphics.fillTriangle(0, -size, -size * 0.6, size * 0.5, size * 0.6, size * 0.5);
        graphics.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(30).color, 1);
        graphics.fillTriangle(0, -size * 0.6, -size * 0.3, size * 0.2, size * 0.3, size * 0.2);
        graphics.restore();
    },

    createButton(scene, x, y, width, height, text, callback, color) {
        const btnColor = color || COLORS.PRIMARY;
        const container = scene.add.container(x, y);

        const bg = scene.add.graphics();
        bg.fillStyle(btnColor, 0.3);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
        bg.lineStyle(2, btnColor, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

        const label = scene.add.text(0, 0, text, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        container.add([bg, label]);
        container.setSize(width, height);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(btnColor, 0.6);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(2, btnColor, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        });

        container.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(btnColor, 0.3);
            bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
            bg.lineStyle(2, btnColor, 1);
            bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
        });

        container.on('pointerdown', callback);

        return container;
    },

    createPanel(scene, x, y, width, height, alpha) {
        const panel = scene.add.graphics();
        panel.fillStyle(COLORS.BG_PANEL, alpha || 0.8);
        panel.fillRoundedRect(x, y, width, height, 12);
        panel.lineStyle(2, COLORS.PRIMARY, 0.5);
        panel.strokeRoundedRect(x, y, width, height, 12);
        return panel;
    },

    createProgressBar(scene, x, y, width, height, value, maxValue, color) {
        const graphics = scene.add.graphics();
        // Background
        graphics.fillStyle(0x222233, 0.8);
        graphics.fillRoundedRect(x, y, width, height, 4);
        // Fill
        const fillWidth = Math.max(0, (value / maxValue) * width);
        if (fillWidth > 0) {
            graphics.fillStyle(color, 0.9);
            graphics.fillRoundedRect(x, y, fillWidth, height, 4);
        }
        // Border
        graphics.lineStyle(1, 0x445566, 0.8);
        graphics.strokeRoundedRect(x, y, width, height, 4);
        return graphics;
    }
};
