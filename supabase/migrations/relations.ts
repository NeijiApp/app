import { relations } from "drizzle-orm/relations";
import { usersTable, meditationHistory, meditationFavorites, meditationAnalytics, conversationHistory } from "./schema";

export const meditationHistoryRelations = relations(meditationHistory, ({one, many}) => ({
	usersTable: one(usersTable, {
		fields: [meditationHistory.userId],
		references: [usersTable.id]
	}),
	meditationFavorites: many(meditationFavorites),
	meditationAnalytics: many(meditationAnalytics),
}));

export const usersTableRelations = relations(usersTable, ({many}) => ({
	meditationHistories: many(meditationHistory),
	meditationFavorites: many(meditationFavorites),
	conversationHistories: many(conversationHistory),
}));

export const meditationFavoritesRelations = relations(meditationFavorites, ({one}) => ({
	usersTable: one(usersTable, {
		fields: [meditationFavorites.userId],
		references: [usersTable.id]
	}),
	meditationHistory: one(meditationHistory, {
		fields: [meditationFavorites.meditationId],
		references: [meditationHistory.id]
	}),
}));

export const meditationAnalyticsRelations = relations(meditationAnalytics, ({one}) => ({
	meditationHistory: one(meditationHistory, {
		fields: [meditationAnalytics.meditationId],
		references: [meditationHistory.id]
	}),
}));

export const conversationHistoryRelations = relations(conversationHistory, ({one}) => ({
	usersTable: one(usersTable, {
		fields: [conversationHistory.userId],
		references: [usersTable.id]
	}),
}));