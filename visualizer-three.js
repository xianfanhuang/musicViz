class ThreeVisualizer {
    constructor(canvas, audioContext) {
        this.canvas = canvas;
        this.audioContext = audioContext;
        this.analyser = null;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.camera.position.z = 100;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

        this.createParticles();

        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this), false);

        this.animate();
    }

    createParticles() {
        const particleCount = 5000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 200; // Distribute particles in a cube
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x667eea,
            size: 0.5,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8
        });

        this.particleSystem = new THREE.Points(particles, material);
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
        if (this.analyser) return; // Connect only once
        const listener = new THREE.AudioListener();
        this.camera.add(listener); // Attach listener to camera
        const audio = new THREE.Audio(listener);
        audio.setMediaElementSource(audioElement);
        this.analyser = new THREE.AudioAnalyser(audio, 128); // fftSize = 128
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (this.analyser) {
            const avgFrequency = this.analyser.getAverageFrequency();

            // The "breathing" effect
            const scale = 1 + avgFrequency / 128;
            this.particleSystem.scale.set(scale, scale, scale);
        }

        // Gentle rotation
        this.particleSystem.rotation.y += 0.001;

        this.renderer.render(this.scene, this.camera);
    }

    // Dummy methods to match the old class interface
    start() {}
    stop() {}
    setMode(mode) {}
    setColorTheme(theme) {
        if (this.particleSystem) {
            let color;
            switch(theme) {
                case 'fire': color = 0xff6b6b; break;
                case 'ocean': color = 0x4facfe; break;
                case 'forest': color = 0x54d068; break;
                default: color = 0x667eea; // aurora
            }
            this.particleSystem.material.color.setHex(color);
        }
    }
}

window.AudioVisualizer = ThreeVisualizer; // Overwrite the global class
