"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import DonateForm from "@/components/DonateForm";
import DonationAmountPicker, {
  type PickerMode,
  GENERAL_MONTHLY_COMMITMENT,
  ONE_TIME_PRESETS,
} from "@/components/DonationAmountPicker";
import NedarimIframeModal from "@/components/NedarimIframeModal";
import TrustStrip from "@/components/TrustStrip";
import { useIsClient } from "@/lib/use-is-client";

export default function DonateInteractive({
  registrationNumber,
}: {
  registrationNumber: string;
}) {
  const t = useTranslations("donate.picker");
  const [mode, setMode] = useState<PickerMode>("one_time");
  const [amount, setAmount] = useState<number>(ONE_TIME_PRESETS[1]);
  const [months, setMonths] = useState<number>(GENERAL_MONTHLY_COMMITMENT);
  const [customMode, setCustomMode] = useState(false);
  const [customRaw, setCustomRaw] = useState("");
  const [customMonthsMode, setCustomMonthsMode] = useState(false);
  const [customMonthsRaw, setCustomMonthsRaw] = useState("");

  const total = mode === "monthly" ? amount * months : amount;
  const payments = mode === "monthly" ? months : 1;

  const formRef = useRef<HTMLDivElement>(null);
  const [formRevealed, setFormRevealed] = useState<
    null | "credit" | "bit" | "bank"
  >(null);
  const [nedarimOpen, setNedarimOpen] = useState(false);
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);

  const revealForm = (mode: "credit" | "bit" | "bank") => {
    setFormRevealed(mode);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleModeChange = (nextMode: PickerMode) => {
    setMode(nextMode);
    setFormRevealed(null);
    setNedarimOpen(false);
    setBankDetailsOpen(false);
  };

  const stickySummary =
    mode === "monthly"
      ? `₪${amount.toLocaleString("he-IL")} × ${months}`
      : `₪${amount.toLocaleString("he-IL")}`;

  return (
    <>
      <AnimateOnScroll animation="fade-up" className="relative z-30">
        <DonationAmountPicker
          mode={mode}
          amount={amount}
          months={months}
          customMode={customMode}
          customRaw={customRaw}
          customMonthsMode={customMonthsMode}
          customMonthsRaw={customMonthsRaw}
          onModeChange={handleModeChange}
          onAmountChange={setAmount}
          onMonthsChange={setMonths}
          onCustomModeChange={setCustomMode}
          onCustomRawChange={setCustomRaw}
          onCustomMonthsModeChange={setCustomMonthsMode}
          onCustomMonthsRawChange={setCustomMonthsRaw}
          onContinue={() => revealForm("credit")}
          onBit={() => revealForm("bit")}
          onBank={() => revealForm("bank")}
          onBankDetails={() => setBankDetailsOpen(true)}
          onNedarim={() => setNedarimOpen(true)}
          trustSlot={<TrustStrip registrationNumber={registrationNumber} />}
        />
      </AnimateOnScroll>

      {formRevealed ? (
        <AnimateOnScroll animation="fade-up" className="relative z-0">
          <div
            ref={formRef}
            id="donate-form"
            className="card p-5 sm:p-7 md:p-8 scroll-mt-40"
          >
            <DonateForm
              key={formRevealed}
              total={total}
              payments={payments}
              itemSlug={null}
              paymentMode={formRevealed}
            />
          </div>
        </AnimateOnScroll>
      ) : null}

      {nedarimOpen ? (
        <NedarimIframeModal
          total={total}
          payments={payments}
          name=""
          idNumber=""
          email=""
          phone=""
          onClose={() => setNedarimOpen(false)}
        />
      ) : null}

      {bankDetailsOpen ? (
        <BankDetailsModal onClose={() => setBankDetailsOpen(false)} />
      ) : null}

      {!formRevealed ? (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-dark/10 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted leading-tight">
                {mode === "monthly" ? t("mode_monthly", { months }) : t("mode_one_time")}
              </div>
              <div className="text-base font-[number:var(--font-weight-bold)] text-charcoal tabular-nums truncate">
                {stickySummary}
              </div>
            </div>
            <button
              type="button"
              onClick={() => revealForm("credit")}
              className="shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-l from-gold-300 to-gold-500 text-navy-950 text-sm font-[number:var(--font-weight-bold)] shadow-md"
            >
              <span>{t("continue")}</span>
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function BankDetailsModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("donate.bank_details");
  const isClient = useIsClient();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

  const detailRows = [
    ["account_name", "account_name_value"],
    ["bank", "bank_value"],
    ["branch", "branch_value"],
    ["account", "account_value"],
  ] as const;

  const detailsText = detailRows
    .map(([labelKey, valueKey]) => `${t(labelKey)}: ${t(valueKey)}`)
    .join("\n");

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

  if (!isClient) return null;

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(detailsText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const onBackdrop = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-details-title"
      onMouseDown={onBackdrop}
    >
      <div className="modal-panel relative w-full max-w-md bg-warm-white rounded-[var(--radius-xl)] shadow-[var(--shadow-elevated)] p-6 sm:p-7 my-auto">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-4 end-4 w-9 h-9 rounded-full border border-dark/10 text-charcoal hover:bg-navy-50 transition-colors"
        >
          ×
        </button>
        <h3
          id="bank-details-title"
          className="text-xl font-[number:var(--font-weight-black)] text-navy-950 pe-10"
        >
          {t("title")}
        </h3>
        <div className="mt-5 divide-y divide-dark/10 rounded-[var(--radius-md)] border border-dark/10 bg-white">
          {detailRows.map(([labelKey, valueKey]) => (
            <div key={labelKey} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm text-dark/65">{t(labelKey)}</span>
              <span className="text-sm font-[number:var(--font-weight-bold)] text-charcoal text-start tabular-nums">
                {t(valueKey)}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-dark/75 leading-relaxed">
          {t.rich("tax_refund_note", {
            email: (chunks) => (
              <a
                href="mailto:office@tzevethtzolah.com"
                className="font-[number:var(--font-weight-bold)] text-navy-700 underline decoration-navy-300 underline-offset-4 hover:text-gold-600"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <button
          type="button"
          onClick={copyDetails}
          className="btn-donate w-full mt-5 py-3 text-sm sm:text-base"
        >
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
    </div>,
    document.body
  );
}
