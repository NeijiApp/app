"use client";

import { useContext, createContext } from "react";
import Image from "next/image";

import { useChat } from "@ai-sdk/react";

import { UserMessage } from "./_components/user-message";
import { BotMessage } from "./_components/bot-message";
import { Chat, ChatMessages } from "./_components/chat";
import { ChatInput } from "./_components/chat-input";
import { GradientBackground } from "./_components/gradient-background";

type ChatContext = {
	chat: ReturnType<typeof useChat>;
};

const ChatContext = createContext<ChatContext | null>(null);

function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const chat = useChat({
		streamProtocol: "text",
	});

	return (
		<ChatContext.Provider value={{ chat }}>{children}</ChatContext.Provider>
	);
}

function useChatState() {
	const state = useContext(ChatContext);

	if (!state)
		throw new Error(
			"Invalid usage of useChatState wrap it inside ChatStateProvider",
		);

	return state;
}

function ChatLogic() {
	const {
		chat: { messages, input, setInput, handleSubmit },
	} = useChatState();

	return (
		<Chat>
			<ChatMessages>
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

						return <BotMessage key={message.id}>{message.content}</BotMessage>;
					})
				)}
			</ChatMessages>
			<ChatInput
				message={input}
				setMessage={setInput}
				handleSubmit={handleSubmit}
				placeholder={messages.length === 0 ? "Ask Neiji" : "Message"}
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
