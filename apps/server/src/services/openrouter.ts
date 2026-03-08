import { env } from "../config/env";
import type { BotRecord } from "../domain/types";

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface CompletionResult {
  provider: "openrouter";
  model: string;
  text: string;
  promptChars: number;
  completionChars: number;
  rawResponse: string;
}

const getCandidates = (bot: BotRecord): string[] => {
  const candidates = [bot.llmModel, ...bot.fallbackModels, env.DEFAULT_OPENROUTER_MODEL];
  return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))];
};

export const completeWithOpenRouter = async (bot: BotRecord, prompt: string): Promise<CompletionResult> => {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing");
  }

  const promptChars = prompt.length;
  const candidates = getCandidates(bot);
  let lastError: unknown = null;

  for (const model of candidates) {
    try {
      const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": env.APP_BASE_URL,
          "X-Title": "telegram-bot-farm"
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        lastError = new Error(`OpenRouter request failed for ${model}: ${response.status}`);
        continue;
      }

      const payload = (await response.json()) as OpenRouterResponse;
      const text = payload.choices?.[0]?.message?.content?.trim();
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
        rawResponse: JSON.stringify(payload)
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("OpenRouter completion failed");
};
