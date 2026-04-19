import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxies Telegram file URLs so Instagram can fetch them
 * with proper content-type headers.
 * Usage: /api/image-proxy?url=<telegram-file-url>
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  console.log(`[ImageProxy] Request for: ${url?.slice(0, 80)}...`);

  if (!url || !url.startsWith("https://api.telegram.org/file/bot")) {
    console.error(`[ImageProxy] Invalid URL`);
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[ImageProxy] Telegram fetch failed: ${res.status} ${res.statusText}`);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  console.log(`[ImageProxy] Serving ${buffer.byteLength} bytes`);

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
