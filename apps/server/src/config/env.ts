import { resolve } from "node:path";
import { ZodError, z } from "zod";

const requiredString = (name: string) =>
  z
    .string({
      required_error: `${name} is required`,
    })
    .trim()
    .min(1, `${name} is required`);

const envSchema = z.object({
  APP_PORT: z.coerce.number().int().positive(),
  APP_BASE_URL: requiredString("APP_BASE_URL").url(),
  DB_ADAPTER: z.literal("typeorm"),
  DB_PATH: requiredString("DB_PATH").transform((value) => resolve(value)),
  OPENROUTER_API_KEY: requiredString("OPENROUTER_API_KEY"),
  OPENROUTER_BASE_URL: requiredString("OPENROUTER_BASE_URL").url(),
  DEFAULT_OPENROUTER_MODEL: requiredString("DEFAULT_OPENROUTER_MODEL"),
  DEFAULT_CONTEXT_LIMIT: z.coerce.number().int().min(120).max(600),
  DEV_LONG_POLLING: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
  TELEGRAM_POLL_TIMEOUT_SECONDS: z.coerce.number().int().min(1).max(50),
  SECRET_ENCRYPTION_KEY: requiredString("SECRET_ENCRYPTION_KEY").min(8),
  DASHBOARD_ORIGIN: requiredString("DASHBOARD_ORIGIN").url(),
  ADMIN_USERNAME: requiredString("ADMIN_USERNAME"),
  ADMIN_PASSWORD: requiredString("ADMIN_PASSWORD").min(8),
});

export type ServerEnv = z.infer<typeof envSchema>;

export const parseServerEnv = (
  input: Record<string, string | undefined>,
): ServerEnv => {
  try {
    return envSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Invalid server environment:\n${details}`);
    }

    throw error;
  }
};

let cachedEnv: ServerEnv | null = null;

export const getEnv = (): ServerEnv => {
  if (!cachedEnv) {
    cachedEnv = parseServerEnv(
      process.env as Record<string, string | undefined>,
    );
  }

  return cachedEnv;
};

export const env = new Proxy({} as ServerEnv, {
  get(_target, property) {
    return getEnv()[property as keyof ServerEnv];
  },
});
