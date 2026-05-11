"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { monthlyFor } from "@/lib/donation-types";
import { isValidIsraeliId, ID_OPT_OUT_MARKER } from "@/lib/israeli-id";
import {
  brandLabel,
  detectCardBrand,
  formatCardNumber,
  isValidCardNumber,
  maxCardDigits,
} from "@/lib/card";
import { useIsClient } from "@/lib/use-is-client";
import { EMAIL_RE, isFullName, isValidPhone } from "@/lib/donor-validation";

const SUMIT_COMPANY_ID = process.env.NEXT_PUBLIC_SUMIT_COMPANY_ID ?? "";
const SUMIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_SUMIT_PUBLIC_KEY ?? "";
const SUMIT_ENABLED = Boolean(SUMIT_COMPANY_ID && SUMIT_PUBLIC_KEY);

type OfficeGuyGlobal = {
  Payments?: {
    BindFormSubmit?: (cfg: {
      CompanyID: number;
      APIPublicKey: string;
      FormSelector?: string;
      ResponseCallback?: (res: unknown) => void;
      ResponseLanguage?: string;
    }) => void;
  };
};

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


export default function DonateForm({
  total,
  payments,
  itemSlug,
  paymentMode = "credit",
}: {
  total: number;
  payments: number;
  itemSlug?: string | null;
  paymentMode?: "credit" | "bit";
}) {
  const isBit = paymentMode === "bit";
  const t = useTranslations("donate.form");
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [receiptIssue, setReceiptIssue] = useState<ReceiptIssue | null>(null);
  const [sumitReady, setSumitReady] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLInputElement>(null);
  const expMonthRef = useRef<HTMLInputElement>(null);
  const expYearRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  // Set to true right before we deliberately let a submit event through to
  // Sumit's Payments JS. The next onSubmit consumes the flag and skips
  // re-validation so it doesn't loop.
  const allowNativeSubmitRef = useRef(false);

  useEffect(() => {
    if (!SUMIT_ENABLED) return;
    let cancelled = false;
    function tryBind() {
      if (cancelled) return;
      const og = (window as unknown as { OfficeGuy?: OfficeGuyGlobal })
        .OfficeGuy;
      const jq = (window as unknown as { jQuery?: unknown }).jQuery;
      if (!og?.Payments?.BindFormSubmit || !jq || !formRef.current) {
        window.setTimeout(tryBind, 100);
        return;
      }
      og.Payments.BindFormSubmit({
        CompanyID: Number(SUMIT_COMPANY_ID),
        APIPublicKey: SUMIT_PUBLIC_KEY,
        FormSelector: '[data-og="form"]',
        ResponseLanguage: "he",
        ResponseCallback: (res) => {
          // Sumit's auto-resubmit is suppressed when ResponseCallback is set,
          // so we own the post-tokenization step. Inject the token as a
          // hidden field and submit natively (form.submit() bypasses our
          // React onSubmitCapture, so no re-tokenization loop).
          const r = res as
            | {
                Status?: number;
                Data?: { SingleUseToken?: string };
                UserErrorMessage?: string | null;
              }
            | null;
          const form = formRef.current;
          if (r?.Status === 0 && r.Data?.SingleUseToken && form) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "og-token";
            input.value = r.Data.SingleUseToken;
            form.appendChild(input);
            form.submit();
            return;
          }
          console.warn("[sumit:tokenize_failed]", res);
          // setSubmitting(false) re-renders, which lets React reconcile the
          // controlled name/id inputs back to state — undoing any DOM-level
          // override applied in onProceedAnyway.
          setReceiptIssue(null);
          setSubmitting(false);
          setErrors({
            submit: r?.UserErrorMessage || t("errors.charge_failed"),
          });
        },
      });
      setSumitReady(true);
    }
    tryBind();
    return () => {
      cancelled = true;
    };
    // `t` is stable from useTranslations — adding it would just re-bind on
    // every render with no behavior change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (isBit && phone.trim().length === 0) {
      e.phone = t("errors.required");
    } else if (phone.trim().length > 0 && !isValidPhone(phone)) {
      e.phone = t("errors.invalid_phone");
    }
    if (isBit && !isFullName(name.trim())) {
      e.name = t("errors.full_name");
    }
    if (!isBit) {
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
    }
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
        if (v.length === 0) return "";
        if (!isValidPhone(v)) return t("errors.invalid_phone");
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

  const handleCardChange =
    (field: CardField) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (field === "expMonth" || field === "expYear" || field === "cvv") {
        const max = field === "cvv" ? 4 : 2;
        const digits = e.target.value.replace(/\D/g, "").slice(0, max);
        if (e.target.value !== digits) e.target.value = digits;
        if (field === "expMonth" && digits.length === 2) {
          expYearRef.current?.focus();
        } else if (field === "expYear" && digits.length === 2) {
          cvvRef.current?.focus();
        }
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

  const submitViaJson = async (sanitize: boolean) => {
    setErrors({});
    setSubmitting(true);
    const trimmedName = name.trim();
    const cleanName = sanitize && !isFullName(trimmedName) ? "" : trimmedName;
    const cleanId =
      sanitize && !isValidIsraeliId(idNumber) ? ID_OPT_OUT_MARKER : idNumber;
    const endpoint = isBit ? "/api/donate/bit/create" : "/api/donate/charge";
    const payload: Record<string, unknown> = {
      total,
      itemSlug,
      locale,
      donor: {
        name: cleanName,
        idNumber: cleanId,
        email,
        phone,
      },
    };
    if (!isBit) {
      payload.payments = payments;
      payload.method = paymentMode;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrors({ submit: t("errors.charge_failed") });
        setSubmitting(false);
        return;
      }
      if (isBit && data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      router.push(data.redirect ?? "/todah");
    } catch {
      setErrors({ submit: t("errors.network") });
      setSubmitting(false);
    }
  };

  const stopHere = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  };

  const onSubmitCapture = (e: FormEvent<HTMLFormElement>) => {
    if (allowNativeSubmitRef.current) {
      // Programmatic resubmit after the receipt-warning "proceed anyway" path.
      // Skip re-validation and let the event reach Sumit's listener.
      allowNativeSubmitRef.current = false;
      return;
    }

    const fieldErrors = validateHard();
    if (Object.keys(fieldErrors).length > 0) {
      stopHere(e);
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
      stopHere(e);
      setReceiptIssue(issue);
      return;
    }

    if (isBit) {
      stopHere(e);
      void submitViaJson(false);
      return;
    }

    if (SUMIT_ENABLED) {
      if (!sumitReady) {
        stopHere(e);
        setErrors({ submit: t("errors.network") });
        return;
      }
      setSubmitting(true);
      // Do NOT stop here — let the submit event propagate to Sumit's
      // jQuery-bound listener on the form (target phase), which will
      // tokenize the card and resubmit with og-token attached.
      return;
    }

    // Stub mode (no Sumit envs): keep the JSON fetch path.
    stopHere(e);
    void submitViaJson(false);
  };

  const onProceedAnyway = async () => {
    if (!SUMIT_ENABLED) {
      // submitViaJson sanitizes the JSON body locally; React state stays as
      // the donor typed it, so no 999999999 ever appears in the visible field.
      setReceiptIssue(null);
      await submitViaJson(true);
      return;
    }
    if (!sumitReady) {
      setReceiptIssue(null);
      setErrors({ submit: t("errors.network") });
      return;
    }
    // Override the visible identity inputs at the DOM level (not React state)
    // so Sumit's BindFormSubmit reads the opt-out marker, but the donor never
    // sees 999999999 in their ID field. The modal stays mounted to cover the
    // form during tokenization; on success Sumit navigates away, on failure
    // the ResponseCallback closes the modal and React reconciles the
    // controlled inputs back to state.
    if (!isFullName(name.trim()) && nameRef.current) {
      nameRef.current.value = "";
    }
    if (!isValidIsraeliId(idNumber) && idRef.current) {
      idRef.current.value = ID_OPT_OUT_MARKER;
    }
    setSubmitting(true);
    allowNativeSubmitRef.current = true;
    formRef.current?.requestSubmit();
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

  const submitLabel = isBit
    ? t("submit_bit", { total: total.toLocaleString("he-IL") })
    : payments === 1
    ? t("submit_one_time", { total: total.toLocaleString("he-IL") })
    : t("submit_recurring", {
        monthly: monthly.toLocaleString("he-IL"),
        payments,
      });

  return (
    <>
      <form
        ref={formRef}
        onSubmitCapture={onSubmitCapture}
        onSubmit={(e) => {
          // Belt-and-suspenders: in stub mode or Bit mode, never let a submit
          // through to the browser default — keeps card fields off the wire
          // even if hydration hasn't finished or Sumit's listener isn't bound.
          if (!SUMIT_ENABLED || isBit) e.preventDefault();
        }}
        // Sumit's BindFormSubmit binds to forms marked with data-og="form".
        // Skip the marker in Bit mode so Sumit ignores the form entirely.
        {...(isBit ? {} : { "data-og": "form" })}
        {...(SUMIT_ENABLED && !isBit
          ? { action: "/api/donate/charge", method: "post" }
          : {})}
        noValidate
        className="space-y-5 sm:space-y-6"
      >
      {/* Mirror the donation parameters into the form post body so the
          server-side handler has everything it needs after Sumit's
          tokenization round-trip. */}
      <input type="hidden" name="total" value={total} readOnly />
      <input type="hidden" name="payments" value={payments} readOnly />
      <input
        type="hidden"
        name="itemSlug"
        value={itemSlug ?? ""}
        readOnly
      />
      <input type="hidden" name="locale" value={locale} readOnly />
      <fieldset className="space-y-3 sm:space-y-4">
        <legend className="text-sm font-[number:var(--font-weight-bold)] text-charcoal mb-2">
          {t("donor_section")}
        </legend>

        <Field label={t("name_label")} error={errors.name} required={isBit}>
          <input
            ref={nameRef}
            type="text"
            name="name"
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

        <Field
          label={t("id_label")}
          helper={t("id_helper")}
          error={errors.idNumber}
          tooltip={t("id_tooltip")}
          tooltipAria={t("id_tooltip_aria")}
        >
          <input
            ref={idRef}
            type="text"
            name="citizenid"
            data-og="citizenid"
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
          <Field label={t("email_label")} error={errors.email} required>
            <input
              type="email"
              name="email"
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
          <Field
            label={t("phone_label")}
            error={errors.phone}
            required={isBit}
          >
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearError("phone");
              }}
              onBlur={handleBlur("phone")}
              className={`${inputClass(Boolean(errors.phone))} text-start`}
            />
          </Field>
        </div>
      </fieldset>

      {!isBit ? (
      <fieldset className="space-y-3 sm:space-y-4 pt-2">
        <legend className="text-sm font-[number:var(--font-weight-bold)] text-charcoal mb-2">
          {t("payment_section")}
        </legend>

        <Field
          label={t("card_label")}
          helper={brandLabel(detectCardBrand(cardNumber)) ?? undefined}
          error={errors.cardNumber}
          required
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
              const input = e.target;
              const caret = input.selectionStart ?? input.value.length;
              const digitsBeforeCaret = input.value
                .slice(0, caret)
                .replace(/\D/g, "").length;
              const rawDigits = input.value.replace(/\D/g, "");
              const nextBrand = detectCardBrand(rawDigits);
              const formatted = formatCardNumber(rawDigits, nextBrand);
              setCardNumber(formatted);
              if (errors.cardNumber) {
                setErrors((prev) => ({ ...prev, cardNumber: undefined }));
              }
              requestAnimationFrame(() => {
                if (!cardRef.current) return;
                let pos = 0;
                let seen = 0;
                while (pos < formatted.length && seen < digitsBeforeCaret) {
                  if (/\d/.test(formatted[pos]!)) seen++;
                  pos++;
                }
                cardRef.current.setSelectionRange(pos, pos);
              });
            }}
            onBlur={handleCardBlur("cardNumber")}
            maxLength={maxCardDigits(detectCardBrand(cardNumber)) + 4}
            className={`${inputClass(Boolean(errors.cardNumber))} text-start tabular-nums tracking-wide`}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Field
            label={t("exp_label")}
            className="col-span-2"
            error={errors.expMonth || errors.expYear}
            required
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
          <Field label={t("cvv_label")} error={errors.cvv} required>
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
      ) : null}

      <label className="flex items-start gap-3 text-xs sm:text-sm text-dark/85 leading-relaxed">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked && errors.consent) {
              setErrors((prev) => ({ ...prev, consent: undefined }));
            }
          }}
          className="mt-0.5 w-4 h-4 accent-gold-500 shrink-0"
        />
        <span>
          {t.rich("consent", {
            privacy: (chunks) => (
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold-600"
              >
                {chunks}
              </Link>
            ),
            terms: (chunks) => (
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gold-600"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
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
        disabled={submitting || (!isBit && SUMIT_ENABLED && !sumitReady)}
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

    {submitting && !receiptIssue ? <ProcessingModal /> : null}
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
      if (e.key === "Escape" && !submitting) onFix();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [onFix, submitting]);

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
        {submitting ? (
          <div className="flex flex-col items-center text-center py-2">
            <div
              className="w-12 h-12 rounded-full border-[3px] border-navy-100 border-t-navy-600 animate-spin"
              aria-hidden
            />
            <h3
              id="receipt-warn-title"
              className="mt-5 text-lg sm:text-xl font-[number:var(--font-weight-black)] text-navy-950"
            >
              {t("processing_title")}
            </h3>
            <p
              id="receipt-warn-body"
              className="mt-2 text-sm text-dark/75 leading-relaxed"
            >
              {t("processing_body")}
            </p>
            <div className="mt-5 flex items-center gap-1.5" aria-hidden>
              <span className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        ) : (
          <>
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
                className="btn-primary w-full text-sm sm:text-base py-3"
              >
                {t("fix")}
              </button>
              <button
                type="button"
                onClick={onProceed}
                className="w-full text-xs sm:text-sm text-dark/70 hover:text-charcoal underline-offset-2 hover:underline py-2"
              >
                {t.rich("proceed", {
                  emph: (chunks) => (
                    <span className="font-[number:var(--font-weight-bold)] text-charcoal underline">
                      {chunks}
                    </span>
                  ),
                })}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function ProcessingModal() {
  const t = useTranslations("donate.form.warn");
  const isClient = useIsClient();

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (!isClient) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="processing-title"
      aria-describedby="processing-body"
      aria-busy="true"
    >
      <div className="relative w-full max-w-md bg-warm-white rounded-[var(--radius-xl)] shadow-[var(--shadow-elevated)] p-7 sm:p-8 text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full border-[3px] border-navy-100 border-t-navy-600 animate-spin"
          aria-hidden
        />
        <h3
          id="processing-title"
          className="mt-5 text-lg sm:text-xl font-[number:var(--font-weight-black)] text-navy-950"
        >
          {t("processing_title")}
        </h3>
        <p
          id="processing-body"
          className="mt-2 text-sm text-dark/75 leading-relaxed"
        >
          {t("processing_body")}
        </p>
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden>
          <span className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse" />
          <span
            className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
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
  tooltip,
  tooltipAria,
  required,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  className?: string;
  tooltip?: string;
  tooltipAria?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={className ?? ""}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <label className="text-xs sm:text-sm font-[number:var(--font-weight-bold)] text-charcoal">
            {label}
            {required ? (
              <span className="text-red-600 ms-0.5" aria-hidden>
                *
              </span>
            ) : null}
          </label>
          {tooltip ? (
            <InfoTooltip text={tooltip} ariaLabel={tooltipAria ?? tooltip} />
          ) : null}
        </div>
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

function InfoTooltip({ text, ariaLabel }: { text: string; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleDocClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-navy-50 text-navy-600 inline-flex items-center justify-center text-[10px] sm:text-[11px] font-[number:var(--font-weight-bold)] leading-none hover:bg-navy-100 focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-colors"
      >
        i
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute top-full mt-2 z-20 w-60 sm:w-64 rounded-[var(--radius-md)] bg-charcoal text-warm-white text-[11px] leading-relaxed font-[number:var(--font-weight-regular)] p-2.5 shadow-[var(--shadow-elevated)]"
          style={{ insetInlineStart: "-0.5rem" }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

function inputClass(invalid: boolean): string {
  const base =
    "w-full rounded-[var(--radius-md)] px-3 sm:px-3.5 py-2.5 sm:py-3 bg-warm-white text-charcoal text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-all";
  return invalid
    ? `${base} border-2 border-red-400`
    : `${base} border-2 border-dark/10 focus:border-navy-400`;
}
