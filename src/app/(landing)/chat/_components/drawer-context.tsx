"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface DrawerContextType {
	isOpen: boolean;
	openDrawer: () => void;
	closeDrawer: () => void;
	toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

/**
 * Provider component for managing drawer state across components
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
		</DrawerContext.Provider>
	);
}

/**
 * Hook to use drawer context
 */
export function useDrawer(): DrawerContextType {
	const context = useContext(DrawerContext);
	if (context === undefined) {
		throw new Error("useDrawer must be used within a DrawerProvider");
	}
	return context;
}
