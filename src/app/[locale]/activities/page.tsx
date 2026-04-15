import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function ActivitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ActivitiesContent />;
}

function ActivitiesContent() {
  const t = useTranslations("activities");

  return (
    <main className="flex-1">
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-stone rounded-[var(--radius-lg)] p-8 text-center text-muted">
            <p>תוכן העמוד ייטען מ-Sanity CMS</p>
          </div>
        </div>
      </section>
    </main>
  );
}
