// client/src/components/mobile-wrapper.tsx
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
}

export const MobileWrapper = ({ children }: Props) => {
  useEffect(() => {
    // 防止双指缩放
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // 防止双击缩放
    const preventDoubleTap = (e: TouchEvent) => {
      if ((e as any).detail > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    document.addEventListener("touchend", preventDoubleTap);

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("gesturestart", (e) => e.preventDefault());
      document.removeEventListener("touchend", preventDoubleTap);
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden touch-manipulation select-none">
      {children}
    </div>
  );
};