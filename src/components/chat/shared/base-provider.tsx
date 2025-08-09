"use client";

import { nanoid } from "nanoid";
import type * as React from "react";
import { createContext, useContext, useState } from "react";
import type { Message } from "ai";
import type { ExtendedMessage } from "./bot-message";

// Base chat state that's shared between authenticated and unauthenticated
export interface BaseChatState {
	messages: Message[];
	status: "idle" | "submitted" | "streaming" | "awaiting" | "error";
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setStatus: React.Dispatch<React.SetStateAction<"idle" | "submitted" | "streaming" | "awaiting" | "error">>;
	customMessages: ExtendedMessage[];
	setCustomMessages: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
	// Drawer state
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Enhanced chat state with authentication features
export interface AuthenticatedChatState extends BaseChatState {
	userId?: string;
	conversationId?: string;
	isLoadingHistory: boolean;
	persistMessage?: (message: Message) => Promise<void>;
}

const BaseChatContext = createContext<BaseChatState | undefined>(undefined);

export const useBaseChatState = () => {
	const context = useContext(BaseChatContext);
	if (!context) {
		throw new Error("useBaseChatState must be used within a BaseChatProvider");
	}
	return context;
};

interface BaseChatProviderProps {
	children: React.ReactNode;
	initialMessages?: Message[];
}

/**
 * Base provider for chat functionality
 * This provides core chat features without authentication
 */
export function BaseChatProvider({ 
	children, 
	initialMessages = [] 
}: BaseChatProviderProps) {
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [status, setStatus] = useState<"idle" | "submitted" | "streaming" | "awaiting" | "error">("idle");
	const [customMessages, setCustomMessages] = useState<ExtendedMessage[]>([]);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const state: BaseChatState = {
		messages,
		setMessages,
		status,
		setStatus,
		customMessages,
		setCustomMessages,
		isDrawerOpen,
		setIsDrawerOpen,
	};

	return (
		<BaseChatContext.Provider value={state}>
			{children}
		</BaseChatContext.Provider>
	);
}
