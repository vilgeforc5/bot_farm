import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { z } from "zod";
import type { ServerEnv } from "../config/env";
import type { DatabaseAdapter } from "../db/store";
import type { BotStatus } from "../domain/types";
import { listCountries } from "../services/countries";
import { clearErrorLog, getErrorLog } from "../services/error-log";
import { listOpenRouterModels } from "../services/openrouter";
import { SUPPORTED_LOCALES } from "../services/locales";
import {
  deleteTelegramWebhook,
  setTelegramCommands,
  syncTelegramBotProfile,
  setTelegramWebhook,
} from "../services/telegram";

const localeMessageOverrideSchema = z.object({
  startMessage: z.string().optional(),
  countriesPage: z.string().optional(),
  selectCountry: z.string().optional(),
  currentlySelected: z.string().optional(),
  alreadySelected: z.string().optional(),
  countrySet: z.string().optional(),
  contextCleared: z.string().optional(),
  regenerating: z.string().optional(),
  messageNotFound: z.string().optional(),
  nothingToRegenerate: z.string().optional(),
  contextNotFound: z.string().optional(),
  unknownAction: z.string().optional(),
  regenerateButton: z.string().optional(),
  countryContext: z.string().optional(),
}).strict();

const localeMessagesSchema = z
  .record(z.string(), localeMessageOverrideSchema)
  .default({})
  .transform((map) => {
    const validCodes = new Set(SUPPORTED_LOCALES.map((l) => l.code));
    return Object.fromEntries(
      Object.entries(map).filter(([key]) => validCodes.has(key))
    );
  });

const createBotPayloadSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  defaultCountryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).default("RU"),
  defaultLocale: z.string().default(""),
  telegramBotToken: z.string().min(1),
  status: z.enum(["active", "paused"]).default("paused"),
  strategyKey: z.literal("base_llm_chatbot_strategy").default("base_llm_chatbot_strategy"),
  llmProvider: z.literal("openrouter").default("openrouter"),
  llmModel: z.string().min(1),
  fallbackModels: z.array(z.string()).default([]),
  contextLimit: z.number().int().min(120).max(600),
  systemPrompt: z.string().default(""),
  helpMessage: z.string().default(""),
  buttons: z
    .array(
      z.object({
        text: z.string().min(1),
        action: z.string().min(1)
      })
    )
    .default([]),
  localeMessages: localeMessagesSchema,
});

const updateBotPayloadSchema = createBotPayloadSchema.extend({
  telegramBotToken: z.string().trim().optional()
});

const parseCreateBotPayload = async (request: Request) =>
  createBotPayloadSchema.parse(await request.json());

const parseUpdateBotPayload = async (request: Request) =>
  updateBotPayloadSchema.parse(await request.json());

const maskTelegramToken = (token: string) => {
  const prefix = token.slice(0, 6);
  return `${prefix}${token.length > prefix.length ? "..." : ""}`;
};

const serializeAdminBot = async (database: DatabaseAdapter, botId: number) => {
  const bot = await database.getBotById(botId);
  if (!bot) {
    return null;
  }

  return {
    id: bot.id,
    slug: bot.slug,
    name: bot.name,
    description: bot.description,
    defaultCountryCode: bot.defaultCountryCode,
    defaultLocale: bot.defaultLocale,
    telegramBotTokenPreview: maskTelegramToken(bot.telegramBotToken),
    status: bot.status,
    strategyKey: bot.strategyKey,
    llmProvider: bot.llmProvider,
    llmModel: bot.llmModel,
    fallbackModels: bot.fallbackModels,
    contextLimit: bot.contextLimit,
    systemPrompt: bot.systemPrompt,
    helpMessage: bot.helpMessage,
    buttons: bot.buttons,
    localeMessages: bot.localeMessages,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
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

  admin.get("/errors", (c) => c.json(getErrorLog()));
  admin.delete("/errors", (c) => { clearErrorLog(); return c.json({ ok: true }); });

  admin.get("/openrouter/models", async (c) => c.json(await listOpenRouterModels()));
  admin.get("/countries", (c) => c.json(listCountries()));
  admin.get("/locales", (c) => c.json(SUPPORTED_LOCALES));

  db.get("/status", async (c) => c.json(await database.getStatus()));

  db.get("/summary", async (c) => c.json(await database.getDashboardSummary()));

  db.get("/interactions", async (c) => c.json(await database.listRecentInteractions(50)));

  db.get("/bots", async (c) => {
    const bots = await database.listBots();
    return c.json(
      await Promise.all(
        bots.map((bot) => serializeAdminBot(database, bot.id))
      )
    );
  });

  db.get("/bots/:id", async (c) => {
    const botId = Number(c.req.param("id"));
    const bot = await serializeAdminBot(database, botId);
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    return c.json(bot);
  });

  db.post("/bots", async (c) => {
    try {
      const payload = await parseCreateBotPayload(c.req.raw);
      const bot = await database.saveBot(payload);
      return c.json(await serializeAdminBot(database, bot.id), 201);
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
      const payload = await parseUpdateBotPayload(c.req.raw);
      const bot = await database.saveBot({
        ...payload,
        id: botId,
        telegramBotToken: payload.telegramBotToken?.trim() || existing.telegramBotToken,
        telegramSecretToken: existing.telegramSecretToken
      });
      return c.json(await serializeAdminBot(database, bot.id));
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Failed to update bot" }, 400);
    }
  });

  db.delete("/bots/:id", async (c) => {
    const botId = Number(c.req.param("id"));
    const bot = await database.getBotById(botId);
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    await database.deleteBot(botId);
    return c.json({ ok: true });
  });

  db.get("/bots/:id/users", async (c) => {
    const botId = Number(c.req.param("id"));
    const page = Math.max(1, Number(c.req.query("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(c.req.query("pageSize") ?? 20)));
    return c.json(await database.listBotUsers(botId, page, pageSize));
  });

  db.post("/bots/:id/toggle", async (c) => {
    const botId = Number(c.req.param("id"));
    const bot = await database.getBotById(botId);
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    const nextStatus: BotStatus = bot.status === "active" ? "paused" : "active";
    await database.setBotStatus(botId, nextStatus);
    const updated = await serializeAdminBot(database, botId);
    return c.json(updated);
  });

  admin.post("/bots/:id/connect", async (c) => {
    const bot = await database.getBotById(Number(c.req.param("id")));
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    try {
      await setTelegramCommands(bot);
      await syncTelegramBotProfile(bot);
      await setTelegramWebhook(bot);
      return c.json({ ok: true });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Webhook connect failed" }, 400);
    }
  });

  admin.post("/bots/:id/sync-profile", async (c) => {
    const bot = await database.getBotById(Number(c.req.param("id")));
    if (!bot) {
      return c.json({ error: "Bot not found" }, 404);
    }

    try {
      await setTelegramCommands(bot);
      await syncTelegramBotProfile(bot);
      return c.json({ ok: true });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Telegram profile sync failed" }, 400);
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
