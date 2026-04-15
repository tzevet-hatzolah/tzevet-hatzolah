import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-stone text-dark">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Navigation (ניווט) */}
          <div>
            <h3 className="text-charcoal font-bold text-base mb-4">
              {t("footer.nav_title")}
            </h3>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-dark hover:text-navy-600">
                {t("nav.about")}
              </Link>
              <Link href="/activities" className="text-sm text-dark hover:text-navy-600">
                {t("nav.activities")}
              </Link>
              <Link href="/news" className="text-sm text-dark hover:text-navy-600">
                {t("nav.news")}
              </Link>
              <Link href="/contact" className="text-sm text-dark hover:text-navy-600">
                {t("nav.contact")}
              </Link>
            </nav>
          </div>

          {/* Column 2: Contact (צרו קשר) */}
          <div>
            <h3 className="text-charcoal font-bold text-base mb-4">
              {t("footer.contact_title")}
            </h3>
            <div className="flex flex-col gap-2 text-sm text-dark">
              <p>{t("footer.contact_phone")} · {t("footer.contact_email")} · {t("footer.contact_address")}</p>
            </div>
          </div>

          {/* Column 3: Social (עקבו אחרינו) */}
          <div>
            <h3 className="text-charcoal font-bold text-base mb-4">
              {t("footer.social_title")}
            </h3>
            {/* Social icon placeholders — will be replaced with real icons + links from siteSettings */}
            <div className="flex gap-3">
              <span className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center text-dark/50 text-xs">FB</span>
              <span className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center text-dark/50 text-xs">IG</span>
              <span className="w-10 h-10 rounded-full bg-dark/10 flex items-center justify-center text-dark/50 text-xs">YT</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-dark/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-1">
            <span>ע&quot;ר 580XXXXXX</span>
            <span>·</span>
            <span>{t("footer.rights")} {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <Link href="/negishot" className="hover:text-dark">
              {t("footer.accessibility")}
            </Link>
            <Link href="/privacy" className="hover:text-dark">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-dark">
              {t("footer.terms")}
            </Link>
          </div>
          <span className="text-muted font-bold">צוות הצלה</span>
        </div>
      </div>
    </footer>
  );
}
