// audio-manager.js
// Updated audio manager with unified loader and metadata scraping.

// Declare global variables for the new modules
let metaScraper = null;

class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.audioSource = null;
        this.analyser = null;
        this.currentAudio = null;
        this.bufferLength = 0;
        this.dataArray = null;

        this.isPlaying = false;
        
        this.audioData = { 
            energy: 0.5,
            bass: 0.5,
            mids: 0.5,
            treble: 0.5
        };

        if (typeof MetaScraper !== 'undefined') {
            metaScraper = new MetaScraper();
        } else {
            console.error('MetaScraper not found. Metadata features are disabled.');
        }
    }

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
    
    // Unified entry point for loading audio from file or URL
    async loadAudio(source) {
        let file;
        
        document.dispatchEvent(new CustomEvent('ui:loading', { detail: '加载音频...' }));
        
        if (typeof source === 'string') {
            const response = await fetch(source);
            const blob = await response.blob();
            file = new File([blob], source.split('/').pop() || 'audio', { type: blob.type });
        } else {
            file = source;
        }
        
        // 使用 audio-decoder 进行解码，获取解密后的音频文件和元数据
        const { audioData: decodedFile, metadata } = await window.audioDecoder.decodeAudio(file);

        document.dispatchEvent(new CustomEvent('ui:loading', { detail: '解析元数据...' }));

        const buffer = await decodedFile.arrayBuffer();
        
        this.initContext();
        
        // 使用 Web Audio API 解码音频缓冲区并立即播放
        const audioBuffer = await this.audioCtx.decodeAudioData(buffer);
        const sourceNode = this.audioCtx.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.loop = true;
        sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        sourceNode.start(0);
        this.isPlaying = true;
        
        const enhancedMetadata = await metaScraper.fetchMetadata(
            metadata.title,
            metadata.artist,
            audioBuffer.duration,
            audioBuffer
        );

        document.dispatchEvent(new CustomEvent('ui:update-metadata', { detail: enhancedMetadata }));
        document.dispatchEvent(new CustomEvent('ui:loaded'));
        
        return enhancedMetadata;
    }

    togglePlayback() {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'running') {
            this.audioCtx.suspend().then(() => this.isPlaying = false);
        } else {
            this.audioCtx.resume().then(() => this.isPlaying = true);
        }
    }

    getAudioData() {
        if (!this.analyser || !this.isPlaying) {
            return this.audioData;
        }

        this.analyser.getByteFrequencyData(this.dataArray);
        
        let sumOfSquares = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            sumOfSquares += this.dataArray[i] * this.dataArray[i];
        }
        let energy = Math.sqrt(sumOfSquares / this.bufferLength) / 255;
        
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
