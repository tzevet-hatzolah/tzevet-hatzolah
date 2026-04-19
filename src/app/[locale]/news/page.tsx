import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { client } from "@/sanity/lib/client";
import { newsArticlesQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
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

type NewsArticle = {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  excerpt?: string;
};

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
  const isEn = locale === "en";
  const hasArticles = articles.length > 0;

  return (
    <main className="flex-1">
      <section className="page-header text-white py-12 sm:py-16 md:py-20 px-5 sm:px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-4 sm:mb-5" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)]">
            {t("title")}
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {hasArticles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7">
              {articles.map((article, i) => (
                <AnimateOnScroll key={article._id} animation="fade-up" delay={i * 80}>
                  <Link href={`/news/${article.slug}`}>
                    <article className="card group cursor-pointer">
                      <div className="aspect-video relative overflow-hidden img-zoom">
                        {article.mainImage?.asset ? (
                          <Image
                            src={urlFor(article.mainImage).width(600).height(340).auto("format").url()}
                            alt={article.mainImage.alt || (isEn ? article.titleEn || article.title : article.title)}
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
