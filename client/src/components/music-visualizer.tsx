import { useState, useRef } from "react";
import AudioVisualizer from "./audio-visualizer";
import PlayerControls from "./player-controls";
import FileUploader from "./file-uploader";
import URLPlayer from "./url-player";
import { useAudio } from "@/hooks/use-audio";
import { Button } from "@/components/ui/button";
import { Expand, Palette, Settings, Upload, Globe, Music } from "lucide-react";
import { MobileWrapper } from "./mobile-wrapper";

export type VisualizationMode = 'waveform' | 'bars' | 'particles' | 'circular';

export default function MusicVisualizer() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('bars');
  const [colorScheme, setColorScheme] = useState(0);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const containerRef = useRef<HTMLDivElement>(null);

  const {
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
    setVolume,
  } = useAudio();

  const handleFileUpload = (file: File) => {
    setAudioFile(file);
  };

  const handleAudioLoad = (url: string, title?: string) => {
    const mockFile = new File([''], title || 'Remote Audio', { type: 'audio/mpeg' });
    (mockFile as any).audioURL = url;
    setAudioFile(mockFile);
  };

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.() || (elem as any).webkitRequestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const toggleColorScheme = () => {
    setColorScheme((prev) => (prev + 1) % 4);
  };

  const colorSchemes = [
    'from-blue-500 via-purple-500 to-pink-500',
    'from-green-400 via-blue-500 to-purple-600',
    'from-orange-400 via-red-500 to-pink-500',
    'from-cyan-400 via-teal-500 to-green-500'
  ];

  return (
    <MobileWrapper>
      <div
        ref={containerRef}
        className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
        data-testid="music-visualizer-container"
      >
        {/* Background Visualization Canvas */}
        <div className="fixed inset-0 z-0">
          <AudioVisualizer
            audioContext={audioContext}
            analyserNode={analyserNode}
            isPlaying={isPlaying}
            mode={visualizationMode}
            colorScheme={colorScheme}
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${colorSchemes[colorScheme]} opacity-20 animate-breathe pointer-events-none`} />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-float opacity-60" />
            <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-pink-400 rounded-full animate-float opacity-40" style={{animationDelay: '2s'}} />
            <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-blue-400 rounded-full animate-float opacity-80" style={{animationDelay: '4s'}} />
          </div>
        </div>

        {/* Main Interface */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          {/* Header */}
          <div className="text-center mb-8 animate-float" data-testid="app-header">
            <div className="flex flex-col items-center mb-4">
              <div className="relative mb-6" data-testid="app-logo">
                <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-2xl animate-breathe">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="55" fill="none" stroke="url(#logoGradient)" strokeWidth="3" opacity="0.3" />
                  <g transform="translate(60,60)">
                    {[...Array(8)].map((_, i) => (
                      <rect key={i} x={-2} y={-25 + (i * 2)} width="4" height={15 + Math.sin(i * 0.5) * 8} fill="url(#waveGradient)" opacity={0.7 + Math.sin(i * 0.8) * 0.3} transform={`rotate(${i * 45})`} className="animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                    ))}
                  </g>
                  <Music x="45" y="45" width="30" height="30" className="text-white opacity-90" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.4" className="animate-ping" />
                </svg>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">音律视界</span>
              </h1>
            </div>
            <p className="text-lg md:text-xl text-gray-300 font-light">Experience Music Through Vibrant Visualizations</p>
          </div>

          {!audioFile && (
            <div className="mb-6" data-testid="input-mode-selector">
              <div className="flex justify-center gap-2 mb-4">
                <Button variant={inputMode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setInputMode('file')} className="bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/50 text-white" data-testid="mode-file">
                  <Upload className="w-4 h-4 mr-2" /> 本地文件
                </Button>
                <Button variant={inputMode === 'url' ? 'default' : 'outline'} size="sm" onClick={() => setInputMode('url')} className="bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/50 text-white" data-testid="mode-url">
                  <Globe className="w-4 h-4 mr-2" /> 网址播放
                </Button>
              </div>
            </div>
          )}

          {!audioFile && (
            <div className="mb-8">
              {inputMode === 'file' ? <FileUploader onFileUpload={handleFileUpload} /> : <URLPlayer onAudioLoad={handleAudioLoad} />}
            </div>
          )}

          {audioFile && (
            <div className="mb-6 space-y-4">
              <PlayerControls audioFile={audioFile} isPlaying={isPlaying} currentTime={currentTime} duration={duration} volume={volume} onTogglePlayPause={togglePlayPause} onSeek={seek} onVolumeChange={setVolume} />
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setAudioFile(null)} className="bg-white/10 hover:bg-white/20 border-white/30 text-white" data-testid="button-back">
                  <Upload className="w-4 h-4 mr-2" /> 选择其他音频
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mb-6" data-testid="visualization-modes">
            <Button variant={visualizationMode === 'waveform' ? 'default' : 'outline'} size="sm" onClick={() => setVisualizationMode('waveform')} className="bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/50 text-white" data-testid="mode-waveform">Waveform</Button>
            <Button variant={visualizationMode === 'bars' ? 'default' : 'outline'} size="sm" onClick={() => setVisualizationMode('bars')} className="bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/50 text-white" data-testid="mode-bars">Frequency Bars</Button>
            <Button variant={visualizationMode === 'particles' ? 'default' : 'outline'} size="sm" onClick={() => setVisualizationMode('particles')} className="bg-emerald-500/20 hover:bg-emerald-500/40 border-emerald-500/50 text-white" data-testid="mode-particles">Particles</Button>
            <Button variant={visualizationMode === 'circular' ? 'default' : 'outline'} size="sm" onClick={() => setVisualizationMode('circular')} className="bg-pink-500/20 hover:bg-pink-500/40 border-pink-500/50 text-white" data-testid="mode-circular">Circular</Button>
          </div>

          <div className="flex flex-wrap justify-center gap-3" data-testid="settings-panel">
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="bg-white/10 hover:bg-white/20 border-white/30 text-white" data-testid="button-fullscreen">
              <Expand className="w-4 h-4 mr-2" /> Fullscreen
            </Button>
            <Button variant="outline" size="sm" onClick={toggleColorScheme} className="bg-white/10 hover:bg-white/20 border-white/30 text-white" data-testid="button-colors">
              <Palette className="w-4 h-4