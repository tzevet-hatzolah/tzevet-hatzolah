import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthorizedUser } from "@/lib/bot/auth";
import { publishToAll, formatResultsSummary } from "@/lib/bot/publisher";
import { sendBotReply } from "@/lib/bot/publishers/telegram";
import type { BotMessage, PhotoFile } from "@/lib/bot/types";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = await request.json();
    const message = update.message;

    if (!message) {
      // Not a message update (could be edited_message, callback_query, etc.)
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

    // Extract photos — Telegram sends multiple sizes, pick the largest
    const photos: PhotoFile[] = [];
    if (message.photo && message.photo.length > 0) {
      const largest = message.photo[message.photo.length - 1];
      photos.push({ fileId: largest.file_id });
    }

    // Handle media groups: Telegram sends each photo as a separate update.
    // For now, each photo is published individually. Media group handling
    // can be added later with a short aggregation window if needed.

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

    // Publish to all platforms
    const results = await publishToAll(botMessage);
    const summary = formatResultsSummary(results);

    // Reply to the user with results
    await sendBotReply(chatId, summary);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
