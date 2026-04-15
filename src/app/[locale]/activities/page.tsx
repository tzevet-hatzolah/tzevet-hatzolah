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
      <section className="page-header text-white py-16 md:py-20 px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-5" />
          <h1 className="text-3xl md:text-4xl font-[number:var(--font-weight-black)]">{t("title")}</h1>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card p-10 text-center text-muted">
            <p>תוכן העמוד ייטען מ-Sanity CMS</p>
          </div>
        </div>
      </section>
    </main>
  );
}
