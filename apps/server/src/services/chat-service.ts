import { store } from "../db/store";
import { getStrategy } from "../domain/strategies";
import type {
  BotRecord,
  ConversationRecord,
  MessageRecord,
  TelegramMessageUpdate,
} from "../domain/types";
import {
  buildCountryKeyboard,
  buildCountrySelectionText,
  getCountryByCode,
  getCountryPage,
  parseCountryAction,
} from "./countries";
import {
  getLocaleForCountry,
  isSupportedLocale,
  resolveMessages,
} from "./locales";
import { resolveStartText } from "./start-message";
import { completeWithOpenRouter } from "./openrouter";
import {
  answerCallbackQuery,
  editTelegramMessage,
  sendTelegramMessage,
  sendTypingAction,
} from "./telegram";

const getUserText = (update: TelegramMessageUpdate): string => update.message?.text?.trim() ?? "";
const isStartCommand = (text: string): boolean => /^\/start(?:@\w+)?(?:\s.*)?$/i.test(text);
const isCountryCommand = (text: string): boolean => /^\/country(?:@\w+)?(?:\s.*)?$/i.test(text);
const isClearCommand = (text: string): boolean => /^\/clear(?:@\w+)?(?:\s.*)?$/i.test(text);

const getBotLocale = (bot: BotRecord, countryCode: string) =>
  (bot.defaultLocale && isSupportedLocale(bot.defaultLocale) ? bot.defaultLocale : null) ??
  getLocaleForCountry(countryCode);

const getBotMessages = (bot: BotRecord, countryCode: string) =>
  resolveMessages(getBotLocale(bot, countryCode), bot.localeMessages);

