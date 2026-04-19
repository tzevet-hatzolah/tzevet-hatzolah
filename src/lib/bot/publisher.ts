import type { BotMessage, PublishResult } from "./types";
import { publishToTelegram, getFileUrl } from "./publishers/telegram";
import { publishToFacebook } from "./publishers/facebook";
import { publishToInstagram } from "./publishers/instagram";
import { storeImage } from "./image-store";

/** Resolve Telegram file IDs to public download URLs. */
async function resolvePhotoUrls(message: BotMessage): Promise<string[]> {
  return Promise.all(message.photos.map((photo) => getFileUrl(photo.fileId)));
}

/**
 * Download photos from Telegram URLs, store them in the image store,
 * and return direct URLs that Instagram can reliably fetch.
 */
async function storePhotosForInstagram(
  telegramUrls: string[],
  baseUrl: string
): Promise<string[]> {
  return Promise.all(
    telegramUrls.map(async (url) => {
      const res = await fetch(url);
      const buffer = Buffer.from(await res.arrayBuffer());
      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      storeImage(id, buffer);
      return `${baseUrl}/api/generated-image?id=${encodeURIComponent(id)}`;
    })
  );
}

/** Publish a message to all platforms in parallel. */
export async function publishToAll(
  message: BotMessage,
  baseUrl: string,
  options?: { skipInstagram?: boolean }
): Promise<PublishResult[]> {
  // Get photo URLs once — needed by Facebook and Instagram
  const telegramPhotoUrls =
    message.photos.length > 0 ? await resolvePhotoUrls(message) : [];

  // Download and store photos so Instagram can fetch them directly from our server
  const storedPhotoUrls =
    !options?.skipInstagram && telegramPhotoUrls.length > 0
      ? await storePhotosForInstagram(telegramPhotoUrls, baseUrl)
      : [];

  const publishers = [
    publishToTelegram(message),
    publishToFacebook(message, telegramPhotoUrls),
  ];

  if (!options?.skipInstagram) {
    publishers.push(publishToInstagram(message, storedPhotoUrls, baseUrl));
  }

  const results = await Promise.all(publishers);

  return results;
}

const PLATFORM_NAMES: Record<string, string> = {
  telegram: "טלגרם",
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
};

/** Format results into a human-readable summary for the bot reply. */
export function formatResultsSummary(results: PublishResult[]): string {
  const lines = results.map((r) => {
    const icon = r.success ? "\u2705" : "\u274C";
    const name = PLATFORM_NAMES[r.platform] || r.platform;
    const status = r.success ? "פורסם" : `נכשל: ${r.error}`;
    return `${icon} ${name}: ${status}`;
  });
  return lines.join("\n");
}
