import type { Update } from "grammy/types";
import type { LocaleMessagesOverrides, SupportedLocale } from "../services/locales";

export type { LocaleMessagesOverrides, SupportedLocale };

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
  defaultCountryCode: string;
  defaultLocale: SupportedLocale | "";
  telegramBotToken: string;
  telegramSecretToken: string;
  status: BotStatus;
  strategyKey: StrategyKey;
  llmProvider: "openrouter";
  llmModel: string;
  fallbackModels: string[];
  contextLimit: number;
  systemPrompt: string;
  helpMessage: string;
  buttons: BotInlineButton[];
  localeMessages: LocaleMessagesOverrides;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationRecord {
  id: number;
  botId: number;
  chatId: string;
  userId: string;
  summaryContext: string;
  countryCode: string;
  countryName: string;
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
  totalUniqueUsers: number;
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

export interface OpenRouterModelOption {
  id: string;
  name: string;
  description: string;
  category: "popular_free" | "cheap";
  promptPrice: number;
  completionPrice: number;
  requestPrice: number;
  contextLength: number | null;
  isFree: boolean;
}

export interface OpenRouterModelsResponse {
  defaultModel: string;
  items: OpenRouterModelOption[];
}

export interface CountryOption {
  code: string;
  flag: string;
  nativeName: string;
}

export interface CountriesResponse {
  defaultCountryCode: string;
  items: CountryOption[];
}

export interface BotUserRecord {
  conversationId: number;
  chatId: string;
  userId: string;
  countryCode: string;
  countryName: string;
  totalChars: number;
  modelsUsed: string[];
  lastMessageText: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
}

export interface BotUsersPage {
  items: BotUserRecord[];
  total: number;
  page: number;
  pageSize: number;
}
