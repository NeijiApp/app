import { pgTable } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users_table", (t) => ({
	id: t.serial().primaryKey(),
	name: t.text().notNull(),
	email: t.text().notNull().unique(),
}));

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
