class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.audioSource = null;
        this.analyser = null;
        this.currentAudio = null;
        this.bufferLength = 0;
        this.dataArray = null;

        this.isPlaying = false;
        
        // 用于存储实时音频数据
        this.audioData = { 
            bpm: 120, 
            energy: 0.5,
            bass: 0.5,
            mids: 0.5,
            treble: 0.5
        };
    }

    // 初始化 Web Audio API 上下文和分析器
    initContext() {
        if (this.audioCtx) {
            this.audioCtx.close();
        }
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }
    
    // 从 URL 加载音频文件
    loadFromURL(audioSrc) {
        this.currentAudio = new Audio(audioSrc);
        this.currentAudio.crossOrigin = 'anonymous';
        this.currentAudio.loop = true;

        this.currentAudio.addEventListener('canplaythrough', () => {
            this.initContext();
            this.audioSource = this.audioCtx.createMediaElementSource(this.currentAudio);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
            
            this.currentAudio.play();
            this.isPlaying = true;
        }, { once: true }); // 使用 once: true 确保事件只执行一次

        this.currentAudio.addEventListener('error', (e) => {
            console.error('音频加载失败:', e);
            this.isPlaying = false;
        }, { once: true });
    }

    // 从本地文件加载音频（更可靠的方式）
    loadFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const audioDataBuffer = e.target.result;
            this.initContext();
            
            this.audioCtx.decodeAudioData(audioDataBuffer, (buffer) => {
                const audioSourceNode = this.audioCtx.createBufferSource();
                audioSourceNode.buffer = buffer;
                audioSourceNode.loop = true;

                audioSourceNode.connect(this.analyser);
                this.analyser.connect(this.audioCtx.destination);
                
                audioSourceNode.start();
                this.isPlaying = true;
                
            }, (e) => {
                console.error("音频解码失败:", e);
                this.isPlaying = false;
            });
        };
        reader.readAsArrayBuffer(file);
    }

    // 播放/暂停控制
    togglePlayback() {
        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'running') {
            this.audioCtx.suspend().then(() => this.isPlaying = false);
        } else if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().then(() => this.isPlaying = true);
        } else {
             // 对于本地文件，需要手动控制播放
             if (this.currentAudio) {
                 this.currentAudio.play().then(() => this.isPlaying = true);
             }
        }
    }

    // 获取实时音频数据，供 p5.js 使用
    getAudioData() {
        if (!this.analyser) {
            return this.audioData;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        
        // 计算能量
        let sumOfSquares = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            sumOfSquares += this.dataArray[i] * this.dataArray[i];
        }
        let energy = Math.sqrt(sumOfSquares / this.bufferLength) / 255;
        
        // 计算低、中、高频
        let bass = (this.dataArray[0] + this.dataArray[1] + this.dataArray[2]) / 3 / 255;
        let mids = (this.dataArray[3] + this.dataArray[4] + this.dataArray[5] + this.dataArray[6]) / 4 / 255;
        let treble = (this.dataArray[7] + this.dataArray[8] + this.dataArray[9]) / 3 / 255;

        this.audioData.energy = energy;
        this.audioData.bass = bass;
        this.audioData.mids = mids;
        this.audioData.treble = treble;

        return this.audioData;
    }
}
