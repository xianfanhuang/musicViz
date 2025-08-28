// client/src/components/mobile-wrapper.tsx
import { useEffect } from "react";

export const MobileWrapper = ({ children }) => {
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("gesturestart", (e) => e.preventDefault());

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("gesturestart", (e) => e.preventDefault());
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden touch-manipulation">
      {children}
    </div>
  );
};