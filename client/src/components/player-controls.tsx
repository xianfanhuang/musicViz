import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface PlayerControlsProps {
  audioFile: File;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export default function PlayerControls({
  audioFile,
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlayPause,
  onSeek,
  onVolumeChange,
}: PlayerControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    onSeek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    onVolumeChange(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      onVolumeChange(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 w-full max-w-md" data-testid="player-controls">

      {/* Track Info */}
      <div className="text-center mb-6" data-testid="track-info">
        <h3 className="text-lg font-semibold mb-1 text-white truncate" data-testid="track-title">
          {audioFile.name.replace(/\.[^/.]+$/, "")}
        </h3>
        <p className="text-sm text-gray-400" data-testid="track-artist">
          Local File
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6" data-testid="progress-section">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span data-testid="current-time">{formatTime(currentTime)}</span>
          <span data-testid="total-time">{formatTime(duration)}</span>
        </div>
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="w-full cursor-pointer"
          data-testid="progress-slider"
        />
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6" data-testid="main-controls">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white transition-colors duration-200"
          data-testid="button-previous"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          onClick={onTogglePlayPause}
          size="icon"
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 transition-transform duration-200 shadow-lg rounded-full"
          data-testid="button-play-pause"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-white" data-testid="icon-pause" />
          ) : (
            <Play className="w-6 h-6 text-white ml-1" data-testid="icon-play" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white transition-colors duration-200"
          data-testid="button-next"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3" data-testid="volume-control">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="text-gray-400 hover:text-white"
          data-testid="button-mute"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="flex-1 cursor-pointer"
          data-testid="volume-slider"
        />
      </div>
    </div>
  );
}
