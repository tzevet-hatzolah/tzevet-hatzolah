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
 * Collects photos from Telegram media groups.
 *
 * When a user sends multiple photos at once, Telegram delivers each as a
 * separate webhook update sharing the same `media_group_id`. This collector
 * batches them in a global Map. Since Telegram sends updates sequentially
 * (waits for webhook response before sending the next), consecutive updates
 * hit the same warm serverless instance and share this Map.
 *
 * Each request adds its photo and schedules a delayed check via `after()`.
 * The last check to fire publishes the collected group.
 */
const pendingGroups = new Map<string, PendingGroup>();

const WAIT_MS = 3000;

/** Add a photo to a media group and return whether this is a new group. */
export function addToMediaGroup(
  mediaGroupId: string,
  photo: PhotoFile,
  text: string,
  chatId: number,
  senderId: number,
  senderName: string
): void {
  const existing = pendingGroups.get(mediaGroupId);

  if (existing) {
    existing.photos.push(photo);
    if (text && !existing.text) {
      existing.text = text;
    }
    existing.lastUpdated = Date.now();
  } else {
    pendingGroups.set(mediaGroupId, {
      chatId,
      senderId,
      senderName,
      text,
      photos: [photo],
      lastUpdated: Date.now(),
    });
  }
}

/**
 * Wait for the debounce window, then claim the group if it's ready.
 * Returns the group data if this caller should publish, or null if
 * another caller already claimed it or new photos are still arriving.
 */
export async function claimMediaGroup(
  mediaGroupId: string
): Promise<PendingGroup | null> {
  // Wait for the debounce window
  await new Promise((r) => setTimeout(r, WAIT_MS));

  const group = pendingGroups.get(mediaGroupId);
  if (!group) {
    // Already claimed by another caller
    return null;
  }

  const elapsed = Date.now() - group.lastUpdated;
  if (elapsed < WAIT_MS - 500) {
    // New photos arrived recently — a later caller will handle it
    return null;
  }

  // Claim the group
  pendingGroups.delete(mediaGroupId);
  return group;
}
