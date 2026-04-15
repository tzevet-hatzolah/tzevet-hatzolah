"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const navLinks = [
  { href: "/contact", key: "contact" },
  { href: "/activities", key: "activities" },
  { href: "/news", key: "news" },
  { href: "/about", key: "about" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-navy-800 text-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16 md:h-[72px]">
        {/* Logo + org name */}
        <Link href="/" className="flex items-center gap-3 text-white hover:text-white">
          {/* Logo placeholder circle */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
            לוגו
          </div>
          <div className="leading-tight">
            <span className="text-lg font-bold block">צוות הצלה</span>
            <span className="text-[11px] text-white/60 block">Tzevet Hatzolah</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {t(key)}
            </Link>
          ))}
          <Link href="/donate" className="btn-donate text-sm py-2 px-5 mr-2">
            {t("donate")}
          </Link>
        </nav>

        {/* Mobile: donate + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link href="/donate" className="btn-donate text-xs py-1.5 px-4">
            {t("donate")}
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-1"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="md:hidden bg-navy-950 border-t border-white/10 px-4 py-4 flex flex-col gap-3">
          {navLinks.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium py-1 ${
                pathname === href
                  ? "text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {t(key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
