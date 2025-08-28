// client/src/App.tsx
import { lazy, Suspense } from "react";
import { MobileWrapper } from "@/components/mobile-wrapper"; // 移动端补丁
import "./index.css";

const Home = lazy(() => import("@/pages/home"));

export default function App() {
  return (
    <MobileWrapper>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        }
      >
        <Home />
      </Suspense>
    </MobileWrapper>
  );
}