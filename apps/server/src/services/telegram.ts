import { Bot, InlineKeyboard } from "grammy";
import type { Update } from "grammy/types";
import { env } from "../config/env";
import type { BotInlineButton, BotRecord } from "../domain/types";

const clients = new Map<string, Bot>();

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
  buttons: BotInlineButton[][]
): Promise<void> => {
  await getClient(bot).api.sendMessage(chatId, text, {
    reply_markup: buildInlineKeyboard(buttons)
  });
};

export const answerCallbackQuery = async (bot: BotRecord, callbackQueryId: string, text: string): Promise<void> => {
  await getClient(bot).api.answerCallbackQuery(callbackQueryId, {
    text
  });
};

export const setTelegramWebhook = async (bot: BotRecord): Promise<void> => {
  await getClient(bot).api.setWebhook(`${env.APP_BASE_URL}/webhooks/telegram/${bot.slug}`, {
    secret_token: bot.telegramSecretToken
  });
};

export const deleteTelegramWebhook = async (bot: BotRecord): Promise<void> => {
  await getClient(bot).api.deleteWebhook({
    drop_pending_updates: false
  });
};

export const getTelegramUpdates = async (
  bot: BotRecord,
  offset: number,
  timeoutSeconds: number
): Promise<Update[]> => {
  return getClient(bot).api.getUpdates({
    offset,
    timeout: timeoutSeconds,
    allowed_updates: ["message", "callback_query"]
  });
};
