import { ImageResponse } from "next/og";
// @ts-expect-error - bidi-js has no type declarations
import bidiFactory from "bidi-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "צוות הצלה · Tzevet Hatzolah";

const bidi = bidiFactory();

function toVisual(text: string, baseDir: "ltr" | "rtl" = "rtl") {
  const levels = bidi.getEmbeddingLevels(text, baseDir);
  const segments = bidi.getReorderSegments(text, levels);
  const chars = Array.from(text);
  for (const [start, end] of segments) {
    const reversed = chars.slice(start, end + 1).reverse();
    for (let i = start; i <= end; i++) chars[i] = reversed[i - start];
  }
  return chars.join("");
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";

  const [heeboBold, logoBuffer] = await Promise.all([
    readFile(join(process.cwd(), "public/fonts/Heebo-Bold.ttf")),
    readFile(join(process.cwd(), "public/logo-circle.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  const title = isEn ? "Tzevet Hatzolah" : toVisual("צוות הצלה");
  const subtitle = isEn
    ? "Volunteer Emergency Rescue · Active 24/7"
    : toVisual("ארגון חירום להצלת חיים · פעיל 24/7");

  const logo = <img src={logoSrc} width={340} height={340} alt="" />;
  const textBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isEn ? "flex-start" : "flex-end",
      }}
    >
      <div
        style={{
          fontSize: 84,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: isEn ? -1 : 0,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 32,
          fontWeight: 400,
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.3,
        }}
      >
        {subtitle}
      </div>
      <div
        style={{
          marginTop: 40,
          height: 4,
          width: 120,
          background: "#facc15",
          borderRadius: 2,
        }}
      />
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 60,
          padding: 80,
          background:
            "linear-gradient(135deg, #0b1333 0%, #204085 60%, #2c5aa0 100%)",
          color: "white",
          fontFamily: "Heebo",
        }}
      >
        {isEn ? logo : textBlock}
        {isEn ? textBlock : logo}
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Heebo",
          data: heeboBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
