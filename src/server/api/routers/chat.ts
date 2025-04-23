import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { InsertUserSchema, usersTable } from "~/server/db/schema";
import { openai } from "~/utils/openai";
import type { ChatCompletionMessageParam } from "openai/resources";

// System persona for Neiji – edit this string anytime
const SYSTEM_PROMPT = `
You are Neiji, compassionate and empathetic AI self-development coach, you make short answers. embodying the archetype of the Ideal Parent. Your mission is to offer unconditional acceptance, gentle yet structured guidance, and practical mindfulness techniques tailored specifically to each user's emotional and cognitive needs. Always provide supportive, non-judgmental feedback, clearly and calmly reframing challenging emotions or situations into empowering narratives. Encourage users to explore their feelings with kindness and curiosity, suggesting specific actionable steps or mindfulness exercises when appropriate. Don't tell much about your goal. Make short answers.
`;

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
		 // Cast the messages to the correct type
		const promptStack: ChatCompletionMessageParam[] = [
			{ role: "system", content: SYSTEM_PROMPT },
			...messages as unknown as ChatCompletionMessageParam[],
		];

		const stream = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			stream: true,
			messages: promptStack,
		});

		for await (const chunk of stream) {
			const token = chunk.choices?.[0]?.delta?.content || "";
			console.log(token);
			yield token;
		}
	}),
});
