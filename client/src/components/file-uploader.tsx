import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

export default function FileUploader({ onFileUpload }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, file.type, file.size);

    const allowedTypes = [
      'audio/mpeg', 'audio/mp3',  // MP3
      'audio/wav', 'audio/wave',  // WAV
      'audio/flac',               // FLAC
      'audio/aac',                // AAC
      'audio/ogg',                // OGG
      'audio/m4a',                // M4A
      'audio/webm'                // WebM Audio
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'webm'];

    // More permissive check for mobile compatibility
    const isValidType = file.type.startsWith('audio/') || allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension || '');

    if (!isValidType) {
      console.log('Invalid file type:', file.type, fileExtension);
      toast({
        title: "不支持的文件类型",
        description: "请选择音频文件 (MP3, WAV, FLAC, AAC, OGG, M4A)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    console.log('Starting file upload process...');

    // Simulate upload delay for better UX
    setTimeout(() => {
      try {
        onFileUpload(file);
        setIsUploading(false);
        toast({
          title: "文件上传成功",
          description: `${file.name} 已准备播放`,
        });
        console.log('File upload completed successfully');
      } catch (error) {
        console.error('Upload error:', error);
        setIsUploading(false);
        toast({
          title: "上传失败",
          description: "文件处理出错，请重试",
          variant: "destructive",
        });
      }
    }, 500);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => {
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/m4a', 'audio/webm'];
      const fileExtension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'webm'];
      return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension || '');
    });

    if (audioFile) {
      handleFileSelect(audioFile);
    } else {
      toast({
        title: "未找到音频文件",
        description: "请拖拽音频文件 (MP3, WAV, FLAC, AAC, OGG, M4A)",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input change event triggered');
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected from input:', file.name);
      handleFileSelect(file);
    } else {
      console.log('No file selected');
      toast({
        title: "未选择文件",
        description: "请选择一个音频文件",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative group" data-testid="file-uploader">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          w-80 md:w-96 h-48 border-2 border-dashed rounded-xl
          bg-white/5 backdrop-blur-md cursor-pointer
          flex flex-col items-center justify-center
          transition-all duration-300
          ${isDragOver
            ? 'border-blue-400 bg-blue-400/10 scale-105'
            : 'border-blue-500/50 hover:border-blue-400 hover:bg-white/10'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
        data-testid="drop-zone"
      >
        <div className="text-center p-6">
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-white">处理中...</p>
              <p className="text-sm text-gray-400">请稍候</p>
            </>
          ) : (
            <>
              <CloudUpload
                className={`
                  mx-auto mb-4 transition-transform duration-300
                  ${isDragOver ? 'scale-110 text-blue-400' : 'text-blue-500 group-hover:scale-110'}
                `}
                size={48}
                data-testid="upload-icon"
              />
              <p className="text-lg font-medium mb-2 text-white">
                {isDragOver ? '拖拽音乐文件到这里' : '拖拽音乐文件到这里'}
              </p>
              <p className="text-sm text-gray-400">或点击浏览文件</p>
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                <Music size={12} />
                支持 MP3, WAV, FLAC, AAC, OGG, M4A
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.flac,.aac,.ogg,.m4a,.webm,audio/*"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="file-input"
        />
      </div>
    </div>
  );
}
