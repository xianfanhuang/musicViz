/**
 * audio-manager.js  (重构版)
 * 统一音频加载、解密、元数据、播放、可视化一条链
 * 支持：本地文件 | 外链 | 加密格式 (ncm/qmc/kgm...)
 * 失败自动弹窗，永远秒播
 */

/* 依赖：audio-decoder.js 必须已加载 */
/* 依赖：MetaScraper 可选，未加载时仅播放无元数据 */

class AudioManager {
  constructor() {
    this.audioCtx        = null;
    this.analyser        = null;
    this.sourceNode      = null;
    this.isPlaying       = false;
    this.meta            = {};               // 统一元数据
    this.audioData       = { energy:0.5, bass:0.5, mids:0.5, treble:0.5 };

    // 可选：元数据抓取器
    this.metaScraper = (typeof MetaScraper !== 'undefined') ? new MetaScraper() : null;
  }

  /* --------- 私有工具 --------- */
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
    // ① 加载中 UI
    document.dispatchEvent(new CustomEvent('ui:loading', { detail: '加载音频...' }));

    try {
      // ② 统一 → File（外链先 fetch）
      const file = await this._sourceToFile(source);

      // ③ 专业解码（加密/标准一步完成）
      const { audioData: decodedFile, metadata: rawMeta } = await window.audioDecoder.decodeAudio(file);

      // ④ 元数据增强（无标签时网络抓取）
      document.dispatchEvent(new CustomEvent('ui:loading', { detail: '解析元数据...' }));
      const enhancedMeta = await this._enhanceMeta(decodedFile, rawMeta);

      // ⑤ Web Audio 解码 → 立即播放
      this.initContext();
      const buffer     = await this.audioCtx.decodeAudioData(await decodedFile.arrayBuffer());
      this.sourceNode  = this.audioCtx.createBufferSource();
      this.sourceNode.buffer = buffer;
      this.sourceNode.loop   = true;
      this.sourceNode.connect(this.analyser).connect(this.audioCtx.destination);
      if (autoPlay) {
        this.sourceNode.start(0);
        this.isPlaying = true;
      }

      // ⑥ 回传完整数据
      this.meta = enhancedMeta;
      document.dispatchEvent(new CustomEvent('ui:update-metadata', { detail: enhancedMeta }));
      document.dispatchEvent(new CustomEvent('ui:loaded'));
      return enhancedMeta;

    } catch (err) {
      // ⑦ 任何失败都弹窗
      console.error('[AM] 加载失败', err);
      alert(`音频加载失败：${err.message}`);
      document.dispatchEvent(new CustomEvent('ui:error', { detail: err.message }));
      this.isPlaying = false;
      throw err;        // 让调用方可继续 catch
    }
  }

  /* --------- 内部工具 --------- */
  async _sourceToFile(source) {
    if (source instanceof File) return source;
    // 外链 → fetch → blob
    const res = await fetch(source);
    if (!res.ok) throw new Error(`网络错误 ${res.status}`);
    const blob = await res.blob();
    return new File([blob], source.split('/').pop() || 'remote-audio', { type: blob.type });
  }

  async _enhanceMeta(decodedFile, rawMeta) {
    // 若已有完整元数据，直接返回
    if (rawMeta.title && rawMeta.title !== '未知艺术家') return rawMeta;

    // 无标签 → 网络刮擦（需 MetaScraper）
    if (!this.metaScraper) return rawMeta;

    const title   = rawMeta.title || decodedFile.name;
    const artist  = rawMeta.artist || '';
    const duration= rawMeta.duration || 0;
    // 取前 30 s 采样用于指纹兜底
    const sample  = await decodedFile.slice(0, 30 * 44100 * 2).arrayBuffer();

    return await this.metaScraper.fetchMeta(title, artist, duration, sample);
  }

  /* --------- 播放控制 --------- */
  togglePlayback() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => this.isPlaying = true);
    } else if (this.audioCtx.state === 'running') {
      this.audioCtx.suspend().then(() => this.isPlaying = false);
    }
  }

  getAudioData() {
    if (!this.analyser || !this.isPlaying) return this.audioData;
    this.analyser.getByteFrequencyData(this.dataArray);
    // 能量 + 三段频计算同旧版
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