const withTypingIndicator = async <T>(bot: BotRecord, chatId: string, task: () => Promise<T>): Promise<T> => {
  await sendTypingAction(bot, chatId);
  const timer = setInterval(() => {
    void sendTypingAction(bot, chatId).catch((error) => {
      console.error("typing_action_error", {
        bot: bot.slug,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }, 4000);

  try {
    return await task();
  } finally {
    clearInterval(timer);
  }
};

const makeRegenerateButtons = (regenerateButtonLabel: string) => [
  [{ text: regenerateButtonLabel, action: "regenerate_response" }],
];

const sendCountryPrompt = async (
  bot: BotRecord,
  chatId: string,
  conversation: ConversationRecord
) => {
  const msgs = getBotMessages(bot, conversation.countryCode);
  const currentCountry = getCountryByCode(conversation.countryCode);
  await sendTelegramMessage(
    bot,
    chatId,
    buildCountrySelectionText(currentCountry, msgs),
    buildCountryKeyboard(getCountryPage(conversation.countryCode), conversation.countryCode)
  );
};

const sendStartSequence = async (
  bot: BotRecord,
  chatId: string,
  conversation: ConversationRecord
) => {
  const startText = resolveStartText(bot, conversation.countryCode);
  await sendTelegramMessage(bot, chatId, startText, []);
  await sendCountryPrompt(bot, chatId, conversation);
};

const generateAssistantReply = async ({
  bot,
  chatId,
  conversation,
  messages,
}: {
  bot: BotRecord;
  chatId: string;
  conversation: ConversationRecord;
  messages: MessageRecord[];
}) => {
  const strategy = getStrategy(bot.strategyKey);
  const execution = strategy.buildExecution({
    bot,
    conversation,
    messages
  });

  const completion = await withTypingIndicator(bot, chatId, () =>
    completeWithOpenRouter(bot, execution.prompt)
  );

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

  return {
    text: completion.text,
    buttons: execution.buttons
  };
};

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

    const countryAction = parseCountryAction(action);
    if (countryAction) {
      const conversation = await store.getOrCreateConversation(bot.id, chatId, userId);
      const msgs = getBotMessages(bot, conversation.countryCode);

      if (countryAction.type === "noop") {
        await answerCallbackQuery(bot, update.callback_query.id, msgs.countriesPage);
        return;
      }

      if (countryAction.type === "page") {
        await answerCallbackQuery(bot, update.callback_query.id, msgs.selectCountry);
        const currentCountry = getCountryByCode(conversation.countryCode);
        if (update.callback_query.message?.message_id) {
          await editTelegramMessage(
            bot,
            chatId,
            update.callback_query.message.message_id,
            buildCountrySelectionText(currentCountry, msgs),
            buildCountryKeyboard(countryAction.page, conversation.countryCode),
          );
        } else {
          await sendTelegramMessage(
            bot,
            chatId,
            buildCountrySelectionText(currentCountry, msgs),
            buildCountryKeyboard(countryAction.page, conversation.countryCode),
          );
        }
        return;
      }

      const selectedCountry = getCountryByCode(countryAction.code);
      if (selectedCountry.code === conversation.countryCode) {
        await answerCallbackQuery(
          bot,
          update.callback_query.id,
          msgs.alreadySelected
            .replace("{flag}", selectedCountry.flag)
            .replace("{country}", selectedCountry.nativeName),
        );
        return;
      }

      await store.updateConversationCountry(
        conversation.id,
        selectedCountry.code,
        selectedCountry.nativeName,
      );
      // After country change, re-resolve messages with the new country
      const newMsgs = getBotMessages(bot, selectedCountry.code);
      await answerCallbackQuery(
        bot,
        update.callback_query.id,
        newMsgs.countrySet
          .replace("{flag}", selectedCountry.flag)
          .replace("{country}", selectedCountry.nativeName),
      );
      if (update.callback_query.message?.message_id) {
        await editTelegramMessage(
          bot,
          chatId,
          update.callback_query.message.message_id,
          buildCountrySelectionText(selectedCountry, newMsgs),
          buildCountryKeyboard(getCountryPage(selectedCountry.code), selectedCountry.code),
        );
      } else {
        await sendTelegramMessage(
          bot,
          chatId,
          buildCountrySelectionText(selectedCountry, newMsgs),
          buildCountryKeyboard(getCountryPage(selectedCountry.code), selectedCountry.code),
        );
      }
      return;
    }

    if (action === "regenerate_response") {
      const conversation = await store.getOrCreateConversation(bot.id, chatId, userId);
      const msgs = getBotMessages(bot, conversation.countryCode);
      const telegramMessageId = String(update.callback_query.message?.message_id ?? "");
      if (!telegramMessageId) {
        await answerCallbackQuery(bot, update.callback_query.id, msgs.messageNotFound);
        return;
      }

      const assistantMessage = await store.getMessageByTelegramMessageId(
        conversation.id,
        telegramMessageId
      );
      if (!assistantMessage || assistantMessage.role !== "assistant") {
        await answerCallbackQuery(bot, update.callback_query.id, msgs.nothingToRegenerate);
        return;
      }

      const messages = await store.listMessagesBefore(conversation.id, assistantMessage.id, 12);
      if (messages.length === 0) {
        await answerCallbackQuery(bot, update.callback_query.id, msgs.contextNotFound);
        return;
      }

      await answerCallbackQuery(bot, update.callback_query.id, msgs.regenerating);
      const regenerated = await generateAssistantReply({
        bot,
        chatId,
        conversation,
        messages
      });
      await editTelegramMessage(
        bot,
        chatId,
        Number(telegramMessageId),
        regenerated.text,
        makeRegenerateButtons(msgs.regenerateButton)
      );
      await store.updateMessageText(assistantMessage.id, regenerated.text);
      return;
    }

    {
      const conversation = await store.getOrCreateConversation(bot.id, chatId, userId);
      const msgs = getBotMessages(bot, conversation.countryCode);
      await answerCallbackQuery(bot, update.callback_query.id, msgs.unknownAction);
    }
    return;
  }

  const inputText = getUserText(update);
  if (!inputText || !update.message?.from) {
    return;
  }

  const chatId = String(update.message.chat.id);
  const userId = String(update.message.from.id);
  const conversation = await store.getOrCreateConversation(bot.id, chatId, userId);
  const msgs = getBotMessages(bot, conversation.countryCode);

  if (isStartCommand(inputText)) {
    await sendStartSequence(bot, chatId, conversation);
    return;
  }

  if (isCountryCommand(inputText)) {
    await sendCountryPrompt(bot, chatId, conversation);
    return;
  }

  if (isClearCommand(inputText)) {
    await store.clearConversation(bot.id, chatId, userId);
    await sendTelegramMessage(bot, chatId, msgs.contextCleared, []);
    return;
  }

  await store.addMessage(conversation.id, "user", inputText, String(update.message.message_id));

  const recentMessages = await store.listRecentMessages(conversation.id, 12);
  const completion = await generateAssistantReply({
    bot,
    chatId,
    conversation,
    messages: recentMessages
  });
  const telegramMessageId = await sendTelegramMessage(
    bot,
    chatId,
    completion.text,
    makeRegenerateButtons(msgs.regenerateButton)
  );
  await store.addMessage(
    conversation.id,
    "assistant",
    completion.text,
    String(telegramMessageId)
  );
};
