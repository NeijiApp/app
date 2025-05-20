"use client";

import { createContext, useContext } from "react";

import { useChat } from "@ai-sdk/react";

type ChatContext = {
	chat: ReturnType<typeof useChat>;
};

const ChatContext = createContext<ChatContext | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const chat = useChat();

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
