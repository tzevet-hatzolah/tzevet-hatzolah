/**
 * Temporary store for Instagram posts awaiting user confirmation.
 * Stores the generated image URL and caption until the user
 * confirms or declines via inline keyboard buttons.
 */

interface PendingPost {
  imageUrl: string;
  caption: string;
  chatId: number;
  expiresAt: number;
}

const pendingPosts = new Map<string, PendingPost>();

const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function storePendingPost(
  id: string,
  imageUrl: string,
  caption: string,
  chatId: number
): void {
  pendingPosts.set(id, {
    imageUrl,
    caption,
    chatId,
    expiresAt: Date.now() + TTL_MS,
  });
  cleanup();
}

export function getPendingPost(id: string): PendingPost | null {
  const entry = pendingPosts.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pendingPosts.delete(id);
    return null;
  }
  return entry;
}

export function deletePendingPost(id: string): void {
  pendingPosts.delete(id);
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of pendingPosts) {
    if (now > entry.expiresAt) {
      pendingPosts.delete(key);
    }
  }
}
