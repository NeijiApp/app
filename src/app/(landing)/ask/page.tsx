"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

// Interface pour les messages
interface ChatMessage {
	id: number;
	sender: "user" | "bot";
	text: string;
	avatar?: string;
	senderName?: string;
	isTyping?: boolean;
	hasAudio?: boolean;
	audioUrl?: string;
}

// Interface pour le lecteur audio
interface AudioPlayerProps {
	audioUrl: string;
	onClose: () => void;
}

// Interface pour le popup d'email
// Plus nécessaire car intégré à l'input

export default function ChatPreview() {
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const [chatStarted, setChatStarted] = useState(false);
	const [displayedText, setDisplayedText] = useState<{ [key: number]: string }>(
		{},
	);
	const [currentAudioUrl, setCurrentAudioUrl] = useState<string>("");
	const [userMessageCount, setUserMessageCount] = useState(0);
	const [showEmailPopup, setShowEmailPopup] = useState(false);
	const [email, setEmail] = useState("");
	const [emailError, setEmailError] = useState(""); // Ajouté pour les erreurs d'email

	const botAvatar = "/logo-neiji-full.png";
	const ppBot = "/logo.png";

	// Défilement auto
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		if (chatStarted) {
			scrollToBottom();
		}
	}, [scrollToBottom, chatStarted]);

	const mapToOpenAI = (history: ChatMessage[]) =>
		history.map(({ sender, text }) => ({
			role: sender === "user" ? "user" : "assistant",
			content: text,
		}));

	// Fonction pour simuler l'effet de frappe
	const typeMessage = (messageId: number, fullText: string) => {
		let currentText = "";
		setDisplayedText((prev) => ({ ...prev, [messageId]: "" }));

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
		}, 50);
	};

	// Function to handle the transition to chat mode
	const handleStartChat = () => {
		if (chatStarted) return;

		setChatStarted(true);

		setTimeout(() => {
			const welcomeMessage: ChatMessage = {
				id: Date.now(),
				sender: "bot",
				text: "Hey, I'm Neiji, how can I help you today?",
				avatar: ppBot,
				senderName: "Neiji",
				isTyping: true,
			};
			setMessages([welcomeMessage]);
			typeMessage(welcomeMessage.id, welcomeMessage.text);
		}, 300);
	};

	// Check if we should prompt for email
	const checkForEmailPrompt = (newMessages: ChatMessage[]) => {
		if (userMessageCount % 3 === 0 && userMessageCount > 0 && !showEmailPopup) {
			setShowEmailPopup(true);
		}
	};

	const { mutateAsync } = api.chat.chat.useMutation();
	const { mutateAsync: saveEmail, error } = api.newsletter.create.useMutation();

	// Handle email submission
	const handleEmailSubmit = async (email: string) => {
		try {
			await saveEmail({ email });

			setShowEmailPopup(false);
			setEmailError("");
			setMessage("");
		} catch (error) {
			console.error("Error saving email to Supabase:", error);
			setEmailError("Could not save email. Please try again.");
		}
	};

	// Gérer l'envoi de message
	const handleSendMessage = async () => {
		if (message.trim() === "") return;

		if (showEmailPopup) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(message.trim())) {
				setEmailError("Please enter a valid email address"); // Définir l'erreur
				return;
			}
			setEmailError(""); // Effacer l'erreur si valide
			handleEmailSubmit(message.trim());
			return;
		}

		const userMessage: ChatMessage = {
			id: Date.now(),
			sender: "user",
			text: message,
			isTyping: false,
		};

		const newMessages: ChatMessage[] = [...messages, userMessage];
		setMessages(newMessages);
		setMessage("");
		setUserMessageCount((prev) => prev + 1);

		// placeholder bubble
		const botId = Date.now() + 1;

		try {
			const data = await mutateAsync(mapToOpenAI([...newMessages]));

			let message = "";

			for await (const token of data) {
				message += token;
			}

			setMessages((prev) => {
				return [
					...prev,
					{
						id: botId,
						sender: "bot",
						text: message,
						avatar: ppBot,
						senderName: "Neiji",
					},
				];
			});

			checkForEmailPrompt(newMessages);
		} catch (err) {
			console.error(err);
			setMessages((prev) =>
				prev.map((m) =>
					m.id === botId ? { ...m, text: "Oops, something went wrong." } : m,
				),
			);
		}
	};

	const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			handleSendMessage();
		}
	};

	const handleAudioButtonClick = () => {
		const audioUrl = "/1.1.5.2.mp3"; 
		setCurrentAudioUrl(audioUrl);

		const audioMessage: ChatMessage = {
			id: Date.now(),
			sender: "bot",
			text: "Here's a guided meditation to help you relax:",
			hasAudio: true,
			audioUrl: audioUrl,
			avatar: ppBot,
			senderName: "Neiji",
		};
		setMessages((prev) => [...prev, audioMessage]);
	};

	return (
		<div className="relative flex min-h-screen flex-col bg-gradient-to-br from-white via-orange-100 to-orange-200 p-4">
			{/* --- En-tête (commun aux deux vues) --- */}


			{/* --- Contenu Principal (Conditionnel) --- */}
			<div className="flex w-full flex-grow flex-col items-center overflow-hidden">
				{!chatStarted ? (
					/* --- Vue Accueil (avant le premier message) --- */
					<div className="mt-16 flex w-full flex-grow flex-col items-center justify-center px-4 transition-opacity duration-300 ease-in-out">
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
								Neiji is your AI coach for self development, it can also
								generate tailored mindfulness.
							</p>
						</div>
					</div>
				) : (
					/* --- Vue Chat (après le premier message) --- */
					<div className="mb-4 w-full max-w-2xl flex-grow animate-fade-in space-y-4 overflow-y-auto overflow-x-hidden px-2 py-4">
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
									{/* Bulle de message ou lecteur audio */}
									{msg.hasAudio ? (
										<div className="flex flex-col gap-2">
											<div className="max-w-xs rounded-lg rounded-bl-none bg-orange-500 px-4 py-2 text-white shadow lg:max-w-md">
												{msg.text}
											</div>
											<div className="flex items-center gap-2 rounded-lg rounded-bl-none bg-orange-100 p-2">
												{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
												<audio controls className="w-64">
													<source src={msg.audioUrl} type="audio/mpeg" />
													Your browser does not support the audio element.
												</audio>
											</div>
										</div>
									) : (
										<div
											className={`max-w-xs rounded-lg px-4 py-2 shadow lg:max-w-md ${msg.sender === "user" ? "relative rounded-br-none bg-white text-gray-800" : "rounded-bl-none bg-orange-500 text-white"}`}
										>
											{msg.sender === "bot" && msg.isTyping ? (
												<span className="typing-text">
													{displayedText[msg.id] || "..."}
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
									)}
								</div>
							</div>
						))}
						{/* Élément pour le scroll */}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* --- Champ de message --- */}
			<div
				className={`sticky bottom-0 w-full max-w-xl self-center p-4 transition-all duration-300 ease-in-out ${showEmailPopup ? "rounded-t-2xl bg-orange-200 pb-6" : ""}`}
			>
				{showEmailPopup && (
					<div className="mb-2 px-4 text-center">
						<h3 className="font-semibold text-gray-800 text-lg">
							What is your email?
						</h3>
						{emailError && (
							<p className="mt-1 text-red-600 text-sm">{emailError}</p>
						)}
					</div>
				)}
				<div className="relative flex items-center gap-2">
					{!showEmailPopup && (
						<button
							type="button"
							onClick={handleAudioButtonClick}
							className="rounded-full bg-orange-500 p-3 text-white transition-colors hover:bg-orange-600"
						>
							{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M6.3 3.75c-.9-.52-2 .12-2 1.15v10.2c0 1.03 1.1 1.67 2 1.15l9.38-5.1c.88-.5.88-1.8 0-2.3L6.3 3.75z"
									fillRule="evenodd"
								/>
							</svg>
						</button>
					)}
					<input
						type={showEmailPopup ? "email" : "text"}
						value={message}
						onChange={(e) => {
							setMessage(e.target.value);
							if (showEmailPopup) setEmailError(""); // Effacer l'erreur en tapant
						}}
						onClick={!chatStarted ? handleStartChat : undefined}
						onKeyPress={handleKeyPress}
						placeholder={
							showEmailPopup
								? "Email"
								: chatStarted
									? "Message"
									: "Click here to start chatting with Neiji"
						}
						className={`flex-1 cursor-pointer rounded-full bg-white px-6 py-3 text-lg shadow-lg transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${showEmailPopup ? "bg-white" : ""}`}
					/>
					<button
						type="button"
						onClick={chatStarted ? handleSendMessage : handleStartChat}
						className="-translate-y-1/2 absolute top-1/2 right-2 transform rounded-full bg-orange-500 p-2 text-white transition-colors hover:bg-orange-600"
					>
						{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6 translate-x-[1px] rotate-90 transform"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
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

			{/* Optional: Add CSS for animations */}
			<style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-in-out forwards;
                    opacity: 0;
                }
            `}</style>
		</div>
	);
}
