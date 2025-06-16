import { pgTable, text, integer, varchar, timestamp, serial, unique, jsonb, index } from "drizzle-orm/pg-core";
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

export const InsertUserSchema = createInsertSchema(usersTable);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
