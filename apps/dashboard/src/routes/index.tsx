import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BotCard } from "../components/dashboard/bot-card";
import {
  applyDefaultCountry,
  makeDefaultDraft,
  parsePayload,
  type BotDraft,
} from "../components/dashboard/bot-draft";
import { BotEditor } from "../components/dashboard/bot-editor";
import { DashboardHero } from "../components/dashboard/dashboard-hero";
import { MetricCard } from "../components/dashboard/metric-card";
import { Card, CardContent } from "../components/ui/card";
import type {
  BotRecord,
  CountriesResponse,
  DashboardSummary,
  LocaleInfo,
  OpenRouterModelsResponse,
} from "../lib/api";
import { apiFetch } from "../lib/api";
import { readAuth } from "../lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !readAuth()) {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const auth = readAuth()!;
  const queryClient = useQueryClient();
  const [createDraft, setCreateDraft] = useState(makeDefaultDraft);
  const [editing, setEditing] = useState<Record<number, BotDraft>>({});

  const summaryQuery = useQuery({
    queryKey: ["summary", auth.serverUrl],
    queryFn: () => apiFetch<DashboardSummary>(auth, "/api/admin/db/summary"),
    staleTime: 10_000,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  const botsQuery = useQuery({
    queryKey: ["bots", auth.serverUrl],
    queryFn: () => apiFetch<BotRecord[]>(auth, "/api/admin/db/bots"),
    staleTime: 10_000,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

  const modelsQuery = useQuery({
    queryKey: ["openrouter-models", auth.serverUrl],
    queryFn: () =>
      apiFetch<OpenRouterModelsResponse>(auth, "/api/admin/openrouter/models"),
    staleTime: 60_000,
  });

  const countriesQuery = useQuery({
    queryKey: ["countries", auth.serverUrl],
    queryFn: () => apiFetch<CountriesResponse>(auth, "/api/admin/countries"),
    staleTime: 60_000,
  });

  const localesQuery = useQuery({
    queryKey: ["locales", auth.serverUrl],
    queryFn: () => apiFetch<LocaleInfo[]>(auth, "/api/admin/locales"),
    staleTime: Infinity,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["summary", auth.serverUrl] }),
      queryClient.invalidateQueries({ queryKey: ["bots", auth.serverUrl] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      botId,
      payload,
    }: {
      botId?: number;
      payload: ReturnType<typeof parsePayload>;
    }) =>
      apiFetch<BotRecord>(
        auth,
        botId ? `/api/admin/db/bots/${botId}` : "/api/admin/db/bots",
        {
          method: botId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: async (savedBot, variables) => {
      let syncError: string | null = null;
      try {
        await apiFetch<{ ok: true }>(
          auth,
          `/api/admin/bots/${savedBot.id}/sync-profile`,
          { method: "POST" },
        );
      } catch (error) {
        syncError =
          error instanceof Error
            ? `Telegram intro не обновлён: ${error.message}`
            : "Telegram intro не обновлён.";
      }

      if (!variables.botId) {
        setCreateDraft({
          ...applyDefaultCountry(makeDefaultDraft(), countriesQuery.data),
          llmModel:
            modelsQuery.data?.defaultModel ?? makeDefaultDraft().llmModel,
        });
      }
      toast.success(variables.botId ? "Бот обновлён" : "Бот создан");
      if (syncError) {
        toast.warning(syncError);
      } else {
        toast.success("Telegram intro обновлён");
      }
      await refreshAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Не удалось сохранить",
      );
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ path }: { path: string }) =>
      apiFetch<{ ok?: true } | BotRecord>(auth, path, { method: "POST" }),
    onSuccess: async () => {
      toast.success("Действие выполнено");
      await refreshAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Не удалось выполнить действие",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (botId: number) =>
      apiFetch<{ ok: true }>(auth, `/api/admin/db/bots/${botId}`, { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Бот удалён");
      await refreshAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Не удалось удалить бота",
      );
    },
  });

  const submitDraft = (draft: BotDraft, botId?: number) => {
    try {
      saveMutation.mutate({
        botId,
        payload: parsePayload(draft, {
          requireTelegramBotToken: !botId,
        }),
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Некорректные данные бота",
      );
    }
  };

  const bots = botsQuery.data ?? [];
  const summary = summaryQuery.data;
  const availableModels = modelsQuery.data?.items ?? [];
  const availableCountries = countriesQuery.data?.items ?? [];
  const availableLocales = localesQuery.data ?? [];
  const createBotDraft = applyDefaultCountry(
    {
      ...createDraft,
      llmModel:
        createDraft.llmModel ||
        modelsQuery.data?.defaultModel ||
        "openrouter/free",
    },
    countriesQuery.data,
  );

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-8">
      <DashboardHero serverUrl={auth.serverUrl} />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Всего ботов" value={summary?.totalBots ?? 0} />
        <MetricCard label="Активных ботов" value={summary?.activeBots ?? 0} />
        <MetricCard label="Диалоги" value={summary?.totalConversations ?? 0} />
        <MetricCard label="Сообщения" value={summary?.totalMessages ?? 0} />
      </section>

      <Card className="mb-8 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
        <CardContent className="p-6">
          <div className="mb-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Настройка
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              Создать бота
            </h3>
            {modelsQuery.isError ? (
              <p className="mt-3 text-sm text-red-700">
                Не удалось загрузить каталог моделей OpenRouter.
              </p>
            ) : null}
          </div>
          <BotEditor
            availableCountries={availableCountries}
            availableLocales={availableLocales}
            availableModels={availableModels}
            draft={createBotDraft}
            onChange={setCreateDraft}
            onSubmit={() => submitDraft(createBotDraft)}
            submitLabel={
              saveMutation.isPending ? "Сохранение..." : "Создать бота"
            }
          />
        </CardContent>
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        {bots.map((bot) => {
          const draft =
            editing[bot.id] ??
            ({
              slug: bot.slug,
              name: bot.name,
              description: bot.description,
              defaultCountryCode: bot.defaultCountryCode,
              defaultLocale: bot.defaultLocale ?? "",
              telegramBotToken: "",
              status: bot.status,
              llmModel: bot.llmModel,
              fallbackModels: bot.fallbackModels,
              contextLimit: String(bot.contextLimit),
              systemPrompt: bot.systemPrompt,
              startMessage: bot.helpMessage,
              localeMessages: bot.localeMessages ?? {},
            } satisfies BotDraft);

          return (
            <BotCard
              availableCountries={availableCountries}
              availableLocales={availableLocales}
              availableModels={availableModels}
              bot={bot}
              draft={draft}
              key={bot.id}
              onChange={(nextDraft) =>
                setEditing((current) => ({
                  ...current,
                  [bot.id]: nextDraft,
                }))
              }
              onConnect={() =>
                actionMutation.mutate({
                  path: `/api/admin/bots/${bot.id}/connect`,
                })
              }
              onDisconnect={() =>
                actionMutation.mutate({
                  path: `/api/admin/bots/${bot.id}/disconnect`,
                })
              }
              onRemove={() => removeMutation.mutate(bot.id)}
              onSave={() => submitDraft(draft, bot.id)}
              onToggle={() =>
                actionMutation.mutate({
                  path: `/api/admin/db/bots/${bot.id}/toggle`,
                })
              }
              saveLabel={saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            />
          );
        })}
      </section>
    </main>
  );
}
