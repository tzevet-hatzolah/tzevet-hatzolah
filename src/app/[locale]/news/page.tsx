import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import PageHeader from "@/components/PageHeader";
import NewsFilteredGrid, {
  type NewsArticle,
} from "@/components/NewsFilteredGrid";
import { client } from "@/sanity/lib/client";
import { newsArticlesQuery } from "@/sanity/lib/queries";
import { alternateLinks } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "news_page" });
  return {
    title: t("title"),
    alternates: alternateLinks("/news"),
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const articles = await client.fetch<NewsArticle[]>(newsArticlesQuery, {
    start: 0,
    end: 50,
  });

  return <NewsContent articles={articles ?? []} locale={locale} />;
}

function NewsContent({
  articles,
  locale,
}: {
  articles: NewsArticle[];
  locale: string;
}) {
  const t = useTranslations("news_page");
  const hasArticles = articles.length > 0;

  return (
    <main className="flex-1">
      <PageHeader title={t("title")} />

      <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {hasArticles ? (
            <NewsFilteredGrid articles={articles} locale={locale} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <AnimateOnScroll key={i} animation="fade-up" delay={(i - 1) * 80}>
                  <article className="card group cursor-pointer">
                    <div className="aspect-video bg-gradient-to-br from-stone to-navy-50 flex items-center justify-center text-muted text-sm relative overflow-hidden img-zoom">
                      <span>תמונה</span>
                    </div>
                    <div className="p-4 sm:p-[var(--spacing-card)]">
                      <span className="inline-block bg-gold-50 text-gold-700 text-xs font-bold px-2.5 py-1 rounded-[var(--radius-sm)]">חדשות</span>
                      <h3 className="mt-2 sm:mt-2.5 text-charcoal text-sm sm:text-base group-hover:text-navy-600 transition-colors duration-300">כותרת לדוגמה</h3>
                      <p className="text-muted text-xs sm:text-sm mt-1.5 sm:mt-2 leading-relaxed">תקציר קצר של הכתבה...</p>
                      <p className="text-muted text-[11px] sm:text-xs mt-2 sm:mt-3">15 ינואר 2025</p>
                    </div>
                  </article>
                </AnimateOnScroll>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
