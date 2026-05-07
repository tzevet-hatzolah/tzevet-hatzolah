"use client";

import { useState } from "react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import DonateForm from "@/components/DonateForm";
import DonationAmountPicker, {
  type PickerMode,
  GENERAL_MONTHLY_COMMITMENT,
  ONE_TIME_PRESETS,
} from "@/components/DonationAmountPicker";
import TrustStrip from "@/components/TrustStrip";

export default function DonateInteractive({
  registrationNumber,
}: {
  registrationNumber: string;
}) {
  const [mode, setMode] = useState<PickerMode>("one_time");
  const [amount, setAmount] = useState<number>(ONE_TIME_PRESETS[1]);
  const [months, setMonths] = useState<number>(GENERAL_MONTHLY_COMMITMENT);
  const [customMode, setCustomMode] = useState(false);
  const [customRaw, setCustomRaw] = useState("");
  const [customMonthsMode, setCustomMonthsMode] = useState(false);
  const [customMonthsRaw, setCustomMonthsRaw] = useState("");

  const total = mode === "monthly" ? amount * months : amount;
  const payments = mode === "monthly" ? months : 1;

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
          onModeChange={setMode}
          onAmountChange={setAmount}
          onMonthsChange={setMonths}
          onCustomModeChange={setCustomMode}
          onCustomRawChange={setCustomRaw}
          onCustomMonthsModeChange={setCustomMonthsMode}
          onCustomMonthsRawChange={setCustomMonthsRaw}
          trustSlot={<TrustStrip registrationNumber={registrationNumber} />}
        />
      </AnimateOnScroll>

      <AnimateOnScroll animation="fade-up" delay={180}>
        <div id="donate-form" className="card p-5 sm:p-7 md:p-8 scroll-mt-24">
          <DonateForm total={total} payments={payments} itemSlug={null} />
        </div>
      </AnimateOnScroll>
    </>
  );
}
