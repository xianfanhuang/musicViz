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

// 新增：全局可视化主题管理器
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
    createCanvas(windowWidth, windowHeight);
    colorMode(HSL, 360, 100, 100, 1);
    noLoop();

    // 初始设置当前可视化器
    currentVisualizer = visualizations[currentTheme];
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
    
    background(0, 0, 0, 1);

    if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        let sumOfSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
            sumOfSquares += dataArray[i] * dataArray[i];
        }
        let energy = Math.sqrt(sumOfSquares / bufferLength) / 255;
        
        let bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3 / 255;
        let mids = (dataArray[3] + dataArray[4] + dataArray[5] + dataArray[6]) / 4 / 255;
        let treble = (dataArray[7] + dataArray[8] + dataArray[9]) / 3 / 255;

        let bpm = map(bass, 0, 1, 60, 180);
        
        audioData.energy = energy;
        audioData.bpm = bpm;
        audioData.bass = bass;
        audioData.mids = mids;
        audioData.treble = treble;
        
        currentVisualEnergy = lerp(currentVisualEnergy, audioData.energy, 0.1);

        let currentPulse = map(audioData.bass * audioData.energy, 0, 1, 0.5, 1);
        pulseFactor = lerp(pulseFactor, currentPulse, 0.1);
        
    } else {
        currentVisualEnergy = lerp(currentVisualEnergy, 0, 0.05);
        pulseFactor = lerp(pulseFactor, 0.5, 0.05);
    }
    
    // 动态调用当前的可视化函数
    if (currentVisualizer) {
        currentVisualizer();
    }

    requestAnimationFrame(draw);
}

// ----------------------------------------
// 交互与音频控制
// ----------------------------------------
function toggleAudioPlayback() {
    if (!audioCtx) {
        const audio = new Audio('https://ia800300.us.archive.org/11/items/SilentNight_663/Silent_Night.mp3');
        initAudio(audio);
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
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    currentAudio = audioElement;
    currentAudio.crossOrigin = 'anonymous';
    currentAudio.loop = true;
    currentAudio.play();

    audioSource = audioCtx.createMediaElementSource(currentAudio);
    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
}

function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function updateBaseColor(hexColor) {
    baseColor = hexToHsl(hexColor);
}

playButton.addEventListener('click', () => {
    toggleAudioPlayback();
});

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

function loadAudio(audioSrc) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    const newAudio = new Audio(audioSrc);
    if (audioCtx) {
        audioCtx.close().then(() => {
            initAudio(newAudio);
        });
    } else {
        initAudio(newAudio);
    }
    toggleAudioPlayback();
}

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
