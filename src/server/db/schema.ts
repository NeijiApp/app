import { pgTable, text, integer, varchar, timestamp, serial, unique, jsonb, index, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users_table", (t) => ({
	id: t.serial().primaryKey(),
	email: t.text().notNull().unique(),
	questionnaire: t.jsonb().default({}),
	memory_L0: t.text(), // Mémoire de niveau 0 - personnalité de base
	memory_L1: t.text(), // Mémoire de niveau 1 - préférences et habitudes
	memory_L2: t.text(), // Mémoire de niveau 2 - contexte étendu et historique
}));

export const meditationHistory = pgTable("meditation_history", (t) => ({
	id: t.serial().primaryKey(),
	user_id: t.integer().references(() => usersTable.id),
	prompt: t.text().notNull(),
	duration: t.integer().notNull(),
	voice_gender: t.varchar({ length: 10 }).notNull(),
	guidance_level: t.varchar({ length: 20 }).notNull(),
	background_sound: t.varchar({ length: 20 }).notNull(),
	goal: t.varchar({ length: 20 }).notNull(),
	audio_url: t.text(),
	created_at: t.timestamp().defaultNow(),
}), (table) => ({
	userIdIdx: index("idx_meditation_history_user_id").on(table.user_id),
}));

export const meditationFavorites = pgTable("meditation_favorites", (t) => ({
	id: t.serial().primaryKey(),
	user_id: t.integer().references(() => usersTable.id),
	meditation_id: t.integer().references(() => meditationHistory.id),
	created_at: t.timestamp().defaultNow(),
}), (table) => ({
	userIdIdx: index("idx_meditation_favorites_user_id").on(table.user_id),
	unique_user_meditation: unique().on(table.user_id, table.meditation_id),
}));

export const meditationAnalytics = pgTable("meditation_analytics", (t) => ({
	id: t.serial().primaryKey(),
	meditation_id: t.integer().references(() => meditationHistory.id),
	play_count: t.integer().default(0),
	total_play_time: t.integer().default(0), // in seconds
	last_played_at: t.timestamp(),
}), (table) => ({
	meditationIdIdx: index("idx_meditation_analytics_meditation_id").on(table.meditation_id),
}));

export const conversationHistory = pgTable("conversation_history", (t) => ({
	id: t.serial().primaryKey(),
	user_id: t.integer().references(() => usersTable.id).notNull(),
	message_content: t.text().notNull(),
	message_role: t.varchar({ length: 20 }).notNull(), // 'user' ou 'assistant'
	audio_url: t.text(), // pour les méditations (nullable)
	created_at: t.timestamp().defaultNow(),
}), (table) => ({
	userIdIdx: index("idx_conversation_history_user_id").on(table.user_id),
	createdAtIdx: index("idx_conversation_history_created_at").on(table.created_at),
}));

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
	// Nouvelles colonnes pour l'IA
	embedding: text(), // Embedding OpenAI (stocké comme JSON string)
	language: varchar({ length: 10 }).default('fr-FR'), // Code langue ISO
	similarityThreshold: real("similarity_threshold").default(0.92), // Seuil de similarité
}, (table) => ({
	languageIdx: index("idx_audio_segments_cache_language").on(table.language),
	lastUsedIdx: index("idx_audio_segments_cache_last_used").on(table.lastUsedAt),
	textHashIdx: index("idx_audio_segments_cache_text_hash").on(table.textHash),
	usageCountIdx: index("idx_audio_segments_cache_usage_count").on(table.usageCount),
	voiceIdIdx: index("idx_audio_segments_cache_voice_id").on(table.voiceId),
	unique_segment: unique("audio_segments_cache_unique_segment").on(table.textHash, table.voiceId, table.voiceStyle),
}));

export const InsertUserSchema = createInsertSchema(usersTable);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export type InsertConversationHistory = typeof conversationHistory.$inferInsert;
export type SelectConversationHistory = typeof conversationHistory.$inferSelect;

export type InsertAudioSegmentsCache = typeof audioSegmentsCache.$inferInsert;
export type SelectAudioSegmentsCache = typeof audioSegmentsCache.$inferSelect;
