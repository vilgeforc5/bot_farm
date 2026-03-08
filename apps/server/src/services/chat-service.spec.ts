import { describe, expect, it } from "vitest";
import { resolveStartText } from "./start-message";

const makeBot = () => ({
  id: 1,
  slug: "support-bot",
  name: "Support Bot",
  description: "",
  defaultCountryCode: "RU",
  defaultLocale: "" as const,
  telegramBotToken: "123:abc",
  telegramSecretToken: "secret",
  status: "active" as const,
  strategyKey: "base_llm_chatbot_strategy" as const,
  llmProvider: "openrouter" as const,
  llmModel: "openrouter/free",
  fallbackModels: [],
  contextLimit: 300,
  systemPrompt: "",
  helpMessage: "",
  buttons: [],
  localeMessages: {},
  createdAt: "2026-03-08T00:00:00.000Z",
  updatedAt: "2026-03-08T00:00:00.000Z",
});

describe("resolveStartText", () => {
  it("uses the bot-level start message before built-in locale defaults", () => {
    const bot = {
      ...makeBot(),
      helpMessage: "Custom start text",
    };

    expect(resolveStartText(bot, "DE")).toBe("Custom start text");
  });

  it("prefers a locale-specific start override over the bot-level start message", () => {
    const bot = {
      ...makeBot(),
      helpMessage: "Generic start text",
      localeMessages: {
        de: {
          startMessage: "Lokale Startnachricht",
        },
      },
    };

    expect(resolveStartText(bot, "DE")).toBe("Lokale Startnachricht");
  });
});
