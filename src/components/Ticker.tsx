"use client";

import { useRef, useEffect, useState } from "react";

export default function Ticker({ items }: { items: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Duplicate items enough to fill the viewport seamlessly
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className="relative overflow-hidden bg-navy-950 text-white py-2.5 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fade edges */}
      <div className="absolute inset-y-0 start-0 w-16 bg-gradient-to-l from-transparent to-navy-950 z-10 pointer-events-none" />
      <div className="absolute inset-y-0 end-0 w-16 bg-gradient-to-r from-transparent to-navy-950 z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-8 whitespace-nowrap ticker-track"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {repeated.map((text, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse" />
            <span className="text-white/80">{text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
