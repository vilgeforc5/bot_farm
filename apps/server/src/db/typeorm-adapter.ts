import "reflect-metadata";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { DataSource, EntitySchema } from "typeorm";
import { createSecretCodec } from "../services/secrets";
import type {
  BotInlineButton,
  BotRecord,
  BotStats,
  BotStatus,
  ConversationRecord,
  DashboardSummary,
  InteractionRecord,
  MessageRecord,
  MessageRole,
  UsageRecord
} from "../domain/types";

export interface SaveBotInput {
  id?: number;
  slug: string;
  name: string;
  description: string;
  telegramBotToken: string;
  telegramSecretToken?: string;
  status: BotStatus;
  strategyKey: BotRecord["strategyKey"];
  llmProvider: BotRecord["llmProvider"];
  llmModel: string;
  fallbackModels: string[];
  contextLimit: number;
  systemPrompt: string;
  buttons: BotInlineButton[];
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
  setBotStatus(id: number, status: BotStatus): Promise<void>;
  getOrCreateConversation(botId: number, chatId: string, userId: string): Promise<ConversationRecord>;
  getConversationById(id: number): Promise<ConversationRecord | null>;
  updateConversationSummary(conversationId: number, summaryContext: string): Promise<void>;
  clearConversation(botId: number, chatId: string, userId: string): Promise<void>;
  addMessage(conversationId: number, role: MessageRole, text: string, telegramMessageId?: string): Promise<MessageRecord>;
  getMessageById(id: number): Promise<MessageRecord | null>;
  listRecentMessages(conversationId: number, limit?: number): Promise<MessageRecord[]>;
  addUsage(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord>;
  getBotStats(botId: number): Promise<BotStats>;
  getDashboardSummary(): Promise<DashboardSummary>;
  listRecentInteractions(limit?: number): Promise<InteractionRecord[]>;
  getStatus(): Promise<DatabaseStatus>;
  close(): Promise<void>;
}

interface BotRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  telegramBotToken: string;
  telegramSecretToken: string;
  status: BotStatus;
  strategyKey: BotRecord["strategyKey"];
  llmProvider: BotRecord["llmProvider"];
  llmModel: string;
  fallbackModels: string;
  contextLimit: number;
  systemPrompt: string;
  buttonsJson: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationRow {
  id: number;
  botId: number;
  chatId: string;
  userId: string;
  summaryContext: string;
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
    telegramBotToken: { name: "telegram_bot_token", type: String },
    telegramSecretToken: { name: "telegram_secret_token", type: String },
    status: { type: String },
    strategyKey: { name: "strategy_key", type: String },
    llmProvider: { name: "llm_provider", type: String },
    llmModel: { name: "llm_model", type: String },
    fallbackModels: { name: "fallback_models", type: String, default: "[]" },
    contextLimit: { name: "context_limit", type: Number, default: 300 },
    systemPrompt: { name: "system_prompt", type: String, default: "" },
    buttonsJson: { name: "buttons_json", type: String, default: "[]" },
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
  telegramBotToken: decryptSecret(row.telegramBotToken),
  telegramSecretToken: decryptSecret(row.telegramSecretToken),
  status: row.status,
  strategyKey: row.strategyKey,
  llmProvider: row.llmProvider,
  llmModel: row.llmModel,
  fallbackModels: JSON.parse(row.fallbackModels) as string[],
  contextLimit: row.contextLimit,
  systemPrompt: row.systemPrompt,
  buttons: JSON.parse(row.buttonsJson) as BotInlineButton[],
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

const mapConversation = (row: ConversationRow): ConversationRecord => ({
  id: row.id,
  botId: row.botId,
  chatId: row.chatId,
  userId: row.userId,
  summaryContext: row.summaryContext,
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

  const dataSource = new DataSource({
    type: "sqljs",
    location: dbPath,
    autoSave: true,
    entities: [BotSchema, ConversationSchema, MessageSchema, UsageSchema],
    synchronize: true,
    logging: false
  });

  const dataSourcePromise = dataSource.initialize();

  const getDataSource = (): Promise<DataSource> => dataSourcePromise;

  return {
    async listBots() {
      const repository = (await getDataSource()).getRepository(BotSchema);
      const rows = await repository.find({ order: { createdAt: "DESC" } });
      return rows.map((row) => mapBot(row, decryptSecret));
    },

    async getBotById(id) {
      const repository = (await getDataSource()).getRepository(BotSchema);
      const row = await repository.findOneBy({ id });
      return row ? mapBot(row, decryptSecret) : null;
    },

    async getBotBySlug(slug) {
      const repository = (await getDataSource()).getRepository(BotSchema);
      const row = await repository.findOneBy({ slug });
      return row ? mapBot(row, decryptSecret) : null;
    },

    async saveBot(input) {
      const repository = (await getDataSource()).getRepository(BotSchema);
      const now = new Date().toISOString();
      const secretToken = input.telegramSecretToken?.trim() || randomUUID();
      const payload: Omit<BotRow, "id" | "createdAt"> & Partial<Pick<BotRow, "createdAt">> = {
        slug: input.slug,
        name: input.name,
        description: input.description,
        telegramBotToken: encryptSecret(input.telegramBotToken),
        telegramSecretToken: encryptSecret(secretToken),
        status: input.status,
        strategyKey: input.strategyKey,
        llmProvider: input.llmProvider,
        llmModel: input.llmModel,
        fallbackModels: JSON.stringify(input.fallbackModels),
        contextLimit: input.contextLimit,
        systemPrompt: input.systemPrompt,
        buttonsJson: JSON.stringify(input.buttons),
        updatedAt: now
      };

      if (input.id) {
        await repository.update({ id: input.id }, payload);
        return (await this.getBotById(input.id))!;
      }

      const created = await repository.save(
        repository.create({
          ...payload,
          createdAt: now
        })
      );
      return (await this.getBotById(created.id))!;
    },

    async setBotStatus(id, status) {
      const repository = (await getDataSource()).getRepository(BotSchema);
      await repository.update({ id }, { status, updatedAt: new Date().toISOString() });
    },

    async getOrCreateConversation(botId, chatId, userId) {
      const repository = (await getDataSource()).getRepository(ConversationSchema);
      const existing = await repository.findOneBy({ botId, chatId, userId });
      if (existing) {
        return mapConversation(existing);
      }

      const now = new Date().toISOString();
      const created = await repository.save(
        repository.create({
          botId,
          chatId,
          userId,
          summaryContext: "",
          createdAt: now,
          updatedAt: now
        })
      );
      return mapConversation(created);
    },

    async getConversationById(id) {
      const repository = (await getDataSource()).getRepository(ConversationSchema);
      const row = await repository.findOneBy({ id });
      return row ? mapConversation(row) : null;
    },

    async updateConversationSummary(conversationId, summaryContext) {
      const repository = (await getDataSource()).getRepository(ConversationSchema);
      await repository.update({ id: conversationId }, { summaryContext, updatedAt: new Date().toISOString() });
    },

    async clearConversation(botId, chatId, userId) {
      const dataSource = await getDataSource();
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

    async addMessage(conversationId, role, text, telegramMessageId) {
      const repository = (await getDataSource()).getRepository(MessageSchema);
      const created = await repository.save(
        repository.create({
          conversationId,
          role,
          text,
          telegramMessageId: telegramMessageId ?? null,
          createdAt: new Date().toISOString()
        })
      );
      return mapMessage(created);
    },

    async getMessageById(id) {
      const repository = (await getDataSource()).getRepository(MessageSchema);
      const row = await repository.findOneBy({ id });
      return row ? mapMessage(row) : null;
    },

    async listRecentMessages(conversationId, limit = 12) {
      const repository = (await getDataSource()).getRepository(MessageSchema);
      const rows = await repository.find({
        where: { conversationId },
        order: { id: "DESC" },
        take: limit
      });
      return rows.reverse().map(mapMessage);
    },

    async addUsage(record) {
      const repository = (await getDataSource()).getRepository(UsageSchema);
      const created = await repository.save(
        repository.create({
          ...record,
          createdAt: new Date().toISOString()
        })
      );
      return mapUsage(created);
    },

    async getBotStats(botId) {
      const dataSource = await getDataSource();
      const rows = (await dataSource.query(
        `
          SELECT
            b.id AS bot_id,
            COUNT(DISTINCT c.id) AS total_conversations,
            COUNT(DISTINCT m.id) AS total_messages,
            COALESCE(SUM(u.total_chars), 0) AS total_usage_chars,
            MAX(COALESCE(m.created_at, c.updated_at)) AS last_interaction_at
          FROM bots b
          LEFT JOIN conversations c ON c.bot_id = b.id
          LEFT JOIN messages m ON m.conversation_id = c.id
          LEFT JOIN usage_events u ON u.bot_id = b.id
          WHERE b.id = ?
          GROUP BY b.id
        `,
        [botId]
      )) as Array<Record<string, number | string | null>>;
      const row = rows[0];

      return {
        botId,
        totalConversations: Number(row?.total_conversations ?? 0),
        totalMessages: Number(row?.total_messages ?? 0),
        totalUsageChars: Number(row?.total_usage_chars ?? 0),
        lastInteractionAt: row?.last_interaction_at ? String(row.last_interaction_at) : null
      };
    },

    async getDashboardSummary() {
      const dataSource = await getDataSource();
      const rows = (await dataSource.query(
        `
          SELECT
            COUNT(*) AS total_bots,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_bots,
            (SELECT COUNT(*) FROM conversations) AS total_conversations,
            (SELECT COUNT(*) FROM messages) AS total_messages
          FROM bots
        `
      )) as Array<Record<string, number | null>>;
      const row = rows[0];

      return {
        totalBots: Number(row?.total_bots ?? 0),
        activeBots: Number(row?.active_bots ?? 0),
        totalConversations: Number(row?.total_conversations ?? 0),
        totalMessages: Number(row?.total_messages ?? 0)
      };
    },

    async listRecentInteractions(limit = 20) {
      const dataSource = await getDataSource();
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
    },

    async getStatus() {
      const initialized = await getDataSource();
      return {
        adapter: adapterName,
        connected: initialized.isInitialized,
        databasePath: dbPath
      };
    },

    async close() {
      const initialized = await getDataSource();
      if (initialized.isInitialized) {
        await initialized.destroy();
      }
    }
  };
};
