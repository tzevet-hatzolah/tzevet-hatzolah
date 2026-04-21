import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { client } from "@/sanity/lib/client";
import {
  newsArticleBySlugQuery,
  newsArticlesSlugsQuery,
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

type GalleryImage = {
  _key?: string;
  asset: { _ref: string };
  alt?: string;
  caption?: string;
};

const CREDIT_HE = "תיעוד: דוברות צוות הצלה";
const CREDIT_EN = "Photos: Tzevet Hatzolah Spokesperson's Office";
const CREDIT_MATCH = /דוברות\s+צוות\s+הצלה|tzevet\s+hatzolah\s+spokesperson/i;

function stripCreditBlocks(
  blocks: PortableTextBlock[] | undefined
): PortableTextBlock[] | undefined {
  if (!blocks) return blocks;
  return blocks.filter((b) => {
    if (b._type !== "block") return true;
    const children = (b as unknown as { children?: { text?: string }[] }).children;
    if (!Array.isArray(children)) return true;
    const text = children.map((c) => c.text ?? "").join("").trim();
    return !CREDIT_MATCH.test(text);
  });
}

function PhotoCredit({ isEn }: { isEn: boolean }) {
  return (
    <p className="text-muted text-sm sm:text-base mt-4 text-center">
      {isEn ? CREDIT_EN : CREDIT_HE}
    </p>
  );
}

type NewsArticle = {
  _id: string;
  _updatedAt: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  gallery?: GalleryImage[];
  excerpt?: string;
  body?: PortableTextBlock[];
  bodyEn?: PortableTextBlock[];
};

export async function generateStaticParams() {
  const slugs = await client.fetch<{ slug: string }[]>(newsArticlesSlugsQuery);
  return (slugs ?? []).map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await client.fetch<NewsArticle | null>(
    newsArticleBySlugQuery,
    { slug }
  );
  if (!article) return {};

  const title =
    locale === "en"
      ? article.titleEn || article.title
      : article.title;

  const ogImage = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1200).height(630).auto("format").url()
    : undefined;

  return {
    title,
    description: article.excerpt,
    alternates: alternateLinks(`/news/${slug}`),
    openGraph: {
      type: "article",
      title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await client.fetch<NewsArticle | null>(
    newsArticleBySlugQuery,
    { slug }
  );

  if (!article) {
    notFound();
  }

  const isEn = locale === "en";
  const title = isEn ? article.titleEn || article.title : article.title;
  const rawBody = isEn ? article.bodyEn || article.body : article.body;
  const body = stripCreditBlocks(rawBody);

  const hasMainImage = Boolean(article.mainImage?.asset);
  const hasGallery = Boolean(article.gallery && article.gallery.length > 0);

  const mainImageUrl = article.mainImage?.asset
    ? urlFor(article.mainImage).width(1200).height(630).auto("format").url()
    : null;

  const articleJsonLd = newsArticleSchema({
    article: {
      title: article.title,
      titleEn: article.titleEn,
      slug: article.slug,
      publishedAt: article.publishedAt,
      updatedAt: article._updatedAt,
      excerpt: article.excerpt,
      mainImageUrl,
    },
    locale,
    path: "news",
  });

  return (
    <main className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(articleJsonLd) }}
      />
      {/* Header */}
      <section className="page-header text-white py-12 sm:py-16 md:py-20 px-5 sm:px-6 text-center">
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-white/50 text-sm mb-3">
            {new Date(article.publishedAt).toLocaleDateString(
              isEn ? "en-US" : "he-IL",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)]">
            {title}
          </h1>
        </div>
      </section>

      {/* Main image */}
      {hasMainImage && article.mainImage && (
        <section className="px-5 sm:px-6">
          <div className="max-w-3xl mx-auto -mt-8 relative">
            <Image
              src={urlFor(article.mainImage).width(1200).height(600).auto("format").url()}
              alt={article.mainImage.alt || title}
              width={1200}
              height={600}
              className="rounded-[var(--radius-xl)] w-full h-auto shadow-[var(--shadow-elevated)]"
              priority
            />
            {/* If there's no gallery, credit sits directly under the main photo */}
            {!hasGallery && <PhotoCredit isEn={isEn} />}
          </div>
        </section>
      )}

      {/* Article body */}
      <section className="py-12 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <SanityPortableText value={body} />

          {/* Gallery — one image per row, same size as the main image */}
          {hasGallery && article.gallery && (
            <div className="mt-10 space-y-6 sm:space-y-8">
              {article.gallery.map((img, i) => {
                if (!img.asset) return null;
                const src = urlFor(img)
                  .width(1200)
                  .height(600)
                  .auto("format")
                  .url();
                const alt = img.alt || title;
                return (
                  <figure key={img._key || i}>
                    <Image
                      src={src}
                      alt={alt}
                      width={1200}
                      height={600}
                      className="rounded-[var(--radius-xl)] w-full h-auto shadow-[var(--shadow-elevated)]"
                      sizes="(max-width: 768px) 100vw, 768px"
                    />
                    {img.caption && (
                      <figcaption className="text-muted text-xs mt-3 text-center">
                        {img.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          )}

          {/* Photo credit after the gallery (when one exists) */}
          {hasGallery && <PhotoCredit isEn={isEn} />}

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-stone">
            <Link
              href="/news"
              className="text-navy-400 text-sm font-medium hover:text-navy-600 transition-colors flex items-center gap-1.5"
            >
              <span className="text-lg leading-none">&rarr;</span>
              {isEn ? "Back to all articles" : "חזרה לכל הכתבות"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
