"use client";

import { useContext, createContext } from "react";

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
				{messages.map((message) => {
					if (message.role === "user") {
						return (
							<UserMessage key={message.id}>{message.content}</UserMessage>
						);
					}

					return <BotMessage key={message.id}>{message.content}</BotMessage>;
				})}
			</ChatMessages>
			<ChatInput
				message={input}
				setMessage={setInput}
				handleSubmit={handleSubmit}
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
