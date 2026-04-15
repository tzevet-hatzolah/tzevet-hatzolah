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
    <main className="flex-1 flex items-center justify-center py-20 px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
        <p className="text-dark mb-8">{t("text")}</p>
        <Link href="/" className="btn-primary text-base px-8 py-3">
          {t("home_link")}
        </Link>
      </div>
    </main>
  );
}
