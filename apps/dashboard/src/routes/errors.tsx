import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ErrorLogEntry } from "../lib/api";
import { apiFetch } from "../lib/api";
import { readAuth } from "../lib/auth";

export const Route = createFileRoute("/errors")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !readAuth()) {
      throw redirect({ to: "/login" });
    }
  },
  component: ErrorsPage,
});

function ErrorsPage() {
  const auth = readAuth()!;
  const queryClient = useQueryClient();

  const errorsQuery = useQuery({
    queryKey: ["errors", auth.serverUrl],
    queryFn: () => apiFetch<ErrorLogEntry[]>(auth, "/api/admin/errors"),
    staleTime: 5_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });

  const clearMutation = useMutation({
    mutationFn: () => apiFetch<{ ok: true }>(auth, "/api/admin/errors", { method: "DELETE" }),
    onSuccess: async () => {
      toast.success("Лог очищен");
      await queryClient.invalidateQueries({ queryKey: ["errors", auth.serverUrl] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Не удалось очистить лог");
    },
  });

  const entries = errorsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">Диагностика</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">Лог ошибок</h2>
          <p className="mt-2 text-sm text-stone-500">
            Последние {entries.length} записей (хранится до 500, новые сверху)
          </p>
        </div>
        <button
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm transition hover:bg-stone-100 disabled:opacity-50"
          disabled={entries.length === 0 || clearMutation.isPending}
          onClick={() => clearMutation.mutate()}
          type="button"
        >
          {clearMutation.isPending ? "Очистка..." : "Очистить лог"}
        </button>
      </div>

      {errorsQuery.isError ? (
        <p className="text-sm text-red-700">Не удалось загрузить лог ошибок.</p>
      ) : entries.length === 0 ? (
        <div className="rounded-[1.5rem] border border-black/10 bg-white/60 px-6 py-12 text-center text-stone-500">
          Ошибок не зафиксировано
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <article
              className="rounded-[1.5rem] border border-red-100 bg-red-50/60 p-4"
              key={entry.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="rounded-full bg-red-100 px-3 py-1 font-mono text-xs text-red-700">
                  {entry.kind}
                </span>
                <span className="font-mono text-xs text-stone-400">{entry.occurredAt}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-stone-800">{entry.message}</p>
              {Object.keys(entry.context).length > 0 ? (
                <pre className="mt-2 overflow-x-auto rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-xs text-stone-600">
                  {JSON.stringify(entry.context, null, 2)}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
