import { TwitterApi, type SendTweetV2Params } from "twitter-api-v2";
import type { BotMessage, PublishResult } from "../types";
import { formatForPlainText } from "../formatter";

const MAX_PHOTOS_PER_TWEET = 4;

type MediaIdTuple =
  | [string]
  | [string, string]
  | [string, string, string]
  | [string, string, string, string];

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

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export async function publishToTwitter(
  message: BotMessage,
  photoUrls: string[]
): Promise<PublishResult> {
  try {
    const client = getClient();
    const text = formatForPlainText(message.text);

    if (photoUrls.length === 0) {
      await client.v2.tweet(text);
      return { platform: "twitter", success: true };
    }

    // Upload all photos first so a partial failure aborts the whole publish.
    const mediaIds = await Promise.all(
      photoUrls.map(async (url) => {
        const buf = await fetchPhotoBuffer(url);
        return client.v1.uploadMedia(buf, { mimeType: "image/jpeg" });
      })
    );

    const mediaChunks = chunk(mediaIds, MAX_PHOTOS_PER_TWEET);
    const total = mediaChunks.length;

    let previousId: string | undefined;
    for (let i = 0; i < total; i++) {
      const isFirst = i === 0;
      const chunkText = isFirst
        ? total === 1
          ? text
          : `${text}\n(1/${total})`
        : `(${i + 1}/${total})`;

      const payload: SendTweetV2Params = {
        media: { media_ids: mediaChunks[i] as MediaIdTuple },
      };
      if (!isFirst && previousId) {
        payload.reply = { in_reply_to_tweet_id: previousId };
      }

      const result = await client.v2.tweet(chunkText, payload);
      previousId = result.data.id;
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
