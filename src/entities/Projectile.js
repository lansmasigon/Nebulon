// Projectile Entity
class Projectile {
    constructor(x, y, angle, speed, damage, isPlayer, color) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed || 500;
        this.damage = damage || 10;
        this.isPlayer = isPlayer;
        this.color = color || (isPlayer ? COLORS.PRIMARY : 0xff4444);
        this.alive = true;
        this.size = isPlayer ? 4 : 3;
        this.lifetime = 2000;
        this.trail = [];
        this.trailTimer = 0;
    }

    update(dt) {
        if (!this.alive) return;

        this.x += Math.cos(this.angle) * this.speed * (dt / 1000);
        this.y += Math.sin(this.angle) * this.speed * (dt / 1000);

        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.alive = false;
        }

        // Off screen
        if (this.x < -20 || this.x > GAME_WIDTH + 20 || this.y < -20 || this.y > GAME_HEIGHT + 20) {
            this.alive = false;
        }

        // Trail
        this.trailTimer -= dt;
        if (this.trailTimer <= 0) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            this.trailTimer = 20;
            if (this.trail.length > 8) this.trail.shift();
        }

        // Fade trail
        for (let t of this.trail) {
            t.alpha -= dt / 200;
        }
        this.trail = this.trail.filter(t => t.alpha > 0);
    }

    draw(graphics) {
        if (!this.alive) return;

        // Trail
        for (let t of this.trail) {
            graphics.fillStyle(this.color, t.alpha * 0.4);
            graphics.fillCircle(t.x, t.y, this.size * 0.6);
        }

        // Core
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(this.x, this.y, this.size * 0.5);

        // Glow
        graphics.fillStyle(this.color, 0.8);
        graphics.fillCircle(this.x, this.y, this.size);

        // Outer glow
        graphics.fillStyle(this.color, 0.2);
        graphics.fillCircle(this.x, this.y, this.size * 2);
    }
}

class Missile extends Projectile {
    constructor(x, y, angle, damage, targetX, targetY) {
        super(x, y, angle, 350, damage * 3, true, 0xff8800);
        this.targetX = targetX;
        this.targetY = targetY;
        this.size = 6;
        this.lifetime = 3000;
        this.turnSpeed = 3;
    }

    update(dt) {
        if (!this.alive) return;

        // Home toward target
        if (this.targetX !== undefined) {
            const targetAngle = Helpers.angleBetween(this.x, this.y, this.targetX, this.targetY);
            let angleDiff = targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += Helpers.clamp(angleDiff, -this.turnSpeed * (dt / 1000), this.turnSpeed * (dt / 1000));
        }

        super.update(dt);
    }

    draw(graphics) {
        if (!this.alive) return;

        // Trail
        for (let t of this.trail) {
            graphics.fillStyle(0xff6600, t.alpha * 0.5);
            graphics.fillCircle(t.x, t.y, this.size * 0.8);
        }

        // Missile body
        graphics.save();
        graphics.translateCanvas(this.x, this.y);
        graphics.rotateCanvas(this.angle);
        graphics.fillStyle(0xdddddd, 1);
        graphics.fillRect(-this.size, -2, this.size * 2, 4);
        graphics.fillStyle(0xff4400, 1);
        graphics.fillTriangle(this.size, 0, -this.size, -3, -this.size, 3);
        graphics.restore();

        // Engine glow
        const exX = this.x - Math.cos(this.angle) * this.size;
        const exY = this.y - Math.sin(this.angle) * this.size;
        graphics.fillStyle(0xff8800, 0.6);
        graphics.fillCircle(exX, exY, 4 + Math.random() * 2);
    }
}
