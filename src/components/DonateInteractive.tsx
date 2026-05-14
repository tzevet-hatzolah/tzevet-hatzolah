"use client";

import { useRef, useState } from "react";
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
  const [formRevealed, setFormRevealed] = useState<null | "credit" | "bit">(
    null
  );
  const [nedarimOpen, setNedarimOpen] = useState(false);

  const revealForm = (mode: "credit" | "bit") => {
    setFormRevealed(mode);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleModeChange = (nextMode: PickerMode) => {
    setMode(nextMode);
    setFormRevealed(null);
    setNedarimOpen(false);
  };

  const stickySummary =
    mode === "monthly"
      ? `₪${amount.toLocaleString("he-IL")} × ${months}`
      : `₪${amount.toLocaleString("he-IL")}`;

  return (
    <>
      <AnimateOnScroll animation="fade-up">
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
          onNedarim={() => setNedarimOpen(true)}
          trustSlot={<TrustStrip registrationNumber={registrationNumber} />}
        />
      </AnimateOnScroll>

      {formRevealed ? (
        <AnimateOnScroll animation="fade-up">
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
