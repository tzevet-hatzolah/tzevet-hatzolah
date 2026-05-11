import { NextResponse } from "next/server";
import { ID_OPT_OUT_MARKER, isValidIsraeliId } from "@/lib/israeli-id";
import { chargeWithToken, isSumitLiveMode } from "@/lib/sumit";

type ChargePayload = {
  total: number;
  payments: number;
  itemSlug?: string | null;
  donor: {
    name: string;
    idNumber: string;
    email: string;
    phone: string;
  };
  ogToken?: string | null;
  locale?: "he" | "en";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d[\d\s-]{6,15}$/;

function validate(p: ChargePayload): string | null {
  if (!Number.isFinite(p.total) || p.total < 1) return "invalid_total";
  if (!Number.isFinite(p.payments) || p.payments < 1 || p.payments > 36)
    return "invalid_payments";
  if (!EMAIL_RE.test(p.donor.email)) return "invalid_email";
  if (p.donor.phone.length > 0 && !PHONE_RE.test(p.donor.phone)) {
    return "invalid_phone";
  }
  // name + idNumber are soft (donor may have opted out of Section 46 receipt).
  // The opt-out marker bypasses checksum validation by design.
  if (
    p.donor.idNumber.length > 0 &&
    p.donor.idNumber !== ID_OPT_OUT_MARKER &&
    !isValidIsraeliId(p.donor.idNumber)
  )
    return "invalid_id";
  return null;
}

function asString(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

function payloadFromForm(form: FormData): ChargePayload {
  const total = parseInt(asString(form.get("total")), 10);
  const payments = parseInt(asString(form.get("payments")), 10);
  const localeRaw = asString(form.get("locale"));
  return {
    total,
    payments,
    itemSlug: asString(form.get("itemSlug")) || null,
    donor: {
      name: asString(form.get("name")).trim(),
      idNumber: asString(form.get("citizenid")).trim(),
      email: asString(form.get("email")).trim(),
      phone: asString(form.get("phone")).trim(),
    },
    // Sumit Payments JS appends og-token; field name varies in their docs
    // ("og-token" / "OGToken") so accept either.
    ogToken:
      asString(form.get("og-token")) || asString(form.get("OGToken")) || null,
    locale: localeRaw === "en" ? "en" : "he",
  };
}

function payloadFromJson(body: unknown): ChargePayload | null {
  if (!body || typeof body !== "object") return null;
  const v = body as Record<string, unknown>;
  const d = v.donor as Record<string, unknown> | undefined;
  if (!d) return null;
  return {
    total: typeof v.total === "number" ? v.total : NaN,
    payments: typeof v.payments === "number" ? v.payments : NaN,
    itemSlug: typeof v.itemSlug === "string" ? v.itemSlug : null,
    donor: {
      name: typeof d.name === "string" ? d.name : "",
      idNumber: typeof d.idNumber === "string" ? d.idNumber : "",
      email: typeof d.email === "string" ? d.email : "",
      phone: typeof d.phone === "string" ? d.phone : "",
    },
    ogToken: typeof v.ogToken === "string" ? v.ogToken : null,
    locale: v.locale === "en" ? "en" : "he",
  };
}

function donateUrl(
  locale: "he" | "en",
  total: number,
  payments: number,
  itemSlug: string | null,
  error: string
): string {
  const qs = new URLSearchParams({
    total: String(total),
    payments: String(payments),
    error,
  });
  if (itemSlug) qs.set("item", itemSlug);
  return `/${locale}/donate?${qs.toString()}`;
}

function todahUrl(locale: "he" | "en", transactionId: string): string {
  const qs = new URLSearchParams({ tx: transactionId });
  return `/${locale}/todah?${qs.toString()}`;
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const isForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  let payload: ChargePayload | null;
  if (isForm) {
    payload = payloadFromForm(await req.formData());
  } else {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid_json" },
        { status: 400 }
      );
    }
    payload = payloadFromJson(json);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "invalid_payload" },
        { status: 400 }
      );
    }
  }

  const err = validate(payload!);
  if (err) {
    if (isForm) {
      const url = donateUrl(
        payload!.locale ?? "he",
        payload!.total,
        payload!.payments,
        payload!.itemSlug ?? null,
        err
      );
      return NextResponse.redirect(new URL(url, req.url), { status: 303 });
    }
    return NextResponse.json({ ok: false, error: err }, { status: 400 });
  }

  // Live mode requires the og-token from Payments JS. In stub mode we accept
  // missing token (no real charge happens anyway).
  if (isSumitLiveMode() && !payload!.ogToken) {
    if (isForm) {
      const url = donateUrl(
        payload!.locale ?? "he",
        payload!.total,
        payload!.payments,
        payload!.itemSlug ?? null,
        "missing_token"
      );
      return NextResponse.redirect(new URL(url, req.url), { status: 303 });
    }
    return NextResponse.json(
      { ok: false, error: "missing_token" },
      { status: 400 }
    );
  }

  const result = await chargeWithToken({
    token: payload!.ogToken ?? "",
    total: payload!.total,
    payments: payload!.payments,
    donor: payload!.donor,
    itemSlug: payload!.itemSlug ?? null,
    locale: payload!.locale ?? "he",
  });

  if (!result.ok) {
    if (isForm) {
      const url = donateUrl(
        payload!.locale ?? "he",
        payload!.total,
        payload!.payments,
        payload!.itemSlug ?? null,
        `charge_${result.error}`
      );
      return NextResponse.redirect(new URL(url, req.url), { status: 303 });
    }
    return NextResponse.json(
      { ok: false, error: `charge_${result.error}` },
      { status: 502 }
    );
  }

  if (isForm) {
    return NextResponse.redirect(
      new URL(todahUrl(payload!.locale ?? "he", result.transactionId), req.url),
      { status: 303 }
    );
  }

  return NextResponse.json({
    ok: true,
    transactionId: result.transactionId,
    redirect: todahUrl(payload!.locale ?? "he", result.transactionId),
  });
}
