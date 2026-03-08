import type {
  CountriesResponse,
  BotPayload,
  BotStatus,
  LocaleMessagesMap,
  OpenRouterModelOption,
} from "../../lib/api";

export interface BotDraft {
  slug: string;
  name: string;
  description: string;
  defaultCountryCode: string;
  defaultLocale: string;
  telegramBotToken: string;
  status: BotStatus;
  llmModel: string;
  fallbackModels: string[];
  contextLimit: string;
  systemPrompt: string;
  startMessage: string;
  localeMessages: LocaleMessagesMap;
}

const defaultStartMessage = [
  "Привет. Я готов помочь.",
  "Напишите ваш вопрос обычным сообщением.",
  "Команды:",
  "- /country: выбрать страну",
  "- /clear: очистить контекст",
].join("\n");

export const makeDefaultDraft = (): BotDraft => ({
  slug: "",
  name: "",
  description: "",
  defaultCountryCode: "RU",
  defaultLocale: "",
  telegramBotToken: "",
  status: "paused",
  llmModel: "openrouter/free",
  fallbackModels: [],
  contextLimit: "300",
  systemPrompt: "",
  startMessage: defaultStartMessage,
  localeMessages: {},
});

export const parsePayload = (
  draft: BotDraft,
  options?: { requireTelegramBotToken?: boolean },
): BotPayload => {
  const telegramBotToken = draft.telegramBotToken.trim();
  if (options?.requireTelegramBotToken && !telegramBotToken) {
    throw new Error("Укажите токен Telegram");
  }

  return {
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    description: draft.description.trim(),
    defaultCountryCode: draft.defaultCountryCode.trim().toUpperCase(),
    defaultLocale: draft.defaultLocale.trim(),
    ...(telegramBotToken ? { telegramBotToken } : {}),
    status: draft.status,
    strategyKey: "base_llm_chatbot_strategy",
    llmProvider: "openrouter",
    llmModel: draft.llmModel.trim(),
    fallbackModels: draft.fallbackModels
      .map((value) => value.trim())
      .filter(Boolean),
    contextLimit: Number(draft.contextLimit),
    systemPrompt: draft.systemPrompt.trim(),
    helpMessage: draft.startMessage.trim(),
    buttons: [],
    localeMessages: draft.localeMessages,
  };
};

export const formatBotStatus = (status: BotStatus) =>
  status === "active" ? "активен" : "на паузе";

export const formatMessageRole = (role: string | null) => {
  if (role === "assistant") {
    return "ассистент";
  }

  if (role === "user") {
    return "пользователь";
  }

  if (role === "system") {
    return "система";
  }

  return "нет";
};

const formatUsdPerMillion = (price: number) => {
  const scaled = price * 1_000_000;
  if (scaled >= 1) {
    return `$${scaled.toFixed(2)}`;
  }

  if (scaled >= 0.01) {
    return `$${scaled.toFixed(3)}`;
  }

  return `$${scaled.toFixed(4)}`;
};

export const formatModelPrice = (model: OpenRouterModelOption) => {
  if (model.isFree) {
    return "бесплатно";
  }

  return `${formatUsdPerMillion(model.promptPrice)} / ${formatUsdPerMillion(model.completionPrice)}`;
};

export const formatModelOption = (model: OpenRouterModelOption) => {
  const categoryLabel = model.category === "popular_free" ? "популярная free" : "дешёвая";

  if (model.isFree) {
    return `${model.name} • ${categoryLabel} • бесплатно`;
  }

  return `${model.name} • ${categoryLabel} • вход ${formatUsdPerMillion(model.promptPrice)}/1М • выход ${formatUsdPerMillion(model.completionPrice)}/1М`;
};

export const formatContextLength = (contextLength: number | null) => {
  if (!contextLength) {
    return "контекст не указан";
  }

  return `${contextLength.toLocaleString("ru-RU")} токенов`;
};

export const applyDefaultCountry = (
  draft: BotDraft,
  countries: CountriesResponse | undefined,
): BotDraft => ({
  ...draft,
  defaultCountryCode:
    draft.defaultCountryCode || countries?.defaultCountryCode || "RU",
});
