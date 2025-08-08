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
 * Auth-aware chat provider - wraps the unified provider and passes auth context if available
 */
export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const [userId, setUserId] = useState<string | undefined>(undefined);

	useEffect(() => {
		let mounted = true;
		const loadUser = async () => {
			try {
				const currentUserId = await conversationHistory.getCurrentUserId();
				if (mounted && currentUserId) {
					setUserId(currentUserId.toString());
				}
			} catch (error) {
				console.error("Failed to get user ID:", error);
			}
		};
		loadUser();
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<UnifiedProvider isAuthenticated={!!userId} userId={userId}>
			{children}
		</UnifiedProvider>
	);
}

/**
 * Auth-aware chat hook - returns the chat state from unified provider
 */
export function useChatState() {
	const unifiedState = useUnifiedChatState();
	
	// Map the unified state to the expected format for public chat
	return {
		chat: unifiedState.chat,
		customMessages: unifiedState.customMessages,
		isDrawerOpen: unifiedState.isDrawerOpen,
		setIsDrawerOpen: unifiedState.setIsDrawerOpen,
		meditationMode: unifiedState.meditationMode,
		setMeditationMode: unifiedState.setMeditationMode,
		addCustomMessage: unifiedState.addCustomMessage,
		clearCustomMessages: unifiedState.clearCustomMessages,
		isGeneratingMeditation: unifiedState.isGeneratingMeditation,
		setIsGeneratingMeditation: unifiedState.setIsGeneratingMeditation,
		isLoadingHistory: unifiedState.isLoadingHistory,
	};
}

/**
 * Drawer hook for backward compatibility
 */
export function useDrawer() {
	const { isDrawerOpen, setIsDrawerOpen } = useUnifiedChatState();
	
	return {
		isOpen: isDrawerOpen,
		toggleDrawer: () => setIsDrawerOpen(!isDrawerOpen),
		openDrawer: () => setIsDrawerOpen(true),
		closeDrawer: () => setIsDrawerOpen(false),
	};
}
