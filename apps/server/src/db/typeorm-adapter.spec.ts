import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTypeOrmDatabaseAdapter } from "./typeorm-adapter";

describe("typeorm adapter persistence", () => {
  let directory: string | null = null;

  afterEach(() => {
    if (directory) {
      rmSync(directory, { recursive: true, force: true });
      directory = null;
    }
  });

  it("persists bots, messages, usage, and stats across adapter instances", async () => {
    directory = mkdtempSync(join(tmpdir(), "bot-farm-db-"));
    const dbPath = join(directory, "server.sqlite");

    const writer = createTypeOrmDatabaseAdapter({
      adapterName: "typeorm",
      dbPath,
      secretEncryptionKey: "test-secret-key"
    });

    const bot = await writer.saveBot({
      slug: "support-bot",
      name: "Support Bot",
      description: "Intro text",
      defaultCountryCode: "DE",
      telegramBotToken: "123:abc",
      status: "active",
      strategyKey: "base_llm_chatbot_strategy",
      llmProvider: "openrouter",
      llmModel: "openrouter/free",
      fallbackModels: [],
      contextLimit: 300,
      systemPrompt: "Be concise.",
      helpMessage: "Help",
      buttons: []
    });
    const conversation = await writer.getOrCreateConversation(bot.id, "chat-1", "user-1");
    expect(conversation.countryCode).toBe("DE");
    expect(conversation.countryName).toBe("Deutschland");
    await writer.addMessage(conversation.id, "user", "hello", "1");
    await writer.addMessage(conversation.id, "assistant", "hi", "2");
    await writer.addUsage({
      botId: bot.id,
      conversationId: conversation.id,
      provider: "openrouter",
      model: "openrouter/free",
      promptChars: 10,
      completionChars: 5,
      totalChars: 15,
      rawResponse: "{}"
    });

    const reader = createTypeOrmDatabaseAdapter({
      adapterName: "typeorm",
      dbPath,
      secretEncryptionKey: "test-secret-key"
    });

    await expect(reader.getDashboardSummary()).resolves.toEqual({
      totalBots: 1,
      activeBots: 1,
      totalConversations: 1,
      totalMessages: 2
    });

    await expect(reader.getBotStats(bot.id)).resolves.toEqual(
      expect.objectContaining({
        botId: bot.id,
        totalConversations: 1,
        totalMessages: 2,
        totalUsageChars: 15
      })
    );

    await expect(reader.listRecentInteractions(10)).resolves.toEqual([
      expect.objectContaining({
        botId: bot.id,
        botSlug: "support-bot",
        chatId: "chat-1",
        userId: "user-1",
        lastMessageText: "hi"
      })
    ]);
  });
});
