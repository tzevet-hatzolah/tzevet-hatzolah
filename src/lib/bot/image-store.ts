/**
 * Temporary in-memory store for generated images.
 * Images are stored with a TTL and cleaned up automatically.
 */

const store = new Map<string, { buffer: Buffer; expiresAt: number }>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function storeImage(id: string, buffer: Buffer): void {
  store.set(id, { buffer, expiresAt: Date.now() + TTL_MS });
  cleanup();
}

export function getImage(id: string): Buffer | null {
  const entry = store.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(id);
    return null;
  }
  return entry.buffer;
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) {
      store.delete(key);
    }
  }
}
