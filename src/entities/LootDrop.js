// Loot Drop Entity
class LootDrop {
    constructor(x, y, lootData) {
        this.x = x;
        this.y = y;
        this.data = lootData;
        this.alive = true;
        this.size = 8;
        this.lifetime = 15000; // 15 seconds
        this.bobOffset = Helpers.randomFloat(0, Math.PI * 2);
        this.bobSpeed = 3;
        this.sparkleTimer = 0;
        this.sparkles = [];
        this.pulsePhase = 0;

        this.color = Helpers.rarityColor(lootData.rarity);
    }

    update(dt) {
        if (!this.alive) return;

        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.alive = false;
            return;
        }

        this.bobOffset += this.bobSpeed * (dt / 1000);
        this.pulsePhase += dt / 300;

        // Sparkle effect
        this.sparkleTimer -= dt;
        if (this.sparkleTimer <= 0) {
            this.sparkles.push({
                x: this.x + Helpers.randomFloat(-10, 10),
                y: this.y + Helpers.randomFloat(-10, 10),
                alpha: 1,
                size: Helpers.randomFloat(1, 3)
            });
            this.sparkleTimer = this.data.rarity === 'legendary' ? 50 : this.data.rarity === 'rare' ? 100 : 200;
        }

        for (let s of this.sparkles) {
            s.alpha -= dt / 500;
            s.y -= dt * 0.02;
        }
        this.sparkles = this.sparkles.filter(s => s.alpha > 0);
    }

    draw(graphics, camX, camY) {
        if (!this.alive) return;
        var ox = camX !== undefined ? -camX : 0;
        var oy = camY !== undefined ? -camY : 0;

        const yOff = Math.sin(this.bobOffset) * 3;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const fadeAlpha = this.lifetime < 3000 ? (this.lifetime / 3000) : 1;

        var dx = this.x + ox;
        var dy = this.y + oy;
        if (dx < -30 || dx > GAME_WIDTH + 30 || dy < -30 || dy > GAME_HEIGHT + 30) return;

        // Sparkles
        for (let s of this.sparkles) {
            graphics.fillStyle(this.color, s.alpha * fadeAlpha);
            graphics.fillCircle(s.x + ox, s.y + oy, s.size);
        }

        // Outer glow
        graphics.fillStyle(this.color, 0.15 * fadeAlpha);
        graphics.fillCircle(dx, dy + yOff, this.size * 2.5 * pulse);

        // Inner glow
        graphics.fillStyle(this.color, 0.3 * fadeAlpha);
        graphics.fillCircle(dx, dy + yOff, this.size * 1.5 * pulse);

        // Core shape - diamond
        const s = this.size * pulse;
        graphics.fillStyle(this.color, fadeAlpha);
        graphics.beginPath();
        graphics.moveTo(dx, dy + yOff - s);
        graphics.lineTo(dx + s * 0.6, dy + yOff);
        graphics.lineTo(dx, dy + yOff + s);
        graphics.lineTo(dx - s * 0.6, dy + yOff);
        graphics.closePath();
        graphics.fillPath();

        // Highlight
        graphics.fillStyle(0xffffff, 0.6 * fadeAlpha);
        graphics.fillCircle(dx - 1, dy + yOff - 2, this.size * 0.25);
    }
}
