"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroVideo({
  videoUrl,
  posterUrl,
}: {
  videoUrl?: string | null;
  posterUrl?: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => setLoaded(true);
    video.addEventListener("canplaythrough", onCanPlay);

    // If already ready (cached)
    if (video.readyState >= 4) setLoaded(true);

    return () => video.removeEventListener("canplaythrough", onCanPlay);
  }, []);

  if (!videoUrl) return null;

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      poster={posterUrl || undefined}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}
