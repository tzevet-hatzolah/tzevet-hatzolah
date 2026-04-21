/**
 * Per-user platform selection for the bot.
 * Default behavior is "publish to all platforms". When a user narrows the
 * selection via the inline keyboard, subsequent uploads use only the
 * platforms they chose until they change it again.
 */

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

/** Persistent per-user selection. Missing entry = all platforms enabled. */
const userSelections = new Map<number, Set<PlatformName>>();

export function getUserPlatforms(userId: number): Set<PlatformName> {
  const saved = userSelections.get(userId);
  return saved ? new Set(saved) : new Set(ALL_PLATFORMS);
}

export function setUserPlatforms(
  userId: number,
  platforms: Set<PlatformName>
): void {
  // If user has every platform selected, drop the entry — it's just the default.
  if (platforms.size === ALL_PLATFORMS.length) {
    userSelections.delete(userId);
  } else {
    userSelections.set(userId, new Set(platforms));
  }
}

/** In-progress selection UI state keyed by userId. */
interface PendingSelection {
  platforms: Set<PlatformName>;
  expiresAt: number;
}

const pendingSelections = new Map<number, PendingSelection>();

const TTL_MS = 10 * 60 * 1000;

export function startPendingSelection(userId: number): Set<PlatformName> {
  const empty = new Set<PlatformName>();
  pendingSelections.set(userId, {
    platforms: empty,
    expiresAt: Date.now() + TTL_MS,
  });
  cleanup();
  return empty;
}

export function getPendingSelection(
  userId: number
): Set<PlatformName> | null {
  const entry = pendingSelections.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pendingSelections.delete(userId);
    return null;
  }
  return entry.platforms;
}

export function togglePendingPlatform(
  userId: number,
  platform: PlatformName
): Set<PlatformName> | null {
  const entry = pendingSelections.get(userId);
  if (!entry || Date.now() > entry.expiresAt) return null;
  if (entry.platforms.has(platform)) {
    entry.platforms.delete(platform);
  } else {
    entry.platforms.add(platform);
  }
  return entry.platforms;
}

export function commitPendingSelection(
  userId: number
): Set<PlatformName> | null {
  const entry = pendingSelections.get(userId);
  if (!entry) return null;
  pendingSelections.delete(userId);
  setUserPlatforms(userId, entry.platforms);
  return entry.platforms;
}

export function cancelPendingSelection(userId: number): void {
  pendingSelections.delete(userId);
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of pendingSelections) {
    if (now > entry.expiresAt) {
      pendingSelections.delete(key);
    }
  }
}
