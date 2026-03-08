import { Bot, InlineKeyboard } from "grammy";
import type { Update } from "grammy/types";
import { env } from "../config/env";
import type { BotInlineButton, BotRecord } from "../domain/types";

const clients = new Map<string, Bot>();
const TELEGRAM_NAME_LIMIT = 64;
const TELEGRAM_DESCRIPTION_LIMIT = 512;
const TELEGRAM_SHORT_DESCRIPTION_LIMIT = 120;

const getClient = (bot: BotRecord): Bot => {
  const key = `${bot.id}:${bot.telegramBotToken}`;
  const existing = clients.get(key);
  if (existing) {
    return existing;
  }

  const client = new Bot(bot.telegramBotToken);
  clients.set(key, client);
  return client;
};

const buildInlineKeyboard = (buttons: BotInlineButton[][]): InlineKeyboard => {
  const keyboard = new InlineKeyboard();
  buttons.forEach((row, rowIndex) => {
    row.forEach((button) => {
      keyboard.text(button.text, button.action);
    });
    if (rowIndex < buttons.length - 1) {
      keyboard.row();
    }
  });
  return keyboard;
};

export const sendTelegramMessage = async (
  bot: BotRecord,
  chatId: string,
  text: string,
  buttons: BotInlineButton[][],
): Promise<number> => {
  const message = await getClient(bot).api.sendMessage(chatId, text, {
    reply_markup: buildInlineKeyboard(buttons),
  });
  return Number((message as { message_id: number }).message_id);
};

export const editTelegramMessage = async (
  bot: BotRecord,
  chatId: string,
  messageId: number,
  text: string,
  buttons: BotInlineButton[][],
): Promise<void> => {
  await getClient(bot).api.editMessageText(chatId, messageId, text, {
    reply_markup: buildInlineKeyboard(buttons),
  });
};

export const answerCallbackQuery = async (
  bot: BotRecord,
  callbackQueryId: string,
  text: string,
): Promise<void> => {
  try {
    await getClient(bot).api.answerCallbackQuery(callbackQueryId, { text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      !msg.includes("query is too old") &&
      !msg.includes("query ID is invalid")
    ) {
      throw error;
    }
  }
};

export const sendTypingAction = async (
  bot: BotRecord,
  chatId: string,
): Promise<void> => {
  await getClient(bot).api.sendChatAction(chatId, "typing");
};

export const setTelegramCommands = async (bot: BotRecord): Promise<void> => {
  await getClient(bot).api.setMyCommands([
    { command: "start", description: "Показать стартовое сообщение" },
    { command: "country", description: "Выбрать страну заново" },
    { command: "clear", description: "Очистить контекст" },
  ]);
};

const trimToLimit = (value: string, limit: number) =>
  value.trim().slice(0, limit);

export const syncTelegramBotProfile = async (bot: BotRecord): Promise<void> => {
  const name = trimToLimit(bot.name, TELEGRAM_NAME_LIMIT);
  const description = trimToLimit(bot.description, TELEGRAM_DESCRIPTION_LIMIT);
  const shortDescription = trimToLimit(
    bot.description,
    TELEGRAM_SHORT_DESCRIPTION_LIMIT,
  );

  if (name) {
    await getClient(bot).api.setMyName(name);
  }
  await getClient(bot).api.setMyDescription(description);
  await getClient(bot).api.setMyShortDescription(shortDescription);
};

export const setTelegramWebhook = async (bot: BotRecord): Promise<void> => {
  await getClient(bot).api.setWebhook(
    `${env.APP_BASE_URL}/webhooks/telegram/${bot.slug}`,
    {
      secret_token: bot.telegramSecretToken,
    },
  );
};

export const deleteTelegramWebhook = async (bot: BotRecord): Promise<void> => {
  await getClient(bot).api.deleteWebhook({
    drop_pending_updates: false,
  });
};

export const getTelegramUpdates = async (
  bot: BotRecord,
  offset: number,
  timeoutSeconds: number,
): Promise<Update[]> => {
  return getClient(bot).api.getUpdates({
    offset,
    timeout: timeoutSeconds,
    allowed_updates: ["message", "callback_query"],
  });
};
