import { Card, CardContent } from "../ui/card";

export function DashboardHero({
  serverUrl,
}: {
  serverUrl: string;
}) {
  return (
    <Card className="mb-8">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500">
              Операционный контур
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Bot Swarm
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Единая панель для аналитики/редактирования ботов, статистики,
              диалогов и управления интеграцией с Telegram.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-black/10 bg-stone-900 px-5 py-4 text-stone-50">
            <p className="text-xs uppercase tracking-[0.24em] text-stone-300">
              Сервер
            </p>
            <p className="mt-1 text-sm">{serverUrl}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
