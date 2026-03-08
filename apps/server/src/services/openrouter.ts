import { OpenRouter } from "@openrouter/sdk";
import { env } from "../config/env";
import type { BotRecord, OpenRouterModelOption, OpenRouterModelsResponse } from "../domain/types";

export interface CompletionResult {
  provider: "openrouter";
  model: string;
  text: string;
  promptChars: number;
  completionChars: number;
  rawResponse: string;
}

let client: OpenRouter | null = null;

const getClient = () => {
  if (!client) {
    client = new OpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
      serverURL: env.OPENROUTER_BASE_URL,
      httpReferer: env.APP_BASE_URL,
      xTitle: "telegram-bot-farm"
    });
  }

  return client;
};

const getCandidates = (bot: BotRecord): string[] => {
  const candidates = [bot.llmModel, ...bot.fallbackModels, env.DEFAULT_OPENROUTER_MODEL];
  return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))];
};

const parsePrice = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const popularFreePriority = [
  "openrouter/free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-4b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it:free",
  "qwen/qwen3-coder:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free"
] as const;

const isTextCapable = (inputModalities: string[], outputModalities: string[]) =>
  inputModalities.includes("text") && outputModalities.includes("text");

const isPubliclySelectableModel = (modelId: string, totalPrice: number) =>
  !modelId.startsWith("openrouter/auto") &&
  !modelId.startsWith("openrouter/bodybuilder") &&
  totalPrice >= 0;

export const listOpenRouterModels = async (): Promise<OpenRouterModelsResponse> => {
  const response = await getClient().models.list();
  const allItems = response.data
    .filter((model) =>
      isTextCapable(
        model.architecture.inputModalities.map(String),
        model.architecture.outputModalities.map(String)
      )
    )
    .map<OpenRouterModelOption>((model) => {
      const promptPrice = parsePrice(model.pricing.prompt);
      const completionPrice = parsePrice(model.pricing.completion);
      const requestPrice = parsePrice(model.pricing.request);

      return {
        id: model.id,
        name: model.name,
        description: model.description ?? "",
        category: "cheap",
        promptPrice,
        completionPrice,
        requestPrice,
        contextLength: model.contextLength,
        isFree: promptPrice === 0 && completionPrice === 0 && requestPrice === 0
      };
    })
    .filter((model) =>
      isPubliclySelectableModel(model.id, model.promptPrice + model.completionPrice + model.requestPrice)
    )
    .sort((left, right) => {
      const leftTotal = left.promptPrice + left.completionPrice + left.requestPrice;
      const rightTotal = right.promptPrice + right.completionPrice + right.requestPrice;

      if (left.isFree !== right.isFree) {
        return left.isFree ? -1 : 1;
      }

      if (leftTotal !== rightTotal) {
        return leftTotal - rightTotal;
      }

      return left.name.localeCompare(right.name);
    });

  const byId = new Map(allItems.map((item) => [item.id, item]));
  const popularFree = popularFreePriority
    .map((id) => byId.get(id))
    .filter((item): item is OpenRouterModelOption => Boolean(item?.isFree))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      category: "popular_free" as const
    }));

  const selectedIds = new Set(popularFree.map((item) => item.id));
  const cheapest = allItems
    .filter((item) => !selectedIds.has(item.id) && !item.isFree)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      category: "cheap" as const
    }));

  const items = [...popularFree, ...cheapest];

  const preferredDefault =
    popularFree.find((model) => model.id === "openrouter/free")?.id ??
    items.find((model) => model.isFree)?.id ??
    env.DEFAULT_OPENROUTER_MODEL;

  return {
    defaultModel: preferredDefault,
    items
  };
};

const extractText = (content: unknown): string => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .flatMap((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return [];
      })
      .join("\n")
      .trim();
  }

  return "";
};

export const completeWithOpenRouter = async (bot: BotRecord, prompt: string): Promise<CompletionResult> => {
  const promptChars = prompt.length;
  const candidates = getCandidates(bot);
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const response = await getClient().chat.send({
        chatGenerationParams: {
          model,
          messages: [
            {
              role: "user" as const,
              content: prompt
            }
          ]
        }
      });
      const text = extractText(response.choices?.[0]?.message?.content);
      if (!text) {
        lastError = new Error(`OpenRouter returned empty content for ${model}`);
        continue;
      }

      return {
        provider: "openrouter",
        model,
        text,
        promptChars,
        completionChars: text.length,
        rawResponse: JSON.stringify(response)
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter completion failed");
};
