import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("not_found");

  return (
    <main className="flex-1 flex items-center justify-center py-24 px-6 relative">
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none" />
      <div className="text-center max-w-md relative z-10 animate-fade-up">
        <span className="text-7xl md:text-8xl font-[number:var(--font-weight-black)] text-gradient block">404</span>
        <h1 className="text-2xl font-bold mt-5 mb-3">{t("title")}</h1>
        <p className="text-dark/70 mb-10">{t("text")}</p>
        <Link href="/" className="btn-primary text-base px-10 py-3.5">
          {t("home_link")}
        </Link>
      </div>
    </main>
  );
}
