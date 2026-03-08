import { getStrategy } from "../domain/strategies";
import type { BotRecord } from "../domain/types";
import {
  getLocaleForCountry,
  isSupportedLocale,
  resolveMessages,
} from "./locales";

const getBotLocale = (bot: BotRecord, countryCode: string) =>
  (bot.defaultLocale && isSupportedLocale(bot.defaultLocale) ? bot.defaultLocale : null) ??
  getLocaleForCountry(countryCode);

export const resolveStartText = (bot: BotRecord, countryCode: string): string => {
  const locale = getBotLocale(bot, countryCode);
  const localeOverride = bot.localeMessages[locale]?.startMessage?.trim() ?? "";
  return (
    localeOverride ||
    bot.helpMessage.trim() ||
    resolveMessages(locale, bot.localeMessages).startMessage.trim() ||
    getStrategy(bot.strategyKey).defaultStartMessage
  );
};
