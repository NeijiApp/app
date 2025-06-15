/**
 * @fileoverview Contexte de gestion des drawers pour l'interface de chat
 *
 * Ce fichier fournit le contexte React et les hooks nécessaires pour gérer
 * l'état d'ouverture/fermeture des drawers dans l'interface de chat protégée.
 *
 * @component DrawerProvider
 * @hook useDrawer
 *
 * Fonctionnalités :
 * - Gestion centralisée de l'état des drawers
 * - Contexte React pour partage d'état global
 * - Fonctions d'ouverture, fermeture et basculement
 * - Hook personnalisé pour accès simplifié au contexte
 * - Validation d'utilisation du contexte
 *
 * @requires react - createContext, useContext, useState pour la gestion d'état
 *
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

/**
 * Type définissant la structure du contexte de drawer
 */
interface DrawerContextType {
	isOpen: boolean;
	openDrawer: () => void;
	closeDrawer: () => void;
	toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

/**
 * Provider component for managing drawer state across components
 * 
 * @param {Object} props - Props du composant
 * @param {ReactNode} props.children - Composants enfants
 * @returns {JSX.Element} Provider avec contexte de drawer
 */
export function DrawerProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	const openDrawer = () => setIsOpen(true);
	const closeDrawer = () => setIsOpen(false);
	const toggleDrawer = () => setIsOpen((prev) => !prev);

	return (
		<DrawerContext.Provider
			value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}
		>
			{children}
		</DrawerContext.Provider>	);
}

/**
 * Hook personnalisé pour accéder au contexte de drawer
 * 
 * @returns {DrawerContextType} Contexte de drawer avec fonctions de gestion
 * @throws {Error} Si utilisé en dehors du DrawerProvider
 */
export function useDrawer(): DrawerContextType {
	const context = useContext(DrawerContext);
	if (context === undefined) {
		throw new Error("useDrawer must be used within a DrawerProvider");
	}
	return context;
}
