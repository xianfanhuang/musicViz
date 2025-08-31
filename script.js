// 应用状态变量
let isPlaying = false;
let isIdle = true;
let lastActiveTime = 0;

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
let currentTheme = 'particles';
let baseColor = [360, 100, 100];

// --- UI 元素 ---
const playButton = document.getElementById('play-button');
const playIcon = document.getElementById('icon-play');
const pauseIcon = document.getElementById('icon-pause');
const progressBar = document.getElementById('progress-container');
const fileInput = document.getElementById('file-input');
const uiControls = document.getElementById('ui-controls');
const themeButton = document.getElementById('theme-button');
const colorPicker = document.getElementById('color-picker');

// 新增 UI 元素
const urlInput = document.getElementById('url-input');
const urlButton = document.getElementById('url-button');


// ----------------------------------------
// p5.js 核心函数
// ----------------------------------------
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSL, 360, 100, 100, 1);
  noLoop();
  updateBaseColor(colorPicker.value);
}

function draw() {
  if (!isPlaying && millis() - lastActiveTime > 5000) {
    isIdle = true;
    uiControls.classList.add('hidden');
  } else {
    uiControls.classList.remove('hidden');
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
    
    document.getElementById('info').classList.add('hidden');
    
  } else if (isIdle) {
    document.getElementById('info').classList.remove('hidden');
  } else {
    document.getElementById('info').classList.remove('hidden');
  }
  
  if (currentTheme === 'particles') {
      drawParticles();
  } else if (currentTheme === 'bars') {
      drawBars();
  }

  requestAnimationFrame(draw);
}

function drawParticles() {
  background(0, 0, 0, 0.1); 
  
  if (isPlaying && random(1) < audioData.treble * 1) {
    let newParticle = new Particle(width / 2, height / 2);
    particles.push(newParticle);
  }
  
  for (let particle of particles) {
    particle.update();
    particle.show();
  }
  
  particles = particles.filter(p => !p.isFinished());
}

function drawBars() {
  background(0, 0, 0, 1);
  
  let barWidth = width / bufferLength;
  for (let i = 0; i < bufferLength; i++) {
      let barHeight = map(dataArray[i], 0, 255, 0, height);
      let sat = map(i, 0, bufferLength, 50, 100);
      fill(baseColor[0], sat, baseColor[2]);
      rect(i * barWidth, height - barHeight, barWidth, barHeight);
  }
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 5) * audioData.treble * audioData.energy * 2);
    this.acc = createVector(0, 0);
    this.lifespan = 255 * (1 - audioData.mids);
    this.hue = baseColor[0];
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }
  
  show() {
    noStroke();
    fill(this.hue, baseColor[1], baseColor[2], map(this.lifespan, 0, 255, 0, 1));
    ellipse(this.pos.x, this.pos.y, 8, 8);
  }
  
  isFinished() {
    return this.lifespan < 0;
  }
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
    if (currentTheme === 'particles') {
        currentTheme = 'bars';
    } else {
        currentTheme = 'particles';
    }
});

colorPicker.addEventListener('change', (e) => {
  updateBaseColor(e.target.value);
});

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
