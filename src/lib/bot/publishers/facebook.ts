import type { BotMessage, PublishResult } from "../types";
import { formatForPlainText } from "../formatter";
import { normalizeForInstagram } from "../instagram-aspect-fix";

const GRAPH_API = "https://graph.facebook.com/v25.0";

function getPageId(): string {
  const id = process.env.FACEBOOK_PAGE_ID;
  if (!id) throw new Error("FACEBOOK_PAGE_ID is not set");
  return id;
}

function getPageToken(): string {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not set");
  return token;
}

async function graphApi(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GRAPH_API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: getPageToken(), ...body }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(
      `Facebook API ${endpoint}: ${data.error.message}`
    );
  }
  return data;
}

/**
 * Upload photos to Facebook as unpublished and return their Facebook-hosted URLs.
 * Used to get URLs that Instagram can fetch (Meta can reach its own servers).
 * Photos outside Instagram's [4:5, 1.91:1] range are padded with a blurred
 * background so the Instagram step doesn't reject them.
 */
export async function uploadPhotosToFacebook(
  photoUrls: string[]
): Promise<string[]> {
  const pageId = getPageId();
  const token = getPageToken();

  return Promise.all(
    photoUrls.map(async (url) => {
      const photoId = await uploadNormalizedPhoto(pageId, url);

      // Query the photo to get its Facebook-hosted URL
      const res = await fetch(
        `${GRAPH_API}/${photoId}?fields=images&access_token=${token}`
      );
      const data = await res.json();
      // images array is sorted by size descending — first is largest
      return data.images?.[0]?.source as string;
    })
  );
}

async function uploadNormalizedPhoto(pageId: string, url: string): Promise<string> {
  const src = await fetch(url);
  if (!src.ok) throw new Error(`Failed to fetch photo ${url}: ${src.status}`);
  const originalBuf = Buffer.from(await src.arrayBuffer());
  const normalized = await normalizeForInstagram(originalBuf);

  const form = new FormData();
  form.append("access_token", getPageToken());
  form.append("published", "false");
  form.append(
    "source",
    new Blob([new Uint8Array(normalized)], { type: "image/jpeg" }),
    "photo.jpg"
  );

  const res = await fetch(`${GRAPH_API}/${pageId}/photos`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Facebook API /${pageId}/photos: ${data.error.message}`);
  }
  return data.id as string;
}

export async function publishToFacebook(
  message: BotMessage,
  photoUrls: string[]
): Promise<PublishResult> {
  try {
    const pageId = getPageId();
    const text = formatForPlainText(message.text);

    if (photoUrls.length === 0) {
      // Text-only post
      await graphApi(`/${pageId}/feed`, { message: text });
    } else if (photoUrls.length === 1) {
      // Single photo post
      await graphApi(`/${pageId}/photos`, {
        url: photoUrls[0],
        message: text,
      });
    } else {
      // Multi-photo: upload each as unpublished, then create post with attached_media
      const photoIds = await Promise.all(
        photoUrls.map(async (url) => {
          const result = await graphApi(`/${pageId}/photos`, {
            url,
            published: false,
          });
          return result.id as string;
        })
      );

      await graphApi(`/${pageId}/feed`, {
        message: text,
        attached_media: photoIds.map((id) => ({ media_fbid: id })),
      });
    }

    return { platform: "facebook", success: true };
  } catch (error) {
    return {
      platform: "facebook",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
