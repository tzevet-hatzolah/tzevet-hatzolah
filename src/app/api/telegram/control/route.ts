import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getBotPausedReason,
  isBotPaused,
  isBotPausedByEnv,
  setBotPaused,
} from "@/lib/bot/control";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  return (
    bearer === secret ||
    request.headers.get("x-telegram-bot-api-secret-token") === secret
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paused = await isBotPaused();
  return NextResponse.json({
    ok: true,
    paused,
    envPaused: isBotPausedByEnv(),
    reason: paused ? getBotPausedReason() : null,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    paused?: boolean;
    action?: string;
  };
  const action = request.nextUrl.searchParams.get("action") ?? body.action;
  const paused =
    typeof body.paused === "boolean"
      ? body.paused
      : action === "pause"
        ? true
        : action === "resume"
          ? false
          : null;

  if (paused === null) {
    return NextResponse.json(
      { error: "Use { paused: true } or action=pause|resume" },
      { status: 400 }
    );
  }

  if (!paused && isBotPausedByEnv()) {
    return NextResponse.json(
      {
        error:
          "Bot is paused by TELEGRAM_BOT_PAUSED=true. Change the env var to resume.",
      },
      { status: 409 }
    );
  }

  await setBotPaused(paused);

  return NextResponse.json({
    ok: true,
    paused: await isBotPaused(),
    envPaused: isBotPausedByEnv(),
  });
}
