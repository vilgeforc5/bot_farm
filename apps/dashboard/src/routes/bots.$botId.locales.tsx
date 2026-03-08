import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import type {
  BotRecord,
  LocaleInfo,
  LocaleMessageOverride,
  LocaleMessagesMap,
  SupportedLocale,
} from "../lib/api";
import { apiFetch } from "../lib/api";
import { readAuth } from "../lib/auth";

export const Route = createFileRoute("/bots/$botId/locales")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !readAuth()) {
      throw redirect({ to: "/login" });
    }
  },
  component: LocaleEditorPage,
});

const MESSAGE_KEYS: Array<{
  key: keyof LocaleMessageOverride;
  label: string;
  hint: string;
  multiline?: boolean;
}> = [
  {
    key: "startMessage",
    label: "Start message (/start)",
    hint: "Sent when the user runs /start. Falls back to the bot's 'Стартовое сообщение' field, then the built-in default.",
    multiline: true,
  },
  {
    key: "selectCountry",
    label: "Select country prompt",
    hint: "Shown above the country picker keyboard.",
  },
  {
    key: "currentlySelected",
    label: "Currently selected",
    hint: "Use {flag} and {country} as placeholders.",
    multiline: true,
  },
  {
    key: "alreadySelected",
    label: "Already selected (toast)",
    hint: "Use {flag} and {country} as placeholders.",
  },
  {
    key: "countrySet",
    label: "Country set (toast)",
    hint: "Use {flag} and {country} as placeholders.",
  },
  {
    key: "countriesPage",
    label: "Countries page (toast)",
    hint: "Shown when user taps the page indicator button.",
  },
  {
    key: "contextCleared",
    label: "Context cleared",
    hint: "Sent after /clear command.",
  },
  {
    key: "regenerateButton",
    label: "Regenerate button label",
    hint: "Label on the inline keyboard button.",
  },
  {
    key: "regenerating",
    label: "Regenerating (toast)",
    hint: "Shown when regeneration starts.",
  },
  {
    key: "messageNotFound",
    label: "Message not found (toast)",
    hint: "Error: no Telegram message to regenerate.",
  },
  {
    key: "nothingToRegenerate",
    label: "Nothing to regenerate (toast)",
    hint: "Error: no assistant message found.",
  },
  {
    key: "contextNotFound",
    label: "Context not found (toast)",
    hint: "Error: no messages before the target.",
  },
  {
    key: "unknownAction",
    label: "Unknown action (toast)",
    hint: "Fallback for unrecognized button actions.",
  },
  {
    key: "countryContext",
    label: "Country context (LLM system prompt)",
    hint: "Use {flag} and {country}. Injected into every LLM prompt.",
    multiline: true,
  },
];

