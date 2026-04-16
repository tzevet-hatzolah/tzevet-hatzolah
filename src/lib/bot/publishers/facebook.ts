import type { BotMessage, PublishResult } from "../types";
import { formatForPlainText } from "../formatter";

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
