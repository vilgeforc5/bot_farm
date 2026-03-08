import countriesData from "world-countries";
import type {
  BotInlineButton,
  CountriesResponse,
  CountryOption,
} from "../domain/types";

interface WorldCountry {
  cca2: string;
  flag?: string;
  unMember?: boolean;
  name: {
    common: string;
    native?: Record<string, { common: string }>;
  };
}

export interface CountryActionSet {
  type: "set";
  code: string;
}

export interface CountryActionPage {
  type: "page";
  page: number;
}

export interface CountryActionNoop {
  type: "noop";
}

export type CountryAction =
  | CountryActionSet
  | CountryActionPage
  | CountryActionNoop;

const COUNTRY_PAGE_SIZE = 12;
const COUNTRY_CALLBACK_SET_PREFIX = "country:set:";
const COUNTRY_CALLBACK_PAGE_PREFIX = "country:page:";
const COUNTRY_CALLBACK_NOOP = "country:noop";

const toCountryOption = (country: WorldCountry): CountryOption => {
  const nativeName =
    Object.values(country.name.native ?? {})[0]?.common ?? country.name.common;

  return {
    code: country.cca2,
    flag: country.flag ?? "",
    nativeName,
  };
};

export const countries = (countriesData as WorldCountry[])
  .filter((country) => country.unMember)
  .map(toCountryOption)
  .sort((left, right) => {
    if (left.code === "RU") {
      return -1;
    }

    if (right.code === "RU") {
      return 1;
    }

    return left.nativeName.localeCompare(right.nativeName, "ru-RU");
  });

export const defaultCountry = countries.find(
  (country) => country.code === "RU",
) ?? {
  code: "RU",
  flag: "🇷🇺",
  nativeName: "Россия",
};

const clampPage = (page: number) => {
  const maxPage = Math.max(
    0,
    Math.ceil(countries.length / COUNTRY_PAGE_SIZE) - 1,
  );
  return Math.min(Math.max(page, 0), maxPage);
};

export const getCountryByCode = (code: string): CountryOption =>
  countries.find((country) => country.code === code.toUpperCase()) ??
  defaultCountry;

export const getCountryPage = (code: string) => {
  const index = countries.findIndex(
    (country) => country.code === code.toUpperCase(),
  );
  if (index < 0) {
    return 0;
  }

  return Math.floor(index / COUNTRY_PAGE_SIZE);
};

export const listCountries = (): CountriesResponse => ({
  defaultCountryCode: defaultCountry.code,
  items: countries
});

export const buildCountrySelectionText = (country: CountryOption) =>
  [
    "Выберите свою страну.",
    `Сейчас выбрана: ${country.flag} ${country.nativeName}.`,
    "Чатбот будет отвечать вам на вашем языке!"
  ].join("\n");

export const buildCountryKeyboard = (
  page: number,
  selectedCountryCode: string,
): BotInlineButton[][] => {
  const normalizedPage = clampPage(page);
  const startIndex = normalizedPage * COUNTRY_PAGE_SIZE;
  const pageItems = countries.slice(startIndex, startIndex + COUNTRY_PAGE_SIZE);
  const rows: BotInlineButton[][] = [];

  for (let index = 0; index < pageItems.length; index += 2) {
    rows.push(
      pageItems.slice(index, index + 2).map((country) => ({
        text:
          country.code === selectedCountryCode
            ? `✓ ${country.flag} ${country.nativeName}`
            : `${country.flag} ${country.nativeName}`,
        action: `${COUNTRY_CALLBACK_SET_PREFIX}${country.code}`,
      })),
    );
  }

  const maxPage = Math.max(
    0,
    Math.ceil(countries.length / COUNTRY_PAGE_SIZE) - 1,
  );
  if (maxPage > 0) {
    rows.push([
      {
        text: "←",
        action: `${COUNTRY_CALLBACK_PAGE_PREFIX}${clampPage(normalizedPage - 1)}`,
      },
      {
        text: `${normalizedPage + 1}/${maxPage + 1}`,
        action: COUNTRY_CALLBACK_NOOP,
      },
      {
        text: "→",
        action: `${COUNTRY_CALLBACK_PAGE_PREFIX}${clampPage(normalizedPage + 1)}`,
      },
    ]);
  }

  return rows;
};

export const parseCountryAction = (action: string): CountryAction | null => {
  if (action.startsWith(COUNTRY_CALLBACK_SET_PREFIX)) {
    const code = action
      .slice(COUNTRY_CALLBACK_SET_PREFIX.length)
      .trim()
      .toUpperCase();
    if (!code) {
      return null;
    }

    return { type: "set", code };
  }

  if (action.startsWith(COUNTRY_CALLBACK_PAGE_PREFIX)) {
    const page = Number(action.slice(COUNTRY_CALLBACK_PAGE_PREFIX.length));
    if (!Number.isInteger(page)) {
      return null;
    }

    return { type: "page", page: clampPage(page) };
  }

  if (action === COUNTRY_CALLBACK_NOOP) {
    return { type: "noop" };
  }

  return null;
};

export const buildCountryContext = (
  country: Pick<CountryOption, "flag" | "nativeName">,
) =>
  `Страна пользователя: ${country.flag} ${country.nativeName}. По умолчанию отвечай с учётом локального контекста этой страны и на языке пользователя, если он не попросил иное.`;
