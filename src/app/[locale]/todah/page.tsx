import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ThankYouContent />;
}

function ThankYouContent() {
  const t = useTranslations("thank_you");

  return (
    <main className="flex-1 flex items-center justify-center py-24 px-6 relative">
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
      <div className="text-center max-w-md relative z-10 animate-fade-up">
        <div className="w-20 h-20 mx-auto mb-7 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center shadow-[0_4px_20px_rgba(34,197,94,0.15)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="text-3xl font-[number:var(--font-weight-black)] mb-4">{t("title")}</h1>
        <p className="text-dark/70 mb-10">{t("text")}</p>
        <Link href="/" className="btn-primary text-base px-10 py-3.5">
          {t("home_link")}
        </Link>
      </div>
    </main>
  );
}
