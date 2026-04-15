"use client";

import { useState } from "react";
import Image from "next/image";
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
    <header className="bg-navy-950/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-white/5 shadow-[0_2px_20px_rgba(0,0,0,0.15)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16 md:h-[72px]">
        {/* Logo + org name */}
        <Link href="/" className="flex items-center gap-3 text-white hover:text-white group">
          <div className="relative">
            <Image
              src="/logo.jpg"
              alt="צוות הצלה לוגו"
              width={44}
              height={44}
              className="rounded-full shrink-0 ring-2 ring-gold-500/30 group-hover:ring-gold-500/60 transition-all duration-300"
              priority
            />
          </div>
          <div className="leading-tight">
            <span className="text-lg font-bold block tracking-wide">צוות הצלה</span>
            <span className="text-[11px] text-white/50 block tracking-wider">Tzevet Hatzolah</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              className={`relative text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-all duration-300 ${
                pathname === href
                  ? "text-white bg-white/10"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >
              {t(key)}
            </Link>
          ))}
          <Link href="/donate" className="btn-donate text-sm py-2 px-6 mr-3">
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
            className="text-white/80 hover:text-white p-1.5 rounded-[var(--radius-sm)] hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300"
              style={{ transform: mobileOpen ? "rotate(90deg)" : "rotate(0)" }}
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="md:hidden bg-navy-950/98 backdrop-blur-lg border-t border-white/5 px-5 py-5 flex flex-col gap-1 animate-fade-in">
          {navLinks.map(({ href, key }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`text-sm font-medium py-2.5 px-4 rounded-[var(--radius-md)] transition-all duration-200 ${
                pathname === href
                  ? "text-white bg-white/10"
                  : "text-white/65 hover:text-white hover:bg-white/5"
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
