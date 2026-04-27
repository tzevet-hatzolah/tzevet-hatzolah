import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GRAPH_API = "https://graph.facebook.com/v25.0";
const TELEGRAM_API = "https://api.telegram.org/bot";

const REQUIRED_SCOPES = [
  "pages_manage_posts",
  "instagram_content_publish",
];

const DATA_ACCESS_WARN_DAYS = 30;

interface DebugTokenResponse {
  data?: {
    is_valid?: boolean;
    type?: string;
    expires_at?: number;
    data_access_expires_at?: number;
    profile_id?: string;
    scopes?: string[];
    error?: { message?: string };
  };
}

interface HealthResult {
  ok: boolean;
  problems: string[];
  detail: {
    type?: string;
    is_valid?: boolean;
    expires_at?: number;
    data_access_expires_at?: number;
    data_access_days_remaining?: number;
    missing_scopes?: string[];
  };
}

async function checkFacebookToken(): Promise<HealthResult> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) {
    return {
      ok: false,
      problems: ["FACEBOOK_PAGE_ACCESS_TOKEN is not set"],
      detail: {},
    };
  }

  const url = `${GRAPH_API}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const json = (await res.json()) as DebugTokenResponse;

  if (json.data?.error) {
    return {
      ok: false,
      problems: [`debug_token error: ${json.data.error.message}`],
      detail: {},
    };
  }
  if (!json.data) {
    return {
      ok: false,
      problems: ["debug_token returned no data"],
      detail: {},
    };
  }

  const d = json.data;
  const problems: string[] = [];

  if (d.is_valid !== true) problems.push("is_valid is not true");
  if (d.type !== "PAGE") problems.push(`type is ${d.type}, expected PAGE`);
  if (d.expires_at && d.expires_at !== 0) {
    problems.push(
      `token has finite expiry (expires_at=${d.expires_at})`
    );
  }

  let daysRemaining: number | undefined;
  if (d.data_access_expires_at && d.data_access_expires_at > 0) {
    const now = Math.floor(Date.now() / 1000);
    daysRemaining = Math.floor(
      (d.data_access_expires_at - now) / 86400
    );
    if (daysRemaining < DATA_ACCESS_WARN_DAYS) {
      problems.push(
        `data_access expires in ${daysRemaining} days (< ${DATA_ACCESS_WARN_DAYS})`
      );
    }
  }

  const missingScopes = REQUIRED_SCOPES.filter(
    (s) => !d.scopes?.includes(s)
  );
  if (missingScopes.length > 0) {
    problems.push(`missing scopes: ${missingScopes.join(", ")}`);
  }

  return {
    ok: problems.length === 0,
    problems,
    detail: {
      type: d.type,
      is_valid: d.is_valid,
      expires_at: d.expires_at,
      data_access_expires_at: d.data_access_expires_at,
      data_access_days_remaining: daysRemaining,
      missing_scopes: missingScopes.length > 0 ? missingScopes : undefined,
    },
  };
}

async function notifyOwner(text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowed = process.env.TELEGRAM_ALLOWED_USERS;
  if (!botToken || !allowed) return;

  const recipients = allowed
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((id) => !Number.isNaN(id));

  await Promise.all(
    recipients.map((chatId) =>
      fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }).catch((e) =>
        console.error(`[FB Health] Failed to notify ${chatId}:`, e)
      )
    )
  );
}

export async function GET(request: NextRequest) {
  // Vercel cron requests carry an Authorization: Bearer <CRON_SECRET> header.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await checkFacebookToken();

  if (!result.ok) {
    const lines = [
      "⚠️ בדיקת טוקן פייסבוק נכשלה",
      "",
      ...result.problems.map((p) => `• ${p}`),
      "",
      "פעל לפי שלבי החידוש: צור Page token חדש דרך Graph API Explorer ועדכן את FACEBOOK_PAGE_ACCESS_TOKEN ב-Vercel.",
    ];
    await notifyOwner(lines.join("\n"));
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
