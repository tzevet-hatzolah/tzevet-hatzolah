import { NextResponse } from "next/server";
import { isValidIsraeliId, ID_OPT_OUT_MARKER } from "@/lib/israeli-id";
import { isFullName } from "@/lib/donor-validation";

const DEBIT_BIT_URL =
  "https://matara.pro/nedarimplus/V6/Files/WebServices/DebitBit.aspx";

const NEDARIM_MOSAD_ID = process.env.NEDARIM_MOSAD_ID ?? "7007067";
const NEDARIM_API_VALID = process.env.NEDARIM_API_VALID ?? "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d[\d\s-]{6,15}$/;

type CreatePayload = {
  total: number;
  itemSlug?: string | null;
  locale?: "he" | "en";
  donor: {
    name: string;
    idNumber: string;
    email: string;
    phone: string;
  };
};

function parsePayload(v: unknown): CreatePayload | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  const d = obj.donor as Record<string, unknown> | undefined;
  if (!d) return null;
  return {
    total: typeof obj.total === "number" ? obj.total : NaN,
    itemSlug: typeof obj.itemSlug === "string" ? obj.itemSlug : null,
    locale: obj.locale === "en" ? "en" : "he",
    donor: {
      name: typeof d.name === "string" ? d.name : "",
      idNumber: typeof d.idNumber === "string" ? d.idNumber : "",
      email: typeof d.email === "string" ? d.email : "",
      phone: typeof d.phone === "string" ? d.phone : "",
    },
  };
}

function validate(p: CreatePayload): string | null {
  if (!Number.isFinite(p.total) || p.total < 1) return "invalid_total";
  // Nedarim's DebitBit requires Phone + ClientName. Email is recommended (no validation on their side).
  if (!isFullName(p.donor.name)) return "invalid_name";
  if (!PHONE_RE.test(p.donor.phone)) return "invalid_phone";
  if (p.donor.email.length > 0 && !EMAIL_RE.test(p.donor.email)) {
    return "invalid_email";
  }
  if (
    p.donor.idNumber.length > 0 &&
    p.donor.idNumber !== ID_OPT_OUT_MARKER &&
    !isValidIsraeliId(p.donor.idNumber)
  ) {
    return "invalid_id";
  }
  return null;
}

function origin(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }
  const payload = parsePayload(json);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400 }
    );
  }
  const err = validate(payload);
  if (err) {
    return NextResponse.json({ ok: false, error: err }, { status: 400 });
  }

  if (!NEDARIM_API_VALID) {
    // Stub mode — useful in dev when the ApiValid secret isn't set yet.
    return NextResponse.json({
      ok: true,
      stub: true,
      redirect: `/${payload.locale ?? "he"}/donate?error=bit_stub`,
    });
  }

  const trackingId = crypto.randomUUID();
  const base = origin(req);
  const locale = payload.locale ?? "he";

  const body = new URLSearchParams({
    Action: "CreateTransaction",
    MosadId: NEDARIM_MOSAD_ID,
    ApiValid: NEDARIM_API_VALID,
    ClientName: payload.donor.name.trim(),
    Phone: payload.donor.phone.replace(/[^\d+]/g, ""),
    Amount: String(payload.total),
    Param2: trackingId,
    UrlSuccess: `${base}/${locale}/todah?tx=${trackingId}`,
    UrlFailure: `${base}/${locale}/donate?error=bit_failed`,
    CallBack: `${base}/api/donate/bit/callback`,
  });
  if (payload.donor.idNumber) body.set("Zeout", payload.donor.idNumber);
  if (payload.donor.email) body.set("Mail", payload.donor.email);
  if (payload.itemSlug) body.set("Comment", `item:${payload.itemSlug}`);

  let upstreamText: string;
  try {
    const res = await fetch(DEBIT_BIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    upstreamText = await res.text();
    if (!res.ok) {
      console.warn("[nedarim:debitbit:http]", res.status, upstreamText);
      return NextResponse.json(
        { ok: false, error: "upstream_http" },
        { status: 502 }
      );
    }
  } catch (e) {
    console.warn("[nedarim:debitbit:network]", e);
    return NextResponse.json(
      { ok: false, error: "upstream_network" },
      { status: 502 }
    );
  }

  // Nedarim returns the Bit payment URL as plain text (e.g. https://nedar.im/<id>).
  // Some integrations may return JSON — handle both.
  const trimmed = upstreamText.trim();
  let redirect: string | null = null;
  if (trimmed.startsWith("http")) {
    redirect = trimmed;
  } else {
    try {
      const parsed = JSON.parse(trimmed) as { Url?: string; url?: string };
      redirect = parsed.Url ?? parsed.url ?? null;
    } catch {
      // not JSON
    }
  }

  if (!redirect) {
    console.warn("[nedarim:debitbit:no_url]", trimmed);
    return NextResponse.json(
      { ok: false, error: "upstream_no_url" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, redirect, trackingId });
}
