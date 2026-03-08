import { env } from "../config/env";
import { store } from "../db/store";
import type { BotRecord, TelegramMessageUpdate } from "../domain/types";
import { handleTelegramUpdate } from "./chat-service";
import { deleteTelegramWebhook, getTelegramUpdates, setTelegramCommands } from "./telegram";

const offsets = new Map<number, number>();
const inflight = new Set<number>();
const detachedWebhooks = new Set<number>();
const configuredCommands = new Set<number>();

const ensurePollingReady = async (bot: BotRecord): Promise<void> => {
  if (!configuredCommands.has(bot.id)) {
    await setTelegramCommands(bot);
    configuredCommands.add(bot.id);
  }

  if (detachedWebhooks.has(bot.id)) {
    return;
  }
  await deleteTelegramWebhook(bot);
  detachedWebhooks.add(bot.id);
};

const pollBot = async (bot: BotRecord): Promise<void> => {
  if (inflight.has(bot.id) || bot.status !== "active") {
    return;
  }

  inflight.add(bot.id);
  try {
    await ensurePollingReady(bot);
    const offset = offsets.get(bot.id) ?? 0;
    const updates = await getTelegramUpdates(bot, offset, env.TELEGRAM_POLL_TIMEOUT_SECONDS);
    for (const update of updates as TelegramMessageUpdate[]) {
      await handleTelegramUpdate(bot, update);
      offsets.set(bot.id, update.update_id + 1);
    }
  } catch (error) {
    console.error("polling_error", {
      bot: bot.slug,
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    inflight.delete(bot.id);
  }
};

export const startTelegramLongPolling = (): void => {
  if (!env.DEV_LONG_POLLING) {
    return;
  }

  const loop = async () => {
    const activeBots = (await store.listBots()).filter((bot) => bot.status === "active");
    await Promise.all(activeBots.map((bot) => pollBot(bot)));
    setTimeout(loop, 250);
  };

  void loop();
};
