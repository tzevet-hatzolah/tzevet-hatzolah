"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 1800;

export default function AnimatedCounter({
  value,
  prefix = "",
  locale,
  className = "",
}: {
  value: number;
  prefix?: string;
  locale: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    let rafId: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(el);

        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / DURATION_MS, 1);
          // easeOutExpo
          const eased =
            progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setDisplay(Math.round(value * eased));
          if (progress < 1) {
            rafId = requestAnimationFrame(tick);
          }
        };

        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [value]);

  const formatted = display.toLocaleString(
    locale === "en" ? "en-US" : "he-IL"
  );

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
    </span>
  );
}
