// Combat System
class CombatSystem {
    constructor() {
        this.projectiles = [];
        this.explosions = [];
        this.damageNumbers = [];
    }

    createProjectile(x, y, angle, speed, damage, isPlayer, color) {
        const proj = new Projectile(x, y, angle, speed, damage, isPlayer, color);
        this.projectiles.push(proj);
        return proj;
    }

    createMissile(x, y, angle, damage, targetX, targetY) {
        const missile = new Missile(x, y, angle, damage, targetX, targetY);
        this.projectiles.push(missile);
        return missile;
    }

    addExplosion(x, y, size, color) {
        this.explosions.push({
            x, y,
            size,
            maxSize: size,
            color: color || 0xff8800,
            alpha: 1,
            particles: this.generateExplosionParticles(x, y, size, color)
        });
    }

    generateExplosionParticles(x, y, size, color) {
        const particles = [];
        const count = Math.floor(size * 1.5);
        for (let i = 0; i < count; i++) {
            const angle = Helpers.randomFloat(0, Math.PI * 2);
            const speed = Helpers.randomFloat(50, 200);
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Helpers.randomFloat(1, 4),
                alpha: 1,
                color: Helpers.randomElement([color || 0xff8800, 0xff4400, 0xffaa00, 0xffffff])
            });
        }
        return particles;
    }

    addDamageNumber(x, y, amount, color) {
        this.damageNumbers.push({
            x, y,
            text: '-' + amount,
            color: color || COLORS.DANGER,
            alpha: 1,
            vy: -40
        });
    }

    update(dt) {
        // Update projectiles
        for (let proj of this.projectiles) {
            proj.update(dt);
        }
        this.projectiles = this.projectiles.filter(p => p.alive);

        // Update explosions
        for (let exp of this.explosions) {
            exp.alpha -= dt / 600;
            for (let p of exp.particles) {
                p.x += p.vx * (dt / 1000);
                p.y += p.vy * (dt / 1000);
                p.alpha -= dt / 400;
                p.vx *= 0.98;
                p.vy *= 0.98;
            }
            exp.particles = exp.particles.filter(p => p.alpha > 0);
        }
        this.explosions = this.explosions.filter(e => e.alpha > 0);

        // Update damage numbers
        for (let dn of this.damageNumbers) {
            dn.y += dn.vy * (dt / 1000);
            dn.alpha -= dt / 800;
        }
        this.damageNumbers = this.damageNumbers.filter(dn => dn.alpha > 0);
    }

    draw(graphics) {
        // Draw projectiles
        for (let proj of this.projectiles) {
            proj.draw(graphics);
        }

        // Draw explosions
        for (let exp of this.explosions) {
            for (let p of exp.particles) {
                if (p.alpha > 0) {
                    graphics.fillStyle(p.color, p.alpha);
                    graphics.fillCircle(p.x, p.y, p.size);
                }
            }
            // Central flash
            if (exp.alpha > 0.5) {
                graphics.fillStyle(0xffffff, (exp.alpha - 0.5) * 2);
                graphics.fillCircle(exp.x, exp.y, exp.maxSize * 0.3 * exp.alpha);
            }
        }
    }

    drawUI(scene) {
        // Damage numbers need text rendering
        for (let dn of this.damageNumbers) {
            // These are handled via scene text objects in the CombatScene
        }
    }

    checkCollision(obj1X, obj1Y, obj1Size, obj2X, obj2Y, obj2Size) {
        return Helpers.distance(obj1X, obj1Y, obj2X, obj2Y) < (obj1Size + obj2Size);
    }

    clear() {
        this.projectiles = [];
        this.explosions = [];
        this.damageNumbers = [];
    }
}
