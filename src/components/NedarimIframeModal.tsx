"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useIsClient } from "@/lib/use-is-client";
import { isValidIsraeliId } from "@/lib/israeli-id";
import { EMAIL_RE, isFullName, isValidPhone } from "@/lib/donor-validation";

const NEDARIM_IFRAME_URL = "https://www.matara.pro/nedarimplus/Iframe?Mosad=7007067";
const NEDARIM_ORIGIN = "https://www.matara.pro";

type Props = {
  total: number;
  payments: number;
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  onClose: () => void;
};

type NedarimMessage = { Name?: string; Value?: unknown };

type FieldKey = "name" | "idNumber" | "email" | "phone";
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function NedarimIframeModal({
  total,
  payments,
  name: initialName,
  idNumber: initialId,
  email: initialEmail,
  phone: initialPhone,
  onClose,
}: Props) {
  const t = useTranslations("donate.form");
  const isClient = useIsClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(initialName);
  const [idNumber, setIdNumber] = useState(initialId);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const fieldErrorFor = (field: FieldKey, value: string): string => {
    const v = value.trim();
    switch (field) {
      case "name":
        if (v.length === 0) return t("errors.required");
        if (!isFullName(v)) return t("errors.full_name");
        return "";
      case "idNumber":
        if (v.length === 0) return t("errors.required");
        if (!isValidIsraeliId(v)) return t("errors.invalid_id");
        return "";
      case "email":
        if (v.length === 0) return t("errors.required");
        if (!EMAIL_RE.test(v)) return t("errors.invalid_email");
        return "";
      case "phone":
        if (v.length === 0) return t("errors.required");
        if (!isValidPhone(v)) return t("errors.invalid_phone");
        return "";
    }
  };

  const handleBlur = (field: FieldKey, value: string) => {
    const msg = fieldErrorFor(field, value);
    setFieldErrors((prev) => ({ ...prev, [field]: msg || undefined }));
  };

  const clearFieldError = (field: FieldKey) => {
    setFieldErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );
  };

  const validateAll = (): FieldErrors => {
    const e: FieldErrors = {};
    const n = fieldErrorFor("name", name);
    if (n) e.name = n;
    const i = fieldErrorFor("idNumber", idNumber);
    if (i) e.idNumber = i;
    const em = fieldErrorFor("email", email);
    if (em) e.email = em;
    const ph = fieldErrorFor("phone", phone);
    if (ph) e.phone = ph;
    return e;
  };

  useEffect(() => {
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

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== NEDARIM_ORIGIN) return;
      const data = event.data as NedarimMessage | null;
      if (!data || typeof data !== "object") return;
      if (data.Name === "Iframe.Init" || data.Name === "OK" || data.Name === "Loaded") {
        setIframeReady(true);
      }
      if (data.Name === "TransactionResponse") {
        setSubmitting(false);
        const v = data.Value as { Status?: string; Message?: string } | null;
        if (v?.Status === "Error") {
          setError(v.Message || "התשלום נכשל. נסו שוב או בחרו אמצעי תשלום אחר.");
        } else {
          setSuccess(true);
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const sendFields = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const trimmedName = name.trim();
    const [firstName, ...rest] = trimmedName.split(/\s+/);
    const lastName = rest.join(" ");
    win.postMessage(
      {
        Name: "PostFields",
        Value: {
          Mosad: "7007067",
          Zeout: idNumber.trim(),
          FirstName: firstName || trimmedName,
          LastName: lastName,
          Phone: phone.trim(),
          Mail: email.trim(),
          Amount: total > 0 ? String(total) : "",
          Tashlumim: payments > 1 ? String(payments) : "1",
          Currency: "1",
          Groupe: "",
          Comment: "",
        },
      },
      NEDARIM_ORIGIN,
    );
  };

  // Prefill once iframe is ready, then keep in sync if user edits.
  useEffect(() => {
    if (!iframeReady) return;
    sendFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeReady, name, idNumber, email, phone, total, payments]);

  const handleSubmit = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win || submitting) return;
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setError(null);
    sendFields();
    setSubmitting(true);
    win.postMessage({ Name: "FinishTransaction2", Value: "" }, NEDARIM_ORIGIN);
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const summary =
    payments > 1
      ? `₪${total.toLocaleString("he-IL")} · ${payments} תשלומים`
      : `₪${total.toLocaleString("he-IL")}`;

  if (!isClient) return null;

  return createPortal(
    <div
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-md my-auto flex flex-col bg-warm-white rounded-[var(--radius-xl)] shadow-[var(--shadow-elevated)] overflow-hidden">
        <div className="flex items-center justify-between gap-3 bg-navy-950 text-white px-4 sm:px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold-500/15 text-gold-300 ring-1 ring-gold-300/30 shrink-0">
              <ShieldIcon />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-white/60 leading-tight">
                תשלום מאובטח דרך
              </div>
              <div className="text-sm font-[number:var(--font-weight-bold)] tracking-wide truncate">
                Nedarim Plus · נדרים פלוס
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg leading-none flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 bg-stone/60 border-b border-dark/5 text-xs sm:text-[13px]">
          <span className="text-charcoal/80">סכום לתשלום</span>
          <span className="font-[number:var(--font-weight-bold)] text-charcoal tabular-nums">
            {summary}
          </span>
        </div>

        <div className="px-4 sm:px-5 pt-4 pb-3 space-y-3 bg-white">
          <Field
            label={t("name_label")}
            value={name}
            onChange={(v) => {
              setName(v);
              clearFieldError("name");
            }}
            onBlur={() => handleBlur("name", name)}
            error={fieldErrors.name}
            placeholder={t("name_placeholder")}
            autoComplete="name"
          />
          <Field
            label={t("id_label")}
            value={idNumber}
            onChange={(v) => {
              setIdNumber(v.replace(/\D/g, ""));
              clearFieldError("idNumber");
            }}
            onBlur={() => handleBlur("idNumber", idNumber)}
            error={fieldErrors.idNumber}
            inputMode="numeric"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={t("email_label")}
              value={email}
              onChange={(v) => {
                setEmail(v);
                clearFieldError("email");
              }}
              onBlur={() => handleBlur("email", email)}
              error={fieldErrors.email}
              type="email"
              autoComplete="email"
            />
            <Field
              label={t("phone_label")}
              value={phone}
              onChange={(v) => {
                setPhone(v);
                clearFieldError("phone");
              }}
              onBlur={() => handleBlur("phone", phone)}
              error={fieldErrors.phone}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="px-4 sm:px-5 pt-1 pb-2 bg-white">
          <div className="text-[11px] font-[number:var(--font-weight-bold)] text-charcoal/70 mb-1.5">
            פרטי כרטיס
          </div>
        </div>

        <iframe
          ref={iframeRef}
          src={NEDARIM_IFRAME_URL}
          title="Nedarim Plus secure payment"
          className="w-full h-[340px] bg-white"
          allow="payment"
        />

        <div className="px-4 sm:px-5 py-3 bg-white border-t border-dark/5">
          {success ? (
            <div className="text-center text-sm font-[number:var(--font-weight-bold)] text-emerald-700 py-2">
              התרומה התקבלה. תודה!
            </div>
          ) : (
            <>
              {error ? (
                <div
                  role="alert"
                  className="mb-2 rounded-[var(--radius-md)] border border-red-400/40 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  {error}
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full px-4 py-3 rounded-full bg-gradient-to-l from-gold-300 to-gold-500 text-navy-950 text-sm sm:text-base font-[number:var(--font-weight-bold)] shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? "מעבד תשלום…" : `תרמו ${summary}`}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 px-4 py-3 bg-stone/60 border-t border-dark/5">
          <Image
            src="/nedarim-logo.png"
            alt="נדרים פלוס"
            width={56}
            height={56}
            className="rounded-full"
          />
          <div className="text-center text-[11px] leading-tight text-charcoal/80">
            <div>מופעל באמצעות</div>
            <div className="font-[number:var(--font-weight-bold)] text-charcoal">
              נדרים פלוס · מבית מטרה הפקות
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
}) {
  const hasError = Boolean(error);
  return (
    <label className="block">
      <span className="block text-[11px] font-[number:var(--font-weight-bold)] text-charcoal/80 mb-1">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={hasError ? "true" : undefined}
        className={`w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-navy-400/40 transition-colors ${
          hasError
            ? "border-red-400 focus:border-red-400"
            : "border-dark/15 focus:border-navy-400"
        }`}
      />
      {hasError ? (
        <span className="block mt-1 text-[11px] text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
