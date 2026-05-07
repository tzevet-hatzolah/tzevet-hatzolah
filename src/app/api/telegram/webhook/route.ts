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
  getUserPlatforms,
  resetUserPlatforms,
  setUserPlatforms,
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
import {
  storePendingCategorization,
  getPendingCategorization,
  deletePendingCategorization,
} from "@/lib/bot/pending-categorization";
import { updateNewsArticleCategories } from "@/lib/bot/publishers/sanity";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_VALUES,
  type NewsCategory,
} from "@/lib/news-categories";
import { formatForPlainText } from "@/lib/bot/formatter";
import { broadcastToOthers, getSenderName } from "@/lib/bot/broadcast";
import type { BotMessage, PhotoFile, PublishResult } from "@/lib/bot/types";

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
          const platforms = await getUserPlatforms(group.senderId);
          const results = await publishToAll(botMessage, baseUrl, { platforms });
          await resetUserPlatforms(group.senderId);
          const summary = formatResultsSummary(results);
          await sendBotReply(group.chatId, summary);
          await broadcastToOthers(
            group.senderId,
            group.senderName,
            group.text,
            summary
          );
          await maybeSendCategoryPicker(results, group.chatId);
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
    const platforms = await getUserPlatforms(senderId);
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
      await maybeSendCategoryPicker(results, chatId);

      if (!instagramEnabled) {
        // User has Instagram disabled — don't prompt for it.
        await resetUserPlatforms(senderId);
        return NextResponse.json({ ok: true });
      }

      // Generate the Instagram image preview
      const imageBuffer = await generateTextImage(text);
      const imageId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await storeImage(imageId, imageBuffer);

      const imageUrl = `${baseUrl}/api/generated-image?id=${encodeURIComponent(imageId)}`;
      const caption = formatForPlainText(text);

      // Store pending post for confirmation
      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await storePendingPost(pendingId, imageUrl, caption, chatId);

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
      await resetUserPlatforms(senderId);
      const summary = formatResultsSummary(results);
      await sendBotReply(chatId, summary);
      await broadcastToOthers(senderId, senderName, text, summary);
      await maybeSendCategoryPicker(results, chatId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

type InlineKeyboardButton = { text: string; callback_data?: string };

async function handleCallbackQuery(
  callbackQuery: {
    id: string;
    data?: string;
    from: { id: number };
    message?: {
      message_id: number;
      chat: { id: number };
      reply_markup?: { inline_keyboard: InlineKeyboardButton[][] };
    };
  },
  baseUrl: string
) {
  const data = callbackQuery.data;
  if (!data) return;

  const senderId = callbackQuery.from.id;
  if (!isAuthorizedUser(senderId)) return;

  const chatId = callbackQuery.message?.chat?.id;
  if (!chatId) return;

  // Platform picker callbacks — state is read from the inline keyboard itself,
  // so it survives serverless cold starts without needing an external store.
  if (data.startsWith("ps_tog:")) {
    const platform = data.replace("ps_tog:", "") as PlatformName;
    const messageId = callbackQuery.message?.message_id;
    const current = parseSelectionFromKeyboard(
      callbackQuery.message?.reply_markup
    );
    if (current.has(platform)) current.delete(platform);
    else current.add(platform);
    await answerCallbackQuery(callbackQuery.id);
    if (messageId) {
      await editInlineKeyboard(chatId, messageId, buildPickerKeyboard(current));
    }
    return;
  }

  if (data === "ps_ok") {
    const messageId = callbackQuery.message?.message_id;
    const committed = parseSelectionFromKeyboard(
      callbackQuery.message?.reply_markup
    );
    await setUserPlatforms(senderId, committed);
    await answerCallbackQuery(callbackQuery.id);
    if (messageId) {
      const summary =
        committed.size > 0
          ? formatSelectionSummary(committed)
          : "לא נבחרה אף פלטפורמה. ההעלאה הבאה לא תפורסם לשום מקום.";
      await editMessageText(chatId, messageId, summary);
    }
    return;
  }

  if (data === "ps_cancel") {
    const messageId = callbackQuery.message?.message_id;
    await resetUserPlatforms(senderId);
    await answerCallbackQuery(callbackQuery.id, "בוטל");
    if (messageId) {
      await editMessageText(chatId, messageId, "בחירת הפלטפורמות בוטלה.");
    }
    return;
  }

  if (data.startsWith("cat_tog:")) {
    const [, pendingId, value] = data.split(":");
    const messageId = callbackQuery.message?.message_id;
    const current = parseCategorySelectionFromKeyboard(
      callbackQuery.message?.reply_markup
    );
    if (NEWS_CATEGORY_VALUES.includes(value as NewsCategory)) {
      const cat = value as NewsCategory;
      if (current.has(cat)) current.delete(cat);
      else current.add(cat);
    }
    await answerCallbackQuery(callbackQuery.id);
    if (messageId) {
      await editInlineKeyboard(
        chatId,
        messageId,
        buildCategoryKeyboard(pendingId, current)
      );
    }
    return;
  }

  if (data.startsWith("cat_ok:")) {
    const pendingId = data.replace("cat_ok:", "");
    const messageId = callbackQuery.message?.message_id;
    const selection = parseCategorySelectionFromKeyboard(
      callbackQuery.message?.reply_markup
    );

    if (selection.size === 0) {
      await answerCallbackQuery(callbackQuery.id, "בחר לפחות קטגוריה אחת");
      return;
    }

    const pending = await getPendingCategorization(pendingId);
    await answerCallbackQuery(callbackQuery.id);

    if (!pending) {
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          "פג תוקף — לא ניתן לעדכן את הקטגוריות."
        );
      }
      return;
    }

    try {
      await updateNewsArticleCategories(pending.docId, Array.from(selection));
      await deletePendingCategorization(pendingId);
      if (messageId) {
        const labels = NEWS_CATEGORIES.filter((c) => selection.has(c.value))
          .map((c) => c.title)
          .join(", ");
        await editMessageText(chatId, messageId, `✅ קטגוריות עודכנו: ${labels}`);
      }
    } catch (e) {
      console.error("[Webhook] Failed to update categories:", e);
      if (messageId) {
        const msg = e instanceof Error ? e.message : String(e);
        await editMessageText(chatId, messageId, `❌ עדכון קטגוריות נכשל: ${msg}`);
      }
    }
    return;
  }

  if (data.startsWith("cat_skip:")) {
    const pendingId = data.replace("cat_skip:", "");
    const messageId = callbackQuery.message?.message_id;
    await deletePendingCategorization(pendingId);
    await answerCallbackQuery(callbackQuery.id);
    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        "דולג — הכתבה נשמרה תחת ״אחר״."
      );
    }
    return;
  }

  if (data.startsWith("ig_yes:")) {
    const pendingId = data.replace("ig_yes:", "");
    const pending = await getPendingPost(pendingId);

    await answerCallbackQuery(callbackQuery.id);

    if (!pending) {
      await sendBotReply(chatId, "הפוסט פג תוקף. שלח שוב.");
      return;
    }

    await deletePendingPost(pendingId);

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
    await resetUserPlatforms(senderId);
  } else if (data.startsWith("ig_no:")) {
    const pendingId = data.replace("ig_no:", "");
    await deletePendingPost(pendingId);
    await answerCallbackQuery(callbackQuery.id, "בוטל");
    await sendBotReply(chatId, "העלאה לאינסטגרם בוטלה.");
    await resetUserPlatforms(senderId);
  }
}

