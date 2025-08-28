// client/src/hooks/use-audio-ai.ts
import { useEffect, useState } from "react";

export const useAudioAI = (analyserNode: AnalyserNode | null) => {
  const [emotion, setEmotion] = useState<"calm" | "energetic" | "melancholy" | "happy">("calm");

  useEffect(() => {
    if (!analyserNode) return;

    const analyzeEmotion = () => {
      const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
      analyserNode.getByteFrequencyData(dataArray);

      const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const mids = dataArray.slice(10, 100).reduce((a, b) => a + b, 0) / 90;
      const highs = dataArray.slice(100, 255).reduce((a, b) => a + b, 0) / 155;

      // 简化的情感映射（可替换为TensorFlow模型）
      if (bass > 150 && highs > 100) setEmotion("energetic");
      else if (bass < 50 && mids < 80) setEmotion("calm");
      else if (mids > 120 && highs < 50) setEmotion("melancholy");
      else setEmotion("happy");
    };

    const interval = setInterval(analyzeEmotion, 1000);
    return () => clearInterval(interval);
  }, [analyserNode]);

  const theme = {
    calm: ["from-blue-400", "via-cyan-500", "to-teal-500"],
    energetic: ["from-red-500", "via-orange-500", "to-yellow-500"],
    melancholy: ["from-purple-600", "via-indigo-500", "to-blue-600"],
    happy: ["from-pink-400", "via-rose-500", "to-red-500"],
  }[emotion];

  return { emotion, theme };
};