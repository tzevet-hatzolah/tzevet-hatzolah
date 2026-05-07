"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { urlFor } from "@/sanity/lib/image";

export type NewsCategory =
  | "traffic"
  | "home_accidents"
  | "children"
  | "medical"
  | "violence"
  | "terror"
  | "other";

export type NewsArticle = {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  excerpt?: string;
  categories?: NewsCategory[];
};

type FilterKey = "all" | Exclude<NewsCategory, "other">;

const FILTERABLE: Exclude<FilterKey, "all">[] = [
  "traffic",
  "home_accidents",
  "children",
  "medical",
  "violence",
  "terror",
];

export default function NewsFilteredGrid({
  articles,
  locale,
}: {
  articles: NewsArticle[];
  locale: string;
}) {
  const t = useTranslations("news_page.filters");
  const isEn = locale === "en";
  const [active, setActive] = useState<FilterKey>("all");

  const filters = useMemo(
    () => [
      { key: "all" as FilterKey, label: t("all") },
      ...FILTERABLE.map((key) => ({ key, label: t(`${key}_label`) })),
    ],
    [t]
  );

  const filtered = useMemo(() => {
    if (active === "all") return articles;
    return articles.filter((a) => a.categories?.includes(active));
  }, [active, articles]);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
        {filters.map((f) => {
          const isActive = f.key === active;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={`text-xs sm:text-sm font-[number:var(--font-weight-medium)] rounded-full px-3.5 sm:px-4 py-1.5 border-2 transition-all duration-300 ${
                isActive
                  ? "border-gold-500 bg-gold-300/15 text-charcoal font-[number:var(--font-weight-bold)]"
                  : "border-dark/10 bg-white text-dark hover:border-gold-500/40 hover:bg-gold-50"
              }`}
              aria-pressed={isActive}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm py-12 text-center">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7">
          {filtered.map((article, i) => (
            <AnimateOnScroll
              key={article._id}
              animation="fade-up"
              delay={i * 80}
              className="h-full"
            >
              <Link href={`/news/${article.slug}`} className="block h-full">
                <article className="card group cursor-pointer h-full flex flex-col">
                  <div className="aspect-video relative overflow-hidden img-zoom shrink-0">
                    {article.mainImage?.asset ? (
                      <Image
                        src={urlFor(article.mainImage)
                          .width(600)
                          .height(340)
                          .auto("format")
                          .url()}
                        alt={
                          article.mainImage.alt ||
                          (isEn ? article.titleEn || article.title : article.title)
                        }
                        fill
                        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone to-navy-50 flex items-center justify-center text-muted text-sm">
                        <span>תמונה</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-[var(--spacing-card)] flex flex-col flex-1">
                    <span className="self-start inline-block bg-gold-50 text-gold-700 text-xs font-bold px-2.5 py-1 rounded-[var(--radius-sm)]">
                      {isEn ? "News" : "חדשות"}
                    </span>
                    <h3 className="mt-2 sm:mt-2.5 text-charcoal text-sm sm:text-base group-hover:text-navy-600 transition-colors duration-300">
                      {isEn ? article.titleEn || article.title : article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-muted text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                    <p className="text-muted text-[11px] sm:text-xs mt-auto pt-2 sm:pt-3">
                      {new Date(article.publishedAt).toLocaleDateString(
                        isEn ? "en-US" : "he-IL",
                        { year: "numeric", month: "long", day: "numeric" }
                      )}
                    </p>
                  </div>
                </article>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      )}
    </>
  );
}
