import sharp from "sharp";
import path from "path";
import fs from "fs";

const BG_IMAGE_PATH = path.join(process.cwd(), "public", "bot-bg.jpg");
const FONT_PATH = path.join(
  process.cwd(),
  "src",
  "lib",
  "bot",
  "fonts",
  "Heebo-Bold.ttf"
);
const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1080;

// Top area reserved for the logo (don't place text here)
const LOGO_RESERVED_TOP = 280;

/**
 * Generate an Instagram image with text overlaid on the background.
 * Uses sharp's Pango text rendering with the bundled Heebo font
 * for reliable Hebrew support on serverless.
 */
export async function generateTextImage(text: string): Promise<Buffer> {
  const bgBuffer = fs.readFileSync(BG_IMAGE_PATH);

  // Resize/crop background to square 1080x1080
  const background = await sharp(bgBuffer)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: "cover", position: "top" })
    .toBuffer();

  // Strip * from text for plain display
  const plainText = text.replace(/\*/g, "").trim();
  const escapedText = escapeXml(plainText);

  // Render red text with white outline using Pango markup
  const textWidth = IMAGE_WIDTH - 120;
  const textImage = await sharp({
    text: {
      text: `<span foreground="#CC0000" size="40000">${escapedText}</span>`,
      fontfile: FONT_PATH,
      font: "Heebo Bold",
      rgba: true,
      width: textWidth,
      align: "centre",
      dpi: 200,
    },
  })
    .png()
    .toBuffer();

  // Get text image dimensions for centering
  const textMeta = await sharp(textImage).metadata();
  const textHeight = textMeta.height || 0;
  const textActualWidth = textMeta.width || textWidth;

  // Center text vertically in the area below the logo
  const availableHeight = IMAGE_HEIGHT - LOGO_RESERVED_TOP;
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

/** Escape special XML characters for Pango markup. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
