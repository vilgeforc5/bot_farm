import { store } from "../db/store";
import { getStrategy } from "../domain/strategies";
import type { BotRecord, TelegramMessageUpdate } from "../domain/types";
import { completeWithOpenRouter } from "./openrouter";
import { answerCallbackQuery, sendTelegramMessage } from "./telegram";

const helpText = [
  "This bot uses the base_llm_chatbot_strategy.",
  "Buttons:",
  "- Clear Context: resets the stored message window for this chat.",
  "- Help: shows this help text."
].join("\n");

const getUserText = (update: TelegramMessageUpdate): string => update.message?.text?.trim() ?? "";

export const handleTelegramUpdate = async (bot: BotRecord, update: TelegramMessageUpdate): Promise<void> => {
  if (bot.status !== "active") {
    return;
  }

  if (update.callback_query?.data) {
    const action = update.callback_query.data;
    const chatId = String(update.callback_query.message?.chat.id ?? "");
    const userId = String(update.callback_query.from.id);

    if (!chatId || !userId) {
      return;
    }

    if (action === "clear_context") {
      await store.clearConversation(bot.id, chatId, userId);
      await answerCallbackQuery(bot, update.callback_query.id, "Context cleared");
      await sendTelegramMessage(bot, chatId, "Context cleared for this chat.", [[{ text: "Help", action: "show_help" }]]);
      return;
    }

    if (action === "show_help") {
      await answerCallbackQuery(bot, update.callback_query.id, "Help sent");
      await sendTelegramMessage(bot, chatId, helpText, [[{ text: "Clear Context", action: "clear_context" }]]);
      return;
    }

    await answerCallbackQuery(bot, update.callback_query.id, "Unknown action");
    return;
  }

  const inputText = getUserText(update);
  if (!inputText || !update.message?.from) {
    return;
  }

  const chatId = String(update.message.chat.id);
  const userId = String(update.message.from.id);
  const conversation = await store.getOrCreateConversation(bot.id, chatId, userId);
  await store.addMessage(conversation.id, "user", inputText, String(update.message.message_id));

  const recentMessages = await store.listRecentMessages(conversation.id, 12);
  const strategy = getStrategy(bot.strategyKey);
  const execution = strategy.buildExecution({
    bot,
    messages: recentMessages
  });

  const completion = await completeWithOpenRouter(bot, execution.prompt);
  await store.addMessage(conversation.id, "assistant", completion.text);
  await store.updateConversationSummary(conversation.id, execution.prompt);
  await store.addUsage({
    botId: bot.id,
    conversationId: conversation.id,
    provider: completion.provider,
    model: completion.model,
    promptChars: completion.promptChars,
    completionChars: completion.completionChars,
    totalChars: completion.promptChars + completion.completionChars,
    rawResponse: completion.rawResponse
  });

  await sendTelegramMessage(bot, chatId, completion.text, execution.buttons);
};
