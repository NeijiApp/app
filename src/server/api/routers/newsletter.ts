import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { InsertUserSchema, usersTable } from "~/server/db/schema";

export const newsletterRouter = createTRPCRouter({
	create: publicProcedure
		.input(InsertUserSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.insert(usersTable).values(input);
		}),
});
