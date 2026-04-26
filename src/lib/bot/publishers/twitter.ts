import { TwitterApi } from "twitter-api-v2";
import type { BotMessage, PublishResult } from "../types";
import { formatForPlainText } from "../formatter";

const TWEET_MAX_CHARS = 280;
const MAX_PHOTOS_PER_TWEET = 4;

function getClient(): TwitterApi {
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;
  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error(
      "Twitter credentials are not set (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET)"
    );
  }
  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
}

async function fetchPhotoBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch photo ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Truncate to Twitter's 280-char limit, breaking on whitespace and adding an
 * ellipsis. Counts by JS string length (UTF-16 code units), which is close
 * enough to Twitter's weighted count for Hebrew text.
 */
function truncateForTwitter(text: string): string {
  if (text.length <= TWEET_MAX_CHARS) return text;
  const sliced = text.slice(0, TWEET_MAX_CHARS - 1);
  const lastBreak = sliced.search(/\s\S*$/);
  const cut = lastBreak > TWEET_MAX_CHARS - 40 ? sliced.slice(0, lastBreak) : sliced;
  return `${cut.trimEnd()}…`;
}

export async function publishToTwitter(
  message: BotMessage,
  photoUrls: string[]
): Promise<PublishResult> {
  try {
    const client = getClient();
    const text = truncateForTwitter(formatForPlainText(message.text));

    let mediaIds: string[] = [];
    if (photoUrls.length > 0) {
      const limited = photoUrls.slice(0, MAX_PHOTOS_PER_TWEET);
      mediaIds = await Promise.all(
        limited.map(async (url) => {
          const buf = await fetchPhotoBuffer(url);
          return client.v1.uploadMedia(buf, { mimeType: "image/jpeg" });
        })
      );
    }

    if (mediaIds.length === 0) {
      await client.v2.tweet(text);
    } else {
      await client.v2.tweet(text, {
        media: { media_ids: mediaIds as [string] | [string, string] | [string, string, string] | [string, string, string, string] },
      });
    }

    return { platform: "twitter", success: true };
  } catch (error) {
    return {
      platform: "twitter",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
