import { useEffect, useRef } from "react";

interface Props {
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  mode: "waveform" | "bars" | "particles" | "circular";
  colorScheme: number;
}

const colorMap = [
  ["#3b82f6", "#8b5cf6", "#ec4899"],
  ["#10b981", "#3b82f6", "#8b5cf6"],
  ["#f59e0b", "#ef4444", "#ec4899"],
  ["#06b6d4", "#14b8a6", "#10b981"],
];

export default function AudioVisualizer({ audioContext, analyserNode, isPlaying, mode, colorScheme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || !analyserNode || !isPlaying) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = (time: number) => {
      if (time - lastFrameTime.current < 16.67) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime.current = time;

      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      switch (mode) {
        case "bars":
          drawBars(ctx, dataArray, canvas.width, canvas.height, colorScheme);
          break;
        case "particles":
          drawParticles(ctx, dataArray, canvas.width, canvas.height, colorScheme);
          break;
        case "circular":
          drawCircular(ctx, dataArray, canvas.width, canvas.height, colorScheme);
          break;
        default:
          drawWaveform(ctx, dataArray, canvas.width, canvas.height, colorScheme);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    resize();
    draw(0);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [audioContext, analyserNode, isPlaying, mode, colorScheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/* ---------- 绘制函数 ---------- */
function drawBars(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, w: number, h: number, scheme: number) {
  const colors = colorMap[scheme];
  const barWidth = w / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * h;
    const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.5, colors[1]);
    gradient.addColorStop(1, colors[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
  }
}

function drawWaveform(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, w: number, h: number, scheme: number) {
  ctx.lineWidth = 2;
  const colors = colorMap[scheme];
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.strokeStyle = gradient;

  ctx.beginPath();
  const sliceWidth = w / dataArray.length;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * h) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();
}

function drawParticles(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, w: number, h: number, scheme: number) {
  const colors = colorMap[scheme];
  const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  const count = Math.floor(avg / 2);
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const radius = Math.random() * 3 + 1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function drawCircular(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, w: number, h: number, scheme: number) {
  const colors = colorMap[scheme];
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w, h) / 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = 0; i < dataArray.length; i++) {
    const angle = (i / dataArray.length) * Math.PI * 2;
    const barHeight = (dataArray[i] / 255) * radius;
    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
    const y2 = centerY + Math.sin(angle) * (radius + barHeight);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}