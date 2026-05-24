import { kvSetIfNotExists } from "./kv";

const TTL_SECONDS = 24 * 60 * 60;

export async function claimTelegramMessageUpdate(
  updateId: number | undefined,
  chatId: number,
  messageId: number
): Promise<boolean> {
  const id =
    typeof updateId === "number"
      ? `update:${updateId}`
      : `message:${chatId}:${messageId}`;

  return kvSetIfNotExists(`bot:processed:${id}`, Date.now(), TTL_SECONDS);
}
