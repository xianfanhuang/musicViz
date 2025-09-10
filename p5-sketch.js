// --- Global p5.js Sketch ---

let musicPlayer; // The global instance from script.js
let analyser;
let dataArray;

let currentVisualizerKey = 'bars';
const visualizerKeys = ['bars', 'particles', 'vortex'];

// --- Visualization functions provided by user ---
const visualizations = {
    bars: (audioData) => {
        analyser.getByteFrequencyData(dataArray);
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
        background(0, 0, 0, 0.1);
        // This is a simplified particle implementation for demonstration
        // A full Particle class and system would be needed for the original effect.
        if (musicPlayer.isPlaying && random(1) < audioData.treble * 0.8) {
            const x = random(width);
            const y = random(height);
            const size = map(audioData.energy, 0, 1, 2, 10);
            const hue = map(y, 0, height, 0, 360);
            fill(hue, 80, 90, 0.6);
            ellipse(x, y, size, size);
        }
    },
    vortex: (audioData) => {
        // This visualization requires WEBGL mode, which would need a canvas recreation.
        // This is a simplified 2D representation.
        background(0, 0, 0, 0.05);
        translate(width / 2, height / 2);
        for (let i = 0; i < dataArray.length; i++) {
            const angle = map(i, 0, dataArray.length, 0, TWO_PI * 2);
            const radius = map(dataArray[i], 0, 255, 20, width * 0.4);
            const x = radius * cos(angle + frameCount * 0.01);
            const y = radius * sin(angle + frameCount * 0.01);
            const hue = map(i, 0, dataArray.length, 180, 300);
            fill(hue, 90, 90, 0.5);
            ellipse(x, y, 5, 5);
        }
    }
};

// --- p5.js Setup and Draw ---

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.id('visualizerCanvas');
    select('#visualizerCanvas').style('position', 'fixed').style('top', '0').style('left', '0').style('z-index', '0');

    colorMode(HSB);
    noStroke();

    // Setup a button to switch visualizations
    const vizSwitchBtn = document.getElementById('togglePlaylistBtn');
    if (vizSwitchBtn) {
        vizSwitchBtn.title = "Switch Visualization"; // Change title for clarity
        vizSwitchBtn.onclick = () => {
            let currentIndex = visualizerKeys.indexOf(currentVisualizerKey);
            currentVisualizerKey = visualizerKeys[(currentIndex + 1) % visualizerKeys.length];
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

    if (musicPlayer && musicPlayer.isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);

        const audioData = {
            bass: (dataArray.slice(0, 5).reduce((a, b) => a + b, 0) / 5) / 255,
            mids: (dataArray.slice(5, 15).reduce((a, b) => a + b, 0) / 10) / 255,
            treble: (dataArray.slice(15, 30).reduce((a, b) => a + b, 0) / 15) / 255,
            energy: dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length / (255*255)
        };

        visualizations[currentVisualizerKey](audioData);
    } else {
        background(0);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
