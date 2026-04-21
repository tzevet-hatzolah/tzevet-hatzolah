/**
 * Per-user platform selection for the bot.
 * Default behavior is "publish to all platforms". When a user narrows the
 * selection via the inline keyboard, that saved selection is used for the
 * next upload, then cleared (see resetUserPlatforms call sites in the webhook).
 *
 * The picker's in-progress ("pending") state is not stored here — it is
 * read directly from the inline keyboard attached to the picker message.
 */

import { kvGet, kvSet, kvDel } from "./kv";

export type PlatformName = "telegram" | "facebook" | "instagram" | "sanity";

export const ALL_PLATFORMS: PlatformName[] = [
  "telegram",
  "facebook",
  "instagram",
  "sanity",
];

export const PLATFORM_LABELS: Record<PlatformName, string> = {
  telegram: "טלגרם",
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  sanity: "אתר",
};

function key(userId: number): string {
  return `bot:platforms:${userId}`;
}

export async function getUserPlatforms(
  userId: number
): Promise<Set<PlatformName>> {
  const saved = await kvGet<PlatformName[]>(key(userId));
  if (!saved || saved.length === 0) return new Set(ALL_PLATFORMS);
  return new Set(saved);
}

export async function setUserPlatforms(
  userId: number,
  platforms: Set<PlatformName>
): Promise<void> {
  // If the user selected every platform, drop the entry — it's just the default.
  if (platforms.size === ALL_PLATFORMS.length) {
    await kvDel(key(userId));
    return;
  }
  await kvSet(key(userId), Array.from(platforms));
}

/** Drop any saved selection — the next upload defaults to all platforms. */
export async function resetUserPlatforms(userId: number): Promise<void> {
  await kvDel(key(userId));
}
