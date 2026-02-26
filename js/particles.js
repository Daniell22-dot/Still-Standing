/**
 * Particle System for STILL STANDING
 * Creates a soothing, glossy background with floating particles
 */

class ParticleSystem {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numParticles = 50; // Number of particles

        // Configuration
        this.config = {
            minSpeed: 0.2,
            maxSpeed: 0.8,
            minSize: 2,
            maxSize: 6,
            colors: [
                'rgba(52, 152, 219, 0.4)', // Blue
                'rgba(46, 204, 113, 0.4)', // Green
                'rgba(231, 76, 60, 0.4)',  // Red/Accent
                'rgba(255, 255, 255, 0.6)' // White
            ]
        };

        this.init();
    }

    init() {
        // Setup canvas
        this.canvas.id = 'particle-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1'; // Behind everything
        this.canvas.style.pointerEvents = 'none';
        document.body.appendChild(this.canvas);

        // Resize handler
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Create particles
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push(new Particle(this.canvas, this.config));
        }

        // Start animation loop
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.config = config;
        this.reset();
        // Randomize initial position
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = this.canvas.height + 10;
        this.size = Math.random() * (this.config.maxSize - this.config.minSize) + this.config.minSize;
        this.speedY = Math.random() * (this.config.maxSpeed - this.config.minSpeed) + this.config.minSpeed;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
        this.opacity = Math.random() * 0.5 + 0.1;
    }

    update() {
        this.y -= this.speedY;
        this.x += this.speedX;

        // Reset if moved off screen
        if (this.y < -10 || this.x < -10 || this.x > this.canvas.width + 10) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Add a glossy shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.size / 3, this.y - this.size / 3, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Only init if not already existing
    if (!document.getElementById('particle-canvas')) {
        new ParticleSystem();
    }
});
