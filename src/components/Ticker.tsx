"use client";

import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type TickerItem = { text: string; href?: string };

export default function Ticker({ items }: { items: TickerItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className="relative overflow-hidden bg-navy-950 text-white py-2.5 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-y-0 start-0 w-16 bg-gradient-to-l from-transparent to-navy-950 z-10 pointer-events-none" />
      <div className="absolute inset-y-0 end-0 w-16 bg-gradient-to-r from-transparent to-navy-950 z-10 pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-8 whitespace-nowrap ticker-track"
        style={{ animationPlayState: paused ? "paused" : "running" }}
      >
        {repeated.map((item, i) => {
          const content = (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-pulse" />
              <span>{item.text}</span>
            </>
          );
          const baseClass =
            "flex items-center gap-3 text-sm font-medium shrink-0 text-white/80";
          if (item.href) {
            return (
              <Link
                key={i}
                href={item.href}
                className={`${baseClass} hover:text-white transition-colors duration-200`}
              >
                {content}
              </Link>
            );
          }
          return (
            <span key={i} className={baseClass}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
