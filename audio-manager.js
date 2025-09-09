/**
 * audio-manager.js  (最终重构版)
 * 统一入口：loadAudio(file | url)
 * 本地/外链/加密音频全部秒播
 * 失败自动弹窗，永不转圈
 */

class AudioManager {
  constructor() {
    this.audioCtx   = null;
    this.analyser   = null;
    this.sourceNode = null;
    this.audioBuffer = null; // Store the decoded buffer for seeking
    this.isPlaying  = false;
    this.startTime = 0; // AudioContext's start time
    this.startOffset = 0; // To track pause/seek position
    this.meta       = {};
    this.audioData  = { energy: 0.5, bass: 0.5, mids: 0.5, treble: 0.5 };
    // 可选：元数据抓取器
    this.metaScraper = (typeof MetaScraper !== 'undefined') ? new MetaScraper() : null;
  }

  /* --------- 私有工具 --------- */
  _dispatchEvent(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }));
  }

  initContext() {
    if (this.audioCtx) this.audioCtx.close();
    this.audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser   = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray  = new Uint8Array(this.bufferLength);
  }

  /* --------- 统一入口 --------- */
  async loadAudio(source, { autoPlay = true } = {}) {
    document.dispatchEvent(new CustomEvent('ui:loading', { detail: '解码音频...' }));
    try {
      if (this.sourceNode) {
        this.sourceNode.onended = null; // Prevent loop from firing on manual stop
        this.sourceNode.stop();
      }

      const file = await this._sourceToFile(source);
      const { audioData: decodedFile, metadata: rawMeta } = await window.audioDecoder.decodeAudio(file);

      this.initContext();
      this.audioBuffer = await this.audioCtx.decodeAudioData(await decodedFile.arrayBuffer());

      const enhancedMeta = await this._enhanceMeta(this.audioBuffer, rawMeta, decodedFile.name);
      this.meta = enhancedMeta;
      document.dispatchEvent(new CustomEvent('ui:update-metadata', { detail: enhancedMeta }));

      this.startOffset = 0;
      this.isPlaying = false;
      if (autoPlay) {
        this.seek(0);
      }

      document.dispatchEvent(new Event('ui:loaded'));
      return enhancedMeta;

    } catch (err) {
      console.error('[AM] 加载失败', err);
      alert(`音频加载失败：${err.message}`);
      document.dispatchEvent(new CustomEvent('ui:error', { detail: err.message }));
      this.isPlaying = false;
      throw err;
    }
  }

  /* --------- 内部工具 --------- */
  async _sourceToFile(source) {
    if (source instanceof File) return source;
    const res = await fetch(source);
    if (!res.ok) throw new Error(`网络错误 ${res.status}`);
    const blob = await res.blob();
    return new File([blob], source.split('/').pop() || 'remote-audio', { type: blob.type });
  }

  async _enhanceMeta(audioBuffer, rawMeta, fileName) {
    rawMeta.duration = audioBuffer.duration;
    if (rawMeta.title && rawMeta.title !== '未知艺术家') return rawMeta;
    if (!this.metaScraper) {
        rawMeta.title = rawMeta.title || fileName;
        return rawMeta
    };
    const title = rawMeta.title || fileName;
    const artist = rawMeta.artist || '';
    const duration = rawMeta.duration || 0;
    const sample = await audioBuffer.getChannelData(0).slice(0, 30 * 44100 * 2);
    return await this.metaScraper.fetchMeta(title, artist, duration, sample);
  }

  /* --------- 播放控制 --------- */
  togglePlayback() {
    if (!this.audioCtx || !this.audioBuffer) return;

    // If context is suspended, resume it. This handles play.
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => {
        this.isPlaying = true;
        this._dispatchEvent('audiomanager:play');
      });
    }
    // If context is running, suspend it. This handles pause.
    else if (this.audioCtx.state === 'running') {
      this.audioCtx.suspend().then(() => {
        this.isPlaying = false;
        // Store exact time on pause
        this.startOffset = this.audioCtx.currentTime - this.startTime;
        this._dispatchEvent('audiomanager:pause');
      });
    }
    // Handles playing for the first time after loading
    else if (!this.isPlaying) {
        this.seek(this.startOffset);
    }
  }

  seek(timeInSeconds) {
    if (!this.audioBuffer) return;

    // If a source is already playing, stop it.
    if (this.sourceNode) {
        this.sourceNode.onended = null;
        this.sourceNode.stop();
    }

    // Create a new source node.
    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser).connect(this.audioCtx.destination);

    // Handle looping manually
    this.sourceNode.onended = () => {
        if (this.isPlaying && this.sourceNode) {
            this.seek(0); // Loop to the beginning
        }
    };

    const offset = Math.max(0, Math.min(timeInSeconds, this.audioBuffer.duration));
    this.sourceNode.start(0, offset);

    this.startTime = this.audioCtx.currentTime - offset;
    this.startOffset = offset;

    // If context was suspended (e.g. from a previous pause), resume it.
    if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
    }
    this.isPlaying = true;
    this._dispatchEvent('audiomanager:play');
  }

  getDuration() {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  getCurrentTime() {
    if (!this.audioBuffer) return 0;
    if (this.isPlaying) {
      return this.audioCtx.currentTime - this.startTime;
    }
    return this.startOffset;
  }

  getAudioData() {
    if (!this.analyser || !this.isPlaying) return this.audioData;
    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0; for (let i = 0; i < this.bufferLength; i++) sum += this.dataArray[i] * this.dataArray[i];
    const energy = Math.sqrt(sum / this.bufferLength) / 255;
    const bass   = (this.dataArray[0] + this.dataArray[1] + this.dataArray[2]) / 3 / 255;
    const mids   = (this.dataArray[3] + this.dataArray[4] + this.dataArray[5] + this.dataArray[6]) / 4 / 255;
    const treble = (this.dataArray[7] + this.dataArray[8] + this.dataArray[9]) / 3 / 255;
    this.audioData = { energy, bass, mids, treble };
    return this.audioData;
  }
}

/* -------------------- 全局挂载 -------------------- */
window.audioManager = new AudioManager();
