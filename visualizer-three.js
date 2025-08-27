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
            positions[i] = (Math.random() - 0.5) * 200;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x8899ff, // Brighter default color
            size: 1.5,       // Increased size
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.9
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
        if (this.analyser) return;
        const listener = new THREE.AudioListener();
        this.camera.add(listener);
        const audio = new THREE.Audio(listener);
        audio.setMediaElementSource(audioElement);
        this.analyser = new THREE.AudioAnalyser(audio, 128);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (this.analyser) {
            const avgFrequency = this.analyser.getAverageFrequency();

            // Amplified "breathing" effect
            const scale = 1 + (avgFrequency / 128) * 1.5;
            this.particleSystem.scale.set(scale, scale, scale);
        }

        this.particleSystem.rotation.y += 0.001;

        this.renderer.render(this.scene, this.camera);
    }

    start() {}
    stop() {}
    setMode(mode) {}
    setColorTheme(theme) {
        if (this.particleSystem) {
            let color;
            switch(theme) {
                case 'fire': color = 0xff8866; break;
                case 'ocean': color = 0x66ccff; break;
                case 'forest': color = 0x77ff88; break;
                default: color = 0x8899ff; // aurora (brighter)
            }
            this.particleSystem.material.color.setHex(color);
        }
    }
}

window.AudioVisualizer = ThreeVisualizer;
