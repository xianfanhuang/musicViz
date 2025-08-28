class ThreeVisualizer {
    constructor(canvas, audioContext) {
        this.canvas = canvas;
        this.audioContext = audioContext;
        this.analyser = null;
        this.clock = new THREE.Clock();

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = 100;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        // Beat detection variables
        this.beatCutOff = 0;
        this.beatTime = 0;
        this.beatHoldTime = 40; // frames
        this.beatDecayRate = 0.97;

        this.colorPalettes = {
            energetic: [new THREE.Color(0xff0000), new THREE.Color(0xffff00), new THREE.Color(0xffa500)],
            calm: [new THREE.Color(0x0000ff), new THREE.Color(0x00ffff), new THREE.Color(0x87ceeb)],
            mellow: [new THREE.Color(0x800080), new THREE.Color(0xffc0cb), new THREE.Color(0xee82ee)],
        };
        this.currentColor = new THREE.Color(0x8899ff);

        this.createParticles();

        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this), false);

        this.animate();
    }

    createParticles() {
        const particleCount = 5000;
        this.particles = new THREE.BufferGeometry();
        this.particlePositions = new Float32Array(particleCount * 3);
        this.originalPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            this.particlePositions[i3] = x;
            this.particlePositions[i3 + 1] = y;
            this.particlePositions[i3 + 2] = z;
            this.originalPositions[i3] = x;
            this.originalPositions[i3 + 1] = y;
            this.originalPositions[i3 + 2] = z;
        }

        this.particles.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x8899ff,
            size: 1.5,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.9
        });

        this.particleSystem = new THREE.Points(this.particles, material);
        this.scene.add(this.particleSystem);
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    connectAudio(audioElement) {
        if (this.analyser) return;
        const listener = new THREE.AudioListener();
        this.camera.add(listener);
        const audio = new THREE.Audio(listener);
        audio.setMediaElementSource(audioElement);
        this.analyser = new THREE.AudioAnalyser(audio, 2048);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (this.analyser) {
            const data = this.analyser.getFrequencyData();
            const timeData = this.analyser.getAverageFrequency(); // Using this for overall energy

            // Simple beat detection
            const energy = timeData;
            if (energy > this.beatCutOff && energy > 10) { // Min energy threshold
                this.beatCutOff = energy * 1.1;
                this.beatTime = 0;
            } else {
                if (this.beatTime <= this.beatHoldTime) {
                    this.beatTime++;
                } else {
                    this.beatCutOff *= this.beatDecayRate;
                    this.beatCutOff = Math.max(this.beatCutOff, 10);
                }
            }

            // Visual effects on beat
            if (this.beatTime < 10) {
                this.camera.position.z = 100 - this.beatTime * 2;
                this.particleSystem.material.color.setScalar(1 + (10 - this.beatTime) * 0.1);
            } else {
                 this.camera.position.z = 80;
            }


            // Particle animation based on frequency bands
            const positions = this.particleSystem.geometry.attributes.position.array;
            const bufferLength = this.analyser.analyser.frequencyBinCount;

            for (let i = 0; i < positions.length / 3; i++) {
                const i3 = i * 3;
                const i31 = i3 + 1;
                const i32 = i3 + 2;

                const originalX = this.originalPositions[i3];
                const originalY = this.originalPositions[i31];
                const originalZ = this.originalPositions[i32];

                const freqIndex = i % bufferLength;
                const freqValue = data[freqIndex];
                const displacement = (freqValue / 255) * 15;

                const direction = new THREE.Vector3(originalX, originalY, originalZ).normalize();
                positions[i3] = originalX + direction.x * displacement;
                positions[i31] = originalY + direction.y * displacement;
                positions[i32] = originalZ + direction.z * displacement;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Camera rotation
        const delta = this.clock.getDelta();
        this.camera.position.x = Math.sin(this.clock.elapsedTime * 0.2) * 50;
        this.camera.lookAt(this.scene.position);


        this.renderer.render(this.scene, this.camera);
    }

    start() {}
    stop() {}
    setMode(mode) {}
    getEmotionFromAudio(avgFrequency) {
        if (avgFrequency > 60) return 'energetic';
        if (avgFrequency < 30) return 'calm';
        return 'mellow';
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (this.analyser) {
            const data = this.analyser.getFrequencyData();
            const avgFrequency = this.analyser.getAverageFrequency();

            // Emotion-based color
            if (!this.manualTheme) {
                const emotion = this.getEmotionFromAudio(avgFrequency);
                const targetPalette = this.colorPalettes[emotion];
                const targetColor = targetPalette[Math.floor(this.clock.elapsedTime / 5) % targetPalette.length];
                this.currentColor.lerp(targetColor, 0.01);
                this.particleSystem.material.color.set(this.currentColor);
            }

            // Simple beat detection
            const energy = avgFrequency;
            if (energy > this.beatCutOff && energy > 10) { // Min energy threshold
                this.beatCutOff = energy * 1.1;
                this.beatTime = 0;
            } else {
                if (this.beatTime <= this.beatHoldTime) {
                    this.beatTime++;
                } else {
                    this.beatCutOff *= this.beatDecayRate;
                    this.beatCutOff = Math.max(this.beatCutOff, 10);
                }
            }

            // Visual effects on beat
            if (this.beatTime < 10) {
                this.camera.position.z = 100 - this.beatTime * 2;
                // Don't override color pulse if manual theme is set
                if (!this.manualTheme) {
                    this.particleSystem.material.color.setScalar(1 + (10 - this.beatTime) * 0.1);
                }
            } else {
                 this.camera.position.z = 80;
            }


            // Particle animation based on frequency bands
            const positions = this.particleSystem.geometry.attributes.position.array;
            const bufferLength = this.analyser.analyser.frequencyBinCount;

            for (let i = 0; i < positions.length / 3; i++) {
                const i3 = i * 3;
                const i31 = i3 + 1;
                const i32 = i3 + 2;

                const originalX = this.originalPositions[i3];
                const originalY = this.originalPositions[i31];
                const originalZ = this.originalPositions[i32];

                const freqIndex = i % bufferLength;
                const freqValue = data[freqIndex];
                const displacement = (freqValue / 255) * 15;

                const direction = new THREE.Vector3(originalX, originalY, originalZ).normalize();
                positions[i3] = originalX + direction.x * displacement;
                positions[i31] = originalY + direction.y * displacement;
                positions[i32] = originalZ + direction.z * displacement;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Camera rotation
        this.camera.position.x = Math.sin(this.clock.elapsedTime * 0.2) * 50;
        this.camera.lookAt(this.scene.position);


        this.renderer.render(this.scene, this.camera);
    }

    setColorTheme(theme) {
        if (this.particleSystem) {
            this.manualTheme = true; // Disable automatic color changes
            let color;
            switch(theme) {
                case 'fire': color = 0xff8866; break;
                case 'ocean': color = 0x66ccff; break;
                case 'forest': color = 0x77ff88; break;
                case 'aurora':
                default:
                    this.manualTheme = false; // Re-enable automatic colors for default
                    color = this.currentColor.getHex(); // Keep current color
            }
            this.particleSystem.material.color.setHex(color);
        }
    }
}

window.AudioVisualizer = ThreeVisualizer;
