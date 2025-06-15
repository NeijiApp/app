/**
 * @fileoverview Composant d'affichage des messages du bot avec support Markdown
 *
 * Ce composant gère l'affichage des messages provenant du bot IA, incluant
 * le rendu Markdown, les annotations spéciales, et les interactions utilisateur.
 *
 * @component BotMessage
 * @description Affichage formaté des messages bot avec Markdown et annotations
 *
 * Fonctionnalités :
 * - Rendu Markdown avec support de la syntaxe GitHub (GFM)
 * - Coloration syntaxique du code avec rehype-highlight
 * - Gestion des annotations spéciales (email, etc.)
 * - Avatar du bot et interface utilisateur cohérente
 * - Intégration avec le système de drawer pour les interactions
 * - Validation des données avec Zod
 *
 * Composants internes :
 * - AnnotationInput : Gestion des annotations d'entrée email
 * - CustomComponents : Composants personnalisés pour le rendu Markdown
 *
 * @requires ai - Types pour les messages UI et valeurs JSON
 * @requires next/image - Optimisation d'images pour l'avatar bot
 * @requires react-markdown - Rendu Markdown des messages
 * @requires rehype-highlight - Coloration syntaxique
 * @requires remark-gfm - Support GitHub Flavored Markdown
 * @requires zod - Validation de schémas
 *
 * @author Neiji Team
 * @version 1.0.0
 * @since 2025
 */

import type * as React from "react";

import type { JSONValue, UIMessage } from "ai";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import { Input } from "~/components/ui/input";
import { useDrawer } from "./drawer-context";

import type { ComponentProps, ElementType } from "react";
import type { ExtraProps } from "react-markdown";
import type {
	EmailInputAnnotation,
	PossibleAnnotation,
} from "~/app/api/chat/route";
import { cn } from "~/lib/utils";

/**
 * Composant de gestion des annotations d'entrée email
 * Ouvre automatiquement le drawer lors de la détection d'une annotation email
 * 
 * @param {Object} props - Props du composant
 * @param {EmailInputAnnotation} props.annotation - Annotation email détectée
 * @returns {null} Composant sans rendu visuel
 */
function AnnotationInput({ annotation }: { annotation: EmailInputAnnotation }) {
	// Get drawer context to open the drawer when email annotation is detected
	const { openDrawer } = useDrawer();

	// Open drawer when this component mounts (when email annotation is detected)
	useEffect(() => {
		openDrawer();
	}, [openDrawer]);
	return null;
}

/**
 * Composant de gestion d'une annotation unique
 * Route vers le bon composant selon le type d'annotation
 * 
 * @param {Object} props - Props du composant
 * @param {PossibleAnnotation} props.annotation - Annotation à traiter
 * @returns {JSX.Element | null} Composant d'annotation ou null
 */
function Annotation({ annotation }: { annotation: PossibleAnnotation }) {
	if (annotation.type === "email")
		return <AnnotationInput annotation={annotation} />;

	return null;
}

function Annotations({
	annotations,
}: { annotations: UIMessage["annotations"] }) {
	if (!annotations) return null;

	if (annotations.length === 0) return null;

	return (
		<div className="flex flex-col gap-1">
			{(annotations as PossibleAnnotation[]).map((annotation, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<Annotation key={i} annotation={annotation} />
			))}
		</div>
	);
}

export function BotMessage({ message }: { message: UIMessage }) {
	const [displayedText, setDisplayedText] = useState("");

	useEffect(() => {
		if (message.content.trim().length === 0) return;

		let currentIndex = 0;
		const text = message.content;
		let cancelled = false;

		function showNextChar() {
			if (cancelled) return;
			if (currentIndex < text.length - 1) {
				setDisplayedText((prev) => prev + text[currentIndex]);
				currentIndex++;
				setTimeout(showNextChar, 15); // Adjust speed here (ms per letter)
			}
		}

		showNextChar();

		return () => {
			cancelled = true;
		};
	}, [message.content]);

	if (message.content.trim().length === 0) return null;

	return (
		<div className="relative pt-10">
			<div className="absolute top-1 flex items-center gap-1">
				<Image
					src="/NeijiHeadLogo1.4.png"
					alt="Neiji Logo Head"
					height={50}
					width={50}
				/>
				<span className="text-sm">Neiji</span>
			</div>
			<div className="w-fit max-w-xs whitespace-pre-line break-normal rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-none bg-orange-500 px-4 py-2 text-white shadow lg:max-w-md">
				<ReactMarkdown
					remarkPlugins={[remarkGfm]}
					rehypePlugins={[rehypeHighlight]}
					components={{
						// Override default element styling
						p: ({ children }) => <p className="my-1">{children}</p>,
						a: ({ href, children }) => (
							<a
								href={href}
								className="text-blue-200 underline hover:text-blue-300"
								target="_blank"
								rel="noopener noreferrer"
							>
								{children}
							</a>
						),
						code: ({
							className,
							children,
							...props
						}: ComponentProps<"code"> & ExtraProps) => (
							<code
								className={cn(
									"block overflow-x-auto rounded-md bg-gray-800 p-2",
									className,
								)}
								{...props}
							>
								{children}
							</code>
						),
					}}
				>
					{displayedText}
				</ReactMarkdown>
			</div>
			<div className="max-w-xs pt-4 lg:max-w-md">
				<Annotations annotations={message.annotations} />
			</div>
		</div>
	);
}
