import { ID_OPT_OUT_MARKER } from "@/lib/israeli-id";

// Server-side Sumit charge client.
//
// Stub-first: when SUMIT_PRIVATE_API_KEY or NEXT_PUBLIC_SUMIT_COMPANY_ID are
// not set, charge() returns a synthetic success so the donation flow can be
// exercised end-to-end without real money movement. Once both are set, real
// REST calls are issued against SUMIT_API_BASE (defaults to api.sumit.co.il).
//
// Two endpoints, picked by the caller's `payments` value:
//  - payments === 1   → POST /billing/payments/charge/   (single charge)
//  - payments  >  1   → POST /billing/recurring/charge/  (N monthly charges,
//                                                         donor can cancel,
//                                                         receipt per cycle)
//
// Both schemas verified against app.sumit.co.il/developers/api/.

export type SumitDonor = {
  name: string;
  idNumber: string;
  email: string;
  phone: string;
};

export type SumitChargeInput = {
  // og-token from Payments JS (single-use card token; citizenid baked in).
  token: string;
  // Total ILS the donor agreed to give. For monthly recurring we divide it
  // by `payments` to get the per-cycle amount.
  total: number;
  // 1 = single charge; >1 = N monthly recurring charges.
  payments: number;
  donor: SumitDonor;
  itemSlug?: string | null;
  locale: "he" | "en";
};

export type SumitChargeResult =
  | { ok: true; transactionId: string; receiptUrl?: string }
  | { ok: false; error: string };

const DEFAULT_API_BASE = "https://api.sumit.co.il";

// DocumentType enum values from the schema.
const DOC_TYPE_DONATION_RECEIPT = 4; // סעיף 46-eligible

// DocumentLanguage enum values.
const DOC_LANG_HEBREW = 0;
const DOC_LANG_ENGLISH = 1;

// Customer.SearchMode = 1 = None — never match an existing customer; create a
// fresh record per donation. A donation is a snapshot in time, so each receipt
// carries exactly the name/email/ID/phone the donor typed at the moment of
// giving, with no risk of stale data from a prior donation overwriting it.
const CUSTOMER_SEARCH_NONE = 1;

export function isSumitLiveMode(): boolean {
  return Boolean(
    process.env.SUMIT_PRIVATE_API_KEY &&
      process.env.NEXT_PUBLIC_SUMIT_COMPANY_ID
  );
}

