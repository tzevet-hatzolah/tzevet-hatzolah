import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContactContent />;
}

function ContactContent() {
  const t = useTranslations("contact");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <form className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("name")}
              </label>
              <input
                type="text"
                required
                className="w-full border border-dark/15 rounded-[var(--radius-md)] px-4 py-3 text-dark bg-white focus:outline-none focus:ring-2 focus:ring-navy-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-dark/15 rounded-[var(--radius-md)] px-4 py-3 text-dark bg-white focus:outline-none focus:ring-2 focus:ring-navy-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  className="w-full border border-dark/15 rounded-[var(--radius-md)] px-4 py-3 text-dark bg-white focus:outline-none focus:ring-2 focus:ring-navy-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">
                {t("message")}
              </label>
              <textarea
                required
                rows={5}
                className="w-full border border-dark/15 rounded-[var(--radius-md)] px-4 py-3 text-dark bg-white focus:outline-none focus:ring-2 focus:ring-navy-400 resize-none"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-dark cursor-pointer">
              <input
                type="checkbox"
                required
                className="mt-1 accent-navy-600"
              />
              <span>{t("consent")}</span>
            </label>

            <button type="submit" className="btn-donate self-start text-base px-8 py-3">
              {t("submit")}
            </button>
          </form>

          {/* Contact info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-stone rounded-[var(--radius-lg)] p-6">
              <h3 className="font-bold text-charcoal mb-3">פרטי התקשרות</h3>
              <div className="flex flex-col gap-2 text-sm text-dark">
                <p>📞 052-000-0000</p>
                <p>✉️ info@tzevet-hatzolah.org</p>
              </div>
            </div>
            <div className="bg-stone rounded-[var(--radius-lg)] p-6">
              <h3 className="font-bold text-charcoal mb-3">{t("whatsapp")}</h3>
              <p className="text-sm text-muted">
                קישור WhatsApp ייתווסף כשמספר הארגון יאושר
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
