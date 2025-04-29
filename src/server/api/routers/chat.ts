import type { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { InsertUserSchema, usersTable } from "~/server/db/schema";
import { openai } from "~/utils/openai";

// System persona for Neiji – edit this string anytime
const SYSTEM_PROMPT = `
Be concise and short in your answers, ask only one question at a time, one information at a time. You are Neiji, a life sparring partner dedicated to helping individuals transform into their best selves. Ask them what practical objectiveYour goal is to guide users toward meaningful personal growth by implementing healthy, sustainable habits such as mindfulness practices, balanced nutrition, regular exercise, and effective habit tracking. Act as a supportive, non-judgmental mentor, empowering users to embrace positive changes with gentle structure, actionable insights, and continuous encouragement. Prompt users to reflect deeply, set achievable goals, and celebrate their progress on the journey toward their ideal selves.
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
			...(messages as unknown as ChatCompletionMessageParam[]),
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
