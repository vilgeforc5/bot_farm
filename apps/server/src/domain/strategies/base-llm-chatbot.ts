import { env } from "../../config/env";
import { buildCountryContext, getCountryByCode } from "../../services/countries";
import { getLocaleForCountry, isSupportedLocale, resolveMessages } from "../../services/locales";
import type {
  BotInlineButton,
  BotRecord,
  ConversationRecord,
  MessageRecord,
} from "../types";
import { buildReducedContext } from "../../services/context-window";

export interface StrategyExecutionInput {
  bot: BotRecord;
  conversation: ConversationRecord;
  messages: MessageRecord[];
}

export interface StrategyExecutionOutput {
  prompt: string;
  buttons: BotInlineButton[][];
}

export interface BotStrategy {
  key: BotRecord["strategyKey"];
  label: string;
  defaultButtons: BotInlineButton[];
  defaultStartMessage: string;
  buildExecution(input: StrategyExecutionInput): StrategyExecutionOutput;
}

const defaultButtons: BotInlineButton[] = [
  { text: "Regenerate", action: "regenerate_response" }
];

const defaultStartMessage = [
  "Hi. I'm ready to help.",
  "Send your question as a regular message.",
  "Commands:",
  "- /country: select country",
  "- /clear: clear context",
].join("\n");

export const baseLlmChatbotStrategy: BotStrategy = {
  key: "base_llm_chatbot_strategy",
  label: "Base LLM Chatbot",
  defaultButtons,
  defaultStartMessage,
  buildExecution({ conversation, messages, bot }) {
    const country = getCountryByCode(conversation.countryCode);
    const locale =
      (bot.defaultLocale && isSupportedLocale(bot.defaultLocale) ? bot.defaultLocale : null) ??
      getLocaleForCountry(conversation.countryCode);
    const msgs = resolveMessages(locale, bot.localeMessages);
    const reducedContext = buildReducedContext(messages, bot.contextLimit || env.DEFAULT_CONTEXT_LIMIT);
    const prompt = [
      bot.systemPrompt.trim(),
      buildCountryContext(
        { flag: country.flag, nativeName: conversation.countryName || country.nativeName },
        msgs.countryContext,
      ),
      reducedContext,
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      prompt,
      buttons: defaultButtons.map((button) => [button])
    };
  }
};
