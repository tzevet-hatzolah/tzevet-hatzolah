import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { isAuthorizedUser } from "@/lib/bot/auth";
import { publishToAll, formatResultsSummary } from "@/lib/bot/publisher";
import { publishToInstagram } from "@/lib/bot/publishers/instagram";
import { uploadPhotosToFacebook } from "@/lib/bot/publishers/facebook";
import {
  sendBotReply,
  sendPhotoWithButtons,
  answerCallbackQuery,
  sendInlineKeyboard,
  editInlineKeyboard,
  editMessageText,
  PLATFORM_PICKER_BUTTON,
} from "@/lib/bot/publishers/telegram";
import {
  ALL_PLATFORMS,
  PLATFORM_LABELS,
  cancelPendingSelection,
  commitPendingSelection,
  getUserPlatforms,
  startPendingSelection,
  togglePendingPlatform,
  type PlatformName,
} from "@/lib/bot/platform-selection";
import {
  addToMediaGroup,
  claimMediaGroup,
} from "@/lib/bot/media-group-collector";
import { generateTextImage } from "@/lib/bot/image-generator";
import { storeImage } from "@/lib/bot/image-store";
import {
  storePendingPost,
  getPendingPost,
  deletePendingPost,
} from "@/lib/bot/pending-instagram";
import { formatForPlainText } from "@/lib/bot/formatter";
import { broadcastToOthers, getSenderName } from "@/lib/bot/broadcast";
import type { BotMessage, PhotoFile } from "@/lib/bot/types";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  try {
    const update = await request.json();

    // Handle callback queries (button presses)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query, baseUrl);
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const senderId = message.from?.id;
    const chatId = message.chat?.id;

    // Auth check
    if (!senderId || !isAuthorizedUser(senderId)) {
      return NextResponse.json({ ok: true });
    }

    const senderName = getSenderName(message.from);

    // Extract text (from text or caption)
    const text = message.text || message.caption || "";

    // Intercept the persistent-keyboard button: open the platform picker.
    if (text.trim() === PLATFORM_PICKER_BUTTON) {
      await openPlatformPicker(senderId, chatId);
      return NextResponse.json({ ok: true });
    }

    // Extract photo — Telegram sends multiple sizes, pick the largest
    let photo: PhotoFile | null = null;
    if (message.photo && message.photo.length > 0) {
      const largest = message.photo[message.photo.length - 1];
      photo = { fileId: largest.file_id };
    }

    // Handle media groups (multiple photos sent together)
    if (message.media_group_id && photo) {
      addToMediaGroup(
        message.media_group_id,
        photo,
        text,
        chatId,
        senderId,
        senderName
      );

      const mediaGroupId = message.media_group_id;
      const messageId = message.message_id;
      after(async () => {
        const group = await claimMediaGroup(mediaGroupId);
        if (!group) return;

        const botMessage: BotMessage = {
          text: group.text,
          photos: group.photos,
          senderId: group.senderId,
          chatId: group.chatId,
          messageId,
        };

        try {
          const platforms = getUserPlatforms(group.senderId);
          const results = await publishToAll(botMessage, baseUrl, { platforms });
          const summary = formatResultsSummary(results);
          await sendBotReply(group.chatId, summary);
          await broadcastToOthers(
            group.senderId,
            group.senderName,
            group.text,
            summary
          );
        } catch (error) {
          console.error("Media group publish error:", error);
          await sendBotReply(
            group.chatId,
            "שגיאה בפרסום. נסה שוב מאוחר יותר."
          );
        }
      });

      return NextResponse.json({ ok: true });
    }

    // Single message (text only or single photo)
    const photos: PhotoFile[] = photo ? [photo] : [];

    const botMessage: BotMessage = {
      text,
      photos,
      senderId,
      chatId,
      messageId: message.message_id,
    };

    // Skip empty messages
    if (!text && photos.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const isTextOnly = photos.length === 0;
    const platforms = getUserPlatforms(senderId);
    const instagramEnabled = platforms.has("instagram");

    if (isTextOnly) {
      // Text-only: publish to enabled platforms (minus Instagram), then ask about Instagram.
      const results = await publishToAll(botMessage, baseUrl, {
        skipInstagram: true,
        platforms,
      });
      const summary = formatResultsSummary(results);
      await sendBotReply(chatId, summary);
      await broadcastToOthers(senderId, senderName, text, summary);

      if (!instagramEnabled) {
        // User has Instagram disabled — don't prompt for it.
        return NextResponse.json({ ok: true });
      }

      // Generate the Instagram image preview
      const imageBuffer = await generateTextImage(text);
      const imageId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      storeImage(imageId, imageBuffer);

      const imageUrl = `${baseUrl}/api/generated-image?id=${encodeURIComponent(imageId)}`;
      const caption = formatForPlainText(text);

      // Store pending post for confirmation
      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      storePendingPost(pendingId, imageUrl, caption, chatId);

      // Send preview with confirmation buttons
      await sendPhotoWithButtons(
        chatId,
        imageBuffer,
        "האם אתה רוצה להעלות לאינסטגרם?",
        [
          { text: "כן ✅", callbackData: `ig_yes:${pendingId}` },
          { text: "לא ❌", callbackData: `ig_no:${pendingId}` },
        ]
      );
    } else {
      // Has photos: publish to user's enabled platforms
      const results = await publishToAll(botMessage, baseUrl, { platforms });
      const summary = formatResultsSummary(results);
      await sendBotReply(chatId, summary);
      await broadcastToOthers(senderId, senderName, text, summary);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

async function handleCallbackQuery(
  callbackQuery: {
    id: string;
    data?: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
  },
  baseUrl: string
) {
  const data = callbackQuery.data;
  if (!data) return;

  const senderId = callbackQuery.from.id;
  if (!isAuthorizedUser(senderId)) return;

  const chatId = callbackQuery.message?.chat?.id;
  if (!chatId) return;

  // Platform picker callbacks
  if (data.startsWith("ps_tog:")) {
    const platform = data.replace("ps_tog:", "") as PlatformName;
    const messageId = callbackQuery.message?.message_id;
    const selection = togglePendingPlatform(senderId, platform);
    await answerCallbackQuery(callbackQuery.id);
    if (selection && messageId) {
      await editInlineKeyboard(chatId, messageId, buildPickerKeyboard(selection));
    }
    return;
  }

  if (data === "ps_ok") {
    const messageId = callbackQuery.message?.message_id;
    const committed = commitPendingSelection(senderId);
    await answerCallbackQuery(callbackQuery.id);
    if (messageId) {
      const summary = committed && committed.size > 0
        ? formatSelectionSummary(committed)
        : "לא נבחרה אף פלטפורמה. ההעלאה הבאה לא תפורסם לשום מקום.";
      await editMessageText(chatId, messageId, summary);
    }
    return;
  }

  if (data === "ps_cancel") {
    const messageId = callbackQuery.message?.message_id;
    cancelPendingSelection(senderId);
    await answerCallbackQuery(callbackQuery.id, "בוטל");
    if (messageId) {
      await editMessageText(chatId, messageId, "בחירת הפלטפורמות בוטלה.");
    }
    return;
  }

  if (data.startsWith("ig_yes:")) {
    const pendingId = data.replace("ig_yes:", "");
    const pending = getPendingPost(pendingId);

    await answerCallbackQuery(callbackQuery.id);

    if (!pending) {
      await sendBotReply(chatId, "הפוסט פג תוקף. שלח שוב.");
      return;
    }

    deletePendingPost(pendingId);

    // Publish to Instagram with the generated image
    const dummyMessage: BotMessage = {
      text: pending.caption,
      photos: [],
      senderId,
      chatId: pending.chatId,
      messageId: 0,
    };

    let instagramPhotoUrls: string[] = [];
    try {
      instagramPhotoUrls = await uploadPhotosToFacebook([pending.imageUrl]);
    } catch (e) {
      console.error(
        "[Webhook] Failed to upload generated image to Facebook for Instagram:",
        e
      );
    }

    const result = instagramPhotoUrls.length
      ? await publishToInstagram(dummyMessage, instagramPhotoUrls, baseUrl)
      : {
          platform: "instagram" as const,
          success: false,
          error: "העלאה לפייסבוק נכשלה — לא ניתן לפרסם באינסטגרם",
        };

    const icon = result.success ? "\u2705" : "\u274C";
    const status = result.success ? "פורסם" : `נכשל: ${result.error}`;
    await sendBotReply(chatId, `${icon} אינסטגרם: ${status}`);
  } else if (data.startsWith("ig_no:")) {
    const pendingId = data.replace("ig_no:", "");
    deletePendingPost(pendingId);
    await answerCallbackQuery(callbackQuery.id, "בוטל");
    await sendBotReply(chatId, "העלאה לאינסטגרם בוטלה.");
  }
}

function buildPickerKeyboard(selection: Set<PlatformName>) {
  const toggleRows = ALL_PLATFORMS.map((p) => [
    {
      text: `${selection.has(p) ? "✅" : "⬜️"} ${PLATFORM_LABELS[p]}`,
      callbackData: `ps_tog:${p}`,
    },
  ]);
  return [
    ...toggleRows,
    [
      { text: "אישור", callbackData: "ps_ok" },
      { text: "ביטול", callbackData: "ps_cancel" },
    ],
  ];
}

function formatSelectionSummary(selection: Set<PlatformName>): string {
  const names = ALL_PLATFORMS.filter((p) => selection.has(p)).map(
    (p) => PLATFORM_LABELS[p]
  );
  if (names.length === ALL_PLATFORMS.length) {
    return "ההעלאות הבאות יפורסמו לכל הפלטפורמות.";
  }
  return `ההעלאות הבאות יפורסמו רק ל: ${names.join(", ")}.`;
}

async function openPlatformPicker(senderId: number, chatId: number) {
  const current = startPendingSelection(senderId);
  await sendInlineKeyboard(
    chatId,
    "בחר לאילו פלטפורמות להעלות (לחץ כדי לסמן/לבטל, ואז אישור):",
    buildPickerKeyboard(current)
  );
}
