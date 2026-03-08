// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { makeDefaultDraft, parsePayload } from "./index";

describe("dashboard bot draft helpers", () => {
  it("creates the expected default draft", () => {
    expect(makeDefaultDraft()).toEqual({
      slug: "",
      name: "",
      description: "",
      telegramBotToken: "",
      status: "paused",
      llmModel: "openrouter/auto",
      fallbackModels: "",
      contextLimit: "300",
      systemPrompt: "",
      buttonsJson: JSON.stringify(
        [
          { text: "Clear Context", action: "clear_context" },
          { text: "Help", action: "show_help" }
        ],
        null,
        2
      )
    });
  });

  it("parses and normalizes a bot draft into an api payload", () => {
    const payload = parsePayload({
      ...makeDefaultDraft(),
      slug: "  support-bot  ",
      name: "  Support Bot  ",
      description: "  Handles operator requests  ",
      telegramBotToken: "  123:abc  ",
      status: "active",
      llmModel: "  openrouter/gpt-4.1-mini  ",
      fallbackModels: " openrouter/auto \n\n openrouter/deepseek-chat ",
      contextLimit: "450",
      systemPrompt: "  Keep replies concise.  ",
      buttonsJson: JSON.stringify([
        { text: "FAQ", action: "faq" },
        { text: "Escalate", action: "handoff" }
      ])
    });

    expect(payload).toEqual({
      slug: "support-bot",
      name: "Support Bot",
      description: "Handles operator requests",
      telegramBotToken: "123:abc",
      status: "active",
      strategyKey: "base_llm_chatbot_strategy",
      llmProvider: "openrouter",
      llmModel: "openrouter/gpt-4.1-mini",
      fallbackModels: ["openrouter/auto", "openrouter/deepseek-chat"],
      contextLimit: 450,
      systemPrompt: "Keep replies concise.",
      buttons: [
        { text: "FAQ", action: "faq" },
        { text: "Escalate", action: "handoff" }
      ]
    });
  });

  it("throws when the inline buttons value is not valid json", () => {
    expect(() =>
      parsePayload({
        ...makeDefaultDraft(),
        buttonsJson: "{"
      })
    ).toThrow();
  });
});
