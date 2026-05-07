"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { monthlyFor } from "@/lib/donation-types";
import { isValidIsraeliId } from "@/lib/israeli-id";
import { brandLabel, detectCardBrand, isValidCardNumber } from "@/lib/card";
import { useIsClient } from "@/lib/use-is-client";

type FormErrors = Partial<Record<
  | "name"
  | "idNumber"
  | "email"
  | "phone"
  | "cardNumber"
  | "expMonth"
  | "expYear"
  | "cvv"
  | "consent"
  | "submit",
  string
>>;

type CardField = "cardNumber" | "expMonth" | "expYear" | "cvv";

type IdStatus = "ok" | "missing" | "invalid";
type ReceiptIssue = { nameMissing: boolean; idStatus: IdStatus };

function isFullName(raw: string): boolean {
  return raw.trim().split(/\s+/).filter(Boolean).length >= 2;
}

function bodyKeyFor(issue: ReceiptIssue):
  | "body_name_missing"
  | "body_id_missing"
  | "body_id_invalid"
  | "body_name_missing_id_missing"
  | "body_name_missing_id_invalid" {
  const { nameMissing, idStatus } = issue;
  if (nameMissing && idStatus === "missing") return "body_name_missing_id_missing";
  if (nameMissing && idStatus === "invalid") return "body_name_missing_id_invalid";
  if (nameMissing) return "body_name_missing";
  if (idStatus === "missing") return "body_id_missing";
  return "body_id_invalid";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d[\d\s-]{6,15}$/;

export default function DonateForm({
  total,
  payments,
  itemSlug,
}: {
  total: number;
  payments: number;
  itemSlug?: string | null;
}) {
  const t = useTranslations("donate.form");
  const router = useRouter();

  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [receiptIssue, setReceiptIssue] = useState<ReceiptIssue | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLInputElement>(null);
  const expMonthRef = useRef<HTMLInputElement>(null);
  const expYearRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);

  const monthly = monthlyFor(total, payments);

  const computeExpErrors = (
    rawMonth: string,
    rawYear: string
  ): { expMonth?: string; expYear?: string } => {
    const month = rawMonth.trim();
    const year = rawYear.trim();
    const out: { expMonth?: string; expYear?: string } = {};

    if (!month) {
      out.expMonth = t("errors.required");
    } else {
      const mn = parseInt(month, 10);
      if (!Number.isFinite(mn) || mn < 1 || mn > 12) {
        out.expMonth = t("errors.invalid_month");
      }
    }

    if (!year) {
      out.expYear = t("errors.required");
    }

    if (!out.expMonth && !out.expYear) {
      const mn = parseInt(month, 10);
      const yn = parseInt(year, 10);
      const fullYear = 2000 + yn;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (fullYear < currentYear || (fullYear === currentYear && mn < currentMonth)) {
        out.expYear = t("errors.expired_card");
      }
    }

    return out;
  };

  const validateHard = (): FormErrors => {
    const e: FormErrors = {};
    if (!EMAIL_RE.test(email)) e.email = t("errors.invalid_email");
    if (!PHONE_RE.test(phone)) e.phone = t("errors.invalid_phone");
    const rawCard = cardRef.current?.value ?? "";
    if (!rawCard.trim()) {
      e.cardNumber = t("errors.required");
    } else if (!isValidCardNumber(rawCard)) {
      e.cardNumber = t("errors.invalid_card");
    }
    if (!cvvRef.current?.value.trim()) e.cvv = t("errors.required");
    const exp = computeExpErrors(
      expMonthRef.current?.value ?? "",
      expYearRef.current?.value ?? ""
    );
    if (exp.expMonth) e.expMonth = exp.expMonth;
    if (exp.expYear) e.expYear = exp.expYear;
    if (!consent) e.consent = t("errors.consent_required");
    return e;
  };

  const fieldErrorOnBlur = (field: "name" | "idNumber" | "email" | "phone", value: string): string => {
    const v = value.trim();
    switch (field) {
      case "name":
        // Soft field — empty is allowed (warned at submit). Only flag content
        // that's clearly less than a full name.
        if (v.length === 0) return "";
        if (!isFullName(v)) return t("errors.full_name");
        return "";
      case "idNumber":
        if (v.length === 0) return "";
        if (!isValidIsraeliId(v)) return t("errors.invalid_id");
        return "";
      case "email":
        if (v.length === 0) return t("errors.required");
        if (!EMAIL_RE.test(v)) return t("errors.invalid_email");
        return "";
      case "phone":
        if (v.length === 0) return t("errors.required");
        if (!PHONE_RE.test(v)) return t("errors.invalid_phone");
        return "";
    }
  };

  const handleBlur =
    (field: "name" | "idNumber" | "email" | "phone") =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const msg = fieldErrorOnBlur(field, e.target.value);
      setErrors((prev) => ({ ...prev, [field]: msg || undefined }));
    };

  const clearError = (field: "name" | "idNumber" | "email" | "phone") => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleCardChange = (field: CardField) => () => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCardBlur =
    (field: CardField) => (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (field === "cardNumber") {
        const empty = !value.trim();
        const msg = empty
          ? t("errors.required")
          : !isValidCardNumber(value)
          ? t("errors.invalid_card")
          : undefined;
        setErrors((prev) => ({ ...prev, cardNumber: msg }));
        return;
      }
      if (field === "cvv") {
        const empty = !value.trim();
        setErrors((prev) => ({ ...prev, cvv: empty ? t("errors.required") : undefined }));
        return;
      }
      const month = field === "expMonth" ? value : expMonthRef.current?.value ?? "";
      const year = field === "expYear" ? value : expYearRef.current?.value ?? "";
      const exp = computeExpErrors(month, year);
      setErrors((prev) => ({ ...prev, expMonth: exp.expMonth, expYear: exp.expYear }));
    };

  const checkReceiptIssue = (): ReceiptIssue | null => {
    const nameMissing = !isFullName(name);
    const idStatus: IdStatus =
      idNumber.length === 0
        ? "missing"
        : isValidIsraeliId(idNumber)
        ? "ok"
        : "invalid";
    if (!nameMissing && idStatus === "ok") return null;
    return { nameMissing, idStatus };
  };

  const submitDonation = async (sanitize: boolean) => {
    setErrors({});
    setSubmitting(true);
    const trimmedName = name.trim();
    const cleanName = sanitize && !isFullName(trimmedName) ? "" : trimmedName;
    const cleanId =
      sanitize && !isValidIsraeliId(idNumber) ? "" : idNumber;
    try {
      const res = await fetch("/api/donate/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          payments,
          itemSlug,
          donor: {
            name: cleanName,
            idNumber: cleanId,
            email,
            phone,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors({ submit: t("errors.charge_failed") });
        setSubmitting(false);
        return;
      }
      router.push(data.redirect ?? "/todah");
    } catch {
      setErrors({ submit: t("errors.network") });
      setSubmitting(false);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fieldErrors = validateHard();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const cardOrder: Array<[CardField, React.RefObject<HTMLInputElement | null>]> = [
        ["cardNumber", cardRef],
        ["expMonth", expMonthRef],
        ["expYear", expYearRef],
        ["cvv", cvvRef],
      ];
      for (const [key, ref] of cardOrder) {
        if (fieldErrors[key]) {
          ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          ref.current?.focus({ preventScroll: true });
          break;
        }
      }
      return;
    }

    const issue = checkReceiptIssue();
    if (issue) {
      setReceiptIssue(issue);
      return;
    }

    await submitDonation(false);
  };

  const onProceedAnyway = async () => {
    setReceiptIssue(null);
    await submitDonation(true);
  };

  const onGoFix = () => {
    const issue = receiptIssue;
    setReceiptIssue(null);
    setTimeout(() => {
      if (issue?.nameMissing) {
        nameRef.current?.focus();
      } else if (issue && issue.idStatus !== "ok") {
        idRef.current?.focus();
      }
    }, 50);
  };

  const submitLabel =
    payments === 1
      ? t("submit_one_time", { total: total.toLocaleString("he-IL") })
      : t("submit_recurring", {
          monthly: monthly.toLocaleString("he-IL"),
          payments,
        });

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-5 sm:space-y-6">
      <fieldset className="space-y-3 sm:space-y-4">
        <legend className="text-sm font-[number:var(--font-weight-bold)] text-charcoal mb-2">
          {t("donor_section")}
        </legend>

        <Field label={t("name_label")} error={errors.name}>
          <input
            ref={nameRef}
            type="text"
            autoComplete="name"
            placeholder={t("name_placeholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
            onBlur={handleBlur("name")}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field label={t("id_label")} helper={t("id_helper")} error={errors.idNumber}>
          <input
            ref={idRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={idNumber}
            onChange={(e) => {
              setIdNumber(e.target.value.replace(/\D/g, ""));
              clearError("idNumber");
            }}
            onBlur={handleBlur("idNumber")}
            maxLength={9}
            className={inputClass(Boolean(errors.idNumber))}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field label={t("email_label")} error={errors.email}>
            <input
              type="email"
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              onBlur={handleBlur("email")}
              className={`${inputClass(Boolean(errors.email))} text-start`}
              required
            />
          </Field>
          <Field label={t("phone_label")} error={errors.phone}>
            <input
              type="tel"
              autoComplete="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("phone");
              }}
              onBlur={handleBlur("phone")}
              className={`${inputClass(Boolean(errors.phone))} text-start`}
              required
            />
          </Field>
        </div>
      </fieldset>

      {/* Payment fields — wired with Sumit's data-og attributes for when keys land.
          Currently passive (no Sumit JS loaded yet); /api/donate/charge stubs the charge. */}
      <fieldset className="space-y-3 sm:space-y-4 pt-2">
        <legend className="text-sm font-[number:var(--font-weight-bold)] text-charcoal mb-2">
          {t("payment_section")}
        </legend>

        <Field
          label={t("card_label")}
          helper={brandLabel(detectCardBrand(cardNumber)) ?? undefined}
          error={errors.cardNumber}
        >
          <input
            ref={cardRef}
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            data-og="cardnumber"
            name="cardnumber"
            dir="ltr"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => {
              setCardNumber(e.target.value);
              if (errors.cardNumber) {
                setErrors((prev) => ({ ...prev, cardNumber: undefined }));
              }
            }}
            onBlur={handleCardBlur("cardNumber")}
            className={`${inputClass(Boolean(errors.cardNumber))} text-start tabular-nums tracking-wide`}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Field
            label={t("exp_label")}
            className="col-span-2"
            error={errors.expMonth || errors.expYear}
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={expMonthRef}
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp-month"
                data-og="expirationmonth"
                name="expirationmonth"
                placeholder={t("exp_month_placeholder")}
                maxLength={2}
                onChange={handleCardChange("expMonth")}
                onBlur={handleCardBlur("expMonth")}
                className={`${inputClass(Boolean(errors.expMonth))} text-center tabular-nums`}
              />
              <input
                ref={expYearRef}
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                data-og="expirationyear"
                name="expirationyear"
                placeholder={t("exp_year_placeholder")}
                maxLength={2}
                onChange={handleCardChange("expYear")}
                onBlur={handleCardBlur("expYear")}
                className={`${inputClass(Boolean(errors.expYear))} text-center tabular-nums`}
              />
            </div>
          </Field>
          <Field label={t("cvv_label")} error={errors.cvv}>
            <input
              ref={cvvRef}
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              data-og="cvv"
              name="cvv"
              maxLength={4}
              onChange={handleCardChange("cvv")}
              onBlur={handleCardBlur("cvv")}
              className={`${inputClass(Boolean(errors.cvv))} text-center tabular-nums`}
            />
          </Field>
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-xs sm:text-sm text-dark/85 leading-relaxed">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-gold-500 shrink-0"
        />
        <span>{t("consent")}</span>
      </label>
      {errors.consent ? (
        <p className="text-xs text-red-600 -mt-3">{errors.consent}</p>
      ) : null}

      {errors.submit ? (
        <div className="rounded-[var(--radius-md)] border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.submit}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="btn-donate w-full text-base sm:text-lg py-3.5 sm:py-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "…" : submitLabel}
      </button>
    </form>

    {receiptIssue ? (
      <ReceiptWarningModal
        issue={receiptIssue}
        onProceed={onProceedAnyway}
        onFix={onGoFix}
        submitting={submitting}
      />
    ) : null}
    </>
  );
}

