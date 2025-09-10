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
        this.metaScraper = new MetaScraper();
        this.volumeIconPaths = {
            up: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
            down: "M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z",
            mute: "M7 9v6h4l5 5V4L11 9H7z"
        };

        this.initializeAudioContext();
        this.setupEventListeners();
        this.setupVisualizer();
        this.updateUI();
        this.loadState();
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            const source = this.audioContext.createMediaElementSource(this.audioElement);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

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

        window.addEventListener('beforeunload', this.destroy.bind(this));
    }
    
    destroy() {
        if (this.visualizer) {
            this.visualizer.destroy();
        }
    }

    setupVisualizer() {
        // This is now handled by p5-sketch.js
        console.log("Visualizer setup is delegated to p5-sketch.js");
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
        const audioFiles = files.filter(file =>
            file.type.startsWith('audio/') ||
            (window.audioDecoder && window.audioDecoder.detectFormat(file))
        );

        if (audioFiles.length === 0) {
            this.showNotification('Please select valid audio files.', 'error');
            return;
        }

        this.toggleUploadModal();

        for (const file of audioFiles) {
            try {
                const result = await window.audioDecoder.decodeAudio(file);

                const audioBuffer = await this.audioContext.decodeAudioData(await result.audioData.arrayBuffer());
                const finalMetadata = await this.metaScraper.fetchMetadata(
                    result.metadata.title,
                    result.metadata.artist,
                    audioBuffer.duration,
                    audioBuffer
                );

                const audioURL = URL.createObjectURL(result.audioData);

                const track = {
                    id: this.generateId(),
                    url: audioURL,
                    metadata: finalMetadata,
                    file: result.audioData,
                    originalFormat: result.originalFormat,
                    decodedFormat: result.decodedFormat
                };

                if (!track.metadata.coverURL) {
                    track.metadata.coverURL = 'https://via.placeholder.com/200/111/fff?text=Soundscape';
                }

                this.playlist.push(track);
                this.addToPlaylistUI(track, this.playlist.length - 1);

            } catch (error) {
                console.error('File processing failed:', error);
                this.showNotification(`Failed to process ${file.name}: ${error.message}`, 'error');
            }
        }

        if (this.playlist.length > 0 && !this.isPlaying) {
            this.loadTrack(0);
        }
        this.saveState();
        this.showNotification(`Added ${audioFiles.length} tracks.`, 'success');
    }

    // Dummy implementations for methods not fully provided by user
    generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
    saveState() { console.log("State saving placeholder"); }
    updateUI() { console.log("UI update placeholder"); }
    loadState() { console.log("State loading placeholder"); }
    showNotification(message, type) { console.log(`[${type}] ${message}`); }
    togglePlay() { if (this.audioElement.src) { this.isPlaying ? this.audioElement.pause() : this.audioElement.play(); } }
    previousTrack() { console.log("Previous track placeholder"); }
    nextTrack() { console.log("Next track placeholder"); }
    seekTo() { console.log("Seek placeholder"); }
    toggleMute() { console.log("Mute placeholder"); }
    setVolume() { console.log("Set volume placeholder"); }
    handlePlaylistClick() { console.log("Playlist click placeholder"); }
    onLoadedMetadata() { console.log("onLoadedMetadata placeholder"); }
    onTimeUpdate() { console.log("onTimeUpdate placeholder"); }
    onTrackEnded() { this.nextTrack(); }
    onPlay() { this.isPlaying = true; }
    onPause() { this.isPlaying = false; }
    updatePlaylistUI() { console.log("updatePlaylistUI placeholder"); }

    async sniffURL() {
        const urlInput = document.getElementById('urlInput');
        const url = urlInput.value.trim();
        if (!url) return;
        this.showNotification('Sniffing URL...', 'info');
        // This part would need the server to be working correctly.
        // For now, we'll keep it as a placeholder.
        this.showNotification('URL sniffing not yet fully implemented.', 'warning');
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
        console.log("Updating track info with metadata:", metadata); // Log for debugging

        document.getElementById('trackTitle').textContent = metadata.title || 'Unknown Title';
        document.getElementById('trackArtist').textContent = metadata.artist || 'Unknown Artist';

        const coverUrl = metadata.coverURL || 'https://via.placeholder.com/200/111/fff?text=Soundscape';
        this.albumArt.src = coverUrl;

        this.albumArt.onload = () => {
            console.log("Album art loaded successfully from:", coverUrl);
        };
        this.albumArt.onerror = () => {
            console.error("Failed to load album art from:", coverUrl);
            // Fallback to a placeholder image if the primary one fails
            if (this.albumArt.src !== 'https://via.placeholder.com/200/111/fff?text=Soundscape') {
                this.albumArt.src = 'https://via.placeholder.com/200/111/fff?text=Soundscape';
            }
        };
    }
}

// Initialize the music player and make it globally accessible
window.musicPlayer = null;
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
});
