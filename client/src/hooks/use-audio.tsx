import { useState, useRef, useEffect, useCallback } from "react";

interface AudioHook {
  audioFile: File | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audioContext: AudioContext | null;
  analyserNode: AnalyserNode | null;
  setAudioFile: (file: File | null) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

export function useAudio(): AudioHook {
  const [audioFile, setAudioFileState] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserNodeRef.current = audioContextRef.current.createAnalyser();
      analyserNodeRef.current.fftSize = 256;
      gainNodeRef.current = audioContextRef.current.createGain();

      // Connect nodes: source -> gain -> analyser -> destination
      if (gainNodeRef.current && analyserNodeRef.current) {
        gainNodeRef.current.connect(analyserNodeRef.current);
        analyserNodeRef.current.connect(audioContextRef.current.destination);
      }
    }
  }, []);

  const setAudioFile = useCallback((file: File | null) => {
    // If file is null, clean up and reset
    if (file === null) {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current.src = "";
      }
      setAudioFileState(null);
      setCurrentTime(0);
      setIsPlaying(false);
      return;
    }

    // Check if this is a URL-based file
    const isURLFile = (file as any).audioURL;
    const url = isURLFile ? (file as any).audioURL : URL.createObjectURL(file);

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      if (!isURLFile && audioRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = "";
    }

    // Create new audio element
    const audio = new Audio(url);
    audioRef.current = audio;

    // Initialize audio context if needed
    initializeAudioContext();

    // Connect audio element to Web Audio API
    if (audioContextRef.current && !sourceNodeRef.current) {
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
      if (gainNodeRef.current) {
        sourceNodeRef.current.connect(gainNodeRef.current);
      }
    }

    // Set up event listeners
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    });

    // Set initial volume
    audio.volume = volume;
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }

    setAudioFileState(file);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [volume, initializeAudioContext]);

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    // Resume audio context if suspended
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Play error:', error);
      }
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current || !duration) return;

    const newTime = (time / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    audioFile,
    isPlaying,
    currentTime,
    duration,
    volume,
    audioContext: audioContextRef.current,
    analyserNode: analyserNodeRef.current,
    setAudioFile,
    togglePlayPause,
    seek,
    setVolume,
  };
}
