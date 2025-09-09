// meta-scraper.js
// 音乐元数据刮取模块
// Music metadata scraping module

function showUserMessage(message, type = 'info') {
    console.log(`[Sonoria] ${type.toUpperCase()}: ${message}`);
}

const generateFingerprint = (audioBuffer) => {
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const segmentLength = Math.min(channelData.length, Math.floor(sampleRate * 30));
    let hash = 0;
    for (let i = 0; i < segmentLength; i += 1024) {
        hash = (hash << 5) - hash + Math.floor(channelData[i] * 1000000);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
};

const ACOUSTID_API_KEY = 'SImy6k2M';
const ACOUSTID_ENDPOINT = `https://api.acoustid.com/v2/lookup?client=${ACOUSTID_API_KEY}&meta=recordings+sources+releases+releasegroups+compress&format=json`;
const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2/';
const COVER_ART_API = 'https://coverartarchive.org/';

const DB_NAME = 'SonoriaDB';
const DB_VERSION = 1;
const CACHE_STORE = 'metadata';

class MetaScraper {
    constructor() {
        this.db = null;
        this.initCache();
    }

    async initCache() {
        try {
            this.db = await idb.openDB(DB_NAME, DB_VERSION, {
                upgrade(db) {
                    db.createObjectStore(CACHE_STORE, { keyPath: 'fingerprint' });
                },
            });
        } catch (error) {
            showUserMessage('IndexedDB is not available. Metadata caching will be disabled.', 'error');
            this.db = null;
        }
    }

    async fetchMetadata(title, artist, duration, audioBuffer) {
        let fingerprint = '';

        try {
            fingerprint = generateFingerprint(audioBuffer);
        } catch (error) {
            console.error('Failed to generate fingerprint:', error);
        }

        if (this.db && fingerprint) {
            try {
                const cached = await this.db.get(CACHE_STORE, fingerprint);
                if (cached) {
                    showUserMessage('Metadata found in cache.', 'info');
                    return cached;
                }
            } catch (error) {
                console.error('Cache lookup failed:', error);
            }
        }
        
        if (!fingerprint) {
            showUserMessage('Fingerprint generation failed. Using title/artist for lookup.', 'info');
            fingerprint = `${title}:${artist}:${duration}`;
        }
        
        showUserMessage('Fetching metadata from external APIs...', 'info');
        try {
            const acoustidRes = await fetch(`${ACOUSTID_ENDPOINT}&query=${fingerprint}`);
            if (!acoustidRes.ok) throw new Error('AcoustID API failed');
            const acoustidData = await acoustidRes.json();

            if (acoustidData.results.length > 0) {
                const result = acoustidData.results[0];
                const recordingId = result.recordings[0].id;

                const mbzRes = await fetch(`${MUSICBRAINZ_API}recording/${recordingId}?inc=artists+releases+url-rels`);
                const mbzData = await mbzRes.json();
                
                let albumTitle = '';
                let albumCoverURL = null;
                if (mbzData.releases && mbzData.releases.length > 0) {
                    albumTitle = mbzData.releases[0].title;
                    const releaseId = mbzData.releases[0].id;
                    const coverRes = await fetch(`${COVER_ART_API}release/${releaseId}`);
                    if (coverRes.ok) {
                        const coverData = await coverRes.json();
                        if (coverData.images && coverData.images.length > 0) {
                            albumCoverURL = coverData.images[0].thumbnails.large;
                        }
                    }
                }

                const finalMetadata = {
                    fingerprint,
                    title: mbzData.title || title,
                    artist: mbzData['artist-credit']?.[0].name || artist,
                    album: albumTitle,
                    duration: Math.floor(mbzData.length / 1000) || duration,
                    coverURL: albumCoverURL,
                    lrcText: null,
                };

                if (this.db) {
                    await this.db.put(CACHE_STORE, finalMetadata);
                }
                return finalMetadata;
            }
        } catch (error) {
            showUserMessage(`Failed to fetch metadata: ${error.message}`, 'error');
        }

        const defaultMetadata = {
            fingerprint: fingerprint || 'not_found',
            title: title,
            artist: artist,
            album: '',
            duration: duration,
            coverURL: null,
            lrcText: null
        };
        if (this.db) {
            await this.db.put(CACHE_STORE, defaultMetadata);
        }
        return defaultMetadata;
    }
}
