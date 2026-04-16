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
  message: BotMessage
): Promise<PublishResult[]> {
  // Get photo URLs once — needed by Facebook and Instagram
  const photoUrls =
    message.photos.length > 0 ? await resolvePhotoUrls(message) : [];

  const results = await Promise.all([
    publishToTelegram(message),
    publishToFacebook(message, photoUrls),
    publishToInstagram(message, photoUrls),
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
