// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { makeDefaultDraft, parsePayload } from "../components/dashboard/bot-draft";

describe("dashboard bot draft helpers", () => {
  it("creates the expected default draft", () => {
    expect(makeDefaultDraft()).toEqual({
      slug: "",
      name: "",
      description: "",
      defaultCountryCode: "RU",
      telegramBotToken: "",
      status: "paused",
      llmModel: "openrouter/free",
      fallbackModels: [],
      contextLimit: "300",
      systemPrompt: "",
      startMessage: [
        "Привет. Я готов помочь.",
        "Напишите ваш вопрос обычным сообщением.",
        "Команды:",
        "- /country: выбрать страну",
        "- /clear: очистить контекст",
      ].join("\n"),
    });
  });

  it("parses and normalizes a bot draft into an api payload", () => {
    const payload = parsePayload({
      ...makeDefaultDraft(),
      slug: "  support-bot  ",
      name: "  Support Bot  ",
      description: "  Handles operator requests  ",
      defaultCountryCode: " de ",
      telegramBotToken: "  123:abc  ",
      status: "active",
      llmModel: "  openrouter/gpt-4.1-mini  ",
      fallbackModels: [" openrouter/free ", " ", " openrouter/deepseek-chat "],
      contextLimit: "450",
      systemPrompt: "  Keep replies concise.  ",
      startMessage: "  Привет и напиши вопрос.  ",
    });

    expect(payload).toEqual({
      slug: "support-bot",
      name: "Support Bot",
      description: "Handles operator requests",
      defaultCountryCode: "DE",
      telegramBotToken: "123:abc",
      status: "active",
      strategyKey: "base_llm_chatbot_strategy",
      llmProvider: "openrouter",
      llmModel: "openrouter/gpt-4.1-mini",
      fallbackModels: ["openrouter/free", "openrouter/deepseek-chat"],
      contextLimit: 450,
      systemPrompt: "Keep replies concise.",
      helpMessage: "Привет и напиши вопрос.",
      buttons: []
    });
  });

  it("omits telegram token from payload when edit form leaves it blank", () => {
    const payload = parsePayload(
      {
        ...makeDefaultDraft(),
        slug: "support-bot",
        name: "Support Bot",
        defaultCountryCode: "jp",
        telegramBotToken: "   ",
      },
      { requireTelegramBotToken: false }
    );

    expect(payload).not.toHaveProperty("telegramBotToken");
    expect(payload.defaultCountryCode).toBe("JP");
  });
});
