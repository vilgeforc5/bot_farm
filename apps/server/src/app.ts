import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env, type ServerEnv } from "./config/env";
import { store, type DatabaseAdapter } from "./db/store";
import { createApiRoutes } from "./routes/api";
import { createWebhooksRoutes } from "./routes/webhooks";

export const createApp = ({
  environment,
  database
}: {
  environment: ServerEnv;
  database: DatabaseAdapter;
}) => {
  const app = new Hono();

  app.use("*", logger());
  app.use(
    "/api/*",
    cors({
      origin: environment.DASHBOARD_ORIGIN,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "OPTIONS"]
    })
  );

  app.get("/", (c) =>
    c.json({
      name: "bot-farm-server",
      status: "ok",
      api: "/api",
      webhooks: "/webhooks"
    })
  );

  app.route("/api", createApiRoutes({ environment, database }));
  app.route("/webhooks", createWebhooksRoutes({ database }));

  return app;
};

export const app = createApp({
  environment: env,
  database: store
});
