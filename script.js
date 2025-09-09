// script.js
// Main application logic, handles UI and orchestrates modules.

const audioManager = new AudioManager();

let currentVisualizer = null;
let currentTheme = 'particles';
let pulseFactor = 1;
let currentVisualEnergy = 0;

const visualizations = {
    'particles': null,
    'bars': null,
    'vortex': null
};

const colorThemes = [
    [0, 100, 100], 
    [60, 100, 100],
    [120, 100, 100],
    [240, 100, 100],
    [300, 100, 100]
];
let currentThemeIndex = 0;
let baseColor = colorThemes[currentThemeIndex];

const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('icon-play');
const pauseIcon = document.getElementById('icon-pause');
const fileInput = document.getElementById('file-input');
const uiControls = document.getElementById('ui-controls');
const themeButton = document.getElementById('theme-button');
const infoElement = document.getElementById('info');
const urlInput = document.getElementById('url-input');
const urlButton = document.getElementById('url-button');
const loadingOverlay = document.getElementById('loading-overlay');

let lastActiveTime = 0;
const IDLE_TIMEOUT = 15000;

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSL, 360, 100, 100, 1);
    noLoop();
    currentVisualizer = visualizations[currentTheme];

    setTimeout(() => {
        infoElement.style.opacity = 1;
    }, 100);
}

function draw() {
    if (!audioManager.isPlaying && millis() - lastActiveTime > IDLE_TIMEOUT) {
        uiControls.classList.add('hidden');
        infoElement.classList.remove('hidden');
    } else {
        uiControls.classList.remove('hidden');
        infoElement.classList.add('hidden');
    }
    
    background(0, 0, 0, 1);
    
    const audioData = audioManager.getAudioData();

    if (audioManager.isPlaying) {
        currentVisualEnergy = lerp(currentVisualEnergy, audioData.energy, 0.1);
        let currentPulse = map(audioData.bass * audioData.energy, 0, 1, 0.5, 1);
        pulseFactor = lerp(pulseFactor, currentPulse, 0.1);
    } else {
        currentVisualEnergy = lerp(currentVisualEnergy, 0, 0.05);
        pulseFactor = lerp(pulseFactor, 0.5, 0.05);
    }
    
    if (currentVisualizer) {
        currentVisualizer(audioData, audioManager.dataArray);
    }

    requestAnimationFrame(draw);
}

playButton.addEventListener('click', () => {
    audioManager.togglePlayback();
    if (audioManager.isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline-block';
    } else {
        playIcon.style.display = 'inline-block';
        pauseIcon.style.display = 'none';
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioManager.loadAudio(file);
    }
});

urlButton.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        audioManager.loadAudio(url);
    }
});

themeButton.addEventListener('click', () => {
    const themes = ['particles', 'bars', 'vortex'];
    let nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[nextIndex];
    currentVisualizer = visualizations[currentTheme];

    currentThemeIndex = (currentThemeIndex + 1) % colorThemes.length;
    baseColor = colorThemes[currentThemeIndex];
});

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

window.addEventListener('mousemove', () => {
    lastActiveTime = millis();
});
window.addEventListener('touchstart', () => {
    lastActiveTime = millis();
});

document.addEventListener('ui:loading', (e) => {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.querySelector('p').textContent = e.detail;
});

document.addEventListener('ui:loaded', () => {
    loadingOverlay.classList.add('hidden');
});
