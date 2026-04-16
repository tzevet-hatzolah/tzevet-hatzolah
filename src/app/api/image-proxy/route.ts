import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxies Telegram file URLs so Instagram can fetch them
 * with proper content-type headers.
 * Usage: /api/image-proxy?url=<telegram-file-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("https://api.telegram.org/file/bot")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
