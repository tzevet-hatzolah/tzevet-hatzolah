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
import SanityPortableText from "@/components/SanityPortableText";
import type { PortableTextBlock } from "next-sanity";
import type { Metadata } from "next";

type NewsArticle = {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
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

  return {
    title,
    description: article.excerpt,
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
  const body = isEn ? article.bodyEn || article.body : article.body;

  return (
    <main className="flex-1">
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
      {article.mainImage?.asset && (
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
          </div>
        </section>
      )}

      {/* Article body */}
      <section className="py-12 sm:py-16 md:py-20 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <SanityPortableText value={body} />

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