function ReceiptWarningModal({
  issue,
  onProceed,
  onFix,
  submitting,
}: {
  issue: ReceiptIssue;
  onProceed: () => void;
  onFix: () => void;
  submitting: boolean;
}) {
  const t = useTranslations("donate.form.warn");
  const fixBtnRef = useRef<HTMLButtonElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    fixBtnRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFix();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onFix]);

  if (!isClient) return null;

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submitting) onFix();
  };

  const bodyKey = bodyKeyFor(issue);

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="receipt-warn-title"
      aria-describedby="receipt-warn-body"
      onMouseDown={onBackdrop}
    >
      <div className="modal-panel relative w-full max-w-md bg-warm-white rounded-[var(--radius-xl)] shadow-[var(--shadow-elevated)] p-6 sm:p-7 my-auto">
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <h3
            id="receipt-warn-title"
            className="text-lg sm:text-xl font-[number:var(--font-weight-black)] text-navy-950 mt-1"
          >
            {t("title")}
          </h3>
        </div>

        <p
          id="receipt-warn-body"
          className="text-sm text-dark/85 leading-relaxed mb-1"
        >
          {t(bodyKey)}
        </p>
        <p className="text-sm text-dark/75 leading-relaxed mb-6">
          {t("outro")}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            ref={fixBtnRef}
            type="button"
            onClick={onFix}
            disabled={submitting}
            className="btn-primary w-full text-sm sm:text-base py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("fix")}
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={submitting}
            className="w-full text-xs sm:text-sm text-dark/70 hover:text-charcoal underline-offset-2 hover:underline py-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "…" : t("proceed")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({
  label,
  helper,
  error,
  className,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className ?? ""}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label className="text-xs sm:text-sm font-[number:var(--font-weight-bold)] text-charcoal">
          {label}
        </label>
        {helper ? (
          <span className="text-[10px] sm:text-[11px] text-muted">{helper}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] text-red-600 mt-1">{error}</p>
      ) : null}
    </div>
  );
}

function inputClass(invalid: boolean): string {
  const base =
    "w-full rounded-[var(--radius-md)] px-3 sm:px-3.5 py-2.5 sm:py-3 bg-warm-white text-charcoal text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-all";
  return invalid
    ? `${base} border-2 border-red-400`
    : `${base} border-2 border-dark/10 focus:border-navy-400`;
}
