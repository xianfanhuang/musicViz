// 模块化重构：使用类封装播放器核心功能
class MusicPlayer {
  constructor() {
    // 初始化核心属性
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.isVisualizing = false;
    this.isPlaying = false;
    this.playlist = [];
    this.currentTrackIndex = -1;
    
    // DOM元素缓存
    this.elements = {
      audio: document.getElementById('audio-player'),
      playBtn: document.getElementById('play-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      nextBtn: document.getElementById('next-btn'),
      prevBtn: document.getElementById('prev-btn'),
      progressBar: document.getElementById('progress-bar'),
      volumeControl: document.getElementById('volume-control'),
      fileInput: document.getElementById('file-input'),
      urlInput: document.getElementById('url-input'),
      errorContainer: document.getElementById('error-container')
    };
    
    // 初始化
    this.init();
  }
  
  // 初始化播放器
  async init() {
    try {
      // 初始化音频上下文（延迟到用户交互时）
      this.setupEventListeners();
      this.initVisualizer();
      console.log('播放器初始化完成');
    } catch (error) {
      this.showError(`初始化失败: ${error.message}`);
      console.error('初始化错误:', error);
    }
  }
  
  // 初始化可视化器
  initVisualizer() {
    if (window.initThreeVisualizer) {
      window.initThreeVisualizer();
    } else {
      console.warn('Three.js可视化模块未加载');
    }
  }
  
  // 设置事件监听器（集中管理）
  setupEventListeners() {
    // 播放控制
    this.elements.playBtn.addEventListener('click', () => this.play());
    this.elements.pauseBtn.addEventListener('click', () => this.pause());
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    this.elements.prevBtn.addEventListener('click', () => this.prevTrack());
    
    // 进度和音量控制
    this.elements.progressBar.addEventListener('input', (e) => this.setProgress(e.target.value));
    this.elements.volumeControl.addEventListener('input', (e) => this.setVolume(e.target.value));
    
    // 音频事件
    this.elements.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.elements.audio.addEventListener('ended', () => this.nextTrack());
    this.elements.audio.addEventListener('error', (e) => this.handleAudioError(e));
    
    // 文件和URL输入
    this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    document.getElementById('load-url-btn').addEventListener('click', () => this.loadUrlAudio());
    
    // 用户交互时初始化音频上下文（解决浏览器自动暂停问题）
    document.addEventListener('click', () => this.ensureAudioContext(), { once: true });
  }
  
  // 确保音频上下文已初始化并处于活动状态
  async ensureAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('音频上下文创建成功');
      } catch (error) {
        this.showError('无法创建音频上下文，请使用现代浏览器');
        console.error('音频上下文错误:', error);
      }
    } else if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.log('音频上下文已恢复');
    }
  }
  
  // 连接音频源到分析器
  connectAudioSource() {
    if (!this.audioContext || !this.elements.audio) return false;
    
    // 清理之前的连接
    if (this.source) {
      this.source.disconnect();
    }
    
    // 创建新的音频源和分析器
    this.source = this.audioContext.createMediaElementSource(this.elements.audio);
    this.analyser = this.audioContext.createAnalyser();
    
    // 配置分析器
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    // 建立正确的连接链
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    return true;
  }
  
  // 播放功能
  async play() {
    try {
      await this.ensureAudioContext();
      
      if (!this.elements.audio.src && this.playlist.length > 0) {
        this.loadTrack(0);
      }
      
      if (this.connectAudioSource()) {
        await this.elements.audio.play();
        this.isPlaying = true;
        this.startVisualization();
      }
    } catch (error) {
      this.showError(`播放失败: ${error.message}`);
      console.error('播放错误:', error);
    }
  }
  
  // 暂停功能
  pause() {
    this.elements.audio.pause();
    this.isPlaying = false;
    this.stopVisualization();
  }
  
  // 启动可视化
  startVisualization() {
    if (!this.isVisualizing && this.analyser && window.updateVisualizer) {
      this.isVisualizing = true;
      this.renderVisualization();
    }
  }
  
  // 可视化渲染循环（使用requestAnimationFrame优化性能）
  renderVisualization() {
    if (!this.isVisualizing || !this.analyser) {
      this.isVisualizing = false;
      return;
    }
    
    // 获取音频数据
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // 传递数据给可视化器
    window.updateVisualizer(this.dataArray);
    
    // 继续循环
    requestAnimationFrame(() => this.renderVisualization());
  }
  
  // 停止可视化
  stopVisualization() {
    this.isVisualizing = false;
  }
  
  // 其他方法（播放列表管理、进度控制等）
  loadTrack(index) {
    if (index < 0 || index >= this.playlist.length) return false;
    
    this.currentTrackIndex = index;
    const track = this.playlist[index];
    this.elements.audio.src = track.url;
    this.elements.audio.title = track.title;
    document.title = `正在播放: ${track.title}`;
    return true;
  }
  
  nextTrack() {
    const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadTrack(nextIndex) && this.play();
  }
  
  prevTrack() {
    const prevIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(prevIndex) && this.play();
  }
  
  // 错误处理和UI反馈
  showError(message) {
    this.elements.errorContainer.textContent = message;
    this.elements.errorContainer.classList.remove('hidden');
    
    // 3秒后自动隐藏错误信息
    setTimeout(() => {
      this.elements.errorContainer.classList.add('hidden');
    }, 3000);
  }
  
  handleAudioError(event) {
    const errorMessages = {
      1: '获取资源时发生错误',
      2: '网络错误',
      3: '解码错误',
      4: '不支持的音频格式',
      5: '播放中断'
    };
    
    const message = errorMessages[event.target.error.code] || '未知音频错误';
    this.showError(`播放错误: ${message}`);
    this.stopVisualization();
  }
  
  // 其他辅助方法...
  updateProgress() {
    const percent = (this.elements.audio.currentTime / this.elements.audio.duration) * 100;
    this.elements.progressBar.value = percent || 0;
  }
  
  setProgress(percent) {
    const time = (percent / 100) * this.elements.audio.duration;
    this.elements.audio.currentTime = time;
  }
  
  setVolume(value) {
    this.elements.audio.volume = value / 100;
  }
  
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const url = URL.createObjectURL(file);
      this.playlist.push({
        title: file.name,
        url: url,
        type: 'local'
      });
      
      // 自动播放新添加的文件
      this.loadTrack(this.playlist.length - 1);
      this.play();
      
      // 重置输入
      this.elements.fileInput.value = '';
    } catch (error) {
      this.showError(`文件处理错误: ${error.message}`);
    }
  }
  
  async loadUrlAudio() {
    const url = this.elements.urlInput.value.trim();
    if (!url) {
      this.showError('请输入有效的音频URL');
      return;
    }
    
    try {
      // 检查URL有效性
      new URL(url);
      
      // 通过API代理获取音频（避免跨域）
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('无法获取音频资源');
      
      const data = await response.json();
      if (data.audioUrl) {
        this.playlist.push({
          title: new URL(url).hostname,
          url: data.audioUrl,
          type: 'remote'
        });
        
        this.loadTrack(this.playlist.length - 1);
        this.play();
        this.elements.urlInput.value = '';
      } else {
        throw new Error('无法解析音频URL');
      }
    } catch (error) {
      this.showError(`URL加载错误: ${error.message}`);
      console.error('URL处理错误:', error);
    }
  }
}

// 页面加载完成后初始化播放器
document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new MusicPlayer();
});
    