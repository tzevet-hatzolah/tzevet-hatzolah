import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import AnimatedCounter from "@/components/AnimatedCounter";
import Ticker from "@/components/Ticker";
import HeroVideo from "@/components/HeroVideo";
import { client } from "@/sanity/lib/client";
import { siteSettingsQuery, latestNewsQuery } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";

type SiteSettings = {
  statsVolunteers?: number;
  statsCallsPerYear?: number;
  statsYearsActive?: number;
} | null;

type SanityImage = { asset: { _ref: string }; alt?: string } | null;

type PageMedia = {
  heroVideoUrl: string | null;
  heroPosterUrl: string | null;
  missionVideoUrl: string | null;
  missionImage: SanityImage;
} | null;

type NewsArticle = {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  publishedAt: string;
  mainImage?: { asset: { _ref: string }; alt?: string };
  excerpt?: string;
};

async function getPageMedia(): Promise<PageMedia> {
  try {
    const data = await client.fetch<PageMedia>(
      `*[_type == "siteSettings"][0]{
        "heroVideoUrl": heroVideo.asset->url,
        "heroPosterUrl": heroVideoPoster.asset->url,
        "missionVideoUrl": missionVideo.asset->url,
        missionImage
      }`
    );
    return data;
  } catch {
    return null;
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [settings, latestNews, pageMedia] = await Promise.all([
    client.fetch<SiteSettings>(siteSettingsQuery),
    client.fetch<NewsArticle[]>(latestNewsQuery),
    getPageMedia(),
  ]);

  const stats = {
    volunteers: settings?.statsVolunteers ?? 500,
    callsPerYear: settings?.statsCallsPerYear ?? 10000,
    yearsActive: settings?.statsYearsActive ?? 15,
  };

  return (
    <HomeContent
      stats={stats}
      latestNews={latestNews ?? []}
      locale={locale}
      heroVideoUrl={pageMedia?.heroVideoUrl}
      heroPosterUrl={pageMedia?.heroPosterUrl}
      missionVideoUrl={pageMedia?.missionVideoUrl}
      missionImage={pageMedia?.missionImage}
    />
  );
}

function HomeContent({
  stats,
  latestNews,
  locale,
  heroVideoUrl,
  heroPosterUrl,
  missionVideoUrl,
  missionImage,
}: {
  stats: { volunteers: number; callsPerYear: number; yearsActive: number };
  latestNews: NewsArticle[];
  locale: string;
  heroVideoUrl?: string | null;
  heroPosterUrl?: string | null;
  missionVideoUrl?: string | null;
  missionImage?: SanityImage;
}) {
  const t = useTranslations("home");
  const tDonate = useTranslations("donate");

  const presetAmounts = [50, 100, 250];

  const tickerItems = [
    t("ticker.item1"),
    t("ticker.item2"),
    t("ticker.item3"),
    t("ticker.item4"),
    t("ticker.item5"),
  ];

  const hasNews = latestNews.length > 0;

  return (
    <main className="flex flex-col flex-1">
      {/* ==================== TICKER BAR ==================== */}
      <Ticker items={tickerItems} />

      {/* ==================== 1. HERO ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-800 to-navy-600 text-white py-20 sm:py-28 md:py-36 lg:py-44 px-5 sm:px-6">
        {/* Video background (from Sanity) */}
        <HeroVideo videoUrl={heroVideoUrl} posterUrl={heroPosterUrl} />

        {/* Dark overlay — ensures text readability over video */}
        <div className="absolute inset-0 bg-navy-950/75 pointer-events-none" />

        {/* Decorative elements (on top of overlay) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gold-300/5 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-20 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-navy-400/10 rounded-full blur-3xl animate-float delay-200" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(248,224,72,0.04)_0%,transparent_70%)]" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Badge */}
          <span className="inline-block bg-gradient-to-r from-gold-300 to-gold-500 text-navy-950 text-sm sm:text-base font-bold px-5 sm:px-7 py-2 sm:py-2.5 rounded-full mb-6 sm:mb-7 shadow-[var(--shadow-glow-gold)] animate-fade-up">
            {t("hero.badge")}
          </span>

          {/* Headline */}
          <h1 className="text-white text-3xl sm:text-4xl md:text-[length:var(--font-size-display)] font-[number:var(--font-weight-black)] leading-[var(--line-height-display)] whitespace-pre-line animate-fade-up delay-100 [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-white/85 text-sm sm:text-base md:text-lg mt-4 sm:mt-5 max-w-xl mx-auto leading-relaxed animate-fade-up delay-200 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-10 md:mt-12 animate-fade-up delay-300">
            <Link href="/donate" className="btn-donate text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-3.5 animate-heartbeat" style={{ animationDelay: "1s" }}>
              {t("hero.cta_donate")}
            </Link>
            <Link
              href="/about"
              className="border-2 border-white/25 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-3.5 rounded-[var(--radius-md)] hover:bg-white/10 hover:border-white/40 transition-all duration-300 inline-block text-center backdrop-blur-sm"
            >
              {t("hero.cta_about")}
            </Link>
          </div>
        </div>

        {/* Bottom fade to next section */}
        <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-gold-300 to-transparent opacity-30" />
      </section>

      {/* ==================== 2. STATS STRIP ==================== */}
      <section className="relative bg-gradient-to-r from-gold-300 via-gold-300 to-gold-500/80 py-5 sm:py-7 md:py-9 px-4 sm:px-6 shadow-[var(--shadow-glow-gold)]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3 sm:gap-4 text-center">
          <StatItem label={t("stats.volunteers")} value={stats.volunteers} prefix="+" locale={locale} />
          <StatItem label={t("stats.calls_per_year")} value={stats.callsPerYear} prefix="+" locale={locale} />
          <StatItem label={t("stats.years_active")} value={stats.yearsActive} locale={locale} />
        </div>
      </section>

      {/* ==================== 3. MISSION / ABOUT TEASER ==================== */}
      <section className="py-14 sm:py-20 md:py-[var(--spacing-section)] px-5 sm:px-6 relative">
        <div className="absolute inset-0 pattern-dots opacity-40 pointer-events-none" />
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center relative z-10">
          {/* Image/video */}
          <AnimateOnScroll animation="slide-right" className="order-2 md:order-1">
            <div className="bg-gradient-to-br from-stone to-navy-50 rounded-[var(--radius-xl)] aspect-video flex items-center justify-center text-muted border border-navy-100/50 shadow-[var(--shadow-card)] overflow-hidden img-zoom">
              {missionVideoUrl ? (
                <video
                  controls
                  playsInline
                  poster={
                    missionImage?.asset
                      ? urlFor(missionImage).width(1200).auto("format").url()
                      : undefined
                  }
                  className="w-full h-full object-cover"
                >
                  <source src={missionVideoUrl} type="video/mp4" />
                </video>
              ) : missionImage?.asset ? (
                <Image
                  src={urlFor(missionImage).width(1200).auto("format").url()}
                  alt={missionImage.alt || t("mission.title")}
                  width={1200}
                  height={675}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm">תמונה / וידאו ארגוני</span>
              )}
            </div>
          </AnimateOnScroll>
          {/* Text */}
          <AnimateOnScroll animation="slide-left" delay={150} className="order-1 md:order-2">
            <div className="section-line mb-4 sm:mb-5" />
            <h2 className="text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-4">{t("mission.title")}</h2>
            <p className="text-dark leading-[var(--line-height-body)] mb-5 sm:mb-7 text-sm sm:text-base">
              {t("mission.text")}
            </p>
            <Link
              href="/about"
              className="btn-outline text-sm px-6 sm:px-7 py-2 sm:py-2.5"
            >
              {t("mission.link")}
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ==================== 4. DONATION CTA BLOCK ==================== */}
      <AnimateOnScroll animation="scale-in" className="py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto relative overflow-hidden rounded-[var(--radius-xl)] sm:rounded-[var(--radius-2xl)] shadow-[var(--shadow-elevated)]">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-800 to-navy-600" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(248,224,72,0.08)_0%,transparent_60%)]" />

          <div className="relative z-10 py-10 sm:py-14 px-5 sm:px-6 md:px-14 text-center">
            <h2 className="text-white text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3 font-[number:var(--font-weight-black)]">
              {t("donate_block.title")}
            </h2>
            <p className="text-white/50 mb-6 sm:mb-9 text-sm sm:text-base">{t("donate_block.subtitle")}</p>

            {/* Preset amounts */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-9">
              {presetAmounts.map((amount) => (
                <span
                  key={amount}
                  className="border-2 border-gold-500/60 text-white rounded-[var(--radius-md)] px-4 sm:px-5 md:px-7 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg font-bold cursor-pointer hover:bg-gold-500/15 hover:border-gold-500 hover:shadow-[var(--shadow-glow-gold)] transition-all duration-300 hover-lift"
                >
                  {tDonate("currency")}{amount}
                </span>
              ))}
              <span className="border-2 border-white/15 text-white/50 rounded-[var(--radius-md)] px-4 sm:px-5 md:px-7 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg cursor-pointer hover:border-white/30 hover:text-white/70 transition-all duration-300">
                {tDonate("custom_amount")}
              </span>
            </div>

            <Link href="/donate" className="btn-donate text-sm sm:text-base md:text-lg px-8 sm:px-12 py-3 sm:py-3.5">
              {t("donate_block.cta")}
            </Link>
          </div>
        </div>
      </AnimateOnScroll>

      {/* ==================== 5. LATEST NEWS ==================== */}
      <section className="py-14 sm:py-20 md:py-[var(--spacing-section)] px-5 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <div className="section-line mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl md:text-3xl">{t("news.title")}</h2>
              </div>
              <Link
                href="/news"
                className="text-navy-400 text-xs sm:text-sm font-medium hover:text-navy-600 transition-colors duration-300 flex items-center gap-1.5"
              >
                {t("news.view_all")}
                <span className="text-lg leading-none">&larr;</span>
              </Link>
            </div>
          </AnimateOnScroll>

          {/* News cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7">
            {hasNews
              ? latestNews.map((article, i) => (
                  <AnimateOnScroll key={article._id} animation="fade-up" delay={i * 120}>
                    <Link href={`/news/${article.slug}`}>
                      <article className="card group cursor-pointer">
                        <div className="aspect-video relative overflow-hidden img-zoom">
                          {article.mainImage?.asset ? (
                            <Image
                              src={urlFor(article.mainImage).width(600).height(340).auto("format").url()}
                              alt={article.mainImage.alt || (locale === "en" ? article.titleEn || article.title : article.title)}
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
                            {t("news.category_news")}
                          </span>
                          <h3 className="mt-2 sm:mt-2.5 text-charcoal text-sm sm:text-base group-hover:text-navy-600 transition-colors duration-300">
                            {locale === "en" ? article.titleEn || article.title : article.title}
                          </h3>
                          <p className="text-muted text-xs mt-2 sm:mt-3">
                            {new Date(article.publishedAt).toLocaleDateString(
                              locale === "en" ? "en-US" : "he-IL",
                              { year: "numeric", month: "long", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </article>
                    </Link>
                  </AnimateOnScroll>
                ))
              : newsPlaceholders.map((item, i) => (
                  <AnimateOnScroll key={i} animation="fade-up" delay={i * 120}>
                    <article className="card group cursor-pointer">
                      <div className="aspect-video bg-gradient-to-br from-stone to-navy-50 flex items-center justify-center text-muted text-sm relative overflow-hidden img-zoom">
                        <span>תמונה</span>
                      </div>
                      <div className="p-4 sm:p-[var(--spacing-card)]">
                        <span className="inline-block bg-gold-50 text-gold-700 text-xs font-bold px-2.5 py-1 rounded-[var(--radius-sm)]">
                          {item.category}
                        </span>
                        <h3 className="mt-2 sm:mt-2.5 text-charcoal text-sm sm:text-base group-hover:text-navy-600 transition-colors duration-300">{item.title}</h3>
                        <p className="text-muted text-xs mt-2 sm:mt-3">{item.date}</p>
                      </div>
                    </article>
                  </AnimateOnScroll>
                ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatItem({
  label,
  value,
  prefix,
  locale,
}: {
  label: string;
  value: number;
  prefix?: string;
  locale: string;
}) {
  return (
    <div className="group cursor-default">
      <AnimatedCounter
        value={value}
        prefix={prefix}
        locale={locale}
        className="text-xl sm:text-2xl md:text-4xl font-[number:var(--font-weight-black)] text-navy-950 block group-hover:scale-110 transition-transform duration-300"
      />
      <p className="text-navy-800/70 text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1 font-medium">{label}</p>
    </div>
  );
}

const newsPlaceholders = [
  { category: "עדכון שטח", title: "כותרת לדוגמה", date: "15 ינואר 2025" },
  { category: "סיפור מהשטח", title: "כותרת לדוגמה", date: "10 ינואר 2025" },
  { category: "הודעה", title: "כותרת לדוגמה", date: "5 ינואר 2025" },
];
