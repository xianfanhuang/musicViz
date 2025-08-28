
// 在HTML中加载network-sniffer.js

/**
 * 音影·幻听 - 主控制器
 * 整合音频解析、播放控制和可视化功能
 */

class MusicPlayer {
    constructor() {
        this.audioElement = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffleOn = false;
        this.repeatMode = 0; // 0: 无循环, 1: 单曲循环, 2: 列表循环
        this.volume = 0.8;

        // 音频上下文和可视化器
        this.audioContext = null;
        this.visualizer = null;
        this.hideControlsTimeout = null;

        this.initializeAudioContext();
        this.setupEventListeners();
        this.setupVisualizer();
        this.updateUI();
        this.loadState();
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('无法创建音频上下文:', error);
        }
    }

    setupEventListeners() {
        // 文件上传
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // 播放控制
        document.getElementById('playBtn').addEventListener('click', this.togglePlay.bind(this));
        document.getElementById('prevBtn').addEventListener('click', this.previousTrack.bind(this));
        document.getElementById('nextBtn').addEventListener('click', this.nextTrack.bind(this));
        document.getElementById('shuffleBtn').addEventListener('click', this.toggleShuffle.bind(this));
        document.getElementById('repeatBtn').addEventListener('click', this.toggleRepeat.bind(this));

        // 进度条
        const progressBar = document.getElementById('progressBar');
        progressBar.addEventListener('click', this.seekTo.bind(this));

        // 音量控制
        const volumeSlider = document.getElementById('volumeSlider');
        const muteBtn = document.getElementById('muteBtn');
        volumeSlider.addEventListener('input', this.setVolume.bind(this));
        muteBtn.addEventListener('click', this.toggleMute.bind(this));

        // 可视化控制
        document.getElementById('colorTheme').addEventListener('change', this.changeColorTheme.bind(this));

        // URL探嗅
        document.getElementById('sniffBtn').addEventListener('click', this.sniffURL.bind(this));
        document.getElementById('urlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sniffURL();
            }
        });

        // 音频元素事件
        this.audioElement.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
        this.audioElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.audioElement.addEventListener('ended', this.onTrackEnded.bind(this));
        this.audioElement.addEventListener('play', this.onPlay.bind(this));
        this.audioElement.addEventListener('pause', this.onPause.bind(this));

        // 播放列表管理
        document.getElementById('clearPlaylistBtn').addEventListener('click', this.clearPlaylist.bind(this));
        document.getElementById('playlist').addEventListener('click', this.handlePlaylistClick.bind(this));

        // Immersive Mode
        document.getElementById('immersiveBtn').addEventListener('click', this.toggleImmersiveMode.bind(this));

        // Video Export
        document.getElementById('exportVideoBtn').addEventListener('click', this.exportVideo.bind(this));

        // New Layout Interactions
        const inputModal = document.getElementById('inputModal');
        document.getElementById('addMusicBtn').addEventListener('click', () => {
            inputModal.classList.add('visible');
        });
        document.getElementById('closeInputModalBtn').addEventListener('click', () => {
            inputModal.classList.remove('visible');
        });

        const playlistSection = document.querySelector('.playlist-section');
        document.getElementById('togglePlaylistBtn').addEventListener('click', () => {
            playlistSection.classList.toggle('visible');
        });

        // Touch-friendly UI toggle
        const playerSection = document.querySelector('.player-section');
        const appContainer = document.querySelector('.app-container');

        const showControls = () => {
            playerSection.classList.add('controls-visible');
            clearTimeout(this.hideControlsTimeout);
            this.hideControlsTimeout = setTimeout(() => {
                playerSection.classList.remove('controls-visible');
            }, 3000);
        };

        const toggleControls = () => {
            if (playerSection.classList.contains('controls-visible')) {
                playerSection.classList.remove('controls-visible');
                clearTimeout(this.hideControlsTimeout);
            } else {
                showControls();
            }
        };

        appContainer.addEventListener('click', (e) => {
            // Only toggle if clicking the background, not the controls themselves
            if (e.target === appContainer || e.target === this.visualizer.canvas) {
                toggleControls();
            }
        });

        // Keep controls visible while interacting with them
        playerSection.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent container click from firing
            showControls();
        });
        playerSection.addEventListener('mousemove', showControls); // For desktop
    }

    setupVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        this.visualizer = new AudioVisualizer(canvas, this.audioContext);

        if (this.audioContext && this.audioElement) {
            this.visualizer.connectAudio(this.audioElement);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    async processFiles(files) {
        const audioFiles = files.filter(file =>
            file.type.startsWith('audio/') ||
            window.audioDecoder.detectFormat(file)
        );

        if (audioFiles.length === 0) {
            alert('请选择有效的音频文件');
            return;
        }

        const uploadArea = document.getElementById('uploadArea');
        const originalContent = uploadArea.innerHTML;

        // 显示处理进度
        uploadArea.innerHTML = `
            <div class="upload-content">
                <div class="upload-icon">🔄</div>
                <p>正在处理音频文件...</p>
                <div class="progress-info" id="progressInfo">处理中: 0/${audioFiles.length}</div>
            </div>
        `;

        let processed = 0;
        const progressInfo = document.getElementById('progressInfo');

        for (const file of audioFiles) {
            try {
                console.log('开始处理文件:', file.name);
                progressInfo.textContent = `处理中: ${processed}/${audioFiles.length} - ${file.name}`;

                // 使用音频解码器处理文件
                const result = await window.audioDecoder.decodeAudio(file);
                const audioURL = URL.createObjectURL(result.audioData);

                const track = {
                    id: this.generateId(),
                    url: audioURL,
                    metadata: result.metadata,
                    file: result.audioData,
                    originalFormat: result.originalFormat,
                    decodedFormat: result.decodedFormat
                };

                this.playlist.push(track);
                this.addToPlaylistUI(track, this.playlist.length - 1);

                console.log(`文件处理完成: ${track.metadata.title} (${result.originalFormat} → ${result.decodedFormat})`);
                processed++;

            } catch (error) {
                console.error('文件处理失败:', error);
                this.showNotification(`处理文件 ${file.name} 失败: ${error.message}`, 'error');
                processed++;
            }

            progressInfo.textContent = `已处理: ${processed}/${audioFiles.length}`;
        }

        // 恢复上传区域
        setTimeout(() => {
            uploadArea.innerHTML = originalContent;
        }, 1000);

        if (this.playlist.length > 0 && !this.isPlaying) {
            this.loadTrack(0);
        }

        this.saveState();
        this.showNotification(`成功处理 ${this.playlist.length} 个音频文件`, 'success');
    }

    async sniffURL() {
        const urlInput = document.getElementById('urlInput');
        const sniffBtn = document.getElementById('sniffBtn');
        const url = urlInput.value.trim();

        if (!url) {
            this.showNotification('请输入URL', 'error');
            return;
        }

        // 禁用按钮和输入框
        sniffBtn.disabled = true;
        sniffBtn.textContent = '🔄 解析中...';
        urlInput.disabled = true;

        try {
            console.log('开始探嗅URL:', url);

            // 使用网络探嗅器解析音频
            const audioList = await window.networkSniffer.sniffAudio(url);

            console.log('探嗅成功，找到音频:', audioList.length);

            // 将探嗅到的音频添加到播放列表
            let addedCount = 0;
            for (const audioInfo of audioList) {
                try {
                    const track = {
                        id: this.generateId(),
                        url: audioInfo.url,
                        metadata: {
                            title: audioInfo.title,
                            artist: audioInfo.artist,
                            album: audioInfo.album,
                            duration: audioInfo.duration,
                            filename: `${audioInfo.title}.${audioInfo.format}`,
                            size: audioInfo.size || 0
                        },
                        originalFormat: audioInfo.source,
                        decodedFormat: audioInfo.format,
                        cover: audioInfo.cover
                    };

                    this.playlist.push(track);
                    this.addToPlaylistUI(track, this.playlist.length - 1);
                    addedCount++;

                    console.log(`已添加: ${track.metadata.title} - ${track.metadata.artist}`);
                } catch (error) {
                    console.warn('跳过无效音频:', error);
                }
            }

            if (addedCount > 0) {
                this.saveState();
                this.showNotification(`成功添加 ${addedCount} 首音频到播放列表`, 'success');

                // 如果当前没有播放音频，加载第一首
                if (!this.isPlaying && this.playlist.length > 0) {
                    await this.loadTrack(this.playlist.length - addedCount);
                }
            } else {
                this.showNotification('未找到有效的音频资源', 'warning');
            }

            // 清空输入框
            urlInput.value = '';

        } catch (error) {
            console.error('URL探嗅失败:', error);
            this.showNotification(`解析失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮和输入框
            sniffBtn.disabled = false;
            sniffBtn.textContent = '🔍 解析';
            urlInput.disabled = false;
        }
    }

    addToPlaylistUI(track, index) {
        const playlist = document.getElementById('playlist');
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.dataset.trackId = track.id;

        // 添加格式标识和来源信息
        const formatBadge = track.originalFormat !== track.decodedFormat ?
            `<span class="format-badge" title="原格式: ${track.originalFormat}">${track.originalFormat.toUpperCase()}</span>` : '';

        const sourceBadge = track.originalFormat ?
            `<span class="format-badge" title="来源: ${track.originalFormat}">${track.originalFormat.toUpperCase()}</span>` : '';

        item.innerHTML = `
            <div class="track-number">${index + 1}</div>
            <div class="track-details">
                <div class="track-name">
                    ${track.metadata.title}
                    ${formatBadge || sourceBadge}
                </div>
                <div class="track-meta">
                    <span class="track-artist">${track.metadata.artist}</span>
                    <span class="track-duration">${this.formatTime(track.metadata.duration)}</span>
                </div>
            </div>
            <button class="remove-track-btn" data-track-id="${track.id}">✕</button>
        `;

        item.addEventListener('click', () => {
            const index = this.playlist.findIndex(t => t.id === track.id);
            this.loadTrack(index);
        });

        playlist.appendChild(item);
    }

    async loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        // 恢复音频上下文
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        try {
            console.log('正在加载音频:', track.metadata.title, track.url);

            // 验证音频URL
            if (!track.url || track.url.includes('undefined')) {
                throw new Error('音频URL无效');
            }

            // 设置音频源
            this.audioElement.src = track.url;

            // 添加加载完成处理
            const loadHandler = () => {
                console.log('音频加载成功:', track.metadata.title);
                this.showNotification(`已加载: ${track.metadata.title}`, 'success');
            };

            // 添加错误处理
            const errorHandler = (error) => {
                console.error('音频加载失败:', error);
                this.showNotification(`无法播放 "${track.metadata.title}": 这是演示音频`, 'warning');
            };

            this.audioElement.addEventListener('loadeddata', loadHandler, { once: true });
            this.audioElement.addEventListener('error', errorHandler, { once: true });

            // 尝试预加载
            this.audioElement.load();

            this.updateTrackInfo(track.metadata);
            this.updatePlaylistUI();
            this.saveState();

        } catch (error) {
            console.error('加载音频失败:', error);
            this.showNotification(`加载失败: ${error.message}`, 'error');
        }
    }

    updateTrackInfo(metadata) {
        document.getElementById('trackTitle').textContent = metadata.title;
        document.getElementById('trackArtist').textContent = metadata.artist;
    }

    updatePlaylistUI() {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentTrackIndex);
        });
    }

    rerenderPlaylistUI() {
        const playlistContainer = document.getElementById('playlist');
        playlistContainer.innerHTML = '';
        this.playlist.forEach((track, index) => this.addToPlaylistUI(track, index));
        this.updatePlaylistUI();
    }

    removeTrack(trackId) {
        const indexToRemove = this.playlist.findIndex(t => t.id === trackId);
        if (indexToRemove === -1) return;

        // If removing the currently playing track
        if (indexToRemove === this.currentTrackIndex) {
            if (this.playlist.length === 1) {
                this.clearPlaylist();
                return;
            }
            // Play the next track without disrupting the removal logic
            this.currentTrackIndex = (this.currentTrackIndex) % (this.playlist.length - 1);
            this.loadTrack(this.currentTrackIndex);
        }

        // Remove from the playlist array
        this.playlist.splice(indexToRemove, 1);

        // Adjust the current track index if a preceding track was removed
        if (indexToRemove < this.currentTrackIndex) {
            this.currentTrackIndex--;
        }

        this.rerenderPlaylistUI();
        this.saveState();
    }

    clearPlaylist() {
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.audioElement.src = '';
        this.audioElement.pause();
        this.rerenderPlaylistUI();
        this.updateTrackInfo({ title: '选择音频文件开始播放', artist: '' });
        this.updateUI();
        this.saveState();
    }

    handlePlaylistClick(e) {
        if (e.target.classList.contains('remove-track-btn')) {
            e.stopPropagation(); // Prevent the track from playing when clicking remove
            const trackId = e.target.dataset.trackId;
            this.removeTrack(trackId);
        }
    }

    saveState() {
        // Filter out tracks from local files (blob URLs) as they can't be persisted
        const persistablePlaylist = this.playlist.filter(track => !track.url.startsWith('blob:'));

        if (persistablePlaylist.length === 0 && this.playlist.length > 0) {
            // Don't save state if it would wipe out a local-only playlist
            return;
        }

        const state = {
            playlist: persistablePlaylist,
            currentTrackIndex: this.currentTrackIndex,
            isShuffleOn: this.isShuffleOn,
            repeatMode: this.repeatMode,
            volume: this.audioElement.volume
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('musicPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.playlist = state.playlist || [];
            this.isShuffleOn = state.isShuffleOn || false;
            this.repeatMode = state.repeatMode || 0;
            this.audioElement.volume = state.volume || 0.8;
            document.getElementById('volumeSlider').value = (state.volume || 0.8) * 100;

            // Restore UI for settings
            this.updateVolumeIcon();
            if (this.isShuffleOn) {
                document.getElementById('shuffleBtn').style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            }
            const repeatBtn = document.getElementById('repeatBtn');
            const repeatModes = ['🔁', '🔂', '🔁'];
            const repeatColors = ['rgba(255, 255, 255, 0.2)', 'linear-gradient(135deg, #667eea, #764ba2)', 'linear-gradient(135deg, #ff6b6b, #ee5a24)'];
            repeatBtn.textContent = repeatModes[this.repeatMode];
            repeatBtn.style.background = repeatColors[this.repeatMode];


            if (this.playlist.length > 0) {
                this.currentTrackIndex = state.currentTrackIndex || 0;
                this.rerenderPlaylistUI();
                // Load the track metadata, but don't play automatically
                this.loadTrack(this.currentTrackIndex);
            }
        }
    }

    toggleImmersiveMode() {
        const body = document.body;
        const btn = document.getElementById('immersiveBtn');
        body.classList.toggle('immersive-mode');

        if (body.classList.contains('immersive-mode')) {
            btn.innerHTML = '✕'; // Change to close icon
            btn.title = '退出沉浸模式';
        } else {
            btn.innerHTML = '⤢'; // Change back to expand icon
            btn.title = '沉浸模式';
        }

        // Trigger canvas resize after the CSS transition
        setTimeout(() => {
            if (this.visualizer && typeof this.visualizer.resizeCanvas === 'function') {
                this.visualizer.resizeCanvas();
            }
        }, 500); // 500ms matches the CSS transition duration
    }

    exportVideo() {
        if (!this.visualizer || !this.visualizer.canvas) {
            this.showNotification('可视化工具未准备好', 'error');
            return;
        }

        const recordingIndicator = document.getElementById('recordingIndicator');
        const exportModal = document.getElementById('exportModal');
        const exportPreview = document.getElementById('exportPreview');
        const downloadExportBtn = document.getElementById('downloadExportBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');

        recordingIndicator.classList.add('visible');

        const canvas = this.visualizer.canvas;
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            recordingIndicator.classList.remove('visible');

            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);

            exportPreview.src = url;
            downloadExportBtn.href = url;
            downloadExportBtn.download = `musicviz-export-${Date.now()}.webm`;

            exportModal.classList.add('visible');
        };

        closeModalBtn.onclick = () => {
            exportModal.classList.remove('visible');
            exportPreview.src = '';
            URL.revokeObjectURL(exportPreview.src);
        };

        recorder.start();
        setTimeout(() => {
            recorder.stop();
        }, 8000);
    }

    async togglePlay() {
        if (!this.audioElement.src) {
            if (this.playlist.length > 0) {
                await this.loadTrack(0);
            } else {
                return;
            }
        }

        if (this.isPlaying) {
            this.audioElement.pause();
        } else {
            try {
                await this.audioElement.play();
            } catch (error) {
                console.error('播放失败:', error);
            }
        }
    }

    previousTrack() {
        if (this.playlist.length === 0) return;

        let newIndex;
        if (this.isShuffleOn) {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            newIndex = this.currentTrackIndex - 1;
            if (newIndex < 0) {
                newIndex = this.playlist.length - 1;
            }
        }

        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.audioElement.play();
        }
    }

    nextTrack() {
        if (this.playlist.length === 0) return;

        let newIndex;
        if (this.isShuffleOn) {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            newIndex = this.currentTrackIndex + 1;
            if (newIndex >= this.playlist.length) {
                newIndex = 0;
            }
        }

        this.loadTrack(newIndex);
        if (this.isPlaying) {
            this.audioElement.play();
        }
    }

    toggleShuffle() {
        this.isShuffleOn = !this.isShuffleOn;
        const btn = document.getElementById('shuffleBtn');
        btn.style.background = this.isShuffleOn ?
            'linear-gradient(135deg, #667eea, #764ba2)' :
            'rgba(255, 255, 255, 0.2)';
        this.saveState();
    }

    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        const btn = document.getElementById('repeatBtn');
        const modes = ['🔁', '🔂', '🔁'];
        const colors = [
            'rgba(255, 255, 255, 0.2)',
            'linear-gradient(135deg, #667eea, #764ba2)',
            'linear-gradient(135deg, #ff6b6b, #ee5a24)'
        ];

        btn.textContent = modes[this.repeatMode];
        btn.style.background = colors[this.repeatMode];
        this.saveState();
    }

    seekTo(e) {
        if (!this.audioElement.duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        const seekTime = percentage * this.audioElement.duration;

        this.audioElement.currentTime = seekTime;
    }

    setVolume(e) {
        this.volume = e.target.value / 100;
        this.audioElement.volume = this.volume;
        this.updateVolumeIcon();
        this.saveState();
    }

    toggleMute() {
        if (this.audioElement.volume > 0) {
            this.audioElement.volume = 0;
            document.getElementById('volumeSlider').value = 0;
        } else {
            this.audioElement.volume = this.volume;
            document.getElementById('volumeSlider').value = this.volume * 100;
        }
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const muteBtn = document.getElementById('muteBtn');
        const volume = this.audioElement.volume;

        if (volume === 0) {
            muteBtn.textContent = '🔇';
        } else if (volume < 0.5) {
            muteBtn.textContent = '🔉';
        } else {
            muteBtn.textContent = '🔊';
        }
    }

    changeColorTheme(e) {
        if (this.visualizer) {
            this.visualizer.setColorTheme(e.target.value);
        }
    }

    onLoadedMetadata() {
        this.updateUI();
    }

    onTimeUpdate() {
        this.updateProgress();
    }

    onTrackEnded() {
        if (this.repeatMode === 1) {
            // 单曲循环
            this.audioElement.currentTime = 0;
            this.audioElement.play();
        } else if (this.repeatMode === 2 || this.currentTrackIndex < this.playlist.length - 1) {
            // 列表循环或还有下一首
            this.nextTrack();
        } else {
            // 停止播放
            this.isPlaying = false;
            this.updatePlayButton();
            if (this.visualizer) {
                this.visualizer.stop();
            }
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
        if (this.visualizer) {
            this.visualizer.start();
        }
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
        if (this.visualizer) {
            this.visualizer.stop();
        }
    }

    updateUI() {
        this.updateProgress();
        this.updatePlayButton();
        this.updateVolumeIcon();
    }

    updateProgress() {
        if (!this.audioElement.duration) return;

        const percentage = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        document.getElementById('progressFill').style.width = percentage + '%';

        document.getElementById('currentTime').textContent =
            this.formatTime(this.audioElement.currentTime);
        document.getElementById('totalTime').textContent =
            this.formatTime(this.audioElement.duration);
    }

    updatePlayButton() {
        const playBtn = document.getElementById('playBtn');
        playBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds === 0) return '0:00';

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Helper function to generate a unique ID (can be improved)
    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Helper function to show notifications
    showNotification(message, type = 'info') {
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(notificationContainer);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#3742fa'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: auto;
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        notificationContainer.appendChild(notification);

        // 显示动画
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});