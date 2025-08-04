"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "~/utils/supabase/client";

import { BotMessage } from "../../chat/_components/bot-message";
import { ChatInput } from "../../chat/_components/chat-input";
import { UserMessage } from "../../chat/_components/user-message";

// Composant simple pour l'input d'auth
function AuthInput({
	onSend,
	disabled,
	placeholder,
	isPassword = false,
}: {
	onSend: (input: string) => void;
	disabled: boolean;
	placeholder: string;
	isPassword?: boolean;
}) {
	const [input, setInput] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (input.trim() && !disabled) {
			onSend(input.trim());
			setInput("");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex w-full gap-2">
			<input
				type={isPassword ? "password" : "text"}
				value={input}
				onChange={(e) => setInput(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				className="flex-1 rounded-lg border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
			/>
			<button
				type="submit"
				disabled={disabled || !input.trim()}
				className="rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Envoyer
			</button>
		</form>
	);
}

interface AuthChatProps {
	authStep: "welcome" | "email" | "password" | "signup";
	setAuthStep: (step: "welcome" | "email" | "password" | "signup") => void;
	authData: {
		email: string;
		password: string;
		isExistingUser: boolean;
	};
	setAuthData: React.Dispatch<
		React.SetStateAction<{
			email: string;
			password: string;
			isExistingUser: boolean;
		}>
	>;
	authMessages: Array<{
		id: string;
		role: "user" | "assistant";
		content: string;
	}>;
	setAuthMessages: React.Dispatch<
		React.SetStateAction<
			Array<{
				id: string;
				role: "user" | "assistant";
				content: string;
			}>
		>
	>;
}

export function AuthChat({
	authStep,
	setAuthStep,
	authData,
	setAuthData,
	authMessages,
	setAuthMessages,
}: AuthChatProps) {
	const router = useRouter();
	const supabase = createClient();
	const [isLoading, setIsLoading] = useState(false);

	// Debug: Log pour vérifier que le composant se charge
	useEffect(() => {
		console.log("AuthChat rendered with:", {
			authStep,
			authMessages: authMessages.length,
		});
	}, [authStep, authMessages]);

	const addMessage = (role: "user" | "assistant", content: string) => {
		const newMessage = {
			id: `auth-${authMessages.length}-${role}-${Date.now()}`,
			role,
			content,
		};
		console.log("Adding message:", newMessage);
		setAuthMessages((prev) => [...prev, newMessage]);
		return newMessage;
	};
	const handleUserInput = async (input: string) => {
		// Ajouter le message utilisateur (masquer le mot de passe dans le chat)
		const displayText =
			authStep === "password" || authStep === "signup"
				? "•".repeat(input.length)
				: input;
		addMessage("user", displayText);
		setIsLoading(true);

		try {
			if (authStep === "welcome") {
				// L'utilisateur répond à la question de connexion
				if (
					input.toLowerCase().includes("oui") ||
					input.toLowerCase().includes("connect") ||
					input.toLowerCase().includes("connexion")
				) {
					addMessage("assistant", "Perfect! What is your email address?");
					setAuthStep("email");
				} else {
					addMessage(
						"assistant",
						'No problem! You can use the chat as a guest. If you change your mind, type "signin" at any time.',
					);
				}
			} else if (authStep === "email") {
				// Vérifier si l'email est valide
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(input)) {
					addMessage(
						"assistant",
						"Hmm, this email doesn't seem valid. Can you retype it? (example: name@example.com)",
					);
					return;
				}

				setAuthData((prev) => ({ ...prev, email: input }));

				// Vérifier si l'utilisateur existe
				const { data: existingUser } = await supabase
					.from("users_table")
					.select("email")
					.eq("email", input)
					.single();

				if (existingUser) {
					// Utilisateur existant
					setAuthData((prev) => ({ ...prev, isExistingUser: true }));
					addMessage(
						"assistant",
						`Hello! I recognize you. What is your password?`,
					);
					setAuthStep("password");
				} else {
					// Nouvel utilisateur
					setAuthData((prev) => ({ ...prev, isExistingUser: false }));
					addMessage(
						"assistant",
						`I don't know you yet! Let's create your account. Choose a secure password (at least 8 characters with letters and numbers).`,
					);
					setAuthStep("signup");
				}
			} else if (authStep === "password") {
				// Connexion
				const { error } = await supabase.auth.signInWithPassword({
					email: authData.email,
					password: input,
				});

				if (error) {
					addMessage(
						"assistant",
						"Oops! This password doesn't match. Can you try again?",
					);
				} else {
					addMessage(
						"assistant",
						"Perfect! Login successful. Welcome to your personal space! 🎉",
					);
					setTimeout(() => {
						router.push("/protected/chat");
					}, 2000);
				}
			} else if (authStep === "signup") {
				// Validation du mot de passe
				if (input.length < 8) {
					addMessage(
						"assistant",
						"This password is too short. It must contain at least 8 characters. Try again!",
					);
					return;
				}
				if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(input)) {
					addMessage(
						"assistant",
						"Your password must contain both letters and numbers for better security. Try again!",
					);
					return;
				}

				// Créer le compte
				const { error } = await supabase.auth.signUp({
					email: authData.email,
					password: input,
				});

				if (error) {
					addMessage(
						"assistant",
						`Désolé, il y a eu un problème : ${error.message}. Pouvez-vous réessayer ?`,
					);
				} else {
					addMessage(
						"assistant",
						"Excellent! Your account has been created. Welcome to the Neiji community! 🌟",
					);
					setTimeout(() => {
						router.push("/protected/chat");
					}, 2000);
				}
			}
		} catch (error) {
			addMessage(
				"assistant",
									"Oops! There was a small technical problem. Can you try again?",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			{/* Messages d'authentification */}
			{authMessages.map((message, index) => {
				if (message.role === "user") {
					return <UserMessage key={message.id}>{message.content}</UserMessage>;
				}

				return <BotMessage key={message.id} message={message} />;
			})}

			{isLoading && (
				<div className="fade-in animate-in duration-300">
					<BotMessage
						message={{
							id: "loading",
							role: "assistant",
							content: "Thinking...",
						}}
					/>
				</div>
			)}

			{/* Input d'authentification - utilise le même style que ChatInput mais avec logique custom */}
			<div className="fixed right-0 bottom-0 left-0 bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto max-w-2xl p-4">
					<AuthInput
						onSend={handleUserInput}
						disabled={isLoading}
						isPassword={authStep === "password" || authStep === "signup"}
						placeholder={
							authStep === "welcome"
								? "Type 'yes' to sign in..."
								: authStep === "email"
									? "Your email address..."
									: authStep === "password"
										? "Your password..."
										: authStep === "signup"
											? "Choose a password..."
											: "Type your message..."
						}
					/>
				</div>
			</div>
		</>
	);
}
