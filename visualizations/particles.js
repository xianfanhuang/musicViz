// 粒子类定义
class Particle {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(1, 5) * audioData.energy * 2);
        this.acc = createVector(0, 0);
        this.lifespan = 255 * (1 - audioData.mids);
        this.hue = baseColor[0];
    }
    
    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.lifespan -= 5;
        
        this.size = 8 * pulseFactor;
    }
    
    show() {
        noStroke();
        fill(this.hue, baseColor[1], baseColor[2], map(this.lifespan, 0, 255, 0, 1));
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }
    
    isFinished() {
        return this.lifespan < 0;
    }
}

// 可视化函数
visualizations.particles = function() {
    background(0, 0, 0, 0.1); 
    
    // Create particles based on overall energy, making it more robust
    if (isPlaying && random(1) < audioData.energy * 2) {
        // In WEBGL mode, (0,0) is the center
        let newParticle = new Particle(0, 0);
        particles.push(newParticle);
    }
    
    for (let particle of particles) {
        particle.update();
        particle.show();
    }
    
    particles = particles.filter(p => !p.isFinished());
}
