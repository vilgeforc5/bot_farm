export interface ErrorLogEntry {
  id: number;
  kind: string;
  message: string;
  context: Record<string, unknown>;
  occurredAt: string;
}

const MAX_ENTRIES = 500;

let nextId = 1;
const entries: ErrorLogEntry[] = [];

export const logError = (kind: string, message: string, context: Record<string, unknown> = {}): void => {
  console.error(kind, { ...context, error: message });

  if (entries.length >= MAX_ENTRIES) {
    entries.shift();
  }

  entries.push({
    id: nextId++,
    kind,
    message,
    context,
    occurredAt: new Date().toISOString()
  });
};

export const getErrorLog = (): ErrorLogEntry[] => [...entries].reverse();

export const clearErrorLog = (): void => {
  entries.length = 0;
};
