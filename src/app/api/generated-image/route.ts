import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getImage } from "@/lib/bot/image-store";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const buffer = await getImage(id);
  if (!buffer) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=300",
    },
  });
}
