import { kvGet, kvSet } from "./kv";

const PAUSE_KEY = "bot:control:paused";

export function isBotPausedByEnv(): boolean {
  return process.env.TELEGRAM_BOT_PAUSED === "true";
}

export async function isBotPaused(): Promise<boolean> {
  if (isBotPausedByEnv()) return true;
  return (await kvGet<boolean>(PAUSE_KEY)) === true;
}

export async function setBotPaused(paused: boolean): Promise<void> {
  await kvSet(PAUSE_KEY, paused);
}

export function getBotPausedReason(): string {
  return isBotPausedByEnv()
    ? "env: TELEGRAM_BOT_PAUSED=true"
    : "runtime control";
}
