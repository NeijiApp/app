"use client";

import { nanoid } from "nanoid";
import type * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { Message } from "ai";
type UIMessage = Message;
import { createClient } from "~/utils/supabase/client";
import type { ExtendedMessage } from "./bot-message";
import { conversationHistory } from "~/lib/conversation-history";

// Unified chat state interface
export interface UnifiedChatState {
	// Core chat state
	messages: Message[];
	status: "idle" | "submitted" | "streaming" | "awaiting" | "error";
	setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
	setStatus: React.Dispatch<React.SetStateAction<"idle" | "submitted" | "streaming" | "awaiting" | "error">>;
	customMessages: ExtendedMessage[];
	setCustomMessages: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
  // Input state and handlers (used by chat input components)
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
	
	// Drawer state
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	
	// Authentication state (optional)
	isAuthenticated: boolean;
	userId?: string;
	conversationId?: string;
	isLoadingHistory: boolean;
}

// Context with all state
interface ChatContextValue {
	chat: UnifiedChatState;
	customMessages: ExtendedMessage[];
	isDrawerOpen: boolean;
	setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
	isLoadingHistory: boolean;
	// Meditation-specific state
	meditationMode: "chat" | "meditation";
	setMeditationMode: React.Dispatch<React.SetStateAction<"chat" | "meditation">>;
	addCustomMessage: (message: ExtendedMessage) => void;
	clearCustomMessages: () => void;
	isGeneratingMeditation: boolean;
	setIsGeneratingMeditation: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const useChatState = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatState must be used within a ChatStateProvider");
	}
	return context;
};

interface ChatStateProviderProps {
	children: React.ReactNode;
	isAuthenticated?: boolean;
	userId?: string;
  initialMessages?: UIMessage[];
}

/**
 * Unified provider that works for both authenticated and unauthenticated users
 * Features are enabled/disabled based on isAuthenticated prop
 */
export function ChatStateProvider({ 
	children, 
	isAuthenticated = false,
	userId,
	initialMessages = []
}: ChatStateProviderProps) {
	// Core chat state
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [status, setStatus] = useState<"idle" | "submitted" | "streaming" | "awaiting" | "error">("idle");
	const [customMessages, setCustomMessages] = useState<ExtendedMessage[]>([]);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [input, setInput] = useState<string>("");
	
	// Meditation-specific state
	const [meditationMode, setMeditationMode] = useState<"chat" | "meditation">("chat");
	const [isGeneratingMeditation, setIsGeneratingMeditation] = useState(false);
	
	// Authentication-specific state
  const [conversationId, setConversationId] = useState<string | undefined>();
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);

	// Load conversation history if authenticated
	useEffect(() => {
    if (!isAuthenticated || !userId) {
      console.log("🎯 [PROVIDER] Skipping history load - not authenticated");
      return;
    }

    async function loadHistory() {
      console.log("🎯 [PROVIDER] Loading per-message history for user:", userId);
      setIsLoadingHistory(true);
      try {
        const numericalUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(numericalUserId)) {
          console.warn("🎯 [PROVIDER] Invalid userId for history load");
          return;
        }
        const history = await conversationHistory.getHistory(numericalUserId, 100);
        const mapped: Message[] = history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }) as unknown as Message);
        if (mapped.length > 0) {
          setMessages(mapped);
        }
      } catch (error) {
        console.error("🎯 [PROVIDER] Unexpected error loading history:", error);
      } finally {
        setIsLoadingHistory(false);
        console.log("🎯 [PROVIDER] History loading complete");
      }
    }

    loadHistory();
	}, [isAuthenticated, userId]);

  // No bulk persistence here; messages are saved one by one when added.

	// Create unified state object
	const unifiedState: UnifiedChatState = {
		messages,
		status,
		setMessages,
		setStatus,
		customMessages,
		setCustomMessages,
    input,
    setInput,
    handleInputChange: (e) => {
      setInput(e.target.value);
    },
    handleSubmit: async (e) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      // Append user message locally
      const userMessage: Message = { id: nanoid(), role: "user", content: trimmed } as any;
      setMessages((prev) => [...prev, userMessage]);
      // Persist per-message if authenticated
      if (isAuthenticated && userId) {
        const uid = Number.parseInt(userId, 10);
        if (!Number.isNaN(uid)) {
          conversationHistory
            .saveMessage(uid, { id: userMessage.id, role: "user", content: trimmed })
            .catch((err) => console.warn("🎯 [PROVIDER] Persist user message failed", err));
        }
      }
      setInput("");
      setStatus("idle");
    },
    stop: () => {
      // no-op until streaming is implemented
    },
		isDrawerOpen,
		setIsDrawerOpen,
		isAuthenticated,
		userId,
		conversationId,
		isLoadingHistory
	};

	// Helper functions for custom messages
	const addCustomMessage = (message: ExtendedMessage) => {
		setCustomMessages((prev) => [...prev, message]);
		
    // Save message if authenticated (per-row model)
    if (isAuthenticated && userId && (message.role === "user" || message.role === "assistant")) {
      const uid = Number.parseInt(userId, 10);
      if (!Number.isNaN(uid)) {
        conversationHistory
          .saveMessage(uid, {
            id: message.id,
            role: message.role,
            content: message.content,
            audioUrl: message.audioUrl,
          })
          .catch((err) => console.warn("Error saving custom message:", err));
      }
    }
	};
	
	const clearCustomMessages = () => {
		setCustomMessages([]);
	};

	// Create context value
	const contextValue: ChatContextValue = {
		chat: unifiedState,
		customMessages,
		isDrawerOpen,
		setIsDrawerOpen,
		isLoadingHistory,
		meditationMode,
		setMeditationMode,
		addCustomMessage,
		clearCustomMessages,
		isGeneratingMeditation,
		setIsGeneratingMeditation,
	};

	return (
		<ChatContext.Provider value={contextValue}>
			{children}
		</ChatContext.Provider>
	);
}
