import { openai } from "../services/openrouter";

type GenerateContentProps = {
	readonly system_prompt: string;
	readonly user_prompt: string;
	readonly model?: string | undefined;
};

function generateContent({
	user_prompt,
	system_prompt,
	model = "qwen/qwen3-8b:free",
}: GenerateContentProps): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();

	return new ReadableStream({
		async start(controller) {
			try {
				// Initiate the streaming completion request
				const response = await openai.chat.completions.create({
					model,
					stream: true, // Make sure streaming is enabled
					messages: [
						{ role: "system", content: system_prompt },
						{ role: "user", content: user_prompt },
					],
				});

				// For each chunk of data coming from the streaming endpoint,
				// enqueue it into the controller
				for await (const chunk of response) {
					const content = chunk?.choices?.[0]?.delta?.content;
					if (content) {
						controller.enqueue(encoder.encode(content));
					}
				}
			} catch (err) {
				controller.error(err);
			} finally {
				controller.close();
			}
		},
	});
}

export { generateContent };
