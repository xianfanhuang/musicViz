// --- Global p5.js Sketch ---

let musicPlayer;
let analyser;
let dataArray;
let offscreenBuffer; // For drawing visualizations before compositing

let currentVisualizerKey = 'bars';
const visualizerKeys = ['bars', 'particles', 'vortex'];

// --- Visualization functions (will draw on the offscreen buffer) ---
const visualizations = {
    bars: (buffer, audioData) => {
        buffer.background(0, 0, 0, 0); // Clear buffer with transparency
        buffer.colorMode(HSB);
        buffer.noStroke();
        const barWidth = buffer.width / analyser.frequencyBinCount;
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
            const barHeight = map(dataArray[i], 0, 255, 0, buffer.height);
            const hue = map(i, 0, analyser.frequencyBinCount, 200, 320);
            buffer.fill(hue, 90, 85);
            buffer.rect(i * barWidth, buffer.height - barHeight, barWidth, barHeight);
        }
    },
    particles: (buffer, audioData) => {
        buffer.background(0, 0, 0, 0);
        // ... full particle logic would go here, drawing to the buffer
    },
    vortex: (buffer, audioData) => {
        buffer.background(0, 0, 0, 0);
        // ... full vortex logic would go here
    }
};

function setGradient(c1, c2, alpha) {
    noFill();
    for (let i = 0; i < height; i++) {
        let inter = map(i, 0, height, 0, 1);
        let c = lerpColor(c1, c2, inter);
        c.setAlpha(alpha);
        stroke(c);
        line(0, i, width, i);
    }
}

// --- p5.js Setup and Draw ---

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.id('visualizerCanvas');
    select('#visualizerCanvas').style('position', 'fixed').style('top', '0').style('left', '0').style('z-index', '0');

    offscreenBuffer = createGraphics(windowWidth, windowHeight);

    colorMode(HSB);
    noStroke();

    const vizSwitchBtn = document.getElementById('togglePlaylistBtn');
    if (vizSwitchBtn) {
        vizSwitchBtn.title = "Switch Visualization";
        vizSwitchBtn.onclick = () => {
            let currentIndex = visualizerKeys.indexOf(currentVisualizerKey);
            currentVisualizerKey = visualizerKeys[(currentIndex + 1) % visualizerKeys.length];
        };
    }
}

function draw() {
    // Lazy init
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
            energy: dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length / (255*255)
        };

        // Always draw the visualization to the off-screen buffer
        visualizations[currentVisualizerKey](offscreenBuffer, audioData);

        // Now, draw to the main canvas
        background(0); // Clear main canvas

        // If idle, draw the dynamic, breathing gradient overlay
        if (musicPlayer.isIdle) {
            const c1 = color(200, 90, 85); // Color from the start of the bars spectrum
            const c2 = color(320, 90, 85); // Color from the end
            const breath = map(audioData.bass, 0, 1, 0.1, 0.4); // Breathing alpha
            setGradient(c1, c2, breath);
        }

        // Draw the visualization from the buffer onto the main canvas
        image(offscreenBuffer, 0, 0);

    } else {
        background(0); // Black screen when not playing
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    offscreenBuffer.resize(windowWidth, windowHeight);
}
