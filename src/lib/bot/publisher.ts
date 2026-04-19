import type { BotMessage, PublishResult } from "./types";
import { publishToTelegram, getFileUrl } from "./publishers/telegram";
import { publishToFacebook, uploadPhotosToFacebook } from "./publishers/facebook";
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

  // Upload to Facebook first to get Facebook-hosted URLs for Instagram
  // (Instagram can't fetch from Vercel or Telegram, but can fetch from Facebook)
  let facebookPhotoUrls: string[] = [];
  if (!options?.skipInstagram && telegramPhotoUrls.length > 0) {
    try {
      facebookPhotoUrls = await uploadPhotosToFacebook(telegramPhotoUrls);
    } catch (e) {
      console.error("[Publisher] Failed to upload photos to Facebook for Instagram:", e);
    }
  }

  const publishers = [
    publishToTelegram(message),
    publishToFacebook(message, telegramPhotoUrls),
  ];

  if (!options?.skipInstagram && facebookPhotoUrls.length > 0) {
    publishers.push(publishToInstagram(message, facebookPhotoUrls, baseUrl));
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
