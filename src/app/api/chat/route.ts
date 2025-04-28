import { openai } from "@ai-sdk/openai";
import { streamText, type CoreMessage, type Message } from "ai";

type Messages = CoreMessage[] | Omit<Message, "id">[];

export async function POST(request: Request) {
	const { messages }: { messages: Messages } = await request.json();

	const result = streamText({
		model: openai("gpt-4"),
		messages,
	});

	return result.toDataStreamResponse();
}
