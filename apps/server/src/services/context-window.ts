import type { MessageRecord } from "../domain/types";

const normalize = (value: string): string => value.replace(/\s+/g, " ").trim();

export const buildReducedContext = (messages: MessageRecord[], limit: number): string => {
  const target = Math.max(120, limit);
  const entries = messages
    .map((message) => `${message.role}: ${normalize(message.text)}`)
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    return "";
  }

  let output = entries.at(-1)!;
  for (let index = entries.length - 2; index >= 0; index -= 1) {
    const candidate = `${entries[index]} | ${output}`;
    if (candidate.length > target) {
      break;
    }
    output = candidate;
  }

  if (output.length <= target) {
    return output;
  }

  return output.slice(-target);
};
