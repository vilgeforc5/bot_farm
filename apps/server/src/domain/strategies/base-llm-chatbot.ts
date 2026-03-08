import { env } from "../../config/env";
import type { BotInlineButton, BotRecord, MessageRecord } from "../types";
import { buildReducedContext } from "../../services/context-window";

export interface StrategyExecutionInput {
  bot: BotRecord;
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
  buildExecution(input: StrategyExecutionInput): StrategyExecutionOutput;
}

const defaultButtons: BotInlineButton[] = [
  { text: "Clear Context", action: "clear_context" },
  { text: "Help", action: "show_help" }
];

export const baseLlmChatbotStrategy: BotStrategy = {
  key: "base_llm_chatbot_strategy",
  label: "Base LLM Chatbot",
  defaultButtons,
  buildExecution({ bot, messages }) {
    const effectiveButtons = bot.buttons.length > 0 ? bot.buttons : defaultButtons;
    const reducedContext = buildReducedContext(messages, bot.contextLimit || env.DEFAULT_CONTEXT_LIMIT);
    const prompt = [bot.systemPrompt.trim(), reducedContext].filter(Boolean).join("\n\n");

    return {
      prompt,
      buttons: effectiveButtons.map((button) => [button])
    };
  }
};
