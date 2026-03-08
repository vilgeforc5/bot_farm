import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BotRecord } from "../domain/types";

const api = {
  setMyName: vi.fn(async () => true),
  setMyDescription: vi.fn(async () => true),
  setMyShortDescription: vi.fn(async () => true),
  setMyProfilePhoto: vi.fn(async () => true),
};

const botCtor = vi.fn(() => ({ api }));
const inputFilePaths: string[] = [];

class InputFileMock {
  constructor(readonly path: string) {
    inputFilePaths.push(path);
  }
}

vi.mock("grammy", () => ({
  Bot: botCtor,
  InlineKeyboard: class InlineKeyboardMock {
    text() {
      return this;
    }

    row() {
      return this;
    }
  },
  InputFile: InputFileMock,
}));

const { syncTelegramBotProfile } = await import("./telegram");

const makeBot = (): BotRecord => ({
  id: 1,
  slug: "support-bot",
  name: "Support Bot",
  description: "Shared support assistant",
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
  systemPrompt: "",
  helpMessage: "",
  buttons: [],
  localeMessages: {},
  createdAt: "2026-03-08T00:00:00.000Z",
  updatedAt: "2026-03-08T00:00:00.000Z",
});

describe("syncTelegramBotProfile", () => {
  beforeEach(() => {
    botCtor.mockClear();
    inputFilePaths.length = 0;
    Object.values(api).forEach((fn) => fn.mockClear());
  });

  it("syncs the shared avatar along with the Telegram profile fields", async () => {
    await syncTelegramBotProfile(makeBot());

    expect(api.setMyName).toHaveBeenCalledWith("Support Bot");
    expect(api.setMyDescription).toHaveBeenCalledWith("Shared support assistant");
    expect(api.setMyShortDescription).toHaveBeenCalledWith(
      "Shared support assistant",
    );
    expect(inputFilePaths).toHaveLength(1);
    expect(inputFilePaths[0]).toMatch(/chatgpt_logo\.jpg$/);
    expect(api.setMyProfilePhoto).toHaveBeenCalledWith({
      type: "static",
      photo: expect.objectContaining({
        path: expect.stringMatching(/chatgpt_logo\.jpg$/),
      }),
    });
  });
});
