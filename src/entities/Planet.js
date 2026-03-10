// Planet Entity (for map display)
class Planet {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.radius = data.radius;
        this.color = data.color;
        this.description = data.description;
        this.resources = data.resources;
        this.enemyLevel = data.enemyLevel;
        this.isHub = data.isHub || false;
        this.hasStation = data.hasStation || false;
        this.hasRings = data.hasRings || false;
        this.isStation = data.isStation || false;
        this.isBossArea = data.isBossArea || false;
        this.isFinal = data.isFinal || false;

        // Orbital data
        this.orbitRadius = data.orbitRadius || 100;
        this.orbitSpeed = data.orbitSpeed || 0.3;
        this.orbitAngle = data.startAngle || Helpers.randomFloat(0, Math.PI * 2);
        this.order = data.order !== undefined ? data.order : 0;
        this.unlocked = data.unlocked !== undefined ? data.unlocked : true;

        // Static x/y for non-orbital use (galaxy, black hole stages)
        this.staticX = data.x || 0;
        this.staticY = data.y || 0;

        // Computed position (updated per frame for orbital planets)
        this.x = this.staticX;
        this.y = this.staticY;

        this.hovered = false;
        this.selected = false;
        this.visited = false;
        this.pulsePhase = Helpers.randomFloat(0, Math.PI * 2);
    }

    // Update orbital position around a center point
    updateOrbit(dt, centerX, centerY) {
        this.pulsePhase += dt / 1000;
        this.orbitAngle += this.orbitSpeed * (dt / 1000);
        this.x = centerX + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = centerY + Math.sin(this.orbitAngle) * this.orbitRadius;
    }

    update(dt) {
        this.pulsePhase += dt / 1000;
    }

    draw(graphics) {
        const pulse = 1 + Math.sin(this.pulsePhase * 2) * 0.05;
        const r = this.radius * pulse;

        // Rings (Saturn)
        if (this.hasRings) {
            graphics.lineStyle(3, 0xddcc88, 0.4);
            graphics.strokeEllipse(this.x, this.y, r * 3.5, r * 1.2);
            graphics.lineStyle(2, 0xccbb77, 0.3);
            graphics.strokeEllipse(this.x, this.y, r * 3, r * 1.0);
        }

        // Atmosphere glow
        graphics.fillStyle(this.color, 0.1);
        graphics.fillCircle(this.x, this.y, r * 1.5);

        // Planet body
        graphics.fillStyle(this.color, this.unlocked ? 1 : 0.3);
        graphics.fillCircle(this.x, this.y, r);

        // Light side
        graphics.fillStyle(0xffffff, this.unlocked ? 0.15 : 0.05);
        graphics.fillCircle(this.x - r * 0.2, this.y - r * 0.2, r * 0.7);

        // Dark side
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillCircle(this.x + r * 0.25, this.y + r * 0.25, r * 0.6);

        // Lock indicator for locked planets
        if (!this.unlocked) {
            graphics.lineStyle(2, 0x555555, 0.6);
            graphics.strokeCircle(this.x, this.y, r + 4);
        }

        // Station indicator
        if (this.hasStation || this.isStation) {
            graphics.lineStyle(1, 0xffdd00, 0.6);
            graphics.strokeCircle(this.x, this.y, r + 5);
        }

        // Boss area marker
        if (this.isBossArea && this.unlocked) {
            graphics.lineStyle(2, COLORS.DANGER, 0.4 + Math.sin(this.pulsePhase * 3) * 0.3);
            graphics.strokeCircle(this.x, this.y, r + 10);
        }

        // Hover effect
        if (this.hovered && this.unlocked) {
            graphics.lineStyle(2, COLORS.PRIMARY, 0.8);
            graphics.strokeCircle(this.x, this.y, r + 6);
        }

        // Selected effect
        if (this.selected) {
            graphics.lineStyle(2, COLORS.SUCCESS, 1);
            graphics.strokeCircle(this.x, this.y, r + 8);
        }

        // Visited marker
        if (this.visited) {
            graphics.fillStyle(COLORS.SUCCESS, 0.8);
            graphics.fillCircle(this.x + r + 4, this.y - r - 4, 4);
        }
    }
}
