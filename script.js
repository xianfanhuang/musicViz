
class MusicPlayer {
    constructor() {
        this.audioElement = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.volume = 0.8;

        this.audioContext = null;
        this.visualizer = null;

        // New UI Elements
        this.albumArt = document.getElementById('albumArt');
        this.playlistContainer = document.querySelector('.playlist-container');
        this.uploadModal = document.querySelector('.upload-modal');

        this.initializeAudioContext();
        this.setupEventListeners();
        this.setupVisualizer();
        this.updateUI();
        // this.loadState(); // We will call this after the visualizer is ready
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // Resume context on user gesture
            document.body.addEventListener('click', () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }, { once: true });
        } catch (error) {
            console.warn('Could not create AudioContext:', error);
        }
    }

    setupEventListeners() {
        // Player Controls
        document.getElementById('playBtn').addEventListener('click', this.togglePlay.bind(this));
        document.getElementById('prevBtn').addEventListener('click', this.previousTrack.bind(this));
        document.getElementById('nextBtn').addEventListener('click', this.nextTrack.bind(this));
        document.getElementById('progressBar').addEventListener('click', this.seekTo.bind(this));

        // Secondary Controls
        document.getElementById('addMusicBtn').addEventListener('click', this.toggleUploadModal.bind(this));
        document.getElementById('togglePlaylistBtn').addEventListener('click', this.togglePlaylist.bind(this));
        document.getElementById('muteBtn').addEventListener('click', this.toggleMute.bind(this));
        document.getElementById('volumeSlider').addEventListener('input', this.setVolume.bind(this));

        // Playlist
        document.getElementById('closePlaylistBtn').addEventListener('click', this.togglePlaylist.bind(this));
        document.getElementById('playlist').addEventListener('click', this.handlePlaylistClick.bind(this));

        // Upload Modal
        document.getElementById('closeUploadBtn').addEventListener('click', this.toggleUploadModal.bind(this));
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', (e) => e.currentTarget.classList.remove('dragover'));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        document.getElementById('sniffBtn').addEventListener('click', this.sniffURL.bind(this));
        document.getElementById('urlInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sniffURL(); });

        // Audio Element Events
        this.audioElement.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
        this.audioElement.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.audioElement.addEventListener('ended', this.onTrackEnded.bind(this));
        this.audioElement.addEventListener('play', this.onPlay.bind(this));
        this.audioElement.addEventListener('pause', this.onPause.bind(this));
    }

    setupVisualizer() {
        const canvas = document.getElementById('visualizerCanvas');
        if (window.ThreeVisualizer) {
            this.visualizer = new window.ThreeVisualizer(canvas, this.audioContext);
            if (this.audioContext && this.audioElement) {
                this.visualizer.connectAudio(this.audioElement);
            }
        } else {
            console.error("ThreeVisualizer is not available.");
        }
    }

    togglePlaylist() {
        this.playlistContainer.classList.toggle('visible');
    }

    toggleUploadModal() {
        this.uploadModal.classList.toggle('visible');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        this.processFiles(Array.from(e.dataTransfer.files));
    }

    handleFileSelect(e) {
        this.processFiles(Array.from(e.target.files));
    }

    async processFiles(files) {
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        if (audioFiles.length === 0) {
            this.showNotification('Please select valid audio files.', 'error');
            return;
        }

        this.toggleUploadModal(); // Close modal after selection

        for (const file of audioFiles) {
            const track = {
                id: this.generateId(),
                url: URL.createObjectURL(file),
                metadata: {
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Unknown Artist',
                    cover: 'https://via.placeholder.com/200' // Placeholder
                }
            };
            this.playlist.push(track);
            this.addToPlaylistUI(track, this.playlist.length - 1);
        }

        if (this.playlist.length > 0 && !this.isPlaying) {
            this.loadTrack(0);
        }
        this.saveState();
        this.showNotification(`Added ${audioFiles.length} tracks.`, 'success');
    }

    async sniffURL() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        if (!url) return;

        this.showNotification('Sniffing URL...', 'info');
        // Placeholder for sniffing logic
        this.showNotification('URL sniffing not yet implemented in this version.', 'warning');
        urlInput.value = '';
        this.toggleUploadModal();
    }

    addToPlaylistUI(track, index) {
        const playlistEl = document.getElementById('playlist');
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.dataset.trackId = track.id;
        item.innerHTML = `
            <div class="track-details">
                <div class="track-name">${track.metadata.title}</div>
                <div class="track-artist">${track.metadata.artist}</div>
            </div>
            <button class="remove-track-btn" data-track-id="${track.id}">&times;</button>
        `;
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-track-btn')) return;
            const trackIndex = this.playlist.findIndex(t => t.id === track.id);
            this.loadTrack(trackIndex);
        });
        playlistEl.appendChild(item);
    }

    async loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];
        this.audioElement.src = track.url;
        this.updateTrackInfo(track.metadata);
        this.updatePlaylistUI();
        this.saveState();
        if (this.isPlaying) {
            this.audioElement.play();
        }
    }

    updateTrackInfo(metadata) {
        document.getElementById('trackTitle').textContent = metadata.title || 'Unknown Title';
        document.getElementById('trackArtist').textContent = metadata.artist || 'Unknown Artist';
        this.albumArt.src = metadata.cover || 'https://via.placeholder.com/200';
    }

    updatePlaylistUI() {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach(item => {
            if (item.dataset.trackId === this.playlist[this.currentTrackIndex].id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    rerenderPlaylistUI() {
        const playlistContainer = document.getElementById('playlist');
        playlistContainer.innerHTML = '';
        this.playlist.forEach((track, index) => this.addToPlaylistUI(track, index));
        this.updatePlaylistUI();
    }

    handlePlaylistClick(e) {
        if (e.target.classList.contains('remove-track-btn')) {
            e.stopPropagation();
            const trackId = e.target.dataset.trackId;
            this.removeTrack(trackId);
        }
    }

    removeTrack(trackId) {
        const index = this.playlist.findIndex(t => t.id === trackId);
        if (index > -1) {
            this.playlist.splice(index, 1);
            this.rerenderPlaylistUI();
            if (index === this.currentTrackIndex) {
                if (this.playlist.length === 0) {
                    this.clearPlaylist();
                } else {
                    this.currentTrackIndex = Math.max(0, index - 1);
                    this.loadTrack(this.currentTrackIndex);
                }
            }
            this.saveState();
        }
    }

    clearPlaylist() {
        this.playlist = [];
        this.audioElement.src = '';
        this.isPlaying = false;
        this.updateUI();
        this.rerenderPlaylistUI();
        this.updateTrackInfo({ title: 'Select a song', artist: '' });
        this.saveState();
    }

    saveState() {
        const state = {
            playlist: this.playlist.filter(t => !t.url.startsWith('blob:')),
            currentTrackIndex: this.currentTrackIndex,
            volume: this.audioElement.volume
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    loadState() {
        const savedState = localStorage.getItem('musicPlayerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.playlist = state.playlist || [];
            this.audioElement.volume = state.volume || 0.8;
            document.getElementById('volumeSlider').value = (state.volume || 0.8) * 100;

            if (this.playlist.length > 0) {
                this.currentTrackIndex = state.currentTrackIndex || 0;
                this.rerenderPlaylistUI();
                this.loadTrack(this.currentTrackIndex);
            }
        }
    }

    async togglePlay() {
        if (!this.audioElement.src && this.playlist.length > 0) {
            await this.loadTrack(0);
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (this.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioElement.play();
        }
    }

    previousTrack() {
        if (this.playlist.length === 0) return;
        const newIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(newIndex);
    }

    nextTrack() {
        if (this.playlist.length === 0) return;
        const newIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(newIndex);
    }

    seekTo(e) {
        if (!this.audioElement.duration) return;
        const progressBar = document.getElementById('progressBar');
        const rect = progressBar.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        this.audioElement.currentTime = percentage * this.audioElement.duration;
    }

    setVolume(e) {
        this.volume = e.target.value / 100;
        this.audioElement.volume = this.volume;
        this.updateVolumeIcon();
        this.saveState();
    }

    toggleMute() {
        if (this.audioElement.volume > 0) {
            this.lastVolume = this.audioElement.volume;
            this.audioElement.volume = 0;
        } else {
            this.audioElement.volume = this.lastVolume || this.volume;
        }
        document.getElementById('volumeSlider').value = this.audioElement.volume * 100;
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const muteBtnIcon = document.querySelector('#muteBtn i');
        const volume = this.audioElement.volume;
        if (volume === 0) {
            muteBtnIcon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            muteBtnIcon.className = 'fas fa-volume-down';
        } else {
            muteBtnIcon.className = 'fas fa-volume-up';
        }
    }

    onLoadedMetadata() { this.updateUI(); }
    onTimeUpdate() { this.updateProgress(); }
    onTrackEnded() { this.nextTrack(); }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
        this.albumArt.classList.add('playing');
        if (this.visualizer) this.visualizer.start();
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.albumArt.classList.remove('playing');
        if (this.visualizer) this.visualizer.stop();
    }

    updateUI() {
        this.updateProgress();
        this.updatePlayButton();
        this.updateVolumeIcon();
    }

    updateProgress() {
        if (!this.audioElement.duration) return;
        const percentage = (this.audioElement.currentTime / this.audioElement.duration) * 100;
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('currentTime').textContent = this.formatTime(this.audioElement.currentTime);
        document.getElementById('totalTime').textContent = this.formatTime(this.audioElement.duration);
    }

    updatePlayButton() {
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');
        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    generateId() { return '_' + Math.random().toString(36).substr(2, 9); }

    showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `position:fixed; top:20px; right:20px; z-index:9999;`;
            document.body.appendChild(container);
        }
        const notif = document.createElement('div');
        notif.textContent = message;
        notif.style.cssText = `
            background-color: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white; padding: 15px; margin-bottom: 10px; border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2); opacity: 0; transition: all 0.3s;
        `;
        container.appendChild(notif);
        setTimeout(() => { notif.style.opacity = '1'; }, 10);
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});