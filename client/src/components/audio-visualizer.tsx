import { useEffect, useRef } from "react";
import { VisualizationMode } from "./music-visualizer";

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  mode: VisualizationMode;
  colorScheme: number;
}

export default function AudioVisualizer({
  audioContext,
  analyserNode,
  isPlaying,
  mode,
  colorScheme,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyserNode && isPlaying) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        switch (mode) {
          case 'waveform':
            drawWaveform(ctx, dataArray, canvas.width, canvas.height, colorScheme);
            break;
          case 'bars':
            drawFrequencyBars(ctx, dataArray, canvas.width, canvas.height, colorScheme);
            break;
          case 'particles':
            drawParticles(ctx, dataArray, canvas.width, canvas.height, colorScheme);
            break;
          case 'circular':
            drawCircular(ctx, dataArray, canvas.width, canvas.height, colorScheme);
            break;
        }
      } else {
        // Draw demo visualization when not playing
        drawDemo(ctx, canvas.width, canvas.height, colorScheme);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying, mode, colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full opacity-80"
      data-testid="visualization-canvas"
    />
  );
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  colorScheme: number
) {
  const sliceWidth = width / dataArray.length;
  let x = 0;

  ctx.lineWidth = 2;
  ctx.strokeStyle = getColor(colorScheme, 0);
  ctx.beginPath();

  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * height) / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();
}

function drawFrequencyBars(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  colorScheme: number
) {
  const barCount = Math.min(64, dataArray.length);
  const barWidth = width / barCount;

  for (let i = 0; i < barCount; i++) {
    const barHeight = (dataArray[i] / 255) * height;
    const hue = (i * 6 + Date.now() * 0.1) % 360;

    ctx.fillStyle = getColor(colorScheme, i / barCount);
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
  }
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  colorScheme: number
) {
  const particleCount = Math.min(100, dataArray.length);

  for (let i = 0; i < particleCount; i++) {
    const amplitude = dataArray[i] / 255;
    const x = (i / particleCount) * width;
    const y = height / 2 + Math.sin(Date.now() * 0.001 + i * 0.1) * amplitude * 200;
    const size = amplitude * 10 + 2;

    ctx.fillStyle = getColor(colorScheme, amplitude);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCircular(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  colorScheme: number
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) / 6;
  const barCount = Math.min(64, dataArray.length);

  for (let i = 0; i < barCount; i++) {
    const amplitude = dataArray[i] / 255;
    const angle = (i / barCount) * Math.PI * 2;
    const barHeight = amplitude * 100;

    const x1 = centerX + Math.cos(angle) * baseRadius;
    const y1 = centerY + Math.sin(angle) * baseRadius;
    const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
    const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);

    ctx.strokeStyle = getColor(colorScheme, amplitude);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawDemo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colorScheme: number
) {
  const barCount = 64;
  const barWidth = width / barCount;

  for (let i = 0; i < barCount; i++) {
    const barHeight = Math.sin(Date.now() * 0.001 + i * 0.2) * 100 + 150;
    ctx.fillStyle = getColor(colorScheme, i / barCount);
    ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
  }
}

function getColor(scheme: number, position: number): string {
  const colorSchemes = [
    // Blue to Purple to Pink
    () => `hsl(${240 + position * 60}, 70%, 60%)`,
    // Green to Blue to Purple
    () => `hsl(${120 + position * 120}, 70%, 60%)`,
    // Orange to Red to Pink
    () => `hsl(${30 + position * 60}, 80%, 60%)`,
    // Cyan to Teal to Green
    () => `hsl(${180 + position * 60}, 70%, 60%)`,
  ];

  return colorSchemes[scheme]();
}
