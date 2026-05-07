"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import DonationModal from "@/components/DonationModal";
import type { DonationItem } from "@/lib/donation-types";

export default function EditDonationButton({
  item,
  locale,
  payments,
}: {
  item: DonationItem;
  locale: string;
  payments: number;
}) {
  const t = useTranslations("donate.summary");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs sm:text-sm font-[number:var(--font-weight-bold)] text-navy-600 hover:text-navy-800 underline-offset-2 hover:underline"
      >
        {t("edit")}
      </button>
      {open ? (
        <DonationModal
          item={item}
          locale={locale}
          initialPayments={payments}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
