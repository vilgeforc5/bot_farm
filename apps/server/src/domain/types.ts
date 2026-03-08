import type { Update } from "grammy/types";

export type BotStatus = "active" | "paused";

export type MessageRole = "system" | "user" | "assistant";

export type StrategyKey = "base_llm_chatbot_strategy";

export interface BotInlineButton {
  text: string;
  action: string;
}

export interface BotRecord {
  id: number;
  slug: string;
  name: string;
  description: string;
  telegramBotToken: string;
  telegramSecretToken: string;
  status: BotStatus;
  strategyKey: StrategyKey;
  llmProvider: "openrouter";
  llmModel: string;
  fallbackModels: string[];
  contextLimit: number;
  systemPrompt: string;
  buttons: BotInlineButton[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationRecord {
  id: number;
  botId: number;
  chatId: string;
  userId: string;
  summaryContext: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: number;
  conversationId: number;
  role: MessageRole;
  text: string;
  telegramMessageId: string | null;
  createdAt: string;
}

export interface UsageRecord {
  id: number;
  botId: number;
  conversationId: number | null;
  provider: string;
  model: string;
  promptChars: number;
  completionChars: number;
  totalChars: number;
  rawResponse: string;
  createdAt: string;
}

export type TelegramMessageUpdate = Update;

export interface BotStats {
  botId: number;
  totalConversations: number;
  totalMessages: number;
  totalUsageChars: number;
  lastInteractionAt: string | null;
}

export interface DashboardSummary {
  totalBots: number;
  activeBots: number;
  totalConversations: number;
  totalMessages: number;
}

export interface InteractionRecord {
  conversationId: number;
  botId: number;
  botName: string;
  botSlug: string;
  chatId: string;
  userId: string;
  summaryContext: string;
  lastMessageRole: MessageRole | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
}
