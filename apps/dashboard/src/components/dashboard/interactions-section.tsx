import type { InteractionRecord } from "../../lib/api";
import { Card, CardContent } from "../ui/card";
import { formatMessageRole } from "./bot-draft";

export function InteractionsSection({
  interactions
}: {
  interactions: InteractionRecord[];
}) {
  return (
    <Card className="mb-8 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Диалоги
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              Последние взаимодействия
            </h3>
          </div>
          <span className="rounded-full border border-black/10 bg-stone-50 px-4 py-2 text-sm text-stone-600">
            {interactions.length} показано
          </span>
        </div>
        <div className="grid gap-4">
          {interactions.map((interaction) => (
            <article
              className="rounded-[1.5rem] border border-black/10 bg-stone-50/80 p-4"
              key={interaction.conversationId}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {interaction.botName} / {interaction.botSlug}
                  </p>
                  <h4 className="mt-1 text-xl font-medium">
                    Диалог #{interaction.conversationId}
                  </h4>
                </div>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  {interaction.lastMessageAt ?? "Нет активности"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 font-mono text-xs text-stone-500">
                <span>чат:{interaction.chatId}</span>
                <span>пользователь:{interaction.userId}</span>
                <span>роль:{formatMessageRole(interaction.lastMessageRole)}</span>
              </div>
              <p className="mt-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6">
                {interaction.lastMessageText ?? "Сообщений пока нет"}
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Сжатый контекст: {interaction.summaryContext || "Пусто"}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
