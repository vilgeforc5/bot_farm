import type { StoredAuth } from "./auth";
import { buildBasicAuthHeader } from "./auth";

export type BotStatus = "active" | "paused";

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
  createdAt: string;
  updatedAt: string;
  stats: BotStats;
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
  lastMessageRole: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
}

export interface BotPayload {
  slug: string;
  name: string;
  description: string;
  defaultCountryCode: string;
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

const parseError = async (response: Response): Promise<string> => {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Request failed with ${response.status}`;
  } catch {
    return `Request failed with ${response.status}`;
  }
};

export const apiFetch = async <T>(auth: StoredAuth, path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${auth.serverUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": buildBasicAuthHeader(auth),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
};
