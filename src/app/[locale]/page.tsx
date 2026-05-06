import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import AnimatedCounter from "@/components/AnimatedCounter";
import HeroVideo from "@/components/HeroVideo";
import { client } from "@/sanity/lib/client";
import {
  siteSettingsQuery,
  latestNewsQuery,
  homepageDonationItemsQuery,
} from "@/sanity/lib/queries";
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

type DonationItem = {
  _id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  slug: string;
  cardType: "amount" | "custom";
  monthlyAmount?: number;
  months?: number;
  image?: { asset: { _ref: string }; alt?: string } | null;
  icon?: DonationIconKey;
};

type DonationIconKey =
  | "heart"
  | "kit"
  | "aed"
  | "ambulance"
  | "cross"
  | "shield"
  | "phone"
  | "volunteer";

const FALLBACK_DONATION_ITEMS: DonationItem[] = [
  {
    _id: "fallback-custom",
    name: "תרומה בסכום חופשי",
    nameEn: "Give any amount",
    description:
      "תרמו בכל סכום שתבחרו — חודשי או חד-פעמי. כל שקל מסייע לנו להגיע לעוד אדם בזמן.",
    descriptionEn:
      "Donate any amount — monthly or one-time. Every shekel helps us reach one more person in time.",
    slug: "custom",
    cardType: "custom",
    icon: "heart",
  },
  {
    _id: "fallback-kit",
    name: "ערכת עזרה ראשונה למתנדב",
    nameEn: "Volunteer first-aid kit",
    description:
      "ערכה אישית למתנדב חדש: חבישות, מסכת הנשמה, כפפות וציוד בסיס לטיפול ראשוני בזירת אירוע.",
    descriptionEn:
      "A personal kit for a new volunteer: bandages, breathing mask, gloves, and core gear for first-response treatment at the scene.",
    slug: "kit",
    cardType: "amount",
    monthlyAmount: 120,
    months: 12,
    icon: "kit",
  },
  {
    _id: "fallback-aed",
    name: "דפיברילטור נייד (AED)",
    nameEn: "Portable defibrillator (AED)",
    description:
      "מכשיר החייאה אוטומטי שמאפשר למתנדב לתת מענה מציל-חיים בדקות הקריטיות שלפני הגעת אמבולנס.",
    descriptionEn:
      "An automated CPR device that lets a volunteer deliver life-saving care in the critical minutes before an ambulance arrives.",
    slug: "aed",
    cardType: "amount",
    monthlyAmount: 450,
    months: 18,
    icon: "aed",
  },
  {
    _id: "fallback-training",
    name: "הכשרת מתנדב חדש",
    nameEn: "New volunteer training",
    description:
      "מימון קורס הכשרה למתנדב חדש בשטח: עזרה ראשונה, נהלי חירום, התמודדות עם טראומה ואירועי רב-נפגעים.",
    descriptionEn:
      "Funds a full training course for a new field volunteer: first aid, emergency procedures, trauma response and mass-casualty preparation.",
    slug: "training",
    cardType: "amount",
    monthlyAmount: 80,
    months: 12,
    icon: "volunteer",
  },
  {
    _id: "fallback-dispatch",
    name: "תמיכה במוקד החירום 24/7",
    nameEn: "24/7 emergency dispatch",
    description:
      "תרומה למוקד החירום שלנו, שמסיים בכל דקה ומפעיל את המתנדב הקרוב ביותר לזירה — בכל שעה, בכל יום בשנה.",
    descriptionEn:
      "Supports our emergency dispatch center — running every minute, routing the nearest volunteer to the scene, every hour of every day.",
    slug: "dispatch",
    cardType: "amount",
    monthlyAmount: 200,
    months: 18,
    icon: "phone",
  },
  {
    _id: "fallback-ambulance",
    name: "ציוד מציל חיים לאמבולנס",
    nameEn: "Ambulance life-saving equipment",
    description:
      "ציוד רפואי מתקדם לאמבולנס מבצעי — מוניטור, מכשירי החייאה ופריטי טיפול לאירועים מורכבים.",
    descriptionEn:
      "Advanced medical gear for an active ambulance — patient monitor, resuscitation tools and supplies for complex incidents.",
    slug: "ambulance",
    cardType: "amount",
    monthlyAmount: 800,
    months: 24,
    icon: "ambulance",
  },
];

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

  const [settings, latestNews, pageMedia, donationItemsRaw] = await Promise.all([
    client.fetch<SiteSettings>(siteSettingsQuery),
    client.fetch<NewsArticle[]>(latestNewsQuery),
    getPageMedia(),
    client.fetch<DonationItem[]>(homepageDonationItemsQuery).catch(() => []),
  ]);

  const stats = {
    volunteers: settings?.statsVolunteers ?? 500,
    callsPerYear: settings?.statsCallsPerYear ?? 10000,
    yearsActive: settings?.statsYearsActive ?? 15,
  };

  const donationItems =
    donationItemsRaw && donationItemsRaw.length >= 6
      ? donationItemsRaw
      : FALLBACK_DONATION_ITEMS;

  return (
    <HomeContent
      stats={stats}
      latestNews={latestNews ?? []}
      donationItems={donationItems}
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
  donationItems,
  locale,
  heroVideoUrl,
  heroPosterUrl,
  missionVideoUrl,
  missionImage,
}: {
  stats: { volunteers: number; callsPerYear: number; yearsActive: number };
  latestNews: NewsArticle[];
  donationItems: DonationItem[];
  locale: string;
  heroVideoUrl?: string | null;
  heroPosterUrl?: string | null;
  missionVideoUrl?: string | null;
  missionImage?: SanityImage;
}) {
  const t = useTranslations("home");

  const hasNews = latestNews.length > 0;

  return (
    <main className="flex flex-col flex-1">
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

      {/* ==================== 4. DONATION OPTIONS ==================== */}
      <section className="relative py-14 sm:py-20 md:py-[var(--spacing-section)] px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-800 to-navy-600" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(248,224,72,0.07)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(195,26,45,0.06)_0%,transparent_55%)]" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-10 sm:mb-14">
              <div className="section-line mx-auto mb-4 sm:mb-5" />
              <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)] mb-3 sm:mb-4">
                {t("donate_block.title")}
              </h2>
              <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                {t("donate_block.subtitle")}
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {donationItems.map((item, i) => (
              <DonationOptionCard
                key={item._id}
                item={item}
                locale={locale}
                delay={i * 90}
              />
            ))}
          </div>

          <AnimateOnScroll animation="fade-up" delay={500}>
            <div className="text-center mt-9 sm:mt-12">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 text-white/80 hover:text-gold-300 text-sm sm:text-base font-medium transition-colors duration-300"
              >
                {t("donate_block.more")}
                <span className="text-lg leading-none">&larr;</span>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

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

