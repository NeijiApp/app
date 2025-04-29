import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(request: Request) {
	const { messages } = await request.json();

	const result = streamText({
		model: openai("gpt-4"),
		messages,
	});

	for await (const chunk of result.textStream) {
		console.log(chunk);
	}

	return result.toTextStreamResponse();
}
