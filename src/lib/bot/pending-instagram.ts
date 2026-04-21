/**
 * KV-backed store for Instagram posts awaiting user confirmation.
 * Holds the generated image URL and caption until the user confirms
 * or declines via the inline-keyboard buttons on the preview message.
 */

import { kvGet, kvSet, kvDel } from "./kv";

interface PendingPost {
  imageUrl: string;
  caption: string;
  chatId: number;
}

const TTL_SECONDS = 10 * 60;

export async function storePendingPost(
  id: string,
  imageUrl: string,
  caption: string,
  chatId: number
): Promise<void> {
  const payload: PendingPost = { imageUrl, caption, chatId };
  await kvSet(`bot:pending:${id}`, payload, TTL_SECONDS);
}

export async function getPendingPost(id: string): Promise<PendingPost | null> {
  return kvGet<PendingPost>(`bot:pending:${id}`);
}

export async function deletePendingPost(id: string): Promise<void> {
  await kvDel(`bot:pending:${id}`);
}
