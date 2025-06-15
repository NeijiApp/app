/**
 * @fileoverview Composant d'affichage des messages utilisateur
 * 
 * Ce composant fournit l'interface d'affichage pour les messages envoyés
 * par l'utilisateur dans l'interface de chat protégée.
 * 
 * @component UserMessage
 * @description Bulle de message utilisateur avec style aligné à droite
 * 
 * Fonctionnalités :
 * - Alignement à droite pour différencier des messages bot
 * - Style de bulle avec coins arrondis personnalisés
 * - Gestion responsive de la largeur maximale
 * - Rupture de mots pour les longs messages
 * - Thème cohérent avec l'interface globale
 * 
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Contenu du message à afficher
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

import type * as React from "react";

/**
 * Composant de message utilisateur
 * Affiche les messages de l'utilisateur avec un style de bulle alignée à droite
 * 
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Contenu du message
 * @returns {JSX.Element} Bulle de message utilisateur stylisée
 */
export function UserMessage({ children }: { children?: React.ReactNode }) {
	return (
		<div className="flex justify-end">
			<div className="max-w-xs break-all rounded-tl-xl rounded-tr-xl rounded-br-none rounded-bl-xl bg-white px-4 py-2 text-gray-800 shadow lg:max-w-md">
				{children}
			</div>
		</div>
	);
}
