/**
 * @fileoverview Provider de contexte pour la gestion d'état du chat
 * 
 * Ce fichier définit le contexte React et les hooks nécessaires pour partager
 * l'état du chat entre tous les composants de l'interface de chat protégée.
 * 
 * @component ChatStateProvider
 * @hook useChatState
 * 
 * Fonctionnalités :
 * - Centralisation de l'état du chat via le hook useChat d'AI SDK
 * - Contexte React pour partage d'état global
 * - Hook personnalisé pour accès simplifié au contexte
 * - Gestion des messages, statut et fonctions de chat
 * 
 * @requires @ai-sdk/react - Hook useChat pour la gestion des conversations IA
 * @requires react - createContext et useContext pour la gestion d'état
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import { createContext, useContext } from "react";

import { useChat } from "@ai-sdk/react";

/**
 * Type définissant la structure du contexte de chat
 */
type ChatContext = {
	chat: ReturnType<typeof useChat>;
};

const ChatContext = createContext<ChatContext | null>(null);

/**
 * Provider de contexte pour l'état du chat
 * 
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider avec contexte de chat
 */
export function ChatStateProvider({ children }: { children: React.ReactNode }) {
	const chat = useChat();

	return (
		<ChatContext.Provider value={{ chat }}>{children}</ChatContext.Provider>	);
}

/**
 * Hook personnalisé pour accéder à l'état du chat
 * 
 * @returns {ChatContext} Contexte de chat avec hook useChat
 * @throws {Error} Si utilisé en dehors du ChatStateProvider
 */
export function useChatState() {
	const state = useContext(ChatContext);

	if (!state)
		throw new Error(
			"Invalid usage of useChatState wrap it inside ChatStateProvider",
		);

	return state;
}
