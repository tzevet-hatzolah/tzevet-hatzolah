import { Redis } from "@upstash/redis";
import type { PhotoFile } from "./types";

interface PendingGroup {
  chatId: number;
  senderId: number;
  senderName: string;
  text: string;
  photos: PhotoFile[];
  lastUpdated: number;
}

/**
 * Collects photos from Telegram media groups across serverless invocations.
 *
 * Telegram delivers each photo of an album as a separate webhook update sharing
 * the same `media_group_id`. Vercel can route those updates to different
 * function instances, so the collector stores state in Upstash Redis using
 * atomic primitives (RPUSH for photos, HSET for metadata) — no read-modify-write
 * race when two photos arrive at different instances simultaneously.
 *
 * Each request appends its photo and schedules a delayed claim. Only one claim
 * across all instances succeeds (SET NX); others release the lock if more
 * photos are still arriving, until the final claim picks up the full album.
 *
 * If Upstash env vars aren't set (local dev), falls back to a single-process
 * in-memory Map.
 */

const WAIT_MS = 3000;
const ELAPSED_THRESHOLD_MS = WAIT_MS - 500;
const GROUP_TTL_SEC = 60;
const CLAIM_TTL_SEC = 60;

let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch {
  // Local dev without Upstash — fall through to in-memory map.
}

const memGroups = new Map<string, PendingGroup>();

const k = {
  meta: (id: string) => `bot:mg:${id}:meta`,
  photos: (id: string) => `bot:mg:${id}:photos`,
  ts: (id: string) => `bot:mg:${id}:ts`,
  claim: (id: string) => `bot:mg:${id}:claim`,
};

export async function addToMediaGroup(
  mediaGroupId: string,
  photo: PhotoFile,
  text: string,
  chatId: number,
  senderId: number,
  senderName: string
): Promise<void> {
  if (redis) {
    const now = Date.now();
    const pipeline = redis.pipeline();
    pipeline.rpush(k.photos(mediaGroupId), JSON.stringify(photo));
    pipeline.expire(k.photos(mediaGroupId), GROUP_TTL_SEC);
    pipeline.hset(k.meta(mediaGroupId), {
      chatId: String(chatId),
      senderId: String(senderId),
      senderName,
    });
    // Caption arrives on only one of the album's webhook calls; first non-empty wins.
    if (text) pipeline.hsetnx(k.meta(mediaGroupId), "text", text);
    pipeline.expire(k.meta(mediaGroupId), GROUP_TTL_SEC);
    pipeline.set(k.ts(mediaGroupId), now, { ex: GROUP_TTL_SEC });
    await pipeline.exec();
    return;
  }

  const existing = memGroups.get(mediaGroupId);
  if (existing) {
    existing.photos.push(photo);
    if (text && !existing.text) existing.text = text;
    existing.lastUpdated = Date.now();
  } else {
    memGroups.set(mediaGroupId, {
      chatId,
      senderId,
      senderName,
      text,
      photos: [photo],
      lastUpdated: Date.now(),
    });
  }
}

export async function claimMediaGroup(
  mediaGroupId: string
): Promise<PendingGroup | null> {
  await new Promise((r) => setTimeout(r, WAIT_MS));

  if (redis) {
    return claimFromRedis(mediaGroupId);
  }

  const group = memGroups.get(mediaGroupId);
  if (!group) return null;
  const elapsed = Date.now() - group.lastUpdated;
  if (elapsed < ELAPSED_THRESHOLD_MS) return null;
  memGroups.delete(mediaGroupId);
  return group;
}

async function claimFromRedis(
  mediaGroupId: string
): Promise<PendingGroup | null> {
  if (!redis) return null;

  // Atomic claim — only one instance across the fleet wins this round.
  const claimed = await redis.set(k.claim(mediaGroupId), "1", {
    nx: true,
    ex: CLAIM_TTL_SEC,
  });
  if (claimed !== "OK") return null;

  const ts = await redis.get<number>(k.ts(mediaGroupId));
  if (!ts) {
    await redis.del(k.claim(mediaGroupId));
    return null;
  }

  const elapsed = Date.now() - Number(ts);
  if (elapsed < ELAPSED_THRESHOLD_MS) {
    // More photos are still arriving. Release the claim so a later caller takes it.
    await redis.del(k.claim(mediaGroupId));
    return null;
  }

  const meta = await redis.hgetall<{
    chatId?: string;
    senderId?: string;
    senderName?: string;
    text?: string;
  }>(k.meta(mediaGroupId));
  const photoEntries = await redis.lrange(k.photos(mediaGroupId), 0, -1);

  await redis.del(
    k.meta(mediaGroupId),
    k.photos(mediaGroupId),
    k.ts(mediaGroupId),
    k.claim(mediaGroupId)
  );

  if (!meta || !meta.chatId || photoEntries.length === 0) return null;

  const photos: PhotoFile[] = photoEntries.map((entry) =>
    typeof entry === "string" ? (JSON.parse(entry) as PhotoFile) : (entry as PhotoFile)
  );

  return {
    chatId: Number(meta.chatId),
    senderId: Number(meta.senderId),
    senderName: meta.senderName ?? "",
    text: meta.text ?? "",
    photos,
    lastUpdated: Number(ts),
  };
}
