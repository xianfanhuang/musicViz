// client/src/hooks/use-audio.ts
import { useState, useRef, useEffect } from "react";

export const useAudio = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioFile) return;

    const audio = new Audio();
    const url = (audioFile as any).audioURL || URL.createObjectURL(audioFile);
    audio.src = url;
    audioRef.current = audio;

    // 创建音频上下文（用户交互触发）
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;

    const source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(context.destination);

    sourceRef.current = source;
    setAudioContext(context);
    setAnalyserNode(analyser);

    // 自动播放限制处理
    const playHandler = async () => {
      if (context.state === "suspended") {
        await context.resume();
      }
      audio.play();
      setIsPlaying(true);
    };

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
      context.close();
    };
  }, [audioFile]);

  const togglePlayPause = () => {
    if (!audioRef.current || !audioContext) return;
    if (audioContext.state === "suspended") audioContext.resume();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const setVolumeLevel = (vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol;
    setVolume(vol);
  };

  return {
    audioFile,
    isPlaying,
    currentTime,
    duration,
    volume,
    audioContext,
    analyserNode,
    setAudioFile,
    togglePlayPause,
    seek,
    setVolume: setVolumeLevel,
  };
};