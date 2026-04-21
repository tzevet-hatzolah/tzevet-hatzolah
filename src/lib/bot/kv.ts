/**
 * Thin wrapper around Upstash Redis for cross-invocation state.
 * Falls back to an in-memory Map when Upstash env vars aren't set
 * (local dev without the Redis integration attached).
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch {
  console.warn(
    "[KV] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — " +
      "using in-memory fallback. State will NOT survive across function instances."
  );
}

interface MemEntry {
  value: unknown;
  expiresAt?: number;
}

const mem = new Map<string, MemEntry>();

function memCleanup() {
  const now = Date.now();
  for (const [k, e] of mem) {
    if (e.expiresAt && now > e.expiresAt) mem.delete(k);
  }
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (redis) {
    const v = await redis.get<T>(key);
    return v ?? null;
  }
  memCleanup();
  const entry = mem.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    mem.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function kvSet(
  key: string,
  value: unknown,
  ttlSeconds?: number
): Promise<void> {
  if (redis) {
    if (ttlSeconds) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    return;
  }
  mem.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
}

export async function kvDel(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
    return;
  }
  mem.delete(key);
}
