import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { after } from "next/server";
import { isAuthorizedUser } from "@/lib/bot/auth";
import { publishToAll, formatResultsSummary } from "@/lib/bot/publisher";
import { sendBotReply } from "@/lib/bot/publishers/telegram";
import {
  addToMediaGroup,
  claimMediaGroup,
} from "@/lib/bot/media-group-collector";
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

    // Extract text (from text or caption)
    const text = message.text || message.caption || "";

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
        senderId
      );

      // Schedule publishing after response is sent.
      // Each photo in the group schedules this, but only the last one
      // (after the debounce window) will actually claim and publish.
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
          const results = await publishToAll(botMessage, baseUrl);
          const summary = formatResultsSummary(results);
          await sendBotReply(group.chatId, summary);
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

    const results = await publishToAll(botMessage, baseUrl);
    const summary = formatResultsSummary(results);
    await sendBotReply(chatId, summary);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
