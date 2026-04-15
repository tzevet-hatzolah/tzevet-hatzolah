import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import AnimateOnScroll from "@/components/AnimateOnScroll";

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
      <section className="page-header text-white py-12 sm:py-16 md:py-20 px-5 sm:px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-4 sm:mb-5" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)]">{t("title")}</h1>
        </div>
      </section>

      <section className="py-10 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Contact form card */}
          <AnimateOnScroll animation="fade-up">
            <div className="card p-5 sm:p-8 md:p-10">
              <form className="flex flex-col gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-charcoal mb-1 sm:mb-1.5">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-dark/10 rounded-[var(--radius-md)] px-3 sm:px-4 py-3 sm:py-3.5 text-dark bg-warm-white focus:outline-none focus:ring-2 focus:ring-navy-400/40 focus:border-navy-400 transition-all duration-300 text-sm sm:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-charcoal mb-1 sm:mb-1.5">
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full border border-dark/10 rounded-[var(--radius-md)] px-3 sm:px-4 py-3 sm:py-3.5 text-dark bg-warm-white focus:outline-none focus:ring-2 focus:ring-navy-400/40 focus:border-navy-400 transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-charcoal mb-1 sm:mb-1.5">
                      {t("phone")}
                    </label>
                    <input
                      type="tel"
                      className="w-full border border-dark/10 rounded-[var(--radius-md)] px-3 sm:px-4 py-3 sm:py-3.5 text-dark bg-warm-white focus:outline-none focus:ring-2 focus:ring-navy-400/40 focus:border-navy-400 transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-charcoal mb-1 sm:mb-1.5">
                    {t("message")}
                  </label>
                  <textarea
                    required
                    rows={5}
                    className="w-full border border-dark/10 rounded-[var(--radius-md)] px-3 sm:px-4 py-3 sm:py-3.5 text-dark bg-warm-white focus:outline-none focus:ring-2 focus:ring-navy-400/40 focus:border-navy-400 transition-all duration-300 resize-none text-sm sm:text-base"
                  />
                </div>

                <label className="flex items-start gap-2 sm:gap-2.5 text-xs sm:text-sm text-dark cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 accent-navy-600"
                  />
                  <span>{t("consent")}</span>
                </label>

                <button type="submit" className="btn-donate self-start text-sm sm:text-base px-8 sm:px-10 py-3 sm:py-3.5">
                  {t("submit")}
                </button>
              </form>
            </div>
          </AnimateOnScroll>

          {/* Contact info */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <AnimateOnScroll animation="fade-up" delay={0}>
              <div className="card p-5 sm:p-7 group hover:border-navy-100 hover-lift">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-navy-50 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-navy-100 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <h3 className="font-bold text-charcoal mb-2 text-sm sm:text-base">פרטי התקשרות</h3>
                <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-dark/70">
                  <p>052-000-0000</p>
                  <p>info@tzevet-hatzolah.org</p>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-up" delay={120}>
              <div className="card p-5 sm:p-7 group hover:border-navy-100 hover-lift">
                <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-navy-50 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-navy-100 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 className="font-bold text-charcoal mb-2 text-sm sm:text-base">{t("whatsapp")}</h3>
                <p className="text-xs sm:text-sm text-muted">
                  קישור WhatsApp ייתווסף כשמספר הארגון יאושר
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </main>
  );
}
