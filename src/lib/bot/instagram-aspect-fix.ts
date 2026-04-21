import sharp from "sharp";

const MIN_RATIO = 0.8; // 4:5 portrait
const MAX_RATIO = 1.91; // 1.91:1 landscape
const TARGET_PORTRAIT = 0.8; // 4:5
const TARGET_LANDSCAPE = 1.91; // 1.91:1

/**
 * Instagram rejects images outside [4:5, 1.91:1]. For any photo outside that
 * range, re-render it onto a blurred copy of itself sized to the nearest
 * allowed ratio, so nothing is cropped out.
 */
export async function normalizeForInstagram(input: Buffer): Promise<Buffer> {
  const image = sharp(input, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return input;

  const ratio = width / height;
  if (ratio >= MIN_RATIO && ratio <= MAX_RATIO) return input;

  const targetRatio = ratio < MIN_RATIO ? TARGET_PORTRAIT : TARGET_LANDSCAPE;

  let canvasWidth: number;
  let canvasHeight: number;
  if (ratio < targetRatio) {
    // Too tall — keep height, widen canvas
    canvasHeight = height;
    canvasWidth = Math.round(height * targetRatio);
  } else {
    // Too wide — keep width, heighten canvas
    canvasWidth = width;
    canvasHeight = Math.round(width / targetRatio);
  }

  const original = await sharp(input, { failOn: "none" })
    .rotate()
    .toBuffer();

  const background = await sharp(original)
    .resize(canvasWidth, canvasHeight, { fit: "cover" })
    .blur(40)
    .modulate({ brightness: 0.85 })
    .toBuffer();

  const left = Math.round((canvasWidth - width) / 2);
  const top = Math.round((canvasHeight - height) / 2);

  return sharp(background)
    .composite([{ input: original, left, top }])
    .jpeg({ quality: 90 })
    .toBuffer();
}
