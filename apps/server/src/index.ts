import { env } from "./config/env";
import { app } from "./app";

export default {
  port: env.APP_PORT,
  fetch: app.fetch
};
