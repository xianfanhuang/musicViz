import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface URLPlayerProps {
  onAudioLoad: (url: string, title?: string) => void;
}

export default function URLPlayer({ onAudioLoad }: URLPlayerProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isValidAudioURL = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return pathname.endsWith('.mp3') ||
             pathname.endsWith('.wav') ||
             pathname.endsWith('.flac') ||
             pathname.endsWith('.aac') ||
             pathname.endsWith('.ogg') ||
             pathname.endsWith('.m4a') ||
             pathname.includes('audio') ||
             urlObj.hostname.includes('soundcloud') ||
             urlObj.hostname.includes('youtube') ||
             urlObj.hostname.includes('spotify');
    } catch {
      return false;
    }
  };

  const handleLoadURL = async () => {
    if (!url.trim()) {
      toast({
        title: "请输入URL",
        description: "请输入音频文件的网址",
        variant: "destructive",
      });
      return;
    }

    if (!isValidAudioURL(url)) {
      toast({
        title: "URL格式不正确",
        description: "请输入有效的音频文件URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Try to fetch the audio to validate it exists
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors' // Allow cross-origin requests
      });

      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || 'Remote Audio';

      onAudioLoad(url, filename);

      toast({
        title: "加载成功",
        description: `${filename} 已准备播放`,
      });

      setUrl("");
    } catch (error) {
      console.log('Loading URL anyway despite CORS:', error);
      // Even if CORS blocks the HEAD request, try to load it anyway
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || 'Remote Audio';
      onAudioLoad(url, filename);

      toast({
        title: "尝试加载",
        description: `正在尝试播放 ${filename}`,
      });

      setUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoadURL();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" data-testid="url-player">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">从网址播放</h3>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="输入音频文件网址..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-400"
              data-testid="url-input"
            />
            <Button
              onClick={handleLoadURL}
              disabled={isLoading || !url.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              data-testid="load-url-button"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Link className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>• 支持直接音频文件链接 (.mp3, .wav, .flac等)</p>
            <p>• 支持部分流媒体平台链接</p>
            <p>• 确保链接可以公开访问</p>
          </div>
        </div>
      </div>
    </div>
  );
}