import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { alternateLinks } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "donate" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: alternateLinks("/donate"),
  };
}

export default async function DonatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DonateContent />;
}

function DonateContent() {
  const t = useTranslations("donate");

  const presetAmounts = [50, 100, 250, 500];

  return (
    <main className="flex-1">
      <section className="page-header text-white py-12 sm:py-16 md:py-20 px-5 sm:px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-4 sm:mb-5" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)]">{t("title")}</h1>
          <p className="text-white/60 mt-2 sm:mt-3 text-sm sm:text-lg">{t("subtitle")}</p>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6">
        <AnimateOnScroll animation="fade-up">
          <div className="max-w-xl mx-auto">
            {/* Donation card */}
            <div className="card p-5 sm:p-8 md:p-10">
              {/* Donation type toggle */}
              <div className="flex rounded-[var(--radius-lg)] overflow-hidden border border-dark/10 mb-6 sm:mb-8">
                <button className="flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-navy-600 to-navy-800 text-white transition-all duration-300">
                  {t("one_time")}
                </button>
                <button className="flex-1 py-3 sm:py-3.5 text-xs sm:text-sm font-medium bg-white text-dark hover:bg-stone/50 transition-all duration-300">
                  {t("recurring")}
                </button>
              </div>

              {/* Amount presets */}
              <p className="text-xs sm:text-sm font-medium text-charcoal mb-2 sm:mb-3">
                {t("amount_label")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    className="border-2 border-gold-500/50 rounded-[var(--radius-md)] py-2.5 sm:py-3.5 text-base sm:text-lg font-bold text-charcoal hover:bg-gold-50 hover:border-gold-500 hover:shadow-[0_2px_12px_rgba(201,168,0,0.15)] transition-all duration-300"
                  >
                    {t("currency")}{amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder={t("custom_amount")}
                className="w-full border border-dark/10 rounded-[var(--radius-md)] px-3 sm:px-4 py-3 sm:py-3.5 text-dark bg-warm-white mb-6 sm:mb-8 focus:outline-none focus:ring-2 focus:ring-navy-400/40 focus:border-navy-400 transition-all duration-300 text-sm sm:text-base"
              />

              {/* Donor type */}
              <p className="text-xs sm:text-sm font-medium text-charcoal mb-2 sm:mb-3">
                {t("donor_type.label")}
              </p>
              <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8">
                <button className="flex-1 bg-gradient-to-r from-navy-600 to-navy-800 text-white rounded-[var(--radius-md)] py-3 sm:py-3.5 text-xs sm:text-sm font-bold shadow-[0_2px_12px_rgba(32,64,133,0.2)] transition-all duration-300">
                  {t("donor_type.israeli")}
                </button>
                <button className="flex-1 border-2 border-dark/10 text-dark rounded-[var(--radius-md)] py-3 sm:py-3.5 text-xs sm:text-sm font-medium hover:border-dark/25 transition-all duration-300">
                  {t("donor_type.international")}
                </button>
              </div>

              {/* Submit */}
              <button className="btn-donate w-full text-base sm:text-lg py-3.5 sm:py-4">
                {t("cta")}
              </button>

              {/* Trust signals */}
              <div className="flex justify-center gap-5 sm:gap-8 mt-5 sm:mt-7 text-[11px] sm:text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  {t("trust.secure")}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  {t("trust.registration")}
                </span>
              </div>
            </div>

            {/* Integration note */}
            <div className="mt-6 sm:mt-8 card p-5 sm:p-6 text-center text-xs sm:text-sm text-muted">
              <p>Sumit / JGive integration pending — redirect or iframe will be added here</p>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </main>
  );
}
