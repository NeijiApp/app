import { openai } from "@ai-sdk/openai";
import {
	createDataStreamResponse,
	streamText,
	type CoreMessage,
	type Message,
} from "ai";

type Messages = CoreMessage[] | Omit<Message, "id">[];

function shouldAskSubscribe(messages: Messages) {
	let count = 0;
	for (const message of messages) {
		if (message.role === "assistant") {
			count++;
		}
		if (count > 3) return false;
	}

	return count === 2;
}

export async function POST(request: Request) {
	const { messages }: { messages: Messages } = await request.json();

	if (shouldAskSubscribe(messages)) {
		return createDataStreamResponse({
			execute(dataStream) {
				dataStream.write(
					`0:"Thanks you for talking with me ! You can subscribe to our newsletter for more updates."\n`,
				);
				dataStream.writeMessageAnnotation({
					prompt: {
						type: "input",
						placeholder: "Subscribe our newsletter !",
					},
				});
			},
		});
	}

	const result = streamText({
		model: openai("gpt-4"),
		messages,
	});

	return result.toDataStreamResponse();
}
