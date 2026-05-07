"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { urlFor } from "@/sanity/lib/image";

export type NewsArticle = {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  excerpt?: string;
};

type FilterKey = "all" | "traffic" | "children" | "medical" | "violence";

const FILTERABLE: Exclude<FilterKey, "all">[] = [
  "traffic",
  "children",
  "medical",
  "violence",
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

  const filters = useMemo(() => {
    return [
      { key: "all" as FilterKey, label: t("all"), keywords: [] as string[] },
      ...FILTERABLE.map((key) => ({
        key: key as FilterKey,
        label: t(`${key}_label`),
        keywords: t(`${key}_keywords`)
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean),
      })),
    ];
  }, [t]);

  const filtered = useMemo(() => {
    if (active === "all") return articles;
    const filter = filters.find((f) => f.key === active);
    if (!filter || filter.keywords.length === 0) return articles;
    return articles.filter((a) => {
      const haystack = [
        isEn ? a.titleEn || a.title : a.title,
        a.excerpt ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return filter.keywords.some((k) => haystack.includes(k));
    });
  }, [active, articles, filters, isEn]);

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
            >
              <Link href={`/news/${article.slug}`}>
                <article className="card group cursor-pointer">
                  <div className="aspect-video relative overflow-hidden img-zoom">
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
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone to-navy-50 flex items-center justify-center text-muted text-sm">
                        <span>תמונה</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-[var(--spacing-card)]">
                    <span className="inline-block bg-gold-50 text-gold-700 text-xs font-bold px-2.5 py-1 rounded-[var(--radius-sm)]">
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
                    <p className="text-muted text-[11px] sm:text-xs mt-2 sm:mt-3">
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
