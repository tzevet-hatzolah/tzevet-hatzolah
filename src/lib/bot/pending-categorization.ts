/**
 * KV-backed store for Sanity news articles awaiting category selection.
 * The pendingId is embedded in the inline-keyboard callback payloads;
 * the docId is fetched by id when the user taps "אישור".
 */

import { kvGet, kvSet, kvDel } from "./kv";

interface PendingCategorization {
  docId: string;
}

const TTL_SECONDS = 30 * 60;

export async function storePendingCategorization(
  id: string,
  docId: string
): Promise<void> {
  const payload: PendingCategorization = { docId };
  await kvSet(`bot:cat:${id}`, payload, TTL_SECONDS);
}

export async function getPendingCategorization(
  id: string
): Promise<PendingCategorization | null> {
  return kvGet<PendingCategorization>(`bot:cat:${id}`);
}

export async function deletePendingCategorization(id: string): Promise<void> {
  await kvDel(`bot:cat:${id}`);
}
