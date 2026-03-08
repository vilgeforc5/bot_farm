import { env } from "../../config/env";
import { buildCountryContext, getCountryByCode } from "../../services/countries";
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
  { text: "Сгенерировать снова", action: "regenerate_response" }
];

const defaultStartMessage = [
  "Привет. Я готов помочь.",
  "Напишите ваш вопрос обычным сообщением.",
  "Команды:",
  "- /country: выбрать страну",
  "- /clear: очистить контекст",
].join("\n");

export const baseLlmChatbotStrategy: BotStrategy = {
  key: "base_llm_chatbot_strategy",
  label: "Base LLM Chatbot",
  defaultButtons,
  defaultStartMessage,
  buildExecution({ conversation, messages, bot }) {
    const country = getCountryByCode(conversation.countryCode);
    const reducedContext = buildReducedContext(messages, bot.contextLimit || env.DEFAULT_CONTEXT_LIMIT);
    const prompt = [
      bot.systemPrompt.trim(),
      buildCountryContext({
        flag: country.flag,
        nativeName: conversation.countryName || country.nativeName,
      }),
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
