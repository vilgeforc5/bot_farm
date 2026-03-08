import { useMemo, useState } from "react";
import type { OpenRouterModelOption } from "../../lib/api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { formatContextLength, formatModelOption, formatModelPrice } from "./bot-draft";

interface ModelFallbackPickerProps {
  availableModels: OpenRouterModelOption[];
  fallbackModels: string[];
  onChange: (value: string[]) => void;
}

export function ModelFallbackPicker({
  availableModels,
  fallbackModels,
  onChange
}: ModelFallbackPickerProps) {
  const selectableModels = useMemo(
    () => availableModels.filter((model) => !fallbackModels.includes(model.id)),
    [availableModels, fallbackModels]
  );
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  const addFallback = () => {
    if (!selectedModelId) {
      return;
    }

    onChange([...fallbackModels, selectedModelId]);
    setSelectedModelId("");
  };

  return (
    <div className="grid gap-3">
      <Label>Резервные модели</Label>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <Select onValueChange={setSelectedModelId} value={selectedModelId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите модель для fallback" />
          </SelectTrigger>
          <SelectContent>
            {selectableModels.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {formatModelOption(model)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="rounded-2xl" onClick={addFallback} type="button" variant="secondary">
          Добавить fallback
        </Button>
      </div>
      {fallbackModels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {fallbackModels.map((modelId) => {
            const model = availableModels.find((item) => item.id === modelId);

            return (
              <div
                className="flex items-center gap-2 rounded-2xl border border-black/10 bg-stone-50 px-3 py-2"
                key={modelId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-800">
                    {model?.name ?? modelId}
                  </p>
                  <p className="text-xs text-stone-500">
                    {model
                      ? `${formatModelPrice(model)} • ${formatContextLength(model.contextLength)}`
                      : modelId}
                  </p>
                </div>
                {model ? (
                  <Badge variant="muted">
                    {model.category === "popular_free" ? "popular free" : "cheap"}
                  </Badge>
                ) : null}
                <Button
                  className="rounded-full px-3 py-1"
                  onClick={() => onChange(fallbackModels.filter((value) => value !== modelId))}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Убрать
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-stone-500">Резервные модели не выбраны.</p>
      )}
    </div>
  );
}
