import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users_table", (t) => ({
	id: t.serial().primaryKey(),
	name: t.text().notNull(),
	email: t.text().notNull().unique(),
}));

export const InsertUserSchema = createInsertSchema(usersTable);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
