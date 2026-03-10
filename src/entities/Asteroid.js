// Asteroid Entity
class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size || Helpers.randomFloat(10, 35);
        this.rotation = Helpers.randomFloat(0, Math.PI * 2);
        this.rotationSpeed = Helpers.randomFloat(-1, 1);
        this.velocityX = Helpers.randomFloat(-40, 40);
        this.velocityY = Helpers.randomFloat(-40, 40);
        this.health = Math.floor(this.size * 2);
        this.maxHealth = this.health;
        this.alive = true;
        this.damage = Math.floor(this.size * 0.5);
        this.flashTimer = 0;

        // Generate random shape vertices
        this.vertices = [];
        const numVertices = Helpers.randomInt(6, 10);
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const dist = this.size * Helpers.randomFloat(0.7, 1.0);
            this.vertices.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
        }

        // Color variants
        this.color = Helpers.randomElement([0x887766, 0x998877, 0x776655, 0x665544]);
    }

    update(dt) {
        if (!this.alive) return;

        this.x += this.velocityX * (dt / 1000);
        this.y += this.velocityY * (dt / 1000);
        this.rotation += this.rotationSpeed * (dt / 1000);

        if (this.flashTimer > 0) this.flashTimer -= dt;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTimer = 80;
        if (this.health <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    draw(graphics, camX, camY) {
        if (!this.alive) return;
        var ox = camX !== undefined ? -camX : 0;
        var oy = camY !== undefined ? -camY : 0;
        var sx = this.x + ox;
        var sy = this.y + oy;
        if (sx < -this.size * 2 || sx > GAME_WIDTH + this.size * 2 || sy < -this.size * 2 || sy > GAME_HEIGHT + this.size * 2) return;

        const flash = this.flashTimer > 0;
        graphics.save();
        graphics.translateCanvas(sx, sy);
        graphics.rotateCanvas(this.rotation);

        const drawColor = flash ? 0xffffff : this.color;
        graphics.fillStyle(drawColor, 1);
        graphics.beginPath();
        graphics.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            graphics.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        graphics.closePath();
        graphics.fillPath();

        // Highlights
        graphics.fillStyle(0xffffff, 0.1);
        graphics.fillCircle(-this.size * 0.2, -this.size * 0.2, this.size * 0.3);

        // Craters
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillCircle(this.size * 0.2, this.size * 0.1, this.size * 0.15);
        graphics.fillCircle(-this.size * 0.1, this.size * 0.25, this.size * 0.1);

        graphics.restore();
    }

    getDrops() {
        if (Math.random() < 0.4) {
            return [Helpers.randomElement(GameData.loot.common)];
        }
        return [];
    }
}
