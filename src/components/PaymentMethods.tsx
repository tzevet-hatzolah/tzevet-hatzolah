"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  JGIVE_URL,
} from "@/lib/payment-links";

type Props = {
  isRecurring: boolean;
  paypalUrl: string;
  onCredit: () => void;
  onBit: () => void;
  onBank: () => void;
  onBankDetails: () => void;
  onNedarim: () => void;
};

export default function PaymentMethods({
  isRecurring,
  paypalUrl,
  onCredit,
  onBit,
  onBank,
  onBankDetails,
  onNedarim,
}: Props) {
  const t = useTranslations("donate.picker");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleDocClick(e: MouseEvent) {
      if (!moreWrapRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [moreOpen]);

  return (
    <div>
      <div className="text-xs font-[number:var(--font-weight-bold)] text-charcoal mb-2">
        {t("pay_methods_label")}
      </div>

      <button
        type="button"
        onClick={onCredit}
        className="w-full rounded-[var(--radius-md)] border-2 border-gold-500 bg-gradient-to-l from-gold-300 to-gold-500 text-navy-950 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 px-4 py-3.5 min-h-[60px]"
      >
        <CreditCardIcon />
        <span className="text-sm sm:text-base font-[number:var(--font-weight-bold)]">
          {t("pay_credit")}
        </span>
      </button>

      <div className="mt-2 text-[11px] sm:text-xs text-muted text-center">
        {t("pay_alt_or")}
      </div>

      <div
        className={`mt-2 grid gap-2 sm:gap-3 ${
          isRecurring ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {isRecurring ? null : (
          <TileButton onClick={onBit} ariaLabel={t("pay_bit")}>
            <BitMark />
          </TileButton>
        )}
        <TileLink href={paypalUrl} ariaLabel={t("pay_paypal")}>
          <PaypalMark />
        </TileLink>
        <div ref={moreWrapRef} className={`relative ${moreOpen ? "z-50" : ""}`}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            className="w-full h-full min-h-[60px] rounded-[var(--radius-md)] border border-dark/10 bg-white hover:border-dark/25 transition-all flex flex-col items-center justify-center gap-1 px-2 py-2 text-charcoal"
          >
            <MoreIcon />
            <span className="text-[11px] sm:text-xs font-[number:var(--font-weight-bold)] leading-tight text-center">
              {t("pay_more")}
            </span>
          </button>
          {moreOpen ? (
            <div
              role="menu"
              className="absolute z-50 inset-x-0 top-full mt-1 rounded-[var(--radius-md)] bg-warm-white border border-dark/10 shadow-[var(--shadow-elevated)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  onNedarim();
                }}
                role="menuitem"
                className="block w-full px-3.5 py-2.5 text-sm text-charcoal hover:bg-navy-50 text-start"
              >
                {t("pay_nedarim")}
              </button>
              <a
                href={JGIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="block px-3.5 py-2.5 text-sm text-charcoal hover:bg-navy-50 text-start border-t border-dark/5"
              >
                {t("pay_jgive")}
              </a>
              {isRecurring ? null : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onBank();
                    }}
                    role="menuitem"
                    className="block w-full px-3.5 py-2.5 text-sm text-charcoal hover:bg-navy-50 text-start border-t border-dark/5"
                  >
                    {t("pay_bank")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onBankDetails();
                    }}
                    role="menuitem"
                    className="block w-full px-3.5 py-2.5 text-sm text-charcoal hover:bg-navy-50 text-start border-t border-dark/5"
                  >
                    {t("pay_bank_details")}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
      {isRecurring ? (
        <p className="mt-2 text-[11px] sm:text-xs text-muted leading-snug">
          {t("paypal_recurring_hint")}
        </p>
      ) : null}
    </div>
  );
}

function TileButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="rounded-[var(--radius-md)] border border-dark/10 bg-white hover:border-dark/25 transition-all duration-200 flex items-center justify-center px-3 py-2 min-h-[60px]"
    >
      {children}
    </button>
  );
}

function TileLink({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="rounded-[var(--radius-md)] border border-dark/10 bg-white hover:border-dark/25 transition-all duration-200 flex items-center justify-center px-3 py-2 min-h-[60px]"
    >
      {children}
    </a>
  );
}

function CreditCardIcon() {
  return (
    <svg
      width="26"
      height="18"
      viewBox="0 0 26 18"
      fill="none"
      aria-hidden
    >
      <rect x="0.75" y="0.75" width="24.5" height="16.5" rx="2.5" fill="#fff" stroke="#0C1A38" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect x="0.75" y="3" width="24.5" height="3" fill="#0C1A38" fillOpacity="0.85" />
      <rect x="3" y="11" width="8" height="1.5" rx="0.75" fill="#0C1A38" fillOpacity="0.5" />
      <circle cx="17" cy="12" r="2.75" fill="#C9A800" />
      <circle cx="19.75" cy="12" r="2.75" fill="#E2483F" fillOpacity="0.85" />
    </svg>
  );
}

function BitMark() {
  return (
    <Image
      src="/bit-logo.png"
      alt=""
      width={48}
      height={48}
      className="h-11 w-11 sm:h-12 sm:w-12 object-contain"
    />
  );
}

function PaypalMark() {
  return (
    <span
      dir="ltr"
      aria-hidden="true"
      className="inline-flex items-baseline text-lg sm:text-xl leading-none font-black italic tracking-tight"
    >
      <span style={{ color: "#003087" }}>Pay</span>
      <span style={{ color: "#006EA6" }}>Pal</span>
    </span>
  );
}

function MoreIcon() {
  return (
    <svg width="22" height="6" viewBox="0 0 22 6" fill="currentColor" aria-hidden>
      <circle cx="3" cy="3" r="2.5" />
      <circle cx="11" cy="3" r="2.5" />
      <circle cx="19" cy="3" r="2.5" />
    </svg>
  );
}
