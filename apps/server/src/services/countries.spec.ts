import { describe, expect, it } from "vitest";
import {
  buildCountryContext,
  buildCountryKeyboard,
  buildCountrySelectionText,
  defaultCountry,
  getCountryByCode,
  getCountryPage,
  parseCountryAction,
} from "./countries";

describe("countries helpers", () => {
  it("uses Russia as the default country", () => {
    expect(defaultCountry).toEqual({
      code: "RU",
      flag: "🇷🇺",
      nativeName: "Россия",
    });
  });

  it("builds a paginated keyboard with the selected country marked", () => {
    const selected = getCountryByCode("JP");
    const keyboard = buildCountryKeyboard(getCountryPage(selected.code), selected.code);
    const labels = keyboard.flat().map((button) => button.text);

    expect(labels).toContain(`✓ ${selected.flag} ${selected.nativeName}`);
    expect(labels).toContain("←");
    expect(labels).toContain("→");
  });

  it("parses country callback actions", () => {
    expect(parseCountryAction("country:set:JP")).toEqual({
      type: "set",
      code: "JP",
    });
    expect(parseCountryAction("country:page:3")).toEqual({
      type: "page",
      page: 3,
    });
    expect(parseCountryAction("country:noop")).toEqual({
      type: "noop",
    });
    expect(parseCountryAction("unknown")).toBeNull();
  });

  it("formats selection and prompt texts with the chosen country", () => {
    const country = getCountryByCode("DE");

    expect(buildCountrySelectionText(country)).toContain("Сейчас выбрана: 🇩🇪 Deutschland.");
    expect(
      buildCountryContext({
        flag: country.flag,
        nativeName: country.nativeName,
      }),
    ).toContain(`${country.flag} ${country.nativeName}`);
  });
});
