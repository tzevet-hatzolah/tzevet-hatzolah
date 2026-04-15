import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("not_found");

  return (
    <main className="flex-1 flex items-center justify-center py-20 px-6">
      <div className="text-center max-w-md">
        <span className="text-6xl font-bold text-navy-600">404</span>
        <h1 className="text-2xl font-bold mt-4 mb-2">{t("title")}</h1>
        <p className="text-dark mb-8">{t("text")}</p>
        <Link href="/" className="btn-primary text-base px-8 py-3">
          {t("home_link")}
        </Link>
      </div>
    </main>
  );
}
