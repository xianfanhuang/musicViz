class Particle {
    constructor(x, y, audioData) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(1, 5) * audioData.treble * currentVisualEnergy * 2);
        this.acc = createVector(0, 0);
        this.lifespan = 255 * (1 - audioData.mids);
    }
    
    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 5;
        this.size = 8 * pulseFactor;
    }
    
    show() {
        noStroke();
        fill(baseColor[0], baseColor[1], baseColor[2], map(this.lifespan, 0, 255, 0, 1));
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
    
    isFinished() {
        return this.lifespan < 0;
    }
}

let particles = [];
const MAX_PARTICLES = 500;

visualizations.particles = function(audioData, dataArray) {
    background(0, 0, 0, 0.1); 
    
    if (audioManager.isPlaying && random(1) < audioData.treble * 1) {
        let newParticle = new Particle(width / 2, height / 2, audioData);
        particles.push(newParticle);
    }
    
    for (let particle of particles) {
        particle.update();
        particle.show();
    }
    
    particles = particles.filter(p => !p.isFinished());
}
