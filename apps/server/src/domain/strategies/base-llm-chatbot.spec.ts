import { describe, expect, it } from "vitest";
import { baseLlmChatbotStrategy } from "./base-llm-chatbot";

describe("baseLlmChatbotStrategy", () => {
  it("injects the conversation country into the prompt context", () => {
    const execution = baseLlmChatbotStrategy.buildExecution({
      bot: {
        id: 1,
        slug: "support-bot",
        name: "Support Bot",
        description: "",
        defaultCountryCode: "RU",
        defaultLocale: "",
        telegramBotToken: "123:abc",
        telegramSecretToken: "secret",
        status: "active",
        strategyKey: "base_llm_chatbot_strategy",
        llmProvider: "openrouter",
        llmModel: "openrouter/free",
        fallbackModels: [],
        contextLimit: 300,
        systemPrompt: "Отвечай кратко.",
        helpMessage: "",
        buttons: [],
        localeMessages: {},
        createdAt: "2026-03-08T00:00:00.000Z",
        updatedAt: "2026-03-08T00:00:00.000Z",
      },
      conversation: {
        id: 1,
        botId: 1,
        chatId: "chat-1",
        userId: "user-1",
        summaryContext: "",
        countryCode: "DE",
        countryName: "Deutschland",
        createdAt: "2026-03-08T00:00:00.000Z",
        updatedAt: "2026-03-08T00:00:00.000Z",
      },
      messages: [
        {
          id: 1,
          conversationId: 1,
          role: "user",
          text: "Подскажи локальные условия доставки",
          telegramMessageId: "1",
          createdAt: "2026-03-08T00:00:00.000Z",
        },
      ],
    });

    expect(execution.prompt).toContain("Отвечай кратко.");
    expect(execution.prompt).toContain("Страна пользователя: 🇩🇪 Deutschland.");
    expect(execution.prompt).toContain("user: Подскажи локальные условия доставки");
  });
});