function LocaleEditorPage() {
  const auth = readAuth()!;
  const { botId } = Route.useParams();
  const queryClient = useQueryClient();

  const botQuery = useQuery({
    queryKey: ["bot", auth.serverUrl, botId],
    queryFn: () => apiFetch<BotRecord>(auth, `/api/admin/db/bots/${botId}`),
    staleTime: 10_000,
  });

  const localesQuery = useQuery({
    queryKey: ["locales", auth.serverUrl],
    queryFn: () => apiFetch<LocaleInfo[]>(auth, "/api/admin/locales"),
    staleTime: Infinity,
  });

  const bot = botQuery.data;
  const locales = localesQuery.data ?? [];

  const [overrides, setOverrides] = useState<LocaleMessagesMap>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize overrides from bot data once loaded
  if (bot && !initialized) {
    setOverrides(bot.localeMessages ?? {});
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existing = await apiFetch<BotRecord>(
        auth,
        `/api/admin/db/bots/${botId}`,
      );
      return apiFetch<BotRecord>(auth, `/api/admin/db/bots/${botId}`, {
        method: "PUT",
        body: JSON.stringify({
          slug: existing.slug,
          name: existing.name,
          description: existing.description,
          defaultCountryCode: existing.defaultCountryCode,
          defaultLocale: existing.defaultLocale ?? "",
          status: existing.status,
          strategyKey: existing.strategyKey,
          llmProvider: existing.llmProvider,
          llmModel: existing.llmModel,
          fallbackModels: existing.fallbackModels,
          contextLimit: existing.contextLimit,
          systemPrompt: existing.systemPrompt,
          helpMessage: existing.helpMessage,
          buttons: existing.buttons,
          localeMessages: overrides,
        }),
      });
    },
    onSuccess: async () => {
      toast.success("Locale messages saved");
      await queryClient.invalidateQueries({
        queryKey: ["bot", auth.serverUrl, botId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["bots", auth.serverUrl],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    },
  });

  const updateField = (
    locale: SupportedLocale,
    key: keyof LocaleMessageOverride,
    value: string,
  ) => {
    setOverrides((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: value,
      },
    }));
  };

  const clearField = (
    locale: SupportedLocale,
    key: keyof LocaleMessageOverride,
  ) => {
    setOverrides((prev) => {
      const localeOverrides = { ...(prev[locale] ?? {}) };
      delete localeOverrides[key];
      return { ...prev, [locale]: localeOverrides };
    });
  };

  if (botQuery.isLoading || localesQuery.isLoading) {
    return (
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  if (!bot) {
    return (
      <main className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-red-600">Bot not found.</p>
        <Link className="text-sm underline mt-4 inline-block" to="/">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          className="text-xs text-stone-400 hover:text-stone-600 uppercase tracking-widest"
          to="/"
        >
          ← Dashboard
        </Link>
        <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500 mt-4">
          System messages
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {bot.name}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Здесь можно изменить системное сообщение бота под каждую локаль. Если
          поле не заполнено - используется стандартный перевод.
        </p>
      </div>

      <div className="space-y-10">
        {locales.map((locale) => (
          <LocaleSection
            key={locale.code}
            locale={locale}
            overrides={overrides[locale.code] ?? {}}
            onUpdate={(key, value) => updateField(locale.code, key, value)}
            onClear={(key) => clearField(locale.code, key)}
          />
        ))}
      </div>

      <div className="mt-10 flex gap-3 sticky bottom-4">
        <Button
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          type="button"
          className="shadow-lg"
        >
          {saveMutation.isPending ? "Saving…" : "Save all locales"}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Cancel</Link>
        </Button>
      </div>
    </main>
  );
}

function LocaleSection({
  locale,
  overrides,
  onUpdate,
  onClear,
}: {
  locale: LocaleInfo;
  overrides: LocaleMessageOverride;
  onUpdate: (key: keyof LocaleMessageOverride, value: string) => void;
  onClear: (key: keyof LocaleMessageOverride) => void;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold tracking-tight">
        {locale.flag} {locale.label}
        <span className="ml-2 text-xs font-normal text-stone-400 uppercase tracking-widest">
          {locale.code}
        </span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {MESSAGE_KEYS.map(({ key, label, hint, multiline }) => {
          const value = overrides[key] ?? "";
          const isOverridden = key in overrides;
          return (
            <div key={key} className={multiline ? "sm:col-span-2" : ""}>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    {label}
                    {isOverridden && (
                      <span className="ml-1.5 text-[10px] text-blue-500 font-medium">
                        overridden
                      </span>
                    )}
                  </Label>
                  {isOverridden && (
                    <button
                      className="text-[10px] text-stone-400 hover:text-red-500"
                      onClick={() => onClear(key)}
                      type="button"
                    >
                      reset to default
                    </button>
                  )}
                </div>
                {multiline ? (
                  <Textarea
                    className="min-h-[80px] text-sm font-mono"
                    onChange={(e) => onUpdate(key, e.target.value)}
                    placeholder={`Default (${locale.code})`}
                    value={value}
                  />
                ) : (
                  <Input
                    className="text-sm font-mono"
                    onChange={(e) => onUpdate(key, e.target.value)}
                    placeholder={`Default (${locale.code})`}
                    value={value}
                  />
                )}
                <p className="text-[11px] text-stone-400">{hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
