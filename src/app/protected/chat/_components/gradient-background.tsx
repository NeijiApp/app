/**
 * @fileoverview Composant de fond dégradé pour l'interface de chat
 * 
 * Ce composant fournit un fond dégradé fixe et esthétique pour l'interface
 * de chat protégée, créant une expérience visuelle agréable et moderne.
 * 
 * @component GradientBackground
 * @description Fond dégradé fixe avec conteneur de contenu superposé
 * 
 * Fonctionnalités :
 * - Fond dégradé fixe couvrant toute la page
 * - Dégradé du blanc vers l'orange (cohérent avec la marque Neiji)
 * - Conteneur de contenu avec z-index approprié
 * - Gestion des props HTML standard pour div
 * - Classes CSS personnalisables via className
 * 
 * @param {React.ComponentProps<"div">} props - Props standard de div
 * @param {string} props.className - Classes CSS additionnelles
 * 
 * @requires ~/lib/utils - Utilitaire cn pour la combinaison de classes
 * 
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

import type * as React from "react";
import { cn } from "~/lib/utils";

/**
 * Composant de fond dégradé avec conteneur de contenu
 * 
 * @param {React.ComponentProps<"div">} props - Props du composant div
 * @returns {JSX.Element} Structure avec fond dégradé fixe et conteneur de contenu
 */
export function GradientBackground({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<>
			{/* Fixed background that covers the entire page */}
			<div className="-z-10 fixed inset-0 h-full w-full bg-gradient-to-br from-white via-orange-100 to-orange-200" />

			{/* Content container */}
			<div className={cn("relative z-0 min-h-screen flex flex-col p-4", className)} {...props} />
		</>
	);
}
