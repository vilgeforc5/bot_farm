import { Hono } from "hono";
import type { DatabaseAdapter } from "../db/store";
import type { TelegramMessageUpdate } from "../domain/types";
import { handleTelegramUpdate } from "../services/chat-service";
import { logError } from "../services/error-log";

export const createWebhooksRoutes = ({ database }: { database: DatabaseAdapter }) => {
  const webhooks = new Hono();

  webhooks.post("/telegram/:slug", async (c) => {
    const bot = await database.getBotBySlug(c.req.param("slug"));
    if (!bot) {
      return c.json({ error: "Unknown bot" }, 404);
    }

    const secret = c.req.header("x-telegram-bot-api-secret-token");
    if (bot.telegramSecretToken && secret !== bot.telegramSecretToken) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const update = (await c.req.json()) as TelegramMessageUpdate;
    try {
      await handleTelegramUpdate(bot, update);
    } catch (error) {
      logError("webhook_error", error instanceof Error ? error.message : String(error), {
        bot: bot.slug
      });
    }

    return c.json({ ok: true });
  });

  return webhooks;
};
