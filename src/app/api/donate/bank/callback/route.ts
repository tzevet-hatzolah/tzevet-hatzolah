import { NextResponse } from "next/server";

// Nedarim's documented source IP for callbacks. They explicitly tell us to
// verify the request comes from this address so we can reject spoofed posts.
const NEDARIM_CALLBACK_IP = "18.194.219.73";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0]?.trim() || "";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (process.env.NODE_ENV === "production" && ip && ip !== NEDARIM_CALLBACK_IP) {
    console.warn("[nedarim:bank:callback:bad_ip]", ip);
    return new NextResponse("forbidden", { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body: Record<string, unknown> = {};
  try {
    if (contentType.includes("application/json")) {
      body = (await req.json()) as Record<string, unknown>;
    } else {
      const form = await req.formData();
      form.forEach((v, k) => {
        body[k] = typeof v === "string" ? v : "";
      });
    }
  } catch (e) {
    console.warn("[nedarim:bank:callback:parse]", e);
    return new NextResponse("bad request", { status: 400 });
  }

  console.log("[nedarim:bank:callback]", {
    ip,
    trackingId: body.Param2 ?? null,
    transactionId: body.TransactionId ?? null,
    amount: body.Amount ?? null,
    status: body.Status ?? body.TransactionType ?? null,
  });

  return NextResponse.json({ ok: true });
}
