import { env } from "../config/env";
import { createTypeOrmDatabaseAdapter } from "./typeorm-adapter";

export const store = createTypeOrmDatabaseAdapter({
  adapterName: env.DB_ADAPTER,
  dbPath: env.DB_PATH,
  secretEncryptionKey: env.SECRET_ENCRYPTION_KEY
});

export type { DatabaseAdapter, DatabaseStatus, SaveBotInput } from "./typeorm-adapter";
