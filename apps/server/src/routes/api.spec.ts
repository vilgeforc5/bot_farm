import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { parseServerEnv, type ServerEnv } from "../config/env";
import { createTypeOrmDatabaseAdapter, type DatabaseAdapter } from "../db/typeorm-adapter";
import { createApiRoutes } from "./api";

const makeEnv = (dbPath: string): ServerEnv =>
  parseServerEnv({
    APP_PORT: "3001",
    APP_BASE_URL: "http://localhost:3001",
    DB_ADAPTER: "typeorm",
    DB_PATH: dbPath,
    OPENROUTER_API_KEY: "openrouter-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    DEFAULT_OPENROUTER_MODEL: "openrouter/auto",
    DEFAULT_CONTEXT_LIMIT: "300",
    DEV_LONG_POLLING: "false",
    TELEGRAM_POLL_TIMEOUT_SECONDS: "25",
    SECRET_ENCRYPTION_KEY: "test-secret-key",
    DASHBOARD_ORIGIN: "http://localhost:3000",
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD: "super-secret"
  });

const authHeader = (env: ServerEnv) =>
  `Basic ${Buffer.from(`${env.ADMIN_USERNAME}:${env.ADMIN_PASSWORD}`).toString("base64")}`;

describe("admin db api", () => {
  let database: DatabaseAdapter | null = null;
  let directory: string | null = null;

  afterEach(async () => {
    if (database) {
      await database.close();
      database = null;
    }

    if (directory) {
      rmSync(directory, { recursive: true, force: true });
      directory = null;
    }
  });

  it("creates, lists, summarizes, and toggles bots through the dedicated db endpoints", async () => {
    directory = mkdtempSync(join(tmpdir(), "bot-farm-server-"));
    const env = makeEnv(join(directory, "server.sqlite"));
    database = createTypeOrmDatabaseAdapter({
      adapterName: env.DB_ADAPTER,
      dbPath: env.DB_PATH,
      secretEncryptionKey: env.SECRET_ENCRYPTION_KEY
    });

    const api = createApiRoutes({ environment: env, database });
    const headers = {
      Authorization: authHeader(env),
      "Content-Type": "application/json"
    };

    const createResponse = await api.request("/admin/db/bots", {
      method: "POST",
      headers,
      body: JSON.stringify({
        slug: "support-bot",
        name: "Support Bot",
        description: "Handles support chats",
        defaultCountryCode: "DE",
        telegramBotToken: "123:abc",
        status: "paused",
        strategyKey: "base_llm_chatbot_strategy",
        llmProvider: "openrouter",
        llmModel: "openrouter/auto",
        fallbackModels: ["openrouter/gpt-4.1-mini"],
        contextLimit: 300,
        systemPrompt: "Be concise.",
        helpMessage: "Привет и напиши вопрос.",
        buttons: []
      })
    });

    expect(createResponse.status).toBe(201);
    const createdBot = (await createResponse.json()) as {
      id: number;
      status: string;
        telegramBotTokenPreview: string;
        defaultCountryCode: string;
        helpMessage: string;
      };
    expect(createdBot.telegramBotTokenPreview).toBe("123:ab...");
    expect(createdBot.defaultCountryCode).toBe("DE");
    expect(createdBot.status).toBe("paused");
    expect(createdBot.helpMessage).toBe("Привет и напиши вопрос.");
    expect(createdBot).not.toHaveProperty("telegramBotToken");
    expect(createdBot).not.toHaveProperty("telegramSecretToken");

    const summaryResponse = await api.request("/admin/db/summary", {
      headers: { Authorization: authHeader(env) }
    });
    expect(summaryResponse.status).toBe(200);
    await expect(summaryResponse.json()).resolves.toEqual({
      totalBots: 1,
      activeBots: 0,
      totalConversations: 0,
      totalMessages: 0
    });

    const listResponse = await api.request("/admin/db/bots", {
      headers: { Authorization: authHeader(env) }
    });
    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toEqual([
      expect.objectContaining({
        id: createdBot.id,
        slug: "support-bot",
        name: "Support Bot",
        defaultCountryCode: "DE",
        status: "paused",
        telegramBotTokenPreview: "123:ab...",
        helpMessage: "Привет и напиши вопрос.",
        stats: expect.objectContaining({
          totalConversations: 0,
          totalMessages: 0
        })
      })
    ]);

    const toggleResponse = await api.request(`/admin/db/bots/${createdBot.id}/toggle`, {
      method: "POST",
      headers: { Authorization: authHeader(env) }
    });
    expect(toggleResponse.status).toBe(200);
    await expect(toggleResponse.json()).resolves.toEqual(
      expect.objectContaining({
        id: createdBot.id,
        status: "active"
      })
    );

    const updateResponse = await api.request(`/admin/db/bots/${createdBot.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        slug: "support-bot",
        name: "Support Bot Updated",
        description: "Handles support chats better",
        defaultCountryCode: "JP",
        status: "active",
        strategyKey: "base_llm_chatbot_strategy",
        llmProvider: "openrouter",
        llmModel: "openrouter/auto",
        fallbackModels: ["openrouter/gpt-4.1-mini"],
        contextLimit: 320,
        systemPrompt: "Be concise.",
        helpMessage: "Новое стартовое сообщение.",
        buttons: []
      })
    });
    expect(updateResponse.status).toBe(200);
    await expect(updateResponse.json()).resolves.toEqual(
      expect.objectContaining({
        id: createdBot.id,
        name: "Support Bot Updated",
        defaultCountryCode: "JP",
        telegramBotTokenPreview: "123:ab...",
        helpMessage: "Новое стартовое сообщение."
      })
    );

    const statusResponse = await api.request("/admin/db/status", {
      headers: { Authorization: authHeader(env) }
    });
    expect(statusResponse.status).toBe(200);
    await expect(statusResponse.json()).resolves.toEqual({
      adapter: "typeorm",
      connected: true,
      databasePath: env.DB_PATH
    });
  });
});
