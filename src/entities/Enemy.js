// Enemy Entity - Detailed Designs
class Enemy {
    constructor(type, x, y, level) {
        var data = GameData.enemies[type];
        this.type = type;
        this.name = data.name;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.velocityX = 0;
        this.velocityY = 0;

        var levelMult = 1 + (level - 1) * 0.15;
        this.maxHealth = Math.floor(data.health * levelMult);
        this.health = this.maxHealth;
        this.speed = data.speed;
        this.damage = Math.floor(data.damage * levelMult);
        this.xpReward = Math.floor(data.xp * levelMult);
        this.creditReward = Math.floor(data.credits * levelMult);
        this.color = data.color;
        this.size = data.size;
        this.isBoss = data.isBoss || false;
        this.level = level;

        // Visual design
        this.design = ENEMY_DESIGNS[type] || ENEMY_DESIGNS.pirate;
        this.animPhase = Helpers.randomFloat(0, Math.PI * 2);

        // AI state
        this.state = 'patrol';
        this.targetX = x;
        this.targetY = y;
        this.patrolTimer = 0;
        this.fireTimer = 0;
        this.fireRate = this.isBoss ? 600 : 1000;
        this.aggroRange = this.isBoss ? 500 : 300;
        this.attackRange = this.isBoss ? 350 : 200;
        this.alive = true;
        this.deathTimer = 0;
        this.flashTimer = 0;

        if (this.isBoss) {
            this.phase = 1;
            this.specialAttackTimer = 0;
            this.specialAttackCooldown = 3000;
        }
    }

    update(dt, playerX, playerY) {
        if (!this.alive) return;
        this.animPhase += dt / 500;

        var distToPlayer = Helpers.distance(this.x, this.y, playerX, playerY);
        var angleToPlayer = Helpers.angleBetween(this.x, this.y, playerX, playerY);

        switch (this.state) {
            case 'patrol':
                this.patrolTimer -= dt;
                if (this.patrolTimer <= 0) {
                    this.targetX = this.x + Helpers.randomFloat(-200, 200);
                    this.targetY = this.y + Helpers.randomFloat(-200, 200);
                    this.patrolTimer = Helpers.randomFloat(1000, 3000);
                }
                if (distToPlayer < this.aggroRange) this.state = 'chase';
                this.moveToward(this.targetX, this.targetY, dt, 0.5);
                break;
            case 'chase':
                if (distToPlayer > this.aggroRange * 1.5) this.state = 'patrol';
                else if (distToPlayer < this.attackRange) this.state = 'attack';
                this.moveToward(playerX, playerY, dt, 1);
                break;
            case 'attack':
                if (distToPlayer > this.attackRange * 1.3) this.state = 'chase';
                this.rotation = angleToPlayer;
                this.fireTimer -= dt;
                var strafeAngle = angleToPlayer + Math.PI / 2;
                this.x += Math.cos(strafeAngle) * this.speed * 0.3 * (dt / 1000);
                this.y += Math.sin(strafeAngle) * this.speed * 0.3 * (dt / 1000);
                break;
            case 'flee':
                var fleeAngle = angleToPlayer + Math.PI;
                this.x += Math.cos(fleeAngle) * this.speed * (dt / 1000);
                this.y += Math.sin(fleeAngle) * this.speed * (dt / 1000);
                if (this.health > this.maxHealth * 0.3) this.state = 'chase';
                break;
        }

        if (this.isBoss) {
            if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
                this.phase = 2; this.fireRate *= 0.7; this.speed *= 1.3;
            }
            if (this.health < this.maxHealth * 0.25 && this.phase === 2) {
                this.phase = 3; this.fireRate *= 0.7; this.damage *= 1.5;
            }
        }

        if (this.health < this.maxHealth * 0.15 && !this.isBoss) this.state = 'flee';

        // Don't clamp to screen for infinite space - clamp to larger world
        this.x = Helpers.clamp(this.x, -SPACE_WORLD_SIZE, SPACE_WORLD_SIZE);
        this.y = Helpers.clamp(this.y, -SPACE_WORLD_SIZE, SPACE_WORLD_SIZE);

