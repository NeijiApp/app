import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { InsertUserSchema, usersTable } from "~/server/db/schema";
import { openai } from "~/utils/openai";

const MessageUser = z.object({
	content: z.string(),
	role: z.string(),
});

const Message = MessageUser;

const Messages = z.array(Message);

export const chatRouter = createTRPCRouter({
	chat: publicProcedure.input(Messages).mutation(async function* ({
		ctx,
		input: messages,
	}) {
		const stream = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			stream: true,
			// @ts-ignore
			messages,
		});

		for await (const chunk of stream) {
			const token = chunk.choices?.[0]?.delta?.content || "";
			console.log(token);
			yield token;
		}
	}),
});
