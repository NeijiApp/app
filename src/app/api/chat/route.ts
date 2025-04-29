import { openai } from "@ai-sdk/openai";
import {
	createDataStreamResponse,
	streamText,
	tool,
	type CoreMessage,
	type Message,
} from "ai";
import { z } from "zod";

type Messages = CoreMessage[] | Omit<Message, "id">[];

const EmailInput = z
	.object({
		type: z.literal("email"),
		placeholder: z.string(),
	})
	.describe("Prompt user his email and reply the response");

export type EmailInputAnnotation = z.infer<typeof EmailInput>;

const SelectInput = z
	.object({
		type: z.literal("select"),
		choices: z.array(z.string()),
	})
	.describe("Prompt user multiple choice and reply the response");

export type SelectInputAnnotation = z.infer<typeof SelectInput>;

const UserInputParameters = EmailInput;

export type UserInputParameters = z.infer<typeof UserInputParameters>;

export type PossibleAnnotation = UserInputParameters;

export async function POST(request: Request) {
	const { messages }: { messages: Messages } = await request.json();

	return createDataStreamResponse({
		async execute(dataStream) {
			const result = streamText({
				model: openai("gpt-4"),
				messages,
				onError(err) {
					console.log(err);
				},
				tools: {
					userinput: tool({
						parameters: UserInputParameters,
						description:
							"Change the chat input UI for the user, enabling new type of interactions",
						async execute(args, options) {
							dataStream.writeMessageAnnotation(args);
							return "done";
						},
					}),
				},
				maxSteps: 2,
			});

			result.mergeIntoDataStream(dataStream);
		},
	});
}
