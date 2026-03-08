import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import type {
  BotPayload,
  BotRecord,
  DashboardSummary,
  InteractionRecord,
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

const defaultButtons = JSON.stringify(
  [
    { text: "Clear Context", action: "clear_context" },
    { text: "Help", action: "show_help" },
  ],
  null,
  2,
);

export const makeDefaultDraft = () => ({
  slug: "",
  name: "",
  description: "",
  telegramBotToken: "",
  status: "paused" as const,
  llmModel: "openrouter/auto",
  fallbackModels: "",
  contextLimit: "300",
  systemPrompt: "",
  buttonsJson: defaultButtons,
});

export const parsePayload = (
  draft: ReturnType<typeof makeDefaultDraft>,
): BotPayload => ({
  slug: draft.slug.trim(),
  name: draft.name.trim(),
  description: draft.description.trim(),
  telegramBotToken: draft.telegramBotToken.trim(),
  status: draft.status,
  strategyKey: "base_llm_chatbot_strategy",
  llmProvider: "openrouter",
  llmModel: draft.llmModel.trim(),
  fallbackModels: draft.fallbackModels
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean),
  contextLimit: Number(draft.contextLimit),
  systemPrompt: draft.systemPrompt.trim(),
  buttons: JSON.parse(draft.buttonsJson),
});

const inputClass =
  "rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

const textareaClass =
  "min-h-[96px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

