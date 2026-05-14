import { NextResponse } from "next/server";
import { lookupOfficialBankBranch } from "@/lib/bank-branch-registry";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bank = searchParams.get("bank") ?? "";
  const branch = searchParams.get("branch");

  try {
    const lookup = await lookupOfficialBankBranch(bank, branch);
    return NextResponse.json({ ok: true, ...lookup });
  } catch (e) {
    console.warn("[nedarim:bank:lookup_unavailable]", e);
    return NextResponse.json(
      { ok: false, error: "lookup_unavailable" },
      { status: 503 }
    );
  }
}
