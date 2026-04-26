import type { BotMessage, PublishResult } from "./types";
import { publishToTelegram, getFileUrl } from "./publishers/telegram";
import { publishToFacebook, uploadPhotosToFacebook } from "./publishers/facebook";
import { publishToInstagram } from "./publishers/instagram";
import { publishToTwitter } from "./publishers/twitter";
import { publishToSanity } from "./publishers/sanity";
import type { PlatformName } from "./platform-selection";

/** Resolve Telegram file IDs to public download URLs. */
async function resolvePhotoUrls(message: BotMessage): Promise<string[]> {
  return Promise.all(message.photos.map((photo) => getFileUrl(photo.fileId)));
}

/** Publish a message to all platforms in parallel. */
export async function publishToAll(
  message: BotMessage,
  baseUrl: string,
  options?: { skipInstagram?: boolean; platforms?: Set<PlatformName> }
): Promise<PublishResult[]> {
  const enabled = options?.platforms;
  const isEnabled = (p: PlatformName) => !enabled || enabled.has(p);

  const telegramWanted = isEnabled("telegram");
  const facebookWanted = isEnabled("facebook");
  const sanityWanted = isEnabled("sanity");
  const twitterWanted = isEnabled("twitter");
  const instagramWanted = !options?.skipInstagram && isEnabled("instagram");

  // Only resolve Telegram file URLs when a consumer actually needs them.
  const needsFileUrls =
    message.photos.length > 0 &&
    (facebookWanted || sanityWanted || instagramWanted || twitterWanted);
  const telegramPhotoUrls = needsFileUrls
    ? await resolvePhotoUrls(message)
    : [];

  // Upload to Facebook first to get Facebook-hosted URLs for Instagram
  // (Instagram can't fetch from Vercel or Telegram, but can fetch from Facebook)
  let facebookPhotoUrls: string[] = [];
  if (instagramWanted && telegramPhotoUrls.length > 0) {
    try {
      facebookPhotoUrls = await uploadPhotosToFacebook(telegramPhotoUrls);
    } catch (e) {
      console.error("[Publisher] Failed to upload photos to Facebook for Instagram:", e);
    }
  }

  const publishers: Promise<PublishResult>[] = [];
  if (telegramWanted) publishers.push(publishToTelegram(message));
  if (facebookWanted) publishers.push(publishToFacebook(message, telegramPhotoUrls));
  if (twitterWanted) publishers.push(publishToTwitter(message, telegramPhotoUrls));
  if (sanityWanted) publishers.push(publishToSanity(message, telegramPhotoUrls));

  if (instagramWanted && facebookPhotoUrls.length > 0) {
    publishers.push(publishToInstagram(message, facebookPhotoUrls, baseUrl));
  }

  const results = await Promise.all(publishers);

  return results;
}

const PLATFORM_NAMES: Record<string, string> = {
  telegram: "טלגרם",
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  twitter: "טוויטר",
  sanity: "אתר",
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
