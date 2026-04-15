import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

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
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
        <p className="text-white/70 mt-2">{t("subtitle")}</p>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto">
          {/* Donation type toggle */}
          <div className="flex rounded-[var(--radius-lg)] overflow-hidden border border-dark/10 mb-8">
            <button className="flex-1 py-3 text-sm font-bold bg-navy-600 text-white">
              {t("one_time")}
            </button>
            <button className="flex-1 py-3 text-sm font-medium bg-white text-dark hover:bg-stone transition-colors">
              {t("recurring")}
            </button>
          </div>

          {/* Amount presets */}
          <p className="text-sm font-medium text-charcoal mb-3">
            {t("amount_label")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                className="border-2 border-gold-500 rounded-[var(--radius-md)] py-3 text-lg font-bold text-charcoal hover:bg-gold-50 transition-colors"
              >
                {t("currency")}{amount}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder={t("custom_amount")}
            className="w-full border border-dark/15 rounded-[var(--radius-md)] px-4 py-3 text-dark bg-white mb-8 focus:outline-none focus:ring-2 focus:ring-navy-400"
          />

          {/* Donor type */}
          <p className="text-sm font-medium text-charcoal mb-3">
            {t("donor_type.label")}
          </p>
          <div className="flex gap-3 mb-8">
            <button className="flex-1 border-2 border-navy-600 bg-navy-600 text-white rounded-[var(--radius-md)] py-3 text-sm font-bold">
              {t("donor_type.israeli")}
            </button>
            <button className="flex-1 border-2 border-dark/15 text-dark rounded-[var(--radius-md)] py-3 text-sm font-medium hover:border-dark/30 transition-colors">
              {t("donor_type.international")}
            </button>
          </div>

          {/* Submit */}
          <button className="btn-donate w-full text-lg py-4">
            {t("cta")}
          </button>

          {/* Trust signals */}
          <div className="flex justify-center gap-6 mt-6 text-xs text-muted">
            <span>🔒 {t("trust.secure")}</span>
            <span>✓ {t("trust.registration")}</span>
          </div>

          {/* Integration note */}
          <div className="mt-8 bg-stone rounded-[var(--radius-lg)] p-6 text-center text-sm text-muted">
            <p>Sumit / JGive integration pending — redirect or iframe will be added here</p>
          </div>
        </div>
      </section>
    </main>
  );
}
