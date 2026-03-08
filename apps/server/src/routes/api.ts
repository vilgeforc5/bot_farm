import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { z } from "zod";
import type { ServerEnv } from "../config/env";
import type { DatabaseAdapter } from "../db/store";
import type { BotStatus } from "../domain/types";
import { deleteTelegramWebhook, setTelegramWebhook } from "../services/telegram";

const botPayloadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  telegramBotToken: z.string().min(1),
  status: z.enum(["active", "paused"]).default("paused"),
  strategyKey: z.literal("base_llm_chatbot_strategy").default("base_llm_chatbot_strategy"),
  llmProvider: z.literal("openrouter").default("openrouter"),
  llmModel: z.string().min(1),
  fallbackModels: z.array(z.string()).default([]),
  contextLimit: z.number().int().min(120).max(600),
  systemPrompt: z.string().default(""),
  buttons: z
    .array(
      z.object({
        text: z.string().min(1),
        action: z.string().min(1)
      })
    )
    .default([])
});

const parseBotPayload = async (request: Request) => botPayloadSchema.parse(await request.json());

const withBotStats = async (database: DatabaseAdapter, botId: number) => {
  const bot = await database.getBotById(botId);
  if (!bot) {
    return null;
  }

  return {
    ...bot,
    stats: await database.getBotStats(bot.id)
  };
};

export const createApiRoutes = ({
  environment,
  database
}: {
  environment: ServerEnv;
  database: DatabaseAdapter;
}) => {
  const api = new Hono();
  const admin = new Hono();
  const db = new Hono();

  admin.use(
    "*",
    basicAuth({
      username: environment.ADMIN_USERNAME,
      password: environment.ADMIN_PASSWORD
    })
  );

  admin.get("/session", (c) => c.json({ ok: true }));

  db.get("/status", async (c) => c.json(await database.getStatus()));

  db.get("/summary", async (c) => c.json(await database.getDashboardSummary()));

  db.get("/interactions", async (c) => c.json(await database.listRecentInteractions(50)));

  db.get("/bots", async (c) => {
    const bots = await database.listBots();
    return c.json(
      await Promise.all(
        bots.map(async (bot) => ({
          ...bot,
          stats: await database.getBotStats(bot.id)
        }))
      )
    );
  });

  db.get("/bots/:id", async (c) => {
    const botId = Number(c.req.param("id"));
    const bot = await withBotStats(database, botId);
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    return c.json(bot);
  });

  db.post("/bots", async (c) => {
    try {
      const payload = await parseBotPayload(c.req.raw);
      const bot = await database.saveBot(payload);
      return c.json({ ...bot, stats: await database.getBotStats(bot.id) }, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to create bot" }, 400);
    }
  });

  db.put("/bots/:id", async (c) => {
    const botId = Number(c.req.param("id"));
    const existing = await database.getBotById(botId);
    if (!existing) {
      return c.json({ error: "Bot not found" }, 404);
    }

    try {
      const payload = await parseBotPayload(c.req.raw);
      const bot = await database.saveBot({
        ...payload,
        id: botId,
        telegramSecretToken: existing.telegramSecretToken
      });
      return c.json({ ...bot, stats: await database.getBotStats(bot.id) });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update bot" }, 400);
    }
  });

  db.post("/bots/:id/toggle", async (c) => {
    const botId = Number(c.req.param("id"));
    const bot = await database.getBotById(botId);
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    const nextStatus: BotStatus = bot.status === "active" ? "paused" : "active";
    await database.setBotStatus(botId, nextStatus);
    const updated = await withBotStats(database, botId);
    return c.json(updated);
  });

  admin.post("/bots/:id/connect", async (c) => {
    const bot = await database.getBotById(Number(c.req.param("id")));
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    try {
      await setTelegramWebhook(bot);
      return c.json({ ok: true });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Webhook connect failed" }, 400);
    }
  });

  admin.post("/bots/:id/disconnect", async (c) => {
    const bot = await database.getBotById(Number(c.req.param("id")));
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    try {
      await deleteTelegramWebhook(bot);
      return c.json({ ok: true });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Webhook disconnect failed" }, 400);
    }
  });

  admin.route("/db", db);

  api.get("/health", (c) =>
    c.json({
      name: "bot-farm-server",
      status: "ok"
    })
  );

  api.route("/admin", admin);

  return api;
};
