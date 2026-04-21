import type { BotMessage, PublishResult } from "../types";
import { formatForTelegram } from "../formatter";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

function getChannelId(): string {
  const id = process.env.TELEGRAM_CHANNEL_ID;
  if (!id) throw new Error("TELEGRAM_CHANNEL_ID is not set");
  return id;
}

async function telegramApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}${getToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API ${method}: ${data.description}`);
  }
  return data.result;
}

export async function publishToTelegram(
  message: BotMessage
): Promise<PublishResult> {
  try {
    const channelId = getChannelId();
    const formattedText = formatForTelegram(message.text);

    if (message.photos.length === 0) {
      // Text-only post
      await telegramApi("sendMessage", {
        chat_id: channelId,
        text: formattedText,
        parse_mode: "MarkdownV2",
      });
    } else if (message.photos.length === 1) {
      // Single photo with caption
      await telegramApi("sendPhoto", {
        chat_id: channelId,
        photo: message.photos[0].fileId,
        caption: formattedText,
        parse_mode: "MarkdownV2",
      });
    } else {
      // Multiple photos as media group
      const media = message.photos.map((photo, i) => ({
        type: "photo" as const,
        media: photo.fileId,
        ...(i === 0
          ? { caption: formattedText, parse_mode: "MarkdownV2" }
          : {}),
      }));
      await telegramApi("sendMediaGroup", {
        chat_id: channelId,
        media,
      });
    }

    return { platform: "telegram", success: true };
  } catch (error) {
    return {
      platform: "telegram",
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Text of the persistent reply-keyboard button for opening the platform picker. */
export const PLATFORM_PICKER_BUTTON = "📍 בחר פלטפורמות";

const PERSISTENT_REPLY_KEYBOARD = {
  keyboard: [[{ text: PLATFORM_PICKER_BUTTON }]],
  resize_keyboard: true,
  is_persistent: true,
};

/** Send a reply message back to the user in the bot chat. */
export async function sendBotReply(chatId: number, text: string) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: PERSISTENT_REPLY_KEYBOARD,
  });
}

/** Send a message with an inline keyboard (rows of callback buttons). */
export async function sendInlineKeyboard(
  chatId: number,
  text: string,
  rows: { text: string; callbackData: string }[][]
) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: {
      inline_keyboard: rows.map((row) =>
        row.map((b) => ({ text: b.text, callback_data: b.callbackData }))
      ),
    },
  });
}

/** Update an existing inline keyboard in place. */
export async function editInlineKeyboard(
  chatId: number,
  messageId: number,
  rows: { text: string; callbackData: string }[][]
) {
  await telegramApi("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: {
      inline_keyboard: rows.map((row) =>
        row.map((b) => ({ text: b.text, callback_data: b.callbackData }))
      ),
    },
  });
}

/** Replace the text of an existing message and strip any inline keyboard. */
export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string
) {
  await telegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}

/** Send a photo with inline keyboard buttons to the user. */
export async function sendPhotoWithButtons(
  chatId: number,
  imageBuffer: Buffer,
  caption: string,
  buttons: { text: string; callbackData: string }[]
) {
  const token = getToken();
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("photo", new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }), "preview.jpg");
  form.append("caption", caption);
  form.append(
    "reply_markup",
    JSON.stringify({
      inline_keyboard: [
        buttons.map((b) => ({ text: b.text, callback_data: b.callbackData })),
      ],
    })
  );

  const res = await fetch(`${TELEGRAM_API}${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API sendPhoto: ${data.description}`);
  }
  return data.result;
}

/** Answer a callback query (removes the loading state on the button). */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

/** Get a direct download URL for a Telegram file. */
export async function getFileUrl(fileId: string): Promise<string> {
  const file = await telegramApi("getFile", { file_id: fileId });
  return `https://api.telegram.org/file/bot${getToken()}/${file.file_path}`;
}
