// --- Global p5.js Sketch ---

let musicPlayer;
let analyser;
let dataArray;

let currentVisualizerKey = 'bars';
let isWebGL = false;
const visualizerKeys = ['bars', 'particles', 'vortex'];

// --- Particle Class (from original user code) ---
class Particle {
    constructor(x, y, audioData) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(1, 4) * audioData.energy * 3);
        this.lifespan = 255;
        this.size = 1 + (audioData.bass * 8);
    }

    update() {
        this.pos.add(this.vel);
        this.lifespan -= 2.5;
    }

    show() {
        noStroke();
        const hue = map(this.pos.x, 0, width, 180, 300);
        fill(hue, 90, 90, this.lifespan / 255);
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
    }

    isFinished() {
        return this.lifespan < 0;
    }
}
let particles = [];

// --- Efficient Gradient Function ---
function setGradient(c1, c2, alpha) {
    noFill();
    beginShape(TRIANGLE_STRIP);
    // Top-left
    fill(c1.levels[0], c1.levels[1], c1.levels[2], alpha);
    vertex(0, 0);
    // Top-right
    vertex(width, 0);
    // Bottom-left
    fill(c2.levels[0], c2.levels[1], c2.levels[2], alpha);
    vertex(0, height);
    // Bottom-right
    vertex(width, height);
    endShape();
}

// --- Visualization functions (Optimized) ---
const visualizations = {
    bars: (audioData) => {
        background(0);
        const barWidth = width / analyser.frequencyBinCount;
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            const barHeight = map(dataArray[i], 0, 255, 0, height);
            const hue = map(i, 0, analyser.frequencyBinCount, 200, 320);
            fill(hue, 90, 85);
            rect(i * barWidth, height - barHeight, barWidth, barHeight);
        }
    },
    particles: (audioData) => {
        background(0, 0, 0, 0.25); // Slightly faster than low-opacity black
        if (musicPlayer.isPlaying && particles.length < 400) { // Capped total particles
            const creationRate = Math.min(3, Math.floor(audioData.treble * 5)); // Capped creation rate
            for (let i = 0; i < creationRate; i++) {
                particles.push(new Particle(random(width), random(height), audioData));
            }
        }
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].show();
            if (particles[i].isFinished()) {
                particles.splice(i, 1);
            }
        }
    },
    vortex: (audioData) => {
        background(0);
        noFill();
        strokeWeight(1);

        translate(0, 0, -width/2);
        rotateY(frameCount * 0.003 * audioData.energy * 5);
        rotateX(frameCount * 0.002 * audioData.energy * 5);

        for (let i = 0; i < dataArray.length; i += 4) { // Increased step to draw fewer boxes
            const radius = map(dataArray[i], 0, 255, 100, width / 2.5);
            const angle = map(i, 0, dataArray.length, 0, TWO_PI * 4);
            const x = radius * cos(angle);
            const y = radius * sin(angle);
            const z = map(dataArray[i], 0, 255, -height / 3, height / 3);

            const hue = map(i, 0, dataArray.length, 180, 360);
            stroke(hue, 90, 90);

            push();
            translate(x, y, z);
            box(8 * (1 + audioData.bass));
            pop();
        }
    }
};

// --- p5.js Setup and Draw ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    let canvas = select('#visualizerCanvas');
    if (!canvas) {
        canvas = createCanvas(windowWidth, windowHeight);
        canvas.id('visualizerCanvas');
    }
    canvas.parent(document.body);
    select('#visualizerCanvas').style('position', 'fixed').style('top', '0').style('left', '0').style('z-index', '0');

    colorMode(HSB);
    noStroke();

    const vizSwitchBtn = document.getElementById('togglePlaylistBtn');
    if (vizSwitchBtn) {
        vizSwitchBtn.title = "Switch Visualization";
        vizSwitchBtn.onclick = () => {
            let currentIndex = visualizerKeys.indexOf(currentVisualizerKey);
            currentVisualizerKey = visualizerKeys[(currentIndex + 1) % visualizerKeys.length];

            if (currentVisualizerKey === 'vortex' && !isWebGL) {
                createCanvas(windowWidth, windowHeight, WEBGL);
                isWebGL = true;
            } else if (currentVisualizerKey !== 'vortex' && isWebGL) {
                createCanvas(windowWidth, windowHeight);
                isWebGL = false;
            }
        };
    }
}

function draw() {
    if (!musicPlayer && window.musicPlayer) {
        musicPlayer = window.musicPlayer;
    }
    if (!analyser && musicPlayer && musicPlayer.analyser) {
        analyser = musicPlayer.analyser;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    if (musicPlayer && !musicPlayer.audioElement.paused && analyser) {
        analyser.getByteFrequencyData(dataArray);

        const audioData = {
            bass: (dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5) / 255,
            mids: (dataArray.slice(5, 15).reduce((a, b) => a + b, 0) / 10) / 255,
            treble: (dataArray.slice(15, 30).reduce((a, b) => a + b, 0) / 15) / 255,
            energy: dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
        };

        if (musicPlayer.isIdle && !isWebGL) {
            const c1 = color(200, 90, 85);
            const c2 = color(320, 90, 85);
            const breath = map(audioData.bass, 0, 1, 0.05, 0.3); // More subtle breath
            setGradient(c1, c2, breath);
        }

        visualizations[currentVisualizerKey](audioData);
    } else {
        background(0);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
