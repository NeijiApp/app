"use client";

import { createContext, useContext } from "react";

import { useChat } from "@ai-sdk/react";

type ChatContext = {
	chat: ReturnType<typeof useChat>;
};

const ChatContext = createContext<ChatContext | null>(null);

// Helper to emit a line, with delay if needed
async function emitLine(
	line: string,
	controller: ReadableStreamDefaultController<Uint8Array>,
) {
	if (line.startsWith("0")) {
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	controller.enqueue(new TextEncoder().encode(line));
}

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const chat = useChat({
		fetch: async (
			input: RequestInfo | URL,
			init?: RequestInit | undefined,
		): Promise<Response> => {
			// Make the actual fetch request
			const response = await fetch(input, init);

			const body = response.body;

			// If the response isn't streaming or body is null, return it as is
			if (!body || !(body instanceof ReadableStream)) return response;

			const reader = body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";

			const delayedStream = new ReadableStream<Uint8Array>({
				async pull(controller) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							// Flush any remaining buffered data as a line
							if (buffer.length > 0) {
								await emitLine(buffer, controller);
							}
							controller.close();
							break;
						}

						buffer += decoder.decode(value, { stream: true });
						let newlineIndex: number = buffer.indexOf("\n");
						while (newlineIndex !== -1) {
							const line = buffer.slice(0, newlineIndex + 1); // include newline
							buffer = buffer.slice(newlineIndex + 1);
							await emitLine(line, controller);
							newlineIndex = buffer.indexOf("\n");
						}
					}
				},
			});

			// Return a new response with the delayed stream
			return new Response(delayedStream, {
				headers: response.headers,
				status: response.status,
				statusText: response.statusText,
			});
		},
	});

	return (
		<ChatContext.Provider value={{ chat }}>{children}</ChatContext.Provider>
	);
}

export function useChatState() {
	const state = useContext(ChatContext);

	if (!state)
		throw new Error(
			"Invalid usage of useChatState wrap it inside ChatStateProvider",
		);

	return state;
}
