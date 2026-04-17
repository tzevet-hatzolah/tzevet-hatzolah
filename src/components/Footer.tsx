import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { client } from "@/sanity/lib/client";
import { siteSettingsQuery } from "@/sanity/lib/queries";

type FooterSettings = {
  phone?: string;
  email?: string;
  address?: string;
  registrationNumber?: string;
  socialLinks?: {
    whatsappChannel?: string;
    telegram?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
} | null;

type SocialKey = "whatsapp" | "telegram" | "instagram" | "youtube" | "facebook";

const socialIcons: Record<SocialKey, React.ReactNode> = {
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.149-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.392" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
};

export default async function Footer() {
  const t = await getTranslations();
  const settings = await client
    .fetch<FooterSettings>(siteSettingsQuery)
    .catch(() => null);

  const socials: Array<{ key: SocialKey; href: string; label: string }> = [];
  if (settings?.socialLinks?.whatsappChannel) {
    socials.push({
      key: "whatsapp",
      href: settings.socialLinks.whatsappChannel,
      label: "WhatsApp Channel",
    });
  }
  if (settings?.socialLinks?.telegram) {
    socials.push({
      key: "telegram",
      href: settings.socialLinks.telegram,
      label: "Telegram",
    });
  }
  if (settings?.socialLinks?.instagram) {
    socials.push({
      key: "instagram",
      href: settings.socialLinks.instagram,
      label: "Instagram",
    });
  }
  if (settings?.socialLinks?.youtube) {
    socials.push({
      key: "youtube",
      href: settings.socialLinks.youtube,
      label: "YouTube",
    });
  }
  if (settings?.socialLinks?.facebook) {
    socials.push({
      key: "facebook",
      href: settings.socialLinks.facebook,
      label: "Facebook",
    });
  }

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
                <Link href="/stories" className="text-sm text-white/50 hover:text-gold-300 transition-colors duration-300">
                  {t("nav.stories")}
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
                {settings?.phone && (
                  <a href={`tel:${settings.phone.replace(/\s|-/g, "")}`} className="hover:text-gold-300 transition-colors duration-300">
                    {settings.phone}
                  </a>
                )}
                {settings?.email && (
                  <a href={`mailto:${settings.email}`} className="hover:text-gold-300 transition-colors duration-300">
                    {settings.email}
                  </a>
                )}
                {settings?.address && <p>{settings.address}</p>}
              </div>
            </div>

            {/* Column 4: Social */}
            <div>
              <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
                {t("footer.social_title")}
              </h3>
              {socials.length > 0 && (
                <div className="flex gap-2">
                  {socials.map(({ key, label, href }) => (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="w-10 h-10 rounded-full bg-navy-400 text-white flex items-center justify-center shrink-0 hover:bg-navy-400/80 hover:scale-105 transition-all duration-300"
                    >
                      <span className="block w-[18px] h-[18px]">{socialIcons[key]}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/30">
            <div className="flex items-center gap-2">
              {settings?.registrationNumber && (
                <>
                  <span>ע&quot;ר {settings.registrationNumber}</span>
                  <span className="text-white/15">|</span>
                </>
              )}
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
