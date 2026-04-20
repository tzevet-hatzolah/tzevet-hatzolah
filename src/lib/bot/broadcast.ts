import { sendBotReply } from "./publishers/telegram";

const SPOKESPERSON_PREFIX = "דוברות צוות הצלה";

export interface TelegramFrom {
  first_name?: string;
  last_name?: string;
  username?: string;
}

export function getSenderName(from: TelegramFrom | undefined): string {
  if (!from) return "משתמש";
  const parts = [from.first_name, from.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return from.username || "משתמש";
}

/**
 * Pull the headline from the post text.
 * Uses the first non-empty line, unless the post opens with the spokesperson
 * prefix — then the second line (the actual headline) is used.
 */
export function extractHeadline(text: string): string {
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  if (lines[0].startsWith(SPOKESPERSON_PREFIX) && lines.length > 1) {
    return lines[1];
  }
  return lines[0];
}

/** Send the publish summary to every other authorized user. */
export async function broadcastToOthers(
  senderId: number,
  senderName: string,
  text: string,
  resultsSummary: string
): Promise<void> {
  const allowed = process.env.TELEGRAM_ALLOWED_USERS;
  if (!allowed) return;

  const recipients = allowed
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((id) => !Number.isNaN(id) && id !== senderId);

  if (recipients.length === 0) return;

  const headline = extractHeadline(text);
  const message = headline
    ? `המשתמש ${senderName} העלה את ההודעה ${headline}.\nתוצאות ההעלאה\n${resultsSummary}`
    : `המשתמש ${senderName} העלה הודעה.\nתוצאות ההעלאה\n${resultsSummary}`;

  await Promise.all(
    recipients.map((id) =>
      sendBotReply(id, message).catch((e) =>
        console.error(`[Broadcast] Failed to notify ${id}:`, e)
      )
    )
  );
}
