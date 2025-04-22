"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

// Interface pour les messages
interface ChatMessage {
	id: number;
	sender: "user" | "bot";
	text: string;
	avatar?: string; // Avatar optionnel pour le bot
	senderName?: string; // Nom de l'expéditeur optionnel pour le bot
	isTyping?: boolean; // Nouveau champ pour gérer l'effet de frappe
	hasAudio?: boolean; // Nouveau champ pour indiquer si le message contient un audio
}

export const ChatPreview: React.FC = () => {
	const [message, setMessage] = useState("");
	// Initialiser SANS message pour afficher l'accueil
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	// État pour savoir si la conversation a commencé
	const [chatStarted, setChatStarted] = useState(false);
	const [displayedText, setDisplayedText] = useState<{ [key: number]: string }>(
		{},
	);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const progressRef = useRef<HTMLInputElement | null>(null);
	const mediaSourceRef = useRef<MediaSource | null>(null);
	const sourceBufferRef = useRef<SourceBuffer | null>(null);

	const botAvatar = "src/assets/logoneiji11.png"; // Chemin vers l'avatar du bot
	const ppBot = "src/assets/NeijiHeadLogo.png";

	// Défilement auto
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		if (chatStarted) {
			scrollToBottom();
		}
	}, [chatStarted, scrollToBottom]);

	// Fonction pour simuler l'effet de frappe
	const typeMessage = (messageId: number, fullText: string) => {
		let currentText = "";
		const interval = setInterval(() => {
			if (currentText.length < fullText.length) {
				currentText = fullText.substring(0, currentText.length + 1);
				setDisplayedText((prev) => ({ ...prev, [messageId]: currentText }));
			} else {
				clearInterval(interval);
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === messageId ? { ...msg, isTyping: false } : msg,
					),
				);
			}
		}, 50); // Vitesse de frappe plus lente
	};

	// Gérer l'envoi de message
	const handleSendMessage = () => {
		if (message.trim() === "") return;

		const userMessage: ChatMessage = {
			id: Date.now(),
			sender: "user",
			text: message,
			isTyping: false,
		};

		const newMessages: ChatMessage[] = [...messages, userMessage];

		if (!chatStarted) {
			setChatStarted(true);
		}

		setMessages(newMessages);
		setMessage("");

		// Appel à l'API de méditation
		generateMeditation(message);
	};

	// Nouvelle fonction pour générer la méditation
	const generateMeditation = async (prompt: string) => {
		try {
			// Initialiser le MediaSource si nécessaire
			if (!audioRef.current) {
				initializeMediaSource();
			}

			// Envoyer la requête à l'API
			const response = await fetch(
				"https://api.neiji.zenenv.cloud/api/meditation/generate",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						prompt: prompt,
						duration: 5, // Durée par défaut de 5 minutes
					}),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to generate meditation");
			}

			if (!response.body) {
				throw new Error("No response body");
			}

			// Simuler la réponse du bot avec l'audio
			const botResponse: ChatMessage = {
				id: Date.now() + 1,
				sender: "bot",
				text: "Voici votre méditation personnalisée. Vous pouvez l'écouter ou la télécharger.",
				avatar: ppBot,
				senderName: "Neiji",
				isTyping: true,
				hasAudio: true,
			};
			setMessages((prev) => [...prev, botResponse]);
			typeMessage(botResponse.id, botResponse.text);

			// Gérer le stream audio
			const reader = response.body.getReader();
			let isStreaming = true;

			while (isStreaming) {
				const { done, value } = await reader.read();

				if (done) {
					isStreaming = false;
					break;
				}

				if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
					sourceBufferRef.current.appendBuffer(value);
				}
			}

			console.log("Streaming finished successfuly");
		} catch (error) {
			console.error("Error generating meditation:", error);
			// Ajouter un message d'erreur dans le chat
			const errorMessage: ChatMessage = {
				id: Date.now() + 1,
				sender: "bot",
				text: "Désolé, une erreur est survenue lors de la génération de votre méditation.",
				avatar: ppBot,
				senderName: "Neiji",
				isTyping: false,
			};
			setMessages((prev) => [...prev, errorMessage]);
		}
	};

	// Fonction pour initialiser le MediaSource
	const initializeMediaSource = () => {
		if (!audioRef.current) {
			audioRef.current = new Audio();
		}

		if (!mediaSourceRef.current) {
			mediaSourceRef.current = new MediaSource();
			audioRef.current.src = URL.createObjectURL(mediaSourceRef.current);
		}

		mediaSourceRef.current.addEventListener("sourceopen", () => {
			if (!sourceBufferRef.current) {
				sourceBufferRef.current =
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					mediaSourceRef.current!.addSourceBuffer("audio/mpeg");
				sourceBufferRef.current.addEventListener("updateend", () => {
					if (
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						!sourceBufferRef.current!.updating &&
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						mediaSourceRef.current!.readyState === "open"
					) {
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						mediaSourceRef.current!.endOfStream();
					}
				});
			}
		});
	};

	// Fonction pour streamer l'audio depuis l'API
	const streamAudio = async () => {
		try {
			const response = await fetch("YOUR_API_ENDPOINT", {
				method: "GET",
				headers: {
					Accept: "audio/mpeg",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch audio stream");
			}

			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			const reader = response.body!.getReader();
			let isStreaming = true;

			while (isStreaming) {
				const { done, value } = await reader.read();

				if (done) {
					isStreaming = false;
					break;
				}

				if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
					sourceBufferRef.current.appendBuffer(value);
				}
			}
		} catch (error) {
			console.error("Error streaming audio:", error);
		}
	};

	const handlePlayAudio = async () => {
		if (!audioRef.current) {
			initializeMediaSource();
		}

		if (isPlaying && audioRef.current) {
			audioRef.current.pause();
		} else if (audioRef.current) {
			if (mediaSourceRef.current?.readyState === "ended") {
				// Réinitialiser le MediaSource si nécessaire
				initializeMediaSource();
			}
			await streamAudio();
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};

	// Mise à jour des gestionnaires d'événements audio
	useEffect(() => {
		if (audioRef.current) {
			audioRef.current.onended = () => setIsPlaying(false);
			audioRef.current.ontimeupdate = () => {
				if (audioRef.current) {
					setCurrentTime(audioRef.current.currentTime);
					setDuration(audioRef.current.duration);
				}
			};
		}

		return () => {
			if (mediaSourceRef.current) {
				mediaSourceRef.current.endOfStream();
			}
		};
	}, []);

	const handleTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newTime = Number.parseFloat(e.target.value);
		setCurrentTime(newTime);
		if (audioRef.current) {
			audioRef.current.currentTime = newTime;
		}
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	const handleDownloadAudio = async () => {
		try {
			const response = await fetch("YOUR_API_ENDPOINT");
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "meditation.mp3";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error downloading audio:", error);
		}
	};

	// Gérer l'envoi avec Entrée
	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSendMessage();
		}
	};

	return (
		<div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-orange-100 to-orange-200 p-4">
			{/* --- En-tête (commun aux deux vues) --- */}
			<div
				className={`mb-4 flex items-center ${chatStarted ? "-ml-4 sticky top-0 z-10 w-full bg-gradient-to-br from-white via-orange-100 to-orange-100 px-4 pt-4 pb-2" : "absolute top-4 left-4 z-10"}`}
			>
				<button
					type="button"
					className="mr-4 text-orange-600 hover:text-orange-800"
				>
					{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>
				{chatStarted && (
					<>
						<img
							src={botAvatar}
							alt="Logo"
							className="mr-2 h-10 w-10 rounded-full object-contain"
						/>
						<h1 className="font-semibold text-gray-800 text-xl">Neiji</h1>
					</>
				)}
			</div>

			{/* --- Contenu Principal (Conditionnel) --- */}
			<div className="flex w-full flex-grow flex-col items-center overflow-hidden">
				{!chatStarted ? (
					/* --- Vue Accueil (avant le premier message) --- */
					<div className="mt-16 flex w-full flex-grow flex-col items-center justify-center px-4">
						{" "}
						{/* Ajout de marge top pour compenser header absolu */}
						{/* Image mascotte */}
						<div className="mb-6 h-40 w-40">
							<img
								src={botAvatar}
								alt="Neiji Mascotte"
								className="h-full w-full rounded-full object-contain"
							/>
						</div>
						{/* Texte de présentation */}
						<div className="mb-8 max-w-sm text-center">
							<p className="font-medium text-gray-800 text-lg">
								Neiji est une IA spécialisée en meditation, conçue pour offrir
								des programmes personnalisé et accessible à tous
							</p>
						</div>
						{/* Bouton de connexion */}
						<button
							type="button"
							className="mb-5 flex items-center gap-2 rounded-full bg-orange-500 px-8 py-3 font-semibold text-lg text-white shadow-md transition-colors hover:bg-orange-600"
						>
							Connecter ou créer toi un compte
							{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
						{/* Section "J'ai des pensées négatives" */}
						<button
							type="button"
							className="mb-10 flex items-center gap-2 rounded-full bg-orange-200 px-6 py-2 font-medium text-orange-800 shadow-sm transition-colors hover:bg-orange-300"
						>
							J'ai besoin de méditer
							{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 text-orange-600"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 6a1 1 0 100 2 1 1 0 000-2z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>
				) : (
					/* --- Vue Chat (après le premier message) --- */
					<div className="mb-4 w-full max-w-2xl flex-grow space-y-4 overflow-y-auto overflow-x-hidden px-2 py-4">
						{messages.map((msg) => (
							<div
								key={msg.id}
								className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"} fade-in`}
								style={{ animationDelay: `${msg.id % 1000}ms` }}
							>
								{/* Avatar et Nom pour le bot */}
								{msg.sender === "bot" && msg.avatar && (
									<img
										src={msg.avatar}
										alt={msg.senderName || "Bot"}
										className="mb-1 h-8 w-8 flex-shrink-0 rounded-full"
									/>
								)}
								<div
									className={`flex flex-col ${msg.sender === "user" ? "relative items-end" : "items-start"}`}
								>
									{/* Nom de l'expéditeur pour le bot */}
									{msg.sender === "bot" && msg.senderName && (
										<span className="mb-0.5 ml-1 text-gray-600 text-xs">
											{msg.senderName}
										</span>
									)}
									{/* Bulle de message */}
									<div
										className={`max-w-xs rounded-lg px-4 py-2 shadow lg:max-w-md ${msg.sender === "user" ? "relative rounded-br-none bg-white text-gray-800" : "rounded-bl-none bg-orange-500 text-white"}`}
									>
										{msg.sender === "bot" && msg.isTyping ? (
											<span className="typing-text">
												{displayedText[msg.id] || ""}
											</span>
										) : (
											msg.text
										)}
										{/* Icône utilisateur à côté de la bulle utilisateur */}
										{msg.sender === "user" && (
											<div className="-right-10 absolute top-0 rounded-full bg-orange-500 p-1.5">
												{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-5 w-5 text-white"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fillRule="evenodd"
														d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
										)}
									</div>
									{msg.hasAudio && (
										<div className="mt-2 flex w-full flex-col gap-2">
											<div className="flex items-center gap-2">
												<button
													type="button"
													onClick={handlePlayAudio}
													className="flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-white transition-colors hover:bg-orange-700"
												>
													{isPlaying ? (
														<>
															{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-4 w-4"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
																	clipRule="evenodd"
																/>
															</svg>
															Pause
														</>
													) : (
														<>
															{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-4 w-4"
																viewBox="0 0 20 20"
																fill="currentColor"
															>
																<path
																	fillRule="evenodd"
																	d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
																	clipRule="evenodd"
																/>
															</svg>
															Écouter
														</>
													)}
												</button>
												<button
													type="button"
													onClick={handleDownloadAudio}
													className="flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1 text-white transition-colors hover:bg-orange-700"
												>
													{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-4 w-4"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fillRule="evenodd"
															d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
															clipRule="evenodd"
														/>
													</svg>
													Télécharger
												</button>
											</div>
											<div className="flex w-full items-center gap-2">
												<span className="text-gray-600 text-xs">
													{formatTime(currentTime)}
												</span>
												<input
													type="range"
													min="0"
													max={duration}
													value={currentTime}
													onChange={handleTimeUpdate}
													className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-orange-200"
													ref={progressRef}
												/>
												<span className="text-gray-600 text-xs">
													{formatTime(duration)}
												</span>
											</div>
										</div>
									)}
								</div>
							</div>
						))}
						{/* Élément pour le scroll */}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* --- Champ de message (commun aux deux vues, style ajusté pour chat) --- */}
			<div
				className={`sticky bottom-0 w-full max-w-xl self-center p-4 ${chatStarted ? "bg-gradient-to-t from-orange-200 via-orange-100 to-transparent" : "bg-transparent"}`}
			>
				<div className="relative">
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Message"
						className="w-full rounded-full bg-white px-6 py-3 text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
					/>
					<button
						type="button"
						onClick={handleSendMessage}
						className="-translate-y-1/2 absolute top-1/2 right-2 transform rounded-full bg-orange-500 p-2 text-white transition-colors hover:bg-orange-600"
					>
						{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							{/* Icône Avion/Envoyer */}
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
};