        if (this.flashTimer > 0) this.flashTimer -= dt;
    }

    moveToward(tx, ty, dt, speedMult) {
        var angle = Helpers.angleBetween(this.x, this.y, tx, ty);
        this.rotation = angle;
        this.x += Math.cos(angle) * this.speed * speedMult * (dt / 1000);
        this.y += Math.sin(angle) * this.speed * speedMult * (dt / 1000);
    }

    canFire() { return this.fireTimer <= 0 && this.state === 'attack'; }
    fire() { this.fireTimer = this.fireRate; }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTimer = 100;
        if (this.health <= 0) { this.health = 0; this.alive = false; return true; }
        return false;
    }

    draw(graphics, camX, camY) {
        if (!this.alive) return;
        var ox = camX !== undefined ? -camX : 0;
        var oy = camY !== undefined ? -camY : 0;
        var sx = this.x + ox;
        var sy = this.y + oy;

        // Skip if off screen
        if (sx < -80 || sx > GAME_WIDTH + 80 || sy < -80 || sy > GAME_HEIGHT + 80) return;

        var flash = this.flashTimer > 0;
        var s = this.size;
        var d = this.design;

        graphics.save();
        graphics.translateCanvas(sx, sy);
        graphics.rotateCanvas(this.rotation);

        // Aura glow for bosses
        if (d.hasAura) {
            var auraSize = s * (1.5 + Math.sin(this.animPhase) * 0.2);
            graphics.fillStyle(d.bodyColor, 0.08);
            graphics.fillCircle(0, 0, auraSize);
            graphics.fillStyle(d.bodyColor, 0.04);
            graphics.fillCircle(0, 0, auraSize * 1.3);
        }

        // Regular glow
        if (d.hasGlow) {
            graphics.fillStyle(d.bodyColor, 0.12 + Math.sin(this.animPhase) * 0.05);
            graphics.fillCircle(0, 0, s * 1.2);
        }

        // Engine glow
        graphics.fillStyle(0xff4400, 0.3);
        graphics.fillCircle(-s * 0.5, 0, s * 0.15 + Math.random() * 2);

        // Draw parts
        var bodyColor = flash ? 0xffffff : d.bodyColor;
        var accentC = flash ? 0xffffff : d.accentColor;

        for (var i = 0; i < d.parts.length; i++) {
            var part = d.parts[i];
            var fillColor = bodyColor;
            if (part.fill === 'wing' || part.fill === 'panel') fillColor = accentC;
            else if (part.fill === 'cockpit') fillColor = flash ? 0xffffff : 0xaaddff;
            else if (part.fill === 'eye') fillColor = flash ? 0xffffff : 0xff0000;
            else if (part.fill === 'sensor') fillColor = flash ? 0xffffff : 0x00ffff;
            else if (part.fill === 'core') fillColor = flash ? 0xffffff : 0xff00ff;

            if (part.type === 'tri') {
                graphics.fillStyle(fillColor, 1);
                graphics.fillTriangle(
                    part.pts[0][0] * s, part.pts[0][1] * s,
                    part.pts[1][0] * s, part.pts[1][1] * s,
                    part.pts[2][0] * s, part.pts[2][1] * s
                );
            } else if (part.type === 'quad') {
                graphics.fillStyle(fillColor, 1);
                graphics.beginPath();
                graphics.moveTo(part.pts[0][0] * s, part.pts[0][1] * s);
                graphics.lineTo(part.pts[1][0] * s, part.pts[1][1] * s);
                graphics.lineTo(part.pts[2][0] * s, part.pts[2][1] * s);
                graphics.lineTo(part.pts[3][0] * s, part.pts[3][1] * s);
                graphics.closePath();
                graphics.fillPath();
            } else if (part.type === 'circle') {
                graphics.fillStyle(fillColor, part.fill === 'eye' ? 1 : 0.9);
                graphics.fillCircle(part.cx * s, part.cy * s, part.r * s);
                if (part.fill === 'eye') {
                    graphics.fillStyle(0x000000, 1);
                    graphics.fillCircle(part.cx * s + 1, part.cy * s, part.r * s * 0.4);
                }
            } else if (part.type === 'ellipse') {
                graphics.fillStyle(fillColor, 1);
                graphics.fillEllipse(part.cx * s, part.cy * s, part.rx * s * 2, part.ry * s * 2);
            } else if (part.type === 'star') {
                graphics.fillStyle(fillColor, 1);
                graphics.beginPath();
                for (var si = 0; si < part.points * 2; si++) {
                    var angle = (si / (part.points * 2)) * Math.PI * 2 - Math.PI / 2;
                    var rad = si % 2 === 0 ? part.outerR * s : part.innerR * s;
                    if (si === 0) graphics.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
                    else graphics.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
                }
                graphics.closePath();
                graphics.fillPath();
            } else if (part.type === 'irregular') {
                graphics.fillStyle(fillColor, 1);
                graphics.beginPath();
                for (var ii = 0; ii < part.numPts; ii++) {
                    var ia = (ii / part.numPts) * Math.PI * 2;
                    var ir = Helpers.lerp(part.minR, part.maxR, (Math.sin(ia * 3 + this.animPhase * 0.5) + 1) / 2) * s;
                    if (ii === 0) graphics.moveTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
                    else graphics.lineTo(Math.cos(ia) * ir, Math.sin(ia) * ir);
                }
                graphics.closePath();
                graphics.fillPath();
            }
        }

        // Tentacles
        if (d.hasTentacles) {
            for (var t = 0; t < 4; t++) {
                var ta = (t / 4) * Math.PI * 2 + Math.PI;
                var tLen = s * (0.8 + Math.sin(this.animPhase + t) * 0.3);
                graphics.lineStyle(2, accentC, 0.6);
                var tx1 = Math.cos(ta) * s * 0.5;
                var ty1 = Math.sin(ta) * s * 0.5;
                var tx2 = Math.cos(ta + Math.sin(this.animPhase + t) * 0.3) * tLen;
                var ty2 = Math.sin(ta + Math.sin(this.animPhase + t) * 0.3) * tLen;
                graphics.lineBetween(tx1, ty1, tx2, ty2);
            }
        }

        // Skull icon for pirates
        if (d.hasSkull) {
            graphics.fillStyle(0xffffff, 0.5);
            graphics.fillCircle(s * 0.25, 0, s * 0.12);
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(s * 0.22, -s * 0.03, 1.5);
            graphics.fillCircle(s * 0.28, -s * 0.03, 1.5);
        }

        // Boss crown
        if (d.hasCrown) {
            graphics.fillStyle(COLORS.WARNING, 1);
            graphics.fillTriangle(-s * 0.15, -s * 0.6, 0, -s * 0.85, s * 0.15, -s * 0.6);
            graphics.fillTriangle(s * 0.05, -s * 0.6, s * 0.2, -s * 0.8, s * 0.35, -s * 0.6);
            graphics.fillTriangle(-s * 0.35, -s * 0.6, -s * 0.2, -s * 0.8, -s * 0.05, -s * 0.6);
        }

        // Antenna for drones
        if (d.hasAntenna) {
            graphics.lineStyle(1, 0x00ffff, 0.7);
            graphics.lineBetween(0, -s * 0.2, s * 0.1, -s * 0.5);
            graphics.fillStyle(0x00ffff, 0.9 + Math.sin(this.animPhase * 3) * 0.1);
            graphics.fillCircle(s * 0.1, -s * 0.5, 2);
        }

        graphics.restore();

        // Health bar
        var barWidth = s * 2 + 6;
        var barHeight = this.isBoss ? 5 : 3;
        var barX = sx - barWidth / 2;
        var barY = sy - s - (this.isBoss ? 15 : 8);
        graphics.fillStyle(0x333333, 0.8);
        graphics.fillRect(barX, barY, barWidth, barHeight);
        var healthPct = this.health / this.maxHealth;
        var hColor = healthPct > 0.5 ? 0x00ff00 : healthPct > 0.25 ? 0xffff00 : 0xff0000;
        graphics.fillStyle(hColor, 1);
        graphics.fillRect(barX, barY, barWidth * healthPct, barHeight);

        // Boss name plate
        if (this.isBoss) {
            graphics.lineStyle(1, d.bodyColor, 0.5);
            graphics.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        }
    }

    getDrops() {
        var drops = [];
        drops.push(Helpers.getRandomLoot(this.level));
        if (this.isBoss) {
            drops.push(Helpers.randomElement(GameData.loot.rare));
            if (Math.random() < 0.5) drops.push(Helpers.randomElement(GameData.loot.legendary));
        }
        return drops;
    }
}
