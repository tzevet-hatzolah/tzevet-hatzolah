import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations();

  return (
    <footer className="relative overflow-hidden">
      {/* Main footer */}
      <div className="bg-navy-950 text-white">
        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-300 to-gold-500" />

        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Column 1: Brand */}
            <div className="md:col-span-1">
              <span className="text-xl font-[number:var(--font-weight-black)] block mb-2">צוות הצלה</span>
              <span className="text-white/40 text-sm block mb-4">Tzevet Hatzolah</span>
              <div className="section-line mb-5" />
              <p className="text-white/50 text-sm leading-relaxed">
                ארגון חירום והצלה התנדבותי הפועל להצלת חיים
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
                {t("footer.nav_title")}
              </h3>
              <nav className="flex flex-col gap-3">
                <Link href="/about" className="text-sm text-white/50 hover:text-gold-300 transition-colors duration-300">
                  {t("nav.about")}
                </Link>
                <Link href="/activities" className="text-sm text-white/50 hover:text-gold-300 transition-colors duration-300">
                  {t("nav.activities")}
                </Link>
                <Link href="/news" className="text-sm text-white/50 hover:text-gold-300 transition-colors duration-300">
                  {t("nav.news")}
                </Link>
                <Link href="/contact" className="text-sm text-white/50 hover:text-gold-300 transition-colors duration-300">
                  {t("nav.contact")}
                </Link>
              </nav>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
                {t("footer.contact_title")}
              </h3>
              <div className="flex flex-col gap-3 text-sm text-white/50">
                <p>{t("footer.contact_phone")}</p>
                <p>{t("footer.contact_email")}</p>
                <p>{t("footer.contact_address")}</p>
              </div>
            </div>

            {/* Column 4: Social */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
                {t("footer.social_title")}
              </h3>
              <div className="flex gap-3">
                {["FB", "IG", "YT"].map((label) => (
                  <span
                    key={label}
                    className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-white/40 text-xs font-bold hover:bg-gold-500/20 hover:text-gold-300 transition-all duration-300 cursor-pointer"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <div className="flex items-center gap-2">
              <span>ע&quot;ר 580XXXXXX</span>
              <span className="text-white/15">|</span>
              <span>{t("footer.rights")} {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-5">
              <Link href="/negishot" className="hover:text-white/60 transition-colors duration-300">
                {t("footer.accessibility")}
              </Link>
              <Link href="/privacy" className="hover:text-white/60 transition-colors duration-300">
                {t("footer.privacy")}
              </Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors duration-300">
                {t("footer.terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
