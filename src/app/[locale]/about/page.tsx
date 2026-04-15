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
      <section className="page-header text-white py-16 md:py-20 px-6 text-center">
        <div className="relative z-10">
          <div className="section-line mx-auto mb-5" />
          <h1 className="text-3xl md:text-4xl font-[number:var(--font-weight-black)]">{t("title")}</h1>
        </div>
      </section>

      {/* Content — will be pulled from Sanity `page` schema */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="card p-10 text-center text-muted">
            <p>תוכן העמוד ייטען מ-Sanity CMS</p>
          </div>

          <div className="mt-14 text-center">
            <Link href="/donate" className="btn-donate text-lg px-10 py-3.5">
              תרמו עכשיו
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
