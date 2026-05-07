"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import {
  type DonationItem,
  DONATION_PAYMENT_OPTIONS,
  DONATION_MIN_MONTHLY,
  monthlyFor,
  maxPaymentsFor,
} from "@/lib/donation-types";
import { DONATION_ICONS } from "@/components/DonationIcons";

export default function DonationModal({
  item,
  locale,
  onClose,
}: {
  item: DonationItem;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("home.donate_block.modal");
  const router = useRouter();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const total = item.totalAmount ?? 0;
  const defaultPayments = item.defaultPayments ?? 18;
  const maxPayments = maxPaymentsFor(total);

  const [payments, setPayments] = useState<number>(defaultPayments);
  const [customMode, setCustomMode] = useState(false);
  const [customRaw, setCustomRaw] = useState("");

  const selectablePresets = useMemo(
    () => DONATION_PAYMENT_OPTIONS.filter((p) => p <= maxPayments),
    [maxPayments]
  );

  const customN = parseInt(customRaw, 10);
  const customError =
    customMode &&
    customRaw.length > 0 &&
    (Number.isNaN(customN) || customN < 1 || customN > maxPayments);

  const monthly = monthlyFor(total, payments);
  const billedTotal = monthly * payments;

  const name = locale === "en" && item.nameEn ? item.nameEn : item.name;
  const description =
    locale === "en" && item.descriptionEn ? item.descriptionEn : item.description;
  const impact =
    locale === "en" && item.impactTextEn ? item.impactTextEn : item.impactText;

  const Icon = DONATION_ICONS[item.icon ?? "heart"] ?? DONATION_ICONS.heart;
  const imageUrl = item.image?.asset
    ? urlFor(item.image).width(900).height(1100).auto("format").url()
    : null;

  useEffect(() => {
    closeBtnRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const onPickPreset = (n: number) => {
    setCustomMode(false);
    setPayments(n);
  };

  const onPickCustom = () => {
    setCustomMode(true);
    customInputRef.current?.focus();
  };

  const onCustomChange = (raw: string) => {
    setCustomRaw(raw);
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= maxPayments) {
      setPayments(n);
    }
  };

  const onContinue = () => {
    if (customMode && customError) return;
    const params = new URLSearchParams();
    params.set("total", String(billedTotal));
    params.set("payments", String(payments));
    params.set("item", item.slug);
    router.push(`/donate?${params.toString()}`);
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        className="modal-panel relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-warm-white rounded-[var(--radius-xl)] sm:rounded-[var(--radius-2xl)] shadow-[var(--shadow-elevated)] grid grid-cols-1 md:grid-cols-[3fr_4fr]"
      >
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-3 start-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/95 text-charcoal shadow-md hover:bg-white hover:scale-105 active:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:ring-offset-2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Form panel */}
        <div className="order-2 md:order-1 p-6 sm:p-7 md:p-8 flex flex-col">
          <h3
            id="donation-modal-title"
            className="text-xl sm:text-2xl md:text-[length:var(--font-size-h2)] font-[number:var(--font-weight-black)] text-navy-950 leading-tight mb-3"
          >
            {name}
          </h3>

          {total > 0 ? (
            <div className="mb-4">
              <div className="text-2xl sm:text-3xl md:text-4xl font-[number:var(--font-weight-black)] text-gold-700 leading-none mb-1.5">
                {payments === 1
                  ? `₪${total.toLocaleString("he-IL")}`
                  : `₪${monthly.toLocaleString("he-IL")} × ${payments}`}
              </div>
              {payments > 1 ? (
                <div className="text-xs sm:text-sm text-muted">
                  {t("total_label")} ₪{billedTotal.toLocaleString("he-IL")}
                </div>
              ) : null}
            </div>
          ) : null}

          <p className="text-sm text-dark/85 leading-relaxed mb-4">
            {description}
          </p>

          {impact ? (
            <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[rgba(184,194,0,0.3)] bg-[rgba(232,246,47,0.12)] px-3.5 py-3 mb-5">
              <span className="hi-vis-dot mt-1.5 shrink-0" aria-hidden />
              <div>
                <div className="text-[11px] sm:text-xs font-[number:var(--font-weight-bold)] text-navy-950 mb-0.5">
                  {t("impact_label")}
                </div>
                <div className="text-xs sm:text-sm text-dark leading-snug">
                  {impact}
                </div>
              </div>
            </div>
          ) : null}

          <div className="text-xs font-[number:var(--font-weight-bold)] text-charcoal mb-2">
            {t("plan_label")}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {selectablePresets.map((n) => {
              const active = !customMode && payments === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onPickPreset(n)}
                  aria-pressed={active}
                  aria-label={
                    n === 1
                      ? t("single_payment")
                      : `${n} ${t("plan_label")}`
                  }
                  className={`px-3 py-2.5 sm:py-3 rounded-[var(--radius-md)] text-sm sm:text-base font-[number:var(--font-weight-bold)] tabular-nums transition-all duration-200 ${
                    active
                      ? "border-2 border-gold-500 bg-gold-50 text-navy-950 shadow-[var(--shadow-glow-gold)]"
                      : "border-2 border-dark/10 bg-white text-dark hover:border-dark/25"
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onPickCustom}
              aria-pressed={customMode}
              className={`px-3 py-2.5 sm:py-3 rounded-[var(--radius-md)] text-sm sm:text-base font-[number:var(--font-weight-bold)] transition-all duration-200 ${
                customMode
                  ? "border-2 border-gold-500 bg-gold-50 text-navy-950 shadow-[var(--shadow-glow-gold)]"
                  : "border-2 border-dark/10 bg-white text-dark hover:border-dark/25"
              }`}
            >
              {t("custom")}
            </button>
          </div>

          {customMode ? (
            <div className="mb-3">
              <input
                ref={customInputRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={maxPayments}
                value={customRaw}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder={t("custom_placeholder")}
                className={`w-full rounded-[var(--radius-md)] px-3 py-2.5 bg-white text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-all ${
                  customError
                    ? "border-2 border-red-400"
                    : "border-2 border-dark/10 focus:border-navy-400"
                }`}
                aria-invalid={customError ? "true" : "false"}
                aria-describedby={customError ? "custom-error" : undefined}
              />
              {customError ? (
                <div
                  id="custom-error"
                  className="text-[11px] text-red-600 mt-1.5"
                >
                  {t("custom_error", {
                    min: DONATION_MIN_MONTHLY,
                    max: maxPayments,
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-auto pt-4 border-t border-dark/10">
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-xs sm:text-sm text-muted">
                {t("total_label")}
              </span>
              <span className="text-xl sm:text-2xl font-[number:var(--font-weight-black)] text-navy-950">
                ₪{billedTotal.toLocaleString("he-IL")}
              </span>
            </div>
            <button
              type="button"
              onClick={onContinue}
              disabled={Boolean(customError) || billedTotal < DONATION_MIN_MONTHLY}
              className="btn-donate w-full text-sm sm:text-base py-3 sm:py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("cta")}
            </button>
          </div>
        </div>

        {/* Photo / icon panel */}
        <div className="order-1 md:order-2 relative h-44 sm:h-52 md:h-auto md:min-h-[420px] overflow-hidden">
          {imageUrl ? (
            <div className="duotone-navy absolute inset-0">
              <Image
                src={imageUrl}
                alt={item.image?.alt || name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-600 to-navy-400 flex items-center justify-center">
              <Icon className="text-white/80 w-24 h-24" />
            </div>
          )}
          <span className="absolute top-3 end-3 z-10 inline-flex items-center bg-gradient-to-l from-gold-300 to-gold-500 text-navy-950 text-xs font-[number:var(--font-weight-black)] tracking-wide px-3 py-1 rounded-full shadow-md">
            {t("badge")}
          </span>
        </div>
      </div>
    </div>
  );
}
