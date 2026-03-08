import type {
  BotRecord,
  CountryOption,
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
  bot: BotRecord;
  draft: BotDraft;
  onChange: (draft: BotDraft) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSave: () => void;
  onToggle: () => void;
  saveLabel: string;
}

export function BotCard({
  availableModels,
  availableCountries,
  bot,
  draft,
  onChange,
  onConnect,
  onDisconnect,
  onSave,
  onToggle,
  saveLabel,
}: BotCardProps) {
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
        </div>
      </div>
    </section>
  );
}
