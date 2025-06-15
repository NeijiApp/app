import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const usersTable = pgTable("users_table", (t) => ({
	id: t.serial().primaryKey(),
	email: t.text().notNull().unique(),
	questionnaire: t.text().default(''),
	memory_L0: t.text(), // Mémoire de niveau 0 - personnalité de base
	memory_L1: t.text(), // Mémoire de niveau 1 - préférences et habitudes
	memory_L2: t.text(), // Mémoire de niveau 2 - contexte étendu et historique
}));

export const InsertUserSchema = createInsertSchema(usersTable);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
