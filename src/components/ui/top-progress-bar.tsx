"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  const start = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 65) {
          return prev + Math.random() * 12;
        } else if (prev < 88) {
          return prev + Math.random() * 4;
        } else {
          return prev + 0.5;
        }
      });
    }, 120);
  };

  const complete = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => setProgress(0), 200);
    }, 250);
  };

  // Route change complete
  useEffect(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      complete();
    }
  }, [pathname, searchParams]);

  // Global link click listener for instant start on click
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("/#") &&
        !href.startsWith("//") &&
        target.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const url = new URL(target.href);
        const currentUrl = new URL(window.location.href);

        // If navigating to a different path or query
        if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
          isNavigatingRef.current = true;
          start();
        }
      }
    };

    const handleCustomStart = () => start();
    const handleCustomStop = () => complete();

    document.addEventListener("click", handleLinkClick);
    window.addEventListener("app:start-loading", handleCustomStart);
    window.addEventListener("app:stop-loading", handleCustomStop);

    return () => {
      document.removeEventListener("click", handleLinkClick);
      window.removeEventListener("app:start-loading", handleCustomStart);
      window.removeEventListener("app:stop-loading", handleCustomStop);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3.5px] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full w-full origin-left transition-all duration-300 ease-out"
        style={{
          transform: `scaleX(${progress / 100})`,
          background: "linear-gradient(90deg, #facc15 0%, #38bdf8 50%, #ef4444 100%)",
          boxShadow:
            "0 0 10px rgba(56, 189, 248, 0.8), 0 0 6px rgba(239, 68, 68, 0.6), 0 0 6px rgba(250, 204, 21, 0.6)",
        }}
      />
    </div>
  );
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressIndicator />
    </Suspense>
  );
}
