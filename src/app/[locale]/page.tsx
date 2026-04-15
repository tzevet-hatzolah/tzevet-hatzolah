import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  const tDonate = useTranslations("donate");

  const presetAmounts = [50, 100, 250];

  return (
    <main className="flex flex-col flex-1">
      {/* ==================== 1. HERO ==================== */}
      {/* Full-width, image overlay in production */}
      <section className="relative bg-navy-600 text-white py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <span className="inline-block bg-gold-300 text-navy-800 text-xs md:text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            {t("hero.badge")}
          </span>

          {/* Headline */}
          <h1 className="text-3xl md:text-[length:var(--font-size-display)] font-[number:var(--font-weight-black)] leading-[1.25] whitespace-pre-line">
            {t("hero.title")}
          </h1>

          {/* Subtitle */}
          <p className="text-white/80 text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/donate" className="btn-donate text-base md:text-lg px-8 py-3">
              {t("hero.cta_donate")}
            </Link>
            <Link
              href="/about"
              className="border-2 border-white text-white font-bold text-base md:text-lg px-8 py-3 rounded-[var(--radius-md)] hover:bg-white/10 transition-colors inline-block text-center"
            >
              {t("hero.cta_about")}
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== 2. STATS STRIP ==================== */}
      <section className="bg-gold-300 py-6 md:py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center">
          <StatItem label={t("stats.volunteers")} value="+500" />
          <StatItem label={t("stats.calls_per_year")} value="+10,000" />
          <StatItem label={t("stats.years_active")} value="15" />
        </div>
      </section>

      {/* ==================== 3. MISSION / ABOUT TEASER ==================== */}
      <section className="py-16 md:py-[var(--spacing-section)] px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Image/video placeholder */}
          <div className="bg-stone rounded-[var(--radius-lg)] aspect-video flex items-center justify-center text-muted border border-dark/5 order-2 md:order-1">
            <span className="text-sm">תמונה / וידאו ארגוני</span>
          </div>
          {/* Text */}
          <div className="order-1 md:order-2">
            <h2 className="mb-4">{t("mission.title")}</h2>
            <p className="text-dark leading-[var(--line-height-body)] mb-6">
              {t("mission.text")}
            </p>
            <Link
              href="/about"
              className="inline-block border-2 border-navy-600 text-navy-600 font-bold text-sm px-6 py-2.5 rounded-[var(--radius-md)] hover:bg-navy-600 hover:text-white transition-colors"
            >
              {t("mission.link")}
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== 4. DONATION CTA BLOCK ==================== */}
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto bg-navy-800 text-white rounded-[var(--radius-xl)] py-12 px-6 md:px-12 text-center">
          <h2 className="text-white text-2xl md:text-3xl mb-2">
            {t("donate_block.title")}
          </h2>
          <p className="text-stone/70 mb-8">{t("donate_block.subtitle")}</p>

          {/* Preset amounts */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {presetAmounts.map((amount) => (
              <span
                key={amount}
                className="border-2 border-gold-500 text-white rounded-[var(--radius-md)] px-5 md:px-6 py-2.5 md:py-3 text-base md:text-lg font-bold cursor-pointer hover:bg-gold-500/10 transition-colors"
              >
                {tDonate("currency")}{amount}
              </span>
            ))}
            <span className="border-2 border-white/30 text-white/70 rounded-[var(--radius-md)] px-5 md:px-6 py-2.5 md:py-3 text-base md:text-lg cursor-pointer hover:border-white/50 transition-colors">
              {tDonate("custom_amount")}
            </span>
          </div>

          <Link href="/donate" className="btn-donate text-base md:text-lg px-10 py-3">
            {t("donate_block.cta")}
          </Link>
        </div>
      </section>

      {/* ==================== 5. LATEST NEWS ==================== */}
      <section className="py-16 md:py-[var(--spacing-section)] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2>{t("news.title")}</h2>
            <Link
              href="/news"
              className="text-navy-400 text-sm font-medium hover:text-navy-600 transition-colors"
            >
              {t("news.view_all")} ←
            </Link>
          </div>

          {/* News cards — placeholder data, will pull from Sanity in Epic 5 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsPlaceholders.map((item, i) => (
              <article
                key={i}
                className="bg-white rounded-[var(--radius-lg)] overflow-hidden border border-dark/5"
              >
                {/* Image placeholder */}
                <div className="aspect-video bg-stone flex items-center justify-center text-muted text-sm">
                  תמונה
                </div>
                <div className="p-[var(--spacing-card)]">
                  <span className="text-gold-700 text-xs font-bold">
                    {item.category}
                  </span>
                  <h3 className="mt-1.5 text-charcoal text-base">{item.title}</h3>
                  <div className="mt-2 h-[2px] bg-stone/80 w-full" />
                  <div className="mt-2 h-[2px] bg-stone/60 w-3/4" />
                  <p className="text-muted text-xs mt-3">{item.date}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-2xl md:text-4xl font-bold text-navy-800">
        {value}
      </span>
      <p className="text-navy-800 text-xs md:text-sm mt-1">{label}</p>
    </div>
  );
}

const newsPlaceholders = [
  { category: "עדכון שטח", title: "כותרת לדוגמה", date: "15 ינואר 2025" },
  { category: "סיפור מהשטח", title: "כותרת לדוגמה", date: "10 ינואר 2025" },
  { category: "הודעה", title: "כותרת לדוגמה", date: "5 ינואר 2025" },
];
