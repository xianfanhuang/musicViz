// 应用状态变量
let isPlaying = false;
let isIdle = true;
let lastActiveTime = 0;
let pulseFactor = 1;
let currentVisualEnergy = 0;

// Web Audio API 相关变量
let audioCtx;
let audioSource;
let analyser;
let bufferLength;
let dataArray;
let currentAudio;

// 用于存储实时音频数据
let audioData = { 
  bpm: 120, 
  energy: 0.5,
  bass: 0.5,
  mids: 0.5,
  treble: 0.5
};

// 粒子系统相关变量
let particles = [];
const MAX_PARTICLES = 500;

// 全局可视化主题管理器
const visualizations = {
    'particles': null,
    'bars': null,
    'vortex': null
};
let currentTheme = 'particles';
let currentVisualizer = null;

// 预设色彩主题列表
const colorThemes = [
    [0, 100, 100], 
    [60, 100, 100],
    [120, 100, 100],
    [240, 100, 100],
    [300, 100, 100]
];
let currentThemeIndex = 0;
let baseColor = colorThemes[currentThemeIndex];

// --- UI 元素 ---
const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('icon-play');
const pauseIcon = document.getElementById('icon-pause');
const progressBar = document.getElementById('progress-container');
const fileInput = document.getElementById('file-input');
const uiControls = document.getElementById('ui-controls');
const themeButton = document.getElementById('theme-button');
const infoElement = document.getElementById('info');
const urlInput = document.getElementById('url-input');
const urlButton = document.getElementById('url-button');


// ----------------------------------------
// p5.js 核心函数
// ----------------------------------------
function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    colorMode(HSL, 360, 100, 100, 1);

    currentVisualizer = visualizations[currentTheme];
}

function updateAudioData() {
    if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        let sumOfSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
            sumOfSquares += dataArray[i] * dataArray[i];
        }
        audioData.energy = Math.sqrt(sumOfSquares / bufferLength) / 255;
        
        audioData.bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3 / 255;
        audioData.mids = (dataArray[3] + dataArray[4] + dataArray[5] + dataArray[6]) / 4 / 255;
        audioData.treble = (dataArray[7] + dataArray[8] + dataArray[9]) / 3 / 255;

        audioData.bpm = map(audioData.bass, 0, 1, 60, 180);
        
        currentVisualEnergy = lerp(currentVisualEnergy, audioData.energy, 0.1);
        let currentPulse = map(audioData.bass * audioData.energy, 0, 1, 0.5, 1);
        pulseFactor = lerp(pulseFactor, currentPulse, 0.1);
    } else {
        // Smoothly transition values to 0 when not playing
        audioData.energy = lerp(audioData.energy, 0, 0.05);
        audioData.bass = lerp(audioData.bass, 0, 0.05);
        audioData.mids = lerp(audioData.mids, 0, 0.05);
        audioData.treble = lerp(audioData.treble, 0, 0.05);
        currentVisualEnergy = lerp(currentVisualEnergy, 0, 0.05);
        pulseFactor = lerp(pulseFactor, 0.5, 0.05);
    }
}

function draw() {
    if (!isPlaying && millis() - lastActiveTime > 5000) {
        isIdle = true;
        uiControls.classList.add('hidden');
        infoElement.classList.remove('hidden');
    } else {
        uiControls.classList.remove('hidden');
        infoElement.classList.add('hidden');
    }

    updateAudioData();
    
    if (currentVisualizer) {
        currentVisualizer();
    }
}

// ----------------------------------------
// 交互与音频控制
// ----------------------------------------
function toggleAudioPlayback() {
    if (!audioCtx || !currentAudio) {
        return;
    }

    if (audioCtx.state === 'running') {
        audioCtx.suspend().then(() => {
            isPlaying = false;
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        });
    } else {
        audioCtx.resume().then(() => {
            isPlaying = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        });
    }
    lastActiveTime = millis();
}

function initAudio(audioElement) {
    if (audioCtx) {
        audioCtx.close();
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    currentAudio = audioElement;
    currentAudio.crossOrigin = 'anonymous';
    currentAudio.loop = true;

    audioSource = audioCtx.createMediaElementSource(currentAudio);
    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    currentAudio.play();
    isPlaying = true;
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
}

function loadAudio(audioSrc) {
  const newAudio = new Audio(audioSrc);
  newAudio.addEventListener('canplaythrough', () => {
    initAudio(newAudio);
  });
  newAudio.addEventListener('error', (e) => {
    console.error('音频加载失败:', e);
  });
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        loadAudio(fileURL);
    }
});

urlButton.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        loadAudio(url);
    }
});

playButton.addEventListener('click', () => {
    toggleAudioPlayback();
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
