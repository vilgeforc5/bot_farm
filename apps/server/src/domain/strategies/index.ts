import type { BotRecord } from "../types";
import { baseLlmChatbotStrategy } from "./base-llm-chatbot";

const registry = {
  [baseLlmChatbotStrategy.key]: baseLlmChatbotStrategy
} as const;

export const strategies = registry;

export const getStrategy = (key: BotRecord["strategyKey"]) => registry[key];
