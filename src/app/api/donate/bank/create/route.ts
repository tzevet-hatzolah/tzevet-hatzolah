import { NextResponse } from "next/server";
import { ID_OPT_OUT_MARKER, isValidIsraeliId } from "@/lib/israeli-id";
import { isFullName } from "@/lib/donor-validation";
import { lookupOfficialBankBranch } from "@/lib/bank-branch-registry";

const DEBIT_DIGITAL_TRANSFER_URL =
  "https://matara.pro/nedarimplus/V6/Files/WebServices/DebitDigitalTransfer.aspx?Action=CreateTransaction";

const NEDARIM_MOSAD_ID = process.env.NEDARIM_MOSAD_ID ?? "7007067";
const NEDARIM_API_VALID = process.env.NEDARIM_API_VALID ?? "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d[\d\s-]{6,15}$/;
const BANK_NUMBER_LENGTH = 2;
const BANK_BRANCH_LENGTH = 3;
const BANK_ACCOUNT_MAX_LENGTH = 9;
const MAX_CLIENT_NAME = 50;
const MAX_EMAIL = 50;
const MAX_PHONE = 20;
const MAX_COMMENT = 300;

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
  bank: {
    number: string;
    branch: string;
    account: string;
  };
};

function digitsOnly(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function parsePayload(v: unknown): CreatePayload | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  const d = obj.donor as Record<string, unknown> | undefined;
  const b = obj.bank as Record<string, unknown> | undefined;
  if (!d || !b) return null;
  return {
    total: typeof obj.total === "number" ? obj.total : NaN,
    itemSlug: typeof obj.itemSlug === "string" ? obj.itemSlug : null,
    locale: obj.locale === "en" ? "en" : "he",
    donor: {
      name: typeof d.name === "string" ? d.name : "",
      idNumber: digitsOnly(d.idNumber),
      email: typeof d.email === "string" ? d.email : "",
      phone: typeof d.phone === "string" ? d.phone : "",
    },
    bank: {
      number: digitsOnly(b.number),
      branch: digitsOnly(b.branch),
      account: digitsOnly(b.account),
    },
  };
}

function isExactDigits(value: string, length: number): boolean {
  return new RegExp(`^\\d{${length}}$`).test(value);
}

function isDigits(value: string, max: number): boolean {
  return new RegExp(`^\\d{1,${max}}$`).test(value);
}

function validate(p: CreatePayload): string | null {
  if (!Number.isFinite(p.total) || p.total < 1) return "invalid_total";
  if (!isFullName(p.donor.name)) return "invalid_name";
  if (
    p.donor.idNumber !== ID_OPT_OUT_MARKER &&
    !isValidIsraeliId(p.donor.idNumber)
  ) {
    return "invalid_id";
  }
  if (!EMAIL_RE.test(p.donor.email)) return "invalid_email";
  if (p.donor.phone.length > 0 && !PHONE_RE.test(p.donor.phone)) {
    return "invalid_phone";
  }
  if (!isExactDigits(p.bank.number, BANK_NUMBER_LENGTH) || Number(p.bank.number) < 1) {
    return "invalid_bank";
  }
  if (!isExactDigits(p.bank.branch, BANK_BRANCH_LENGTH) || Number(p.bank.branch) < 1) {
    return "invalid_branch";
  }
  if (!isDigits(p.bank.account, BANK_ACCOUNT_MAX_LENGTH) || Number(p.bank.account) < 1) {
    return "invalid_account";
  }
  return null;
}

function origin(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "";
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

function extractRedirect(upstreamText: string): string | null {
  const trimmed = upstreamText.trim();
  if (trimmed.startsWith("http")) return trimmed.replace(/[.\s]+$/, "");

  try {
    const parsed = JSON.parse(trimmed) as { Url?: string; url?: string };
    return parsed.Url ?? parsed.url ?? null;
  } catch {
    // not JSON
  }

  const match = trimmed.match(/https?:\/\/\S+/);
  return match?.[0]?.replace(/[.\s]+$/, "") ?? null;
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
  try {
    const bankBranchLookup = await lookupOfficialBankBranch(
      payload.bank.number,
      payload.bank.branch
    );
    if (!bankBranchLookup.bankKnown) {
      return NextResponse.json(
        { ok: false, error: "invalid_bank_unknown" },
        { status: 400 }
      );
    }
    if (!bankBranchLookup.bankSupported) {
      return NextResponse.json(
        { ok: false, error: "unsupported_bank" },
        { status: 400 }
      );
    }
    if (bankBranchLookup.branchKnown === false) {
      return NextResponse.json(
        { ok: false, error: "invalid_bank_branch" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.warn("[nedarim:bank:branch_lookup_unavailable]", e);
  }

  if (!NEDARIM_API_VALID) {
    return NextResponse.json({
      ok: true,
      stub: true,
      redirect: `/${payload.locale ?? "he"}/donate?error=bank_stub`,
    });
  }

  const trackingId = crypto.randomUUID();
  const base = origin(req);
  const locale = payload.locale ?? "he";
  const citizenId = payload.donor.idNumber.padStart(9, "0");
  const phoneDigits = payload.donor.phone.replace(/[^\d]/g, "");
  const clientName = payload.donor.name.trim().slice(0, MAX_CLIENT_NAME);
  const email = payload.donor.email.trim().slice(0, MAX_EMAIL);

  const body = new URLSearchParams({
    MosadId: NEDARIM_MOSAD_ID,
    ApiValid: NEDARIM_API_VALID,
    Zeout: citizenId,
    ClientName: clientName,
    Mail: email,
    Amount: String(payload.total),
    Bank: payload.bank.number,
    Agency: payload.bank.branch,
    Account: payload.bank.account,
    Param2: trackingId,
    UrlSuccess: `${base}/${locale}/todah?tx=${trackingId}`,
    UrlFailure: `${base}/${locale}/donate?error=bank_failed`,
    CallBack: `${base}/api/donate/bank/callback`,
  });
  if (phoneDigits) body.set("Phone", phoneDigits.slice(0, MAX_PHONE));
  if (payload.itemSlug) {
    body.set("Comment", `item:${payload.itemSlug}`.slice(0, MAX_COMMENT));
  }

  let upstreamText: string;
  try {
    const res = await fetch(DEBIT_DIGITAL_TRANSFER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    upstreamText = await res.text();
    if (!res.ok) {
      console.warn("[nedarim:bank:http]", res.status, upstreamText);
      return NextResponse.json(
        { ok: false, error: "upstream_http" },
        { status: 502 }
      );
    }
  } catch (e) {
    console.warn("[nedarim:bank:network]", e);
    return NextResponse.json(
      { ok: false, error: "upstream_network" },
      { status: 502 }
    );
  }

  const redirect = extractRedirect(upstreamText);
  if (!redirect) {
    console.warn("[nedarim:bank:no_url]", upstreamText.trim());
    return NextResponse.json(
      { ok: false, error: "upstream_no_url" },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, redirect, trackingId });
}
