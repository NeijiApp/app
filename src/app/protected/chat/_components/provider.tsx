"use client";

import { useEffect, useState } from "react";
import {
  ChatStateProvider as UnifiedProvider,
  useChatState as useUnifiedChatState,
} from "~/components/chat/shared/unified-provider";
import type { ExtendedMessage } from "~/components/chat/shared/bot-message";
import { conversationHistory } from "~/lib/conversation-history";

export type { ExtendedMessage };

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | undefined>();
  const [isLoadingUser, setIsLoadingUser] = useState(true);

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

  if (isLoadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <UnifiedProvider isAuthenticated={true} userId={userId}>
      {children}
    </UnifiedProvider>
  );
}

export function useChatState() {
  const unifiedState = useUnifiedChatState();
  return {
    chat: unifiedState.chat,
    customMessages: unifiedState.customMessages,
    isDrawerOpen: unifiedState.isDrawerOpen,
    setIsDrawerOpen: unifiedState.setIsDrawerOpen,
    isLoadingHistory: unifiedState.isLoadingHistory,
    // Expose meditation fields
    meditationMode: unifiedState.meditationMode,
    setMeditationMode: unifiedState.setMeditationMode,
    addCustomMessage: unifiedState.addCustomMessage,
    clearCustomMessages: unifiedState.clearCustomMessages,
    isGeneratingMeditation: unifiedState.isGeneratingMeditation,
    setIsGeneratingMeditation: unifiedState.setIsGeneratingMeditation,
  };
}

export function useDrawer() {
  const { isDrawerOpen, setIsDrawerOpen } = useUnifiedChatState();
  return {
    isOpen: isDrawerOpen,
    toggleDrawer: () => setIsDrawerOpen(!isDrawerOpen),
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
  };
}
