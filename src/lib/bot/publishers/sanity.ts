import type { BotMessage, PublishResult } from "../types";
import { getWriteClient } from "@/sanity/lib/writeClient";

const CREDIT_MATCH = /דוברות\s+צוות\s+הצלה|tzevet\s+hatzolah\s+spokesperson/i;

type ParsedArticle = {
  title: string;
  excerpt?: string;
  bodyLines: string[];
};

/**
 * Parse bot text into a news article shape:
 *   line 1  → title (removed from body)
 *   line 2  → excerpt (kept as first body paragraph)
 *   rest    → body
 * Lines containing the "דוברות צוות הצלה" credit are removed first.
 */
export function parseBotTextAsArticle(text: string): ParsedArticle | null {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !CREDIT_MATCH.test(line));

  if (rows.length < 2) return null;

  const title = stripStars(rows[0]);
  const excerpt = stripStars(rows[1]);
  const bodyLines = rows.filter((_, i) => i !== 0);

  return { title, excerpt, bodyLines };
}

/** Remove Telegram-style *bold* markers, leaving the plain text. */
function stripStars(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1");
}

function randomKey() {
  return Math.random().toString(36).slice(2, 12);
}

function makeSlug(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const rand = Math.random().toString(36).slice(2, 6);
  return `${dateStr}-${rand}`;
}

/** Split a line into spans, turning *text* segments into strong-marked spans. */
function lineToSpans(text: string) {
  const spans: Array<{ _type: "span"; _key: string; text: string; marks: string[] }> = [];
  const regex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({
        _type: "span",
        _key: randomKey(),
        text: text.slice(lastIndex, match.index),
        marks: [],
      });
    }
    spans.push({
      _type: "span",
      _key: randomKey(),
      text: match[1],
      marks: ["strong"],
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    spans.push({
      _type: "span",
      _key: randomKey(),
      text: text.slice(lastIndex),
      marks: [],
    });
  }
  if (spans.length === 0) {
    spans.push({ _type: "span", _key: randomKey(), text, marks: [] });
  }
  return spans;
}

function linesToPortableText(lines: string[]) {
  return lines.map((text) => ({
    _type: "block",
    _key: randomKey(),
    style: "normal",
    markDefs: [],
    children: lineToSpans(text),
  }));
}

async function uploadPhotoToSanity(
  photoUrl: string,
  alt: string
): Promise<{
  _type: "image";
  asset: { _type: "reference"; _ref: string };
  alt: string;
}> {
  const res = await fetch(photoUrl);
  if (!res.ok) {
    throw new Error(`Failed to download photo: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const asset = await getWriteClient().assets.upload("image", buffer, {
    filename: `bot-upload-${Date.now()}.jpg`,
  });
  return {
    _type: "image",
    asset: { _type: "reference", _ref: asset._id },
    alt,
  };
}

/**
 * Publish a bot message as a newsArticle document in Sanity.
 * First photo → mainImage, remaining photos → gallery.
 */
export async function publishToSanity(
  message: BotMessage,
  photoUrls: string[]
): Promise<PublishResult> {
  try {
    const parsed = parseBotTextAsArticle(message.text);
    if (!parsed) {
      return {
        platform: "sanity",
        success: false,
        error: "טקסט קצר מדי — נדרשות לפחות שתי שורות (כותרת בשורה השנייה)",
      };
    }

    const writeClient = getWriteClient();

    // Upload photos in parallel
    const uploadedImages = await Promise.all(
      photoUrls.map((url) => uploadPhotoToSanity(url, parsed.title))
    );

    const [mainImage, ...galleryImages] = uploadedImages;

    const doc = {
      _type: "newsArticle",
      title: parsed.title,
      slug: { _type: "slug", current: makeSlug() },
      publishedAt: new Date().toISOString(),
      ...(parsed.excerpt ? { excerpt: parsed.excerpt } : {}),
      body: linesToPortableText(parsed.bodyLines),
      ...(mainImage ? { mainImage } : {}),
      ...(galleryImages.length > 0
        ? {
            gallery: galleryImages.map((img) => ({
              ...img,
              _key: randomKey(),
            })),
          }
        : {}),
    };

    await writeClient.create(doc);

    return { platform: "sanity", success: true };
  } catch (error) {
    return {
      platform: "sanity",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