export async function chargeWithToken(
  input: SumitChargeInput
): Promise<SumitChargeResult> {
  if (!isSumitLiveMode()) {
    console.log("[sumit:stub]", {
      payments: input.payments,
      total: input.total,
      itemSlug: input.itemSlug ?? null,
      donor: { name: input.donor.name, email: input.donor.email },
      hasToken: Boolean(input.token),
    });
    return {
      ok: true,
      transactionId: `stub-${Date.now()}`,
    };
  }

  const base = (process.env.SUMIT_API_BASE || DEFAULT_API_BASE).replace(
    /\/$/,
    ""
  );

  // Every payment from this site is a donation, regardless of whether the
  // donor identified themselves with a real Israeli ID — the org wants
  // consistent categorization in Sumit. Donors who opt out of providing ID
  // get a DonationReceipt with 999999999 printed on it (not סעיף 46-valid
  // for the donor's tax purposes, but accounted as donation income).
  const documentType = DOC_TYPE_DONATION_RECEIPT;

  const isRecurring = input.payments > 1;
  const credentials = {
    CompanyID: Number(process.env.NEXT_PUBLIC_SUMIT_COMPANY_ID),
    APIKey: process.env.SUMIT_PRIVATE_API_KEY,
  };

  // Sumit's customer card has a single "ת.ז./ח.פ." slot that maps to
  // CompanyNumber on the Customer entity — it accepts both individual
  // citizen IDs and business tax IDs. For opt-out donors we send the
  // 999999999 marker so the slot is never blank.
  const donorTaxId = input.donor.idNumber || ID_OPT_OUT_MARKER;
  const customer = {
    Name: input.donor.name || null,
    EmailAddress: input.donor.email,
    Phone: input.donor.phone || null,
    CompanyNumber: donorTaxId,
    SearchMode: CUSTOMER_SEARCH_NONE,
  };
  const documentLanguage =
    input.locale === "en" ? DOC_LANG_ENGLISH : DOC_LANG_HEBREW;

  const itemName = isRecurring
    ? input.locale === "en"
      ? "Monthly donation to Tzevet Hatzolah"
      : "תרומה חודשית לצוות הצלה"
    : input.locale === "en"
    ? "Donation to Tzevet Hatzolah"
    : "תרומה לצוות הצלה";

  const path = isRecurring
    ? "/billing/recurring/charge/"
    : "/billing/payments/charge/";

  const body: Record<string, unknown> = isRecurring
    ? {
        Credentials: credentials,
        SingleUseToken: input.token,
        Customer: customer,
        Items: [
          {
            Item: {
              Name: itemName,
              Duration_Months: 1,
              ExternalIdentifier: input.itemSlug || null,
            },
            Quantity: 1,
            UnitPrice: Math.round((input.total / input.payments) * 100) / 100,
            Recurrence: input.payments,
          },
        ],
        DocumentType: documentType,
        DocumentLanguage: documentLanguage,
        UpdateCustomerByEmail: true,
        UpdateCustomerByEmail_AttachDocument: true,
      }
    : {
        Credentials: credentials,
        SingleUseToken: input.token,
        Customer: customer,
        Items: [
          {
            Item: {
              Name: itemName,
              ExternalIdentifier: input.itemSlug || null,
            },
            Quantity: 1,
            UnitPrice: input.total,
          },
        ],
        DocumentType: documentType,
        DocumentLanguage: documentLanguage,
        SendDocumentByEmail: true,
      };

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[sumit:network]", err);
    return { ok: false, error: "network" };
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    console.error("[sumit:http_error]", res.status, payload);
    return { ok: false, error: `http_${res.status}` };
  }

  // Sumit signals app-level success via Status. Their docs show it as a
  // string "Success (0)" but the tokenization endpoint returns the raw int 0
  // — accept both forms.
  const wrapped = (payload ?? {}) as {
    Status?: number | string;
    UserErrorMessage?: string | null;
  };
  if (!isSumitSuccessStatus(wrapped.Status)) {
    console.error("[sumit:status_error]", payload);
    return {
      ok: false,
      error: wrapped.UserErrorMessage || `status_${wrapped.Status ?? "unknown"}`,
    };
  }

  // Status: 0 only means the request was processed — the actual charge
  // result lives in Data.Payment.ValidPayment. A declined/expired card
  // returns Status: 0 with ValidPayment: false plus a StatusDescription.
  const paymentInfo = extractPaymentInfo(payload);
  if (paymentInfo && paymentInfo.validPayment === false) {
    console.error("[sumit:payment_invalid]", payload);
    return {
      ok: false,
      error:
        paymentInfo.statusDescription ||
        wrapped.UserErrorMessage ||
        "payment_invalid",
    };
  }

  const transactionId = extractTransactionId(payload);
  if (!transactionId) {
    console.error("[sumit:bad_response]", payload);
    return { ok: false, error: "bad_response" };
  }

  // Verification log — what Sumit captured from the citizenid form field via
  // the SingleUseToken. Useful for confirming the donor's ID flowed through
  // when the dashboard is hard to read. Remove once the round-trip is trusted.
  const captured = extractDonorEcho(payload);
  if (captured) {
    console.log("[sumit:donor_captured]", {
      transactionId,
      ...captured,
    });
  }

  return {
    ok: true,
    transactionId,
    receiptUrl: extractReceiptUrl(payload),
  };
}

function extractPaymentInfo(
  payload: unknown
): { validPayment: boolean | null; statusDescription: string | null } | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as Record<string, unknown>).Data as
    | Record<string, unknown>
    | undefined;
  const payment = data?.Payment as Record<string, unknown> | undefined;
  if (!payment) return null;
  return {
    validPayment:
      typeof payment.ValidPayment === "boolean" ? payment.ValidPayment : null,
    statusDescription:
      typeof payment.StatusDescription === "string"
        ? payment.StatusDescription
        : null,
  };
}

function extractDonorEcho(
  payload: unknown
): { citizenId: string | null; cardLast4: string | null } | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as Record<string, unknown>).Data as
    | Record<string, unknown>
    | undefined;
  const pm = (data?.Payment as Record<string, unknown> | undefined)
    ?.PaymentMethod as Record<string, unknown> | undefined;
  if (!pm) return null;
  const citizenId =
    typeof pm.CreditCard_CitizenID === "string"
      ? pm.CreditCard_CitizenID
      : null;
  const cardLast4 =
    typeof pm.CreditCard_LastDigits === "string"
      ? pm.CreditCard_LastDigits
      : null;
  return { citizenId, cardLast4 };
}

function isSumitSuccessStatus(status: unknown): boolean {
  if (status === 0) return true;
  if (typeof status === "string") {
    return status === "0" || status.startsWith("Success");
  }
  return false;
}

function extractTransactionId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const data = p.Data as Record<string, unknown> | undefined;
  // One-time charges put it at Data.Payment.ID. Recurring may place it
  // elsewhere — schema not yet seen — so check a few sensible fallbacks.
  const candidates = [
    (data?.Payment as Record<string, unknown> | undefined)?.ID,
    data?.PaymentID,
    data?.ID,
    (data?.Recurring as Record<string, unknown> | undefined)?.ID,
  ];
  for (const c of candidates) {
    if (typeof c === "number") return String(c);
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

function extractReceiptUrl(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  const data = p.Data as Record<string, unknown> | undefined;
  const url = data?.DocumentDownloadURL;
  return typeof url === "string" && url.length > 0 ? url : undefined;
}
