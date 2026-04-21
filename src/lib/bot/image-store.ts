/**
 * KV-backed store for bot-generated images (the Instagram text-card previews).
 * The image is fetched later by Facebook's servers via /api/generated-image,
 * so the buffer must be reachable from any serverless instance — hence KV.
 */

import { kvGet, kvSet } from "./kv";

const TTL_SECONDS = 5 * 60;

export async function storeImage(id: string, buffer: Buffer): Promise<void> {
  const b64 = buffer.toString("base64");
  await kvSet(`bot:image:${id}`, b64, TTL_SECONDS);
}

export async function getImage(id: string): Promise<Buffer | null> {
  const b64 = await kvGet<string>(`bot:image:${id}`);
  if (!b64) return null;
  return Buffer.from(b64, "base64");
}
