"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  DONATION_MAX_PAYMENTS,
  DONATION_MIN_MONTHLY,
  DONATION_MIN_ONE_TIME,
} from "@/lib/donation-types";
import PaymentMethods from "@/components/PaymentMethods";
import { paypalDonateUrl } from "@/lib/payment-links";

export type PickerMode = "one_time" | "monthly";

export const ONE_TIME_PRESETS = [50, 100, 250, 500, 1000] as const;
export const MONTHLY_PRESETS = [18, 36, 72, 180, 360] as const;
export const MONTHLY_COMMITMENT_PRESETS = [6, 12, 18, 24, 36] as const;
export const GENERAL_MONTHLY_COMMITMENT = 12;

export default function DonationAmountPicker({
  mode,
  amount,
  months,
  customMode,
  customRaw,
  customMonthsMode,
  customMonthsRaw,
  onModeChange,
  onAmountChange,
  onMonthsChange,
  onCustomModeChange,
  onCustomRawChange,
  onCustomMonthsModeChange,
  onCustomMonthsRawChange,
  onContinue,
  onBit,
  onNedarim,
  trustSlot,
}: {
  mode: PickerMode;
  amount: number;
  months: number;
  customMode: boolean;
  customRaw: string;
  customMonthsMode: boolean;
  customMonthsRaw: string;
  onModeChange: (mode: PickerMode) => void;
  onAmountChange: (amount: number) => void;
  onMonthsChange: (months: number) => void;
  onCustomModeChange: (custom: boolean) => void;
  onCustomRawChange: (raw: string) => void;
  onCustomMonthsModeChange: (custom: boolean) => void;
  onCustomMonthsRawChange: (raw: string) => void;
  onContinue: () => void;
  onBit: () => void;
  onNedarim: () => void;
  trustSlot?: ReactNode;
}) {
  const t = useTranslations("donate.picker");
  const customInputRef = useRef<HTMLInputElement>(null);
  const customMonthsInputRef = useRef<HTMLInputElement>(null);

  const presets = mode === "monthly" ? MONTHLY_PRESETS : ONE_TIME_PRESETS;
  const minAmount = mode === "monthly" ? DONATION_MIN_MONTHLY : DONATION_MIN_ONE_TIME;

  useEffect(() => {
    // Snap to a valid preset when switching modes if current amount is below min.
    if (amount < minAmount) {
      onAmountChange(presets[1] ?? presets[0]);
      onCustomModeChange(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const customN = parseInt(customRaw, 10);
  const customInvalid =
    customMode && customRaw.length > 0 && (Number.isNaN(customN) || customN < minAmount);

  const customMonthsN = parseInt(customMonthsRaw, 10);
  const customMonthsInvalid =
    customMonthsMode &&
    customMonthsRaw.length > 0 &&
    (Number.isNaN(customMonthsN) ||
      customMonthsN < 1 ||
      customMonthsN > DONATION_MAX_PAYMENTS);

  return (
    <div className="bg-warm-white rounded-[var(--radius-xl)] shadow-[var(--shadow-card)] p-5 sm:p-6">
      {/* Mode toggle */}
      <div className="flex rounded-full bg-stone/70 p-1 mb-5 sm:mb-6">
        <ModeButton
          active={mode === "one_time"}
          onClick={() => onModeChange("one_time")}
          label={t("mode_one_time")}
        />
        <ModeButton
          active={mode === "monthly"}
          onClick={() => onModeChange("monthly")}
          label={t("mode_monthly", { months: GENERAL_MONTHLY_COMMITMENT })}
        />
      </div>

      <div className="text-xs font-[number:var(--font-weight-bold)] text-charcoal mb-2">
        {t("amount_label")}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {presets.map((p) => {
          const active = !customMode && amount === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => {
                onCustomModeChange(false);
                onAmountChange(p);
              }}
              aria-pressed={active}
              className={`px-3 py-2.5 sm:py-3 rounded-[var(--radius-md)] text-sm sm:text-base font-[number:var(--font-weight-bold)] tabular-nums transition-all duration-200 ${
                active
                  ? "border-2 border-gold-500 bg-gold-50 text-navy-950 shadow-[var(--shadow-glow-gold)]"
                  : "border-2 border-dark/10 bg-white text-dark hover:border-dark/25"
              }`}
            >
              ₪{p.toLocaleString("he-IL")}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            onCustomModeChange(true);
            customInputRef.current?.focus();
          }}
          aria-pressed={customMode}
          className={`px-3 py-2.5 sm:py-3 rounded-[var(--radius-md)] text-sm sm:text-base font-[number:var(--font-weight-bold)] transition-all duration-200 col-span-3 ${
            customMode
              ? "border-2 border-gold-500 bg-gold-50 text-navy-950 shadow-[var(--shadow-glow-gold)]"
              : "border-2 border-dark/10 bg-white text-dark hover:border-dark/25"
          }`}
        >
          {t("custom_label")}
        </button>
      </div>

      {customMode ? (
        <div className="mb-3">
          <div className="relative">
            <span className="absolute top-1/2 -translate-y-1/2 end-3 text-muted text-base font-[number:var(--font-weight-bold)] pointer-events-none">
              ₪
            </span>
            <input
              ref={customInputRef}
              type="number"
              inputMode="numeric"
              min={minAmount}
              value={customRaw}
              onChange={(e) => {
                onCustomRawChange(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n) && n >= minAmount) {
                  onAmountChange(n);
                }
              }}
              placeholder={t("custom_placeholder")}
              className={`w-full rounded-[var(--radius-md)] px-3 py-2.5 sm:py-3 ps-10 bg-white text-charcoal text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-all ${
                customInvalid
                  ? "border-2 border-red-400"
                  : "border-2 border-dark/10 focus:border-navy-400"
              }`}
              aria-invalid={customInvalid ? "true" : "false"}
            />
          </div>
          {customInvalid ? (
            <div className="text-[11px] text-red-600 mt-1.5">
              {t("min_error", { min: minAmount })}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "monthly" ? (
        <>
          <div className="text-xs font-[number:var(--font-weight-bold)] text-charcoal mb-2 mt-2">
            {t("months_label")}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {MONTHLY_COMMITMENT_PRESETS.map((m) => {
              const active = !customMonthsMode && months === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onCustomMonthsModeChange(false);
                    onMonthsChange(m);
                  }}
                  aria-pressed={active}
                  className={`px-3 py-2.5 rounded-[var(--radius-md)] text-sm sm:text-base font-[number:var(--font-weight-bold)] tabular-nums transition-all duration-200 ${
                    active
                      ? "border-2 border-gold-500 bg-gold-50 text-navy-950 shadow-[var(--shadow-glow-gold)]"
                      : "border-2 border-dark/10 bg-white text-dark hover:border-dark/25"
                  }`}
                >
                  {m}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                onCustomMonthsModeChange(true);
                customMonthsInputRef.current?.focus();
              }}
              aria-pressed={customMonthsMode}
              className={`px-3 py-2.5 rounded-[var(--radius-md)] text-sm sm:text-base font-[number:var(--font-weight-bold)] transition-all duration-200 col-span-3 ${
                customMonthsMode
                  ? "border-2 border-gold-500 bg-gold-50 text-navy-950 shadow-[var(--shadow-glow-gold)]"
                  : "border-2 border-dark/10 bg-white text-dark hover:border-dark/25"
              }`}
            >
              {t("months_custom")}
            </button>
          </div>

          {customMonthsMode ? (
            <div className="mb-3">
              <input
                ref={customMonthsInputRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={DONATION_MAX_PAYMENTS}
                value={customMonthsRaw}
                onChange={(e) => {
                  onCustomMonthsRawChange(e.target.value);
                  const n = parseInt(e.target.value, 10);
                  if (!Number.isNaN(n) && n >= 1 && n <= DONATION_MAX_PAYMENTS) {
                    onMonthsChange(n);
                  }
                }}
                placeholder={t("months_custom_placeholder")}
                className={`w-full rounded-[var(--radius-md)] px-3 py-2.5 bg-white text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-all ${
                  customMonthsInvalid
                    ? "border-2 border-red-400"
                    : "border-2 border-dark/10 focus:border-navy-400"
                }`}
                aria-invalid={customMonthsInvalid ? "true" : "false"}
              />
              {customMonthsInvalid ? (
                <div className="text-[11px] text-red-600 mt-1.5">
                  {t("months_custom_error")}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <div className="mt-3 pt-3 border-t border-dark/10">
        <div className="text-sm sm:text-base text-charcoal font-[number:var(--font-weight-bold)] leading-relaxed mb-3">
          {mode === "monthly"
            ? t("monthly_helper", {
                monthly: amount.toLocaleString("he-IL"),
                months,
                total: (amount * months).toLocaleString("he-IL"),
              })
            : t("one_time_helper", { total: amount.toLocaleString("he-IL") })}
        </div>
        <PaymentMethods
          isRecurring={mode === "monthly"}
          paypalUrl={paypalDonateUrl(amount)}
          onCredit={onContinue}
          onBit={onBit}
          onNedarim={onNedarim}
        />
      </div>

      {trustSlot ? <div className="mt-4">{trustSlot}</div> : null}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-[number:var(--font-weight-bold)] transition-all duration-200 ${
        active
          ? "bg-gradient-to-l from-gold-300 to-gold-500 text-navy-950 shadow-md"
          : "text-dark/75 hover:text-charcoal"
      }`}
    >
      {label}
    </button>
  );
}
