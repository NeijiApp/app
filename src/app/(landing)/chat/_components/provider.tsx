"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Message } from "ai";
import { useChat } from "@ai-sdk/react";

// --- Drawer Context ---
interface DrawerContextType {
	isOpen: boolean;
	toggleDrawer: () => void;
	openDrawer: () => void;
	closeDrawer: () => void;
}
const DrawerContext = createContext<DrawerContextType | null>(null);
export function useDrawer() {
	const context = useContext(DrawerContext);
	if (!context) throw new Error("useDrawer must be used within a DrawerProvider");
	return context;
}

// --- Chat Context ---
export interface ExtendedMessage extends Message {
	audioUrl?: string;
}

type ChatContextType = {
	chat: ReturnType<typeof useChat>;
	meditationMode: boolean;
	setMeditationMode: (mode: boolean) => void;
	customMessages: ExtendedMessage[];
	addCustomMessage: (message: ExtendedMessage) => void;
	clearCustomMessages: () => void;
	isGeneratingMeditation: boolean;
	setIsGeneratingMeditation: (generating: boolean) => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const chat = useChat();
	const [meditationMode, setMeditationMode] = useState(false);
	const [customMessages, setCustomMessages] = useState<ExtendedMessage[]>([]);
	const [isGeneratingMeditation, setIsGeneratingMeditation] = useState(false);

	const [isDrawerOpen, setDrawerOpen] = useState(false);
	const toggleDrawer = () => setDrawerOpen((prev) => !prev);
	const openDrawer = () => setDrawerOpen(true);
	const closeDrawer = () => setDrawerOpen(false);

	const addCustomMessage = (message: ExtendedMessage) => {
		setCustomMessages(prev => [...prev, message]);
	};

	const clearCustomMessages = () => {
		setCustomMessages([]);
	};

	return (
		<DrawerContext.Provider value={{ isOpen: isDrawerOpen, toggleDrawer, openDrawer, closeDrawer }}>
			<ChatContext.Provider value={{ 
				chat, 
				meditationMode, 
				setMeditationMode,
				customMessages,
				addCustomMessage,
				clearCustomMessages,
				isGeneratingMeditation,
				setIsGeneratingMeditation
			}}>
				{children}
			</ChatContext.Provider>
		</DrawerContext.Provider>
	);
}

export function useChatState() {
	const state = useContext(ChatContext);
	if (!state) throw new Error("Invalid usage of useChatState; wrap it inside ChatStateProvider");
	return state;
}