function DashboardPage() {
  const auth = readAuth()!;
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState(makeDefaultDraft);
  const [editing, setEditing] = useState<
    Record<number, ReturnType<typeof makeDefaultDraft>>
  >({});

  const summaryQuery = useQuery({
    queryKey: ["summary", auth.serverUrl],
    queryFn: () => apiFetch<DashboardSummary>(auth, "/api/admin/db/summary"),
    staleTime: 10_000,
  });

  const botsQuery = useQuery({
    queryKey: ["bots", auth.serverUrl],
    queryFn: () => apiFetch<BotRecord[]>(auth, "/api/admin/db/bots"),
    staleTime: 10_000,
  });

  const interactionsQuery = useQuery({
    queryKey: ["interactions", auth.serverUrl],
    queryFn: () =>
      apiFetch<InteractionRecord[]>(auth, "/api/admin/db/interactions"),
    staleTime: 10_000,
  });

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["summary", auth.serverUrl] }),
      queryClient.invalidateQueries({ queryKey: ["bots", auth.serverUrl] }),
      queryClient.invalidateQueries({
        queryKey: ["interactions", auth.serverUrl],
      }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      botId,
      payload,
    }: {
      botId?: number;
      payload: BotPayload;
    }) =>
      apiFetch<BotRecord>(
        auth,
        botId ? `/api/admin/db/bots/${botId}` : "/api/admin/db/bots",
        {
          method: botId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: async (_, variables) => {
      if (!variables.botId) {
        setCreateDraft(makeDefaultDraft());
      }
      setNotice(variables.botId ? "Bot updated" : "Bot created");
      await refreshAll();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "Save failed");
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ path }: { path: string }) =>
      apiFetch<{ ok?: true } | BotRecord>(auth, path, { method: "POST" }),
    onSuccess: async () => {
      setNotice("Action completed");
      await refreshAll();
    },
    onError: (error) => {
      setNotice(error instanceof Error ? error.message : "Action failed");
    },
  });

  const submitDraft = (
    draft: ReturnType<typeof makeDefaultDraft>,
    botId?: number,
  ) => {
    try {
      saveMutation.mutate({ botId, payload: parsePayload(draft) });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invalid bot payload");
    }
  };

  const bots = botsQuery.data ?? [];
  const summary = summaryQuery.data;
  const interactions = interactionsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">
              Operations Plane
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Telegram Bot Farm
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Separate TanStack dashboard package, separate Hono server package,
              one operator surface for bot inventory, usage, interactions, and
              Telegram control.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-stone-900 px-5 py-4 text-stone-50">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-300">
              Backend
            </p>
            <p className="mt-1 text-sm">{auth.serverUrl}</p>
          </div>
        </div>
        {notice ? (
          <p className="mt-5 rounded-2xl border border-black/10 bg-orange-50 px-4 py-3 text-sm text-stone-700">
            {notice}
          </p>
        ) : null}
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Bots" value={summary?.totalBots ?? 0} />
        <MetricCard label="Active Bots" value={summary?.activeBots ?? 0} />
        <MetricCard
          label="Conversations"
          value={summary?.totalConversations ?? 0}
        />
        <MetricCard label="Messages" value={summary?.totalMessages ?? 0} />
      </section>

      <section className="mb-8 rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Provisioning
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-tight">
            Create Bot
          </h3>
        </div>
        <BotEditor
          draft={createDraft}
          onChange={setCreateDraft}
          onSubmit={() => submitDraft(createDraft)}
          submitLabel={saveMutation.isPending ? "Saving..." : "Create Bot"}
        />
      </section>

      <section className="mb-8 rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Conversations
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              Recent Interactions
            </h3>
          </div>
          <span className="rounded-full border border-black/10 bg-stone-50 px-4 py-2 text-sm text-stone-600">
            {interactions.length} visible
          </span>
        </div>
        <div className="grid gap-4">
          {interactions.map((interaction) => (
            <article
              key={interaction.conversationId}
              className="rounded-[1.5rem] border border-black/10 bg-stone-50/80 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {interaction.botName} / {interaction.botSlug}
                  </p>
                  <h4 className="mt-1 text-xl font-medium">
                    Conversation #{interaction.conversationId}
                  </h4>
                </div>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  {interaction.lastMessageAt ?? "No activity"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs text-stone-500">
                <span>chat:{interaction.chatId}</span>
                <span>user:{interaction.userId}</span>
                <span>role:{interaction.lastMessageRole ?? "none"}</span>
              </div>
              <p className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6">
                {interaction.lastMessageText ?? "No messages yet"}
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Reduced context: {interaction.summaryContext || "Empty"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {bots.map((bot) => {
          const draft = editing[bot.id] ?? {
            slug: bot.slug,
            name: bot.name,
            description: bot.description,
            telegramBotToken: bot.telegramBotToken,
            status: bot.status,
            llmModel: bot.llmModel,
            fallbackModels: bot.fallbackModels.join("\n"),
            contextLimit: String(bot.contextLimit),
            systemPrompt: bot.systemPrompt,
            buttonsJson: JSON.stringify(bot.buttons, null, 2),
          };

          return (
            <section
              key={bot.id}
              className="rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
                      Bot Profile
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                      {bot.name}
                    </h3>
                    <p className="mt-2 text-sm text-stone-500">/{bot.slug}</p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                      bot.status === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {bot.status}
                  </span>
                </div>
                <p className="text-sm leading-6 text-stone-600">
                  {bot.description || "No description"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <MetricTile
                    label="Conversations"
                    value={bot.stats.totalConversations}
                  />
                  <MetricTile
                    label="Messages"
                    value={bot.stats.totalMessages}
                  />
                  <MetricTile
                    label="Usage chars"
                    value={bot.stats.totalUsageChars}
                  />
                  <MetricTile
                    label="Last interaction"
                    value={bot.stats.lastInteractionAt ?? "Never"}
                    small
                  />
                </div>

                <BotEditor
                  draft={draft}
                  onChange={(nextDraft) =>
                    setEditing((current) => ({
                      ...current,
                      [bot.id]: nextDraft,
                    }))
                  }
                  onSubmit={() => submitDraft(draft, bot.id)}
                  submitLabel={saveMutation.isPending ? "Saving..." : "Save"}
                />

                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    label={bot.status === "active" ? "Pause" : "Activate"}
                    onClick={() =>
                      actionMutation.mutate({
                        path: `/api/admin/db/bots/${bot.id}/toggle`,
                      })
                    }
                  />
                  <ActionButton
                    label="Connect Webhook"
                    onClick={() =>
                      actionMutation.mutate({
                        path: `/api/admin/bots/${bot.id}/connect`,
                      })
                    }
                  />
                  <ActionButton
                    label="Disconnect Webhook"
                    onClick={() =>
                      actionMutation.mutate({
                        path: `/api/admin/bots/${bot.id}/disconnect`,
                      })
                    }
                  />
                </div>
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[1.5rem] border border-black/10 bg-white/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.04)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
        {label}
      </p>
      <strong className="mt-3 block text-4xl font-semibold">{value}</strong>
    </article>
  );
}

function MetricTile({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-stone-50/90 p-4">
      <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
        {label}
      </span>
      <strong
        className={`mt-2 block font-semibold ${small ? "text-sm leading-6" : "text-2xl"}`}
      >
        {value}
      </strong>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition hover:bg-stone-100"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function BotEditor({
  draft,
  onChange,
  onSubmit,
  submitLabel,
}: {
  draft: ReturnType<typeof makeDefaultDraft>;
  onChange: (draft: ReturnType<typeof makeDefaultDraft>) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const update = <K extends keyof ReturnType<typeof makeDefaultDraft>>(
    key: K,
    value: ReturnType<typeof makeDefaultDraft>[K],
  ) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Name">
        <input
          className={inputClass}
          onChange={(event) => update("name", event.target.value)}
          value={draft.name}
        />
      </Field>
      <Field label="Slug">
        <input
          className={inputClass}
          onChange={(event) => update("slug", event.target.value)}
          value={draft.slug}
        />
      </Field>
      <Field className="md:col-span-2" label="Description">
        <textarea
          className={textareaClass}
          onChange={(event) => update("description", event.target.value)}
          value={draft.description}
        />
      </Field>
      <Field className="md:col-span-2" label="Telegram Token">
        <input
          className={inputClass}
          onChange={(event) => update("telegramBotToken", event.target.value)}
          value={draft.telegramBotToken}
        />
      </Field>
      <Field label="Status">
        <select
          className={inputClass}
          onChange={(event) =>
            update("status", event.target.value as "active" | "paused")
          }
          value={draft.status}
        >
          <option value="paused">paused</option>
          <option value="active">active</option>
        </select>
      </Field>
      <Field label="Model">
        <input
          className={inputClass}
          onChange={(event) => update("llmModel", event.target.value)}
          value={draft.llmModel}
        />
      </Field>
      <Field label="Fallback Models">
        <textarea
          className={textareaClass}
          onChange={(event) => update("fallbackModels", event.target.value)}
          value={draft.fallbackModels}
        />
      </Field>
      <Field label="Context Limit">
        <input
          className={inputClass}
          onChange={(event) => update("contextLimit", event.target.value)}
          type="number"
          value={draft.contextLimit}
        />
      </Field>
      <Field className="md:col-span-2" label="System Prompt">
        <textarea
          className="min-h-[120px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          onChange={(event) => update("systemPrompt", event.target.value)}
          value={draft.systemPrompt}
        />
      </Field>
      <Field className="md:col-span-2" label="Inline Buttons JSON">
        <textarea
          className="min-h-[140px] rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
          onChange={(event) => update("buttonsJson", event.target.value)}
          value={draft.buttonsJson}
        />
      </Field>
      <div className="md:col-span-2 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-orange-600 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-orange-700"
          onClick={onSubmit}
          type="button"
        >
          {submitLabel}
        </button>
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
  children: ReactNode;
}) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ""}`}>
      <span className="text-stone-600">{label}</span>
      {children}
    </label>
  );
}
