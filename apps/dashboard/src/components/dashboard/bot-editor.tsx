import type {
  BotStatus,
  CountryOption,
  LocaleInfo,
  OpenRouterModelOption,
} from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import type { BotDraft } from "./bot-draft";
import { formatContextLength, formatModelOption } from "./bot-draft";
import { ModelFallbackPicker } from "./model-fallback-picker";

interface BotEditorProps {
  availableModels: OpenRouterModelOption[];
  availableCountries: CountryOption[];
  availableLocales?: LocaleInfo[];
  draft: BotDraft;
  onChange: (draft: BotDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
  showTelegramTokenField?: boolean;
}

const statuses: Array<{ value: BotStatus; label: string }> = [
  { value: "paused", label: "на паузе" },
  { value: "active", label: "активен" },
];

const AUTO_LOCALE_VALUE = "__auto__";

export function BotEditor({
  availableModels,
  availableCountries,
  availableLocales = [],
  draft,
  onChange,
  onSubmit,
  submitLabel,
  showTelegramTokenField = true,
}: BotEditorProps) {
  const update = <K extends keyof BotDraft>(key: K, value: BotDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Название">
        <Input
          onChange={(event) => update("name", event.target.value)}
          value={draft.name}
        />
      </Field>
      <Field label="Slug">
        <Input
          onChange={(event) => update("slug", event.target.value)}
          value={draft.slug}
        />
      </Field>
      <Field className="md:col-span-2" label="Описание">
        <Textarea
          onChange={(event) => update("description", event.target.value)}
          value={draft.description}
        />
      </Field>
      <Field label="Страна по умолчанию">
        <Select
          onValueChange={(value) => update("defaultCountryCode", value)}
          value={draft.defaultCountryCode}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите страну" />
          </SelectTrigger>
          <SelectContent>
            {availableCountries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.flag} {country.nativeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Locale for system messages">
        <Select
          onValueChange={(value) =>
            update("defaultLocale", value === AUTO_LOCALE_VALUE ? "" : value)
          }
          value={draft.defaultLocale || AUTO_LOCALE_VALUE}
        >
          <SelectTrigger>
            <SelectValue placeholder="Auto (by country)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={AUTO_LOCALE_VALUE}>
              🌐 Auto (detect from user's country)
            </SelectItem>
            {availableLocales.map((locale) => (
              <SelectItem key={locale.code} value={locale.code}>
                {locale.flag} {locale.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-stone-500">
          Overrides automatic locale detection. "Auto" picks the locale based on each user's selected country.
        </p>
      </Field>
      {showTelegramTokenField ? (
        <Field className="md:col-span-2" label="Токен Telegram">
          <Input
            onChange={(event) => update("telegramBotToken", event.target.value)}
            placeholder="123456:ABC-DEF..."
            type="password"
            value={draft.telegramBotToken}
          />
        </Field>
      ) : null}
      <Field label="Статус">
        <Select
          onValueChange={(value) => update("status", value as BotStatus)}
          value={draft.status}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите статус" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Модель">
        <Select
          onValueChange={(value) => update("llmModel", value)}
          value={draft.llmModel}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите модель" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {formatModelOption(model)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {draft.llmModel ? (
          <p className="text-xs text-stone-500">
            {formatContextLength(
              availableModels.find((model) => model.id === draft.llmModel)
                ?.contextLength ?? null,
            )}
          </p>
        ) : null}
      </Field>
      <div className="md:col-span-2">
        <ModelFallbackPicker
          availableModels={availableModels}
          fallbackModels={draft.fallbackModels}
          onChange={(value) => update("fallbackModels", value)}
        />
      </div>
      <Field label="Лимит контекста">
        <Input
          onChange={(event) => update("contextLimit", event.target.value)}
          type="number"
          value={draft.contextLimit}
        />
      </Field>
      <Field className="md:col-span-2" label="Системный промпт">
        <Textarea
          className="min-h-[120px]"
          onChange={(event) => update("systemPrompt", event.target.value)}
          value={draft.systemPrompt}
        />
      </Field>
      <Field className="md:col-span-2" label="Стартовое сообщение">
        <Textarea
          className="min-h-[140px]"
          onChange={(event) => update("startMessage", event.target.value)}
          value={draft.startMessage}
        />
      </Field>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button onClick={onSubmit} type="button">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="grid gap-2">
        <Label>{label}</Label>
        {children}
      </div>
    </div>
  );
}
