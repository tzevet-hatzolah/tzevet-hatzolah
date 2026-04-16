import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import type { PortableTextBlock } from "next-sanity";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="text-xl sm:text-2xl font-bold mt-8 mb-3 text-charcoal">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg sm:text-xl font-medium mt-6 mb-2 text-charcoal">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base sm:text-lg font-medium mt-5 mb-2 text-charcoal">
        {children}
      </h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-r-4 border-gold-500 pr-5 my-6 text-dark/80 italic">
        {children}
      </blockquote>
    ),
    normal: ({ children }) => (
      <p className="text-dark leading-[var(--line-height-body)] mb-4">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 mb-4 text-dark pr-4">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 text-dark pr-4">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-navy-400 underline hover:text-navy-600 transition-colors"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      const alt = value.alt || "";
      return (
        <figure className="my-6">
          <Image
            src={urlFor(value).width(800).auto("format").url()}
            alt={alt}
            width={800}
            height={450}
            className="rounded-[var(--radius-lg)] w-full h-auto"
          />
          {alt && (
            <figcaption className="text-muted text-xs mt-2 text-center">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    },
    youtube: ({ value }) => {
      if (!value?.url) return null;
      const videoId = extractYouTubeId(value.url);
      if (!videoId) return null;
      return (
        <div className="my-6 aspect-video rounded-[var(--radius-lg)] overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    },
  },
};

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

export default function SanityPortableText({
  value,
}: {
  value: PortableTextBlock[] | null | undefined;
}) {
  if (!value) return null;
  return <PortableText value={value} components={components} />;
}
