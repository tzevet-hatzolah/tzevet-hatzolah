import sharp from "sharp";
import path from "path";
import fs from "fs";
import os from "os";
import { HEEBO_BOLD_BASE64 } from "./heebo-bold-base64";

const BG_IMAGE_PATH = path.join(process.cwd(), "public", "bot-bg.jpg");
const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1080;

// Top area reserved for the logo (don't place text here)
const LOGO_RESERVED_TOP = 320;

// Available area for text
const TEXT_PADDING = 60;
const MAX_TEXT_HEIGHT = IMAGE_HEIGHT - LOGO_RESERVED_TOP - TEXT_PADDING * 2;
const TEXT_WIDTH = IMAGE_WIDTH - 120;

// Font sizes to try, from largest to smallest
const FONT_SIZES = [40000, 32000, 26000, 20000, 16000, 12000];

let tempFontPath: string | null = null;

/** Write the embedded font to a temp file so Pango can use it. */
function ensureFontFile(): string {
  if (tempFontPath && fs.existsSync(tempFontPath)) {
    return tempFontPath;
  }
  const fontBuffer = Buffer.from(HEEBO_BOLD_BASE64, "base64");
  tempFontPath = path.join(os.tmpdir(), "Heebo-Bold.ttf");
  fs.writeFileSync(tempFontPath, fontBuffer);
  return tempFontPath;
}

/**
 * Generate an Instagram image with text overlaid on the background.
 * Uses sharp's Pango text rendering with the embedded Heebo font.
 * Automatically scales font size to fit the available area.
 */
export async function generateTextImage(text: string): Promise<Buffer> {
  const bgBuffer = fs.readFileSync(BG_IMAGE_PATH);

  // Resize/crop background to square 1080x1080
  const background = await sharp(bgBuffer)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: "cover", position: "top" })
    .toBuffer();

  const trimmedText = text.trim();

  const fontFile = ensureFontFile();

  // Try font sizes from largest to smallest until text fits
  let textImage: Buffer | null = null;
  let textHeight = 0;
  let textActualWidth = 0;

  for (const fontSize of FONT_SIZES) {
    const pangoText = convertBoldMarkup(trimmedText, fontSize);
    const pangoMarkup = `<span foreground="#000000" size="${fontSize}">${pangoText}</span>`;
    const rendered = await sharp({
      text: {
        text: pangoMarkup,
        fontfile: fontFile,
        font: "Heebo Bold",
        rgba: true,
        width: TEXT_WIDTH,
        align: "centre",
        dpi: 200,
      },
    })
      .png()
      .toBuffer();

    const meta = await sharp(rendered).metadata();
    textHeight = meta.height || 0;
    textActualWidth = meta.width || TEXT_WIDTH;

    if (textHeight <= MAX_TEXT_HEIGHT) {
      textImage = rendered;
      break;
    }
  }

  // If even the smallest font doesn't fit, use it anyway but resize to fit
  if (!textImage) {
    const rendered = await sharp({
      text: {
        text: `<span foreground="#000000" size="${FONT_SIZES[FONT_SIZES.length - 1]}">${convertBoldMarkup(trimmedText, FONT_SIZES[FONT_SIZES.length - 1])}</span>`,
        fontfile: fontFile,
        font: "Heebo Bold",
        rgba: true,
        width: TEXT_WIDTH,
        align: "centre",
        dpi: 200,
      },
    })
      .png()
      .toBuffer();

    textImage = await sharp(rendered)
      .resize({
        width: TEXT_WIDTH,
        height: MAX_TEXT_HEIGHT,
        fit: "inside",
      })
      .toBuffer();

    const meta = await sharp(textImage).metadata();
    textHeight = meta.height || MAX_TEXT_HEIGHT;
    textActualWidth = meta.width || TEXT_WIDTH;
  }

  // Center text vertically in the area below the logo
  const availableHeight = IMAGE_HEIGHT - LOGO_RESERVED_TOP - TEXT_PADDING;
  const topOffset =
    LOGO_RESERVED_TOP + Math.max(0, (availableHeight - textHeight) / 2);
  const leftOffset = Math.max(0, (IMAGE_WIDTH - textActualWidth) / 2);

  const result = await sharp(background)
    .composite([
      {
        input: textImage,
        top: Math.round(topOffset),
        left: Math.round(leftOffset),
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

/**
 * Convert *bold* markers to larger text to make them stand out.
 * Since only the Bold font is available, we increase font size by 15%.
 */
function convertBoldMarkup(text: string, fontSize: number): string {
  const boldSize = Math.round(fontSize * 1.15);
  const parts = text.split(/\*([^*]+)\*/g);
  // parts: [before, bold1, between, bold2, ...] — odd indices are bold
  return parts
    .map((part, i) => {
      const escaped = escapeXml(part);
      return i % 2 === 1 ? `<span size="${boldSize}">${escaped}</span>` : escaped;
    })
    .join("");
}

/** Escape special XML characters for Pango markup. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
