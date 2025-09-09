// script.js
// Main application logic, handles UI and orchestrates modules.

const audioManager = window.audioManager;

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

let touchStartX = 0;
let touchStartY = 0;

const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('icon-play');
const pauseIcon = document.getElementById('icon-pause');
const fileInput = document.getElementById('file-input');
const uiControls = document.getElementById('ui-controls');
const visualizerButton = document.getElementById('visualizer-button');
const colorButton = document.getElementById('color-button');
const infoElement = document.getElementById('info');
const urlInput = document.getElementById('url-input');
const urlButton = document.getElementById('url-button');
const loadingOverlay = document.getElementById('loading-overlay');
const dropZone = document.getElementById('drop-zone');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const progressBar = document.getElementById('progress-bar');

let lastActiveTime = 0;
const IDLE_TIMEOUT = 15000;

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

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

    // Update player UI if audio is loaded
    const duration = audioManager.getDuration();
    if (duration > 0) {
        const currentTime = audioManager.getCurrentTime();
        // Prevent UI update if the user is currently dragging the progress bar
        if (document.activeElement !== progressBar) {
            progressBar.value = (currentTime / duration) * 100;
        }
        totalTimeEl.textContent = formatTime(duration);
        currentTimeEl.textContent = formatTime(currentTime);
    }
    
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

visualizerButton.addEventListener('click', () => {
    const themes = Object.keys(visualizations);
    let nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[nextIndex];
    currentVisualizer = visualizations[currentTheme];
});

colorButton.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % colorThemes.length;
    baseColor = colorThemes[currentThemeIndex];
});

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

window.addEventListener('mousemove', () => {
    lastActiveTime = millis();
});
// Mobile Gestures
window.addEventListener('touchstart', (e) => {
    lastActiveTime = millis();
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const swipeThreshold = 50; // Minimum distance for a swipe
        const tapThreshold = 10;   // Max distance for a tap

        // Check for tap first
        if (Math.abs(deltaX) < tapThreshold && Math.abs(deltaY) < tapThreshold) {
            if (e.target.closest('.player-btn')) return;
            playButton.click();
            return;
        }

        if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
            if (Math.abs(deltaX) > swipeThreshold) {
                visualizerButton.click();
            }
        } else { // Vertical swipe
            if (Math.abs(deltaY) > swipeThreshold) {
                colorButton.click();
            }
        }
    }
});

// Drag and Drop
window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        dropZone.classList.remove('hidden');
    }
});

window.addEventListener('dragover', (e) => {
    e.preventDefault();
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.add('hidden');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.add('hidden');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('audio/')) {
            audioManager.loadAudio(file);
        } else {
            console.warn("Dropped file is not an audio file:", file.type);
            document.dispatchEvent(new CustomEvent('ui:loading', { detail: '错误: 请拖放音频文件' }));
            setTimeout(() => {
                document.dispatchEvent(new Event('ui:loaded'));
            }, 2500);
        }
    }
});

document.addEventListener('ui:loading', (e) => {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.querySelector('p').textContent = e.detail;
});

document.addEventListener('ui:loaded', () => {
    loadingOverlay.classList.add('hidden');
});

progressBar.addEventListener('input', () => {
    const duration = audioManager.getDuration();
    if (duration > 0) {
        const newTime = duration * (progressBar.value / 100);
        audioManager.seek(newTime);
        // Immediately update time display for better UX
        currentTimeEl.textContent = formatTime(newTime);
    }
});

document.addEventListener('ui:update-metadata', (e) => {
    const meta = e.detail;
    trackTitle.textContent = meta.title || '未知标题';
    trackArtist.textContent = meta.artist || '未知艺术家';
    totalTimeEl.textContent = formatTime(meta.duration || 0);
});

// Listen for events from AudioManager to update UI
document.addEventListener('audiomanager:play', () => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'inline-block';
});

document.addEventListener('audiomanager:pause', () => {
    playIcon.style.display = 'inline-block';
    pauseIcon.style.display = 'none';
});
