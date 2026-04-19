import type { BotMessage, PublishResult } from "../types";
import { formatForPlainText } from "../formatter";

const GRAPH_API = "https://graph.facebook.com/v25.0";

function getIgAccountId(): string {
  const id = process.env.INSTAGRAM_ACCOUNT_ID;
  if (!id) throw new Error("INSTAGRAM_ACCOUNT_ID is not set");
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
      `Instagram API ${endpoint}: ${data.error.message}`
    );
  }
  return data;
}

async function waitForMediaReady(containerId: string): Promise<void> {
  const token = getPageToken();
  for (let i = 0; i < 30; i++) {
    const res = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${token}`
    );
    const data = await res.json();
    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error("Instagram media container processing failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Instagram media container timed out");
}

export async function publishToInstagram(
  message: BotMessage,
  photoUrls: string[],
  baseUrl: string
): Promise<PublishResult> {
  try {
    if (photoUrls.length === 0) {
      return {
        platform: "instagram",
        success: false,
        error: "אינסטגרם דורש לפחות תמונה אחת",
      };
    }

    const igId = getIgAccountId();
    const caption = formatForPlainText(message.text);

    if (photoUrls.length === 1) {
      // Single image post
      const container = await graphApi(`/${igId}/media`, {
        image_url: photoUrls[0],
        caption,
      });
      await waitForMediaReady(container.id as string);
      await graphApi(`/${igId}/media_publish`, {
        creation_id: container.id,
      });
    } else {
      // Carousel post
      const itemIds = await Promise.all(
        photoUrls.map(async (url) => {
          const item = await graphApi(`/${igId}/media`, {
            image_url: url,
            is_carousel_item: true,
          });
          await waitForMediaReady(item.id as string);
          return item.id as string;
        })
      );

      const carousel = await graphApi(`/${igId}/media`, {
        media_type: "CAROUSEL",
        children: itemIds,
        caption,
      });
      await waitForMediaReady(carousel.id as string);
      await graphApi(`/${igId}/media_publish`, {
        creation_id: carousel.id,
      });
    }

    return { platform: "instagram", success: true };
  } catch (error) {
    return {
      platform: "instagram",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
