import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewsContent />;
}

function NewsContent() {
  const t = useTranslations("news_page");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Placeholder — will be replaced by Sanity-driven ISR content in Epic 5 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <article
                key={i}
                className="bg-white rounded-[var(--radius-lg)] overflow-hidden border border-dark/5"
              >
                <div className="aspect-video bg-stone flex items-center justify-center text-muted text-sm">
                  תמונה
                </div>
                <div className="p-[var(--spacing-card)]">
                  <span className="text-gold-700 text-xs font-bold">חדשות</span>
                  <h3 className="mt-1.5 text-charcoal text-base">כותרת לדוגמה</h3>
                  <p className="text-muted text-sm mt-2">תקציר קצר של הכתבה...</p>
                  <p className="text-muted text-xs mt-3">15 ינואר 2025</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
