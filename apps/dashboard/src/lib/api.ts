import type { StoredAuth } from "./auth";
import { buildBasicAuthHeader } from "./auth";

export type BotStatus = "active" | "paused";

export type SupportedLocale =
  | "ru"
  | "uk"
  | "kk"
  | "en"
  | "hi"
  | "fa"
  | "zh"
  | "de"
  | "fr"
  | "pl";

export interface LocaleInfo {
  code: SupportedLocale;
  label: string;
  flag: string;
}

export interface LocaleMessageOverride {
  startMessage?: string;
  countriesPage?: string;
  selectCountry?: string;
  currentlySelected?: string;
  alreadySelected?: string;
  countrySet?: string;
  contextCleared?: string;
  regenerating?: string;
  messageNotFound?: string;
  nothingToRegenerate?: string;
  contextNotFound?: string;
  unknownAction?: string;
  regenerateButton?: string;
  countryContext?: string;
}

export type LocaleMessagesMap = Partial<
  Record<SupportedLocale, LocaleMessageOverride>
>;

export interface BotInlineButton {
  text: string;
  action: string;
}

export interface BotStats {
  botId: number;
  totalConversations: number;
  totalMessages: number;
  totalUsageChars: number;
  lastInteractionAt: string | null;
}

export interface BotRecord {
  id: number;
  slug: string;
  name: string;
  description: string;
  defaultCountryCode: string;
  defaultLocale: string;
  telegramBotTokenPreview: string;
  status: BotStatus;
  strategyKey: "base_llm_chatbot_strategy";
  llmProvider: "openrouter";
  llmModel: string;
  fallbackModels: string[];
  contextLimit: number;
  systemPrompt: string;
  helpMessage: string;
  buttons: BotInlineButton[];
  localeMessages: LocaleMessagesMap;
  createdAt: string;
  updatedAt: string;
  stats: BotStats;
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
  lastMessageRole: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
}

export interface BotPayload {
  slug: string;
  name: string;
  description: string;
  defaultCountryCode: string;
  defaultLocale: string;
  telegramBotToken?: string;
  status: BotStatus;
  strategyKey: "base_llm_chatbot_strategy";
  llmProvider: "openrouter";
  llmModel: string;
  fallbackModels: string[];
  contextLimit: number;
  systemPrompt: string;
  helpMessage: string;
  buttons: BotInlineButton[];
  localeMessages: LocaleMessagesMap;
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

export interface BotUsersPageData {
  items: BotUserRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorLogEntry {
  id: number;
  kind: string;
  message: string;
  context: Record<string, unknown>;
  occurredAt: string;
}

const parseError = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
};

export const apiFetch = async <T>(
  auth: StoredAuth,
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${auth.serverUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: buildBasicAuthHeader(auth),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
};
