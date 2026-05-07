import { NextResponse } from "next/server";
import { isValidIsraeliId } from "@/lib/israeli-id";

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
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d[\d\s-]{6,15}$/;

function isPayload(x: unknown): x is ChargePayload {
  if (!x || typeof x !== "object") return false;
  const v = x as Record<string, unknown>;
  if (typeof v.total !== "number" || v.total < 1) return false;
  if (typeof v.payments !== "number" || v.payments < 1 || v.payments > 36) return false;
  const d = v.donor as Record<string, unknown> | undefined;
  if (!d) return false;
  // Hard-required: email, phone (we always need to reach the donor).
  if (typeof d.email !== "string" || !EMAIL_RE.test(d.email)) return false;
  if (typeof d.phone !== "string" || !PHONE_RE.test(d.phone)) return false;
  // Soft-required: name + idNumber. Empty allowed (donor opted out of Section 46
  // receipt via the warning dialog). If idNumber is non-empty, it must be valid.
  if (typeof d.name !== "string") return false;
  if (typeof d.idNumber !== "string") return false;
  if (d.idNumber.length > 0 && !isValidIsraeliId(d.idNumber)) return false;
  return true;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (!isPayload(body)) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400 }
    );
  }

  const monthly = Math.round(body.total / body.payments);

  // STUB: real Sumit charge call lands once test-org keys + API spec are confirmed.
  // For now, log enough to verify the form wired correctly end-to-end.
  console.log("[donate/charge:stub]", {
    item: body.itemSlug ?? "(none)",
    total: body.total,
    payments: body.payments,
    monthly,
    donor: { name: body.donor.name, email: body.donor.email },
    hasToken: Boolean(body.ogToken),
  });

  return NextResponse.json({
    ok: true,
    transactionId: `stub-${Date.now()}`,
    redirect: "/todah",
  });
}
