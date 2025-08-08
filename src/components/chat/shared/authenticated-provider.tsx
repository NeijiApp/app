"use client";

import { useEffect, useState } from "react";
type UIMessage = { id: string; role: "user" | "assistant" | "system"; content: string };
import { createClient } from "~/utils/supabase/client";
import { BaseChatProvider, useBaseChatState } from "./base-provider";
import type { ExtendedMessage } from "./bot-message";

interface AuthenticatedChatProviderProps {
	children: React.ReactNode;
	userId?: string;
	conversationId?: string;
}

/**
 * Hook that adds authentication features to the base chat state
 */
export function useAuthenticatedChat() {
	const baseChatState = useBaseChatState();
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [userId, setUserId] = useState<string | undefined>();
	const [conversationId, setConversationId] = useState<string | undefined>();

	// Load conversation history when component mounts
	useEffect(() => {
		async function loadHistory() {
			if (!userId) return;
			
			setIsLoadingHistory(true);
			const supabase = createClient();

			try {
				// Fetch conversation history from database
				const { data: conversations } = await supabase
					.from("conversation_history")
					.select("*")
					.eq("user_id", userId)
					.order("created_at", { ascending: false })
					.limit(1);

				if (conversations && conversations.length > 0) {
					const conversation = conversations[0];
					setConversationId(conversation.id);
					
					// Parse messages from JSON
					const messages = conversation.messages as UIMessage[];
					if (messages && messages.length > 0) {
						baseChatState.setMessages(messages);
					}
				}
			} catch (error) {
				console.error("Failed to load conversation history:", error);
			} finally {
				setIsLoadingHistory(false);
			}
		}

		loadHistory();
	}, [userId]);

	// Persist message to database
	const persistMessage = async (message: UIMessage) => {
		if (!userId || !conversationId) return;

		const supabase = createClient();
		
		try {
			// Get current messages
			const { data: conversation } = await supabase
				.from("conversation_history")
				.select("messages")
				.eq("id", conversationId)
				.single();

			if (conversation) {
				const currentMessages = (conversation.messages as UIMessage[]) || [];
				const updatedMessages = [...currentMessages, message];

				// Update conversation with new message
				await supabase
					.from("conversation_history")
					.update({ 
						messages: updatedMessages,
						updated_at: new Date().toISOString()
					})
					.eq("id", conversationId);
			}
		} catch (error) {
			console.error("Failed to persist message:", error);
		}
	};

	return {
		...baseChatState,
		isLoadingHistory,
		userId,
		setUserId,
		conversationId,
		setConversationId,
		persistMessage
	};
}

/**
 * Authenticated provider that wraps the base provider
 * and adds authentication-specific features
 */
export function AuthenticatedChatProvider({ 
	children,
	userId: initialUserId,
	conversationId: initialConversationId
}: AuthenticatedChatProviderProps) {
	return (
		<BaseChatProvider>
			<AuthenticatedChatWrapper 
				userId={initialUserId} 
				conversationId={initialConversationId}
			>
				{children}
			</AuthenticatedChatWrapper>
		</BaseChatProvider>
	);
}

function AuthenticatedChatWrapper({ 
	children, 
	userId, 
	conversationId 
}: AuthenticatedChatProviderProps) {
	const authenticatedChat = useAuthenticatedChat();

	// Set initial values
	useEffect(() => {
		if (userId) {
			authenticatedChat.setUserId?.(userId);
		}
		if (conversationId) {
			authenticatedChat.setConversationId?.(conversationId);
		}
	}, [userId, conversationId]);

	// Create an enhanced context value
	const enhancedValue = {
		chat: authenticatedChat,
		customMessages: authenticatedChat.customMessages,
		isDrawerOpen: authenticatedChat.isDrawerOpen,
		setIsDrawerOpen: authenticatedChat.setIsDrawerOpen,
		isLoadingHistory: authenticatedChat.isLoadingHistory
	};

	return <>{children}</>;
}
