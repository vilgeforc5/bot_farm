import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const validEnv = {
  APP_PORT: "3001",
  APP_BASE_URL: "http://localhost:3001",
  DB_ADAPTER: "typeorm",
  DB_PATH: "./data/test.sqlite",
  OPENROUTER_API_KEY: "openrouter-key",
  OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
  DEFAULT_OPENROUTER_MODEL: "openrouter/auto",
  DEFAULT_CONTEXT_LIMIT: "300",
  DEV_LONG_POLLING: "false",
  TELEGRAM_POLL_TIMEOUT_SECONDS: "25",
  SECRET_ENCRYPTION_KEY: "test-secret-key",
  DASHBOARD_ORIGIN: "http://localhost:3000",
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "super-secret"
};

describe("parseServerEnv", () => {
  it("parses a complete env payload", () => {
    expect(parseServerEnv(validEnv)).toEqual({
      APP_PORT: 3001,
      APP_BASE_URL: "http://localhost:3001",
      DB_ADAPTER: "typeorm",
      DB_PATH: "./data/test.sqlite",
      OPENROUTER_API_KEY: "openrouter-key",
      OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
      DEFAULT_OPENROUTER_MODEL: "openrouter/auto",
      DEFAULT_CONTEXT_LIMIT: 300,
      DEV_LONG_POLLING: false,
      TELEGRAM_POLL_TIMEOUT_SECONDS: 25,
      SECRET_ENCRYPTION_KEY: "test-secret-key",
      DASHBOARD_ORIGIN: "http://localhost:3000",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD: "super-secret"
    });
  });

  it("throws when a required env variable is missing", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        DB_PATH: undefined
      })
    ).toThrow("DB_PATH is required");
  });
});
