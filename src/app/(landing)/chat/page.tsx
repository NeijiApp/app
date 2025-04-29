"use client";

import { useContext, createContext, useEffect, useMemo } from "react";
import Image from "next/image";

import { useChat } from "@ai-sdk/react";

import { UserMessage } from "./_components/user-message";
import { BotMessage } from "./_components/bot-message";
import { Chat } from "./_components/chat";
import { ChatInput } from "./_components/chat-input";
import { GradientBackground } from "./_components/gradient-background";

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

function ChatStateProvider({ children }: { children: React.ReactNode }) {
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

function ChatLogic() {
	const {
		chat: { messages, input, setInput, handleSubmit, status, setMessages },
	} = useChatState();

	// Auto-scroll interval effect
	useEffect(() => {
		let intervalId: NodeJS.Timeout | null = null;

		const scrollToBottom = () => {
			window.scrollTo({
				top: document.documentElement.scrollHeight,
				behavior: "smooth",
			});
		};

		// Start auto-scrolling when status is "submitted" or "streaming"
		if (status === "submitted" || status === "streaming") {
			// Initial scroll
			scrollToBottom();
			// Set up interval for continuous scrolling
			intervalId = setInterval(scrollToBottom, 100);
		}

		// Cleanup function
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, [status]);

	return (
		<Chat>
			<div className="container mx-auto space-y-4 pt-8 pb-30">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-4 pt-40">
						<Image
							src="/logo-neiji-full.png"
							alt="Neiji Logo"
							width={120}
							height={120}
						/>
						<p className="text-lg text-muted-foreground">
							I'm your coach for self development, Soonly sharing tailored
							mindfulness.
						</p>
					</div>
				) : (
					messages.map((message) => {
						if (message.role === "user") {
							return (
								<UserMessage key={message.id}>{message.content}</UserMessage>
							);
						}

						return <BotMessage key={message.id} message={message} />;
					})
				)}
			</div>
			<ChatInput
				onChatFocus={() => {
					if (messages.length === 0) {
						setMessages([
							{
								id: "msg-originalmessage",
								content: "Hello how can i help you today ?",
								role: "assistant",
							},
						]);
					}
				}}
			/>
		</Chat>
	);
}

export default function ChatPage() {
	return (
		<GradientBackground>
			<ChatStateProvider>
				<ChatLogic />
			</ChatStateProvider>
		</GradientBackground>
	);
}
