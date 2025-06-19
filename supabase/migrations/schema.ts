import { pgTable, index, unique, serial, text, varchar, integer, timestamp, real, jsonb, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const audioSegmentsCache = pgTable("audio_segments_cache", {
	id: serial().primaryKey().notNull(),
	textContent: text("text_content").notNull(),
	textHash: varchar("text_hash", { length: 64 }).notNull(),
	voiceId: varchar("voice_id", { length: 50 }).notNull(),
	voiceGender: varchar("voice_gender", { length: 10 }).notNull(),
	voiceStyle: varchar("voice_style", { length: 20 }).notNull(),
	audioUrl: text("audio_url").notNull(),
	audioDuration: integer("audio_duration"),
	fileSize: integer("file_size"),
	usageCount: integer("usage_count").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }).defaultNow(),
	embedding: text(),
	language: varchar({ length: 10 }).default('fr-FR'),
	similarityThreshold: real("similarity_threshold").default(0.92),
}, (table) => [
	index("idx_audio_segments_cache_language").using("btree", table.language.asc().nullsLast().op("text_ops")),
	index("idx_audio_segments_cache_last_used").using("btree", table.lastUsedAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_audio_segments_cache_text_hash").using("btree", table.textHash.asc().nullsLast().op("text_ops")),
	index("idx_audio_segments_cache_usage_count").using("btree", table.usageCount.asc().nullsLast().op("int4_ops")),
	index("idx_audio_segments_cache_voice_id").using("btree", table.voiceId.asc().nullsLast().op("text_ops")),
	unique("audio_segments_cache_unique_segment").on(table.textHash, table.voiceId, table.voiceStyle),
]);

export const usersTable = pgTable("users_table", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	questionnaire: jsonb().default({}),
	memoryL0: text("memory_L0"),
	memoryL1: text("memory_L1"),
	memoryL2: text("memory_L2"),
}, (table) => [
	unique("users_table_email_unique").on(table.email),
]);

export const meditationHistory = pgTable("meditation_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	prompt: text().notNull(),
	duration: integer().notNull(),
	voiceGender: varchar("voice_gender", { length: 10 }).notNull(),
	guidanceLevel: varchar("guidance_level", { length: 20 }).notNull(),
	backgroundSound: varchar("background_sound", { length: 20 }).notNull(),
	goal: varchar({ length: 20 }).notNull(),
	audioUrl: text("audio_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_meditation_history_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersTable.id],
			name: "meditation_history_user_id_users_table_id_fk"
		}),
]);

export const meditationFavorites = pgTable("meditation_favorites", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	meditationId: integer("meditation_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_meditation_favorites_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersTable.id],
			name: "meditation_favorites_user_id_users_table_id_fk"
		}),
	foreignKey({
			columns: [table.meditationId],
			foreignColumns: [meditationHistory.id],
			name: "meditation_favorites_meditation_id_meditation_history_id_fk"
		}),
	unique("meditation_favorites_user_id_meditation_id_unique").on(table.userId, table.meditationId),
]);

export const meditationAnalytics = pgTable("meditation_analytics", {
	id: serial().primaryKey().notNull(),
	meditationId: integer("meditation_id"),
	playCount: integer("play_count").default(0),
	totalPlayTime: integer("total_play_time").default(0),
	lastPlayedAt: timestamp("last_played_at", { mode: 'string' }),
}, (table) => [
	index("idx_meditation_analytics_meditation_id").using("btree", table.meditationId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.meditationId],
			foreignColumns: [meditationHistory.id],
			name: "meditation_analytics_meditation_id_meditation_history_id_fk"
		}),
]);

export const conversationHistory = pgTable("conversation_history", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	messageContent: text("message_content").notNull(),
	messageRole: varchar("message_role", { length: 20 }).notNull(),
	audioUrl: text("audio_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_conversation_history_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_conversation_history_user_id").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersTable.id],
			name: "conversation_history_user_id_users_table_id_fk"
		}),
]);