function parseSelectionFromKeyboard(
  rm?: { inline_keyboard: InlineKeyboardButton[][] }
): Set<PlatformName> {
  const result = new Set<PlatformName>();
  if (!rm) return result;
  for (const row of rm.inline_keyboard) {
    for (const btn of row) {
      if (!btn.callback_data?.startsWith("ps_tog:")) continue;
      const platform = btn.callback_data.slice("ps_tog:".length) as PlatformName;
      if (btn.text.startsWith("✅")) result.add(platform);
    }
  }
  return result;
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

function shortId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildCategoryKeyboard(
  pendingId: string,
  selection: Set<NewsCategory>
) {
  const toggleRows = NEWS_CATEGORIES.map((c) => [
    {
      text: `${selection.has(c.value) ? "✅" : "⬜️"} ${c.title}`,
      callbackData: `cat_tog:${pendingId}:${c.value}`,
    },
  ]);
  return [
    ...toggleRows,
    [
      { text: "אישור", callbackData: `cat_ok:${pendingId}` },
      { text: "דלג", callbackData: `cat_skip:${pendingId}` },
    ],
  ];
}

function parseCategorySelectionFromKeyboard(rm?: {
  inline_keyboard: InlineKeyboardButton[][];
}): Set<NewsCategory> {
  const result = new Set<NewsCategory>();
  if (!rm) return result;
  for (const row of rm.inline_keyboard) {
    for (const btn of row) {
      const cb = btn.callback_data;
      if (!cb || !cb.startsWith("cat_tog:")) continue;
      const value = cb.split(":")[2] as NewsCategory;
      if (btn.text.startsWith("✅")) result.add(value);
    }
  }
  return result;
}

/** If Sanity succeeded, prompt the user to pick categories for the new article. */
async function maybeSendCategoryPicker(
  results: PublishResult[],
  chatId: number
) {
  const sanity = results.find((r) => r.platform === "sanity" && r.success);
  if (!sanity?.docId) return;
  const pendingId = shortId();
  await storePendingCategorization(pendingId, sanity.docId);
  await sendInlineKeyboard(
    chatId,
    "בחר קטגוריות לכתבה (אפשר יותר מאחת):",
    buildCategoryKeyboard(pendingId, new Set())
  );
}

async function openPlatformPicker(senderId: number, chatId: number) {
  // Clear any previously-saved selection so the picker state is authoritative.
  await resetUserPlatforms(senderId);
  await sendInlineKeyboard(
    chatId,
    "בחר לאילו פלטפורמות להעלות (לחץ כדי לסמן/לבטל, ואז אישור):",
    buildPickerKeyboard(new Set())
  );
}
