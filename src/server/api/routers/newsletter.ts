import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { usersTable, InsertUserSchema } from "~/server/db/schema";

export const newsletterRouter = createTRPCRouter({
	create: publicProcedure
		.input(InsertUserSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.insert(usersTable).values(input);
		}),
});