function DonationOptionCard({
  item,
  locale,
  delay,
}: {
  item: DonationItem;
  locale: string;
  delay: number;
}) {
  const t = useTranslations("home.donate_block");
  const isCustom = item.cardType === "custom";

  const monthly = item.monthlyAmount;
  const months = item.months ?? 18;
  const total = !isCustom && monthly ? monthly * months : 0;

  const href =
    isCustom || !monthly
      ? "/donate"
      : `/donate?amount=${monthly}&recurring=true&item=${item.slug}`;

  const name = locale === "en" && item.nameEn ? item.nameEn : item.name;
  const description =
    locale === "en" && item.descriptionEn ? item.descriptionEn : item.description;

  const Icon = DONATION_ICONS[item.icon ?? "heart"] ?? DONATION_ICONS.heart;

  const imageUrl = item.image?.asset
    ? urlFor(item.image).width(640).height(400).auto("format").url()
    : null;

  return (
    <AnimateOnScroll animation="fade-up" delay={delay}>
      <Link href={href} className="block h-full group">
        <div
          className={`relative h-full flex flex-col rounded-[var(--radius-xl)] overflow-hidden transition-all duration-300 hover-lift ${
            isCustom
              ? "bg-gradient-to-br from-gold-300 to-gold-500 text-navy-950 ring-1 ring-gold-300/50"
              : "bg-warm-white text-charcoal ring-1 ring-white/10"
          } shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]`}
        >
          {imageUrl ? (
            <div className="relative h-32 sm:h-36 overflow-hidden img-zoom">
              <Image
                src={imageUrl}
                alt={item.image?.alt || name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div
              className={`flex items-center justify-center h-28 sm:h-32 ${
                isCustom
                  ? "bg-gold-50/40"
                  : "bg-gradient-to-br from-stone to-navy-50"
              }`}
            >
              <Icon
                className={
                  isCustom
                    ? "text-navy-800"
                    : "text-navy-600 group-hover:text-red-600 transition-colors duration-300"
                }
              />
            </div>
          )}

          <div className="flex-1 flex flex-col p-5 sm:p-6">
            <h3
              className={`text-base sm:text-lg leading-snug mb-2 ${
                isCustom ? "text-navy-950" : "text-charcoal"
              }`}
            >
              {name}
            </h3>

            <p
              className={`text-xs sm:text-sm leading-relaxed mb-5 line-clamp-3 ${
                isCustom ? "text-navy-950/80" : "text-dark/80"
              }`}
            >
              {description}
            </p>

            {!isCustom && monthly ? (
              <div className="mb-5 mt-auto">
                <div className="text-2xl sm:text-3xl font-[number:var(--font-weight-black)] text-gold-700 leading-none mb-1.5">
                  {t("monthly_format", {
                    amount: monthly.toLocaleString("he-IL"),
                    months,
                  })}
                </div>
                <div className="text-xs text-muted">
                  {t("total_format", { total: total.toLocaleString("he-IL") })}
                </div>
              </div>
            ) : (
              <div className="mt-auto" />
            )}

            <span
              className={`inline-flex items-center justify-center font-bold rounded-[var(--radius-md)] py-2.5 sm:py-3 text-sm sm:text-base transition-all duration-300 ${
                isCustom
                  ? "bg-navy-800 text-white group-hover:bg-navy-950"
                  : "bg-red-600 text-white group-hover:bg-red-800 group-hover:shadow-[var(--shadow-glow-red)]"
              }`}
            >
              {t("donate_now")}
            </span>
          </div>
        </div>
      </Link>
    </AnimateOnScroll>
  );
}

const DONATION_ICONS: Record<DonationIconKey, React.FC<{ className?: string }>> = {
  heart: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  kit: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  ),
  aed: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <polyline points="13 8 11 12 14 12 12 16" />
    </svg>
  ),
  ambulance: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 17h2v-6a2 2 0 0 1 2-2h7v8h6" />
      <path d="M14 9h4l3 4v4h-2" />
      <circle cx="7.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
      <path d="M9 5v3M7.5 6.5h3" />
    </svg>
  ),
  cross: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M12 7v10M7 12h10" />
    </svg>
  ),
  shield: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  phone: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  volunteer: ({ className }) => (
    <svg className={className} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1" />
      <path d="M19 6v3M17.5 7.5h3" />
    </svg>
  ),
};

const newsPlaceholders = [
  { category: "עדכון שטח", title: "כותרת לדוגמה", date: "15 ינואר 2025" },
  { category: "סיפור מהשטח", title: "כותרת לדוגמה", date: "10 ינואר 2025" },
  { category: "הודעה", title: "כותרת לדוגמה", date: "5 ינואר 2025" },
];
