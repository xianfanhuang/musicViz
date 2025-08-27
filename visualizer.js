
/**
 * 沉浸式音频可视化器
 * 提供多种艺术化可视化效果，随音乐节奏律动呼吸
 */

class AudioVisualizer {
    constructor(canvas, audioContext) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioContext = audioContext;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.animationId = null;

        this.mode = 'cosmic';
        this.colorTheme = 'aurora';
        this.isPlaying = false;

        // 艺术化视觉元素
        this.particles = [];
        this.maxParticles = 200;
        this.waves = [];
        this.orbs = [];
        this.fractals = [];

        // 动画参数
        this.time = 0;
        this.breatheIntensity = 0;
        this.energyLevel = 0;
        this.bassEnergy = 0;
        this.trebleEnergy = 0;

        // 随机变化参数
        this.randomSeed = Math.random() * 1000;
        this.colorShift = 0;
        this.morphing = 0;

        this.setupCanvas();
        this.setupAnalyser();
        this.initializeElements();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * window.devicePixelRatio;
            this.canvas.height = rect.height * window.devicePixelRatio;
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

            this.width = rect.width;
            this.height = rect.height;
            this.centerX = this.width / 2;
            this.centerY = this.height / 2;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    setupAnalyser() {
        if (this.audioContext) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.8;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
        }
    }

    initializeElements() {
        // 初始化波浪
        for (let i = 0; i < 5; i++) {
            this.waves.push({
                amplitude: Math.random() * 100 + 50,
                frequency: Math.random() * 0.02 + 0.01,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.02 + 0.01,
                color: this.getRandomColor(),
                opacity: Math.random() * 0.5 + 0.3
            });
        }

        // 初始化光球
        for (let i = 0; i < 8; i++) {
            this.orbs.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 50 + 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: this.getRandomColor(),
                energy: 0,
                breathe: Math.random() * Math.PI * 2
            });
        }

        // 初始化分形元素
        for (let i = 0; i < 3; i++) {
            this.fractals.push({
                x: this.centerX + (Math.random() - 0.5) * 200,
                y: this.centerY + (Math.random() - 0.5) * 200,
                size: Math.random() * 100 + 50,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.05,
                complexity: Math.floor(Math.random() * 6) + 3,
                color: this.getRandomColor()
            });
        }
    }

    connectAudio(audioElement) {
        if (this.audioContext && audioElement) {
            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
    }

    setMode(mode) {
        this.mode = mode;
        this.randomSeed = Math.random() * 1000;
    }

    setColorTheme(theme) {
        this.colorTheme = theme;
        this.colorShift = 0;
    }

    start() {
        this.isPlaying = true;
        this.animate();
    }

    stop() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.fadeOut();
    }

    animate() {
        if (!this.isPlaying) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        this.time += 0.016;
        this.updateAudioAnalysis();
        this.updateDynamicElements();

        this.clearCanvas();

        switch (this.mode) {
            case 'cosmic':
                this.drawCosmicVisualization();
                break;
            case 'neural':
                this.drawNeuralNetwork();
                break;
            case 'liquid':
                this.drawLiquidMorphing();
                break;
            case 'quantum':
                this.drawQuantumField();
                break;
            case 'aurora':
                this.drawAuroraEffect();
                break;
            default:
                this.drawCosmicVisualization();
        }

        this.drawBreathingAura();
    }

    updateAudioAnalysis() {
        if (!this.analyser || !this.dataArray) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // 计算不同频段的能量
        const bassRange = Math.floor(this.bufferLength * 0.1);
        const midRange = Math.floor(this.bufferLength * 0.4);

        this.bassEnergy = this.getAverageEnergy(0, bassRange);
        const midEnergy = this.getAverageEnergy(bassRange, midRange);
        this.trebleEnergy = this.getAverageEnergy(midRange, this.bufferLength);

        this.energyLevel = (this.bassEnergy + midEnergy + this.trebleEnergy) / 3;
        this.breatheIntensity = Math.sin(this.time * 2) * 0.5 + 0.5 + (this.energyLevel / 255) * 2;
    }

    getAverageEnergy(start, end) {
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += this.dataArray[i];
        }
        return sum / (end - start);
    }

    updateDynamicElements() {
        // 更新光球
        this.orbs.forEach((orb, i) => {
            orb.x += orb.vx * (1 + this.energyLevel / 255);
            orb.y += orb.vy * (1 + this.energyLevel / 255);

            if (orb.x < 0 || orb.x > this.width) orb.vx *= -1;
            if (orb.y < 0 || orb.y > this.height) orb.vy *= -1;

            orb.energy = this.energyLevel / 255;
            orb.breathe += 0.05;
        });

        // 更新分形元素
        this.fractals.forEach(fractal => {
            fractal.rotation += fractal.rotationSpeed * (1 + this.energyLevel / 255);
            fractal.size = fractal.size * 0.99 + (50 + this.energyLevel / 255 * 100) * 0.01;
        });

        // 更新颜色变化
        this.colorShift += 0.01 + this.energyLevel / 255 * 0.02;
        this.morphing = Math.sin(this.time * 0.5) * 0.5 + 0.5;
    }

    drawCosmicVisualization() {
        this.ctx.save();

        // 绘制星云背景
        this.drawNebula();

        // 绘制音频响应的粒子系统
        this.updateParticles();
        this.drawParticles();

        // 绘制能量环
        this.drawEnergyRings();

        // 绘制光球
        this.drawOrbs();

        this.ctx.restore();
    }

    drawNebula() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, Math.max(this.width, this.height)
        );

        const colors = this.getThemeColors();
        gradient.addColorStop(0, `rgba(${colors.primary}, ${0.1 + this.breatheIntensity * 0.1})`);
        gradient.addColorStop(0.5, `rgba(${colors.secondary}, ${0.05 + this.breatheIntensity * 0.05})`);
        gradient.addColorStop(1, `rgba(${colors.tertiary}, 0.02)`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    updateParticles() {
        // 添加新粒子
        if (this.particles.length < this.maxParticles && this.energyLevel > 50) {
            const count = Math.floor(this.energyLevel / 50);
            for (let i = 0; i < count; i++) {
                this.particles.push(new CosmicParticle(
                    this.centerX + (Math.random() - 0.5) * 100,
                    this.centerY + (Math.random() - 0.5) * 100,
                    this.getRandomColor(),
                    this.energyLevel
                ));
            }
        }

        // 更新现有粒子
        this.particles = this.particles.filter(particle => {
            particle.update(this.energyLevel, this.time);
            return particle.life > 0;
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            particle.draw(this.ctx, this.breatheIntensity);
        });
    }

    drawEnergyRings() {
        const rings = 5;
        for (let i = 0; i < rings; i++) {
            const radius = 50 + i * 40 + this.energyLevel * 2;
            const opacity = (1 - i / rings) * 0.3 * this.breatheIntensity;

            this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawOrbs() {
        this.orbs.forEach(orb => {
            const size = orb.radius * (1 + Math.sin(orb.breathe) * 0.3 * orb.energy);
            const gradient = this.ctx.createRadialGradient(
                orb.x, orb.y, 0,
                orb.x, orb.y, size
            );

            gradient.addColorStop(0, `rgba(${orb.color}, 0.8)`);
            gradient.addColorStop(0.7, `rgba(${orb.color}, 0.3)`);
            gradient.addColorStop(1, `rgba(${orb.color}, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawNeuralNetwork() {
        this.ctx.save();

        // 绘制神经网络节点和连接
        const nodes = 20;
        const networkNodes = [];

        for (let i = 0; i < nodes; i++) {
            networkNodes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                energy: this.dataArray[i * Math.floor(this.bufferLength / nodes)] / 255
            });
        }

        // 绘制连接
        this.ctx.strokeStyle = `rgba(102, 126, 234, 0.3)`;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < networkNodes.length; i++) {
            for (let j = i + 1; j < networkNodes.length; j++) {
                const distance = Math.hypot(
                    networkNodes[i].x - networkNodes[j].x,
                    networkNodes[i].y - networkNodes[j].y
                );

                if (distance < 150) {
                    const opacity = (1 - distance / 150) * 0.5;
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(networkNodes[i].x, networkNodes[i].y);
                    this.ctx.lineTo(networkNodes[j].x, networkNodes[j].y);
                    this.ctx.stroke();
                }
            }
        }

        // 绘制节点
        networkNodes.forEach(node => {
            const size = 5 + node.energy * 15;
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, size
            );

            gradient.addColorStop(0, `rgba(240, 147, 251, ${0.8 + node.energy * 0.2})`);
            gradient.addColorStop(1, `rgba(240, 147, 251, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    drawLiquidMorphing() {
        this.ctx.save();

        // 创建液体效果
        this.waves.forEach((wave, i) => {
            const points = [];
            const segments = 50;

            for (let j = 0; j <= segments; j++) {
                const x = (j / segments) * this.width;
                const baseY = this.centerY + Math.sin(x * wave.frequency + this.time * wave.speed + wave.phase) * wave.amplitude;
                const audioY = baseY + (this.dataArray[j % this.bufferLength] / 255) * 100;
                points.push({ x, y: audioY });
            }

            // 绘制波浪
            this.ctx.strokeStyle = `rgba(${wave.color}, ${wave.opacity * this.breatheIntensity})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);

            for (let j = 1; j < points.length; j++) {
                const cp1x = points[j-1].x + (points[j].x - points[j-1].x) / 3;
                const cp1y = points[j-1].y;
                const cp2x = points[j].x - (points[j].x - points[j-1].x) / 3;
                const cp2y = points[j].y;

                this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[j].x, points[j].y);
            }

            this.ctx.stroke();
        });

        this.ctx.restore();
    }

    drawQuantumField() {
        this.ctx.save();

        // 绘制量子场效果
        const gridSize = 30;
        const cols = Math.ceil(this.width / gridSize);
        const rows = Math.ceil(this.height / gridSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * gridSize;
                const y = j * gridSize;
                const index = (i + j) % this.bufferLength;
                const energy = this.dataArray[index] / 255;

                if (energy > 0.3) {
                    const size = energy * 20;
                    const opacity = energy * 0.8;

                    this.ctx.fillStyle = `rgba(79, 172, 254, ${opacity})`;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, size, 0, Math.PI * 2);
                    this.ctx.fill();

                    // 添加连接线
                    if (i > 0 && j > 0) {
                        const prevEnergy = this.dataArray[((i-1) + (j-1)) % this.bufferLength] / 255;
                        if (prevEnergy > 0.3) {
                            this.ctx.strokeStyle = `rgba(79, 172, 254, ${opacity * 0.5})`;
                            this.ctx.lineWidth = 1;
                            this.ctx.beginPath();
                            this.ctx.moveTo(x, y);
                            this.ctx.lineTo((i-1) * gridSize, (j-1) * gridSize);
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }

        this.ctx.restore();
    }

    drawAuroraEffect() {
        this.ctx.save();

        // 创建极光效果
        const numLayers = 8;

        for (let layer = 0; layer < numLayers; layer++) {
            const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
            const colors = this.getThemeColors();
            const alpha = (1 - layer / numLayers) * 0.3 * this.breatheIntensity;

            gradient.addColorStop(0, `rgba(${colors.primary}, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(${colors.secondary}, ${alpha * 0.7})`);
            gradient.addColorStop(1, `rgba(${colors.tertiary}, ${alpha * 0.5})`);

            this.ctx.fillStyle = gradient;

            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);

            for (let x = 0; x <= this.width; x += 5) {
                const audioIndex = Math.floor((x / this.width) * this.bufferLength);
                const audioValue = this.dataArray[audioIndex] / 255;
                const baseWave = Math.sin((x / this.width) * Math.PI * 4 + this.time + layer) * 30;
                const audioWave = audioValue * 80;
                const y = this.centerY + baseWave + audioWave - layer * 10;

                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawBreathingAura() {
        const radius = Math.min(this.width, this.height) * 0.4 * this.breatheIntensity;
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, radius
        );

        const colors = this.getThemeColors();
        gradient.addColorStop(0, `rgba(${colors.primary}, 0)`);
        gradient.addColorStop(0.7, `rgba(${colors.secondary}, 0.1)`);
        gradient.addColorStop(1, `rgba(${colors.tertiary}, 0.3)`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    getThemeColors() {
        switch (this.colorTheme) {
            case 'aurora':
                return {
                    primary: '102, 126, 234',
                    secondary: '240, 147, 251',
                    tertiary: '79, 172, 254'
                };
            case 'fire':
                return {
                    primary: '255, 107, 107',
                    secondary: '255, 159, 67',
                    tertiary: '255, 206, 84'
                };
            case 'ocean':
                return {
                    primary: '45, 183, 245',
                    secondary: '84, 160, 255',
                    tertiary: '162, 155, 254'
                };
            case 'forest':
                return {
                    primary: '85, 239, 196',
                    secondary: '129, 236, 236',
                    tertiary: '116, 185, 255'
                };
            default:
                return {
                    primary: '102, 126, 234',
                    secondary: '240, 147, 251',
                    tertiary: '79, 172, 254'
                };
        }
    }

    getRandomColor() {
        const colors = this.getThemeColors();
        const colorArray = [colors.primary, colors.secondary, colors.tertiary];
        return colorArray[Math.floor(Math.random() * colorArray.length)];
    }

    clearCanvas() {
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    fadeOut() {
        const fade = () => {
            this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            if (this.isPlaying) return;

            setTimeout(fade, 50);
        };
        fade();
    }
}

// 宇宙粒子类
class CosmicParticle {
    constructor(x, y, color, energy) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1;
        this.maxLife = Math.random() * 100 + 50;
        this.size = Math.random() * 3 + 1;
        this.energy = energy;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(globalEnergy, time) {
        this.x += this.vx * (1 + globalEnergy / 255);
        this.y += this.vy * (1 + globalEnergy / 255);
        this.life -= 1;
        this.spin += this.spinSpeed;

        // 重力效果
        this.vy += 0.02;

        // 湍流效果
        this.vx += Math.sin(time + this.x * 0.01) * 0.1;
        this.vy += Math.cos(time + this.y * 0.01) * 0.1;

        this.size *= 0.995;
    }

    draw(ctx, breatheIntensity) {
        if (this.life <= 0) return;

        const alpha = (this.life / this.maxLife) * 0.8 * breatheIntensity;
        const size = this.size * (1 + Math.sin(this.spin) * 0.3);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, `rgba(${this.color}, 1)`);
        gradient.addColorStop(0.7, `rgba(${this.color}, 0.5)`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 导出可视化器类
window.AudioVisualizer = AudioVisualizer;
