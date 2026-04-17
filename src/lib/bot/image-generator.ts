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

let fontBase64Cache: string | null = null;

function getFontBase64(): string {
  if (!fontBase64Cache) {
    const fontBuffer = fs.readFileSync(FONT_PATH);
    fontBase64Cache = fontBuffer.toString("base64");
  }
  return fontBase64Cache;
}

/**
 * Generate an Instagram image with text overlaid on the background.
 * Text is red, centered in the middle (below the logo area),
 * with the Heebo font embedded for Hebrew support.
 */
export async function generateTextImage(text: string): Promise<Buffer> {
  const bgBuffer = fs.readFileSync(BG_IMAGE_PATH);

  // Resize/crop background to square 1080x1080
  const background = await sharp(bgBuffer)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: "cover", position: "top" })
    .toBuffer();

  // Strip * from text for plain display
  const plainText = text.replace(/\*/g, "");

  // Split text into lines for wrapping
  const lines = wrapText(plainText, 22);

  const fontSize = 56;
  const lineHeight = 80;
  const totalTextHeight = lines.length * lineHeight;

  // Center text vertically in the area below the logo
  const availableHeight = IMAGE_HEIGHT - LOGO_RESERVED_TOP;
  const textStartY =
    LOGO_RESERVED_TOP + (availableHeight - totalTextHeight) / 2;

  const fontData = getFontBase64();

  const textElements = lines
    .map((line, i) => {
      const y = textStartY + i * lineHeight + fontSize;
      const escapedLine = escapeXml(line);
      return `<text x="50%" y="${y}" text-anchor="middle" dominant-baseline="middle">${escapedLine}</text>`;
    })
    .join("\n    ");

  const svgOverlay = `
  <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face {
          font-family: 'Heebo';
          src: url('data:font/truetype;base64,${fontData}') format('truetype');
          font-weight: bold;
        }
        text {
          font-family: 'Heebo', sans-serif;
          font-size: ${fontSize}px;
          font-weight: bold;
          fill: #CC0000;
          direction: rtl;
          paint-order: stroke;
          stroke: white;
          stroke-width: 4px;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      </style>
    </defs>
    ${textElements}
  </svg>`;

  const result = await sharp(background)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

/** Simple word-wrap for Hebrew/English text. */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxCharsPerLine && currentLine) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
}

/** Escape special XML characters for SVG. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
