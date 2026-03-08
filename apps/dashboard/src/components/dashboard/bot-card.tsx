import { Link } from "@tanstack/react-router";
import type {
  BotRecord,
  CountryOption,
  LocaleInfo,
  OpenRouterModelOption,
} from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { BotDraft } from "./bot-draft";
import { formatBotStatus } from "./bot-draft";
import { BotEditor } from "./bot-editor";
import { MetricTile } from "./metric-card";

interface BotCardProps {
  availableModels: OpenRouterModelOption[];
  availableCountries: CountryOption[];
  availableLocales: LocaleInfo[];
  bot: BotRecord;
  draft: BotDraft;
  onChange: (draft: BotDraft) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onRemove: () => void;
  onSave: () => void;
  onToggle: () => void;
  saveLabel: string;
}

export function BotCard({
  availableModels,
  availableCountries,
  availableLocales,
  bot,
  draft,
  onChange,
  onConnect,
  onDisconnect,
  onRemove,
  onSave,
  onToggle,
  saveLabel,
}: BotCardProps) {
  const handleRemove = () => {
    if (
      window.confirm(
        `Удалить бота «${bot.name}»? Пользователи и их история сохранятся в базе данных.`,
      )
    ) {
      onRemove();
    }
  };
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Профиль бота
            </p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight">
              {bot.name}
            </h3>
            <p className="mt-2 text-sm text-stone-500">/{bot.slug}</p>
          </div>
          <Badge variant={bot.status === "active" ? "success" : "warning"}>
            {formatBotStatus(bot.status)}
          </Badge>
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
          Telegram token: {bot.telegramBotTokenPreview}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricTile label="Диалоги" value={bot.stats.totalConversations} />
          <MetricTile label="Сообщения" value={bot.stats.totalMessages} />
          <MetricTile label="Символы usage" value={bot.stats.totalUsageChars} />
          <MetricTile
            label="Последняя активность"
            small
            value={bot.stats.lastInteractionAt ?? "Никогда"}
          />
        </div>

        <BotEditor
          availableCountries={availableCountries}
          availableLocales={availableLocales}
          availableModels={availableModels}
          draft={draft}
          onChange={onChange}
          onSubmit={onSave}
          submitLabel={saveLabel}
          showTelegramTokenField={false}
        />

        <div className="flex flex-wrap gap-3">
          <Button onClick={onToggle} type="button" variant="secondary">
            {bot.status === "active" ? "Поставить на паузу" : "Активировать"}
          </Button>
          <Button onClick={onConnect} type="button" variant="outline">
            Подключить webhook
          </Button>
          <Button onClick={onDisconnect} type="button" variant="outline">
            Отключить webhook
          </Button>
          <Button type="button" variant="outline">
            <Link to="/bots/$botId/locales" params={{ botId: String(bot.id) }}>
              Системные сообщения
            </Link>
          </Button>
          <Button type="button" variant="outline">
            <Link to="/bots/$botId/users" params={{ botId: String(bot.id) }}>
              Пользователи
            </Link>
          </Button>
          <Button onClick={handleRemove} type="button" variant="destructive">
            Удалить бота
          </Button>
        </div>
      </div>
    </section>
  );
}
