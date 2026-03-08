import "reflect-metadata";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { DataSource, EntitySchema } from "typeorm";
import { getCountryByCode } from "../services/countries";
import { createSecretCodec } from "../services/secrets";
import type {
  BotInlineButton,
  BotRecord,
  BotStats,
  BotStatus,
  BotUsersPage,
  ConversationRecord,
  DashboardSummary,
  InteractionRecord,
  MessageRecord,
  MessageRole,
  UsageRecord
} from "../domain/types";
import type { LocaleMessagesOverrides, SupportedLocale } from "../services/locales";

export interface SaveBotInput {
  id?: number;
  slug: string;
  name: string;
  description: string;
  defaultCountryCode: string;
  defaultLocale: string;
  telegramBotToken: string;
  telegramSecretToken?: string;
  status: BotStatus;
  strategyKey: BotRecord["strategyKey"];
  llmProvider: BotRecord["llmProvider"];
  llmModel: string;
  fallbackModels: string[];
  contextLimit: number;
  systemPrompt: string;
  helpMessage: string;
  buttons: BotInlineButton[];
  localeMessages: LocaleMessagesOverrides;
}

export interface DatabaseStatus {
  adapter: string;
  connected: boolean;
  databasePath: string;
}

export interface DatabaseAdapter {
  listBots(): Promise<BotRecord[]>;
  getBotById(id: number): Promise<BotRecord | null>;
  getBotBySlug(slug: string): Promise<BotRecord | null>;
  saveBot(input: SaveBotInput): Promise<BotRecord>;
  deleteBot(id: number): Promise<void>;
  setBotStatus(id: number, status: BotStatus): Promise<void>;
  getOrCreateConversation(botId: number, chatId: string, userId: string): Promise<ConversationRecord>;
  getConversationById(id: number): Promise<ConversationRecord | null>;
  updateConversationSummary(conversationId: number, summaryContext: string): Promise<void>;
  updateConversationCountry(conversationId: number, countryCode: string, countryName: string): Promise<void>;
  clearConversation(botId: number, chatId: string, userId: string): Promise<void>;
  addMessage(conversationId: number, role: MessageRole, text: string, telegramMessageId?: string): Promise<MessageRecord>;
  getMessageById(id: number): Promise<MessageRecord | null>;
  getMessageByTelegramMessageId(conversationId: number, telegramMessageId: string): Promise<MessageRecord | null>;
  updateMessageText(id: number, text: string): Promise<void>;
  listRecentMessages(conversationId: number, limit?: number): Promise<MessageRecord[]>;
  listMessagesBefore(conversationId: number, beforeMessageId: number, limit?: number): Promise<MessageRecord[]>;
  addUsage(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord>;
  getBotStats(botId: number): Promise<BotStats>;
  getDashboardSummary(): Promise<DashboardSummary>;
  listRecentInteractions(limit?: number): Promise<InteractionRecord[]>;
  listBotUsers(botId: number, page: number, pageSize: number): Promise<BotUsersPage>;
  getStatus(): Promise<DatabaseStatus>;
  close(): Promise<void>;
}

interface BotRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  defaultCountryCode: string;
  defaultLocale: string;
  telegramBotToken: string;
  telegramSecretToken: string;
  status: BotStatus;
  strategyKey: BotRecord["strategyKey"];
  llmProvider: BotRecord["llmProvider"];
  llmModel: string;
  fallbackModels: string;
  contextLimit: number;
  systemPrompt: string;
  helpMessage: string;
  buttonsJson: string;
  localeMessagesJson: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationRow {
  id: number;
  botId: number;
  chatId: string;
  userId: string;
  summaryContext: string;
  countryCode: string;
  countryName: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageRow {
  id: number;
  conversationId: number;
  role: MessageRole;
  text: string;
  telegramMessageId: string | null;
  createdAt: string;
}

interface UsageRow {
  id: number;
  botId: number;
  conversationId: number | null;
  provider: string;
  model: string;
  promptChars: number;
  completionChars: number;
  totalChars: number;
  rawResponse: string;
  createdAt: string;
}

const BotSchema = new EntitySchema<BotRow>({
  name: "Bot",
  tableName: "bots",
  columns: {
    id: { type: Number, primary: true, generated: true },
    slug: { type: String, unique: true },
    name: { type: String },
    description: { type: String, default: "" },
    defaultCountryCode: { name: "default_country_code", type: String, default: "RU" },
    defaultLocale: { name: "default_locale", type: String, default: "" },
    telegramBotToken: { name: "telegram_bot_token", type: String },
    telegramSecretToken: { name: "telegram_secret_token", type: String },
    status: { type: String },
    strategyKey: { name: "strategy_key", type: String },
    llmProvider: { name: "llm_provider", type: String },
    llmModel: { name: "llm_model", type: String },
    fallbackModels: { name: "fallback_models", type: String, default: "[]" },
    contextLimit: { name: "context_limit", type: Number, default: 300 },
    systemPrompt: { name: "system_prompt", type: String, default: "" },
    helpMessage: { name: "help_message", type: String, default: "" },
    buttonsJson: { name: "buttons_json", type: String, default: "[]" },
    localeMessagesJson: { name: "locale_messages_json", type: String, default: "{}" },
    createdAt: { name: "created_at", type: String },
    updatedAt: { name: "updated_at", type: String }
  }
});

const ConversationSchema = new EntitySchema<ConversationRow>({
  name: "Conversation",
  tableName: "conversations",
  uniques: [
    {
      name: "uq_conversations_bot_chat_user",
      columns: ["botId", "chatId", "userId"]
    }
  ],
  columns: {
    id: { type: Number, primary: true, generated: true },
    botId: { name: "bot_id", type: Number },
    chatId: { name: "chat_id", type: String },
    userId: { name: "user_id", type: String },
    summaryContext: { name: "summary_context", type: String, default: "" },
    countryCode: { name: "country_code", type: String, default: "RU" },
    countryName: { name: "country_name", type: String, default: "Россия" },
    createdAt: { name: "created_at", type: String },
    updatedAt: { name: "updated_at", type: String }
  }
});

const MessageSchema = new EntitySchema<MessageRow>({
  name: "Message",
  tableName: "messages",
  columns: {
    id: { type: Number, primary: true, generated: true },
    conversationId: { name: "conversation_id", type: Number },
    role: { type: String },
    text: { type: String },
    telegramMessageId: { name: "telegram_message_id", type: String, nullable: true },
    createdAt: { name: "created_at", type: String }
  }
});

const UsageSchema = new EntitySchema<UsageRow>({
  name: "UsageEvent",
  tableName: "usage_events",
  columns: {
    id: { type: Number, primary: true, generated: true },
    botId: { name: "bot_id", type: Number },
    conversationId: { name: "conversation_id", type: Number, nullable: true },
    provider: { type: String },
    model: { type: String },
    promptChars: { name: "prompt_chars", type: Number },
    completionChars: { name: "completion_chars", type: Number },
    totalChars: { name: "total_chars", type: Number },
    rawResponse: { name: "raw_response", type: String, default: "" },
    createdAt: { name: "created_at", type: String }
  }
});

const mapBot = (row: BotRow, decryptSecret: (value: string) => string): BotRecord => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  defaultCountryCode: row.defaultCountryCode,
  defaultLocale: (row.defaultLocale ?? "") as SupportedLocale | "",
  telegramBotToken: decryptSecret(row.telegramBotToken),
  telegramSecretToken: decryptSecret(row.telegramSecretToken),
  status: row.status,
  strategyKey: row.strategyKey,
  llmProvider: row.llmProvider,
  llmModel: row.llmModel,
  fallbackModels: JSON.parse(row.fallbackModels) as string[],
  contextLimit: row.contextLimit,
  systemPrompt: row.systemPrompt,
  helpMessage: row.helpMessage,
  buttons: JSON.parse(row.buttonsJson) as BotInlineButton[],
  localeMessages: JSON.parse(row.localeMessagesJson ?? "{}") as LocaleMessagesOverrides,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const mapConversation = (row: ConversationRow): ConversationRecord => ({
  id: row.id,
  botId: row.botId,
  chatId: row.chatId,
  userId: row.userId,
  summaryContext: row.summaryContext,
  countryCode: row.countryCode,
  countryName: row.countryName,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const mapMessage = (row: MessageRow): MessageRecord => ({
  id: row.id,
  conversationId: row.conversationId,
  role: row.role,
  text: row.text,
  telegramMessageId: row.telegramMessageId,
  createdAt: row.createdAt
});

const mapUsage = (row: UsageRow): UsageRecord => ({
  id: row.id,
  botId: row.botId,
  conversationId: row.conversationId,
  provider: row.provider,
  model: row.model,
  promptChars: row.promptChars,
  completionChars: row.completionChars,
  totalChars: row.totalChars,
  rawResponse: row.rawResponse,
  createdAt: row.createdAt
});

export const createTypeOrmDatabaseAdapter = ({
  adapterName,
  dbPath,
  secretEncryptionKey
}: {
  adapterName: string;
  dbPath: string;
  secretEncryptionKey: string;
}): DatabaseAdapter => {
  const { encryptSecret, decryptSecret } = createSecretCodec(secretEncryptionKey);

  mkdirSync(dirname(dbPath), { recursive: true });

  const createDataSource = () =>
    new DataSource({
      type: "sqljs",
      location: dbPath,
      entities: [BotSchema, ConversationSchema, MessageSchema, UsageSchema],
      synchronize: true,
      logging: false
    });

  let operationQueue = Promise.resolve();

  const runSerialized = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = operationQueue.then(operation, operation);
    operationQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };

  const withDataSource = <T>(
    operation: (dataSource: DataSource) => Promise<T>,
    options?: { persist?: boolean }
  ): Promise<T> =>
    runSerialized(async () => {
      const dataSource = createDataSource();
      await dataSource.initialize();

      try {
        const result = await operation(dataSource);
        if (options?.persist) {
          const driver = dataSource.driver as { save?: () => Promise<void> };
          await driver.save?.();
        }
        return result;
      } finally {
        if (dataSource.isInitialized) {
          await dataSource.destroy();
        }
      }
    });

  return {
    async listBots() {
      return withDataSource(async (dataSource) => {
        const rows = await dataSource.getRepository(BotSchema).find({
          order: { createdAt: "DESC" }
        });
        return rows.map((row) => mapBot(row, decryptSecret));
      });
    },

    async getBotById(id) {
      return withDataSource(async (dataSource) => {
        const row = await dataSource.getRepository(BotSchema).findOneBy({ id });
        return row ? mapBot(row, decryptSecret) : null;
      });
    },

    async getBotBySlug(slug) {
      return withDataSource(async (dataSource) => {
        const row = await dataSource.getRepository(BotSchema).findOneBy({ slug });
        return row ? mapBot(row, decryptSecret) : null;
      });
    },

    async saveBot(input) {
      return withDataSource(
        async (dataSource) => {
          const repository = dataSource.getRepository(BotSchema);
          const now = new Date().toISOString();
          const secretToken = input.telegramSecretToken?.trim() || randomUUID();
          const payload: Omit<BotRow, "id" | "createdAt"> &
            Partial<Pick<BotRow, "createdAt">> = {
            slug: input.slug,
            name: input.name,
            description: input.description,
            defaultCountryCode: input.defaultCountryCode,
            defaultLocale: input.defaultLocale,
            telegramBotToken: encryptSecret(input.telegramBotToken),
            telegramSecretToken: encryptSecret(secretToken),
            status: input.status,
            strategyKey: input.strategyKey,
            llmProvider: input.llmProvider,
            llmModel: input.llmModel,
            fallbackModels: JSON.stringify(input.fallbackModels),
            contextLimit: input.contextLimit,
            systemPrompt: input.systemPrompt,
            helpMessage: input.helpMessage,
            buttonsJson: JSON.stringify(input.buttons),
            localeMessagesJson: JSON.stringify(input.localeMessages),
            updatedAt: now
          };

          if (input.id) {
            await repository.update({ id: input.id }, payload);
            const row = await repository.findOneByOrFail({ id: input.id });
            return mapBot(row, decryptSecret);
          }

          const created = await repository.save(
            repository.create({
              ...payload,
              createdAt: now
            })
          );
          return mapBot(created, decryptSecret);
        },
        { persist: true }
      );
    },

    async setBotStatus(id, status) {
      return withDataSource(
        async (dataSource) => {
          await dataSource.getRepository(BotSchema).update(
            { id },
            { status, updatedAt: new Date().toISOString() }
          );
        },
        { persist: true }
      );
    },

    async deleteBot(id) {
      return withDataSource(
        async (dataSource) => {
          await dataSource.getRepository(BotSchema).delete({ id });
        },
        { persist: true }
      );
    },

    async getOrCreateConversation(botId, chatId, userId) {
      return withDataSource(
        async (dataSource) => {
          const botRepository = dataSource.getRepository(BotSchema);
          const repository = dataSource.getRepository(ConversationSchema);
          const existing = await repository.findOneBy({ botId, chatId, userId });
          if (existing) {
            return mapConversation(existing);
          }

          const bot = await botRepository.findOneByOrFail({ id: botId });

          const now = new Date().toISOString();
          const defaultCountry = getCountryByCode(bot.defaultCountryCode);
          const created = await repository.save(
            repository.create({
              botId,
              chatId,
              userId,
              summaryContext: "",
              countryCode: defaultCountry.code,
              countryName: defaultCountry.nativeName,
              createdAt: now,
              updatedAt: now
            })
          );
          return mapConversation(created);
        },
        { persist: true }
      );
    },

    async getConversationById(id) {
      return withDataSource(async (dataSource) => {
        const row = await dataSource.getRepository(ConversationSchema).findOneBy({ id });
        return row ? mapConversation(row) : null;
      });
    },

    async updateConversationSummary(conversationId, summaryContext) {
      return withDataSource(
        async (dataSource) => {
          await dataSource.getRepository(ConversationSchema).update(
            { id: conversationId },
            { summaryContext, updatedAt: new Date().toISOString() }
          );
        },
        { persist: true }
      );
    },

    async updateConversationCountry(conversationId, countryCode, countryName) {
      return withDataSource(
        async (dataSource) => {
          await dataSource.getRepository(ConversationSchema).update(
            { id: conversationId },
            { countryCode, countryName, updatedAt: new Date().toISOString() }
          );
        },
        { persist: true }
      );
    },

    async clearConversation(botId, chatId, userId) {
      return withDataSource(
        async (dataSource) => {
          const conversationRepository = dataSource.getRepository(ConversationSchema);
          const messageRepository = dataSource.getRepository(MessageSchema);
          const conversation = await conversationRepository.findOneBy({ botId, chatId, userId });
          if (!conversation) {
            return;
          }

          await messageRepository.delete({ conversationId: conversation.id });
          await conversationRepository.update(
            { id: conversation.id },
            { summaryContext: "", updatedAt: new Date().toISOString() }
          );
        },
        { persist: true }
      );
    },

    async addMessage(conversationId, role, text, telegramMessageId) {
      return withDataSource(
        async (dataSource) => {
          const created = await dataSource.getRepository(MessageSchema).save(
            dataSource.getRepository(MessageSchema).create({
              conversationId,
              role,
              text,
              telegramMessageId: telegramMessageId ?? null,
              createdAt: new Date().toISOString()
            })
          );
          return mapMessage(created);
        },
        { persist: true }
      );
    },

    async getMessageById(id) {
      return withDataSource(async (dataSource) => {
        const row = await dataSource.getRepository(MessageSchema).findOneBy({ id });
        return row ? mapMessage(row) : null;
      });
    },

    async getMessageByTelegramMessageId(conversationId, telegramMessageId) {
      return withDataSource(async (dataSource) => {
        const row = await dataSource.getRepository(MessageSchema).findOneBy({
          conversationId,
          telegramMessageId
        });
        return row ? mapMessage(row) : null;
      });
    },

    async updateMessageText(id, text) {
      return withDataSource(
        async (dataSource) => {
          await dataSource.getRepository(MessageSchema).update(
            { id },
            { text, createdAt: new Date().toISOString() }
          );
        },
        { persist: true }
      );
    },

    async listRecentMessages(conversationId, limit = 12) {
      return withDataSource(async (dataSource) => {
        const rows = await dataSource.getRepository(MessageSchema).find({
          where: { conversationId },
          order: { id: "DESC" },
          take: limit
        });
        return rows.reverse().map(mapMessage);
      });
    },

    async listMessagesBefore(conversationId, beforeMessageId, limit = 12) {
      return withDataSource(async (dataSource) => {
        const rows = await dataSource
          .getRepository(MessageSchema)
          .createQueryBuilder("message")
          .where("message.conversation_id = :conversationId", { conversationId })
          .andWhere("message.id < :beforeMessageId", { beforeMessageId })
          .orderBy("message.id", "DESC")
          .limit(limit)
          .getMany();

        return rows.reverse().map(mapMessage);
      });
    },

    async addUsage(record) {
      return withDataSource(
        async (dataSource) => {
          const created = await dataSource.getRepository(UsageSchema).save(
            dataSource.getRepository(UsageSchema).create({
              ...record,
              createdAt: new Date().toISOString()
            })
          );
          return mapUsage(created);
        },
        { persist: true }
      );
    },

    async getBotStats(botId) {
      return withDataSource(async (dataSource) => {
        const rows = (await dataSource.query(
          `
            SELECT
              b.id AS bot_id,
              (
                SELECT COUNT(*)
                FROM conversations c
                WHERE c.bot_id = b.id
              ) AS total_conversations,
              (
                SELECT COUNT(*)
                FROM messages m
                INNER JOIN conversations c ON c.id = m.conversation_id
                WHERE c.bot_id = b.id
              ) AS total_messages,
              COALESCE(
                (
                  SELECT SUM(u.total_chars)
                  FROM usage_events u
                  WHERE u.bot_id = b.id
                ),
                0
              ) AS total_usage_chars,
              (
                SELECT MAX(m.created_at)
                FROM messages m
                INNER JOIN conversations c ON c.id = m.conversation_id
                WHERE c.bot_id = b.id
              ) AS last_message_at,
              (
                SELECT MAX(c.updated_at)
                FROM conversations c
                WHERE c.bot_id = b.id
              ) AS last_conversation_at
            FROM bots b
            WHERE b.id = ?
          `,
          [botId]
        )) as Array<Record<string, number | string | null>>;
        const row = rows[0];
        const lastMessageAt = row?.last_message_at ? String(row.last_message_at) : null;
        const lastConversationAt = row?.last_conversation_at
          ? String(row.last_conversation_at)
          : null;

        return {
          botId,
          totalConversations: Number(row?.total_conversations ?? 0),
          totalMessages: Number(row?.total_messages ?? 0),
          totalUsageChars: Number(row?.total_usage_chars ?? 0),
          lastInteractionAt:
            !lastMessageAt || (lastConversationAt && lastConversationAt > lastMessageAt)
              ? lastConversationAt
              : lastMessageAt
        };
      });
    },

    async getDashboardSummary() {
      return withDataSource(async (dataSource) => {
        const rows = (await dataSource.query(
          `
            SELECT
              COUNT(*) AS total_bots,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_bots,
              (SELECT COUNT(*) FROM conversations) AS total_conversations,
              (SELECT COUNT(*) FROM messages) AS total_messages,
              (
                SELECT COUNT(DISTINCT user_id)
                FROM conversations
              ) AS total_unique_users
            FROM bots
          `
        )) as Array<Record<string, number | null>>;
        const row = rows[0];

        return {
          totalBots: Number(row?.total_bots ?? 0),
          activeBots: Number(row?.active_bots ?? 0),
          totalConversations: Number(row?.total_conversations ?? 0),
          totalMessages: Number(row?.total_messages ?? 0),
          totalUniqueUsers: Number(row?.total_unique_users ?? 0)
        };
      });
    },

    async listRecentInteractions(limit = 20) {
      return withDataSource(async (dataSource) => {
        const rows = (await dataSource.query(
          `
            SELECT
              c.id AS conversation_id,
              b.id AS bot_id,
              b.name AS bot_name,
              b.slug AS bot_slug,
              c.chat_id,
              c.user_id,
              c.summary_context,
              m.role AS last_message_role,
              m.text AS last_message_text,
              m.created_at AS last_message_at
            FROM conversations c
            INNER JOIN bots b ON b.id = c.bot_id
            LEFT JOIN messages m ON m.id = (
              SELECT id
              FROM messages
              WHERE conversation_id = c.id
              ORDER BY id DESC
              LIMIT 1
            )
            ORDER BY COALESCE(m.created_at, c.updated_at) DESC
            LIMIT ?
          `,
          [limit]
        )) as Array<Record<string, string | number | null>>;

        return rows.map((row) => ({
          conversationId: Number(row.conversation_id),
          botId: Number(row.bot_id),
          botName: String(row.bot_name),
          botSlug: String(row.bot_slug),
          chatId: String(row.chat_id),
          userId: String(row.user_id),
          summaryContext: String(row.summary_context),
          lastMessageRole: row.last_message_role ? (row.last_message_role as MessageRole) : null,
          lastMessageText: row.last_message_text ? String(row.last_message_text) : null,
          lastMessageAt: row.last_message_at ? String(row.last_message_at) : null
        }));
      });
    },

    async listBotUsers(botId, page, pageSize) {
      return withDataSource(async (dataSource) => {
        const offset = (page - 1) * pageSize;
        const rows = (await dataSource.query(
          `
            SELECT
              c.id AS conversation_id,
              c.chat_id,
              c.user_id,
              c.country_code,
              c.country_name,
              c.updated_at,
              m.text AS last_message_text,
              m.created_at AS last_message_at,
              COALESCE(SUM(u.total_chars), 0) AS total_chars,
              GROUP_CONCAT(DISTINCT u.model) AS models_used
            FROM conversations c
            LEFT JOIN messages m ON m.id = (
              SELECT id FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1
            )
            LEFT JOIN usage_events u ON u.conversation_id = c.id
            WHERE c.bot_id = ?
            GROUP BY c.id
            ORDER BY COALESCE(m.created_at, c.updated_at) DESC
            LIMIT ? OFFSET ?
          `,
          [botId, pageSize, offset]
        )) as Array<Record<string, string | number | null>>;

        const countRows = (await dataSource.query(
          `SELECT COUNT(*) AS total FROM conversations WHERE bot_id = ?`,
          [botId]
        )) as Array<Record<string, number>>;

        return {
          items: rows.map((row) => ({
            conversationId: Number(row.conversation_id),
            chatId: String(row.chat_id),
            userId: String(row.user_id),
            countryCode: String(row.country_code),
            countryName: String(row.country_name),
            totalChars: Number(row.total_chars),
            modelsUsed: row.models_used ? String(row.models_used).split(",") : [],
            lastMessageText: row.last_message_text ? String(row.last_message_text) : null,
            lastMessageAt: row.last_message_at ? String(row.last_message_at) : null,
            updatedAt: String(row.updated_at)
          })),
          total: Number(countRows[0]?.total ?? 0),
          page,
          pageSize
        };
      });
    },

    async getStatus() {
      return {
        adapter: adapterName,
        connected: true,
        databasePath: dbPath
      };
    },

    async close() {}
  };
};
