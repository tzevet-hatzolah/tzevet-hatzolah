"use client";

import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

export type TickerItem = { text: string; href?: string };

export default function Ticker({
  items,
  pauseLabel,
  resumeLabel,
}: {
  items: TickerItem[];
  pauseLabel: string;
  resumeLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      dir="ltr"
      className="relative overflow-hidden bg-navy-950 text-white py-2.5 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
    >
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-navy-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-navy-950 to-transparent z-10 pointer-events-none" />
      <button
        type="button"
        onClick={() => setPaused((current) => !current)}
        className="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-navy-950/90 px-2 py-1 text-[11px] font-bold text-white/85 hover:bg-navy-800 hover:text-white"
        aria-pressed={paused}
      >
        {paused ? resumeLabel : pauseLabel}
      </button>

      <div
        ref={trackRef}
        className="flex w-max whitespace-nowrap ticker-track ps-20"
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
            "flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium shrink-0 text-white/80 me-4 sm:me-8";
          if (item.href) {
            return (
              <Link
                key={i}
                href={item.href}
                dir="rtl"
                className={`${baseClass} hover:text-white transition-colors duration-200`}
              >
                {content}
              </Link>
            );
          }
          return (
            <span key={i} dir="rtl" className={baseClass}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}
