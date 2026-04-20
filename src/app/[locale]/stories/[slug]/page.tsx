import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { client } from "@/sanity/lib/client";
import {
  fieldStoryBySlugQuery,
  fieldStoriesSlugsQuery,
} from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { alternateLinks } from "@/lib/seo";
import {
  jsonLdScript,
  newsArticleSchema,
} from "@/lib/structuredData";
import SanityPortableText from "@/components/SanityPortableText";
import type { PortableTextBlock } from "next-sanity";
import type { Metadata } from "next";

type FieldStory = {
  _id: string;
  _updatedAt: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  location?: string;
  excerpt?: string;
  body?: PortableTextBlock[];
  bodyEn?: PortableTextBlock[];
};

export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(fieldStoriesSlugsQuery);
  return (slugs ?? []).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = await client.fetch<FieldStory | null>(fieldStoryBySlugQuery, {
    slug,
  });
  if (!story) return {};

  const title =
    locale === "en" ? story.titleEn || story.title : story.title;

  const ogImage = story.mainImage?.asset
    ? urlFor(story.mainImage).width(1200).height(630).auto("format").url()
    : undefined;

  return {
    title,
    description: story.excerpt,
    alternates: alternateLinks(`/stories/${slug}`),
    openGraph: {
      type: "article",
      title,
      description: story.excerpt,
      publishedTime: story.publishedAt,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function FieldStoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const story = await client.fetch<FieldStory | null>(fieldStoryBySlugQuery, {
    slug,
  });

  if (!story) {
    notFound();
  }

  const isEn = locale === "en";
  const title = isEn ? story.titleEn || story.title : story.title;
  const body = isEn ? story.bodyEn || story.body : story.body;

  const mainImageUrl = story.mainImage?.asset
    ? urlFor(story.mainImage).width(1200).height(630).auto("format").url()
    : null;

  const storyJsonLd = newsArticleSchema({
    article: {
      title: story.title,
      titleEn: story.titleEn,
      slug: story.slug,
      publishedAt: story.publishedAt,
      updatedAt: story._updatedAt,
      excerpt: story.excerpt,
      mainImageUrl,
    },
    locale,
    path: "stories",
  });

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(storyJsonLd) }}
      />
      {/* Hero with image backdrop */}
      <section className="relative bg-navy-800 text-white">
        {story.mainImage?.asset ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={urlFor(story.mainImage).width(1600).height(900).auto("format").url()}
                alt={story.mainImage.alt || title}
                fill
                className="object-cover opacity-40"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-900/70 to-navy-950" />
            </div>
            <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 py-20 sm:py-28 md:py-32 text-center">
              <div className="inline-block w-12 h-0.5 bg-gold-300 mb-5" />
              {story.location && (
                <p className="inline-flex items-center gap-2 text-gold-300 text-sm font-bold mb-4">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {story.location}
                </p>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-[number:var(--font-weight-black)] leading-tight">
                {title}
              </h1>
              <p className="text-white/60 text-sm mt-5">
                {new Date(story.publishedAt).toLocaleDateString(
                  isEn ? "en-US" : "he-IL",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
            <div className="inline-block w-12 h-0.5 bg-gold-300 mb-5" />
            {story.location && (
              <p className="text-gold-300 text-sm font-bold mb-4">{story.location}</p>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)]">
              {title}
            </h1>
            <p className="text-white/60 text-sm mt-4">
              {new Date(story.publishedAt).toLocaleDateString(
                isEn ? "en-US" : "he-IL",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            </p>
          </div>
        )}
      </section>

      {/* Excerpt as pull-quote with gold border */}
      {story.excerpt && (
        <section className="px-5 sm:px-6 pt-10 sm:pt-14">
          <div className="max-w-3xl mx-auto">
            <blockquote className="border-r-4 border-gold-500 ps-5 sm:ps-6 text-lg sm:text-xl text-charcoal font-medium leading-relaxed">
              {story.excerpt}
            </blockquote>
          </div>
        </section>
      )}

      {/* Body */}
      <section className="py-10 sm:py-14 md:py-16 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <SanityPortableText value={body} />

          <div className="mt-12 pt-8 border-t border-stone">
            <Link
              href="/stories"
              className="text-navy-400 text-sm font-medium hover:text-navy-600 transition-colors flex items-center gap-1.5"
            >
              <span className="text-lg leading-none">&rarr;</span>
              {isEn ? "Back to all stories" : "חזרה לכל הסיפורים"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
