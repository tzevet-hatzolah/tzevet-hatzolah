#!/bin/bash
# Register the Telegram webhook for your bot.
# Usage: ./scripts/setup-telegram-webhook.sh <your-domain>
# Example: ./scripts/setup-telegram-webhook.sh https://your-site.vercel.app

if [ -z "$1" ]; then
  echo "Usage: $0 <your-domain>"
  echo "Example: $0 https://your-site.vercel.app"
  exit 1
fi

# Load env vars from .env.local
if [ -f .env.local ]; then
  export $(grep -E '^(TELEGRAM_BOT_TOKEN|TELEGRAM_WEBHOOK_SECRET)=' .env.local | xargs)
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN is not set in .env.local"
  exit 1
fi

DOMAIN="$1"
WEBHOOK_URL="${DOMAIN}/api/telegram/webhook"

echo "Setting webhook to: ${WEBHOOK_URL}"

PAYLOAD="{\"url\": \"${WEBHOOK_URL}\""
if [ -n "$TELEGRAM_WEBHOOK_SECRET" ]; then
  PAYLOAD="${PAYLOAD}, \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET}\""
fi
PAYLOAD="${PAYLOAD}}"

RESPONSE=$(curl -s -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

echo "Response: ${RESPONSE}"
