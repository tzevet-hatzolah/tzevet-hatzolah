import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "public/logo.jpg");
const appDir = join(root, "src/app");

// Trim whitespace margin once so every downstream size fits edge-to-edge.
const trimmed = await sharp(source)
  .trim({ background: "#ffffff", threshold: 10 })
  .toBuffer();

async function resizePng(size) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  return sharp(trimmed)
    .resize(size, size, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  const payloads = [];
  let offset = 6 + 16 * images.length;

  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(data);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...payloads]);
}

const icon512 = await resizePng(512);
const apple180 = await resizePng(180);
const png16 = await resizePng(16);
const png32 = await resizePng(32);

writeFileSync(join(appDir, "icon.png"), icon512);
writeFileSync(join(appDir, "apple-icon.png"), apple180);
writeFileSync(join(appDir, "favicon.ico"), buildIco([
  { size: 16, data: png16 },
  { size: 32, data: png32 },
]));
writeFileSync(join(root, "public/logo-circle.png"), icon512);

console.log("Generated: icon.png (512), apple-icon.png (180), favicon.ico (16+32), public/logo-circle.png (512)");
