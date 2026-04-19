import type { BotMessage, PublishResult } from "./types";
import { publishToTelegram, getFileUrl } from "./publishers/telegram";
import { publishToFacebook } from "./publishers/facebook";
import { publishToInstagram } from "./publishers/instagram";

/** Resolve Telegram file IDs to public download URLs. */
async function resolvePhotoUrls(message: BotMessage): Promise<string[]> {
  return Promise.all(message.photos.map((photo) => getFileUrl(photo.fileId)));
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

  // Instagram needs proxied URLs — Telegram serves application/octet-stream
  const proxiedPhotoUrls = telegramPhotoUrls.map(
    (url) => `${baseUrl}/api/image-proxy?url=${encodeURIComponent(url)}`
  );

  const publishers = [
    publishToTelegram(message),
    publishToFacebook(message, telegramPhotoUrls),
  ];

  if (!options?.skipInstagram) {
    publishers.push(publishToInstagram(message, proxiedPhotoUrls, baseUrl));
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
