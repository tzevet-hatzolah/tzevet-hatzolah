import type { BotMessage, PublishResult } from "./types";
import { publishToTelegram, getFileUrl } from "./publishers/telegram";
import { publishToFacebook } from "./publishers/facebook";
import { publishToInstagram } from "./publishers/instagram";

/** Resolve Telegram file IDs to public download URLs. */
async function resolvePhotoUrls(message: BotMessage): Promise<string[]> {
  return Promise.all(message.photos.map((photo) => getFileUrl(photo.fileId)));
}

/** Convert Telegram file URLs to proxied URLs that Instagram can fetch. */
function proxyPhotoUrls(telegramUrls: string[], baseUrl: string): string[] {
  return telegramUrls.map(
    (url) => `${baseUrl}/api/image-proxy?url=${encodeURIComponent(url)}`
  );
}

/** Publish a message to all platforms in parallel. */
export async function publishToAll(
  message: BotMessage,
  baseUrl: string
): Promise<PublishResult[]> {
  // Get photo URLs once — needed by Facebook and Instagram
  const telegramPhotoUrls =
    message.photos.length > 0 ? await resolvePhotoUrls(message) : [];

  // Instagram needs proxied URLs with proper content-type headers
  const proxiedPhotoUrls = proxyPhotoUrls(telegramPhotoUrls, baseUrl);

  const results = await Promise.all([
    publishToTelegram(message),
    publishToFacebook(message, telegramPhotoUrls),
    publishToInstagram(message, proxiedPhotoUrls),
  ]);

  return results;
}

/** Format results into a human-readable summary for the bot reply. */
export function formatResultsSummary(results: PublishResult[]): string {
  const lines = results.map((r) => {
    const icon = r.success ? "V" : "X";
    const status = r.success ? "Published" : `Failed: ${r.error}`;
    return `${icon} ${r.platform}: ${status}`;
  });
  return lines.join("\n");
}
