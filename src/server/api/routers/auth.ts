import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { usersTable } from "~/server/db/schema";
import { createClient } from "~/utils/supabase/server";

export const authRouter = createTRPCRouter({
	// Créer un profil utilisateur après inscription
	createProfile: publicProcedure
		.input(z.object({
			email: z.string().email(),
		}))
		.mutation(async ({ ctx, input }) => {
			const supabase = await createClient();
			
			// Vérifier que l'utilisateur est authentifié
			const { data: { user } } = await supabase.auth.getUser();
			if (!user || user.email !== input.email) {
				throw new Error("Non autorisé");
			}

			// Créer le profil utilisateur
            await ctx.db.insert(usersTable).values({
                email: input.email,
            });
        }),

	// Mettre à jour les mémoires
	updateMemory: publicProcedure
		.input(z.object({
			level: z.enum(["memory_L0", "memory_L1", "memory_L2"]),
			content: z.string(),
		}))
		.mutation(async ({ ctx, input }) => {
			const supabase = await createClient();
			
			// Vérifier que l'utilisateur est authentifié
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				throw new Error("Non autorisé");
			}

			// Mettre à jour la mémoire
			await ctx.db
				.update(usersTable)
				.set({ [input.level]: input.content })
				.where(eq(usersTable.email, user.email!));
		}),

	// Récupérer le profil utilisateur
	getProfile: publicProcedure
		.query(async ({ ctx }) => {
			const supabase = await createClient();
			
			// Vérifier que l'utilisateur est authentifié
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				throw new Error("Non autorisé");
			}

			// Récupérer le profil
			const profile = await ctx.db
				.select()
				.from(usersTable)
				.where(eq(usersTable.email, user.email!))
				.limit(1);

			return profile[0] || null;
		}),
});
