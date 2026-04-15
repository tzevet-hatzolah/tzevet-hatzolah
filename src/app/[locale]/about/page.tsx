import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations("about");

  return (
    <main className="flex-1">
      {/* Page header */}
      <section className="bg-navy-600 text-white py-14 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">{t("title")}</h1>
      </section>

      {/* Content — will be pulled from Sanity `page` schema */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-stone rounded-[var(--radius-lg)] p-8 text-center text-muted">
            <p>תוכן העמוד ייטען מ-Sanity CMS</p>
          </div>

          <div className="mt-12 text-center">
            <Link href="/donate" className="btn-donate text-lg px-8 py-3">
              תרמו עכשיו
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
