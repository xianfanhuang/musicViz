/**
 * 音影·幻听 - 音频解码器
 * 自动探嗅解析多种音频格式，包括加密格式。
 * 核心功能：负责将各种文件格式（包括加密格式）解码为标准的 ArrayBuffer。
 */

class AudioDecoder {
    constructor() {
        this.supportedFormats = [
            'mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac',
            'qmc0', 'qmc3', 'qmcflac', 'qmcogg',
            'ncm', 'kcm', 'xm', 'tm0', 'tm2', 'tm3', 'tm6',
            'kgm', 'vpr', 'mflac', 'mgg'
        ];

        this.magicBytes = {
            'mp3': [0xFF, 0xFB, 0x90],
            'flac': [0x66, 0x4C, 0x61, 0x43],
            'wav': [0x52, 0x49, 0x46, 0x46],
            'ogg': [0x4F, 0x67, 0x67, 0x53],
            'm4a': [0x66, 0x74, 0x79, 0x70],
            'ncm': [0x43, 0x54, 0x45, 0x4E],
            'qmc0': [0x51, 0x4D, 0x43, 0x30],
            'qmc3': [0x51, 0x4D, 0x43, 0x33],
            'kgm': [0x6B, 0x67, 0x6D],
            'vpr': [0x05, 0x28, 0xBC, 0x96]
        };
    }

    async detectFormat(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const headerBuffer = await this.readFileHeader(file, 16);
        const detectedFormat = this.detectByMagicBytes(headerBuffer);

        if (detectedFormat) return detectedFormat;
        if (this.supportedFormats.includes(extension)) return extension;

        return await this.deepFormatAnalysis(file);
    }

    async readFileHeader(file, length = 16) {
        const slice = file.slice(0, length);
        const arrayBuffer = await slice.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }

    detectByMagicBytes(headerBytes) {
        for (const [format, magic] of Object.entries(this.magicBytes)) {
            if (this.compareBytes(headerBytes, magic)) {
                return format;
            }
        }
        return null;
    }

    compareBytes(source, pattern, offset = 0) {
        if (source.length < offset + pattern.length) return false;
        for (let i = 0; i < pattern.length; i++) {
            if (source[offset + i] !== pattern[i]) return false;
        }
        return true;
    }

    async deepFormatAnalysis(file) {
        try {
            const sampleBuffer = await this.readFileHeader(file, 1024);
            const entropy = this.calculateEntropy(sampleBuffer);

            if (entropy > 7.5) {
                return this.detectEncryptedFormat(sampleBuffer, file.name);
            }

            return this.detectStandardFormat(sampleBuffer);
        } catch (error) {
            console.warn('深度格式分析失败:', error);
            return null;
        }
    }

    calculateEntropy(buffer) {
        const frequency = new Array(256).fill(0);
        for (let i = 0; i < buffer.length; i++) {
            frequency[buffer[i]]++;
        }
        let entropy = 0;
        for (let i = 0; i < 256; i++) {
            if (frequency[i] > 0) {
                const p = frequency[i] / buffer.length;
                entropy -= p * Math.log2(p);
            }
        }
        return entropy;
    }

    detectEncryptedFormat(buffer, filename) {
        const ext = filename.split('.').pop().toLowerCase();
        if (['qmc0', 'qmc3', 'qmcflac', 'qmcogg'].includes(ext)) return ext;
        if (ext === 'ncm') return 'ncm';
        if (ext === 'kcm') return 'kcm';
        if (['tm0', 'tm2', 'tm3', 'tm6'].includes(ext)) return ext;
        if (ext === 'kgm') return 'kgm';
        if (ext === 'vpr') return 'vpr';
        return 'unknown_encrypted';
    }

    detectStandardFormat(buffer) {
        for (let i = 0; i < buffer.length - 1; i++) {
            if (buffer[i] === 0xFF && (buffer[i + 1] & 0xE0) === 0xE0) return 'mp3';
        }
        if (this.compareBytes(buffer, [0x66, 0x4C, 0x61, 0x43], 0)) return 'flac';
        return null;
    }

    async decodeAudio(file) {
        const format = await this.detectFormat(file);
        if (!format) {
            throw new Error('无法识别的音频格式');
        }

        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        let decryptedData;

        try {
            switch (format) {
                case 'qmc0':
                case 'qmc3':
                case 'qmcflac':
                case 'qmcogg':
                    decryptedData = this.decryptQMC(data, format);
                    break;
                case 'ncm':
                    decryptedData = this.decryptNCMData(data);
                    break;
                case 'kgm':
                    decryptedData = this.decryptKGM(data);
                    break;
                case 'vpr':
                    decryptedData = this.decryptVPR(data);
                    break;
                case 'xm':
                case 'tm0':
                case 'tm2':
                case 'tm3':
                case 'tm6':
                    decryptedData = this.decryptXM(data);
                    break;
                default:
                    decryptedData = data;
            }
        } catch (error) {
            throw new Error(`解密 ${format} 格式失败: ${error.message}`);
        }

        const audioBlob = new Blob([decryptedData]);
        return audioBlob;
    }

    decryptQMC(data, format) {
        const decrypted = new Uint8Array(data.length);
        let key;
        switch (format) {
            case 'qmc0': key = [0xA7]; break;
            case 'qmc3': key = this.generateQMCKey(); break;
            case 'qmcflac': key = [0x27, 0x38, 0x39, 0x74, 0x76, 0x74, 0x78, 0x21]; break;
            case 'qmcogg': key = [0x4F]; break;
            default: key = [0xA7];
        }

        for (let i = 0; i < data.length; i++) {
            decrypted[i] = data[i] ^ key[i % key.length];
        }
        return decrypted;
    }

    generateQMCKey() {
        const key = [];
        const seed = 0x6A65;
        let x = seed;
        for (let i = 0; i < 128; i++) {
            x = ((x * 0x105) + 0x6A65) & 0xFFFF;
            key.push((x >> 8) & 0xFF);
            key.push(x & 0xFF);
        }
        return new Uint8Array(key);
    }

    decryptNCMData(data) {
        const coreKey = new Uint8Array([0x68, 0x7A, 0x48, 0x52, 0x41, 0x6D, 0x73, 0x6F, 0x35, 0x6B, 0x49, 0x6E, 0x62, 0x61, 0x78, 0x57]);
        const decrypted = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            decrypted[i] = data[i] ^ coreKey[i % coreKey.length];
        }
        return decrypted;
    }

    decryptKGM(data) {
        const decrypted = new Uint8Array(data.length);
        const key = 0x9B;
        for (let i = 0; i < data.length; i++) {
            decrypted[i] = data[i] ^ key;
        }
        return decrypted;
    }

    decryptVPR(data) {
        const decrypted = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            decrypted[i] = data[i] ^ (i & 0xFF);
        }
        return decrypted;
    }

    decryptXM(data) {
        const decrypted = new Uint8Array(data.length);
        const key = 0xA7;
        for (let i = 0; i < data.length; i++) {
            decrypted[i] = data[i] ^ key;
        }
        return decrypted;
    }
}

window.audioDecoder = new AudioDecoder();
