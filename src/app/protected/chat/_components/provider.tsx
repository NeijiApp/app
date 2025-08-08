"use client";

import { useEffect, useState } from "react";
import { 
	ChatStateProvider as UnifiedProvider, 
	useChatState as useUnifiedChatState 
} from "~/components/chat/shared/unified-provider";
import type { ExtendedMessage } from "~/components/chat/shared/bot-message";
import { conversationHistory } from "~/lib/conversation-history";

// Re-export ExtendedMessage type for backward compatibility
export type { ExtendedMessage };

/**
 * Protected chat provider - wraps the unified provider with authentication
 */
export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const [userId, setUserId] = useState<string | undefined>();
	const [isLoadingUser, setIsLoadingUser] = useState(true);

	// Get the current user ID on mount
	useEffect(() => {
		const loadUserId = async () => {
			try {
				const currentUserId = await conversationHistory.getCurrentUserId();
				if (currentUserId) {
					setUserId(currentUserId.toString());
				}
			} catch (error) {
				console.error("Failed to get user ID:", error);
			} finally {
				setIsLoadingUser(false);
			}
		};

		loadUserId();
	}, []);

	// Don't render until we know if we have a user
	if (isLoadingUser) {
		return <div>Loading...</div>;
	}

	return (
		<UnifiedProvider isAuthenticated={true} userId={userId}>
			{children}
		</UnifiedProvider>
	);
}

/**
 * Protected chat hook - returns the chat state from unified provider
 */
export function useChatState() {
	const unifiedState = useUnifiedChatState();
	
	// Map the unified state to the expected format for protected chat
	return {
		chat: unifiedState.chat,
		customMessages: unifiedState.customMessages,
		isDrawerOpen: unifiedState.isDrawerOpen,
		setIsDrawerOpen: unifiedState.setIsDrawerOpen,
		isLoadingHistory: unifiedState.isLoadingHistory,
	};
}
