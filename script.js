// 初始化核心组件
const audioManager = new AudioManager();

// P5.js 核心变量
let currentVisualizer = null;
let currentTheme = 'particles';
let pulseFactor = 1;
let currentVisualEnergy = 0;

// 全局可视化主题管理器 (保持不变)
const visualizations = {
    'particles': null,
    'bars': null,
    'vortex': null
};

// 预设色彩主题列表 (保持不变)
const colorThemes = [
    [0, 100, 100], 
    [60, 100, 100],
    [120, 100, 100],
    [240, 100, 100],
    [300, 100, 100]
];
let currentThemeIndex = 0;
let baseColor = colorThemes[currentThemeIndex];

// UI 元素
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

// UI 状态控制
let lastActiveTime = 0;
const IDLE_TIMEOUT = 15000;

// ----------------------------------------
// p5.js 核心函数
// ----------------------------------------
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
    // UI 隐藏逻辑
    if (!audioManager.isPlaying && millis() - lastActiveTime > IDLE_TIMEOUT) {
        uiControls.classList.add('hidden');
        infoElement.classList.remove('hidden');
    } else {
        uiControls.classList.remove('hidden');
        infoElement.classList.add('hidden');
    }
    
    background(0, 0, 0, 1);
    
    // 更新音频数据
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

// ----------------------------------------
// UI 交互
// ----------------------------------------
playButton.addEventListener('click', () => {
    audioManager.togglePlayback();
    playIcon.style.display = audioManager.isPlaying ? 'none' : 'inline-block';
    pauseIcon.style.display = audioManager.isPlaying ? 'inline-block' : 'none';
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadingOverlay.classList.remove('hidden');
        audioManager.loadFromFile(file);
    }
});

urlButton.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        loadingOverlay.classList.remove('hidden');
        audioManager.loadFromURL(url);
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
