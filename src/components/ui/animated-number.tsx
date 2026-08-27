"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/money";

export function AnimatedNumber({
  value,
  format = "inr",
  duration = 350,
}: {
  value: number;
  format?: "inr" | "percent" | "raw";
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic for smooth, natural deceleration without bouncing
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * easeOut;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  if (format === "inr") {
    return <span>{formatINR(displayValue)}</span>;
  }
  if (format === "percent") {
    return <span>{displayValue.toFixed(1)}%</span>;
  }
  return <span>{displayValue}</span>;
}
