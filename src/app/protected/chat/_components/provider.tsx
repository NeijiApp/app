"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { conversationHistory, type ConversationMessage } from "~/lib/conversation-history";

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
	isLoadingHistory: boolean;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const chat = useChat();
	const [meditationMode, setMeditationMode] = useState(false);
	const [customMessages, setCustomMessages] = useState<ExtendedMessage[]>([]);
	const [isGeneratingMeditation, setIsGeneratingMeditation] = useState(false);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);
	const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

	const [isDrawerOpen, setDrawerOpen] = useState(false);
	const toggleDrawer = () => setDrawerOpen((prev) => !prev);
	const openDrawer = () => setDrawerOpen(true);
	const closeDrawer = () => setDrawerOpen(false);

	// Charger l'historique au montage du composant
	useEffect(() => {
		const loadHistory = async () => {
			setIsLoadingHistory(true);
			try {
				const userId = await conversationHistory.getCurrentUserId();
				if (userId) {
					const history = await conversationHistory.getHistory(userId);
					
					// Convertir l'historique vers le format ExtendedMessage
					const historyMessages: ExtendedMessage[] = history.map(msg => ({
						id: msg.id,
						role: msg.role,
						content: msg.content,
						audioUrl: msg.audioUrl,
					}));

					// Séparer les messages normaux des méditations
					const regularMessages = historyMessages.filter(msg => !msg.audioUrl);
					const meditationMessages = historyMessages.filter(msg => msg.audioUrl);					// Charger les messages normaux dans le chat
					if (regularMessages.length > 0) {
						chat.setMessages(regularMessages);
						
						// Marquer tous les messages de l'historique comme déjà sauvegardés
						const historicIds = regularMessages.map(msg => msg.id);
						setSavedMessageIds(new Set(historicIds));
						console.log('Messages historiques marqués comme sauvegardés:', historicIds.length);
					}

					// Charger les méditations dans customMessages
					if (meditationMessages.length > 0) {
						setCustomMessages(meditationMessages);
					}
				}
			} catch (error) {
				console.error('Erreur chargement historique:', error);
			} finally {
				setIsLoadingHistory(false);
			}
		};

		loadHistory();
	}, []);
	// Sauvegarder automatiquement les nouveaux messages du chat
	useEffect(() => {
		// NE PAS sauvegarder pendant le streaming !
		if (chat.isLoading || isLoadingHistory) {
			return;
		}
		
		const saveNewMessages = async () => {
			try {
				const userId = await conversationHistory.getCurrentUserId();
				if (!userId || chat.messages.length === 0) return;

				// Sauvegarder seulement le dernier message s'il n'a pas déjà été sauvegardé
				const lastMessage = chat.messages[chat.messages.length - 1];
				if (lastMessage && 
					!lastMessage.id.includes('saved-') && 
					!savedMessageIds.has(lastMessage.id) &&
					(lastMessage.role === 'user' || lastMessage.role === 'assistant')) {
					
					console.log('Sauvegarde du nouveau message:', lastMessage.role, lastMessage.id);
					
					// Marquer immédiatement comme sauvegardé pour éviter les doublons
					setSavedMessageIds(prev => new Set([...prev, lastMessage.id]));
					
					await conversationHistory.saveMessage(userId, {
						id: lastMessage.id,
						role: lastMessage.role as 'user' | 'assistant',
						content: lastMessage.content,
					});
					
					// Marquer le message comme sauvegardé dans l'ID aussi
					const updatedMessages = [...chat.messages];
					updatedMessages[updatedMessages.length - 1] = {
						...lastMessage,
						id: `saved-${lastMessage.id}`,
					};
					chat.setMessages(updatedMessages);
				}
			} catch (error) {
				console.error('Erreur lors de la sauvegarde:', error);
			}
		};

		saveNewMessages();
	}, [chat.messages, isLoadingHistory, chat.isLoading, savedMessageIds]);

	const addCustomMessage = (message: ExtendedMessage) => {
		setCustomMessages(prev => [...prev, message]);
		
		// Sauvegarder automatiquement les méditations
		const saveCustomMessage = async () => {
			try {
				const userId = await conversationHistory.getCurrentUserId();
				if (userId && (message.role === 'user' || message.role === 'assistant')) {
					await conversationHistory.saveMessage(userId, {
						id: message.id,
						role: message.role as 'user' | 'assistant',
						content: message.content,
						audioUrl: message.audioUrl,
					});
				}
			} catch (error) {
				console.error('Erreur sauvegarde message custom:', error);
			}
		};
		
		saveCustomMessage();
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
				setIsGeneratingMeditation,
				isLoadingHistory
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
