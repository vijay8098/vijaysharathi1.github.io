// 1. SETUP
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];

// Particle density: number of particles per 10,000 square pixels
// Adjust this value to control density (higher = more particles)
// For example: 5 means 5 particles per 10,000 px² (100px × 100px)
let PARTICLE_DENSITY = 1.3;

// Toggle for activating/deactivating particles
let isParticlesActive = true;

// Animation frame ID for controlling the animation loop
let animationFrameId = null;

// Movement speed multiplier
let MOVEMENT_SPEED = 1;

// Connection radius for particles
let CONNECTION_RADIUS = 120;

// Colors
let NODE_COLOR = { r: 255, g: 255, b: 255 };
let CONNECTION_COLOR = { r: 147, g: 51, b: 234 };

// Calculate number of particles based on screen area
function calculateParticleCount() {
    const screenArea = canvas.width * canvas.height;
    const areaUnit = 10000; // Base unit: 10,000 px² (100px × 100px)
    return Math.floor((screenArea / areaUnit) * PARTICLE_DENSITY);
}

let numberOfParticles = calculateParticleCount();

// 2. MOUSE & TOUCH TRACKING
const mouse = {
    x: null,
    y: null,
    radius: 150 // This is now purely the connection radius for the mouse
};

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('touchstart', (event) => {
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
});
window.addEventListener('touchmove', (event) => {
    event.preventDefault();
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
});
window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    numberOfParticles = calculateParticleCount(); // Recalculate based on new size
    init();
});

// 3. PARTICLE CLASS (Simplified for Drift Only)
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = this.x; // This is now the "drift center"
        this.baseY = this.y;
        this.size = Math.random() * 2 + 1;

        // Properties for fluidic random motion
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = Math.random() * 0.2 + 0.1;
        this.driftChangeTimer = Math.random() * 100;
    }

    draw() {
        ctx.fillStyle = `rgba(${NODE_COLOR.r}, ${NODE_COLOR.g}, ${NODE_COLOR.b}, 0.8)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    update() {
        // --- FLUIDIC DRIFT MOTION (the only motion now) ---
        
        // Update the drift center occasionally
        if (this.driftChangeTimer++ > 120) {
            this.driftAngle += (Math.random() - 0.5) * Math.PI / 2;
            this.driftChangeTimer = 0;
        }

        // Move the drift center with speed multiplier
        this.baseX += Math.cos(this.driftAngle) * this.driftSpeed * MOVEMENT_SPEED;
        this.baseY += Math.sin(this.driftAngle) * this.driftSpeed * MOVEMENT_SPEED;

        // Wrap the drift center around the screen edges
        if (this.baseX < 0) this.baseX = canvas.width;
        if (this.baseX > canvas.width) this.baseX = 0;
        if (this.baseY < 0) this.baseY = canvas.height;
        if (this.baseY > canvas.height) this.baseY = 0;

        // Gently pull the particle towards its moving drift center
        let homeX = this.baseX - this.x;
        let homeY = this.baseY - this.y;
        this.x += homeX / 50;
        this.y += homeY / 50;
    }
}

function toggleParticleSystem() {
    if (isParticlesActive) {
        isParticlesActive = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
        document.body.classList.add('particles-disabled');
    } else {
        isParticlesActive = true;
        canvas.style.display = 'block';
        document.body.classList.remove('particles-disabled');
        animate();
    }
}

// 4. INITIALIZE PARTICLES (randomly)
function init() {
    particlesArray = [];
    for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particlesArray.push(new Particle(x, y));
    }
}

// 5. ANIMATION LOOP & CONNECTION LOGIC
function animate() {
    ctx.fillStyle = 'rgba(9, 10, 15, 0.05)'; // Creates a trailing effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Build the Quadtree for this frame
    const boundary = new Rectangle(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2);
    const quadtree = new QuadTree(boundary, 4);
    for (let p of particlesArray) {
        quadtree.insert(p);
    }

    // Update particles
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }

    // --- NEW: Connect mouse to nearby particles ---
    if (mouse.x != null) {
        const radiusSquared = mouse.radius * mouse.radius;
        for (let i = 0; i < particlesArray.length; i++) {
            const p = particlesArray[i];
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < radiusSquared) {
                const distance = Math.sqrt(distanceSquared);
                const opacityValue = 1 - (distance / mouse.radius);
                // Make mouse lines brighter and slightly thicker
                ctx.strokeStyle = `rgba(186, 85, 211, ${opacityValue * 0.9})`; // Brighter purple
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
        }
    }
    
    // --- Connect particles to other particles ---
    const connectionRadiusSquared = CONNECTION_RADIUS * CONNECTION_RADIUS;
    for (let i = 0; i < particlesArray.length; i++) {
        const p = particlesArray[i];
        const range = new Rectangle(p.x, p.y, CONNECTION_RADIUS * 2, CONNECTION_RADIUS * 2);
        const points = quadtree.query(range);

        for (let j = 0; j < points.length; j++) {
            const p2 = points[j];
            if (p === p2) continue;

            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < connectionRadiusSquared) {
                const distance = Math.sqrt(distanceSquared);
                const opacityValue = 1 - (distance / CONNECTION_RADIUS);
                ctx.strokeStyle = `rgba(${CONNECTION_COLOR.r}, ${CONNECTION_COLOR.g}, ${CONNECTION_COLOR.b}, ${opacityValue * 0.4})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    // Draw particles on top of all lines
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
    }

    if (isParticlesActive) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Start the animation
init();
animate();

// Wire up toggle button after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-particles-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleParticleSystem);
        console.log('Toggle particles button event listener attached');
    } else {
        console.error('Toggle button not found!');
    }
});