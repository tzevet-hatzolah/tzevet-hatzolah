import type { PhotoFile } from "./types";

interface PendingGroup {
  chatId: number;
  senderId: number;
  text: string;
  photos: PhotoFile[];
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Collects photos from Telegram media groups.
 *
 * When a user sends multiple photos at once, Telegram delivers each as a
 * separate webhook update sharing the same `media_group_id`. This collector
 * batches them and fires a callback once all photos have arrived (after a
 * short debounce window).
 */
const pendingGroups = new Map<string, PendingGroup>();

const DEBOUNCE_MS = 3000;

export function addToMediaGroup(
  mediaGroupId: string,
  photo: PhotoFile,
  text: string,
  chatId: number,
  senderId: number,
  onReady: (group: {
    chatId: number;
    senderId: number;
    text: string;
    photos: PhotoFile[];
  }) => void
): void {
  const existing = pendingGroups.get(mediaGroupId);

  if (existing) {
    // Add photo to existing group
    existing.photos.push(photo);
    // Use caption from this message if previous ones didn't have one
    if (text && !existing.text) {
      existing.text = text;
    }
    // Reset the debounce timer
    clearTimeout(existing.timer);
    existing.timer = setTimeout(() => {
      pendingGroups.delete(mediaGroupId);
      onReady(existing);
    }, DEBOUNCE_MS);
  } else {
    // First photo in the group
    const group: PendingGroup = {
      chatId,
      senderId,
      text,
      photos: [photo],
      timer: setTimeout(() => {
        pendingGroups.delete(mediaGroupId);
        onReady(group);
      }, DEBOUNCE_MS),
    };
    pendingGroups.set(mediaGroupId, group);
  }
}
