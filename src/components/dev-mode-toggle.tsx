"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

/**
 * Composant de bascule mode développeur
 * Permet aux développeurs de bypasser l'authentification en mode développement
 */
export function DevModeToggle() {
	const [devMode, setDevMode] = useState(false);

	useEffect(() => {
		// Vérifie le mode développeur au chargement
		const isDevMode = localStorage.getItem('neiji_dev_mode') === 'true';
		setDevMode(isDevMode);
	}, []);

	const toggleDevMode = () => {
		const newDevMode = !devMode;
		setDevMode(newDevMode);
		localStorage.setItem('neiji_dev_mode', newDevMode.toString());
		
		// Recharge la page pour appliquer les changements
		window.location.reload();
	};

	// N'affiche que en mode développement
	if (process.env.NODE_ENV !== 'development') {
		return null;
	}

	return (
		<div className="fixed bottom-4 left-4 z-50">
			<Button
				onClick={toggleDevMode}
				variant={devMode ? "default" : "outline"}
				size="sm"
				className="text-xs"
			>
				🛠️ Dev Mode: {devMode ? 'ON' : 'OFF'}
			</Button>
		</div>
	);
}
