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
const BANK_NUMBER_LENGTH = 2;
const BANK_BRANCH_LENGTH = 3;
const BANK_ACCOUNT_MAX_LENGTH = 9;
const BANK_LOGO_DOMAINS: Record<string, string> = {
  "03": "eshbank.co.il",
  "04": "bank-yahav.co.il",
  "09": "israelpost.co.il",
  "10": "bankleumi.co.il",
  "11": "discountbank.co.il",
  "12": "bankhapoalim.co.il",
  "13": "unionbank.co.il",
  "14": "bankotsar.co.il",
  "17": "mercantile.co.il",
  "18": "onezerobank.com",
  "20": "mizrahi-tefahot.co.il",
  "31": "fibi.co.il",
  "34": "arab-israelibank.co.il",
  "46": "bankmassad.co.il",
  "52": "pagi.co.il",
  "54": "bankjerusalem.co.il",
};

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
  | "bankNumber"
  | "bankBranch"
  | "bankAccount"
  | "consent"
  | "submit",
  string
>>;

type CardField = "cardNumber" | "expMonth" | "expYear" | "cvv";
type BankField = "bankNumber" | "bankBranch" | "bankAccount";
type PaymentMode = "credit" | "bit" | "bank";
type BankLookupResponse = {
  ok?: boolean;
  bankKnown?: boolean;
  bankSupported?: boolean;
  bankName?: string | null;
  branchKnown?: boolean | null;
  error?: string;
};

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
  paymentMode?: PaymentMode;
}) {
  const isBit = paymentMode === "bit";
  const isBank = paymentMode === "bank";
  const isCredit = paymentMode === "credit";
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
  const [bankName, setBankName] = useState("");
  const [bankLogoUrl, setBankLogoUrl] = useState("");
  const [receiptIssue, setReceiptIssue] = useState<ReceiptIssue | null>(null);
  const [sumitReady, setSumitReady] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLInputElement>(null);
  const expMonthRef = useRef<HTMLInputElement>(null);
  const expYearRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const bankNumberRef = useRef<HTMLInputElement>(null);
  const bankBranchRef = useRef<HTMLInputElement>(null);
  const bankAccountRef = useRef<HTMLInputElement>(null);
  const bankLookupRequestRef = useRef(0);
  // Set to true right before we deliberately let a submit event through to
  // Sumit's Payments JS. The next onSubmit consumes the flag and skips
  // re-validation so it doesn't loop.
  const allowNativeSubmitRef = useRef(false);

  useEffect(() => {
    if (!SUMIT_ENABLED || !isCredit) return;
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
    // every render with no behavior change. The form is keyed by payment
    // mode, so this effect runs fresh when credit mode mounts.
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

  const bankFieldError = (field: BankField, value: string): string | undefined => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return t("errors.required");
    if (
      field === "bankNumber" &&
      (digits.length !== BANK_NUMBER_LENGTH || Number(digits) < 1)
    ) {
      return t("errors.invalid_bank_number");
    }
    if (
      field === "bankBranch" &&
      (digits.length !== BANK_BRANCH_LENGTH || Number(digits) < 1)
    ) {
      return t("errors.invalid_bank_branch");
    }
    if (
      field === "bankAccount" &&
      (digits.length > BANK_ACCOUNT_MAX_LENGTH || Number(digits) < 1)
    ) {
      return t("errors.invalid_bank_account");
    }
    return undefined;
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
    if (isBank) {
      if (!idNumber.trim()) {
        e.idNumber = t("errors.required");
      } else if (!isValidIsraeliId(idNumber)) {
        e.idNumber = t("errors.invalid_id");
      }
      const bankNumberError = bankFieldError(
        "bankNumber",
        bankNumberRef.current?.value ?? ""
      );
      const bankBranchError = bankFieldError(
        "bankBranch",
        bankBranchRef.current?.value ?? ""
      );
      const bankAccountError = bankFieldError(
        "bankAccount",
        bankAccountRef.current?.value ?? ""
      );
      if (bankNumberError) e.bankNumber = bankNumberError;
      if (bankBranchError) e.bankBranch = bankBranchError;
      if (bankAccountError) e.bankAccount = bankAccountError;
    }
    if (isCredit) {
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

  const formatBankName = (value: string | null | undefined): string => {
    return (value ?? "").trim();
  };

  const bankLogoFor = (bank: string): string => {
    const normalized = bank.padStart(BANK_NUMBER_LENGTH, "0");
    const domain = BANK_LOGO_DOMAINS[normalized];
    return domain
      ? `url("https://logo.clearbit.com/${domain}"), url("https://www.google.com/s2/favicons?domain=${domain}&sz=64")`
      : "";
  };

  const lookupBankDetails = async (bankValue: string, branchValue?: string) => {
    const bank = bankValue.replace(/\D/g, "");
    const branch = (branchValue ?? bankBranchRef.current?.value ?? "").replace(
      /\D/g,
      ""
    );
    const requestId = bankLookupRequestRef.current + 1;
    bankLookupRequestRef.current = requestId;

    if (bank.length !== BANK_NUMBER_LENGTH || Number(bank) < 1) {
      setBankName("");
      setBankLogoUrl("");
      return;
    }

    const params = new URLSearchParams({ bank });
    if (branch.length === BANK_BRANCH_LENGTH) params.set("branch", branch);

    try {
      const res = await fetch(`/api/donate/bank/lookup?${params.toString()}`);
      const data = (await res.json()) as BankLookupResponse;
      if (bankLookupRequestRef.current !== requestId || !res.ok || !data.ok) {
        return;
      }

      setBankName(formatBankName(data.bankName));
      setBankLogoUrl(data.bankKnown ? bankLogoFor(bank) : "");
      setErrors((prev) => {
        const next = { ...prev };
        if (data.bankKnown === false) {
          next.bankNumber = t("errors.invalid_bank_unknown");
        } else if (data.bankSupported === false) {
          next.bankNumber = t("errors.unsupported_bank");
        } else if (data.bankKnown) {
          next.bankNumber = undefined;
        }

        if (branch.length === BANK_BRANCH_LENGTH) {
          if (data.branchKnown === false) {
            next.bankBranch = t("errors.invalid_bank_branch_pair");
          } else if (data.branchKnown) {
            next.bankBranch = undefined;
          }
        }
        return next;
      });
    } catch {
      // If the registry lookup is temporarily unavailable, the submit route
      // still validates before sending the donor to the bank.
    }
  };

  const handleBankChange =
    (field: BankField) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const max =
        field === "bankNumber"
          ? BANK_NUMBER_LENGTH
          : field === "bankBranch"
          ? BANK_BRANCH_LENGTH
          : BANK_ACCOUNT_MAX_LENGTH;
      const digits = e.target.value.replace(/\D/g, "").slice(0, max);
      if (e.target.value !== digits) e.target.value = digits;
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (field === "bankNumber") {
        bankLookupRequestRef.current += 1;
        setBankName("");
        setBankLogoUrl("");
        setErrors((prev) => ({ ...prev, bankBranch: undefined }));
        if (digits.length === BANK_NUMBER_LENGTH) {
          void lookupBankDetails(digits);
        }
      } else if (field === "bankBranch") {
        bankLookupRequestRef.current += 1;
        const bank = bankNumberRef.current?.value ?? "";
        if (digits.length === BANK_BRANCH_LENGTH) {
          void lookupBankDetails(bank, digits);
        }
      }
      if (field === "bankNumber" && digits.length === BANK_NUMBER_LENGTH) {
        bankBranchRef.current?.focus();
      } else if (field === "bankBranch" && digits.length === BANK_BRANCH_LENGTH) {
        bankAccountRef.current?.focus();
      }
    };

  const handleBankBlur =
    (field: BankField) => (e: React.FocusEvent<HTMLInputElement>) => {
      setErrors((prev) => ({
        ...prev,
        [field]: bankFieldError(field, e.target.value),
      }));
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

  const submitBankTransfer = async () => {
    setErrors({});
    setSubmitting(true);
    const focusBankError = (nextErrors: FormErrors) => {
      const order: Array<[keyof FormErrors, React.RefObject<HTMLInputElement | null>]> = [
        ["idNumber", idRef],
        ["email", emailRef],
        ["phone", phoneRef],
        ["bankNumber", bankNumberRef],
        ["bankBranch", bankBranchRef],
        ["bankAccount", bankAccountRef],
      ];
      for (const [key, ref] of order) {
        if (nextErrors[key]) {
          ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          ref.current?.focus({ preventScroll: true });
          return;
        }
      }
    };
    const serverBankErrors = (error: unknown): FormErrors | null => {
      switch (error) {
        case "invalid_id":
          return { idNumber: t("errors.invalid_id") };
        case "invalid_email":
          return { email: t("errors.invalid_email") };
        case "invalid_phone":
          return { phone: t("errors.invalid_phone") };
        case "invalid_bank":
          return { bankNumber: t("errors.invalid_bank_number") };
        case "invalid_bank_unknown":
          return { bankNumber: t("errors.invalid_bank_unknown") };
        case "unsupported_bank":
          return { bankNumber: t("errors.unsupported_bank") };
        case "invalid_branch":
          return { bankBranch: t("errors.invalid_bank_branch") };
        case "invalid_account":
          return { bankAccount: t("errors.invalid_bank_account") };
        case "invalid_bank_branch":
          return { bankBranch: t("errors.invalid_bank_branch_pair") };
        default:
          return null;
      }
    };
    try {
      const res = await fetch("/api/donate/bank/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          itemSlug,
          locale,
          donor: {
            name: name.trim(),
            idNumber,
            email,
            phone,
          },
          bank: {
            number: bankNumberRef.current?.value ?? "",
            branch: bankBranchRef.current?.value ?? "",
            account: bankAccountRef.current?.value ?? "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.redirect) {
        const nextErrors =
          serverBankErrors((data as { error?: unknown } | null)?.error) ??
          { submit: t("errors.bank_unavailable") };
        setErrors(nextErrors);
        focusBankError(nextErrors);
        setSubmitting(false);
        return;
      }
      window.location.href = data.redirect;
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
      const bankOrder: Array<[BankField, React.RefObject<HTMLInputElement | null>]> = [
        ["bankNumber", bankNumberRef],
        ["bankBranch", bankBranchRef],
        ["bankAccount", bankAccountRef],
      ];
      if (fieldErrors.idNumber) {
        idRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        idRef.current?.focus({ preventScroll: true });
        return;
      }
      for (const [key, ref] of bankOrder) {
        if (fieldErrors[key]) {
          ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          ref.current?.focus({ preventScroll: true });
          return;
        }
      }
      for (const [key, ref] of cardOrder) {
        if (fieldErrors[key]) {
          ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          ref.current?.focus({ preventScroll: true });
          break;
        }
      }
      return;
    }

    if (isBank) {
      stopHere(e);
      void submitBankTransfer();
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
    : isBank
    ? t("submit_bank")
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
          if (!SUMIT_ENABLED || !isCredit) e.preventDefault();
        }}
        // Sumit's BindFormSubmit binds to forms marked with data-og="form".
        // Skip the marker outside credit mode so Sumit ignores those forms.
        {...(isCredit ? { "data-og": "form" } : {})}
        {...(SUMIT_ENABLED && isCredit
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

        <Field id="donor-name" label={t("name_label")} error={errors.name} required={isBit}>
          <input
            id="donor-name"
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
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "donor-name-error" : undefined}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field
          id="donor-id"
          label={t("id_label")}
          helper={t("id_helper")}
          error={errors.idNumber}
          tooltip={t("id_tooltip")}
          tooltipAria={t("id_tooltip_aria")}
          required={isBank}
        >
          <input
            id="donor-id"
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
            aria-invalid={errors.idNumber ? "true" : "false"}
            aria-describedby={errors.idNumber ? "donor-id-error" : undefined}
            className={inputClass(Boolean(errors.idNumber))}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Field id="donor-email" label={t("email_label")} error={errors.email} required>
            <input
              id="donor-email"
              ref={emailRef}
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
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "donor-email-error" : undefined}
              className={`${inputClass(Boolean(errors.email))} text-start`}
              required
            />
          </Field>
          <Field
            id="donor-phone"
            label={t("phone_label")}
            error={errors.phone}
            required={isBit}
          >
            <input
              id="donor-phone"
              ref={phoneRef}
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
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "donor-phone-error" : undefined}
              className={`${inputClass(Boolean(errors.phone))} text-start`}
            />
          </Field>
        </div>
      </fieldset>

      {isCredit ? (
      <fieldset className="space-y-3 sm:space-y-4 pt-2">
        <legend className="text-sm font-[number:var(--font-weight-bold)] text-charcoal mb-2">
          {t("payment_section")}
        </legend>

        <Field
          id="card-number"
          label={t("card_label")}
          helper={brandLabel(detectCardBrand(cardNumber)) ?? undefined}
          error={errors.cardNumber}
          required
        >
          <input
            id="card-number"
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
            aria-invalid={errors.cardNumber ? "true" : "false"}
            aria-describedby={errors.cardNumber ? "card-number-error" : undefined}
            className={`${inputClass(Boolean(errors.cardNumber))} text-start tabular-nums tracking-wide`}
          />
        </Field>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Field
            id="card-exp"
            label={t("exp_label")}
            className="col-span-2"
            error={errors.expMonth || errors.expYear}
            required
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                id="card-exp"
                aria-label={t("exp_month_label")}
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
                aria-invalid={errors.expMonth ? "true" : "false"}
                aria-describedby={errors.expMonth || errors.expYear ? "card-exp-error" : undefined}
                className={`${inputClass(Boolean(errors.expMonth))} text-center tabular-nums`}
              />
              <input
                aria-label={t("exp_year_label")}
                ref={expYearRef}
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                data-og="expirationyear"
                name="expirationyear"
                placeholder={t("exp_year_placeholder")}
                maxLength={BANK_NUMBER_LENGTH}
                onChange={handleCardChange("expYear")}
                onBlur={handleCardBlur("expYear")}
                aria-invalid={errors.expYear ? "true" : "false"}
                aria-describedby={errors.expMonth || errors.expYear ? "card-exp-error" : undefined}
                className={`${inputClass(Boolean(errors.expYear))} text-center tabular-nums`}
              />
            </div>
          </Field>
          <Field id="card-cvv" label={t("cvv_label")} error={errors.cvv} required>
            <input
              id="card-cvv"
              ref={cvvRef}
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              data-og="cvv"
              name="cvv"
              maxLength={4}
              onChange={handleCardChange("cvv")}
              onBlur={handleCardBlur("cvv")}
              aria-invalid={errors.cvv ? "true" : "false"}
              aria-describedby={errors.cvv ? "card-cvv-error" : undefined}
              className={`${inputClass(Boolean(errors.cvv))} text-center tabular-nums`}
            />
          </Field>
        </div>
      </fieldset>
      ) : null}

      {isBank ? (
        <fieldset className="space-y-3 sm:space-y-4 pt-2">
          <legend className="text-sm font-[number:var(--font-weight-bold)] text-charcoal mb-2">
            {t("bank_section")}
          </legend>
          <div className="rounded-[var(--radius-md)] border border-gold-500/25 bg-gold-50/70 p-4 sm:p-5">
            <p className="text-sm font-[number:var(--font-weight-bold)] text-navy-950 leading-relaxed">
              {t("bank_helper")}
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                t("bank_notice_id_match"),
                t("bank_notice_app_closed"),
                t("bank_notice_joint_account"),
                t("bank_notice_discount"),
              ].map((notice) => (
                <div key={notice} className="flex items-start gap-3 text-sm text-dark/80 leading-relaxed">
                  <span className="mt-[0.7em] h-2 w-2 shrink-0 -translate-y-1/2 rounded-full bg-gold-500 ring-4 ring-white" aria-hidden>
                  </span>
                  <span>{notice}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Field
              id="bank-number"
              label={t("bank_number_label")}
              error={errors.bankNumber}
              required
            >
              <div>
                <div className="relative">
                  <input
                    id="bank-number"
                    ref={bankNumberRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    name="bankNumber"
                    dir="ltr"
                    maxLength={BANK_NUMBER_LENGTH}
                    onChange={handleBankChange("bankNumber")}
                    onBlur={handleBankBlur("bankNumber")}
                    aria-invalid={errors.bankNumber ? "true" : "false"}
                    aria-describedby={
                      errors.bankNumber
                        ? "bank-number-error"
                        : bankName
                        ? "bank-number-bank-name"
                        : undefined
                    }
                    className={`${inputClass(Boolean(errors.bankNumber))} pr-12 text-start tabular-nums`}
                  />
                  {bankLogoUrl ? (
                    <span
                      className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center"
                      aria-hidden
                    >
                      <span
                        className="h-8 w-8 rounded-[10px] bg-warm-white bg-[length:24px_24px] bg-center bg-no-repeat shadow-sm ring-1 ring-dark/10"
                        style={{ backgroundImage: bankLogoUrl }}
                      />
                    </span>
                  ) : null}
                </div>
                {bankName ? (
                  <p
                    id="bank-number-bank-name"
                    className="mt-1.5 truncate pr-3 text-right text-xs text-muted"
                    dir="rtl"
                  >
                    {bankName}
                  </p>
                ) : null}
              </div>
            </Field>
            <Field
              id="bank-branch"
              label={t("bank_branch_label")}
              error={errors.bankBranch}
              required
            >
              <input
                id="bank-branch"
                ref={bankBranchRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                name="bankBranch"
                dir="ltr"
                maxLength={BANK_BRANCH_LENGTH}
                onChange={handleBankChange("bankBranch")}
                onBlur={handleBankBlur("bankBranch")}
                aria-invalid={errors.bankBranch ? "true" : "false"}
                aria-describedby={errors.bankBranch ? "bank-branch-error" : undefined}
                className={`${inputClass(Boolean(errors.bankBranch))} text-start tabular-nums`}
              />
            </Field>
            <Field
              id="bank-account"
              label={t("bank_account_label")}
              error={errors.bankAccount}
              required
            >
              <input
                id="bank-account"
                ref={bankAccountRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                name="bankAccount"
                dir="ltr"
                maxLength={BANK_ACCOUNT_MAX_LENGTH}
                onChange={handleBankChange("bankAccount")}
                onBlur={handleBankBlur("bankAccount")}
                aria-invalid={errors.bankAccount ? "true" : "false"}
                aria-describedby={errors.bankAccount ? "bank-account-error" : undefined}
                className={`${inputClass(Boolean(errors.bankAccount))} text-start tabular-nums`}
              />
            </Field>
          </div>
        </fieldset>
      ) : null}

      <label className="flex items-start gap-3 text-xs sm:text-sm text-dark/85 leading-relaxed">
        <input
          id="donation-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked && errors.consent) {
              setErrors((prev) => ({ ...prev, consent: undefined }));
            }
          }}
          aria-invalid={errors.consent ? "true" : "false"}
          aria-describedby={errors.consent ? "donation-consent-error" : undefined}
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
        <p id="donation-consent-error" className="text-xs text-red-600 -mt-3" role="alert">{errors.consent}</p>
      ) : null}

      {errors.submit ? (
        <div className="rounded-[var(--radius-md)] border border-red-400/40 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {errors.submit}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting || (isCredit && SUMIT_ENABLED && !sumitReady)}
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
  id,
  label,
  helper,
  error,
  className,
  tooltip,
  tooltipAria,
  required,
  children,
}: {
  id?: string;
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
          <label
            htmlFor={id}
            className="text-xs sm:text-sm font-[number:var(--font-weight-bold)] text-charcoal"
          >
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
        <p id={id ? `${id}-error` : undefined} className="text-[11px] text-red-600 mt-1" role="alert">
          {error}
        </p>
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
